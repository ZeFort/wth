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

socket.on('usernames', function(msg) {
    socket.emit('usernameList', {
        list: users
    });
});

socket.on('disconnectUser', function(msg) {
    console.log('disconnected', msg);
    if (balls[msg.id]) {
        readyPlayerCount--;
        if (readyPlayerCount < 0) readyPlayerCount = 0;
        $('.elapsed-players').html((needToStart - readyPlayerCount) + '');
        balls[msg.id].active = false;
        balls[msg.id].ready = false;
        $('.item[user="' + msg.username + '"]').remove();
        var i = users.indexOf(msg.username);
        if (i > -1) {
            delete users[i];
        }
    }
});

var balls = [];
var users = [];
var readyPlayerCount = 0;
var needToStart = 2;
var activePlayers = needToStart;
var gameStarted = false;
var countSphere = 0;
var rowCount = 0;

var n = 6,
    m = 500;
var barricades = [];
for (var i = 0; i < m; i++) {
    barricades[i] = [];
    for (var j = 0; j < n; j++) {
        barricades[i][j] = "none";
    }
}

var scene, camera, renderer, backgroundScene, backgroundCamera;
var R = 2;

$(function() {
    $('.elapsed-players').html(needToStart + '');
    $('.refresh').click(function(e) {
        e.preventDefault();
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
    animate();

    function init() {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMapEnabled = true;
        renderer.setClearColor(0xffffff, 1);
        generateTiles(12);
        console.log(barricades);

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


        handleCrossingTheLine();
        handleInvisiblePlayers();
        updateCameraPosition(camera, longestX + 40);

        if (framesCount++ >= 15) {
            framesCount = 0;
            generateTiles();
        }

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
                if (balls[key].position.z < -30) {
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
                    balls[key].active = false;
                    balls[key].position.y -= 0.8;
                    balls[key].position.z -= 0.4;
                } else if (balls[key].position.z > 30) {
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
                } else if (balls[key].isFalling) {
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
                    balls[key].position.y -= 0.4;
                    balls[key].position.x += 0.4;
                }
            }
        }
    }

    function updateCameraPosition(cam, x) {
        cam.position.x = x;
        cam.position.y = 23.094; //Math.tan(Math.PI / 6) * x;
        cam.position.z = 0;
    }


    function generateTiles(count) {
        count = count || 1;
        for (var i = 0; i < count; i++, rowCount++) {
            var clr = 0x34495e;
            if (rowCount % 2 === 0)
                clr = 0x2c3e50;

            var makeHoleSpotNumber = rowCount % 3 == 0 ? Math.round(Math.random() * 5) + 1 : 0;
            var makeMountainSpotNumber = rowCount % 4 == 0 ? Math.round(Math.random() * 5) + 1 : 0;
            if (rowCount <= 25) {
                makeHoleSpotNumber = 0;
                makeMountainSpotNumber = 0;
            }
            if (makeHoleSpotNumber !== 1) {
                if (makeMountainSpotNumber == 1) {
                    barricades[rowCount][2] = "block";
                }
                addPlane(scene, 10, makeMountainSpotNumber == 1 ? 6 : 1, 10, -10 * rowCount, makeMountainSpotNumber == 1 ? 3 : 0, 5, clr);
            } else {
                barricades[rowCount][2] = "hole";
            }
            if (makeHoleSpotNumber !== 2) {
                if (makeMountainSpotNumber == 2) {
                    barricades[rowCount][1] = "block";
                }
                addPlane(scene, 10, makeMountainSpotNumber == 2 ? 6 : 1, 10, -10 * rowCount, makeMountainSpotNumber == 2 ? 3 : 0, 15, clr);
            } else {
                barricades[rowCount][1] = "hole";
            }
            if (makeHoleSpotNumber !== 3) {
                if (makeMountainSpotNumber == 3) {
                    barricades[rowCount][3] = "block";
                }
                addPlane(scene, 10, makeMountainSpotNumber == 3 ? 6 : 1, 10, -10 * rowCount, makeMountainSpotNumber == 3 ? 3 : 0, -5, clr);
            } else {
                barricades[rowCount][3] = "hole";
            }
            if (makeHoleSpotNumber !== 4) {
                if (makeMountainSpotNumber == 4) {
                    barricades[rowCount][4] = "block";
                }
                addPlane(scene, 10, makeMountainSpotNumber == 4 ? 6 : 1, 10, -10 * rowCount, makeMountainSpotNumber == 4 ? 3 : 0, -15, clr);
            } else {
                barricades[rowCount][4] = "hole";
            }
            if (makeHoleSpotNumber !== 5) {
                if (makeMountainSpotNumber == 5) {
                    barricades[rowCount][0] = "block";
                }
                addPlane(scene, 10, makeMountainSpotNumber == 5 ? 6 : 1, 10, -10 * rowCount, makeMountainSpotNumber == 5 ? 3 : 0, 25, clr);
            } else {
                barricades[rowCount][0] = "hole";
            }
            if (makeHoleSpotNumber !== 6) {
                if (makeMountainSpotNumber == 6) {
                    barricades[rowCount][5] = "block";
                }
                addPlane(scene, 10, makeMountainSpotNumber == 6 ? 6 : 1, 10, -10 * rowCount, makeMountainSpotNumber == 6 ? 3 : 0, -25, clr);
            } else {
                barricades[rowCount][5] = "hole";
            }

        }
    }

    socket.on('updateMessage', function(msg) {
        var that = this;
        console.log('update', msg)
        if (users.indexOf(msg.username) == -1 && !gameStarted) {
            users.push(msg.username);
            var scoreboardItem = "<div class='item disabled' user='" + msg.username + "'><div class='player'>" + msg.username + "</div><div class='score'>0pts</div></div>";
            $('.scoreboard').append(scoreboardItem);
        }
        if (!balls[msg.id] && !gameStarted) {
            console.log(countSphere);
            balls[msg.id] = addSphere(scene, R, msg.x, 5, 10 * countSphere, msg.color || 0xabcdef);
            balls[msg.id].vector = {
                x: 0,
                y: 0
            };
            countSphere++;
            balls[msg.id].user = msg.username;
        }

        if (!msg.id || msg.id === '') return;
        if (!gameStarted) return;
        if (!balls[msg.id].ready || !balls[msg.id].active) return;
        balls[msg.id].vector.x += msg.x / 20;
        if (balls[msg.id].vector.x > 10) {
            balls[msg.id].vector.x = 10;
        }
        if (balls[msg.id].vector.x < 0) {
            balls[msg.id].vector.x = 0;
        }

        balls[msg.id].vector.y += msg.y / 5;
        balls[msg.id].vector.y = Math.min(10, Math.abs(balls[msg.id].vector.y)) * Math.sign(balls[msg.id].vector.y);

        if (!msg.id || msg.id === '') return;
        handleCollisions(msg.id);
    });

    function handleCollisions(id) {
        for (var key in balls) {
            if (balls.hasOwnProperty(key) && (id !== key)) {
                var sphere1 = balls[id],
                    sphere2 = balls[key];
                var kx = Math.round(Math.abs(sphere1.position.x / 10)) + 1;
                var ky = getYPosition(sphere1.position.z);
                console.log(kx + " " + ky);
                if (barricades[kx][ky] == "block") {
                    sphere1.vector.x = 0;
                }
                if (barricades[kx - 1][ky - 1] == "block") {
                    if (sphere1.vector.y < 0) {
                        sphere1.vector.y = 0;
                    }
                }
                if (barricades[kx - 1][ky + 1] == "block") {
                    if (sphere1.vector.y > 0) {
                        sphere1.vector.y = 0;
                    }
                }
                var kx = Math.round(Math.abs(sphere1.position.x / 10));
                var ky = getYPosition(sphere1.position.z);
                if (barricades[kx][ky] == "hole") {
                    sphere1.isFalling = true;
                }
                if (getPythogarExpression(sphere1.position.x, sphere2.position.x, sphere1.position.z, sphere2.position.z)) {
                    changeVectors(sphere1, sphere2);
                    sphere1.position.x += -sphere1.vector.x / 20;
                    sphere1.position.z += -sphere1.vector.y / 20;
                } else {
                    sphere1.position.x += -sphere1.vector.x / 20;
                    sphere1.position.z += -sphere1.vector.y / 20;
                }
            }
        }
    }

    function getYPosition(y) {
        if (y >= -35 && y < -25) {
            return 5;
        }
        if (y >= -25 && y < -15) {
            return 4;
        }
        if (y >= -15 && y < -5) {
            return 3;
        }
        if (y >= -5 && y < 5) {
            return 2;
        }
        if (y >= 5 && y < 15) {
            return 1;
        }
        if (y >= 15 && y <= 25) {
            return 0;
        }
    }

    function changeVectors(sphere1, sphere2) {
        var v1x = sphere1.vector.x,
            v1y = sphere1.vector.y,
            v2x = sphere2.vector.x,
            v2y = sphere2.vector.y;
        sphere1.vector.x = v2x;
        sphere1.vector.y = v2y;
        sphere2.vector.x = v1x;
        sphere2.vector.y = v1y;
    }

    function getPythogarExpression(x1, x2, y1, y2) {
        return Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2) <= 4 * R * R;
    }

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