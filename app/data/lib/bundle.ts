import {
  decompressSliceInBundle,
  getFileInfo,
  readIndexBundle,
} from "pathofexile-dat/bundles.js";

const BUNDLE_DIR = "Bundles2";
const MAX_RETRIES = 3;
const BASE_DELAY = 1000;

async function fetchWithRetry(url: string): Promise<ArrayBuffer> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await fetch(url);
    if (res.ok) return res.arrayBuffer();
    if (attempt < MAX_RETRIES - 1) {
      const delay = BASE_DELAY * 2 ** attempt;
      await new Promise((r) => setTimeout(r, delay));
    } else {
      throw new Error(`CDN fetch failed: ${url} (${res.status})`);
    }
  }
  throw new Error("Unreachable");
}

export class NodeBundleManager {
  private index?: { bundlesInfo: Uint8Array; filesInfo: Uint8Array };
  private cache = new Map<string, ArrayBuffer>();

  async init(patch: string): Promise<void> {
    console.log("Loading bundles index...");
    const indexBin = await this.fetchFile(patch, "_.index.bin");
    const indexBundle = decompressSliceInBundle(new Uint8Array(indexBin));
    const idx = readIndexBundle(indexBundle);
    this.index = {
      bundlesInfo: idx.bundlesInfo,
      filesInfo: idx.filesInfo,
    };
  }

  async fetchFile(patch: string, name: string): Promise<ArrayBuffer> {
    const cacheKey = `${patch}/${name}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const cdnUrl = patch.startsWith("4.")
      ? "https://patch-poe2.poecdn.com"
      : "https://patch.poecdn.com";

    console.log(`Downloading: ${name}`);
    const buffer = await fetchWithRetry(
      `${cdnUrl}/${patch}/${BUNDLE_DIR}/${name}`,
    );
    this.cache.set(cacheKey, buffer);
    return buffer;
  }

  async getFileContents(patch: string, fullPath: string): Promise<Uint8Array> {
    const contents = await this.tryGetFileContents(patch, fullPath);
    if (!contents) {
      throw new Error(`File not found in bundles: ${fullPath}`);
    }
    return contents;
  }

  async tryGetFileContents(
    patch: string,
    fullPath: string,
  ): Promise<Uint8Array | null> {
    if (!this.index) {
      throw new Error("BundleManager not initialized. Call init() first.");
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
}
