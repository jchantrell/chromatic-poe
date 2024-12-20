import {
  getDirContent,
  getRootDirs,
  getFileInfo,
  readIndexBundle,
  decompressSliceInBundle,
} from "pathofexile-dat/bundles.js";
import type { FileLoader } from "./loader";

export class BundleIndex {
  constructor(public readonly loader: FileLoader) {}

  private readonly index = {
    value: {
      bundlesInfo: new Uint8Array(),
      filesInfo: new Uint8Array(),
      dirsInfo: new Uint8Array(),
      pathReps: new Uint8Array(),
    },
  };

  get isLoaded() {
    return this.index.value != null;
  }

  async decompress(
    bundle: ArrayBuffer,
    sliceOffset?: number,
    sliceSize?: number,
  ) {
    const slice = decompressSliceInBundle(
      new Uint8Array(bundle),
      sliceOffset,
      sliceSize,
    );
    return {
      bundle,
      slice,
    };
  }

  async loadIndex() {
    const indexBin = await this.loader.fetchFile("_.index.bin");
    const { slice: indexBundle } = await this.decompress(indexBin);
    const _index = readIndexBundle(indexBundle);
    const { slice: pathReps } = await this.decompress(
      _index.pathRepsBundle.slice().buffer,
    );
    this.index.value = {
      bundlesInfo: _index.bundlesInfo,
      filesInfo: _index.filesInfo,
      dirsInfo: _index.dirsInfo,
      pathReps,
    };
  }

  async loadFileContent(fullPath: string) {
    const { bundlesInfo, filesInfo } = this.index.value;
    const location = getFileInfo(fullPath, bundlesInfo, filesInfo);
    const bundleBin = await this.loader.fetchFile(location.bundle);

    const { slice } = await this.decompress(
      bundleBin.slice(0),
      location.offset,
      location.size,
    );
    return slice;
  }

  getDirContent(dirPath: string) {
    const { pathReps, dirsInfo } = this.index.value;
    return getDirContent(dirPath, pathReps, dirsInfo);
  }

  getRootDirs() {
    const { pathReps, dirsInfo } = this.index.value;
    return getRootDirs(pathReps, dirsInfo);
  }

  async getBatchFileInfo(paths: string[]) {
    const { bundlesInfo, filesInfo } = this.index.value;
    return paths.map((fullPath) =>
      getFileInfo(fullPath, bundlesInfo, filesInfo),
    );
  }
}
