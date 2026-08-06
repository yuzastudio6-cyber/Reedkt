import type { TimelineManifest } from '../../../src/backend/contracts/timeline-manifest-contracts'
import { sha256AuthorityValue } from '../../services/private-edit-authority-store'
import { buildHyperframeTimelineBridge } from './hyperframe-timeline-bridge'
import type { HyperframeTimelineBridge } from './timeline-worker-types'

export const CANONICAL_HYPERFRAME_PREVIEW_HANDOFF_VERSION =
  'canonical-hyperframe-preview-handoff-boundary-v1' as const
export const CANONICAL_HYPERFRAME_PREVIEW_HANDOFF_OPERATION_ID =
  'tool.hyperframe.handoff_approved_preview_timeline.v1' as const
export const CANONICAL_HYPERFRAME_PREVIEW_HANDOFF_EVIDENCE_KEY =
  'hyperframe_approved_timeline_handoff_boundary_contract_verified_without_runtime_execution' as const

const SHA256_PATTERN = /^[a-f0-9]{64}$/
const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/

export interface CanonicalHyperframePreviewHandoffAuthority {
  authorityClass: 'server_derived_approved_timeline_handoff_contract'
  evidenceClass: 'source_verified_static_boundary_contract_only'
  workspaceId: string
  projectId: string
  editSessionId: string
  approvedPlanSnapshotId: string
  approvedPlanSnapshotHash: string
  approvedExecutionPackageId: string
  approvedExecutionPackageHash: string
  confirmedFrameAuthorityId: string
  confirmedFrameAuthorityRevision: number
  confirmedFrameAuthorityHash: string
  masterTimingPlanId: string
  masterTimingPlanVersion: number
  masterTimingPlanHash: string
  privateTimelineArtifactId: string
  privateTimelineArtifactHash: string
  privateTimelineQaReceiptId: string
  privateTimelineQaReceiptHash: string
  timelineQaPassed: true
  approvedSnapshotRepositoryReadbackVerified: false
  productionPersistenceVerified: false
}

export interface CanonicalHyperframePreviewHandoffInput {
  authority: CanonicalHyperframePreviewHandoffAuthority
  timelineManifest: TimelineManifest
  timelineManifestHash: string
}

export interface CanonicalHyperframePreviewHandoffBoundary {
  schemaVersion: typeof CANONICAL_HYPERFRAME_PREVIEW_HANDOFF_VERSION
  source: 'canonical_private_hyperframe_preview_handoff_boundary'
  evidenceClass: 'source_verified_static_boundary_contract_only'
  evidenceKey: typeof CANONICAL_HYPERFRAME_PREVIEW_HANDOFF_EVIDENCE_KEY
  toolId: 'hyperframe'
  operationId: typeof CANONICAL_HYPERFRAME_PREVIEW_HANDOFF_OPERATION_ID
  authority: {
    workspaceId: string
    projectId: string
    editSessionId: string
    approvedPlanSnapshotId: string
    approvedPlanSnapshotHash: string
    approvedExecutionPackageId: string
    approvedExecutionPackageHash: string
    confirmedFrameAuthorityId: string
    confirmedFrameAuthorityRevision: number
    confirmedFrameAuthorityHash: string
    masterTimingPlanId: string
    masterTimingPlanVersion: number
    masterTimingPlanHash: string
    privateTimelineArtifactId: string
    privateTimelineArtifactHash: string
    privateTimelineQaReceiptId: string
    privateTimelineQaReceiptHash: string
    timelineManifestId: string
    timelineManifestHash: string
  }
  handoff: HyperframeTimelineBridge
  boundaries: {
    readOnlyApprovedTimelineHandoff: true
    approvedSnapshotRequired: true
    privateTimelineQaRequired: true
    sourceMediaProcessingAllowed: false
    mediaBytesProjected: false
    storageObjectPathProjected: false
    signedUrlProjected: false
    rawChatProjected: false
    hiddenReasoningProjected: false
    providerPayloadProjected: false
    externalHyperframesRuntimeInvoked: false
    browserExecutionAuthorized: false
    finalRenderOrExportAuthorized: false
    customerPriceProjected: false
    customerCreditsProjected: false
    serviceFeeProjected: false
    billingMutationAuthorized: false
  }
  readiness: {
    privateInternalBoundaryContractReady: true
    privateInternalRunnerReady: false
    privateInternalEndToEndReady: false
    privateInternalJobAdapterReady: false
    mountedBrowserConsumerVerified: false
    productionImageQualified: false
    deployedReleaseQualified: false
    externalBetaReady: false
    productionReady: false
  }
  contentHash: string
  receiptHash: string
}

export function buildCanonicalHyperframePreviewHandoffBoundary(
  input: CanonicalHyperframePreviewHandoffInput,
): CanonicalHyperframePreviewHandoffBoundary {
  validateInput(input)

  const authority = input.authority
  const rawHandoff = buildHyperframeTimelineBridge(input.timelineManifest)
  const handoff = sanitizeBrowserHandoff(rawHandoff)
  const core = {
    schemaVersion: CANONICAL_HYPERFRAME_PREVIEW_HANDOFF_VERSION,
    source: 'canonical_private_hyperframe_preview_handoff_boundary' as const,
    evidenceClass: 'source_verified_static_boundary_contract_only' as const,
    evidenceKey: CANONICAL_HYPERFRAME_PREVIEW_HANDOFF_EVIDENCE_KEY,
    toolId: 'hyperframe' as const,
    operationId: CANONICAL_HYPERFRAME_PREVIEW_HANDOFF_OPERATION_ID,
    authority: {
      workspaceId: authority.workspaceId,
      projectId: authority.projectId,
      editSessionId: authority.editSessionId,
      approvedPlanSnapshotId: authority.approvedPlanSnapshotId,
      approvedPlanSnapshotHash: authority.approvedPlanSnapshotHash,
      approvedExecutionPackageId: authority.approvedExecutionPackageId,
      approvedExecutionPackageHash: authority.approvedExecutionPackageHash,
      confirmedFrameAuthorityId: authority.confirmedFrameAuthorityId,
      confirmedFrameAuthorityRevision: authority.confirmedFrameAuthorityRevision,
      confirmedFrameAuthorityHash: authority.confirmedFrameAuthorityHash,
      masterTimingPlanId: authority.masterTimingPlanId,
      masterTimingPlanVersion: authority.masterTimingPlanVersion,
      masterTimingPlanHash: authority.masterTimingPlanHash,
      privateTimelineArtifactId: authority.privateTimelineArtifactId,
      privateTimelineArtifactHash: authority.privateTimelineArtifactHash,
      privateTimelineQaReceiptId: authority.privateTimelineQaReceiptId,
      privateTimelineQaReceiptHash: authority.privateTimelineQaReceiptHash,
      timelineManifestId: input.timelineManifest.id,
      timelineManifestHash: input.timelineManifestHash,
    },
    handoff,
    boundaries: {
      readOnlyApprovedTimelineHandoff: true as const,
      approvedSnapshotRequired: true as const,
      privateTimelineQaRequired: true as const,
      sourceMediaProcessingAllowed: false as const,
      mediaBytesProjected: false as const,
      storageObjectPathProjected: false as const,
      signedUrlProjected: false as const,
      rawChatProjected: false as const,
      hiddenReasoningProjected: false as const,
      providerPayloadProjected: false as const,
      externalHyperframesRuntimeInvoked: false as const,
      browserExecutionAuthorized: false as const,
      finalRenderOrExportAuthorized: false as const,
      customerPriceProjected: false as const,
      customerCreditsProjected: false as const,
      serviceFeeProjected: false as const,
      billingMutationAuthorized: false as const,
    },
    readiness: {
      privateInternalBoundaryContractReady: true as const,
      privateInternalRunnerReady: false as const,
      privateInternalEndToEndReady: false as const,
      privateInternalJobAdapterReady: false as const,
      mountedBrowserConsumerVerified: false as const,
      productionImageQualified: false as const,
      deployedReleaseQualified: false as const,
      externalBetaReady: false as const,
      productionReady: false as const,
    },
  }
  const contentHash = sha256AuthorityValue(core)
  return deepFreeze({
    ...core,
    contentHash,
    receiptHash: sha256AuthorityValue({ ...core, contentHash }),
  })
}

export function validateCanonicalHyperframePreviewHandoffBoundary(
  value: CanonicalHyperframePreviewHandoffBoundary,
): CanonicalHyperframePreviewHandoffBoundary {
  if (value.schemaVersion !== CANONICAL_HYPERFRAME_PREVIEW_HANDOFF_VERSION) {
    throw new Error('Hyperframe preview handoff uses an unsupported schema version.')
  }
  if (
    value.source !== 'canonical_private_hyperframe_preview_handoff_boundary' ||
    value.evidenceClass !== 'source_verified_static_boundary_contract_only' ||
    value.evidenceKey !== CANONICAL_HYPERFRAME_PREVIEW_HANDOFF_EVIDENCE_KEY ||
    value.toolId !== 'hyperframe' ||
    value.operationId !== CANONICAL_HYPERFRAME_PREVIEW_HANDOFF_OPERATION_ID
  ) {
    throw new Error('Hyperframe preview handoff identity does not match the canonical boundary.')
  }
  validateProjectedBoundary(value)
  const { contentHash, receiptHash, ...core } = value
  if (!SHA256_PATTERN.test(contentHash) || contentHash !== sha256AuthorityValue(core)) {
    throw new Error('Hyperframe preview handoff content hash is invalid.')
  }
  if (!SHA256_PATTERN.test(receiptHash) || receiptHash !== sha256AuthorityValue({ ...core, contentHash })) {
    throw new Error('Hyperframe preview handoff receipt hash is invalid.')
  }
  return value
}

function validateInput(input: CanonicalHyperframePreviewHandoffInput): void {
  const authority = input.authority
  if (
    authority.authorityClass !== 'server_derived_approved_timeline_handoff_contract' ||
    authority.evidenceClass !== 'source_verified_static_boundary_contract_only' ||
    authority.approvedSnapshotRepositoryReadbackVerified !== false ||
    authority.productionPersistenceVerified !== false
  ) {
    throw new Error('Hyperframe preview handoff cannot claim live repository or production authority.')
  }
  for (const [name, value] of Object.entries({
    workspaceId: authority.workspaceId,
    projectId: authority.projectId,
    editSessionId: authority.editSessionId,
    approvedPlanSnapshotId: authority.approvedPlanSnapshotId,
    approvedExecutionPackageId: authority.approvedExecutionPackageId,
    confirmedFrameAuthorityId: authority.confirmedFrameAuthorityId,
    masterTimingPlanId: authority.masterTimingPlanId,
    privateTimelineArtifactId: authority.privateTimelineArtifactId,
    privateTimelineQaReceiptId: authority.privateTimelineQaReceiptId,
  })) {
    requireSafeId(value, name)
  }
  for (const [name, value] of Object.entries({
    approvedPlanSnapshotHash: authority.approvedPlanSnapshotHash,
    approvedExecutionPackageHash: authority.approvedExecutionPackageHash,
    confirmedFrameAuthorityHash: authority.confirmedFrameAuthorityHash,
    masterTimingPlanHash: authority.masterTimingPlanHash,
    privateTimelineArtifactHash: authority.privateTimelineArtifactHash,
    privateTimelineQaReceiptHash: authority.privateTimelineQaReceiptHash,
    timelineManifestHash: input.timelineManifestHash,
  })) {
    requireSha256(value, name)
  }
  requirePositiveInteger(authority.confirmedFrameAuthorityRevision, 'confirmedFrameAuthorityRevision')
  requirePositiveInteger(authority.masterTimingPlanVersion, 'masterTimingPlanVersion')
  if (authority.timelineQaPassed !== true) {
    throw new Error('Hyperframe preview handoff requires passed private timeline QA.')
  }

  const timeline = input.timelineManifest
  requireSafeId(timeline.id, 'timelineManifest.id')
  if (
    timeline.workspaceId !== authority.workspaceId ||
    timeline.projectId !== authority.projectId ||
    timeline.approvedSnapshotId !== authority.approvedPlanSnapshotId
  ) {
    throw new Error('Hyperframe preview handoff timeline scope does not match its authority.')
  }
  if (timeline.timelineFormat !== 'reeditpro_timeline') {
    throw new Error('Hyperframe preview handoff requires the canonical ReeditPro timeline format.')
  }
  if (input.timelineManifestHash !== sha256AuthorityValue(timeline)) {
    throw new Error('Hyperframe preview handoff timeline manifest hash is invalid.')
  }
  if (!Number.isFinite(timeline.durationSeconds) || timeline.durationSeconds <= 0) {
    throw new Error('Hyperframe preview handoff requires a positive finite timeline duration.')
  }
  if (timeline.clips.length < 1) {
    throw new Error('Hyperframe preview handoff requires at least one approved timeline clip.')
  }
  let priorTimelineEnd = 0
  for (const [index, clip] of timeline.clips.entries()) {
    requireSafeId(clip.id, `timeline.clips[${index}].id`)
    requireSafeId(clip.sourceMediaAssetId, `timeline.clips[${index}].sourceMediaAssetId`)
    validateRange(clip.sourceRange, `timeline.clips[${index}].sourceRange`)
    validateRange(clip.timelineRange, `timeline.clips[${index}].timelineRange`)
    if (clip.timelineRange.startSeconds < priorTimelineEnd) {
      throw new Error('Hyperframe preview handoff clips must be ordered without timeline overlap.')
    }
    if (clip.timelineRange.endSeconds > timeline.durationSeconds) {
      throw new Error('Hyperframe preview handoff clip exceeds the approved timeline duration.')
    }
    priorTimelineEnd = clip.timelineRange.endSeconds
  }
}

function sanitizeBrowserHandoff(raw: HyperframeTimelineBridge): HyperframeTimelineBridge {
  return {
    bridgeType: raw.bridgeType,
    timelineId: raw.timelineId,
    clips: raw.clips.map((clip, index) => ({
      clipId: clip.clipId,
      label: `Approved clip ${index + 1}`,
      sourceRangeSeconds: [...clip.sourceRangeSeconds] as [number, number],
      timelineRangeSeconds: [...clip.timelineRangeSeconds] as [number, number],
      reviewNotes: ['Read-only approved-timeline preview item.'],
    })),
    editDecisions: raw.editDecisions.map((decision) => ({
      clipId: decision.clipId,
      sourceRange: decision.sourceRange,
      timelineRange: decision.timelineRange,
    })),
    reviewNotes: ['Read-only approved-timeline preview handoff; final render and export remain separate gates.'],
  }
}

function validateProjectedBoundary(value: CanonicalHyperframePreviewHandoffBoundary): void {
  if (
    value.boundaries.readOnlyApprovedTimelineHandoff !== true ||
    value.boundaries.approvedSnapshotRequired !== true ||
    value.boundaries.privateTimelineQaRequired !== true ||
    Object.entries(value.boundaries)
      .filter(([key]) => ![
        'readOnlyApprovedTimelineHandoff',
        'approvedSnapshotRequired',
        'privateTimelineQaRequired',
      ].includes(key))
      .some(([, projected]) => projected !== false)
  ) {
    throw new Error('Hyperframe preview handoff crossed a closed boundary.')
  }
  if (
    value.readiness.privateInternalBoundaryContractReady !== true ||
    Object.entries(value.readiness)
      .filter(([key]) => key !== 'privateInternalBoundaryContractReady')
      .some(([, ready]) => ready !== false)
  ) {
    throw new Error('Hyperframe preview handoff fabricated executable or release readiness.')
  }
  if (value.handoff.bridgeType !== 'hyperframe_timeline_bridge' || value.handoff.clips.length < 1) {
    throw new Error('Hyperframe preview handoff projection is incomplete.')
  }
  const projected = JSON.stringify(value.handoff).toLowerCase()
  for (const forbidden of ['storageobjectpath', 'signedurl', 'rawchat', 'providerpayload', 'customercredits', 'servicefee']) {
    if (projected.includes(forbidden)) {
      throw new Error(`Hyperframe preview handoff projected forbidden field ${forbidden}.`)
    }
  }
}

function validateRange(
  range: { startSeconds: number; endSeconds: number },
  name: string,
): void {
  if (
    !Number.isFinite(range.startSeconds) ||
    !Number.isFinite(range.endSeconds) ||
    range.startSeconds < 0 ||
    range.endSeconds <= range.startSeconds
  ) {
    throw new Error(`${name} must be a positive, finite, ordered range.`)
  }
}

function requireSafeId(value: string, name: string): void {
  if (!SAFE_ID_PATTERN.test(value)) {
    throw new Error(`${name} must be a bounded opaque identifier.`)
  }
}

function requireSha256(value: string, name: string): void {
  if (!SHA256_PATTERN.test(value)) {
    throw new Error(`${name} must be a lowercase SHA-256 digest.`)
  }
}

function requirePositiveInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive safe integer.`)
  }
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const nested of Object.values(value as Record<string, unknown>)) deepFreeze(nested)
  }
  return value
}
