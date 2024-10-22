import type { IntRange } from "@pkgs/lib/types";

type RgbRange = IntRange<0, 255>;

export enum Color {
  red = "Red",
  green = "Green",
  blue = "Blue",
  brown = "Brown",
  white = "White",
  yellow = "Yellow",
  cyan = "Cyan",
  grey = "Grey",
  orange = "Orange",
  pink = "Pink",
  purple = "Purple",
}

export enum Shape {
  circle = "Circle",
  diamond = "Diamond",
  hexagon = "Hexagon",
  square = "Square",
  star = "Star",
  triangle = "Triangle",
  cross = "Cross",
  moon = "Moon",
  raindrop = "Raindrop",
  kite = "Kite",
  pentagon = "Pentagon",
  upsideDownHouse = "UpsideDownHouse",
}

export enum Beam {
  perm = "",
  temp = "Temp",
}

export class ActionBuilder {
  setBorderColor(r: RgbRange, g: RgbRange, b: RgbRange, a: RgbRange = 255) {
    return `SetBorderColor ${r} ${g} ${b} ${a}`;
  }
  setTextColor(r: RgbRange, g: RgbRange, b: RgbRange, a: RgbRange = 255) {
    return `SetTextColor ${r} ${g} ${b} ${a}`;
  }
  setBackgroundColor(r: RgbRange, g: RgbRange, b: RgbRange, a: RgbRange = 255) {
    return `SetBackgroundColor ${r} ${g} ${b} ${a}`;
  }
  setFontSize(size: IntRange<18, 45>) {
    return `SetFontSize ${size}`;
  }
  playAlertSound(
    id: IntRange<1, 16>,
    volume: IntRange<0, 300>,
    positional?: boolean,
  ) {
    return `${positional ? "PlayAlertSoundPositional" : "PlayAlertSound"} ${id} ${volume}`;
  }
  dropSound(enable: boolean) {
    return enable ? "EnableDropSound" : "DisableDropSound";
  }
  customAlertSound(filePath: string) {
    return `CustomAlertSound ${filePath}`;
  }
  minimapIcon(size: IntRange<0, 2>, color: Color, shape: Shape) {
    return `MinimapIcon ${size} ${color} ${shape}`;
  }
  playEffect(color: Color, temporary?: boolean) {
    return `PlayEffect ${color}${temporary ? " Temp" : ""}`;
  }
}
