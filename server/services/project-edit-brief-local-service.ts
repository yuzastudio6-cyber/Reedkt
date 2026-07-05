import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import type { SaveProjectEditBriefLocalRequest } from '../validation/project-edit-brief-local-schemas'
import { createMockId, getRequiredAuthUserId, mockWarning, nowIso, sanitizeJson } from './service-helpers'

type SaveProjectEditBriefLocalInput = SaveProjectEditBriefLocalRequest & {
  editSessionId: string
  idempotencyKey: string
  projectId: string
}

export interface BackendLocalProjectEditBriefRecord {
  id: string
  workspaceId: string
  projectId: string
  editSessionId: string
  briefText: string
  sourceStorageObjectRecordId?: string
  sourceMediaAssetId?: string
  revisionNumber: number
  savedByUserId: string
  createdAt: string
  updatedAt: string
  backendLocalBriefStored: true
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

const mockBriefsById = new Map<string, BackendLocalProjectEditBriefRecord>()
const mockBriefIdBySession = new Map<string, string>()
const mockBriefIdempotency = new Map<string, string>()

export function createProjectEditBriefLocalService(context: ServiceContext) {
  return {
    async saveProjectEditBrief(input: SaveProjectEditBriefLocalInput) {
      const userId = getRequiredAuthUserId(context)
      assertSafeBriefInput(input)

      if (context.clients.admin && !context.env.mockOnly) {
        throw new ApiError(
          'MOCK_ONLY',
          'Backend-local edit brief save is mock-safe only until durable edit-brief persistence is implemented.',
          409,
        )
      }

      const replayKey = `${input.workspaceId}:${userId}:${input.idempotencyKey}`
      const replayId = mockBriefIdempotency.get(replayKey)
      if (replayId) {
        const replayed = mockBriefsById.get(replayId)
        if (replayed) {
          return {
            editBrief: { ...replayed, readbackVerified: true },
            warnings: [
              mockWarning('Backend-local edit brief replay'),
              'Existing backend-local edit brief returned for the same idempotency key.',
            ],
          }
        }
      }

      const sessionKey = sessionBriefKey(input.workspaceId, input.projectId, input.editSessionId)
      const existingId = mockBriefIdBySession.get(sessionKey)
      const existing = existingId ? mockBriefsById.get(existingId) : undefined
      const now = nowIso()
      const briefText = sanitizeBriefText(input.briefText)
      const record: BackendLocalProjectEditBriefRecord = existing
        ? {
            ...existing,
            briefText,
            sourceStorageObjectRecordId: input.sourceStorageObjectRecordId,
            sourceMediaAssetId: input.sourceMediaAssetId,
            revisionNumber: existing.revisionNumber + 1,
            savedByUserId: userId,
            updatedAt: now,
            readbackVerified: true,
          }
        : {
            id: createMockId('edit_brief'),
            workspaceId: input.workspaceId,
            projectId: input.projectId,
            editSessionId: input.editSessionId,
            briefText,
            sourceStorageObjectRecordId: input.sourceStorageObjectRecordId,
            sourceMediaAssetId: input.sourceMediaAssetId,
            revisionNumber: 1,
            savedByUserId: userId,
            createdAt: now,
            updatedAt: now,
            backendLocalBriefStored: true,
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

      mockBriefsById.set(record.id, record)
      mockBriefIdBySession.set(sessionKey, record.id)
      mockBriefIdempotency.set(replayKey, record.id)

      return {
        editBrief: record,
        warnings: [
          mockWarning('Backend-local edit brief save'),
          'Saving the edit brief does not run tools, approve plans, render, reserve credits, write Supabase/GCS, or unlock beta/production.',
        ],
      }
    },

    async getProjectEditBriefForSession(input: {
      workspaceId: string
      projectId: string
      editSessionId: string
    }) {
      if (context.clients.admin && !context.env.mockOnly) {
        throw new ApiError(
          'MOCK_ONLY',
          'Backend-local edit brief readback is mock-safe only until durable edit-brief persistence is implemented.',
          409,
        )
      }

      const briefId = mockBriefIdBySession.get(sessionBriefKey(input.workspaceId, input.projectId, input.editSessionId))
      const record = briefId ? mockBriefsById.get(briefId) : undefined
      if (!record) {
        throw new ApiError('PROJECT_NOT_FOUND', 'Backend-local edit brief was not found for this edit session.', 404)
      }

      return {
        editBrief: { ...record, readbackVerified: true },
        warnings: [mockWarning('Backend-local edit brief readback')],
      }
    },
  }
}

function sessionBriefKey(workspaceId: string, projectId: string, editSessionId: string): string {
  return `${workspaceId}:${projectId}:${editSessionId}`
}

function assertSafeBriefInput(input: SaveProjectEditBriefLocalInput): void {
  const text = [
    input.briefText,
    input.sourceStorageObjectRecordId,
    input.sourceMediaAssetId,
  ].filter(Boolean).join('\n')

  if (/service.?role|api.?key|secret|signed.?url|token|sk-[a-z0-9_-]+/i.test(text)) {
    throw new ApiError('VALIDATION_FAILED', 'Edit brief contains secret-like or signed URL text.', 400)
  }
}

function sanitizeBriefText(value: string): string {
  return String(sanitizeJson({ value }).value ?? value).trim()
}
