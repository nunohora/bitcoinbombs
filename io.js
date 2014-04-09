var io = require('socket.io'),
    _  = require('underscore');

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

        socket.on('message', function (data) {
            socket.broadcast.emit('server_message',data);
            socket.emit('server_message',data);
        });
    },

    onDisconnect: function () {
        console.log('Client Disconnected.');
    }
};