import { ApiError } from '../../errors/api-error'
import type { ServiceContext } from '../../types'
import { throwOnSupabaseError } from '../../services/service-helpers'
import type { WorkerJobRecord } from '../worker-job-loader'

const SECRET_LIKE_KEYS = /api[_-]?key|secret|service[_-]?role|signed[_-]?url|password|token/i

export async function runApprovedSnapshotReadinessWorker(
  context: ServiceContext,
  job: WorkerJobRecord,
): Promise<Record<string, unknown>> {
  const snapshotId = job.approvedPlanSnapshotId ?? stringFromPayload(job.inputPayload, 'approvedPlanSnapshotId')
  if (!snapshotId) {
    throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Approved snapshot readiness requires approvedPlanSnapshotId.', 409)
  }

  const snapshotJson = await loadSnapshotJson(context, snapshotId, job)
  const secretPaths = findSecretLikePaths(snapshotJson)
  if (secretPaths.length > 0) {
    throw new ApiError('VALIDATION_FAILED', 'Approved snapshot contains secret-like or signed URL fields.', 409, {
      secretLikePaths: secretPaths,
    })
  }

  return {
    worker: 'approved-snapshot-readiness',
    approvedPlanSnapshotId: snapshotId,
    secretLikePaths: [],
    message: 'Approved snapshot is present and sanitized for worker execution.',
  }
}

async function loadSnapshotJson(context: ServiceContext, snapshotId: string, job: WorkerJobRecord): Promise<Record<string, unknown>> {
  const mockSnapshot = recordFromPayload(job.inputPayload, 'approvedSnapshotJson')
  if (!context.clients.admin || context.env.mockOnly) {
    return mockSnapshot ?? { approvedPlanSnapshotId: snapshotId, mockOnly: true }
  }

  const { data, error } = await context.clients.admin
    .from('approved_plan_snapshots')
    .select('snapshot_json')
    .eq('id', snapshotId)
    .maybeSingle()
  throwOnSupabaseError(error, 'APPROVED_SNAPSHOT_REQUIRED')
  if (!data) throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Approved snapshot was not found.', 404)
  return recordFromPayload(data, 'snapshot_json') ?? {}
}

function findSecretLikePaths(value: unknown, prefix = '$'): string[] {
  if (!value || typeof value !== 'object') return []
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findSecretLikePaths(item, `${prefix}[${index}]`))
  }

  return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) => {
    const path = `${prefix}.${key}`
    const current = SECRET_LIKE_KEYS.test(key) ? [path] : []
    return [...current, ...findSecretLikePaths(nested, path)]
  })
}

function stringFromPayload(payload: Record<string, unknown>, key: string): string | undefined {
  const value = payload[key]
  return typeof value === 'string' ? value : undefined
}

function recordFromPayload(payload: Record<string, unknown>, key: string): Record<string, unknown> | undefined {
  const value = payload[key]
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined
}
