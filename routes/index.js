var db    = require('../db'),
    utils = require('../utils'),
    when  = require('promised-io').when;

exports.newUser = function(req, res){
    var urlPath;

    when(db.createNewUser()).
    then(function (params) {
        urlPath = utils.createUrlPath({
            userId: params.user.userId,
            pass: params.password
        });

        res.render('index', {
            title: "Bitcoin Bombs!",
            data: JSON.stringify({ url: urlPath }),
            address: params.user.btcAddress
        });
    });
};

exports.oldUser = function (req, res) {
    when(db.getUser(req.params['user'], req.params['pass'])).
    then(function (response) {
        console.log('response: ', response);

        if (response) {
            res.render('index', {
                title: "Bitcoin Bombs!",
                data: null,
                address: response.btcAddress
            });
        }
        else {
            res.render('404');
        }
    });
};