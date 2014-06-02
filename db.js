var mongoose      = require('mongoose'),
    connection    = mongoose.connect('mongodb://localhost/bitcoinbombs'),
    Deferred      = require('promised-io').Deferred,
    when          = require('promised-io').when,
    seq           = require('promised-io').seq,
    utils         = require('./utils'),
    blockchain    = require('./blockchain'),
    UserModel     = require('./models/UserModel'),
    JpWinnerModel = require('./models/JackpotWinnerModel'),
    db            = mongoose.connection;

module.exports = {

    initialize: function () {
        UserModel.initialize(connection);
        JpWinnerModel.initialize();

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
        var betValue = data.betValue;

        if (!user.gameState) {
            if (user.balance >= betValue) {
                user.gameState = true;
                user.currentGame = utils.createGamePath();
                user.currentStep = 0;
                user.betValue = betValue;
                user.balance = (user.balance - betValue).toFixed(8);

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
        var self = this,
            reward;

        if (user.gameState && user.currentStep > 0) {
            reward = utils.calculateReward(user);

            user.balance = (user.balance + reward).toFixed(8);
            self.resetGame(user);

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
            self = this,
            bombStep,
            bombTile;

        if (user.gameState) {
            bombTile = user.currentGame[user.currentStep];
            if (stepped === bombTile) {
                bombStep = user.currentStep;
                when(self.gameOver(user)).
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

        self.resetGame(user);

        user.save(function () {
            dfd.resolve(true);
        });

        return dfd.promise;
    },

    resetGame: function (user) {
        user.gameState = false;
        user.betValue = 0;
        user.currentStep = -1;
        user.steppedOn = [];
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