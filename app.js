var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
app.use(express.static(path.join(__dirname, 'public')));
//http.listen(3010, '178.62.74.94');
http.listen(3010, 'localhost');

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){

    var clientIp = socket.request.connection.remoteAddress;
    console.log(clientIp);

    socket.on('new element', function(msg){
        io.emit('new element',msg);
    });
    socket.on('chat message', function(msg){
        io.emit('chat message', msg);
    });
});

var server = app.listen(3011, function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port)

});