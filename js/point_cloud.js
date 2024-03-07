import * as THREE from 'three';
import { PLYLoader } from 'three/addons/loaders/PLYLoader.js'
import Stats from 'three/examples/jsm/libs/stats.module'
import {OrbitControls} from "three/addons";


/**
 * Setup
 */
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75,
    window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 120

const renderer = new THREE.WebGLRenderer({
    antialias: true
});
renderer.setSize( window.innerWidth*0.5, window.innerHeight );
const container = document.getElementById("point-cloud-view")
container.appendChild( renderer.domElement );

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true





function create_point_cloud(ply_path) {
    let material = new THREE.PointsMaterial({
        vertexColors: true,
        map: new THREE.TextureLoader().load( "/textures/dot_o.png" ),
        alphaTest: 0.5,
        transparent: true,
        opacity: 1.,
        size: 0.1
    })
    let loader = new PLYLoader();
    loader.load(ply_path, function (geometry) {
        let mesh = new THREE.Points(geometry, material)
        scene.add(mesh)
    });
}

create_point_cloud('/clouds/galaxy.ply')

const stats = new Stats()
document.body.appendChild(stats.dom)
window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}



function animate() {
    requestAnimationFrame(animate)
    controls.update()
    render()
    stats.update()
}

function render() {
    renderer.render(scene, camera)
}

animate()





