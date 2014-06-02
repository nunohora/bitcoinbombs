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

    noop: function () {},

    bindEvents: function (iosocket) {
        _.bindAll(this, 'onConnection', 'onDisconnect');

        iosocket.sockets.on('connection', this.onConnection);
        iosocket.sockets.on('disconnect', this.onDisconnect);
    },

    onConnection: function (socket) {
        var self = this;

        console.log('Client Connected');

        socket.on('newGame', function (data) {
            when(db.authAndCall(data, 'createNewGame'), function (response) {
                socket.emit('newGameResponse', response);
            }, self.noop);
        });

        socket.on('steppedOn', function (data) {
            when(db.authAndCall(data, 'checkStep'), function (response) {
                socket.emit('steppedOnResponse', response);
            }, self.noop);
        });

        socket.on('refreshBalance', function (data) {
            when(db.authAndCall(data, 'checkUserBalance'), function (response) {
                socket.emit('refreshBalanceResponse', response);
            }, self.noop);
        });

        socket.on('onDepositModalClick', function (data) {
            when(db.authAndCall(data, 'getUserBtcAddress'), function (response) {
                socket.emit('onDepositModalClickResponse', response);
            }, self.noop);
        });

        socket.on('takeReward', function (data) {
            when(db.authAndCall(data, 'giveUserReward'), function (response) {
                socket.emit('onTakeRewardClickResponse', response);
            }, self.noop);
        });

        socket.on('withdrawBalance', function (data) {
            when(db.authAndCall(data, 'withdrawBalance'), function (response) {
                socket.emit('onwithdrawBalanceResponse', response);
            }, self.noop);
        });
    },

    onDisconnect: function () {
        console.log('Client Disconnected.');
    }
};