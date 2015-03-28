var express = require('express');
var device = require('express-device');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

app.use(express.static(path.join(__dirname, 'public')));
app.use(device.capture());
device.enableDeviceHelpers(app);

var connectedUsers = [];

http.listen(3010, '10.168.1.29');

app.get('/', function(req, res) {
    if (!res.locals.is_desktop) res.redirect('/mobile');
    else res.redirect('/desktop');
});

app.get('/game', function(req, res){
    res.sendFile(__dirname + '/views/start.html')
});

app.get('/mobile', function(req, res) {
    res.sendFile(__dirname + '/views/mobile.html');
});

app.get('/desktop', function(req, res) {
    res.sendFile(__dirname + '/views/desktop.html');
});

io.on('connection', function(socket) {
    var clientIp = socket.id;
    connectedUsers.push(clientIp);
    console.log('Connected:', clientIp);
    io.emit('connectedUser', {
        ip: clientIp
    });

    socket.on('initClientMessage', function(msg) {
        io.emit('initClientMessage', msg);
    });

    socket.on('connectedUsers', function(msg) {
        io.emit('connectedUsers', {
            users: connectedUsers
        });
    });

    socket.on('updateMessage', function(msg) {
        io.emit('updateMessage', msg);
    });
    
    socket.on('gameStarted', function(msg) {
        io.emit('gameStarted', msg);
    });

    socket.on('readyToPlay', function(msg) {
        io.emit('readyToPlay', msg);
    });

    socket.on('disconnect', function(socket) {
        console.log('Disconnected:', clientIp);
        var i = connectedUsers.indexOf(clientIp);
        if (i > -1) {
            connectedUsers.splice(i, 1);
        }
        io.emit('disconnectedUser', {
            ip: clientIp
        });
        io.emit('connectedUsers', {
            users: connectedUsers
        });
    });
});

var server = app.listen(3000, function() {

    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port)

});