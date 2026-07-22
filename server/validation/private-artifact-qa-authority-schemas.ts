import { z } from 'zod'

export const PRIVATE_ARTIFACT_QA_AGGREGATE_VERSION =
  'private-artifact-qa-authority-aggregate-v1' as const
export const PRIVATE_ARTIFACT_QA_BLOB_VERSION =
  'private-artifact-qa-authority-blob-v1' as const

export const artifactQaSafeIdentitySchema = z.string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'), 'Unsafe identity sequence.')

export const artifactQaSha256Schema = z.string().regex(/^[a-f0-9]{64}$/)

export const artifactQaBlobRefSchema = z.object({
  sha256: artifactQaSha256Schema,
  byteLength: z.number().int().positive().max(1024 * 1024),
}).strict()

export const artifactQaAuthorityIdentitySchema = z.object({
  workspaceId: artifactQaSafeIdentitySchema,
  projectId: artifactQaSafeIdentitySchema,
  editSessionId: artifactQaSafeIdentitySchema,
  snapshotId: artifactQaSafeIdentitySchema,
  jobId: artifactQaSafeIdentitySchema,
  expectedAssetId: artifactQaSafeIdentitySchema,
}).strict()

const idempotencyKeySchema = z.string()
  .trim()
  .min(8)
  .max(160)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'), 'Unsafe idempotency key sequence.')

export const recordInternalArtifactRequestSchema = artifactQaAuthorityIdentitySchema.extend({
  idempotencyKey: idempotencyKeySchema,
  purpose: z.literal('record_server_verified_internal_artifact_result'),
}).strict()

export const recordInternalQaRequestSchema = artifactQaAuthorityIdentitySchema.extend({
  artifactId: artifactQaSafeIdentitySchema,
  idempotencyKey: idempotencyKeySchema,
  purpose: z.literal('record_server_verified_internal_artifact_qa'),
}).strict()

export const reconcileInternalArtifactRequestSchema = artifactQaAuthorityIdentitySchema.extend({
  artifactId: artifactQaSafeIdentitySchema,
  idempotencyKey: idempotencyKeySchema,
  purpose: z.literal('reconcile_server_verified_internal_artifact'),
}).strict()

export const artifactQaAuthorityReadRequestSchema = artifactQaAuthorityIdentitySchema.extend({
  artifactId: artifactQaSafeIdentitySchema,
  purpose: z.literal('read_private_artifact_qa_authority'),
}).strict()

export const jobDependencyReadinessRequestSchema = z.object({
  workspaceId: artifactQaSafeIdentitySchema,
  projectId: artifactQaSafeIdentitySchema,
  editSessionId: artifactQaSafeIdentitySchema,
  snapshotId: artifactQaSafeIdentitySchema,
  jobId: artifactQaSafeIdentitySchema,
  purpose: z.literal('derive_private_artifact_dependency_readiness'),
}).strict()

export const canonicalExpectedArtifactLineageSchema = z.object({
  assetId: artifactQaSafeIdentitySchema,
  outputKey: artifactQaSafeIdentitySchema,
  artifactType: artifactQaSafeIdentitySchema,
  assetRole: z.enum(['processed', 'generated', 'qa', 'preview', 'final']),
  required: z.boolean(),
  previewPlaceholderAllowed: z.boolean(),
  contentType: z.string().trim().min(1).max(160).optional(),
  segmentIds: z.array(artifactQaSafeIdentitySchema).max(256),
  timingIds: z.array(artifactQaSafeIdentitySchema).max(512),
  rendererLayerIds: z.array(artifactQaSafeIdentitySchema).max(512),
  approvedWorkItemId: artifactQaSafeIdentitySchema,
  workItemKey: artifactQaSafeIdentitySchema,
  jobType: artifactQaSafeIdentitySchema,
  jobAuthorityHash: artifactQaSha256Schema,
  snapshotHash: artifactQaSha256Schema,
  approvedAssetManifestHash: artifactQaSha256Schema,
}).strict()

const actualRunEvidencePlaceholderSchema = z.object({
  state: z.literal('actual_run_evidence_placeholder'),
  executionAttemptId: artifactQaSafeIdentitySchema,
  runnerClass: artifactQaSafeIdentitySchema,
  runnerEvidenceHash: artifactQaSha256Schema.optional(),
  startedAt: z.string().datetime({ offset: true }).optional(),
  finishedAt: z.string().datetime({ offset: true }).optional(),
  exitCode: z.number().int().min(-1).max(255).optional(),
  toolIds: z.array(artifactQaSafeIdentitySchema).max(64).default([]),
  providerRoute: artifactQaSafeIdentitySchema.optional(),
  actualRunVerified: z.literal(false),
}).strict()

const actualRunEvidenceVerifiedSchema = z.object({
  state: z.literal('actual_run_evidence_verified_v2'),
  executionAttemptId: artifactQaSafeIdentitySchema,
  runnerClass: artifactQaSafeIdentitySchema,
  runnerEvidenceHash: artifactQaSha256Schema,
  startedAt: z.string().datetime({ offset: true }),
  finishedAt: z.string().datetime({ offset: true }),
  exitCode: z.literal(0),
  toolIds: z.array(artifactQaSafeIdentitySchema).min(1).max(64),
  actualRunVerified: z.literal(true),
  dispatchGrantId: artifactQaSafeIdentitySchema,
  runtimeAuthorityHash: artifactQaSha256Schema,
  runtimeImageIdentityHash: artifactQaSha256Schema,
  executionAttestationHash: artifactQaSha256Schema,
}).strict()

const actualSpeechProviderAttemptEvidenceVerifiedSchema = z.object({
  state: z.literal('actual_provider_attempt_receipt_verified_v1'),
  executionAttemptId: artifactQaSafeIdentitySchema,
  runnerClass: z.literal('canonical_private_provider_attempt_receipt_v2'),
  runnerEvidenceHash: artifactQaSha256Schema,
  startedAt: z.string().datetime({ offset: true }),
  finishedAt: z.string().datetime({ offset: true }),
  exitCode: z.literal(0),
  toolIds: z.array(artifactQaSafeIdentitySchema).length(0),
  providerOperationId: z.literal(
    'provider.elevenlabs.generate_storytelling_speech_candidate.v1',
  ),
  providerRoute: z.literal('elevenlabs_eleven_v3_storytelling_speech'),
  providerOutputRole: z.enum([
    'provider_storytelling_speech_audio_mp3',
    'provider_storytelling_speech_alignment_json',
  ]),
  providerWorkAuthorityDigest: artifactQaSha256Schema,
  providerTerminalHash: artifactQaSha256Schema,
  providerOutputSetDigest: artifactQaSha256Schema,
  providerReceiptHash: artifactQaSha256Schema,
  providerQueueClaimId: artifactQaSafeIdentitySchema,
  providerQueueClaimHash: artifactQaSha256Schema,
  providerCandidateReadbackEvidenceHash: artifactQaSha256Schema,
  providerCandidatePrivateObjectIdentityHash: artifactQaSha256Schema,
  productionAuthorityHash: artifactQaSha256Schema,
  sourceAuthorityDigest: artifactQaSha256Schema,
  dispatchGrantId: artifactQaSafeIdentitySchema,
  actualRunVerified: z.literal(true),
}).strict()

const actualVisualCalibrationProviderAttemptEvidenceVerifiedSchema = z.object({
  state: z.literal('actual_provider_attempt_receipt_verified_v1'),
  executionAttemptId: artifactQaSafeIdentitySchema,
  runnerClass: z.literal('canonical_private_provider_attempt_receipt_v2'),
  runnerEvidenceHash: artifactQaSha256Schema,
  startedAt: z.string().datetime({ offset: true }),
  finishedAt: z.string().datetime({ offset: true }),
  exitCode: z.literal(0),
  toolIds: z.array(artifactQaSafeIdentitySchema).length(0),
  providerOperationId: z.literal(
    'provider.google.generate_visual_calibration_candidate.v1',
  ),
  providerRoute: z.literal('gemini_omni_flash'),
  providerOutputRole: z.literal('provider_visual_calibration_video_mp4'),
  providerWorkAuthorityDigest: artifactQaSha256Schema,
  providerTerminalHash: artifactQaSha256Schema,
  providerOutputSetDigest: artifactQaSha256Schema,
  providerReceiptHash: artifactQaSha256Schema,
  providerQueueClaimId: artifactQaSafeIdentitySchema,
  providerQueueClaimHash: artifactQaSha256Schema,
  providerCandidateReadbackEvidenceHash: artifactQaSha256Schema,
  providerCandidatePrivateObjectIdentityHash: artifactQaSha256Schema,
  productionAuthorityHash: artifactQaSha256Schema,
  sourceAuthorityDigest: artifactQaSha256Schema,
  dispatchGrantId: artifactQaSafeIdentitySchema,
  actualRunVerified: z.literal(true),
}).strict()

const actualRunEvidenceSchema = z.union([
  actualRunEvidencePlaceholderSchema,
  actualRunEvidenceVerifiedSchema,
  actualSpeechProviderAttemptEvidenceVerifiedSchema,
  actualVisualCalibrationProviderAttemptEvidenceVerifiedSchema,
])

const artifactAttemptKindSchema = z.enum([
  'initial',
  'retry',
  'approved_fallback',
  'user_approved_replacement',
])

const producedArtifactContentSchema = z.object({
  sha256: artifactQaSha256Schema,
  byteLength: z.number().int().positive().max(128 * 1024 * 1024 * 1024),
  contentType: z.string().trim().min(1).max(160),
}).strict()

const producedArtifactStorageIdentitySchema = z.object({
  storageKind: z.enum(['private_local_test', 'private_gcs_test', 'external_provider_temporary']),
  opaqueObjectIdentityHash: artifactQaSha256Schema,
  providerGeneration: z.string().trim().min(1).max(160).optional(),
  providerEtagHash: artifactQaSha256Schema.optional(),
}).strict()

const producedArtifactPlaceholderSchema = z.object({
  isPlaceholder: z.boolean(),
  scope: z.enum(['none', 'preview_only']),
}).strict()

export const internalProducedArtifactEvidenceSchema = z.object({
  schemaVersion: z.literal('server-internal-produced-artifact-evidence-v1'),
  evidenceOrigin: z.literal('server_injected_internal_artifact_adapter'),
  evidenceClass: z.literal('private_internal_test_attested'),
  artifactVersion: z.number().int().positive().max(10_000),
  attemptKind: artifactAttemptKindSchema,
  replacesArtifactId: artifactQaSafeIdentitySchema.optional(),
  content: producedArtifactContentSchema,
  storageIdentity: producedArtifactStorageIdentitySchema,
  placeholder: producedArtifactPlaceholderSchema,
  actualRunEvidence: actualRunEvidenceSchema,
  completedAt: z.string().datetime({ offset: true }),
}).strict().superRefine((evidence, context) => {
  if (evidence.artifactVersion === 1) {
    if (evidence.attemptKind !== 'initial' || evidence.replacesArtifactId !== undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Artifact version 1 must be the initial attempt and cannot replace another artifact.',
      })
    }
  } else if (evidence.attemptKind === 'initial' || !evidence.replacesArtifactId) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Artifact versions after 1 must identify a replacement predecessor.',
    })
  }
  if (evidence.placeholder.isPlaceholder !== (evidence.placeholder.scope === 'preview_only')) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Placeholder scope must be preview_only exactly when the artifact is a placeholder.',
    })
  }
  const { startedAt, finishedAt } = evidence.actualRunEvidence
  if (startedAt && finishedAt && Date.parse(finishedAt) < Date.parse(startedAt)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Actual-run placeholder finish time cannot precede start time.',
    })
  }
})

export const artifactQaGateIdSchema = z.enum([
  'preflight_gate',
  'work_item_start_gate',
  'provider_request_gate',
  'asset_received_gate',
  'asset_quality_gate',
  'merge_gate',
  'render_preflight_gate',
  'final_qa_gate',
])

export const artifactQaGateStatusSchema = z.enum([
  'passed',
  'warning',
  'failed',
  'blocked',
  'needs_user_review',
  'fallback_required',
])

export const artifactQaGateResultSchema = z.object({
  gateId: artifactQaGateIdSchema,
  category: z.enum([
    'user_intent_match',
    'source_order_and_structure',
    'pacing_and_cuts',
    'captions',
    'color_grade',
    'b_roll',
    'sound_sync',
    'transitions',
    'visual_assets',
    'frame_layout',
    'model_tier_policy',
    'credit_approval',
    'safety_and_claims',
    'render_composition',
    'asset_integrity',
  ]),
  status: artifactQaGateStatusSchema,
  failureScope: z.enum(['none', 'local_asset', 'local_segment', 'global_edit']),
  evidenceHash: artifactQaSha256Schema,
  notesCode: artifactQaSafeIdentitySchema,
}).strict()

export const artifactRecoveryDecisionSchema = z.object({
  state: z.enum([
    'none',
    'auto_recoverable',
    'fallback_available',
    'needs_user_review',
    'needs_new_approval',
    'unrecoverable_in_current_plan',
  ]),
  action: z.enum([
    'none',
    'retry_same',
    'retry_simpler',
    'switch_approved_provider',
    'switch_to_still_card',
    'switch_to_motion_design',
    'switch_to_remotion_only',
    'switch_to_controlled_tool',
    'remove_optional_asset',
    'request_user_review',
    'request_new_approval',
    'block_final_render',
    'cancel_work_item',
  ]),
  approvedWithinSnapshot: z.boolean(),
  reasonCode: artifactQaSafeIdentitySchema,
}).strict()

export const internalArtifactQaEvidenceSchema = z.object({
  schemaVersion: z.literal('server-internal-artifact-qa-evidence-v1'),
  evidenceOrigin: z.literal('server_injected_internal_qa_adapter'),
  evidenceClass: z.literal('private_internal_test_attested'),
  gateResults: z.array(artifactQaGateResultSchema).min(2).max(64),
  recovery: artifactRecoveryDecisionSchema,
  evaluatedAt: z.string().datetime({ offset: true }),
  actualQaEvidenceState: z.enum([
    'actual_qa_evidence_placeholder',
    'actual_structured_svg_qa_verified_v1',
    'actual_structured_json_qa_verified_v1',
    'actual_media_binary_qa_verified_v1',
    'actual_image_tool_qa_verified_v1',
    'actual_audio_tool_qa_verified_v1',
    'actual_remotion_mp4_ffprobe_qa_verified_v1',
    'actual_caption_render_qa_verified_v1',
    'actual_provider_output_integrity_qa_verified_v1',
  ]),
  actualQaVerified: z.boolean(),
}).strict().superRefine((evidence, context) => {
  const gateIds = evidence.gateResults.map((gate) => gate.gateId)
  if (new Set(gateIds).size !== gateIds.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'QA gate IDs must be unique.' })
  }
  for (const requiredGate of ['asset_received_gate', 'asset_quality_gate'] as const) {
    if (!gateIds.includes(requiredGate)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `QA evidence must include ${requiredGate}.`,
      })
    }
  }
  if (
    evidence.actualQaVerified !==
      [
        'actual_structured_svg_qa_verified_v1',
        'actual_structured_json_qa_verified_v1',
        'actual_media_binary_qa_verified_v1',
        'actual_image_tool_qa_verified_v1',
        'actual_audio_tool_qa_verified_v1',
        'actual_remotion_mp4_ffprobe_qa_verified_v1',
        'actual_caption_render_qa_verified_v1',
        'actual_provider_output_integrity_qa_verified_v1',
      ]
        .includes(evidence.actualQaEvidenceState)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Actual QA state and verification flag are inconsistent.',
    })
  }
})

export const persistedArtifactResultSchema = z.object({
  artifactId: artifactQaSafeIdentitySchema,
  identity: artifactQaAuthorityIdentitySchema,
  lineage: canonicalExpectedArtifactLineageSchema,
  artifactVersion: z.number().int().positive().max(10_000),
  attemptKind: artifactAttemptKindSchema,
  replacesArtifactId: artifactQaSafeIdentitySchema.optional(),
  content: producedArtifactContentSchema,
  storageIdentity: producedArtifactStorageIdentitySchema,
  placeholder: producedArtifactPlaceholderSchema,
  actualRunEvidence: actualRunEvidenceSchema,
  resultEvidenceRef: artifactQaBlobRefSchema,
  resultEvidenceHash: artifactQaSha256Schema,
  evidenceClass: z.literal('private_internal_test_attested'),
  liveRuntimeEligible: z.literal(false),
  createdAt: z.string().datetime({ offset: true }),
}).strict()

export const persistedArtifactQaEvaluationSchema = z.object({
  qaEvaluationId: artifactQaSafeIdentitySchema,
  artifactId: artifactQaSafeIdentitySchema,
  identity: artifactQaAuthorityIdentitySchema,
  qaVersion: z.literal(1),
  gateResults: z.array(artifactQaGateResultSchema).min(2).max(64),
  outcome: z.enum(['passed', 'warning', 'failed', 'blocked', 'needs_user_review', 'fallback_required']),
  failureScope: z.enum(['none', 'local_asset', 'local_segment', 'global_edit']),
  recovery: artifactRecoveryDecisionSchema,
  qaEvidenceRef: artifactQaBlobRefSchema,
  qaEvidenceHash: artifactQaSha256Schema,
  evidenceClass: z.literal('private_internal_test_attested'),
  liveRuntimeEligible: z.literal(false),
  createdAt: z.string().datetime({ offset: true }),
}).strict()

export const persistedArtifactReconciliationSchema = z.object({
  reconciliationId: artifactQaSafeIdentitySchema,
  artifactId: artifactQaSafeIdentitySchema,
  qaEvaluationId: artifactQaSafeIdentitySchema,
  identity: artifactQaAuthorityIdentitySchema,
  decision: z.enum([
    'test_merged_not_live_authorized',
    'preview_placeholder_only',
    'fallback_requested',
    'user_review_required',
    'blocked',
  ]),
  replacesSelectedArtifactId: artifactQaSafeIdentitySchema.optional(),
  privateTestDependencySatisfied: z.boolean(),
  liveRuntimeDependencySatisfied: z.literal(false),
  finalRenderAuthorized: z.literal(false),
  reasonCode: artifactQaSafeIdentitySchema,
  createdAt: z.string().datetime({ offset: true }),
}).strict()

export const artifactQaIdempotencyRecordSchema = z.object({
  operation: z.enum(['record_artifact', 'record_qa', 'reconcile_artifact']),
  idempotencyKey: idempotencyKeySchema,
  requestHash: artifactQaSha256Schema,
  responseId: artifactQaSafeIdentitySchema,
  completedAt: z.string().datetime({ offset: true }),
}).strict()

export const artifactQaAuditEventSchema = z.object({
  eventId: artifactQaSafeIdentitySchema,
  eventType: z.enum([
    'artifact_result_recorded',
    'artifact_qa_recorded',
    'artifact_reconciled',
  ]),
  identity: artifactQaAuthorityIdentitySchema,
  artifactId: artifactQaSafeIdentitySchema,
  qaEvaluationId: artifactQaSafeIdentitySchema.optional(),
  reconciliationId: artifactQaSafeIdentitySchema.optional(),
  createdAt: z.string().datetime({ offset: true }),
}).strict()

export const privateArtifactQaAggregateSchema = z.object({
  schemaVersion: z.literal(PRIVATE_ARTIFACT_QA_AGGREGATE_VERSION),
  ownerUserId: artifactQaSafeIdentitySchema,
  workspaceId: artifactQaSafeIdentitySchema,
  revision: z.number().int().nonnegative(),
  artifacts: z.array(persistedArtifactResultSchema).max(32_768),
  qaEvaluations: z.array(persistedArtifactQaEvaluationSchema).max(32_768),
  reconciliations: z.array(persistedArtifactReconciliationSchema).max(32_768),
  idempotencyRecords: z.array(artifactQaIdempotencyRecordSchema).max(98_304),
  auditEvents: z.array(artifactQaAuditEventSchema).max(98_304),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
}).strict()

export const persistedPrivateArtifactQaAggregateSchema = z.object({
  recordVersion: z.literal(PRIVATE_ARTIFACT_QA_AGGREGATE_VERSION),
  source: z.literal('private_artifact_qa_authority_store'),
  aggregate: privateArtifactQaAggregateSchema,
  checksumSha256: artifactQaSha256Schema,
}).strict()

export const persistedPrivateArtifactQaBlobSchema = z.object({
  recordVersion: z.literal(PRIVATE_ARTIFACT_QA_BLOB_VERSION),
  source: z.literal('private_artifact_qa_content_addressed_blob'),
  sha256: artifactQaSha256Schema,
  byteLength: z.number().int().positive().max(1024 * 1024),
  value: z.record(z.string(), z.unknown()),
}).strict()

export const privateArtifactDependencyReadinessSchema = z.object({
  schemaVersion: z.literal('private-artifact-dependency-readiness-v1'),
  identity: z.object({
    workspaceId: artifactQaSafeIdentitySchema,
    projectId: artifactQaSafeIdentitySchema,
    editSessionId: artifactQaSafeIdentitySchema,
    snapshotId: artifactQaSafeIdentitySchema,
    jobId: artifactQaSafeIdentitySchema,
  }).strict(),
  dependencies: z.array(z.object({
    dependencyJobId: artifactQaSafeIdentitySchema,
    approvedWorkItemId: artifactQaSafeIdentitySchema,
    workItemKey: artifactQaSafeIdentitySchema,
    required: z.boolean(),
    expectedAssets: z.array(z.object({
      expectedAssetId: artifactQaSafeIdentitySchema,
      required: z.boolean(),
      state: z.enum([
        'test_merged',
        'waiting_for_asset',
        'waiting_for_qa',
        'fallback_requested',
        'waiting_for_user_review',
        'qa_blocked',
        'preview_placeholder_only',
        'optional_isolated',
      ]),
      selectedArtifactId: artifactQaSafeIdentitySchema.optional(),
      privateTestSatisfied: z.boolean(),
      liveRuntimeSatisfied: z.literal(false),
    }).strict()).max(128),
    privateTestSatisfied: z.boolean(),
    liveRuntimeSatisfied: z.literal(false),
  }).strict()).max(128),
  readinessGroup: z.enum([
    'ready_now_private_test_only',
    'waiting_for_asset',
    'waiting_for_qa',
    'waiting_for_fallback',
    'waiting_for_user_review',
    'blocked_by_qa_or_policy',
  ]),
  privateTestDependencySatisfied: z.boolean(),
  liveRuntimeDependencySatisfied: z.literal(false),
  independentWorkCanContinue: z.literal(true),
  canonicalSnapshotUnmodified: z.literal(true),
  workerExecutionAuthorized: z.literal(false),
  providerCallAuthorized: z.literal(false),
  toolExecutionAuthorized: z.literal(false),
  renderAuthorized: z.literal(false),
  finalRenderAuthorized: z.literal(false),
  blockers: z.array(z.string().trim().min(1).max(1_000)).min(1).max(32),
  readinessHash: artifactQaSha256Schema,
}).strict()

export type ArtifactQaAuthorityIdentity = z.infer<typeof artifactQaAuthorityIdentitySchema>
export type RecordInternalArtifactRequest = z.infer<typeof recordInternalArtifactRequestSchema>
export type RecordInternalQaRequest = z.infer<typeof recordInternalQaRequestSchema>
export type ReconcileInternalArtifactRequest = z.infer<typeof reconcileInternalArtifactRequestSchema>
export type ArtifactQaAuthorityReadRequest = z.infer<typeof artifactQaAuthorityReadRequestSchema>
export type JobDependencyReadinessRequest = z.infer<typeof jobDependencyReadinessRequestSchema>
export type CanonicalExpectedArtifactLineage = z.infer<typeof canonicalExpectedArtifactLineageSchema>
export type InternalProducedArtifactEvidence = z.infer<typeof internalProducedArtifactEvidenceSchema>
export type InternalArtifactQaEvidence = z.infer<typeof internalArtifactQaEvidenceSchema>
export type PersistedArtifactResult = z.infer<typeof persistedArtifactResultSchema>
export type PersistedArtifactQaEvaluation = z.infer<typeof persistedArtifactQaEvaluationSchema>
export type PersistedArtifactReconciliation = z.infer<typeof persistedArtifactReconciliationSchema>
export type PrivateArtifactQaAggregate = z.infer<typeof privateArtifactQaAggregateSchema>
export type PrivateArtifactDependencyReadiness = z.infer<typeof privateArtifactDependencyReadinessSchema>
