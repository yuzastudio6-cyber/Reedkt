import { createHash } from 'node:crypto'
import type { RuntimeEnv } from '../config/env'
import type { EditReferenceRepositoryScope } from './edit-reference-repository'
import {
  EDIT_REFERENCE_LONG_FORM_LOCAL_TECHNICAL_STAGE_IDS,
  executeEditReferenceLongFormStudySpecialistWork,
  executeEditReferenceLongFormStudyTechnicalWork,
} from './edit-reference-long-form-study-executor'
import type { EditReferenceLongFormSpecialistStageExecutor } from './edit-reference-long-form-specialist-pipeline-stage-executor'
import {
  EDIT_REFERENCE_LONG_FORM_SPECIALIST_STAGE_IDS,
  type EditReferenceLongFormSpecialistStageId,
} from './edit-reference-long-form-specialist-stage-contract'
import { PrivateEditReferenceLongFormStudyRepository } from './private-edit-reference-long-form-study-repository'
import type {
  EditReferenceLongFormSourcePurpose,
  EditReferenceLongFormStorageObject,
} from './edit-reference-long-form-source-inspector'

export interface ScheduleEditReferenceLongFormStudyInput {
  readonly env: RuntimeEnv
  readonly scope: EditReferenceRepositoryScope
  readonly runId: string
  readonly storageObject: EditReferenceLongFormStorageObject
  readonly requiredObjectPurpose?: EditReferenceLongFormSourcePurpose
  readonly repository: PrivateEditReferenceLongFormStudyRepository
}

export interface EditReferenceLongFormStudyScheduleResult {
  readonly scheduled: boolean
  readonly alreadyActive: boolean
  readonly runtime: 'backend_local_private' | 'blocked'
  readonly reason?: 'worker_runtime_not_local' | 'storage_runtime_not_local'
}

export type EditReferenceLongFormStudyScheduler = (
  input: ScheduleEditReferenceLongFormStudyInput,
) => EditReferenceLongFormStudyScheduleResult

export interface CreateEditReferenceLongFormStudySchedulerOptions {
  /**
   * Omitted by default so backend-local technical analysis remains safe and
   * provider-free. A caller may inject one explicitly authorized, cost-aware
   * specialist pipeline without changing the durable scheduling contract.
   */
  readonly specialistStageExecutor?: EditReferenceLongFormSpecialistStageExecutor
  /**
   * Narrows an explicitly supplied specialist executor to the stages it owns.
   * This lets one reviewed local specialist advance without consuming attempts
   * for provider-backed stages that remain intentionally unavailable.
   */
  readonly specialistStageIds?: readonly EditReferenceLongFormSpecialistStageId[]
  /**
   * Synchronous observability only. The scheduler retains sole retry/state
   * authority even when this optional reporter is present.
   */
  readonly onBackgroundFailure?: (error: unknown) => void
}

const activeExecutions = new Map<string, Promise<void>>()
const retryTimers = new Map<string, ReturnType<typeof setTimeout>>()

export function createEditReferenceLongFormStudyScheduler(
  options: CreateEditReferenceLongFormStudySchedulerOptions = {},
): EditReferenceLongFormStudyScheduler {
  validateSpecialistStagePolicy(options)
  const schedule: EditReferenceLongFormStudyScheduler = (input) => {
    if (input.env.workerRuntimeMode !== 'local') {
      return { scheduled: false, alreadyActive: false, runtime: 'blocked', reason: 'worker_runtime_not_local' }
    }
    if (input.env.storageMode !== 'local') {
      return { scheduled: false, alreadyActive: false, runtime: 'blocked', reason: 'storage_runtime_not_local' }
    }
    const key = schedulerKey(input)
    if (activeExecutions.has(key)) {
      return { scheduled: true, alreadyActive: true, runtime: 'backend_local_private' }
    }
    const timer = retryTimers.get(key)
    if (timer) {
      clearTimeout(timer)
      retryTimers.delete(key)
    }
    const execution = runScheduledStudy(input, key, schedule, options)
    activeExecutions.set(key, execution)
    return { scheduled: true, alreadyActive: false, runtime: 'backend_local_private' }
  }
  return schedule
}

export const scheduleEditReferenceLongFormStudy = createEditReferenceLongFormStudyScheduler()

async function runScheduledStudy(
  input: ScheduleEditReferenceLongFormStudyInput,
  key: string,
  schedule: EditReferenceLongFormStudyScheduler,
  options: CreateEditReferenceLongFormStudySchedulerOptions,
): Promise<void> {
  let retryAt: string | undefined
  const specialistStageIds = options.specialistStageIds ?? EDIT_REFERENCE_LONG_FORM_SPECIALIST_STAGE_IDS
  try {
    retryAt = await runScheduledPhase(input, 'technical')
    if (!retryAt && options.specialistStageExecutor) {
      retryAt = await runScheduledPhase(
        input,
        'specialist',
        options.specialistStageExecutor,
        specialistStageIds,
      )
    }
  } catch (error) {
    try {
      options.onBackgroundFailure?.(error)
    } catch {
      // Observability must never change durable retry or checkpoint authority.
    }
    retryAt = await nextRetryAt(
      input,
      options.specialistStageExecutor ? specialistStageIds : [],
    ).catch(() => undefined)
  } finally {
    activeExecutions.delete(key)
    if (retryAt) scheduleRetry(input, key, retryAt, schedule)
  }
}

async function runScheduledPhase(
  input: ScheduleEditReferenceLongFormStudyInput,
  phase: 'technical' | 'specialist',
  specialistStageExecutor?: EditReferenceLongFormSpecialistStageExecutor,
  specialistStageIds?: readonly EditReferenceLongFormSpecialistStageId[],
): Promise<string | undefined> {
  for (;;) {
    const common = {
      env: input.env,
      scope: input.scope,
      runId: input.runId,
      storageObject: input.storageObject,
      requiredObjectPurpose: input.requiredObjectPurpose,
      repository: input.repository,
      maximumWorkItems: 1,
    }
    const result = phase === 'technical'
      ? await executeEditReferenceLongFormStudyTechnicalWork(common)
      : await executeEditReferenceLongFormStudySpecialistWork({
          ...common,
          executeStage: specialistStageExecutor as EditReferenceLongFormSpecialistStageExecutor,
          eligibleStageIds: specialistStageIds,
        })
    if (
      result.remainingEligibleWorkItemCount === 0
      || ['completed', 'paused', 'cancelled', 'operator_review_required'].includes(result.disposition)
    ) return undefined
    if (result.disposition === 'idle') {
      return nextRetryAt(input, phase === 'specialist' ? specialistStageIds ?? [] : [])
    }
    await yieldToEventLoop()
  }
}

async function nextRetryAt(
  input: ScheduleEditReferenceLongFormStudyInput,
  specialistStageIds: readonly EditReferenceLongFormSpecialistStageId[],
): Promise<string | undefined> {
  const persisted = await input.repository.read({ scope: input.scope, runId: input.runId })
  if (!persisted) return undefined
  const eligible = new Set([
    ...EDIT_REFERENCE_LONG_FORM_LOCAL_TECHNICAL_STAGE_IDS,
    ...specialistStageIds,
  ])
  return persisted.run.workItems
    .filter((item) => (
      eligible.has(item.stageId as never)
      && item.status === 'retry_wait'
      && item.nextAttemptAt
    ))
    .map((item) => item.nextAttemptAt as string)
    .sort()[0]
}

function validateSpecialistStagePolicy(
  options: CreateEditReferenceLongFormStudySchedulerOptions,
): void {
  if (options.specialistStageIds && !options.specialistStageExecutor) {
    throw new Error('A narrowed specialist stage policy requires an explicitly authorized executor.')
  }
  if (!options.specialistStageIds) return
  const supported = new Set<EditReferenceLongFormSpecialistStageId>(
    EDIT_REFERENCE_LONG_FORM_SPECIALIST_STAGE_IDS,
  )
  if (
    options.specialistStageIds.length < 1
    || new Set(options.specialistStageIds).size !== options.specialistStageIds.length
    || options.specialistStageIds.some((stageId) => !supported.has(stageId))
  ) throw new Error('The long-form scheduler specialist stage policy is invalid.')
}

function scheduleRetry(
  input: ScheduleEditReferenceLongFormStudyInput,
  key: string,
  retryAt: string,
  schedule: EditReferenceLongFormStudyScheduler,
): void {
  const delayMs = Math.max(1_000, Math.min(24 * 60 * 60 * 1_000, Date.parse(retryAt) - Date.now()))
  const timer = setTimeout(() => {
    retryTimers.delete(key)
    schedule(input)
  }, delayMs)
  retryTimers.set(key, timer)
}

function schedulerKey(input: ScheduleEditReferenceLongFormStudyInput): string {
  return createHash('sha256').update([
    input.scope.localStorageRoot,
    input.scope.ownerUserId,
    input.scope.workspaceId,
    input.runId,
  ].join('\u0000')).digest('hex')
}

function yieldToEventLoop(): Promise<void> {
  return new Promise((resolvePromise) => setImmediate(resolvePromise))
}

export async function waitForEditReferenceLongFormStudySchedulerForSmoke(): Promise<void> {
  await Promise.all([...activeExecutions.values()])
}

export function clearEditReferenceLongFormStudySchedulerProcessStateForSmoke(): void {
  for (const timer of retryTimers.values()) clearTimeout(timer)
  retryTimers.clear()
  activeExecutions.clear()
}
