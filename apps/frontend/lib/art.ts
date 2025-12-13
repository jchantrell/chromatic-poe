// @ts-ignore
import dxt from "dxt-js";
import { type DBSchema, openDB } from "idb";
import type { BundleManager } from "./bundle";
import { parseDds } from "./dds";

interface ArtCacheSchema extends DBSchema {
  images: {
    key: string;
    value: Blob;
  };
}

export class ArtManager {
  private dbPromise = openDB<ArtCacheSchema>("poe-art-cache", 1, {
    upgrade(db) {
      db.createObjectStore("images");
    },
  });

  private urlCache = new Map<string, string>();

  constructor(private loader: BundleManager) {}

  async ensureCached(
    patch: string,
    items: { name: string; path: string }[],
  ): Promise<void> {
    if (!this.loader.index) {
      await this.loader.init(patch);
    }
    const db = await this.dbPromise;
    const missing: { name: string; path: string }[] = [];

    // Determine game version (1 or 2)
    const gameVersion = patch.startsWith("3") ? 1 : 2;

    // Check memory cache and IDB
    for (const item of items) {
      if (!item.path) continue;

      const cacheKey = `${gameVersion}/${item.name}`;

      if (this.urlCache.has(cacheKey)) {
        continue;
      }

      const blob = await db.get("images", cacheKey);
      if (blob) {
        const url = URL.createObjectURL(blob);
        this.urlCache.set(cacheKey, url);
      } else {
        missing.push(item);
      }
    }

    // Fetch and convert missing
    if (missing.length > 0) {
      console.log(`Fetching ${missing.length} new art files...`);
      for (const item of missing) {
        try {
          const cacheKey = `${gameVersion}/${item.name}`;
          // Check if file exists in bundle
          const ddsBuffer = await this.loader.getFileContents(item.path);
          const pngBlob = await this.convertDDSToPNG(ddsBuffer, item.path);

          if (pngBlob) {
            await db.put("images", pngBlob, cacheKey);
            const url = URL.createObjectURL(pngBlob);
            this.urlCache.set(cacheKey, url);
          }
        } catch (e) {
          console.warn(`Failed to process art: ${item.path}`, e);
        }
      }
    }
  }

  async getCached(patch: string, name: string): Promise<string | undefined> {
    const gameVersion = patch.startsWith("3") ? 1 : 2;
    const cacheKey = `${gameVersion}/${name}`;

    if (this.urlCache.has(cacheKey)) {
      return this.urlCache.get(cacheKey);
    }

    const db = await this.dbPromise;
    const blob = await db.get("images", cacheKey);
    if (blob) {
      const url = URL.createObjectURL(blob);
      this.urlCache.set(cacheKey, url);
      return url;
    }

    return undefined;
  }

  private async convertDDSToPNG(
    buffer: Uint8Array,
    filename: string,
  ): Promise<Blob | null> {
    try {
      const dds = parseDds(buffer.buffer);
      const width = dds.shape[0];
      const height = dds.shape[1];
      const format = dds.format; // 'dxt1', 'dxt3', 'dxt5', 'rgba8unorm', etc

      let rgba: Uint8Array;

      // Decompress based on format
      if (format === "dxt1") {
        rgba = dxt.decompress(dds.images[0], width, height, dxt.flags.DXT1);
      } else if (format === "dxt3") {
        rgba = dxt.decompress(dds.images[0], width, height, dxt.flags.DXT3);
      } else if (format === "dxt5") {
        rgba = dxt.decompress(dds.images[0], width, height, dxt.flags.DXT5);
      } else if (format === "rgba8unorm") {
        const offset = dds.images[0].offset;
        const length = dds.images[0].length;
        rgba = new Uint8Array(buffer.buffer, offset, length);
      } else {
        console.warn(`Unsupported DDS format: ${format} for ${filename}`);
        return null;
      }

      const imageData = new ImageData(
        new Uint8ClampedArray(rgba),
        width,
        height,
      );

      // Try OffscreenCanvas
      if (typeof OffscreenCanvas !== "undefined") {
        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.putImageData(imageData, 0, 0);
        return await canvas.convertToBlob({ type: "image/png" });
      }

      // Fallback to HTMLCanvasElement
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.putImageData(imageData, 0, 0);

      return new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => resolve(blob), "image/png");
      });
    } catch (e) {
      console.error(`Error converting DDS ${filename}:`, e);
      return null;
    }
  }

  async clearCache() {
    const db = await this.dbPromise;
    await db.clear("images");
  }
}
