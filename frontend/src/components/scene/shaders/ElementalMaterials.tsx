// Material configurations for Slug components
import { MeshDistortMaterial, MeshTransmissionMaterial } from '@react-three/drei';

export const ELEMENT_COLORS: Record<number, string> = {
  1: "#ff3300", // Fire - Magma red/orange
  2: "#00ffff", // Water - Cyan bioluminescence
  3: "#33ff33", // Earth - Glowing green
  4: "#00ffcc", // Air - Teal energy
  5: "#aa00ff", // Shadow - Corrupted purple
};

export const getElementMaterial = (element: number, rarity: number) => {
  const color = ELEMENT_COLORS[element] || "#ffffff";
  const intensity = rarity > 2 ? 3 : 1.5;

  switch (element) {
    case 1: // Fire - Magma
      return (
        <MeshDistortMaterial
          color="#330000"
          emissive={color}
          emissiveIntensity={intensity}
          distort={0.4}
          speed={3}
          roughness={0.8}
        />
      );
    case 2: // Water - Liquid
      return (
        <MeshTransmissionMaterial
          color={color}
          thickness={1.5}
          roughness={0.1}
          transmission={0.9}
          ior={1.2}
          chromaticAberration={1.5}
          backside
        />
      );
    case 3: // Earth - Crystal
      return (
        <meshStandardMaterial
          color="#112211"
          emissive={color}
          emissiveIntensity={intensity * 0.5}
          roughness={0.9}
          metalness={0.1}
        />
      );
    case 4: // Air - Ethereal
      return (
        <MeshTransmissionMaterial
          color={color}
          thickness={0.5}
          roughness={0}
          transmission={1}
          ior={1}
          opacity={0.6}
          transparent
        />
      );
    case 5: // Shadow - Corrupted
      return (
        <MeshDistortMaterial
          color="#0a0a0a"
          emissive={color}
          emissiveIntensity={intensity * 1.5}
          distort={0.8}
          speed={8}
          roughness={0.5}
          wireframe={rarity > 3}
        />
      );
    default:
      return <meshStandardMaterial color={color} />;
  }
};
