import { createHash } from 'node:crypto'
import { z } from 'zod'

import {
  CAPTION_CURRENT_INTEGRATION_READINESS_VERSION,
  CAPTION_CURRENT_INTEGRATION_READINESS_VERSION_V2,
  CAPTION_CURRENT_INTEGRATION_READINESS_VERSION_V3,
  CAPTION_CURRENT_INTEGRATION_READINESS_VERSION_V4,
  type CaptionCurrentIntegrationGapState,
  type CaptionCurrentIntegrationGapStateV2,
  type CaptionCurrentIntegrationGapStateV3,
  type CaptionCurrentIntegrationReadiness,
  type CaptionCurrentIntegrationReadinessV2,
  type CaptionCurrentIntegrationReadinessV3,
  type CaptionCurrentIntegrationReadinessV4,
} from '../../src/types/caption-current-integration-readiness'
import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import {
  CAPTION_GOAL_COMPLETION_GAP_IDS,
} from '../../src/types/caption-goal-completion-audit'
import {
  CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_RESULT_VERSION,
} from '../../src/types/caption-direction-visual-review-authenticated-read'
import {
  CAPTION_SOUND_SUPPORT_RESULT_VERSION,
} from '../../src/types/caption-sound-support'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import {
  CAPTION_BROLL_OWNER_READ_ADAPTER_RECEIPT,
} from './caption-broll-owner-read-adapter'
import {
  CAPTION_CANONICAL_SPECIALIST_RESUME_READ_ADAPTER_RECEIPT,
} from './caption-canonical-specialist-resume-read'
import {
  CAPTION_CANONICAL_TRACK_ALL_EVIDENCE_READ_RECEIPT,
} from './caption-canonical-track-all-evidence-read'
import {
  CAPTION_TRACK_ALL_EVIDENCE_FINALIZATION_ADAPTER_RECEIPT,
} from './caption-track-all-evidence-finalization-adapter'
import {
  CAPTION_CANONICAL_TRANSCRIPT_AUTHENTICATED_READ_ADAPTER_RECEIPT,
} from './caption-canonical-transcript-authenticated-read'
import {
  CAPTION_CANONICAL_VISUAL_INTELLIGENCE_EVIDENCE_READ_RECEIPT,
} from './caption-canonical-visual-intelligence-evidence-read'
import {
  CAPTION_POST_CAP20_GOAL_COMPLETION_AUDIT,
} from './caption-goal-completion-audit'
import {
  CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST,
} from './captions-specialist-integration-manifest'
import {
  CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT,
} from './captions-specialist-integration-qualification'

const safeKey = z.string().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: sha256,
}).strict()
const ownerSchema = z.enum([
  'captions', 'backend_workflow', 'canonical_transcript',
  'visual_intelligence', 'track_all', 'soundsync', 'broll_owner',
  'canonical_postrender_visual_qa', 'canonical_private_review',
])
const gapSchema: z.ZodType<CaptionCurrentIntegrationGapState> = z.object({
  gapId: z.enum(CAPTION_GOAL_COMPLETION_GAP_IDS),
  ownerKeys: z.array(ownerSchema).min(1).max(3),
  captionImplementationState: z.enum([
    'caption_consumer_source_complete', 'caption_contract_source_complete',
    'caption_terminal_projection_deferred', 'external_owner_only',
  ]),
  canonicalOwnerState: z.enum([
    'canonical_mount_missing', 'actual_owner_evidence_missing',
    'canonical_adapter_and_owner_result_missing',
    'authenticated_owner_result_missing',
    'canonical_execution_mount_missing',
    'qualified_complete_time_review_missing',
    'independent_final_qa_missing',
    'deferred_until_terminal_dependencies',
  ]),
  sourceEvidenceRefs: z.array(refSchema).min(1).max(6),
  captionSourceImplementationComplete: z.boolean(),
  actualCanonicalOwnerRecordConsumed: z.literal(false),
  liveOwnerRuntimeEvidenceConsumed: z.literal(false),
  blocksTerminalStatus: z.literal(true),
  captionMayImplementDuplicateOwner: z.literal(false),
  runtimeOrDispatchAuthorityGrantedByReadiness: z.literal(false),
}).strict()

const readinessSchema: z.ZodType<CaptionCurrentIntegrationReadiness> = z.object({
  schemaVersion: z.literal(CAPTION_CURRENT_INTEGRATION_READINESS_VERSION),
  readinessId: safeKey,
  readinessDigestSha256: sha256,
  observedAt: z.string().datetime({ offset: true }),
  supersedesFrozenAudit: z.literal(false),
  sourceFrozenGoalAuditRef: refSchema,
  sourceIntegrationManifestRef: refSchema,
  sourceIntegrationQualificationRef: refSchema,
  sourceCanonicalResumeAdapterRef: refSchema,
  counts: z.object({
    declaredCaptionJobs: z.literal(41),
    captionOwnedSharedOwnerBoundariesComplete: z.literal(5),
    strictAuthenticatedMultiOwnerSourceFixturePaths: z.literal(1),
    actualAuthenticatedPrivateSharedOwnerIntegrations: z.literal(0),
    canonicalBackendExecutionMounts: z.literal(0),
    remainingTerminalGaps: z.literal(9),
  }).strict(),
  currentEvidence: z.object({
    captionOwnedFeatureSurfaceComplete: z.literal(true),
    captionOwnedSharedOwnerContractsComplete: z.literal(true),
    strictTypedOwnerAdmissionImplemented: z.literal(true),
    priorOwnerCanonicalRereadImplemented: z.literal(true),
    referenceOnlyOwnerEvidenceRejected: z.literal(true),
    strictMultiOwnerSourceFixtureCompleted: z.literal(true),
    liveProviderOrGpuRuntimeRelabeledFromFixture: z.literal(false),
    actualCanonicalResumeRecordConsumed: z.literal(false),
    canonicalBackendPrivateExecutionMounted: z.literal(false),
    qualifiedAiCompleteTimeVisualReviewIntegrated: z.literal(false),
    independentFinalQaRereadIntegrated: z.literal(false),
    terminalPerJobProjectionPublished: z.literal(false),
  }).strict(),
  gapStates: z.array(gapSchema).length(9),
  currentStatus: z.literal(
    'caption_owned_integration_surface_complete_waiting_on_canonical_mounts'),
  targetTerminalStatus: z.literal(
    'caption_specialist_private_internal_qualified'),
  terminalStatusClaimed: z.literal(false),
  publicProductionRequiredForTerminalStatus: z.literal(false),
  centralOrchestraRequiredForTerminalStatus: z.literal(false),
  centralOrchestraImplemented: z.literal(false),
  browserLocalCompletionAccepted: z.literal(false),
  sourceFixtureRelabeledAsActualOwnerRuntime: z.literal(false),
  technicalQaRelabeledAsVisualAiReview: z.literal(false),
  operationDispatchAuthority: z.literal(false),
  providerOrModelRuntimeAuthority: z.literal(false),
  assetMutationAuthority: z.literal(false),
  finalQaApprovalAuthority: z.literal(false),
  creditOrBillingAuthority: z.literal(false),
  publicDeliveryAuthority: z.literal(false),
  productionAuthority: z.literal(false),
}).strict()

const gapSchemaV2: z.ZodType<CaptionCurrentIntegrationGapStateV2> = z.object({
  gapId: z.enum(CAPTION_GOAL_COMPLETION_GAP_IDS),
  ownerKeys: z.array(ownerSchema).min(1).max(3),
  sourceIntegrationState: z.enum([
    'source_mount_complete_waiting_on_private_evidence',
    'terminal_projection_contract_complete_waiting_on_private_evidence',
  ]),
  sourceEvidenceRefs: z.array(refSchema).min(1).max(6),
  captionSourceImplementationComplete: z.literal(true),
  canonicalSourceMountImplemented: z.literal(true),
  actualCanonicalOwnerRecordConsumed: z.literal(false),
  liveOwnerRuntimeEvidenceConsumed: z.literal(false),
  blocksTerminalStatus: z.literal(true),
  captionMayImplementDuplicateOwner: z.literal(false),
  runtimeOrDispatchAuthorityGrantedByReadiness: z.literal(false),
}).strict()

const readinessSchemaV2: z.ZodType<CaptionCurrentIntegrationReadinessV2> =
z.object({
  schemaVersion: z.literal(CAPTION_CURRENT_INTEGRATION_READINESS_VERSION_V2),
  readinessId: safeKey,
  readinessDigestSha256: sha256,
  observedAt: z.string().datetime({ offset: true }),
  supersedesFrozenAudit: z.literal(false),
  supersedesReadinessRef: refSchema,
  sourceFrozenGoalAuditRef: refSchema,
  sourceIntegrationManifestRef: refSchema,
  sourceIntegrationQualificationRef: refSchema,
  sourceCanonicalResumeAdapterRef: refSchema,
  counts: z.object({
    declaredCaptionJobs: z.literal(41),
    captionOwnedSharedOwnerBoundariesComplete: z.literal(5),
    canonicalSharedOwnerSourceMounts: z.literal(5),
    canonicalBackendExecutionMounts: z.literal(1),
    postrenderAndPrivateReviewSourceMounts: z.literal(2),
    terminalProjectionContractsPublished: z.literal(1),
    actualAuthenticatedPrivateSharedOwnerIntegrations: z.literal(0),
    remainingPrivateEvidenceGaps: z.literal(9),
  }).strict(),
  currentEvidence: z.object({
    captionOwnedFeatureSurfaceComplete: z.literal(true),
    captionOwnedSharedOwnerContractsComplete: z.literal(true),
    canonicalTranscriptExecutionMountImplemented: z.literal(true),
    visualIntelligenceSupportResumeMountImplemented: z.literal(true),
    trackAllSupportResumeMountImplemented: z.literal(true),
    soundSyncSupportResumeMountImplemented: z.literal(true),
    brollSupportResumeMountImplemented: z.literal(true),
    canonicalBackendPrivateExecutionMountImplemented: z.literal(true),
    postrenderVisualQaPersistenceAndReadMountImplemented: z.literal(true),
    independentPrivateReviewProjectionImplemented: z.literal(true),
    terminalPerJobProjectionContractPublished: z.literal(true),
    actualCanonicalResumeRecordConsumed: z.literal(false),
    actualPrivateOwnerRuntimeEvidenceConsumed: z.literal(false),
    qualifiedAiCompleteTimeVisualReviewConsumed: z.literal(false),
    independentFinalQaDecisionConsumed: z.literal(false),
  }).strict(),
  gapStates: z.array(gapSchemaV2).length(9),
  currentStatus: z.literal(
    'source_integration_complete_waiting_on_private_runtime_evidence'),
  targetTerminalStatus: z.literal(
    'caption_specialist_private_internal_qualified'),
  terminalStatusClaimed: z.literal(false),
  publicProductionRequiredForTerminalStatus: z.literal(false),
  centralOrchestraRequiredForTerminalStatus: z.literal(false),
  centralOrchestraImplemented: z.literal(false),
  browserLocalCompletionAccepted: z.literal(false),
  sourceFixtureRelabeledAsActualOwnerRuntime: z.literal(false),
  technicalQaRelabeledAsVisualAiReview: z.literal(false),
  operationDispatchAuthority: z.literal(false),
  providerOrModelRuntimeAuthority: z.literal(false),
  assetMutationAuthority: z.literal(false),
  finalQaApprovalAuthority: z.literal(false),
  creditOrBillingAuthority: z.literal(false),
  publicDeliveryAuthority: z.literal(false),
  productionAuthority: z.literal(false),
}).strict()

const gapSchemaV3: z.ZodType<CaptionCurrentIntegrationGapStateV3> = z.object({
  gapId: z.enum(CAPTION_GOAL_COMPLETION_GAP_IDS),
  ownerKeys: z.array(ownerSchema).min(1).max(3),
  sourceIntegrationState: z.enum([
    'canonical_source_mount_complete_waiting_on_private_evidence',
    'caption_bridge_complete_waiting_on_canonical_owner_mount',
    'terminal_projection_contract_complete_waiting_on_private_evidence',
  ]),
  sourceEvidenceRefs: z.array(refSchema).min(1).max(6),
  captionSourceImplementationComplete: z.literal(true),
  captionBridgeImplementationComplete: z.literal(true),
  canonicalSourceMountImplemented: z.boolean(),
  actualCanonicalOwnerRecordConsumed: z.literal(false),
  liveOwnerRuntimeEvidenceConsumed: z.literal(false),
  blocksTerminalStatus: z.literal(true),
  captionMayImplementDuplicateOwner: z.literal(false),
  runtimeOrDispatchAuthorityGrantedByReadiness: z.literal(false),
}).strict()

const readinessSchemaV3: z.ZodType<CaptionCurrentIntegrationReadinessV3> =
z.object({
  schemaVersion: z.literal(CAPTION_CURRENT_INTEGRATION_READINESS_VERSION_V3),
  readinessId: safeKey,
  readinessDigestSha256: sha256,
  observedAt: z.string().datetime({ offset: true }),
  supersedesFrozenAudit: z.literal(false),
  correctsSupersededReadinessOverclaim: z.literal(true),
  supersedesReadinessRef: refSchema,
  sourceFrozenGoalAuditRef: refSchema,
  sourceIntegrationManifestRef: refSchema,
  sourceIntegrationQualificationRef: refSchema,
  sourceCanonicalResumeAdapterRef: refSchema,
  counts: z.object({
    declaredCaptionJobs: z.literal(41),
    captionOwnedSharedOwnerBoundariesComplete: z.literal(5),
    captionSharedOwnerBridgeImplementations: z.literal(5),
    canonicalSharedOwnerCompositionMounts: z.literal(3),
    sharedOwnerCompositionMountGaps: z.literal(2),
    canonicalBackendExecutionMounts: z.literal(1),
    postrenderAndPrivateReviewSourceMounts: z.literal(2),
    terminalProjectionContractsPublished: z.literal(2),
    actualAuthenticatedPrivateSharedOwnerIntegrations: z.literal(0),
    remainingPrivateEvidenceGaps: z.literal(9),
  }).strict(),
  currentEvidence: z.object({
    captionOwnedFeatureSurfaceComplete: z.literal(true),
    captionOwnedSharedOwnerContractsComplete: z.literal(true),
    canonicalTranscriptExecutionMountImplemented: z.literal(true),
    visualIntelligenceSupportResumeMountImplemented: z.literal(true),
    trackAllSupportResumeMountImplemented: z.literal(true),
    soundSyncSupportBridgeImplemented: z.literal(true),
    soundSyncCanonicalOwnerMountImplemented: z.literal(false),
    brollSupportBridgeImplemented: z.literal(true),
    brollCanonicalOwnerMountImplemented: z.literal(false),
    canonicalBackendPrivateExecutionMountImplemented: z.literal(true),
    postrenderVisualQaPersistenceAndReadMountImplemented: z.literal(true),
    independentPrivateReviewProjectionImplemented: z.literal(true),
    terminalPerJobProjectionContractPublished: z.literal(true),
    actualCanonicalResumeRecordConsumed: z.literal(false),
    actualPrivateOwnerRuntimeEvidenceConsumed: z.literal(false),
    qualifiedAiCompleteTimeVisualReviewConsumed: z.literal(false),
    independentFinalQaDecisionConsumed: z.literal(false),
  }).strict(),
  gapStates: z.array(gapSchemaV3).length(9),
  currentStatus: z.literal(
    'caption_source_complete_with_two_owner_mount_gaps'),
  targetTerminalStatus: z.literal(
    'caption_specialist_private_internal_qualified'),
  terminalStatusClaimed: z.literal(false),
  publicProductionRequiredForTerminalStatus: z.literal(false),
  centralOrchestraRequiredForTerminalStatus: z.literal(false),
  centralOrchestraImplemented: z.literal(false),
  browserLocalCompletionAccepted: z.literal(false),
  sourceFixtureRelabeledAsActualOwnerRuntime: z.literal(false),
  technicalQaRelabeledAsVisualAiReview: z.literal(false),
  operationDispatchAuthority: z.literal(false),
  providerOrModelRuntimeAuthority: z.literal(false),
  assetMutationAuthority: z.literal(false),
  finalQaApprovalAuthority: z.literal(false),
  creditOrBillingAuthority: z.literal(false),
  publicDeliveryAuthority: z.literal(false),
  productionAuthority: z.literal(false),
}).strict()

const readinessSchemaV4: z.ZodType<CaptionCurrentIntegrationReadinessV4> =
z.object({
  schemaVersion: z.literal(CAPTION_CURRENT_INTEGRATION_READINESS_VERSION_V4),
  readinessId: safeKey,
  readinessDigestSha256: sha256,
  observedAt: z.string().datetime({ offset: true }),
  supersedesFrozenAudit: z.literal(false),
  closesPriorOwnerCompositionGaps: z.literal(true),
  supersedesReadinessRef: refSchema,
  sourceFrozenGoalAuditRef: refSchema,
  sourceIntegrationManifestRef: refSchema,
  sourceIntegrationQualificationRef: refSchema,
  sourceCanonicalResumeAdapterRef: refSchema,
  sourceOwnerCompositionRef: refSchema,
  counts: z.object({
    declaredCaptionJobs: z.literal(41),
    captionOwnedSharedOwnerBoundariesComplete: z.literal(5),
    captionSharedOwnerBridgeImplementations: z.literal(5),
    canonicalSharedOwnerCompositionMounts: z.literal(5),
    sharedOwnerCompositionMountGaps: z.literal(0),
    canonicalBackendExecutionMounts: z.literal(1),
    postrenderAndPrivateReviewSourceMounts: z.literal(2),
    terminalProjectionContractsPublished: z.literal(2),
    actualAuthenticatedPrivateSharedOwnerIntegrations: z.literal(0),
    remainingPrivateEvidenceGaps: z.literal(9),
  }).strict(),
  currentEvidence: z.object({
    captionOwnedFeatureSurfaceComplete: z.literal(true),
    captionOwnedSharedOwnerContractsComplete: z.literal(true),
    canonicalTranscriptExecutionMountImplemented: z.literal(true),
    visualIntelligenceSupportResumeMountImplemented: z.literal(true),
    trackAllSupportResumeMountImplemented: z.literal(true),
    soundSyncSupportBridgeImplemented: z.literal(true),
    soundSyncCanonicalOwnerMountImplemented: z.literal(true),
    brollSupportBridgeImplemented: z.literal(true),
    brollCanonicalOwnerMountImplemented: z.literal(true),
    canonicalBackendPrivateExecutionMountImplemented: z.literal(true),
    postrenderVisualQaPersistenceAndReadMountImplemented: z.literal(true),
    independentPrivateReviewProjectionImplemented: z.literal(true),
    terminalPerJobProjectionContractPublished: z.literal(true),
    actualCanonicalResumeRecordConsumed: z.literal(false),
    actualPrivateOwnerRuntimeEvidenceConsumed: z.literal(false),
    qualifiedAiCompleteTimeVisualReviewConsumed: z.literal(false),
    independentFinalQaDecisionConsumed: z.literal(false),
  }).strict(),
  gapStates: z.array(gapSchemaV3).length(9),
  currentStatus: z.literal(
    'caption_source_complete_all_owner_mounts_ready_for_private_evidence'),
  targetTerminalStatus: z.literal(
    'caption_specialist_private_internal_qualified'),
  terminalStatusClaimed: z.literal(false),
  publicProductionRequiredForTerminalStatus: z.literal(false),
  centralOrchestraRequiredForTerminalStatus: z.literal(false),
  centralOrchestraImplemented: z.literal(false),
  browserLocalCompletionAccepted: z.literal(false),
  sourceFixtureRelabeledAsActualOwnerRuntime: z.literal(false),
  technicalQaRelabeledAsVisualAiReview: z.literal(false),
  operationDispatchAuthority: z.literal(false),
  providerOrModelRuntimeAuthority: z.literal(false),
  assetMutationAuthority: z.literal(false),
  finalQaApprovalAuthority: z.literal(false),
  creditOrBillingAuthority: z.literal(false),
  publicDeliveryAuthority: z.literal(false),
  productionAuthority: z.literal(false),
}).strict()

function hash(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function ref(id: string, version: string, contentHash: string):
CaptionDomainRef {
  return { id, version, contentHash }
}

const frozenAuditRef = ref(
  CAPTION_POST_CAP20_GOAL_COMPLETION_AUDIT.auditId,
  CAPTION_POST_CAP20_GOAL_COMPLETION_AUDIT.schemaVersion,
  CAPTION_POST_CAP20_GOAL_COMPLETION_AUDIT.auditDigestSha256)
const integrationManifestRef = ref(
  CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST.manifestId,
  CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST.manifestSchemaVersion,
  CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST.manifestHash)
const integrationQualificationRef = ref(
  CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT.snapshotId,
  CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT.schemaVersion,
  CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT
    .snapshotDigestSha256)
const resumeAdapterRef = ref(
  CAPTION_CANONICAL_SPECIALIST_RESUME_READ_ADAPTER_RECEIPT.adapterId,
  CAPTION_CANONICAL_SPECIALIST_RESUME_READ_ADAPTER_RECEIPT.schemaVersion,
  CAPTION_CANONICAL_SPECIALIST_RESUME_READ_ADAPTER_RECEIPT.adapterDigestSha256)

const transcriptRef = ref(
  CAPTION_CANONICAL_TRANSCRIPT_AUTHENTICATED_READ_ADAPTER_RECEIPT.adapterId,
  CAPTION_CANONICAL_TRANSCRIPT_AUTHENTICATED_READ_ADAPTER_RECEIPT.schemaVersion,
  CAPTION_CANONICAL_TRANSCRIPT_AUTHENTICATED_READ_ADAPTER_RECEIPT
    .adapterDigestSha256)
const visualRef = ref(
  CAPTION_CANONICAL_VISUAL_INTELLIGENCE_EVIDENCE_READ_RECEIPT.adapterId,
  CAPTION_CANONICAL_VISUAL_INTELLIGENCE_EVIDENCE_READ_RECEIPT.schemaVersion,
  CAPTION_CANONICAL_VISUAL_INTELLIGENCE_EVIDENCE_READ_RECEIPT
    .adapterDigestSha256)
const trackRef = ref(
  CAPTION_CANONICAL_TRACK_ALL_EVIDENCE_READ_RECEIPT.adapterId,
  CAPTION_CANONICAL_TRACK_ALL_EVIDENCE_READ_RECEIPT.schemaVersion,
  CAPTION_CANONICAL_TRACK_ALL_EVIDENCE_READ_RECEIPT.adapterDigestSha256)
const trackFinalizationRef = ref(
  CAPTION_TRACK_ALL_EVIDENCE_FINALIZATION_ADAPTER_RECEIPT.receiptId,
  CAPTION_TRACK_ALL_EVIDENCE_FINALIZATION_ADAPTER_RECEIPT.schemaVersion,
  CAPTION_TRACK_ALL_EVIDENCE_FINALIZATION_ADAPTER_RECEIPT.receiptDigestSha256)
const soundRef = ref(
  'captions.soundsync.support-result.contract',
  CAPTION_SOUND_SUPPORT_RESULT_VERSION,
  hash(CAPTION_SOUND_SUPPORT_RESULT_VERSION))
const brollRef = ref(
  CAPTION_BROLL_OWNER_READ_ADAPTER_RECEIPT.adapterId,
  CAPTION_BROLL_OWNER_READ_ADAPTER_RECEIPT.schemaVersion,
  CAPTION_BROLL_OWNER_READ_ADAPTER_RECEIPT.adapterDigestSha256)
const postrenderReadRef = ref(
  'captions.postrender-visual-review.authenticated-read.consumer',
  CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_RESULT_VERSION,
  hash(CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_RESULT_VERSION))
const privateReviewRef = ref(
  'captions.independent-private-review.boundary',
  'caption-complete-qa-v1',
  hash('captions.independent-private-review.boundary:caption-complete-qa-v1'))

function gap(input: Omit<CaptionCurrentIntegrationGapState,
  'actualCanonicalOwnerRecordConsumed'
  | 'liveOwnerRuntimeEvidenceConsumed'
  | 'blocksTerminalStatus'
  | 'captionMayImplementDuplicateOwner'
  | 'runtimeOrDispatchAuthorityGrantedByReadiness'>):
CaptionCurrentIntegrationGapState {
  return {
    ...input,
    actualCanonicalOwnerRecordConsumed: false,
    liveOwnerRuntimeEvidenceConsumed: false,
    blocksTerminalStatus: true,
    captionMayImplementDuplicateOwner: false,
    runtimeOrDispatchAuthorityGrantedByReadiness: false,
  }
}

const expectedGapStates: CaptionCurrentIntegrationGapState[] = [
  gap({
    gapId: 'canonical_transcript_owner_authenticated_read',
    ownerKeys: ['canonical_transcript', 'backend_workflow'],
    captionImplementationState: 'caption_consumer_source_complete',
    canonicalOwnerState: 'canonical_mount_missing',
    sourceEvidenceRefs: [transcriptRef],
    captionSourceImplementationComplete: true,
  }),
  gap({
    gapId: 'visual_intelligence_authenticated_evidence',
    ownerKeys: ['visual_intelligence', 'backend_workflow'],
    captionImplementationState: 'caption_consumer_source_complete',
    canonicalOwnerState: 'actual_owner_evidence_missing',
    sourceEvidenceRefs: [visualRef, resumeAdapterRef],
    captionSourceImplementationComplete: true,
  }),
  gap({
    gapId: 'track_all_authenticated_evidence',
    ownerKeys: ['track_all', 'backend_workflow'],
    captionImplementationState: 'caption_consumer_source_complete',
    canonicalOwnerState: 'actual_owner_evidence_missing',
    sourceEvidenceRefs: [trackRef, resumeAdapterRef],
    captionSourceImplementationComplete: true,
  }),
  gap({
    gapId: 'soundsync_authenticated_evidence',
    ownerKeys: ['soundsync', 'backend_workflow'],
    captionImplementationState: 'caption_contract_source_complete',
    canonicalOwnerState: 'canonical_adapter_and_owner_result_missing',
    sourceEvidenceRefs: [soundRef],
    captionSourceImplementationComplete: true,
  }),
  gap({
    gapId: 'broll_owner_authenticated_read',
    ownerKeys: ['broll_owner', 'backend_workflow'],
    captionImplementationState: 'caption_consumer_source_complete',
    canonicalOwnerState: 'authenticated_owner_result_missing',
    sourceEvidenceRefs: [brollRef],
    captionSourceImplementationComplete: true,
  }),
  gap({
    gapId: 'canonical_backend_private_execution_mount',
    ownerKeys: ['backend_workflow', 'captions'],
    captionImplementationState: 'external_owner_only',
    canonicalOwnerState: 'canonical_execution_mount_missing',
    sourceEvidenceRefs: [resumeAdapterRef, integrationManifestRef],
    captionSourceImplementationComplete: false,
  }),
  gap({
    gapId: 'qualified_ai_complete_time_visual_review',
    ownerKeys: ['canonical_postrender_visual_qa', 'backend_workflow'],
    captionImplementationState: 'caption_consumer_source_complete',
    canonicalOwnerState: 'qualified_complete_time_review_missing',
    sourceEvidenceRefs: [postrenderReadRef],
    captionSourceImplementationComplete: true,
  }),
  gap({
    gapId: 'independent_final_qa_reread',
    ownerKeys: ['canonical_private_review', 'backend_workflow'],
    captionImplementationState: 'external_owner_only',
    canonicalOwnerState: 'independent_final_qa_missing',
    sourceEvidenceRefs: [privateReviewRef],
    captionSourceImplementationComplete: false,
  }),
  gap({
    gapId: 'final_per_job_qualification_projection',
    ownerKeys: ['captions', 'backend_workflow'],
    captionImplementationState: 'caption_terminal_projection_deferred',
    canonicalOwnerState: 'deferred_until_terminal_dependencies',
    sourceEvidenceRefs: [frozenAuditRef, integrationQualificationRef],
    captionSourceImplementationComplete: false,
  }),
]

function refKey(value: CaptionDomainRef): string {
  return `${value.id}|${value.version}|${value.contentHash}`
}

export function parseCaptionCurrentIntegrationReadiness(
  value: unknown,
): CaptionCurrentIntegrationReadiness {
  assertClosedContractTree(value, 'Caption current integration readiness')
  const parsed = readinessSchema.parse(value)
  if (parsed.readinessDigestSha256 !== calculateSkillContractDigest(
    parsed as unknown as Record<string, unknown>, 'readinessDigestSha256')
    || JSON.stringify(parsed.gapStates) !== JSON.stringify(expectedGapStates)
    || parsed.gapStates.map((item) => item.gapId).join('|')
      !== CAPTION_GOAL_COMPLETION_GAP_IDS.join('|')
    || parsed.gapStates.some((item) =>
      new Set(item.ownerKeys).size !== item.ownerKeys.length
      || new Set(item.sourceEvidenceRefs.map(refKey)).size
        !== item.sourceEvidenceRefs.length)) {
    throw new Error('Caption current integration readiness is inconsistent.')
  }
  return structuredClone(parsed)
}

const readinessWithoutDigest: Omit<CaptionCurrentIntegrationReadiness,
  'readinessDigestSha256'> = {
  schemaVersion: CAPTION_CURRENT_INTEGRATION_READINESS_VERSION,
  readinessId: 'captions.current.integration.readiness.post-multi-owner-resume',
  observedAt: '2026-08-05T00:00:00.000Z',
  supersedesFrozenAudit: false,
  sourceFrozenGoalAuditRef: frozenAuditRef,
  sourceIntegrationManifestRef: integrationManifestRef,
  sourceIntegrationQualificationRef: integrationQualificationRef,
  sourceCanonicalResumeAdapterRef: resumeAdapterRef,
  counts: {
    declaredCaptionJobs: 41,
    captionOwnedSharedOwnerBoundariesComplete: 5,
    strictAuthenticatedMultiOwnerSourceFixturePaths: 1,
    actualAuthenticatedPrivateSharedOwnerIntegrations: 0,
    canonicalBackendExecutionMounts: 0,
    remainingTerminalGaps: 9,
  },
  currentEvidence: {
    captionOwnedFeatureSurfaceComplete: true,
    captionOwnedSharedOwnerContractsComplete: true,
    strictTypedOwnerAdmissionImplemented: true,
    priorOwnerCanonicalRereadImplemented: true,
    referenceOnlyOwnerEvidenceRejected: true,
    strictMultiOwnerSourceFixtureCompleted: true,
    liveProviderOrGpuRuntimeRelabeledFromFixture: false,
    actualCanonicalResumeRecordConsumed: false,
    canonicalBackendPrivateExecutionMounted: false,
    qualifiedAiCompleteTimeVisualReviewIntegrated: false,
    independentFinalQaRereadIntegrated: false,
    terminalPerJobProjectionPublished: false,
  },
  gapStates: expectedGapStates,
  currentStatus:
    'caption_owned_integration_surface_complete_waiting_on_canonical_mounts',
  targetTerminalStatus: 'caption_specialist_private_internal_qualified',
  terminalStatusClaimed: false,
  publicProductionRequiredForTerminalStatus: false,
  centralOrchestraRequiredForTerminalStatus: false,
  centralOrchestraImplemented: false,
  browserLocalCompletionAccepted: false,
  sourceFixtureRelabeledAsActualOwnerRuntime: false,
  technicalQaRelabeledAsVisualAiReview: false,
  operationDispatchAuthority: false,
  providerOrModelRuntimeAuthority: false,
  assetMutationAuthority: false,
  finalQaApprovalAuthority: false,
  creditOrBillingAuthority: false,
  publicDeliveryAuthority: false,
  productionAuthority: false,
}

export const CAPTION_CURRENT_INTEGRATION_READINESS =
parseCaptionCurrentIntegrationReadiness({
  ...readinessWithoutDigest,
  readinessDigestSha256: calculateSkillContractDigest({
    ...readinessWithoutDigest,
    readinessDigestSha256: '',
  }, 'readinessDigestSha256'),
})

const previousReadinessRef = ref(
  CAPTION_CURRENT_INTEGRATION_READINESS.readinessId,
  CAPTION_CURRENT_INTEGRATION_READINESS.schemaVersion,
  CAPTION_CURRENT_INTEGRATION_READINESS.readinessDigestSha256)

function sourceMountRef(id: string, version: string): CaptionDomainRef {
  return ref(id, version, hash(`${id}:${version}:source-mount`))
}

const transcriptMountRef = sourceMountRef(
  'captions.canonical-transcript.execution-mount',
  'canonical-caption-transcript-support-service-v1')
const visualMountRef = sourceMountRef(
  'captions.visual-intelligence.support-resume-mount',
  'canonical-caption-visual-intelligence-support-service-v1')
const trackMountRef = sourceMountRef(
  'captions.track-all.support-resume-mount',
  'canonical-caption-track-all-support-service-v2')
const soundMountRef = sourceMountRef(
  'captions.soundsync.support-resume-mount',
  'canonical-caption-soundsync-support-service-v1')
const brollMountRef = sourceMountRef(
  'captions.broll.support-resume-mount',
  'canonical-caption-broll-support-service-v1')
const executionMountRef = sourceMountRef(
  'captions.canonical-backend.private-execution-mount',
  'canonical-caption-specialist-execution-receipt-v1')
const postrenderMountRef = sourceMountRef(
  'captions.postrender-visual-qa.persistence-read-mount',
  'canonical-caption-postrender-visual-qa-coordinator-service-v2')
const privateReviewMountRef = sourceMountRef(
  'captions.independent-private-review.projection-mount',
  'canonical-caption-private-review-evidence-service-v2')
const terminalProjectionRef = sourceMountRef(
  'captions.terminal.per-job-qualification-projection',
  'caption-terminal-per-job-qualification-projection-v1')

function gapV2(input: Pick<CaptionCurrentIntegrationGapStateV2,
  'gapId' | 'ownerKeys' | 'sourceIntegrationState'
  | 'sourceEvidenceRefs'>): CaptionCurrentIntegrationGapStateV2 {
  return {
    ...input,
    captionSourceImplementationComplete: true,
    canonicalSourceMountImplemented: true,
    actualCanonicalOwnerRecordConsumed: false,
    liveOwnerRuntimeEvidenceConsumed: false,
    blocksTerminalStatus: true,
    captionMayImplementDuplicateOwner: false,
    runtimeOrDispatchAuthorityGrantedByReadiness: false,
  }
}

const expectedGapStatesV2: CaptionCurrentIntegrationGapStateV2[] = [
  gapV2({
    gapId: 'canonical_transcript_owner_authenticated_read',
    ownerKeys: ['canonical_transcript', 'backend_workflow'],
    sourceIntegrationState:
      'source_mount_complete_waiting_on_private_evidence',
    sourceEvidenceRefs: [transcriptRef, transcriptMountRef],
  }),
  gapV2({
    gapId: 'visual_intelligence_authenticated_evidence',
    ownerKeys: ['visual_intelligence', 'backend_workflow'],
    sourceIntegrationState:
      'source_mount_complete_waiting_on_private_evidence',
    sourceEvidenceRefs: [visualRef, visualMountRef, resumeAdapterRef],
  }),
  gapV2({
    gapId: 'track_all_authenticated_evidence',
    ownerKeys: ['track_all', 'backend_workflow'],
    sourceIntegrationState:
      'source_mount_complete_waiting_on_private_evidence',
    sourceEvidenceRefs: [trackRef, trackMountRef, resumeAdapterRef],
  }),
  gapV2({
    gapId: 'soundsync_authenticated_evidence',
    ownerKeys: ['soundsync', 'backend_workflow'],
    sourceIntegrationState:
      'source_mount_complete_waiting_on_private_evidence',
    sourceEvidenceRefs: [soundRef, soundMountRef, resumeAdapterRef],
  }),
  gapV2({
    gapId: 'broll_owner_authenticated_read',
    ownerKeys: ['broll_owner', 'backend_workflow'],
    sourceIntegrationState:
      'source_mount_complete_waiting_on_private_evidence',
    sourceEvidenceRefs: [brollRef, brollMountRef, resumeAdapterRef],
  }),
  gapV2({
    gapId: 'canonical_backend_private_execution_mount',
    ownerKeys: ['backend_workflow', 'captions'],
    sourceIntegrationState:
      'source_mount_complete_waiting_on_private_evidence',
    sourceEvidenceRefs: [executionMountRef, resumeAdapterRef],
  }),
  gapV2({
    gapId: 'qualified_ai_complete_time_visual_review',
    ownerKeys: ['canonical_postrender_visual_qa', 'backend_workflow'],
    sourceIntegrationState:
      'source_mount_complete_waiting_on_private_evidence',
    sourceEvidenceRefs: [postrenderReadRef, postrenderMountRef],
  }),
  gapV2({
    gapId: 'independent_final_qa_reread',
    ownerKeys: ['canonical_private_review', 'backend_workflow'],
    sourceIntegrationState:
      'source_mount_complete_waiting_on_private_evidence',
    sourceEvidenceRefs: [privateReviewRef, privateReviewMountRef],
  }),
  gapV2({
    gapId: 'final_per_job_qualification_projection',
    ownerKeys: ['captions', 'backend_workflow'],
    sourceIntegrationState:
      'terminal_projection_contract_complete_waiting_on_private_evidence',
    sourceEvidenceRefs: [terminalProjectionRef, integrationQualificationRef],
  }),
]

export function parseCaptionCurrentIntegrationReadinessV2(
  value: unknown,
): CaptionCurrentIntegrationReadinessV2 {
  assertClosedContractTree(value, 'Caption current integration readiness V2')
  const parsed = readinessSchemaV2.parse(value)
  if (parsed.readinessDigestSha256 !== calculateSkillContractDigest(
    parsed as unknown as Record<string, unknown>, 'readinessDigestSha256')
    || JSON.stringify(parsed.gapStates) !== JSON.stringify(expectedGapStatesV2)
    || parsed.gapStates.map((item) => item.gapId).join('|')
      !== CAPTION_GOAL_COMPLETION_GAP_IDS.join('|')
    || refKey(parsed.supersedesReadinessRef) !== refKey(previousReadinessRef)
    || parsed.gapStates.some((item) =>
      new Set(item.ownerKeys).size !== item.ownerKeys.length
      || new Set(item.sourceEvidenceRefs.map(refKey)).size
        !== item.sourceEvidenceRefs.length)) {
    throw new Error('Caption current integration readiness V2 is inconsistent.')
  }
  return structuredClone(parsed)
}

const readinessWithoutDigestV2: Omit<CaptionCurrentIntegrationReadinessV2,
  'readinessDigestSha256'> = {
  schemaVersion: CAPTION_CURRENT_INTEGRATION_READINESS_VERSION_V2,
  readinessId: 'captions.current.integration.readiness.source-mounted',
  observedAt: '2026-08-05T20:00:00.000Z',
  supersedesFrozenAudit: false,
  supersedesReadinessRef: previousReadinessRef,
  sourceFrozenGoalAuditRef: frozenAuditRef,
  sourceIntegrationManifestRef: integrationManifestRef,
  sourceIntegrationQualificationRef: integrationQualificationRef,
  sourceCanonicalResumeAdapterRef: resumeAdapterRef,
  counts: {
    declaredCaptionJobs: 41,
    captionOwnedSharedOwnerBoundariesComplete: 5,
    canonicalSharedOwnerSourceMounts: 5,
    canonicalBackendExecutionMounts: 1,
    postrenderAndPrivateReviewSourceMounts: 2,
    terminalProjectionContractsPublished: 1,
    actualAuthenticatedPrivateSharedOwnerIntegrations: 0,
    remainingPrivateEvidenceGaps: 9,
  },
  currentEvidence: {
    captionOwnedFeatureSurfaceComplete: true,
    captionOwnedSharedOwnerContractsComplete: true,
    canonicalTranscriptExecutionMountImplemented: true,
    visualIntelligenceSupportResumeMountImplemented: true,
    trackAllSupportResumeMountImplemented: true,
    soundSyncSupportResumeMountImplemented: true,
    brollSupportResumeMountImplemented: true,
    canonicalBackendPrivateExecutionMountImplemented: true,
    postrenderVisualQaPersistenceAndReadMountImplemented: true,
    independentPrivateReviewProjectionImplemented: true,
    terminalPerJobProjectionContractPublished: true,
    actualCanonicalResumeRecordConsumed: false,
    actualPrivateOwnerRuntimeEvidenceConsumed: false,
    qualifiedAiCompleteTimeVisualReviewConsumed: false,
    independentFinalQaDecisionConsumed: false,
  },
  gapStates: expectedGapStatesV2,
  currentStatus:
    'source_integration_complete_waiting_on_private_runtime_evidence',
  targetTerminalStatus: 'caption_specialist_private_internal_qualified',
  terminalStatusClaimed: false,
  publicProductionRequiredForTerminalStatus: false,
  centralOrchestraRequiredForTerminalStatus: false,
  centralOrchestraImplemented: false,
  browserLocalCompletionAccepted: false,
  sourceFixtureRelabeledAsActualOwnerRuntime: false,
  technicalQaRelabeledAsVisualAiReview: false,
  operationDispatchAuthority: false,
  providerOrModelRuntimeAuthority: false,
  assetMutationAuthority: false,
  finalQaApprovalAuthority: false,
  creditOrBillingAuthority: false,
  publicDeliveryAuthority: false,
  productionAuthority: false,
}

export const CAPTION_CURRENT_INTEGRATION_READINESS_V2 =
parseCaptionCurrentIntegrationReadinessV2({
  ...readinessWithoutDigestV2,
  readinessDigestSha256: calculateSkillContractDigest({
    ...readinessWithoutDigestV2,
    readinessDigestSha256: '',
  }, 'readinessDigestSha256'),
})

const previousReadinessV2Ref = ref(
  CAPTION_CURRENT_INTEGRATION_READINESS_V2.readinessId,
  CAPTION_CURRENT_INTEGRATION_READINESS_V2.schemaVersion,
  CAPTION_CURRENT_INTEGRATION_READINESS_V2.readinessDigestSha256)

function bridgeRef(id: string, version: string): CaptionDomainRef {
  return ref(id, version, hash(`${id}:${version}:source-bridge`))
}

const soundBridgeRef = bridgeRef(
  'captions.soundsync.support-resume-bridge',
  'canonical-caption-soundsync-support-service-v1')
const brollBridgeRef = bridgeRef(
  'captions.broll.support-resume-bridge',
  'canonical-caption-broll-support-service-v1')

function gapV3(input: Pick<CaptionCurrentIntegrationGapStateV3,
  'gapId' | 'ownerKeys' | 'sourceIntegrationState'
  | 'sourceEvidenceRefs' | 'canonicalSourceMountImplemented'>):
CaptionCurrentIntegrationGapStateV3 {
  return {
    gapId: input.gapId,
    ownerKeys: input.ownerKeys,
    sourceIntegrationState: input.sourceIntegrationState,
    sourceEvidenceRefs: input.sourceEvidenceRefs,
    captionSourceImplementationComplete: true,
    captionBridgeImplementationComplete: true,
    canonicalSourceMountImplemented: input.canonicalSourceMountImplemented,
    actualCanonicalOwnerRecordConsumed: false,
    liveOwnerRuntimeEvidenceConsumed: false,
    blocksTerminalStatus: true,
    captionMayImplementDuplicateOwner: false,
    runtimeOrDispatchAuthorityGrantedByReadiness: false,
  }
}

const expectedGapStatesV3: CaptionCurrentIntegrationGapStateV3[] = [
  gapV3({
    gapId: 'canonical_transcript_owner_authenticated_read',
    ownerKeys: ['canonical_transcript', 'backend_workflow'],
    sourceIntegrationState:
      'canonical_source_mount_complete_waiting_on_private_evidence',
    sourceEvidenceRefs: [transcriptRef, transcriptMountRef],
    canonicalSourceMountImplemented: true,
  }),
  gapV3({
    gapId: 'visual_intelligence_authenticated_evidence',
    ownerKeys: ['visual_intelligence', 'backend_workflow'],
    sourceIntegrationState:
      'canonical_source_mount_complete_waiting_on_private_evidence',
    sourceEvidenceRefs: [visualRef, visualMountRef, resumeAdapterRef],
    canonicalSourceMountImplemented: true,
  }),
  gapV3({
    gapId: 'track_all_authenticated_evidence',
    ownerKeys: ['track_all', 'backend_workflow'],
    sourceIntegrationState:
      'canonical_source_mount_complete_waiting_on_private_evidence',
    sourceEvidenceRefs: [
      trackRef, trackMountRef, trackFinalizationRef, resumeAdapterRef,
    ],
    canonicalSourceMountImplemented: true,
  }),
  gapV3({
    gapId: 'soundsync_authenticated_evidence',
    ownerKeys: ['soundsync', 'backend_workflow'],
    sourceIntegrationState:
      'caption_bridge_complete_waiting_on_canonical_owner_mount',
    sourceEvidenceRefs: [soundRef, soundBridgeRef, resumeAdapterRef],
    canonicalSourceMountImplemented: false,
  }),
  gapV3({
    gapId: 'broll_owner_authenticated_read',
    ownerKeys: ['broll_owner', 'backend_workflow'],
    sourceIntegrationState:
      'caption_bridge_complete_waiting_on_canonical_owner_mount',
    sourceEvidenceRefs: [brollRef, brollBridgeRef, resumeAdapterRef],
    canonicalSourceMountImplemented: false,
  }),
  gapV3({
    gapId: 'canonical_backend_private_execution_mount',
    ownerKeys: ['backend_workflow', 'captions'],
    sourceIntegrationState:
      'canonical_source_mount_complete_waiting_on_private_evidence',
    sourceEvidenceRefs: [executionMountRef, resumeAdapterRef],
    canonicalSourceMountImplemented: true,
  }),
  gapV3({
    gapId: 'qualified_ai_complete_time_visual_review',
    ownerKeys: ['canonical_postrender_visual_qa', 'backend_workflow'],
    sourceIntegrationState:
      'canonical_source_mount_complete_waiting_on_private_evidence',
    sourceEvidenceRefs: [postrenderReadRef, postrenderMountRef],
    canonicalSourceMountImplemented: true,
  }),
  gapV3({
    gapId: 'independent_final_qa_reread',
    ownerKeys: ['canonical_private_review', 'backend_workflow'],
    sourceIntegrationState:
      'canonical_source_mount_complete_waiting_on_private_evidence',
    sourceEvidenceRefs: [privateReviewRef, privateReviewMountRef],
    canonicalSourceMountImplemented: true,
  }),
  gapV3({
    gapId: 'final_per_job_qualification_projection',
    ownerKeys: ['captions', 'backend_workflow'],
    sourceIntegrationState:
      'terminal_projection_contract_complete_waiting_on_private_evidence',
    sourceEvidenceRefs: [sourceMountRef(
      'captions.terminal.per-job-qualification-projection.current',
      'caption-terminal-per-job-qualification-projection-v2'),
    integrationQualificationRef],
    canonicalSourceMountImplemented: true,
  }),
]

export function parseCaptionCurrentIntegrationReadinessV3(
  value: unknown,
): CaptionCurrentIntegrationReadinessV3 {
  assertClosedContractTree(value, 'Caption current integration readiness V3')
  const parsed = readinessSchemaV3.parse(value)
  const mountCount = parsed.gapStates.slice(0, 5).filter((item) =>
    item.canonicalSourceMountImplemented).length
  const failures = [
    parsed.readinessDigestSha256 !== calculateSkillContractDigest(
      parsed as unknown as Record<string, unknown>, 'readinessDigestSha256')
      ? 'digest' : null,
    JSON.stringify(parsed.gapStates) !== JSON.stringify(expectedGapStatesV3)
      ? 'gap_states' : null,
    parsed.gapStates.map((item) => item.gapId).join('|')
      !== CAPTION_GOAL_COMPLETION_GAP_IDS.join('|') ? 'gap_order' : null,
    refKey(parsed.supersedesReadinessRef) !== refKey(previousReadinessV2Ref)
      ? 'superseded_readiness' : null,
    mountCount !== parsed.counts.canonicalSharedOwnerCompositionMounts
      ? 'mount_count' : null,
    5 - mountCount !== parsed.counts.sharedOwnerCompositionMountGaps
      ? 'mount_gap_count' : null,
    parsed.gapStates.some((item) =>
      new Set(item.ownerKeys).size !== item.ownerKeys.length
      || new Set(item.sourceEvidenceRefs.map(refKey)).size
        !== item.sourceEvidenceRefs.length) ? 'duplicate_lineage' : null,
  ].filter((item): item is string => item !== null)
  if (failures.length > 0) {
    throw new Error(
      `Caption current integration readiness V3 is inconsistent: ${failures.join(', ')}.`,
    )
  }
  return structuredClone(parsed)
}

const readinessWithoutDigestV3: Omit<CaptionCurrentIntegrationReadinessV3,
  'readinessDigestSha256'> = {
  schemaVersion: CAPTION_CURRENT_INTEGRATION_READINESS_VERSION_V3,
  readinessId: 'captions.current.integration.readiness.mount-audited',
  observedAt: '2026-08-05T22:00:00.000Z',
  supersedesFrozenAudit: false,
  correctsSupersededReadinessOverclaim: true,
  supersedesReadinessRef: previousReadinessV2Ref,
  sourceFrozenGoalAuditRef: frozenAuditRef,
  sourceIntegrationManifestRef: integrationManifestRef,
  sourceIntegrationQualificationRef: integrationQualificationRef,
  sourceCanonicalResumeAdapterRef: resumeAdapterRef,
  counts: {
    declaredCaptionJobs: 41,
    captionOwnedSharedOwnerBoundariesComplete: 5,
    captionSharedOwnerBridgeImplementations: 5,
    canonicalSharedOwnerCompositionMounts: 3,
    sharedOwnerCompositionMountGaps: 2,
    canonicalBackendExecutionMounts: 1,
    postrenderAndPrivateReviewSourceMounts: 2,
    terminalProjectionContractsPublished: 2,
    actualAuthenticatedPrivateSharedOwnerIntegrations: 0,
    remainingPrivateEvidenceGaps: 9,
  },
  currentEvidence: {
    captionOwnedFeatureSurfaceComplete: true,
    captionOwnedSharedOwnerContractsComplete: true,
    canonicalTranscriptExecutionMountImplemented: true,
    visualIntelligenceSupportResumeMountImplemented: true,
    trackAllSupportResumeMountImplemented: true,
    soundSyncSupportBridgeImplemented: true,
    soundSyncCanonicalOwnerMountImplemented: false,
    brollSupportBridgeImplemented: true,
    brollCanonicalOwnerMountImplemented: false,
    canonicalBackendPrivateExecutionMountImplemented: true,
    postrenderVisualQaPersistenceAndReadMountImplemented: true,
    independentPrivateReviewProjectionImplemented: true,
    terminalPerJobProjectionContractPublished: true,
    actualCanonicalResumeRecordConsumed: false,
    actualPrivateOwnerRuntimeEvidenceConsumed: false,
    qualifiedAiCompleteTimeVisualReviewConsumed: false,
    independentFinalQaDecisionConsumed: false,
  },
  gapStates: expectedGapStatesV3,
  currentStatus: 'caption_source_complete_with_two_owner_mount_gaps',
  targetTerminalStatus: 'caption_specialist_private_internal_qualified',
  terminalStatusClaimed: false,
  publicProductionRequiredForTerminalStatus: false,
  centralOrchestraRequiredForTerminalStatus: false,
  centralOrchestraImplemented: false,
  browserLocalCompletionAccepted: false,
  sourceFixtureRelabeledAsActualOwnerRuntime: false,
  technicalQaRelabeledAsVisualAiReview: false,
  operationDispatchAuthority: false,
  providerOrModelRuntimeAuthority: false,
  assetMutationAuthority: false,
  finalQaApprovalAuthority: false,
  creditOrBillingAuthority: false,
  publicDeliveryAuthority: false,
  productionAuthority: false,
}

export const CAPTION_CURRENT_INTEGRATION_READINESS_V3 =
parseCaptionCurrentIntegrationReadinessV3({
  ...readinessWithoutDigestV3,
  readinessDigestSha256: calculateSkillContractDigest({
    ...readinessWithoutDigestV3,
    readinessDigestSha256: '',
  }, 'readinessDigestSha256'),
})

const previousReadinessV3Ref = ref(
  CAPTION_CURRENT_INTEGRATION_READINESS_V3.readinessId,
  CAPTION_CURRENT_INTEGRATION_READINESS_V3.schemaVersion,
  CAPTION_CURRENT_INTEGRATION_READINESS_V3.readinessDigestSha256)
const ownerCompositionRef = ref(
  'captions.shared-owner.private-composition',
  'canonical-caption-shared-owner-private-composition-v1',
  calculateSkillContractDigest({
    version: 'canonical-caption-shared-owner-private-composition-v1',
    soundOwner: 'canonical-sound-caption-owner-service-v1',
    brollOwner: 'canonical-broll-caption-owner-service-v1',
    digest: '',
  }, 'digest'))
const soundOwnerMountRef = sourceMountRef(
  'captions.soundsync.canonical-owner-composition',
  'canonical-sound-caption-owner-service-v1')
const brollOwnerMountRef = sourceMountRef(
  'captions.broll.canonical-owner-composition',
  'canonical-broll-caption-owner-service-v1')

const expectedGapStatesV4: CaptionCurrentIntegrationGapStateV3[] =
expectedGapStatesV3.map((gapState) => {
  if (gapState.gapId === 'soundsync_authenticated_evidence') {
    return gapV3({
      gapId: gapState.gapId,
      ownerKeys: gapState.ownerKeys,
      sourceIntegrationState:
        'canonical_source_mount_complete_waiting_on_private_evidence',
      sourceEvidenceRefs: [
        ...gapState.sourceEvidenceRefs, soundOwnerMountRef, ownerCompositionRef,
      ],
      canonicalSourceMountImplemented: true,
    })
  }
  if (gapState.gapId === 'broll_owner_authenticated_read') {
    return gapV3({
      gapId: gapState.gapId,
      ownerKeys: gapState.ownerKeys,
      sourceIntegrationState:
        'canonical_source_mount_complete_waiting_on_private_evidence',
      sourceEvidenceRefs: [
        ...gapState.sourceEvidenceRefs, brollOwnerMountRef, ownerCompositionRef,
      ],
      canonicalSourceMountImplemented: true,
    })
  }
  return structuredClone(gapState)
})

export function parseCaptionCurrentIntegrationReadinessV4(
  value: unknown,
): CaptionCurrentIntegrationReadinessV4 {
  assertClosedContractTree(value, 'Caption current integration readiness V4')
  const parsed = readinessSchemaV4.parse(value)
  const sharedOwnerMounts = parsed.gapStates.slice(0, 5).filter((item) =>
    item.canonicalSourceMountImplemented).length
  const failures = [
    parsed.readinessDigestSha256 !== calculateSkillContractDigest(
      parsed as unknown as Record<string, unknown>, 'readinessDigestSha256')
      ? 'digest' : null,
    refKey(parsed.supersedesReadinessRef) !== refKey(previousReadinessV3Ref)
      ? 'superseded_readiness' : null,
    refKey(parsed.sourceOwnerCompositionRef) !== refKey(ownerCompositionRef)
      ? 'owner_composition' : null,
    JSON.stringify(parsed.gapStates) !== JSON.stringify(expectedGapStatesV4)
      ? 'gap_states' : null,
    parsed.gapStates.map((item) => item.gapId).join('|')
      !== CAPTION_GOAL_COMPLETION_GAP_IDS.join('|') ? 'gap_order' : null,
    sharedOwnerMounts !== parsed.counts.canonicalSharedOwnerCompositionMounts
      ? 'mount_count' : null,
    5 - sharedOwnerMounts !== parsed.counts.sharedOwnerCompositionMountGaps
      ? 'mount_gap_count' : null,
    parsed.gapStates.some((item) =>
      new Set(item.ownerKeys).size !== item.ownerKeys.length
      || new Set(item.sourceEvidenceRefs.map(refKey)).size
        !== item.sourceEvidenceRefs.length) ? 'duplicate_lineage' : null,
  ].filter((item): item is string => item !== null)
  if (failures.length > 0) {
    throw new Error(
      `Caption current integration readiness V4 is inconsistent: ${failures.join(', ')}.`,
    )
  }
  return structuredClone(parsed)
}

const readinessWithoutDigestV4: Omit<CaptionCurrentIntegrationReadinessV4,
  'readinessDigestSha256'> = {
  schemaVersion: CAPTION_CURRENT_INTEGRATION_READINESS_VERSION_V4,
  readinessId: 'captions.current.integration.readiness.all-owner-mounts-closed',
  observedAt: '2026-08-06T01:00:00.000Z',
  supersedesFrozenAudit: false,
  closesPriorOwnerCompositionGaps: true,
  supersedesReadinessRef: previousReadinessV3Ref,
  sourceFrozenGoalAuditRef: frozenAuditRef,
  sourceIntegrationManifestRef: integrationManifestRef,
  sourceIntegrationQualificationRef: integrationQualificationRef,
  sourceCanonicalResumeAdapterRef: resumeAdapterRef,
  sourceOwnerCompositionRef: ownerCompositionRef,
  counts: {
    declaredCaptionJobs: 41,
    captionOwnedSharedOwnerBoundariesComplete: 5,
    captionSharedOwnerBridgeImplementations: 5,
    canonicalSharedOwnerCompositionMounts: 5,
    sharedOwnerCompositionMountGaps: 0,
    canonicalBackendExecutionMounts: 1,
    postrenderAndPrivateReviewSourceMounts: 2,
    terminalProjectionContractsPublished: 2,
    actualAuthenticatedPrivateSharedOwnerIntegrations: 0,
    remainingPrivateEvidenceGaps: 9,
  },
  currentEvidence: {
    captionOwnedFeatureSurfaceComplete: true,
    captionOwnedSharedOwnerContractsComplete: true,
    canonicalTranscriptExecutionMountImplemented: true,
    visualIntelligenceSupportResumeMountImplemented: true,
    trackAllSupportResumeMountImplemented: true,
    soundSyncSupportBridgeImplemented: true,
    soundSyncCanonicalOwnerMountImplemented: true,
    brollSupportBridgeImplemented: true,
    brollCanonicalOwnerMountImplemented: true,
    canonicalBackendPrivateExecutionMountImplemented: true,
    postrenderVisualQaPersistenceAndReadMountImplemented: true,
    independentPrivateReviewProjectionImplemented: true,
    terminalPerJobProjectionContractPublished: true,
    actualCanonicalResumeRecordConsumed: false,
    actualPrivateOwnerRuntimeEvidenceConsumed: false,
    qualifiedAiCompleteTimeVisualReviewConsumed: false,
    independentFinalQaDecisionConsumed: false,
  },
  gapStates: expectedGapStatesV4,
  currentStatus:
    'caption_source_complete_all_owner_mounts_ready_for_private_evidence',
  targetTerminalStatus: 'caption_specialist_private_internal_qualified',
  terminalStatusClaimed: false,
  publicProductionRequiredForTerminalStatus: false,
  centralOrchestraRequiredForTerminalStatus: false,
  centralOrchestraImplemented: false,
  browserLocalCompletionAccepted: false,
  sourceFixtureRelabeledAsActualOwnerRuntime: false,
  technicalQaRelabeledAsVisualAiReview: false,
  operationDispatchAuthority: false,
  providerOrModelRuntimeAuthority: false,
  assetMutationAuthority: false,
  finalQaApprovalAuthority: false,
  creditOrBillingAuthority: false,
  publicDeliveryAuthority: false,
  productionAuthority: false,
}

export const CAPTION_CURRENT_INTEGRATION_READINESS_V4 =
parseCaptionCurrentIntegrationReadinessV4({
  ...readinessWithoutDigestV4,
  readinessDigestSha256: calculateSkillContractDigest({
    ...readinessWithoutDigestV4,
    readinessDigestSha256: '',
  }, 'readinessDigestSha256'),
})
