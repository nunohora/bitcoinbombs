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

        newUser.save();

        console.log(pass);

        //creating new wallet address
        //for a new user
        when(blockchain.getNewAddress()).
        then(function (newAddress) {
            newUser.btcAddress = newAddress;
            newUser.save();

            console.log(newUser);
            dfd.resolve({
                user: newUser,
                password: pass
            });
        });

        return dfd.promise;
    },

    getUser: function (userId, password) {
        console.log('user: ', userId);
        console.log('password: ', password);
    }
};