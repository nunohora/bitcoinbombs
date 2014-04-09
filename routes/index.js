var db   = require('../db'),
    when = require('promised-io').when;

/*
 * GET home page.
 */
exports.newUser = function(req, res){
    when(db.createNewUser()).
    then(function (params) {
        res.render('index', {
            title: "Bitcoin Bombs!" ,
            address: params.user.btcAddress
        });
    });
};

exports.oldUser = function (req, res) {
    when(db.getUser(req.params['user'], req.params['pass'])).
    then(function (response) {
        if (response) {

        }
        else {

        }
    });
};