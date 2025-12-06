import {vec4, mat4} from 'gl-matrix';
import Drawable from './Drawable';
import {gl} from '../../globals';

var activeProgram: WebGLProgram = null;

export class Shader {
  shader: WebGLShader;

  constructor(type: number, source: string) {
    this.shader = gl.createShader(type);
    gl.shaderSource(this.shader, source);
    gl.compileShader(this.shader);

    if (!gl.getShaderParameter(this.shader, gl.COMPILE_STATUS)) {
      throw gl.getShaderInfoLog(this.shader);
    }
  }
};

class ShaderProgram {
  prog: WebGLProgram;

  attrPos: number;
  attrNor: number;
  attrCol: number;

  unifModel: WebGLUniformLocation;
  unifModelInvTr: WebGLUniformLocation;
  unifViewProj: WebGLUniformLocation;
  unifColor1: WebGLUniformLocation;
  unifColor2: WebGLUniformLocation;

  // Splash
  unifSplashColor: WebGLUniformLocation;
  unifSplashCount: WebGLUniformLocation;
  unifSplashScaleVar: WebGLUniformLocation;

  // Fireball
  unifFreq: WebGLUniformLocation;
  unifLayerNum: WebGLUniformLocation;
  unifInnerExp: WebGLUniformLocation;
  unifOuterExp: WebGLUniformLocation;
  unifDispGain: WebGLUniformLocation;

  unifTime: WebGLUniformLocation;
  unifSceneTex: WebGLUniformLocation;
  unifResolution: WebGLUniformLocation;

  constructor(shaders: Array<Shader>) {
    this.prog = gl.createProgram();

    for (let shader of shaders) {
      gl.attachShader(this.prog, shader.shader);
    }
    gl.linkProgram(this.prog);
    if (!gl.getProgramParameter(this.prog, gl.LINK_STATUS)) {
      throw gl.getProgramInfoLog(this.prog);
    }

    this.attrPos = gl.getAttribLocation(this.prog, "vs_Pos");
    this.attrNor = gl.getAttribLocation(this.prog, "vs_Nor");
    this.attrCol = gl.getAttribLocation(this.prog, "vs_Col");
    this.unifModel      = gl.getUniformLocation(this.prog, "u_Model");
    this.unifModelInvTr = gl.getUniformLocation(this.prog, "u_ModelInvTr");
    this.unifViewProj   = gl.getUniformLocation(this.prog, "u_ViewProj");
    this.unifColor1      = gl.getUniformLocation(this.prog, "u_Color1");
    this.unifColor2      = gl.getUniformLocation(this.prog, "u_Color2");

    // Splash
    this.unifSplashColor      = gl.getUniformLocation(this.prog, "u_SplashColor");
    this.unifSplashCount  = gl.getUniformLocation(this.prog, "u_SplashCount");
    this.unifSplashScaleVar = gl.getUniformLocation(this.prog, 'u_SplashScaleVar');

    // Fireball
    this.unifInnerExp   = gl.getUniformLocation(this.prog, "u_InnerExp");
    this.unifOuterExp   = gl.getUniformLocation(this.prog, "u_OuterExp");
    this.unifLayerNum   = gl.getUniformLocation(this.prog, "u_LayerNum");
    this.unifDispGain   = gl.getUniformLocation(this.prog, "u_DispGain");

    this.unifFreq        = gl.getUniformLocation(this.prog, "u_Freq");
    this.unifTime       = gl.getUniformLocation(this.prog, "u_Time");
    this.unifSceneTex   = gl.getUniformLocation(this.prog, "u_SceneTex");
    this.unifResolution = gl.getUniformLocation(this.prog, "u_Resolution");
  }

  use() {
    if (activeProgram !== this.prog) {
      gl.useProgram(this.prog);
      activeProgram = this.prog;
    }
  }

  setModelMatrix(model: mat4) {
    this.use();
    if (this.unifModel !== -1) {
      gl.uniformMatrix4fv(this.unifModel, false, model);
    }

    if (this.unifModelInvTr !== -1) {
      let modelinvtr: mat4 = mat4.create();
      mat4.transpose(modelinvtr, model);
      mat4.invert(modelinvtr, modelinvtr);
      gl.uniformMatrix4fv(this.unifModelInvTr, false, modelinvtr);
    }
  }

  setViewProjMatrix(vp: mat4) {
    this.use();
    if (this.unifViewProj !== -1) {
      gl.uniformMatrix4fv(this.unifViewProj, false, vp);
    }
  }

  setGeometryColor1(color: vec4) {
    this.use();
    if (this.unifColor1 !== -1) {
      gl.uniform4fv(this.unifColor1, color);
    }
  }

  setGeometryColor2(color: vec4) {
    this.use();
    if (this.unifColor2 !== -1) {
      gl.uniform4fv(this.unifColor2, color);
    }
  }

  setGeometrySplashColor(color: vec4) {
    this.use();
    if (this.unifSplashColor !== -1) {
      gl.uniform4fv(this.unifSplashColor, color);
    }
  }

  setSplashCount(splashCount: number) {
    this.use();
    if (this.unifSplashCount !== -1) {
      gl.uniform1f(this.unifSplashCount, splashCount);
    }
  }

  setSplashScaleVar(splashScaleVar: number) {
    this.use();
    if (this.unifSplashScaleVar !== -1) {
      gl.uniform1f(this.unifSplashScaleVar, splashScaleVar);
    }
  }

  setInnerExp(innerExp: number) {
    this.use();
    if (this.unifInnerExp !== -1) {
      gl.uniform1f(this.unifInnerExp, innerExp);
    }
  }
  
  setOuterExp(outerExp: number) {
    this.use();
    if (this.unifOuterExp !== -1) {
      gl.uniform1f(this.unifOuterExp, outerExp);
    }
  }

  setDispGain(dispGain: number) {
    this.use();
    if (this.unifDispGain !== -1) {
      gl.uniform1f(this.unifDispGain, dispGain);
    }
  }

  setFreq(freq: number) {
    this.use();
    if (this.unifFreq !== -1) {
      gl.uniform1f(this.unifFreq, freq);
    }
  }

  setTime(time: number) {
    this.use();
    if (this.unifTime !== -1) {
      gl.uniform1f(this.unifTime, time);
    }
  }

  setLayerNum(layerNum: number) {
    this.use();
    if (this.unifLayerNum !== -1) {
      gl.uniform1f(this.unifLayerNum, layerNum);
    }
  }

  setSceneTexture(texUnit: number) {
    this.use();
    if (this.unifSceneTex !== -1) {
      gl.uniform1i(this.unifSceneTex, texUnit);
    }
  }

  setResolution(width: number, height: number) {
    this.use();
    if (this.unifResolution !== -1) {
      gl.uniform2f(this.unifResolution, width, height);
    }
  }

  draw(d: Drawable) {
    this.use();

    if (this.attrPos != -1 && d.bindPos()) {
      gl.enableVertexAttribArray(this.attrPos);
      gl.vertexAttribPointer(this.attrPos, 4, gl.FLOAT, false, 0, 0);
    }

    if (this.attrNor != -1 && d.bindNor()) {
      gl.enableVertexAttribArray(this.attrNor);
      gl.vertexAttribPointer(this.attrNor, 4, gl.FLOAT, false, 0, 0);
    }

    d.bindIdx();
    gl.drawElements(d.drawMode(), d.elemCount(), gl.UNSIGNED_INT, 0);

    if (this.attrPos != -1) gl.disableVertexAttribArray(this.attrPos);
    if (this.attrNor != -1) gl.disableVertexAttribArray(this.attrNor);
  }
};

export default ShaderProgram;
