import * as THREE from 'three';
import { PCDLoader } from 'three/addons/loaders/PCDLoader.js'
import Stats from 'three/examples/jsm/libs/stats.module'
import {OrbitControls} from "three/addons";


/**
 * Setup
 */
const window_x = window.innerWidth*0.5
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



export function draw_point_cloud(cube_path, component, feature, subhalo_id) {
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
    let data_url = cube_path + "/particle_clouds/" + component + "/" + feature + "/" + subhalo_id + ".pcd"
    let loader = new PCDLoader();
    loader.load(data_url, function (points) {
        points.material = dot_material
        scene.add(points)
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
    const window_x = window.innerWidth*0.5
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





