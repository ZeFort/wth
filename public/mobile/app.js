var colors = [0x1abc9c, 0x27ae60, 0x2980b9, 0x8e44ad, 0x2c3e50, 0xf39c12, 0xc0392b, 0xbdc3c7, 0x7f8c8d];

var socket = io.connect(window.ip + ':3010');

setInterval(function() {
    var status = socket.connected;
    if (status) {
        $('.status').addClass('connected');
        $('.status').removeClass('pending');
        $('.status').removeClass('disconnected');
    } else {
        $('.status').removeClass('connected');
        $('.status').removeClass('pending');
        $('.status').addClass('disconnected');
    }
}, 1000);

socket.on('connectedUsers', function(msg) {
    var users = msg.users;
});

socket.on('refresh', function(msg) {
    socket.disconnect();
    document.location.reload();
});

socket.emit('connectedUsers', {});

var id = '';
var color = '';
var balls = [];
var username = '';

socket.on('playerLose', function(msg) {
    if (msg.user == username)
        showResultBoard('You lose :(', 'Score: ' + msg.score + ' pts');
});

socket.on('playerWin', function(msg) {
    if (msg.user == username)
        showResultBoard('You win :like:', 'Score: ' + msg.score + ' pts');
});




$(function() {
    username = '';

    $('.ready-btn').click(function(e) {
        e.preventDefault();
        socket.emit('readyToPlay', {
            id: id,
            username: username
        });
        $('.button').addClass('disabled');
    });

    $('.accept').click(function(e) {
        e.preventDefault();
        username = $('#username').val();
        if (!username || /^\s*$/.test(username)) {
            $('#username').addClass('wrong');
            return;
        }
        if (!socket.connected) {
            alert('Sockets is not connected.');
            return;
        }
        socket.on('usernameList', function(msg) {
            console.log(msg);
            if (msg.list.indexOf(username) > -1) {
                $('#username').addClass('wrong');
                return;
            }
            username = username.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            $('.login').remove();
            if (!localStorage[username]) {
                console.log('New user');
                id = '' + Math.floor(Math.random() * 254);
                color = colors[Math.floor(Math.random() * colors.length)];
                localStorage[username] = JSON.stringify({
                    id: id,
                    color: color
                });
            } else {
                console.log('Use existing user');
                id = JSON.parse(localStorage[username]).id;
                color = JSON.parse(localStorage[username]).color;
            }
            console.log(id);
            $("body").css({
                "background": "#" + color.toString(16)
            });
            $("html").css({
                "background": "rgba(0,0,0,0)"
            });

            socket.emit('updateMessage', {
                id: id,
                x: 1,
                y: 0,
                z: 1,
                color: color,
                username: username
            });

            window.addEventListener("devicemotion", handleMotionEvent, true);

            function handleMotionEvent(event) {
                var x = event.accelerationIncludingGravity.x;
                var y = event.accelerationIncludingGravity.y;
                var z = (event.accelerationIncludingGravity.z);
                if (Math.abs(x) > 10) x = 10 * Math.sign(x);
                if (Math.abs(y) > 5) y = 5 * Math.sign(y);
                //if (Math.abs(z) > 5) z = 5 * Math.sign(z);
                if (x) $('.x').html('x: ' + x.toFixed(0));
                if (y) $('.y').html('y: ' + y.toFixed(0));
                if (z) $('.z').html('z: ' + z.toFixed(0));
                if (id != "")
                    sendXYZ(x, y, z);
                else {
                    color = Math.floor(Math.random() * 0xffffff);
                    socket.emit('updateMessage', {
                        id: id,
                        x: 1,
                        y: 0,
                        z: 1,
                        color: color,
                        username: username
                    });
                }
            }


            function sendXYZ(x, y, z) {
                console.log(id);
                socket.emit('updateMessage', {
                    x: x,
                    y: y,
                    z: z,
                    id: id,
                    color: color,
                    username: username
                });
            }

        });
        socket.emit('usernames', {});
    });

    $(window).unload(function() {
        socket.emit('disconnectUser', {
            username: username,
            id: id
        });
        socket.disconnect();
    });
});

function showResultBoard(user, score) {
    $('.winner-name').html(user);
    $('.winner-score').html(score);
    $('.result-board').css({
        display: 'block'
    });
}