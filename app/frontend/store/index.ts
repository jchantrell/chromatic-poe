import { chromatic } from "@app/lib/config";
import type { Filter, FilterRule } from "@app/lib/filter";
import type { Sound } from "@app/lib/sounds";
import { to } from "@app/lib/utils";
import { createMutable } from "solid-js/store";
import { toast } from "solid-sonner";

interface Store {
  activeRule: FilterRule | null;
  filter: Filter | null;
  filters: Filter[];
  initialised: boolean;
  locale: null | string;
  sounds: Sound[];
  defaultSounds: Sound[];
  appNeedsRestart: boolean;
  patchLoaded: boolean;
  poeCurrentVersions: { poe1: string; poe2: string } | null;
  iconSpritesheet: {
    url: string | undefined;
    height: number;
    width: number;
  };
}

export const store = createMutable<Store>({
  activeRule: null,
  filter: null,
  filters: [],
  initialised: false,
  locale: null,
  sounds: [],
  defaultSounds: [],
  appNeedsRestart: false,
  patchLoaded: false,
  poeCurrentVersions: null,
  iconSpritesheet: {
    url: undefined,
    height: 0,
    width: 0,
  },
});

export function removeFilter(filter: Filter) {
  store.filters = store.filters.filter((entry) => filter.name !== entry.name);
}

export function addFilter(filter: Filter) {
  store.filters.push(filter);
}

export function setFilter(filter: Filter | null) {
  store.filter = filter;
}

export function setActiveRule(rule: FilterRule | null) {
  store.activeRule = rule;
}

export function setInitialised(state: boolean) {
  store.initialised = state;
}

export function setPatchLoaded(state: boolean) {
  store.patchLoaded = state;
}

export function setLocale(locale: string | null) {
  store.locale = locale;
}

export function setPoeCurrentVersions(
  versions: { poe1: string; poe2: string } | null,
) {
  store.poeCurrentVersions = versions;
}

export async function setSounds(sounds: Sound[]) {
  store.sounds = sounds;
}

export function setIconSpritesheet(data: {
  url: string | undefined;
  height: number;
  width: number;
}) {
  store.iconSpritesheet = data;
}

export async function refreshSounds() {
  if (!store.initialised) {
    return;
  }
  console.log("Refreshing sounds...");
  const [err, cachedSounds] = await to(chromatic.getSounds(1));
  if (err) {
    toast.error("Cannot find sounds folder. Does it exist?");
    setSounds([]);
    store.defaultSounds = await chromatic.getDefaultSounds();
    return;
  }
  const updatedSounds = [];
  for (const sound of cachedSounds) {
    const exists = store.sounds.find((e) => e.id === sound.id);
    if (exists && exists.type === "cached") {
      updatedSounds.push(sound);
      continue;
    }
    if (!exists) {
      updatedSounds.push(sound);
    }
  }

  setSounds(
    [...store.sounds.filter((s) => s.type !== "cached"), ...updatedSounds].sort(
      (a, b) => a.displayName.localeCompare(b.displayName),
    ),
  );
  store.defaultSounds = await chromatic.getDefaultSounds();
}
