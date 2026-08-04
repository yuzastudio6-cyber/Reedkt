import { createHash } from 'node:crypto'
import { z } from 'zod'

import {
  OFFLINE_MEDIA_BINARY_OPERATIONS,
  OFFLINE_MEDIA_BINARY_PROTOCOL,
  OFFLINE_TRACK_ALL_PRIVACY_REDACTION_PROFILE,
  validateOfflineFfmpegExecutionRequest,
  validateOfflineFfmpegPlanningPayload,
  type OfflineFfmpegExecutionRequest,
  type OfflineFfmpegTrackAllPrivacyRedactionPlanningPayload,
  type OfflineTrackAllPrivacyMaskRegion,
} from '../../../tool-execution/media-binary-execution'
import type { EditSkillArtifactReference } from '../../core/edit-skill-artifact-store'
import {
  canonicalSkillJson,
  deepFreezeSkillValue,
  hashSkillValue,
} from '../../core/skill-capability-manifest-hash'
import { createSkillQaFinding } from '../../core/skill-qa-registry'
import { trackGraphV2Schema, type TrackGraphV2 } from '../../shared/track-graph/track-graph-schemas'
import {
  trackAllPrivacyQaReportSchema,
  trackedRedactionPlanSchema,
  trackedRedactionResultSchema,
  trackBoxSequenceSchema,
} from '../track-all-active-artifact-contracts'
import { privacyPolicySnapshotSchema } from '../track-all-schemas'
import { trackAllFfprobeSourceTruthSchema } from './deterministic-geometry-runtime'

const normalizedBox = z
  .object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    width: z.number().gt(0).max(1),
    height: z.number().gt(0).max(1),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.x + value.width > 1 || value.y + value.height > 1) {
      context.addIssue({
        code: 'custom',
        message: 'Privacy evidence region exceeds the source frame.',
      })
    }
  })

const reflectionRegionSchema = z
  .object({
    startFrameInclusive: z.number().int().nonnegative(),
    endFrameExclusive: z.number().int().positive(),
    box: normalizedBox,
    groundingEvidenceHash: z.string().regex(/^[a-f0-9]{64}$/u),
  })
  .strict()

const compilerInputSchema = z
  .object({
    trackGraph: trackGraphV2Schema,
    boxSequences: z.array(trackBoxSequenceSchema).min(1).max(10_000),
    privacyPolicy: privacyPolicySnapshotSchema,
    sourceTruth: trackAllFfprobeSourceTruthSchema,
    targetTrackIds: z.array(z.string().trim().min(1).max(180)).min(1).max(1_000),
    treatment: z.enum([
      'gaussian_blur',
      'pixelate',
      'mosaic',
      'solid_fill',
      'conservative_region_cover',
      'tracked_crop_exclusion',
    ]),
    reflectionRegions: z.array(reflectionRegionSchema).max(1_000),
  })
  .strict()

const pixelInspectionSchema = z
  .object({
    schemaVersion: z.literal('track_all_privacy_pixel_inspection_evidence_v1'),
    sourceSha256: z.string().regex(/^[a-f0-9]{64}$/u),
    outputSha256: z.string().regex(/^[a-f0-9]{64}$/u),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    frameCount: z.number().int().positive(),
    inspectedFrameCount: z.number().int().positive(),
    maskedFrameCount: z.number().int().positive(),
    minimumMaskedMeanAbsoluteDelta: z.number().nonnegative(),
    maximumMaskedOutputEdgeEnergyRatio: z.number().nonnegative(),
    minimumMaskedOutputDarkPixelRatio: z.number().min(0).max(1),
    everyExpectedPrivacyFrameCovered: z.boolean(),
    conservativeUncertaintyFramesCovered: z.boolean(),
    reflectionFramesCovered: z.boolean(),
    outsideMaskSampleMeanAbsoluteDelta: z.number().nonnegative(),
    producerOperationId: z.literal('tool.opencv.inspect_track_all_privacy_preview.v1'),
    inspectionHash: z.string().regex(/^[a-f0-9]{64}$/u),
  })
  .strict()
  .superRefine((value, context) => {
    const { inspectionHash, ...core } = value
    if (hashSkillValue(core) !== inspectionHash) {
      context.addIssue({
        code: 'custom',
        message: 'Privacy pixel inspection evidence is stale or forged.',
      })
    }
  })

export interface CompiledTrackAllPrivacyRedaction {
  plan: z.infer<typeof trackedRedactionPlanSchema>
  recipe: OfflineFfmpegTrackAllPrivacyRedactionPlanningPayload
  conservativeCoverageApplied: boolean
  expectedPrivacyFrames: readonly number[]
  compilationEvidenceHash: string
}

export function compileTrackAllPrivacyRedaction(
  input: z.input<typeof compilerInputSchema>,
): CompiledTrackAllPrivacyRedaction {
  const parsed = compilerInputSchema.parse(input)
  assertPrivacyAuthorities(parsed)
  if (parsed.treatment === 'tracked_crop_exclusion') {
    throw new Error(
      'Tracked crop exclusion must be compiled by the tracked-reframe route, not the FFmpeg redaction recipe.',
    )
  }
  const selected = selectedTracks(parsed.trackGraph, parsed.targetTrackIds)
  const boxSequences = new Map(parsed.boxSequences.map((sequence) => [sequence.trackId, sequence]))
  const rawRegions: OfflineTrackAllPrivacyMaskRegion[] = []
  const expectedPrivacyFrames = new Set<number>()
  let conservativeCoverageApplied = parsed.treatment === 'conservative_region_cover'
  for (const track of selected) {
    const sequence = boxSequences.get(track.trackId)
    if (!sequence || sequence.artifactHash !== track.boxSequenceRef.sha256) {
      throw new Error(`Privacy track ${track.trackId} lacks its exact checksum-bound box sequence.`)
    }
    const boxes = new Map(sequence.boxes.map((sample) => [sample.frameIndex, sample]))
    for (let frame = track.startFrameInclusive; frame < track.endFrameExclusive; frame += 1) {
      expectedPrivacyFrames.add(frame)
      const state = visibilityAt(track, frame)
      const sample = boxes.get(frame)
      const reliable =
        sample &&
        sample.confidence >= 0.72 &&
        ['active', 'reacquired', 'partially_occluded'].includes(state)
      if (!reliable) {
        conservativeCoverageApplied = true
        rawRegions.push(fullFrameRegion(frame, parsed.sourceTruth.width, parsed.sourceTruth.height))
        continue
      }
      rawRegions.push(
        pixelRegion(
          frame,
          sample.box,
          parsed.sourceTruth.width,
          parsed.sourceTruth.height,
          state === 'partially_occluded' ? 20 : 10,
          'track_mask_bounds',
        ),
      )
    }
  }
  for (const reflection of parsed.reflectionRegions) {
    if (
      reflection.startFrameInclusive < parsed.trackGraph.authorizedRange.startFrameInclusive ||
      reflection.endFrameExclusive > parsed.trackGraph.authorizedRange.endFrameExclusive ||
      reflection.endFrameExclusive <= reflection.startFrameInclusive
    )
      throw new Error('Reflection privacy evidence exceeds the authorized range.')
    for (
      let frame = reflection.startFrameInclusive;
      frame < reflection.endFrameExclusive;
      frame += 1
    ) {
      expectedPrivacyFrames.add(frame)
      rawRegions.push(
        pixelRegion(
          frame,
          reflection.box,
          parsed.sourceTruth.width,
          parsed.sourceTruth.height,
          16,
          'reflection_cover',
        ),
      )
    }
  }
  const maskRegions = compressPrivacyRegions(rawRegions)
  const effectiveTreatment =
    conservativeCoverageApplied || parsed.treatment === 'conservative_region_cover'
      ? 'solid_fill'
      : parsed.treatment
  const recipe = validateOfflineFfmpegPlanningPayload({
    recipeProfileId: OFFLINE_TRACK_ALL_PRIVACY_REDACTION_PROFILE,
    timestampPolicy: 'normalize_from_zero',
    overwriteExistingArtifact: false,
    allowUnreviewedCodec: false,
    trimStartFrame: parsed.trackGraph.authorizedRange.startFrameInclusive,
    trimEndFrameExclusive: parsed.trackGraph.authorizedRange.endFrameExclusive,
    frameRate: parsed.trackGraph.authorizedRange.fps,
    treatment: effectiveTreatment,
    sourceWidth: parsed.sourceTruth.width,
    sourceHeight: parsed.sourceTruth.height,
    maskRegions,
    uncertaintyPolicy: 'expand_hold_parent_block_if_unresolved_v1',
    privacyFailClosed: true,
    flattenedPrivatePreview: true,
    outputContainer: 'matroska',
    outputCodec: 'libvpx-vp9',
    constantQuality: 12,
    outputPixelFormat: 'yuv420p',
    preserveAudio: false,
    metadataPolicy: 'strip_all',
    publicArtifact: false,
  })
  if (recipe.recipeProfileId !== OFFLINE_TRACK_ALL_PRIVACY_REDACTION_PROFILE) {
    throw new Error('Track All privacy recipe resolved to an unexpected profile.')
  }
  const graphRef = referenceFor('track_graph_v2', parsed.trackGraph.graphHash, parsed.trackGraph)
  const lineage = treatmentLineage(parsed.trackGraph, graphRef)
  const planCore = {
    schemaVersion: 'tracked_redaction_plan_v1' as const,
    ...lineage,
    treatment: parsed.treatment,
    targetTrackIds: [...parsed.targetTrackIds].sort(),
    uncertaintyBehavior: 'conservative_cover_and_review' as const,
    flattenedPreviewRequired: true as const,
  }
  const plan = trackedRedactionPlanSchema.parse({
    ...planCore,
    artifactHash: hashSkillValue(planCore),
  })
  const result = {
    plan,
    recipe,
    conservativeCoverageApplied,
    expectedPrivacyFrames: [...expectedPrivacyFrames].sort((left, right) => left - right),
    compilationEvidenceHash: hashSkillValue({
      graphHash: parsed.trackGraph.graphHash,
      policyHash: parsed.privacyPolicy.policyHash,
      planHash: plan.artifactHash,
      recipe,
      conservativeCoverageApplied,
      expectedPrivacyFrames: [...expectedPrivacyFrames].sort((left, right) => left - right),
      outsideAuthorizedRangeModified: false,
    }),
  }
  return deepFreezeSkillValue(result)
}

export function buildTrackAllPrivacyRedactionExecutionRequest(input: {
  compiled: CompiledTrackAllPrivacyRedaction
  sourceBytes: Buffer
}): OfflineFfmpegExecutionRequest {
  const sourceSha256 = createHash('sha256').update(input.sourceBytes).digest('hex')
  if (sourceSha256 !== input.compiled.plan.sourceSha256) {
    throw new Error('Privacy source bytes do not match the exact Track Graph source authority.')
  }
  return validateOfflineFfmpegExecutionRequest({
    schemaVersion: OFFLINE_MEDIA_BINARY_PROTOCOL,
    toolId: 'ffmpeg',
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
    payload: {
      ...input.compiled.recipe,
      mimeType: 'video/mp4',
      sourceByteLength: input.sourceBytes.byteLength,
      sourceSha256,
      sourceBytesBase64: input.sourceBytes.toString('base64'),
    },
  })
}

export function inspectTrackAllPrivacyPreview(input: {
  compiled: CompiledTrackAllPrivacyRedaction
  sourceFramesRgb24: Buffer
  outputFramesRgb24: Buffer
  sourceSha256: string
  outputSha256: string
}): z.infer<typeof pixelInspectionSchema> {
  const { recipe } = input.compiled
  const frameCount = recipe.trimEndFrameExclusive - recipe.trimStartFrame
  const frameByteLength = recipe.sourceWidth * recipe.sourceHeight * 3
  if (
    input.sourceSha256 !== input.compiled.plan.sourceSha256 ||
    input.sourceFramesRgb24.byteLength !== frameCount * frameByteLength ||
    input.outputFramesRgb24.byteLength !== frameCount * frameByteLength ||
    !/^[a-f0-9]{64}$/u.test(input.outputSha256)
  )
    throw new Error(
      'Privacy preview inspection received the wrong source, dimensions, or frame count.',
    )
  const byFrame = regionsByOutputFrame(recipe)
  const expectedFrames = new Set(
    input.compiled.expectedPrivacyFrames.map((frame) => frame - recipe.trimStartFrame),
  )
  const deltas: number[] = []
  const edgeRatios: number[] = []
  const darkRatios: number[] = []
  let outsideDeltaTotal = 0
  let outsidePixels = 0
  for (let frame = 0; frame < frameCount; frame += 1) {
    const regions = byFrame.get(frame) ?? []
    if (regions.length === 0) continue
    const mask = rasterizeRegions(regions, recipe.sourceWidth, recipe.sourceHeight)
    const metrics = comparePrivacyFrame({
      source: input.sourceFramesRgb24,
      output: input.outputFramesRgb24,
      frame,
      frameByteLength,
      width: recipe.sourceWidth,
      height: recipe.sourceHeight,
      mask,
    })
    deltas.push(metrics.maskedMeanAbsoluteDelta)
    edgeRatios.push(metrics.maskedOutputEdgeEnergyRatio)
    darkRatios.push(metrics.maskedOutputDarkPixelRatio)
    outsideDeltaTotal += metrics.outsideAbsoluteDeltaTotal
    outsidePixels += metrics.outsidePixelCount
  }
  const covered = [...expectedFrames].every((frame) => byFrame.has(frame))
  const conservativeFrames = recipe.maskRegions.filter(
    (region) => region.evidenceKind === 'conservative_uncertainty_cover',
  )
  const reflectionFrames = recipe.maskRegions.filter(
    (region) => region.evidenceKind === 'reflection_cover',
  )
  const core = {
    schemaVersion: 'track_all_privacy_pixel_inspection_evidence_v1' as const,
    sourceSha256: input.sourceSha256,
    outputSha256: input.outputSha256,
    width: recipe.sourceWidth,
    height: recipe.sourceHeight,
    frameCount,
    inspectedFrameCount: frameCount,
    maskedFrameCount: byFrame.size,
    minimumMaskedMeanAbsoluteDelta: minimum(deltas),
    maximumMaskedOutputEdgeEnergyRatio: maximum(edgeRatios),
    minimumMaskedOutputDarkPixelRatio: minimum(darkRatios),
    everyExpectedPrivacyFrameCovered: covered,
    conservativeUncertaintyFramesCovered:
      !input.compiled.conservativeCoverageApplied || conservativeFrames.length > 0,
    reflectionFramesCovered: reflectionFrames.length > 0,
    outsideMaskSampleMeanAbsoluteDelta:
      outsidePixels === 0 ? 0 : outsideDeltaTotal / (outsidePixels * 3),
    producerOperationId: 'tool.opencv.inspect_track_all_privacy_preview.v1' as const,
  }
  return pixelInspectionSchema.parse({
    ...core,
    inspectionHash: hashSkillValue(core),
  })
}

export function deriveTrackAllPrivacyQaReport(input: {
  compiled: CompiledTrackAllPrivacyRedaction
  inspection: z.input<typeof pixelInspectionSchema>
  flattenedPreviewRef: EditSkillArtifactReference
  reflectionInspectionRequired: boolean
}): z.infer<typeof trackAllPrivacyQaReportSchema> {
  const inspection = pixelInspectionSchema.parse(input.inspection)
  if (
    inspection.sourceSha256 !== input.compiled.plan.sourceSha256 ||
    inspection.outputSha256 !== input.flattenedPreviewRef.sha256 ||
    input.flattenedPreviewRef.ownerUserId !== input.compiled.plan.ownerUserId ||
    input.flattenedPreviewRef.workspaceId !== input.compiled.plan.workspaceId ||
    input.flattenedPreviewRef.projectId !== input.compiled.plan.projectId
  )
    throw new Error('Privacy preview inspection lineage does not match the compiled plan.')
  const solid = input.compiled.recipe.treatment === 'solid_fill'
  const effectApplied = solid
    ? inspection.minimumMaskedOutputDarkPixelRatio >= 0.75 &&
      inspection.maximumMaskedOutputEdgeEnergyRatio <= 0.25 &&
      inspection.minimumMaskedMeanAbsoluteDelta >= 2
    : inspection.minimumMaskedMeanAbsoluteDelta >= 2 &&
      inspection.maximumMaskedOutputEdgeEnergyRatio <= 0.9
  const coveragePassed =
    inspection.everyExpectedPrivacyFrameCovered &&
    inspection.conservativeUncertaintyFramesCovered &&
    (!input.reflectionInspectionRequired || inspection.reflectionFramesCovered)
  const passed = effectApplied && coveragePassed
  const findings = [
    createSkillQaFinding({
      qaKey: 'track_all.output.privacy_flattened_preview',
      validatorVersion: 'track_all_privacy_pixel_validator_v1',
      disposition: passed ? 'pass' : 'critical',
      summary: passed
        ? 'The flattened private preview contains the fixed privacy effect over every authorized target frame.'
        : 'The flattened private preview did not prove fail-closed privacy coverage.',
      evidenceHashes: [inspection.inspectionHash, input.compiled.compilationEvidenceHash],
      observations: {
        treatment: input.compiled.recipe.treatment,
        minimumMaskedMeanAbsoluteDelta: inspection.minimumMaskedMeanAbsoluteDelta,
        maximumMaskedOutputEdgeEnergyRatio: inspection.maximumMaskedOutputEdgeEnergyRatio,
        minimumMaskedOutputDarkPixelRatio: inspection.minimumMaskedOutputDarkPixelRatio,
        everyExpectedPrivacyFrameCovered: inspection.everyExpectedPrivacyFrameCovered,
        conservativeUncertaintyFramesCovered: inspection.conservativeUncertaintyFramesCovered,
        reflectionFramesCovered: inspection.reflectionFramesCovered,
      },
    }),
  ]
  const core = {
    schemaVersion: 'track_all_privacy_qa_report_v1' as const,
    ownerUserId: input.compiled.plan.ownerUserId,
    workspaceId: input.compiled.plan.workspaceId,
    projectId: input.compiled.plan.projectId,
    editSessionId: input.compiled.plan.editSessionId,
    assignmentId: input.compiled.plan.assignmentId,
    assignmentHash: input.compiled.plan.assignmentHash,
    planHash: input.compiled.plan.planHash,
    manifestRef: input.compiled.plan.manifestRef,
    sourceSha256: input.compiled.plan.sourceSha256,
    authorizedRange: input.compiled.plan.authorizedRange,
    findings,
    disposition: passed ? ('pass' as const) : ('critical' as const),
    sensitiveExposureDetected: false as const,
    lostTrackWindowsCovered: true as const,
    reflectionsInspected: true as const,
    flattenedPreviewRef: input.flattenedPreviewRef,
  }
  if (!passed) {
    throw new Error(
      'Privacy QA failed closed; no accepted redaction result may be projected ' +
        `(treatment=${input.compiled.recipe.treatment};` +
        `delta=${inspection.minimumMaskedMeanAbsoluteDelta};` +
        `edgeRatio=${inspection.maximumMaskedOutputEdgeEnergyRatio};` +
        `darkRatio=${inspection.minimumMaskedOutputDarkPixelRatio};` +
        `coverage=${String(coveragePassed)}).`,
    )
  }
  return trackAllPrivacyQaReportSchema.parse({
    ...core,
    artifactHash: hashSkillValue(core),
  })
}

export function finalizeTrackAllPrivacyRedaction(input: {
  compiled: CompiledTrackAllPrivacyRedaction
  privateMediaRef: EditSkillArtifactReference
  privacyQaReport: z.input<typeof trackAllPrivacyQaReportSchema>
}): z.infer<typeof trackedRedactionResultSchema> {
  const qa = trackAllPrivacyQaReportSchema.parse(input.privacyQaReport)
  if (
    qa.disposition !== 'pass' ||
    qa.sensitiveExposureDetected !== false ||
    qa.flattenedPreviewRef.sha256 !== input.privateMediaRef.sha256 ||
    qa.planHash !== input.compiled.plan.planHash ||
    qa.assignmentHash !== input.compiled.plan.assignmentHash ||
    qa.sourceSha256 !== input.compiled.plan.sourceSha256 ||
    canonicalSkillJson(qa.authorizedRange) !==
      canonicalSkillJson(input.compiled.plan.authorizedRange)
  )
    throw new Error(
      'Privacy result finalization requires the exact independently passed flattened-preview QA.',
    )
  const planRef = referenceFor(
    'tracked_redaction_plan_v1',
    input.compiled.plan.artifactHash,
    input.compiled.plan,
  )
  const qaRef = referenceFor('track_all_privacy_qa_report_v1', qa.artifactHash, qa)
  const core = {
    schemaVersion: 'tracked_redaction_result_v1' as const,
    ...treatmentLineage(input.compiled.plan, input.compiled.plan.trackGraphRef),
    planRef,
    privateMediaRef: input.privateMediaRef,
    privacyQaRef: qaRef,
    noSensitiveExposure: true as const,
    publicArtifact: false as const,
  }
  return trackedRedactionResultSchema.parse({
    ...core,
    artifactHash: hashSkillValue(core),
  })
}

function assertPrivacyAuthorities(input: z.infer<typeof compilerInputSchema>): void {
  const graph = input.trackGraph
  if (
    input.privacyPolicy.ownerUserId !== graph.ownerUserId ||
    input.privacyPolicy.workspaceId !== graph.workspaceId ||
    input.privacyPolicy.projectId !== graph.projectId ||
    !input.privacyPolicy.allowedTreatments.includes(input.treatment) ||
    input.sourceTruth.sourceSha256 !== graph.sourceSha256 ||
    input.sourceTruth.fps !== graph.authorizedRange.fps ||
    input.sourceTruth.frameCount < graph.authorizedRange.endFrameExclusive ||
    graph.privateMaskDataPublished !== false ||
    graph.outsideAuthorizedRangeModified !== false
  )
    throw new Error(
      'Track All privacy authorities do not match the exact Track Graph, source, policy, and range.',
    )
}

function selectedTracks(graph: TrackGraphV2, ids: readonly string[]) {
  if (new Set(ids).size !== ids.length) throw new Error('Privacy target track IDs must be unique.')
  const tracks = ids.map((id) => graph.tracks.find((track) => track.trackId === id))
  if (tracks.some((track) => !track))
    throw new Error('Privacy target track is absent from the exact Track Graph.')
  return tracks as TrackGraphV2['tracks']
}

function visibilityAt(track: TrackGraphV2['tracks'][number], frame: number): string {
  return (
    track.visibilitySpans.find(
      (span) => frame >= span.startFrameInclusive && frame < span.endFrameExclusive,
    )?.state ?? 'lost'
  )
}

function pixelRegion(
  frame: number,
  box: z.infer<typeof normalizedBox>,
  sourceWidth: number,
  sourceHeight: number,
  dilation: number,
  evidenceKind: OfflineTrackAllPrivacyMaskRegion['evidenceKind'],
): OfflineTrackAllPrivacyMaskRegion {
  const left = Math.max(0, Math.floor(box.x * sourceWidth) - dilation)
  const top = Math.max(0, Math.floor(box.y * sourceHeight) - dilation)
  const right = Math.min(sourceWidth, Math.ceil((box.x + box.width) * sourceWidth) + dilation)
  const bottom = Math.min(sourceHeight, Math.ceil((box.y + box.height) * sourceHeight) + dilation)
  return {
    startFrameInclusive: frame,
    endFrameExclusive: frame + 1,
    x: left,
    y: top,
    width: Math.max(2, right - left),
    height: Math.max(2, bottom - top),
    evidenceKind,
  }
}

function fullFrameRegion(
  frame: number,
  width: number,
  height: number,
): OfflineTrackAllPrivacyMaskRegion {
  return {
    startFrameInclusive: frame,
    endFrameExclusive: frame + 1,
    x: 0,
    y: 0,
    width,
    height,
    evidenceKind: 'conservative_uncertainty_cover',
  }
}

function compressPrivacyRegions(
  values: readonly OfflineTrackAllPrivacyMaskRegion[],
): OfflineTrackAllPrivacyMaskRegion[] {
  const deduplicated = [
    ...new Map(
      values.map((value) => [
        [
          value.startFrameInclusive,
          value.endFrameExclusive,
          value.x,
          value.y,
          value.width,
          value.height,
          value.evidenceKind,
        ].join(':'),
        value,
      ]),
    ).values(),
  ].sort(regionOrder)
  const output: OfflineTrackAllPrivacyMaskRegion[] = []
  for (const region of deduplicated) {
    const previous = output.at(-1)
    if (
      previous &&
      previous.endFrameExclusive === region.startFrameInclusive &&
      previous.x === region.x &&
      previous.y === region.y &&
      previous.width === region.width &&
      previous.height === region.height &&
      previous.evidenceKind === region.evidenceKind
    ) {
      previous.endFrameExclusive = region.endFrameExclusive
    } else output.push({ ...region })
  }
  return output.sort(regionOrder)
}

function regionOrder(
  left: OfflineTrackAllPrivacyMaskRegion,
  right: OfflineTrackAllPrivacyMaskRegion,
): number {
  return (
    left.startFrameInclusive - right.startFrameInclusive ||
    left.endFrameExclusive - right.endFrameExclusive ||
    left.y - right.y ||
    left.x - right.x ||
    left.height - right.height ||
    left.width - right.width ||
    left.evidenceKind.localeCompare(right.evidenceKind)
  )
}

function regionsByOutputFrame(recipe: OfflineFfmpegTrackAllPrivacyRedactionPlanningPayload) {
  const frames = new Map<number, OfflineTrackAllPrivacyMaskRegion[]>()
  for (const region of recipe.maskRegions) {
    for (let frame = region.startFrameInclusive; frame < region.endFrameExclusive; frame += 1) {
      const outputFrame = frame - recipe.trimStartFrame
      frames.set(outputFrame, [...(frames.get(outputFrame) ?? []), region])
    }
  }
  return frames
}

function rasterizeRegions(
  regions: readonly OfflineTrackAllPrivacyMaskRegion[],
  width: number,
  height: number,
): Uint8Array {
  const mask = new Uint8Array(width * height)
  for (const region of regions) {
    for (let y = region.y; y < region.y + region.height; y += 1) {
      mask.fill(1, y * width + region.x, y * width + region.x + region.width)
    }
  }
  return mask
}

function comparePrivacyFrame(input: {
  source: Buffer
  output: Buffer
  frame: number
  frameByteLength: number
  width: number
  height: number
  mask: Uint8Array
}) {
  const offset = input.frame * input.frameByteLength
  let maskedDelta = 0
  let maskedChannels = 0
  let darkPixels = 0
  let maskedPixels = 0
  let sourceEdges = 0
  let outputEdges = 0
  let outsideAbsoluteDeltaTotal = 0
  let outsidePixelCount = 0
  for (let pixel = 0; pixel < input.width * input.height; pixel += 1) {
    const byte = offset + pixel * 3
    const inside = input.mask[pixel] === 1
    let delta = 0
    let outputLuma = 0
    for (let channel = 0; channel < 3; channel += 1) {
      delta += Math.abs(input.source[byte + channel]! - input.output[byte + channel]!)
      outputLuma += input.output[byte + channel]!
    }
    if (inside) {
      maskedDelta += delta
      maskedChannels += 3
      maskedPixels += 1
      if (outputLuma / 3 <= 32) darkPixels += 1
      if (pixel % input.width > 0) {
        const left = byte - 3
        for (let channel = 0; channel < 3; channel += 1) {
          sourceEdges += Math.abs(input.source[byte + channel]! - input.source[left + channel]!)
          outputEdges += Math.abs(input.output[byte + channel]! - input.output[left + channel]!)
        }
      }
    } else {
      outsideAbsoluteDeltaTotal += delta
      outsidePixelCount += 1
    }
  }
  if (maskedPixels === 0) throw new Error('Privacy preview inspection found an empty mask frame.')
  return {
    maskedMeanAbsoluteDelta: maskedDelta / maskedChannels,
    maskedOutputEdgeEnergyRatio: sourceEdges <= 0 ? 0 : outputEdges / sourceEdges,
    maskedOutputDarkPixelRatio: darkPixels / maskedPixels,
    outsideAbsoluteDeltaTotal,
    outsidePixelCount,
  }
}

function treatmentLineage(
  source: Pick<
    TrackGraphV2,
    | 'ownerUserId'
    | 'workspaceId'
    | 'projectId'
    | 'editSessionId'
    | 'assignmentId'
    | 'assignmentHash'
    | 'planHash'
    | 'manifestRef'
    | 'sourceSha256'
    | 'authorizedRange'
  >,
  trackGraphRef: EditSkillArtifactReference,
) {
  return {
    ownerUserId: source.ownerUserId,
    workspaceId: source.workspaceId,
    projectId: source.projectId,
    editSessionId: source.editSessionId,
    assignmentId: source.assignmentId,
    assignmentHash: source.assignmentHash,
    planHash: source.planHash,
    manifestRef: source.manifestRef,
    sourceSha256: source.sourceSha256,
    authorizedRange: source.authorizedRange,
    trackGraphRef,
  }
}

function referenceFor(
  artifactType: string,
  sha256: string,
  value: unknown,
): EditSkillArtifactReference {
  const scope = value as {
    ownerUserId: string
    workspaceId: string
    projectId: string
  }
  return {
    artifactType,
    sha256,
    byteLength: Buffer.byteLength(canonicalSkillJson(value)),
    ownerUserId: scope.ownerUserId,
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
  }
}

function minimum(values: readonly number[]): number {
  if (values.length === 0) throw new Error('Privacy preview inspection has no masked frames.')
  return Math.min(...values)
}

function maximum(values: readonly number[]): number {
  if (values.length === 0) throw new Error('Privacy preview inspection has no masked frames.')
  return Math.max(...values)
}
