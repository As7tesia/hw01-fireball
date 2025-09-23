import {mat4, vec4} from 'gl-matrix';
import Drawable from './Drawable';
import Camera from '../../Camera';
import {gl} from '../../globals';
import ShaderProgram from './ShaderProgram';

// In this file, `gl` is accessible because it is imported above
class OpenGLRenderer {
  framebuffer: WebGLFramebuffer;
  colorTex: WebGLTexture;
  depthRbo: WebGLRenderbuffer;
  inkFramebuffer: WebGLFramebuffer;
  inkTex: WebGLTexture;
  constructor(public canvas: HTMLCanvasElement) {
  }

  setClearColor(r: number, g: number, b: number, a: number) {
    gl.clearColor(r, g, b, a);
  }

  setSize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.setupFramebuffer();
  }

  clear() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  // render(camera: Camera, prog: ShaderProgram, drawables: Array<Drawable>, color1: vec4, color2: vec4, freq: number, time: number) {
  //   let model = mat4.create();
  //   let viewProj = mat4.create();
  //   // let color = vec4.fromValues(1, 1, 1, 1);

  //   mat4.identity(model);
  //   mat4.multiply(viewProj, camera.projectionMatrix, camera.viewMatrix);
  //   prog.setModelMatrix(model);
  //   prog.setViewProjMatrix(viewProj);
  //   prog.setGeometryColor1(color1);
  //   prog.setGeometryColor2(color2);
  //   prog.setFreq(freq);
  //   prog.setTime(time);

  //   for (let drawable of drawables) {
  //     prog.draw(drawable);
  //   }
  // }

  private setupFramebuffer() {
    // Clean up previous resources
    if (this.framebuffer) {
      gl.deleteFramebuffer(this.framebuffer);
      this.framebuffer = null as any;
    }
    if (this.colorTex) {
      gl.deleteTexture(this.colorTex);
      this.colorTex = null as any;
    }
    if (this.depthRbo) {
      gl.deleteRenderbuffer(this.depthRbo);
      this.depthRbo = null as any;
    }
    if (this.inkFramebuffer) {
      gl.deleteFramebuffer(this.inkFramebuffer);
      this.inkFramebuffer = null as any;
    }
    if (this.inkTex) {
      gl.deleteTexture(this.inkTex);
      this.inkTex = null as any;
    }

    const width = this.canvas.width;
    const height = this.canvas.height;

    // Create color texture
    this.colorTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.colorTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    // Create depth renderbuffer
    this.depthRbo = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthRbo);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);

    // Create framebuffer and attach
    this.framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.colorTex, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depthRbo);

    // Create ink color texture
    this.inkTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.inkTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    // Create ink framebuffer and attach (no depth needed)
    this.inkFramebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.inkFramebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.inkTex, 0);

    // Unbind
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  }

  renderWithPost(camera: Camera, sceneProg: ShaderProgram, postProg: ShaderProgram, 
    drawables: Array<Drawable>, screenQuad: Drawable, 
    color1: vec4, color2: vec4, splashColor: vec4, splashCount: number,
    splashScaleVar: number,
    freq: number, time: number, layerNum: number) {
    // Renderto framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.clear();

    let model = mat4.create();
    let viewProj = mat4.create();
    mat4.identity(model);
    mat4.multiply(viewProj, camera.projectionMatrix, camera.viewMatrix);
    sceneProg.setModelMatrix(model);
    sceneProg.setViewProjMatrix(viewProj);
    sceneProg.setGeometryColor1(color1);
    sceneProg.setGeometryColor2(color2);
    sceneProg.setFreq(freq);
    sceneProg.setTime(time);
    sceneProg.setLayerNum(layerNum);
    for (let drawable of drawables) {
      sceneProg.draw(drawable);
    }

    // Post-process pass to default framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.disable(gl.DEPTH_TEST);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.clear();

    // Bind texture
    postProg.setModelMatrix(mat4.create());
    postProg.setViewProjMatrix(mat4.create());
    postProg.setTime(time);
    postProg.setGeometryColor1(color1);
    postProg.setGeometryColor2(color2);
    postProg.setGeometrySplashColor(splashColor);
    postProg.setSplashCount(splashCount);
    postProg.setSplashScaleVar(splashScaleVar);
    postProg.setResolution(this.canvas.width, this.canvas.height);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.colorTex);
    postProg.setSceneTexture(0);
    postProg.draw(screenQuad);

    gl.enable(gl.DEPTH_TEST);
  }
  
  renderInkScenePaper(
    camera: Camera,
    sceneProg: ShaderProgram,
    inkProg: ShaderProgram,
    paperProg: ShaderProgram,
    drawables: Array<Drawable>,
    screenQuad: Drawable,
    color1: vec4,
    color2: vec4,
    splashColor: vec4,
    splashCount: number,
    splashScaleVar: number,
    freq: number,
    time: number,
    layerNum: number
  ) {
    // Pass 1: Ink to ink framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.inkFramebuffer);
    gl.disable(gl.DEPTH_TEST);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    this.clear();

    inkProg.setModelMatrix(mat4.create());
    inkProg.setViewProjMatrix(mat4.create());
    inkProg.setTime(time);
    inkProg.setGeometryColor1(color1);
    inkProg.setGeometrySplashColor(splashColor);
    inkProg.setSplashCount(splashCount);
    inkProg.setSplashScaleVar(splashScaleVar);
    inkProg.setResolution(this.canvas.width, this.canvas.height);
    inkProg.draw(screenQuad);

    // Pass 2: Scene (fireball) to scene framebuffer with alpha
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.enable(gl.DEPTH_TEST);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    // Clear with alpha 0 so background remains transparent
    gl.clearColor(0, 0, 0, 0);
    this.clear();

    let model = mat4.create();
    let viewProj = mat4.create();
    mat4.identity(model);
    mat4.multiply(viewProj, camera.projectionMatrix, camera.viewMatrix);
    sceneProg.setModelMatrix(model);
    sceneProg.setViewProjMatrix(viewProj);
    sceneProg.setGeometryColor1(color1);
    sceneProg.setGeometryColor2(color2);
    sceneProg.setFreq(freq);
    sceneProg.setTime(time);
    sceneProg.setLayerNum(layerNum);
    for (let drawable of drawables) {
      sceneProg.draw(drawable);
    }

    // Pass 3: Paper + composite to default framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.disable(gl.DEPTH_TEST);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.clear();

    paperProg.setModelMatrix(mat4.create());
    paperProg.setViewProjMatrix(mat4.create());
    paperProg.setTime(time);
    paperProg.setGeometryColor1(color1);
    paperProg.setGeometryColor2(color2);
    paperProg.setResolution(this.canvas.width, this.canvas.height);
    // Bind scene texture to unit 0
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.colorTex);
    paperProg.setSceneTexture(0);
    // Bind ink texture to unit 1
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.inkTex);
    paperProg.setInkTexture(1);
    paperProg.draw(screenQuad);

    gl.enable(gl.DEPTH_TEST);
  }

  renderInkOnly(
    inkProg: ShaderProgram,
    screenQuad: Drawable,
    color1: vec4,
    splashColor: vec4,
    splashCount: number,
    splashScaleVar: number,
    time: number
  ) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.disable(gl.DEPTH_TEST);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.clear();

    inkProg.setModelMatrix(mat4.create());
    inkProg.setViewProjMatrix(mat4.create());
    inkProg.setTime(time);
    inkProg.setGeometryColor1(color1);
    inkProg.setGeometrySplashColor(splashColor);
    inkProg.setSplashCount(splashCount);
    inkProg.setSplashScaleVar(splashScaleVar);
    inkProg.setResolution(this.canvas.width, this.canvas.height);
    inkProg.draw(screenQuad);

    gl.enable(gl.DEPTH_TEST);
  }

  renderSceneOnly(
    camera: Camera,
    sceneProg: ShaderProgram,
    drawables: Array<Drawable>,
    color1: vec4,
    color2: vec4,
    freq: number,
    time: number,
    layerNum: number
  ) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.enable(gl.DEPTH_TEST);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.clear();

    let model = mat4.create();
    let viewProj = mat4.create();
    mat4.identity(model);
    mat4.multiply(viewProj, camera.projectionMatrix, camera.viewMatrix);
    sceneProg.setModelMatrix(model);
    sceneProg.setViewProjMatrix(viewProj);
    sceneProg.setGeometryColor1(color1);
    sceneProg.setGeometryColor2(color2);
    sceneProg.setFreq(freq);
    sceneProg.setTime(time);
    sceneProg.setLayerNum(layerNum);
    for (let drawable of drawables) {
      sceneProg.draw(drawable);
    }
  }
};

export default OpenGLRenderer;
