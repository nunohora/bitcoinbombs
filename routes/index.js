var db    = require('../db'),
    utils = require('../utils'),
    when  = require('promised-io').when;

exports.newUser = function(req, res){
    var urlPath;

    utils.createGamePath();

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
                btcAddress:
            },
            address: params.user.btcAddress
        });
    });
};

exports.oldUser = function (req, res) {
    when(db.getUser(req.params['user'], req.params['pass'])).
    then(function (response) {
        if (response) {
            res.render('index', {
                data: {
                    url: null,
                    btcAddress: response.btcAddress
                }
            });
        }
        else {
            res.render('404');
        }
    });
};