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

    var addSphere = function(scene, r, x, y, z) {
        var planeGeometry = new THREE.SphereGeometry(r, 100);
        var planeMaterial = new THREE.MeshLambertMaterial({
            color: 0xadffff
        });
        var plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.receiveShadow = true;
        plane.position.x = x;
        plane.position.y = y
        plane.position.z = z
        scene.add(plane);
        return plane;
    }

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMapEnabled = true;
    addPlane(scene, 10, 1, 10, 0, 0, 0);
    addPlane(scene, 10, 1, 10, 10, 0, 0);
    addPlane(scene, 10, 1, 10, 0, 0, 10);
    addPlane(scene, 10, 1, 10, 10, 0, 10);
    var x = addSphere(scene, 1, 0, 1, 0);
    // position and point the camera to the center of the scene
    camera.position.x = -30;
    camera.position.y = 40;
    camera.position.z = 30;
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
    render();

    function render() {
        // render using requestAnimationFrame
        x.position.x += 0.1;
        requestAnimationFrame(render);
        renderer.render(scene, camera);
    }

    window.addEventListener("devicemotion", handleMotionEvent, true);
    function handleMotionEvent(event) {
        var x = event.accelerationIncludingGravity.x;
        var y = event.accelerationIncludingGravity.y;
        var z = event.accelerationIncludingGravity.z;
        x.position.x = x;
        x.position.z = z;
    }
});