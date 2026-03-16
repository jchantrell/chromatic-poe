import { alphabeticalSort, stringifyJSON, to } from "@app/lib/utils";
import { setInitialised, setLocale, setSettingsOpen, store } from "@app/store";
import { getVersion } from "@tauri-apps/api/app";
import { invoke } from "@tauri-apps/api/core";
import { documentDir, homeDir, sep } from "@tauri-apps/api/path";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import {
  exists,
  readDir,
  readFile,
  writeTextFile,
} from "@tauri-apps/plugin-fs";
import { openPath } from "@tauri-apps/plugin-opener";
import { eol, locale, platform } from "@tauri-apps/plugin-os";
import { toast } from "solid-sonner";
import { Filter } from "./filter";
import { IDBManager, type MissingUniquesCache } from "./idb";
import type { PoeladderUnique } from "./poeladder";
import { DEFAULT_FILTER_SOUNDS, type Sound } from "./sounds";

function tryGetAppWindow(): ReturnType<typeof getCurrentWindow> | null {
  try {
    const appWindow = getCurrentWindow();
    return appWindow;
  } catch (_err) {
    return null;
  }
}

type SemVer = {
  major: number;
  minor: number;
  patch: number;
};

import type { FontOption } from "@app/lib/fonts";

export interface ChromaticConfiguration {
  version: string;
  poe1Directory?: string | null;
  poe2Directory?: string | null;
  font?: FontOption;
  poeladderUsername?: string | null;
  autosave?: boolean;
}

class Chromatic {
  config!: ChromaticConfiguration;
  runtime: "desktop" | "web";
  tauriWindow?: ReturnType<typeof getCurrentWindow> | null;
  db: IDBManager = new IDBManager();
  decoder = new TextDecoder("utf-8");

  constructor() {
    const appWindow = tryGetAppWindow();
    this.tauriWindow = appWindow;
    this.runtime = appWindow ? "desktop" : "web";
  }

  close() {
    if (this.tauriWindow) this.tauriWindow.close();
  }

  minimize() {
    if (this.tauriWindow) this.tauriWindow.minimize();
  }

  async init() {
    if (this.config) {
      return;
    }

    const db = await this.db.getInstance();
    const config = await db.get("config", "main");

    if (config) {
      this.config = await this.parseConfig(config);
    }

    if (!config) {
      console.log("Config does not exist. Creating with defaults...");
      const defaultConfig = await this.defaultConfig();
      await this.writeConfig(defaultConfig);
      this.config = defaultConfig;
    }

    setInitialised(true);
    if (this.runtime === "desktop") {
      setLocale(await locale());
    }
  }

  async parseConfig(
    config: ChromaticConfiguration,
  ): Promise<ChromaticConfiguration> {
    if (!config.version) {
      console.log(
        "Config seems corrupted. Replacing with current default",
        config,
      );

      const defaultConfig = await this.defaultConfig();
      await this.writeConfig(defaultConfig);
      return defaultConfig;
    }

    console.log(
      `Loaded version ${config.version} file. Validating and checking for necessary updates...`,
    );

    const configSemVer = this.semVer(config.version);

    const version = await this.getVersion();
    const semVer = this.semVer(version);

    if (!configSemVer) {
      console.log(
        "Configuration file version seems corrupted. Replacing with current default",
        config,
      );

      const defaultConfig = await this.defaultConfig();
      await this.writeConfig(defaultConfig);
      return defaultConfig;
    }

    if (configSemVer.major < semVer.major) {
      console.log("Configuration is from prior major version. Updating...", {
        current: version,
        config: config.version,
      });
      const updated = await this.migrateConfig(config, semVer, configSemVer);
      await this.writeConfig(updated);
      return updated;
    }

    if (
      configSemVer.major === semVer.major &&
      configSemVer.minor < semVer.minor
    ) {
      console.log("Configuration is from prior minor version. Updating...", {
        current: version,
        config: config.version,
      });
      const updated = await this.migrateConfig(config, semVer, configSemVer);
      await this.writeConfig(updated);
      return updated;
    }

    if (
      configSemVer.major === semVer.major &&
      configSemVer.minor === semVer.minor &&
      configSemVer.patch < semVer.patch
    ) {
      console.log("Configuration is from prior patch version. Updating...", {
        current: version,
        config: config.version,
      });
      const updated = await this.migrateConfig(config, semVer, configSemVer);
      await this.writeConfig(updated);
      return updated;
    }

    console.log("Configuration is up to date", config);
    return config as ChromaticConfiguration;
  }

  async writeConfig(config: ChromaticConfiguration) {
    const db = await this.db.getInstance();
    await db.put("config", config, "main");
    this.config = config;
    console.log("Successfully wrote config", config);
  }

  async migrateConfig(
    config: ChromaticConfiguration,
    currSemVer: SemVer,
    prevSemVer: SemVer,
  ) {
    console.log("Upgrade config", { config, currSemVer, prevSemVer });
    const defaultConfig = await this.defaultConfig();
    return { ...defaultConfig, ...config, version: defaultConfig.version };
  }

  semVer(version: string): SemVer {
    const nums = version.split(".").map((v) => Number.parseInt(v));
    return {
      major: nums[0],
      minor: nums[1],
      patch: nums[2],
    };
  }

  async getVersion(): Promise<string> {
    return this.runtime === "desktop"
      ? await getVersion()
      : import.meta.env.CHROMATIC_VERSION;
  }

  async defaultConfig(): Promise<ChromaticConfiguration> {
    const config: ChromaticConfiguration = {
      version: await this.getVersion(),
    };
    return config;
  }

  windowsPoeDirectory(docPath: string, version: 1 | 2): string {
    return `${docPath}\\My Games\\Path of Exile${version === 2 ? " 2" : ""}`;
  }

  linuxPoeDirectory(
    docPath: string | undefined,
    homePath: string | undefined,
    version: 1 | 2,
  ): string[] {
    return [
      `${homePath}/.local/share/Steam/steamapps/compatdata/238960/pfx/drive_c/users/steamuser/Documents/My Games/Path of Exile${version === 2 ? " 2" : ""}`,
      `${homePath}/.steam/root/steamapps/compatdata/238960/pfx/drive_c/users/steamuser/My Documents/My Games/Path of Exile${version === 2 ? " 2" : ""}`,
      `${docPath}/My Games/Path of Exile${version === 2 ? " 2" : ""}`,
    ];
  }

  async getAssumedPoeDirectory(version: 1 | 2): Promise<string | null> {
    const os = platform();

    if (os === "windows") {
      const docPath = await documentDir();
      return this.windowsPoeDirectory(docPath, version);
    }

    if (os === "linux") {
      const [, docPath] = await to(documentDir());
      const [, homePath] = await to(homeDir());

      const paths = this.linuxPoeDirectory(docPath, homePath, version);
      for (const path of paths) {
        const [, found] = await to(exists(path));
        if (found) return path;
      }
    }

    return null;
  }

  async getPoeDirectory(version: 1 | 2): Promise<string | null> {
    const os = platform();

    // Windows: always auto-detect (static location)
    if (os === "windows") {
      const docPath = await documentDir();
      return this.windowsPoeDirectory(docPath, version);
    }

    // Linux: use user-configured directory, fallback to auto-detect
    if (os === "linux") {
      const userConfigured =
        version === 1 ? this.config?.poe1Directory : this.config?.poe2Directory;

      if (userConfigured) {
        return userConfigured;
      }

      // Fallback to auto-detection
      return this.getAssumedPoeDirectory(version);
    }

    return null;
  }

  async pickPoeDirectory(version: 1 | 2): Promise<string | null> {
    const selected = await openDialog({
      directory: true,
      multiple: false,
      title: `Select Path of Exile${version === 2 ? " 2" : ""} Directory`,
    });
    return selected;
  }

  async setPoeDirectory(version: 1 | 2, path: string | null) {
    const key = version === 1 ? "poe1Directory" : "poe2Directory";
    const updated = { ...this.config, [key]: path };
    await this.writeConfig(updated);
  }

  async setFont(font: FontOption) {
    const updated = { ...this.config, font };
    await this.writeConfig(updated);
  }

  async setAutosave(enabled: boolean) {
    const updated = { ...this.config, autosave: enabled };
    await this.writeConfig(updated);
  }

  async setPoeladderUsername(username: string | null) {
    const updated = { ...this.config, poeladderUsername: username };
    await this.writeConfig(updated);
  }

  showDirectoryRequiredToast(version: 1 | 2) {
    if (!store.initialised) return;
    toast.error(`PoE${version} directory not configured`, {
      description: "Set your Path of Exile directory in settings.",
      action: {
        label: "Open Settings",
        onClick: () => setSettingsOpen(true),
      },
      duration: 6000,
    });
  }

  async getAllFilters() {
    const db = await this.db.getInstance();
    const rawFilters = await db.getAll("filters");
    const filters: Filter[] = [];
    for (const filter of rawFilters) {
      filter.lastUpdated = new Date(filter.lastUpdated);
      filters.push(new Filter(filter));
    }
    store.filters = filters;
    store.filters.sort(alphabeticalSort((filter) => filter.name));
  }

  async writeFilter(filter: Filter, silent = false) {
    if (this.runtime === "desktop") {
      const version = filter.poePatch.startsWith("3") ? 1 : 2;
      const dir = await this.getPoeDirectory(version);
      if (!dir) {
        if (platform() === "linux") {
          this.showDirectoryRequiredToast(version);
        }
        return;
      }
      const path = `${dir}${this.sep()}${filter.name}.filter`;
      await writeTextFile(path, filter.serialize());

      const canReload = platform() !== "linux";
      if (canReload) {
        setTimeout(async () => {
          await invoke("reload", { poeVersion: version });
        }, 250);
      }
      if (!silent) {
        toast("Wrote filter to PoE directory.");
      }
    }

    if (this.runtime === "web" && !silent) {
      const filename = `${filter.name}.filter`;
      const blob = new Blob([filter.serialize()], { type: "text" });
      const elem = window.document.createElement("a");
      elem.href = window.URL.createObjectURL(blob);
      elem.download = filename;
      document.body.appendChild(elem);
      elem.click();
      document.body.removeChild(elem);
    }
  }

  async saveFilter(filter: Filter, silent = false) {
    const doSave = async () => {
      const raw = JSON.parse(
        stringifyJSON({
          ...filter,
          lastUpdated: filter.lastUpdated.toISOString(), // FIXME: just store the ISO string always and convert to date adhoc
        }),
      );
      const db = await this.db.getInstance();
      await db.put("filters", raw, filter.name);
    };

    if (silent) {
      await doSave();
    } else {
      toast.promise(doSave, {
        success: "Saved filter",
        loading: "Saving filter...",
        error: "Failed to save filter",
      });
    }
  }

  async deleteFilter(filter: Filter) {
    toast.promise(
      async () => {
        const db = await this.db.getInstance();
        await db.delete("filters", filter.name);
        store.filters = store.filters.filter((f) => f.name !== filter.name);
      },
      {
        success: "Deleted filter",
        loading: "Deleting filter...",
        error: "Failed to delete filter",
      },
    );
  }

  async renameFilter(filter: Filter, newName: string) {
    toast.promise(
      async () => {
        const db = await this.db.getInstance();
        const oldName = filter.name;
        filter.setName(newName);
        await filter.save();
        await db.delete("filters", oldName);
      },
      {
        success: "Renamed filter",
        loading: "Renaming filter...",
        error: "Failed to rename filter",
      },
    );
  }

  async getDefaultSounds(): Promise<Sound[]> {
    function getLeadingNumber(str: string) {
      const match = str.match(/^\d+/);
      return match ? Number.parseInt(match[0]) : Number.POSITIVE_INFINITY;
    }

    return DEFAULT_FILTER_SOUNDS.sort((a, b) => {
      const numA = getLeadingNumber(a.displayName);
      const numB = getLeadingNumber(b.displayName);
      if (numA !== numB) return numA - numB;
      return a.displayName.localeCompare(b.displayName);
    }).map((sound) => ({
      displayName: sound.displayName,
      id: sound.id,
      path: sound.path,
      type: "default",
      data: null,
    }));
  }

  async getSounds(version: 1 | 2): Promise<Sound[]> {
    const sounds: Sound[] = [];

    if (this.runtime === "web") {
      const db = await this.db.getInstance();
      const cachedSounds = await db.getAll("sounds");
      return cachedSounds;
    }

    if (this.runtime === "desktop") {
      const dir = await this.getPoeDirectory(version);
      if (!dir) {
        throw new Error(`PoE ${version} directory is not set.`);
      }
      const audioExtensions = /\.(wav|mp3|ogg)$/i;
      const files = await this.getAllFiles(dir, "binary", {
        recursive: true,
        extensions: audioExtensions,
      });
      return files.map((f) => {
        const ext = f.name.split(".").pop()?.toLowerCase();
        let type = "audio/wav";
        if (ext === "mp3") type = "audio/mpeg";
        if (ext === "ogg") type = "audio/ogg";

        return {
          ...f,
          path: f.name,
          displayName: f.name,
          id: f.name,
          type: "custom",
          data: new Blob([f.data], { type }),
        };
      });
    }

    return sounds;
  }

  async uploadSounds(files: Sound[]) {
    if (this.runtime === "web") {
      const db = await this.db.getInstance();
      for (const file of files) {
        await db.put("sounds", file, file.id);
      }
    }
  }

  async openFileExplorer(path: string) {
    if (this.runtime === "desktop") {
      await openPath(path);
    }
  }

  async listImportableFilters(
    version: 1 | 2,
  ): Promise<{ name: string; data: string }[]> {
    if (this.runtime === "web") return [];

    const dir = await this.getPoeDirectory(version);
    if (!dir) {
      if (platform() === "linux") {
        this.showDirectoryRequiredToast(version);
      }
      return [];
    }

    const files = await this.getAllFiles(dir, "text");
    return files.filter(
      (file) =>
        file.name.endsWith(".filter") &&
        !store.filters.some(
          (filter) => filter.name === file.name.replace(/\.filter$/, ""),
        ),
    );
  }

  async getAllFiles<T extends "text" | "binary">(
    path: string,
    type: T,
    options?: { recursive?: boolean; baseDir?: string; extensions?: RegExp },
  ): Promise<
    {
      name: string;
      data: T extends "text" ? string : Uint8Array;
    }[]
  > {
    if (this.runtime !== "desktop") return [];
    const records = await readDir(path);
    const baseDir = options?.baseDir ?? path;
    const files = [];
    for (const record of records) {
      if (record.isFile) {
        if (options?.extensions && !options.extensions.test(record.name)) {
          continue;
        }
        const fullPath = `${path}/${record.name}`;
        const bytes = await readFile(fullPath);
        const relativeName =
          path === baseDir
            ? record.name
            : `${path.slice(baseDir.length + 1)}/${record.name}`;
        if (type === "text") {
          files.push({
            name: relativeName,
            data: this.decoder.decode(bytes),
          });
        }
        if (type === "binary") {
          files.push({ name: relativeName, data: bytes });
        }
      } else if (record.isDirectory && options?.recursive) {
        const subFiles = await this.getAllFiles(
          `${path}/${record.name}`,
          type,
          { recursive: true, baseDir, extensions: options.extensions },
        );
        files.push(...subFiles);
      }
    }
    return files as {
      name: string;
      data: T extends "text" ? string : Uint8Array;
    }[];
  }

  async saveMissingUniques(leagueSlug: string, uniques: PoeladderUnique[]) {
    const db = await this.db.getInstance();
    const cache: MissingUniquesCache = {
      uniques,
      lastRefreshed: new Date().toISOString(),
    };
    await db.put("missingUniques", cache, leagueSlug);
    return cache;
  }

  async loadMissingUniques(
    leagueSlug: string,
  ): Promise<MissingUniquesCache | undefined> {
    const db = await this.db.getInstance();
    return db.get("missingUniques", leagueSlug);
  }

  async loadAllMissingUniques(): Promise<Record<string, MissingUniquesCache>> {
    const db = await this.db.getInstance();
    const keys = await db.getAllKeys("missingUniques");
    const result: Record<string, MissingUniquesCache> = {};
    for (const key of keys) {
      const cache = await db.get("missingUniques", key);
      if (cache) result[key] = cache;
    }
    return result;
  }

  eol() {
    if (this.runtime === "desktop") return eol();
    if (this.runtime === "web") {
      if (navigator.userAgent.toLowerCase().indexOf("win") > -1) return "\r\n";
      return "\n";
    }
  }

  sep() {
    if (this.runtime === "desktop") return sep();
    if (this.runtime === "web") {
      if (navigator.userAgent.toLowerCase().indexOf("win") > -1) return "\\";
      return "/";
    }
  }
}

export const chromatic = new Chromatic();
export default chromatic;
