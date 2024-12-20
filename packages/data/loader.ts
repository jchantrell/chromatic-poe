// MIT License
//
// Copyright (c) 2020 Alexander Drozdov
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//
// Implementation adapted from https://github.com/SnosMe/poe-dat-viewer/lib/src/cli/bundle-loaders.ts

import {
  decompressSliceInBundle,
  getFileInfo,
  readIndexBundle,
} from "pathofexile-dat/bundles.js";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const BUNDLE_DIR = "Bundles2";

export class FileLoader {
  private bundleCache = new Map<string, ArrayBuffer>();
  private cacheDir: string;

  constructor(
    private cacheRoot: string,
    private patchVer: string,
    private index?: {
      bundlesInfo: Uint8Array;
      filesInfo: Uint8Array;
    },
  ) {
    this.cacheDir = path.join(this.cacheRoot, this.patchVer);
  }

  async init() {
    console.log("Loading bundles index...");
    try {
      await fs.access(this.cacheDir);
    } catch {
      console.log("Creating new bundle cache...");
      // await fs.rm(this.cacheRoot, { recursive: true, force: true });
      await fs.mkdir(this.cacheDir, { recursive: true });
    }

    const indexBin = await this.fetchFile("_.index.bin");
    const indexBundle = decompressSliceInBundle(new Uint8Array(indexBin));
    const _index = readIndexBundle(indexBundle);
    this.index = {
      bundlesInfo: _index.bundlesInfo,
      filesInfo: _index.filesInfo,
    };
  }

  async fetchFile(name: string): Promise<ArrayBuffer> {
    const cachedFilePath = path.join(this.cacheDir, name.replace(/\//g, "@"));

    try {
      await fs.access(cachedFilePath);
      const bundleBin = await fs.readFile(cachedFilePath);
      return bundleBin;
    } catch {}

    console.log(`Loading from CDN: ${name} ...`);

    const webpath = `/${this.patchVer}/${BUNDLE_DIR}/${name}`;
    const response = await fetch(
      webpath.startsWith("/4.")
        ? `https://patch-poe2.poecdn.com${webpath}`
        : `https://patch.poecdn.com${webpath}`,
    );
    if (!response.ok) {
      console.error(`Failed to fetch ${name} from CDN.`);
      process.exit(1);
    }
    const bundleBin = await response.arrayBuffer();
    await fs.writeFile(
      cachedFilePath,
      Buffer.from(bundleBin, 0, bundleBin.byteLength),
    );
    return bundleBin;
  }

  private async fetchBundle(name: string) {
    let bundleBin = this.bundleCache.get(name);
    if (!bundleBin) {
      bundleBin = await this.fetchFile(name);
      this.bundleCache.set(name, bundleBin);
    }
    return bundleBin;
  }

  async getFileContents(fullPath: string): Promise<Uint8Array> {
    const contents = await this.tryGetFileContents(fullPath);
    if (!contents) {
      throw new Error(`File no longer exists: ${fullPath}`);
    }
    return contents;
  }

  async tryGetFileContents(fullPath: string): Promise<Uint8Array | null> {
    const location = getFileInfo(
      fullPath,
      this.index.bundlesInfo,
      this.index.filesInfo,
    );
    if (!location) return null;

    const bundleBin = await this.fetchBundle(location.bundle);
    return decompressSliceInBundle(
      new Uint8Array(bundleBin),
      location.offset,
      location.size,
    );
  }

  clearBundleCache() {
    this.bundleCache.clear();
  }
}
