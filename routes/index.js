var db     = require('../db'),
    utils  = require('../utils'),
    config = require('../config'),
    when   = require('promised-io').when,
    all    = require('promised-io').all;

exports.newUser = function(req, res){
    var urlPath,
        user,
        jackpot;

    all(db.createNewUser(),
        db.getJackpotValue(),
        db.getLatestJackpotWinners(),
        db.getBiggestJackpotWinners()
        ).
    then(function (params) {
        user = params[0];
        jackpot = params[1];

        urlPath = utils.createUrlPath({
            userId: user.user.userId,
            pass: user.password,
            hostname: req.headers.host
        });

        res.render('index', {
            data: {
                url: urlPath,
                gameState: false,
                balance: 0
            },
            privateData: {
                currentStep: -1,
                takeRewardIndex: -1,
                betValue: 0,
                currentProgress: config.stepRows,
                stepTiles: config.stepTiles,
                jackpot: jackpot.jackpot
            }
        });
    });
};

exports.oldUser = function (req, res) {
    var urlPath,
        currentProgress,
        user,
        jackpot;

    all(db.authenticateUser(req.params['user'], req.params['pass']),
        db.getJackpotValue()
        ).
    then(function (params) {
        user = params[0];
        jackpot = params[1];

        if (user) {
            urlPath = utils.createUrlPath({
                userId: req.params['user'],
                pass: req.params['pass'],
                hostname: req.headers.host
            });

            currentProgress = user.gameState ? utils.getCurrentProgress(user) : config.stepRows;

            res.render('index', {
                data: {
                    url: urlPath,
                    gameState: user.gameState,
                    balance: user.balance
                },
                privateData: {
                    jackpot: jackpot.jackpot,
                    currentStep: user.gameState ? user.currentStep : -1,
                    takeRewardIndex: user.currentStep - 1,
                    betValue: user.betValue,
                    currentProgress: currentProgress,
                    stepTiles: config.stepTiles
                }
            });
        }
        else {
            res.render('404');
        }
    });
};