var socket = io.connect('10.168.0.115:3010');

socket.on('connectedUsers', function(msg) {
    var users = msg.users;
    $('.ids').empty();
    for (var i = users.length - 1; i >= 0; i--) {
        $('.ids').append(users[i]);
        $('.ids').append('<br/>');
    }
});

socket.emit('connectedUsers', {});

var id = "";
var balls = [];


$(function() {
    id = "" + Math.floor(Math.random() * 254);
    color = Math.floor(Math.random() * 0xffffff);

    $(".color-mobile").css({
        "background": "#"+color.toString(16)
    });

    socket.emit('updateMessage', {
        id: id,
        x: 1,
        y: 0,
        z: 1,
        color: color
    });
    window.addEventListener("devicemotion", handleMotionEvent, true);

    function handleMotionEvent(event) {
        var x = event.accelerationIncludingGravity.x;
        var y = event.accelerationIncludingGravity.y;
        var z = (event.accelerationIncludingGravity.z);
        if (Math.abs(x) > 5) x = 5 * Math.sign(x);
        if (Math.abs(y) > 5) y = 5 * Math.sign(y);
        //if (Math.abs(z) > 5) z = 5 * Math.sign(z);
        $('.rotation').empty();
        $('.rotation').append(JSON.stringify({
            x: x,
            y: y,
            z: z
        }));
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
                color: color
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
            color: color
        });
    }
});