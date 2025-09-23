import {vec3} from 'gl-matrix';
import {vec4} from 'gl-matrix';
const Stats = require('stats-js');
import * as DAT from 'dat.gui';
import Icosphere from './geometry/Icosphere';
import Square from './geometry/Square';
import Cube from './geometry/Cube';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  tesselations: 5,
  'Load Scene': loadScene, // A function pointer, essentially
  frequency: 1.0,
  shape: 1,
  layerNum: 10.0,
  splashCount: 40.0,
  splashScaleVar: 2.0
};

let icosphere: Icosphere;
let square: Square;
let cube: Cube;
let prevTesselations: number = 7;
let time: number = 0.0;
let layerNum: number = 10.0;
let prevShape: number = 0;
let splashCount: number = 40.0;

function loadScene() {
  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 0.2, controls.tesselations);
  icosphere.create();
  square = new Square(vec3.fromValues(0, 0, 0));
  square.create();
  cube = new Cube(vec3.fromValues(0,0,0));
  cube.create();
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  var palette = {
    color1: [255, 234, 221, 1],
    color2: [16, 52, 134, 1], 
    color3: [249.9, 246.075, 237.15, 1],
    splashColor: [18, 24, 52, 1]
  };




  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.add(controls, 'tesselations', 0, 8).step(1);
  gui.add(controls, 'Load Scene');
  gui.addColor(palette, 'color1');
  gui.addColor(palette, 'color2');
  gui.addColor(palette, 'color3');
  gui.addColor(palette, 'splashColor');
  gui.add(controls, 'frequency', 0.1, 5.0).step(0.1);
  gui.add(controls, 'shape', 0, 1).step(1);
  gui.add(controls, 'layerNum', 1.0, 20.0).step(1.0);

  // Splash controls folder
  const splashControlsFolder = gui.addFolder("Splash Controls");
  splashControlsFolder.add(controls, 'splashCount', 0, 80).step(1);
  splashControlsFolder.add(controls, 'splashScaleVar', 0.0, 5.0).step(0.2);



  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(0, 0, 7), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(palette.color3[0] / 255, palette.color3[1] / 255, palette.color3[2] / 255, 1);
  // renderer.setClearColor(0.9, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  const custom = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/fireball-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/fireball-frag.glsl')),
  ]);

  const paper = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/postprocess-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/postprocess-frag.glsl')),
  ]);

  const ink = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/postprocess-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/ink-frag.glsl')),
  ]);

  // This function will be called every frame
  function tick() {
    renderer.setClearColor(palette.color3[0] / 255, palette.color3[1] / 255, palette.color3[2] / 255, 1);
    time += 1.0;
    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    if(controls.tesselations != prevTesselations)
    {
      prevTesselations = controls.tesselations;
      icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, prevTesselations);
      icosphere.create();
    }

    if(controls.shape != prevShape) {
      prevShape = controls.shape;
    }


    const sceneDrawables = (prevShape === 1) ? [icosphere] : [cube];
    renderer.renderInkScenePaper(
      camera,
      custom,
      ink,
      paper,
      sceneDrawables as any,
      square,
      vec4.fromValues(palette.color1[0] / 255, palette.color1[1] / 255, palette.color1[2] / 255, 1),
      vec4.fromValues(palette.color2[0] / 255, palette.color2[1] / 255, palette.color2[2] / 255, 1),
      vec4.fromValues(palette.splashColor[0] / 255, palette.splashColor[1] / 255, palette.splashColor[2] / 255, 1),
      controls.splashCount,
      controls.splashScaleVar,
      controls.frequency,
      time,
      controls.layerNum
    );
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  // Start the render loop
  tick();
}

main();
