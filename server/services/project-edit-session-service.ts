import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import type {
  CreateProjectEditSessionRequest,
  ProjectEditSessionLifecycleCheckpointRequest,
} from '../validation/project-edit-session-schemas'
import type { ProjectEditSessionRecord } from '../../src/types/project-edit-session'
import { createMockId, getRequiredAuthUserId, mockWarning, nowIso, sanitizeJson } from './service-helpers'

type CreateProjectEditSessionInput = CreateProjectEditSessionRequest & {
  projectId: string
  idempotencyKey: string
}

export type BackendLocalProjectEditSessionRecord = ProjectEditSessionRecord & {
  backendLocalSessionStored: true
  readbackVerified?: true
  providerCallMade: false
  workerJobCreated: false
  renderJobCreated: false
  creditReservedOrSpent: false
  supabaseWriteMade: false
  gcsWriteMade: false
  productReady: false
  mockOnly: true
}

const mockEditSessions = new Map<string, BackendLocalProjectEditSessionRecord>()
const mockEditSessionIdempotency = new Map<string, string>()
const mockEditSessionLifecycleIdempotency = new Map<string, string>()

export function createProjectEditSessionService(context: ServiceContext) {
  return {
    async createProjectEditSession(input: CreateProjectEditSessionInput) {
      const userId = getRequiredAuthUserId(context)
      assertSafeEditSessionInput(input)

      if (context.clients.admin && !context.env.mockOnly) {
        throw new ApiError(
          'MOCK_ONLY',
          'Backend-local edit session creation is mock-safe only until durable edit-session persistence is implemented.',
          409,
        )
      }

      const replayKey = `${input.workspaceId}:${userId}:${input.idempotencyKey}`
      const existingId = mockEditSessionIdempotency.get(replayKey)
      if (existingId) {
        const existing = mockEditSessions.get(existingId)
        if (existing) {
          return {
            editSession: {
              ...existing,
              readbackVerified: true,
            },
            warnings: [
              mockWarning('Backend-local edit session replay'),
              'Existing backend-local edit session returned for the same idempotency key.',
            ],
          }
        }
      }

      const now = nowIso()
      const record: BackendLocalProjectEditSessionRecord = {
        id: createMockId('edit_session'),
        projectId: input.projectId,
        workspaceId: input.workspaceId,
        ownerUserId: userId,
        name: input.name.trim(),
        description: input.description?.trim() || undefined,
        status: 'draft',
        aspectRatio: input.aspectRatio,
        platformTarget: input.platformTarget,
        sourceMediaAssetIds: [],
        selectedEditLevel: input.selectedEditLevel,
        selectedEditPreferenceHandle: input.selectedEditPreferenceHandle?.trim() || undefined,
        doNotCopyRulesActive: Boolean(input.selectedEditPreferenceHandle),
        messageCount: 0,
        revisionCount: 0,
        versionCount: 0,
        previewCount: 0,
        approvalStatus: 'not_requested',
        createdAt: now,
        updatedAt: now,
        lastOpenedAt: now,
        mockOnly: true,
        metadata: {
          ...sanitizeJson(input.metadata),
          backendLocalCreateRoute: true,
          noUploadStarted: true,
          noPlanApproved: true,
          noToolExecutionStarted: true,
          noRenderStarted: true,
          noCreditReservedOrSpent: true,
        },
        backendLocalSessionStored: true,
        readbackVerified: true,
        providerCallMade: false,
        workerJobCreated: false,
        renderJobCreated: false,
        creditReservedOrSpent: false,
        supabaseWriteMade: false,
        gcsWriteMade: false,
        productReady: false,
      }

      mockEditSessions.set(record.id, record)
      mockEditSessionIdempotency.set(replayKey, record.id)

      return {
        editSession: record,
        warnings: [
          mockWarning('Backend-local edit session creation'),
          'Creating an edit session does not upload media, approve a plan, run tools, render, reserve credits, write Supabase/GCS, or unlock beta/production.',
        ],
      }
    },

    async getProjectEditSession(editSessionId: string, workspaceId: string) {
      if (context.clients.admin && !context.env.mockOnly) {
        throw new ApiError(
          'MOCK_ONLY',
          'Backend-local edit session readback is mock-safe only until durable edit-session persistence is implemented.',
          409,
        )
      }

      const existing = mockEditSessions.get(editSessionId)
      if (!existing || existing.workspaceId !== workspaceId) {
        throw new ApiError('PROJECT_NOT_FOUND', 'Backend-local edit session was not found for this workspace.', 404)
      }

      return {
        editSession: {
          ...existing,
          readbackVerified: true,
        },
        warnings: [mockWarning('Backend-local edit session readback')],
      }
    },

    async listProjectEditSessions(input: { projectId: string; workspaceId: string }) {
      if (context.clients.admin && !context.env.mockOnly) {
        throw new ApiError(
          'MOCK_ONLY',
          'Backend-local edit session listing is mock-safe only until durable edit-session persistence is implemented.',
          409,
        )
      }

      const editSessions = Array.from(mockEditSessions.values())
        .filter((session) => session.workspaceId === input.workspaceId && session.projectId === input.projectId)
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))

      return {
        editSessions,
        warnings: [
          mockWarning('Backend-local edit session list'),
          'Listing edit sessions does not upload media, approve plans, run tools, render, reserve credits, write Supabase/GCS, or unlock beta/production.',
        ],
      }
    },

    async recordProjectEditSessionLifecycleCheckpoint(input: ProjectEditSessionLifecycleCheckpointRequest & {
      editSessionId: string
      idempotencyKey: string
    }) {
      const userId = getRequiredAuthUserId(context)
      assertSafeLifecycleCheckpointInput(input)

      if (context.clients.admin && !context.env.mockOnly) {
        throw new ApiError(
          'MOCK_ONLY',
          'Backend-local edit session lifecycle checkpoints are mock-safe only until durable edit-session persistence is implemented.',
          409,
        )
      }

      const replayKey = `${input.workspaceId}:${userId}:${input.idempotencyKey}`
      const replayId = mockEditSessionLifecycleIdempotency.get(replayKey)
      if (replayId) {
        const replayed = mockEditSessions.get(replayId)
        if (replayed) {
          return {
            editSession: { ...replayed, readbackVerified: true },
            warnings: [
              mockWarning('Backend-local edit session lifecycle replay'),
              'Existing backend-local edit session lifecycle state returned for the same idempotency key.',
            ],
          }
        }
      }

      const existing = mockEditSessions.get(input.editSessionId)
      if (!existing || existing.workspaceId !== input.workspaceId) {
        throw new ApiError('PROJECT_NOT_FOUND', 'Backend-local edit session was not found for this workspace.', 404)
      }

      const now = nowIso()
      const checkpointMetadata = sanitizeJson(input.metadata ?? {})
      const checkpoint = {
        checkpointKind: input.checkpointKind,
        recordedAt: now,
        status: input.status,
        approvalStatus: input.approvalStatus ?? existing.approvalStatus,
        sourceMediaAssetId: input.sourceMediaAssetId,
        latestSnapshotId: input.latestSnapshotId,
        latestPreviewId: input.latestPreviewId,
        latestPreviewUrl: input.latestPreviewUrl,
        metadata: checkpointMetadata,
        noToolExecutionStarted: true,
        noProviderCallMade: true,
        noSupabaseWriteMade: true,
        noGcsWriteMade: true,
        productReady: false,
      }
      const checkpointKey = backendLocalCheckpointMetadataKey(input.checkpointKind)
      const updated: BackendLocalProjectEditSessionRecord = {
        ...existing,
        status: input.status,
        approvalStatus: input.approvalStatus ?? existing.approvalStatus,
        latestSnapshotId: input.latestSnapshotId ?? existing.latestSnapshotId,
        latestPreviewId: input.latestPreviewId ?? existing.latestPreviewId,
        latestPreviewUrl: input.latestPreviewUrl ?? existing.latestPreviewUrl,
        sourceMediaAssetIds: addUnique(existing.sourceMediaAssetIds, input.sourceMediaAssetId),
        revisionCount: input.status === 'revision_requested' ? existing.revisionCount + 1 : existing.revisionCount,
        versionCount: input.checkpointKind === 'plan_approved' ? Math.max(existing.versionCount, 1) : existing.versionCount,
        previewCount: input.checkpointKind === 'preview_ready' ? Math.max(existing.previewCount + 1, 1) : existing.previewCount,
        updatedAt: now,
        lastOpenedAt: now,
        metadata: {
          ...(existing.metadata ?? {}),
          noUploadStarted: input.checkpointKind === 'source_uploaded' ? false : existing.metadata?.noUploadStarted,
          noPlanApproved: input.checkpointKind === 'plan_approved' ? false : existing.metadata?.noPlanApproved,
          [checkpointKey]: checkpoint,
          latestBackendLocalCheckpoint: checkpoint,
        },
        readbackVerified: true,
      }

      mockEditSessions.set(updated.id, updated)
      mockEditSessionLifecycleIdempotency.set(replayKey, updated.id)

      return {
        editSession: updated,
        warnings: [
          mockWarning('Backend-local edit session lifecycle checkpoint'),
          'Lifecycle checkpoint updates backend-local edit metadata only; it does not run tools, render, reserve/spend credits, write Supabase/GCS, or unlock beta/production.',
        ],
      }
    },
  }
}

function assertSafeEditSessionInput(input: CreateProjectEditSessionInput): void {
  const values = [
    input.name,
    input.description,
    input.selectedEditPreferenceHandle,
    JSON.stringify(input.metadata ?? {}),
  ].filter(Boolean)

  const unsafeValue = values.find((value) => /service.?role|api.?key|secret|signed.?url|token|sk-[a-z0-9_-]+/i.test(String(value)))
  if (unsafeValue) {
    throw new ApiError('VALIDATION_FAILED', 'Edit session input contains secret-like or signed URL text.', 400)
  }
}

function assertSafeLifecycleCheckpointInput(input: ProjectEditSessionLifecycleCheckpointRequest): void {
  const values = [
    input.sourceMediaAssetId,
    input.latestSnapshotId,
    input.latestPreviewId,
    input.latestPreviewUrl,
    JSON.stringify(input.metadata ?? {}),
  ].filter(Boolean)

  const unsafeValue = values.find((value) => /service.?role|api.?key|secret|signed.?url|token|sk-[a-z0-9_-]+/i.test(String(value)))
  if (unsafeValue) {
    throw new ApiError('VALIDATION_FAILED', 'Edit session lifecycle checkpoint contains secret-like or signed URL text.', 400)
  }
}

function addUnique(values: string[], value: string | undefined): string[] {
  if (!value || values.includes(value)) return values
  return [...values, value]
}

function backendLocalCheckpointMetadataKey(
  checkpointKind: ProjectEditSessionLifecycleCheckpointRequest['checkpointKind'],
): string {
  if (checkpointKind === 'source_uploaded') return 'backendLocalSourceUpload'
  if (checkpointKind === 'brief_saved') return 'backendLocalBrief'
  if (checkpointKind === 'plan_approved') return 'backendLocalPlan'
  if (checkpointKind === 'preview_ready') return 'backendLocalPreview'
  if (checkpointKind === 'preview_reviewed') return 'backendLocalPreviewReview'
  if (checkpointKind === 'final_export_ready') return 'backendLocalFinalExport'
  return 'backendLocalSetupReset'
}
