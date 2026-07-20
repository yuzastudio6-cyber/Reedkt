export const PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_MP4_FRAGMENT_INDEX_VERSION =
  'professional-long-form-customer-delivery-mp4-fragment-index-v1' as const

const MAXIMUM_CAPTURED_MOOV_BYTES = 4 * 1024 * 1024
const MAXIMUM_CAPTURED_MOOF_BYTES = 1024 * 1024
const MAXIMUM_FRAGMENT_COUNT = 100_000
const MAXIMUM_TRACK_COUNT = 32

export type ProfessionalLongFormCustomerDeliveryMp4Fragment = {
  ordinal: number
  sequenceNumber: number
  byteStart: number
  byteEndExclusive: number | null
  decodeStartSeconds: number
  containsVideoTrack: boolean
  containsAudioTrack: boolean
  containsMediaData: boolean
}

export type ProfessionalLongFormCustomerDeliveryMp4RecoveryWindow = {
  targetTimeSeconds: number
  byteStart: number
  byteEndExclusive: number
  firstFragmentOrdinal: number
  lastFragmentOrdinal: number
  targetFragmentOrdinal: number
  targetFragmentDecodeStartSeconds: number
  indexedFragmentCount: number
  indexComplete: boolean
}

export type ProfessionalLongFormCustomerDeliveryMp4FragmentIndexSnapshot = {
  schemaVersion:
    typeof PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_MP4_FRAGMENT_INDEX_VERSION
  contiguousByteCount: number
  fileTypeIndexed: boolean
  initializationSegmentIndexed: boolean
  videoTrackId: number | null
  audioTrackIds: number[]
  fragmentCount: number
  complete: boolean
  totalByteSize: number | null
  totalDurationSeconds: number | null
  fragments: ProfessionalLongFormCustomerDeliveryMp4Fragment[]
}

export type ProfessionalLongFormCustomerDeliveryMp4FragmentIndexProgress = {
  contiguousByteCount: number
  initializationSegmentIndexed: boolean
  fragmentCount: number
}

type TrackAuthority = {
  trackId: number
  handlerType: 'vide' | 'soun'
  timescale: number
}

type CurrentTopLevelBox = {
  start: number
  size: number
  type: string
  headerSize: number
  remaining: number
  captured: Uint8Array | null
  capturedLength: number
}

export function createProfessionalLongFormCustomerDeliveryMp4FragmentIndex() {
  const header = new Uint8Array(16)
  let headerLength = 0
  let contiguousByteCount = 0
  let currentBox: CurrentTopLevelBox | undefined
  let trackAuthorities = new Map<number, TrackAuthority>()
  let fileTypeIndexed = false
  let initializationSegmentIndexed = false
  let complete = false
  let totalByteSize: number | null = null
  let totalDurationSeconds: number | null = null
  const fragments: ProfessionalLongFormCustomerDeliveryMp4Fragment[] = []

  const push = (input: { start: number; bytes: Uint8Array }) => {
    if (complete) throw invalid('Fragment index is already complete.')
    if (
      !Number.isSafeInteger(input.start) ||
      input.start < 0 ||
      input.start !== contiguousByteCount ||
      input.bytes.byteLength < 1
    ) throw invalid('Fragment index input lost contiguous byte authority.')
    let cursor = 0
    while (cursor < input.bytes.byteLength) {
      if (currentBox) {
        const count = Math.min(
          currentBox.remaining,
          input.bytes.byteLength - cursor,
        )
        if (currentBox.captured) {
          currentBox.captured.set(
            input.bytes.subarray(cursor, cursor + count),
            currentBox.capturedLength,
          )
          currentBox.capturedLength += count
        }
        cursor += count
        contiguousByteCount += count
        currentBox.remaining -= count
        if (currentBox.remaining === 0) {
          finalizeTopLevelBox(currentBox)
          currentBox = undefined
        }
        continue
      }

      const minimumHeaderBytes = headerLength < 8
        ? 8
        : readUint32(header, 0) === 1
          ? 16
          : 8
      const count = Math.min(
        minimumHeaderBytes - headerLength,
        input.bytes.byteLength - cursor,
      )
      header.set(input.bytes.subarray(cursor, cursor + count), headerLength)
      headerLength += count
      cursor += count
      contiguousByteCount += count
      if (headerLength < minimumHeaderBytes) continue

      // An extended-size header cannot be identified until its first eight
      // bytes arrive. Recompute the exact requirement before parsing so a
      // range boundary after byte eight remains a valid streaming boundary.
      const requiredHeaderBytes = readUint32(header, 0) === 1 ? 16 : 8
      if (headerLength < requiredHeaderBytes) continue

      const parsedHeader = parseBoxHeader(header, 0, headerLength)
      if (
        !parsedHeader ||
        parsedHeader.size === 0 ||
        parsedHeader.size < parsedHeader.headerSize
      ) {
        throw invalid('Fragmented MP4 requires bounded top-level box sizes.')
      }
      const start = contiguousByteCount - parsedHeader.headerSize
      const captureLimit = parsedHeader.type === 'moov'
        ? MAXIMUM_CAPTURED_MOOV_BYTES
        : parsedHeader.type === 'moof'
          ? MAXIMUM_CAPTURED_MOOF_BYTES
          : 0
      if (captureLimit > 0 && parsedHeader.size > captureLimit) {
        throw invalid(`Fragmented MP4 ${parsedHeader.type} metadata exceeds its bound.`)
      }
      const captured = captureLimit > 0
        ? new Uint8Array(parsedHeader.size)
        : null
      if (captured) captured.set(header.subarray(0, parsedHeader.headerSize))
      currentBox = {
        start,
        size: parsedHeader.size,
        type: parsedHeader.type,
        headerSize: parsedHeader.headerSize,
        remaining: parsedHeader.size - parsedHeader.headerSize,
        captured,
        capturedLength: parsedHeader.headerSize,
      }
      headerLength = 0
      if (currentBox.remaining === 0) {
        finalizeTopLevelBox(currentBox)
        currentBox = undefined
      }
    }
    return progress()
  }

  const finalizeTopLevelBox = (box: CurrentTopLevelBox) => {
    if (box.type === 'ftyp') {
      if (
        fileTypeIndexed ||
        initializationSegmentIndexed ||
        fragments.length ||
        box.size <= box.headerSize
      ) {
        throw invalid('Fragmented MP4 file-type authority is duplicated or late.')
      }
      fileTypeIndexed = true
      return
    }
    if (box.type === 'moov') {
      if (!fileTypeIndexed) {
        throw invalid('Fragmented MP4 initialization lacks file-type authority.')
      }
      if (!box.captured || initializationSegmentIndexed) {
        throw invalid('Fragmented MP4 initialization authority is duplicated.')
      }
      trackAuthorities = parseTrackAuthorities(box.captured)
      const tracks = [...trackAuthorities.values()]
      if (!tracks.some((track) => track.handlerType === 'vide')) {
        throw invalid('Fragmented MP4 initialization lacks video authority.')
      }
      if (!tracks.some((track) => track.handlerType === 'soun')) {
        throw invalid('Fragmented MP4 initialization lacks AAC audio authority.')
      }
      initializationSegmentIndexed = true
      return
    }
    if (box.type === 'mdat') {
      const currentFragment = fragments.at(-1)
      if (
        !initializationSegmentIndexed ||
        !currentFragment ||
        currentFragment.byteEndExclusive !== null ||
        box.size <= box.headerSize
      ) throw invalid('Fragmented MP4 media payload lacks exact fragment authority.')
      currentFragment.containsMediaData = true
      return
    }
    if (box.type !== 'moof') return
    if (!initializationSegmentIndexed || !box.captured) {
      throw invalid('Media fragment arrived before exact initialization authority.')
    }
    if (fragments.length >= MAXIMUM_FRAGMENT_COUNT) {
      throw invalid('Fragmented MP4 exceeds the retained fragment-index capacity.')
    }
    const parsed = parseMovieFragment(box.captured, trackAuthorities)
    const prior = fragments.at(-1)
    if (prior && !prior.containsMediaData) {
      throw invalid('Fragmented MP4 fragment lacks bounded media payload.')
    }
    if (
      prior &&
      parsed.sequenceNumber <= prior.sequenceNumber
    ) throw invalid('Fragmented MP4 sequence authority is not monotonic.')
    if (
      prior &&
      parsed.decodeStartSeconds + 0.001 < prior.decodeStartSeconds
    ) throw invalid('Fragmented MP4 decode order is not monotonic.')
    if (prior) prior.byteEndExclusive = box.start
    fragments.push({
      ordinal: fragments.length,
      sequenceNumber: parsed.sequenceNumber,
      byteStart: box.start,
      byteEndExclusive: null,
      decodeStartSeconds: parsed.decodeStartSeconds,
      containsVideoTrack: parsed.containsVideoTrack,
      containsAudioTrack: parsed.containsAudioTrack,
      containsMediaData: false,
    })
  }

  const finish = (input: {
    totalByteSize: number
    totalDurationSeconds: number
  }) => {
    if (
      complete ||
      !Number.isSafeInteger(input.totalByteSize) ||
      input.totalByteSize < 1 ||
      input.totalByteSize !== contiguousByteCount ||
      !Number.isFinite(input.totalDurationSeconds) ||
      input.totalDurationSeconds <= 0 ||
      currentBox !== undefined ||
      headerLength !== 0 ||
      !initializationSegmentIndexed ||
      fragments.length < 1 ||
      !fileTypeIndexed ||
      !fragments.some((fragment) => fragment.containsVideoTrack) ||
      !fragments.some((fragment) => fragment.containsAudioTrack) ||
      !fragments.every((fragment) => fragment.containsMediaData)
    ) throw invalid('Fragmented MP4 index cannot complete from partial authority.')
    const last = fragments.at(-1)!
    last.byteEndExclusive = input.totalByteSize
    if (last.decodeStartSeconds >= input.totalDurationSeconds) {
      throw invalid('Fragmented MP4 final decode time exceeds approved duration.')
    }
    complete = true
    totalByteSize = input.totalByteSize
    totalDurationSeconds = input.totalDurationSeconds
    return snapshot()
  }

  const resolveRecoveryWindow = (
    targetTimeSeconds: number,
  ): ProfessionalLongFormCustomerDeliveryMp4RecoveryWindow | undefined => {
    if (
      !Number.isFinite(targetTimeSeconds) ||
      targetTimeSeconds < 0 ||
      fragments.length < 1
    ) return undefined
    if (
      complete &&
      totalDurationSeconds !== null &&
      targetTimeSeconds > totalDurationSeconds
    ) return undefined
    const availableLength = fragments.at(-1)?.byteEndExclusive === null
      ? fragments.length - 1
      : fragments.length
    if (availableLength < 1) return undefined
    let targetIndex = -1
    let low = 0
    let high = availableLength - 1
    while (low <= high) {
      const middle = low + Math.floor((high - low) / 2)
      if (fragments[middle]!.decodeStartSeconds <= targetTimeSeconds + 0.001) {
        targetIndex = middle
        low = middle + 1
      } else {
        high = middle - 1
      }
    }
    if (targetIndex < 0) targetIndex = 0
    const firstIndex = Math.max(0, targetIndex - 1)
    const lastIndex = Math.min(availableLength - 1, targetIndex + 1)
    const first = fragments[firstIndex]!
    const last = fragments[lastIndex]!
    if (last.byteEndExclusive === null) return undefined
    return {
      targetTimeSeconds,
      byteStart: first.byteStart,
      byteEndExclusive: last.byteEndExclusive,
      firstFragmentOrdinal: first.ordinal,
      lastFragmentOrdinal: last.ordinal,
      targetFragmentOrdinal: fragments[targetIndex]!.ordinal,
      targetFragmentDecodeStartSeconds:
        fragments[targetIndex]!.decodeStartSeconds,
      indexedFragmentCount: fragments.length,
      indexComplete: complete,
    }
  }

  const snapshot = ():
    ProfessionalLongFormCustomerDeliveryMp4FragmentIndexSnapshot => {
    const tracks = [...trackAuthorities.values()]
    return {
      schemaVersion:
        PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_MP4_FRAGMENT_INDEX_VERSION,
      contiguousByteCount,
      fileTypeIndexed,
      initializationSegmentIndexed,
      videoTrackId: tracks.find((track) => track.handlerType === 'vide')
        ?.trackId ?? null,
      audioTrackIds: tracks.filter((track) => track.handlerType === 'soun')
        .map((track) => track.trackId)
        .sort((left, right) => left - right),
      fragmentCount: fragments.length,
      complete,
      totalByteSize,
      totalDurationSeconds,
      fragments: structuredClone(fragments),
    }
  }

  const progress = ():
    ProfessionalLongFormCustomerDeliveryMp4FragmentIndexProgress => ({
    contiguousByteCount,
    initializationSegmentIndexed,
    fragmentCount: fragments.length,
  })

  return { finish, progress, push, resolveRecoveryWindow, snapshot }
}

function parseTrackAuthorities(bytes: Uint8Array): Map<number, TrackAuthority> {
  const moov = requiredRootBox(bytes, 'moov')
  const tracks = new Map<number, TrackAuthority>()
  for (const trak of childBoxes(bytes, moov.payloadStart, moov.end)) {
    if (trak.type !== 'trak') continue
    const children = childBoxes(bytes, trak.payloadStart, trak.end)
    const tkhd = children.find((box) => box.type === 'tkhd')
    const mdia = children.find((box) => box.type === 'mdia')
    if (!tkhd || !mdia) continue
    const mdiaChildren = childBoxes(bytes, mdia.payloadStart, mdia.end)
    const mdhd = mdiaChildren.find((box) => box.type === 'mdhd')
    const hdlr = mdiaChildren.find((box) => box.type === 'hdlr')
    if (!mdhd || !hdlr) continue
    const handlerType = ascii(bytes, hdlr.payloadStart + 8, 4)
    if (handlerType !== 'vide' && handlerType !== 'soun') continue
    const trackId = parseTrackId(bytes, tkhd)
    const timescale = parseMediaTimescale(bytes, mdhd)
    if (
      tracks.has(trackId) ||
      tracks.size >= MAXIMUM_TRACK_COUNT
    ) throw invalid('Fragmented MP4 track authority is duplicated or oversized.')
    tracks.set(trackId, { trackId, handlerType, timescale })
  }
  return tracks
}

function parseMovieFragment(
  bytes: Uint8Array,
  tracks: Map<number, TrackAuthority>,
): {
  sequenceNumber: number
  decodeStartSeconds: number
  containsVideoTrack: boolean
  containsAudioTrack: boolean
} {
  const moof = requiredRootBox(bytes, 'moof')
  const children = childBoxes(bytes, moof.payloadStart, moof.end)
  const mfhd = children.find((box) => box.type === 'mfhd')
  if (!mfhd || mfhd.payloadStart + 8 > mfhd.end) {
    throw invalid('Media fragment lacks exact sequence authority.')
  }
  const sequenceNumber = readUint32(bytes, mfhd.payloadStart + 4)
  const decodeStarts: number[] = []
  let containsVideoTrack = false
  let containsAudioTrack = false
  for (const traf of children.filter((box) => box.type === 'traf')) {
    const trafChildren = childBoxes(bytes, traf.payloadStart, traf.end)
    const tfhd = trafChildren.find((box) => box.type === 'tfhd')
    const tfdt = trafChildren.find((box) => box.type === 'tfdt')
    if (!tfhd || !tfdt || tfhd.payloadStart + 8 > tfhd.end) continue
    const trackId = readUint32(bytes, tfhd.payloadStart + 4)
    const track = tracks.get(trackId)
    if (!track) continue
    const decodeTime = parseBaseMediaDecodeTime(bytes, tfdt)
    decodeStarts.push(decodeTime / track.timescale)
    containsVideoTrack ||= track.handlerType === 'vide'
    containsAudioTrack ||= track.handlerType === 'soun'
  }
  if (decodeStarts.length < 1) {
    throw invalid('Media fragment lacks recognized audio/video decode authority.')
  }
  return {
    sequenceNumber,
    decodeStartSeconds: Math.min(...decodeStarts),
    containsVideoTrack,
    containsAudioTrack,
  }
}

type ParsedBox = {
  type: string
  start: number
  end: number
  headerSize: number
  payloadStart: number
}

function requiredRootBox(bytes: Uint8Array, type: string): ParsedBox {
  const root = parseBoxAt(bytes, 0, bytes.byteLength)
  if (!root || root.type !== type || root.end !== bytes.byteLength) {
    throw invalid(`Captured fragmented MP4 ${type} box is invalid.`)
  }
  return root
}

function childBoxes(
  bytes: Uint8Array,
  start: number,
  end: number,
): ParsedBox[] {
  const boxes: ParsedBox[] = []
  let cursor = start
  while (cursor < end) {
    const box = parseBoxAt(bytes, cursor, end)
    if (!box) throw invalid('Nested fragmented MP4 box structure is invalid.')
    boxes.push(box)
    cursor = box.end
  }
  if (cursor !== end) throw invalid('Nested fragmented MP4 box boundary changed.')
  return boxes
}

function parseBoxAt(
  bytes: Uint8Array,
  start: number,
  parentEnd: number,
): ParsedBox | undefined {
  if (start < 0 || start + 8 > parentEnd) return undefined
  const parsed = parseBoxHeader(bytes, start, parentEnd - start)
  if (!parsed) return undefined
  const size = parsed.size === 0 ? parentEnd - start : parsed.size
  const end = start + size
  if (size < parsed.headerSize || end > parentEnd) return undefined
  return {
    type: parsed.type,
    start,
    end,
    headerSize: parsed.headerSize,
    payloadStart: start + parsed.headerSize,
  }
}

function parseBoxHeader(
  bytes: Uint8Array,
  start: number,
  availableBytes: number,
): { size: number; type: string; headerSize: number } | undefined {
  if (availableBytes < 8 || start + 8 > bytes.byteLength) return undefined
  const size32 = readUint32(bytes, start)
  const type = ascii(bytes, start + 4, 4)
  if (!/^[A-Za-z0-9 ]{4}$/u.test(type)) return undefined
  if (size32 === 1) {
    if (availableBytes < 16 || start + 16 > bytes.byteLength) return undefined
    const size64 = readUint64Safe(bytes, start + 8)
    return { size: size64, type, headerSize: 16 }
  }
  return { size: size32, type, headerSize: 8 }
}

function parseTrackId(bytes: Uint8Array, tkhd: ParsedBox): number {
  const version = byte(bytes, tkhd.payloadStart)
  const offset = tkhd.payloadStart + (version === 1 ? 20 : 12)
  if ((version !== 0 && version !== 1) || offset + 4 > tkhd.end) {
    throw invalid('Fragmented MP4 track-header version is unsupported.')
  }
  const trackId = readUint32(bytes, offset)
  if (trackId < 1) throw invalid('Fragmented MP4 track identity is invalid.')
  return trackId
}

function parseMediaTimescale(bytes: Uint8Array, mdhd: ParsedBox): number {
  const version = byte(bytes, mdhd.payloadStart)
  const offset = mdhd.payloadStart + (version === 1 ? 20 : 12)
  if ((version !== 0 && version !== 1) || offset + 4 > mdhd.end) {
    throw invalid('Fragmented MP4 media-header version is unsupported.')
  }
  const timescale = readUint32(bytes, offset)
  if (timescale < 1) throw invalid('Fragmented MP4 media timescale is invalid.')
  return timescale
}

function parseBaseMediaDecodeTime(bytes: Uint8Array, tfdt: ParsedBox): number {
  const version = byte(bytes, tfdt.payloadStart)
  const offset = tfdt.payloadStart + 4
  if (version === 0 && offset + 4 <= tfdt.end) return readUint32(bytes, offset)
  if (version === 1 && offset + 8 <= tfdt.end) return readUint64Safe(bytes, offset)
  throw invalid('Fragmented MP4 decode-time version is unsupported.')
}

function readUint32(bytes: Uint8Array, offset: number): number {
  if (offset < 0 || offset + 4 > bytes.byteLength) {
    throw invalid('Fragmented MP4 integer read exceeded its box.')
  }
  return new DataView(
    bytes.buffer,
    bytes.byteOffset + offset,
    4,
  ).getUint32(0, false)
}

function readUint64Safe(bytes: Uint8Array, offset: number): number {
  if (offset < 0 || offset + 8 > bytes.byteLength) {
    throw invalid('Fragmented MP4 integer read exceeded its box.')
  }
  const high = readUint32(bytes, offset)
  const low = readUint32(bytes, offset + 4)
  const value = high * 0x1_0000_0000 + low
  if (!Number.isSafeInteger(value)) {
    throw invalid('Fragmented MP4 integer exceeds browser-safe precision.')
  }
  return value
}

function byte(bytes: Uint8Array, offset: number): number {
  const value = bytes[offset]
  if (value === undefined) throw invalid('Fragmented MP4 byte is missing.')
  return value
}

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  if (offset < 0 || offset + length > bytes.byteLength) {
    throw invalid('Fragmented MP4 text read exceeded its box.')
  }
  let value = ''
  for (let index = 0; index < length; index += 1) {
    value += String.fromCharCode(bytes[offset + index]!)
  }
  return value
}

function invalid(message: string): Error {
  return new Error(message)
}
