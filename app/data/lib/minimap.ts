const WIDTH = 64;
const SHEET_WIDTH = 896;

const RE =
  /(LootFilter)(Large|Medium|Small)(Blue|Green|Brown|Red|White|Yellow|Cyan|Grey|Orange|Pink|Purple)(Circle|Diamond|Hexagon|Square|Star|Triangle|Cross|Moon|Raindrop|Kite|Pentagon|UpsideDownHouse)/;

type RecursiveObject = { [key: string]: unknown };

function recursivelySetKeys(
  object: RecursiveObject,
  path: (string | null)[],
  value: unknown,
) {
  let schema = object;
  for (let i = 0; i < path.length - 1; i++) {
    const entry = path[i];
    if (!entry) continue;
    const sameKey = path[i - 1] && entry === path[i - 1];
    if (!schema[entry] && !sameKey) {
      schema[entry] = {};
    }
    schema = sameKey ? schema : (schema[entry] as RecursiveObject);
  }
  schema[path[path.length - 1] as string] = value;
}

export function extractMinimapCoords(
  icons: { Id: string }[],
): Record<string, unknown> {
  const table: RecursiveObject = {};
  const perRow = SHEET_WIDTH / WIDTH;

  for (let i = 0; i < icons.length; i++) {
    const icon = icons[i];
    if (!icon?.Id?.startsWith("LootFilter")) continue;

    const match = icon.Id.match(RE);
    if (!match) continue;

    const size = match[2];
    const color = match[3];
    const shape = match[4];
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    const x = col * WIDTH;
    const y = row * WIDTH;

    recursivelySetKeys(table, [color, shape, size], { x, y });
  }

  return table;
}
