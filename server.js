//setup Dependencies
var connect = require('connect'),
    hbs     = require('hbs'),
    express = require('express'),
    io      = require('./io'),
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

//Handlebars Configuration
hbs.registerPartials(__dirname + '/views/partials');

hbs.registerHelper('toJSON', function (object) {
    return JSON.stringify(object);
});

hbs.registerHelper('ifCond', function(v1, v2, options) {
  if(v1 === v2) {
    return options.fn(this);
  }
  return options.inverse(this);
});

hbs.registerHelper('times', function(n, options) {
    var accum = '';
    for(var i = 0; i < n; ++i)
        accum += options.fn(i);
    return accum;
});

//setup the errors
server.error(function(err, req, res, next){
    if (err instanceof NotFound) {
      console.log('not found');
      routes.notfound;
    } else {
      console.log(err);
      console.log('server error');
      routes.servererror;
    }
});

server.listen(port);

//Setup Socket.IO
io.initialize(server);

///////////////////////////////////////////
//              Routes                   //
///////////////////////////////////////////

/////// ADD ALL YOUR ROUTES HERE  /////////
server.get('/', routes.newUser);
server.get('/user/:user/:pass', routes.oldUser);

//A Route for Creating a 500 Error (Useful to keep around)
server.get('/500', routes.servererror);

//The 404 Route (ALWAYS Keep this as the last route)
server.get('/*', routes.notfound);

function NotFound(msg){
    this.name = 'NotFound';
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);
}

console.log('Listening on http://0.0.0.0:' + port );