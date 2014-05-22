var mongoose      = require('mongoose'),
    connection    = mongoose.connect('mongodb://localhost/bitcoinbombs'),
    Deferred      = require('promised-io').Deferred,
    when          = require('promised-io').when,
    utils         = require('./utils'),
    blockchain    = require('./blockchain'),
    UserModel     = require('./models/UserModel'),
    db            = mongoose.connection;

module.exports = {

    initialize: function () {
        UserModel.initialize(connection);

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

    getUserBtcAddress: function (data) {
        var dfd = new Deferred(),
            userData = utils.getUserDataFromUrl(data.url);

        when(this.authenticateUser(userData.userId, userData.password)).
        then(function (user) {
            if (user) {
                if (user.btcAddress) {
                    dfd.resolve({ btcAddress: user.btcAddress });
                }
                else {
                    when(blockchain.getNewAddress()).
                    then(function (address) {
                        console.log('address: ', address);
                        console.log('user: ', user);
                        user.btcAddress = address;
                        user.save(function () {
                            dfd.resolve({ btcAddress: address });
                        });
                    });
                }
            }
            else { dfd.resolve(false); }
        });

        return dfd.promise;
    },

    getUser: function (userId, password) {
        var dfd = new Deferred();

        when(this.authenticateUser(userId, password)).
        then(function (user) {
            if (user) {
                when(blockchain.getAddressBalance(user.btcAddress)).
                then(function (balance) {
                    user.balance = balance;
                    user.save(function () {
                        dfd.resolve(user);
                    });
                });
            }
            else { dfd.resolve(false); }
        });

        return dfd.promise;
    },

    createNewGame: function (data) {
        var dfd = new Deferred(),
            betValue = data.betValue,
            userData = utils.getUserDataFromUrl(data.url);

        when(this.authenticateUser(userData.userId, userData.password)).
        then(function (user) {
            if (user) {
                if (!user.gameState && user.balance >= betValue) {
                    user.gameState = true;
                    user.currentGame = utils.createGamePath();
                    user.currentStep = 0;
                    user.betValue = betValue;
                    user.balance = user.balance - betValue;

                    user.save(function () {
                        dfd.resolve({ betValue: betValue, nextStep: 0, balance: user.balance });
                    });
                }
                else { dfd.resolve( { error: 'gamestarted' }); }
            }
            else { dfd.resolve(false); }
        });

        return dfd.promise;
    },

    checkUserBalance: function (data) {
        var dfd = new Deferred(),
            userData = utils.getUserDataFromUrl(data.url);

            when(this.authenticateUser(userData.userId, userData.password)).
            then(function (user) {
                if (user) {
                    when(blockchain.getAddressBalance(user.btcAddress)).
                    then(function (balance) {
                        user.balance = balance;
                        user.save(function () {
                            dfd.resolve({ balance: balance});
                        });
                    });
                }
                else { dfd.resolve(false); }
            });

        return dfd.promise;
    },

    checkStep: function (data) {
        var dfd = new Deferred(),
            stepped = data.stepped,
            userData = utils.getUserDataFromUrl(data.url),
            self = this,
            bombStep,
            bombTile;

        when(this.authenticateUser(userData.userId, userData.password)).
        then(function (user) {
            if (user && user.gameState) {
                bombTile = user.currentGame[user.currentStep];
                if (stepped === bombTile) {
                    bombStep = user.currentStep;
                    when(self.gameOver(user)).
                    then(function () {
                        dfd.resolve( { status: 'gameOver', bombTiles: user.currentGame, stepped: stepped, bombStep: bombStep } );
                    });
                }
                else {
                    user.steppedOn.push(stepped);
                    user.currentStep = user.currentStep + 1;
                    user.save(function () {
                        dfd.resolve( { status: 'carryOn',  bombTile: bombTile, nextStep: user.currentStep, stepped: stepped } );
                    });
                }

            }
            else { dfd.resolve(false); }
        });

        return dfd.promise;
    },

    gameOver: function (user) {
        var dfd = new Deferred();

        when(blockchain.transferLostBet(user.btcAddress, user.betValue)).
        then(function (response) {
            user.gameState = false;
            user.betValue = 0;
            user.currentStep = -1;
            user.steppedOn = [];

            user.save(function () {
                dfd.resolve(true);
            });
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