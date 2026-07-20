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
import {
  createProfessionalLongFormCustomerDeliveryMp4FragmentIndex,
  type ProfessionalLongFormCustomerDeliveryMp4FragmentIndexProgress,
  type ProfessionalLongFormCustomerDeliveryMp4RecoveryWindow,
} from './professional-long-form-customer-delivery-mp4-fragment-index'

export const PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_MEDIA_SOURCE_VERSION =
  'professional-long-form-customer-delivery-media-source-v2' as const
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
  fragmentIndexCount: number
  fragmentIndexComplete: boolean
  backwardSeekRecovery: {
    status: 'indexing' | 'ready' | 'recovering' | 'recovered' | 'failed'
    ready: boolean
    recoveryCount: number
    recoveredRangeRequestCount: number
    lastTargetTimeSeconds: number | null
    lastWindow: {
      byteStart: number
      byteEndExclusive: number
      firstFragmentOrdinal: number
      lastFragmentOrdinal: number
      targetFragmentOrdinal: number
    } | null
    failureMessage?: string
  }
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

type SourceBufferOperationRunner = <Result>(
  operation: () => Promise<Result>,
) => Promise<Result>

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
  let rangeRequestCount = 0
  let state: ProfessionalLongFormCustomerDeliveryMediaSourceState = {
    schemaVersion:
      PROFESSIONAL_LONG_FORM_CUSTOMER_DELIVERY_MEDIA_SOURCE_VERSION,
    status: 'buffering',
    bytesAppended: 0,
    totalByteSize: review.data.authority.masterByteSize,
    rangeRequestCount: 0,
    fullyAppended: false,
    fragmentIndexCount: 0,
    fragmentIndexComplete: false,
    backwardSeekRecovery: {
      status: 'indexing',
      ready: false,
      recoveryCount: 0,
      recoveredRangeRequestCount: 0,
      lastTargetTimeSeconds: null,
      lastWindow: null,
    },
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
  const fragmentIndex =
    createProfessionalLongFormCustomerDeliveryMp4FragmentIndex()
  const sourceBufferOperations = createSerializedSourceBufferOperations()
  const readRange = async (start: number, end: number) => {
    const bytes = await readExactAuthenticatedRange({
      authority: input.authority,
      review: review.data,
      rangeReader,
      start,
      end,
    })
    rangeRequestCount += 1
    return bytes
  }
  const publishRecovery = (
    patch: Partial<
      ProfessionalLongFormCustomerDeliveryMediaSourceState[
        'backwardSeekRecovery'
      ]
    >,
  ) => publish({
    rangeRequestCount,
    backwardSeekRecovery: {
      ...state.backwardSeekRecovery,
      ...patch,
    },
  })
  const unbindBufferLifecycle = bindPlaybackBufferLifecycle({
    mediaElement: input.mediaElement,
    mediaSource,
    sourceBuffer,
    rangeByteSize,
    readRange,
    runSourceBufferOperation: sourceBufferOperations.run,
    resolveRecoveryWindow: fragmentIndex.resolveRecoveryWindow,
    disposed: () => disposed,
    fullyAppended: () => state.fullyAppended,
    recoveryReady: () => state.backwardSeekRecovery.ready,
    onRecoveryStarted: (targetTimeSeconds, window) => publishRecovery({
      status: 'recovering',
      lastTargetTimeSeconds: targetTimeSeconds,
      lastWindow: recoveryWindowState(window),
      failureMessage: undefined,
    }),
    onRecoveryRangeAppended: () => publishRecovery({
      recoveredRangeRequestCount:
        state.backwardSeekRecovery.recoveredRangeRequestCount + 1,
    }),
    onRecoveryCompleted: () => publishRecovery({
      status: 'recovered',
      ready: true,
      recoveryCount: state.backwardSeekRecovery.recoveryCount + 1,
      failureMessage: undefined,
    }),
    onRecoveryFailed: (targetTimeSeconds, error) => publishRecovery({
      status: 'failed',
      lastTargetTimeSeconds: targetTimeSeconds,
      failureMessage: error instanceof Error
        ? error.message
        : 'Private backward-seek recovery failed.',
    }),
    onMaintenanceFailed: (error) => publish({
      status: 'failed',
      failureMessage: error instanceof Error
        ? error.message
        : 'Private playback rolling-buffer maintenance failed.',
    }),
  })

  const completion = pumpAuthenticatedRanges({
    mediaElement: input.mediaElement,
    mediaSource,
    sourceBuffer,
    rangeByteSize,
    totalByteSize: review.data.authority.masterByteSize,
    totalDurationSeconds:
      (review.data.authority.masterFrameCount *
        review.data.authority.frameRateDenominator) /
      review.data.authority.frameRateNumerator,
    fragmentIndex,
    readRange,
    runSourceBufferOperation: sourceBufferOperations.run,
    disposed: () => disposed,
    onRangeAppended: (bytesAppended, progress) => {
      const recoveryReady = progress.fragmentCount > 1
      publish({
        status: 'streaming',
        bytesAppended,
        rangeRequestCount,
        fragmentIndexCount: progress.fragmentCount,
        backwardSeekRecovery: {
          ...state.backwardSeekRecovery,
          status:
            state.backwardSeekRecovery.status === 'indexing' && recoveryReady
              ? 'ready'
              : state.backwardSeekRecovery.status,
          ready: state.backwardSeekRecovery.ready || recoveryReady,
        },
      })
    },
  }).then((indexSnapshot) => {
    if (disposed || state.status === 'failed') return state
    publish({
      status: 'stream_complete',
      bytesAppended: review.data.authority.masterByteSize,
      rangeRequestCount,
      fullyAppended: true,
      fragmentIndexCount: indexSnapshot.fragmentCount,
      fragmentIndexComplete: true,
      backwardSeekRecovery: {
        ...state.backwardSeekRecovery,
        status: state.backwardSeekRecovery.status === 'indexing'
          ? 'ready'
          : state.backwardSeekRecovery.status,
        ready: true,
      },
    })
    return state
  }).catch((error: unknown) => {
    if (disposed) return state
    publish({
      status: 'failed',
      rangeRequestCount,
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
    unbindBufferLifecycle()
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
  mediaElement: MediaElementLike
  mediaSource: MediaSourceLike
  sourceBuffer: SourceBufferLike
  rangeByteSize: number
  totalByteSize: number
  totalDurationSeconds: number
  fragmentIndex: ReturnType<
    typeof createProfessionalLongFormCustomerDeliveryMp4FragmentIndex
  >
  readRange: (start: number, end: number) => Promise<Uint8Array>
  runSourceBufferOperation: SourceBufferOperationRunner
  disposed: () => boolean
  onRangeAppended: (
    bytesAppended: number,
    progress: ProfessionalLongFormCustomerDeliveryMp4FragmentIndexProgress,
  ) => void
}) {
  const totalByteSize = input.totalByteSize
  let offset = 0
  while (offset < totalByteSize && !input.disposed()) {
    await input.runSourceBufferOperation(() => evictOldBuffer(
      input.sourceBuffer,
      input.mediaElement.currentTime,
    ))
    await waitForBufferCapacity({
      sourceBuffer: input.sourceBuffer,
      mediaElement: input.mediaElement,
      disposed: input.disposed,
      runSourceBufferOperation: input.runSourceBufferOperation,
    })
    if (input.disposed()) return input.fragmentIndex.snapshot()
    const end = Math.min(
      totalByteSize - 1,
      offset + input.rangeByteSize - 1,
    )
    const bytes = await input.readRange(offset, end)
    const progress = input.fragmentIndex.push({ start: offset, bytes })
    await input.runSourceBufferOperation(() => appendSourceBuffer(
      input.sourceBuffer,
      bytes,
    ))
    offset = end + 1
    input.onRangeAppended(offset, progress)
  }
  if (input.disposed()) return input.fragmentIndex.snapshot()
  const snapshot = input.fragmentIndex.finish({
    totalByteSize,
    totalDurationSeconds: input.totalDurationSeconds,
  })
  await input.runSourceBufferOperation(async () => {
    await waitForSourceBufferIdle(input.sourceBuffer)
    if (input.mediaSource.readyState === 'open') input.mediaSource.endOfStream()
  })
  return snapshot
}

async function waitForBufferCapacity(input: {
  sourceBuffer: SourceBufferLike
  mediaElement: MediaElementLike
  disposed: () => boolean
  runSourceBufferOperation: SourceBufferOperationRunner
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
    await input.runSourceBufferOperation(() => evictOldBuffer(
      input.sourceBuffer,
      input.mediaElement.currentTime,
    ))
  }
}

async function readExactAuthenticatedRange(input: {
  authority: ProfessionalLongFormCustomerDeliveryClientInput
  review: ProfessionalLongFormCustomerDeliveryBrowserReview
  rangeReader: ReviewRangeReader
  start: number
  end: number
}): Promise<Uint8Array> {
  const result = await input.rangeReader({
    authority: input.authority,
    review: input.review,
    start: input.start,
    end: input.end,
  })
  if (result.status !== 'ready') throw new Error(result.message)
  if (
    result.range.start !== input.start ||
    result.range.end !== input.end ||
    result.range.totalByteSize !== input.review.authority.masterByteSize ||
    result.range.fullArtifactSha256 !==
      input.review.authority.masterSha256 ||
    result.range.mimeType !== 'video/mp4' ||
    result.range.bytes.byteLength !== input.end - input.start + 1
  ) throw new Error(
    'Private playback range lost exact artifact or byte continuity.',
  )
  return result.range.bytes
}

function createSerializedSourceBufferOperations(): {
  run: SourceBufferOperationRunner
} {
  let tail = Promise.resolve()
  const run: SourceBufferOperationRunner = <Result>(
    operation: () => Promise<Result>,
  ) => {
    const result = tail.then(operation, operation)
    tail = result.then(() => undefined, () => undefined)
    return result
  }
  return { run }
}

function bindPlaybackBufferLifecycle(input: {
  mediaElement: MediaElementLike
  mediaSource: MediaSourceLike
  sourceBuffer: SourceBufferLike
  rangeByteSize: number
  readRange: (start: number, end: number) => Promise<Uint8Array>
  runSourceBufferOperation: SourceBufferOperationRunner
  resolveRecoveryWindow: (
    targetTimeSeconds: number,
  ) => ProfessionalLongFormCustomerDeliveryMp4RecoveryWindow | undefined
  disposed: () => boolean
  fullyAppended: () => boolean
  recoveryReady: () => boolean
  onRecoveryStarted: (
    targetTimeSeconds: number,
    window: ProfessionalLongFormCustomerDeliveryMp4RecoveryWindow,
  ) => void
  onRecoveryRangeAppended: () => void
  onRecoveryCompleted: () => void
  onRecoveryFailed: (targetTimeSeconds: number, error: unknown) => void
  onMaintenanceFailed: (error: unknown) => void
}): () => void {
  let unbound = false
  let maintenanceQueued = false
  let maintenanceFailed = false
  let recoveryRunning = false
  let pendingRecoveryTarget: number | undefined
  let furthestObservedTimeSeconds = validMediaTime(
      input.mediaElement.currentTime,
    )
    ? input.mediaElement.currentTime
    : 0

  const observePosition = () => {
    if (validMediaTime(input.mediaElement.currentTime)) {
      furthestObservedTimeSeconds = Math.max(
        furthestObservedTimeSeconds,
        input.mediaElement.currentTime,
      )
    }
  }
  const scheduleMaintenance = () => {
    if (
      unbound ||
      input.disposed() ||
      maintenanceQueued ||
      maintenanceFailed
    ) return
    maintenanceQueued = true
    void input.runSourceBufferOperation(async () => {
      await evictOldBuffer(
        input.sourceBuffer,
        input.mediaElement.currentTime,
      )
      if (
        input.fullyAppended() &&
        input.mediaSource.readyState === 'open'
      ) input.mediaSource.endOfStream()
    }).catch((error: unknown) => {
      maintenanceFailed = true
      if (!unbound && !input.disposed()) input.onMaintenanceFailed(error)
    }).finally(() => {
      maintenanceQueued = false
    })
  }
  const progress = () => {
    observePosition()
    scheduleMaintenance()
  }
  const startRecovery = () => {
    const targetTimeSeconds = input.mediaElement.currentTime
    if (
      unbound ||
      input.disposed() ||
      !validMediaTime(targetTimeSeconds) ||
      targetTimeSeconds + 0.05 >= furthestObservedTimeSeconds ||
      bufferedContainsTime(input.sourceBuffer.buffered, targetTimeSeconds)
    ) return
    pendingRecoveryTarget = targetTimeSeconds
    void drainRecoveryRequests()
  }
  const drainRecoveryRequests = async () => {
    if (recoveryRunning || unbound || input.disposed()) return
    recoveryRunning = true
    try {
      while (
        pendingRecoveryTarget !== undefined &&
        !unbound &&
        !input.disposed()
      ) {
        const targetTimeSeconds = pendingRecoveryTarget
        pendingRecoveryTarget = undefined
        if (
          bufferedContainsTime(input.sourceBuffer.buffered, targetTimeSeconds) ||
          !input.recoveryReady()
        ) continue
        const window = input.resolveRecoveryWindow(targetTimeSeconds)
        if (!window) {
          input.onRecoveryFailed(
            targetTimeSeconds,
            new Error(
              'Private backward-seek recovery lacks an exact indexed fragment window.',
            ),
          )
          continue
        }
        input.onRecoveryStarted(targetTimeSeconds, window)
        try {
          let offset = window.byteStart
          while (offset < window.byteEndExclusive) {
            const end = Math.min(
              window.byteEndExclusive - 1,
              offset + input.rangeByteSize - 1,
            )
            const bytes = await input.readRange(offset, end)
            if (unbound || input.disposed()) break
            await input.runSourceBufferOperation(() => appendSourceBuffer(
              input.sourceBuffer,
              bytes,
            ))
            input.onRecoveryRangeAppended()
            offset = end + 1
          }
          if (unbound || input.disposed()) continue
          await input.runSourceBufferOperation(async () => {
            await waitForSourceBufferIdle(input.sourceBuffer)
            if (
              input.fullyAppended() &&
              input.mediaSource.readyState === 'open'
            ) input.mediaSource.endOfStream()
          })
          if (!bufferedContainsTime(
            input.sourceBuffer.buffered,
            targetTimeSeconds,
          )) throw new Error(
            'Private backward-seek recovery did not restore the exact requested media time.',
          )
          input.onRecoveryCompleted()
        } catch (error: unknown) {
          if (!unbound && !input.disposed()) {
            input.onRecoveryFailed(targetTimeSeconds, error)
          }
        }
      }
    } finally {
      recoveryRunning = false
      if (
        pendingRecoveryTarget !== undefined &&
        !unbound &&
        !input.disposed()
      ) void drainRecoveryRequests()
    }
  }
  const listeners: Array<[string, EventListener]> = [
    ['playing', progress],
    ['timeupdate', progress],
    ['pause', progress],
    ['seeked', progress],
    ['ended', progress],
    ['seeking', startRecovery],
  ]
  for (const [name, listener] of listeners) {
    input.mediaElement.addEventListener(name, listener)
  }
  return () => {
    unbound = true
    pendingRecoveryTarget = undefined
    for (const [name, listener] of listeners) {
      input.mediaElement.removeEventListener(name, listener)
    }
  }
}

function recoveryWindowState(
  window: ProfessionalLongFormCustomerDeliveryMp4RecoveryWindow,
): ProfessionalLongFormCustomerDeliveryMediaSourceState[
  'backwardSeekRecovery'
]['lastWindow'] {
  return {
    byteStart: window.byteStart,
    byteEndExclusive: window.byteEndExclusive,
    firstFragmentOrdinal: window.firstFragmentOrdinal,
    lastFragmentOrdinal: window.lastFragmentOrdinal,
    targetFragmentOrdinal: window.targetFragmentOrdinal,
  }
}

function bufferedContainsTime(
  buffered: TimeRangesLike,
  targetTimeSeconds: number,
): boolean {
  if (!validMediaTime(targetTimeSeconds)) return false
  for (let index = 0; index < buffered.length; index += 1) {
    if (
      targetTimeSeconds >= buffered.start(index) - 0.05 &&
      targetTimeSeconds <= buffered.end(index) + 0.05
    ) return true
  }
  return false
}

function validMediaTime(value: number): boolean {
  return Number.isFinite(value) && value >= 0
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
  await runSourceBufferMutation(
    sourceBuffer,
    () => sourceBuffer.remove(start, removalEnd),
  )
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
  const exactCopy = new Uint8Array(bytes.byteLength)
  exactCopy.set(bytes)
  await runSourceBufferMutation(
    sourceBuffer,
    () => sourceBuffer.appendBuffer(exactCopy.buffer),
  )
}

async function runSourceBufferMutation(
  sourceBuffer: SourceBufferLike,
  mutate: () => void,
): Promise<void> {
  await waitForSourceBufferIdle(sourceBuffer)
  await new Promise<void>((resolve, reject) => {
    const timeout = globalThis.setTimeout(() => {
      cleanup()
      reject(new Error('Private playback source-buffer mutation timed out.'))
    }, SOURCE_BUFFER_OPERATION_TIMEOUT_MS)
    const success = () => {
      cleanup()
      resolve()
    }
    const failure = () => {
      cleanup()
      reject(new Error('Private playback source-buffer mutation failed.'))
    }
    const cleanup = () => {
      globalThis.clearTimeout(timeout)
      sourceBuffer.removeEventListener('updateend', success)
      sourceBuffer.removeEventListener('error', failure)
      sourceBuffer.removeEventListener('abort', failure)
    }
    sourceBuffer.addEventListener('updateend', success, { once: true })
    sourceBuffer.addEventListener('error', failure, { once: true })
    sourceBuffer.addEventListener('abort', failure, { once: true })
    try {
      mutate()
    } catch (error: unknown) {
      cleanup()
      reject(error)
    }
  })
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
