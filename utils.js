var passGen = require('password-generator'),
    _       = require('underscore');

module.exports = {
    generatePassword: function () {
        return passGen(24, false);
    },

    createUrlPath: function (params) {
        return 'http://' + params.hostname + '/user/' + params.userId + '/' + params.pass;
    },

    createGamePath: function () {
        var steps = 9,
            path = [];

        for (var i = 1; i <= steps; i++) {
            path.push(Math.floor((Math.random()*5)+1));
        }

        return path;
    },

    getUserDataFromUrl: function (url) {
        var split = _.last(url.split('/'), 2);

        return {
            userId: _.first(split),
            password: _.last(split)
        };
    }
};