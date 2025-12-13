import { recursivelySetKeys } from "@app/lib/utils";
import fs from "node:fs";

const WIDTH = 64;
const HEIGHT = 64;
const SHEET_WIDTH = 896;

const re =
  /(LootFilter)(Large|Medium|Small)(Blue|Green|Brown|Red|White|Yellow|Cyan|Grey|Orange|Pink|Purple)(Circle|Diamond|Hexagon|Square|Star|Triangle|Cross|Moon|Raindrop|Kite|Pentagon|UpsideDownHouse)/;

function parseLootFilterId(id: string) {
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

export function extractMinimapIcons(icons: { Id: string }[], filePath: string) {
  console.log("Extracting minimap icons...");
  const table = {};

  for (let i = 0; i < icons.length; i++) {
    const icon = icons[i];
    if (!icon) break;
    if (icon.Id.startsWith("LootFilter")) {
      const match = parseLootFilterId(icon.Id);
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
  fs.writeFileSync(filePath, JSON.stringify(table));
}
