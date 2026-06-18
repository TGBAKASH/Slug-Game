import React, { useEffect, useRef } from "react";
import { SlugTransformSequence } from "./scene/scrollytelling/SlugTransformSequence";

export const Dashboard: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const parent = containerRef.current?.closest('.tab-panel') as HTMLElement;
    const appShell = document.getElementById('app-shell');
    const appHeader = document.getElementById('app-header');
    const bottomNav = document.getElementById('bottom-nav');
    
    document.body.classList.add('dashboard-active');

    if (parent) parent.style.padding = '0';
    if (appShell) {
      appShell.style.top = '0';
      appShell.style.bottom = '0';
      appShell.style.zIndex = '9999';
    }
    if (appHeader) appHeader.style.display = 'none';
    if (bottomNav) bottomNav.style.display = 'none';

    return () => {
      document.body.classList.remove('dashboard-active');
      if (parent) parent.style.padding = '';
      if (appShell) {
        appShell.style.top = '';
        appShell.style.bottom = '';
        appShell.style.zIndex = '';
      }
      if (appHeader) appHeader.style.display = '';
      if (bottomNav) bottomNav.style.display = '';
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full bg-[#050505]">
      <SlugTransformSequence />
    </div>
  );
};
