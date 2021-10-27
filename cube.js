"use strict";

////// Imports //////
//import * as THREE from '../../node_modules/three/build/three.module.js';
//import { OrbitControls } from '../../node_modules/three/examples/jsm/controls/OrbitControls.js';
import { project23d, Rotor4D } from './4dfuncs.js';

////// JQuery stuff //////
$(document).ready(function(){
  $('#resetButto').click(resetSliders);
  $('#cellSel').change(changeCell);
  $('#faceToggle').click(function(){hyperObject.createMeshes();});
}); 


////// Generic Functions //////
function arrayEquals(a, b) {
  return Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((val, index) => val === b[index]);
}


////// Objects and Global Variables //////
var scene, camera, renderer;
const planes = ["xy","xz","yz","xw","yw","zw"];
const clock = new THREE.Clock();
var sliderDTime = 0.0;
const interval = 0.02;

var hyperObject = {
  rotation: [0,0,0,0,0,0],
  material: new THREE.MeshPhongMaterial( { color: 0x2194ce, shininess: 100 } ),
  // material: new THREE.MeshToonMaterial( { color: 0x2194ce, gradientMap: THREE.threeTone } ),
  thickness: 0.05,
  camWDist: -3,
  
  xUp: [1,0,0,0],
  yUp: [0,1,0,0],
  zUp: [0,0,1,0],
  wUp: [0,0,0,1],

  loadData: function(cellName){
    let url = "./json/" + cellName + ".json";

    let json = (function () {
      var json = null;
      $.ajax({
        'async': false,
        'global': false,
        'url': url,
        'dataType': "json",
        'crossDomain': true,
        'success': function (data) {
          json = data;
        }
      });
      return json;
    })();
    
    this.points4D = json.points;
    this.connections = json.connections;
    this.faces = json.faces;
    this.thickness = json.optimalThickness;
    this.camWDist = json.optimalCamW;
    
    this.createMeshes();

  },

  proj23d: function(){
    this.points3D = project23d(this.rotPoints4D, this.camWDist);
  },

  createMeshes: function(){
      if ('meshes' in this) {
        for (let mesh of this.meshes){
          scene.remove(mesh);
        }
        for (let mesh of this.faceMeshes){
          scene.remove(mesh);
        }
      }

    this.setRotation([0,0,0,0,0,0]);
    this.proj23d();

    const conectionGeometry = new THREE.CylinderBufferGeometry(this.thickness,this.thickness,1,20);
    conectionGeometry.rotateX(math.PI/2);
    const pointGeometry = new THREE.SphereBufferGeometry(this.thickness,20,20);

    this.meshes = [];
    for (let connection of this.connections){
      let mesh = new THREE.Mesh( conectionGeometry, this.material );
      this.meshes.push( mesh );
    }

    for ( let x in this.points4D[0] ){
      let mesh = new THREE.Mesh( pointGeometry, this.material );
      this.meshes.push( mesh );
    }
    
    this.faceMeshes = []
    if (document.getElementById("faceToggle").checked){
      for ( let face of this.faces ){
        const shape = new THREE.Shape();
        switch (face.length){
          case 3:
            shape.moveTo( -1, -1 );
            shape.lineTo( -1, 1 );
            shape.lineTo( 1, -1 );
            shape.lineTo( -1, -1 );
            break
          case 4:
            shape.moveTo( -1, -1 );
            shape.lineTo( -1, 1 );
            shape.lineTo( 1, 1 );
            shape.lineTo( 1, -1 );
            shape.lineTo( -1, -1 );
            break
          case 5:
            shape.moveTo( -1, -1 );
            shape.lineTo( -1, 1 );
            shape.lineTo( 1, 1 );
            shape.lineTo( 1.5, 1 );
            shape.lineTo( 1, -1 );
            shape.lineTo( -1, -1 );
            break
        } 

        // Create gemotry and mesh
        const geometry = new THREE.ShapeBufferGeometry( shape );
        const material = new THREE.MeshPhysicalMaterial( { color: 0x2194ce, side: THREE.DoubleSide, opacity: 0.3, transparent: true, clearcoat: 1.0, reflectivity: 1.0, roughness: 0.0, flatShading: true, premultipliedAlpha: true, precision: "highp", depthWrite: false } );
        const mesh = new THREE.Mesh( geometry, material ) ;
        this.faceMeshes.push( mesh );
      }
    }

    for (let mesh of this.meshes){
      mesh.castShadow = true;
      scene.add(mesh);
    }
    for (let mesh of this.faceMeshes){
      scene.add(mesh);
    }

  },

  setRotation: function(rotation) {
    this.rotation = rotation;
    
    let xUp = [1,0,0,0];
    let yUp = [0,1,0,0];
    let zUp = [0,0,1,0];
    let wUp = [0,0,0,1];

    // This is the only way to clone the array without making the program cursed
    this.rotPoints4D = [Array.from(this.points4D[0]),Array.from(this.points4D[1]),Array.from(this.points4D[2]),Array.from(this.points4D[3])];

    for ( var eh in rotation ){
      if (math.round(rotation[eh], 3) == 0) { continue };
      
      switch(Number(eh)){
        case 0:
          Rotor4D.plane = [yUp,xUp]; 
          break;
        case 1:
          Rotor4D.plane = [zUp,xUp]; 
          break;
        case 2:
          Rotor4D.plane = [zUp,yUp]; 
          break;
        case 3:
          Rotor4D.plane = [xUp,wUp]; 
          break;
        case 4:
          Rotor4D.plane = [yUp,wUp]; 
          break
        case 5:
          Rotor4D.plane = [zUp,wUp]; 
          break;
      }

      Rotor4D.angle = rotation[eh];

      Rotor4D.recalcRotor();

      this.rotPoints4D = Rotor4D.rotate(this.rotPoints4D);

      xUp = Rotor4D.rotate(xUp);
      yUp = Rotor4D.rotate(yUp);
      zUp = Rotor4D.rotate(zUp);
      wUp = Rotor4D.rotate(wUp);
    }

    this.xUp = xUp;
    this.yUp = yUp;
    this.zUp = zUp;
    this.wUp = wUp;

  },

  updateMeshes: function(){
    let concount = Number(this.connections.length);
    
    let i = 0;
    for ( var connection of this.connections ){
      this.meshes[i].position.set(0,0,0);

      let pt1 = [this.points3D[0][connection[0]],this.points3D[1][connection[0]],this.points3D[2][connection[0]]];
      let pt2 = [this.points3D[0][connection[1]],this.points3D[1][connection[1]],this.points3D[2][connection[1]]];
      
      let length = math.distance(pt1,pt2);
      this.meshes[i].scale.z = length;
      
      this.meshes[i].lookAt(new THREE.Vector3(pt2[0]-pt1[0],pt2[1]-pt1[1],pt2[2]-pt1[2]).normalize());

      let translation = math.divide(math.add(pt1,pt2),2);
      this.meshes[i].position.set(translation[0], translation[1], translation[2]);
      
      i += 1;
    }

    for ( i in this.rotPoints4D[0] ){
      let j = Number(i) + concount;
      this.meshes[j].position.set(this.points3D[0][i], this.points3D[1][i], this.points3D[2][i]);
    }

    for ( i in this.faceMeshes ){
      let mesh = this.faceMeshes[i];
      let face = this.faces[i];
      
      let xBar = 0;
      let yBar = 0;
      let zBar = 0;
      for (let point of face){
        xBar += this.points3D[0][point];
        yBar += this.points3D[1][point];
        zBar += this.points3D[2][point];
      }
      xBar /= face.length;
      yBar /= face.length;
      zBar /= face.length;
      
      let j = 0;
      for (let point of face){
        mesh.geometry.attributes.position.array[j] = this.points3D[0][point] - xBar;
        mesh.geometry.attributes.position.array[j+1] = this.points3D[1][point] - yBar;
        mesh.geometry.attributes.position.array[j+2] = this.points3D[2][point] - zBar;

        j += 3;
      }
      
      mesh.geometry.attributes.position.needsUpdate = true;
      
      mesh.position.set(xBar, yBar, zBar);
    }
  }
};


function init(){
  ////////// AAAAAAAAAAAA //////////
  const sceneWidth = document.getElementById("rendercanvas").clientWidth;
  const sceneHeight = document.getElementById("rendercanvas").clientHeight;
  const canv = document.getElementById("rendercanvas");

  ////////// Inital Setup //////////
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 75, sceneWidth / sceneHeight, 0.1, 1000 );
  renderer = new THREE.WebGLRenderer({canvas: canv, antialias: true, alpha: true, sortObjects: false});

  scene.background = new THREE.Color( 0xffdf06 );
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.enabled = true;
  renderer.setSize( sceneWidth, sceneHeight );
  // document.getElementById("scene").appendChild( renderer.domElement );
  
  const controls = new THREE.OrbitControls( camera, renderer.domElement );

  ////////// Scene Setup //////////
  // Camera
  camera.position.set(0,2,-5);
  camera.lookAt( new THREE.Vector3(0,0,0) );
  controls.update(); // OrbitControls must be updated after changes to camera position/rotation

  
  // Objects
  const floorGeometry = new THREE.PlaneGeometry(22, 22);
  const floorMaterial = new THREE.ShadowMaterial({ opacity: .3 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.name = 'floor';
  floor.position.y = -4;
  floor.rotateX(- Math.PI / 2);
  floor.receiveShadow = true;

  scene.add(floor);

  hyperObject.loadData("cell8");
  hyperObject.updateMeshes();

  // Lighting
  const ambientLight = new THREE.AmbientLight( 0xc4c4c4, 0.7);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.position.y = 10;
  scene.add( directionalLight );

  // const helper = new THREE.DirectionalLightHelper( directionalLight, 5 );
  // scene.add( helper );

  clock.start();
}

function animate(){

  sliderDTime += clock.getDelta();
  if (sliderDTime > 5){
    sliderDTime = 5;
  }
  while (sliderDTime > interval){
    sliderTest();
    sliderDTime -= interval;
  }
  
  let xyrot = $('#xy_slider').val() * (math.PI / 180)
  let xzrot = $('#xz_slider').val() * (math.PI / 180)
  let yzrot = $('#yz_slider').val() * (math.PI / 180)
  let xwrot = $('#xw_slider').val() * (math.PI / 180)
  let ywrot = $('#yw_slider').val() * (math.PI / 180)
  let zwrot = $('#zw_slider').val() * (math.PI / 180)
  
  // Update hyperObject if rotation has changed
  if ( !arrayEquals(hyperObject.rotation, [xyrot,xzrot,yzrot,xwrot,ywrot,zwrot]) ){
    hyperObject.setRotation([xyrot,xzrot,yzrot,xwrot,ywrot,zwrot]);
    hyperObject.proj23d();
    hyperObject.updateMeshes();
  }

  renderer.render( scene, camera );

  requestAnimationFrame( animate );
}

function sliderTest(){
  for (let plane of planes){
    let sleeder = $('#' + plane + '_slider');
    if (document.getElementById(plane + "_checkbox").checked) {
      if (sleeder.val() == 360){
        sleeder.val(0)
      } else {
        sleeder.val(Number(sleeder.val()) + 1);
      }
    }
  }
}

function resetSliders(){
  for (let plane of planes){
    let sleeder = $('#' + plane + '_slider');
    sleeder.val(180);
  }
}

// Resize canvas on window resize
window.addEventListener( 'resize', onWindowResize, false );
function onWindowResize(){
  let sceneWidth = $('#scene').width();
  let sceneHeight = $('#scene').height();

  if (sceneWidth/sceneHeight < 1){
    sceneHeight = sceneHeight - 420;
  }
  
  $('#rendercanvas').width(sceneWidth);
  $('#rendercanvas').height(sceneHeight);

  camera.aspect = sceneWidth / sceneHeight;
  camera.updateProjectionMatrix();
  
  renderer.setSize( sceneWidth, sceneHeight );

}

function changeCell(){
  let cellType = $('#cellSel').val();
  hyperObject.loadData(cellType);
}


init();
animate();