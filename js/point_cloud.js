import * as THREE from 'three';
import { PLYLoader } from 'three/addons/loaders/PLYLoader.js'
import Stats from 'three/examples/jsm/libs/stats.module'
import {OrbitControls} from "three/addons";


/**
 * Setup
 */
const window_x = window.innerWidth*0.5
const window_y = window.innerHeight*0.85
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75,
    window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 120

const renderer = new THREE.WebGLRenderer({
    antialias: true
});
renderer.setSize(window_x , window_y );
const container = document.getElementById("point-cloud-view")
container.appendChild( renderer.domElement );

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true



export function draw_point_cloud(ply_path) {
    clear_scene()
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
    animate()
}

export function clear_scene() {
    while(scene.children.length > 0){
        scene.remove(scene.children[0]);
    }
}

const stats = new Stats()
document.body.appendChild(stats.dom)
window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    const window_x = window.innerWidth*0.5
    const window_y = window.innerHeight*0.85
    renderer.setSize(window_x, window_y)
    render()
}



export function animate() {
    requestAnimationFrame(animate)
    controls.update()
    renderer.render(scene, camera)
    stats.update()
}


animate()





