import { isDefined } from "@pkgs/lib/utils";

export type RgbColor = { r: number; g: number; b: number; a: number };

export const DEFAULT_STYLE = {
  text: { r: 255, g: 255, b: 255, a: 240 },
  border: { r: 19, g: 14, b: 6, a: 0 },
  background: { r: 19, g: 14, b: 6, a: 240 },
};

export type Actions = {
  fontSize?: number;
  text?: RgbColor;
  border?: RgbColor;
  background?: RgbColor;
  dropSound?: { enabled: boolean; toggle: boolean };
  icon?: { size: IconSize; shape: Shape; color: Color; enabled: boolean };
  beam?: { temp: boolean; color: Color; enabled: boolean };
  sound?: {
    path: { value: string; path: string; type: "custom" | "default" };
    volume: number;
    enabled: boolean;
  };
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

function round(value: number) {
  return Math.round(value);
}
export function setBorderColor(color: RgbColor) {
  return `SetBorderColor ${round(color.r)} ${round(color.g)} ${round(color.b)}${isDefined(color.a) ? ` ${Math.floor(color.a / 255)}` : ""}`;
}
export function setTextColor(color: RgbColor) {
  return `SetTextColor ${round(color.r)} ${round(color.g)} ${round(color.b)}${isDefined(color.a) ? ` ${Math.floor(color.a / 255)}` : ""}`;
}
export function setBackgroundColor(color: RgbColor) {
  return `SetBackgroundColor ${round(color.r)} ${round(color.g)} ${round(color.b)}${isDefined(color.a) ? ` ${Math.floor(color.a / 255)}` : ""}`;
}
export function setFontSize(size: number) {
  return `SetFontSize ${size}`;
}
export function playAlertSound(
  id: number,
  volume: number,
  positional?: boolean,
) {
  return `${positional ? "PlayAlertSoundPositional" : "PlayAlertSound"} ${id} ${volume}`;
}
export function dropSound(enable: boolean) {
  return enable ? "EnableDropSound" : "DisableDropSound";
}
export function alertSound(
  filePath: string,
  type: "custom" | "default" | "cached",
  allowMissingFile: boolean,
  volume: number,
) {
  if (type === "custom" || type === "cached") {
    return `CustomAlertSound${allowMissingFile ? "Optional" : ""} "${filePath}" ${volume}`;
  }
  return `PlayAlertSound ${filePath} ${volume}`;
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
  if (actions.dropSound?.enabled) {
    strs.push(dropSound(actions.dropSound.toggle));
  }

  const validSound = actions.sound?.path.value !== "";

  if (actions.sound?.enabled && validSound) {
    strs.push(
      alertSound(
        actions.sound.path.type === "default"
          ? actions.sound.path.value
          : actions.sound.path.path,
        actions.sound.path.type,
        false,
        actions.sound.volume,
      ),
    );
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
