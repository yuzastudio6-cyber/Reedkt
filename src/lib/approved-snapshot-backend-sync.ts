import { callReeditProApi, getFrontendApiClientStatus } from '../backend/api/frontend-api-client'
import { createExecutionSafeApprovedSnapshotPayload } from './approved-edit-execution-package-client'
import type { ApprovedPlanSnapshot } from '../types/edit-planning-db'

const INTERNAL_TEST_WORKSPACE_ID = 'workspace-internal-testing'

type ApprovedSnapshotBackendRecord = Record<string, unknown> & {
  id?: string
  snapshotJson?: Record<string, unknown>
}

type ApprovedSnapshotBackendResponse = {
  approvedPlanSnapshot?: ApprovedSnapshotBackendRecord
}

type PersistApprovedSnapshotInput = {
  snapshot: ApprovedPlanSnapshot
  workspaceId?: string
  approvedByUserId?: string
  creditApprovalId?: string
  creditReservationId?: string
}

type PersistApprovedSnapshotResult = {
  ok: boolean
  approvedSnapshot: ApprovedPlanSnapshot
  persisted: boolean
  backendApprovedPlanSnapshot?: ApprovedSnapshotBackendRecord
  warnings: string[]
  errorMessage?: string
}

type FetchApprovedSnapshotResult = {
  ok: boolean
  approvedSnapshot?: ApprovedPlanSnapshot
  backendApprovedPlanSnapshot?: ApprovedSnapshotBackendRecord
  persisted: boolean
  warnings: string[]
  errorMessage?: string
}

export async function persistApprovedPlanSnapshotToBackend(
  input: PersistApprovedSnapshotInput,
): Promise<PersistApprovedSnapshotResult> {
  const status = getFrontendApiClientStatus()
  if (status.mockOnly || !status.apiBaseUrl) {
    return {
      ok: true,
      approvedSnapshot: input.snapshot,
      persisted: false,
      warnings: [
        'Approved snapshot backend persistence skipped because reviewed backend HTTP transport is not configured.',
        ...status.warnings,
      ],
    }
  }

  const editPlanId = input.snapshot.editPlanVersionId
  const workspaceId = input.workspaceId ?? INTERNAL_TEST_WORKSPACE_ID
  const creditApprovalId = input.creditApprovalId ?? `mock-credit-approval-${input.snapshot.id}`
  const creditReservationId = input.creditReservationId ?? `mock-credit-reservation-${input.snapshot.id}`

  const response = await callReeditProApi<Record<string, unknown>, ApprovedSnapshotBackendResponse>(
    'planning.approvedSnapshot.create',
    {
      workspaceId,
      projectId: input.snapshot.projectId,
      chatSessionId: input.snapshot.editSessionId,
      creditEstimateId: input.snapshot.creditEstimateId,
      creditApprovalId,
      creditReservationId,
      ...(input.approvedByUserId ? { approvedByUserId: input.approvedByUserId } : {}),
      snapshotVersion: getNumericSnapshotVersion(input.snapshot.snapshotVersion),
      snapshotJson: createApprovedSnapshotBackendPayload(input.snapshot),
      planHash: createStableHash(['plan', input.snapshot.editPlanVersionId, input.snapshot.projectId, input.snapshot.approvedAt]),
      creditHash: createStableHash(['credit', input.snapshot.creditEstimateId, input.snapshot.projectId]),
      sourceSequenceHash: createStableHash(['source-sequence', input.snapshot.sourceSequence]),
      timingHash: createStableHash([
        'timing',
        input.snapshot.masterTimingPlan,
        input.snapshot.captionVisualCueTimingPlan,
        input.snapshot.soundSyncTransitionTimingPlan,
      ]),
    },
    {
      params: { editPlanId },
      context: {
        workspaceId,
        projectId: input.snapshot.projectId,
        userId: input.approvedByUserId ?? input.snapshot.approvedBy,
      },
      idempotencyKey: createApprovedSnapshotIdempotencyKey(input.snapshot),
    },
  )

  if (!response.ok) {
    return {
      ok: false,
      approvedSnapshot: input.snapshot,
      persisted: false,
      warnings: response.warnings,
      errorMessage: response.error?.message ?? 'Approved snapshot backend persistence failed.',
    }
  }

  const backendApprovedPlanSnapshot = response.data?.approvedPlanSnapshot
  const backendSnapshotId = typeof backendApprovedPlanSnapshot?.id === 'string'
    ? backendApprovedPlanSnapshot.id
    : undefined

  return {
    ok: true,
    approvedSnapshot: backendSnapshotId
      ? rebindApprovedPlanSnapshotId(input.snapshot, backendSnapshotId)
      : input.snapshot,
    persisted: true,
    backendApprovedPlanSnapshot,
    warnings: response.warnings,
  }
}

export async function fetchApprovedPlanSnapshotFromBackend(
  snapshotId: string,
  input: {
    workspaceId?: string
    projectId?: string
    userId?: string
  } = {},
): Promise<FetchApprovedSnapshotResult> {
  const status = getFrontendApiClientStatus()
  if (status.mockOnly || !status.apiBaseUrl) {
    return {
      ok: false,
      persisted: false,
      warnings: [
        'Approved snapshot backend read skipped because reviewed backend HTTP transport is not configured.',
        ...status.warnings,
      ],
      errorMessage: 'Approved snapshot backend read requires configured frontend-safe backend HTTP transport.',
    }
  }

  const response = await callReeditProApi<undefined, ApprovedSnapshotBackendResponse>(
    'planning.approvedSnapshot.get',
    undefined,
    {
      params: { snapshotId },
      context: {
        workspaceId: input.workspaceId ?? INTERNAL_TEST_WORKSPACE_ID,
        projectId: input.projectId,
        userId: input.userId,
      },
    },
  )

  if (!response.ok) {
    return {
      ok: false,
      persisted: false,
      warnings: response.warnings,
      errorMessage: response.error?.message ?? 'Approved snapshot backend read failed.',
    }
  }

  const backendApprovedPlanSnapshot = response.data?.approvedPlanSnapshot
  const approvedSnapshot = backendApprovedPlanSnapshot
    ? restoreApprovedPlanSnapshotFromBackendRecord(backendApprovedPlanSnapshot)
    : undefined

  if (!backendApprovedPlanSnapshot || !approvedSnapshot) {
    return {
      ok: false,
      backendApprovedPlanSnapshot,
      persisted: true,
      warnings: [
        ...response.warnings,
        'Approved snapshot backend read returned metadata without executable snapshot JSON.',
      ],
      errorMessage: 'Approved snapshot readback did not include executable snapshot JSON for internal testing recovery.',
    }
  }

  const backendSnapshotId = typeof backendApprovedPlanSnapshot.id === 'string'
    ? backendApprovedPlanSnapshot.id
    : undefined

  return {
    ok: true,
    approvedSnapshot: backendSnapshotId
      ? rebindApprovedPlanSnapshotId(approvedSnapshot, backendSnapshotId)
      : approvedSnapshot,
    backendApprovedPlanSnapshot,
    persisted: true,
    warnings: response.warnings,
  }
}

function createApprovedSnapshotBackendPayload(snapshot: ApprovedPlanSnapshot): Record<string, unknown> {
  return {
    executionApprovedSnapshot: createExecutionSafeApprovedSnapshotPayload(snapshot),
    compiledIntent: snapshot.compiledIntent ?? {},
    confirmedSettings: {
      ...snapshot.settingsSnapshot,
      planningInputTrace: snapshot.planningInputTrace,
    },
    sourceOrder: snapshot.sourceSequence ?? [],
    professionalEditingDirective: snapshot.professionalEditingDirective ?? {},
    segmentOperations: snapshot.operations ?? [],
    visualAssetPlan: snapshot.visualAssetPlanDomain ?? snapshot.visualAssetPlan ?? [],
    rendererPlan: snapshot.rendererCompositionPlanDomain ?? snapshot.rendererCompositionPlan ?? {},
    qaPlan: snapshot.qaPlanDomain ?? snapshot.qaPlan ?? {},
    providerRouting: snapshot.providerPromptPlans ?? [],
    modelTierPolicy: {
      tierConstraints: snapshot.tierConstraints ?? [],
      modelRoutingConstraints: snapshot.modelRoutingConstraints ?? [],
    },
    fallbackPolicy: snapshot.fallbackPolicy ?? [],
    creditEstimate: snapshot.creditEstimateDomain ?? snapshot.creditEstimate ?? {},
    approvalRecord: {
      approvedSnapshotId: snapshot.id,
      approvedAt: snapshot.approvedAt,
      approvedBy: snapshot.approvedBy,
      editPlanVersionId: snapshot.editPlanVersionId,
      creditEstimateId: snapshot.creditEstimateId,
      snapshotVersion: snapshot.snapshotVersion,
    },
  }
}

function restoreApprovedPlanSnapshotFromBackendRecord(
  backendApprovedPlanSnapshot: ApprovedSnapshotBackendRecord,
): ApprovedPlanSnapshot | undefined {
  const snapshotJson = backendApprovedPlanSnapshot.snapshotJson
  const executionApprovedSnapshot = snapshotJson && typeof snapshotJson === 'object'
    ? snapshotJson.executionApprovedSnapshot
    : undefined

  if (!isApprovedPlanSnapshotLike(executionApprovedSnapshot)) {
    return undefined
  }

  return executionApprovedSnapshot as unknown as ApprovedPlanSnapshot
}

function isApprovedPlanSnapshotLike(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false

  const snapshot = value as Record<string, unknown>
  return (
    nonEmptyString(snapshot.id) &&
    nonEmptyString(snapshot.projectId) &&
    nonEmptyString(snapshot.editSessionId) &&
    nonEmptyString(snapshot.editPlanVersionId) &&
    nonEmptyString(snapshot.creditEstimateId) &&
    nonEmptyString(snapshot.approvedAt) &&
    nonEmptyString(snapshot.approvedBy) &&
    Array.isArray(snapshot.sourceSequence) &&
    Array.isArray(snapshot.segments) &&
    Array.isArray(snapshot.operations) &&
    Array.isArray(snapshot.rendererLayers) &&
    Boolean(snapshot.sourcePlan && typeof snapshot.sourcePlan === 'object' && !Array.isArray(snapshot.sourcePlan)) &&
    Boolean(snapshot.creditEstimate && typeof snapshot.creditEstimate === 'object' && !Array.isArray(snapshot.creditEstimate))
  )
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function rebindApprovedPlanSnapshotId(snapshot: ApprovedPlanSnapshot, nextSnapshotId: string): ApprovedPlanSnapshot {
  if (snapshot.id === nextSnapshotId) return snapshot
  return replaceJsonValue(snapshot, snapshot.id, nextSnapshotId) as ApprovedPlanSnapshot
}

function replaceJsonValue(value: unknown, previousValue: string, nextValue: string): unknown {
  if (value === previousValue) return nextValue
  if (Array.isArray(value)) return value.map((item) => replaceJsonValue(item, previousValue, nextValue))
  if (!value || typeof value !== 'object') return value

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .map(([key, nested]) => [key, replaceJsonValue(nested, previousValue, nextValue)]),
  )
}

function getNumericSnapshotVersion(snapshotVersion: string): number {
  const match = snapshotVersion.match(/\d+/)
  return match ? Number(match[0]) : 1
}

function createApprovedSnapshotIdempotencyKey(snapshot: ApprovedPlanSnapshot): string {
  return `approved-snapshot:${snapshot.projectId}:${snapshot.editSessionId}:${snapshot.editPlanVersionId}:${snapshot.snapshotVersion}`.slice(0, 180)
}

function createStableHash(value: unknown): string {
  const text = stableStringify(value)
  let hash = 2166136261
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`
}

function stableStringify(value: unknown): string {
  return JSON.stringify(stableJsonValue(value))
}

function stableJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableJsonValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, nested]) => nested !== undefined)
        .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
        .map(([key, nested]) => [key, stableJsonValue(nested)]),
    )
  }
  return value
}
