import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import {GUI} from 'dat.gui'
import {OutlineEffect} from 'three/examples/jsm/effects/OutlineEffect'

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

import { TWEEN } from 'three/examples/jsm/libs/tween.module.min'

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
directionalLight.shadow.camera.far = 100
directionalLight.shadow.camera.left = -100
directionalLight.shadow.camera.right = 100
directionalLight.shadow.camera.top = 100
directionalLight.shadow.camera.bottom = -100
scene.add(directionalLight)
directionalLight.position.set(-4,5,3)

// const helper = new THREE.CameraHelper(directionalLight.shadow.camera)
// scene.add(helper)

const sceneMeshes : THREE.Mesh[] = []

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

const toonjointmaterial: THREE.MeshToonMaterial = new THREE.MeshToonMaterial({
  color: 0X1C5B72,
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
sceneMeshes.push(plane)

let mixer: THREE.AnimationMixer
let modelReady = false
let modelMesh = new THREE.Object3D
const animationActions: THREE.AnimationAction[] = []
let activeAction: THREE.AnimationAction
let lastAction: THREE.AnimationAction
const gltfLoader = new GLTFLoader()

const animations = {
  default: function () {
      setAction(animationActions[0])
  },
  cheering: function () {
      setAction(animationActions[1])
  },
  standing: function () {
      setAction(animationActions[2])
  },
  running: function () {
      setAction(animationActions[3])
  },
  walking: function(){
    setAction(animationActions[4])
  }
}

const setAction = (toAction: THREE.AnimationAction) => {
  if (toAction != activeAction) {
      lastAction = activeAction
      activeAction = toAction
      //lastAction.stop()
      lastAction.fadeOut(.5)
      activeAction.reset()
      activeAction.fadeIn(.5)
      activeAction.play()
  }
}

gltfLoader.load('models/FemaleTPose.glb', function (gltf) {
    gltf.scene.traverse(function(child){
      if ((child as THREE.Mesh).isMesh) {
          const m = (child as THREE.Mesh)

          switch(m.name){
            case 'Beta_Surface':{
              m.material = toonmaterial
              break;
            }
            case 'Beta_Joints':{
              m.material = toonjointmaterial
              break;
            }
          }

          m.castShadow = true
      }
    })
    
    scene.add(gltf.scene)
    gltf.scene.position.y = -1.5

    mixer = new THREE.AnimationMixer(gltf.scene)

    const animationAction = mixer.clipAction((gltf as any).animations[0])
    animationActions.push(animationAction)
    animationsFolder.add(animations, 'default')
    activeAction = animationActions[0]
    gltf.scene.scale.set(5,5,5)

    modelMesh = gltf.scene

    gltfLoader.load('models/animations/cheering.glb',(gltf) => {
            console.log('loaded cheering')
            const animationAction = mixer.clipAction((gltf as any).animations[0])
            animationActions.push(animationAction)
            animationsFolder.add(animations, 'cheering')

            gltfLoader.load('models/animations/standing.glb',(gltf) => {
                    console.log('loaded standing')
                    const animationAction = mixer.clipAction((gltf as any).animations[0])
                    animationActions.push(animationAction)
                    animationsFolder.add(animations, 'standing')

                    gltfLoader.load('models/animations/running.glb',(gltf) => {
                            console.log('loaded running');
                            
                            const animationAction = mixer.clipAction((gltf as any).animations[0])
                            animationActions.push(animationAction)
                            animationsFolder.add(animations, 'running')

                            gltfLoader.load('models/animations/walking.glb',(gltf) => {
                              console.log('loaded walking');
                              
                              const animationAction = mixer.clipAction((gltf as any).animations[0])
                              animationActions.push(animationAction)
                              animationsFolder.add(animations, 'walking')
  
                              modelReady = true

                              animations.standing()
                          },
                          (xhr) => console.log((xhr.loaded / xhr.total) * 100 + '% loaded'),
                          (error) => console.log(error)
                        )},
                        (xhr) => console.log((xhr.loaded / xhr.total) * 100 + '% loaded'),
                        (error) => console.log(error)
                    )
                },
                (xhr) => console.log((xhr.loaded / xhr.total) * 100 + '% loaded'),
                (error) => console.log(error)
            )
        },
        (xhr) => console.log((xhr.loaded / xhr.total) * 100 + '% loaded'),
        (error) => (console.log(error))
    )
  },
  (xhr) => console.log((xhr.loaded / xhr.total) * 100 + '% loaded'),
  (error) => (console.log(error))
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
    .add(directionalLight.shadow.camera, 'left', -100, 100, 0.1)
    .onChange(() => directionalLight.shadow.camera.updateProjectionMatrix())
directionalLightFolder
    .add(directionalLight.shadow.camera, 'right', -100, 100, 0.1)
    .onChange(() => directionalLight.shadow.camera.updateProjectionMatrix())
directionalLightFolder
    .add(directionalLight.shadow.camera, 'top', -100, 100, 0.1)
    .onChange(() => directionalLight.shadow.camera.updateProjectionMatrix())
directionalLightFolder
    .add(directionalLight.shadow.camera, 'bottom', -100, 100, 0.1)
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
  ToonJointsColor : number;
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
  "ToonJointsColor" : 0X1C5B72,
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
  toonmaterial.color.setHex(e)
})

materialFolder.addColor(config, "ToonJointsColor").onChange((e)=>{
  toonjointmaterial.color.setHex(e)
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

const animationsFolder = gui.addFolder('Animations')
animationsFolder.open()


const raycaster = new THREE.Raycaster()
const targetQuaternion = new THREE.Quaternion()

renderer.domElement.addEventListener('dblclick', onDoubleClick, false)

function onDoubleClick(event: MouseEvent) {
    
    const mouse = {
        x: (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
        y: -(event.clientY / renderer.domElement.clientHeight) * 2 + 1,
    }

    raycaster.setFromCamera(mouse, camera)

    const intersects = raycaster.intersectObjects(sceneMeshes, false)

    if (intersects.length > 0) {
        const p = intersects[0].point

        const distance = modelMesh.position.distanceTo(p)

        const rotationMatrix = new THREE.Matrix4()
        rotationMatrix.lookAt(p, modelMesh.position, modelMesh.up)
        targetQuaternion.setFromRotationMatrix(rotationMatrix)

        TWEEN.removeAll()
        setAction(animationActions[3])
        new TWEEN.Tween(modelMesh.position)
          .to({
            x: p.x,
            y: p.y,
            z: p.z
          }, 200 / 2 * distance)
          //.easing(TWEEN.Easing.Linear.None)
          .start()
          .onComplete(function(){
            setAction(animationActions[2])
          })
    }
}

renderer.domElement.addEventListener("click", onClick)

function onClick(e: MouseEvent) {

  const mouse = {
        x: (e.clientX / renderer.domElement.clientWidth) * 2 - 1,
        y: -(e.clientY / renderer.domElement.clientHeight) * 2 + 1,
    }
    
  raycaster.setFromCamera(mouse, camera)

  const intersects = raycaster.intersectObjects(sceneMeshes, false)

  if (intersects.length > 0) {
    const p = intersects[0].point

    const distance = modelMesh.position.distanceTo(p)

    const rotationMatrix = new THREE.Matrix4()
    rotationMatrix.lookAt(p, modelMesh.position, modelMesh.up)
    targetQuaternion.setFromRotationMatrix(rotationMatrix)

    TWEEN.removeAll()
    animations.walking()

    new TWEEN.Tween(modelMesh.position)
      .to({
        x: p.x,
        y: p.y,
        z: p.z
      }, 400 / 2 * distance)
      //.easing(TWEEN.Easing.Linear.None)
      .start()
      .onComplete(function(){
        setAction(animationActions[2])
      })
  }
}

const clock = new THREE.Clock()
function animate() {

    stats.update()

    if (modelReady) {mixer.update(clock.getDelta())}

    // helper.update()

    if(!modelMesh.quaternion.equals(targetQuaternion)){
      modelMesh.quaternion.rotateTowards(targetQuaternion, clock.getDelta() * 400)
    }

    camera.lookAt(new THREE.Vector3(0,3,0))

    outline.render(scene, camera)
    TWEEN.update()

}

renderer.setAnimationLoop(animate)