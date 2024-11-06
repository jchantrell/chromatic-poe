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
    return false;
  }
  async writeFile(path: string, data: string) {
    return;
  }
  async deleteFile(path: string) {
    return;
  }
  async readFile(path: string) {
    return "";
  }
  async getAllFiles(path: string): Promise<string[]> {
    return [];
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
    return readTextFile(path);
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
