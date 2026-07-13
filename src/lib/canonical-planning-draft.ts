import type { ApprovedEditExecutionUploadedMediaSourceAssetClientInput } from './approved-edit-execution-package-client'
import type {
  AspectRatio,
  EditPlan,
  PlannerInput,
  TrimDecisionItem,
} from '../types/reeditpro'

export const CANONICAL_PRIVATE_PLAN_SCHEMA_VERSION = 'private-edit-authority-plan-v1' as const

const FFPROBE_OPERATION = 'tool.ffprobe.inspect_approved_media.v1'
const LIBASS_OPERATION = 'tool.libass.render_approved_caption_track.v1'
const REMOTION_OPERATION = 'tool.remotion.render_approved_composition.v1'
const SAFE_KEY = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/
const SHA256 = /^[a-f0-9]{64}$/
const SUPPORTED_PRIVATE_REVIEW_FRAMES = new Set(['405x720', '720x405'])
const FORBIDDEN_OUTBOUND_KEY = /^(?:secret|credential|accessToken|refreshToken|signedUrl|publicUrl|storagePath|localPath|absolutePath|relativePath|sourceBytes|bytesBase64|requestBody)$/i

type JsonRecord = Record<string, unknown>

export type CanonicalSourceAuthorityItem = {
  sourceSequenceItemId: string
  mediaAssetId: string
  uploadedOrder: number
  checksumSha256: string
  required: boolean
}

export type CanonicalPlanComponentsDraft = {
  compiledIntent: JsonRecord
  professionalEditingDirective: JsonRecord
  confirmedSettings: {
    aspectRatio: string
    outputFrame: { width: number; height: number; fps: number }
    outputFrameConfirmed: true
    sourceOrderConfirmed: true
    sourceCleanupConfirmed: true
    editLevel: 'basic' | 'pro' | 'premium'
    targetPlatform: string
    preferenceSnapshotId?: string
    preferenceRevision?: number
  }
  sourceSequence: CanonicalSourceAuthorityItem[]
  sourceCleanupSummary: {
    status: 'confirmed'
    cleanupPreference: string
    trimValidationStatus: 'passed' | 'warning'
    meaningValidationStatus: 'passed' | 'warning'
    userReviewRequired: false
  }
  sourceCleanupPlan: {
    status: 'confirmed'
    decisions: CanonicalSourceCleanupDecisionDraft[]
  }
  masterTimingPlan: JsonRecord
  captionVisualCueTimingPlan: JsonRecord
  soundSyncTransitionTimingPlan: JsonRecord
  timingValidationPlan: JsonRecord
  timingSummary: {
    validationStatus: 'passed' | 'warning'
    approvalBlocked: false
    fps: number
    totalFrames: number
  }
  segments: Array<{
    segmentId: string
    startFrame: number
    endFrameExclusive: number
    operationIds: string[]
  }>
  visualAssetPlan: JsonRecord
  rendererPlan: JsonRecord
  toolStrategyPlan: JsonRecord
  qaPlan: JsonRecord
  qaSummary: { status: 'passed' | 'warning'; approvalBlocked: false }
  providerPolicy: {
    veoPolicy: 'forbidden' | 'final_fallback_only'
    approvedRoutes: string[]
  }
  fallbackPolicy: JsonRecord
}

export type CanonicalSourceCleanupDecisionDraft = {
  decisionId: string
  sourceSequenceItemId: string
  action: 'keep' | 'cut' | 'tighten' | 'preserve' | 'move_to_broll' | 'use_as_voiceover' | 'use_as_proof' | 'use_as_alt_take'
  startFrame: number
  endFrameExclusive: number
  reason: string
  confidence: number
  meaningPreservationStatus: 'passed' | 'warning'
  userReviewStatus: 'not_required' | 'resolved'
}

export type CanonicalExpectedOutputDraft = {
  outputKey: string
  artifactType: string
  assetRole: 'processed' | 'generated' | 'qa' | 'preview' | 'final'
  required: boolean
  previewPlaceholderAllowed: boolean
  contentType?: string
  segmentIds: string[]
  timingIds: string[]
  rendererLayerIds: string[]
}

export type CanonicalWorkItemDraft = {
  workItemKey: string
  workItemType: 'validate_approved_snapshot' | 'prepare_source_trim' | 'custom' | 'render_final_export' | 'run_final_qa'
  workerClass: string
  executionInput: JsonRecord
  sourceSequenceItemIds: string[]
  sourceCleanupDecisionIds: string[]
  expectedOutputs: CanonicalExpectedOutputDraft[]
  dependencyKeys: string[]
  approvedToolIds: string[]
  approvedProviderRoute?: string
  providerExecutionMode: 'none'
  fallbackPolicy: JsonRecord
  maxAttempts: number
  attemptTimeoutSeconds: number
  scheduledDelaySeconds: number
  maximumCreditBudget: number
  required: boolean
}

export type CanonicalPlanDraft = {
  schemaVersion: typeof CANONICAL_PRIVATE_PLAN_SCHEMA_VERSION
  components: CanonicalPlanComponentsDraft
  estimate: {
    lineItems: Array<{
      lineKey: string
      label: string
      category: string
      estimatedCredits: number
      removable: boolean
      metadata: JsonRecord
    }>
    fallbackAllowanceCredits: number
    validForSeconds: number
  }
  workItems: CanonicalWorkItemDraft[]
}

export type CanonicalPlanningDraft = {
  orderedSourceItems: CanonicalSourceAuthorityItem[]
  components: CanonicalPlanComponentsDraft
  publication?: {
    canonicalPlan: CanonicalPlanDraft
    planningRequestIdSeed: string
  }
  publicationBlockers: string[]
  warnings: string[]
}

export type CanonicalPlanningDraftResult =
  | { ok: true; draft: CanonicalPlanningDraft }
  | { ok: false; errors: string[] }

export function buildCanonicalPlanningDraft(input: {
  plan: EditPlan
  plannerInput: PlannerInput
  sourceMediaAssets: ApprovedEditExecutionUploadedMediaSourceAssetClientInput[]
}): CanonicalPlanningDraftResult {
  const errors: string[] = []
  const { plan, plannerInput } = input
  const orderedSourceItems = buildSourceItems(input.sourceMediaAssets, plannerInput, errors)

  if (!plannerInput.aspectRatioConfirmed || plannerInput.aspectRatio === 'let_ai_decide') {
    errors.push('Confirm the output frame before saving this plan to the canonical workflow.')
  }
  if (!plannerInput.sourceOrderConfirmed) {
    errors.push('Confirm the source order before saving this plan to the canonical workflow.')
  }
  if (!plannerInput.cleanupPreferenceConfirmed || !plannerInput.cleanupPreference) {
    errors.push('Confirm source cleanup before saving this plan to the canonical workflow.')
  }
  if (!plan.masterTimingPlan || plan.masterTimingPlan.status !== 'ready') {
    errors.push('The frame-accurate timing plan must be ready before canonical planning can continue.')
  }
  if (!plan.timingValidationPlan || plan.timingValidationPlan.approvalBlocked) {
    errors.push('Resolve the blocking timing validation before canonical planning can continue.')
  }
  if (plan.trimReviewPlan?.approvalBlocked) {
    errors.push(plan.trimReviewPlan.approvalBlockReasons[0] ?? 'Resolve source meaning review before canonical planning can continue.')
  }
  if (!plan.compiledIntent || !plan.professionalEditingDirective) {
    errors.push('The plan must include compiled intent and professional editing direction.')
  }

  if (errors.length > 0 || !plan.masterTimingPlan || !plannerInput.cleanupPreference) {
    return { ok: false, errors: unique(errors) }
  }

  const fps = plan.masterTimingPlan.timingBase.fps
  const totalFrames = plan.masterTimingPlan.timingBase.totalFrames
  if (!Number.isInteger(totalFrames) || totalFrames <= 0 || !Number.isFinite(fps) || fps <= 0) {
    return { ok: false, errors: ['The approved timing base is not frame-safe.'] }
  }

  const cleanup = buildCleanupDecisions({
    plan,
    plannerInput,
    orderedSourceItems,
    sourceMediaAssets: input.sourceMediaAssets,
    fps,
  })
  if (!cleanup.ok) return cleanup

  const segments = buildSegments(plan, totalFrames)
  if (!segments.ok) return segments

  const frame = privatePlanningFrame(plannerInput.aspectRatio)
  const timingValidationPlan = plan.timingValidationPlan
  if (!timingValidationPlan) {
    return { ok: false, errors: ['The timing validation result is missing.'] }
  }
  const timingStatus = timingValidationPlan.overallStatus === 'warning' ? 'warning' : 'passed'
  const meaningStatus = plan.trimReviewPlan?.meaningPreservationValidationPlan.status === 'warning' ? 'warning' : 'passed'
  const preferenceSnapshotId = safeOptionalKey(plannerInput.preferenceSnapshotId)
  const preferenceRevision = Number.isInteger(plannerInput.currentEditPreferenceRevision) &&
    Number(plannerInput.currentEditPreferenceRevision) >= 0
    ? Number(plannerInput.currentEditPreferenceRevision)
    : undefined
  const toolStrategy = {
    schemaVersion: 'canonical-browser-tool-strategy-projection-v1',
    toolIds: ['libass', 'remotion', 'ffprobe'],
    exactOperationIds: [LIBASS_OPERATION, REMOTION_OPERATION, FFPROBE_OPERATION],
    plannedStrategy: toJsonRecord(plan.toolStrategyPlan, { status: 'not_provided' }),
    frontendExecutionAllowed: false,
  }

  const components: CanonicalPlanComponentsDraft = {
    compiledIntent: toJsonRecord(plan.compiledIntent, { goalSummary: plan.goalSummary }),
    professionalEditingDirective: toJsonRecord(plan.professionalEditingDirective, { mustFollowRules: ['Preserve source meaning.'] }),
    confirmedSettings: {
      aspectRatio: plannerInput.aspectRatio,
      outputFrame: { ...frame, fps },
      outputFrameConfirmed: true,
      sourceOrderConfirmed: true,
      sourceCleanupConfirmed: true,
      editLevel: plannerInput.editLevel,
      targetPlatform: plannerInput.targetPlatform,
      ...(preferenceSnapshotId ? { preferenceSnapshotId } : {}),
      ...(preferenceRevision !== undefined ? { preferenceRevision } : {}),
    },
    sourceSequence: orderedSourceItems.map((item) => ({ ...item })),
    sourceCleanupSummary: {
      status: 'confirmed',
      cleanupPreference: plannerInput.cleanupPreference,
      trimValidationStatus: plan.sourceCleanupPlan?.status === 'confirmed' ? 'passed' : 'warning',
      meaningValidationStatus: meaningStatus,
      userReviewRequired: false,
    },
    sourceCleanupPlan: { status: 'confirmed', decisions: cleanup.decisions },
    masterTimingPlan: toJsonRecord(plan.masterTimingPlan, { status: 'ready' }),
    captionVisualCueTimingPlan: toJsonRecord(plan.captionVisualCueTimingPlan, { status: 'not_needed' }),
    soundSyncTransitionTimingPlan: toJsonRecord(plan.soundSyncTransitionTimingPlan, { status: 'not_needed', speechPriority: true }),
    timingValidationPlan: toJsonRecord(timingValidationPlan, { overallStatus: timingStatus, approvalBlocked: false }),
    timingSummary: { validationStatus: timingStatus, approvalBlocked: false, fps, totalFrames },
    segments: segments.segments,
    visualAssetPlan: {
      status: (plan.visualAssetPlan?.length ?? 0) > 0 ? 'planned' : 'not_needed',
      assets: toJsonValue(plan.visualAssetPlan ?? []),
      randomBrollAllowed: false,
    },
    rendererPlan: {
      renderer: 'remotion',
      frameOwnedByRenderer: true,
      composition: toJsonValue(plan.rendererCompositionPlan ?? {}),
      strategy: toJsonValue(plan.renderStrategyPlan ?? {}),
    },
    toolStrategyPlan: toolStrategy,
    qaPlan: toJsonRecord(plan.editQAPlan, { checks: plan.qaChecks ?? [] }),
    qaSummary: { status: timingStatus, approvalBlocked: false },
    providerPolicy: {
      veoPolicy: plannerInput.editLevel === 'premium' ? 'final_fallback_only' : 'forbidden',
      approvedRoutes: [],
    },
    fallbackPolicy: {
      unapprovedFallbackAllowed: false,
      policy: toJsonValue(plan.agentQAFallbackPlan ?? {}),
    },
  }
  if (containsForbiddenOutboundMaterial(components)) {
    return {
      ok: false,
      errors: ['The plan contains private path, credential, or source-byte material that cannot cross the browser planning boundary.'],
    }
  }

  const publicationBlockers = privateReviewPublicationBlockers({
    plan,
    plannerInput,
    orderedSourceItems,
    sourceMediaAssets: input.sourceMediaAssets,
    frame,
    fps,
    totalFrames,
    cleanupDecision: cleanup.decisions[0],
    segments: segments.segments,
  })
  const publication = publicationBlockers.length === 0
    ? {
        canonicalPlan: buildPrivateReviewCanonicalPlan({
          plan,
          components,
          sourceItem: orderedSourceItems[0]!,
          cleanupDecision: cleanup.decisions[0]!,
          frame,
          fps: fps as 24 | 30,
          totalFrames,
        }),
        planningRequestIdSeed: safeKey(plan.planningInputTrace?.fingerprint ?? plan.planningContextTrace?.planningContextId ?? 'named-edit-plan', 'named-edit-plan'),
      }
    : undefined

  return {
    ok: true,
    draft: {
      orderedSourceItems,
      components,
      publication,
      publicationBlockers,
      warnings: publicationBlockers.length > 0
        ? ['The exact planning inputs can be saved, but the current private review runner cannot yet represent every approved plan requirement.']
        : [],
    },
  }
}

function buildSourceItems(
  sourceMediaAssets: ApprovedEditExecutionUploadedMediaSourceAssetClientInput[],
  plannerInput: PlannerInput,
  errors: string[],
): CanonicalSourceAuthorityItem[] {
  const durable = sourceMediaAssets
    .filter((asset) => asset.privateArtifact === true && asset.publicUrl === null && asset.signedUrl === null)
    .sort((left, right) => left.uploadedOrder - right.uploadedOrder)
  if (
    sourceMediaAssets.length === 0 ||
    sourceMediaAssets.length !== plannerInput.clips.length ||
    durable.length !== sourceMediaAssets.length
  ) {
    errors.push('Every source in the confirmed sequence must have a finalized private upload before canonical planning.')
    return []
  }

  const items = durable.flatMap((asset, index): CanonicalSourceAuthorityItem[] => {
    const sourceSequenceItemId = asset.sourceSequenceItemId?.trim() ?? ''
    const mediaAssetId = asset.mediaAssetId?.trim() ?? ''
    const checksumSha256 = asset.checksumSha256?.trim().toLowerCase() ?? ''
    const expectedClipId = plannerInput.clips[index]?.id
    if (
      asset.uploadedOrder !== index + 1 ||
      !expectedClipId ||
      asset.uploadedClipId !== expectedClipId ||
      !safeIdentity(sourceSequenceItemId) ||
      !safeIdentity(mediaAssetId) ||
      !SHA256.test(checksumSha256)
    ) {
      errors.push('The finalized source sequence contains an invalid identity, order, or checksum.')
      return []
    }
    return [{ sourceSequenceItemId, mediaAssetId, uploadedOrder: index + 1, checksumSha256, required: true }]
  })
  if (items.length !== durable.length || new Set(items.map((item) => item.sourceSequenceItemId)).size !== items.length ||
      new Set(items.map((item) => item.mediaAssetId)).size !== items.length) {
    errors.push('The finalized source sequence must use unique source and media identities.')
  }
  return items
}

function buildCleanupDecisions(input: {
  plan: EditPlan
  plannerInput: PlannerInput
  orderedSourceItems: CanonicalSourceAuthorityItem[]
  sourceMediaAssets: ApprovedEditExecutionUploadedMediaSourceAssetClientInput[]
  fps: number
}): { ok: true; decisions: CanonicalSourceCleanupDecisionDraft[] } | { ok: false; errors: string[] } {
  const decisions: CanonicalSourceCleanupDecisionDraft[] = []
  const errors: string[] = []
  if (!input.plan.sourceCleanupPlan || input.plan.sourceCleanupPlan.status !== 'confirmed') {
    return { ok: false, errors: ['The source cleanup plan must be confirmed before canonical planning.'] }
  }
  const planDecisions = input.plan.sourceCleanupPlan.decisions

  input.orderedSourceItems.forEach((sourceItem, index) => {
    const clip = input.plannerInput.clips[index]
    const asset = input.sourceMediaAssets.find((candidate) => candidate.uploadedOrder === sourceItem.uploadedOrder)
    const planDecision = planDecisions.find((decision) => decision.clipId === clip?.id || decision.clipId === asset?.uploadedClipId)
    if (!planDecision || !planDecision.reason.trim()) {
      errors.push(`The confirmed source cleanup decision for ${clip?.fileName ?? `source ${index + 1}`} is missing or has no reason.`)
      return
    }
    if (planDecision?.userReviewRequired || planDecision?.decision === 'needs_user_review' || planDecision?.decision === 'cannot_decide_mock') {
      errors.push(`Resolve the source cleanup review for ${clip?.fileName ?? `source ${index + 1}`} before canonical planning.`)
      return
    }
    const range = cleanupRange(planDecision, asset, input.fps)
    if (!range) {
      errors.push(`The source cleanup range for ${clip?.fileName ?? `source ${index + 1}`} is not frame-safe.`)
      return
    }
    decisions.push({
      decisionId: safeKey(planDecision?.id ?? `cleanup-source-${index + 1}`, `cleanup-source-${index + 1}`),
      sourceSequenceItemId: sourceItem.sourceSequenceItemId,
      action: canonicalCleanupAction(planDecision?.decision),
      startFrame: range.startFrame,
      endFrameExclusive: range.endFrameExclusive,
      reason: boundedText(planDecision.reason, 'Preserve the confirmed source range without changing its meaning.', 1_000),
      confidence: planDecision?.riskLevel === 'high' ? 0.7 : planDecision?.riskLevel === 'medium' ? 0.85 : 0.95,
      meaningPreservationStatus: planDecision?.riskLevel === 'high' ? 'warning' : 'passed',
      userReviewStatus: 'not_required',
    })
  })

  return errors.length > 0 ? { ok: false, errors: unique(errors) } : { ok: true, decisions }
}

function buildSegments(
  plan: EditPlan,
  totalFrames: number,
): { ok: true; segments: CanonicalPlanComponentsDraft['segments'] } | { ok: false; errors: string[] } {
  const timingSegments = plan.masterTimingPlan?.finalTimelineSegments ?? []
  const planSegments = new Map((plan.segmentEditPlans ?? []).map((segment) => [segment.id, segment]))
  const segments = timingSegments.map((segment, index) => {
    const startFrame = segment.finalRange.startFrame
    const endFrameExclusive = segment.finalRange.endFrame
    const segmentId = safeKey(segment.segmentId ?? segment.id, `segment-${index + 1}`)
    const operationIds = planSegments.get(segment.segmentId ?? '')?.operations.map((operation, operationIndex) =>
      safeKey(operation.id, `${segmentId}-operation-${operationIndex + 1}`)) ?? [`${segmentId}-operation`]
    return { segmentId, startFrame, endFrameExclusive, operationIds: unique(operationIds) }
  })
  if (segments.length === 0) {
    return { ok: true, segments: [{ segmentId: 'segment-1', startFrame: 0, endFrameExclusive: totalFrames, operationIds: ['segment-1-operation'] }] }
  }
  let previousEnd = 0
  for (const segment of segments) {
    if (!Number.isInteger(segment.startFrame) || !Number.isInteger(segment.endFrameExclusive) ||
        segment.startFrame < previousEnd || segment.endFrameExclusive <= segment.startFrame ||
        segment.endFrameExclusive > totalFrames) {
      return { ok: false, errors: ['The final timeline contains an overlapping or out-of-range segment.'] }
    }
    previousEnd = segment.endFrameExclusive
  }
  return { ok: true, segments }
}

function privateReviewPublicationBlockers(input: {
  plan: EditPlan
  plannerInput: PlannerInput
  orderedSourceItems: CanonicalSourceAuthorityItem[]
  sourceMediaAssets: ApprovedEditExecutionUploadedMediaSourceAssetClientInput[]
  frame: { width: number; height: number }
  fps: number
  totalFrames: number
  cleanupDecision?: CanonicalSourceCleanupDecisionDraft
  segments: CanonicalPlanComponentsDraft['segments']
}): string[] {
  const blockers: string[] = []
  const asset = input.sourceMediaAssets[0]
  const captionTiming = input.plan.masterTimingPlan?.captionTimingItems[0]
  const cleanupDecision = input.cleanupDecision
  if (input.orderedSourceItems.length !== 1) blockers.push('Private canonical review currently requires one finalized source video.')
  if (asset?.mimeType.toLowerCase() !== 'video/mp4') blockers.push('Private canonical review currently requires an MP4 source.')
  if (!asset || asset.byteSize < 64 || asset.byteSize > 16 * 1024 * 1024) blockers.push('Private canonical review currently supports source files up to 16 MB.')
  if (asset?.sourceMetadata?.probeStatus !== 'probed' || asset.sourceMetadata.hasVideo !== true) {
    blockers.push('Private canonical review requires verified video metadata before an execution candidate can be saved.')
  }
  if (!SUPPORTED_PRIVATE_REVIEW_FRAMES.has(`${input.frame.width}x${input.frame.height}`)) blockers.push('Private canonical review currently supports confirmed 9:16 or 16:9 frames.')
  if (![24, 30].includes(input.fps)) blockers.push('Private canonical review currently supports a 24fps or 30fps timing base.')
  if (input.totalFrames < 24 || input.totalFrames > 240) blockers.push('Private canonical review currently supports a frame-accurate review range between 1 and 8 seconds.')
  if (
    !cleanupDecision ||
    !['keep', 'preserve', 'tighten'].includes(cleanupDecision.action) ||
    cleanupDecision.endFrameExclusive - cleanupDecision.startFrame !== input.totalFrames
  ) {
    blockers.push('Private canonical review currently requires one continuous approved source range that exactly matches the final timing base.')
  }
  const sourceDurationFrames = durationFrames(asset?.sourceMetadata?.durationSeconds, input.fps)
  if (!cleanupDecision || sourceDurationFrames === undefined || cleanupDecision.endFrameExclusive > sourceDurationFrames) {
    blockers.push('The approved source range must fit inside the verified source duration.')
  }
  if (
    input.segments.length !== 1 ||
    input.segments[0]?.startFrame !== 0 ||
    input.segments[0]?.endFrameExclusive !== input.totalFrames
  ) {
    blockers.push('The current private review runner cannot yet execute a multi-segment or partial final timeline.')
  }
  if ((input.plan.visualAssetPlan?.length ?? 0) > 0) blockers.push('The planned visual assets need their exact canonical tool or provider work items before publication.')
  if ((input.plan.providerPromptPlans?.length ?? 0) > 0) blockers.push('Provider-backed plan items remain gated until their canonical work items are compiled.')
  if ((input.plan.masterTimingPlan?.captionTimingItems.length ?? 0) !== 1) blockers.push('The current private review proof requires one exact approved caption cue.')
  if (
    !captionTiming ||
    captionTiming.timeRange.startFrame !== 0 ||
    captionTiming.timeRange.endFrame !== input.totalFrames ||
    validatedCaption(captionTiming.captionText) === null
  ) {
    blockers.push('The current private review proof requires one safe caption that spans the exact final frame range.')
  }
  if ((input.plan.masterTimingPlan?.visualTimingItems.length ?? 0) > 0) blockers.push('Timed visual cues need their own canonical execution work items.')
  if ((input.plan.masterTimingPlan?.transitionTimingItems.length ?? 0) > 0) blockers.push('Timed transitions need their own canonical execution work items.')
  if ((input.plan.masterTimingPlan?.sfxTimingItems.length ?? 0) > 0) blockers.push('Sound-effect cues need their own canonical execution work items.')
  if ((input.plan.masterTimingPlan?.musicDuckingTimingItems.length ?? 0) > 0) blockers.push('Music ducking needs its own canonical audio work items.')
  if ((input.plan.masterTimingPlan?.providerClipTimingItems.length ?? 0) > 0) blockers.push('Provider clips need their own canonical execution work items.')
  if (hasUnrepresentedSegmentOperations(input.plan)) blockers.push('The planned edit includes operations outside the current source-and-caption private review runner.')
  if (hasUnrepresentedColorWork(input.plan)) blockers.push('The planned color work needs exact canonical processing work items.')
  if (hasUnrepresentedAudioWork(input.plan)) blockers.push('The planned audio work needs exact canonical processing work items.')
  return unique(blockers)
}

function buildPrivateReviewCanonicalPlan(input: {
  plan: EditPlan
  components: CanonicalPlanComponentsDraft
  sourceItem: CanonicalSourceAuthorityItem
  cleanupDecision: CanonicalSourceCleanupDecisionDraft
  frame: { width: number; height: number }
  fps: 24 | 30
  totalFrames: number
}): CanonicalPlanDraft {
  const segmentIds = input.components.segments.map((segment) => segment.segmentId)
  const timingId = safeKey(input.plan.masterTimingPlan?.id ?? 'master-timing-plan', 'master-timing-plan')
  const caption = validatedCaption(input.plan.masterTimingPlan?.captionTimingItems[0]?.captionText) ?? 'Private review'
  const panelBackground = safeColor(input.plan.aspectRatioFramePlan?.panelBackgroundColor)
  const estimate = buildEstimate(input.plan)
  const budgets = fitBudgets(estimate.lineItems.reduce((sum, item) => sum + item.estimatedCredits, 0) + estimate.fallbackAllowanceCredits)
  const sourceId = input.sourceItem.sourceSequenceItemId
  const cleanupId = input.cleanupDecision.decisionId

  const output = (
    outputKey: string,
    artifactType: string,
    assetRole: CanonicalExpectedOutputDraft['assetRole'],
    contentType: string,
    lineage: {
      segmentIds?: string[]
      timingIds?: string[]
      rendererLayerIds?: string[]
    } = {},
  ): CanonicalExpectedOutputDraft => ({
    outputKey,
    artifactType,
    assetRole,
    required: true,
    previewPlaceholderAllowed: false,
    contentType,
    segmentIds: lineage.segmentIds ?? [],
    timingIds: lineage.timingIds ?? [],
    rendererLayerIds: lineage.rendererLayerIds ?? [],
  })

  return {
    schemaVersion: CANONICAL_PRIVATE_PLAN_SCHEMA_VERSION,
    components: input.components,
    estimate,
    workItems: [
      {
        workItemKey: 'snapshot-validation', workItemType: 'validate_approved_snapshot', workerClass: 'authority_worker',
        executionInput: { operation: 'validate_snapshot_manifest' }, sourceSequenceItemIds: [], sourceCleanupDecisionIds: [],
        expectedOutputs: [output('snapshot-validation-evidence', 'authority_validation_evidence', 'qa', 'application/json')],
        dependencyKeys: [], approvedToolIds: [], providerExecutionMode: 'none', fallbackPolicy: {}, maxAttempts: 1,
        attemptTimeoutSeconds: 60, scheduledDelaySeconds: 0, maximumCreditBudget: budgets[0], required: true,
      },
      {
        workItemKey: 'source-trim-validation', workItemType: 'prepare_source_trim', workerClass: 'authority_worker',
        executionInput: { operation: 'validate_approved_source_trim_plan' },
        sourceSequenceItemIds: [sourceId], sourceCleanupDecisionIds: [cleanupId],
        expectedOutputs: [output(
          'source-trim-validation-evidence',
          'source_trim_validation_evidence',
          'qa',
          'application/json',
          { segmentIds, timingIds: [timingId] },
        )],
        dependencyKeys: ['snapshot-validation'], approvedToolIds: [], providerExecutionMode: 'none', fallbackPolicy: {}, maxAttempts: 1,
        attemptTimeoutSeconds: 120, scheduledDelaySeconds: 0, maximumCreditBudget: budgets[1], required: true,
      },
      {
        workItemKey: 'caption-overlay', workItemType: 'custom', workerClass: 'render_worker',
        executionInput: {
          operation: 'render_approved_caption_overlay', approvedToolOperationIds: [LIBASS_OPERATION],
          expectedOutputKeys: ['caption-overlay-png'], structuredPayload: {
            captionProfileId: 'approved_ass_track_render_v1', fontPackProfileId: 'reeditpro_reviewed_fonts_v1',
            collisionPolicy: 'fail_on_reserved_zone_collision', preserveSpeechTiming: true,
            width: input.frame.width, height: input.frame.height, timestampMs: 1_000,
            fontSize: input.frame.height >= 700 ? 42 : 34, marginV: 48, alignment: 2, caption,
          },
        },
        sourceSequenceItemIds: [], sourceCleanupDecisionIds: [],
        expectedOutputs: [output(
          'caption-overlay-png',
          'controlled_libass_caption_overlay_png',
          'processed',
          'image/png',
          { segmentIds, timingIds: [timingId], rendererLayerIds: ['caption-overlay-layer'] },
        )],
        dependencyKeys: [], approvedToolIds: ['libass'], providerExecutionMode: 'none', fallbackPolicy: {}, maxAttempts: 2,
        attemptTimeoutSeconds: 300, scheduledDelaySeconds: 0, maximumCreditBudget: budgets[2], required: true,
      },
      {
        workItemKey: 'final-export', workItemType: 'render_final_export', workerClass: 'render_worker',
        executionInput: {
          operation: 'render_approved_source_caption_final', approvedToolOperationIds: [REMOTION_OPERATION],
          expectedOutputKeys: ['final-export'], structuredPayload: {
            compositionProfileId: 'approved_source_caption_final_v1', width: input.frame.width, height: input.frame.height,
            fps: input.fps, durationFrames: input.totalFrames, sourceStartFrame: input.cleanupDecision.startFrame,
            sourceEndFrameExclusive: input.cleanupDecision.endFrameExclusive, sourceFit: 'contain',
            panelBackground, audioPolicy: 'preserve_source', captionOverlayPolicy: 'approved_full_frame_rgba',
          },
        },
        sourceSequenceItemIds: [sourceId], sourceCleanupDecisionIds: [cleanupId],
        expectedOutputs: [output(
          'final-export',
          'private_source_caption_final_video_export',
          'final',
          'video/mp4',
          { segmentIds, timingIds: [timingId], rendererLayerIds: ['source-video-layer', 'caption-overlay-layer'] },
        )],
        dependencyKeys: ['source-trim-validation', 'caption-overlay'], approvedToolIds: ['remotion'], providerExecutionMode: 'none', fallbackPolicy: {}, maxAttempts: 2,
        attemptTimeoutSeconds: 1_800, scheduledDelaySeconds: 0, maximumCreditBudget: budgets[3], required: true,
      },
      {
        workItemKey: 'final-qa', workItemType: 'run_final_qa', workerClass: 'qa_worker',
        executionInput: {
          operation: 'inspect_final_artifact', approvedToolOperationIds: [FFPROBE_OPERATION],
          expectedOutputKeys: ['final-qa-report'], structuredPayload: {
            inspectionProfileId: 'final_export_v1', countFrames: true, verifyDurationAndSync: true, emitMachineJsonOnly: true,
          },
        },
        sourceSequenceItemIds: [], sourceCleanupDecisionIds: [],
        expectedOutputs: [output(
          'final-qa-report',
          'final_qa_report',
          'qa',
          'application/json',
          { segmentIds, timingIds: [timingId], rendererLayerIds: ['source-video-layer', 'caption-overlay-layer'] },
        )],
        dependencyKeys: ['final-export'], approvedToolIds: ['ffprobe'], providerExecutionMode: 'none', fallbackPolicy: {}, maxAttempts: 2,
        attemptTimeoutSeconds: 300, scheduledDelaySeconds: 0, maximumCreditBudget: budgets[4], required: true,
      },
    ],
  }
}

function buildEstimate(plan: EditPlan): CanonicalPlanDraft['estimate'] {
  const lineItems = plan.creditEstimate.breakdown.map((item, index) => ({
    lineKey: safeKey(`${index + 1}-${item.label}`, `estimate-${index + 1}`),
    label: boundedText(item.label, `Estimate item ${index + 1}`, 160),
    category: index === 0 ? 'planning' : 'editing',
    estimatedCredits: Math.max(0, Math.round(item.credits)),
    removable: false,
    metadata: { reason: boundedText(item.reason, 'Included in the reviewed plan.', 1_000) },
  }))
  const itemTotal = lineItems.reduce((sum, item) => sum + item.estimatedCredits, 0)
  const expectedTotal = Math.max(1, Math.round(plan.creditEstimate.total))
  if (itemTotal < expectedTotal) {
    lineItems.push({
      lineKey: 'estimate-remainder', label: 'Remaining approved edit work', category: 'editing',
      estimatedCredits: expectedTotal - itemTotal, removable: false, metadata: { reason: 'Keeps the canonical estimate equal to the reviewed total.' },
    })
  }
  return {
    lineItems: lineItems.length > 0 ? lineItems : [{
      lineKey: 'edit-work', label: 'Approved edit work', category: 'editing', estimatedCredits: expectedTotal,
      removable: false, metadata: {},
    }],
    fallbackAllowanceCredits: Math.max(0, Math.round(plan.creditEstimate.fallbackAllowanceCredits ?? 0)),
    validForSeconds: 3_600,
  }
}

function fitBudgets(maximumCredits: number): [number, number, number, number, number] {
  const defaults: [number, number, number, number, number] = [1, 3, 1, 4, 2]
  if (maximumCredits >= 11) return defaults
  const budgets: [number, number, number, number, number] = [0, 0, 0, 0, 0]
  for (let index = 0; index < Math.max(0, maximumCredits); index += 1) budgets[index % budgets.length] += 1
  return budgets
}

function cleanupRange(
  decision: TrimDecisionItem | undefined,
  asset: ApprovedEditExecutionUploadedMediaSourceAssetClientInput | undefined,
  fps: number,
): { startFrame: number; endFrameExclusive: number } | null {
  const record = decision as unknown as Record<string, unknown> | undefined
  const selectedRange = isRecord(record?.selectedRange) ? record.selectedRange : undefined
  const sourceRange = isRecord(record?.sourceRange) ? record.sourceRange : undefined
  const range = selectedRange ?? sourceRange
  const startFrame = integerValue(range?.startFrame) ?? secondsFrame(range?.startSeconds, fps) ?? 0
  const endFrameExclusive = integerValue(range?.endFrameExclusive) ?? integerValue(range?.endFrame) ??
    secondsFrame(range?.endSeconds, fps) ?? durationFrames(asset?.sourceMetadata?.durationSeconds, fps)
  if (endFrameExclusive === undefined || !Number.isInteger(startFrame) || !Number.isInteger(endFrameExclusive) || startFrame < 0 || endFrameExclusive <= startFrame) return null
  return { startFrame, endFrameExclusive }
}

function canonicalCleanupAction(value: TrimDecisionItem['decision'] | undefined): CanonicalSourceCleanupDecisionDraft['action'] {
  if (value && ['keep', 'cut', 'tighten', 'preserve', 'move_to_broll', 'use_as_voiceover', 'use_as_proof', 'use_as_alt_take'].includes(value)) {
    return value as CanonicalSourceCleanupDecisionDraft['action']
  }
  return 'preserve'
}

function privatePlanningFrame(aspectRatio: AspectRatio): { width: number; height: number } {
  if (aspectRatio === '16:9') return { width: 720, height: 405 }
  if (aspectRatio === '1:1') return { width: 480, height: 480 }
  if (aspectRatio === '4:5') return { width: 480, height: 600 }
  if (aspectRatio === '4:3') return { width: 640, height: 480 }
  return { width: 405, height: 720 }
}

function validatedCaption(value: string | undefined): string | null {
  if (!value || value.length > 120 || value !== value.trim() || !/^[\x20-\x7E]+$/.test(value)) return null
  if (/[{}\\[\]]/.test(value) || /(?:https?:\/\/|file:|data:|javascript:|\.\.\/|\$\(|`|&&|\|\||#!)/i.test(value)) return null
  return value
}

function hasUnrepresentedSegmentOperations(plan: EditPlan): boolean {
  const supported = new Set(['trim', 'caption', 'frame_layout', 'renderer_layer', 'qa_check'])
  return (plan.segmentEditPlans ?? []).some((segment) =>
    segment.operations.some((operation) => !supported.has(operation.operationType)))
}

function hasUnrepresentedColorWork(plan: EditPlan): boolean {
  const color = plan.colorPipelinePlan
  return Boolean(color && (
    color.projectOperations.length > 0 ||
    color.clipPlans.some((clip) => clip.correctionOperations.length > 0 || clip.lookOperations.length > 0) ||
    color.assetMatchPlans.some((asset) => asset.operations.length > 0)
  ))
}

function hasUnrepresentedAudioWork(plan: EditPlan): boolean {
  const audio = plan.audioPipelinePlan
  return Boolean(audio && (
    audio.projectOperations.length > 0 ||
    audio.clipPlans.some((clip) => clip.cleanupOperations.length > 0 || clip.loudnessOperations.length > 0) ||
    audio.musicBedPlan.policy !== 'none' ||
    audio.sfxPlan.policy !== 'none' ||
    audio.sfxPlan.cues.length > 0 ||
    audio.beatSyncPlan.strategy !== 'none' ||
    audio.soundSyncCues.length > 0
  ))
}

function safeColor(value: string | undefined): string {
  const color = value?.trim().toUpperCase()
  return color && /^#[A-F0-9]{6}$/.test(color) ? color : '#000000'
}

function safeIdentity(value: string): boolean {
  return value.length <= 200 && value === value.trim() && SAFE_KEY.test(value) && !value.includes('..')
}

function safeOptionalKey(value: string | undefined): string | undefined {
  return value && safeIdentity(value) ? value : undefined
}

function safeKey(value: string, fallback: string): string {
  let normalized = value.trim().replace(/[^A-Za-z0-9._:-]+/g, '-').replace(/\.{2,}/g, '.').slice(0, 150)
  if (!/^[A-Za-z0-9]/.test(normalized)) normalized = `rp-${normalized}`
  normalized = normalized.replace(/[-.]+$/g, '')
  return safeIdentity(normalized) ? normalized : fallback
}

function boundedText(value: string | undefined, fallback: string, maximum: number): string {
  const normalized = value?.trim().replace(/\s+/g, ' ')
  return (normalized || fallback).slice(0, maximum)
}

function integerValue(value: unknown): number | undefined {
  return Number.isInteger(value) ? Number(value) : undefined
}

function secondsFrame(value: unknown, fps: number): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.round(value * fps) : undefined
}

function durationFrames(value: unknown, fps: number): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.max(1, Math.round(value * fps)) : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function containsForbiddenOutboundMaterial(value: unknown, key = ''): boolean {
  if (FORBIDDEN_OUTBOUND_KEY.test(key)) return true
  if (Array.isArray(value)) return value.some((entry) => containsForbiddenOutboundMaterial(entry))
  if (isRecord(value)) {
    return Object.entries(value).some(([childKey, child]) => containsForbiddenOutboundMaterial(child, childKey))
  }
  return false
}

function toJsonValue(value: unknown): unknown {
  try {
    return JSON.parse(JSON.stringify(value)) as unknown
  } catch {
    return {}
  }
}

function toJsonRecord(value: unknown, fallback: JsonRecord): JsonRecord {
  const serialized = toJsonValue(value)
  return isRecord(serialized) ? serialized : fallback
}

function unique(values: string[]): string[] {
  return [...new Set(values)]
}
