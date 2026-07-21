import { createHash } from 'node:crypto'
import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import type { SaveProjectEditBriefLocalRequest } from '../validation/project-edit-brief-local-schemas'
import { createMockId, mockWarning, nowIso, sanitizeJson } from './service-helpers'
import { authorizeWorkspaceAccess } from './workspace-access-service'

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
  contentDigestSha256: string
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
      const access = await authorizeWorkspaceAccess(context, input.workspaceId, 'write')
      const userId = access.userId
      assertSafeBriefInput(input)

      if (context.clients.admin && !context.env.mockOnly) {
        throw new ApiError(
          'MOCK_ONLY',
          'Backend-local edit brief save is mock-safe only until durable edit-brief persistence is implemented.',
          409,
        )
      }

      const replayKey = `${access.workspaceId}:${userId}:${input.idempotencyKey}`
      const replayRecordKey = mockBriefIdempotency.get(replayKey)
      if (replayRecordKey) {
        const replayed = mockBriefsById.get(replayRecordKey)
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

      const sessionKey = sessionBriefKey(userId, access.workspaceId, input.projectId, input.editSessionId)
      const existingRecordKey = mockBriefIdBySession.get(sessionKey)
      const existing = existingRecordKey ? mockBriefsById.get(existingRecordKey) : undefined
      const now = nowIso()
      const briefText = sanitizeBriefText(input.briefText)
      const unsignedRecord: Omit<BackendLocalProjectEditBriefRecord, 'contentDigestSha256'> = existing
        ? {
            ...withoutBriefDigest(existing),
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
            workspaceId: access.workspaceId,
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
      const record: BackendLocalProjectEditBriefRecord = {
        ...unsignedRecord,
        contentDigestSha256: calculateProjectEditBriefLocalDigest(unsignedRecord),
      }

      const recordKey = briefRecordKey(userId, access.workspaceId, record.id)
      mockBriefsById.set(recordKey, record)
      mockBriefIdBySession.set(sessionKey, recordKey)
      mockBriefIdempotency.set(replayKey, recordKey)

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
      const access = await authorizeWorkspaceAccess(context, input.workspaceId, 'read')
      if (context.clients.admin && !context.env.mockOnly) {
        throw new ApiError(
          'MOCK_ONLY',
          'Backend-local edit brief readback is mock-safe only until durable edit-brief persistence is implemented.',
          409,
        )
      }

      const recordKey = mockBriefIdBySession.get(sessionBriefKey(
        access.userId,
        access.workspaceId,
        input.projectId,
        input.editSessionId,
      ))
      const record = recordKey ? mockBriefsById.get(recordKey) : undefined
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

export function calculateProjectEditBriefLocalDigest(
  brief: Pick<
    BackendLocalProjectEditBriefRecord,
    | 'id'
    | 'workspaceId'
    | 'projectId'
    | 'editSessionId'
    | 'briefText'
    | 'sourceStorageObjectRecordId'
    | 'sourceMediaAssetId'
    | 'revisionNumber'
    | 'savedByUserId'
    | 'updatedAt'
  >,
): string {
  return createHash('sha256').update(stableStringify({
    editBriefId: brief.id,
    workspaceId: brief.workspaceId,
    projectId: brief.projectId,
    editSessionId: brief.editSessionId,
    briefText: brief.briefText,
    sourceStorageObjectRecordId: brief.sourceStorageObjectRecordId ?? null,
    sourceMediaAssetId: brief.sourceMediaAssetId ?? null,
    revisionNumber: brief.revisionNumber,
    savedByUserId: brief.savedByUserId,
    updatedAt: brief.updatedAt,
  })).digest('hex')
}

function withoutBriefDigest(
  record: BackendLocalProjectEditBriefRecord,
): Omit<BackendLocalProjectEditBriefRecord, 'contentDigestSha256'> {
  const clone = structuredClone(record) as Partial<BackendLocalProjectEditBriefRecord>
  delete clone.contentDigestSha256
  return clone as Omit<BackendLocalProjectEditBriefRecord, 'contentDigestSha256'>
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`
}

function sessionBriefKey(
  ownerUserId: string,
  workspaceId: string,
  projectId: string,
  editSessionId: string,
): string {
  return scopedKey(ownerUserId, workspaceId, projectId, editSessionId)
}

function briefRecordKey(ownerUserId: string, workspaceId: string, briefId: string): string {
  return scopedKey(ownerUserId, workspaceId, briefId)
}

function scopedKey(...values: string[]): string {
  return values.map((value) => `${value.length}:${value}`).join('|')
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
