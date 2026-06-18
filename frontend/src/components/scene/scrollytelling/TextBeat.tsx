import React from "react";
import { motion, MotionValue, useTransform } from "framer-motion";

interface TextBeatProps {
  progress: MotionValue<number>;
  start: number;
  end: number;
  position: "left" | "right" | "center";
  children: React.ReactNode;
}

export const TextBeat: React.FC<TextBeatProps> = ({ progress, start, end, position, children }) => {
  // Fade in over first 10% of range, hold, fade out over last 10%
  const fadeStart = start;
  const fadeStartEnd = start + 0.1;
  const fadeEndStart = end - 0.1;
  const fadeEnd = end;

  const opacity = useTransform(
    progress,
    [fadeStart, fadeStartEnd, fadeEndStart, fadeEnd],
    [0, 1, 1, 0]
  );
  
  const y = useTransform(
    progress,
    [fadeStart, fadeStartEnd, fadeEndStart, fadeEnd],
    [40, 0, 0, -40]
  );

  let alignmentStyle: React.CSSProperties = {};
  let alignmentClass = "";
  
  switch (position) {
    case "left":
      alignmentClass = "items-start text-left";
      alignmentStyle = { paddingLeft: "12vw", paddingRight: "12vw" };
      break;
    case "right":
      alignmentClass = "items-end text-right";
      alignmentStyle = { paddingLeft: "12vw", paddingRight: "12vw" };
      break;
    case "center":
      alignmentClass = "items-center text-center pb-32";
      alignmentStyle = { paddingLeft: "5vw", paddingRight: "5vw" };
      break;
  }

  return (
    <motion.div
      style={{ opacity, y, ...alignmentStyle }}
      className={`absolute inset-0 flex flex-col justify-center will-change-transform z-20 pointer-events-none ${alignmentClass}`}
    >
      <div className="pointer-events-auto max-w-4xl w-auto">
        {children}
      </div>
    </motion.div>
  );
};
