/* Author: YOUR NAME HERE
*/

$(document).ready(function() {

    var socket = io.connect(),
        data = $('.content').data('user');

    if (data) {
        window.history.pushState('bla', 'bla', location.href + data.url);
    }

    $('#sender').bind('click', function() {
        socket.emit('message', 'Message Sent on ' + new Date());
    });

    socket.on('server_message', function(data){
        $('#receiver').append('<li>' + data + '</li>');
    });
});