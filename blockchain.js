var BcWallet = require('blockchain-wallet'),
    Deferred = require('promised-io').Deferred,
    config   = require('./config');

bc = new BcWallet(config.bcGuid, config.bcPass);

module.exports = {
    getNewAddress: function () {
        var dfd = new Deferred();

        bc.newAddress({}, function (error, response) {
            if (!error) {
                dfd.resolve(response.address);
            }
            else {
                dfd.resolve(null);
            }
        });

        return dfd.promise;
    },

    getAddressBalance: function (address) {
        var dfd = new Deferred();

        bc.addressBalance(address, config.bcConf, function (error, response) {
            if (!error) {
                return dfd.resolve(response.balance);
            }
            else {
                return dfd.resolve(null);
            }
        });

        return dfd.promise;
    }
};