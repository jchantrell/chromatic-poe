import { open } from "@tauri-apps/plugin-dialog";
import {
  exists,
  mkdir,
  readDir,
  readFile,
  readTextFile,
  remove,
  rename,
  writeTextFile,
} from "@tauri-apps/plugin-fs";
import { sep } from "@tauri-apps/api/path";
import { eol } from "@tauri-apps/plugin-os";

export interface FileSystem {
  runtime: "desktop" | "web";
  eol(): void;
  exists(path: string): Promise<boolean>;
  readFile(path: string): Promise<string>;
  renameFile(oldPath: string, newPath: string): Promise<void>;
  writeFile(path: string, data: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
  getAllFiles(path: string): Promise<string[]>;
  truncatePath(path: string): string;
  pickDirectoryPrompt(): Promise<string | null>;
}

export class WebStorage implements FileSystem {
  runtime = "web" as const;
  eol() {
    if (navigator.userAgent.toLowerCase().indexOf("win") > -1) return "\r\n";
    return "\n";
  }
  truncatePath(path: string) {
    return path;
  }
  async pickDirectoryPrompt(): Promise<string | null> {
    return "";
  }
  async renameFile(oldPath: string, newPath: string): Promise<void> {
    return;
  }
  async exists(path: string) {
    const split = path.split("/");
    const filters = localStorage.getItem(split[0]);
    return false;
  }
  async writeFile(path: string, data: string) {
    const split = path.split("/");
    const files = localStorage.getItem(split[0]);
    const filters = JSON.parse(files ?? "{}");
    filters[split[1]] = data;
    localStorage.setItem(split[0], JSON.stringify(filters));
  }
  async deleteFile(path: string) {
    const split = path.split("/");
    const files = localStorage.getItem(split[0]);
    const filters = JSON.parse(files ?? "{}");
    filters[split[1]] = undefined;
    localStorage.setItem(split[0], JSON.stringify(filters));
  }
  async readFile(path: string): Promise<string> {
    const split = path.split("/");
    const files = localStorage.getItem(split[0]);
    const filters = JSON.parse(files ?? "{}");
    return filters[split[1]];
  }
  async getAllFiles(path: string): Promise<string[]> {
    const files = localStorage.getItem(path);
    const filters = JSON.parse(files ?? "{}");
    return Object.entries(filters).map(([_, value]) => value) as string[];
  }
}

export class DesktopStorage implements FileSystem {
  runtime = "desktop" as const;
  decoder = new TextDecoder("utf-8");
  eol() {
    return eol();
  }
  truncatePath(path: string) {
    const split = path.split(sep());
    return split.slice(Math.max(split.length - 3, 0)).join(sep());
  }
  async pickDirectoryPrompt(defaultPath?: string): Promise<string | null> {
    return await open({ directory: true, defaultPath });
  }

  async upsertDirectory(path: string) {
    console.log("Checking for directory...", path);
    const dirExists = await exists(path);
    if (!dirExists) {
      console.log("Creating directory...", path);
      await mkdir(path);
    }
  }
  async exists(path: string) {
    return await exists(path, {});
  }
  async renameFile(oldPath: string, newPath: string): Promise<void> {
    await rename(oldPath, newPath);
  }
  async readFile(path: string) {
    const bytes = await readTextFile(path);
    return this.decoder.decode(bytes);
  }
  async deleteFile(path: string) {
    await remove(path);
  }
  async writeFile(path: string, data: string) {
    await writeTextFile(path, data);
  }

  async getAllFiles(path: string) {
    const records = await readDir(path);
    const files = [];
    for (const record of records) {
      if (record.isFile) {
        const bytes = await readFile(`${path}/${record.name}`);
        files.push(this.decoder.decode(bytes));
      }
    }
    return files;
  }
}
