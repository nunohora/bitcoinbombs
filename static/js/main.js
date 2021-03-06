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
        templates : '/templates',
        underscore: '/js/underscore.min',
        backbone  : '/js/backbone.min',
        domReady  : '/js/domReady.min',
        jquery    : '/js/jquery.min',
        text      : '/js/text.min',
        modal     : '/js/jquery.simplemodal.min',
        socketio  : '/socket.io/socket.io',
        mainView  : '/js/mainView'
    }
});

requirejs(['domReady', 'socketio', 'mainView'], function (domReady, io, mainView) {
    'use strict';

    var socket = io.connect(),
        View;

    domReady(function () {
        View = new mainView({
            socket: socket
        });
    });
});