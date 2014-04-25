var db    = require('../db'),
    utils = require('../utils'),
    when  = require('promised-io').when,
    title = 'Bitcoin Kamikaze';

exports.newUser = function(req, res){
    var urlPath;

    utils.createGamePath();

    when(db.createNewUser()).
    then(function (params) {
        urlPath = utils.createUrlPath({
            userId: params.user.userId,
            pass: params.password
        });

        res.render('index', {
            title: title,
            data: JSON.stringify({ url: urlPath }),
            address: params.user.btcAddress
        });
    });
};

exports.oldUser = function (req, res) {
    when(db.getUser(req.params['user'], req.params['pass'])).
    then(function (response) {
        if (response) {
            res.render('index', {
                title: title,
                data: null,
                address: response.btcAddress
            });
        }
        else {
            res.render('404');
        }
    });
};