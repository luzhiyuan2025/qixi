"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import { captureError } from "@/lib/sentry";
import type { DeviceCapability } from "@/lib/performance";

// ===== 爱心参数方程生成点云 =====
function generateHeartPoints(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 2;
    // 经典爱心参数方程
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y =
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t);
    // 添加随机散布，形成星云感
    const spread = 0.8 + Math.random() * 1.5;
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * spread;
    positions[i * 3] = x * 0.15 + Math.cos(angle) * radius;
    positions[i * 3 + 1] = y * 0.15 + Math.sin(angle) * radius;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 3;
  }
  return positions;
}

// ===== GLSL 着色器爱心星河 =====
function ShaderHeartGalaxy({
  count,
  enableShader,
}: {
  count: number;
  enableShader: boolean;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, colors, alphas, sizes } = useMemo(() => {
    const pos = generateHeartPoints(count);
    const cols = new Float32Array(count * 3);
    const alps = new Float32Array(count);
    const szs = new Float32Array(count);

    // 中国色渐变：胭脂红 → 黛紫 → 月白
    const colorStops = [
      new THREE.Color("#d12c2c"), // 胭脂红
      new THREE.Color("#7c3aed"), // 黛紫
      new THREE.Color("#f0f5ff"), // 月白
      new THREE.Color("#e4c6d0"), // 藕荷
    ];

    for (let i = 0; i < count; i++) {
      const t = Math.random();
      const colorIndex = Math.min(
        colorStops.length - 2,
        Math.floor(t * (colorStops.length - 1))
      );
      const localT = t * (colorStops.length - 1) - colorIndex;
      const c = colorStops[colorIndex].clone().lerp(
        colorStops[colorIndex + 1],
        localT
      );
      cols[i * 3] = c.r;
      cols[i * 3 + 1] = c.g;
      cols[i * 3 + 2] = c.b;
      alps[i] = 0.4 + Math.random() * 0.6;
      szs[i] = 1.5 + Math.random() * 3;
    }
    return { positions: pos, colors: cols, alphas: alps, sizes: szs };
  }, [count]);

  // 着色器材质
  const shaderMaterial = useMemo(() => {
    if (!enableShader) return null;
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uSizeScale: { value: 1.0 },
      },
      vertexShader: `
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
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float pulse = 1.0 + sin(uTime * 1.5 + position.x * 10.0) * 0.15;
          gl_PointSize = aSize * uPixelRatio * uSizeScale * pulse * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        varying float vAlpha;
        varying vec3 vColor;
        varying float vSize;
        uniform float uTime;
        uniform float uPixelRatio;
        void main() {
          vec2 center = gl_PointCoord - 0.5;
          float dist = length(center);
          float glow = 1.0 - smoothstep(0.0, 0.5, dist);
          glow = pow(glow, 1.5);
          float core = 1.0 - smoothstep(0.0, 0.15, dist);
          core = pow(core, 3.0);
          float twinkle = sin(uTime * 2.0 + vUv.x * 50.0 + vUv.y * 30.0) * 0.3 + 0.7;
          vec3 finalColor = vColor * (glow * 0.6 + core * 1.2);
          float alpha = (glow * 0.8 + core) * vAlpha * twinkle;
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, [enableShader]);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.001;
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  if (enableShader && shaderMaterial) {
    return (
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={count}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-aColor"
            count={count}
            array={colors}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-aAlpha"
            count={count}
            array={alphas}
            itemSize={1}
          />
          <bufferAttribute
            attach="attributes-aSize"
            count={count}
            array={sizes}
            itemSize={1}
          />
        </bufferGeometry>
        <primitive object={shaderMaterial} ref={materialRef} attach="material" />
      </points>
    );
  }

  // 降级：使用标准 PointsMaterial
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

// ===== 悬浮爱心（3D 心形网格） =====
function FloatingHeart() {
  const meshRef = useRef<THREE.Mesh>(null);

  // 创建立体爱心几何体（ExtrudeGeometry）
  const heartShape = useMemo(() => {
    const shape = new THREE.Shape();
    const x = 0,
      y = 0;
    shape.moveTo(x + 0.5, y + 0.5);
    shape.bezierCurveTo(x + 0.5, y + 0.5, x + 0.4, y, x, y);
    shape.bezierCurveTo(x - 0.6, y, x - 0.6, y + 0.7, x - 0.6, y + 0.7);
    shape.bezierCurveTo(x - 0.6, y + 1.1, x - 0.3, y + 1.54, x + 0.5, y + 1.9);
    shape.bezierCurveTo(x + 1.2, y + 1.54, x + 1.6, y + 1.1, x + 1.6, y + 0.7);
    shape.bezierCurveTo(x + 1.6, y + 0.7, x + 1.6, y, x + 1.0, y);
    shape.bezierCurveTo(x + 0.7, y, x + 0.5, y + 0.5, x + 0.5, y + 0.5);
    return shape;
  }, []);

  const extrudeSettings = useMemo(
    () => ({
      depth: 0.3,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.08,
      bevelThickness: 0.08,
    }),
    []
  );

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
      meshRef.current.position.y =
        Math.sin(state.clock.elapsedTime * 0.8) * 0.15;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]} scale={[0.6, 0.6, 0.6]}>
      <extrudeGeometry args={[heartShape, extrudeSettings]} />
      <meshStandardMaterial
        color="#d12c2c"
        emissive="#d12c2c"
        emissiveIntensity={0.3}
        metalness={0.3}
        roughness={0.4}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

// ===== 场景内容 =====
function SceneContent({
  device,
  particleCount,
}: {
  device: DeviceCapability;
  particleCount: number;
}) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#d12c2c" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#7c3aed" />

      {/* 背景星空 */}
      <Stars
        radius={100}
        depth={50}
        count={3000}
        factor={4}
        saturation={0}
        fade
        speed={0.5}
      />

      {/* GLSL 着色器爱心星河 */}
      <ShaderHeartGalaxy
        count={particleCount}
        enableShader={device.enableShader}
      />

      {/* 中央悬浮爱心 */}
      <FloatingHeart />

      {/* 轨道控制 - 支持鼠标/触摸拖拽 */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.5}
        enableDamping
        dampingFactor={0.05}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={(Math.PI * 3) / 4}
      />
    </>
  );
}

// ===== 3D 场景主组件（含错误边界） =====
export default function Scene3D({
  device,
  onError,
}: {
  device: DeviceCapability;
  onError: () => void;
}) {
  const [hasError, setHasError] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // WebGL 上下文丢失处理
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      captureError("webgl", new Error("WebGL context lost in Scene3D"), {}, "warning");
      setHasError(true);
      onError();
    };
    canvas.addEventListener("webglcontextlost", handleContextLost);
    return () => {
      canvas.removeEventListener("webglcontextlost", handleContextLost);
    };
  }, [onError]);

  if (hasError || !device.enable3D) {
    return null;
  }

  const particleCount = Math.min(device.maxParticles, 2000);

  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        ref={canvasRef}
        dpr={[1, device.effectiveDpr]}
        gl={{
          antialias: device.gpuTier !== "low",
          alpha: true,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 0, 6], fov: 60 }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
        onError={(error) => {
          captureError("webgl", error as Error, { phase: "canvas-onerror" });
          setHasError(true);
          onError();
        }}
      >
        <ErrorBoundary onError={onError}>
          <SceneContent device={device} particleCount={particleCount} />
        </ErrorBoundary>
      </Canvas>
    </div>
  );
}

// ===== 简易错误边界 =====
function ErrorBoundary({
  children,
  onError,
}: {
  children: React.ReactNode;
  onError: () => void;
}) {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const errorHandler = (e: ErrorEvent) => {
      if (
        e.message.includes("WebGL") ||
        e.message.includes("THREE") ||
        e.message.includes("Shader")
      ) {
        setError(new Error(e.message));
        captureError("webgl", new Error(e.message));
        onError();
      }
    };
    window.addEventListener("error", errorHandler);
    return () => window.removeEventListener("error", errorHandler);
  }, [onError]);

  if (error) return null;
  return <>{children}</>;
}
