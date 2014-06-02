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
                dfd.resolve({
                    totalReceived: utils.satoshiToBtc(response.total_received),
                    balance: utils.satoshiToBtc(response.balance)
                });
            }
            else { dfd.resolve(null); }
        });

        return dfd.promise;
    },

    withdrawUserBalance: function (to, amount) {
        var dfd = new Deferred(),
            satoshis = utils.btcToSatoshi(amount);

        bc.payment(to, satoshis, {}, function (error, response) {
            if (!error) { dfd.resolve(response); }
            else {
                console.log("transfer error: ", error);
                dfd.resolve(null);
            }
        });

        return dfd.promise;
    }
};