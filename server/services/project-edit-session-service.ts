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
      const resetPolicy = backendLocalCheckpointResetPolicy(input.checkpointKind)
      const nextApprovalStatus = input.approvalStatus ?? backendLocalCheckpointApprovalStatus(input.checkpointKind, existing.approvalStatus)
      const nextMetadata = {
        ...(existing.metadata ?? {}),
      }
      for (const key of resetPolicy.clearMetadataKeys) {
        delete nextMetadata[key]
      }
      const checkpoint = {
        checkpointKind: input.checkpointKind,
        recordedAt: now,
        status: input.status,
        approvalStatus: nextApprovalStatus,
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
        approvalStatus: nextApprovalStatus,
        latestSnapshotId: input.latestSnapshotId ?? (resetPolicy.clearLatestSnapshot ? undefined : existing.latestSnapshotId),
        latestPreviewId: input.latestPreviewId ?? (resetPolicy.clearLatestPreview ? undefined : existing.latestPreviewId),
        latestPreviewUrl: input.latestPreviewUrl ?? (resetPolicy.clearLatestPreview ? undefined : existing.latestPreviewUrl),
        sourceMediaAssetIds: input.checkpointKind === 'source_uploaded' && input.sourceMediaAssetId
          ? [input.sourceMediaAssetId]
          : resetPolicy.clearSourceMedia ? [] : addUnique(existing.sourceMediaAssetIds, input.sourceMediaAssetId),
        revisionCount: input.status === 'revision_requested' ? existing.revisionCount + 1 : existing.revisionCount,
        versionCount: resetPolicy.clearVersions
          ? 0
          : input.checkpointKind === 'plan_approved' ? Math.max(existing.versionCount, 1) : existing.versionCount,
        previewCount: resetPolicy.clearPreviews
          ? 0
          : input.checkpointKind === 'preview_ready' ? Math.max(existing.previewCount + 1, 1) : existing.previewCount,
        updatedAt: now,
        lastOpenedAt: now,
        metadata: {
          ...nextMetadata,
          noUploadStarted: input.checkpointKind === 'source_uploaded'
            ? false
            : input.checkpointKind === 'setup_reset' ? true : existing.metadata?.noUploadStarted,
          noPlanApproved: input.checkpointKind === 'plan_approved'
            ? false
            : resetPolicy.clearPlan ? true : existing.metadata?.noPlanApproved,
          noRenderStarted: resetPolicy.clearPreviews ? true : existing.metadata?.noRenderStarted,
          noCreditReservedOrSpent: resetPolicy.clearPlan ? true : existing.metadata?.noCreditReservedOrSpent,
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

function backendLocalCheckpointApprovalStatus(
  checkpointKind: ProjectEditSessionLifecycleCheckpointRequest['checkpointKind'],
  existing: ProjectEditSessionRecord['approvalStatus'],
): ProjectEditSessionRecord['approvalStatus'] {
  if (checkpointKind === 'source_uploaded' || checkpointKind === 'setup_reset') return 'not_requested'
  if (checkpointKind === 'brief_saved') return 'requested'
  if (checkpointKind === 'plan_approved' || checkpointKind === 'preview_ready' || checkpointKind === 'preview_reviewed' || checkpointKind === 'professional_qa_checked' || checkpointKind === 'final_export_ready') {
    return existing === 'not_requested' ? 'approved' : existing
  }
  return existing
}

function backendLocalCheckpointResetPolicy(
  checkpointKind: ProjectEditSessionLifecycleCheckpointRequest['checkpointKind'],
): {
  clearLatestPreview: boolean
  clearLatestSnapshot: boolean
  clearMetadataKeys: string[]
  clearPlan: boolean
  clearPreviews: boolean
  clearSourceMedia: boolean
  clearVersions: boolean
} {
  if (checkpointKind === 'setup_reset') {
    return {
      clearLatestPreview: true,
      clearLatestSnapshot: true,
      clearMetadataKeys: [
        'backendLocalSourceUpload',
        'backendLocalBrief',
        'backendLocalPlan',
        'backendLocalPreview',
        'backendLocalPreviewReview',
        'backendLocalProfessionalQA',
        'backendLocalFinalExport',
      ],
      clearPlan: true,
      clearPreviews: true,
      clearSourceMedia: true,
      clearVersions: true,
    }
  }

  if (checkpointKind === 'source_uploaded') {
    return {
      clearLatestPreview: true,
      clearLatestSnapshot: true,
      clearMetadataKeys: [
        'backendLocalBrief',
        'backendLocalPlan',
        'backendLocalPreview',
        'backendLocalPreviewReview',
        'backendLocalProfessionalQA',
        'backendLocalFinalExport',
      ],
      clearPlan: true,
      clearPreviews: true,
      clearSourceMedia: false,
      clearVersions: true,
    }
  }

  if (checkpointKind === 'brief_saved') {
    return {
      clearLatestPreview: true,
      clearLatestSnapshot: true,
      clearMetadataKeys: [
        'backendLocalPlan',
        'backendLocalPreview',
        'backendLocalPreviewReview',
        'backendLocalProfessionalQA',
        'backendLocalFinalExport',
      ],
      clearPlan: true,
      clearPreviews: true,
      clearSourceMedia: false,
      clearVersions: true,
    }
  }

  if (checkpointKind === 'plan_approved') {
    return {
      clearLatestPreview: true,
      clearLatestSnapshot: false,
      clearMetadataKeys: [
        'backendLocalPreview',
        'backendLocalPreviewReview',
        'backendLocalProfessionalQA',
        'backendLocalFinalExport',
      ],
      clearPlan: false,
      clearPreviews: true,
      clearSourceMedia: false,
      clearVersions: false,
    }
  }

  if (checkpointKind === 'preview_ready') {
    return {
      clearLatestPreview: false,
      clearLatestSnapshot: false,
      clearMetadataKeys: [
        'backendLocalPreviewReview',
        'backendLocalProfessionalQA',
        'backendLocalFinalExport',
      ],
      clearPlan: false,
      clearPreviews: false,
      clearSourceMedia: false,
      clearVersions: false,
    }
  }

  if (checkpointKind === 'preview_reviewed' || checkpointKind === 'professional_qa_checked') {
    return {
      clearLatestPreview: false,
      clearLatestSnapshot: false,
      clearMetadataKeys: checkpointKind === 'preview_reviewed'
        ? ['backendLocalProfessionalQA', 'backendLocalFinalExport']
        : ['backendLocalFinalExport'],
      clearPlan: false,
      clearPreviews: false,
      clearSourceMedia: false,
      clearVersions: false,
    }
  }

  return {
    clearLatestPreview: false,
    clearLatestSnapshot: false,
    clearMetadataKeys: [],
    clearPlan: false,
    clearPreviews: false,
    clearSourceMedia: false,
    clearVersions: false,
  }
}

function backendLocalCheckpointMetadataKey(
  checkpointKind: ProjectEditSessionLifecycleCheckpointRequest['checkpointKind'],
): string {
  if (checkpointKind === 'source_uploaded') return 'backendLocalSourceUpload'
  if (checkpointKind === 'brief_saved') return 'backendLocalBrief'
  if (checkpointKind === 'plan_approved') return 'backendLocalPlan'
  if (checkpointKind === 'preview_ready') return 'backendLocalPreview'
  if (checkpointKind === 'preview_reviewed') return 'backendLocalPreviewReview'
  if (checkpointKind === 'professional_qa_checked') return 'backendLocalProfessionalQA'
  if (checkpointKind === 'final_export_ready') return 'backendLocalFinalExport'
  return 'backendLocalSetupReset'
}
