import { alphabeticalSort, stringifyJSON, to } from "@app/lib/utils";
import { setInitialised, setLocale, store } from "@app/store";
import { getVersion } from "@tauri-apps/api/app";
import { documentDir, homeDir } from "@tauri-apps/api/path";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { openPath } from "@tauri-apps/plugin-opener";
import { eol, locale, platform } from "@tauri-apps/plugin-os";
import { Filter } from "./filter";
import { DEFAULT_FILTER_SOUNDS, type Sound } from "./sounds";
import {
  exists,
  readDir,
  readFile,
  writeTextFile,
} from "@tauri-apps/plugin-fs";
import { IDBManager } from "./idb";
import { toast } from "solid-sonner";
import { invoke } from "@tauri-apps/api/core";

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

export interface ChromaticConfiguration {
  version: string;
}

export async function autosave() {
  if (store.filter) {
    await store.filter.save();
  }
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
    // not implemented
    console.log("Upgrade config", { config, currSemVer, prevSemVer });
    return this.defaultConfig();
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
    return `${docPath}\\Documents\\My Games\\Path of Exile${version === 2 ? " 2" : ""}`;
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

  async updatePoeDirectory(path: string) {
    const updated = { ...this.config, poeDirectory: path };
    await this.writeConfig(updated);
    return { poeDirectory: path, config: this.config };
  }

  async getAllFilters() {
    const db = await this.db.getInstance();
    const filters = await db.getAll("filters");
    for (const filter of filters) {
      filter.lastUpdated = new Date(filter.lastUpdated);
      new Filter(filter);
    }

    store.filters.sort(alphabeticalSort((filter) => filter.name));
  }

  async writeFilter(filter: Filter) {
    if (this.runtime === "desktop") {
      const version = filter.poePatch.startsWith("3") ? 1 : 2;
      const dir = await this.getAssumedPoeDirectory(version);
      if (!dir) return;
      const path = `${dir}/${filter.name}.filter`;
      await writeTextFile(path, filter.serialize());
      setTimeout(async () => {
        await invoke("reload");
      }, 250);
      toast("Wrote filter to PoE directory.");
    }

    if (this.runtime === "web") {
      const filename = `${filter.name}.filter`;
      const blob = new Blob([filter.serialize()], { type: "text" });
      if (window.navigator?.msSaveOrOpenBlob) {
        window.navigator.msSaveBlob(blob, filename);
      } else {
        const elem = window.document.createElement("a");
        elem.href = window.URL.createObjectURL(blob);
        elem.download = filename;
        document.body.appendChild(elem);
        elem.click();
        document.body.removeChild(elem);
      }
      toast("Exported filter. Check your downloads folder.");
    }
  }

  async saveFilter(filter: Filter) {
    toast.promise(
      async () => {
        const raw = JSON.parse(
          stringifyJSON({
            ...filter,
            lastUpdated: filter.lastUpdated.toISOString(), // FIXME: just store the ISO string always and convert to date adhoc
          }),
        );
        const db = await this.db.getInstance();
        await db.put("filters", raw, filter.name);
      },
      {
        success: "Saved filter",
        loading: "Saving filter...",
        error: "Failed to save filter",
      },
    );
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
      const dir = await this.getAssumedPoeDirectory(version);
      if (!dir) return [];
      const soundDir = `${dir}/sounds`;
      const files = await this.getAllFiles(soundDir, "text");
      return files
        .filter((file) => file.name.endsWith(".wav")) // TODO: support more files
        .map((f) => ({
          ...f,
          path: f.name,
          displayName: f.name,
          id: f.name,
          type: "custom",
          data: new Blob(), // FIXME:
        }));
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

    const dir = await this.getAssumedPoeDirectory(version);
    if (dir) {
      const files = await this.getAllFiles(dir, "text");
      return files.filter(
        (file) =>
          file.name.endsWith(".filter") &&
          !store.filters.some((filter) => filter.name === file.name),
      );
    }

    return [];
  }

  async getAllFiles<T extends "text" | "binary">(
    path: string,
    type: T,
  ): Promise<
    {
      name: string;
      data: T extends "text" ? string : Uint8Array;
    }[]
  > {
    if (this.runtime !== "desktop") return [];
    const records = await readDir(path);
    const files = [];
    for (const record of records) {
      if (record.isFile) {
        const bytes = await readFile(`${path}/${record.name}`);
        if (type === "text") {
          files.push({ name: record.name, data: this.decoder.decode(bytes) });
        }
        if (type === "binary") {
          files.push({ name: record.name, data: bytes });
        }
      }
    }
    return files as {
      name: string;
      data: T extends "text" ? string : Uint8Array;
    }[];
  }

  eol() {
    if (this.runtime === "desktop") return eol();
    if (this.runtime === "web") {
      if (navigator.userAgent.toLowerCase().indexOf("win") > -1) return "\r\n";
      return "\n";
    }
  }
}

export const chromatic = new Chromatic();
export default chromatic;
