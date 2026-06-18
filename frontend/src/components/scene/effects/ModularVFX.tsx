import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { ELEMENT_COLORS } from '../shaders/ElementalMaterials';

interface ModularVFXProps {
  element: number;
  rarity: number;
  scale?: number;
}

export const ElementalParticles: React.FC<ModularVFXProps> = ({ element, rarity, scale = 1 }) => {
  const color = ELEMENT_COLORS[element] || "#ffffff";
  const count = rarity * 25;

  switch (element) {
    case 1: // Fire - Embers rising
      return (
        <Sparkles 
          count={count} 
          scale={scale * 2.5} 
          size={8} 
          speed={0.8} 
          opacity={0.8} 
          color={color} 
          noise={1}
        />
      );
    case 2: // Water - Bubbles floating
      return (
        <Sparkles 
          count={count * 1.5} 
          scale={scale * 3} 
          size={4} 
          speed={0.3} 
          opacity={0.5} 
          color={color} 
        />
      );
    case 3: // Earth - Heavy dust
      return (
        <Sparkles 
          count={count} 
          scale={scale * 2} 
          size={3} 
          speed={0.1} 
          opacity={0.6} 
          color={color} 
        />
      );
    case 4: // Air - Fast streaks
      return (
        <Sparkles 
          count={count * 2} 
          scale={scale * 4} 
          size={2} 
          speed={2} 
          opacity={0.4} 
          color={color} 
          noise={0.5}
        />
      );
    case 5: // Shadow - Corrupted glitches
      return (
        <Sparkles 
          count={count} 
          scale={scale * 2.5} 
          size={12} 
          speed={1.5} 
          opacity={0.9} 
          color={color} 
          noise={2}
        />
      );
    default:
      return null;
  }
};

export const ShockwaveEffect: React.FC<{ color: string }> = ({ color }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.scale.x += delta * 15;
      meshRef.current.scale.y += delta * 15;
      meshRef.current.scale.z += delta * 15;
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      if (mat.opacity > 0) {
        mat.opacity -= delta * 2;
      }
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial 
        color={color} 
        emissive={color} 
        emissiveIntensity={5} 
        transparent 
        opacity={1} 
        side={THREE.DoubleSide} 
        depthWrite={false}
      />
    </mesh>
  );
};
