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
    },

    createGamePath: function () {
        var steps = 9,
            path = [];

        for (var i = 1; i <= steps; i++) {
            path.push(Math.floor((Math.random()*5)+1));
        }

        return path;
    }
};