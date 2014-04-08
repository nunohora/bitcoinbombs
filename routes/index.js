var db   = require('../db'),
    when = require('promised-io').when;

/*
 * GET home page.
 */
exports.index = function(req, res){

    when(db.createNewUser()).
    then(function (user) {
        res.render('index', {
            title: "Bitcoin Bombs!" ,
            address: user.btcAddress
        });
    });
};