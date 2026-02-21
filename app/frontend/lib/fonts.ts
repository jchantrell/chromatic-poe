export type FontOption = "fontin" | "inter" | "system" | "mono";

export const FONT_OPTIONS: { value: FontOption; label: string }[] = [
  { value: "fontin", label: "Fontin (PoE)" },
  { value: "inter", label: "Inter" },
  { value: "system", label: "System Default" },
  { value: "mono", label: "Monospace" },
];

export const DEFAULT_FONT: FontOption = "fontin";
