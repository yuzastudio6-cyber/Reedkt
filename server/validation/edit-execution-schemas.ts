import { z } from 'zod'
import {
  BOUNDED_ADAPTER_MODEL_WEIGHT_APPROVAL_SOURCES,
  BOUNDED_ADAPTER_MODEL_WEIGHT_APPROVAL_STATUSES,
  BOUNDED_ADAPTER_PACKAGE_READINESS_EVIDENCE_SOURCES,
  BOUNDED_ADAPTER_PACKAGE_READINESS_STATUSES,
} from '../../src/types/bounded-adapter-source-truth'
import { idSchema } from './common-schemas'

const toolIdListSchema = z.array(z.string().trim().min(1)).max(64).default([])
const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/)
const localMediaProcessingModeSchema = z.enum(['bounded_preview_render', 'private_internal_review_render'])

const packageReadinessEvidenceSchema = z.object({
  toolId: z.string().trim().min(1),
  status: z.enum(BOUNDED_ADAPTER_PACKAGE_READINESS_STATUSES),
  source: z.enum(BOUNDED_ADAPTER_PACKAGE_READINESS_EVIDENCE_SOURCES),
  evidenceId: z.string().trim().min(1),
  checkedAt: z.string().trim().min(1),
  summary: z.string().trim().max(1000).optional(),
})

const modelWeightApprovalEvidenceSchema = z.object({
  toolId: z.string().trim().min(1),
  approvalStatus: z.enum(BOUNDED_ADAPTER_MODEL_WEIGHT_APPROVAL_STATUSES),
  source: z.enum(BOUNDED_ADAPTER_MODEL_WEIGHT_APPROVAL_SOURCES),
  manifestId: z.string().trim().min(1),
  checkedAt: z.string().trim().min(1),
  summary: z.string().trim().max(1000).optional(),
})

export const createApprovedEditExecutionPackageSchema = z.object({
  workspaceId: idSchema,
  approvedPlanSnapshotId: idSchema,
  expectedSnapshotHash: sha256Schema,
  purpose: z.literal('private_internal_execution_handoff').default('private_internal_execution_handoff'),
}).strict()

export type CreateApprovedEditExecutionPackageBody = z.infer<typeof createApprovedEditExecutionPackageSchema>

export const createApprovedEditExecutionJobBatchPlanSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  creditReservationId: idSchema,
  dryRunOnly: z.literal(true).default(true),
})

export type CreateApprovedEditExecutionJobBatchPlanBody = z.infer<typeof createApprovedEditExecutionJobBatchPlanSchema>

export const createApprovedEditExecutionBoundedAdapterSourceTruthReviewSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  creditReservationId: idSchema,
  packageReadinessEvidence: z.array(packageReadinessEvidenceSchema).max(128).default([]),
  modelWeightApprovals: z.array(modelWeightApprovalEvidenceSchema).max(128).default([]),
})

export type CreateApprovedEditExecutionBoundedAdapterSourceTruthReviewBody = z.infer<typeof createApprovedEditExecutionBoundedAdapterSourceTruthReviewSchema>

export const createApprovedEditExecutionBoundedAdapterExecutionRunSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  creditReservationId: idSchema,
  handoffOnly: z.literal(true).default(true),
})

export type CreateApprovedEditExecutionBoundedAdapterExecutionRunBody = z.infer<typeof createApprovedEditExecutionBoundedAdapterExecutionRunSchema>

export const createApprovedEditExecutionRegisteredAdapterRunnerProbeSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  importProbeOnly: z.literal(true).default(true),
})

export type CreateApprovedEditExecutionRegisteredAdapterRunnerProbeBody = z.infer<typeof createApprovedEditExecutionRegisteredAdapterRunnerProbeSchema>

export const createApprovedEditExecutionRegisteredAdapterPrivateMediaRunnerSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  creditReservationId: idSchema,
  privateMediaExecutionOnly: z.literal(true).default(true),
})

export type CreateApprovedEditExecutionRegisteredAdapterPrivateMediaRunnerBody = z.infer<typeof createApprovedEditExecutionRegisteredAdapterPrivateMediaRunnerSchema>

export const createApprovedEditExecutionRegisteredAdapterPrivateMediaRunnerQaReviewSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  creditReservationId: idSchema,
  qaReviewOnly: z.literal(true).default(true),
})

export type CreateApprovedEditExecutionRegisteredAdapterPrivateMediaRunnerQaReviewBody = z.infer<typeof createApprovedEditExecutionRegisteredAdapterPrivateMediaRunnerQaReviewSchema>

export const createApprovedEditExecutionAdapterWorkerArtifactIntegrationSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  creditReservationId: idSchema,
  integrationOnly: z.literal(true).default(true),
})

export type CreateApprovedEditExecutionAdapterWorkerArtifactIntegrationBody = z.infer<typeof createApprovedEditExecutionAdapterWorkerArtifactIntegrationSchema>

export const createApprovedEditExecutionMockQueueSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  creditReservationId: idSchema,
  mockQueueOnly: z.literal(true).default(true),
})

export type CreateApprovedEditExecutionMockQueueBody = z.infer<typeof createApprovedEditExecutionMockQueueSchema>

export const createApprovedEditExecutionDispatchReadinessSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  creditReservationId: idSchema,
  dryRunOnly: z.literal(true).default(true),
})

export type CreateApprovedEditExecutionDispatchReadinessBody = z.infer<typeof createApprovedEditExecutionDispatchReadinessSchema>

export const createApprovedEditExecutionMockWorkerClaimsSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  creditReservationId: idSchema,
  workerInstanceId: z.string().trim().min(1).optional(),
  mockClaimsOnly: z.literal(true).default(true),
})

export type CreateApprovedEditExecutionMockWorkerClaimsBody = z.infer<typeof createApprovedEditExecutionMockWorkerClaimsSchema>

export const createApprovedEditExecutionHandlerDryRunSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  creditReservationId: idSchema,
  handlerDryRunOnly: z.literal(true).default(true),
})

export type CreateApprovedEditExecutionHandlerDryRunBody = z.infer<typeof createApprovedEditExecutionHandlerDryRunSchema>

export const createApprovedEditExecutionResultReconciliationSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  creditReservationId: idSchema,
  reconcileDryRunOnly: z.literal(true).default(true),
})

export type CreateApprovedEditExecutionResultReconciliationBody = z.infer<typeof createApprovedEditExecutionResultReconciliationSchema>

export const createApprovedEditExecutionLocalWorkerOutputSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  creditReservationId: idSchema,
  localOutputOnly: z.literal(true).default(true),
})

export type CreateApprovedEditExecutionLocalWorkerOutputBody = z.infer<typeof createApprovedEditExecutionLocalWorkerOutputSchema>

export const createApprovedEditExecutionLocalWorkerOutputQaReviewSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  creditReservationId: idSchema,
  qaReviewOnly: z.literal(true).default(true),
})

export type CreateApprovedEditExecutionLocalWorkerOutputQaReviewBody = z.infer<typeof createApprovedEditExecutionLocalWorkerOutputQaReviewSchema>

export const createApprovedEditExecutionWorkflowRehearsalSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  creditReservationId: idSchema,
  scenarioId: z.string().trim().min(1).optional(),
  rehearsalOnly: z.literal(true).default(true),
})

export type CreateApprovedEditExecutionWorkflowRehearsalBody = z.infer<typeof createApprovedEditExecutionWorkflowRehearsalSchema>

const uploadedMediaSourceAssetSchema = z.object({
  mediaAssetId: idSchema,
  sourceSequenceItemId: idSchema.optional(),
  uploadedClipId: idSchema.optional(),
  uploadedOrder: z.number().int().positive(),
  storageProvider: z.enum(['local_private', 'google_cloud_storage', 'supabase_storage'], {
    error: 'storageProvider_mock_not_allowed_for_uploaded_execution_source',
  }),
  storageBucket: z.string().trim().min(1).optional(),
  storagePath: z.string().trim().min(1),
  fileName: z.string().trim().min(1),
  mimeType: z.string().trim().min(1),
  byteSize: z.number().int().positive(),
  checksumSha256: z.string({ error: 'checksumSha256 is required for uploaded execution source media.' }).trim().regex(/^[a-f0-9]{64}$/i, 'checksumSha256 must be a 64-character SHA-256 hex digest.'),
  privateArtifact: z.literal(true).default(true),
  publicUrl: z.null().optional(),
  signedUrl: z.null().optional(),
})

export const createApprovedEditExecutionUploadedMediaWorkerExecutionSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  creditReservationId: idSchema,
  localWorkerOutputId: idSchema,
  localWorkerOutputQaReviewId: idSchema,
  uploadedMediaExecutionOnly: z.literal(true).default(true),
  sourceMediaAssets: z.array(uploadedMediaSourceAssetSchema).min(1).max(64),
})

export type CreateApprovedEditExecutionUploadedMediaWorkerExecutionBody = z.infer<typeof createApprovedEditExecutionUploadedMediaWorkerExecutionSchema>

export const createApprovedEditExecutionPrivateWorkerArtifactQaReviewSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  creditReservationId: idSchema,
  qaReviewOnly: z.literal(true).default(true),
})

export type CreateApprovedEditExecutionPrivateWorkerArtifactQaReviewBody = z.infer<typeof createApprovedEditExecutionPrivateWorkerArtifactQaReviewSchema>

export const createApprovedEditExecutionLocalMediaProcessingExecutionSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  creditReservationId: idSchema,
  processingExecutionOnly: z.literal(true).default(true),
  processingMode: localMediaProcessingModeSchema.default('bounded_preview_render'),
  maxDurationSeconds: z.number().positive().max(60).optional(),
  targetWidth: z.number().int().positive().max(1920).optional(),
  targetHeight: z.number().int().positive().max(1080).optional(),
  fps: z.number().int().positive().max(60).optional(),
})

export type CreateApprovedEditExecutionLocalMediaProcessingExecutionBody = z.infer<typeof createApprovedEditExecutionLocalMediaProcessingExecutionSchema>

export const createApprovedEditExecutionPrivateMediaArtifactQaReviewSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  creditReservationId: idSchema,
  qaReviewOnly: z.literal(true).default(true),
})

export type CreateApprovedEditExecutionPrivateMediaArtifactQaReviewBody = z.infer<typeof createApprovedEditExecutionPrivateMediaArtifactQaReviewSchema>

export const createApprovedEditExecutionRenderPreviewAssemblySchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  creditReservationId: idSchema,
  assemblyOnly: z.literal(true).default(true),
  adapterWorkerArtifactIntegrationId: idSchema.optional(),
  privateMediaRunnerQaReviewId: idSchema.optional(),
})

export type CreateApprovedEditExecutionRenderPreviewAssemblyBody = z.infer<typeof createApprovedEditExecutionRenderPreviewAssemblySchema>

export const createApprovedEditExecutionUserPreviewReviewSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  creditReservationId: idSchema,
  reviewOnly: z.literal(true).default(true),
  reviewDecision: z.enum(['approved_for_final_render_readiness', 'changes_requested']),
  reviewerNote: z.string().trim().max(1000).optional(),
})

export type CreateApprovedEditExecutionUserPreviewReviewBody = z.infer<typeof createApprovedEditExecutionUserPreviewReviewSchema>

export const createApprovedEditExecutionFinalRenderReadinessReviewSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  creditReservationId: idSchema,
  readinessReviewOnly: z.literal(true).default(true),
})

export type CreateApprovedEditExecutionFinalRenderReadinessReviewBody = z.infer<typeof createApprovedEditExecutionFinalRenderReadinessReviewSchema>

export const createApprovedEditExecutionFinalRenderExecutionSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  creditReservationId: idSchema,
  renderExecutionOnly: z.literal(true).default(true),
})

export type CreateApprovedEditExecutionFinalRenderExecutionBody = z.infer<typeof createApprovedEditExecutionFinalRenderExecutionSchema>

export const createApprovedEditExecutionFinalDeliveryQaReviewSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  creditReservationId: idSchema,
  qaReviewOnly: z.literal(true).default(true),
})

export type CreateApprovedEditExecutionFinalDeliveryQaReviewBody = z.infer<typeof createApprovedEditExecutionFinalDeliveryQaReviewSchema>

export const createApprovedEditExecutionPrivateInternalDownloadDeliverySchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  creditReservationId: idSchema,
  deliveryOnly: z.literal(true).default(true),
})

export type CreateApprovedEditExecutionPrivateInternalDownloadDeliveryBody = z.infer<typeof createApprovedEditExecutionPrivateInternalDownloadDeliverySchema>

export const createApprovedEditExecutionPrivateInternalTestRunSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  approvedPlanSnapshotId: idSchema,
  approvedSnapshot: z.record(z.string(), z.unknown()),
  creditReservationId: idSchema,
  requestedAdapterToolNames: toolIdListSchema,
  packageReadyToolIds: toolIdListSchema,
  modelWeightApprovedToolIds: toolIdListSchema,
  internalTestRunOnly: z.literal(true).default(true),
  sourceMediaAssets: z.array(uploadedMediaSourceAssetSchema).min(1).max(64),
  processingMode: localMediaProcessingModeSchema.default('private_internal_review_render'),
  maxDurationSeconds: z.number().positive().max(60).optional(),
  targetWidth: z.number().int().positive().max(1920).optional(),
  targetHeight: z.number().int().positive().max(1080).optional(),
  fps: z.number().int().positive().max(60).optional(),
  reviewerNote: z.string().trim().max(1000).optional(),
})

export type CreateApprovedEditExecutionPrivateInternalTestRunBody = z.infer<typeof createApprovedEditExecutionPrivateInternalTestRunSchema>
