var socket = io.connect('10.168.1.29:3010');

var balls = [];
var readyPlayerCount = 0;
var needToStart = 2;
var gameStarted = false;

var scene, camera, renderer;
var R = 4;

$(function() {
    $('.elapsed-players').html(needToStart + '');
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
        balls = [];
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMapEnabled = true;

        generateTiles(12);

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
        updateCameraPosition(camera, longestX + 40);

        if(framesCount++ >= 15) {
            framesCount = 0;
            generateTiles();
        }

        renderer.render(scene, camera);
    }

    function getFirstPlayerPosition(){
        var longestX = 0; //we are moving to -inf by X axis
        for(var key in balls){
            if(balls.hasOwnProperty(key)){
                if(balls[key].position.x < longestX && balls[key].position.y >= 0)
                    longestX = balls[key].position.x;
            }
        }

        return longestX;
    }



    function handleCrossingTheLine() {
        for(var key in balls){
            if(balls.hasOwnProperty(key)) {
                if(balls[key].position.z < -20 ) {
                    balls[key].position.y -= 0.8;
                    balls[key].position.z -= 0.4;
                }
                else if(balls[key].position.z > 20) {
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
        for(var i = 0; i < count; i++, rowCount++) {
            var clr = 0xe74c3c;
            if(rowCount % 2 === 0)
                clr = 0xe67e22;

            addPlane(scene, 10, 1, 10, -10 * rowCount, 0, 5, clr);
            addPlane(scene, 10, 1, 10, -10 * rowCount, 0, 15, clr);
            addPlane(scene, 10, 1, 10, -10 * rowCount, 0, -5, clr);
            addPlane(scene, 10, 1, 10, -10 * rowCount, 0, -15, clr);
        }
    }

    id = "" + Math.floor(Math.random() * 254);
    color = Math.floor(Math.random() * 0xffffff);
    balls[id] = addSphere(scene, R, 100, 5, 0, color);
    socket.emit('updateMessage', {
        id: id,
        x: 1,
        y: 0,
        z: 1,
        color: color
    });

    socket.on('updateMessage', function(msg) {
        var that = this;
        if (!balls[msg.id]) {
            balls[msg.id] = addSphere(scene, R, msg.x, 5, msg.z, msg.color || 0xabcdef);
        }
        var x = msg.x;
        var y = msg.y;
        if (!msg.id || msg.id === '') return;
        if (!gameStarted) return;
        handleCollisions(msg.id, x, y);
    });

    function handleCollisions(id, x, y){
        for(var key in balls){
            if(balls.hasOwnProperty(key) && (id !== key)){
                var sphere1 = balls[id],
                    sphere2 = balls[key];
                if (getPythogarExpression(sphere1.position.x, sphere2.position.x, sphere1.position.z, sphere2.position.z)){
                    if (sphere1.position.z > sphere2.position.z && y > 0 || sphere1.position.z < sphere2.position.z && y < 0 ){
                        balls[id].position.x += -(Math.abs(Math.abs(x)-10)) / 15;
                        balls[id].position.z += 0;
                    }else{
                        balls[id].position.x += -(Math.abs(Math.abs(x)-10)) / 15;
                        balls[id].position.z += (-y) / 10;
                    }
                }
                else {
                    balls[id].position.x += -(Math.abs(Math.abs(x)-10)) / 15;
                    balls[id].position.z += (-y) / 10;
                }

            }
        }
    }

    function getPythogarExpression(x1, x2, y1, y2) {
        return Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2) <= 4 * R * R;
    }

    function swapSpeeds(sph1, sph2) {
        //write swap speeds logic here
    }

    socket.on('initClientMessage', function(msg) {
        console.log(msg);
    });

    socket.on('readyToPlay', function(msg) {
        console.log(msg);
        if (balls[msg.id] && !balls[msg.id].ready) {
            balls[msg.id].ready = true;
            readyPlayerCount++;
            $('.elapsed-players').html((needToStart - readyPlayerCount) + '');
            if (readyPlayerCount === needToStart) {
                socket.emit('gameStarted', {});
                gameStarted = true;
                $('.waiting').remove();
            }
        }
    });
});