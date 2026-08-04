export const PCM_WAVE_MAXIMUM_HEADER_BYTES = 64 * 1024

export interface PcmWaveDetails {
  audioFormat: 1
  channels: number
  sampleRate: number
  byteRate: number
  blockAlign: number
  bitsPerSample: number
  dataOffset: number
  dataByteLength: number
  sampleFrameCount: number
  durationSeconds: number
}

/**
 * Validates a bounded RIFF/WAVE prefix against the exact complete object size.
 * The data payload is never buffered. FFmpeg may emit unknown RIFF/data sizes
 * (`0xffffffff`) for a non-seekable pipe, so those sentinel values are accepted
 * while concrete sizes must match the committed object.
 */
export function inspectPcmWavePrefix(
  prefix: Buffer,
  totalByteLength: number,
): PcmWaveDetails | undefined {
  if (
    !Number.isSafeInteger(totalByteLength) || totalByteLength < 44 ||
    prefix.byteLength < 12 || prefix.byteLength > PCM_WAVE_MAXIMUM_HEADER_BYTES ||
    prefix.subarray(0, 4).toString('ascii') !== 'RIFF' ||
    prefix.subarray(8, 12).toString('ascii') !== 'WAVE'
  ) return undefined

  const declaredRiffSize = prefix.readUInt32LE(4)
  if (declaredRiffSize !== 0xffffffff && declaredRiffSize + 8 !== totalByteLength) {
    return undefined
  }

  let offset = 12
  let format: Omit<PcmWaveDetails, 'dataOffset' | 'dataByteLength' | 'sampleFrameCount' | 'durationSeconds'> | undefined
  while (offset + 8 <= prefix.byteLength) {
    const chunkId = prefix.subarray(offset, offset + 4).toString('ascii')
    const declaredChunkSize = prefix.readUInt32LE(offset + 4)
    const chunkDataOffset = offset + 8
    if (chunkId === 'fmt ') {
      if (
        declaredChunkSize < 16 || declaredChunkSize === 0xffffffff ||
        chunkDataOffset + 16 > prefix.byteLength
      ) return undefined
      const audioFormat = prefix.readUInt16LE(chunkDataOffset)
      const channels = prefix.readUInt16LE(chunkDataOffset + 2)
      const sampleRate = prefix.readUInt32LE(chunkDataOffset + 4)
      const byteRate = prefix.readUInt32LE(chunkDataOffset + 8)
      const blockAlign = prefix.readUInt16LE(chunkDataOffset + 12)
      const bitsPerSample = prefix.readUInt16LE(chunkDataOffset + 14)
      if (
        audioFormat !== 1 || channels < 1 || channels > 8 ||
        sampleRate < 8_000 || sampleRate > 384_000 ||
        ![8, 16, 24, 32].includes(bitsPerSample) ||
        blockAlign !== channels * (bitsPerSample / 8) ||
        byteRate !== sampleRate * blockAlign
      ) return undefined
      format = {
        audioFormat: 1,
        channels,
        sampleRate,
        byteRate,
        blockAlign,
        bitsPerSample,
      }
    } else if (chunkId === 'data') {
      if (!format) return undefined
      const dataByteLength = totalByteLength - chunkDataOffset
      if (
        dataByteLength <= 0 || dataByteLength % format.blockAlign !== 0 ||
        (declaredChunkSize !== 0xffffffff && declaredChunkSize !== dataByteLength)
      ) return undefined
      const sampleFrameCount = dataByteLength / format.blockAlign
      return {
        ...format,
        dataOffset: chunkDataOffset,
        dataByteLength,
        sampleFrameCount,
        durationSeconds: sampleFrameCount / format.sampleRate,
      }
    }

    if (declaredChunkSize === 0xffffffff) return undefined
    const paddedChunkSize = declaredChunkSize + (declaredChunkSize % 2)
    const nextOffset = chunkDataOffset + paddedChunkSize
    if (!Number.isSafeInteger(nextOffset) || nextOffset <= offset) return undefined
    offset = nextOffset
  }
  return undefined
}
