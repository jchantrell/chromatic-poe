import {
  decompressSliceInBundle,
  getFileInfo,
  readIndexBundle,
} from "pathofexile-dat/bundles.js";
import type { IDBManager } from "./idb";
import { withRetries } from "./utils";

const BUNDLE_DIR = "Bundles2";

export class BundleManager {
  index?: {
    bundlesInfo: Uint8Array;
    filesInfo: Uint8Array;
  };

  constructor(private db: IDBManager) {}

  async init(patch: string) {
    if (!patch) return;
    console.log("Loading bundles index...");
    const indexBin = await this.fetchFile(patch, "_.index.bin");
    const indexBundle = decompressSliceInBundle(new Uint8Array(indexBin));
    const _index = readIndexBundle(indexBundle);
    this.index = {
      bundlesInfo: _index.bundlesInfo,
      filesInfo: _index.filesInfo,
    };
  }

  getCdnUrl(patch: string) {
    const isPoe2 = patch.startsWith("4.");
    const baseUrl = isPoe2
      ? "https://patch-poe2.poecdn.com"
      : "https://patch.poecdn.com";
    const proxyUrl =
      import.meta.env.VITE_CORS_PROXY_URL || "https://corsproxy.io/?";
    return `${proxyUrl}${encodeURIComponent(baseUrl)}`;
  }

  async fetchFile(patch: string, name: string): Promise<ArrayBuffer> {
    const db = await this.db.getInstance();
    const cacheKey = `${patch}/${name}`;

    try {
      const cached = await db.get("bundles", cacheKey);
      if (cached) return cached;
    } catch (e) {
      console.warn("Failed to read from cache", e);
    }

    console.log(`Loading from CDN: ${name} ...`);
    return await withRetries(async () => {
      const webpath = `/${patch}/${BUNDLE_DIR}/${name}`;
      const response = await fetch(`${this.getCdnUrl(patch)}/${webpath}`);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch ${name} from CDN: ${response.statusText} (${response.status})`,
        );
      }

      const buffer = await response.arrayBuffer();

      try {
        await db.put("bundles", buffer, cacheKey);
      } catch (e) {
        console.warn("Failed to write to cache", e);
      }
      return buffer;
    });
  }

  async getFileContents(patch: string, fullPath: string): Promise<Uint8Array> {
    const contents = await this.tryGetFileContents(patch, fullPath);
    if (!contents) {
      throw new Error(`File no longer exists: ${fullPath}`);
    }
    return contents;
  }

  async tryGetFileContents(
    patch: string,
    fullPath: string,
  ): Promise<Uint8Array | null> {
    if (!this.index) {
      throw new Error("Loader not initialized. Call init() first.");
    }

    const location = getFileInfo(
      fullPath,
      this.index.bundlesInfo,
      this.index.filesInfo,
    );
    if (!location) return null;

    const bundleBin = await this.fetchFile(patch, location.bundle);
    return decompressSliceInBundle(
      new Uint8Array(bundleBin),
      location.offset,
      location.size,
    );
  }

  async clearCache() {
    const db = await this.db.getInstance();
    await db.clear("bundles");
  }
}
