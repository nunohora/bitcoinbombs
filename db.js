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

        when(blockchain.getNewAddress()).
        then(function (newAddress) {
            newUser.btcAddress = newAddress;
            newUser.save(function () {
                dfd.resolve({ user: newUser, password: pass, address: newAddress });
            });
        });

        return dfd.promise;
    },

    getUser: function (userId, password) {
        var dfd = new Deferred();

        when(this.authenticateUser(userId, password)).
        then(function (user) {
            if (user) { dfd.resolve(user); }
            else { dfd.resolve(false); }
        });

        return dfd.promise;
    },

    createNewGame: function (data) {
        var dfd = new Deferred(),
            betValue = data.betValue,
            userData = utils.getUserDataFromUrl(data.url),
            userId = userData.userId,
            password = userData.password;

        when(this.authenticateUser(userId, password)).
        then(function (user) {
            if (user) {
                if (!user.gameState) {
                    user.gameState = 1;
                    user.currentGame = utils.createGamePath();
                    user.currentStep = 0;
                    user.betValue = betValue;

                    user.save(function () {
                        dfd.resolve({ betValue: betValue, nextStep: 1 });
                    });
                }
                else { dfd.resolve( { error: 'gamestarted' }); }
            }
            else { dfd.resolve(false); }
        });

        return dfd.promise;
    },

    checkStep: function (data) {
        var dfd = new Deferred(),
            stepped = data.stepped,
            userData = utils.getUserDataFromUrl(data.url),
            userId = userData.userId,
            password = userData.password;

        when(this.authenticateUser(userId, password)).
        then(function (user) {
            if (user) {
                
            }
            else { dfd.resolve(false); }
        });

        return dfd.promise;
    },

    authenticateUser: function (userId, password) {
        dfd = new Deferred();

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