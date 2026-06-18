import React, { createContext, useContext, useState, useCallback, useRef } from "react";
// removed PerformanceMonitor

interface SceneDirectorContextType {
  shakeIntensity: number;
  triggerShake: (intensity?: number, duration?: number) => void;
  flashActive: boolean;
  triggerFlash: (duration?: number) => void;
  timeScale: number;
  triggerHitStop: (duration?: number, slowMoScale?: number) => void;
  graphicsQuality: "high" | "low";
  setGraphicsQuality: (q: "high" | "low") => void;
}

const SceneDirectorContext = createContext<SceneDirectorContextType | undefined>(undefined);

export const useSceneDirector = () => {
  const context = useContext(SceneDirectorContext);
  if (!context) throw new Error("useSceneDirector must be used within SceneDirectorProvider");
  return context;
};

export const SceneDirectorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const [flashActive, setFlashActive] = useState(false);
  const [timeScale, setTimeScale] = useState(1);
  const [graphicsQuality, setGraphicsQuality] = useState<"high" | "low">("high");

  const shakeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hitStopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerShake = useCallback((intensity = 0.5, duration = 300) => {
    setShakeIntensity(intensity);
    if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
    shakeTimeoutRef.current = setTimeout(() => {
      setShakeIntensity(0);
    }, duration);
  }, []);

  const triggerFlash = useCallback((duration = 200) => {
    setFlashActive(true);
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    flashTimeoutRef.current = setTimeout(() => {
      setFlashActive(false);
    }, duration);
  }, []);

  const triggerHitStop = useCallback((duration = 150, slowMoScale = 0.1) => {
    setTimeScale(slowMoScale);
    if (hitStopTimeoutRef.current) clearTimeout(hitStopTimeoutRef.current);
    hitStopTimeoutRef.current = setTimeout(() => {
      setTimeScale(1);
    }, duration);
  }, []);

  return (
    <SceneDirectorContext.Provider
      value={{
        shakeIntensity,
        triggerShake,
        flashActive,
        triggerFlash,
        timeScale,
        triggerHitStop,
        graphicsQuality,
        setGraphicsQuality,
      }}
    >
      {children}
    </SceneDirectorContext.Provider>
  );
};
