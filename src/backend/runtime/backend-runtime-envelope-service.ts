import type {
  BackendRuntimeEnvelope,
  BackendRuntimeSafetyLevel,
  BackendRuntimeTarget,
  BackendRuntimeTransportMode,
} from '../../types/backend-runtime'
import { createMockId, nowIso } from '../mock/mock-database'

export interface CreateBackendRuntimeEnvelopeInput<TPayload = unknown> {
  requestId?: string
  jobId?: string
  jobBatchId?: string
  workspaceId?: string
  projectId?: string
  editPlanId?: string
  target: BackendRuntimeTarget
  transportMode: BackendRuntimeTransportMode
  safetyLevel: BackendRuntimeSafetyLevel
  payload: TPayload
  idempotencyKey?: string
  expiresAt?: string
  mockOnly?: boolean
}

export function createBackendRuntimeEnvelope<TPayload = unknown>(
  input: CreateBackendRuntimeEnvelopeInput<TPayload>,
): BackendRuntimeEnvelope<TPayload> {
  const requestId = input.requestId ?? createMockId('runtime-request')
  return {
    id: createMockId('runtime-envelope'),
    requestId,
    jobId: input.jobId,
    jobBatchId: input.jobBatchId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editPlanId: input.editPlanId,
    target: input.target,
    transportMode: input.transportMode,
    safetyLevel: input.safetyLevel,
    payload: input.payload,
    idempotencyKey: input.idempotencyKey ?? createRuntimeEnvelopeIdempotencyKey({
      requestId,
      jobId: input.jobId,
      target: input.target,
      transportMode: input.transportMode,
    }),
    createdAt: nowIso(),
    expiresAt: input.expiresAt,
    mockOnly: input.mockOnly ?? (input.transportMode === 'mock' || input.transportMode === 'frontend_mock'),
  }
}

export function createRuntimeEnvelopeIdempotencyKey(input: {
  requestId?: string
  jobId?: string
  target: BackendRuntimeTarget
  transportMode: BackendRuntimeTransportMode
}): string {
  return ['runtime', input.transportMode, input.target, input.jobId ?? 'no-job', input.requestId ?? 'no-request']
    .map((part) => part.replace(/[^a-zA-Z0-9_-]/g, '-'))
    .join(':')
}

export function validateBackendRuntimeEnvelope(envelope: BackendRuntimeEnvelope): string[] {
  const errors: string[] = []

  if (!envelope.requestId) errors.push('Runtime envelope requires requestId.')
  if (!envelope.target) errors.push('Runtime envelope requires target.')
  if (!envelope.transportMode) errors.push('Runtime envelope requires transportMode.')
  if (!envelope.safetyLevel) errors.push('Runtime envelope requires safetyLevel.')
  if (envelope.safetyLevel !== 'frontend_safe' && envelope.transportMode === 'frontend_mock') {
    errors.push('Frontend mock transport cannot carry backend-required or secret-required runtime messages.')
  }
  if (
    envelope.safetyLevel === 'frontend_safe' &&
    ['provider_adapter', 'music_worker', 'sfx_worker', 'video_generation_worker', 'render_worker'].includes(envelope.target)
  ) {
    errors.push('Provider, generation, and render workers cannot be marked frontend_safe.')
  }

  return errors
}

export function createBackendRuntimeEnvelopeSummary(envelope: BackendRuntimeEnvelope): string {
  return `${envelope.transportMode} envelope ${envelope.id} targets ${envelope.target} with ${envelope.safetyLevel} safety.`
}
