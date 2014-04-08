var mongoose    = require('mongoose'),
    blockchain  = require('./blockchain'),
    Deferred    = require('promised-io').Deferred;
    when        = require('promised-io').when;

blockchain.getAddressBalance('1gSmEzj1FsZ46vJz2XBWRzY9dJa6S7a1X');

//Comnect to database
mongoose.connect('mongodb://localhost/bitcoinbombs');

var db = mongoose.connection;

module.exports = {

    UserModel: null,

    initialize: function () {
        var self = this;

        console.log('dabatase initialize');

        db.on('error', console.error.bind(console, 'connection error:'));
        db.once('open', function callback () {
            console.log('connection open');
            self.defineUserSchema();
        });
    },

    defineUserSchema: function () {
        var userSchema = new mongoose.Schema({
                unique: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true
                },
                btcAddress: {
                    type: String
                }
            });

        this.UserModel = mongoose.model('User', userSchema);

        this.createNewUser();
    },

    createNewUser: function () {
        var newUser = new this.UserModel(),
            dfd = new Deferred();

        newUser.unique = new mongoose.Types.ObjectId();

        //creating new wallet address
        //for a new user 
        when(blockchain.getNewAddress()).
        then(function (newAddress) {
            newUser.btcAddress = newAddress;

            dfd.resolve(newUser);
        });

        return dfd.promise;
    }
};