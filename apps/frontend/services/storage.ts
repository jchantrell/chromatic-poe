import { open } from "@tauri-apps/plugin-dialog";
import {
  BaseDirectory,
  exists,
  mkdir,
  readDir,
  readFile,
  readTextFile,
  remove,
  writeTextFile,
} from "@tauri-apps/plugin-fs";
import { getVersion } from "@tauri-apps/api/app";
import { documentDir } from "@tauri-apps/api/path";
import type { Filter, ItemHierarchy } from "@app/types";

const DIR_NAME = "chromatic";

interface ChromaticConfiguration {
  version: string;
  poeDirectory: string | null;
}

class FileSystem {
  config!: ChromaticConfiguration;
  isNativeRuntime = false;
  decoder = new TextDecoder("utf-8");

  imagePath = `${DIR_NAME}/images`;
  filterPath = `${DIR_NAME}/filters`;
  configPath = `${DIR_NAME}/config.json`;

  async bootstrap() {
    await mkdir(DIR_NAME, { baseDir: BaseDirectory.Config });
    await mkdir(this.imagePath, { baseDir: BaseDirectory.Config });
    await mkdir(this.filterPath, { baseDir: BaseDirectory.Config });
  }

  async pickDirectoryPrompt(defaultPath?: string): Promise<string | null> {
    return await open({ directory: true, defaultPath });
  }

  async init() {
    if (this.config) {
      return;
    }

    this.isNativeRuntime = true;

    console.log("Checking for Chromatic directory...");
    const dirExists = await exists(DIR_NAME, {
      baseDir: BaseDirectory.Config,
    });

    if (!dirExists) {
      console.log(
        "Directory doesn't exist. Bootstrapping Chromatic directory...",
      );
      await this.bootstrap();
    }

    const configExists = await exists(`${this.configPath}`, {
      baseDir: BaseDirectory.Config,
    });

    if (configExists) {
      console.log("Config exists. Reading file...");
      const raw = await readTextFile(`${this.configPath}`, {
        baseDir: BaseDirectory.Config,
      });

      this.config = await this.parseConfig(raw);
    }

    if (!configExists) {
      console.log("Config does not exist. Creating with defaults...");
      const defaultConfig = await this.defaultConfig();
      await this.writeConfig(defaultConfig);
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
      baseDir: BaseDirectory.Config,
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

  async getFilterPath(os: string): Promise<string | null> {
    if (os === "windows") {
      const docPath = await documentDir();
      return `${docPath}/My Games/Path of Exile`;
    }

    if (os === "linux") {
      const docPath = await documentDir();
      return `${docPath}/.steam/root/steamapps/compatdata/238960/pfx/drive_c/users/steamuser/My Documents/My Games/Path of Exile`;
    }

    return null;
  }

  async updateFilterName(filter: Filter, newName: string) {
    console.log(`Updating ${filter.name} to ${newName}`);
    await this.writeFilter({ ...filter, name: newName });
    await this.deleteFilter(filter);
  }

  async updateFilterPath(path: string) {
    const updated = { ...this.config, poeDirectory: path };
    await this.writeConfig(updated);
    return { poeDirectory: path, config: this.config };
  }

  async deleteFilter(filter: Filter) {
    const path = `${this.filterPath}/${filter.name}.json`;
    await remove(path, { baseDir: BaseDirectory.Config });
  }

  async writeFilter(filter: Filter) {
    if (!this.isNativeRuntime) {
      return;
    }

    const path = `${this.filterPath}/${filter.name}.json`;
    await writeTextFile(path, this.marshallFilter(filter), {
      baseDir: BaseDirectory.Config,
    });
  }

  async listFilters() {
    const entries = await readDir(this.filterPath, {
      baseDir: BaseDirectory.Config,
    });
    const filters: Filter[] = [];
    for (const entry of entries) {
      if (entry.isFile) {
        const bytes = await readFile(`${this.filterPath}/${entry.name}`, {
          baseDir: BaseDirectory.Config,
        });
        const filter: Filter = JSON.parse(this.decoder.decode(bytes));
        filter.name = entry.name.substring(0, entry.name.length - 5);
        filters.push(this.unmarshallFilter(filter));
      }
    }
    return filters.sort(
      (a, b) =>
        new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
    );
  }

  marshallFilter(filter: Filter): ReturnType<typeof JSON.stringify> {
    this.removeParentRefs(filter.rules);
    return JSON.stringify(filter);
  }

  unmarshallFilter(filter: Filter) {
    this.addParentRefs(filter.rules);
    return filter;
  }

  removeParentRefs(hierarchy: ItemHierarchy) {
    hierarchy.parent = undefined;
    for (const child of hierarchy.children) {
      this.removeParentRefs(child);
    }
    return hierarchy;
  }

  addParentRefs(hierarchy: ItemHierarchy) {
    for (const child of hierarchy.children) {
      child.parent = hierarchy;
      this.addParentRefs(child);
    }
  }
}

export const fileSystem = new FileSystem();
