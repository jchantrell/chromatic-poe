import { getVersion } from "@tauri-apps/api/app";
import { documentDir, appConfigDir, sep } from "@tauri-apps/api/path";
import { Filter } from "@app/lib/filter";
import { WebStorage, DesktopStorage } from "@app/lib/storage";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { store, setInitialised, setLocale } from "@app/store";
import { alphabeticalSort, validJson } from "@pkgs/lib/utils";
import { locale } from "@tauri-apps/plugin-os";
import { openPath } from "@tauri-apps/plugin-opener";
import defaultFilterSounds from "@pkgs/data/poe2/sounds.json";

function tryGetAppWindow(): ReturnType<typeof getCurrentWindow> | null {
  try {
    const appWindow = getCurrentWindow();
    return appWindow;
  } catch (err) {
    return null;
  }
}

export interface BlobSound {
  displayName: string;
  id: string;
  path: string;
  type: "custom";
  data: Blob;
}
export interface FileSound {
  displayName: string;
  id: string;
  path: string;
  type: "custom";
  data: File;
}
export interface CachedSound {
  displayName: string;
  id: string;
  path: string;
  type: "cached";
  data: null;
}
export interface DefaultSound {
  displayName: string;
  id: string;
  path: string;
  type: "default";
  data: null;
}
export type Sound = BlobSound | FileSound | CachedSound | DefaultSound;

interface ChromaticConfiguration {
  version: string;
  poeDirectory: string | null;
}

class Chromatic {
  fileSystem: DesktopStorage | WebStorage;
  config!: ChromaticConfiguration;
  runtime: "desktop" | "web";
  tauriWindow?: ReturnType<typeof getCurrentWindow> | null;

  configPath!: string;
  soundPath = "sounds";
  filterPath = "filters";
  configFile = "config.json";

  constructor() {
    const appWindow = tryGetAppWindow();
    this.tauriWindow = appWindow;
    this.runtime = appWindow ? "desktop" : "web";
    this.fileSystem = appWindow ? new DesktopStorage() : new WebStorage();
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

    if (this.runtime === "web") {
      setInitialised(true);
      return;
    }

    this.configPath = await appConfigDir();

    await this.bootstrap();

    const configExists = await this.fileSystem.exists(
      `${this.configPath}/${this.configFile}`,
    );

    if (configExists) {
      console.log("Config exists. Reading file...");
      const raw = await this.fileSystem.readFile(
        `${this.configPath}/${this.configFile}`,
      );
      console.log("Raw config", raw);

      this.config = await this.parseConfig(raw);
    }

    if (!configExists) {
      console.log("Config does not exist. Creating with defaults...");
      const defaultConfig = await this.defaultConfig();
      await this.writeConfig(defaultConfig);
    }

    if (this.config?.poeDirectory) {
      setInitialised(true);
      setLocale(await locale());
    }
  }

  async bootstrap() {
    if (this.fileSystem.runtime !== "desktop") return;
    await this.fileSystem.upsertDirectory(`${this.configPath}`);
    await this.fileSystem.upsertDirectory(
      `${this.configPath}${sep()}${this.filterPath}`,
    );
    if (this.config?.poeDirectory) {
      await this.fileSystem.upsertDirectory(
        `${this.config.poeDirectory}${sep()}${this.soundPath}`,
      );
    }
  }

  async parseConfig(raw: string): Promise<ChromaticConfiguration> {
    if (!validJson(raw)) {
      console.log("Config seems corrupted. Replacing with current default");
      const defaultConfig = await this.defaultConfig();
      await this.writeConfig(defaultConfig);
      return defaultConfig;
    }

    const config = JSON.parse(raw);

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

    const configSemVer = config.version.split(".");

    const version = await getVersion();
    const semVer = version.split(".");

    if (
      !configSemVer[0] ||
      !configSemVer[1] ||
      !configSemVer[2] ||
      configSemVer.length > 3
    ) {
      console.log(
        "Configuration file version seems corrupted. Replacing with current default",
        config,
      );

      const defaultConfig = await this.defaultConfig();
      await this.writeConfig(defaultConfig);
      return defaultConfig;
    }

    if (configSemVer[0] < semVer[0]) {
      console.log("Configuration is from prior major version. Updating...", {
        current: version,
        config: config.version,
      });
      const updated = await this.migrateConfig(config, semVer, configSemVer);
      await this.writeConfig(updated);
      return updated;
    }

    if (configSemVer[0] === semVer[0] && configSemVer[1] < semVer[1]) {
      console.log("Configuration is from prior minor version. Updating...", {
        current: version,
        config: config.version,
      });
      const updated = await this.migrateConfig(config, semVer, configSemVer);
      await this.writeConfig(updated);
      return updated;
    }

    if (
      configSemVer[0] === semVer[0] &&
      configSemVer[1] === semVer[1] &&
      configSemVer[2] < semVer[2]
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
    const path = `${this.configPath}/${this.configFile}`; // TODO:
    await this.fileSystem.writeFile(path, "text", JSON.stringify(config));
    console.log(`Successfully wrote config to ${path}`, config);
    this.config = config;
  }

  async migrateConfig(
    config: ChromaticConfiguration,
    currSemVer: string[],
    prevSemVer: string[],
  ) {
    console.log("Not implemented", { config, currSemVer, prevSemVer });
    return this.defaultConfig();
  }

  async defaultConfig() {
    return {
      version: await getVersion(),
      poeDirectory: null,
    };
  }

  windowsPoeDirectory(docPath: string) {
    return `${docPath}\\Documents\\My Games\\Path of Exile 2`;
  }
  linuxPoeDirectory(docPath: string) {
    return `${docPath}/.steam/root/steamapps/compatdata/238960/pfx/drive_c/users/steamuser/My Documents/My Games/Path of Exile 2`;
  }

  async getAssumedPoeDirectory(os: string): Promise<string | null> {
    if (os === "windows") {
      const docPath = await documentDir();
      return this.windowsPoeDirectory(docPath);
    }

    if (os === "linux") {
      const docPath = await documentDir();
      return this.linuxPoeDirectory(docPath);
    }

    return null;
  }

  async updatePoeDirectory(path: string) {
    const updated = { ...this.config, poeDirectory: path };
    await this.writeConfig(updated);
    return { poeDirectory: path, config: this.config };
  }

  getFiltersPath(filter: Filter, newName?: string) {
    if (this.runtime === "web") {
      return `${this.filterPath}/${newName ? newName : filter.name}`;
    }
    return `${this.configPath}/${this.filterPath}/${newName ? newName : filter.name}.json`;
  }

  async getAllFilters() {
    const files = [];
    if (this.runtime === "web") {
      files.push(
        ...(await this.fileSystem.getAllFiles(this.filterPath, "text")),
      );
    }
    if (this.runtime === "desktop") {
      const filters = await this.fileSystem.getAllFiles(
        `${this.configPath}/${this.filterPath}`,
        "text",
      );
      files.push(...filters);
    }

    for (const file of files) {
      const props = JSON.parse(file.data);
      props.lastUpdated = new Date(props.lastUpdated);
      new Filter(props);
    }
    store.filters.sort(alphabeticalSort((filter) => filter.name));
  }

  async getDefaultSounds(): Promise<Sound[]> {
    // Helper function to extract number from start of string
    function getLeadingNumber(str: string) {
      const match = str.match(/^\d+/);
      return match ? Number.parseInt(match[0]) : Number.POSITIVE_INFINITY;
    }

    return [...defaultFilterSounds]
      .sort((a, b) => {
        // First compare by leading numbers
        const numA = getLeadingNumber(a.displayName);
        const numB = getLeadingNumber(b.displayName);
        if (numA !== numB) return numA - numB;

        // If numbers are equal or non-existent, sort alphabetically
        return a.displayName.localeCompare(b.displayName);
      })
      .map((sound) => ({
        displayName: sound.displayName,
        id: sound.id,
        path: sound.path,
        type: "default",
      }));
  }

  async getSounds(): Promise<Sound[]> {
    const sounds: Sound[] = [];
    if (this.runtime === "desktop") {
      const rawSounds = await this.fileSystem.getAllFiles(
        `${this.config.poeDirectory}${sep()}${this.soundPath}`,
        "binary",
      );
      for (const sound of rawSounds) {
        if (
          sound.name.endsWith(".wav") ||
          sound.name.endsWith(".mp3") ||
          sound.name.endsWith(".ogg")
        ) {
          const blob = new Blob([sound.data], { type: "audio/wav" });
          sounds.push({
            displayName: sound.name.split(".")[0],
            id: sound.name,
            path: `sounds/${sound.name}`,
            data: blob,
            type: "custom",
          });
        }
      }
    }
    if (this.runtime === "web") {
      const cachedSounds = await this.fileSystem.getAllFiles(
        this.soundPath,
        "text",
      );
      if (cachedSounds.length) {
        sounds.push(
          ...JSON.parse(cachedSounds[0].data).map((sound: Sound) => ({
            displayName: sound.displayName,
            id: sound.id,
            path: sound.path,
            type: "cached",
          })),
        );
      }
    }
    return sounds;
  }

  async uploadSounds(files: Sound[]) {
    if (this.runtime === "web") {
      this.fileSystem.writeFile(
        this.soundPath,
        "text",
        JSON.stringify(
          files.map((file) => ({
            displayName: file.displayName,
            id: file.id,
            path: file.path,
            type: "cached",
          })),
        ),
      );
    }
  }

  async openFileExplorer(path: string) {
    if (this.runtime === "desktop") {
      await openPath(path);
    }
  }
}

export const chromatic = new Chromatic();
export default chromatic;
