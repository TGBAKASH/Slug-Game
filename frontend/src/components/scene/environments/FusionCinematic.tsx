import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette, Noise, Glitch } from '@react-three/postprocessing';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { SlugBaseMesh } from '../models/SlugBaseMesh';
import { ShockwaveEffect } from '../effects/ModularVFX';
import { ELEMENT_COLORS } from '../shaders/ElementalMaterials';

import { useSceneDirector } from '../../../context/SceneDirector';
import { soundManager } from '../../../context/SoundManager';

interface FusionCinematicProps {
  parent1: { element: number, rarity: number };
  parent2: { element: number, rarity: number };
  onComplete: () => void;
  triggerFlash: (duration?: number) => void;
  triggerHitStop: (duration?: number, slowMoScale?: number) => void;
  triggerShake: (intensity?: number, duration?: number) => void;
}

const FusionScene: React.FC<FusionCinematicProps> = ({ parent1, parent2, onComplete, triggerFlash, triggerHitStop, triggerShake }) => {
  const p1Ref = useRef<THREE.Group>(null);
  const p2Ref = useRef<THREE.Group>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  
  const [phase, setPhase] = useState<'charging' | 'colliding' | 'flash' | 'reveal'>('charging');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('colliding'), 2000); // 2s charge
    const t2 = setTimeout(() => {
      setPhase('flash');
      triggerHitStop(500, 0.05); // Matrix bullet time
      triggerFlash(400);
      triggerShake(1.5, 500);
      soundManager.playBassHit();
    }, 3500); // 1.5s collide
    const t3 = setTimeout(() => setPhase('reveal'), 4000); // 0.5s flash
    const t4 = setTimeout(() => onComplete(), 8000); // end after 4s reveal

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    
    if (cameraRef.current) {
      if (phase === 'charging' || phase === 'colliding') {
        // Heavy camera shake
        cameraRef.current.position.x = Math.sin(t * 50) * 0.1;
        cameraRef.current.position.y = Math.cos(t * 40) * 0.1;
      } else {
        // Smooth orbit during reveal
        cameraRef.current.position.x = Math.sin(t * 0.5) * 8;
        cameraRef.current.position.z = Math.cos(t * 0.5) * 8;
        cameraRef.current.position.y = 2;
        cameraRef.current.lookAt(0, 0, 0);
      }
    }

    if (phase === 'colliding') {
      if (p1Ref.current && p2Ref.current) {
        p1Ref.current.position.lerp(new THREE.Vector3(0, 0, 0), delta * 4);
        p2Ref.current.position.lerp(new THREE.Vector3(0, 0, 0), delta * 4);
        p1Ref.current.rotation.y += delta * 10;
        p2Ref.current.rotation.y += delta * 10;
      }
    }

    // We can handle some visual logic here if needed, but flash is handled via Bloom intensity.
  });

  return (
    <>
      <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 2, 8]} fov={50} />
      
      <ambientLight intensity={phase === 'flash' ? 5 : 0.5} />
      <pointLight position={[0, 0, 0]} intensity={phase === 'charging' ? 5 : 1} color={ELEMENT_COLORS[parent1.element]} />

      {/* Parents */}
      {phase !== 'reveal' && (
        <>
          <group ref={p1Ref} position={[-3, 0, 0]}>
            <SlugBaseMesh baseElement={parent1.element} rarity={parent1.rarity} isHovering />
          </group>
          <group ref={p2Ref} position={[3, 0, 0]}>
            <SlugBaseMesh baseElement={parent2.element} rarity={parent2.rarity} isHovering />
          </group>
        </>
      )}

      {/* Shockwave during flash */}
      {phase === 'flash' && <ShockwaveEffect color="#ffffff" />}

      {/* Fused Child (Revealed after flash) */}
      {phase === 'reveal' && (
        <group position={[0, 0, 0]}>
          <SlugBaseMesh 
            baseElement={parent1.element} 
            attachmentElement={parent2.element} 
            rarity={Math.max(parent1.rarity, parent2.rarity) + 1} 
            isHovering 
          />
        </group>
      )}

      {/* Post-Processing */}
      <EffectComposer>
        <Bloom 
          luminanceThreshold={0.1} 
          luminanceSmoothing={0.9} 
          intensity={phase === 'flash' ? 10 : phase === 'charging' ? 3 : 1.5} 
          mipmapBlur 
        />
        <Vignette darkness={1.2} />
        {phase === 'colliding' ? <Glitch delay={new THREE.Vector2(0, 0)} duration={new THREE.Vector2(0.1, 0.3)} strength={new THREE.Vector2(0.1, 0.5)} /> : null as any}
        <Noise opacity={0.05} />
      </EffectComposer>

      {/* White Flash Overlay (Rendered in 2D via HTML but we can fake it in 3D or let the parent handle it) */}
      {/* We'll let the intense Bloom handle the flash, it looks much more natural in HDR */}
    </>
  );
};

export const FusionCinematic: React.FC<Omit<FusionCinematicProps, 'triggerFlash'|'triggerHitStop'|'triggerShake'>> = (props) => {
  const { triggerFlash, triggerHitStop, triggerShake } = useSceneDirector();
  return (
    <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-xl">
      <Canvas dpr={[1, 2]}>
        <FusionScene {...props} triggerFlash={triggerFlash} triggerHitStop={triggerHitStop} triggerShake={triggerShake} />
      </Canvas>
      <div className="absolute bottom-10 left-0 w-full text-center pointer-events-none">
        <h2 className="text-3xl font-black uppercase text-primary-container tracking-[0.5em] animate-pulse">
          Reactor Overload
        </h2>
        <p className="text-outline font-label-caps mt-2">Fusing molecular structures...</p>
      </div>
    </div>
  );
};
