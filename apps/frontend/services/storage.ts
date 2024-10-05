import { open } from "@tauri-apps/plugin-dialog";
import {
  BaseDirectory,
  exists,
  mkdir,
  readDir,
  readFile,
  readTextFile,
  remove,
  rename,
  writeTextFile,
} from "@tauri-apps/plugin-fs";
import { getVersion } from "@tauri-apps/api/app";
import { documentDir } from "@tauri-apps/api/path";
import { Filter, type StoredFilter } from "@app/services/filter";

interface ChromaticConfiguration {
  version: string;
  poeDirectory: string | null;
}

class FileSystem {
  config!: ChromaticConfiguration;
  isNativeRuntime = false;
  decoder = new TextDecoder("utf-8");

  imagePath = "images";
  filterPath = "filters";
  configPath = "config.json";

  async init() {
    if (this.config) {
      return;
    }

    this.isNativeRuntime = true;

    await this.bootstrap();

    const configExists = await exists(`${this.configPath}`, {
      baseDir: BaseDirectory.AppConfig,
    });

    if (configExists) {
      console.log("Config exists. Reading file...");
      const raw = await readTextFile(`${this.configPath}`, {
        baseDir: BaseDirectory.AppConfig,
      });

      this.config = await this.parseConfig(raw);
    }

    if (!configExists) {
      console.log("Config does not exist. Creating with defaults...");
      const defaultConfig = await this.defaultConfig();
      await this.writeConfig(defaultConfig);
    }
  }

  async bootstrap() {
    await this.upsertDirectory("chromatic", BaseDirectory.Config);
    await this.upsertDirectory(this.imagePath, BaseDirectory.AppConfig);
    await this.upsertDirectory(this.filterPath, BaseDirectory.AppConfig);
  }

  async pickDirectoryPrompt(defaultPath?: string): Promise<string | null> {
    return await open({ directory: true, defaultPath });
  }

  async upsertDirectory(path: string, baseDir: BaseDirectory) {
    console.log("Checking for directory...", path);
    const dirExists = await exists(path, {
      baseDir,
    });
    if (!dirExists) {
      console.log("Creating directory...", path);
      await mkdir(path, { baseDir });
    }
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
    const path = `${this.configPath}`;
    await writeTextFile(path, JSON.stringify(config), {
      baseDir: BaseDirectory.AppConfig,
    });
    console.log(`Successfully wrote config to ${path}`, config);
    this.config = config;
  }

  async migrateConfig(
    config: ChromaticConfiguration,
    currSemVer: string[],
    prevSemVer: string[],
  ) {
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

  async checkPoeDirectory(path: string) {
    return await exists(path, {});
  }

  getFiltersPath(filter: Filter, newName?: string) {
    return `${this.filterPath}/${newName ? newName : filter.name}.json`;
  }

  async updateFilterName(filter: Filter, newName: string) {
    await rename(
      this.getFiltersPath(filter),
      this.getFiltersPath(filter, newName),
      {
        oldPathBaseDir: BaseDirectory.AppConfig,
        newPathBaseDir: BaseDirectory.AppConfig,
      },
    );
    filter.updateName(newName);
    return this.writeFilter(filter);
  }

  async deleteFilter(filter: Filter) {
    await remove(this.getFiltersPath(filter), {
      baseDir: BaseDirectory.AppConfig,
    });
  }

  async writeFilter(filter: Filter) {
    if (!this.isNativeRuntime) {
      return filter;
    }

    filter.marshall();

    await writeTextFile(this.getFiltersPath(filter), JSON.stringify(filter), {
      baseDir: BaseDirectory.AppConfig,
    });

    filter.unmarshall();
    return filter;
  }

  async listFilters() {
    const entries = await readDir(this.filterPath, {
      baseDir: BaseDirectory.AppConfig,
    });
    const filters: Filter[] = [];
    for (const entry of entries) {
      if (entry.isFile) {
        const bytes = await readFile(`${this.filterPath}/${entry.name}`, {
          baseDir: BaseDirectory.AppConfig,
        });
        const filter: StoredFilter = JSON.parse(this.decoder.decode(bytes));
        console.log(filter);
        const entity = new Filter(filter);
        filters.push(entity);
      }
    }
    return filters.sort(
      (a, b) =>
        new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
    );
  }
}

export const fileSystem = new FileSystem();
