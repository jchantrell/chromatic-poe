import { chromatic } from "@app/lib/config";
import { DEFAULT_FONT, type FontOption } from "@app/lib/fonts";
import type { Filter, FilterRule } from "@app/lib/filter";
import type { MissingUniquesCache } from "@app/lib/idb";
import type { Sound } from "@app/lib/sounds";
import { to } from "@app/lib/utils";
import { createMutable } from "solid-js/store";
import { toast } from "solid-sonner";

interface Store {
  activeRule: FilterRule | null;
  autosave: boolean;
  filter: Filter | null;
  filters: Filter[];
  font: FontOption;
  initialised: boolean;
  locale: null | string;
  allUniques: Record<string, MissingUniquesCache>;
  missingUniques: Record<string, MissingUniquesCache>;
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
  settingsOpen: boolean;
}

export const store = createMutable<Store>({
  activeRule: null,
  autosave: false,
  filter: null,
  filters: [],
  font: DEFAULT_FONT,
  initialised: false,
  locale: null,
  allUniques: {},
  missingUniques: {},
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
  settingsOpen: false,
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

export function setFont(font: FontOption) {
  store.font = font;
}

export function setAutosave(enabled: boolean) {
  store.autosave = enabled;
}

export function setSettingsOpen(open: boolean) {
  store.settingsOpen = open;
}

export async function refreshSounds(version: 1 | 2 = 2) {
  if (!store.initialised) {
    return;
  }
  console.log("Refreshing sounds...");
  const [err, cachedSounds] = await to(chromatic.getSounds(version));
  if (err) {
    toast.error(
      err instanceof Error
        ? err.message
        : "Cannot find sounds folder. Does it exist?",
    );
    setSounds([]);
    store.defaultSounds = await chromatic.getDefaultSounds();
    return;
  }
  setSounds(
    cachedSounds.sort((a, b) => a.displayName.localeCompare(b.displayName)),
  );
  store.defaultSounds = await chromatic.getDefaultSounds();
}
