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
            stepRows[i].step = user.steppedOn[i];
            stepRows[i].bomb = user.currentGame[i];
        }

        return stepRows;
    },

    calculateReward: function (user) {
        var rewardValue;

        if (user.betValue > 0) {
            rewardValue = config.stepRows[user.currentStep - 1].rewardValue;

            return rewardValue * user.betValue;
        }

        return 0;
    },

    hasJackpot: function () {
        return true;
        // return Math.floor((Math.random() * config.jackpotChance) + 1) === 0;
    },

    createJackpotTile: function (gamePath) {
        var randomStep = Math.floor((Math.random() * 9)),
            bombTile = gamePath[randomStep],
            jackpotTile = bombTile;

        //get a random tile that isnt the bomb tile
        while (jackpotTile == bombTile) {
            jackpotTile = Math.floor(Math.random() * 5);
        }

        return [0, jackpotTile];
    },

    satoshiToBtc: function (satoshi) {
        return satoshi / 100000000;
    },

    btcToSatoshi: function (btc) {
        return Math.round(btc * 100000000);
    }
};