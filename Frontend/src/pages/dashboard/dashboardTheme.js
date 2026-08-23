// Shared accent palette so every dashboard visualization colors each
// project consistently (cards, progress bars, charts).

export const PROJECT_COLORS = [
  { base: "#3b82f6", soft: "rgba(59, 130, 246, 0.15)" },
  { base: "#8b5cf6", soft: "rgba(139, 92, 246, 0.15)" },
  { base: "#10b981", soft: "rgba(16, 185, 129, 0.15)" },
  { base: "#f59e0b", soft: "rgba(245, 158, 11, 0.15)" },
  { base: "#f43f5e", soft: "rgba(244, 63, 94, 0.15)" },
  { base: "#06b6d4", soft: "rgba(6, 182, 212, 0.15)" },
];

export function getProjectColor(index) {
  return PROJECT_COLORS[index % PROJECT_COLORS.length];
}