import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette, ChromaticAberration, Noise, Glitch } from '@react-three/postprocessing';
import { PerspectiveCamera, Plane, useGLTF, Center } from '@react-three/drei';
import * as THREE from 'three';
import { SlugBaseMesh } from '../models/SlugBaseMesh';
import { ShockwaveEffect } from '../effects/ModularVFX';
import { soundManager } from '../../../context/SoundManager';
import { useSpring, a } from '@react-spring/three';

// Preload the gun model
useGLTF.preload('/models/gunslug.glb');

interface ArenaSceneProps {
  playerSlug: { element: number; rarity: number } | null;
  opponentSlug: { element: number; rarity: number } | null;
  battlePhase: "idle" | "entry" | "charging" | "launching" | "collision" | "resolution";
  winner: "player" | "opponent" | null;
  triggerFlash: (duration?: number) => void;
  triggerHitStop: (duration?: number, slowMoScale?: number) => void;
  triggerShake: (intensity?: number, duration?: number) => void;
}

const GunModel: React.FC<{ isFiring: boolean }> = ({ isFiring }) => {
  const { scene } = useGLTF('/models/gunslug.glb');
  
  // Recoil animation
  const { recoilZ, recoilRotX } = useSpring({
    recoilZ: isFiring ? 1.5 : 0,
    recoilRotX: isFiring ? -0.2 : 0,
    config: { mass: 1, tension: 1000, friction: 30 }
  });

  return (
    <a.group position-z={recoilZ} rotation-x={recoilRotX}>
      <Center>
        <primitive object={scene} scale={2} rotation={[0, Math.PI, 0]} />
      </Center>
    </a.group>
  );
};

const ArenaEnvironment: React.FC<ArenaSceneProps> = ({ playerSlug, opponentSlug, battlePhase, winner, triggerFlash, triggerHitStop, triggerShake }) => {
  const p1Ref = useRef<THREE.Group>(null);
  const p2Ref = useRef<THREE.Group>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const [muzzleFlash, setMuzzleFlash] = useState(false);

  React.useEffect(() => {
    if (battlePhase === 'launching') {
      setMuzzleFlash(true);
      triggerFlash(200); // Muzzle flash
      triggerShake(1.0, 200);
      setTimeout(() => setMuzzleFlash(false), 100);
    }
    if (battlePhase === 'collision') {
      triggerHitStop(500, 0.05); // 500ms hit stop
      triggerShake(2.0, 600); // 600ms violent shake
      triggerFlash(400); // 400ms bloom flash
      soundManager.playBassHit();
    }
  }, [battlePhase, triggerHitStop, triggerShake, triggerFlash]);

  // Initial positioning logic
  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    
    // Camera shake and FOV logic based on phase
    if (cameraRef.current) {
      if (battlePhase === 'idle' || battlePhase === 'entry' || battlePhase === 'charging') {
        // First Person Gun View
        cameraRef.current.position.lerp(new THREE.Vector3(0, 1.5, 5), delta * 5);
        cameraRef.current.fov = THREE.MathUtils.lerp(cameraRef.current.fov, 60, delta * 2);
        cameraRef.current.lookAt(0, 1.5, -5);
        
        // Breathing effect for gun camera
        cameraRef.current.position.y += Math.sin(t * 2) * 0.005;
        cameraRef.current.position.x += Math.cos(t * 1.5) * 0.005;
      } else if (battlePhase === 'launching') {
        // Cut to side view!
        cameraRef.current.position.lerp(new THREE.Vector3(0, 3, 12), delta * 10);
        cameraRef.current.fov = 50;
        cameraRef.current.lookAt(0, 0, 0);
      } else if (battlePhase === 'collision') {
        // Heavy shake at impact handled by triggerShake
        cameraRef.current.fov = THREE.MathUtils.lerp(cameraRef.current.fov, 55, delta * 10);
      } else if (battlePhase === 'resolution') {
        // Cinematic orbit around winner
        const targetX = winner === 'player' ? -2 : 2;
        cameraRef.current.position.lerp(new THREE.Vector3(targetX + Math.sin(t * 0.5) * 5, 2, Math.cos(t * 0.5) * 5 + 2), delta * 2);
        cameraRef.current.lookAt(targetX, 0, 0);
      }
      cameraRef.current.updateProjectionMatrix();
    }

    // Slug Animations
    if (p1Ref.current && p2Ref.current) {
      if (battlePhase === 'idle' || battlePhase === 'entry' || battlePhase === 'charging') {
        // Player slug is inside the gun (hidden or scaled down)
        p1Ref.current.scale.set(0.1, 0.1, 0.1);
        p1Ref.current.position.set(0, 1.5, 3.5); // inside gun barrel roughly
        
        // Opponent slug is far away on the floor
        p2Ref.current.position.lerp(new THREE.Vector3(0, 0, -10), delta * 5);
        p2Ref.current.rotation.y = THREE.MathUtils.lerp(p2Ref.current.rotation.y, 0, delta * 2);
      } 
      else if (battlePhase === 'launching') {
        // Pop player slug out to normal size
        p1Ref.current.scale.lerp(new THREE.Vector3(1, 1, 1), delta * 20);
        
        // Dash to center from side view
        p1Ref.current.position.lerp(new THREE.Vector3(-2, 0, 0), delta * 15);
        p2Ref.current.position.lerp(new THREE.Vector3(2, 0, 0), delta * 15);
        
        p1Ref.current.rotation.y = Math.PI / 2;
        p2Ref.current.rotation.y = -Math.PI / 2;
      }
      else if (battlePhase === 'collision') {
        // Clash in center!
        p1Ref.current.position.lerp(new THREE.Vector3(-0.5, 0, 0), delta * 20);
        p2Ref.current.position.lerp(new THREE.Vector3(0.5, 0, 0), delta * 20);
        
        // Random intense rotation offsets for hit-stop feel
        p1Ref.current.rotation.x = Math.random() * 0.5 - 0.25;
        p2Ref.current.rotation.x = Math.random() * 0.5 - 0.25;
      }
      else if (battlePhase === 'resolution') {
        // Reset rotation and drop the loser
        p1Ref.current.rotation.x = THREE.MathUtils.lerp(p1Ref.current.rotation.x, 0, delta * 5);
        p2Ref.current.rotation.x = THREE.MathUtils.lerp(p2Ref.current.rotation.x, 0, delta * 5);

        if (winner === 'player') {
          p1Ref.current.position.lerp(new THREE.Vector3(-2, 0, 0), delta * 2);
          p2Ref.current.position.lerp(new THREE.Vector3(5, -2, -5), delta * 5); // Loser gets knocked away
          p2Ref.current.rotation.z += delta * 10; // Spinning out of control
        } else if (winner === 'opponent') {
          p2Ref.current.position.lerp(new THREE.Vector3(2, 0, 0), delta * 2);
          p1Ref.current.position.lerp(new THREE.Vector3(-5, -2, -5), delta * 5); // Loser gets knocked away
          p1Ref.current.rotation.z -= delta * 10;
        }
      }
    }
  });

  const showGun = battlePhase === 'idle' || battlePhase === 'entry' || battlePhase === 'charging' || (battlePhase === 'launching' && muzzleFlash);

  return (
    <>
      <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 1.5, 5]} fov={60} />
      
      {/* Dynamic Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} intensity={2.0} color={battlePhase === 'charging' ? '#ffaa00' : '#ffffff'} />
      <pointLight position={[0, 1, 0]} intensity={battlePhase === 'collision' ? 10 : 0} color="#ffffff" distance={20} />

      {/* Muzzle Flash Light */}
      {muzzleFlash && <pointLight position={[0, 1.5, 2]} intensity={20} color="#ffaa00" distance={10} />}

      {/* First Person Gun Model */}
      {showGun && (
        <group position={[0, 1.0, 4]}>
          <GunModel isFiring={battlePhase === 'launching'} />
        </group>
      )}

      {/* The Arena Floor */}
      <Plane args={[100, 100]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <meshStandardMaterial color="#050a11" metalness={0.8} roughness={0.4} />
      </Plane>
      <gridHelper args={[100, 100, '#1c2a55', '#0f1838']} position={[0, -0.49, 0]} />

      {/* Player Slug */}
      {playerSlug && (
        <group ref={p1Ref} position={[0, 0, 0]}>
          <SlugBaseMesh 
            baseElement={playerSlug.element} 
            rarity={playerSlug.rarity} 
            isHovering={battlePhase !== 'collision'}
            isAttacking={battlePhase === 'charging' || battlePhase === 'launching'}
          />
        </group>
      )}

      {/* Opponent Slug */}
      {opponentSlug && (
        <group ref={p2Ref} position={[0, 0, -10]}>
          <SlugBaseMesh 
            baseElement={opponentSlug.element} 
            rarity={opponentSlug.rarity} 
            isHovering={battlePhase !== 'collision'}
            isAttacking={battlePhase === 'charging' || battlePhase === 'launching'}
          />
        </group>
      )}

      {/* Impact VFX */}
      {battlePhase === 'collision' && <ShockwaveEffect color="#ffffff" />}

      <EffectComposer>
        <Bloom luminanceThreshold={0.2} intensity={2.0} luminanceSmoothing={0.9} mipmapBlur />
        <Vignette eskil={false} offset={0.1} darkness={1.3} />
        {battlePhase === 'collision' ? (
          <ChromaticAberration blendFunction={BlendFunction.NORMAL} offset={new THREE.Vector2(0.02, 0.02)} />
        ) : null as any}
        {battlePhase === 'collision' ? (
          <Glitch delay={new THREE.Vector2(0, 0)} duration={new THREE.Vector2(0.1, 0.3)} strength={new THREE.Vector2(0.5, 1.0)} />
        ) : null as any}
        <Noise opacity={0.03} />
      </EffectComposer>
    </>
  );
};

import { useSceneDirector } from '../../../context/SceneDirector';
import { BlendFunction } from 'postprocessing';

export const ArenaScene: React.FC<Omit<ArenaSceneProps, 'triggerFlash'|'triggerHitStop'|'triggerShake'>> = (props) => {
  const { triggerFlash, triggerHitStop, triggerShake } = useSceneDirector();
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <Canvas dpr={[1, 2]} shadows>
        <ArenaEnvironment {...props} triggerFlash={triggerFlash} triggerHitStop={triggerHitStop} triggerShake={triggerShake} />
      </Canvas>
    </div>
  );
};
