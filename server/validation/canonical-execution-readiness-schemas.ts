import { z } from 'zod'

const safeIdentitySchema = z.string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'), 'Unsafe identity sequence.')

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/)

const authorityBlobRefSchema = z.object({
  sha256: sha256Schema,
  byteLength: z.number().int().positive().max(2 * 1024 * 1024),
}).strict()

export const canonicalExecutionReadinessRequestSchema = z.object({
  workspaceId: safeIdentitySchema,
  projectId: safeIdentitySchema,
  editSessionId: safeIdentitySchema,
  jobId: safeIdentitySchema,
  purpose: z.literal('private_internal_dry_run_readiness'),
}).strict()

export const canonicalExecutionReadinessRouteBodySchema = canonicalExecutionReadinessRequestSchema.omit({
  jobId: true,
})

const expectedAssetSchema = z.object({
  assetId: safeIdentitySchema,
  outputKey: safeIdentitySchema,
  artifactType: safeIdentitySchema,
  assetRole: z.enum(['processed', 'generated', 'qa', 'preview', 'final']),
  required: z.boolean(),
  previewPlaceholderAllowed: z.boolean(),
  contentType: z.string().trim().min(1).max(160).optional(),
  segmentIds: z.array(safeIdentitySchema).max(256),
  timingIds: z.array(safeIdentitySchema).max(512),
  rendererLayerIds: z.array(safeIdentitySchema).max(512),
  authorityState: z.literal('planned_no_produced_artifact_evidence'),
  version: z.literal(1),
}).strict()

const dependencyEvidenceSchema = z.object({
  jobId: safeIdentitySchema,
  approvedWorkItemId: safeIdentitySchema,
  workItemKey: safeIdentitySchema,
  jobType: safeIdentitySchema,
  required: z.boolean(),
  expectedAssetIds: z.array(safeIdentitySchema).max(128),
  canonicalGraphState: z.enum(['ready', 'blocked']),
  completionEvidenceState: z.literal('not_committed'),
  qaEvidenceState: z.literal('not_committed'),
  dependencySatisfied: z.literal(false),
}).strict()

export const canonicalExecutionReadinessEnvelopeSchema = z.object({
  schemaVersion: z.literal('canonical-execution-readiness-envelope-v2'),
  source: z.literal('immutable_canonical_edit_authority'),
  purpose: z.literal('private_internal_dry_run_readiness'),
  identity: z.object({
    workspaceId: safeIdentitySchema,
    projectId: safeIdentitySchema,
    editSessionId: safeIdentitySchema,
    jobId: safeIdentitySchema,
  }).strict(),
  authorityRevision: z.number().int().positive(),
  authorityHashes: z.object({
    snapshotHash: sha256Schema,
    planHash: sha256Schema,
    estimateHash: sha256Schema,
    workGraphHash: sha256Schema,
    sourceSequenceHash: sha256Schema,
    timingHash: sha256Schema,
    planningInputBindingHash: sha256Schema,
    approvedSourceAssetManifestHash: sha256Schema,
    approvedAssetManifestHash: sha256Schema,
    executionPackageHash: sha256Schema,
    toolExecutionAuthorityHash: sha256Schema,
    resourcePlacementAuthorityHash: sha256Schema,
    resourcePlacementHash: sha256Schema,
    jobAuthorityHash: sha256Schema,
  }).strict(),
  executionPackage: z.object({
    schemaVersion: z.literal('canonical-approved-edit-execution-package-v5'),
    packageRecordId: safeIdentitySchema,
    packageHash: sha256Schema,
    toolCapabilityManifestRef: authorityBlobRefSchema,
    workerDispatchReady: z.literal(false),
    liveExecutionReady: z.literal(false),
  }).strict(),
  reservation: z.object({
    reservationId: safeIdentitySchema,
    status: z.enum(['reserved', 'partially_spent']),
    remainingReservedCredits: z.number().int().positive(),
    expiresAt: z.string().datetime({ offset: true }),
    authorityState: z.literal('active_funded_test_reservation'),
  }).strict(),
  job: z.object({
    approvedPlanSnapshotId: safeIdentitySchema,
    approvedWorkItemId: safeIdentitySchema,
    workItemKey: safeIdentitySchema,
    jobType: safeIdentitySchema,
    workerClass: safeIdentitySchema,
    executionInputRef: authorityBlobRefSchema,
    executionInputHash: sha256Schema,
    fallbackPolicyRef: authorityBlobRefSchema,
    sourceSequenceItemIds: z.array(safeIdentitySchema).max(1_000),
    sourceCleanupDecisionIds: z.array(safeIdentitySchema).max(10_000),
    expectedAssetIds: z.array(safeIdentitySchema).min(1).max(128),
    dependencyJobIds: z.array(safeIdentitySchema).max(128),
    canonicalGraphState: z.enum(['ready', 'blocked']),
    approvedToolIds: z.array(safeIdentitySchema).max(64),
    approvedProviderRoute: safeIdentitySchema.optional(),
    providerExecutionMode: z.enum(['none', 'primary', 'fallback', 'final_fallback']),
    maximumCreditBudget: z.number().int().nonnegative().max(10_000_000),
    required: z.boolean(),
    maxAttempts: z.number().int().min(1).max(10),
    attemptTimeoutSeconds: z.number().int().min(30).max(14_400),
    scheduledFor: z.string().datetime({ offset: true }),
  }).strict(),
  expectedAssets: z.array(expectedAssetSchema).min(1).max(128),
  dependencies: z.array(dependencyEvidenceSchema).max(128),
  dependencyEvidenceState: z.enum([
    'not_required_for_root_job',
    'required_results_and_qa_not_committed',
  ]),
  sourceAuthority: z.object({
    sourceMode: z.enum([
      'uploaded_media',
      'idea_first_storytelling_no_uploaded_media',
    ]),
    manifestRef: authorityBlobRefSchema,
    manifestHash: sha256Schema,
    boundSourceCount: z.number().int().nonnegative().max(1_000),
    requiredSourceCount: z.number().int().nonnegative().max(1_000),
    referencedSourceSequenceItemIds: z.array(safeIdentitySchema).max(1_000),
    objectResolutionAuthorized: z.literal(false),
  }).strict(),
  toolEvidence: z.object({
    approvedToolIds: z.array(safeIdentitySchema).max(64),
    registryBlockedToolIds: z.array(safeIdentitySchema).max(64),
    runtimeEvidenceReadyCount: z.literal(0),
    workerDispatchAuthorized: z.literal(false),
  }).strict(),
  resourcePlacement: z.object({
    placementPolicyVersion: z.literal('canonical-private-resource-placement-policy-v1'),
    workerType: z.enum([
      'api_service',
      'cpu_analysis_worker',
      'gpu_ai_worker',
      'render_worker',
      'qa_worker',
      'tool_readiness_worker',
    ]),
    resourceClassId: z.enum([
      'control_plane_cpu_v1',
      'cpu_analysis_standard_v1',
      'gpu_l4_standard_v1',
      'render_cpu_high_memory_v1',
      'qa_cpu_standard_v1',
      'tool_readiness_cpu_v1',
    ]),
    plannedCloudExecutionTarget: z.enum(['cloud_run_service', 'cloud_run_job']),
    preferredAccelerator: z.enum(['none', 'nvidia_l4']),
    workerConcurrencyLimit: z.number().int().positive().max(100),
    globalConcurrencyLimit: z.literal(4),
    snapshotBound: z.literal(true),
    currentRuntimeCompatible: z.literal(true),
    callerSelectedPlacement: z.literal(false),
    cloudDispatchAuthorized: z.literal(false),
  }).strict(),
  gates: z.object({
    identityScope: z.literal('passed'),
    approvedAuthority: z.literal('passed'),
    executionPackageIntegrity: z.literal('passed'),
    planningInputAuthority: z.literal('passed'),
    sourceMediaAuthority: z.literal('passed'),
    plannedAssetAuthority: z.literal('passed'),
    resourcePlacementAuthority: z.literal('passed'),
    fundedReservation: z.literal('passed'),
    dependencyEvidence: z.enum(['not_required', 'blocked_pending_results_and_qa']),
    tenantBoundLease: z.literal('separate_authority_not_issued'),
    runtimeToolEvidence: z.literal('separate_authority_not_evaluated'),
    producedArtifactAuthority: z.literal('separate_authority_not_evaluated'),
    qaResultAuthority: z.literal('separate_authority_not_evaluated'),
    dispatch: z.literal('not_authorized'),
  }).strict(),
  readinessState: z.enum([
    'authority_verified_runtime_blocked',
    'dependency_evidence_required_runtime_blocked',
    'scheduled_delay_pending_runtime_blocked',
  ]),
  blockers: z.array(z.string().trim().min(1).max(1_000)).min(1).max(32),
  dryRun: z.literal(true),
  claimAuthorized: z.literal(false),
  dispatchAuthorized: z.literal(false),
  providerCallAuthorized: z.literal(false),
  toolExecutionAuthorized: z.literal(false),
  artifactWriteAuthorized: z.literal(false),
  renderAuthorized: z.literal(false),
  creditSpendAuthorized: z.literal(false),
  noRuntimeSideEffects: z.literal(true),
  envelopeHash: sha256Schema,
}).strict().superRefine((value, context) => {
  const source = value.sourceAuthority
  if (
    source.requiredSourceCount > source.boundSourceCount ||
    (source.sourceMode === 'uploaded_media' && source.boundSourceCount === 0) ||
    (source.sourceMode === 'idea_first_storytelling_no_uploaded_media' && (
      source.boundSourceCount !== 0 ||
      source.requiredSourceCount !== 0 ||
      source.referencedSourceSequenceItemIds.length !== 0 ||
      value.job.sourceSequenceItemIds.length !== 0 ||
      value.job.sourceCleanupDecisionIds.length !== 0
    ))
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['sourceAuthority'],
      message: 'Canonical execution source mode and source counts are inconsistent.',
    })
  }
})

export type CanonicalExecutionReadinessRequest = z.infer<typeof canonicalExecutionReadinessRequestSchema>
export type CanonicalExecutionReadinessEnvelope = z.infer<typeof canonicalExecutionReadinessEnvelopeSchema>
