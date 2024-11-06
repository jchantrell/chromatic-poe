import { getVersion } from "@tauri-apps/api/app";
import { documentDir, appConfigDir } from "@tauri-apps/api/path";
import { Filter } from "@app/lib/filter";
import { WebStorage, DesktopStorage } from "@app/lib/storage";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { store, setInitialised, setLocale } from "@app/store";
import { alphabeticalSort } from "@pkgs/lib/utils";
import { locale } from "@tauri-apps/plugin-os";

function tryGetAppWindow(): ReturnType<typeof getCurrentWindow> | null {
  try {
    const appWindow = getCurrentWindow();
    return appWindow;
  } catch (err) {
    return null;
  }
}

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
  imagePath = "images";
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

      this.config = await this.parseConfig(raw);
    }

    if (!configExists) {
      console.log("Config does not exist. Creating with defaults...");
      const defaultConfig = await this.defaultConfig();
      await this.writeConfig(defaultConfig);
    }

    if (this.config.poeDirectory || this.runtime === "web") {
      setInitialised(true);
      setLocale(await locale());
      await this.getAllFilters();
    }
  }

  async bootstrap() {
    if (this.fileSystem.runtime !== "desktop") return;
    await this.fileSystem.upsertDirectory(`${this.configPath}`);
    await this.fileSystem.upsertDirectory(
      `${this.configPath}/${this.imagePath}`,
    );
    await this.fileSystem.upsertDirectory(
      `${this.configPath}/${this.filterPath}`,
    );
  }

  async parseConfig(raw: string): Promise<ChromaticConfiguration> {
    const config = JSON.parse(raw);

    if (!config.version) {
      console.log(
        "Configuration file seems corrupted. Replacing with current default",
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
    await this.fileSystem.writeFile(path, JSON.stringify(config));
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

  async getAssumedPoeDirectory(os: string): Promise<string | null> {
    if (os === "windows") {
      const docPath = await documentDir();
      return `${docPath}\\My Games\\Path of Exile`;
    }

    if (os === "linux") {
      const docPath = await documentDir();
      return `${docPath}/.steam/root/steamapps/compatdata/238960/pfx/drive_c/users/steamuser/My Documents/My Games/Path of Exile`;
    }

    return null;
  }

  async updatePoeDirectory(path: string) {
    const updated = { ...this.config, poeDirectory: path };
    await this.writeConfig(updated);
    return { poeDirectory: path, config: this.config };
  }

  getFiltersPath(filter: Filter, newName?: string) {
    return `${this.configPath}/${this.filterPath}/${newName ? newName : filter.name}.json`;
  }

  async getAllFilters() {
    const path = `${this.configPath}/${this.filterPath}`;
    const files = await this.fileSystem.getAllFiles(path);
    for (const file of files) {
      const props = JSON.parse(file);
      console.log(props);
      props.lastUpdated = new Date(props.lastUpdated);
      new Filter(props);
    }
    store.filters.sort(alphabeticalSort((filter) => filter.name));
  }
}

export const chromatic = new Chromatic();
export default chromatic;
