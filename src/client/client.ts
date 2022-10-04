import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import {GUI} from 'dat.gui'
import {OutlineEffect} from 'three/examples/jsm/effects/OutlineEffect'

const scene = new THREE.Scene()
scene.background = new THREE.Color(0xFFFFFF)

const light = new THREE.PointLight(0xffffff, .5)
light.position.set(3, 3, 3)
scene.add(light)

const ambientLight = new THREE.AmbientLight( 0xFFFFFF, .5 );
scene.add( ambientLight );

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
)
camera.position.z = 3.5

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

new OrbitControls(camera, renderer.domElement)

const outline = new OutlineEffect( renderer, {
    defaultThickness: .01,
    defaultColor: [ .55, 0, 0 ],
    defaultAlpha: .8,
    defaultKeepAlive: true // keeps outline material in cache even if material is removed from scene
});

const fiveTone = new THREE.TextureLoader().load('img/gradientMaps/fiveTone.jpg')
fiveTone.minFilter = THREE.NearestFilter
fiveTone.magFilter = THREE.NearestFilter

const geometry = new THREE.BoxGeometry()
const material: THREE.MeshToonMaterial = new THREE.MeshToonMaterial({
    color: 0xFF0000,
    gradientMap: fiveTone,
})

const cube = new THREE.Mesh(geometry, material)
scene.add(cube)
cube.position.x=-1

const sphereGeometry = new THREE.SphereGeometry()
const sphere = new THREE.Mesh(sphereGeometry, material)
sphere.position.x = 1
scene.add(sphere)

window.addEventListener('resize', onWindowResize, false)

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
}

const stats = Stats()
document.body.appendChild(stats.dom)

const gui = new GUI()
const cubeFolder = gui.addFolder('cube')
cubeFolder.add(cube.rotation, "x", 0, Math.PI * 2)
cubeFolder.add(cube.rotation, "y", 0, Math.PI * 2)
cubeFolder.add(cube.rotation, "z", 0, Math.PI * 2)
cubeFolder.open()

const lightFolder = gui.addFolder('light')
lightFolder.add(light, "intensity", 0, 1, .01)
lightFolder.add(light.position, "x", -5, 5, .01)
lightFolder.add(light.position, "y", -5, 5, .01)
lightFolder.add(light.position, "z", -5, 5, .01)

const cameraFolder = gui.addFolder('camera')
cameraFolder.add(camera.position, 'z', 0, 20)
cameraFolder.open()

function animate() {

    stats.update()

    cube.rotation.x += 0.01
    cube.rotation.y += 0.01

    outline.render(scene, camera)

}

renderer.setAnimationLoop(animate)