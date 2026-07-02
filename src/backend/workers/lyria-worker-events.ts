import { createMockId, nowIso } from '../mock/mock-database'
import type {
  LyriaWorkerEventRecord,
  LyriaWorkerFailure,
  LyriaWorkerInput,
} from './lyria-worker-contracts'

function createEvent(
  input: LyriaWorkerInput,
  eventType: LyriaWorkerEventRecord['eventType'],
  message: string,
  progressPercent: number,
  payload?: LyriaWorkerEventRecord['payload'],
): LyriaWorkerEventRecord {
  return {
    id: createMockId('lyria-worker-event'),
    jobId: input.jobId,
    jobBatchId: input.jobBatchId,
    generationRequestId: input.generationRequestId,
    eventType,
    message,
    progressPercent,
    createdAt: nowIso(),
    payload,
  }
}

export function createLyriaWorkerStartedEvent(input: LyriaWorkerInput) {
  return createEvent(input, 'started', 'Reading approved music cue.', 5)
}

export function createLyriaWorkerProgressEvent(
  input: LyriaWorkerInput,
  message: string,
  progressPercent: number,
  payload?: LyriaWorkerEventRecord['payload'],
) {
  return createEvent(input, 'progress', message, progressPercent, payload)
}

export function createLyriaWorkerCompletedEvent(input: LyriaWorkerInput) {
  return createEvent(input, 'completed', 'Worker completed mock Lyria generation, QA, and mix planning.', 100)
}

export function createLyriaWorkerFailedEvent(input: LyriaWorkerInput, failure: LyriaWorkerFailure) {
  return createEvent(input, 'failed', failure.message, 100, { failureCode: failure.code })
}

export function createLyriaWorkerBlockedEvent(input: LyriaWorkerInput, failure: LyriaWorkerFailure) {
  return createEvent(input, 'blocked', failure.message, 100, { failureCode: failure.code })
}
