import type {
  BackendRuntimeEnvelope,
  BackendRuntimeTransportResult,
} from '../../types/backend-runtime'
import type { MockDatabase } from '../mock/mock-database'
import { insertMockRecord, nowIso } from '../mock/mock-database'
import { validateBackendRuntimeEnvelope } from './backend-runtime-envelope-service'

export function sendBackendRuntimeEnvelope(
  envelope: BackendRuntimeEnvelope<Record<string, unknown>>,
  db?: MockDatabase,
): BackendRuntimeTransportResult {
  if (envelope.transportMode === 'mock' || envelope.transportMode === 'frontend_mock') {
    return sendMockRuntimeEnvelope(envelope, db)
  }

  if (envelope.transportMode === 'backend_http') return sendBackendHttpEnvelopePlaceholder(envelope)
  if (envelope.transportMode === 'supabase_edge_function') return sendSupabaseEdgeEnvelopePlaceholder(envelope)
  if (envelope.transportMode === 'cloud_run_service') return sendCloudRunServiceEnvelopePlaceholder(envelope)
  if (envelope.transportMode === 'cloud_run_job') return sendCloudRunJobEnvelopePlaceholder(envelope)
  if (envelope.transportMode === 'pubsub') return sendPubSubEnvelopePlaceholder(envelope)

  return backendRequired(envelope, 'Runtime transport is disabled or manual.')
}

export function sendMockRuntimeEnvelope(
  envelope: BackendRuntimeEnvelope<Record<string, unknown>>,
  db?: MockDatabase,
): BackendRuntimeTransportResult {
  const errors = validateBackendRuntimeEnvelope(envelope)

  if (errors.length > 0) {
    return {
      ok: false,
      status: 'failed',
      error: {
        code: 'invalid_runtime_envelope',
        message: errors.join(' '),
      },
      warnings: ['No runtime message was sent.'],
      mockOnly: true,
    }
  }

  if (db) {
    insertMockRecord(db, 'backendRuntimeMessages', {
      ...envelope,
      status: 'sent',
      payload: envelope.payload,
      responsePayload: { acknowledged: true, mockOnly: true },
      updatedAt: nowIso(),
    })
  }

  return {
    ok: true,
    status: 'acknowledged',
    response: {
      envelopeId: envelope.id,
      requestId: envelope.requestId,
      acknowledged: true,
      mockOnly: true,
    },
    warnings: ['Mock transport only; no network, Cloud Run, Pub/Sub, or Supabase Edge call happened.'],
    mockOnly: true,
  }
}

export function sendBackendHttpEnvelopePlaceholder(envelope: BackendRuntimeEnvelope): BackendRuntimeTransportResult {
  return backendRequired(envelope, 'Backend HTTP transport is a placeholder and was not called.')
}

export function sendSupabaseEdgeEnvelopePlaceholder(envelope: BackendRuntimeEnvelope): BackendRuntimeTransportResult {
  return backendRequired(envelope, 'Supabase Edge Function transport is a placeholder and was not called.')
}

export function sendCloudRunServiceEnvelopePlaceholder(envelope: BackendRuntimeEnvelope): BackendRuntimeTransportResult {
  return backendRequired(envelope, 'Cloud Run service transport is a placeholder and was not called.')
}

export function sendCloudRunJobEnvelopePlaceholder(envelope: BackendRuntimeEnvelope): BackendRuntimeTransportResult {
  return backendRequired(envelope, 'Cloud Run job transport is a placeholder and was not called.')
}

export function sendPubSubEnvelopePlaceholder(envelope: BackendRuntimeEnvelope): BackendRuntimeTransportResult {
  return backendRequired(envelope, 'Pub/Sub transport is a placeholder and was not called.')
}

export function createRuntimeTransportSummary(result: BackendRuntimeTransportResult): string {
  return result.ok ? `Runtime transport ${result.status}.` : result.error?.message ?? 'Runtime transport failed.'
}

function backendRequired(envelope: BackendRuntimeEnvelope, message: string): BackendRuntimeTransportResult {
  return {
    ok: false,
    status: 'failed',
    error: {
      code: 'backend_runtime_required',
      message,
      details: {
        envelopeId: envelope.id,
        transportMode: envelope.transportMode,
      },
    },
    warnings: ['Real runtime transport is backend-required and intentionally not executed in this repository.'],
    mockOnly: true,
  }
}
