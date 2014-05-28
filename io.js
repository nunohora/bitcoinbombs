var io   = require('socket.io'),
    db   = require('./db'),
    when = require('promised-io').when,
    _    = require('underscore');

module.exports = {
    initialize: function (server) {
        //Setup Socket.IO
        var iosocket = io.listen(server);

        this.bindEvents(iosocket);
    },

    bindEvents: function (iosocket) {
        _.bindAll(this, 'onConnection', 'onDisconnect');

        iosocket.sockets.on('connection', this.onConnection);
        iosocket.sockets.on('disconnect', this.onDisconnect);
    },

    onConnection: function (socket) {
        console.log('Client Connected');

        socket.on('newGame', function (data) {
            when(db.createNewGame(data)).
            then(function (response) {
                socket.emit('newGameResponse', response);
            });
        });

        socket.on('steppedOn', function (data) {
            when(db.checkStep(data)).
            then(function (response) {
                socket.emit('steppedOnResponse', response);
            });
        });

        socket.on('refreshBalance', function (data) {
            when(db.authAndCall(data, 'checkUserBalance')).
            then(function (response) {
                socket.emit('refreshBalanceResponse', response);
            });
        });

        socket.on('onDepositModalClick', function (data) {
            when(db.getUserBtcAddress(data)).
            then(function (response) {
                socket.emit('onDepositModalClickResponse', response);
            });
        });

        socket.on('takeReward', function (data) {
            when(db.giveUserReward(data)).
            then(function (response) {
                socket.emit('onTakeRewardClickResponse', response);
            });
        });
    },

    onDisconnect: function () {
        console.log('Client Disconnected.');
    }
};