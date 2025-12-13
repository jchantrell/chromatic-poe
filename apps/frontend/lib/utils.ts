import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function camelCase(str: string) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
      index === 0 ? word.toLowerCase() : word.toUpperCase(),
    )
    .replace(/\s+/g, "");
}

export function isDefined(val: unknown) {
  return typeof val !== "undefined";
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function validJson(json: string) {
  try {
    JSON.parse(json);
    return true;
  } catch (_e) {
    return false;
  }
}

export function clone<T extends object>(object: T): T {
  return JSON.parse(stringifyJSON(object));
}

export function stringifyJSON(obj: object) {
  const seen = new WeakSet();
  return JSON.stringify(obj, (_, v: unknown) => {
    if (v !== null && typeof v === "object") {
      if (seen.has(v)) return;
      seen.add(v);
    }
    return v;
  });
}

export function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const chronologicalSort =
  <T>(value: (object: T) => Date) =>
  (a: T, b: T) => {
    return value(b) > value(a);
  };

export const alphabeticalSort =
  <T>(value: (object: T) => string) =>
  (a: T, b: T) => {
    const A = value(a).toUpperCase();
    const B = value(b).toUpperCase();
    if (A < B) {
      return -1;
    }
    if (A > B) {
      return 1;
    }
    return 0;
  };

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

export const withRetries = async <
  F extends (...arg: unknown[]) => ReturnType<F>,
>(
  fn: F,
  description?: string,
): Promise<ReturnType<F>> => {
  const attempts = 3;
  const baseDelay = 1000;

  let attempt = 1;

  const execute = async (): Promise<ReturnType<F>> => {
    try {
      return fn();
    } catch (error) {
      if (attempt >= attempts) {
        throw error;
      }

      const delay = baseDelay * 2 ** attempt;
      const sleep = delay / 2 + integerBetween(0, delay / 2);
      console.debug(
        `${description ? `${description} - ` : ""}Retry attempt ${attempt} after ${sleep}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, sleep));

      attempt++;

      return execute();
    }
  };

  return execute();
};

export const integerBetween = (max: number, min: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export function recursivelySetKeys(
  object: Record<string, any>,
  path: (string | null)[],
  value: object,
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
    schema = sameKey ? schema : schema[entry];
  }
  schema[path[path.length - 1] as string] = value;
}
