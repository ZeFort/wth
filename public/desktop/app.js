var socket = io.connect(window.ip + ':3010');
setInterval(function() {
    var status = socket.connected;
    if (status) {
        $('.status').addClass('connected');
        $('.status').removeClass('disconnected');
        $('.status').removeClass('pending');
    } else {
        $('.status').removeClass('connected');
        $('.status').addClass('disconnected');
        $('.status').removeClass('pending');
    }
}, 1000);

socket.on('refresh', function(msg) {
    socket.disconnect();
    document.location.reload();
});

socket.on('disconnectUser', function(msg) {
    console.log('disconnected', msg);
    if (balls[msg.id]) {
        readyPlayerCount++;
        balls[msg.id].active = false;
        balls[msg.id].ready = false;
        $('.item[user="' + msg.username + '"]').remove();
    }
});

var balls = [];
var readyPlayerCount = 0;
var needToStart = 2;
var activePlayers = needToStart;
var gameStarted = false;

var scene, camera, renderer, backgroundScene, backgroundCamera;
var R = 4;

$(function() {
    $('.elapsed-players').html(needToStart + '');
    $('.refresh').click(function() {
        socket.emit('refresh', {});
        socket.disconnect();
        document.location.reload();
    });
    var addPlane = function(scene, w, h, t, x, y, z, col) {
        var planeGeometry = new THREE.BoxGeometry(w, h, t, 10);
        var planeMaterial = new THREE.MeshLambertMaterial({
            color: col || 0xffffff
        });
        var plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.receiveShadow = true;
        plane.position.x = x;
        plane.position.y = y;
        plane.position.z = z;
        scene.add(plane);
        return plane;
    }

    var addSphere = function(scene, r, x, y, z, color) {
        var planeGeometry = new THREE.SphereGeometry(r, 100, 100);
        var planeMaterial = new THREE.MeshLambertMaterial({
            color: color
        });
        var plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.receiveShadow = true;
        plane.position.x = x;
        plane.position.y = y;
        plane.position.z = z;
        scene.add(plane);
        return plane;
    }

    init();
    //initBg();
    animate();

    function init() {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMapEnabled = true;

        generateTiles(200);

        // position and point the camera to the center of the scene
        updateCameraPosition(camera, 40);
        camera.lookAt(scene.position);
        // add subtle ambient lighting
        var ambientLight = new THREE.AmbientLight(0x0c0c0c);
        scene.add(ambientLight);
        // add spotlight for the shadows
        var spotLight = new THREE.SpotLight(0xffffff, 2);
        spotLight.position.set(-40, 10000, -10);
        spotLight.castShadow = true;
        scene.add(spotLight);
        // add the output of the renderer to the html element
        $("body").append(renderer.domElement);
    }

    function initBg() {
        var texture = THREE.ImageUtils.loadTexture('../bg.jpg');
        var backgroundMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 2, 0),
            new THREE.MeshBasicMaterial({
                map: texture
            }));

        backgroundMesh.material.depthTest = false;
        backgroundMesh.material.depthWrite = false;

        // Create your background scene
        backgroundScene = new THREE.Scene();
        backgroundCamera = new THREE.Camera();
        backgroundScene.add(backgroundCamera);
        backgroundScene.add(backgroundMesh);

    }

    function animate() {
        // render using requestAnimationFrame
        //x.position.x += 0.1;
        requestAnimationFrame(animate);
        render();
    }

    var framesCount = 0;

    function render() {
        var longestX = getFirstPlayerPosition();

        //handleCollisions();
        handleCrossingTheLine();
        handleInvisiblePlayers();
        updateCameraPosition(camera, longestX + 40);

        if (framesCount++ >= 15) {
            framesCount = 0;
            generateTiles();
        }

        //renderer.render(backgroundScene , backgroundCamera );
        renderer.render(scene, camera);


        if (activePlayers <= 1) {
            gameStarted = false;

            for (var key in balls) {
                if (balls.hasOwnProperty(key) && balls[key].active) {
                    showResultBoard(balls[key].user + ' wins!', 'Score: ' + Math.abs(balls[key].position.x - 1).toFixed(0) + ' pts');
                    socket.emit('playerWin', {
                        user: balls[key].user,
                        score: Math.abs(balls[key].position.x - 1).toFixed(0)
                    });
                }
            }
        }
    }

    function getFirstPlayerPosition() {
        var longestX = 0; //we are moving to -inf by X axis
        for (var key in balls) {
            if (balls.hasOwnProperty(key)) {
                if (balls[key].position.x < longestX && balls[key].position.y >= 0)
                    longestX = balls[key].position.x;
            }
        }

        return longestX;
    }

    function handleCollisions() {
        for (var key in balls) {
            if (balls.hasOwnProperty(key)) {
                for (var key2 in balls) {
                    if (balls.hasOwnProperty(key2) && key !== key2) {
                        var s1 = balls[key];
                        var s2 = balls[key2];

                        if (getPythogarExpression(s1.position.x, s2.position.x, s1.position.z, s2.position.z)) {
                            swapSpeeds(s1, s2);
                        }
                    }
                }
            }
        }
    }

    function getPythogarExpression(x1, x2, y1, y2) {
        return Math.Pow(x1 - x2, 2) + Math.Pow(y1 - y2, 2) <= 4 * R * R;
    }

    function swapSpeeds(sph1, sph2) {
        //write swap speeds logic here
    }

    function handleInvisiblePlayers() {
        var longest = getFirstPlayerPosition() + 30 + R;
        for (var key in balls) {
            if (balls.hasOwnProperty(key)) {
                if (balls[key].position.x > longest) {
                    if (balls[key].active) {
                        activePlayers--;
                        $('.item[user="' + balls[key].user + '"]').addClass('disabled');
                        var message = (activePlayers > 0) ? 'playerLose' : 'playerWin';
                        socket.emit(message, {
                            user: balls[key].user,
                            score: Math.abs(balls[key].position.x - 1).toFixed(0)
                        });
                    }
                    balls[key].active = false;
                }
            }
        }
    }

    function handleCrossingTheLine() {
        for (var key in balls) {
            if (balls.hasOwnProperty(key)) {
                if (balls[key].active) {
                    $('.item[user="' + balls[key].user + '"] .score').html(Math.abs(balls[key].position.x - 1).toFixed(0) + ' pts');
                }
                if (balls[key].position.z < -20) {
                    if (balls[key].active) {
                        activePlayers--;
                        $('.item[user="' + balls[key].user + '"]').addClass('disabled');
                        var message = (activePlayers > 0) ? 'playerLose' : 'playerWin';
                        socket.emit(message, {
                            user: balls[key].user,
                            score: Math.abs(balls[key].position.x - 1).toFixed(0)
                        });
                    }
                    balls[key].active = false;
                    balls[key].position.y -= 0.8;
                    balls[key].position.z -= 0.4;
                } else if (balls[key].position.z > 20) {
                    if (balls[key].active) {
                        balls[key].active = false;
                        activePlayers--;
                        $('.item[user="' + balls[key].user + '"]').addClass('disabled');
                        var message = (activePlayers > 0) ? 'playerLose' : 'playerWin';
                        socket.emit(message, {
                            user: balls[key].user,
                            score: Math.abs(balls[key].position.x - 1).toFixed(0)
                        });
                    }
                    balls[key].position.y -= 0.8;
                    balls[key].position.z += 0.4;
                }
            }
        }
    }

    function updateCameraPosition(cam, x) {
        cam.position.x = x;
        cam.position.y = 23.094; //Math.tan(Math.PI / 6) * x;
        cam.position.z = 0;
    }

    var rowCount = 0;

    function generateTiles(count) {
        count = count || 1;
        for (var i = 0; i < count; i++, rowCount++) {
            var clr = 0x34495e;
            if (rowCount % 2 === 0)
                clr = 0x2c3e50;

            addPlane(scene, 10, 1, 10, -10 * rowCount, 0, 5, clr);
            addPlane(scene, 10, 1, 10, -10 * rowCount, 0, 15, clr);
            addPlane(scene, 10, 1, 10, -10 * rowCount, 0, -5, clr);
            addPlane(scene, 10, 1, 10, -10 * rowCount, 0, -15, clr);
        }
    }

    socket.on('updateMessage', function(msg) {
        var that = this;
        if (!balls[msg.id] && !gameStarted) {
            balls[msg.id] = addSphere(scene, R, msg.x, 5, msg.z, msg.color || 0xabcdef);
            balls[msg.id].user = msg.username;
            var scoreboardItem = "<div class='item disabled' user='" + msg.username + "'><div class='player'>" + msg.username + "</div><div class='score'>0pts</div></div>";
            $('.scoreboard').append(scoreboardItem);
        }
        if (!msg.id || msg.id === '') return;
        if (!gameStarted) return;
        if (!balls[msg.id].ready || !balls[msg.id].active) return;
        var x = msg.x;
        var y = msg.y;
        balls[msg.id].position.x += -(Math.abs(Math.abs(x) - 10)) / 15;
        balls[msg.id].position.z += (-y) / 10;
    });

    socket.on('initClientMessage', function(msg) {
        console.log(msg);
    });

    socket.on('readyToPlay', function(msg) {
        if (gameStarted) return;
        console.log(msg);
        if (balls[msg.id] && !balls[msg.id].ready) {
            balls[msg.id].ready = true;
            balls[msg.id].active = true;
            readyPlayerCount++;
            $('.elapsed-players').html((needToStart - readyPlayerCount) + '');
            $('.item[user="' + msg.username + '"]').removeClass('disabled');
            if (readyPlayerCount === needToStart) {
                $('.waiting').remove();
                var time = 5;
                $('.timer').css({
                    display: 'block'
                });
                $('.timer').html('' + time + '...');
                var interval = setInterval(function() {
                    if (time <= 0) {
                        clearInterval(interval);
                        socket.emit('gameStarted', {});
                        gameStarted = true;
                        $('.timer').remove();
                    }
                    time--;
                    $('.timer').html('' + time + '...');
                }, 1000);
            }
        }
    });

});

function showResultBoard(user, score) {
    $('.winner-name').html(user);
    $('.winner-score').html(score);
    $('.result-board').css({
        display: 'block'
    });
}