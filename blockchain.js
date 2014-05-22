var BcWallet = require('blockchain-wallet'),
    Deferred = require('promised-io').Deferred,
    utils    = require('./utils'),
    config   = require('./config');

bc = new BcWallet(config.bcGuid, config.bcPass);

module.exports = {
    getNewAddress: function () {
        var dfd = new Deferred();

        bc.newAddress({}, function (error, response) {
            if (!error) { dfd.resolve(response.address); }
            else { dfd.resolve(null); }
        });

        return dfd.promise;
    },

    getAddressBalance: function (address) {
        var dfd = new Deferred(),
            amount;

        bc.addressBalance(address, config.bcConf, function (error, response) {
            if (!error) {
                amount = utils.satoshiToBtc(response.balance);
                dfd.resolve(amount);
            }
            else { dfd.resolve(null); }
        });

        return dfd.promise;
    },

    transferLostBet: function (address, amount) {
        var dfd = new Deferred(),
            mainAddress = config.mainAddress,
            amount = utils.btcToSatoshi(amount);

        bc.payment(mainAddress, amount, { $from: address }, function (error, response) {
            if (!error) { dfd.resolve(response); }
            else {
                console.log("transfer error: ", error);
                dfd.resolve(null);
            }
        });

        return dfd.promise;
    }
}