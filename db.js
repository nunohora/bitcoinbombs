var mongoose      = require('mongoose'),
    connection    = mongoose.connect('mongodb://localhost/bitcoinbombs'),
    Deferred      = require('promised-io').Deferred,
    when          = require('promised-io').when,
    seq           = require('promised-io').seq,
    utils         = require('./utils'),
    blockchain    = require('./blockchain'),
    UserModel     = require('./models/UserModel'),
    JpWinnerModel = require('./models/JackpotWinnerModel'),
    JpValueModel  = require('./models/JackpotValueModel'),
    db            = mongoose.connection;

module.exports = {
    initialize: function () {
        UserModel.initialize(connection);
        JpWinnerModel.initialize();
        JpValueModel.initialize();

        this.model = UserModel.getUserModel();

        db.on('error', console.error.bind(console, 'connection error:'));
        db.once('open', function () { console.log('connection open'); });
    },

    createNewUser: function () {
        var dfd = new Deferred(),
            pass = utils.generatePassword();

        var newUser = new this.model({
            password: pass
        });

        newUser.save(function () {
            dfd.resolve({ user: newUser, password: pass });
        });

        return dfd.promise;
    },

    authAndCall: function (data, fn) {
        var userData,
            dfd = new Deferred(),
            self = this,
            cb = this[fn],
            response;

        try {
            data = JSON.parse(data);
            userData = utils.getUserDataFromUrl(data.url);

            when(this.authenticateUser(userData.userId, userData.password)).
            then(function (user) {
                if (user) { cb.apply(self, [dfd, user, data]); }
                else { dfd.resolve(false); }
            });
        }
        catch (e) {
            console.log('error: ', e);
            return dfd.resolve(false);
        }

        return dfd.promise;
    },

    getUserBtcAddress: function (dfd, user) {
        if (user.btcAddress) {
            dfd.resolve({ btcAddress: user.btcAddress });
        }
        else {
            when(blockchain.getNewAddress()).
            then(function (address) {
                user.btcAddress = address;
                user.save(function () {
                    dfd.resolve({ btcAddress: address });
                });
            });
        }
    },

    createNewGame: function (dfd, user, data) {
        var betValue = data.betValue,
            hasJackpot;

        if (!user.gameState) {
            if (user.balance >= betValue) {
                user.gameState = true;
                user.currentGame = utils.createGamePath();
                user.currentStep = 0;
                user.betValue = betValue;
                user.balance = (user.balance - betValue).toFixed(8);

                hasJackpot = utils.hasJackpot();

                if (hasJackpot) {
                    user.jackpotTile = utils.createJackpotTile(user.currentGame);
                }

                user.save(function () {
                    dfd.resolve({
                        betValue: betValue,
                        nextStep: 0,
                        balance: user.balance
                    });
                });
            }
            else {
                dfd.resolve( { error: 'notenoughbalance' });
            }
        }
        else { dfd.resolve( { error: 'gamestarted' }); }
    },

    withdrawBalance: function (dfd, user, data) {
        if (data.amount && data.address && user.balance >= +data.amount) {
            when(blockchain.withdrawUserBalance(data.address, +data.amount), function (response) {
                console.log('response:', response);
                if (response && response.message.indexOf('Sent') > 0) {
                    user.balance = user.balance - data.amount;

                    user.save(function () {
                        dfd.resolve({ balance: user.balance });
                    });
                }
            });
        }
        else { dfd.resolve(false); }
    },

    giveUserReward: function (dfd, user) {
        var reward;

        if (user.gameState && user.currentStep > 0) {
            reward = utils.calculateReward(user);

            user.balance = (user.balance + reward).toFixed(8);
            this.resetGame(user);

            user.save(function () {
                dfd.resolve({ balance: user.balance });
            });
        }
        else { dfd.resolve(false); }
    },

    checkUserBalance: function (dfd, user) {
        var freshDeposit;

        if (user.btcAddress) {
            when(blockchain.getAddressBalance(user.btcAddress)).
            then(function (response) {
                freshDeposit = +(response.totalReceived - user.totalDeposited).toFixed(8);

                if (freshDeposit > 0) {
                    user.balance = (user.balance + freshDeposit).toFixed(8);
                    user.totalDeposited = user.totalDeposited + freshDeposit;

                    user.save(function () {
                        dfd.resolve({ balance: user.balance});
                    });
                }
                else {
                    dfd.resolve({ balance: user.balance});
                }
            });
        }
        else {
            dfd.resolve({ balance: 0} );
        }
    },

    checkStep: function (dfd, user, data) {
        var stepped = data.stepped,
            bombStep,
            bombTile;

        if (user.gameState) {
            bombTile = user.currentGame[user.currentStep];
            if (stepped === bombTile) {
                bombStep = user.currentStep;
                when(this.gameOver(user)).
                then(function () {
                    dfd.resolve( {
                        status: 'gameOver',
                        bombTiles: user.currentGame,
                        stepped: stepped,
                        bombStep: bombStep,
                        balance: user.balance
                    });
                });
            }
            else {
                user.steppedOn.push(stepped);
                user.currentStep = user.currentStep + 1;
                user.save(function () {
                    dfd.resolve({
                        status: 'carryOn',
                        bombTile: bombTile,
                        nextStep: user.currentStep,
                        stepped: stepped
                    });
                });
            }
        }
        else { dfd.resolve(false); }
    },

    gameOver: function (user) {
        var dfd = new Deferred(),
            self = this;

        when(this.updateJackpotValue(user.betValue), function () {
            self.resetGame(user);

            user.save(function () {
                dfd.resolve(true);
            });
        });

        return dfd.promise;
    },

    resetGame: function (user) {
        user.gameState = false;
        user.betValue = 0;
        user.currentStep = -1;
        user.steppedOn = [];
    },

    getJackpotValue: function () {
        var jackpotModel = JpValueModel.getModel(),
            dfd = new Deferred();

        jackpotModel.findOne({}, function(err, entry) {
            if (!err) {
                if (entry) {
                    dfd.resolve({ jackpot: entry.accumulatedAmount });
                }
                else {
                    dfd.resolve({ jackpot: 0 });
                }
            }
        });

        return dfd.promise;
    },

    updateJackpotValue: function (betValue) {
        var jackpotModel = JpValueModel.getModel(),
            percentage = (betValue * 0.01),
            jackpotEntry,
            dfd = new Deferred();

        //create an entry if none exists
        jackpotModel.count({}, function (err, count) {
            if (!count) {
                jackpotEntry = new jackpotModel({ accumulatedAmount: 0});
                jackpotEntry.save(function () { dfd.resolve({ jackpot: jackpotEntry.accumulatedAmount }); });
            }
            else {
                jackpotModel.findOne({}, function (err, entry) {
                    entry.accumulatedAmount = (entry.accumulatedAmount + percentage).toFixed(8);
                    entry.save(function() { dfd.resolve({ jackpot: entry.accumulatedAmount }); });
                });
            }
        });

        return dfd.promise;
    },

    authenticateUser: function (userId, password) {
        var dfd = new Deferred();

        this.model.getAuthenticated(userId, password, function (err, user) {
            if (!err) { dfd.resolve(user); }
            else {
                console.log('error: ', err);
                dfd.resolve(false);
            }
        });

        return dfd.promise;
    }
};