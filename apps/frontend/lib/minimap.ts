import type { Color, IconSize, Shape } from "@app/lib/action";
import { createStore } from "solid-js/store";

export type Coordinate = { x: number; y: number };

export type MinimapShapeData = Record<string, Record<string, Coordinate>>;
export type MinimapColorData = Record<string, MinimapShapeData>;

class MinimapIndex {
  private store = createStore<{
    data: MinimapColorData;
    isLoaded: boolean;
  }>({
    data: {},
    isLoaded: false,
  });

  get state() {
    return this.store[0];
  }

  private setStore = this.store[1];

  get data() {
    return this.state.data;
  }

  get isLoaded() {
    return this.state.isLoaded;
  }

  init(data: MinimapColorData) {
    this.setStore("data", data);
    this.setStore("isLoaded", true);
  }

  get(color: Color, shape: Shape, size: IconSize): Coordinate | undefined {
    return this.data[color]?.[shape]?.[size];
  }
}

export const minimapIndex = new MinimapIndex();
