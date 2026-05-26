import { createHash } from 'node:crypto'
import type { ProductionWorkerJobPayload } from './production-worker-types'

export function normalizePayloadForIdempotency(payload: ProductionWorkerJobPayload): Record<string, unknown> {
  return {
    workspaceId: payload.workspaceId,
    projectId: payload.projectId,
    mediaAssetId: payload.mediaAssetId ?? null,
    approvedSnapshotId: payload.approvedSnapshotId,
    editPlanId: payload.editPlanId ?? null,
    toolExecutionPlanId: payload.toolExecutionPlanId,
    mediaAnalysisReportId: payload.mediaAnalysisReportId ?? null,
    workerType: payload.workerType,
    requestedToolIds: [...payload.requestedToolIds].sort(),
    requestedRecipeIds: [...payload.requestedRecipeIds].sort(),
    storageReferenceIds: [...payload.storageReferenceIds].sort(),
    renderMode: payload.renderMode ?? null,
    requiredQualityGateIds: [...(payload.requiredQualityGateIds ?? [])].sort(),
  }
}

export function buildWorkerIdempotencyKey(payload: ProductionWorkerJobPayload): string {
  const normalized = normalizePayloadForIdempotency(payload)
  const hash = createHash('sha256').update(JSON.stringify(normalized)).digest('hex').slice(0, 24)
  return `prod-worker:${payload.workspaceId}:${payload.projectId}:${payload.toolExecutionPlanId}:${payload.workerType}:${hash}`
}

export function assertIdempotencyKeyMatchesPayload(payload: ProductionWorkerJobPayload): void {
  if (!payload.idempotencyKey) {
    throw new Error('Worker payload requires an idempotency key.')
  }

  const expected = buildWorkerIdempotencyKey(payload)
  if (payload.idempotencyKey !== expected) {
    throw new Error(`Worker idempotency key does not match stable payload IDs. Expected ${expected}.`)
  }
}

export function detectDuplicateToolRun(
  payload: ProductionWorkerJobPayload,
  seenIdempotencyKeys = new Map<string, string>(),
): { duplicate: boolean; existingJobId?: string; message: string } {
  const existingJobId = seenIdempotencyKeys.get(payload.idempotencyKey)
  if (!existingJobId) {
    seenIdempotencyKeys.set(payload.idempotencyKey, payload.jobId)
    return { duplicate: false, message: 'No duplicate production worker idempotency key found.' }
  }

  return {
    duplicate: true,
    existingJobId,
    message: existingJobId === payload.jobId
      ? 'Production worker idempotency key already recorded for this job.'
      : 'Production worker idempotency key conflicts with a different job.',
  }
}
