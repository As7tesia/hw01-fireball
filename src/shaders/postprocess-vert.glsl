#version 300 es

precision highp float;

uniform mat4 u_Model;
uniform mat4 u_ViewProj;

in vec4 vs_Pos;
in vec4 vs_Nor;

out vec2 v_UV;

void main() {
  gl_Position = u_ViewProj * u_Model * vs_Pos;
  v_UV = vs_Pos.xy * 0.5 + 0.5;
}


