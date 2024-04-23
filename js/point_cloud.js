import * as THREE from 'three';
import { PLYLoader } from 'three/addons/loaders/PLYLoader.js'
import Stats from 'three/examples/jsm/libs/stats.module'
import {OrbitControls} from "three/addons";


/**
 * Setup
 */
const window_x = window.innerWidth
const window_y = window.innerHeight
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75,
    window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 120

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});
renderer.setSize(window_x , window_y );
const container = document.getElementById("jasmine-viewer")
container.appendChild( renderer.domElement );

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
scene.fog = new THREE.FogExp2( 0x000104, 0.0000675 );



export function draw_point_cloud(ply_path) {
    clear_scene()
    let dot_material = new THREE.PointsMaterial({
        vertexColors: true,
        map: new THREE.TextureLoader().load( "/textures/dot_o.png" ),
        alphaTest: 0.5,
        transparent: true,
        opacity: 1.,
        size: 0.1
    })
    let neb_material = new THREE.PointsMaterial({
        vertexColors: true,
        map: new THREE.TextureLoader().load( "/textures/neb.png" ),
        transparent: true,
        opacity: 0.1,
        size: 15.,
        alpha: true,
        alphaTest: 0.05,
    })
    let loader = new PLYLoader();
    loader.load(ply_path, function (geometry) {
        let mesh = new THREE.Points(geometry, dot_material)
        scene.add(mesh)
    });
    animate()
}

export function draw_star_cloud(coordinates, mass, density, subhalo_center) {
    const coord_vec = coordinates.map((x, y, z) => THREE.Vector3(x, y, z))
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
    const window_x = window.innerWidth
    const window_y = window.innerHeight
    renderer.setSize(window_x, window_y)
    renderer.render(scene, camera)
}



export function animate() {
    requestAnimationFrame(animate)
    controls.update()
    renderer.render(scene, camera)
    stats.update()
}


animate()





