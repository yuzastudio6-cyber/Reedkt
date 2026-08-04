import { z } from 'zod'

import { canonicalWorkerLeaseCredentialSchema } from './canonical-worker-lease-authority-schemas'

export const CANONICAL_INTERNAL_AUTHORITY_RUNNER_RESPONSE_VERSION =
  'canonical-internal-authority-runner-response-v1' as const

const safeIdentitySchema = z.string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'), 'Unsafe identity sequence.')

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/)
const timestampSchema = z.string().datetime({ offset: true })

export const runCanonicalInternalAuthorityJobSchema = z.object({
  workspaceId: safeIdentitySchema,
  projectId: safeIdentitySchema,
  editSessionId: safeIdentitySchema,
  jobId: safeIdentitySchema,
  expectedAssetId: safeIdentitySchema,
  purpose: z.enum([
    'execute_canonical_internal_authority_validation',
    'execute_canonical_internal_source_trim_validation',
    'execute_canonical_internal_living_frame_layer_manifest',
  ]),
}).strict()

export const canonicalInternalAuthorityRunnerLeaseSchema = z.object({
  leaseId: safeIdentitySchema,
  leaseCredential: canonicalWorkerLeaseCredentialSchema,
}).strict()

export const canonicalInternalAuthorityRunnerResponseSchema = z.object({
  schemaVersion: z.literal(CANONICAL_INTERNAL_AUTHORITY_RUNNER_RESPONSE_VERSION),
  source: z.enum([
    'canonical_internal_authority_validation_runner',
    'canonical_internal_source_trim_validation_runner',
    'canonical_internal_living_frame_layer_manifest_runner',
  ]),
  purpose: z.enum([
    'execute_canonical_internal_authority_validation',
    'execute_canonical_internal_source_trim_validation',
    'execute_canonical_internal_living_frame_layer_manifest',
  ]),
  identity: z.object({
    workspaceId: safeIdentitySchema,
    projectId: safeIdentitySchema,
    editSessionId: safeIdentitySchema,
    snapshotId: safeIdentitySchema,
    jobId: safeIdentitySchema,
    approvedWorkItemId: safeIdentitySchema,
    expectedAssetId: safeIdentitySchema,
  }).strict(),
  lease: z.object({
    leaseId: safeIdentitySchema,
    attemptNumber: z.number().int().positive().max(10),
    immutableLeaseHash: sha256Schema,
    verifiedActive: z.literal(true),
    executionFenceCompleted: z.literal(true),
    executionStartedAt: timestampSchema,
    executionCommitAuthorizedAt: timestampSchema,
    executionCompletedAt: timestampSchema,
    credentialReturned: z.literal(false),
    credentialHashReturned: z.literal(false),
  }).strict(),
  execution: z.object({
    executionAttemptId: safeIdentitySchema,
    runnerClass: z.enum([
      'canonical_authority_validation_runner_v1',
      'canonical_source_trim_validation_runner_v1',
      'canonical_living_frame_layer_manifest_runner_v1',
    ]),
    operation: z.enum([
      'validate_snapshot_manifest',
      'validate_approved_source_trim_plan',
      'compile_approved_living_frame_remotion_layer_manifest',
    ]),
    actualInternalOperationCompleted: z.literal(true),
    externalToolExecuted: z.literal(false),
    providerCallMade: z.literal(false),
    sourceIntegrityBytesVerified: z.literal(true),
    sourceMediaDecodedOrTransformed: z.literal(false),
    renderExecuted: z.literal(false),
    actualInternalToolCostMicros: z.literal(0),
    serviceFeeIncluded: z.literal(false),
    walletMutationPerformed: z.literal(false),
    settlementPerformed: z.literal(false),
  }).strict(),
  result: z.object({
    artifactId: safeIdentitySchema,
    qaEvaluationId: safeIdentitySchema,
    reconciliationId: safeIdentitySchema,
    artifactVersion: z.number().int().positive().max(10_000),
    contentType: z.literal('application/json'),
    sha256: sha256Schema,
    byteLength: z.number().int().positive().max(1024 * 1024),
    privateObjectIdentityHash: sha256Schema,
    qaOutcome: z.literal('passed'),
    reconciliationDecision: z.literal('test_merged_not_live_authorized'),
    privateTestDependencySatisfied: z.literal(true),
    liveRuntimeDependencySatisfied: z.literal(false),
    finalRenderAuthorized: z.literal(false),
  }).strict(),
  canonicalEvidence: z.object({
    authorityRevision: z.number().int().positive(),
    snapshotHash: sha256Schema,
    planHash: sha256Schema,
    estimateHash: sha256Schema,
    workGraphHash: sha256Schema,
    approvedAssetManifestHash: sha256Schema,
    approvedSourceAssetManifestHash: sha256Schema,
    jobAuthorityHash: sha256Schema,
    fundedReservation: z.literal('passed'),
    exactWorkItemAndOutput: z.literal('passed'),
    sourceAndPlanningAuthority: z.literal('passed'),
    noCanonicalMutation: z.literal(true),
  }).strict(),
  replay: z.object({
    executionFenceBeginReplayed: z.boolean(),
    executionFenceCompleteReplayed: z.boolean(),
    artifactRecordReplayed: z.boolean(),
    qaRecordReplayed: z.boolean(),
    reconciliationReplayed: z.boolean(),
  }).strict(),
  permissions: z.object({
    furtherWorkerDispatch: z.literal(false),
    externalToolExecution: z.literal(false),
    providerCall: z.literal(false),
    sourceObjectRead: z.literal(false),
    render: z.literal(false),
    creditSpend: z.literal(false),
    walletMutation: z.literal(false),
    settlement: z.literal(false),
    delivery: z.literal(false),
  }).strict(),
  persistence: z.object({
    privateLocalCreateOnlyArtifact: z.literal(true),
    contentAddressedArtifactAuthority: z.literal(true),
    checksumProtectedAuthority: z.literal(true),
    productionAuthority: z.literal(false),
  }).strict(),
  completedAt: timestampSchema,
  responseHash: sha256Schema,
  testOnly: z.literal(true),
}).strict()

export type RunCanonicalInternalAuthorityJobInput = z.infer<
  typeof runCanonicalInternalAuthorityJobSchema
>
export type CanonicalInternalAuthorityRunnerLease = z.infer<
  typeof canonicalInternalAuthorityRunnerLeaseSchema
>
export type CanonicalInternalAuthorityRunnerResponse = z.infer<
  typeof canonicalInternalAuthorityRunnerResponseSchema
>
