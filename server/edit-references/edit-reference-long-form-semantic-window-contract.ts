import { createHash } from 'node:crypto'
import type {
  EditReferenceLongFormStudyChunkPlan,
  EditReferenceLongFormStudyPlan,
} from './edit-reference-long-form-study-contract'
import {
  validateEditReferenceLongFormSpecialistStageResult,
  type EditReferenceLongFormSpeechTranscriptResult,
  type EditReferenceLongFormSpeechTranscriptSegmentTimingRange,
} from './edit-reference-long-form-specialist-stage-contract'
import {
  validateEditReferenceLongFormStudyWorkOutput,
  type EditReferenceLongFormStudyWorkOutput,
} from './edit-reference-long-form-study-work-output'

export const EDIT_REFERENCE_LONG_FORM_SEMANTIC_WINDOW_PLAN_VERSION =
  'edit-reference-long-form-semantic-window-plan-v3' as const
export const EDIT_REFERENCE_LONG_FORM_SEMANTIC_WINDOW_MAX_SECONDS = 120 as const
// Visual Language needs a representative frame plus a keyframe. The existing
// Graphics/Motion specialist additionally requires a second motion context
// frame. Three exact samples per provider-local window is therefore the real
// shared floor for running all seven specialists without duplicating a frame
// identity or inventing motion evidence.
export const EDIT_REFERENCE_LONG_FORM_SEMANTIC_WINDOW_MINIMUM_FRAME_COUNT = 3 as const

export interface EditReferenceLongFormSemanticWindowFrame {
  readonly frameEvidenceId: string
  readonly sourceTimeSeconds: number
  readonly providerLocalTimeSeconds: number
  readonly frameChecksumSha256: string
  readonly role: 'representative' | 'keyframe_candidate'
  readonly roleBasis: 'uniform_section_coverage' | 'technical_change_point' | 'single_scene_context'
}

export interface EditReferenceLongFormSemanticWindow {
  readonly semanticWindowId: string
  readonly ordinal: number
  readonly coreStartSeconds: number
  readonly coreEndSeconds: number
  readonly durationSeconds: number
  readonly maximumProviderWindowSeconds: typeof EDIT_REFERENCE_LONG_FORM_SEMANTIC_WINDOW_MAX_SECONDS
  readonly frames: readonly EditReferenceLongFormSemanticWindowFrame[]
  readonly representativeFrameCount: number
  readonly keyframeCandidateCount: number
  readonly minimumFrameCountSatisfied: true
  readonly speechEvidenceState: 'unknown' | 'speech_present' | 'speech_absent'
  readonly speechSegmentCount: number | null
  readonly speechWordCount: number | null
}

export interface EditReferenceLongFormSemanticWindowPlan {
  readonly schemaVersion: typeof EDIT_REFERENCE_LONG_FORM_SEMANTIC_WINDOW_PLAN_VERSION
  readonly planId: string
  readonly planDigestSha256: string
  readonly chunkId: string
  readonly sourceCoverageStartSeconds: number
  readonly sourceCoverageEndSeconds: number
  readonly visualSamplingOutputDigestSha256: string
  readonly sceneBoundaryOutputDigestSha256: string
  readonly speechTranscriptOutputDigestSha256: string | null
  readonly speechWindowAlignment: 'not_available' | 'speech_absent' | 'exact_segment_boundaries'
  readonly speechSegmentTimingRanges: readonly EditReferenceLongFormSpeechTranscriptSegmentTimingRange[]
  readonly speechSegmentCount: number | null
  readonly speechWordCount: number | null
  readonly allSpeechSegmentsAssignedExactlyOnce: true | null
  readonly windows: readonly EditReferenceLongFormSemanticWindow[]
  readonly completeChunkCoverage: true
  readonly everyWindowHasRepresentativeAndKeyframeCandidate: true
  readonly allVisualSamplesAssignedExactlyOnce: true
  readonly providerWindowLimitCannotBecomeWholeVideoLimit: true
  readonly rawTranscriptPersisted: false
  readonly rawMediaPersisted: false
  readonly localFilePathPersisted: false
  readonly providerCallMade: false
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
  readonly semanticWindowPlanDigestSha256: string
}

const SHA256_PATTERN = /^[a-f0-9]{64}$/
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/

export function createEditReferenceLongFormSemanticWindowPlan(input: {
  readonly plan: EditReferenceLongFormStudyPlan
  readonly chunkId: string
  readonly visualSamplingOutput: EditReferenceLongFormStudyWorkOutput
  readonly sceneBoundaryOutput: EditReferenceLongFormStudyWorkOutput
  readonly speechTranscriptOutput?: EditReferenceLongFormStudyWorkOutput
}): EditReferenceLongFormSemanticWindowPlan {
  const chunk = requireChunk(input.plan, input.chunkId)
  const visual = input.visualSamplingOutput
  const scene = input.sceneBoundaryOutput
  const visualResult = visual.result
  const sceneResult = scene.result
  if (
    visual.stageId !== 'visual_sampling'
    || visualResult.kind !== 'visual_sampling'
    || scene.stageId !== 'scene_boundary_scan'
    || sceneResult.kind !== 'scene_boundary_scan'
    || visual.planId !== input.plan.planId
    || scene.planId !== input.plan.planId
    || visual.planDigestSha256 !== input.plan.planDigestSha256
    || scene.planDigestSha256 !== input.plan.planDigestSha256
    || visual.chunkId !== chunk.chunkId
    || scene.chunkId !== chunk.chunkId
    || visual.sourceCoverageStartSeconds !== chunk.coreStartSeconds
    || visual.sourceCoverageEndSeconds !== chunk.coreEndSeconds
    || scene.sourceCoverageStartSeconds !== chunk.coreStartSeconds
    || scene.sourceCoverageEndSeconds !== chunk.coreEndSeconds
  ) throw new Error('Long-form semantic windows require exact visual and scene outputs for one plan section.')
  const samples = bindVisualSamples(visual, chunk)
  const speech = bindSpeechTimingAuthority(input.plan, chunk, input.speechTranscriptOutput)
  const windowBounds = buildWindowBounds(chunk, samples, speech)
  const windows = windowBounds.map((bounds, index) => {
    const frames = samples.filter((sample) => (
      sample.sourceTimeSeconds >= bounds.start
      && (index === windowBounds.length - 1
        ? sample.sourceTimeSeconds <= bounds.end
        : sample.sourceTimeSeconds < bounds.end)
    ))
    if (frames.length < EDIT_REFERENCE_LONG_FORM_SEMANTIC_WINDOW_MINIMUM_FRAME_COUNT) {
      throw new Error('A long-form semantic window lacks the minimum bounded visual evidence.')
    }
    const keyframeIndex = selectKeyframeCandidateIndex(
      frames.map((frame) => frame.sourceTimeSeconds),
      sceneResult.boundaryTimesSeconds.filter((time) => time >= bounds.start && time <= bounds.end),
    )
    const semanticWindowId = stableId('edit-reference-semantic-window', {
      planId: input.plan.planId,
      chunkId: chunk.chunkId,
      ordinal: index + 1,
      coreStartSeconds: bounds.start,
      coreEndSeconds: bounds.end,
    })
    const mappedFrames = frames.map((frame, frameIndex): EditReferenceLongFormSemanticWindowFrame => {
      const keyframe = frameIndex === keyframeIndex
      const nearBoundary = sceneResult.boundaryTimesSeconds.some((time) => (
        Math.abs(time - frame.sourceTimeSeconds) <= 1
      ))
      return {
        frameEvidenceId: stableId('edit-reference-semantic-frame', {
          semanticWindowId,
          sourceTimeSeconds: frame.sourceTimeSeconds,
          frameChecksumSha256: frame.frameChecksumSha256,
        }),
        sourceTimeSeconds: frame.sourceTimeSeconds,
        providerLocalTimeSeconds: rounded(frame.sourceTimeSeconds - bounds.start),
        frameChecksumSha256: frame.frameChecksumSha256,
        role: keyframe ? 'keyframe_candidate' : 'representative',
        roleBasis: keyframe
          ? nearBoundary ? 'technical_change_point' : 'single_scene_context'
          : 'uniform_section_coverage',
      }
    })
    const representativeFrameCount = mappedFrames.filter((frame) => frame.role === 'representative').length
    const keyframeCandidateCount = mappedFrames.filter((frame) => frame.role === 'keyframe_candidate').length
    if (representativeFrameCount < 1 || keyframeCandidateCount !== 1) {
      throw new Error('Every semantic window requires representative and keyframe-candidate evidence.')
    }
    const speechWindow = describeWindowSpeech(bounds, speech)
    return {
      semanticWindowId,
      ordinal: index + 1,
      coreStartSeconds: bounds.start,
      coreEndSeconds: bounds.end,
      durationSeconds: rounded(bounds.end - bounds.start),
      maximumProviderWindowSeconds: EDIT_REFERENCE_LONG_FORM_SEMANTIC_WINDOW_MAX_SECONDS,
      frames: mappedFrames,
      representativeFrameCount,
      keyframeCandidateCount,
      minimumFrameCountSatisfied: true as const,
      ...speechWindow,
    }
  })
  const unsigned = {
    schemaVersion: EDIT_REFERENCE_LONG_FORM_SEMANTIC_WINDOW_PLAN_VERSION,
    planId: input.plan.planId,
    planDigestSha256: input.plan.planDigestSha256,
    chunkId: chunk.chunkId,
    sourceCoverageStartSeconds: chunk.coreStartSeconds,
    sourceCoverageEndSeconds: chunk.coreEndSeconds,
    visualSamplingOutputDigestSha256: visual.outputDigestSha256,
    sceneBoundaryOutputDigestSha256: scene.outputDigestSha256,
    speechTranscriptOutputDigestSha256: speech.outputDigestSha256,
    speechWindowAlignment: speech.alignment,
    speechSegmentTimingRanges: speech.ranges,
    speechSegmentCount: speech.segmentCount,
    speechWordCount: speech.wordCount,
    allSpeechSegmentsAssignedExactlyOnce: speech.alignment === 'not_available' ? null : true as const,
    windows,
    completeChunkCoverage: true as const,
    everyWindowHasRepresentativeAndKeyframeCandidate: true as const,
    allVisualSamplesAssignedExactlyOnce: true as const,
    providerWindowLimitCannotBecomeWholeVideoLimit: true as const,
    rawTranscriptPersisted: false as const,
    rawMediaPersisted: false as const,
    localFilePathPersisted: false as const,
    providerCallMade: false as const,
    customerPriceCalculated: false as const,
    customerCreditsMutated: false as const,
  }
  const result: EditReferenceLongFormSemanticWindowPlan = {
    ...unsigned,
    semanticWindowPlanDigestSha256: sha256(stableJson(unsigned)),
  }
  validateEditReferenceLongFormSemanticWindowPlan(result)
  return result
}

export function validateEditReferenceLongFormSemanticWindowPlan(
  value: EditReferenceLongFormSemanticWindowPlan,
): void {
  if (
    value.schemaVersion !== EDIT_REFERENCE_LONG_FORM_SEMANTIC_WINDOW_PLAN_VERSION
    || !ID_PATTERN.test(value.planId)
    || !ID_PATTERN.test(value.chunkId)
    || !SHA256_PATTERN.test(value.planDigestSha256)
    || !SHA256_PATTERN.test(value.visualSamplingOutputDigestSha256)
    || !SHA256_PATTERN.test(value.sceneBoundaryOutputDigestSha256)
    || (value.speechTranscriptOutputDigestSha256 !== null
      && !SHA256_PATTERN.test(value.speechTranscriptOutputDigestSha256))
    || !['not_available', 'speech_absent', 'exact_segment_boundaries'].includes(value.speechWindowAlignment)
    || !SHA256_PATTERN.test(value.semanticWindowPlanDigestSha256)
    || value.windows.length < 1
    || value.windows.length > 8
    || value.completeChunkCoverage !== true
    || value.everyWindowHasRepresentativeAndKeyframeCandidate !== true
    || value.allVisualSamplesAssignedExactlyOnce !== true
    || value.providerWindowLimitCannotBecomeWholeVideoLimit !== true
    || value.rawTranscriptPersisted !== false
    || value.rawMediaPersisted !== false
    || value.localFilePathPersisted !== false
    || value.providerCallMade !== false
    || value.customerPriceCalculated !== false
    || value.customerCreditsMutated !== false
  ) throw new Error('Long-form semantic window plan identity or safety is invalid.')
  validatePlanSpeechAuthority(value)
  let nextStart = value.sourceCoverageStartSeconds
  const frameEvidenceIds = new Set<string>()
  const frameTimes = new Set<number>()
  for (const [index, window] of value.windows.entries()) {
    if (
      !ID_PATTERN.test(window.semanticWindowId)
      || window.ordinal !== index + 1
      || window.coreStartSeconds !== nextStart
      || window.coreEndSeconds <= window.coreStartSeconds
      || window.coreEndSeconds - window.coreStartSeconds > EDIT_REFERENCE_LONG_FORM_SEMANTIC_WINDOW_MAX_SECONDS + 0.001
      || window.durationSeconds !== rounded(window.coreEndSeconds - window.coreStartSeconds)
      || window.maximumProviderWindowSeconds !== EDIT_REFERENCE_LONG_FORM_SEMANTIC_WINDOW_MAX_SECONDS
      || window.frames.length < EDIT_REFERENCE_LONG_FORM_SEMANTIC_WINDOW_MINIMUM_FRAME_COUNT
      || window.representativeFrameCount !== window.frames.filter((frame) => frame.role === 'representative').length
      || window.keyframeCandidateCount !== 1
      || window.minimumFrameCountSatisfied !== true
      || !['unknown', 'speech_present', 'speech_absent'].includes(window.speechEvidenceState)
    ) throw new Error('Long-form semantic window coverage or frame floor is invalid.')
    for (const frame of window.frames) {
      if (
        !ID_PATTERN.test(frame.frameEvidenceId)
        || !SHA256_PATTERN.test(frame.frameChecksumSha256)
        || frame.sourceTimeSeconds < window.coreStartSeconds
        || frame.sourceTimeSeconds > window.coreEndSeconds
        || frame.providerLocalTimeSeconds !== rounded(frame.sourceTimeSeconds - window.coreStartSeconds)
        || frame.providerLocalTimeSeconds < 0
        || frame.providerLocalTimeSeconds > EDIT_REFERENCE_LONG_FORM_SEMANTIC_WINDOW_MAX_SECONDS
        || !['representative', 'keyframe_candidate'].includes(frame.role)
        || !['uniform_section_coverage', 'technical_change_point', 'single_scene_context'].includes(frame.roleBasis)
        || frameEvidenceIds.has(frame.frameEvidenceId)
        || frameTimes.has(frame.sourceTimeSeconds)
      ) throw new Error('Long-form semantic frame authority is invalid or duplicated.')
      frameEvidenceIds.add(frame.frameEvidenceId)
      frameTimes.add(frame.sourceTimeSeconds)
    }
    nextStart = window.coreEndSeconds
  }
  if (nextStart !== value.sourceCoverageEndSeconds) {
    throw new Error('Long-form semantic windows do not cover the complete section contiguously.')
  }
  validateWindowSpeechAssignments(value)
  const unsigned = { ...value } as Record<string, unknown>
  delete unsigned.semanticWindowPlanDigestSha256
  if (sha256(stableJson(unsigned)) !== value.semanticWindowPlanDigestSha256) {
    throw new Error('Long-form semantic window plan digest is invalid.')
  }
}

function requireChunk(
  plan: EditReferenceLongFormStudyPlan,
  chunkId: string,
): EditReferenceLongFormStudyChunkPlan {
  const chunk = plan.chunks.find((candidate) => candidate.chunkId === chunkId)
  if (!chunk) throw new Error('Long-form semantic windows refer to an unknown study section.')
  return chunk
}

function bindVisualSamples(
  output: EditReferenceLongFormStudyWorkOutput,
  chunk: EditReferenceLongFormStudyChunkPlan,
): Array<{ readonly sourceTimeSeconds: number; readonly frameChecksumSha256: string }> {
  if (output.result.kind !== 'visual_sampling') throw new Error('Long-form semantic frames require visual-sampling output.')
  const artifacts = output.artifacts.filter((artifact) => artifact.role === 'visual_sample')
  if (
    artifacts.length !== output.result.sampleTimesSeconds.length
    || output.result.sampleCount !== artifacts.length
    || output.result.sampleTimesSeconds.length < chunk.minimumVisualSampleCount
  ) throw new Error('Long-form visual samples do not satisfy the section sampling authority.')
  return output.result.sampleTimesSeconds.map((sourceTimeSeconds) => {
    const artifact = artifacts.find((candidate) => candidate.sourceTimeSeconds === sourceTimeSeconds)
    if (!artifact || !SHA256_PATTERN.test(artifact.checksumSha256)) {
      throw new Error('Long-form semantic frame lacks exact visual artifact identity.')
    }
    return { sourceTimeSeconds, frameChecksumSha256: artifact.checksumSha256 }
  })
}

interface BoundSpeechTimingAuthority {
  readonly alignment: EditReferenceLongFormSemanticWindowPlan['speechWindowAlignment']
  readonly outputDigestSha256: string | null
  readonly ranges: readonly EditReferenceLongFormSpeechTranscriptSegmentTimingRange[]
  readonly segmentCount: number | null
  readonly wordCount: number | null
}

function bindSpeechTimingAuthority(
  plan: EditReferenceLongFormStudyPlan,
  chunk: EditReferenceLongFormStudyChunkPlan,
  output: EditReferenceLongFormStudyWorkOutput | undefined,
): BoundSpeechTimingAuthority {
  const unavailable: BoundSpeechTimingAuthority = {
    alignment: 'not_available',
    outputDigestSha256: null,
    ranges: [],
    segmentCount: null,
    wordCount: null,
  }
  if (!output) return unavailable
  if (output.result.kind !== 'speech_transcript') {
    throw new Error('Long-form semantic-window speech timing refers to an unknown transcript work item.')
  }
  validateEditReferenceLongFormStudyWorkOutput(output)
  validateEditReferenceLongFormSpecialistStageResult({
    result: output.result as EditReferenceLongFormSpeechTranscriptResult,
    plan,
    chunkId: chunk.chunkId,
    sourceCoverageStartSeconds: output.sourceCoverageStartSeconds,
    sourceCoverageEndSeconds: output.sourceCoverageEndSeconds,
  })
  if (
    output.planId !== plan.planId
    || output.planDigestSha256 !== plan.planDigestSha256
    || output.chunkId !== chunk.chunkId
    || output.privateMediaArtifactId !== plan.source.privateMediaArtifactId
    || output.mediaChecksumSha256 !== plan.source.mediaChecksumSha256
  ) throw new Error('Long-form semantic-window speech timing is not bound to the exact plan and source section.')
  if (output.completionAuthority === 'controlled_mock' && output.runtimeSource === 'verified_mock') {
    return unavailable
  }
  if (
    output.completionAuthority !== 'authoritative'
    || !['verified_local', 'verified_live'].includes(output.runtimeSource)
    || output.providerCallMade !== false
    || output.remoteMutationMade !== false
    || output.originalRemainsImmutable !== true
    || output.rawProcessOutputPersisted !== false
    || output.result.fullCoreCoverage !== true
    || output.result.segmentTimingCoverageRatio !== 1
    || output.result.transcriptTextPersistedInWorkOutput !== false
    || output.result.rawAudioPersisted !== false
    || output.result.interpolatedWordTimingUsed !== false
    || output.sourceCoverageStartSeconds !== chunk.coreStartSeconds
    || output.sourceCoverageEndSeconds !== chunk.coreEndSeconds
  ) throw new Error('Long-form semantic-window speech timing lacks authoritative full-section provenance.')
  if (!output.result.speechPresent) {
    if (
      output.result.segmentCount !== 0
      || output.result.wordCount !== 0
      || output.result.segmentTimingRanges.length !== 0
      || output.result.wordTimingMode !== 'not_available'
    ) throw new Error('Long-form semantic-window speech-absence authority is contradictory.')
    return {
      alignment: 'speech_absent',
      outputDigestSha256: output.outputDigestSha256,
      ranges: [],
      segmentCount: 0,
      wordCount: 0,
    }
  }
  if (
    output.result.wordTimingMode !== 'exact'
    || output.result.segmentTimingRanges.length !== output.result.segmentCount
    || output.result.segmentTimingRanges.length < 1
  ) throw new Error('Long-form semantic windows require exact timing ranges for observed speech.')
  return {
    alignment: 'exact_segment_boundaries',
    outputDigestSha256: output.outputDigestSha256,
    ranges: output.result.segmentTimingRanges.map((range) => ({ ...range })),
    segmentCount: output.result.segmentCount,
    wordCount: output.result.wordCount,
  }
}

function buildWindowBounds(
  chunk: EditReferenceLongFormStudyChunkPlan,
  samples: readonly { readonly sourceTimeSeconds: number }[],
  speech: BoundSpeechTimingAuthority,
): Array<{ readonly start: number; readonly end: number }> {
  if (speech.alignment === 'exact_segment_boundaries') {
    return buildSpeechAlignedWindowBounds(chunk, samples, speech.ranges)
  }
  return buildFixedWindowBounds(chunk)
}

function buildFixedWindowBounds(
  chunk: EditReferenceLongFormStudyChunkPlan,
): Array<{ readonly start: number; readonly end: number }> {
  const bounds: Array<{ start: number; end: number }> = []
  for (
    let start = chunk.coreStartSeconds;
    start < chunk.coreEndSeconds;
    start = rounded(Math.min(chunk.coreEndSeconds, start + EDIT_REFERENCE_LONG_FORM_SEMANTIC_WINDOW_MAX_SECONDS))
  ) {
    const end = rounded(Math.min(chunk.coreEndSeconds, start + EDIT_REFERENCE_LONG_FORM_SEMANTIC_WINDOW_MAX_SECONDS))
    bounds.push({ start, end })
    if (end >= chunk.coreEndSeconds) break
  }
  return bounds
}

function buildSpeechAlignedWindowBounds(
  chunk: EditReferenceLongFormStudyChunkPlan,
  samples: readonly { readonly sourceTimeSeconds: number }[],
  ranges: readonly EditReferenceLongFormSpeechTranscriptSegmentTimingRange[],
): Array<{ readonly start: number; readonly end: number }> {
  if (ranges.some((range) => (
    range.sourceEndSeconds - range.sourceStartSeconds > EDIT_REFERENCE_LONG_FORM_SEMANTIC_WINDOW_MAX_SECONDS + 0.001
  ))) throw new Error('One exact transcript segment exceeds the bounded semantic-window duration.')

  const candidateValues = new Set<number>([chunk.coreStartSeconds, chunk.coreEndSeconds])
  for (
    let boundary = rounded(chunk.coreStartSeconds + 1);
    boundary < chunk.coreEndSeconds;
    boundary = rounded(boundary + 1)
  ) candidateValues.add(boundary)
  for (
    let boundary = rounded(chunk.coreStartSeconds + EDIT_REFERENCE_LONG_FORM_SEMANTIC_WINDOW_MAX_SECONDS);
    boundary < chunk.coreEndSeconds;
    boundary = rounded(boundary + EDIT_REFERENCE_LONG_FORM_SEMANTIC_WINDOW_MAX_SECONDS)
  ) candidateValues.add(boundary)
  for (const range of ranges) {
    candidateValues.add(range.sourceStartSeconds)
    candidateValues.add(range.sourceEndSeconds)
  }
  const orderedSamples = [...samples].sort((left, right) => left.sourceTimeSeconds - right.sourceTimeSeconds)
  for (let index = 1; index < orderedSamples.length; index += 1) {
    const left = orderedSamples[index - 1]?.sourceTimeSeconds
    const right = orderedSamples[index]?.sourceTimeSeconds
    if (left === undefined || right === undefined || right <= left) continue
    candidateValues.add(rounded(left + ((right - left) / 2)))
  }
  const candidates = [...candidateValues]
    .filter((candidate) => (
      candidate >= chunk.coreStartSeconds
      && candidate <= chunk.coreEndSeconds
      && !ranges.some((range) => (
        candidate > range.sourceStartSeconds
        && candidate < range.sourceEndSeconds
      ))
    ))
    .sort((left, right) => left - right)
  const startIndex = candidates.indexOf(chunk.coreStartSeconds)
  const memo = new Map<number, Array<{ readonly start: number; readonly end: number }> | null>()

  const solve = (candidateIndex: number): Array<{ readonly start: number; readonly end: number }> | null => {
    if (memo.has(candidateIndex)) return memo.get(candidateIndex) ?? null
    const start = candidates[candidateIndex]
    if (start === undefined) return null
    if (start === chunk.coreEndSeconds) return []
    const possibleEnds = candidates
      .map((end, index) => ({ end, index }))
      .filter(({ end }) => (
        end > start
        && end - start <= EDIT_REFERENCE_LONG_FORM_SEMANTIC_WINDOW_MAX_SECONDS + 0.001
      ))
      .sort((left, right) => right.end - left.end)
    let best: Array<{ readonly start: number; readonly end: number }> | null = null
    for (const candidate of possibleEnds) {
      const frameCount = orderedSamples.filter((sample) => (
        sample.sourceTimeSeconds >= start
        && (candidate.end === chunk.coreEndSeconds
          ? sample.sourceTimeSeconds <= candidate.end
          : sample.sourceTimeSeconds < candidate.end)
      )).length
      if (frameCount < EDIT_REFERENCE_LONG_FORM_SEMANTIC_WINDOW_MINIMUM_FRAME_COUNT) continue
      const remainder = solve(candidate.index)
      if (!remainder) continue
      const path = [{ start, end: candidate.end }, ...remainder]
      if (!best || path.length < best.length) best = path
    }
    memo.set(candidateIndex, best)
    return best
  }

  const result = startIndex < 0 ? null : solve(startIndex)
  if (!result || result.length > 8) {
    throw new Error('Exact speech segments cannot be partitioned into bounded semantic windows with sufficient visual evidence.')
  }
  return result
}

function describeWindowSpeech(
  bounds: { readonly start: number; readonly end: number },
  speech: BoundSpeechTimingAuthority,
): Pick<
  EditReferenceLongFormSemanticWindow,
  'speechEvidenceState' | 'speechSegmentCount' | 'speechWordCount'
> {
  if (speech.alignment === 'not_available') {
    return { speechEvidenceState: 'unknown', speechSegmentCount: null, speechWordCount: null }
  }
  const ranges = speech.ranges.filter((range) => (
    range.sourceStartSeconds >= bounds.start
    && range.sourceEndSeconds <= bounds.end
  ))
  const speechWordCount = ranges.reduce((sum, range) => sum + range.wordCount, 0)
  return {
    speechEvidenceState: ranges.length > 0 ? 'speech_present' : 'speech_absent',
    speechSegmentCount: ranges.length,
    speechWordCount,
  }
}

function validatePlanSpeechAuthority(value: EditReferenceLongFormSemanticWindowPlan): void {
  const unavailable = value.speechWindowAlignment === 'not_available'
  const absent = value.speechWindowAlignment === 'speech_absent'
  if (unavailable) {
    if (
      value.speechTranscriptOutputDigestSha256 !== null
      || value.speechSegmentTimingRanges.length !== 0
      || value.speechSegmentCount !== null
      || value.speechWordCount !== null
      || value.allSpeechSegmentsAssignedExactlyOnce !== null
    ) throw new Error('Unavailable semantic-window speech timing cannot claim transcript authority.')
    return
  }
  if (
    !value.speechTranscriptOutputDigestSha256
    || value.allSpeechSegmentsAssignedExactlyOnce !== true
    || !Number.isSafeInteger(value.speechSegmentCount)
    || !Number.isSafeInteger(value.speechWordCount)
    || (value.speechSegmentCount ?? -1) < 0
    || (value.speechWordCount ?? -1) < 0
  ) throw new Error('Semantic-window speech timing authority is incomplete.')
  if (absent) {
    if (
      value.speechSegmentTimingRanges.length !== 0
      || value.speechSegmentCount !== 0
      || value.speechWordCount !== 0
    ) throw new Error('Semantic-window speech-absence authority is contradictory.')
    return
  }
  let previousEnd = value.sourceCoverageStartSeconds
  let wordCount = 0
  for (const [index, range] of value.speechSegmentTimingRanges.entries()) {
    if (
      Object.keys(range).sort().join(',') !== 'segmentOrdinal,sourceEndSeconds,sourceStartSeconds,wordCount'
      || range.segmentOrdinal !== index + 1
      || !Number.isFinite(range.sourceStartSeconds)
      || !Number.isFinite(range.sourceEndSeconds)
      || range.sourceStartSeconds < value.sourceCoverageStartSeconds
      || range.sourceEndSeconds > value.sourceCoverageEndSeconds
      || range.sourceEndSeconds <= range.sourceStartSeconds
      || range.sourceStartSeconds < previousEnd
      || !Number.isSafeInteger(range.wordCount)
      || range.wordCount < 1
    ) throw new Error('Semantic-window transcript timing range is invalid.')
    previousEnd = range.sourceEndSeconds
    wordCount += range.wordCount
  }
  if (
    value.speechSegmentTimingRanges.length < 1
    || value.speechSegmentTimingRanges.length !== value.speechSegmentCount
    || wordCount !== value.speechWordCount
  ) throw new Error('Semantic-window speech timing totals are invalid.')
}

function validateWindowSpeechAssignments(value: EditReferenceLongFormSemanticWindowPlan): void {
  if (value.speechWindowAlignment === 'not_available') {
    if (value.windows.some((window) => (
      window.speechEvidenceState !== 'unknown'
      || window.speechSegmentCount !== null
      || window.speechWordCount !== null
    ))) throw new Error('A semantic window claimed speech evidence without timing authority.')
    return
  }
  let assignedSegmentCount = 0
  let assignedWordCount = 0
  for (const window of value.windows) {
    const ranges = value.speechSegmentTimingRanges.filter((range) => (
      range.sourceStartSeconds >= window.coreStartSeconds
      && range.sourceEndSeconds <= window.coreEndSeconds
    ))
    const crossing = value.speechSegmentTimingRanges.some((range) => (
      range.sourceStartSeconds < window.coreEndSeconds
      && range.sourceEndSeconds > window.coreStartSeconds
      && !ranges.includes(range)
    ))
    const wordCount = ranges.reduce((sum, range) => sum + range.wordCount, 0)
    if (
      crossing
      || window.speechSegmentCount !== ranges.length
      || window.speechWordCount !== wordCount
      || window.speechEvidenceState !== (ranges.length > 0 ? 'speech_present' : 'speech_absent')
    ) throw new Error('Semantic-window speech assignment is incomplete or crosses a boundary.')
    assignedSegmentCount += ranges.length
    assignedWordCount += wordCount
  }
  if (
    assignedSegmentCount !== value.speechSegmentCount
    || assignedWordCount !== value.speechWordCount
    || value.speechSegmentTimingRanges.some((range) => value.windows.filter((window) => (
      range.sourceStartSeconds >= window.coreStartSeconds
      && range.sourceEndSeconds <= window.coreEndSeconds
    )).length !== 1)
  ) throw new Error('Exact transcript segments were not assigned to one semantic window each.')
}

function selectKeyframeCandidateIndex(
  frameTimes: readonly number[],
  boundaryTimes: readonly number[],
): number {
  if (boundaryTimes.length === 0) return frameTimes.length - 1
  let selected = 0
  let distance = Number.POSITIVE_INFINITY
  for (const [index, frameTime] of frameTimes.entries()) {
    const nearest = Math.min(...boundaryTimes.map((boundary) => Math.abs(boundary - frameTime)))
    if (nearest < distance || (nearest === distance && index > selected)) {
      selected = index
      distance = nearest
    }
  }
  return selected
}

function stableId(prefix: string, value: unknown): string {
  return `${prefix}-${sha256(stableJson(value)).slice(0, 32)}`
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function rounded(value: number): number {
  return Number(value.toFixed(3))
}
