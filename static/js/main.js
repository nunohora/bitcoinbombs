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
        socketio  : '../socket.io/socket.io',
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
/* Author: YOUR NAME HERE
*/
// $(document).ready(function() {

//     var socket = io.connect(),
//         data = $('.content').data('user');

//     if (data) {
//         window.history.pushState('bla', 'bla', location.href + data.url);
//     }

//     $('#sender').bind('click', function() {
//         socket.emit('message', 'Message Sent on ' + new Date());
//     });

//     socket.on('server_message', function(data){
//         $('#receiver').append('<li>' + data + '</li>');
//     });
// });