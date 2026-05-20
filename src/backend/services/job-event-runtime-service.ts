import type { JobRuntimeEvent } from '../../types/job-runtime'
import { createMockId, nowIso } from '../mock/mock-database'

export function createJobRuntimeEvent(
  jobId: string,
  eventType: JobRuntimeEvent['eventType'],
  message: string,
  payload?: Record<string, unknown>,
): JobRuntimeEvent {
  return {
    id: createMockId('job-runtime-event'),
    jobId,
    eventType,
    message,
    payload,
    createdAt: nowIso(),
    mockOnly: true,
  }
}

export function createJobCreatedEvent(jobId: string) {
  return createJobRuntimeEvent(jobId, 'created', 'Mock job runtime item created.')
}

export function createJobQueuedEvent(jobId: string) {
  return createJobRuntimeEvent(jobId, 'queued', 'Mock job queued after gate checks.')
}

export function createJobGateCheckedEvent(jobId: string, message = 'Checking worker gates before dispatch.') {
  return createJobRuntimeEvent(jobId, 'gate_checked', message)
}

export function createJobBlockedEvent(jobId: string, message: string) {
  return createJobRuntimeEvent(jobId, 'blocked', message)
}

export function createJobStartedEvent(jobId: string, message = 'Mock worker job started.') {
  return createJobRuntimeEvent(jobId, 'started', message)
}

export function createJobProgressEvent(jobId: string, message: string, payload?: Record<string, unknown>) {
  return createJobRuntimeEvent(jobId, 'progress', message, payload)
}

export function createJobCompletedEvent(jobId: string, message = 'Mock worker job completed.') {
  return createJobRuntimeEvent(jobId, 'completed', message)
}

export function createJobFailedEvent(jobId: string, message: string) {
  return createJobRuntimeEvent(jobId, 'failed', message)
}

export function createJobRetryScheduledEvent(jobId: string, message: string, payload?: Record<string, unknown>) {
  return createJobRuntimeEvent(jobId, 'retry_scheduled', message, payload)
}

export function createJobCancelledEvent(jobId: string, message = 'Mock job cancelled before dispatch.') {
  return createJobRuntimeEvent(jobId, 'cancelled', message)
}

export function createJobEventSummary(events: JobRuntimeEvent[]): string {
  return `${events.length} mock job event(s): ${events.map((event) => event.eventType).join(', ')}.`
}
