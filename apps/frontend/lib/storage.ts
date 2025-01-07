import { open } from "@tauri-apps/plugin-dialog";
import {
  exists,
  mkdir,
  readDir,
  readFile,
  readTextFile,
  remove,
  rename,
  writeFile,
  writeTextFile,
} from "@tauri-apps/plugin-fs";
import { sep } from "@tauri-apps/api/path";
import { eol } from "@tauri-apps/plugin-os";

export interface FileSystem {
  runtime: "desktop" | "web";
  eol(): void;
  exists(path: string): Promise<boolean>;
  readFile(
    path: string,
    type: "text" | "binary",
  ): Promise<string | ArrayBuffer>;
  renameFile(oldPath: string, newPath: string): Promise<void>;
  writeFile(
    path: string,
    type: "text" | "binary",
    data: string | ArrayBuffer,
  ): Promise<void>;
  deleteFile(path: string): Promise<void>;
  getAllFiles<T extends "text" | "binary">(
    path: string,
    type: T,
  ): Promise<{ name: string; data: T extends "text" ? string : Uint8Array }[]>;
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
  async upsertDirectory(path: string) {
    return;
  }
  async pickDirectoryPrompt(): Promise<string | null> {
    return "";
  }
  async renameFile(oldPath: string, newPath: string): Promise<void> {
    return;
  }
  async exists(path: string): Promise<boolean> {
    console.log("Checking for file", path);
    const item = localStorage.getItem(path);
    return item !== null ? true : false;
  }

  async writeFile(path: string, type: "text" | "binary", data: string) {
    console.log("Writing file", path);
    localStorage.setItem(path, data);
  }
  async deleteFile(path: string) {
    console.log("Deleting file", path);
    localStorage.removeItem(path);
  }
  async readFile(path: string): Promise<string> {
    return localStorage.getItem(path) ?? "";
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
    const files = [];
    for (const key in localStorage) {
      // migrate legacy format, remove at some point in the future
      if (key === "filters") {
        const legacyFilters = JSON.parse(localStorage.getItem(key) ?? "{}");
        for (const filter in legacyFilters) {
          if (!localStorage.getItem(`filters/${filter}`)) {
            localStorage.setItem(`filters/${filter}`, legacyFilters[filter]);
            files.push({
              name: `filters/${filter}`,
              data: legacyFilters[filter],
            });
          }
        }
        localStorage.removeItem(key);
      }

      if (key.startsWith(path) && localStorage.getItem(key)) {
        files.push({ name: key, data: localStorage.getItem(key) });
      }
    }
    return files;
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
  async uploadFilePrompt(defaultPath?: string): Promise<string | null> {
    return await open({ file: true, defaultPath });
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
  async writeFile(
    path: string,
    type: "text" | "binary",
    data: string | ArrayBuffer,
  ) {
    if (type === "text") {
      await writeTextFile(path, data as string);
    } else {
      await writeFile(path, new Uint8Array(data as ArrayBuffer));
    }
  }

  async uploadFile(path: string, data: string) {}

  async getAllFiles<T extends "text" | "binary">(
    path: string,
    type: T,
  ): Promise<
    {
      name: string;
      data: T extends "text" ? string : Uint8Array;
    }[]
  > {
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
}
