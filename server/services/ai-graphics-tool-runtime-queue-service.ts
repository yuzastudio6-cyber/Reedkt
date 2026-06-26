import { ApiError } from '../errors/api-error'
import {
  getAiGraphicsMappedProductionProfile,
  getAiGraphicsToolCallReadiness,
} from '../tool-registry/ai-graphics-tool-call-readiness'
import type { ServiceContext } from '../types'
import { createMockId, mockWarning, nowIso, throwOnSupabaseError } from './service-helpers'

export interface AiGraphicsToolRuntimeQueueJobInput {
  toolId: string
  productionToolId: string
  workerType: string
  runtimeTarget: string
  capabilityIds: string[]
  privateArtifactManifestRef: string
  idempotencyKey: string
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  maxAttempts?: number
  inputPayload?: Record<string, unknown>
}

export interface EnqueueAiGraphicsToolRuntimeJobsInput {
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  jobs: AiGraphicsToolRuntimeQueueJobInput[]
  idempotencyKey: string
  chatSessionId?: string
  editPlanId?: string
  creditEstimateId?: string
  batchName?: string
  createdByUserId?: string
  createdByAgent?: string
}

export interface ClaimAiGraphicsToolRuntimeJobInput {
  jobId: string
  workerType: string
  workerInstanceId: string
  idempotencyKey: string
  leaseSeconds?: number
}

export interface RecordAiGraphicsWorkerEventInput {
  jobId: string
  eventType: string
  message: string
  payload?: Record<string, unknown>
  progressPercent?: number
}

export interface RecordAiGraphicsAuditEventInput {
  workspaceId: string
  projectId: string
  eventType: string
  eventJson?: Record<string, unknown>
  actorUserId?: string
}

export function createAiGraphicsToolRuntimeQueueService(context: ServiceContext) {
  return {
    async enqueueToolRuntimeJobs(input: EnqueueAiGraphicsToolRuntimeJobsInput) {
      validateEnqueueInput(input)

      if (!context.clients.admin || context.env.mockOnly) {
        return {
          queueResult: {
            jobBatchId: createMockId('ai_graphics_job_batch'),
            jobIds: input.jobs.map((job) => createMockId(`ai_graphics_job_${job.toolId}`)),
            insertedJobCount: input.jobs.length,
            idempotentReplay: false,
            liveToolExecutionPerformed: false,
            mockOnly: true,
          },
          warnings: [mockWarning('AI graphics tool-runtime service-role enqueue')],
        }
      }

      const { data, error } = await context.clients.admin.rpc('enqueue_ai_graphics_tool_runtime_jobs', {
        p_workspace_id: input.workspaceId,
        p_project_id: input.projectId,
        p_approved_plan_snapshot_id: input.approvedPlanSnapshotId,
        p_credit_reservation_id: input.creditReservationId,
        p_jobs: input.jobs.map((job) => ({
          toolId: job.toolId,
          productionToolId: job.productionToolId,
          workerType: job.workerType,
          runtimeTarget: job.runtimeTarget,
          capabilityIds: job.capabilityIds,
          privateArtifactManifestRef: job.privateArtifactManifestRef,
          idempotencyKey: job.idempotencyKey,
          priority: job.priority ?? 'normal',
          maxAttempts: job.maxAttempts ?? 3,
          inputPayload: job.inputPayload ?? {},
        })),
        p_idempotency_key: input.idempotencyKey,
        p_chat_session_id: input.chatSessionId ?? null,
        p_edit_plan_id: input.editPlanId ?? null,
        p_credit_estimate_id: input.creditEstimateId ?? null,
        p_batch_name: input.batchName ?? 'AI graphics tool runtime',
        p_created_by_user_id: input.createdByUserId ?? null,
        p_created_by_agent: input.createdByAgent ?? 'ai_graphics_service_role_queue',
      })

      throwOnSupabaseError(error)
      return { queueResult: data, warnings: [] }
    },

    async claimToolRuntimeJob(input: ClaimAiGraphicsToolRuntimeJobInput) {
      if (!input.jobId || !input.workerType || !input.workerInstanceId || !input.idempotencyKey) {
        throw new ApiError('VALIDATION_FAILED', 'Job ID, worker type, worker instance ID, and idempotency key are required.', 400)
      }

      if (!context.clients.admin || context.env.mockOnly) {
        return {
          claimResult: {
            jobId: input.jobId,
            workerClaimId: createMockId('ai_graphics_worker_claim'),
            leaseExpiresAt: new Date(Date.now() + (input.leaseSeconds ?? 900) * 1000).toISOString(),
            toolExecutionPerformed: false,
            mockOnly: true,
          },
          warnings: [mockWarning('AI graphics tool-runtime worker claim')],
        }
      }

      const { data, error } = await context.clients.admin.rpc('claim_ai_graphics_tool_runtime_job', {
        p_job_id: input.jobId,
        p_worker_type: input.workerType,
        p_worker_instance_id: input.workerInstanceId,
        p_idempotency_key: input.idempotencyKey,
        p_lease_seconds: input.leaseSeconds ?? 900,
      })

      throwOnSupabaseError(error, 'WORKER_CLAIM_CONFLICT')
      return { claimResult: data, warnings: [] }
    },

    async recordWorkerEvent(input: RecordAiGraphicsWorkerEventInput) {
      if (!input.jobId || !input.eventType || !input.message) {
        throw new ApiError('VALIDATION_FAILED', 'Job ID, event type, and message are required.', 400)
      }

      if (!context.clients.admin || context.env.mockOnly) {
        return {
          eventResult: {
            jobEventId: createMockId('ai_graphics_job_event'),
            jobId: input.jobId,
            eventType: input.eventType,
            createdAt: nowIso(),
            toolExecutionPerformed: false,
            mockOnly: true,
          },
          warnings: [mockWarning('AI graphics tool-runtime worker event')],
        }
      }

      const { data, error } = await context.clients.admin.rpc('record_ai_graphics_worker_event', {
        p_job_id: input.jobId,
        p_event_type: input.eventType,
        p_message: input.message,
        p_payload: input.payload ?? {},
        p_progress_percent: input.progressPercent ?? null,
      })

      throwOnSupabaseError(error)
      return { eventResult: data, warnings: [] }
    },

    async recordAuditEvent(input: RecordAiGraphicsAuditEventInput) {
      if (!input.workspaceId || !input.projectId || !input.eventType) {
        throw new ApiError('VALIDATION_FAILED', 'Workspace ID, project ID, and event type are required.', 400)
      }

      if (!context.clients.admin || context.env.mockOnly) {
        return {
          auditResult: {
            auditEventId: createMockId('ai_graphics_audit_event'),
            workspaceId: input.workspaceId,
            projectId: input.projectId,
            eventType: input.eventType,
            createdAt: nowIso(),
            toolExecutionPerformed: false,
            mockOnly: true,
          },
          warnings: [mockWarning('AI graphics tool-runtime audit event')],
        }
      }

      const { data, error } = await context.clients.admin.rpc('record_ai_graphics_audit_event', {
        p_workspace_id: input.workspaceId,
        p_project_id: input.projectId,
        p_event_type: input.eventType,
        p_event_json: input.eventJson ?? {},
        p_actor_user_id: input.actorUserId ?? null,
      })

      throwOnSupabaseError(error)
      return { auditResult: data, warnings: [] }
    },
  }
}

function validateEnqueueInput(input: EnqueueAiGraphicsToolRuntimeJobsInput): void {
  if (!input.workspaceId || !input.projectId || !input.approvedPlanSnapshotId || !input.creditReservationId) {
    throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Workspace, project, approved snapshot, and credit reservation are required.', 409)
  }

  if (!input.idempotencyKey) {
    throw new ApiError('VALIDATION_FAILED', 'AI graphics tool-runtime enqueue requires an idempotency key.', 400)
  }

  if (!Array.isArray(input.jobs) || input.jobs.length < 1 || input.jobs.length > 21) {
    throw new ApiError('VALIDATION_FAILED', 'AI graphics tool-runtime enqueue requires 1 to 21 jobs.', 400)
  }

  const toolIds = new Set<string>()
  const jobIdempotencyKeys = new Set<string>()
  for (const job of input.jobs) {
    if (!job.toolId || !job.productionToolId || !job.workerType || !job.runtimeTarget || !job.idempotencyKey || !job.privateArtifactManifestRef) {
      throw new ApiError('VALIDATION_FAILED', 'Each AI graphics tool-runtime job requires tool, worker, runtime, private artifact, and idempotency metadata.', 400)
    }
    if (!Array.isArray(job.capabilityIds)) {
      throw new ApiError('VALIDATION_FAILED', 'Each AI graphics tool-runtime job requires capabilityIds.', 400)
    }
    if (toolIds.has(job.toolId)) {
      throw new ApiError('VALIDATION_FAILED', `Duplicate AI graphics tool-runtime job is not allowed: ${job.toolId}.`, 400)
    }
    toolIds.add(job.toolId)
    if (jobIdempotencyKeys.has(job.idempotencyKey)) {
      throw new ApiError('VALIDATION_FAILED', `Duplicate AI graphics tool-runtime job idempotency key is not allowed: ${job.idempotencyKey}.`, 400)
    }
    jobIdempotencyKeys.add(job.idempotencyKey)
    if (!job.privateArtifactManifestRef.startsWith('private://')) {
      throw new ApiError('VALIDATION_FAILED', 'AI graphics tool-runtime jobs require private artifact manifest references.', 400)
    }
    if (/signed.?url|public:\/\/|https?:\/\/|gcs:\/\//i.test(job.privateArtifactManifestRef)) {
      throw new ApiError('VALIDATION_FAILED', 'Signed URLs, public URLs, and raw GCS URLs are not valid artifact truth for AI graphics tool-runtime jobs.', 400)
    }
    validateCanonicalAiGraphicsRuntimeJob(job)
  }
}

function validateCanonicalAiGraphicsRuntimeJob(job: AiGraphicsToolRuntimeQueueJobInput): void {
  const readiness = getAiGraphicsToolCallReadiness(job.toolId)
  if (!readiness || !readiness.productionToolId) {
    throw new ApiError('VALIDATION_FAILED', `AI graphics tool-runtime job is not in the canonical 21-tool registry: ${job.toolId}.`, 400)
  }

  const productionProfile = getAiGraphicsMappedProductionProfile(readiness.toolId)
  if (!productionProfile) {
    throw new ApiError('VALIDATION_FAILED', `AI graphics production profile is missing for canonical tool: ${job.toolId}.`, 400)
  }

  if (job.productionToolId !== readiness.productionToolId) {
    throw new ApiError(
      'VALIDATION_FAILED',
      `AI graphics productionToolId mismatch for ${job.toolId}: expected ${readiness.productionToolId}.`,
      400,
    )
  }

  if (productionProfile.toolId !== job.productionToolId) {
    throw new ApiError(
      'VALIDATION_FAILED',
      `AI graphics production profile mismatch for ${job.toolId}: expected profile ${job.productionToolId}.`,
      400,
    )
  }

  if (job.workerType !== readiness.productionWorkerType || job.workerType !== productionProfile.workerType) {
    throw new ApiError(
      'VALIDATION_FAILED',
      `AI graphics workerType mismatch for ${job.toolId}: expected ${productionProfile.workerType}.`,
      400,
    )
  }

  if (job.runtimeTarget !== readiness.runtimeTarget) {
    throw new ApiError(
      'VALIDATION_FAILED',
      `AI graphics runtimeTarget mismatch for ${job.toolId}: expected ${readiness.runtimeTarget}.`,
      400,
    )
  }

  const allowedCapabilities = new Set<string>(
    readiness.capabilities.filter((capability) => (
      capability !== 'planning_metadata_only' &&
      capability !== 'blocked_or_deferred'
    )),
  )
  const submittedCapabilities = new Set(job.capabilityIds)
  if (submittedCapabilities.size === 0) {
    throw new ApiError('VALIDATION_FAILED', `AI graphics capabilityIds are required for ${job.toolId}.`, 400)
  }
  for (const capability of submittedCapabilities) {
    if (!allowedCapabilities.has(capability)) {
      throw new ApiError(
        'VALIDATION_FAILED',
        `AI graphics capabilityId ${capability} is not valid for ${job.toolId}.`,
        400,
      )
    }
  }
}
