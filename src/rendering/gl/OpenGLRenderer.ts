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

    // Unbind
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  }

  renderWithPost(camera: Camera, sceneProg: ShaderProgram, postProg: ShaderProgram, 
    drawables: Array<Drawable>, screenQuad: Drawable, 
    color1: vec4, color2: vec4, splashColor: vec4, splashCount: number, splashScaleVar: number,
    innerExp: number, outerExp: number, dispGain: number,
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
    sceneProg.setInnerExp(innerExp);
    sceneProg.setOuterExp(outerExp);
    sceneProg.setDispGain(dispGain),
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
};

export default OpenGLRenderer;
