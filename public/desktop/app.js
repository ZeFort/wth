var socket = io.connect('10.168.1.36:3010');

var id = "";
var balls = [];

var scene, camera, renderer;

$(function() {

    var addPlane = function(scene, w, h, t, x, y, z) {
        var planeGeometry = new THREE.CubeGeometry(w, h, t, 10);
        var planeMaterial = new THREE.MeshLambertMaterial({
            color: 0xffffff
        });
        var plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.receiveShadow = true;
        plane.position.x = x;
        plane.position.y = y
        plane.position.z = z
        scene.add(plane);
        return plane;
    }

    var addSphere = function(scene, r, x, y, z, color) {
        var planeGeometry = new THREE.SphereGeometry(r, 100);
        var planeMaterial = new THREE.MeshLambertMaterial({
            color: color
        });
        var plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.receiveShadow = true;
        plane.position.x = x;
        plane.position.y = y
        plane.position.z = z
        scene.add(plane);
        return plane;
    }

    init();
    animate();

    function init(){
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
        var spotLight = new THREE.SpotLight(0xffffff);
        spotLight.position.set(-40, 60, -10);
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
        var longestX = 0; //we are moving to -inf by X axis

        for(var key in balls){
            if(balls.hasOwnProperty(key)){
                if(balls[key].position.x < longestX)
                    longestX = balls[key].position.x;
            }
        }

        updateCameraPosition(camera, longestX + 40);

        if(framesCount++ >= 30) {
            framesCount = 0;
            generateTiles();
        }

        renderer.render(scene, camera);
    }


    function updateCameraPosition(cam, x) {
        cam.position.x = x;
        cam.position.y = 23.094; //Math.tan(Math.PI / 6) * x;
        cam.position.z = 0;
    }

    var rowCount = 0;
    function generateTiles(count){
        count = count || 1;

        for(var i = 0; i < count; i++, rowCount++) {
            addPlane(scene, 10, 1, 10, -10 * rowCount, 0, 5, 0x9b59b6);
            addPlane(scene, 10, 1, 10, -10 * rowCount, 0, 15, 0xe67e22);
            addPlane(scene, 10, 1, 10, -10 * rowCount, 0, -5, 0xe74c3c);
            addPlane(scene, 10, 1, 10, -10 * rowCount, 0, -15, 0x2ecc71);
        }
    }

    id = "" + Math.floor(Math.random() * 254);
    color = Math.floor(Math.random() * 0xffffff);
    balls[id] = addSphere(scene, 1, 0, 1, 0, color);
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
            balls[msg.id] = addSphere(scene, 1, msg.x, 0, msg.z, msg.color || 0xabcdef);
        }
        var x = msg.x;
        var y = msg.y;
        if (!msg.id || msg.id === '') msg.id = id;
        console.log('---', msg);
        balls[msg.id].position.x += x / 100;
        balls[msg.id].position.z += y / 100;
    });

    socket.on('initClientMessage', function(msg) {
        console.log(msg);
    });
});