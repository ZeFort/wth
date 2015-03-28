var socket = io.connect(window.ip + ':3010');

setInterval(function() {
    var status = socket.connected;
    if (status) {
        $('.status').addClass('connected');
        $('.status').removeClass('disconnected');
    } else {
        $('.status').removeClass('connected');
        $('.status').addClass('disconnected');
    }
}, 1000);

socket.on('connectedUsers', function(msg) {
    var users = msg.users;
});

socket.emit('connectedUsers', {});

var id = '';
var balls = [];
var username = '';

$(function() {
    id = '' + Math.floor(Math.random() * 254);
    color = Math.floor(Math.random() * 0xffffff);
    username = '';

    $('.ready-btn').click(function() {
        socket.emit('readyToPlay', {
            id: id
        });
        $('.button').addClass('disabled');
    });

    $('.accept').click(function() {
        username = $('#username').val();
        if (!username || /^\s*$/.test(username)) {
            $('#username').addClass('wrong');
            return;
        }
        $('.login').remove();
    });


    $(".color-mobile").css({
        "background": "#" + color.toString(16)
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
        if (x) $('.x').html(x.toFixed(0));
        if (y) $('.y').html(y.toFixed(0));
        if (z) $('.z').html(z.toFixed(0));
        if (id != "")
            sendXYZ(x, y, z);
        else {
            color = Math.floor(Math.random() * 0xffffff);
            balls[id] = addSphere(scene, 1, 0, 1, 0, color);
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