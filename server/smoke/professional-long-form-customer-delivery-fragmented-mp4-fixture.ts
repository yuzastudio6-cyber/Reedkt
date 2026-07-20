export type ProfessionalLongFormCustomerDeliveryFragmentedMp4Fixture = {
  bytes: Uint8Array
  durationSeconds: number
  fragmentByteRanges: Array<{
    ordinal: number
    byteStart: number
    byteEndExclusive: number
    decodeStartSeconds: number
  }>
}

export function createProfessionalLongFormCustomerDeliveryFragmentedMp4Fixture(
  input: {
    fragmentCount: number
    mediaPayloadBytesPerFragment: number
    includeAudio?: boolean
    extendedFtyp?: boolean
    decodeStartSeconds?: number[]
    sequenceNumbers?: number[]
    omitMediaPayloadOrdinals?: number[]
  },
): ProfessionalLongFormCustomerDeliveryFragmentedMp4Fixture {
  if (
    !Number.isSafeInteger(input.fragmentCount) ||
    input.fragmentCount < 1 ||
    !Number.isSafeInteger(input.mediaPayloadBytesPerFragment) ||
    input.mediaPayloadBytesPerFragment < 1
  ) throw new Error('Synthetic fragmented-MP4 fixture bounds are invalid.')
  const includeAudio = input.includeAudio ?? true
  const decodeStarts = input.decodeStartSeconds ?? Array.from(
    { length: input.fragmentCount },
    (_, index) => index,
  )
  if (
    decodeStarts.length !== input.fragmentCount ||
    decodeStarts.some((value) => !Number.isSafeInteger(value) || value < 0)
  ) throw new Error('Synthetic fragmented-MP4 decode times are invalid.')
  const sequenceNumbers = input.sequenceNumbers ?? Array.from(
    { length: input.fragmentCount },
    (_, index) => index + 1,
  )
  if (
    sequenceNumbers.length !== input.fragmentCount ||
    sequenceNumbers.some((value) => !Number.isSafeInteger(value) || value < 1)
  ) throw new Error('Synthetic fragmented-MP4 sequence numbers are invalid.')
  const omittedPayloads = new Set(input.omitMediaPayloadOrdinals ?? [])

  const ftypPayload = Buffer.from('isom\x00\x00\x02\x00isomiso6mp41', 'binary')
  const ftyp = input.extendedFtyp === false
    ? box('ftyp', ftypPayload)
    : extendedBox('ftyp', ftypPayload)
  const tracks = [track(1, 'vide', 1_000)]
  if (includeAudio) tracks.push(track(2, 'soun', 48_000))
  const moov = box('moov', ...tracks)
  const parts: Buffer[] = [ftyp, moov]
  const fragmentByteRanges: ProfessionalLongFormCustomerDeliveryFragmentedMp4Fixture[
    'fragmentByteRanges'
  ] = []
  let offset = ftyp.byteLength + moov.byteLength

  for (let ordinal = 0; ordinal < input.fragmentCount; ordinal += 1) {
    const decodeStartSeconds = decodeStarts[ordinal]!
    const trafs = [trackFragment(1, decodeStartSeconds * 1_000)]
    if (includeAudio) {
      trafs.push(trackFragment(2, decodeStartSeconds * 48_000))
    }
    const mfhdPayload = Buffer.alloc(8)
    mfhdPayload.writeUInt32BE(sequenceNumbers[ordinal]!, 4)
    const moof = box('moof', box('mfhd', mfhdPayload), ...trafs)
    const mediaPayload = Buffer.alloc(
      input.mediaPayloadBytesPerFragment,
      (ordinal + 1) & 0xff,
    )
    const mdat = box('mdat', mediaPayload)
    const byteStart = offset
    const omitMediaPayload = omittedPayloads.has(ordinal)
    offset += moof.byteLength + (omitMediaPayload ? 0 : mdat.byteLength)
    parts.push(moof)
    if (!omitMediaPayload) parts.push(mdat)
    fragmentByteRanges.push({
      ordinal,
      byteStart,
      byteEndExclusive: offset,
      decodeStartSeconds,
    })
  }

  return {
    bytes: Buffer.concat(parts),
    durationSeconds: Math.max(...decodeStarts) + 1,
    fragmentByteRanges,
  }
}

function track(trackId: number, handlerType: 'vide' | 'soun', timescale: number) {
  const tkhdPayload = Buffer.alloc(20)
  tkhdPayload.writeUInt32BE(trackId, 12)
  const mdhdPayload = Buffer.alloc(20)
  mdhdPayload.writeUInt32BE(timescale, 12)
  const hdlrPayload = Buffer.alloc(12)
  hdlrPayload.write(handlerType, 8, 4, 'ascii')
  return box(
    'trak',
    box('tkhd', tkhdPayload),
    box('mdia', box('mdhd', mdhdPayload), box('hdlr', hdlrPayload)),
  )
}

function trackFragment(trackId: number, decodeTime: number) {
  const tfhdPayload = Buffer.alloc(8)
  tfhdPayload.writeUInt32BE(trackId, 4)
  const tfdtPayload = Buffer.alloc(8)
  tfdtPayload.writeUInt32BE(decodeTime, 4)
  return box(
    'traf',
    box('tfhd', tfhdPayload),
    box('tfdt', tfdtPayload),
  )
}

function box(type: string, ...payloads: Uint8Array[]): Buffer {
  const payloadSize = payloads.reduce(
    (total, payload) => total + payload.byteLength,
    0,
  )
  const result = Buffer.alloc(8 + payloadSize)
  result.writeUInt32BE(result.byteLength, 0)
  result.write(type, 4, 4, 'ascii')
  let offset = 8
  for (const payload of payloads) {
    Buffer.from(payload).copy(result, offset)
    offset += payload.byteLength
  }
  return result
}

function extendedBox(type: string, ...payloads: Uint8Array[]): Buffer {
  const payloadSize = payloads.reduce(
    (total, payload) => total + payload.byteLength,
    0,
  )
  const result = Buffer.alloc(16 + payloadSize)
  result.writeUInt32BE(1, 0)
  result.write(type, 4, 4, 'ascii')
  result.writeBigUInt64BE(BigInt(result.byteLength), 8)
  let offset = 16
  for (const payload of payloads) {
    Buffer.from(payload).copy(result, offset)
    offset += payload.byteLength
  }
  return result
}
