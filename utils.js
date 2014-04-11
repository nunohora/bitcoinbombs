var passGen = require('password-generator'),
    _       = require('underscore');

module.exports = {
    generatePassword: function () {
        return passGen(24, false);
    },

    createUrlPath: function (params) {
        var path = '';

        _.each(params, function (param) {
            path = path + param + '/';
        }, this);

        return path;
    }
};