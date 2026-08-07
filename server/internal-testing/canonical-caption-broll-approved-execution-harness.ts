import type { EditSkillArtifactStore } from '../edit-skills/core'
import { hashSkillValue } from '../edit-skills/core'
import { ApiError } from '../errors/api-error'
import type { SkillContractRef } from
  '../../src/types/orchestra-skill-contracts'
import type { CanonicalPrivateJobExecutionAdapterResponse } from
  '../validation/canonical-private-job-execution-adapter-schemas'
import type { ServiceContext } from '../types'
import {
  CANONICAL_BROLL_PRIVATE_APPROVED_EXECUTION_SERVICE_VERSION,
  createCanonicalBrollPrivateApprovedExecutionService,
  type CanonicalBrollPrivateApprovedExecutionInput,
} from '../services/canonical-broll-private-approved-execution-service'
import {
  classifyCanonicalInternalServerJob,
  createCanonicalPrivateJobExecutionAdapterService,
} from '../services/canonical-private-job-execution-adapter-service'
import { stableAuthorityStringify } from
  '../services/private-edit-authority-store'
import type {
  createCanonicalCaptionBrollApprovedRunHarness,
} from './canonical-caption-broll-approved-run-harness'

export const CANONICAL_CAPTION_BROLL_APPROVED_EXECUTION_HARNESS_VERSION =
  'canonical-caption-broll-approved-execution-harness-v1' as const

type ApprovedRun = Awaited<ReturnType<
  typeof createCanonicalCaptionBrollApprovedRunHarness
>>

type BrollExecutionInput = Pick<
  CanonicalBrollPrivateApprovedExecutionInput,
  | 'sourceBytes'
  | 'captionOverlay'
  | 'mediaRuntime'
  | 'remotionRuntime'
  | 'integrationInfrastructureCostMicros'
  | 'now'
>

type CanonicalBrollExecutionServiceInputWithoutStore = Omit<
  CanonicalBrollPrivateApprovedExecutionInput,
  'artifactStore'
>

export interface CanonicalCaptionSupportResumeRequirement {
  readonly jobId: string
  readonly ownerUserId: string
  readonly workspaceId: string
  readonly originalCallRef: SkillContractRef
  readonly supportRequestRefs: readonly (SkillContractRef & {
    readonly targetSkillKey: string
  })[]
  readonly reasonCodes: readonly string[]
}

export interface CanonicalCaptionBrollApprovedExecutionHarnessInput {
  readonly context: ServiceContext
  readonly approvedRun: ApprovedRun
  readonly idempotencySeed: string
  readonly resolveCaptionSupportRequirement?: (
    requirement: CanonicalCaptionSupportResumeRequirement,
  ) => Promise<void>
  readonly createBrollArtifactStore: () => EditSkillArtifactStore
  readonly brollExecution: BrollExecutionInput
}

export interface CanonicalCaptionApprovedJobClosureInput {
  readonly context: ServiceContext
  readonly approvedRun: ApprovedRun
  readonly idempotencySeed: string
  readonly resolveCaptionSupportRequirement?: (
    requirement: CanonicalCaptionSupportResumeRequirement,
  ) => Promise<void>
}

export interface CanonicalCaptionApprovedJobExecutionEvidence {
  readonly jobId: string
  readonly workItemKey: string
  readonly captionJob: boolean
  readonly initialResponse: CanonicalPrivateJobExecutionAdapterResponse
  readonly replayResponse: CanonicalPrivateJobExecutionAdapterResponse
  readonly supportResumeCount: number
}

/**
 * Internal qualification coordinator only. It executes the exact immutable
 * Caption job closure through the existing one-job canonical adapter and the
 * exact B-roll component through the existing B-roll approved executor. It is
 * deliberately not a general scheduler, production route, or peer dispatcher.
 */
export async function executeCanonicalCaptionBrollApprovedRun(
  input: CanonicalCaptionBrollApprovedExecutionHarnessInput,
) {
  assertInputAuthority(input)
  const caption = await executeCanonicalCaptionApprovedJobClosure(input)

  const brollInput = canonicalBrollExecutionInput(input)
  const firstBrollService =
    await createCanonicalBrollPrivateApprovedExecutionService({
      ...brollInput,
      artifactStore: input.createBrollArtifactStore(),
    })
  const broll = await firstBrollService.executeAll()
  const restartedBrollService =
    await createCanonicalBrollPrivateApprovedExecutionService({
      ...brollInput,
      artifactStore: input.createBrollArtifactStore(),
    })
  const brollReplay = await restartedBrollService.executeAll()
  if (
    firstBrollService.schemaVersion !==
      CANONICAL_BROLL_PRIVATE_APPROVED_EXECUTION_SERVICE_VERSION ||
    broll.workResults.length !==
      input.approvedRun.broll.canonicalWorkItems.length ||
    broll.workResults.some((result) => result.status !== 'succeeded') ||
    broll.dispatchReceipts.some((receipt) =>
      receipt.status !== 'succeeded' ||
      receipt.providerRequestCount !== 0 ||
      receipt.publicArtifactCount !== 0 ||
      receipt.productionMutationCount !== 0) ||
    hashSkillValue(broll.workResults) !==
      hashSkillValue(brollReplay.workResults) ||
    hashSkillValue(broll.dispatchReceipts) !==
      hashSkillValue(brollReplay.dispatchReceipts)
  ) {
    throw new Error(
      'Caption+B-roll approved execution or restart replay is incomplete.',
    )
  }

  return Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_BROLL_APPROVED_EXECUTION_HARNESS_VERSION,
    ...caption,
    broll,
    brollReplay,
    canonicalBrollApprovedExecutorUsed: true as const,
  })
}

export async function executeCanonicalCaptionApprovedJobClosure(
  input: CanonicalCaptionApprovedJobClosureInput,
) {
  assertInputAuthority(input)
  const orderedJobs = captionJobDependencyClosure(input.approvedRun)
  const adapter = createCanonicalPrivateJobExecutionAdapterService(
    input.context,
  )
  const captionExecutions: CanonicalCaptionApprovedJobExecutionEvidence[] = []

  for (const { job, workItem, captionJob } of orderedJobs) {
    const request = {
      workspaceId: input.approvedRun.approved.authority.snapshot.workspaceId,
      projectId: input.approvedRun.approved.authority.snapshot.projectId,
      editSessionId:
        input.approvedRun.approved.authority.snapshot.editSessionId,
      jobId: job.id,
      purpose: 'execute_canonical_private_job' as const,
      idempotencyKey: `${input.idempotencySeed}.caption-job.${job.id}`,
    }
    let supportResumeCount = 0
    const resumedSupportRequests = new Set<string>()
    let initialResponse: CanonicalPrivateJobExecutionAdapterResponse | null =
      null
    while (initialResponse === null) {
      try {
        initialResponse = await adapter.execute(request)
      } catch (error) {
        const requirement = parseSupportRequirement({
          error,
          jobId: job.id,
          ownerUserId:
            input.approvedRun.approved.authority.snapshot.approvedByUserId,
          workspaceId:
            input.approvedRun.approved.authority.snapshot.workspaceId,
        })
        if (!requirement || !input.resolveCaptionSupportRequirement) throw error
        for (const ref of requirement.supportRequestRefs) {
          const key = contractRefKey(ref)
          if (resumedSupportRequests.has(key)) {
            throw new Error(
              'Caption approved execution repeated the same unresolved support request.',
              { cause: error },
            )
          }
          resumedSupportRequests.add(key)
        }
        supportResumeCount += 1
        if (supportResumeCount > 8) {
          throw new Error(
            'Caption approved execution exceeded its bounded support-resume depth.',
            { cause: error },
          )
        }
        await input.resolveCaptionSupportRequirement(requirement)
      }
    }
    const replayResponse = await adapter.execute(request)
    assertAdapterEvidence({
      snapshotId:
        input.approvedRun.approved.authority.snapshot.snapshotId,
      jobId: job.id,
      workItemId: workItem.id,
      initialResponse,
      replayResponse,
    })
    captionExecutions.push(Object.freeze({
      jobId: job.id,
      workItemKey: workItem.workItemKey,
      captionJob,
      initialResponse,
      replayResponse,
      supportResumeCount,
    }))
  }

  const captionJobCount = captionExecutions.filter((item) =>
    item.captionJob).length
  if (captionJobCount !== input.approvedRun.approvedExecutionAuthority.workItems
    .filter((item) =>
      item.workerClass === 'canonical_caption_specialist_worker_v1').length) {
    throw new Error(
      'Caption approved execution did not cover every specialist work item.',
    )
  }

  return Object.freeze({
    approvedSnapshotRef: Object.freeze({
      id: input.approvedRun.approved.authority.snapshot.snapshotId,
      version:
        input.approvedRun.approved.authority.snapshot.schemaVersion,
      contentHash:
        input.approvedRun.approved.authority.snapshot.snapshotHash,
    }),
    captionExecutions: Object.freeze(captionExecutions),
    captionJobCount,
    captionDependencyJobCount: captionExecutions.length - captionJobCount,
    captionSupportResumeCount: captionExecutions.reduce(
      (sum, item) => sum + item.supportResumeCount,
      0,
    ),
    immutableApprovedPackageReread: true as const,
    canonicalOneJobAdapterUsedForCaption: true as const,
    directPeerDispatchPerformed: false as const,
    providerCallPerformedByHarness: false as const,
    timelineMutationPerformedByHarness: false as const,
    billingOrCreditMutationPerformedByHarness: false as const,
    publicDeliveryCreated: false as const,
    productionAuthorityGranted: false as const,
  })
}

function captionJobDependencyClosure(run: ApprovedRun) {
  const authority = run.approvedExecutionAuthority
  const jobsById = new Map(authority.jobs.map((job) => [job.id, job]))
  const workItemsById = new Map(authority.workItems.map((item) => [item.id, item]))
  const captionJobs = authority.jobs.filter((job) =>
    workItemsById.get(job.approvedWorkItemId)?.workerClass ===
      'canonical_caption_specialist_worker_v1')
  const ordered: Array<{
    job: (typeof authority.jobs)[number]
    workItem: (typeof authority.workItems)[number]
    captionJob: boolean
  }> = []
  const active = new Set<string>()
  const visited = new Set<string>()
  const visit = (jobId: string): void => {
    if (visited.has(jobId)) return
    if (active.has(jobId)) {
      throw new Error('Caption approved job dependency graph contains a cycle.')
    }
    const job = jobsById.get(jobId)
    if (!job) {
      throw new Error('Caption approved job dependency is missing.')
    }
    const workItem = workItemsById.get(job.approvedWorkItemId)
    if (!workItem) {
      throw new Error('Caption approved job work item is missing.')
    }
    active.add(jobId)
    for (const dependencyJobId of job.dependencyJobIds) {
      visit(dependencyJobId)
    }
    active.delete(jobId)
    visited.add(jobId)
    const captionJob = workItem.workerClass ===
      'canonical_caption_specialist_worker_v1'
    const profile = classifyCanonicalInternalServerJob(workItem)
    if (!captionJob && profile?.kind !== 'authority_validation' &&
      profile?.kind !== 'source_trim_validation') {
      throw new Error(
        `Caption approved execution has an unsupported dependency owner: ${workItem.workItemKey}`,
      )
    }
    ordered.push({ job, workItem, captionJob })
  }
  for (const job of captionJobs) visit(job.id)
  return ordered
}

function canonicalBrollExecutionInput(
  input: CanonicalCaptionBrollApprovedExecutionHarnessInput,
): CanonicalBrollExecutionServiceInputWithoutStore {
  const snapshot = input.approvedRun.approved.authority.snapshot
  const componentRef =
    input.approvedRun.broll.persistedComponent.componentRefs.bRollSkill
  const snapshotComponentRef = snapshot.componentRefs.bRollSkill
  const executionPackageComponentRef =
    input.approvedRun.approvedEditExecutionPackage.componentRefs.bRollSkill
  if (!snapshotComponentRef || !executionPackageComponentRef) {
    throw new Error(
      'Caption+B-roll execution is missing immutable B-roll component lineage.',
    )
  }
  return {
    localStorageRoot: input.context.env.localStorageRoot,
    componentRef,
    canonicalWorkItems: input.approvedRun.broll.canonicalWorkItems,
    executionGate: {
      approvedPlanSnapshotId: snapshot.snapshotId,
      snapshotHash: snapshot.snapshotHash,
      reservationId: snapshot.reservationId,
      reservationStatus: 'reserved',
      approved: true,
      privateInternalExecution: true,
      idempotencyKey: `${input.idempotencySeed}.broll-execution`,
      componentRef,
      snapshotComponentRef,
      executionPackageComponentRef,
    },
    sourceBytes: input.brollExecution.sourceBytes,
    captionOverlay: input.brollExecution.captionOverlay,
    mediaRuntime: input.brollExecution.mediaRuntime,
    remotionRuntime: input.brollExecution.remotionRuntime,
    integrationInfrastructureCostMicros:
      input.brollExecution.integrationInfrastructureCostMicros,
    ...(input.brollExecution.now ? { now: input.brollExecution.now } : {}),
  }
}

function parseSupportRequirement(
  input: {
    error: unknown
    jobId: string
    ownerUserId: string
    workspaceId: string
  },
): CanonicalCaptionSupportResumeRequirement | null {
  const { error } = input
  if (!(error instanceof ApiError) ||
    error.code !== 'JOB_DEPENDENCY_NOT_READY' ||
    !isRecord(error.details)) return null
  const originalCallRef = parseSkillRef(error.details.originalCallRef)
  const supportRequestRefs = Array.isArray(error.details.supportRequestRefs)
    ? error.details.supportRequestRefs.map((value) => {
        if (!isRecord(value) || typeof value.targetSkillKey !== 'string') {
          throw new Error('Caption support-request detail is malformed.')
        }
        return {
          ...parseSkillRef(value),
          targetSkillKey: value.targetSkillKey,
        }
      })
    : []
  const reasonCodes = Array.isArray(error.details.reasonCodes) &&
    error.details.reasonCodes.every((value) => typeof value === 'string')
    ? error.details.reasonCodes as string[]
    : []
  if (!originalCallRef || supportRequestRefs.length === 0) return null
  return Object.freeze({
    jobId: input.jobId,
    ownerUserId: input.ownerUserId,
    workspaceId: input.workspaceId,
    originalCallRef,
    supportRequestRefs: Object.freeze(supportRequestRefs),
    reasonCodes: Object.freeze([...reasonCodes]),
  })
}

function parseSkillRef(value: unknown): SkillContractRef {
  if (!isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.version !== 'string' ||
    typeof value.contentHash !== 'string' ||
    !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u.test(value.id) ||
    !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u.test(value.version) ||
    !/^[a-f0-9]{64}$/u.test(value.contentHash)) {
    throw new Error('Caption support lineage ref is malformed.')
  }
  return {
    id: value.id,
    version: value.version,
    contentHash: value.contentHash,
  }
}

function assertAdapterEvidence(input: {
  snapshotId: string
  jobId: string
  workItemId: string
  initialResponse: CanonicalPrivateJobExecutionAdapterResponse
  replayResponse: CanonicalPrivateJobExecutionAdapterResponse
}): void {
  const first = input.initialResponse
  const replay = input.replayResponse
  if (
    first.identity.approvedPlanSnapshotId !== input.snapshotId ||
    first.identity.jobId !== input.jobId ||
    first.identity.approvedWorkItemId !== input.workItemId ||
    first.result.qaOutcome !== 'passed' ||
    !first.evidence.privateArtifactPersisted ||
    !first.evidence.actualQaPassed ||
    !first.evidence.reconciliationPassed ||
    first.evidence.idempotentAdapterReplay ||
    !replay.evidence.idempotentAdapterReplay ||
    stableAuthorityStringify(first.result) !==
      stableAuthorityStringify(replay.result) ||
    Object.values(first.permissions).some(Boolean) ||
    Object.values(replay.permissions).some(Boolean)
  ) {
    throw new Error(
      'Caption canonical job execution or idempotent replay evidence is invalid.',
    )
  }
}

function assertInputAuthority(
  input: CanonicalCaptionApprovedJobClosureInput,
): void {
  const snapshot = input.approvedRun.approved.authority.snapshot
  if (
    input.context.auth?.userId !== snapshot.approvedByUserId ||
    input.context.env.localStorageRoot.length === 0 ||
    input.approvedRun.approvedEditExecutionPackage.approvedPlanSnapshotId !==
      snapshot.snapshotId ||
    input.approvedRun.approvedEditExecutionPackage.snapshotHash !==
      snapshot.snapshotHash ||
    input.approvedRun.approvedExecutionAuthority.snapshot.snapshotId !==
      snapshot.snapshotId
  ) {
    throw new Error(
      'Caption+B-roll approved execution input authority is inconsistent.',
    )
  }
}

function contractRefKey(ref: SkillContractRef): string {
  return `${ref.id}\u0000${ref.version}\u0000${ref.contentHash}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
