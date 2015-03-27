var express = require('express');
var device = require('express-device');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

app.use(express.static(path.join(__dirname, 'public')));
app.use(device.capture());
device.enableDeviceHelpers(app);
//http.listen(3010, '178.62.74.94');
http.listen(3010, 'localhost');

app.get('/', function(req, res) {
    if (!res.locals.is_desktop) res.redirect('/mobile');
    else res.redirect('/desktop');
});

app.get('/mobile', function(req, res) {
    res.sendFile(__dirname + '/views/mobile.html');
});

app.get('/desktop', function(req, res) {
    res.sendFile(__dirname + '/views/desktop.html');
});

io.on('connection', function(socket) {

    var clientIp = socket.request.connection.remoteAddress;
    console.log(clientIp);

    socket.on('initClientMessage', function(msg) {
        io.emit('initClientMessage', msg);
    });
    socket.on('updateMessage', function(msg) {
        io.emit('updateMessage', msg);
    });
});

var server = app.listen(3000, function() {

    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port)

});