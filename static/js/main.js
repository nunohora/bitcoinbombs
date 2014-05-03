requirejs.config({
    shim: {
        'socketio': {
            exports: 'io'
        },
        'backbone': {
            deps: ['underscore'],
            exports: 'Backbone'
        }
    },
    paths: {
        underscore: '/js/underscore.min',
        backbone  : '/js/backbone.min',
        domReady  : '/js/domReady.min',
        jquery    : '/js/jquery.min',
        socketio  : '/socket.io/socket.io',
        mainView  : '/js/mainView',
    }
});

requirejs(['domReady', 'socketio', 'mainView'], function (domReady, io, mainView) {
    var socket = io.connect();

    domReady(function () {
        view = new mainView({
            socket: socket
        });
    });
});