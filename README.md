# Ink Fireball
Project by Yichen Huang
[Live Demo Site](https://as7tesia.github.io/hw01-fireball/)

# Description
## Fireball (vert + frag) shader 

The vertex shader is driven by a low frequency FBM + a high-frequency domain wrapped 3D Perlin Noise that samples the vertex position, then I modified it with a function that combines two impulse functions at each end of 0 and 1, by taking the max of the two functions. This way I can control the inner and outer shape with `innerExponent` and `outerExponent`, then tune the overall displacement with `dispGain` and of course adjust the frequency `frequency`). In the fragment shader, colors are a stylized ramp between `u_Color1` and `u_Color2`, split into `layerNum` color bands.

## Ink Post-Process Shader 

Procedurally generated ink patterns by layering perlin noise by doing fbm, with each layer having a radial mask driven by the length of the uv vector. Then applied an square wave by flooring the time, this way the ink holds its shape for a bit, then by modding the time I can animate the opacity, then apply a impulse curve for a more reallistic ink drop animation. Ink color can be controlled with `u_SplashColor`, but note that because it is a subtraction based on the existing frame buffer rgb value, the perceived ink color may be different from what's shown in the GUI. GUI also give controls of number of splats and their size variance.

## Paper Post-Process Shader

Done by generating a height map from noise, making a fake normal map with with dFdx/dFdy, and do a lambert shader with the normal to get a papery bump.

## Screenshots

 ![Screenshot 1](./SC1.jpg)
 
 ![Screenshot 2](./SC2.jpg)
 

## Credits
Inspiration drawn from 
https://www.shadertoy.com/view/lt2BRm

3D perlin noise from:
https://www.shadertoy.com/view/slB3z3

Impulse functions from Inigo Quilez

