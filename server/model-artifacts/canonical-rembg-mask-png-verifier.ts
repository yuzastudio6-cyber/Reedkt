import { createHash } from 'node:crypto'
import { inflateSync } from 'node:zlib'

import { ApiError } from '../errors/api-error'

const PNG_SIGNATURE = Buffer.from('89504e470d0a1a0a', 'hex')
const MAXIMUM_CHUNK_BYTES = 16 * 1024 * 1024

export interface CanonicalRembgMaskPngVerification {
  readonly width: number
  readonly height: number
  readonly decodedMaskSha256: string
  readonly minimumMaskValue: number
  readonly maximumMaskValue: number
  readonly uniqueMaskValueCount: number
  readonly transparentPixelCount: number
  readonly partialPixelCount: number
  readonly opaquePixelCount: number
  readonly thresholdMaskValue: 128
  readonly foregroundPixelCountAtThreshold: number
}

export function verifyCanonicalRembgGray8MaskPng(
  bytes: Buffer,
  bounds: {
    readonly expectedWidth: number
    readonly expectedHeight: number
    readonly maximumPixelCount: number
  },
): CanonicalRembgMaskPngVerification {
  if (
    !Buffer.isBuffer(bytes)
    || !Number.isSafeInteger(bounds.expectedWidth)
    || !Number.isSafeInteger(bounds.expectedHeight)
    || !Number.isSafeInteger(bounds.maximumPixelCount)
    || bounds.expectedWidth < 1
    || bounds.expectedHeight < 1
    || bounds.expectedWidth > 4_096
    || bounds.expectedHeight > 4_096
    || bounds.maximumPixelCount < 1
    || bounds.expectedWidth * bounds.expectedHeight
      > bounds.maximumPixelCount
    || bytes.byteLength < 67
    || bytes.byteLength > MAXIMUM_CHUNK_BYTES
    || !bytes.subarray(0, 8).equals(PNG_SIGNATURE)
  ) {
    throw invalid('rembg_mask_png_signature_or_bounds_invalid')
  }

  let offset = 8
  let width = 0
  let height = 0
  let sawIhdr = false
  let sawIend = false
  let idatSequenceClosed = false
  const idat: Buffer[] = []

  while (offset + 12 <= bytes.byteLength) {
    const length = bytes.readUInt32BE(offset)
    const chunkEnd = offset + 12 + length
    if (
      length > MAXIMUM_CHUNK_BYTES
      || chunkEnd > bytes.byteLength
    ) {
      throw invalid('rembg_mask_png_chunk_bound_invalid')
    }
    const expectedCrc =
      bytes.readUInt32BE(offset + 8 + length)
    const observedCrc = pngCrc32(
      bytes.subarray(offset + 4, offset + 8 + length),
    )
    if (observedCrc !== expectedCrc) {
      throw invalid('rembg_mask_png_chunk_crc_invalid')
    }
    const type =
      bytes.subarray(offset + 4, offset + 8).toString('ascii')
    const data =
      bytes.subarray(offset + 8, offset + 8 + length)
    if (!/^[A-Za-z]{4}$/u.test(type)) {
      throw invalid('rembg_mask_png_chunk_type_invalid')
    }

    if (type === 'IHDR') {
      if (sawIhdr || offset !== 8 || length !== 13) {
        throw invalid('rembg_mask_png_ihdr_invalid')
      }
      sawIhdr = true
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      if (
        width !== bounds.expectedWidth
        || height !== bounds.expectedHeight
        || width * height > bounds.maximumPixelCount
        || data[8] !== 8
        || data[9] !== 0
        || data[10] !== 0
        || data[11] !== 0
        || data[12] !== 0
      ) {
        throw invalid('rembg_mask_png_profile_invalid')
      }
    } else if (type === 'IDAT') {
      if (!sawIhdr || sawIend || idatSequenceClosed) {
        throw invalid('rembg_mask_png_idat_order_invalid')
      }
      idat.push(Buffer.from(data))
    } else if (type === 'IEND') {
      if (
        !sawIhdr
        || sawIend
        || length !== 0
        || idat.length === 0
      ) {
        throw invalid('rembg_mask_png_iend_invalid')
      }
      sawIend = true
    } else {
      if (idat.length > 0) idatSequenceClosed = true
      if (type.charCodeAt(0) >= 65 && type.charCodeAt(0) <= 90) {
        throw invalid(
          'rembg_mask_png_unsupported_critical_chunk',
        )
      }
    }
    offset = chunkEnd
    if (sawIend) break
  }

  if (
    !sawIhdr
    || !sawIend
    || idat.length === 0
    || offset !== bytes.byteLength
  ) {
    throw invalid('rembg_mask_png_required_chunks_invalid')
  }

  const stride = width
  const expectedInflatedBytes = (stride + 1) * height
  let inflated: Buffer
  try {
    inflated = inflateSync(Buffer.concat(idat), {
      maxOutputLength: expectedInflatedBytes,
    })
  } catch {
    throw invalid('rembg_mask_png_compressed_pixels_invalid')
  }
  if (inflated.byteLength !== expectedInflatedBytes) {
    throw invalid('rembg_mask_png_decoded_length_invalid')
  }

  const mask = Buffer.allocUnsafe(stride * height)
  for (let y = 0; y < height; y += 1) {
    const sourceOffset = y * (stride + 1)
    const filter = inflated[sourceOffset]!
    if (filter > 4) {
      throw invalid('rembg_mask_png_row_filter_invalid')
    }
    for (let x = 0; x < stride; x += 1) {
      const raw = inflated[sourceOffset + 1 + x]!
      const left = x >= 1 ? mask[y * stride + x - 1]! : 0
      const above = y > 0
        ? mask[(y - 1) * stride + x]!
        : 0
      const upperLeft = y > 0 && x >= 1
        ? mask[(y - 1) * stride + x - 1]!
        : 0
      const value = filter === 0
        ? raw
        : filter === 1
          ? raw + left
          : filter === 2
            ? raw + above
            : filter === 3
              ? raw + Math.floor((left + above) / 2)
              : raw + pngPaeth(left, above, upperLeft)
      mask[y * stride + x] = value & 0xff
    }
  }

  const histogram = new Uint32Array(256)
  for (const value of mask) histogram[value] += 1
  let minimumMaskValue = -1
  let maximumMaskValue = -1
  let uniqueMaskValueCount = 0
  let foregroundPixelCountAtThreshold = 0
  for (let value = 0; value < histogram.length; value += 1) {
    const count = histogram[value]!
    if (count === 0) continue
    if (minimumMaskValue < 0) minimumMaskValue = value
    maximumMaskValue = value
    uniqueMaskValueCount += 1
    if (value >= 128) {
      foregroundPixelCountAtThreshold += count
    }
  }
  const transparentPixelCount = histogram[0]!
  const opaquePixelCount = histogram[255]!
  const partialPixelCount =
    mask.byteLength
    - transparentPixelCount
    - opaquePixelCount
  if (
    minimumMaskValue < 0
    || minimumMaskValue >= maximumMaskValue
    || uniqueMaskValueCount < 2
    || partialPixelCount < 1
    || transparentPixelCount
      + partialPixelCount
      + opaquePixelCount !== mask.byteLength
  ) {
    throw invalid('rembg_mask_png_population_invalid')
  }

  return Object.freeze({
    width,
    height,
    decodedMaskSha256:
      createHash('sha256').update(mask).digest('hex'),
    minimumMaskValue,
    maximumMaskValue,
    uniqueMaskValueCount,
    transparentPixelCount,
    partialPixelCount,
    opaquePixelCount,
    thresholdMaskValue: 128 as const,
    foregroundPixelCountAtThreshold,
  })
}

const PNG_CRC32_TABLE = Uint32Array.from(
  { length: 256 },
  (_, index) => {
    let value = index
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) === 1
        ? 0xedb88320 ^ (value >>> 1)
        : value >>> 1
    }
    return value >>> 0
  },
)

function pngCrc32(bytes: Buffer): number {
  let value = 0xffffffff
  for (const byte of bytes) {
    value =
      PNG_CRC32_TABLE[(value ^ byte) & 0xff]!
      ^ (value >>> 8)
  }
  return (value ^ 0xffffffff) >>> 0
}

function pngPaeth(
  left: number,
  above: number,
  upperLeft: number,
): number {
  const prediction = left + above - upperLeft
  const leftDistance = Math.abs(prediction - left)
  const aboveDistance = Math.abs(prediction - above)
  const upperLeftDistance =
    Math.abs(prediction - upperLeft)
  if (
    leftDistance <= aboveDistance
    && leftDistance <= upperLeftDistance
  ) {
    return left
  }
  return aboveDistance <= upperLeftDistance
    ? above
    : upperLeft
}

function invalid(code: string): ApiError {
  return new ApiError('VALIDATION_FAILED', code, 409)
}
