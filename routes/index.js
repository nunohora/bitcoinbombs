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
            data: JSON.stringify({ url: urlPath })
        });
    });
};

exports.oldUser = function (req, res) {
    console.log('old user: ', req.params['user'], req.params['pass']);

    when(db.getUser(req.params['user'], req.params['pass'])).
    then(function (response) {
        console.log('response: ', response);

        if (response) {
            res.render('index', {
                title: "Bitcoin Bombs!",
                data: null
            });
        }
        else {
            res.render('404');
        }
    });
};