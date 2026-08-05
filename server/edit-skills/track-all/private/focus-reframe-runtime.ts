import { z } from 'zod'

import {
  buildOfflineRemotionTrackAllTreatmentRequest,
  isOfflineRemotionTrackAllTreatmentPayload,
  type OfflineRemotionRenderResult,
  type OfflineRemotionTrackAllFocusTreatment,
  type OfflineRemotionTrackAllTreatmentPlanningPayload,
  type OfflineRemotionTrackAllTreatmentSample,
} from '../../../tool-execution/remotion-render-execution'
import type { EditSkillArtifactReference } from '../../core/edit-skill-artifact-store'
import {
  canonicalSkillJson,
  deepFreezeSkillValue,
  hashSkillValue,
} from '../../core/skill-capability-manifest-hash'
import { createSkillQaFinding } from '../../core/skill-qa-registry'
import {
  trackGraphV2Schema,
  type TrackGraphV2,
} from '../../shared/track-graph/track-graph-schemas'
import {
  trackAllIntegrationQaReportSchema,
  trackedFocusPlanSchema,
  trackedFocusResultSchema,
  trackedReframePlanSchema,
  trackedReframeResultSchema,
  trackBoxSequenceSchema,
} from '../track-all-active-artifact-contracts'
import { trackAllCaptionReservedZonesSchema } from '../track-all-schemas'

const commonCompilerInputSchema = z.object({
  trackGraph: trackGraphV2Schema,
  boxSequences: z.array(trackBoxSequenceSchema).min(1).max(10_000),
  sourceWidth: z.number().int().min(16).max(8_192),
  sourceHeight: z.number().int().min(16).max(8_192),
  targetTrackIds: z.array(z.string().trim().min(1).max(180)).min(1).max(16),
  captionReservedZones: trackAllCaptionReservedZonesSchema,
}).strict()

const focusCompilerInputSchema = commonCompilerInputSchema.extend({
  treatment: z.enum([
    'subject_sharp_background_soft', 'subject_normal_background_dim',
    'tracked_spotlight', 'tracked_vignette', 'tracked_magnification',
    'foreground_softening', 'background_softening', 'simple_subject_outline',
  ]),
  handoffs: z.array(z.object({
    trackId: z.string().trim().min(1).max(180),
    range: z.object({
      startFrameInclusive: z.number().int().nonnegative(),
      endFrameExclusive: z.number().int().positive(),
      fps: z.number().int().min(1).max(120),
    }).strict(),
  }).strict()).min(1).max(1_000),
}).strict()

const reframeCompilerInputSchema = commonCompilerInputSchema.extend({
  outputAspectRatio: z.enum(['16:9', '9:16', '1:1', '4:5']),
  maximumZoom: z.number().min(1).max(2.5),
  lowConfidenceBehavior: z.enum(['hold_last_safe_crop', 'widen_crop', 'manual_review']),
}).strict()

export interface CompiledTrackAllFocus {
  plan: z.infer<typeof trackedFocusPlanSchema>
  remotionPlanning: OfflineRemotionTrackAllTreatmentPlanningPayload
  trajectoryHash: string
}

export interface CompiledTrackAllReframe {
  plan: z.infer<typeof trackedReframePlanSchema>
  remotionPlanning: OfflineRemotionTrackAllTreatmentPlanningPayload
  trajectoryHash: string
}

export function compileTrackAllFocus(
  input: z.input<typeof focusCompilerInputSchema>,
): CompiledTrackAllFocus {
  const parsed = focusCompilerInputSchema.parse(input)
  assertCommonAuthority(parsed)
  assertExactHandoffCoverage(parsed.trackGraph, parsed.targetTrackIds, parsed.handoffs)
  const sequences = exactSequenceMap(parsed.trackGraph, parsed.boxSequences, parsed.targetTrackIds)
  const absoluteSamples = frames(parsed.trackGraph).map((frame) => {
    const handoff = parsed.handoffs.find((candidate) => inside(frame, candidate.range))!
    const sample = sequenceSample(sequences.get(handoff.trackId)!, frame)
    const reliable = sample.confidence >= 0.65 && trackVisible(parsed.trackGraph, handoff.trackId, frame)
    return {
      frame,
      crop: reliable ? expandBox(sample.box, 0.12) : fullFrame(),
      priorityTrackIds: [handoff.trackId],
      confidence: reliable ? sample.confidence : 0,
      safeZoneCollision: false,
    }
  })
  const trackGraphRef = referenceFor('track_graph_v2', parsed.trackGraph.graphHash, parsed.trackGraph)
  const core = {
    schemaVersion: 'tracked_focus_plan_v1' as const,
    ...lineage(parsed.trackGraph),
    trackGraphRef,
    treatment: parsed.treatment,
    handoffs: parsed.handoffs,
  }
  const plan = trackedFocusPlanSchema.parse({ ...core, artifactHash: hashSkillValue(core) })
  const samples = localSamples(absoluteSamples)
  const trajectoryHash = hashSkillValue({
    schemaVersion: 'track_all_focus_trajectory_v1',
    planHash: plan.artifactHash,
    samples,
  })
  return deepFreezeSkillValue({
    plan,
    remotionPlanning: remotionPlanning({
      graph: parsed.trackGraph,
      treatmentKind: 'focus',
      focusTreatment: parsed.treatment,
      samples,
      maximumZoom: 2.5,
      lowConfidenceBehavior: 'widen_crop',
      outputAspectRatio: sourceAspect(parsed.sourceWidth, parsed.sourceHeight),
    }),
    trajectoryHash,
  })
}

export function compileTrackAllReframe(
  input: z.input<typeof reframeCompilerInputSchema>,
): CompiledTrackAllReframe {
  const parsed = reframeCompilerInputSchema.parse(input)
  assertCommonAuthority(parsed)
  const sequences = exactSequenceMap(parsed.trackGraph, parsed.boxSequences, parsed.targetTrackIds)
  const requiredRatio = aspectValue(parsed.outputAspectRatio) /
    (parsed.sourceWidth / parsed.sourceHeight)
  const absoluteSamples: AbsoluteTreatmentSample[] = []
  let lastSafe = fullFrame()
  let previousCenter = 0.5
  for (const frame of frames(parsed.trackGraph)) {
    const candidates = parsed.targetTrackIds.map((trackId) => {
      const sample = sequenceSample(sequences.get(trackId)!, frame)
      return { trackId, ...sample, visible: trackVisible(parsed.trackGraph, trackId, frame) }
    })
    const reliable = candidates.filter((candidate) => candidate.visible && candidate.confidence >= 0.65)
    let crop: NormalizedBox
    let confidence: number
    let horizontalMovement = 0
    if (reliable.length === 0) {
      confidence = 0
      crop = parsed.lowConfidenceBehavior === 'hold_last_safe_crop'
        ? lastSafe
        : fullFrameForRatio(requiredRatio)
    } else {
      const subjectBounds = union(reliable.map((candidate) => candidate.box))
      const leadDirection = center(subjectBounds).x - previousCenter
      horizontalMovement = leadDirection
      crop = cropAroundTargets({
        subjects: subjectBounds,
        normalizedAspectRatio: requiredRatio,
        maximumZoom: parsed.maximumZoom,
        leadDirection,
      })
      confidence = Math.min(...reliable.map((candidate) => candidate.confidence))
      const collision = collidesWithCaption(
        frame,
        subjectBounds,
        parsed.captionReservedZones,
        crop,
      )
      if (collision) crop = widenAwayFromCaptions(crop, requiredRatio)
      crop = smoothCrop(lastSafe, crop, 0.28)
      crop = conformCrop(crop, requiredRatio, parsed.maximumZoom)
      lastSafe = crop
      previousCenter = center(subjectBounds).x
    }
    const subjectBounds = reliable.length > 0
      ? union(reliable.map((candidate) => candidate.box))
      : crop
    absoluteSamples.push({
      frame,
      crop,
      priorityTrackIds: reliable.length > 0
        ? reliable.map((candidate) => candidate.trackId)
        : parsed.targetTrackIds,
      confidence,
      safeZoneCollision: collidesWithCaption(
        frame,
        subjectBounds,
        parsed.captionReservedZones,
        crop,
      ),
      headroom: clamp01((subjectBounds.y - crop.y) / crop.height),
      leadRoom: clamp01(
        horizontalMovement >= 0
          ? (crop.x + crop.width - center(subjectBounds).x) / crop.width
          : (center(subjectBounds).x - crop.x) / crop.width,
      ),
    })
  }
  const trackGraphRef = referenceFor('track_graph_v2', parsed.trackGraph.graphHash, parsed.trackGraph)
  const core = {
    schemaVersion: 'tracked_reframe_plan_v1' as const,
    ...lineage(parsed.trackGraph),
    trackGraphRef,
    outputAspectRatio: parsed.outputAspectRatio,
    maximumZoom: parsed.maximumZoom,
    frames: absoluteSamples.map((sample) => ({
      frameIndex: sample.frame,
      crop: sample.crop,
      priorityTrackIds: sample.priorityTrackIds,
      headroom: sample.headroom ?? 0,
      leadRoom: sample.leadRoom ?? 0,
      safeZoneCollision: sample.safeZoneCollision,
      confidence: sample.confidence,
    })),
    lowConfidenceBehavior: parsed.lowConfidenceBehavior,
  }
  const plan = trackedReframePlanSchema.parse({ ...core, artifactHash: hashSkillValue(core) })
  const samples = localSamples(absoluteSamples)
  const trajectoryHash = hashSkillValue({
    schemaVersion: 'track_all_reframe_trajectory_v1',
    planHash: plan.artifactHash,
    samples,
  })
  return deepFreezeSkillValue({
    plan,
    remotionPlanning: remotionPlanning({
      graph: parsed.trackGraph,
      treatmentKind: 'reframe',
      samples,
      maximumZoom: parsed.maximumZoom,
      lowConfidenceBehavior: parsed.lowConfidenceBehavior,
      outputAspectRatio: parsed.outputAspectRatio,
    }),
    trajectoryHash,
  })
}

export function buildTrackAllTreatmentRemotionRequest(input: {
  compiled: CompiledTrackAllFocus | CompiledTrackAllReframe
  source: { mimeType: 'video/mp4' | 'video/x-matroska'; bytes: Buffer; sha256: string }
}) {
  return buildOfflineRemotionTrackAllTreatmentRequest({
    planningPayload: input.compiled.remotionPlanning,
    source: input.source,
  })
}

export function deriveTrackAllTreatmentIntegrationQa(input: {
  compiled: CompiledTrackAllFocus | CompiledTrackAllReframe
  renderResult: OfflineRemotionRenderResult
  privatePreviewRef: EditSkillArtifactReference
}): z.infer<typeof trackAllIntegrationQaReportSchema> {
  const payload = input.renderResult.request.payload
  if (!isOfflineRemotionTrackAllTreatmentPayload(payload)) {
    throw new Error('Treatment QA requires the exact Track All Remotion profile.')
  }
  const plan = input.compiled.plan
  const exact =
    input.renderResult.artifact.sha256 === input.privatePreviewRef.sha256 &&
    input.renderResult.artifact.durationFrames ===
      plan.authorizedRange.endFrameExclusive - plan.authorizedRange.startFrameInclusive &&
    payload.sourceSha256 === plan.sourceSha256 &&
    payload.samples.length === input.renderResult.artifact.durationFrames &&
    input.privatePreviewRef.ownerUserId === plan.ownerUserId &&
    input.privatePreviewRef.workspaceId === plan.workspaceId &&
    input.privatePreviewRef.projectId === plan.projectId &&
    input.renderResult.readiness.privateInternalOnly === true &&
    input.renderResult.readiness.productReady === false &&
    input.renderResult.evidence.semanticEvidence
      .trackAllTreatmentPreviewCompositionExecuted === true &&
    input.renderResult.evidence.semanticEvidence.exactFrameTrajectoryApplied === true &&
    input.renderResult.evidence.semanticEvidence.captionsRemainAboveTrackAll === true &&
    input.renderResult.frameArtifacts.length === 3
  const finding = createSkillQaFinding({
    qaKey: 'track_all.integration.focus_reframe_private_preview',
    validatorVersion: 'track_all_focus_reframe_integration_validator_v1',
    disposition: exact ? 'pass' : 'blocking',
    summary: exact
      ? 'The exact range-bound trajectory rendered through the private Track All Remotion profile.'
      : 'The treatment preview did not preserve exact Track All lineage or range authority.',
    evidenceHashes: [
      input.compiled.trajectoryHash,
      input.renderResult.attestation.attestationHash,
      input.privatePreviewRef.sha256,
    ],
    observations: {
      treatmentKind: payload.treatmentKind,
      durationFrames: input.renderResult.artifact.durationFrames,
      frameGoldenCount: input.renderResult.frameArtifacts.length,
      publicArtifact: payload.publicArtifact,
      productReady: input.renderResult.readiness.productReady,
    },
  })
  if (!exact) throw new Error('Track All focus/reframe integration QA failed closed.')
  const core = {
    schemaVersion: 'track_all_integration_qa_report_v1' as const,
    ...lineageFromPlan(plan),
    findings: [finding],
    disposition: 'pass' as const,
    outsideAuthorizedRangeModified: false as const,
    sourceAndTimingExact: true as const,
    privateOutput: true as const,
    publicUrlPresent: false as const,
    layerOrderValid: true,
  }
  return trackAllIntegrationQaReportSchema.parse({
    ...core,
    artifactHash: hashSkillValue(core),
  })
}

export function finalizeTrackAllFocus(input: {
  compiled: CompiledTrackAllFocus
  privatePreviewRef: EditSkillArtifactReference
  integrationQa: z.input<typeof trackAllIntegrationQaReportSchema>
}) {
  const qa = exactPassedQa(input.compiled.plan, input.integrationQa)
  if (
    input.privatePreviewRef.ownerUserId !== input.compiled.plan.ownerUserId ||
    input.privatePreviewRef.workspaceId !== input.compiled.plan.workspaceId ||
    input.privatePreviewRef.projectId !== input.compiled.plan.projectId ||
    !qa.findings.some((finding) =>
      finding.evidenceHashes.includes(input.privatePreviewRef.sha256))
  ) throw new Error('Focus preview reference is not bound to the passed integration QA.')
  const core = {
    schemaVersion: 'tracked_focus_result_v1' as const,
    ...lineageFromPlan(input.compiled.plan),
    trackGraphRef: input.compiled.plan.trackGraphRef,
    planRef: referenceFor(
      'tracked_focus_plan_v1',
      input.compiled.plan.artifactHash,
      input.compiled.plan,
    ),
    privatePreviewRef: input.privatePreviewRef,
    integrationQaRef: referenceFor('track_all_integration_qa_report_v1', qa.artifactHash, qa),
    publicArtifact: false as const,
  }
  return trackedFocusResultSchema.parse({ ...core, artifactHash: hashSkillValue(core) })
}

export function finalizeTrackAllReframe(input: {
  compiled: CompiledTrackAllReframe
  integrationQa: z.input<typeof trackAllIntegrationQaReportSchema>
}) {
  const qa = exactPassedQa(input.compiled.plan, input.integrationQa)
  const core = {
    schemaVersion: 'tracked_reframe_result_v1' as const,
    ...lineageFromPlan(input.compiled.plan),
    trackGraphRef: input.compiled.plan.trackGraphRef,
    planRef: referenceFor(
      'tracked_reframe_plan_v1',
      input.compiled.plan.artifactHash,
      input.compiled.plan,
    ),
    trajectoryHash: input.compiled.trajectoryHash,
    integrationQaRef: referenceFor('track_all_integration_qa_report_v1', qa.artifactHash, qa),
    finalRenderOwnedByTrackAll: false as const,
  }
  return trackedReframeResultSchema.parse({ ...core, artifactHash: hashSkillValue(core) })
}

interface NormalizedBox { x: number; y: number; width: number; height: number }
interface AbsoluteTreatmentSample {
  frame: number
  crop: NormalizedBox
  priorityTrackIds: string[]
  confidence: number
  safeZoneCollision: boolean
  headroom?: number
  leadRoom?: number
}

function assertCommonAuthority(input: z.infer<typeof commonCompilerInputSchema>): void {
  const graph = input.trackGraph
  const zones = input.captionReservedZones
  if (
    zones.ownerUserId !== graph.ownerUserId || zones.workspaceId !== graph.workspaceId ||
    zones.projectId !== graph.projectId || zones.assignmentId !== graph.assignmentId ||
    zones.assignmentHash !== graph.assignmentHash ||
    canonicalSkillJson(zones.authorizedRange) !== canonicalSkillJson(graph.authorizedRange) ||
    new Set(input.targetTrackIds).size !== input.targetTrackIds.length ||
    input.targetTrackIds.some((id) => !graph.tracks.some((track) => track.trackId === id)) ||
    ![24, 30].includes(graph.authorizedRange.fps) ||
    graph.authorizedRange.endFrameExclusive -
      graph.authorizedRange.startFrameInclusive > 1_920
  ) throw new Error('Track All focus/reframe authority does not match its Track Graph.')
}

function assertExactHandoffCoverage(
  graph: TrackGraphV2,
  targetTrackIds: readonly string[],
  handoffs: readonly { trackId: string; range: TrackGraphV2['authorizedRange'] }[],
): void {
  let next = graph.authorizedRange.startFrameInclusive
  for (const handoff of handoffs) {
    if (
      !targetTrackIds.includes(handoff.trackId) || handoff.range.fps !== graph.authorizedRange.fps ||
      handoff.range.startFrameInclusive !== next ||
      handoff.range.endFrameExclusive <= handoff.range.startFrameInclusive
    ) throw new Error('Focus handoffs must be contiguous, ordered, and target-bound.')
    next = handoff.range.endFrameExclusive
  }
  if (next !== graph.authorizedRange.endFrameExclusive) {
    throw new Error('Focus handoffs must cover the complete authorized range.')
  }
}

function exactSequenceMap(
  graph: TrackGraphV2,
  sequencesInput: z.infer<typeof trackBoxSequenceSchema>[],
  targetTrackIds: readonly string[],
) {
  const sequences = new Map(sequencesInput.map((sequence) => [sequence.trackId, sequence]))
  if (sequences.size !== sequencesInput.length) throw new Error('Duplicate box sequence role.')
  for (const trackId of targetTrackIds) {
    const track = graph.tracks.find((candidate) => candidate.trackId === trackId)!
    const sequence = sequences.get(trackId)
    if (
      !sequence || hashSkillValue(sequence) !== track.boxSequenceRef.sha256 ||
      sequence.ownerUserId !== graph.ownerUserId || sequence.workspaceId !== graph.workspaceId ||
      sequence.projectId !== graph.projectId || sequence.assignmentId !== graph.assignmentId ||
      sequence.assignmentHash !== graph.assignmentHash || sequence.planHash !== graph.planHash ||
      sequence.sourceSha256 !== graph.sourceSha256 ||
      canonicalSkillJson(sequence.authorizedRange) !== canonicalSkillJson(graph.authorizedRange)
    ) throw new Error(`Track ${trackId} lacks its exact checksum-bound box sequence.`)
  }
  return sequences
}

function sequenceSample(
  sequence: z.infer<typeof trackBoxSequenceSchema>,
  frame: number,
) {
  const sample = sequence.boxes.find((candidate) => candidate.frameIndex === frame)
  if (!sample) throw new Error(`Track ${sequence.trackId} lacks box geometry at frame ${frame}.`)
  return sample
}

function trackVisible(graph: TrackGraphV2, trackId: string, frame: number): boolean {
  const track = graph.tracks.find((candidate) => candidate.trackId === trackId)!
  const span = track.visibilitySpans.find((candidate) => inside(frame, candidate))
  return Boolean(span && ['active', 'partially_occluded', 'reacquired'].includes(span.state))
}

function frames(graph: TrackGraphV2): number[] {
  return Array.from(
    { length: graph.authorizedRange.endFrameExclusive - graph.authorizedRange.startFrameInclusive },
    (_, index) => graph.authorizedRange.startFrameInclusive + index,
  )
}

function localSamples(samples: readonly AbsoluteTreatmentSample[]): OfflineRemotionTrackAllTreatmentSample[] {
  return samples.map((sample, index) => ({
    frameIndex: index,
    crop: sample.crop,
    priorityTrackIds: sample.priorityTrackIds,
    confidence: sample.confidence,
    safeZoneCollision: sample.safeZoneCollision,
  }))
}

function remotionPlanning(input: {
  graph: TrackGraphV2
  treatmentKind: 'focus' | 'reframe'
  focusTreatment?: OfflineRemotionTrackAllFocusTreatment
  samples: OfflineRemotionTrackAllTreatmentSample[]
  maximumZoom: number
  lowConfidenceBehavior: 'hold_last_safe_crop' | 'widen_crop' | 'manual_review'
  outputAspectRatio: '16:9' | '9:16' | '1:1' | '4:5'
}): OfflineRemotionTrackAllTreatmentPlanningPayload {
  const portrait = input.outputAspectRatio === '9:16' || input.outputAspectRatio === '4:5'
  return {
    compositionProfileId: 'track_all_private_treatment_preview_v1',
    width: portrait ? 360 : input.outputAspectRatio === '1:1' ? 480 : 640,
    height: portrait ? (input.outputAspectRatio === '9:16' ? 640 : 600) : input.outputAspectRatio === '1:1' ? 480 : 360,
    fps: input.graph.authorizedRange.fps as 24 | 30,
    durationFrames: input.samples.length,
    sourceStartFrame: 0,
    sourceEndFrameExclusive: input.samples.length,
    treatmentKind: input.treatmentKind,
    ...(input.focusTreatment ? { focusTreatment: input.focusTreatment } : {}),
    samples: input.samples,
    maximumZoom: input.maximumZoom,
    lowConfidenceBehavior: input.lowConfidenceBehavior,
    captionLayerOrder: 'captions_above_track_all',
    audioPolicy: 'remove_for_private_qa',
    privateOutput: true,
    publicArtifact: false,
  }
}

function sourceAspect(width: number, height: number): '16:9' | '9:16' | '1:1' | '4:5' {
  const ratio = width / height
  const options = [
    ['16:9', 16 / 9], ['9:16', 9 / 16], ['1:1', 1], ['4:5', 4 / 5],
  ] as const
  return [...options].sort((left, right) =>
    Math.abs(left[1] - ratio) - Math.abs(right[1] - ratio))[0]![0]
}

function aspectValue(value: '16:9' | '9:16' | '1:1' | '4:5'): number {
  return { '16:9': 16 / 9, '9:16': 9 / 16, '1:1': 1, '4:5': 4 / 5 }[value]
}

function cropAroundTargets(input: {
  subjects: NormalizedBox
  normalizedAspectRatio: number
  maximumZoom: number
  leadDirection: number
}): NormalizedBox {
  const marginX = 0.12 + Math.min(0.08, Math.abs(input.leadDirection) * 0.5)
  const marginTop = 0.16
  const marginBottom = 0.1
  const expanded = clampBox({
    x: input.subjects.x - marginX - Math.max(0, input.leadDirection) * 0.12,
    y: input.subjects.y - marginTop,
    width: input.subjects.width + marginX * 2 + Math.abs(input.leadDirection) * 0.12,
    height: input.subjects.height + marginTop + marginBottom,
  })
  return conformCrop(expanded, input.normalizedAspectRatio, input.maximumZoom)
}

function conformCrop(box: NormalizedBox, ratio: number, maximumZoom: number): NormalizedBox {
  let width = Math.max(box.width, 1 / maximumZoom)
  let height = Math.max(box.height, 1 / maximumZoom)
  if (width / height < ratio) width = height * ratio
  else height = width / ratio
  if (width > 1 || height > 1) return fullFrameForRatio(ratio)
  const point = center(box)
  return clampBox({ x: point.x - width / 2, y: point.y - height / 2, width, height })
}

function fullFrameForRatio(ratio: number): NormalizedBox {
  return ratio >= 1
    ? { x: 0, y: (1 - 1 / ratio) / 2, width: 1, height: 1 / ratio }
    : { x: (1 - ratio) / 2, y: 0, width: ratio, height: 1 }
}

function expandBox(box: NormalizedBox, margin: number): NormalizedBox {
  return clampBox({
    x: box.x - margin,
    y: box.y - margin,
    width: box.width + margin * 2,
    height: box.height + margin * 2,
  })
}

function union(boxes: readonly NormalizedBox[]): NormalizedBox {
  const x = Math.min(...boxes.map((box) => box.x))
  const y = Math.min(...boxes.map((box) => box.y))
  return {
    x, y,
    width: Math.max(...boxes.map((box) => box.x + box.width)) - x,
    height: Math.max(...boxes.map((box) => box.y + box.height)) - y,
  }
}

function smoothCrop(previous: NormalizedBox, next: NormalizedBox, amount: number): NormalizedBox {
  return clampBox({
    x: previous.x + (next.x - previous.x) * amount,
    y: previous.y + (next.y - previous.y) * amount,
    width: previous.width + (next.width - previous.width) * amount,
    height: previous.height + (next.height - previous.height) * amount,
  })
}

function widenAwayFromCaptions(box: NormalizedBox, ratio: number): NormalizedBox {
  const widened = { ...box, width: Math.min(1, box.width * 1.2), height: Math.min(1, box.height * 1.2) }
  return conformCrop(widened, ratio, 1)
}

function collidesWithCaption(
  frame: number,
  subjectBox: NormalizedBox,
  zones: z.infer<typeof trackAllCaptionReservedZonesSchema>,
  crop: NormalizedBox,
): boolean {
  const projected = projectIntoCrop(subjectBox, crop)
  return zones.zones.some((zone) =>
    inside(frame, zone.frameRange) && overlaps(projected, {
      x: zone.xMillionths / 1_000_000,
      y: zone.yMillionths / 1_000_000,
      width: zone.widthMillionths / 1_000_000,
      height: zone.heightMillionths / 1_000_000,
    }))
}

function projectIntoCrop(subject: NormalizedBox, crop: NormalizedBox): NormalizedBox {
  return clampBox({
    x: (subject.x - crop.x) / crop.width,
    y: (subject.y - crop.y) / crop.height,
    width: subject.width / crop.width,
    height: subject.height / crop.height,
  })
}

function overlaps(left: NormalizedBox, right: NormalizedBox): boolean {
  return left.x < right.x + right.width && left.x + left.width > right.x &&
    left.y < right.y + right.height && left.y + left.height > right.y
}

function clampBox(box: NormalizedBox): NormalizedBox {
  const width = Math.min(1, Math.max(0.001, box.width))
  const height = Math.min(1, Math.max(0.001, box.height))
  return {
    x: clamp(box.x, 0, 1 - width),
    y: clamp(box.y, 0, 1 - height),
    width,
    height,
  }
}

function fullFrame(): NormalizedBox { return { x: 0, y: 0, width: 1, height: 1 } }
function center(box: NormalizedBox) { return { x: box.x + box.width / 2, y: box.y + box.height / 2 } }
function clamp(value: number, minimum: number, maximum: number) { return Math.min(maximum, Math.max(minimum, value)) }
function clamp01(value: number) { return clamp(value, 0, 1) }
function inside(frame: number, range: { startFrameInclusive: number; endFrameExclusive: number }) {
  return frame >= range.startFrameInclusive && frame < range.endFrameExclusive
}

function lineage(graph: TrackGraphV2) {
  return {
    ownerUserId: graph.ownerUserId,
    workspaceId: graph.workspaceId,
    projectId: graph.projectId,
    editSessionId: graph.editSessionId,
    assignmentId: graph.assignmentId,
    assignmentHash: graph.assignmentHash,
    planHash: graph.planHash,
    manifestRef: graph.manifestRef,
    sourceSha256: graph.sourceSha256,
    authorizedRange: graph.authorizedRange,
  }
}

function lineageFromPlan(plan: z.infer<typeof trackedFocusPlanSchema> | z.infer<typeof trackedReframePlanSchema>) {
  return {
    ownerUserId: plan.ownerUserId,
    workspaceId: plan.workspaceId,
    projectId: plan.projectId,
    editSessionId: plan.editSessionId,
    assignmentId: plan.assignmentId,
    assignmentHash: plan.assignmentHash,
    planHash: plan.planHash,
    manifestRef: plan.manifestRef,
    sourceSha256: plan.sourceSha256,
    authorizedRange: plan.authorizedRange,
  }
}

function exactPassedQa(
  plan: z.infer<typeof trackedFocusPlanSchema> | z.infer<typeof trackedReframePlanSchema>,
  input: z.input<typeof trackAllIntegrationQaReportSchema>,
) {
  const qa = trackAllIntegrationQaReportSchema.parse(input)
  if (
    qa.disposition !== 'pass' || qa.outsideAuthorizedRangeModified !== false ||
    qa.sourceAndTimingExact !== true || qa.privateOutput !== true ||
    qa.publicUrlPresent !== false || qa.layerOrderValid !== true ||
    qa.assignmentHash !== plan.assignmentHash || qa.planHash !== plan.planHash ||
    qa.sourceSha256 !== plan.sourceSha256 ||
    canonicalSkillJson(qa.authorizedRange) !== canonicalSkillJson(plan.authorizedRange)
  ) throw new Error('Track All treatment finalization requires exact independently passed QA.')
  return qa
}

function referenceFor(
  artifactType: string,
  sha256: string,
  value: { ownerUserId: string; workspaceId: string; projectId: string },
): EditSkillArtifactReference {
  return {
    artifactType,
    sha256,
    byteLength: Buffer.byteLength(canonicalSkillJson(value)),
    ownerUserId: value.ownerUserId,
    workspaceId: value.workspaceId,
    projectId: value.projectId,
  }
}
