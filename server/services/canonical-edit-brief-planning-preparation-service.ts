import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import {
  editBriefAspectRatioSchema,
  editBriefFrameRateSchema,
} from '../validation/edit-brief-authority-schemas'
import type { CanonicalPlanComponentsInput } from '../validation/edit-planning-authority-schemas'
import type { SourceBindingManifestCandidate } from '../validation/source-media-authority-schemas'
import { createEditBriefAuthorityService } from './edit-brief-authority-service'
import {
  readPrivateEditBriefAuthorityAggregate,
  type PrivateEditBriefAuthorityAggregate,
} from './private-edit-brief-authority-store'
import type { CanonicalPlanningHandoffStoreScope } from './private-canonical-planning-handoff-store'
import { sha256AuthorityValue } from './private-edit-authority-store'

export interface CanonicalEditBriefPlanningPreparationResult {
  optionalBriefPresent: boolean
  aggregateRevision: number
  confirmedMarkerCount: number
  qaStatus: 'not_run' | 'passed' | 'warning' | 'needs_user_review' | 'blocked'
  planHintReadiness: 'not_created' | 'ready_for_planning' | 'needs_user_review' | 'blocked'
  sourceAuthorityVerified: boolean
}

/**
 * Seals the optional Edit Brief against the exact source and output-frame
 * authority already re-read by the canonical planning handoff.
 *
 * This is preparation only. It cannot confirm user markers, publish a plan,
 * reserve credits, execute a provider/tool, render, or deliver media.
 */
export async function prepareCanonicalEditBriefForPlanning(input: {
  context: ServiceContext
  scope: CanonicalPlanningHandoffStoreScope
  sourceCandidate: SourceBindingManifestCandidate
  components: CanonicalPlanComponentsInput
}): Promise<CanonicalEditBriefPlanningPreparationResult> {
  const storedAuthority = await readPrivateEditBriefAuthorityAggregate(input.scope)
  if (!storedAuthority) {
    return {
      optionalBriefPresent: false,
      aggregateRevision: 0,
      confirmedMarkerCount: 0,
      qaStatus: 'not_run',
      planHintReadiness: 'not_created',
      sourceAuthorityVerified: false,
    }
  }
  const service = createEditBriefAuthorityService(input.context)
  let current = await service.get(
    input.scope.workspaceId,
    input.scope.projectId,
    input.scope.editSessionId,
  )
  if (!current.authority?.brief) {
    return {
      optionalBriefPresent: false,
      aggregateRevision: current.aggregateRevision,
      confirmedMarkerCount: 0,
      qaStatus: 'not_run',
      planHintReadiness: 'not_created',
      sourceAuthorityVerified: false,
    }
  }
  if (input.sourceCandidate.schemaVersion !== 'private-source-binding-manifest-candidate-v1') {
    throw new ApiError(
      'JOB_DEPENDENCY_NOT_READY',
      'A timeline Edit Brief requires exact uploaded source authority.',
      503,
      { requiredGate: 'uploaded_source_authority_for_timeline_markers' },
    )
  }

  const frame = input.components.confirmedSettings.outputFrame
  const aspectRatio = editBriefAspectRatioSchema.parse(
    input.components.confirmedSettings.aspectRatio,
  )
  const frameRate = editBriefFrameRateSchema.parse(frame.fps)
  const confirmationDigest = sha256AuthorityValue({
    domain: 'canonical_edit_brief_output_frame_v1',
    workspaceId: input.scope.workspaceId,
    projectId: input.scope.projectId,
    editSessionId: input.scope.editSessionId,
    aspectRatio,
    width: frame.width,
    height: frame.height,
    frameRate,
    targetPlatform: input.components.confirmedSettings.targetPlatform,
  })
  const desiredExportSettings = {
    platformTarget: input.components.confirmedSettings.targetPlatform,
    aspectRatio,
    ...(aspectRatio === 'custom'
      ? { customWidth: frame.width, customHeight: frame.height }
      : {}),
    resolution: `${frame.width}x${frame.height}`,
    frameRate,
    confirmationStatus: 'confirmed' as const,
    confirmationId: `canonical-frame:${confirmationDigest.slice(0, 40)}`,
  }

  if (!sameExportSettings(current.authority.exportSettings, desiredExportSettings)) {
    await service.setExportSettings({
      workspaceId: input.scope.workspaceId,
      projectId: input.scope.projectId,
      editSessionId: input.scope.editSessionId,
      expectedRevision: current.aggregateRevision,
      idempotencyKey: `brief-frame:${confirmationDigest.slice(0, 48)}`,
      settings: desiredExportSettings,
    })
    current = await service.get(
      input.scope.workspaceId,
      input.scope.projectId,
      input.scope.editSessionId,
    )
  }

  const sourceAssetIds = input.sourceCandidate.bindings.map((binding) => binding.mediaAssetId)
  if (sourceAssetIds.length === 0 || sourceAssetIds.length > 64) {
    throw new ApiError(
      'JOB_DEPENDENCY_NOT_READY',
      'Edit Brief timeline preparation requires one to 64 exact source assets.',
      503,
      { sourceAssetCount: sourceAssetIds.length },
    )
  }
  const sourceDurationSeconds = Math.max(
    0.001,
    readSourceDurationSeconds(input.components.masterTimingPlan)
      ?? input.components.timingSummary.totalFrames / input.components.timingSummary.fps,
  )
  const sourceContext = {
    sourceAssetIds,
    sourceCandidateHashSha256: input.sourceCandidate.candidateHash,
    sourceSequenceHashSha256: input.sourceCandidate.sourceSequenceHash,
    sourceAuthorityRevision: input.sourceCandidate.authorityRevision,
    sourceDurationSeconds,
    sourceSequenceSummary:
      `${sourceAssetIds.length} exact private source item${sourceAssetIds.length === 1 ? '' : 's'} in confirmed uploaded order.`,
    runtimeState: 'metadata_only' as const,
  }

  if (!current.authority) {
    throw new ApiError(
      'JOB_DEPENDENCY_NOT_READY',
      'The canonical Edit Brief authority disappeared during planning preparation.',
      503,
      { requiredGate: 'stable_edit_brief_authority_during_planning_preparation' },
    )
  }
  const activeMarkers = current.authority.markers.filter((entry) => entry.status !== 'archived')
  for (const marker of activeMarkers) {
    const currentAuthority = current.authority
    if (!currentAuthority) {
      throw new ApiError(
        'JOB_DEPENDENCY_NOT_READY',
        'The canonical Edit Brief authority disappeared during marker preparation.',
        503,
        { requiredGate: 'stable_edit_brief_authority_during_marker_preparation' },
      )
    }
    const latestContext = [...currentAuthority.contextPackages]
      .reverse()
      .find((entry) => entry.markerId === marker.id)
    const contextIsCurrent = latestContext?.markerRevision === marker.revision
      && latestContext.sourceAuthorityStatus === 'verified_canonical_source_manifest'
      && latestContext.sourceContext.sourceCandidateHashSha256
        === input.sourceCandidate.candidateHash
      && latestContext.sourceContext.sourceSequenceHashSha256
        === input.sourceCandidate.sourceSequenceHash
    if (contextIsCurrent) continue

    const contextDigest = sha256AuthorityValue({
      domain: 'canonical_edit_brief_marker_context_v1',
      markerId: marker.id,
      markerRevision: marker.revision,
      sourceCandidateHash: input.sourceCandidate.candidateHash,
      confirmationDigest,
    })
    await service.buildMarkerContext({
      workspaceId: input.scope.workspaceId,
      projectId: input.scope.projectId,
      editSessionId: input.scope.editSessionId,
      markerId: marker.id,
      expectedRevision: current.aggregateRevision,
      idempotencyKey: `brief-context:${contextDigest.slice(0, 44)}`,
      sourceContext,
      nearbyWindowSeconds: 30,
    }, {
      sourceAuthorityStatus: 'verified_canonical_source_manifest',
    })
    current = await service.get(
      input.scope.workspaceId,
      input.scope.projectId,
      input.scope.editSessionId,
    )
  }

  const qaDigest = sha256AuthorityValue({
    domain: 'canonical_edit_brief_qa_v1',
    authorityRevision: current.aggregateRevision,
    sourceCandidateHash: input.sourceCandidate.candidateHash,
    confirmationDigest,
  })
  await service.runQa({
    workspaceId: input.scope.workspaceId,
    projectId: input.scope.projectId,
    editSessionId: input.scope.editSessionId,
    expectedRevision: current.aggregateRevision,
    idempotencyKey: `brief-qa:${qaDigest.slice(0, 48)}`,
  })
  current = await service.get(
    input.scope.workspaceId,
    input.scope.projectId,
    input.scope.editSessionId,
  )

  const latestExplicitUserInstruction = latestExplicitInstruction(
    input.components.compiledIntent,
  )
  const hintDigest = sha256AuthorityValue({
    domain: 'canonical_edit_brief_plan_hints_v1',
    authorityRevision: current.aggregateRevision,
    sourceCandidateHash: input.sourceCandidate.candidateHash,
    latestExplicitUserInstruction,
  })
  await service.createPlanHints({
    workspaceId: input.scope.workspaceId,
    projectId: input.scope.projectId,
    editSessionId: input.scope.editSessionId,
    expectedRevision: current.aggregateRevision,
    idempotencyKey: `brief-hints:${hintDigest.slice(0, 45)}`,
    latestExplicitUserInstruction,
    approvedProjectOverrides: [],
  })
  current = await service.get(
    input.scope.workspaceId,
    input.scope.projectId,
    input.scope.editSessionId,
  )
  const binding = current.authority
    ? (await service.getPublicationBinding(
        input.scope.workspaceId,
        input.scope.projectId,
        input.scope.editSessionId,
      )).binding
    : undefined

  return {
    optionalBriefPresent: true,
    aggregateRevision: current.aggregateRevision,
    confirmedMarkerCount: binding?.confirmedMarkerCount ?? 0,
    qaStatus: binding?.qaStatus ?? 'not_run',
    planHintReadiness: binding?.planHintReadiness ?? 'not_created',
    sourceAuthorityVerified: hasVerifiedCurrentSourceContexts(current.authority),
  }
}

function hasVerifiedCurrentSourceContexts(
  authority: PrivateEditBriefAuthorityAggregate | undefined,
): boolean {
  if (!authority) return false
  const latestByMarker = new Map<string, (typeof authority.contextPackages)[number]>()
  for (const contextPackage of authority.contextPackages) {
    const current = latestByMarker.get(contextPackage.markerId)
    if (!current || contextPackage.contextVersion > current.contextVersion) {
      latestByMarker.set(contextPackage.markerId, contextPackage)
    }
  }
  return authority.markers
    .filter((marker) => marker.status !== 'archived')
    .every((marker) => {
      const contextPackage = latestByMarker.get(marker.id)
      return Boolean(
        contextPackage
        && contextPackage.markerRevision === marker.revision
        && contextPackage.sourceAuthorityStatus === 'verified_canonical_source_manifest',
      )
    })
}

function readSourceDurationSeconds(masterTimingPlan: Record<string, unknown>): number | undefined {
  const timingBase = asRecord(masterTimingPlan.timingBase)
  const sourceDurationSeconds = timingBase?.sourceDurationSeconds
  return typeof sourceDurationSeconds === 'number'
    && Number.isFinite(sourceDurationSeconds)
    && sourceDurationSeconds > 0
    ? sourceDurationSeconds
    : undefined
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}

function sameExportSettings(
  current: {
    platformTarget: string
    aspectRatio: string
    customWidth?: number
    customHeight?: number
    resolution: string
    frameRate: number
    confirmationStatus: string
    confirmationId?: string
  } | undefined,
  desired: {
    platformTarget: string
    aspectRatio: string
    customWidth?: number
    customHeight?: number
    resolution: string
    frameRate: number
    confirmationStatus: string
    confirmationId?: string
  },
): boolean {
  return Boolean(
    current
    && current.platformTarget === desired.platformTarget
    && current.aspectRatio === desired.aspectRatio
    && current.customWidth === desired.customWidth
    && current.customHeight === desired.customHeight
    && current.resolution === desired.resolution
    && current.frameRate === desired.frameRate
    && current.confirmationStatus === desired.confirmationStatus
    && current.confirmationId === desired.confirmationId,
  )
}

function latestExplicitInstruction(
  compiledIntent: Record<string, unknown>,
): string | undefined {
  const explicit = compiledIntent.explicitInstructions
  if (Array.isArray(explicit)) {
    const latest = [...explicit].reverse().find(
      (entry): entry is string => typeof entry === 'string' && entry.trim().length > 0,
    )
    if (latest) return latest.trim().slice(0, 8_000)
  }
  return undefined
}
