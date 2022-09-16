import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as dat from 'dat.gui';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
// import Stats from 'three/examples/jsm/libs/stats.module'
import Stats from 'stats.js';

import sunTexture from '../img/sun.jpg';
import mercuryTexture from '../img/mercury.jpg';
import venusTexture from '../img/venus.jpg';
import venusCloudTexture from '../img/venus_atmosphere.jpg';
import earthTexture from '../img/earth.jpg';
import earthcloudTexture from '../img/earthclouds.png';
import marsTexture from '../img/mars.jpg';
import jupiterTexture from '../img/jupiter.jpg';
import saturnTexture from '../img/saturn.jpg';
import saturnringTexture from '../img/saturn_rings.png';
import smallringTexture from '../img/small_ring_tex.png';
import uranusTexture from '../img/uranus.jpg';
import neptuneTexture from '../img/neptune.jpg';
import starsTexture from '../img/stars.jpg';
import stars8kTexture from '../img/stars_8k.jpg';
import moonTexture from '../img/moon.jpg';
import moon1Texture from '../img/moon1.jpg';
import moon2Texture from '../img/moon2.jpg';
import moon3Texture from '../img/moon3.jpg';
import moon4Texture from '../img/moon4.jpg';
import metalTexture1 from '../img/metal1.jpg';
import metalTexture2 from '../img/metal2.jpg';
import metalTexture3 from '../img/metal3.jpg';
import meteoriteTexture from '../img/meteorite.webp';

const hubbleURL = new URL('../assets/Hubble.glb', import.meta.url);
const voyagerURL = new URL('../assets/Voyager.glb', import.meta.url);

const renderer = new THREE.WebGLRenderer({
    antialias: true
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000000
);

const orbit = new OrbitControls(camera, renderer.domElement);

const axesHelper = new THREE.AxesHelper(50);
scene.add(axesHelper);

camera.position.set(200, 30, 100); // 200, 30, -30
orbit.update();

// Lighting
const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xFFFFFF, 2, 1000);
// pointLight.shadow;
pointLight.castShadow = true;
scene.add(pointLight);
pointLight.shadow.camera.near = 20;
pointLight.shadow.camera.far = 100;

// Add tecture to background
// const cubeTextureLoader = new THREE.CubeTextureLoader();
// scene.background = cubeTextureLoader.load([
//     starsTexture,
//     starsTexture,
//     starsTexture,
//     starsTexture,
//     starsTexture,
//     starsTexture
// ]);

const textureLoader = new THREE.TextureLoader();
scene.background = textureLoader.load(starsTexture);

const backgroundGeometry = new THREE.SphereGeometry(88888, 30, 30);
const backgroundMaterial = new THREE.MeshBasicMaterial({
    map: textureLoader.load(stars8kTexture),
    side: THREE.DoubleSide,
    transparent: true
});
const background = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
scene.add(background);

let axisObjects = []; 

const sunGeometry = new THREE.SphereGeometry(20, 30, 30);
const sunMaterial = new THREE.MeshBasicMaterial({
    map: textureLoader.load(sunTexture),
    transparent: false,
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.castShadow = true;
scene.add(sun);

function createPlanet(radius, texture, position, ring, clouds) {
    const geometry = new THREE.SphereGeometry(radius, 64, 64);
    const material = new THREE.MeshStandardMaterial({
        map: textureLoader.load(texture),
        transparent: true
    });
    const planet = new THREE.Mesh(geometry, material);
    const parentObject = new THREE.Object3D();
    parentObject.add(planet);

    const planetRotationAxisGeometry = new THREE.RingGeometry(position, position + 0.1, 100);
    const planetRotationAxisMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        side: THREE.DoubleSide
    });
    const planetRotationAxis = new THREE.Mesh(planetRotationAxisGeometry, planetRotationAxisMaterial);
    planetRotationAxis.rotation.x = -0.5 * Math.PI;
    parentObject.add(planetRotationAxis);
    axisObjects.push(planetRotationAxis);

    if (ring) {
        const ringGeometry = new THREE.RingGeometry(
            ring.innerRadius,
            ring.outerRadius,
            64
        );
        const ringMaterial = new THREE.MeshStandardMaterial({
            map: textureLoader.load(ring.texture),
            // side: THREE.DoubleSide,
            transparent: true
        });
        const ringUpMesh = new THREE.Mesh(ringGeometry, ringMaterial);
        parentObject.add(ringUpMesh);
        ringUpMesh.position.x = position;
        ringUpMesh.rotation.x = -0.5 * Math.PI;
        ringUpMesh.rotation.y = ring.up.rotationY * Math.PI;
        ringUpMesh.castShadow = true;
        ringUpMesh.receiveShadow = true;

        const ringDownMesh = new THREE.Mesh(ringGeometry, ringMaterial);
        parentObject.add(ringDownMesh);
        ringDownMesh.position.x = position;
        ringDownMesh.rotation.x = -0.5 * Math.PI;
        ringDownMesh.rotation.y = ring.down.rotationY * Math.PI;
        ringDownMesh.rotation.z = 1 * Math.PI;
        ringDownMesh.castShadow = true;
        ringDownMesh.receiveShadow = true;
    }

    let cloudMesh;
    if (clouds) {
        const cloudGeometry = new THREE.SphereGeometry(clouds.radius, 64, 64);
        const cloudMaterial = new THREE.MeshStandardMaterial({
            map: textureLoader.load(clouds.texture),
            transparent: true
        });
        cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
        parentObject.add(cloudMesh);
        cloudMesh.position.x = position;
        cloudMesh.castShadow = true;
        cloudMesh.receiveShadow = true;
    }

    scene.add(parentObject);
    planet.position.x = position;
    planet.castShadow = true;
    planet.receiveShadow = true;
    return { mesh: planet, object: parentObject, cloudMesh: cloudMesh }
}

function createMoon(radius, texture, position, planet, theta) {
    const geometry = new THREE.SphereGeometry(radius, 64, 64);
    const material = new THREE.MeshStandardMaterial({
        map: textureLoader.load(texture)
    });
    const moon = new THREE.Mesh(geometry, material);
    const parentObject = new THREE.Object3D();
    parentObject.add(moon);
    planet.mesh.add(parentObject);
    moon.position.x = position;
    moon.castShadow = true;
    moon.receiveShadow = true;

    const moonRotationAxisGeometry = new THREE.RingGeometry(position, position + 0.1, 100);
    const moonRotationAxisMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        side: THREE.DoubleSide
    });
    const moonRotationAxis = new THREE.Mesh(moonRotationAxisGeometry, moonRotationAxisMaterial);
    moonRotationAxis.rotation.x = theta * Math.PI;

    planet.mesh.add(moonRotationAxis);
    axisObjects.push(moonRotationAxis);

    return { mesh: moon, object: parentObject }
}

const mercury = createPlanet(2.67, mercuryTexture, 35, undefined, undefined);

const venus = createPlanet(6.67, venusTexture, 67, undefined, {
    radius: 6.77,
    texture: venusCloudTexture,
});

const earth = createPlanet(7, earthTexture, 93, undefined, {
    radius: 7.1,
    texture: earthcloudTexture,
});

const moon = createMoon(1, moonTexture, 13, earth, 0.5);

const mars = createPlanet(3.66, marsTexture, 142, undefined, undefined);

const jupiter = createPlanet(77.7, jupiterTexture, 484, undefined, undefined);

const saturn = createPlanet(64.66, saturnTexture, 889, {
    innerRadius: 66.66,
    outerRadius: 103.66,
    texture: smallringTexture,
    up: {
        rotationY: -0.1
    },
    down: {
        rotationY: 0.9
    }
});

const uranus = createPlanet(28.11, uranusTexture, 1790, undefined, undefined);

const neptune = createPlanet(27.33, neptuneTexture, 2880, undefined, undefined);

const moon1 = createMoon(3.3, moon1Texture, 110, saturn, 0.5); //0.4
const moon2 = createMoon(4.2, moon2Texture, 120, saturn, 0.5); //0.1
const moon3 = createMoon(3, moon3Texture, 130, saturn, 0.5); //0.6
const moon4 = createMoon(4.5, moon4Texture, 140, saturn, 0.5);//-0.8

const helper = new THREE.CameraHelper(pointLight.shadow.camera);

const objLoader = new OBJLoader();

let material1 = new THREE.MeshPhongMaterial({ map: textureLoader.load(metalTexture1) });
let spaceshipObj = new THREE.Object3D();
objLoader.load('models/spaceship1.obj', function (object) {
    object.scale.set(3, 3, 3);
    object.traverse(function (node) {
        if (node.isMesh) node.material = material1;
    });
    spaceshipObj = object;
    scene.add(object);
    object.position.set(-140, 40, 50);
},
function (xhr) {
    console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
},
function (error) {
    console.log(error);
});

let material2 = new THREE.MeshPhongMaterial({ map: textureLoader.load(metalTexture3) });
let sataliteObj = new THREE.Object3D();
objLoader.load('models/spaceship2.obj', function (object) {
    object.scale.set(1, 1, 1);
    object.traverse(function (node) {
        if (node.isMesh) node.material = material2;
    });
    sataliteObj = object;
    scene.add(object);
    object.position.set(103, 10, 5);
    object.rotation.y = -0.5 * Math.PI;
},
function (xhr) {
    console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
},
function (error) {
    console.log(error);
});

let material3 = new THREE.MeshPhongMaterial({ map: textureLoader.load(meteoriteTexture) });

let meteorites = [];
for (let i = 0; i < 100; i++) {
    objLoader.load('models/metiorite.obj', function (object) {
        let scale = Math.random()/100;
        object.scale.set(scale, scale, scale);
        object.traverse(function (node) {
            if (node.isMesh) node.material = material3;
        });
        meteorites.push(object);
        scene.add(object);
        let posX = -3001 + Math.floor(Math.random() * 3001);
        let posY = -3001 + Math.floor(Math.random() * 3001);
        let posZ = -3001 + Math.floor(Math.random() * 3001);
        object.position.set(posX, posY, posZ);
    },
    function (xhr) {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
    },
    function (error) {
        console.log(error);
    });
}

const gltfLoader = new GLTFLoader();

let hubbleObj = new THREE.Object3D();
gltfLoader.load(hubbleURL.href, function(object) {
    const model = object.scene;
    model.scale.set(0.1,0.1,0.1);
    model.traverse(function (node) {
        if (node.isMesh) node.material = material2;
    });
    hubbleObj = model;
    scene.add(model);
    model.position.set(103,4,0);
    model.rotation.z = 0.5 * Math.PI;
    model.rotation.x = 0.5 * Math.PI;
    model.rotation.y = 0.1 * Math.PI;
},
function (xhr) {
    console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
}, 
function(error) {
    console.log(error)
});

let codinates = {1:[10,0,0,0.5,0.5,0], 2:[-5,0,10,-2.80,2.61,0], 3:[-5,0,-10,-0.217,0.5,0.1]}
for (let i = 1; i <= 3; i++) {
    gltfLoader.load(voyagerURL.href, function(object) {
        const model = object.scene;
        model.scale.set(0.1, 0.1, 0.1);
        model.traverse(function (node) {
            if (node.isMesh) node.material = material1;
        });
        const parentObject = new THREE.Object3D();
        parentObject.add(model);
        parentObject.position.set(codinates[i][0],codinates[i][1],codinates[i][2]);
        model.rotation.x = codinates[i][4] * Math.PI;
        model.rotation.y = codinates[i][5] * Math.PI;
        model.rotation.z = codinates[i][3] * Math.PI;
        earth.mesh.add(parentObject);
    },
    function (xhr) {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
    },
    function(error) {
        console.log(error)
    });
}

const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

const gui = new dat.GUI();
const options = {
    lightsource: '#ffffff',
    wireframe: false,
    axis: true,
    ring: true,
    freeze: true,
    freeze_planets: false,
    freeze_moons: false,
    speed: 0.001,
    penumbra: 0.001,
    intensity: 1,
    xr: 0.5,
    yr: 0.5,
    zr: 0.5
};

gui.addColor(options, 'lightsource').onChange(function (e) {
    pointLight.color.set(e);
});

gui.add(options, 'wireframe').onChange(function (e) {
    sun.material.wireframe = e;
    mercury.mesh.material.wireframe = e;
    venus.mesh.material.wireframe = e;
    earth.mesh.material.wireframe = e;
    mars.mesh.material.wireframe = e;
    jupiter.mesh.material.wireframe = e;
    saturn.mesh.material.wireframe = e;
    uranus.mesh.material.wireframe = e;
    neptune.mesh.material.wireframe = e;
    moon.mesh.material.wireframe = e;
    moon1.mesh.material.wireframe = e;
    moon2.mesh.material.wireframe = e;
    moon3.mesh.material.wireframe = e;
    moon4.mesh.material.wireframe = e;
});

gui.add(options, 'axis').onChange(function (e) {
    for (let i = 0; i < axisObjects.length; i++) {
        if (axisObjects[i] instanceof THREE.Mesh) {
            axisObjects[i].visible = e;
        }   
    }
});

// const freeze = gui.addFolder('Freeze System');
// freeze.add(options, 'freeze');
// freeze.add(options, 'freeze_moons');

gui.add(options, 'freeze').onChange(function (e) {
});

gui.add(options, 'freeze_planets').onChange(function (e) {
});

gui.add(options, 'freeze_moons').onChange(function (e) {
});

gui.add(options, 'speed', 0, 0.01);
gui.add(options, 'penumbra', 0, 1);
gui.add(options, 'intensity', 0, 5);

//Vector pointing towards the saturn
var backgroundVec = new THREE.Vector3(0, 0, 0);

//Set position increments
var dx = .01;
var dy = -.01;
var dz = -.05;

function animate() {

    if (!options.freeze) {
        // planets
        mercury.object.rotateY(0.006 + options.speed);
        venus.object.rotateY(0.0048 + options.speed);
        earth.object.rotateY(0.004 + options.speed);
        moon.object.rotateY(0.0004 + options.speed);
        mars.object.rotateY(0.0032 + options.speed);
        jupiter.object.rotateY(0.00172 + options.speed);
        saturn.object.rotateY(0.0012 + options.speed);
        uranus.object.rotateY(0.00088 + options.speed);
        neptune.object.rotateY(0.00072 + options.speed);

        // Spaceships
        spaceshipObj.position.x += 0.1;
        earth.object.add(hubbleObj);
        earth.object.add(sataliteObj);

        // Update the camera position
        camera.position.x += dx;
        camera.position.y += dy;
        camera.position.z += dz;
    }

    if(!options.freeze_planets) {
        sun.rotateY(0.0004 + options.speed);
        mercury.mesh.rotateY(0.000006 + options.speed);
        venus.mesh.rotateY(0.0000036 + options.speed);
        earth.mesh.rotateY(0.0009 + options.speed);
        earth.cloudMesh.rotateY(0.00005 + options.speed);
        mars.mesh.rotateY(0.00045 + options.speed);
        jupiter.mesh.rotateY(0.02 + options.speed);
        saturn.mesh.rotateY(0.004 + options.speed);
        moon.mesh.rotateY(0.0015 + options.speed);
        moon1.mesh.rotateY(0.011 + options.speed);
        moon2.mesh.rotateY(0.0075 + options.speed);
        moon3.mesh.rotateY(0.0078 + options.speed);
        moon4.mesh.rotateY(0.0032 + options.speed);
        uranus.mesh.rotateY(0.002 + options.speed);
        neptune.mesh.rotateY(0.001 + options.speed);
    }

    if(!options.freeze_moons) {
        moon.object.rotateY(0.0017 + options.speed);
        moon1.object.rotateY(0.0028 + options.speed);
        moon2.object.rotateY(0.0012 + options.speed);
        moon3.object.rotateY(0.005 + options.speed);
        moon4.object.rotateY(0.002 + options.speed);
    } 

    for (let i = 0; i < meteorites.length; i++) {
        let rotation = Math.random()/100;
        meteorites[i].rotateY(rotation);
    }

    pointLight.intensity = options.intensity;
    pointLight.penumbra = options.penumbra;

    // Flyby reset
    // if (camera.position.z < -100) {
    //     camera.position.set(0, 70 ,140);
    // }

    //Point the camera towards the saturn
    // camera.lookAt(backgroundVec); // comment this to move objects over the space
    renderer.render(scene, camera);

    stats.update();
}

renderer.setAnimationLoop(animate);

window.addEventListener('resize', function () {
    camera.aspect = this.window.innerWidth / this.window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(this.window.innerWidth, this.window.innerHeight);
});