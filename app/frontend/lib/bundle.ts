import {
    decompressSliceInBundle,
    getFileInfo,
    readIndexBundle,
} from "pathofexile-dat/bundles.js";
import { proxyFetch } from "./fetch";
import type { IDBManager } from "./idb";
import { to, withRetries } from "./utils";

const BUNDLE_DIR = "Bundles2";

export class BundleManager {
  index?: {
    bundlesInfo: Uint8Array;
    filesInfo: Uint8Array;
  };
  private loadedPatch: string | null = null;
  private initPromise: Promise<void> | null = null;

  constructor(private db: IDBManager) {}

  async init(patch: string, onProgress?: (percent: number) => void) {
    if (!patch) return;

    if (this.loadedPatch === patch && this.index) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      const [err] = await to(
        (async () => {
          console.log("Loading bundles index...");
          const indexBin = await this.fetchFile(
            patch,
            "_.index.bin",
            onProgress,
          );
          const indexBundle = decompressSliceInBundle(new Uint8Array(indexBin));
          const _index = readIndexBundle(indexBundle);
          this.index = {
            bundlesInfo: _index.bundlesInfo,
            filesInfo: _index.filesInfo,
          };
          this.loadedPatch = patch;
        })(),
      );

      this.initPromise = null;

      if (err) throw err;
    })();

    await this.initPromise;
  }

  private pendingRequests = new Map<string, Promise<ArrayBuffer>>();

  async fetchFile(
    patch: string,
    name: string,
    onProgress?: (percent: number) => void,
  ): Promise<ArrayBuffer> {
    const db = await this.db.getInstance();
    const cacheKey = `${patch}/${name}`;

    const [err, cached] = await to(db.get("bundles", cacheKey));

    if (err) {
      console.warn("Failed to read from cache", err);
    }

    if (cached) return cached;

    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)!;
    }

    console.log(`Loading from CDN: ${name} ...`);
    const promise = withRetries(async () => {
      const webpath = `/${patch}/${BUNDLE_DIR}/${name}`;
      const cdnUrl = patch.startsWith("4.")
        ? "https://patch-poe2.poecdn.com"
        : "https://patch.poecdn.com";
      const response = await proxyFetch(
        `${cdnUrl}${webpath}`,
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch ${name} from CDN: ${response.statusText} (${response.status})`,
        );
      }

      const contentLength = response.headers.get("Content-Length");
      const total = contentLength ? Number.parseInt(contentLength, 10) : 0;

      let buffer: ArrayBuffer;

      if (response.body && onProgress && total) {
        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let loaded = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          loaded += value.length;
          onProgress((loaded / total) * 100);
        }

        const combined = new Uint8Array(loaded);
        let offset = 0;
        for (const chunk of chunks) {
          combined.set(chunk, offset);
          offset += chunk.length;
        }
        buffer = combined.buffer;
      } else {
        buffer = await response.arrayBuffer();
      }

      const [err] = await to(db.put("bundles", buffer, cacheKey));
      if (err) {
        console.warn("Failed to write to cache", err);
      }

      return buffer;
    });

    this.pendingRequests.set(cacheKey, promise);

    try {
      return await promise;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
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
