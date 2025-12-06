#version 300 es
precision highp float;

uniform vec2 u_Resolution;
uniform float u_Time;
uniform vec4 u_Color1; // base background color (paper base)
uniform vec4 u_SplashColor;
uniform float u_SplashCount;
uniform float u_SplashScaleVar;

in vec2 v_UV;
out vec4 out_Col;

float random1 (float x) {
  float f = 43758.5453123;
  return fract(sin(x) * f);
}

float random1fr (float x) {
  float f = 43758.5453123;
  return 2. * fract(sin(x) * f) - 1.;
}

// Simple Perlin helpers (trimmed)
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);} 
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

vec3 gradientDirection(uint hash) {
  switch (int(hash) & 15) {
    case 0: return vec3(1, 1, 0);
    case 1: return vec3(-1, 1, 0);
    case 2: return vec3(1, -1, 0);
    case 3: return vec3(-1, -1, 0);
    case 4: return vec3(1, 0, 1);
    case 5: return vec3(-1, 0, 1);
    case 6: return vec3(1, 0, -1);
    case 7: return vec3(-1, 0, -1);
    case 8: return vec3(0, 1, 1);
    case 9: return vec3(0, -1, 1);
    case 10: return vec3(0, 1, -1);
    case 11: return vec3(0, -1, -1);
    case 12: return vec3(1, 1, 0);
    case 13: return vec3(-1, 1, 0);
    case 14: return vec3(0, -1, 1);
    case 15: return vec3(0, -1, -1);
  }
}

uint hash(uint x, uint seed) {
  const uint m = 0x5bd1e995U;
  uint h = seed;
  uint k = x;
  k *= m; k ^= k >> 24; k *= m;
  h *= m; h ^= k;
  h ^= h >> 13; h *= m; h ^= h >> 15;
  return h;
}

uint hash(uvec3 x, uint seed){
  const uint m = 0x5bd1e995U;
  uint h = seed;
  uint k = x.x; k *= m; k ^= k >> 24; k *= m; h *= m; h ^= k;
  k = x.y; k *= m; k ^= k >> 24; k *= m; h *= m; h ^= k;
  k = x.z; k *= m; k ^= k >> 24; k *= m; h *= m; h ^= k;
  h ^= h >> 13; h *= m; h ^= h >> 15;
  return h;
}

float interpolate(float v1, float v2, float v3, float v4, float v5, float v6, float v7, float v8, vec3 t) {
  return mix(
    mix(mix(v1, v2, t.x), mix(v3, v4, t.x), t.y),
    mix(mix(v5, v6, t.x), mix(v7, v8, t.x), t.y),
    t.z
  );
}

vec3 fade(vec3 t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }

// 2D Perlin noise (fast) adapted from https://www.shadertoy.com/view/XdcXzH
// Uses cosine interpolation and a sine-based hash. Good visual quality and cheaper than 3D.
#define _PerlinPrecision 8.0
#define _PerlinOctaves 8.0
#define _PerlinSeed 0.0

float rnd2(vec2 xy) {
  return fract(sin(dot(xy, vec2(12.9898 - _PerlinSeed, 78.233 + _PerlinSeed))) * (43758.5453 + _PerlinSeed));
}

float inter2(float a, float b, float x) {
  float f = (1.0 - cos(x * 3.1415927)) * 0.5;
  return a * (1.0 - f) + b * f;
}

float perlin2D(vec2 uv) {
  float a,b,c,d, coef1, coef2, t, p;
  t = _PerlinPrecision;
  p = 0.0;
  for (float i = 0.0; i < _PerlinOctaves; i++) {
    a = rnd2(vec2(floor(t*uv.x)/t, floor(t*uv.y)/t));
    b = rnd2(vec2(ceil(t*uv.x)/t,  floor(t*uv.y)/t));
    c = rnd2(vec2(floor(t*uv.x)/t, ceil(t*uv.y)/t));
    d = rnd2(vec2(ceil(t*uv.x)/t,  ceil(t*uv.y)/t));

    if ((ceil(t*uv.x)/t) == 1.0) {
      b = rnd2(vec2(0.0, floor(t*uv.y)/t));
      d = rnd2(vec2(0.0, ceil(t*uv.y)/t));
    }

    coef1 = fract(t * uv.x);
    coef2 = fract(t * uv.y);
    p += inter2(inter2(a, b, coef1), inter2(c, d, coef1), coef2) * (1.0 / pow(2.0, (i + 0.6)));
    t *= 2.0;
  }
  return p;
}

float perlinNoise(vec3 position, uint seed) {
  vec3 fP = floor(position);
  vec3 fr = position - fP;
  uvec3 c = uvec3(fP);
  float v1 = dot(gradientDirection(hash(c, seed)), fr);
  float v2 = dot(gradientDirection(hash((c + uvec3(1, 0, 0)), seed)), fr - vec3(1, 0, 0));
  float v3 = dot(gradientDirection(hash((c + uvec3(0, 1, 0)), seed)), fr - vec3(0, 1, 0));
  float v4 = dot(gradientDirection(hash((c + uvec3(1, 1, 0)), seed)), fr - vec3(1, 1, 0));
  float v5 = dot(gradientDirection(hash((c + uvec3(0, 0, 1)), seed)), fr - vec3(0, 0, 1));
  float v6 = dot(gradientDirection(hash((c + uvec3(1, 0, 1)), seed)), fr - vec3(1, 0, 1));
  float v7 = dot(gradientDirection(hash((c + uvec3(0, 1, 1)), seed)), fr - vec3(0, 1, 1));
  float v8 = dot(gradientDirection(hash((c + uvec3(1, 1, 1)), seed)), fr - vec3(1, 1, 1));
  return interpolate(v1, v2, v3, v4, v5, v6, v7, v8, fade(fr));
}

float expImpulse(float x, float k, float gain) {
  float h = k * x;
  return h * exp(gain - h);
}

void main() {
  vec2 uv = v_UV;
  vec3 base = u_Color1.rgb; // background base color

  float time = u_Time * 0.001;
  vec3 color = base;

  for (float k = 0.; k < u_SplashCount; k++) {
    float t = time + random1(k);
    float seed = floor(t);
    vec2 ps = uv * 2.0 - 1.0;
    float layerNum = 10.;
    float noiseScale = 1.;
    float r = length(ps + vec2(random1fr(seed + k), random1fr(random1fr(seed + k))));

    float v = 0.;
    ps += vec2(999., 999.);
    for (float i = 0.; i < layerNum; ++i) {
      ps *= 1.6;
      float radius = (5.0 + u_SplashScaleVar * random1fr(seed));
      // Use cheaper 2D Perlin for splash threshold
      float h = noiseScale * perlin2D(ps) + r * radius;
      if (h < 0.09) {
        v += 1. / layerNum;
      }
    }

    float animate = mod(t, 1.);
    animate = expImpulse(animate, 20., 1.);
    v = clamp(mix(0., v, animate), 0.0001, 0.9999);

    vec3 subtractColor = vec3(v) - u_SplashColor.rgb;
    subtractColor = clamp(subtractColor, 0.0001, 0.9999);
    color = color - subtractColor;
  }

  out_Col = vec4(color, 1.0);
}


