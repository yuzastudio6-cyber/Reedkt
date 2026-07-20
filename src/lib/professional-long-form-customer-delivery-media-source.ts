import {
  professionalLongFormCustomerDeliveryBrowserReviewSchema,
  type ProfessionalLongFormCustomerDeliveryBrowserReview,
} from '../backend/api/professional-long-form-customer-delivery-browser-contracts'
import {
  PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_MAX_RANGE_BYTES,
  readProfessionalLongFormCustomerDeliveryReviewRange,
  type ProfessionalLongFormCustomerDeliveryClientInput,
  type ProfessionalLongFormCustomerDeliveryMediaRangeClientResult,
} from './professional-long-form-customer-delivery-client'

export const PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_MEDIA_SOURCE_VERSION =
  'professional-long-form-customer-delivery-media-source-v1' as const
export const PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_MEDIA_SOURCE_MIME =
  'video/mp4; codecs="avc1.640033, mp4a.40.2"' as const

const DEFAULT_RANGE_BYTES = 4 * 1024 * 1024
const MINIMUM_RANGE_BYTES = 64 * 1024
const MAXIMUM_BUFFER_AHEAD_SECONDS = 120
const RETAIN_BUFFER_BEHIND_SECONDS = 30
const SOURCE_OPEN_TIMEOUT_MS = 10_000
const SOURCE_BUFFER_OPERATION_TIMEOUT_MS = 30_000
const PLAYBACK_RATE_MINIMUM = 0.5
const PLAYBACK_RATE_MAXIMUM = 2
const COVERAGE_CLOCK_SLACK_SECONDS = 2

export type ProfessionalLongFormCustomerDeliveryMediaSourceState = {
  schemaVersion:
    typeof PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_MEDIA_SOURCE_VERSION
  status:
    | 'buffering'
    | 'streaming'
    | 'stream_complete'
    | 'failed'
    | 'disposed'
  bytesAppended: number
  totalByteSize: number
  rangeRequestCount: number
  fullyAppended: boolean
  failureMessage?: string
}

export type ProfessionalLongFormCustomerDeliveryPlaybackCoverage = {
  totalFrameCount: number
  coveredFrameCount: number
  coveragePermille: number
  fullProgramPlaybackObserved: boolean
  intervals: Array<{
    startFrame: number
    endFrameExclusive: number
  }>
}

export type ProfessionalLongFormCustomerDeliveryMediaSourceController = {
  completion: Promise<ProfessionalLongFormCustomerDeliveryMediaSourceState>
  dispose: () => void
  getCoverage: () => ProfessionalLongFormCustomerDeliveryPlaybackCoverage
  getState: () => ProfessionalLongFormCustomerDeliveryMediaSourceState
}

export type ProfessionalLongFormCustomerDeliveryMediaSourceAttachResult =
  | {
      status: 'attached'
      controller: ProfessionalLongFormCustomerDeliveryMediaSourceController
      warnings: string[]
    }
  | {
      status: 'blocked' | 'unsupported' | 'unavailable'
      message: string
      retryable: boolean
      warnings: string[]
    }

type MediaElementLike = EventTarget & {
  src: string
  currentTime: number
  playbackRate: number
  paused: boolean
  ended: boolean
  load: () => void
}

type TimeRangesLike = {
  length: number
  start: (index: number) => number
  end: (index: number) => number
}

type SourceBufferLike = EventTarget & {
  updating: boolean
  buffered: TimeRangesLike
  mode: string
  appendBuffer: (bytes: ArrayBuffer) => void
  remove: (start: number, end: number) => void
}

type MediaSourceLike = EventTarget & {
  readyState: string
  addSourceBuffer: (mimeType: string) => SourceBufferLike
  endOfStream: () => void
}

type MediaSourceRuntime = {
  createMediaSource: () => MediaSourceLike
  createObjectUrl: (source: MediaSourceLike) => string
  revokeObjectUrl: (url: string) => void
  isTypeSupported: (mimeType: string) => boolean
  now: () => number
}

type ReviewRangeReader = (input: {
  authority: ProfessionalLongFormCustomerDeliveryClientInput
  review: ProfessionalLongFormCustomerDeliveryBrowserReview
  start: number
  end: number
}) => Promise<ProfessionalLongFormCustomerDeliveryMediaRangeClientResult>

export async function attachProfessionalLongFormCustomerDeliveryMediaSource(
  input: {
    authority: ProfessionalLongFormCustomerDeliveryClientInput
    review: ProfessionalLongFormCustomerDeliveryBrowserReview
    mediaElement: MediaElementLike
    rangeByteSize?: number
    onStateChange?: (
      state: ProfessionalLongFormCustomerDeliveryMediaSourceState,
    ) => void
    runtime?: MediaSourceRuntime
    rangeReader?: ReviewRangeReader
  },
): Promise<ProfessionalLongFormCustomerDeliveryMediaSourceAttachResult> {
  const review = professionalLongFormCustomerDeliveryBrowserReviewSchema
    .safeParse(input.review)
  if (!review.success || !reviewMatchesAuthority(review.data, input.authority)) {
    return attachFailure(
      'blocked',
      'Refresh the exact customer-delivery review before attaching private playback.',
      false,
    )
  }
  const rangeByteSize = input.rangeByteSize ?? DEFAULT_RANGE_BYTES
  if (
    !Number.isSafeInteger(rangeByteSize) ||
    rangeByteSize < MINIMUM_RANGE_BYTES ||
    rangeByteSize >
      PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_MAX_RANGE_BYTES
  ) {
    return attachFailure(
      'blocked',
      'Private playback range size is outside the reviewed browser-memory bound.',
      false,
    )
  }
  const runtime = input.runtime ?? defaultMediaSourceRuntime()
  if (!runtime) {
    return attachFailure(
      'unsupported',
      'This browser does not expose the private streaming-media boundary required for long-form review.',
      false,
    )
  }
  if (!runtime.isTypeSupported(
    PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_MEDIA_SOURCE_MIME,
  )) {
    return attachFailure(
      'unsupported',
      'This browser cannot decode the approved H.264/AAC private-review profile.',
      false,
    )
  }

  let mediaSource: MediaSourceLike
  let objectUrl: string | undefined
  try {
    mediaSource = runtime.createMediaSource()
    objectUrl = runtime.createObjectUrl(mediaSource)
    input.mediaElement.src = objectUrl
    input.mediaElement.load()
    await waitForEvent(
      mediaSource,
      'sourceopen',
      SOURCE_OPEN_TIMEOUT_MS,
    )
  } catch {
    if (typeof objectUrl === 'string') runtime.revokeObjectUrl(objectUrl)
    input.mediaElement.src = ''
    input.mediaElement.load()
    return attachFailure(
      'unavailable',
      'The private streaming-media session could not be opened.',
      true,
    )
  }
  if (!objectUrl) {
    return attachFailure(
      'unavailable',
      'The private streaming-media session did not create a bounded browser URL.',
      true,
    )
  }

  let sourceBuffer: SourceBufferLike
  try {
    sourceBuffer = mediaSource.addSourceBuffer(
      PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_MEDIA_SOURCE_MIME,
    )
    sourceBuffer.mode = 'segments'
  } catch {
    runtime.revokeObjectUrl(objectUrl)
    input.mediaElement.src = ''
    input.mediaElement.load()
    return attachFailure(
      'unsupported',
      'The browser rejected the approved fragmented MP4 source-buffer profile.',
      false,
    )
  }

  const coverage = createProfessionalLongFormCustomerDeliveryCoverageTracker({
    totalFrameCount: review.data.authority.masterFrameCount,
    frameRateNumerator: review.data.authority.frameRateNumerator,
    frameRateDenominator: review.data.authority.frameRateDenominator,
  })
  let disposed = false
  let state: ProfessionalLongFormCustomerDeliveryMediaSourceState = {
    schemaVersion:
      PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_MEDIA_SOURCE_VERSION,
    status: 'buffering',
    bytesAppended: 0,
    totalByteSize: review.data.authority.masterByteSize,
    rangeRequestCount: 0,
    fullyAppended: false,
  }
  const publish = (
    patch: Partial<ProfessionalLongFormCustomerDeliveryMediaSourceState>,
  ) => {
    state = { ...state, ...patch }
    input.onStateChange?.(structuredClone(state))
  }
  const unbindCoverage = bindPlaybackCoverage({
    mediaElement: input.mediaElement,
    coverage,
    now: runtime.now,
  })
  const rangeReader = input.rangeReader ??
    readProfessionalLongFormCustomerDeliveryReviewRange

  const completion = pumpAuthenticatedRanges({
    authority: input.authority,
    review: review.data,
    mediaElement: input.mediaElement,
    mediaSource,
    sourceBuffer,
    rangeByteSize,
    rangeReader,
    disposed: () => disposed,
    onRangeAppended: (bytesAppended, rangeRequestCount) => publish({
      status: 'streaming',
      bytesAppended,
      rangeRequestCount,
    }),
  }).then(() => {
    if (disposed) return state
    publish({
      status: 'stream_complete',
      bytesAppended: review.data.authority.masterByteSize,
      fullyAppended: true,
    })
    return state
  }).catch((error: unknown) => {
    if (disposed) return state
    publish({
      status: 'failed',
      failureMessage: error instanceof Error
        ? error.message
        : 'Private playback stopped unexpectedly.',
    })
    return state
  })

  const dispose = () => {
    if (disposed) return
    disposed = true
    unbindCoverage()
    runtime.revokeObjectUrl(objectUrl)
    input.mediaElement.src = ''
    input.mediaElement.load()
    publish({ status: 'disposed' })
  }

  return {
    status: 'attached',
    controller: {
      completion,
      dispose,
      getCoverage: coverage.snapshot,
      getState: () => structuredClone(state),
    },
    warnings: [
      'Playback uses authenticated no-store ranges and never creates a public or signed media URL.',
      'Client-observed playback coverage is not durable acceptance authority until the server watch-evidence gate is connected.',
    ],
  }
}

export function createProfessionalLongFormCustomerDeliveryCoverageTracker(
  input: {
    totalFrameCount: number
    frameRateNumerator: number
    frameRateDenominator: number
  },
) {
  if (
    !Number.isSafeInteger(input.totalFrameCount) ||
    input.totalFrameCount <= 0 ||
    !Number.isSafeInteger(input.frameRateNumerator) ||
    input.frameRateNumerator <= 0 ||
    !Number.isSafeInteger(input.frameRateDenominator) ||
    input.frameRateDenominator <= 0
  ) throw new Error('Playback coverage timing authority is invalid.')

  const framesPerSecond = input.frameRateNumerator /
    input.frameRateDenominator
  const intervals: Array<{ startFrame: number; endFrameExclusive: number }> = []
  let anchor: { frame: number; observedAtMs: number } | undefined

  const interrupt = () => {
    anchor = undefined
  }
  const begin = (
    mediaTimeSeconds: number,
    playbackRate: number,
    observedAtMs: number,
  ) => {
    anchor = validPlaybackSample(
      mediaTimeSeconds,
      playbackRate,
      observedAtMs,
    )
      ? {
          frame: frameAt(mediaTimeSeconds, framesPerSecond,
            input.totalFrameCount),
          observedAtMs,
        }
      : undefined
  }
  const advance = (
    mediaTimeSeconds: number,
    playbackRate: number,
    observedAtMs: number,
  ) => {
    if (!validPlaybackSample(
      mediaTimeSeconds,
      playbackRate,
      observedAtMs,
    )) {
      interrupt()
      return
    }
    const currentFrame = frameAt(
      mediaTimeSeconds,
      framesPerSecond,
      input.totalFrameCount,
    )
    if (!anchor) {
      anchor = { frame: currentFrame, observedAtMs }
      return
    }
    const elapsedMs = observedAtMs - anchor.observedAtMs
    const frameDelta = currentFrame - anchor.frame
    const maximumPlausibleFrames = Math.ceil(
      ((Math.max(0, elapsedMs) / 1_000) +
        COVERAGE_CLOCK_SLACK_SECONDS) *
      framesPerSecond * playbackRate,
    )
    if (
      elapsedMs >= 0 &&
      frameDelta >= 0 &&
      frameDelta <= maximumPlausibleFrames
    ) {
      addCoverageInterval(
        intervals,
        normalizeEdgeFrame(anchor.frame, input.totalFrameCount),
        normalizeEdgeFrame(
          Math.min(input.totalFrameCount, currentFrame + 1),
          input.totalFrameCount,
        ),
      )
    }
    anchor = { frame: currentFrame, observedAtMs }
  }
  const snapshot = (): ProfessionalLongFormCustomerDeliveryPlaybackCoverage => {
    const coveredFrameCount = intervals.reduce(
      (sum, interval) =>
        sum + interval.endFrameExclusive - interval.startFrame,
      0,
    )
    return {
      totalFrameCount: input.totalFrameCount,
      coveredFrameCount,
      coveragePermille: Math.floor(
        (coveredFrameCount * 1_000) / input.totalFrameCount,
      ),
      fullProgramPlaybackObserved:
        intervals.length === 1 &&
        intervals[0]?.startFrame === 0 &&
        intervals[0]?.endFrameExclusive === input.totalFrameCount,
      intervals: structuredClone(intervals),
    }
  }
  return { advance, begin, interrupt, snapshot }
}

async function pumpAuthenticatedRanges(input: {
  authority: ProfessionalLongFormCustomerDeliveryClientInput
  review: ProfessionalLongFormCustomerDeliveryBrowserReview
  mediaElement: MediaElementLike
  mediaSource: MediaSourceLike
  sourceBuffer: SourceBufferLike
  rangeByteSize: number
  rangeReader: ReviewRangeReader
  disposed: () => boolean
  onRangeAppended: (
    bytesAppended: number,
    rangeRequestCount: number,
  ) => void
}): Promise<void> {
  const totalByteSize = input.review.authority.masterByteSize
  let offset = 0
  let rangeRequestCount = 0
  while (offset < totalByteSize && !input.disposed()) {
    await evictOldBuffer(input.sourceBuffer, input.mediaElement.currentTime)
    await waitForBufferCapacity({
      sourceBuffer: input.sourceBuffer,
      mediaElement: input.mediaElement,
      disposed: input.disposed,
    })
    if (input.disposed()) return
    const end = Math.min(
      totalByteSize - 1,
      offset + input.rangeByteSize - 1,
    )
    const result = await input.rangeReader({
      authority: input.authority,
      review: input.review,
      start: offset,
      end,
    })
    if (result.status !== 'ready') {
      throw new Error(result.message)
    }
    if (
      result.range.start !== offset ||
      result.range.end !== end ||
      result.range.totalByteSize !== totalByteSize ||
      result.range.fullArtifactSha256 !==
        input.review.authority.masterSha256
    ) throw new Error(
      'Private playback range lost exact artifact or byte continuity.',
    )
    await appendSourceBuffer(input.sourceBuffer, result.range.bytes)
    offset = end + 1
    rangeRequestCount += 1
    input.onRangeAppended(offset, rangeRequestCount)
  }
  if (input.disposed()) return
  await waitForSourceBufferIdle(input.sourceBuffer)
  if (input.mediaSource.readyState === 'open') input.mediaSource.endOfStream()
}

async function waitForBufferCapacity(input: {
  sourceBuffer: SourceBufferLike
  mediaElement: MediaElementLike
  disposed: () => boolean
}): Promise<void> {
  while (
    !input.disposed() &&
    bufferedAheadSeconds(
      input.sourceBuffer.buffered,
      input.mediaElement.currentTime,
    ) > MAXIMUM_BUFFER_AHEAD_SECONDS
  ) {
    await waitForAnyEvent(
      input.mediaElement,
      ['timeupdate', 'seeking', 'playing'],
      1_000,
    )
    await evictOldBuffer(input.sourceBuffer, input.mediaElement.currentTime)
  }
}

async function evictOldBuffer(
  sourceBuffer: SourceBufferLike,
  currentTime: number,
): Promise<void> {
  if (
    !Number.isFinite(currentTime) ||
    currentTime <= RETAIN_BUFFER_BEHIND_SECONDS ||
    sourceBuffer.buffered.length === 0
  ) return
  const start = sourceBuffer.buffered.start(0)
  const removalEnd = currentTime - RETAIN_BUFFER_BEHIND_SECONDS
  if (removalEnd <= start) return
  await waitForSourceBufferIdle(sourceBuffer)
  sourceBuffer.remove(start, removalEnd)
  await waitForSourceBufferIdle(sourceBuffer)
}

function bufferedAheadSeconds(
  buffered: TimeRangesLike,
  currentTime: number,
): number {
  let furthestEnd = currentTime
  for (let index = 0; index < buffered.length; index += 1) {
    if (buffered.end(index) > furthestEnd) {
      furthestEnd = buffered.end(index)
    }
  }
  return Math.max(0, furthestEnd - currentTime)
}

async function appendSourceBuffer(
  sourceBuffer: SourceBufferLike,
  bytes: Uint8Array,
): Promise<void> {
  await waitForSourceBufferIdle(sourceBuffer)
  const copy = bytes.slice().buffer
  const update = waitForEvent(
    sourceBuffer,
    'updateend',
    SOURCE_BUFFER_OPERATION_TIMEOUT_MS,
  )
  sourceBuffer.appendBuffer(copy)
  await update
}

async function waitForSourceBufferIdle(
  sourceBuffer: SourceBufferLike,
): Promise<void> {
  if (!sourceBuffer.updating) return
  await waitForEvent(
    sourceBuffer,
    'updateend',
    SOURCE_BUFFER_OPERATION_TIMEOUT_MS,
  )
}

function bindPlaybackCoverage(input: {
  mediaElement: MediaElementLike
  coverage: ReturnType<
    typeof createProfessionalLongFormCustomerDeliveryCoverageTracker
  >
  now: () => number
}): () => void {
  let seeking = false
  const begin = () => input.coverage.begin(
    input.mediaElement.currentTime,
    input.mediaElement.playbackRate,
    input.now(),
  )
  const advance = () => {
    if (seeking || input.mediaElement.paused) return
    input.coverage.advance(
      input.mediaElement.currentTime,
      input.mediaElement.playbackRate,
      input.now(),
    )
  }
  const pause = () => {
    if (!seeking) input.coverage.advance(
      input.mediaElement.currentTime,
      input.mediaElement.playbackRate,
      input.now(),
    )
    input.coverage.interrupt()
  }
  const startSeeking = () => {
    seeking = true
    input.coverage.interrupt()
  }
  const finishSeeking = () => {
    seeking = false
    if (!input.mediaElement.paused) begin()
  }
  const ended = () => {
    seeking = false
    input.coverage.advance(
      input.mediaElement.currentTime,
      input.mediaElement.playbackRate,
      input.now(),
    )
    input.coverage.interrupt()
  }
  const rateChange = () => {
    input.coverage.interrupt()
    if (!input.mediaElement.paused && !seeking) begin()
  }
  const listeners: Array<[string, EventListener]> = [
    ['playing', begin],
    ['timeupdate', advance],
    ['pause', pause],
    ['seeking', startSeeking],
    ['seeked', finishSeeking],
    ['ended', ended],
    ['ratechange', rateChange],
  ]
  for (const [name, listener] of listeners) {
    input.mediaElement.addEventListener(name, listener)
  }
  return () => {
    for (const [name, listener] of listeners) {
      input.mediaElement.removeEventListener(name, listener)
    }
  }
}

function defaultMediaSourceRuntime(): MediaSourceRuntime | undefined {
  if (
    typeof globalThis.MediaSource !== 'function' ||
    typeof globalThis.URL?.createObjectURL !== 'function' ||
    typeof globalThis.URL?.revokeObjectURL !== 'function'
  ) return undefined
  return {
    createMediaSource: () => new globalThis.MediaSource() as MediaSourceLike,
    createObjectUrl: (source) => globalThis.URL.createObjectURL(
      source as unknown as MediaSource,
    ),
    revokeObjectUrl: (url) => globalThis.URL.revokeObjectURL(url),
    isTypeSupported: (mimeType) =>
      globalThis.MediaSource.isTypeSupported(mimeType),
    now: () => globalThis.performance?.now() ?? Date.now(),
  }
}

function reviewMatchesAuthority(
  review: ProfessionalLongFormCustomerDeliveryBrowserReview,
  authority: ProfessionalLongFormCustomerDeliveryClientInput,
): boolean {
  return review.identity.workspaceId === authority.scope.workspaceId &&
    review.identity.projectId === authority.projectId &&
    review.identity.editSessionId === authority.editSessionId &&
    review.identity.approvedPlanSnapshotId ===
      authority.approvedPlanSnapshotId &&
    review.identity.packageRecordId === authority.packageRecordId
}

function validPlaybackSample(
  mediaTimeSeconds: number,
  playbackRate: number,
  observedAtMs: number,
): boolean {
  return Number.isFinite(mediaTimeSeconds) && mediaTimeSeconds >= 0 &&
    Number.isFinite(observedAtMs) && observedAtMs >= 0 &&
    Number.isFinite(playbackRate) &&
    playbackRate >= PLAYBACK_RATE_MINIMUM &&
    playbackRate <= PLAYBACK_RATE_MAXIMUM
}

function frameAt(
  mediaTimeSeconds: number,
  framesPerSecond: number,
  totalFrameCount: number,
): number {
  return Math.min(
    totalFrameCount,
    Math.max(0, Math.floor(mediaTimeSeconds * framesPerSecond)),
  )
}

function normalizeEdgeFrame(frame: number, totalFrameCount: number): number {
  if (frame <= 1) return 0
  if (frame >= totalFrameCount - 1) return totalFrameCount
  return frame
}

function addCoverageInterval(
  intervals: Array<{ startFrame: number; endFrameExclusive: number }>,
  startFrame: number,
  endFrameExclusive: number,
): void {
  if (endFrameExclusive <= startFrame) return
  const next = { startFrame, endFrameExclusive }
  const merged: typeof intervals = []
  let inserted = false
  for (const current of intervals) {
    if (current.endFrameExclusive < next.startFrame) {
      merged.push(current)
      continue
    }
    if (next.endFrameExclusive < current.startFrame) {
      if (!inserted) {
        merged.push({ ...next })
        inserted = true
      }
      merged.push(current)
      continue
    }
    next.startFrame = Math.min(next.startFrame, current.startFrame)
    next.endFrameExclusive = Math.max(
      next.endFrameExclusive,
      current.endFrameExclusive,
    )
  }
  if (!inserted) merged.push(next)
  intervals.splice(0, intervals.length, ...merged)
}

function attachFailure(
  status: 'blocked' | 'unsupported' | 'unavailable',
  message: string,
  retryable: boolean,
): ProfessionalLongFormCustomerDeliveryMediaSourceAttachResult {
  return { status, message, retryable, warnings: [] }
}

function waitForEvent(
  target: EventTarget,
  eventName: string,
  timeoutMs: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = globalThis.setTimeout(() => {
      cleanup()
      reject(new Error(`Private playback timed out waiting for ${eventName}.`))
    }, timeoutMs)
    const success = () => {
      cleanup()
      resolve()
    }
    const failure = () => {
      cleanup()
      reject(new Error(`Private playback ${eventName} operation failed.`))
    }
    const cleanup = () => {
      globalThis.clearTimeout(timeout)
      target.removeEventListener(eventName, success)
      target.removeEventListener('error', failure)
      target.removeEventListener('abort', failure)
    }
    target.addEventListener(eventName, success, { once: true })
    target.addEventListener('error', failure, { once: true })
    target.addEventListener('abort', failure, { once: true })
  })
}

function waitForAnyEvent(
  target: EventTarget,
  eventNames: string[],
  timeoutMs: number,
): Promise<void> {
  return new Promise((resolve) => {
    const finish = () => {
      cleanup()
      resolve()
    }
    const timeout = globalThis.setTimeout(finish, timeoutMs)
    const cleanup = () => {
      globalThis.clearTimeout(timeout)
      for (const eventName of eventNames) {
        target.removeEventListener(eventName, finish)
      }
    }
    for (const eventName of eventNames) {
      target.addEventListener(eventName, finish, { once: true })
    }
  })
}
