import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSpring, a } from '@react-spring/three';
import * as THREE from 'three';
import { useGLTF, Clone, Center } from '@react-three/drei';

import { soundManager } from '../../../context/SoundManager';


// ═══════════════════════════════════════════════════
// Props interface (unchanged for compatibility)
// ═══════════════════════════════════════════════════
export interface ModularSlugProps {
  baseElement: number;
  attachmentElement?: number;
  rarity: number;
  isHovering?: boolean;
  isAttacking?: boolean;
}

// ═══════════════════════════════════════════════════
// Main Component: Custom GLB Creature
// ═══════════════════════════════════════════════════
export const SlugBaseMesh: React.FC<ModularSlugProps> = ({
  baseElement,
  isHovering = false,
  isAttacking = false,
}) => {
  // Map elements to model paths
  const getModelPath = (el: number) => {
    switch (el) {
      case 1: return '/models/fireslug.glb';
      case 2: return '/models/waterslug.glb';
      case 3: return '/models/earthslug.glb';
      case 4: return '/models/airslug.glb';
      case 5: return '/models/fireslug.glb'; // Fallback for shadow
      default: return '/models/fireslug.glb';
    }
  };

  const modelPath = getModelPath(baseElement);
  
  // We use useGLTF and then clone the scene so we can render multiple of the same slug
  const { scene } = useGLTF(modelPath);

  // ─── Refs for animated parts ───
  const creatureRef = useRef<THREE.Group>(null);
  const bodyGroupRef = useRef<THREE.Group>(null);

  // ─── Hover detection ───
  const [hovered, setHovered] = useState(false);
  const activeHover = isHovering || hovered;

  // ─── Spring physics for hover/attack ───
  // Adjusted scale for GLB models to ensure they fit the scene nicely. 
  const baseScale = 1.0; 
  const hoverScale = 1.1;

  const { springPos, springScale } = useSpring({
    springPos: activeHover ? [0, 0.4, 0] : [0, 0, 0],
    springScale: activeHover ? [hoverScale, hoverScale, hoverScale] : [baseScale, baseScale, baseScale],
    config: { mass: 0.8, tension: 200, friction: 12 },
  });

  // ═══════════════════════════════════════════════════
  // Continuous Procedural Animation Loop for whole body
  // ═══════════════════════════════════════════════════
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (!creatureRef.current || !bodyGroupRef.current) return;

    // ── 1. HOP CYCLE with squash & stretch ──
    const hopPhase = (time * 2.5) % (Math.PI * 2);
    const hopY = Math.abs(Math.sin(hopPhase)) * 0.12;
    const velocity = Math.cos(hopPhase);
    
    // Slight squash and stretch applied to the whole model group
    const scaleY = 1.0 + velocity * 0.04;
    const scaleXZ = 1.0 - velocity * 0.02;
    
    bodyGroupRef.current.scale.set(scaleXZ, scaleY, scaleXZ);
    bodyGroupRef.current.position.y = hopY;

    // ── 2. CASUAL LOOK AROUND (Rotation) ──
    if (!isAttacking) {
      if (activeHover) {
        bodyGroupRef.current.rotation.y = THREE.MathUtils.lerp(bodyGroupRef.current.rotation.y, 0, 0.1);
        bodyGroupRef.current.rotation.x = THREE.MathUtils.lerp(bodyGroupRef.current.rotation.x, -0.15, 0.1);
      } else {
        bodyGroupRef.current.rotation.y = Math.sin(time * 0.8) * 0.15;
        bodyGroupRef.current.rotation.x = Math.sin(time * 0.5) * 0.05;
        bodyGroupRef.current.rotation.z = Math.sin(time * 1.2) * 0.02;
      }
    }

    // ── 3. ATTACK LEAN ──
    if (isAttacking) {
      creatureRef.current.rotation.x = THREE.MathUtils.lerp(creatureRef.current.rotation.x, -0.35, 0.1);
    } else {
      creatureRef.current.rotation.x = THREE.MathUtils.lerp(creatureRef.current.rotation.x, 0, 0.05);
    }
  });

  // ─── Event handlers ───
  const handlePointerOver = (e: any) => { 
    e.stopPropagation();
    setHovered(true); 
    soundManager.playHover(); 
  };
  const handlePointerOut = () => setHovered(false);

  // ═══════════════════════════════════════════════════
  // JSX: Render Custom GLTF
  // ═══════════════════════════════════════════════════
  return (
    <a.group
      ref={creatureRef}
      position={springPos as any}
      scale={springScale as any}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <group ref={bodyGroupRef}>
        <Center>
          <Clone object={scene} castShadow receiveShadow />
        </Center>
      </group>
    </a.group>
  );
};
