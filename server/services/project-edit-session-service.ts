import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import type { CreateProjectEditSessionRequest } from '../validation/project-edit-session-schemas'
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
