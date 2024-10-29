export interface DifferenceCreate {
  type: "CREATE";
  path: (string | number)[];
  value: unknown;
}

export interface DifferenceRemove {
  type: "REMOVE";
  path: (string | number)[];
  oldValue: unknown;
}

export interface DifferenceChange {
  type: "CHANGE";
  path: (string | number)[];
  value: unknown;
  oldValue: unknown;
}

export type Difference = DifferenceCreate | DifferenceRemove | DifferenceChange;

interface Options {
  cyclesFix: boolean;
  bannedKeys: string[];
}

const richTypes = { Date: true, RegExp: true, String: true, Number: true };

export default function diff<T>(
  obj: Record<string, T> | T[],
  newObj: Record<string, T> | T[],
  options: Partial<Options> = { cyclesFix: true, bannedKeys: [] },
  _stack: Record<string, unknown>[] = [],
): Difference[] {
  const diffs: Difference[] = [];
  const isObjArray = Array.isArray(obj);

  for (const key in obj) {
    if (options.bannedKeys?.includes(key)) continue;
    const objKey = obj[key];
    const path = isObjArray ? +key : key;
    if (!(key in newObj)) {
      diffs.push({
        type: "REMOVE",
        path: [path],
        oldValue: obj[key],
      });
      continue;
    }
    const newObjKey = newObj[key];
    const areCompatibleObjects =
      typeof objKey === "object" &&
      typeof newObjKey === "object" &&
      Array.isArray(objKey) === Array.isArray(newObjKey);
    if (
      objKey &&
      newObjKey &&
      areCompatibleObjects &&
      !richTypes[Object.getPrototypeOf(objKey)?.constructor?.name] &&
      (!options.cyclesFix || !_stack.includes(objKey))
    ) {
      const nestedDiffs = diff(
        objKey,
        newObjKey,
        options,
        options.cyclesFix ? _stack.concat([objKey]) : [],
      );
      diffs.push.apply(
        diffs,
        nestedDiffs.map((difference) => {
          difference.path.unshift(path);
          return difference;
        }),
      );
    } else if (
      objKey !== newObjKey &&
      // treat NaN values as equivalent
      !(Number.isNaN(objKey) && Number.isNaN(newObjKey)) &&
      !(
        areCompatibleObjects &&
        (Number.isNaN(objKey)
          ? `${objKey}` === `${newObjKey}`
          : +objKey === +newObjKey)
      )
    ) {
      diffs.push({
        path: [path],
        type: "CHANGE",
        value: newObjKey,
        oldValue: objKey,
      });
    }
  }

  const isNewObjArray = Array.isArray(newObj);
  for (const key in newObj) {
    if (options.bannedKeys?.includes(key)) continue;
    if (!(key in obj)) {
      diffs.push({
        type: "CREATE",
        path: [isNewObjArray ? +key : key],
        value: newObj[key],
      });
    }
  }
  return diffs;
}
