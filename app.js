var express = require('express');
var device = require('express-device');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var ip = require('./ip.js')[0] || '127.0.0.1';
var html = require('./html.js');

app.use(express.static(path.join(__dirname, 'public')));
app.use(device.capture());
device.enableDeviceHelpers(app);

var connectedUsers = [];

http.listen(3010, ip);

app.get('/start', function(req, res) {
    if (!res.locals.is_desktop) res.redirect('/mobile');
    else res.redirect('/desktop');
});

app.get('/game', function(req, res) {
    res.sendFile(__dirname + '/views/start.html')
});

app.get('/mobile', function(req, res) {
    html.send(req, res, __dirname + '/views/mobile.html', {
        ip: ip
    });
});

app.get('/', function(req, res) {
    html.send(req, res, __dirname + '/views/index.html', {
        ip: ip
    });
});


app.get('/desktop', function(req, res) {
    if (!res.locals.is_desktop) {
        console.log('no-no-no, its not desktop device that you are using');
        res.redirect('/mobile');
    }
    html.send(req, res, __dirname + '/views/desktop.html', {
        ip: ip
    });
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

    socket.on('playerLose', function(msg) {
        io.emit('playerLose', msg);
    });

    socket.on('playerWin', function(msg) {
        io.emit('playerWin', msg);
    });

    socket.on('connectedUsers', function(msg) {
        io.emit('connectedUsers', {
            users: connectedUsers
        });
    });

    socket.on('updateMessage', function(msg) {
        io.emit('updateMessage', msg);
    });

    socket.on('disconnectUser', function(msg) {
        io.emit('disconnectUser', msg);
    });

    socket.on('gameStarted', function(msg) {
        io.emit('gameStarted', msg);
    });

    socket.on('refresh', function(msg) {
        io.emit('refresh', msg);
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

    console.log('XYZ_Pad app listening at http://%s:%s', host, port)
    console.log('Server IP:', ip);

});