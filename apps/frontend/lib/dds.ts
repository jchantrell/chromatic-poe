export interface DDSInfo {
  shape: [number, number];
  images: { offset: number; length: number; shape: [number, number] }[];
  format: string;
  flags: number;
  cubemap: boolean;
}

const DDS_MAGIC = 0x20534444;
const DDSD_MIPMAPCOUNT = 0x20000;
const DDPF_FOURCC = 0x4;

function fourCCToInt32(value: string) {
  return value.charCodeAt(0) +
    (value.charCodeAt(1) << 8) +
    (value.charCodeAt(2) << 16) +
    (value.charCodeAt(3) << 24);
}

function int32ToFourCC(value: number) {
  return String.fromCharCode(
    value & 0xff,
    (value >> 8) & 0xff,
    (value >> 16) & 0xff,
    (value >> 24) & 0xff
  );
}

const FOURCC_DXT1 = fourCCToInt32('DXT1');
const FOURCC_DXT3 = fourCCToInt32('DXT3');
const FOURCC_DXT5 = fourCCToInt32('DXT5');
const FOURCC_DX10 = fourCCToInt32('DX10');
const FOURCC_FP32F = 116; // DXGI_FORMAT_R32G32B32A32_FLOAT

const DDSCAPS2_CUBEMAP = 0x200;
const D3D10_RESOURCE_DIMENSION_TEXTURE2D = 3;
const DXGI_FORMAT_R32G32B32A32_FLOAT = 2;
const DXGI_FORMAT_R8G8B8A8_UNORM = 28;

// The header length in 32 bit ints
const headerLengthInt = 31;

// Offsets into the header array
const off_magic = 0;
const off_size = 1;
const off_flags = 2;
const off_height = 3;
const off_width = 4;
const off_mipmapCount = 7;
const off_pfFlags = 20;
const off_pfFourCC = 21;
const off_caps2 = 28;

export function parseDds(arrayBuffer: ArrayBufferLike): DDSInfo {
  const header = new Int32Array(arrayBuffer, 0, headerLengthInt);

  if (header[off_magic] !== DDS_MAGIC) {
    throw new Error('Invalid magic number in DDS header');
  }

  if (!(header[off_pfFlags] & DDPF_FOURCC)) {
    throw new Error('Unsupported format, must contain a FourCC code');
  }

  let blockBytes = 0;
  let format: string;
  const fourCC = header[off_pfFourCC];

  if (fourCC === FOURCC_DXT1) {
    blockBytes = 8;
    format = 'dxt1';
  } else if (fourCC === FOURCC_DXT3) {
    blockBytes = 16;
    format = 'dxt3';
  } else if (fourCC === FOURCC_DXT5) {
    blockBytes = 16;
    format = 'dxt5';
  } else if (fourCC === FOURCC_FP32F) {
    format = 'rgba32f';
  } else if (fourCC === FOURCC_DX10) {
    const dx10Header = new Uint32Array(arrayBuffer.slice(128, 128 + 20));
    const dx10Format = dx10Header[0];
    const resourceDimension = dx10Header[1];

    if (resourceDimension === D3D10_RESOURCE_DIMENSION_TEXTURE2D) {
      if (dx10Format === DXGI_FORMAT_R32G32B32A32_FLOAT) {
        format = 'rgba32f';
      } else if (dx10Format === DXGI_FORMAT_R8G8B8A8_UNORM) {
        format = 'rgba8unorm';
      } else {
        throw new Error('Unsupported DX10 texture format ' + dx10Format);
      }
    } else {
      throw new Error('Unsupported DX10 resource dimension ' + resourceDimension);
    }
  } else {
    throw new Error('Unsupported FourCC code: ' + int32ToFourCC(fourCC));
  }

  const flags = header[off_flags];
  let mipmapCount = 1;

  if (flags & DDSD_MIPMAPCOUNT) {
    mipmapCount = Math.max(1, header[off_mipmapCount]);
  }

  let cubemap = false;
  const caps2 = header[off_caps2];
  if (caps2 & DDSCAPS2_CUBEMAP) {
    cubemap = true;
  }

  let width = header[off_width];
  let height = header[off_height];
  let dataOffset = header[off_size] + 4;
  const texWidth = width;
  const texHeight = height;
  const images = [];

  if (fourCC === FOURCC_DX10) {
    dataOffset += 20;
  }

  if (cubemap) {
     // ... Cubemap logic omitted for brevity as generally not used for items, 
     // but if needed can copypaste from parse-dds and adapt. 
     // Keeping it simple for now to fix the item issue.
     throw new Error('Cubemaps not fully implemented in this custom parser');
  } else {
    for (let i = 0; i < mipmapCount; i++) {
      let dataLength: number;
      
      if (format === 'rgba8unorm') {
         dataLength = width * height * 4;
      } else if (format === 'rgba32f') {
         dataLength = width * height * 16;
      } else {
         // DXT / Block compressed
         dataLength = Math.max(4, width) / 4 * Math.max(4, height) / 4 * blockBytes;
      }

      images.push({
        offset: dataOffset,
        length: dataLength,
        shape: [width, height] as [number, number]
      });
      dataOffset += dataLength;
      width = Math.floor(width / 2);
      height = Math.floor(height / 2);
    }
  }

  return {
    shape: [texWidth, texHeight],
    images: images,
    format: format,
    flags: flags,
    cubemap: cubemap
  };
}
