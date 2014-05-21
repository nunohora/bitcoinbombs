var db     = require('../db'),
    utils  = require('../utils'),
    config = require('../config'),
    when   = require('promised-io').when;

exports.newUser = function(req, res){
    var urlPath;

    when(db.createNewUser()).
    then(function (params) {
        urlPath = utils.createUrlPath({
            userId: params.user.userId,
            pass: params.password,
            hostname: req.headers.host
        });

        res.render('index', {
            data: {
                url: urlPath,
                gameState: false,
                btcAddress: params.user.btcAddress
            },
            privateData: {
                currentStep: -1,
                takeRewardIndex: -1,
                betValue: 0,
                balance: 0,
                currentProgress: config.stepRows,
                stepTiles: config.stepTiles
            }
        });
    });
};

exports.oldUser = function (req, res) {
    var urlPath,
        currentProgress;

    when(db.getUser(req.params['user'], req.params['pass'])).
    then(function (user) {
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
                    btcAddress: user.btcAddress
                },
                privateData: {
                    currentStep: user.gameState ? user.currentStep : -1,
                    takeRewardIndex: user.currentStep - 1,
                    betValue: user.betValue,
                    currentProgress: currentProgress,
                    stepTiles: config.stepTiles,
                    balance: user.balance
                }
            });
        }
        else {
            res.render('404');
        }
    });
};