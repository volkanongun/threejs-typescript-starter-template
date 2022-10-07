import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import {GUI} from 'dat.gui'
import {OutlineEffect} from 'three/examples/jsm/effects/OutlineEffect'

import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x8E8B8B) // solid color

const offsetValues = [0.75, 0.6, 0.4, 0.25]

const icosohedron = new THREE.IcosahedronGeometry(300,2);
const backgroundGradientMaterial = new THREE.MeshBasicMaterial({ 
  map: gradientTexture(offsetValues, [new THREE.Color(0x1B1D1E),new THREE.Color(0x3D4143),new THREE.Color(0x72797D),new THREE.Color(0xb1018)]),
  side:THREE.DoubleSide
})
const backMesh = new THREE.Mesh( icosohedron, backgroundGradientMaterial );
scene.add(backMesh);

function gradientTexture(offset: number[], hexColors: THREE.Color[]) {
  const c = document.createElement("canvas");
  const ct = c.getContext("2d")!;
  const size = 1024;
  c.width = 1;
  c.height = size;

  const gradient = ct.createLinearGradient(0,size,0,0);
  let i = offset.length;
  
  while(i--){ 
    gradient.addColorStop(offset[i], "#" + hexColors[i].getHexString());
  }

  ct.fillStyle = gradient;
  ct.fillRect(0,0,16,size);
  const texture = new THREE.Texture(c);
  texture.needsUpdate = true;
  return texture;
}

const ambientLight = new THREE.AmbientLight( 0xFFFFFF, 0.16 );
scene.add( ambientLight );

const directionalLight = new THREE.DirectionalLight(0xE4E9ED, 1)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.width = 4096
directionalLight.shadow.mapSize.height = 4096
directionalLight.shadow.camera.near = 0.1
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.top = 8
scene.add(directionalLight)
directionalLight.position.set(-4,5,3)

// const helper = new THREE.CameraHelper(directionalLight.shadow.camera)
// scene.add(helper)

const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
)

camera.position.set(0,8,15)

const renderer = new THREE.WebGLRenderer({antialias: true})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const orbit = new OrbitControls(camera, renderer.domElement)
orbit.target.set(0,3,0)
orbit.minDistance = 10
orbit.maxDistance = 23

const outlineConfig = {
  defaultThickness: .005,
  defaultColor: [ .09, 0.17, 0.15 ],
  defaultAlpha: .8,
  defaultKeepAlive: true // keeps outline material in cache even if material is removed from scene
}

let outline = new OutlineEffect( renderer, outlineConfig);

const fiveTone = new THREE.TextureLoader().load('img/gradientMaps/fiveTone.jpg')
fiveTone.minFilter = THREE.NearestFilter
fiveTone.magFilter = THREE.NearestFilter

const geometry = new THREE.BoxGeometry()
const toonmaterial: THREE.MeshToonMaterial = new THREE.MeshToonMaterial({
    color: 0x18BFE3,
    gradientMap: fiveTone,
})

const cube = new THREE.Mesh(geometry, toonmaterial)
scene.add(cube)
cube.position.x = -3
cube.castShadow = true

const sphereGeometry = new THREE.SphereGeometry(.7)
const sphere = new THREE.Mesh(sphereGeometry, toonmaterial)
sphere.position.x = 3
scene.add(sphere)
sphere.castShadow = true

const planeGeometry = new THREE.PlaneGeometry(1000,1000)
const planeMaterial = new THREE.ShadowMaterial({
  color: 0x262931,
})

const plane = new THREE.Mesh(planeGeometry, planeMaterial)
scene.add(plane)
plane.rotation.set(-Math.PI/2,0,0)
plane.position.y = -1.5
plane.receiveShadow = true

const fbxLoader = new FBXLoader()

let mixer: THREE.AnimationMixer
let action
fbxLoader.load('models/FemaleWalking.fbx', function (model) {
  model.traverse(function(child){
    if ((child as THREE.Mesh).isMesh) {
          const m = (child as THREE.Mesh)
          m.material = toonmaterial
          m.castShadow = true
      }
    })
    scene.add(model)
    model.scale.set(.05,.05,.05)
    model.position.y = -1.5

    mixer = new THREE.AnimationMixer(model)

    const clip = THREE.AnimationClip.findByName(model.animations, "mixamo.com")
    action = mixer.clipAction(clip)
    action.play()     
  },
  (xhr) => {
      console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
  },
  (error) => {
      console.log(error)
  }
)

window.addEventListener('resize', onWindowResize, false)

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
}

const stats = Stats()
document.body.appendChild(stats.dom)

const gui = new GUI()
const cubeFolder = gui.addFolder('cube rotation')
cubeFolder.add(cube.rotation, "x", 0, Math.PI * 2)
cubeFolder.add(cube.rotation, "y", 0, Math.PI * 2)
cubeFolder.add(cube.rotation, "z", 0, Math.PI * 2)

const directionalLightFolder = gui.addFolder('DirectionalLight')
directionalLightFolder
    .add(directionalLight.shadow.camera, 'left', -10, -1, 0.1)
    .onChange(() => directionalLight.shadow.camera.updateProjectionMatrix())
directionalLightFolder
    .add(directionalLight.shadow.camera, 'right', 1, 10, 0.1)
    .onChange(() => directionalLight.shadow.camera.updateProjectionMatrix())
directionalLightFolder
    .add(directionalLight.shadow.camera, 'top', 1, 10, 0.1)
    .onChange(() => directionalLight.shadow.camera.updateProjectionMatrix())
directionalLightFolder
    .add(directionalLight.shadow.camera, 'bottom', -10, -1, 0.1)
    .onChange(() => directionalLight.shadow.camera.updateProjectionMatrix())
directionalLightFolder
    .add(directionalLight.shadow.camera, 'near', 0.1, 100)
    .onChange(() => directionalLight.shadow.camera.updateProjectionMatrix())
directionalLightFolder
    .add(directionalLight.shadow.camera, 'far', 0.1, 100)
    .onChange(() => directionalLight.shadow.camera.updateProjectionMatrix())
directionalLightFolder.add(directionalLight.position, 'x', -50, 50, 0.01)
directionalLightFolder.add(directionalLight.position, 'y', -50, 50, 0.01)
directionalLightFolder.add(directionalLight.position, 'z', -50, 50, 0.01)
directionalLightFolder.add(directionalLight, "intensity", 0, 1, .01)

const ambientLightFolder = gui.addFolder("AmibentLight")
ambientLightFolder.add(ambientLight, 'intensity', 0, 1, 0.01)
ambientLightFolder.open()

const cameraFolder = gui.addFolder('camera')
cameraFolder.add(camera.position, 'z', 0, 20)
cameraFolder.open()

const materialFolder = gui.addFolder('Material')

interface Config {
  ToonColor: number;
  OutlineR: number;
  OutlineG: number;
  OutlineB: number;
  ShadowColor: number;
  SceneColor: number;
  BGColor1: number;
  BGColor2: number;
  BGColor3: number;
  BGColor4: number;
}

const config: Config = {
  "ToonColor" : 0x18BFE3,
  "OutlineR": outlineConfig.defaultColor[0],
  "OutlineG": outlineConfig.defaultColor[1],
  "OutlineB": outlineConfig.defaultColor[2],
  "ShadowColor": 0x262931,
  "SceneColor": 0x8E8B8B,
  "BGColor1": 0x1B1D1E,
  "BGColor2": 0x3D4143,
  "BGColor3": 0x72797D,
  "BGColor4": 0xb1018
}

materialFolder.addColor(config, "ToonColor").onChange(function(e){
  sphere.material.color.setHex(e)
})

materialFolder.add(config, "OutlineR", 0, 1, .01).onChange((e)=>{outline = new OutlineEffect( renderer, {defaultColor:[e,config.OutlineG,config.OutlineB]})})
materialFolder.add(config, "OutlineG", 0, 1, .01).onChange((e)=>{outline = new OutlineEffect( renderer, {defaultColor:[config.OutlineR,e,config.OutlineB]})})
materialFolder.add(config, "OutlineB", 0, 1, .01).onChange((e)=>{outline = new OutlineEffect( renderer, {defaultColor:[config.OutlineR,config.OutlineG,e]})})

materialFolder.addColor(config, "ShadowColor").onChange(function(e){
  planeMaterial.color.setHex(e)
})
materialFolder.open()

const sceneColorFolder = gui.addFolder("SceneColor")
sceneColorFolder.addColor(config, "SceneColor").onChange((e)=>{
  scene.background = new THREE.Color(e)
})
sceneColorFolder.open()

const backgroundGradientCustomization = gui.addFolder("Background Gradient Customization")
backgroundGradientCustomization.addColor(config, "BGColor1").onChange((e)=>{
  backgroundGradientMaterial.map = gradientTexture(offsetValues, [new THREE.Color(e), new THREE.Color(config.BGColor2), new THREE.Color(config.BGColor3), new THREE.Color(config.BGColor4)])
  backMesh.material.needsUpdate = true
})
backgroundGradientCustomization.addColor(config, "BGColor2").onChange((e)=>{
  backgroundGradientMaterial.map = gradientTexture(offsetValues, [new THREE.Color(config.BGColor1), new THREE.Color(e), new THREE.Color(config.BGColor3), new THREE.Color(config.BGColor4)])
  backMesh.material.needsUpdate = true
})
backgroundGradientCustomization.addColor(config, "BGColor3").onChange((e)=>{
  backgroundGradientMaterial.map = gradientTexture(offsetValues, [new THREE.Color(config.BGColor1), new THREE.Color(config.BGColor2), new THREE.Color(e), new THREE.Color(config.BGColor4)])
  backMesh.material.needsUpdate = true
})
backgroundGradientCustomization.addColor(config, "BGColor4").onChange((e)=>{
  backgroundGradientMaterial.map = gradientTexture(offsetValues, [new THREE.Color(config.BGColor1), new THREE.Color(config.BGColor2), new THREE.Color(config.BGColor3), new THREE.Color(e)])
  backMesh.material.needsUpdate = true
})
backgroundGradientCustomization.open()

const clock = new THREE.Clock()
function animate() {

    stats.update()

    if(mixer)
        mixer.update(clock.getDelta())

    // helper.update()

    cube.rotation.x += 0.01
    cube.rotation.y += 0.01

    camera.lookAt(new THREE.Vector3(0,3,0))

    outline.render(scene, camera)

}

renderer.setAnimationLoop(animate)