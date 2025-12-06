#version 300 es
precision highp float;

uniform sampler2D u_SceneTex;
uniform vec2 u_Resolution;
uniform float u_Time;
uniform vec4 u_Color1; // The color with which to render this instance of geometry.
uniform vec4 u_Color2;
uniform vec4 u_SplashColor;
uniform float u_SplashCount;
uniform float u_SplashScaleVar;

in vec2 v_UV;
out vec4 out_Col;

//	Simplex 3D Noise by Ian McEwan, Ashima Arts
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float random1 (float x) {
        float f = 43758.5453123;
        return fract(sin(x) * f);
}

float random1fr (float x) {
    float f = 43758.5453123;
    return 2. * fract(sin(x) * f) - 1.;
}

float noise1D(float x) {
        float i = floor(x);
        float fr = fract(x);
        return mix(random1(i), random1(i + 1.0), fr);
}

float noise3D(vec3 v){
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //  x0 = x0 - 0. + 0.0 * C
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1. + 3.0 * C.xxx;

// Permutations
  i = mod(i, 289.0 );
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients
// ( N*N points uniformly over a square, mapped onto an octahedron.)
  float n_ = 1.0/7.0; // N=7
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                dot(p2,x2), dot(p3,x3) ) );
}

float fbm3D(vec3 x, int octaves, float amplitude, float frequency, vec3 shift, float lacunarity, float gain) {
        float value = 0.0;
        for (int i = 0; i < octaves; ++i) {
        float sn = noise3D(x * frequency);
        value += amplitude * sn;
        x += shift;
        frequency *= lacunarity;
                amplitude *= gain;
        }
        return value;
}

// implementation of MurmurHash (https://sites.google.com/site/murmurhash/) for a 
// single unsigned integer.

uint hash(uint x, uint seed) {
    const uint m = 0x5bd1e995U;
    uint hash = seed;
    // process input
    uint k = x;
    k *= m;
    k ^= k >> 24;
    k *= m;
    hash *= m;
    hash ^= k;
    // some final mixing
    hash ^= hash >> 13;
    hash *= m;
    hash ^= hash >> 15;
    return hash;
}

// implementation of MurmurHash (https://sites.google.com/site/murmurhash/) for a  
// 3-dimensional unsigned integer input vector.

uint hash(uvec3 x, uint seed){
    const uint m = 0x5bd1e995U;
    uint hash = seed;
    // process first vector element
    uint k = x.x; 
    k *= m;
    k ^= k >> 24;
    k *= m;
    hash *= m;
    hash ^= k;
    // process second vector element
    k = x.y; 
    k *= m;
    k ^= k >> 24;
    k *= m;
    hash *= m;
    hash ^= k;
    // process third vector element
    k = x.z; 
    k *= m;
    k ^= k >> 24;
    k *= m;
    hash *= m;
    hash ^= k;
	// some final mixing
    hash ^= hash >> 13;
    hash *= m;
    hash ^= hash >> 15;
    return hash;
}


vec3 gradientDirection(uint hash) {
    switch (int(hash) & 15) { // look at the last four bits to pick a gradient direction
    case 0:
        return vec3(1, 1, 0);
    case 1:
        return vec3(-1, 1, 0);
    case 2:
        return vec3(1, -1, 0);
    case 3:
        return vec3(-1, -1, 0);
    case 4:
        return vec3(1, 0, 1);
    case 5:
        return vec3(-1, 0, 1);
    case 6:
        return vec3(1, 0, -1);
    case 7:
        return vec3(-1, 0, -1);
    case 8:
        return vec3(0, 1, 1);
    case 9:
        return vec3(0, -1, 1);
    case 10:
        return vec3(0, 1, -1);
    case 11:
        return vec3(0, -1, -1);
    case 12:
        return vec3(1, 1, 0);
    case 13:
        return vec3(-1, 1, 0);
    case 14:
        return vec3(0, -1, 1);
    case 15:
        return vec3(0, -1, -1);
    }
}

float interpolate(float value1, float value2, float value3, float value4, float value5, float value6, float value7, float value8, vec3 t) {
    return mix(
        mix(mix(value1, value2, t.x), mix(value3, value4, t.x), t.y),
        mix(mix(value5, value6, t.x), mix(value7, value8, t.x), t.y),
        t.z
    );
}

vec3 fade(vec3 t) {
    // 6t^5 - 15t^4 + 10t^3
	return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

float perlinNoise(vec3 position, uint seed) {
    vec3 floorPosition = floor(position);
    vec3 fractPosition = position - floorPosition;
    uvec3 cellCoordinates = uvec3(floorPosition);
    float value1 = dot(gradientDirection(hash(cellCoordinates, seed)), fractPosition);
    float value2 = dot(gradientDirection(hash((cellCoordinates + uvec3(1, 0, 0)), seed)), fractPosition - vec3(1, 0, 0));
    float value3 = dot(gradientDirection(hash((cellCoordinates + uvec3(0, 1, 0)), seed)), fractPosition - vec3(0, 1, 0));
    float value4 = dot(gradientDirection(hash((cellCoordinates + uvec3(1, 1, 0)), seed)), fractPosition - vec3(1, 1, 0));
    float value5 = dot(gradientDirection(hash((cellCoordinates + uvec3(0, 0, 1)), seed)), fractPosition - vec3(0, 0, 1));
    float value6 = dot(gradientDirection(hash((cellCoordinates + uvec3(1, 0, 1)), seed)), fractPosition - vec3(1, 0, 1));
    float value7 = dot(gradientDirection(hash((cellCoordinates + uvec3(0, 1, 1)), seed)), fractPosition - vec3(0, 1, 1));
    float value8 = dot(gradientDirection(hash((cellCoordinates + uvec3(1, 1, 1)), seed)), fractPosition - vec3(1, 1, 1));
    return interpolate(value1, value2, value3, value4, value5, value6, value7, value8, fade(fractPosition));
}

float perlinNoise(vec3 position, int frequency, int octaveCount, float persistence, float lacunarity, uint seed) {
    float value = 0.0;
    float amplitude = 1.0;
    float currentFrequency = float(frequency);
    uint currentSeed = seed;
    for (int i = 0; i < octaveCount; i++) {
        currentSeed = hash(currentSeed, 0x0U); // create a new seed for each octave
        value += perlinNoise(position * currentFrequency, currentSeed) * amplitude;
        amplitude *= persistence;
        currentFrequency *= lacunarity;
    }
    return value;
}


float expImpulse(float x, float k, float gain) {
  float h = k * x;
  return h * exp(gain - h);
}

// fake normal from height map
// Built-in-derivative version (requires GLSL ES 3.00+)
vec3 heightToNormal(float h, float strength) {
  float dhdx = dFdx(h);
  float dhdy = dFdy(h);
  return normalize(vec3(-strength * dhdx, -strength * dhdy, 1.0));
}

void main() {
    vec2 uv = v_UV;

    // Sample scene color
    vec3 sceneCol = texture(u_SceneTex, uv).rgb;

    // Grain
    vec3 p = vec3(uv * u_Resolution / 20., 1.0);
    // p.x *= 0.4;         // stretch on x to make it more paper looking
    float grain = perlinNoise(p * vec3(0.5, 1., 1.), 1, 8, 0.5, 2.0, uint(232));

    // Lambert with fake normal
    vec3 normal = heightToNormal(grain, 0.6);
    vec3 lightVec = vec3(0.5, 0.5, 0.5);
    // lightVec.x *= cos(u_Time * 0.005);
    // lightVec.y *= sin(u_Time * 0.005);
    float diffuseTerm = dot(normalize(normal), normalize(lightVec));
    diffuseTerm = clamp(diffuseTerm, 0.001, 0.999);
    float ambientTerm = 0.1;
    float lightIntensity = diffuseTerm + ambientTerm; 
    lightIntensity = clamp(lightIntensity, 0.001, 0.999);

    sceneCol *= diffuseTerm;
    // Ink Splashes

    uv.x *= u_Resolution.x / u_Resolution.y;
    float pi = 3.14159265;
    float time = u_Time * 0.001;

    for (float k = 0.; k < u_SplashCount; k++) {
        time += random1(k);
        float seed = floor(time);
        vec2 ps = uv * 2.0 - 1.0;
        float layerNum = 10.;
        float noiseScale = 1.;
        float r = length(ps + vec2(random1fr(seed + k), random1fr(random1fr(seed + k))));
        // float r = length(ps + vec2(random1fr(seed + k), random1fr(seed + k)));
        
        float v = 0.;
        ps += vec2(999., 999.);
        // float s1 = perlinNoise(p, 1, 1, 0.5, 2.0, uint(432));
        for (float i = 0.; i < layerNum; ++i) {
            ps *= 1.6;
            float radius = (5.0 + u_SplashScaleVar * random1fr(seed));
            float h = noiseScale*perlinNoise(vec3(ps.x, ps.y, 1.0), 1, 1, 0.5, 2.0, uint(23)) + r * radius;
            if (h < 0.09) {
                v += 1./layerNum; 
            }
        }

        // animate v
        float animate = mod(time, 1.);
        animate = expImpulse(animate, 20., 1.);
        v = mix(0., v, animate);
        v = clamp(v, 0.0001, 0.9999);
        // vec3 invColor = vec3(1. - u_Color1.x, 1. -  u_Color1.y, 1. - u_Color1.z);
        vec3 subtractColor = vec3(v) - u_SplashColor.rgb;
        subtractColor = clamp(subtractColor, 0.0001, 0.9999);
        sceneCol = sceneCol - subtractColor;
    }

    

    // out_Col = vec4(v, 0.0, 0.0, 1.0);

    // out_Col = vec4(vec3(sceneCol * diffuseTerm), 1.0);
    out_Col = vec4(sceneCol, 1.0);
    // out_Col = u_Color1;
}


