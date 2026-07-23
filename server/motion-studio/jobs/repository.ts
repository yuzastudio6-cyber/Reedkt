import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

import type { MotionStudioWorkGraphDto } from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import type {
  MotionStudioCostBudgetRow,
  MotionStudioAsyncFollowupHeartbeatResult,
  MotionStudioAsyncFollowupLeaseResumeResult,
  MotionStudioLocalMediaRecoveryLeaseResult,
  MotionStudioProviderSuccessReconciliationLeaseResult,
  MotionStudioJobAttemptRow,
  MotionStudioJobClaimResult,
  MotionStudioJobDependencyRow,
  MotionStudioJobRepository,
  MotionStudioJobRow,
  MotionStudioSafeLeaseRow,
  MotionStudioWorkerClaimPackage,
} from './types'

const uuid = z.string().uuid()
const stableId = z.string().min(1).max(200).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
const digest = z.string().regex(/^[a-f0-9]{64}$/)
const safeInteger = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)

const productionRowSchema = z.object({
  id: uuid,
  workspace_id: uuid,
  project_id: uuid,
  edit_session_id: stableId,
  owner_id: uuid,
  module_id: z.literal('storytelling'),
  module_catalog_version: z.literal('motion-studio-module-catalog-v1'),
  stage_profile_id: z.literal('motion-studio-storytelling-stage-profile-v1'),
  status: z.enum(['draft', 'planning', 'awaiting_review', 'approved_for_execution', 'producing', 'blocked', 'reviewing', 'delivery_ready', 'completed', 'archived']),
  current_stage: z.enum(['director_brief', 'story_understanding', 'research', 'story_script', 'references', 'motion_dna', 'voice', 'calibration_reel', 'scene_board', 'storyboard', 'animatic', 'scene_editor', 'picture_lock', 'sound_music', 'fine_cut', 'quality_control', 'delivery']),
  workspace_mode: z.enum(['guided', 'studio']),
  default_production_mode: z.enum(['generative_first', 'layered_first', 'native_graphics_first', 'footage_first', 'hybrid_directed']),
  user_facing_strategy: z.literal("Director's Hybrid"),
  record_version: z.number().int().positive(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1),
}).strict()

const jobStatus = z.enum([
  'waiting', 'queued', 'claimed', 'running', 'cancel_requested',
  'reconciliation_required', 'blocked', 'succeeded', 'failed', 'cancelled',
])
const jobRowSchema = z.object({
  id: stableId,
  workspace_id: uuid,
  project_id: uuid,
  edit_session_id: stableId,
  production_id: uuid,
  approved_snapshot_id: uuid,
  approved_work_item_id: uuid,
  cost_budget_id: stableId,
  work_item_key: stableId,
  sequence_number: z.number().int().positive(),
  work_item_type: stableId,
  required: z.boolean(),
  required_worker_class: stableId,
  status: jobStatus,
  maximum_authorized_internal_cost_micros: safeInteger,
  max_attempts: z.number().int().positive(),
  timeout_seconds: z.number().int().positive(),
  attempt_count: z.number().int().nonnegative(),
  record_version: z.number().int().positive(),
  run_after: z.string().min(1),
  cancellation_requested_at: z.string().nullable(),
  started_at: z.string().nullable(),
  completed_at: z.string().nullable(),
  created_by: uuid,
  created_at: z.string().min(1),
  updated_at: z.string().min(1),
}).strict()
const dependencyRowSchema = z.object({
  approved_snapshot_id: uuid,
  upstream_job_id: stableId,
  downstream_job_id: stableId,
}).strict()
const attemptRowSchema = z.object({
  id: stableId,
  job_id: stableId,
  attempt_number: z.number().int().positive(),
  status: z.enum(['claimed', 'running', 'succeeded', 'failed', 'cancelled', 'unknown']),
  failure_category: stableId.nullable(),
  claimed_at: z.string().min(1),
  started_at: z.string().nullable(),
  completed_at: z.string().nullable(),
  attempt_deadline_at: z.string().min(1),
}).strict()
const safeLeaseRowSchema = z.object({
  attempt_id: stableId,
  status: z.enum(['active', 'released', 'expired']),
  expires_at: z.string().min(1),
  issued_at: z.string().min(1),
}).strict()
const budgetRowSchema = z.object({
  id: stableId,
  production_id: uuid,
  estimate_id: stableId,
  approved_snapshot_id: uuid,
  status: z.enum(['authorized', 'incurring', 'paused', 'released', 'exhausted', 'cancelled']),
}).strict()

const authorizationSchema = z.object({
  productionId: uuid,
  approvedSnapshotId: uuid,
  costBudgetId: stableId,
  costEstimateId: stableId,
  maximumAuthorizedInternalCostMicros: safeInteger,
  customerPricingIncluded: z.literal(false),
  customerCreditsIncluded: z.literal(false),
  jobs: z.array(z.object({
    jobId: stableId,
    workItemKey: stableId,
    status: jobStatus,
    sequenceNumber: z.number().int().positive(),
  }).strict()),
}).strict()
const claimSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('no_ready_job'), productionId: uuid, workerIdentityId: stableId }).strict(),
  z.object({
    status: z.literal('claimed'),
    productionId: uuid,
    jobId: stableId,
    approvedSnapshotId: uuid,
    workItemKey: stableId,
    attemptId: stableId,
    attemptNumber: z.number().int().positive(),
    leaseId: uuid,
    leaseNonce: digest,
    workerIdentityId: stableId,
    expiresAt: z.string().min(1),
    attemptDeadlineAt: z.string().min(1),
    maximumAuthorizedInternalCostMicros: safeInteger,
  }).strict(),
])
const asyncFollowupLeaseResumeSchema = z.object({
  status: z.literal('resumed'),
  productionId: uuid,
  jobId: stableId,
  attemptId: stableId,
  leaseId: uuid,
  leaseNonce: digest,
  workerIdentityId: stableId,
  expiresAt: z.string().min(1),
  externalOperationIdHash: digest,
  attemptCount: z.literal(1),
  providerResubmissionAllowed: z.literal(false),
  automaticPollingAllowed: z.literal(false),
  maximumNetworkCallsPerCommand: z.literal(1),
}).strict()
const asyncFollowupHeartbeatSchema = z.object({
  status: z.literal('active'),
  jobId: stableId,
  attemptId: stableId,
  leaseId: uuid,
  expiresAt: z.string().min(1),
  attemptDeadlineAt: z.string().min(1),
  followupAuthorityExpiresAt: z.string().min(1),
  attemptCount: z.literal(1),
  providerResubmissionAllowed: z.literal(false),
  automaticPollingAllowed: z.literal(false),
  maximumNetworkCallsPerCommand: z.literal(1),
}).strict()
const localMediaRecoveryLeaseSchema = z.object({
  status: z.literal('recovery_ready'),
  productionId: uuid,
  jobId: stableId,
  attemptId: stableId,
  leaseId: uuid,
  leaseNonce: digest,
  workerIdentityId: stableId,
  expiresAt: z.string().min(1),
  attemptDeadlineAt: z.string().min(1),
  externalOperationIdHash: digest,
  attemptCount: z.literal(1),
  providerCallAllowed: z.literal(false),
  providerDownloadAllowed: z.literal(false),
  providerResubmissionAllowed: z.literal(false),
  automaticPollingAllowed: z.literal(false),
  maximumNetworkCalls: z.literal(0),
}).strict()
const providerSuccessReconciliationLeaseSchema = z.object({
  status: z.literal('resumed'),
  productionId: uuid,
  jobId: stableId,
  attemptId: stableId,
  leaseId: uuid,
  leaseNonce: digest,
  workerIdentityId: stableId,
  expiresAt: z.string().min(1),
  attemptDeadlineAt: z.string().min(1),
  externalOperationIdHash: digest,
  attemptCount: z.literal(1),
  providerSubmissionMade: z.literal(false),
  providerResubmissionAllowed: z.literal(false),
  automaticPollingAllowed: z.literal(false),
  maximumNetworkCallsPerCommand: z.literal(1),
  observedProviderStatus: z.literal('Success'),
  providerNativeWidth: z.literal(1364),
  providerNativeHeight: z.literal(768),
  diagnosticStatusQueryCount: z.literal(1),
  observedResponseDigest: digest,
  observedEventDigest: digest,
}).strict()
const mutationReceiptSchema = z.record(z.string(), z.unknown())

const PRODUCTION_SELECT = 'id,workspace_id,project_id,edit_session_id,owner_id,module_id,module_catalog_version,stage_profile_id,status,current_stage,workspace_mode,default_production_mode,user_facing_strategy,record_version,created_at,updated_at'
const JOB_SELECT = 'id,workspace_id,project_id,edit_session_id,production_id,approved_snapshot_id,approved_work_item_id,cost_budget_id,work_item_key,sequence_number,work_item_type,required,required_worker_class,status,maximum_authorized_internal_cost_micros,max_attempts,timeout_seconds,attempt_count,record_version,run_after,cancellation_requested_at,started_at,completed_at,created_by,created_at,updated_at'

export function createSupabaseMotionStudioJobRepository(client: SupabaseClient): MotionStudioJobRepository {
  return {
    async findProduction(productionId) {
      return readMaybe(client.from('motion_studio_productions').select(PRODUCTION_SELECT).eq('id', productionId).maybeSingle(), productionRowSchema, 'Motion Studio production')
    },
    async authorizeWorkGraph(input) {
      const response = await client.rpc('authorize_motion_studio_work_graph', {
        target_production_id: input.productionId,
        target_approved_snapshot_id: input.approvedSnapshotId,
        target_cost_estimate_id: input.costEstimateId,
        target_actor_user_id: input.actorUserId,
        target_idempotency_key: input.idempotencyKey,
        target_request_hash: input.requestHash,
      })
      return readRequired(response, authorizationSchema, 'Motion Studio work-graph authorization')
    },
    async readWorkGraph(productionId) {
      const budget = await readMaybe(
        client.from('production_cost_budgets')
          .select('id,production_id,estimate_id,approved_snapshot_id,status')
          .eq('production_id', productionId).maybeSingle(),
        budgetRowSchema,
        'Motion Studio work-graph budget',
      )
      if (!budget) return undefined
      const jobs = await readMany(
        client.from('jobs').select(JOB_SELECT).eq('production_id', productionId).order('sequence_number'),
        jobRowSchema,
        'Motion Studio jobs',
      )
      const dependencies = await readMany(
        client.from('job_dependencies')
          .select('approved_snapshot_id,upstream_job_id,downstream_job_id')
          .eq('approved_snapshot_id', budget.approved_snapshot_id),
        dependencyRowSchema,
        'Motion Studio job dependencies',
      )
      const attempts = jobs.length === 0 ? [] : await readMany(
        client.from('job_attempts')
          .select('id,job_id,attempt_number,status,failure_category,claimed_at,started_at,completed_at,attempt_deadline_at')
          .in('job_id', jobs.map((job) => job.id)).order('attempt_number', { ascending: false }),
        attemptRowSchema,
        'Motion Studio job attempts',
      )
      const latestAttemptByJob = new Map<string, MotionStudioJobAttemptRow>()
      for (const attempt of attempts) if (!latestAttemptByJob.has(attempt.job_id)) latestAttemptByJob.set(attempt.job_id, attempt)
      const currentAttemptIds = [...latestAttemptByJob.values()].map((attempt) => attempt.id)
      const leases = currentAttemptIds.length === 0 ? [] : await readMany(
        client.from('worker_leases').select('attempt_id,status,expires_at,issued_at')
          .in('attempt_id', currentAttemptIds).order('issued_at', { ascending: false }),
        safeLeaseRowSchema,
        'Motion Studio safe lease projection',
      )
      const latestLeaseByAttempt = new Map<string, MotionStudioSafeLeaseRow>()
      for (const lease of leases) if (!latestLeaseByAttempt.has(lease.attempt_id)) latestLeaseByAttempt.set(lease.attempt_id, lease)
      return mapWorkGraph(budget, jobs, dependencies, latestAttemptByJob, latestLeaseByAttempt)
    },
    async cancelJob(input) {
      const response = await client.rpc('cancel_motion_studio_job', {
        target_job_id: input.jobId,
        target_reason: input.reason,
        target_actor_user_id: input.actorUserId,
        target_idempotency_key: input.idempotencyKey,
        target_request_hash: input.requestHash,
      })
      return readRequired(response, z.object({
        jobId: stableId,
        status: jobStatus,
        releasedUnusedMicros: safeInteger,
      }).strict(), 'Motion Studio job cancellation')
    },
    async claimJob(input) {
      const response = await client.rpc('claim_motion_studio_job', {
        target_production_id: input.productionId,
        target_worker_identity_id: input.workerIdentityId,
        target_candidate_lease_id: input.candidateLeaseId,
        target_candidate_credential_nonce: input.candidateLeaseNonce,
        target_candidate_credential_hash: input.candidateCredentialHash,
        target_lease_duration_seconds: input.leaseDurationSeconds,
        target_actor_user_id: input.actorUserId,
        target_idempotency_key: input.idempotencyKey,
        target_request_hash: input.requestHash,
      })
      return readRequired(response, claimSchema, 'Motion Studio worker claim') as MotionStudioJobClaimResult
    },
    async resumeAsyncFollowupLease(input) {
      const response = await client.rpc('resume_motion_studio_async_followup_lease', {
        target_operation_id: input.operationId,
        target_worker_identity_id: input.workerIdentityId,
        target_candidate_lease_id: input.candidateLeaseId,
        target_candidate_credential_nonce: input.candidateLeaseNonce,
        target_candidate_credential_hash: input.candidateCredentialHash,
        target_lease_duration_seconds: input.leaseDurationSeconds,
        target_actor_user_id: input.actorUserId,
        target_idempotency_key: input.idempotencyKey,
        target_request_hash: input.requestHash,
      })
      return readRequired(
        response,
        asyncFollowupLeaseResumeSchema,
        'Motion Studio asynchronous follow-up lease resume',
      ) as MotionStudioAsyncFollowupLeaseResumeResult
    },
    async heartbeatAsyncFollowupLease(input) {
      const response = await client.rpc('heartbeat_motion_studio_async_followup_lease', {
        target_operation_id: input.operationId,
        target_lease_id: input.leaseId,
        target_credential_hash: input.credentialHash,
        target_extension_seconds: input.extensionSeconds,
        target_actor_user_id: input.actorUserId,
        target_idempotency_key: input.idempotencyKey,
        target_request_hash: input.requestHash,
      })
      return readRequired(
        response,
        asyncFollowupHeartbeatSchema,
        'Motion Studio asynchronous follow-up lease heartbeat',
      ) as MotionStudioAsyncFollowupHeartbeatResult
    },
    async resumeLocalMediaRecoveryLease(input) {
      const response = await client.rpc('resume_motion_studio_local_media_recovery_lease', {
        target_operation_id: input.operationId,
        target_worker_identity_id: input.workerIdentityId,
        target_candidate_lease_id: input.candidateLeaseId,
        target_candidate_credential_nonce: input.candidateLeaseNonce,
        target_candidate_credential_hash: input.candidateCredentialHash,
        target_lease_duration_seconds: input.leaseDurationSeconds,
        target_actor_user_id: input.actorUserId,
        target_idempotency_key: input.idempotencyKey,
        target_request_hash: input.requestHash,
      })
      return readRequired(
        response,
        localMediaRecoveryLeaseSchema,
        'Motion Studio local media recovery lease',
      ) as MotionStudioLocalMediaRecoveryLeaseResult
    },
    async reconcileProviderSuccessLease(input) {
      const response = await client.rpc('reconcile_motion_studio_provider_success', {
        target_operation_id: input.operationId,
        target_original_response_digest: input.originalResponseDigest,
        target_observed_response_digest: input.observedResponseDigest,
        target_observed_event_digest: input.observedEventDigest,
        target_external_operation_id_hash: input.externalOperationIdHash,
        target_provider_width: input.providerWidth,
        target_provider_height: input.providerHeight,
        target_diagnostic_status_query_count: input.diagnosticStatusQueryCount,
        target_observed_at: input.observedAt,
        target_worker_identity_id: input.workerIdentityId,
        target_candidate_lease_id: input.candidateLeaseId,
        target_candidate_credential_nonce: input.candidateLeaseNonce,
        target_candidate_credential_hash: input.candidateCredentialHash,
        target_lease_duration_seconds: input.leaseDurationSeconds,
        target_actor_user_id: input.actorUserId,
        target_idempotency_key: input.idempotencyKey,
        target_request_hash: input.requestHash,
      })
      return readRequired(
        response,
        providerSuccessReconciliationLeaseSchema,
        'Motion Studio provider-success reconciliation lease',
      ) as MotionStudioProviderSuccessReconciliationLeaseResult
    },
    async reconcileHailuoFileParseFailure(input) {
      const response = await client.rpc('reconcile_motion_studio_hailuo_file_parse_failure', {
        target_operation_id: input.operationId,
        target_file_call_id: input.fileCallId,
        target_evidence_digest: input.evidenceDigest,
        target_actor_user_id: input.actorUserId,
        target_idempotency_key: input.idempotencyKey,
        target_request_hash: input.requestHash,
      })
      return readRequired(
        response,
        mutationReceiptSchema,
        'Motion Studio Hailuo file-parse reconciliation',
      )
    },
    async readWorkerClaimPackage(jobId) {
      const job = await readRequired(
        await client.from('jobs').select(JOB_SELECT).eq('id', jobId).single(),
        jobRowSchema,
        'Motion Studio claimed job',
      )
      const approved = await readRequired(
        await client.from('approved_work_items')
          .select('id,approved_snapshot_id,work_item_key,sequence_number,work_item_type,payload_json,payload_digest,required')
          .eq('id', job.approved_work_item_id).eq('approved_snapshot_id', job.approved_snapshot_id).single(),
        z.object({
          id: uuid,
          approved_snapshot_id: uuid,
          work_item_key: stableId,
          sequence_number: z.number().int().positive(),
          work_item_type: stableId,
          payload_json: z.record(z.string(), z.unknown()),
          payload_digest: digest,
          required: z.boolean(),
        }).strict(),
        'Motion Studio approved work item',
      )
      const bindings = await readMany(
        client.from('job_cost_estimate_items').select('estimate_item_id').eq('job_id', jobId),
        z.object({ estimate_item_id: stableId }).strict(),
        'Motion Studio job cost bindings',
      )
      if (bindings.length === 0) throw invalidDatabaseResponse('Motion Studio claimed job cost bindings')
      const costItems = await readMany(
        client.from('production_cost_estimate_items')
          .select('id,capability_or_tool_id,rate_card_version_id,quantity,unit,maximum_authorized_internal_cost_micros')
          .in('id', bindings.map((binding) => binding.estimate_item_id)).order('sequence_number'),
        z.object({
          id: stableId,
          capability_or_tool_id: stableId,
          rate_card_version_id: stableId,
          quantity: z.coerce.number().nonnegative().finite(),
          unit: stableId,
          maximum_authorized_internal_cost_micros: safeInteger,
        }).strict(),
        'Motion Studio bound cost items',
      )
      if (costItems.length !== bindings.length) throw invalidDatabaseResponse('Motion Studio claimed job cost bindings')
      return {
        job,
        approvedWorkItem: {
          id: approved.id,
          approvedSnapshotId: approved.approved_snapshot_id,
          workItemKey: approved.work_item_key,
          sequenceNumber: approved.sequence_number,
          workItemType: approved.work_item_type,
          payload: approved.payload_json,
          payloadDigest: approved.payload_digest,
          required: approved.required,
        },
        costItems: costItems.map((item) => ({
          id: item.id,
          capabilityOrToolId: item.capability_or_tool_id,
          rateCardVersionId: item.rate_card_version_id,
          quantity: item.quantity,
          unit: item.unit,
          maximumAuthorizedInternalCostMicros: item.maximum_authorized_internal_cost_micros,
        })),
      } satisfies MotionStudioWorkerClaimPackage
    },
    startAttempt(input) {
      return rpcMutation(client, 'start_motion_studio_job_attempt', {
        target_lease_id: input.leaseId,
        target_credential_hash: input.credentialHash,
        target_actor_user_id: input.actorUserId,
        target_idempotency_key: input.idempotencyKey,
        target_request_hash: input.requestHash,
      }, 'Motion Studio attempt start')
    },
    heartbeatLease(input) {
      return rpcMutation(client, 'heartbeat_motion_studio_job_lease', {
        target_lease_id: input.leaseId,
        target_credential_hash: input.credentialHash,
        target_extension_seconds: input.extensionSeconds,
        target_actor_user_id: input.actorUserId,
        target_idempotency_key: input.idempotencyKey,
        target_request_hash: input.requestHash,
      }, 'Motion Studio lease heartbeat')
    },
    finishAttempt(input) {
      return rpcMutation(client, 'finish_motion_studio_job_attempt', {
        target_lease_id: input.leaseId,
        target_credential_hash: input.credentialHash,
        target_outcome: input.outcome,
        target_failure_category: input.failureCategory ?? null,
        target_usage_json: input.usage,
        target_outcome_digest: input.outcomeDigest,
        target_actor_user_id: input.actorUserId,
        target_idempotency_key: input.idempotencyKey,
        target_request_hash: input.requestHash,
      }, 'Motion Studio attempt result')
    },
    expireLease(input) {
      return rpcMutation(client, 'expire_motion_studio_job_lease', {
        target_lease_id: input.leaseId,
        target_actor_user_id: input.actorUserId,
        target_idempotency_key: input.idempotencyKey,
        target_request_hash: input.requestHash,
      }, 'Motion Studio lease expiry')
    },
    reconcileAttempt(input) {
      return rpcMutation(client, 'reconcile_motion_studio_job_attempt', {
        target_job_id: input.jobId,
        target_attempt_id: input.attemptId,
        target_decision: input.decision,
        target_usage_json: input.usage,
        target_evidence_digest: input.evidenceDigest,
        target_actor_user_id: input.actorUserId,
        target_idempotency_key: input.idempotencyKey,
        target_request_hash: input.requestHash,
      }, 'Motion Studio attempt reconciliation')
    },
  }
}

function mapWorkGraph(
  budget: MotionStudioCostBudgetRow,
  jobs: readonly MotionStudioJobRow[],
  dependencies: readonly MotionStudioJobDependencyRow[],
  attempts: ReadonlyMap<string, MotionStudioJobAttemptRow>,
  leases: ReadonlyMap<string, MotionStudioSafeLeaseRow>,
): MotionStudioWorkGraphDto {
  const upstreamByJob = new Map<string, string[]>()
  for (const edge of dependencies) {
    const values = upstreamByJob.get(edge.downstream_job_id) ?? []
    values.push(edge.upstream_job_id)
    upstreamByJob.set(edge.downstream_job_id, values)
  }
  return {
    productionId: budget.production_id,
    approvedSnapshotId: budget.approved_snapshot_id,
    costEstimateId: budget.estimate_id,
    status: budget.status,
    jobs: jobs.map((job) => {
      const attempt = attempts.get(job.id)
      const lease = attempt ? leases.get(attempt.id) : undefined
      return {
        id: job.id,
        productionId: job.production_id,
        approvedSnapshotId: job.approved_snapshot_id,
        approvedWorkItemId: job.approved_work_item_id,
        workItemKey: job.work_item_key,
        sequenceNumber: job.sequence_number,
        workItemType: job.work_item_type,
        required: job.required,
        status: job.status,
        attemptCount: job.attempt_count,
        maxAttempts: job.max_attempts,
        runAfter: job.run_after,
        ...(job.cancellation_requested_at ? { cancellationRequestedAt: job.cancellation_requested_at } : {}),
        ...(job.started_at ? { startedAt: job.started_at } : {}),
        ...(job.completed_at ? { completedAt: job.completed_at } : {}),
        upstreamJobIds: upstreamByJob.get(job.id) ?? [],
        ...(attempt ? {
          currentAttempt: {
            id: attempt.id,
            attemptNumber: attempt.attempt_number,
            status: attempt.status,
            ...(attempt.failure_category ? { failureCategory: attempt.failure_category } : {}),
            claimedAt: attempt.claimed_at,
            ...(attempt.started_at ? { startedAt: attempt.started_at } : {}),
            ...(attempt.completed_at ? { completedAt: attempt.completed_at } : {}),
            attemptDeadlineAt: attempt.attempt_deadline_at,
            ...(lease ? { lease: { status: lease.status, expiresAt: lease.expires_at } } : {}),
          },
        } : {}),
      }
    }),
    dependencies: dependencies.map((edge) => ({
      upstreamJobId: edge.upstream_job_id,
      downstreamJobId: edge.downstream_job_id,
    })),
    localCandidateOnly: true,
  }
}

async function rpcMutation(
  client: SupabaseClient,
  functionName: string,
  values: Record<string, unknown>,
  label: string,
): Promise<Record<string, unknown>> {
  return readRequired(await client.rpc(functionName, values), mutationReceiptSchema, label)
}

async function readMaybe<T>(
  promise: PromiseLike<{ data: unknown; error: PostgrestError | null }>,
  schema: z.ZodType<T>,
  label: string,
): Promise<T | undefined> {
  const response = await promise
  if (response.error) throw mapDatabaseError(response.error, `${label} read`)
  if (response.data === null) return undefined
  const parsed = schema.safeParse(response.data)
  if (!parsed.success) throw invalidDatabaseResponse(label)
  return parsed.data
}

async function readMany<T>(
  promise: PromiseLike<{ data: unknown; error: PostgrestError | null }>,
  schema: z.ZodType<T>,
  label: string,
): Promise<T[]> {
  const response = await promise
  if (response.error) throw mapDatabaseError(response.error, `${label} read`)
  const parsed = z.array(schema).safeParse(response.data)
  if (!parsed.success) throw invalidDatabaseResponse(label)
  return parsed.data
}

function readRequired<T>(
  response: { data: unknown; error: PostgrestError | null },
  schema: z.ZodType<T>,
  label: string,
): T {
  if (response.error) throw mapDatabaseError(response.error, label)
  const parsed = schema.safeParse(response.data)
  if (!parsed.success) throw invalidDatabaseResponse(label)
  return parsed.data
}

function invalidDatabaseResponse(label: string): ApiError {
  return new ApiError('INTERNAL_ERROR', `${label} returned an invalid server record.`, 500, undefined, { internal: true })
}

function mapDatabaseError(error: PostgrestError, operation: string): ApiError {
  if (error.code === 'P0002') return new ApiError('MOTION_STUDIO_NOT_FOUND', `${operation} target was not found.`, 404)
  if (error.code === '42501' && /(attempt start|lease heartbeat|attempt result)/i.test(operation)) {
    return new ApiError('WORKER_LEASE_INVALID', `${operation} requires an active exact worker lease credential.`, 401)
  }
  if (error.code === '42501') return new ApiError('WORKSPACE_ACCESS_DENIED', `${operation} is not allowed for this actor.`, 403)
  if (error.code === '23505' || error.code === '40001') return new ApiError('MOTION_STUDIO_CONFLICT', `${operation} conflicted with current authority.`, 409)
  if (error.code === '22003') return new ApiError('MOTION_STUDIO_COST_LIMIT', `${operation} exceeded exact internal-cost authority.`, 409)
  if (['23503', '23514', '55000', '57014'].includes(error.code)) {
    return new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', `${operation} is blocked by exact durable authority.`, 409)
  }
  if (error.code === '22023') return new ApiError('VALIDATION_FAILED', `${operation} input was rejected.`, 400)
  return new ApiError('INTERNAL_ERROR', `${operation} failed.`, 500, undefined, {
    cause: { source: 'postgrest', code: error.code },
    internal: true,
  })
}
