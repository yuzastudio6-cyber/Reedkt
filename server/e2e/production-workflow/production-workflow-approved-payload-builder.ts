import { buildWorkerIdempotencyKey } from '../../workers/production'
import type { ProductionWorkerJobPayload, ProductionWorkerRuntimeType } from '../../workers/production'
import type { ProductionToolId } from '../../tool-registry'
import type { QualityGateType } from '../../../src/backend/contracts/production-tool-runtime-contracts'
import type { ProductionWorkflowFixture } from './production-workflow-fixture-builder'
import type { ProductionWorkflowStage } from './production-workflow-types'

export interface BuildApprovedPayloadInput {
  fixture: ProductionWorkflowFixture
  stage: ProductionWorkflowStage
  workerType: ProductionWorkerRuntimeType
  requestedToolIds: ProductionToolId[]
  requestedRecipeIds: string[]
  requiredQualityGateTypes: QualityGateType[]
  metadata?: Record<string, unknown>
  renderMode?: ProductionWorkerJobPayload['renderMode']
}

export function buildApprovedWorkflowPayload(input: BuildApprovedPayloadInput): ProductionWorkerJobPayload {
  const payload: ProductionWorkerJobPayload = {
    jobId: `job-${input.stage}-${input.fixture.mediaAssetId}`,
    workspaceId: input.fixture.workspaceId,
    projectId: input.fixture.projectId,
    mediaAssetId: input.fixture.mediaAssetId,
    approvedSnapshotId: input.fixture.approvedSnapshotId,
    editPlanId: input.fixture.editPlanId,
    toolExecutionPlanId: `${input.fixture.toolExecutionPlanId}-${input.stage}`,
    workerType: input.workerType,
    executionMode: 'dry_run',
    idempotencyKey: 'pending',
    attempt: 1,
    maxAttempts: 1,
    requestedToolIds: input.requestedToolIds,
    requestedRecipeIds: input.requestedRecipeIds,
    storageReferenceIds: [input.fixture.sourceStorageObjectId],
    renderMode: input.renderMode,
    requiredQualityGateTypes: input.requiredQualityGateTypes,
    createdAt: new Date().toISOString(),
    metadata: {
      workflowStage: input.stage,
      approvedSnapshotOnly: true,
      structuredPlanOnly: true,
      noSignedUrls: true,
      ...(input.metadata ?? {}),
    },
  }
  payload.idempotencyKey = buildWorkerIdempotencyKey(payload)
  return payload
}
