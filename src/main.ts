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
  'Reset Scene': loadScene, // A function pointer, essentially
  frequency: 1.0,
  innerExponent: 5.25,
  outerExponent: 2.0,
  dispGain: 1.0,
  // shape: 1,
  layerNum: 10.0,
  splashCount: 40.0,
  splashScaleVar: 2.0
};

let icosphere: Icosphere;
let square: Square;
let cube: Cube;
let prevTesselations: number = 7;
let time: number = 0.0;
// let layerNum: number = 10.0;
// let prevShape: number = 0;
let savedGui: dat.GUI;
// let splashCount: number = 40.0;

var palette = {
  color1: [255, 234, 221, 1],
  color2: [16, 52, 134, 1], 
  paperColor: [249.9, 246.075, 237.15, 1],
  splashColor: [18, 24, 52, 1]
};

function loadScene() {
  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 0.2, controls.tesselations);
  icosphere.create();
  square = new Square(vec3.fromValues(0, 0, 0));
  square.create();
  cube = new Cube(vec3.fromValues(0,0,0));
  cube.create();
  resetScene();
}

function resetScene() {
  savedGui.__controllers.forEach(c => c.updateDisplay());
  controls.tesselations = 5;
  controls.frequency = 2.0;
  controls.innerExponent = 5.25;
  controls.outerExponent = 2.0;
  controls.dispGain = 1.0;
  controls.layerNum = 10.0;
  controls.splashCount = 40.0;
  controls.splashScaleVar = 2.0;
  prevTesselations = 7;

  palette.color1 = [255, 234, 221, 1];
  palette.color2 = [16, 52, 134, 1];
  palette.paperColor = [249.9, 246.075, 237.15, 1];
  palette.splashColor = [18, 24, 52, 1];
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.add(controls, 'tesselations', 0, 8).step(1);
  gui.add(controls, 'Reset Scene');
  gui.addColor(palette, 'color1');
  gui.addColor(palette, 'color2');
  gui.addColor(palette, 'paperColor');
  gui.addColor(palette, 'splashColor');
  // gui.add(controls, 'frequency', 0.1, 5.0).step(0.1);
  // gui.add(controls, 'shape', 0, 1).step(1);
  // gui.add(controls, 'layerNum', 1.0, 20.0).step(1.0);
  savedGui = gui;

  // Splash controls folder
  const splashControlsFolder = gui.addFolder("Splash Controls");
  splashControlsFolder.add(controls, 'splashCount', 0, 80).step(1);
  splashControlsFolder.add(controls, 'splashScaleVar', 0.0, 5.0).step(0.2);

  // Fireball controls folder
  const fireballControlsFolder = gui.addFolder("Fireball Controls");
  fireballControlsFolder.add(controls, 'innerExponent', 0.0, 10.0).step(0.2);
  fireballControlsFolder.add(controls, 'outerExponent', 0.0, 10.0).step(0.2);
  fireballControlsFolder.add(controls, 'frequency', 0.1, 5.0).step(0.1);
  fireballControlsFolder.add(controls, 'layerNum', 1.0, 20.0).step(1.0);
  fireballControlsFolder.add(controls, 'dispGain', 0.0, 2.0).step(0.1);


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
  renderer.setClearColor(palette.paperColor[0] / 255, palette.paperColor[1] / 255, palette.paperColor[2] / 255, 1);
  // renderer.setClearColor(0.9, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  const custom = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/fireball-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/fireball-frag.glsl')),
  ]);

  const post = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/postprocess-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/postprocess-frag.glsl')),
  ]);

  // This function will be called every frame
  function tick() {
    renderer.setClearColor(palette.paperColor[0] / 255, palette.paperColor[1] / 255, palette.paperColor[2] / 255, 1);
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

    const sceneDrawables = [icosphere];
    renderer.renderWithPost(
      camera,
      custom,
      post,
      sceneDrawables as any,
      square,
      vec4.fromValues(palette.color1[0] / 255, palette.color1[1] / 255, palette.color1[2] / 255, 1),
      vec4.fromValues(palette.color2[0] / 255, palette.color2[1] / 255, palette.color2[2] / 255, 1),
      vec4.fromValues(palette.splashColor[0] / 255, palette.splashColor[1] / 255, palette.splashColor[2] / 255, 1),
      controls.splashCount,
      controls.splashScaleVar,
      controls.innerExponent,
      controls.outerExponent,
      controls.dispGain,
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
