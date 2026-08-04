import { createHash } from 'node:crypto'
import {
  canonicalEditBriefFieldsEqual,
  createCanonicalEditBriefFieldsFromEditBrief,
  createEditReferenceBriefTextFromEditBrief,
} from '../../src/lib/edit-brief/edit-brief-reference-binding'
import { parseEditBriefStateForHandoff } from '../../src/lib/edit-brief/edit-brief-persistence'
import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import type { SaveProjectEditBriefLocalRequest } from '../validation/project-edit-brief-local-schemas'
import { createMockId, mockWarning, nowIso, sanitizeJson } from './service-helpers'
import { authorizeWorkspaceAccess } from './workspace-access-service'
import { createEditBriefAuthorityService } from './edit-brief-authority-service'
import {
  resolveEditReferenceExactEditBriefRuntimePort,
  type EditReferenceExactEditBriefAuthorityRecord,
} from './edit-reference-exact-edit-brief-runtime-port'
import { createInternalEditStateService } from './internal-edit-state-service'

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
  persistenceAuthority?: 'private_edit_brief_authority_store'
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
  const canonicalRuntime = resolveEditReferenceExactEditBriefRuntimePort({
    env: context.env,
    auth: context.auth,
    factory: context.editReferenceExactEditBriefRuntimePortFactory,
  })
  return {
    async saveProjectEditBrief(input: SaveProjectEditBriefLocalInput) {
      const access = await authorizeWorkspaceAccess(context, input.workspaceId, 'write')
      const userId = access.userId
      assertSafeBriefInput(input)

      if (context.editBriefPrivateWorkspaceRuntimePort) {
        if (!input.sourceStorageObjectRecordId || !input.sourceMediaAssetId) {
          throw new ApiError(
            'VALIDATION_FAILED',
            'The exact uploaded video must be finalized before its durable Edit Brief can be bound.',
            400,
          )
        }
        const editBrief = await resolvePrivateWorkspaceEditBriefBinding({
          context,
          workspaceId: access.workspaceId,
          projectId: input.projectId,
          editSessionId: input.editSessionId,
          expectedBriefText: sanitizeBriefText(input.briefText),
          expectedSourceStorageObjectRecordId:
            input.sourceStorageObjectRecordId,
          expectedSourceMediaAssetId: input.sourceMediaAssetId,
        })
        return {
          editBrief,
          warnings: [
            'Exact Edit Brief reused the durable private workspace authority and source binding without creating a second Brief record.',
            'No study worker, provider, render, credit, billing, remote Supabase, cloud, or production action started.',
          ],
        }
      }

      if (canonicalRuntime) {
        if (!input.sourceStorageObjectRecordId || !input.sourceMediaAssetId) {
          throw new ApiError(
            'VALIDATION_FAILED',
            'The exact uploaded video must be finalized before its Edit Brief can be committed.',
            400,
          )
        }
        const result = await canonicalRuntime.save({
          workspaceId: access.workspaceId,
          projectId: input.projectId,
          editSessionId: input.editSessionId,
          briefText: sanitizeBriefText(input.briefText),
          sourceStorageObjectRecordId: input.sourceStorageObjectRecordId,
          sourceMediaAssetId: input.sourceMediaAssetId,
          idempotencyKey: input.idempotencyKey,
        })
        return {
          editBrief: result.record,
          warnings: [
            'Exact Edit Brief committed to the isolated canonical V3 local RLS authority.',
            'No study worker, provider, render, credit, billing, remote Supabase, cloud, or production action started.',
          ],
        }
      }

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
      if (context.editBriefPrivateWorkspaceRuntimePort) {
        const editBrief = await resolvePrivateWorkspaceEditBriefBinding({
          context,
          workspaceId: access.workspaceId,
          projectId: input.projectId,
          editSessionId: input.editSessionId,
        })
        return {
          editBrief,
          warnings: [
            'Exact Edit Brief read from the durable private workspace authority and current private source binding.',
          ],
        }
      }
      if (canonicalRuntime) {
        const editBrief = await canonicalRuntime.read({
          workspaceId: access.workspaceId,
          projectId: input.projectId,
          editSessionId: input.editSessionId,
        })
        if (!editBrief) {
          throw new ApiError(
            'PROJECT_NOT_FOUND',
            'An exact Edit Brief was not found for this named edit.',
            404,
          )
        }
        return {
          editBrief,
          warnings: [
            'Exact Edit Brief read from isolated canonical V3 local RLS authority.',
          ],
        }
      }
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

async function resolvePrivateWorkspaceEditBriefBinding(input: {
  context: ServiceContext
  workspaceId: string
  projectId: string
  editSessionId: string
  expectedBriefText?: string
  expectedSourceStorageObjectRecordId?: string
  expectedSourceMediaAssetId?: string
}): Promise<BackendLocalProjectEditBriefRecord> {
  const [briefResult, editStateResult] = await Promise.all([
    createEditBriefAuthorityService(input.context).get(
      input.workspaceId,
      input.projectId,
      input.editSessionId,
    ),
    createInternalEditStateService(input.context).getInternalEditState(
      input.workspaceId,
      input.projectId,
      input.editSessionId,
    ),
  ])
  const authority = briefResult.authority
  const durableBrief = authority?.brief
  if (!authority || !durableBrief) {
    throw new ApiError(
      'PROJECT_NOT_FOUND',
      'An exact durable Edit Brief was not found for this edit session.',
      404,
    )
  }

  const editBriefState = parseEditBriefStateForHandoff(
    editStateResult.internalEditState.handoff.editBriefState,
    input.projectId,
    input.workspaceId,
  )
  if (
    !editBriefState
    || (
      editBriefState.editBrief.status !== 'ready'
      && editBriefState.editBrief.status !== 'used_in_plan'
    )
    || !canonicalEditBriefFieldsEqual(
      durableBrief.fields,
      createCanonicalEditBriefFieldsFromEditBrief(editBriefState.editBrief),
    )
  ) {
    throw new ApiError(
      'VERSION_CONFLICT',
      'The durable Edit Brief and exact named-edit state no longer match.',
      409,
    )
  }

  const source = resolvePrivateWorkspaceEditBriefSource(
    editStateResult.internalEditState.handoff,
  )
  if (
    (
      input.expectedSourceStorageObjectRecordId !== undefined
      && input.expectedSourceStorageObjectRecordId
        !== source.sourceStorageObjectRecordId
    )
    || (
      input.expectedSourceMediaAssetId !== undefined
      && input.expectedSourceMediaAssetId !== source.sourceMediaAssetId
    )
  ) {
    throw new ApiError(
      'VERSION_CONFLICT',
      'The exact private source changed before the Edit Brief binding was verified.',
      409,
    )
  }

  const briefText = createEditReferenceBriefTextFromEditBrief(
    editBriefState.editBrief,
  )
  if (
    input.expectedBriefText !== undefined
    && input.expectedBriefText !== briefText
  ) {
    throw new ApiError(
      'VERSION_CONFLICT',
      'The browser Edit Brief text no longer matches the durable Edit Brief authority.',
      409,
    )
  }

  const unsignedRecord: Omit<
    BackendLocalProjectEditBriefRecord,
    'contentDigestSha256'
  > = {
    id: durableBrief.id,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    briefText,
    sourceStorageObjectRecordId: source.sourceStorageObjectRecordId,
    sourceMediaAssetId: source.sourceMediaAssetId,
    revisionNumber: durableBrief.revision,
    savedByUserId: authority.ownerUserId,
    createdAt: durableBrief.createdAt,
    updatedAt: durableBrief.updatedAt,
    backendLocalBriefStored: true,
    persistenceAuthority: 'private_edit_brief_authority_store',
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
  return {
    ...unsignedRecord,
    contentDigestSha256:
      calculateProjectEditBriefLocalDigest(unsignedRecord),
  }
}

function resolvePrivateWorkspaceEditBriefSource(
  handoff: Record<string, unknown>,
): {
  sourceStorageObjectRecordId: string
  sourceMediaAssetId: string
} {
  const sourceMediaAssets = handoff.sourceMediaAssets
  if (!Array.isArray(sourceMediaAssets)) {
    throw privateWorkspaceSourceUnavailable()
  }
  const candidates = sourceMediaAssets.filter((value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return false
    }
    const source = value as Record<string, unknown>
    return typeof source.storageObjectRecordId === 'string'
      && Boolean(source.storageObjectRecordId.trim())
      && typeof source.mediaAssetId === 'string'
      && Boolean(source.mediaAssetId.trim())
      && typeof source.mimeType === 'string'
      && source.mimeType.toLowerCase().startsWith('video/')
      && typeof source.byteSize === 'number'
      && Number.isSafeInteger(source.byteSize)
      && source.byteSize > 0
      && typeof source.checksumSha256 === 'string'
      && /^[a-f0-9]{64}$/.test(source.checksumSha256)
      && source.privateArtifact === true
      && source.publicUrl === null
      && source.signedUrl === null
  }) as Array<Record<string, unknown>>
  if (candidates.length !== 1) throw privateWorkspaceSourceUnavailable()
  return {
    sourceStorageObjectRecordId:
      String(candidates[0]?.storageObjectRecordId),
    sourceMediaAssetId: String(candidates[0]?.mediaAssetId),
  }
}

function privateWorkspaceSourceUnavailable(): ApiError {
  return new ApiError(
    'TARGET_VIDEO_NOT_FINALIZED',
    'One exact finalized private target video is required before the Edit Brief can be bound.',
    409,
  )
}

export function calculateProjectEditBriefLocalDigest(
  brief: Pick<
    BackendLocalProjectEditBriefRecord | EditReferenceExactEditBriefAuthorityRecord,
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
