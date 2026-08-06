import { createHash } from 'node:crypto'
import { inflateSync } from 'node:zlib'

import { ApiError } from '../../errors/api-error'

const PNG_SIGNATURE = Buffer.from('89504e470d0a1a0a', 'hex')
const MAXIMUM_CHUNK_BYTES = 16 * 1024 * 1024

export interface ExactSourceFrameRgbaPngVerification {
  readonly width: number
  readonly height: number
  readonly opaquePixelCount: number
  readonly decodedRgbaSha256: string
}

export function verifyExactSourceFrameRgbaPng(
  bytes: Buffer,
  bounds: {
    readonly maximumWidth: number
    readonly maximumHeight: number
    readonly maximumPixelCount: number
  },
): ExactSourceFrameRgbaPngVerification {
  if (
    !Number.isSafeInteger(bounds.maximumWidth)
    || !Number.isSafeInteger(bounds.maximumHeight)
    || !Number.isSafeInteger(bounds.maximumPixelCount)
    || bounds.maximumWidth < 1
    || bounds.maximumHeight < 1
    || bounds.maximumPixelCount < 1
    || bytes.byteLength < 68
    || !bytes.subarray(0, 8).equals(PNG_SIGNATURE)
  ) {
    throw unavailable(
      'Exact source-frame PNG signature or bounds are invalid.',
    )
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
      throw unavailable(
        'Exact source-frame PNG chunk is outside its fixed bound.',
      )
    }
    const expectedCrc =
      bytes.readUInt32BE(offset + 8 + length)
    const observedCrc = pngCrc32(
      bytes.subarray(offset + 4, offset + 8 + length),
    )
    if (observedCrc !== expectedCrc) {
      throw unavailable(
        'Exact source-frame PNG chunk checksum is invalid.',
      )
    }
    const type =
      bytes.subarray(offset + 4, offset + 8).toString('ascii')
    const data =
      bytes.subarray(offset + 8, offset + 8 + length)
    if (!/^[A-Za-z]{4}$/u.test(type)) {
      throw unavailable(
        'Exact source-frame PNG chunk type is invalid.',
      )
    }
    if (type === 'IHDR') {
      if (sawIhdr || offset !== 8 || length !== 13) {
        throw unavailable(
          'Exact source-frame PNG IHDR is invalid.',
        )
      }
      sawIhdr = true
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      if (
        width < 1
        || height < 1
        || width > bounds.maximumWidth
        || height > bounds.maximumHeight
        || width * height > bounds.maximumPixelCount
        || data[8] !== 8
        || data[9] !== 6
        || data[10] !== 0
        || data[11] !== 0
        || data[12] !== 0
      ) {
        throw unavailable(
          'Exact source-frame PNG is outside the approved non-interlaced RGBA profile.',
        )
      }
    } else if (type === 'IDAT') {
      if (!sawIhdr || sawIend || idatSequenceClosed) {
        throw unavailable(
          'Exact source-frame PNG IDAT order is invalid.',
        )
      }
      idat.push(Buffer.from(data))
    } else if (type === 'IEND') {
      if (
        !sawIhdr
        || sawIend
        || length !== 0
        || idat.length === 0
      ) {
        throw unavailable(
          'Exact source-frame PNG IEND is invalid.',
        )
      }
      sawIend = true
    } else {
      if (idat.length > 0) idatSequenceClosed = true
      if (type.charCodeAt(0) >= 65 && type.charCodeAt(0) <= 90) {
        throw unavailable(
          'Exact source-frame PNG contains an unsupported critical chunk.',
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
    throw unavailable(
      'Exact source-frame PNG required chunks or final boundary are invalid.',
    )
  }
  const stride = width * 4
  const expectedInflatedBytes = (stride + 1) * height
  let inflated: Buffer
  try {
    inflated = inflateSync(Buffer.concat(idat), {
      maxOutputLength: expectedInflatedBytes,
    })
  } catch {
    throw unavailable(
      'Exact source-frame PNG compressed pixel data is invalid.',
    )
  }
  if (inflated.byteLength !== expectedInflatedBytes) {
    throw unavailable(
      'Exact source-frame PNG decoded byte length is invalid.',
    )
  }
  const rgba = Buffer.allocUnsafe(stride * height)
  for (let y = 0; y < height; y += 1) {
    const sourceOffset = y * (stride + 1)
    const filter = inflated[sourceOffset]!
    if (filter > 4) {
      throw unavailable(
        'Exact source-frame PNG uses an unsupported row filter.',
      )
    }
    for (let x = 0; x < stride; x += 1) {
      const raw = inflated[sourceOffset + 1 + x]!
      const left = x >= 4 ? rgba[y * stride + x - 4]! : 0
      const above = y > 0
        ? rgba[(y - 1) * stride + x]!
        : 0
      const upperLeft = y > 0 && x >= 4
        ? rgba[(y - 1) * stride + x - 4]!
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
      rgba[y * stride + x] = value & 0xff
    }
  }
  let opaquePixelCount = 0
  for (
    let alphaOffset = 3;
    alphaOffset < rgba.byteLength;
    alphaOffset += 4
  ) {
    if (rgba[alphaOffset] !== 255) {
      throw unavailable(
        'Exact source-frame PNG contains non-opaque source pixels.',
      )
    }
    opaquePixelCount += 1
  }
  if (opaquePixelCount !== width * height) {
    throw unavailable(
      'Exact source-frame PNG pixel accounting is invalid.',
    )
  }
  return Object.freeze({
    width,
    height,
    opaquePixelCount,
    decodedRgbaSha256:
      createHash('sha256').update(rgba).digest('hex'),
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

function unavailable(message: string): ApiError {
  return new ApiError('TOOL_NOT_READY', message, 503)
}
