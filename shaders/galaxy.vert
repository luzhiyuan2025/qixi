/**
 * 星河光晕 GLSL 顶点着色器
 * 传递粒子颜色、透明度、大小到片段着色器
 */
precision highp float;

attribute float aSize;
attribute float aAlpha;
attribute vec3 aColor;

varying vec2 vUv;
varying float vAlpha;
varying vec3 vColor;
varying float vSize;

uniform float uTime;
uniform float uPixelRatio;
uniform float uSizeScale;

void main() {
  vUv = uv;
  vAlpha = aAlpha;
  vColor = aColor;
  vSize = aSize;

  // 位置变换
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

  // 粒子大小 - 透视缩放 + 时间脉动
  float pulse = 1.0 + sin(uTime * 1.5 + position.x * 10.0) * 0.15;
  gl_PointSize = aSize * uPixelRatio * uSizeScale * pulse * (300.0 / -mvPosition.z);

  gl_Position = projectionMatrix * mvPosition;
}
