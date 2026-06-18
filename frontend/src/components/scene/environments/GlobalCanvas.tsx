import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import { PerformanceMonitor, Stars } from '@react-three/drei';
import { Vector2 } from 'three';
import { useFrame } from '@react-three/fiber';
import { useSceneDirector } from '../../../context/SceneDirector';

interface GlobalCanvasProps {
  activeTab: string;
}

const BackgroundScene = ({ activeTab }: { activeTab: string }) => {
  const { flashActive, graphicsQuality, shakeIntensity, setGraphicsQuality } = useSceneDirector();

  useFrame((state) => {
    if (shakeIntensity > 0) {
      const t = state.clock.elapsedTime;
      state.camera.position.x = Math.sin(t * 50) * shakeIntensity * 0.1;
      state.camera.position.y = Math.cos(t * 40) * shakeIntensity * 0.1;
    } else {
      state.camera.position.lerp({ x: 0, y: 0, z: 10 } as any, 0.1);
    }
  });

  return (
    <PerformanceMonitor 
      onIncline={() => setGraphicsQuality("high")} 
      onDecline={() => setGraphicsQuality("low")}
    >
      {/* Universal lighting */}
      <ambientLight intensity={flashActive ? 5 : 0.4} />
      <directionalLight position={[10, 20, 10]} intensity={flashActive ? 5 : 1.5} />
      
      {/* Background Environment dependent on tab */}
      {activeTab === "command" || activeTab === "dashboard" || activeTab === "quantum" ? (
        <group>
          <color attach="background" args={['#050811']} />
          <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
          <fog attach="fog" args={['#050811', 10, 40]} />
        </group>
      ) : activeTab === "arena" ? (
        <group>
          <color attach="background" args={['#1a0b12']} />
          <fog attach="fog" args={['#1a0b12', 5, 30]} />
        </group>
      ) : (
        <group>
          <color attach="background" args={['#07111a']} />
          <fog attach="fog" args={['#07111a', 5, 25]} />
        </group>
      )}
      
      {/* Shared Post-processing */}
      {graphicsQuality === "high" && (
        <EffectComposer>
          <Bloom 
            luminanceThreshold={0.5} 
            luminanceSmoothing={0.9} 
            intensity={flashActive ? 2 : 0.5} 
            mipmapBlur 
          />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
          {activeTab === "arena" ? (
            <ChromaticAberration offset={new Vector2(0.002, 0.002)} />
          ) : null as any}
        </EffectComposer>
      )}
    </PerformanceMonitor>
  );
};

export const GlobalCanvas: React.FC<GlobalCanvasProps> = ({ activeTab }) => {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none">
      <Canvas camera={{ position: [0, 0, 10], fov: 45 }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <BackgroundScene activeTab={activeTab} />
          {/* Note: The actual 3D models (slugs, incubators) can either be rendered here by reading 
              GameState, or rendered in isolated foreground Canvases per component. 
              Given the complexity, we keep the background global for transitions, and let specific 
              components (Incubator, Arena) render their own foreground Canvases to handle UI interactions. */}
        </Suspense>
      </Canvas>
    </div>
  );
};
