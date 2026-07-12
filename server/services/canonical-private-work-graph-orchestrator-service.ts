import { createHash } from 'node:crypto'

import { ApiError } from '../errors/api-error'
import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../security/private-local-persistence'
import type { ServiceContext } from '../types'
import {
  canonicalPrivateWorkGraphRunResponseSchema,
  runCanonicalPrivateWorkGraphSchema,
  type CanonicalPrivateWorkGraphJobOutcome,
  type CanonicalPrivateWorkGraphRunResponse,
  type RunCanonicalPrivateWorkGraphBody,
} from '../validation/canonical-private-work-graph-run-schemas'
import { createCanonicalEditExecutionPackageService } from './canonical-edit-execution-package-service'
import { createCanonicalPrivateJobExecutionAdapterService } from './canonical-private-job-execution-adapter-service'
import { getRequiredAuthUserId } from './service-helpers'
import { sha256AuthorityValue, stableAuthorityStringify } from './private-edit-authority-store'

const RESPONSE_PATH_PREFIX = 'private-internal/canonical-work-graph-runs/v1'
const workGraphRunLocks = new Map<string, Promise<void>>()

export interface RunCanonicalPrivateWorkGraphInput extends RunCanonicalPrivateWorkGraphBody {
  packageRecordId: string
  idempotencyKey: string
}

interface PersistedWorkGraphRun {
  schemaVersion: 'canonical-private-work-graph-run-idempotency-v1'
  requestHash: string
  response: CanonicalPrivateWorkGraphRunResponse
}

interface PersistedWorkGraphPackageCompletion {
  schemaVersion: 'canonical-private-work-graph-package-completion-v1'
  packageRecordId: string
  response: CanonicalPrivateWorkGraphRunResponse
}

interface WorkGraphPackageAuthority {
  workspaceId: string
  projectId: string
  editSessionId: string
  packageRecordId: string
  approvedPlanSnapshotId: string
}

/**
 * Advances a canonical package in deterministic dependency order.
 *
 * This orchestrator never accepts a job list, tool, operation, output, lease,
 * provider, price, credit, path, URL, or command. It attempts only jobs whose
 * canonical dependencies completed through the single-job adapter and records
 * exact capability/dependency blockers for everything else.
 */
export function createCanonicalPrivateWorkGraphOrchestratorService(context: ServiceContext) {
  return {
    async findRequiredCompletion(input: {
      packageRecordId: string
      workspaceId: string
    }) {
      if (!safeIdentity(input.packageRecordId) || !safeIdentity(input.workspaceId)) {
        throw new ApiError('VALIDATION_FAILED', 'Canonical private work-graph completion identity is invalid.', 400)
      }
      const actorUserId = getRequiredAuthUserId(context)
      const packageResult = await createCanonicalEditExecutionPackageService(context).getPackage(
        input.packageRecordId,
        input.workspaceId,
      )
      const executionPackage = packageResult.approvedEditExecutionPackage
      const response = await readPersistedPackageCompletion(
        context,
        packageCompletionRelativePath(actorUserId, input.workspaceId, input.packageRecordId),
        executionPackage,
      )
      if (!response) return undefined
      return packageCompletionSummary(response)
    },

    async run(input: RunCanonicalPrivateWorkGraphInput): Promise<CanonicalPrivateWorkGraphRunResponse> {
      const { packageRecordId, idempotencyKey: rawIdempotencyKey, ...requestBody } = input
      const parsed = runCanonicalPrivateWorkGraphSchema.safeParse(requestBody)
      if (!parsed.success || !safeIdentity(packageRecordId)) {
        throw new ApiError(
          'VALIDATION_FAILED',
          'Canonical private work-graph request validation failed.',
          400,
          parsed.success ? { packageRecordId: ['Invalid execution-package identity.'] } : parsed.error.flatten(),
        )
      }
      const body = parsed.data
      const idempotencyKey = requireIdempotencyKey(rawIdempotencyKey)
      const actorUserId = getRequiredAuthUserId(context)
      const requestHash = sha256AuthorityValue({
        operation: 'run_canonical_private_work_graph',
        actorUserId,
        workspaceId: body.workspaceId,
        packageRecordId,
        purpose: body.purpose,
      })
      const responseRelativePath = runResponseRelativePath(
        actorUserId,
        body.workspaceId,
        idempotencyKey,
      )
      return withWorkGraphRunLock(responseRelativePath, async () => {
        const replay = await readPersistedRun(context, responseRelativePath, requestHash)
        if (replay) return markRunReplay(replay)

        const packageResult = await createCanonicalEditExecutionPackageService(context).getPackage(
          packageRecordId,
          body.workspaceId,
        )
        const executionPackage = packageResult.approvedEditExecutionPackage
        if (
          executionPackage.packageRecordId !== packageRecordId ||
          executionPackage.workspaceId !== body.workspaceId ||
          executionPackage.jobs.length === 0 ||
          executionPackage.jobs.length > 256
        ) {
          throw new ApiError('VALIDATION_FAILED', 'Canonical execution package cannot be orchestrated safely.', 409)
        }

        const workItems = new Map(executionPackage.approvedWorkItems.map((workItem) => [workItem.id, workItem]))
        const jobs = [...executionPackage.jobs]
        const jobIds = new Set(jobs.map((job) => job.id))
        if (jobIds.size !== jobs.length || jobs.some((job) =>
          !workItems.has(job.approvedWorkItemId) ||
          job.dependencyJobIds.some((dependencyJobId) => !jobIds.has(dependencyJobId)))) {
          throw new ApiError('VALIDATION_FAILED', 'Canonical package job graph has invalid lineage.', 409)
        }

        const completedJobIds = new Set<string>()
        const outcomes = new Map<string, CanonicalPrivateWorkGraphJobOutcome>()
        const remaining = new Set(jobs.map((job) => job.id))
        const adapter = createCanonicalPrivateJobExecutionAdapterService(context)
        let progress = true
        while (progress) {
          progress = false
          for (const job of jobs) {
            if (!remaining.has(job.id)) continue
            if (!job.dependencyJobIds.every((dependencyJobId) => completedJobIds.has(dependencyJobId))) {
              continue
            }
            const workItem = workItems.get(job.approvedWorkItemId)!
            try {
              const jobExecution = await adapter.execute({
                workspaceId: executionPackage.workspaceId,
                projectId: executionPackage.projectId,
                editSessionId: executionPackage.editSessionId,
                jobId: job.id,
                purpose: 'execute_canonical_private_job',
                idempotencyKey: perJobIdempotencyKey(packageRecordId, job.id, idempotencyKey),
              })
              outcomes.set(job.id, {
                jobId: job.id,
                approvedWorkItemId: job.approvedWorkItemId,
                workItemKey: job.workItemKey,
                required: workItem.required,
                dependencyJobIds: [...job.dependencyJobIds],
                status: 'completed_private_test',
                artifactId: jobExecution.result.artifactId,
                contentType: jobExecution.result.contentType,
                sha256: jobExecution.result.sha256,
                adapterReplayed: jobExecution.evidence.idempotentAdapterReplay,
                blockedDependencyJobIds: [],
              })
              completedJobIds.add(job.id)
            } catch (error) {
              if (!isScopedCapabilityBlocker(error)) throw error
              outcomes.set(job.id, {
                jobId: job.id,
                approvedWorkItemId: job.approvedWorkItemId,
                workItemKey: job.workItemKey,
                required: workItem.required,
                dependencyJobIds: [...job.dependencyJobIds],
                status: 'blocked_by_job_capability',
                adapterReplayed: false,
                blockerCode: error.code,
                requiredGate: requiredGate(error),
                blockedDependencyJobIds: [],
              })
            }
            remaining.delete(job.id)
            progress = true
          }
        }

        for (const job of jobs) {
          if (!remaining.has(job.id)) continue
          const workItem = workItems.get(job.approvedWorkItemId)!
          outcomes.set(job.id, {
            jobId: job.id,
            approvedWorkItemId: job.approvedWorkItemId,
            workItemKey: job.workItemKey,
            required: workItem.required,
            dependencyJobIds: [...job.dependencyJobIds],
            status: 'blocked_by_dependency',
            adapterReplayed: false,
            blockerCode: 'JOB_DEPENDENCY_NOT_READY',
            requiredGate: 'canonical_dependency_jobs_private_test_completion',
            blockedDependencyJobIds: job.dependencyJobIds.filter((dependencyJobId) =>
              !completedJobIds.has(dependencyJobId)),
          })
        }

        const orderedOutcomes = jobs.map((job) => outcomes.get(job.id)!)
        const completedJobCount = orderedOutcomes.filter((job) => job.status === 'completed_private_test').length
        const replayedJobCount = orderedOutcomes.filter((job) => job.adapterReplayed).length
        const capabilityBlockedJobCount = orderedOutcomes.filter((job) =>
          job.status === 'blocked_by_job_capability').length
        const dependencyBlockedJobCount = orderedOutcomes.filter((job) =>
          job.status === 'blocked_by_dependency').length
        const requiredBlockedJobCount = orderedOutcomes.filter((job) =>
          job.required && job.status !== 'completed_private_test').length
        const allRequiredJobsCompleted = requiredBlockedJobCount === 0
        const allJobsCompleted = completedJobCount === orderedOutcomes.length
        const status = allJobsCompleted
          ? 'completed_private_test_work_graph' as const
          : allRequiredJobsCompleted
            ? 'completed_required_jobs_with_optional_blocks' as const
            : 'blocked_required_jobs' as const
        const responseWithoutHash = {
          schemaVersion: 'canonical-private-work-graph-run-response-v1' as const,
          source: 'canonical_private_work_graph_orchestrator' as const,
          purpose: body.purpose,
          identity: {
            workspaceId: executionPackage.workspaceId,
            projectId: executionPackage.projectId,
            editSessionId: executionPackage.editSessionId,
            packageRecordId,
            approvedPlanSnapshotId: executionPackage.approvedPlanSnapshotId,
          },
          status,
          jobs: orderedOutcomes,
          summary: {
            totalJobCount: orderedOutcomes.length,
            completedJobCount,
            replayedJobCount,
            capabilityBlockedJobCount,
            dependencyBlockedJobCount,
            requiredBlockedJobCount,
            allRequiredJobsCompleted,
          },
          evidence: {
            canonicalPackageReloaded: true as const,
            serverDerivedTopologicalOrder: true as const,
            onlyDependencyReadyJobsAttempted: true as const,
            stablePerJobIdempotency: true as const,
            privateArtifactsQaAndReconciliationRequired: true as const,
            idempotentRunReplay: false,
          },
          readiness: {
            privateInternalWorkGraphCompleted: allJobsCompleted,
            privateReviewReady: false as const,
            productReady: false as const,
            externalBetaReady: false as const,
            productionReady: false as const,
            nextRequiredGate: requiredBlockedJobCount > 0
              ? 'canonical_job_capability_blockers' as const
              : 'canonical_terminal_private_review_assembly' as const,
          },
          permissions: deniedPermissions(),
          completedAt: new Date().toISOString(),
          testOnly: true as const,
        }
        const response = canonicalPrivateWorkGraphRunResponseSchema.parse({
          ...responseWithoutHash,
          responseHash: sha256AuthorityValue(responseWithoutHash),
        })
        if (response.summary.allRequiredJobsCompleted) {
          await persistPackageCompletion(context, actorUserId, executionPackage, response)
        }
        const persisted: PersistedWorkGraphRun = {
          schemaVersion: 'canonical-private-work-graph-run-idempotency-v1',
          requestHash,
          response,
        }
        await writePrivateFileCreateOnlyWithinRoot({
          rootPath: context.env.localStorageRoot,
          relativePath: responseRelativePath,
          content: Buffer.from(`${stableAuthorityStringify(persisted)}\n`, 'utf8'),
        })
        return response
      })
    },
  }
}

function deniedPermissions() {
  return {
    providerCall: false as const,
    publicArtifact: false as const,
    publicDelivery: false as const,
    productionRender: false as const,
    customerPriceMutation: false as const,
    customerCreditMutation: false as const,
    walletMutation: false as const,
    settlement: false as const,
    billing: false as const,
    deployment: false as const,
  }
}

function isScopedCapabilityBlocker(error: unknown): error is ApiError {
  return error instanceof ApiError && [
    'TOOL_NOT_READY',
    'JOB_DEPENDENCY_NOT_READY',
    'WORKER_CLAIM_CONFLICT',
    'WORKER_LEASE_EXPIRED',
  ].includes(error.code)
}

function requiredGate(error: ApiError): string {
  if (error.details && typeof error.details === 'object' && !Array.isArray(error.details)) {
    const value = (error.details as Record<string, unknown>).requiredGate
    if (typeof value === 'string' && safeIdentity(value)) return value
  }
  if (error.code === 'JOB_DEPENDENCY_NOT_READY') return 'canonical_dependency_evidence'
  if (error.code === 'WORKER_CLAIM_CONFLICT' || error.code === 'WORKER_LEASE_EXPIRED') {
    return 'canonical_worker_lease_retry_or_recovery'
  }
  return 'canonical_job_execution_capability'
}

function perJobIdempotencyKey(packageRecordId: string, jobId: string, runIdempotencyKey: string): string {
  return `work-graph-job:${sha256(`${packageRecordId}\u0000${jobId}\u0000${runIdempotencyKey}`).slice(0, 48)}`
}

function markRunReplay(response: CanonicalPrivateWorkGraphRunResponse): CanonicalPrivateWorkGraphRunResponse {
  const { responseHash, ...withoutHash } = response
  if (responseHash !== sha256AuthorityValue(withoutHash)) {
    throw new ApiError('VALIDATION_FAILED', 'Canonical work-graph replay response hash is invalid.', 409)
  }
  const replayWithoutHash = {
    ...withoutHash,
    evidence: { ...withoutHash.evidence, idempotentRunReplay: true },
  }
  return canonicalPrivateWorkGraphRunResponseSchema.parse({
    ...replayWithoutHash,
    responseHash: sha256AuthorityValue(replayWithoutHash),
  })
}

async function readPersistedRun(
  context: ServiceContext,
  relativePath: string,
  requestHash: string,
): Promise<CanonicalPrivateWorkGraphRunResponse | undefined> {
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: context.env.localStorageRoot,
    relativePath,
  })
  if (!bytes) return undefined
  let value: unknown
  try {
    value = JSON.parse(bytes.toString('utf8'))
  } catch {
    throw new ApiError('VALIDATION_FAILED', 'Persisted canonical work-graph run is invalid JSON.', 409)
  }
  if (!value || typeof value !== 'object') {
    throw new ApiError('VALIDATION_FAILED', 'Persisted canonical work-graph run is invalid.', 409)
  }
  const record = value as Partial<PersistedWorkGraphRun>
  if (record.schemaVersion !== 'canonical-private-work-graph-run-idempotency-v1') {
    throw new ApiError('VALIDATION_FAILED', 'Persisted canonical work-graph run version is invalid.', 409)
  }
  if (record.requestHash !== requestHash) {
    throw new ApiError('IDEMPOTENCY_CONFLICT', 'Idempotency-Key was reused for another work-graph run.', 409)
  }
  return validatePersistedWorkGraphResponse(record.response)
}

async function persistPackageCompletion(
  context: ServiceContext,
  actorUserId: string,
  executionPackage: WorkGraphPackageAuthority,
  response: CanonicalPrivateWorkGraphRunResponse,
): Promise<void> {
  assertRequiredCompletion(response, executionPackage)
  const relativePath = packageCompletionRelativePath(
    actorUserId,
    executionPackage.workspaceId,
    executionPackage.packageRecordId,
  )
  await withWorkGraphRunLock(relativePath, async () => {
    const existing = await readPersistedPackageCompletion(
      context,
      relativePath,
      executionPackage,
    )
    if (existing) return
    const persisted: PersistedWorkGraphPackageCompletion = {
      schemaVersion: 'canonical-private-work-graph-package-completion-v1',
      packageRecordId: executionPackage.packageRecordId,
      response,
    }
    await writePrivateFileCreateOnlyWithinRoot({
      rootPath: context.env.localStorageRoot,
      relativePath,
      content: Buffer.from(`${stableAuthorityStringify(persisted)}\n`, 'utf8'),
    })
  })
}

async function readPersistedPackageCompletion(
  context: ServiceContext,
  relativePath: string,
  executionPackage: WorkGraphPackageAuthority,
): Promise<CanonicalPrivateWorkGraphRunResponse | undefined> {
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: context.env.localStorageRoot,
    relativePath,
  })
  if (!bytes) return undefined
  let value: unknown
  try {
    value = JSON.parse(bytes.toString('utf8'))
  } catch {
    throw new ApiError('VALIDATION_FAILED', 'Persisted canonical work-graph completion is invalid JSON.', 409)
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError('VALIDATION_FAILED', 'Persisted canonical work-graph completion is invalid.', 409)
  }
  const record = value as Partial<PersistedWorkGraphPackageCompletion>
  if (
    record.schemaVersion !== 'canonical-private-work-graph-package-completion-v1' ||
    record.packageRecordId !== executionPackage.packageRecordId
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Persisted canonical work-graph completion lineage is invalid.', 409)
  }
  const response = validatePersistedWorkGraphResponse(record.response)
  assertRequiredCompletion(response, executionPackage)
  return response
}

function validatePersistedWorkGraphResponse(value: unknown): CanonicalPrivateWorkGraphRunResponse {
  const response = canonicalPrivateWorkGraphRunResponseSchema.safeParse(value)
  if (!response.success) {
    throw new ApiError('VALIDATION_FAILED', 'Persisted canonical work-graph run failed validation.', 409)
  }
  const { responseHash, ...withoutHash } = response.data
  if (responseHash !== sha256AuthorityValue(withoutHash)) {
    throw new ApiError('VALIDATION_FAILED', 'Persisted canonical work-graph run hash is invalid.', 409)
  }
  return response.data
}

function assertRequiredCompletion(
  response: CanonicalPrivateWorkGraphRunResponse,
  executionPackage: WorkGraphPackageAuthority,
): void {
  const completedJobCount = response.jobs.filter((job) =>
    job.status === 'completed_private_test').length
  const replayedJobCount = response.jobs.filter((job) => job.adapterReplayed).length
  const capabilityBlockedJobCount = response.jobs.filter((job) =>
    job.status === 'blocked_by_job_capability').length
  const dependencyBlockedJobCount = response.jobs.filter((job) =>
    job.status === 'blocked_by_dependency').length
  const requiredBlockedJobCount = response.jobs.filter((job) =>
    job.required && job.status !== 'completed_private_test').length
  if (
    response.identity.workspaceId !== executionPackage.workspaceId ||
    response.identity.projectId !== executionPackage.projectId ||
    response.identity.editSessionId !== executionPackage.editSessionId ||
    response.identity.packageRecordId !== executionPackage.packageRecordId ||
    response.identity.approvedPlanSnapshotId !== executionPackage.approvedPlanSnapshotId ||
    response.status === 'blocked_required_jobs' ||
    response.summary.totalJobCount !== response.jobs.length ||
    response.summary.completedJobCount !== completedJobCount ||
    response.summary.replayedJobCount !== replayedJobCount ||
    response.summary.capabilityBlockedJobCount !== capabilityBlockedJobCount ||
    response.summary.dependencyBlockedJobCount !== dependencyBlockedJobCount ||
    response.summary.requiredBlockedJobCount !== requiredBlockedJobCount ||
    requiredBlockedJobCount !== 0 ||
    response.summary.allRequiredJobsCompleted !== true ||
    response.readiness.nextRequiredGate !== 'canonical_terminal_private_review_assembly'
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Canonical work-graph completion authority is inconsistent.', 409)
  }
}

function packageCompletionSummary(response: CanonicalPrivateWorkGraphRunResponse) {
  return {
    packageRecordId: response.identity.packageRecordId,
    approvedPlanSnapshotId: response.identity.approvedPlanSnapshotId,
    responseHash: response.responseHash,
    status: response.status,
    completedAt: response.completedAt,
    totalJobCount: response.summary.totalJobCount,
    completedJobCount: response.summary.completedJobCount,
    requiredBlockedJobCount: 0 as const,
    allRequiredJobsCompleted: true as const,
    nextRequiredGate: 'canonical_terminal_private_review_assembly' as const,
  }
}

function runResponseRelativePath(ownerUserId: string, workspaceId: string, idempotencyKey: string): string {
  const scopeHash = sha256(`${ownerUserId}\u0000${workspaceId}`)
  const keyHash = sha256(`${scopeHash}\u0000${idempotencyKey}`)
  return `${RESPONSE_PATH_PREFIX}/${scopeHash.slice(0, 32)}/${keyHash}.json`
}

function packageCompletionRelativePath(
  ownerUserId: string,
  workspaceId: string,
  packageRecordId: string,
): string {
  const scopeHash = sha256(`${ownerUserId}\u0000${workspaceId}`)
  const packageHash = sha256(`${scopeHash}\u0000${packageRecordId}`)
  return `${RESPONSE_PATH_PREFIX}/${scopeHash.slice(0, 32)}/packages/${packageHash}.json`
}

async function withWorkGraphRunLock<T>(key: string, operation: () => Promise<T>): Promise<T> {
  const previous = workGraphRunLocks.get(key) ?? Promise.resolve()
  let release!: () => void
  const current = new Promise<void>((resolve) => {
    release = resolve
  })
  const tail = previous.catch(() => undefined).then(() => current)
  workGraphRunLocks.set(key, tail)
  await previous.catch(() => undefined)
  try {
    return await operation()
  } finally {
    release()
    if (workGraphRunLocks.get(key) === tail) workGraphRunLocks.delete(key)
  }
}

function requireIdempotencyKey(value: string | undefined): string {
  const normalized = value?.trim()
  if (
    !normalized || normalized.length < 8 || normalized.length > 240 ||
    Array.from(normalized).some((character) => {
      const code = character.charCodeAt(0)
      return code <= 31 || code === 127
    })
  ) {
    throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'A valid Idempotency-Key is required.', 400)
  }
  return normalized
}

function safeIdentity(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(value) && !value.includes('..')
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
