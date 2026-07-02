import {
  createHash,
} from 'node:crypto'
import {
  deflateSync,
} from 'node:zlib'
import type {
  SyntheticFixtureDryRunArtifact,
} from './synthetic-fixture-dry-run-types'
import {
  stableSyntheticFixtureDryRunJsonStringify,
} from './synthetic-fixture-dry-run-materializer'
import type {
  BinaryFixtureGeneratedArtifactBuffer,
} from './binary-fixture-generation-types'

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

function sha256Buffer(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex')
}

export function checksumBinaryFixtureBuffer(buffer: Buffer): string {
  return sha256Buffer(buffer)
}

function numericPayloadValue(
  artifact: SyntheticFixtureDryRunArtifact,
  key: string,
  fallback: number,
  max: number,
): number {
  const value = artifact.payloadJson[key]
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback

  return Math.max(1, Math.min(max, Math.floor(value)))
}

function jsonBufferForArtifact(artifact: SyntheticFixtureDryRunArtifact, videoDescriptorOnly: boolean): Buffer {
  const payload = videoDescriptorOnly
    ? {
        ...artifact.payloadJson,
        descriptorOnly: true,
        videoBinaryDeferred: true,
        generatedBinary: false,
        binaryMediaGenerated: false,
        mediaContainerGenerated: false,
      }
    : artifact.payloadJson

  return Buffer.from(stableSyntheticFixtureDryRunJsonStringify(payload), 'utf8')
}

function buildWavBuffer(artifact: SyntheticFixtureDryRunArtifact): Buffer {
  const sampleRate = 8000
  const durationSeconds = Math.min(numericPayloadValue(artifact, 'durationSeconds', 1, 3), 3)
  const sampleCount = sampleRate * durationSeconds
  const bytesPerSample = 2
  const dataSize = sampleCount * bytesPerSample
  const buffer = Buffer.alloc(44 + dataSize)

  buffer.write('RIFF', 0, 'ascii')
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write('WAVE', 8, 'ascii')
  buffer.write('fmt ', 12, 'ascii')
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(1, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * bytesPerSample, 28)
  buffer.writeUInt16LE(bytesPerSample, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36, 'ascii')
  buffer.writeUInt32LE(dataSize, 40)

  for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
    const angle = (2 * Math.PI * 440 * sampleIndex) / sampleRate
    const sample = Math.round(Math.sin(angle) * 1200)
    buffer.writeInt16LE(sample, 44 + sampleIndex * bytesPerSample)
  }

  return buffer
}

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff

  for (const byte of buffer) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
    }
  }

  return (crc ^ 0xffffffff) >>> 0
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuffer = Buffer.from(type, 'ascii')
  const lengthBuffer = Buffer.alloc(4)
  const crcBuffer = Buffer.alloc(4)
  lengthBuffer.writeUInt32BE(data.length, 0)
  crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0)

  return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer])
}

function pixelForArtifact(
  artifact: SyntheticFixtureDryRunArtifact,
  x: number,
  y: number,
  width: number,
  height: number,
): readonly [number, number, number, number] {
  if (artifact.fixtureKind === 'synthetic_mask') {
    const inSquare = x >= Math.floor(width / 4) &&
      x < Math.floor((width * 3) / 4) &&
      y >= Math.floor(height / 4) &&
      y < Math.floor((height * 3) / 4)
    return inSquare ? [255, 255, 255, 255] : [0, 0, 0, 255]
  }

  const checker = (Math.floor(x / 16) + Math.floor(y / 16)) % 2 === 0
  if (checker) return [32, 120, 220, 255]
  if (x > Math.floor(width / 3) && x < Math.floor((width * 2) / 3)) return [245, 220, 64, 255]

  return [26, 38, 48, 255]
}

function buildPngBuffer(artifact: SyntheticFixtureDryRunArtifact): Buffer {
  const width = numericPayloadValue(artifact, 'width', 64, 320)
  const height = numericPayloadValue(artifact, 'height', 36, 180)
  const raw = Buffer.alloc((width * 4 + 1) * height)

  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * (width * 4 + 1)
    raw[rowOffset] = 0

    for (let x = 0; x < width; x += 1) {
      const [red, green, blue, alpha] = pixelForArtifact(artifact, x, y, width, height)
      const pixelOffset = rowOffset + 1 + x * 4
      raw[pixelOffset] = red
      raw[pixelOffset + 1] = green
      raw[pixelOffset + 2] = blue
      raw[pixelOffset + 3] = alpha
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  return Buffer.concat([
    PNG_SIGNATURE,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

export function generateBinaryFixtureArtifactBuffer(
  artifact: SyntheticFixtureDryRunArtifact,
): BinaryFixtureGeneratedArtifactBuffer {
  if (artifact.fixtureKind === 'synthetic_audio') {
    return {
      contentBuffer: buildWavBuffer(artifact),
      contentType: 'audio/wav',
      generatorName: 'wav_pcm_generator',
      payloadKind: artifact.payloadKind,
      generatedBy: 'node_standard_library',
      generatedBinary: true,
      descriptorOnly: false,
      videoBinaryDeferred: false,
      binaryMediaGenerated: true,
    }
  }

  if (artifact.fixtureKind === 'synthetic_image' || artifact.fixtureKind === 'synthetic_mask') {
    return {
      contentBuffer: buildPngBuffer(artifact),
      contentType: 'image/png',
      generatorName: 'png_rgba_generator',
      payloadKind: artifact.payloadKind,
      generatedBy: 'node_standard_library',
      generatedBinary: true,
      descriptorOnly: false,
      videoBinaryDeferred: false,
      binaryMediaGenerated: true,
    }
  }

  if (artifact.fixtureKind === 'synthetic_video') {
    return {
      contentBuffer: jsonBufferForArtifact(artifact, true),
      contentType: 'application/json',
      generatorName: 'video_descriptor_json_generator',
      payloadKind: artifact.payloadKind,
      generatedBy: 'node_standard_library',
      generatedBinary: false,
      descriptorOnly: true,
      videoBinaryDeferred: true,
      binaryMediaGenerated: false,
    }
  }

  return {
    contentBuffer: jsonBufferForArtifact(artifact, false),
    contentType: 'application/json',
    generatorName: 'json_buffer_generator',
    payloadKind: artifact.payloadKind,
    generatedBy: 'node_standard_library',
    generatedBinary: false,
    descriptorOnly: false,
    videoBinaryDeferred: false,
    binaryMediaGenerated: false,
  }
}
