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
        console.log('dabatase initialize');

        UserModel.initialize(connection);

        db.on('error', console.error.bind(console, 'connection error:'));
        db.once('open', function () { console.log('connection open'); });
    },

    createNewUser: function () {
        var dfd = new Deferred(),
            pass = utils.generatePassword(),
            model = UserModel.getUserModel(),
            newUser;

        newUser = new model({
            password: pass
        });

        //creating new wallet newAddress
        //for a new user
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
        var dfd = new Deferred(),
            model = UserModel.getUserModel();

        if (userId && password) {
            model.getAuthenticated(userId, password, function (err, user) {
                if (!err) dfd.resolve(user);
                else dfd.resolve(false);
            });
        }
        else {
            return dfd.promise(false);
        }

        return dfd.promise;
    }
};