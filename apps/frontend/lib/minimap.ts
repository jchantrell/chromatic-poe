import type { Color, IconSize, Shape } from "@app/lib/action";
import { recursivelySetKeys } from "@app/lib/utils";
import { toast } from "solid-sonner";
import type { ArtManager } from "./art";
import type { IDBManager } from "./idb";

const WIDTH = 64;
const HEIGHT = 64;
export const SHEET_WIDTH = 896;
export const SHEET_HEIGHT = 3200;

export type MinimapCoords = {
  [key in Color]: {
    [key in Shape]: { [key in IconSize]: { x: number; y: number } };
  };
};

const re =
  /(LootFilter)(Large|Medium|Small)(Blue|Green|Brown|Red|White|Yellow|Cyan|Grey|Orange|Pink|Purple)(Circle|Diamond|Hexagon|Square|Star|Triangle|Cross|Moon|Raindrop|Kite|Pentagon|UpsideDownHouse)/;

export class MinimapManager {
  coords: MinimapCoords | undefined;

  constructor(
    private art: ArtManager,
    private db: IDBManager,
  ) {}

  async getIcons(patch: string): Promise<MinimapCoords | undefined> {
    const db = await this.db.getInstance();
    const gameVersion = patch.startsWith("3") ? 1 : 2;
    const coordsKey = `${gameVersion}/coords`;
    const coords = await db.get("minimap", coordsKey);

    if (!coords) {
      toast.error("Could not find unique. Please clear cache and resync.");
      return;
    }

    this.coords = coords;
    return coords;
  }

  async extract(patch: string, icons: { Id: string }[]) {
    console.log("Extracting minimap icons...");
    const table = {};
    const gameVersion = patch.startsWith("3") ? 1 : 2;

    await this.art.ensureCached(patch, [
      {
        name: "minimap",
        path: "Art/2DArt/Minimap/Player.dds",
      },
    ]);

    for (let i = 0; i < icons.length; i++) {
      const icon = icons[i];
      if (!icon) break;
      if (icon.Id.startsWith("LootFilter")) {
        const match = this.parseLootFilterId(icon.Id);
        if (!match) {
          console.log(`Couldn't parse ${icon.Id}`);
          continue;
        }
        const { size, color, shape } = match;
        const perRow = SHEET_WIDTH / WIDTH;
        const row = Math.floor(i / perRow);
        const col = i % perRow;
        const x = col * WIDTH;
        const y = row * HEIGHT;
        recursivelySetKeys(table, [color, shape, size], { x, y });
      }
    }

    const cacheKey = `${gameVersion}/coords`;
    const db = await this.db.getInstance();
    await db.put("minimap", table as MinimapCoords, cacheKey);
    this.coords = table as MinimapCoords;
    return table;
  }

  parseLootFilterId(id: string) {
    const match = id.match(re);
    if (!match) {
      return null;
    }
    return {
      prefix: match[1],
      size: match[2],
      color: match[3],
      shape: match[4],
    };
  }
}
