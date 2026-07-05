import { closeSync, existsSync, openSync, readSync, statSync } from 'node:fs'
import path from 'node:path'

export const minimumPrivateModelFileBytes = 1024 * 1024

const maximumSafetensorsHeaderBytes = 1024 * 1024

export interface PrivateSourceImageProbe {
  exists: boolean
  accepted: boolean
  fileType: 'png' | 'jpeg' | 'ppm' | 'webp' | null
  blocker: string | null
}

export function probePrivateSourceImage(
  sourceImagePath: string | undefined,
): PrivateSourceImageProbe {
  if (!sourceImagePath) {
    return {
      exists: false,
      accepted: false,
      fileType: null,
      blocker: 'private approved source image or representative frame is missing',
    }
  }

  if (!existsSync(sourceImagePath)) {
    return {
      exists: false,
      accepted: false,
      fileType: null,
      blocker: `private approved source image does not exist: ${sourceImagePath}`,
    }
  }

  const sourceStats = statSync(sourceImagePath)
  if (!sourceStats.isFile()) {
    return {
      exists: true,
      accepted: false,
      fileType: null,
      blocker: `private approved source image is not a file: ${sourceImagePath}`,
    }
  }

  const header = readBytes(sourceImagePath, 16) ?? Buffer.alloc(0)
  const asciiHeader = header.toString('ascii')
  const png =
    header.length >= 8 &&
    header[0] === 0x89 &&
    asciiHeader.slice(1, 4) === 'PNG'
  const jpeg =
    header.length >= 3 &&
    header[0] === 0xff &&
    header[1] === 0xd8 &&
    header[2] === 0xff
  const ppm = asciiHeader.startsWith('P3') || asciiHeader.startsWith('P6')
  const webp =
    asciiHeader.startsWith('RIFF') &&
    header.length >= 12 &&
    asciiHeader.slice(8, 12) === 'WEBP'
  const fileType = png
    ? 'png'
    : jpeg
    ? 'jpeg'
    : ppm
    ? 'ppm'
    : webp
    ? 'webp'
    : null

  if (!fileType) {
    return {
      exists: true,
      accepted: false,
      fileType: null,
      blocker:
        'private approved source image must be PNG, JPEG, WebP, or PPM before native runtime starts',
    }
  }

  return {
    exists: true,
    accepted: true,
    fileType,
    blocker: null,
  }
}

export function hasReadableSafetensorsHeader(filePath: string): boolean {
  const prefix = readBytes(filePath, 8)
  if (!prefix || prefix.length !== 8) return false
  const headerLength = Number(prefix.readBigUInt64LE(0))
  if (
    !Number.isSafeInteger(headerLength) ||
    headerLength <= 0 ||
    headerLength > maximumSafetensorsHeaderBytes
  ) {
    return false
  }

  const headerBytes = readBytes(filePath, headerLength, 8)
  if (!headerBytes || headerBytes.length !== headerLength) return false
  try {
    const header = JSON.parse(headerBytes.toString('utf8')) as unknown
    return Boolean(header && typeof header === 'object' && !Array.isArray(header))
  } catch {
    return false
  }
}

function readBytes(filePath: string, byteLength: number, position = 0): Buffer | null {
  let fd: number | null = null
  try {
    fd = openSync(path.resolve(filePath), 'r')
    const buffer = Buffer.alloc(byteLength)
    const bytesRead = readSync(fd, buffer, 0, byteLength, position)
    return buffer.subarray(0, bytesRead)
  } catch {
    return null
  } finally {
    if (fd !== null) closeSync(fd)
  }
}
