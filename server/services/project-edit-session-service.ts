import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import type {
  CreateProjectEditSessionRequest,
  ProjectEditSessionLifecycleCheckpointRequest,
} from '../validation/project-edit-session-schemas'
import type { ProjectEditSessionRecord } from '../../src/types/project-edit-session'
import { MOCK_PROJECT_EDIT_SESSION_FIXTURE_BUNDLE } from '../../src/lib/mock-project-edit-sessions'
import { createMockId, mockWarning, nowIso, sanitizeJson } from './service-helpers'
import { authorizeWorkspaceAccess } from './workspace-access-service'

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

function createSeededBackendLocalEditSession(
  session: ProjectEditSessionRecord,
  workspaceId: string,
  ownerUserId: string,
): BackendLocalProjectEditSessionRecord {
  return {
    ...session,
    workspaceId,
    ownerUserId,
    metadata: {
      ...(session.metadata ?? {}),
      backendLocalSeededFixture: true,
      outputFrameConfirmed: true,
      outputFrameConfirmationSource: 'seeded_internal_testing_fixture',
      confirmedAspectRatio: session.aspectRatio,
      confirmedPlatformTarget: session.platformTarget,
      noUploadStarted: true,
      noPlanApproved: session.approvalStatus !== 'approved',
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
    mockOnly: true,
  }
}

function ensureSeededBackendLocalEditSessions(workspaceId: string, ownerUserId: string): void {
  for (const session of MOCK_PROJECT_EDIT_SESSION_FIXTURE_BUNDLE.sessions) {
    const scopedKey = editSessionScopeKey(ownerUserId, workspaceId, session.id)
    const existing = mockEditSessions.get(scopedKey)
    if (existing) continue

    mockEditSessions.set(scopedKey, createSeededBackendLocalEditSession(session, workspaceId, ownerUserId))
  }
}

function ensureSeededBackendLocalEditSession(
  editSessionId: string,
  workspaceId: string,
  ownerUserId: string,
): void {
  const scopedKey = editSessionScopeKey(ownerUserId, workspaceId, editSessionId)
  const existing = mockEditSessions.get(scopedKey)
  if (existing) return

  const fixture = MOCK_PROJECT_EDIT_SESSION_FIXTURE_BUNDLE.sessions.find((session) => session.id === editSessionId)
  if (!fixture) return

  mockEditSessions.set(scopedKey, createSeededBackendLocalEditSession(fixture, workspaceId, ownerUserId))
}

export function createProjectEditSessionService(context: ServiceContext) {
  return {
    async createProjectEditSession(input: CreateProjectEditSessionInput) {
      const access = await authorizeWorkspaceAccess(context, input.workspaceId, 'write')
      const userId = access.userId
      assertSafeEditSessionInput(input)

      if (context.clients.admin && !context.env.mockOnly) {
        throw new ApiError(
          'MOCK_ONLY',
          'Backend-local edit session creation is mock-safe only until durable edit-session persistence is implemented.',
          409,
        )
      }

      const replayKey = `${input.workspaceId}:${userId}:${input.idempotencyKey}`
      const existingKey = mockEditSessionIdempotency.get(replayKey)
      if (existingKey) {
        const existing = mockEditSessions.get(existingKey)
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
        workspaceId: access.workspaceId,
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

      const scopedKey = editSessionScopeKey(userId, access.workspaceId, record.id)
      mockEditSessions.set(scopedKey, record)
      mockEditSessionIdempotency.set(replayKey, scopedKey)

      return {
        editSession: record,
        warnings: [
          mockWarning('Backend-local edit session creation'),
          'Creating an edit session does not upload media, approve a plan, run tools, render, reserve credits, write Supabase/GCS, or unlock beta/production.',
        ],
      }
    },

    async getProjectEditSession(editSessionId: string, workspaceId: string) {
      const access = await authorizeWorkspaceAccess(context, workspaceId, 'read')
      if (context.clients.admin && !context.env.mockOnly) {
        throw new ApiError(
          'MOCK_ONLY',
          'Backend-local edit session readback is mock-safe only until durable edit-session persistence is implemented.',
          409,
        )
      }

      ensureSeededBackendLocalEditSession(editSessionId, access.workspaceId, access.userId)
      const existing = mockEditSessions.get(editSessionScopeKey(access.userId, access.workspaceId, editSessionId))
      if (!existing) {
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
      const access = await authorizeWorkspaceAccess(context, input.workspaceId, 'read')
      if (context.clients.admin && !context.env.mockOnly) {
        throw new ApiError(
          'MOCK_ONLY',
          'Backend-local edit session listing is mock-safe only until durable edit-session persistence is implemented.',
          409,
        )
      }

      ensureSeededBackendLocalEditSessions(access.workspaceId, access.userId)
      const editSessions = Array.from(mockEditSessions.values())
        .filter((session) =>
          session.ownerUserId === access.userId &&
          session.workspaceId === access.workspaceId &&
          session.projectId === input.projectId)
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
      const access = await authorizeWorkspaceAccess(context, input.workspaceId, 'write')
      const userId = access.userId
      assertSafeLifecycleCheckpointInput(input)

      if (context.clients.admin && !context.env.mockOnly) {
        throw new ApiError(
          'MOCK_ONLY',
          'Backend-local edit session lifecycle checkpoints are mock-safe only until durable edit-session persistence is implemented.',
          409,
        )
      }

      const replayKey = `${input.workspaceId}:${userId}:${input.idempotencyKey}`
      const replayScopedKey = mockEditSessionLifecycleIdempotency.get(replayKey)
      if (replayScopedKey) {
        const replayed = mockEditSessions.get(replayScopedKey)
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

      const scopedKey = editSessionScopeKey(userId, access.workspaceId, input.editSessionId)
      let existing = mockEditSessions.get(scopedKey)
      if (!existing) {
        ensureSeededBackendLocalEditSession(input.editSessionId, access.workspaceId, userId)
        existing = mockEditSessions.get(scopedKey)
      }
      if (!existing) {
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

      mockEditSessions.set(scopedKey, updated)
      mockEditSessionLifecycleIdempotency.set(replayKey, scopedKey)

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

function editSessionScopeKey(ownerUserId: string, workspaceId: string, editSessionId: string): string {
  return [ownerUserId, workspaceId, editSessionId]
    .map((value) => `${value.length}:${value}`)
    .join('|')
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
  if (checkpointKind === 'source_uploaded' || checkpointKind === 'brief_draft_changed' || checkpointKind === 'setup_reset') return 'not_requested'
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

  if (checkpointKind === 'brief_draft_changed') {
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
  if (checkpointKind === 'brief_draft_changed') return 'backendLocalBriefDraftChanged'
  if (checkpointKind === 'brief_saved') return 'backendLocalBrief'
  if (checkpointKind === 'plan_approved') return 'backendLocalPlan'
  if (checkpointKind === 'preview_ready') return 'backendLocalPreview'
  if (checkpointKind === 'preview_reviewed') return 'backendLocalPreviewReview'
  if (checkpointKind === 'professional_qa_checked') return 'backendLocalProfessionalQA'
  if (checkpointKind === 'final_export_ready') return 'backendLocalFinalExport'
  return 'backendLocalSetupReset'
}
