import { createMockId, nowIso } from '../mock/mock-database'
import type {
  SFXWorkerEventRecord,
  SFXWorkerFailure,
  SFXWorkerInput,
} from './sfx-worker-contracts'

function createEvent(
  input: SFXWorkerInput,
  eventType: SFXWorkerEventRecord['eventType'],
  message: string,
  progressPercent: number,
  payload?: SFXWorkerEventRecord['payload'],
): SFXWorkerEventRecord {
  return {
    id: createMockId('sfx-worker-event'),
    jobId: input.jobId,
    jobBatchId: input.jobBatchId,
    generationRequestId: input.generationRequestId,
    sfxEventPlanId: input.sfxEventPlanId,
    eventType,
    message,
    progressPercent,
    createdAt: nowIso(),
    payload,
  }
}

export function createSFXWorkerStartedEvent(input: SFXWorkerInput) {
  return createEvent(input, 'started', 'Reading SFX event plan.', 5)
}

export function createSFXWorkerProgressEvent(
  input: SFXWorkerInput,
  message: string,
  progressPercent: number,
  payload?: SFXWorkerEventRecord['payload'],
) {
  return createEvent(input, 'progress', message, progressPercent, payload)
}

export function createSFXWorkerBlockedEvent(input: SFXWorkerInput, failure: SFXWorkerFailure) {
  return createEvent(input, 'blocked', failure.message, 100, { failureCode: failure.code })
}

export function createSFXWorkerFailedEvent(input: SFXWorkerInput, failure: SFXWorkerFailure) {
  return createEvent(input, 'failed', failure.message, 100, { failureCode: failure.code })
}

export function createSFXWorkerCompletedEvent(input: SFXWorkerInput) {
  return createEvent(input, 'completed', 'Worker completed mock SFX generation, timing, mix, QA, and library-growth planning.', 100)
}

export function createSFXWorkerLibraryMatchEvent(input: SFXWorkerInput, matchedLibraryAssetId: string) {
  return createEvent(input, 'library_match', 'Approved internal SFX library match used; provider generation skipped.', 35, {
    matchedLibraryAssetId,
  })
}
