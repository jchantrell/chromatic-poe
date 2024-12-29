import type { IntRange } from "@pkgs/lib/types";
import type { RgbColor } from "@pkgs/ui/color-picker";

export type Actions = {
  fontSize?: IntRange<1, 45>;
  text?: RgbColor;
  border?: RgbColor;
  background?: RgbColor;
  dropSound?: boolean;
  icon?: { size: IconSize; shape: Shape; color: Color; enabled: boolean };
  beam?: { temp: boolean; color: Color; enabled: boolean };
  sound?: string;
};

export enum IconSize {
  Large = "Large",
  Medium = "Medium",
  Small = "Small",
}

export enum Color {
  Red = "Red",
  Green = "Green",
  Blue = "Blue",
  Brown = "Brown",
  White = "White",
  Yellow = "Yellow",
  Cyan = "Cyan",
  Grey = "Grey",
  Orange = "Orange",
  Pink = "Pink",
  Purple = "Purple",
}

export enum Shape {
  Circle = "Circle",
  Diamond = "Diamond",
  Hexagon = "Hexagon",
  Square = "Square",
  Star = "Star",
  Triangle = "Triangle",
  Cross = "Cross",
  Moon = "Moon",
  Raindrop = "Raindrop",
  Kite = "Kite",
  Pentagon = "Pentagon",
  UpsideDownHouse = "UpsideDownHouse",
}

export enum Beam {
  Perm = "",
  Temp = "Temp",
}

function getIconSize(size: IconSize) {
  if (size === IconSize.Small) {
    return 2;
  }
  if (size === IconSize.Medium) {
    return 1;
  }
  if (size === IconSize.Large) {
    return 0;
  }
  return 2;
}

export function setBorderColor(color: RgbColor) {
  return `SetBorderColor ${color.r} ${color.g} ${color.b} ${Math.round((color.a || 1) * 255)}`;
}
export function setTextColor(color: RgbColor) {
  return `SetTextColor ${color.r} ${color.g} ${color.b} ${Math.round((color.a || 1) * 255)}`;
}
export function setBackgroundColor(color: RgbColor) {
  return `SetBackgroundColor ${color.r} ${color.g} ${color.b} ${Math.round((color.a || 1) * 255)}`;
}
export function setFontSize(size: IntRange<1, 45>) {
  return `SetFontSize ${size}`;
}
export function playAlertSound(
  id: IntRange<1, 16>,
  volume: IntRange<0, 300>,
  positional?: boolean,
) {
  return `${positional ? "PlayAlertSoundPositional" : "PlayAlertSound"} ${id} ${volume}`;
}
export function dropSound(enable: boolean) {
  return enable ? "EnableDropSound" : "DisableDropSound";
}
export function customAlertSound(filePath: string, allowMissingFile: boolean) {
  return `CustomAlertSound${allowMissingFile ? "Optional" : ""} ${filePath}`;
}
export function minimapIcon(size: IconSize, color: Color, shape: Shape) {
  return `MinimapIcon ${getIconSize(size)} ${color} ${shape}`;
}
export function playEffect(color: Color, temporary?: boolean) {
  return `PlayEffect ${color}${temporary ? " Temp" : ""}`;
}

export function serializeActions(actions: Actions) {
  const strs = [];

  if (actions.fontSize) {
    strs.push(setFontSize(actions.fontSize));
  }
  if (actions.text) {
    strs.push(setTextColor(actions.text));
  }
  if (actions.border) {
    strs.push(setBorderColor(actions.border));
  }
  if (actions.background) {
    strs.push(setBackgroundColor(actions.background));
  }
  if (actions.icon?.enabled) {
    strs.push(
      minimapIcon(actions.icon.size, actions.icon.color, actions.icon.shape),
    );
  }
  if (actions.dropSound) {
    strs.push(dropSound(actions.dropSound));
  }
  if (actions.sound) {
    strs.push(customAlertSound(actions.sound, false));
  }
  if (actions.beam?.enabled) {
    strs.push(playEffect(actions.beam.color, actions.beam.temp));
  }

  return strs;
}

export const colors = {
  [Color.Red]: "#f80c1e",
  [Color.Brown]: "#8d1801",
  [Color.Orange]: "#e97000",
  [Color.Yellow]: "#be9a30",
  [Color.Green]: "#1e9912",
  [Color.Cyan]: "#0ca1b9",
  [Color.Blue]: "#114dab",
  [Color.Purple]: "#5d0f8c",
  [Color.Pink]: "#dc62cb",
  [Color.Grey]: "#1d1d1d",
  [Color.White]: "#a8babd",
};
