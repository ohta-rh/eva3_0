
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , ejs = require('ejs')
  , http = require('http');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);

var server = http.createServer(app);
var socketIO = require("socket.io");

server.listen(app.get('port'));

var io = socketIO.listen(server);

io.sockets.on("connection", function (socket) {
  socket.on("message", function (data) {
    // 全員に受け取ったメッセージを送る
    io.sockets.emit("message", {value: data.value});
  });
  socket.on("disconnect", function () {
    io.sockets.emit("message", {value:"Connection Lost"});
  });
  socket.on("blackout", function() {
    io.sockets.emit("blackout",{});
  });
  socket.on("alert", function() {
    io.sockets.emit("alert",{});
  });
});
