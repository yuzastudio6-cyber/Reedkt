import { z } from 'zod'

import {
  CANONICAL_CAPTION_RENDERED_MEDIA_WORK_BINDING_VERSION,
  type CanonicalCaptionRenderedMediaWorkBinding,
} from '../../src/types/canonical-caption-rendered-media-work-binding'
import type {
  CanonicalCaptionSpecialistPlanningProjection,
} from '../../src/types/canonical-caption-specialist-planning'
import {
  CANONICAL_CAPTION_SPECIALIST_WORKER_CLASS,
} from '../../src/types/canonical-caption-specialist-execution'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import { stableAuthorityStringify } from
  '../services/private-edit-authority-store'
import {
  parseCanonicalCaptionSpecialistPlanningBinding,
} from './caption-canonical-work-planning'

const LIBASS_OPERATION = 'tool.libass.render_approved_caption_track.v1'
const REMOTION_OPERATION = 'tool.remotion.render_approved_composition.v1'
const FINAL_OPERATIONS = [
  'render_approved_source_caption_final',
  'render_approved_source_sequence_caption_final',
  'render_approved_source_caption_track_final',
  'render_approved_source_sequence_caption_track_final',
] as const

const safeKey = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: sha256,
}).strict()
const bindingWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_RENDERED_MEDIA_WORK_BINDING_VERSION),
  bindingId: safeKey,
  planningProjectionRef: refSchema,
  planningBindingRef: refSchema,
  outputId: safeKey,
  confirmedOutputFrame: z.object({
    frameRef: refSchema,
    width: z.number().int().min(320).max(16_384),
    height: z.number().int().min(180).max(16_384),
    fpsNumerator: z.number().int().positive().max(240_000),
    fpsDenominator: z.number().int().positive().max(10_000),
  }).strict(),
  masterTimingRef: refSchema,
  canonicalMasterTimingId: safeKey,
  renderSpecPlanningWorkItemKeys: z.array(safeKey).min(1).max(128),
  captionOverlays: z.array(z.object({
    workItemKey: safeKey,
    outputKey: safeKey,
    timingIds: z.array(safeKey).min(1).max(64),
    rendererLayerIds: z.array(safeKey).min(1).max(64),
    startFrame: z.number().int().nonnegative(),
    endFrameExclusive: z.number().int().positive(),
    structuredPayloadDigestSha256: sha256,
    captionTextDigestSha256: sha256,
  }).strict()).min(1).max(128),
  finalComposition: z.object({
    workItemKey: safeKey,
    operation: z.enum(FINAL_OPERATIONS),
    canonicalOperationId: z.literal(REMOTION_OPERATION),
    outputKey: safeKey,
    structuredPayloadDigestSha256: sha256,
    dependencyKeys: z.array(safeKey).min(2).max(128),
  }).strict(),
  captionRenderOwner: z.literal('libass'),
  finalCanvasOwner: z.literal('remotion'),
  captionOverlayPolicy: z.enum([
    'approved_full_frame_rgba',
    'approved_timed_full_frame_rgba_track',
  ]),
  captionAboveLivingFrame: z.literal(true),
  captionAboveControlledVisuals: z.literal(true),
  exactConfirmedFrameBound: z.literal(true),
  exactMasterTimingBound: z.literal(true),
  exactApprovedWorkGraphBound: z.literal(true),
  planningJobsClaimFinishedCaptionMedia: z.literal(false),
  browserWorkCreationAccepted: z.literal(false),
  directPeerDispatchGranted: z.literal(false),
  providerRuntimeAuthorityGranted: z.literal(false),
  assetMutationAuthorityGrantedToCaption: z.literal(false),
  finalQaApprovalAuthorityGranted: z.literal(false),
  billingAuthorityGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
const bindingSchema: z.ZodType<CanonicalCaptionRenderedMediaWorkBinding> =
  bindingWithoutDigestSchema.extend({ bindingDigestSha256: sha256 }).strict()

type FinalOperation = typeof FINAL_OPERATIONS[number]
interface CaptionRenderedMediaWorkItem {
  workItemKey: string
  workItemType: string
  workerClass: string
  executionInput: Record<string, unknown>
  expectedOutputs: Array<{
    outputKey: string
    artifactType?: string
    assetRole?: string
    contentType?: string
    required: boolean
    previewPlaceholderAllowed?: boolean
    timingIds?: string[]
    rendererLayerIds?: string[]
  }>
  dependencyKeys: string[]
  approvedToolIds: string[]
}

export function parseCanonicalCaptionRenderedMediaWorkBinding(
  value: unknown,
): CanonicalCaptionRenderedMediaWorkBinding {
  assertClosedContractTree(value, 'Canonical Caption rendered-media binding')
  const parsed = bindingSchema.parse(value)
  if (parsed.bindingDigestSha256 !== calculateSkillContractDigest(
    parsed as unknown as Record<string, unknown>, 'bindingDigestSha256')) {
    throw new Error('Canonical Caption rendered-media binding digest failed.')
  }
  assertUnique(parsed.renderSpecPlanningWorkItemKeys,
    'Caption render-spec work-item keys are duplicated.')
  assertUnique(parsed.captionOverlays.map((item) => item.workItemKey),
    'Caption overlay work-item keys are duplicated.')
  assertUnique(parsed.captionOverlays.map((item) => item.outputKey),
    'Caption overlay output keys are duplicated.')
  for (const overlay of parsed.captionOverlays) {
    if (overlay.endFrameExclusive <= overlay.startFrame) {
      throw new Error('Caption overlay timing is empty.')
    }
    assertUnique(overlay.timingIds,
      'Caption overlay timing lineage is duplicated.')
    assertUnique(overlay.rendererLayerIds,
      'Caption overlay renderer lineage is duplicated.')
  }
  assertUnique(parsed.finalComposition.dependencyKeys,
    'Caption final-composition dependencies are duplicated.')
  return structuredClone(parsed)
}

export function prepareCanonicalCaptionRenderedMediaWorkBinding(input: {
  projection: CanonicalCaptionSpecialistPlanningProjection | undefined
  planningBinding: unknown
  workItems: CaptionRenderedMediaWorkItem[]
}): CanonicalCaptionRenderedMediaWorkBinding | null {
  const projection = input.projection
  if (!projection || projection.disposition ===
    'no_caption_work_owner_restraint_preserved') return null
  const planningBinding = parseCanonicalCaptionSpecialistPlanningBinding(
    input.planningBinding)
  assertRef(projection.planningBindingRef, {
    id: planningBinding.bindingId,
    version: planningBinding.schemaVersion,
    contentHash: planningBinding.bindingDigestSha256,
  }, 'Caption planning projection crossed its planning binding.')
  if (projection.outputId !== planningBinding.canonicalScope.outputId) {
    throw new Error('Caption rendered-media output scope is crossed.')
  }

  const renderSpecPlanningWorkItems = input.workItems.filter((item) =>
    item.workerClass === CANONICAL_CAPTION_SPECIALIST_WORKER_CLASS
    && item.executionInput.operation ===
      'internal.run_approved_caption_specialist_job.v1'
    && item.executionInput.captionJobType === 'compile_caption_render_spec'
    && projection.projectedWorkItemKeys.includes(item.workItemKey))
  const expectedRenderSpecCount = projection.projectedJobTypes.filter(
    (jobType) => jobType === 'compile_caption_render_spec').length
  if (renderSpecPlanningWorkItems.length !== expectedRenderSpecCount
    || renderSpecPlanningWorkItems.length === 0) {
    throw new Error(
      'Caption rendered-media binding lost its exact render-spec planning jobs.',
    )
  }

  const overlayWorkItems = input.workItems.filter(isCaptionOverlayWorkItem)
  const finalWorkItems = input.workItems.filter(isDirectCaptionFinalWorkItem)
  if (overlayWorkItems.length === 0 || finalWorkItems.length === 0) return null
  if (finalWorkItems.length !== 1) {
    throw new Error('Caption rendered-media binding requires one final canvas owner.')
  }
  const finalWorkItem = finalWorkItems[0]!
  const finalPayload = record(finalWorkItem.executionInput.structuredPayload,
    'Caption final-composition payload')
  const width = positiveInteger(finalPayload.width, 'Caption final width')
  const height = positiveInteger(finalPayload.height, 'Caption final height')
  const fps = positiveInteger(finalPayload.fps, 'Caption final fps')
  const durationFrames = positiveInteger(
    finalPayload.durationFrames, 'Caption final duration')
  const frame = planningBinding.confirmedOutputFrame
  if (width !== frame.width || height !== frame.height
    || fps * frame.fpsDenominator !== frame.fpsNumerator
    || finalPayload.usesApprovedEditReservation !== true
    || finalPayload.requiresSeparateExportEstimate !== false
    || finalPayload.allowsAdditionalExportCharge !== false) {
    throw new Error(
      'Caption final composition is not bound to the exact confirmed frame and approved reservation.',
    )
  }
  const captionOverlayPolicy = finalPayload.captionOverlayPolicy
  if (captionOverlayPolicy !== 'approved_full_frame_rgba'
    && captionOverlayPolicy !== 'approved_timed_full_frame_rgba_track') {
    throw new Error('Caption final composition has an unsupported overlay policy.')
  }
  const cueByOutput = captionCueByOutput({
    payload: finalPayload,
    overlayPolicy: captionOverlayPolicy,
    durationFrames,
    overlays: overlayWorkItems,
  })
  const captionOverlays = overlayWorkItems.map((workItem) => {
    const payload = record(workItem.executionInput.structuredPayload,
      `Caption overlay ${workItem.workItemKey} payload`)
    const output = workItem.expectedOutputs[0]
    const caption = payload.caption
    if (workItem.expectedOutputs.length !== 1 || !output
      || typeof caption !== 'string' || caption.length === 0
      || payload.width !== width || payload.height !== height
      || payload.preserveSpeechTiming !== true
      || payload.collisionPolicy !== 'fail_on_reserved_zone_collision'
      || output.artifactType !== 'controlled_libass_caption_overlay_png'
      || output.assetRole !== 'processed'
      || output.contentType !== 'image/png'
      || !output.required || output.previewPlaceholderAllowed
      || !Array.isArray(output.timingIds) || output.timingIds.length === 0
      || !Array.isArray(output.rendererLayerIds)
      || output.rendererLayerIds.length === 0) {
      throw new Error(
        'Caption overlay lost exact text, frame, timing, layer, or artifact authority.',
      )
    }
    const cue = cueByOutput.get(output.outputKey)
    if (!cue) throw new Error('Caption overlay is absent from final composition.')
    return {
      workItemKey: workItem.workItemKey,
      outputKey: output.outputKey,
      timingIds: [...output.timingIds],
      rendererLayerIds: [...output.rendererLayerIds],
      startFrame: cue.startFrame,
      endFrameExclusive: cue.endFrameExclusive,
      structuredPayloadDigestSha256: calculateSkillContractDigest(
        payload, '__no_digest_field__'),
      captionTextDigestSha256: calculateSkillContractDigest(
        { caption }, '__no_digest_field__'),
    }
  }).sort((left, right) => left.startFrame - right.startFrame
    || left.workItemKey.localeCompare(right.workItemKey))
  if (captionOverlays.length !== cueByOutput.size) {
    throw new Error('Caption final composition contains an unbound overlay cue.')
  }
  const overlayKeys = new Set(captionOverlays.map((item) => item.workItemKey))
  if ([...overlayKeys].some((key) =>
    !finalWorkItem.dependencyKeys.includes(key))) {
    throw new Error('Caption final composition does not depend on every overlay.')
  }
  const finalOutput = finalWorkItem.expectedOutputs[0]
  if (finalWorkItem.expectedOutputs.length !== 1 || !finalOutput
    || finalOutput.assetRole !== 'final'
    || finalOutput.contentType !== 'video/mp4'
    || !finalOutput.required || finalOutput.previewPlaceholderAllowed
    || !Array.isArray(finalOutput.timingIds)
    || finalOutput.timingIds.length === 0) {
    throw new Error('Caption final canvas output authority is invalid.')
  }
  const sharedTimingIds = finalOutput.timingIds.filter((timingId) =>
    captionOverlays.every((overlay) => overlay.timingIds.includes(timingId)))
  if (sharedTimingIds.length !== 1) {
    throw new Error(
      'Caption overlays and final canvas require one exact shared MasterTiming identity.',
    )
  }
  const withoutDigest = bindingWithoutDigestSchema.parse({
    schemaVersion: CANONICAL_CAPTION_RENDERED_MEDIA_WORK_BINDING_VERSION,
    bindingId: `caption.rendered-media.${projection.projectionDigestSha256.slice(0, 40)}`,
    planningProjectionRef: {
      id: projection.projectionId,
      version: projection.schemaVersion,
      contentHash: projection.projectionDigestSha256,
    },
    planningBindingRef: projection.planningBindingRef,
    outputId: projection.outputId,
    confirmedOutputFrame: {
      frameRef: frame.confirmedOutputFrameRef,
      width: frame.width,
      height: frame.height,
      fpsNumerator: frame.fpsNumerator,
      fpsDenominator: frame.fpsDenominator,
    },
    masterTimingRef: planningBinding.masterTimingRef,
    canonicalMasterTimingId: sharedTimingIds[0],
    renderSpecPlanningWorkItemKeys: renderSpecPlanningWorkItems
      .map((item) => item.workItemKey).sort(),
    captionOverlays,
    finalComposition: {
      workItemKey: finalWorkItem.workItemKey,
      operation: finalWorkItem.executionInput.operation as FinalOperation,
      canonicalOperationId: REMOTION_OPERATION,
      outputKey: finalOutput.outputKey,
      structuredPayloadDigestSha256: calculateSkillContractDigest(
        finalPayload, '__no_digest_field__'),
      dependencyKeys: [...finalWorkItem.dependencyKeys],
    },
    captionRenderOwner: 'libass',
    finalCanvasOwner: 'remotion',
    captionOverlayPolicy,
    captionAboveLivingFrame: true,
    captionAboveControlledVisuals: true,
    exactConfirmedFrameBound: true,
    exactMasterTimingBound: true,
    exactApprovedWorkGraphBound: true,
    planningJobsClaimFinishedCaptionMedia: false,
    browserWorkCreationAccepted: false,
    directPeerDispatchGranted: false,
    providerRuntimeAuthorityGranted: false,
    assetMutationAuthorityGrantedToCaption: false,
    finalQaApprovalAuthorityGranted: false,
    billingAuthorityGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  })
  return parseCanonicalCaptionRenderedMediaWorkBinding({
    ...withoutDigest,
    bindingDigestSha256: calculateSkillContractDigest(
      { ...withoutDigest, bindingDigestSha256: '' },
      'bindingDigestSha256'),
  })
}

export function assertCanonicalCaptionRenderedMediaWorkBindingMatches(
  binding: CanonicalCaptionRenderedMediaWorkBinding,
  input: {
    projection: CanonicalCaptionSpecialistPlanningProjection
    planningBinding: unknown
    workItems: CaptionRenderedMediaWorkItem[]
  },
): void {
  const expected = prepareCanonicalCaptionRenderedMediaWorkBinding(input)
  if (!expected || stableAuthorityStringify(expected)
    !== stableAuthorityStringify(binding)) {
    throw new Error(
      'Canonical Caption rendered-media binding no longer matches its immutable work graph.',
    )
  }
}

function isCaptionOverlayWorkItem(item: CaptionRenderedMediaWorkItem): boolean {
  const operationIds = item.executionInput.approvedToolOperationIds
  return item.workItemType === 'custom'
    && item.workerClass === 'render_worker'
    && item.executionInput.operation === 'render_approved_caption_overlay'
    && item.approvedToolIds.length === 1
    && item.approvedToolIds[0] === 'libass'
    && Array.isArray(operationIds)
    && operationIds.length === 1
    && operationIds[0] === LIBASS_OPERATION
}

function isDirectCaptionFinalWorkItem(
  item: CaptionRenderedMediaWorkItem,
): boolean {
  const operation = item.executionInput.operation
  const operationIds = item.executionInput.approvedToolOperationIds
  return item.workItemType === 'render_final_export'
    && item.workerClass === 'render_worker'
    && typeof operation === 'string'
    && (FINAL_OPERATIONS as readonly string[]).includes(operation)
    && item.approvedToolIds.length === 1
    && item.approvedToolIds[0] === 'remotion'
    && Array.isArray(operationIds)
    && operationIds.length === 1
    && operationIds[0] === REMOTION_OPERATION
}

function captionCueByOutput(input: {
  payload: Record<string, unknown>
  overlayPolicy: CanonicalCaptionRenderedMediaWorkBinding['captionOverlayPolicy']
  durationFrames: number
  overlays: CaptionRenderedMediaWorkItem[]
}): Map<string, { startFrame: number; endFrameExclusive: number }> {
  if (input.overlayPolicy === 'approved_full_frame_rgba') {
    if (input.overlays.length !== 1
      || input.payload.captionOverlayCues !== undefined) {
      throw new Error('Single Caption overlay policy has crossed cue authority.')
    }
    const outputKey = input.overlays[0]?.expectedOutputs[0]?.outputKey
    if (!outputKey) throw new Error('Single Caption overlay output is missing.')
    return new Map([[outputKey, {
      startFrame: 0,
      endFrameExclusive: input.durationFrames,
    }]])
  }
  if (!Array.isArray(input.payload.captionOverlayCues)
    || input.payload.captionOverlayCues.length !== input.overlays.length) {
    throw new Error('Timed Caption overlay cues do not match overlay work.')
  }
  const cues = new Map<string, { startFrame: number; endFrameExclusive: number }>()
  let priorEnd = 0
  for (const value of input.payload.captionOverlayCues) {
    const cue = record(value, 'Caption final-composition cue')
    const outputKey = safeString(cue.outputKey, 'Caption cue output key')
    const startFrame = nonnegativeInteger(cue.startFrame, 'Caption cue start')
    const endFrameExclusive = positiveInteger(
      cue.endFrameExclusive, 'Caption cue end')
    if (startFrame < priorEnd || endFrameExclusive <= startFrame
      || endFrameExclusive > input.durationFrames || cues.has(outputKey)) {
      throw new Error('Caption final-composition cues are crossed or invalid.')
    }
    priorEnd = endFrameExclusive
    cues.set(outputKey, { startFrame, endFrameExclusive })
  }
  return cues
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} is invalid.`)
  }
  return value as Record<string, unknown>
}

function safeString(value: unknown, label: string): string {
  const parsed = safeKey.safeParse(value)
  if (!parsed.success) throw new Error(`${label} is invalid.`)
  return parsed.data
}

function nonnegativeInteger(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || Number(value) < 0) {
    throw new Error(`${label} is invalid.`)
  }
  return Number(value)
}

function positiveInteger(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || Number(value) < 1) {
    throw new Error(`${label} is invalid.`)
  }
  return Number(value)
}

function assertUnique(values: string[], message: string): void {
  if (new Set(values).size !== values.length) throw new Error(message)
}

function assertRef(
  left: { id: string; version: string; contentHash: string },
  right: { id: string; version: string; contentHash: string },
  message: string,
): void {
  if (left.id !== right.id || left.version !== right.version
    || left.contentHash !== right.contentHash) throw new Error(message)
}
