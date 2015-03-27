    var socket = io.connect('10.168.1.36:3010');

    var id = "";
    var balls = [];

    $(function() {
        id = "" + Math.floor(Math.random() * 254);
        color = Math.floor(Math.random() * 0xffffff);
        socket.emit('chat message', {
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
            var z = event.accelerationIncludingGravity.z;
            if (id != "")
                sendXYZ(x, y, z);
            else {
                color = Math.floor(Math.random() * 0xffffff);
                balls[id] = addSphere(scene, 1, 0, 1, 0, color);
                socket.emit('chat message', {
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
            socket.emit('chat message', {
                x: x,
                y: y,
                z: z,
                id: id,
                color: color
            });
        }
    });