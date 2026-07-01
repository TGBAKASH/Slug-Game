import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

/* ═══════════════════════════════════════════════════════════════
   SlugModelThumbnail — Optimized for Arsenal grid
   
   Key optimizations vs previous version:
   1. frameloop="demand" — only renders when invalidated, not 60fps
   2. No <Stage> — was loading a full HDR environment per card
   3. No <Float> — was forcing continuous re-renders
   4. No <OrbitControls> — not needed for thumbnails
   5. Slow auto-rotate via useFrame + invalidate — minimal GPU
   ═══════════════════════════════════════════════════════════════ */

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const cloned = React.useMemo(() => scene.clone(), [scene]);
  const groupRef = useRef<THREE.Group>(null);

  // Gentle auto-rotate — calls invalidate() to trigger a single re-render
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.008;
      state.invalidate(); // request exactly 1 re-render
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={cloned} scale={1.2} />
    </group>
  );
}

export function SlugModelThumbnail({ element }: { element: number }) {
  let modelPath = '/models/slug_shell.glb';
  if (element === 1) modelPath = '/models/fireslug.glb';
  if (element === 2) modelPath = '/models/waterslug.glb';
  if (element === 3) modelPath = '/models/earthslug.glb';
  if (element === 4) modelPath = '/models/airslug.glb';
  if (element === 5) modelPath = '/models/gunslug.glb';

  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      frameloop="demand"
      dpr={[1, 1.5]}
      gl={{ antialias: false, powerPreference: 'low-power' }}
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />
      <directionalLight position={[-3, -2, 4]} intensity={0.4} />
      <Suspense fallback={null}>
        <Model url={modelPath} />
      </Suspense>
    </Canvas>
  );
}
