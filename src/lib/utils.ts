import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper for deterministic gradient generation
export const generateGradient = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const h1 = Math.abs(hash % 360);
  const h2 = Math.abs((hash >> 8) % 360);
  const h3 = Math.abs((hash >> 16) % 360);

  // Muted, dark developer-style gradient colors
  const c1 = `hsl(${h1}, 25%, 15%)`;
  const c2 = `hsl(${h2}, 30%, 20%)`;
  const c3 = `hsl(${h3}, 20%, 12%)`;

  return {
    background: `
      radial-gradient(at top left, ${c1}, transparent 75%),
      radial-gradient(at bottom right, ${c2}, transparent 75%),
      radial-gradient(at center, ${c3}, transparent 60%),
      #0f0f11
    `,
    backgroundSize: '150% 150%',
  };
};
