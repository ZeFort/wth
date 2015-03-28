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

var balls = [];
var readyPlayerCount = 0;
var needToStart = 2;
var gameStarted = false;
var countSphere = 0;

var scene, camera, renderer;
var R = 3;

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
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMapEnabled = true;
        renderer.setClearColor( 0xffffff, 1);
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

    socket.on('updateMessage', function(msg) {
        var that = this;
        if (!balls[msg.id]) {
            console.log(countSphere);
            balls[msg.id] = addSphere(scene, R, msg.x, 5, 10 * countSphere , msg.color || 0xabcdef);
            balls[msg.id].vector = {x: 0, y: 0};
            countSphere++;
        }

        if (!gameStarted) return;
        console.log(balls[msg.id].vector.x, balls[msg.id].vector.y);
        balls[msg.id].vector.x += msg.x/20;
        if (balls[msg.id].vector.x > 10){
            balls[msg.id].vector.x = 10;
        }
        if (balls[msg.id].vector.x < 0){
            balls[msg.id].vector.x = 0;
        }

        balls[msg.id].vector.y += msg.y/5;
        balls[msg.id].vector.y = Math.min(10, Math.abs(balls[msg.id].vector.y)) * Math.sign(balls[msg.id].vector.y);

        if (!msg.id || msg.id === '') return;
        handleCollisions(msg.id);
    });

    function handleCollisions(id){
        for(var key in balls){
            if(balls.hasOwnProperty(key) && (id !== key)){
                var sphere1 = balls[id],
                    sphere2 = balls[key];
                if (getPythogarExpression(sphere1.position.x, sphere2.position.x, sphere1.position.z, sphere2.position.z)){
                    changeVectors(sphere1, sphere2);
                    sphere1.position.x += -sphere1.vector.x/20;
                    sphere1.position.z += -sphere1.vector.y/20;
                }
                else {
                    sphere1.position.x += -sphere1.vector.x/20;
                    sphere1.position.z += -sphere1.vector.y/20;
                }
                //console.log(sphere1.position.x, sphere1.position.z);

            }
        }
    }

    function changeVectors(sphere1, sphere2){
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