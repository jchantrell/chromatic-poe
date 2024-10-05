import { store } from "@app/store";
import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clone(object: object) {
  return JSON.parse(JSON.stringify(object));
}

export function recursivelySetKeys(
  object: Record<string, unknown>,
  path: (string | null)[],
  value: unknown,
) {
  let schema = object;
  for (let i = 0; i < path.length - 1; i++) {
    const entry = path[i];
    if (!entry) {
      continue;
    }
    const sameKey = path[i - 1] && entry === path[i - 1];
    if (!schema[entry] && !sameKey) {
      schema[entry] = {};
    }
    schema = sameKey ? schema : (schema[entry] as Record<string, unknown>);
  }
  schema[path[path.length - 1] as string] = value;
}

export function timeSince(date: Date | number): string {
  const timeMs = typeof date === "number" ? date : date.getTime();

  const deltaSeconds = Math.round((timeMs - Date.now()) / 1000);

  const cutoffs = [
    60,
    3600,
    86400,
    86400 * 7,
    86400 * 30,
    86400 * 365,
    Number.POSITIVE_INFINITY,
  ];

  const units: Intl.RelativeTimeFormatUnit[] = [
    "second",
    "minute",
    "hour",
    "day",
    "week",
    "month",
    "year",
  ];

  const unitIndex = cutoffs.findIndex(
    (cutoff) => cutoff > Math.abs(deltaSeconds),
  );

  const divisor = unitIndex ? cutoffs[unitIndex - 1] : 1;

  const rtf = new Intl.RelativeTimeFormat("en-US", {
    numeric: "auto",
  });
  return rtf.format(Math.floor(deltaSeconds / divisor), units[unitIndex]);
}

export async function to<T, U = Error>(
  promise: Promise<T>,
  errorExt?: object,
): Promise<[U, undefined] | [null, T]> {
  return promise
    .then<[null, T]>((data: T) => [null, data])
    .catch<[U, undefined]>((err: U) => {
      if (errorExt) {
        const parsedError = Object.assign({}, err, errorExt);
        return [parsedError, undefined];
      }

      return [err, undefined];
    });
}
