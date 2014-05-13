var passGen = require('password-generator'),
    _       = require('underscore'),
    config  = require('./config');

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

        for (var i = 0; i < steps; i++) {
            path.push(Math.floor(Math.random()*5));
        }

        return path;
    },

    getUserDataFromUrl: function (url) {
        var split = _.last(url.split('/'), 2);

        return {
            userId: _.first(split),
            password: _.last(split)
        };
    },

    getCurrentProgress: function (user) {
        //deep clone of object
        var stepRows = JSON.parse(JSON.stringify(config.stepRows));

        for (var i = 0; i < user.currentStep; i++) {
            if (user.steppedOn[i]) {
                stepRows[i].step = user.steppedOn[i];
            }
            stepRows[i].bomb = user.currentGame[i];
        }

        return stepRows;
    }
};