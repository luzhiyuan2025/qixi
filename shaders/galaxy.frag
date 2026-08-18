/**
 * 星河光晕 GLSL 片段着色器
 * 用于 R3F 中爱心星河的粒子光晕效果
 * 特性：径向渐变 + 闪烁 + 颜色混合（胭脂红 → 黛紫 → 月白）
 */
precision highp float;

varying vec2 vUv;
varying float vAlpha;
varying vec3 vColor;
varying float vSize;

uniform float uTime;
uniform float uPixelRatio;

void main() {
  // 计算到粒子中心的距离（圆形粒子）
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center);

  // 径向衰减 - 柔和光晕
  float glow = 1.0 - smoothstep(0.0, 0.5, dist);
  glow = pow(glow, 1.5);

  // 核心亮点
  float core = 1.0 - smoothstep(0.0, 0.15, dist);
  core = pow(core, 3.0);

  // 闪烁效果 - 基于时间和粒子位置
  float twinkle = sin(uTime * 2.0 + vUv.x * 50.0 + vUv.y * 30.0) * 0.3 + 0.7;

  // 组合最终颜色
  vec3 finalColor = vColor * (glow * 0.6 + core * 1.2);
  float alpha = (glow * 0.8 + core) * vAlpha * twinkle;

  // 边缘完全透明
  if (alpha < 0.01) discard;

  gl_FragColor = vec4(finalColor, alpha);
}
