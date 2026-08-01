import { inflateSync } from "node:zlib";

const PNG_SIGNATURE = Buffer.from("89504e470d0a1a0a", "hex");
const DEFAULT_MAXIMUM_OUTPUT_BYTES = 64 * 1_024 * 1_024;
const DEFAULT_MAXIMUM_DIMENSION = 4_096;
const DEFAULT_MAXIMUM_PIXEL_COUNT = 8_294_400;

export type LivingFramePrivateOpaqueRgbPngVerificationIssueCode =
  | "format_invalid"
  | "dimension_invalid"
  | "alpha_policy_invalid"
  | "decode_failed";

export class LivingFramePrivateOpaqueRgbPngVerificationError extends Error {
  readonly code: LivingFramePrivateOpaqueRgbPngVerificationIssueCode;

  constructor(code: LivingFramePrivateOpaqueRgbPngVerificationIssueCode) {
    super(`Living Frame private opaque RGB PNG verification failed: ${code}.`);
    this.name = "LivingFramePrivateOpaqueRgbPngVerificationError";
    this.code = code;
  }
}

export interface LivingFramePrivateOpaqueRgbPngVerification {
  readonly widthPixels: number;
  readonly heightPixels: number;
  readonly pixelCount: number;
  readonly decodedRgba: Buffer;
  readonly sourcePngHadAlphaChannel: false;
}

export function verifyLivingFramePrivateOpaqueRgbPng(
  bytes: Buffer,
  expectation: {
    readonly widthPixels: number;
    readonly heightPixels: number;
    readonly maximumOutputBytes?: number;
    readonly maximumDimension?: number;
    readonly maximumPixelCount?: number;
  },
): LivingFramePrivateOpaqueRgbPngVerification {
  const maximumOutputBytes =
    expectation.maximumOutputBytes ?? DEFAULT_MAXIMUM_OUTPUT_BYTES;
  const maximumDimension =
    expectation.maximumDimension ?? DEFAULT_MAXIMUM_DIMENSION;
  const maximumPixelCount =
    expectation.maximumPixelCount ?? DEFAULT_MAXIMUM_PIXEL_COUNT;
  if (
    !Buffer.isBuffer(bytes) ||
    bytes.buffer instanceof SharedArrayBuffer ||
    !Number.isSafeInteger(expectation.widthPixels) ||
    expectation.widthPixels < 64 ||
    expectation.widthPixels > maximumDimension ||
    !Number.isSafeInteger(expectation.heightPixels) ||
    expectation.heightPixels < 64 ||
    expectation.heightPixels > maximumDimension ||
    expectation.widthPixels * expectation.heightPixels >
      maximumPixelCount ||
    !Number.isSafeInteger(maximumOutputBytes) ||
    maximumOutputBytes < 1 ||
    bytes.byteLength < 8 ||
    bytes.byteLength > maximumOutputBytes ||
    !bytes.subarray(0, 8).equals(PNG_SIGNATURE)
  ) {
    throw invalid("format_invalid");
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let sawIhdr = false;
  let sawIend = false;
  const idat: Buffer[] = [];
  while (offset + 12 <= bytes.byteLength) {
    const length = bytes.readUInt32BE(offset);
    if (
      length > maximumOutputBytes ||
      offset + 12 + length > bytes.byteLength
    ) {
      throw invalid("decode_failed");
    }
    const type = bytes.toString("ascii", offset + 4, offset + 8);
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    const expectedCrc = bytes.readUInt32BE(offset + 8 + length);
    if (
      pngCrc32(bytes.subarray(offset + 4, offset + 8 + length)) !==
      expectedCrc
    ) {
      throw invalid("decode_failed");
    }

    if (type === "IHDR") {
      if (sawIhdr || length !== 13 || offset !== 8) {
        throw invalid("decode_failed");
      }
      sawIhdr = true;
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      if (
        width !== expectation.widthPixels ||
        height !== expectation.heightPixels
      ) {
        throw invalid("dimension_invalid");
      }
      if (
        width > maximumDimension ||
        height > maximumDimension ||
        width * height > maximumPixelCount
      ) {
        throw invalid("dimension_invalid");
      }
      const bitDepth = data[8];
      const colorType = data[9];
      const compression = data[10];
      const filter = data[11];
      const interlace = data[12];
      if (
        colorType === 4 ||
        colorType === 6 ||
        colorType < 0 ||
        colorType > 6
      ) {
        throw invalid("alpha_policy_invalid");
      }
      if (
        bitDepth !== 8 ||
        colorType !== 2 ||
        compression !== 0 ||
        filter !== 0 ||
        interlace !== 0
      ) {
        throw invalid("format_invalid");
      }
    } else if (type === "IDAT") {
      if (!sawIhdr || sawIend) {
        throw invalid("decode_failed");
      }
      idat.push(Buffer.from(data));
    } else if (type === "IEND") {
      if (!sawIhdr || sawIend || length !== 0) {
        throw invalid("decode_failed");
      }
      sawIend = true;
      offset += 12;
      break;
    } else if (type === "tRNS") {
      throw invalid("alpha_policy_invalid");
    } else if (isCriticalPngChunk(type)) {
      throw invalid("format_invalid");
    }
    offset += 12 + length;
  }

  if (
    !sawIhdr ||
    !sawIend ||
    idat.length === 0 ||
    offset !== bytes.byteLength
  ) {
    throw invalid("decode_failed");
  }

  const bytesPerPixel = 3;
  const rowByteLength = width * bytesPerPixel;
  const expectedInflatedLength = (rowByteLength + 1) * height;
  let inflated: Buffer;
  try {
    inflated = inflateSync(Buffer.concat(idat), {
      maxOutputLength: expectedInflatedLength,
    });
  } catch {
    throw invalid("decode_failed");
  }
  if (inflated.byteLength !== expectedInflatedLength) {
    throw invalid("decode_failed");
  }

  const rgb = Buffer.alloc(rowByteLength * height);
  let sourceOffset = 0;
  for (let row = 0; row < height; row += 1) {
    const filterType = inflated[sourceOffset];
    sourceOffset += 1;
    if (filterType === undefined || filterType > 4) {
      throw invalid("decode_failed");
    }
    const rowOffset = row * rowByteLength;
    for (let column = 0; column < rowByteLength; column += 1) {
      const raw = inflated[sourceOffset + column];
      if (raw === undefined) {
        throw invalid("decode_failed");
      }
      const left =
        column >= bytesPerPixel
          ? (rgb[rowOffset + column - bytesPerPixel] ?? 0)
          : 0;
      const up =
        row > 0 ? (rgb[rowOffset + column - rowByteLength] ?? 0) : 0;
      const upperLeft =
        row > 0 && column >= bytesPerPixel
          ? (rgb[
              rowOffset + column - rowByteLength - bytesPerPixel
            ] ?? 0)
          : 0;
      rgb[rowOffset + column] =
        (raw +
          unfilterPngByte(filterType, left, up, upperLeft)) &
        0xff;
    }
    sourceOffset += rowByteLength;
  }

  const pixelCount = width * height;
  const decodedRgba = Buffer.alloc(pixelCount * 4);
  for (
    let source = 0, target = 0;
    source < rgb.byteLength;
    source += 3, target += 4
  ) {
    decodedRgba[target] = rgb[source]!;
    decodedRgba[target + 1] = rgb[source + 1]!;
    decodedRgba[target + 2] = rgb[source + 2]!;
    decodedRgba[target + 3] = 255;
  }
  return {
    widthPixels: width,
    heightPixels: height,
    pixelCount,
    decodedRgba,
    sourcePngHadAlphaChannel: false,
  };
}

function isCriticalPngChunk(type: string): boolean {
  return (
    type.length !== 4 ||
    (type.charCodeAt(0) >= 65 && type.charCodeAt(0) <= 90)
  );
}

function unfilterPngByte(
  filterType: number,
  left: number,
  up: number,
  upperLeft: number,
): number {
  if (filterType === 0) return 0;
  if (filterType === 1) return left;
  if (filterType === 2) return up;
  if (filterType === 3) return Math.floor((left + up) / 2);
  return paethPredictor(left, up, upperLeft);
}

function paethPredictor(
  left: number,
  up: number,
  upperLeft: number,
): number {
  const estimate = left + up - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const upperLeftDistance = Math.abs(estimate - upperLeft);
  if (leftDistance <= upDistance && leftDistance <= upperLeftDistance) {
    return left;
  }
  return upDistance <= upperLeftDistance ? up : upperLeft;
}

const PNG_CRC32_TABLE = Uint32Array.from(
  { length: 256 },
  (_, index) => {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value =
        (value & 1) === 1
          ? 0xedb88320 ^ (value >>> 1)
          : value >>> 1;
    }
    return value >>> 0;
  },
);

function pngCrc32(bytes: Buffer): number {
  let value = 0xffffffff;
  for (const byte of bytes) {
    value =
      PNG_CRC32_TABLE[(value ^ byte) & 0xff]! ^
      (value >>> 8);
  }
  return (value ^ 0xffffffff) >>> 0;
}

function invalid(
  code: LivingFramePrivateOpaqueRgbPngVerificationIssueCode,
): LivingFramePrivateOpaqueRgbPngVerificationError {
  return new LivingFramePrivateOpaqueRgbPngVerificationError(code);
}
