var BcWallet = require('blockchain-wallet'),
    Deferred = require('promised-io').Deferred,
    when     = require('promised-io').when,
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
        var dfd = new Deferred();

        bc.addressBalance(address, config.bcConf, function (error, response) {
            if (!error) {
                console.log(response);
                dfd.resolve({
                    totalReceived: utils.satoshiToBtc(response.total_received),
                    balance: utils.satoshiToBtc(response.balance)
                });
            }
            else { dfd.resolve(null); }
        });

        return dfd.promise;
    },

    transferToMainAddress: function (address, amount) {
        var self = this,
            dfd = new Deferred(),
            amountSatoshi = utils.btcToSatoshi(amount);

        when(self._makeTransaction(address, config.mainAddress, amountSatoshi)).
        then(function (response) {
            dfd.resolve(response);
        });

        return dfd.promise;
    },

    _makeTransaction: function (from, to, amount) {
        var dfd = new Deferred();

        bc.payment(to, amount, { $from: from }, function (error, response) {
            if (!error) { dfd.resolve(response); }
            else {
                console.log("transfer error: ", error);
                dfd.resolve(null);
            }
        });

        return dfd.promise;
    }
}