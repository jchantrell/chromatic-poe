import { openDB, type DBSchema } from "idb";
import {
  decompressSliceInBundle,
  getFileInfo,
  readIndexBundle,
} from "pathofexile-dat/bundles.js";

const BUNDLE_DIR = "Bundles2";

interface BundleCacheSchema extends DBSchema {
  bundles: {
    key: string;
    value: ArrayBuffer;
  };
}

export class BundleManager {
  private dbPromise = openDB<BundleCacheSchema>("poe-bundle-cache", 1, {
    upgrade(db) {
      db.createObjectStore("bundles");
    },
  });

  index?: {
    bundlesInfo: Uint8Array;
    filesInfo: Uint8Array;
  };

  public patch!: string;
  private cdn!: string;

  async init(patch: string) {
    this.patch = patch;
    const isPoe2 = this.patch.startsWith("4.");
    const baseUrl = isPoe2
      ? "https://patch-poe2.poecdn.com"
      : "https://patch.poecdn.com";
    const proxyUrl =
      import.meta.env.VITE_CORS_PROXY_URL || "https://corsproxy.io/?";
    this.cdn = `${proxyUrl}${encodeURIComponent(baseUrl)}`;

    console.log("Loading bundles index...");
    const indexBin = await this.fetchFile("_.index.bin");
    const indexBundle = decompressSliceInBundle(new Uint8Array(indexBin));
    const _index = readIndexBundle(indexBundle);
    this.index = {
      bundlesInfo: _index.bundlesInfo,
      filesInfo: _index.filesInfo,
    };
  }

  async fetchFile(name: string): Promise<ArrayBuffer> {
    const db = await this.dbPromise;
    const cacheKey = `${this.patch}/${name}`;

    try {
      const cached = await db.get("bundles", cacheKey);
      if (cached) return cached;
    } catch (e) {
      console.warn("Failed to read from cache", e);
    }

    console.log(`Loading from CDN: ${name} ...`);

    let lastError: any;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`Retrying fetch for ${name} (attempt ${attempt + 1})...`);
          await new Promise((r) => setTimeout(r, 1000 * attempt));
        }

        const webpath = `/${this.patch}/${BUNDLE_DIR}/${name}`;
        const response = await fetch(`${this.cdn}${webpath}`);

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
      } catch (e) {
        lastError = e;
        console.warn(`Fetch error for ${name}:`, e);
      }
    }
    throw lastError || new Error(`Failed to fetch ${name} after 3 attempts`);
  }

  async getFileContents(fullPath: string): Promise<Uint8Array> {
    const contents = await this.tryGetFileContents(fullPath);
    if (!contents) {
      throw new Error(`File no longer exists: ${fullPath}`);
    }
    return contents;
  }

  async tryGetFileContents(fullPath: string): Promise<Uint8Array | null> {
    if (!this.index) {
      throw new Error("Loader not initialized. Call init() first.");
    }

    const location = getFileInfo(
      fullPath,
      this.index.bundlesInfo,
      this.index.filesInfo,
    );
    if (!location) return null;

    const bundleBin = await this.fetchFile(location.bundle);
    return decompressSliceInBundle(
      new Uint8Array(bundleBin),
      location.offset,
      location.size,
    );
  }

  async clearCache() {
    const db = await this.dbPromise;
    await db.clear("bundles");
  }
}
