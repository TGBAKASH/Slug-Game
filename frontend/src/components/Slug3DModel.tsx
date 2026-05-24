import { useRef, useState } from 'react';
import { useFrame, Canvas } from '@react-three/fiber';
import { OrbitControls, MeshDistortMaterial, MeshTransmissionMaterial, Sparkles, Float } from '@react-three/drei';
import { EffectComposer, Bloom, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';

// 1: Fire, 2: Water, 3: Earth, 4: Air, 5: Shadow
const ELEMENT_COLORS = {
  1: "#ef4444", // Red
  2: "#0ea5e9", // Blue
  3: "#10b981", // Green
  4: "#e0f2fe", // Light Blue/Cyan
  5: "#8b5cf6", // Purple
};

import { getSlugImage } from '../context/GameState';

const ElementCore = ({ element, rarity }: { element: number, rarity: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [clicked, setClicked] = useState(false);
  const color = ELEMENT_COLORS[element as keyof typeof ELEMENT_COLORS] || "#ffffff";
  
  // Load the slug image texture
  const texture = useLoader(THREE.TextureLoader, getSlugImage(element, false));

  useFrame((_state, delta) => {
    if (meshRef.current) {
      // Gentle floating rotation
      meshRef.current.rotation.y = Math.sin(_state.clock.elapsedTime) * 0.2;
      meshRef.current.rotation.x = Math.sin(_state.clock.elapsedTime * 0.5) * 0.1;
      
      // Pulse animation on click
      if (clicked) {
        meshRef.current.scale.lerp(new THREE.Vector3(1.3, 1.3, 1.3), 0.15);
        if (meshRef.current.scale.x > 1.25) setClicked(false);
      } else {
        meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.05);
      }
    }
  });

  return (
    <group onClick={() => setClicked(true)}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <group ref={meshRef}>
          {/* Main Slug Image Plane */}
          <mesh position={[0, 0, 0.1]}>
            <planeGeometry args={[3, 3]} />
            <meshBasicMaterial map={texture} transparent={true} side={THREE.DoubleSide} />
          </mesh>
          
          {/* Glowing Aura Plane Behind Slug */}
          <mesh position={[0, 0, -0.1]}>
            <planeGeometry args={[2.5, 2.5]} />
            <meshStandardMaterial 
              color={color} 
              emissive={color} 
              emissiveIntensity={rarity > 2 ? 3 : 1.5} 
              transparent 
              opacity={0.4} 
              depthWrite={false}
            />
          </mesh>
        </group>
      </Float>

      {/* Dynamic Sparkles based on Element */}
      <Sparkles 
        count={rarity * 40 + 20} 
        scale={4} 
        size={element === 1 ? 12 : 8} 
        speed={element === 4 ? 2 : 0.4} 
        color={color} 
        opacity={0.8}
      />
    </group>
  );
};

export const Slug3DModel = ({ element, rarity }: { element: number, rarity: number }) => {
  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }} gl={{ alpha: true }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} color={ELEMENT_COLORS[element as keyof typeof ELEMENT_COLORS]} intensity={2} />
        
        <ElementCore element={element} rarity={rarity} />
        
        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          autoRotate 
          autoRotateSpeed={1} 
        />
        
        <EffectComposer>
          <Bloom 
            luminanceThreshold={0.2} 
            luminanceSmoothing={0.9} 
            intensity={1.5} 
            mipmapBlur 
          />
          <Noise opacity={element === 5 ? 0.05 : 0} />
        </EffectComposer>
      </Canvas>
    </div>
  );
};
