//setup Dependencies
var connect = require('connect'),
    hbs     = require('hbs'),
    express = require('express'),
    io      = require('socket.io'),
    routes  = require('./routes'),
    db      = require('./db'),
    port    = (process.env.PORT || 8081);

//Connect to Database
db.initialize();

//Setup Express
var server = express.createServer();

server.configure(function(){
    server.set('view engine', 'hbs');
    server.set('view options', {'layout': false});
    server.set('views', __dirname + '/views');
    server.use(connect.bodyParser());
    server.use(express.cookieParser());
    server.use(express.session({ secret: "shhhhhhhhh!"}));
    server.use(connect.static(__dirname + '/static'));
    server.use(server.router);
});

//setup the errors
server.error(function(err, req, res, next){
    if (err instanceof NotFound) {
        res.render('404.jade', { locals: {
                  title : '404 - Not Found',
                  description: '',
                  author: '',
                  analyticssiteid: 'XXXXXXX'
                },status: 404 });
    } else {
        res.render('500.jade', { locals: {
                  title : 'The Server Encountered an Error',
                  description: '',
                  author: '',
                  analyticssiteid: 'XXXXXXX',
                  error: err
                },status: 500 });
    }
});

server.listen(port);

//Setup Socket.IO
var io = io.listen(server);
io.sockets.on('connection', function(socket){
  console.log('Client Connected');
  socket.on('message', function(data){
    socket.broadcast.emit('server_message',data);
    socket.emit('server_message',data);
  });
  socket.on('disconnect', function(){
    console.log('Client Disconnected.');
  });
});


///////////////////////////////////////////
//              Routes                   //
///////////////////////////////////////////

/////// ADD ALL YOUR ROUTES HERE  /////////
server.get('/', routes.index);

//A Route for Creating a 500 Error (Useful to keep around)
server.get('/500', routes.fivehundred);

//The 404 Route (ALWAYS Keep this as the last route)
server.get('/*', routes.fourohfour);

function NotFound(msg){
    this.name = 'NotFound';
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);
}

console.log('Listening on http://0.0.0.0:' + port );