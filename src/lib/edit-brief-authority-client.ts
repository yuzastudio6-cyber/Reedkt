import {
  callReeditProApi,
  getFrontendApiClientStatus,
} from '../backend/api/frontend-api-client'
import type {
  CanonicalEditBriefAuthorityReadResponse,
  CanonicalEditBriefFields,
  CanonicalEditBriefMarkerDraft,
} from '../types/edit-brief-authority'

export interface CanonicalEditBriefScope {
  workspaceId: string
  projectId: string
  editSessionId: string
}

export type CanonicalEditBriefClientResult<T> =
  | { status: 'ready'; data: T; warnings: string[] }
  | {
      status: 'unavailable' | 'access_denied' | 'stale' | 'invalid'
      message: string
      retryable: boolean
      statusCode?: number
      warnings: string[]
    }

export async function readCanonicalEditBriefAuthority(
  scope: CanonicalEditBriefScope,
): Promise<CanonicalEditBriefClientResult<CanonicalEditBriefAuthorityReadResponse>> {
  const runtime = getFrontendApiClientStatus()
  if (runtime.mockOnly || !runtime.apiBaseUrl) {
    return {
      status: 'unavailable',
      message: 'The durable Edit Brief timeline is available when the reviewed private backend is connected.',
      retryable: false,
      warnings: runtime.warnings,
    }
  }
  const response = await callReeditProApi<undefined, CanonicalEditBriefAuthorityReadResponse>(
    'planning.editBriefAuthority.get',
    undefined,
    routeOptions(scope),
  )
  return normalizeResponse(response)
}

export async function saveCanonicalEditBrief(
  scope: CanonicalEditBriefScope,
  input: {
    authorityPresent: boolean
    expectedRevision: number
    fields: CanonicalEditBriefFields
  },
): Promise<CanonicalEditBriefClientResult<CanonicalEditBriefAuthorityReadResponse>> {
  const routeId = input.authorityPresent
    ? 'planning.editBriefAuthority.update'
    : 'planning.editBriefAuthority.create'
  const body = input.authorityPresent
    ? {
        workspaceId: scope.workspaceId,
        expectedRevision: input.expectedRevision,
        patch: canonicalBriefPatch(input.fields),
      }
    : {
        workspaceId: scope.workspaceId,
        expectedRevision: input.expectedRevision,
        brief: input.fields,
      }
  const response = await callReeditProApi(
    routeId,
    body,
    {
      ...routeOptions(scope),
      idempotencyKey: await deterministicIdempotencyKey(
        input.authorityPresent ? 'brief-update' : 'brief-create',
        scope,
        input.expectedRevision,
        input.fields,
      ),
    },
  )
  const mutation = normalizeResponse(response)
  if (mutation.status !== 'ready') return mutation
  return readCanonicalEditBriefAuthority(scope)
}

export async function createCanonicalEditBriefMarker(
  scope: CanonicalEditBriefScope,
  input: {
    expectedRevision: number
    marker: CanonicalEditBriefMarkerDraft
  },
): Promise<CanonicalEditBriefClientResult<CanonicalEditBriefAuthorityReadResponse>> {
  return mutateMarkerAuthority(
    'planning.editBriefMarker.create',
    'marker-create',
    scope,
    input.expectedRevision,
    { workspaceId: scope.workspaceId, expectedRevision: input.expectedRevision, marker: input.marker },
  )
}

export async function updateCanonicalEditBriefMarker(
  scope: CanonicalEditBriefScope,
  input: {
    expectedRevision: number
    markerId: string
    patch: Omit<Partial<CanonicalEditBriefMarkerDraft>, 'endSeconds'>
      & { endSeconds?: number | null }
  },
): Promise<CanonicalEditBriefClientResult<CanonicalEditBriefAuthorityReadResponse>> {
  return mutateMarkerAuthority(
    'planning.editBriefMarker.update',
    'marker-update',
    scope,
    input.expectedRevision,
    {
      workspaceId: scope.workspaceId,
      expectedRevision: input.expectedRevision,
      patch: input.patch,
    },
    input.markerId,
  )
}

export async function changeCanonicalEditBriefMarkerStatus(
  scope: CanonicalEditBriefScope,
  input: {
    expectedRevision: number
    markerId: string
    action: 'confirm' | 'archive' | 'reopen'
  },
): Promise<CanonicalEditBriefClientResult<CanonicalEditBriefAuthorityReadResponse>> {
  return mutateMarkerAuthority(
    `planning.editBriefMarker.${input.action}`,
    `marker-${input.action}`,
    scope,
    input.expectedRevision,
    { workspaceId: scope.workspaceId, expectedRevision: input.expectedRevision },
    input.markerId,
  )
}

export async function appendCanonicalEditBriefMarkerMessage(
  scope: CanonicalEditBriefScope,
  input: {
    expectedRevision: number
    markerId: string
    content: string
    clientMessageId?: string
  },
): Promise<CanonicalEditBriefClientResult<CanonicalEditBriefAuthorityReadResponse>> {
  const clientMessageId = input.clientMessageId ?? await deterministicIdempotencyKey(
    'marker-message-id',
    scope,
    input.expectedRevision,
    {
      markerId: input.markerId,
      content: input.content,
    },
  )
  return mutateMarkerAuthority(
    'planning.editBriefMarker.message.create',
    'marker-message',
    scope,
    input.expectedRevision,
    {
      workspaceId: scope.workspaceId,
      expectedRevision: input.expectedRevision,
      content: input.content,
      clientMessageId,
    },
    input.markerId,
  )
}

export async function addCanonicalEditBriefAudioAttachment(
  scope: CanonicalEditBriefScope,
  input: {
    expectedRevision: number
    markerId: string
    privateAssetId: string
  },
): Promise<CanonicalEditBriefClientResult<CanonicalEditBriefAuthorityReadResponse>> {
  return mutateMarkerAuthority(
    'planning.editBriefMarker.audioAttachment.create',
    'marker-audio-attachment',
    scope,
    input.expectedRevision,
    {
      workspaceId: scope.workspaceId,
      expectedRevision: input.expectedRevision,
      privateAssetId: input.privateAssetId,
    },
    input.markerId,
  )
}

async function mutateMarkerAuthority(
  routeId: string,
  operation: string,
  scope: CanonicalEditBriefScope,
  expectedRevision: number,
  body: Record<string, unknown>,
  markerId?: string,
): Promise<CanonicalEditBriefClientResult<CanonicalEditBriefAuthorityReadResponse>> {
  const response = await callReeditProApi(
    routeId,
    body,
    {
      ...routeOptions(scope, markerId),
      idempotencyKey: await deterministicIdempotencyKey(
        operation,
        scope,
        expectedRevision,
        { markerId, body },
      ),
    },
  )
  const mutation = normalizeResponse(response)
  if (mutation.status !== 'ready') return mutation
  return readCanonicalEditBriefAuthority(scope)
}

function routeOptions(scope: CanonicalEditBriefScope, markerId?: string) {
  return {
    params: {
      projectId: scope.projectId,
      editSessionId: scope.editSessionId,
      ...(markerId ? { markerId } : {}),
    },
    query: { workspaceId: scope.workspaceId },
    context: {
      workspaceId: scope.workspaceId,
      projectId: scope.projectId,
    },
  }
}

function canonicalBriefPatch(fields: CanonicalEditBriefFields): Record<string, unknown> {
  return {
    goal: fields.goal,
    audience: fields.audience ?? null,
    deliverable: fields.deliverable ?? null,
    mustIncludeNotes: fields.mustIncludeNotes,
    avoidNotes: fields.avoidNotes,
    additionalNotes: fields.additionalNotes ?? null,
    targetPlatforms: fields.targetPlatforms ?? [],
    targetDurationMs: fields.targetDurationMs ?? null,
    styleKeywords: fields.styleKeywords ?? [],
    pacingPreference: fields.pacingPreference ?? null,
    captionPreference: fields.captionPreference ?? null,
    musicPreference: fields.musicPreference ?? null,
    bRollPreference: fields.bRollPreference ?? null,
    mustUseAssetIds: fields.mustUseAssetIds ?? [],
    avoidAssetIds: fields.avoidAssetIds ?? [],
    brandNotes: fields.brandNotes ?? null,
    specialInstructions: fields.specialInstructions ?? null,
    userProvidedReferenceUrls: fields.userProvidedReferenceUrls ?? [],
    status: fields.status,
  }
}

function normalizeResponse<T>(response: {
  ok: boolean
  statusCode: number
  data?: T
  error?: { code: string; message: string }
  warnings: string[]
}): CanonicalEditBriefClientResult<T> {
  if (response.ok && response.data !== undefined) {
    return { status: 'ready', data: response.data, warnings: response.warnings }
  }
  const code = response.error?.code ?? 'EDIT_BRIEF_UNAVAILABLE'
  const status = response.statusCode === 401 || response.statusCode === 403
    ? 'access_denied'
    : response.statusCode === 409
      ? 'stale'
      : response.statusCode >= 400 && response.statusCode < 500
        ? 'invalid'
        : 'unavailable'
  return {
    status,
    message: response.error?.message ?? 'The canonical Edit Brief authority is unavailable.',
    retryable: status === 'stale' || response.statusCode >= 500,
    statusCode: response.statusCode,
    warnings: [...response.warnings, code],
  }
}

async function deterministicIdempotencyKey(
  operation: string,
  scope: CanonicalEditBriefScope,
  expectedRevision: number,
  payload: unknown,
): Promise<string> {
  const source = stableJson({
    operation,
    scope,
    expectedRevision,
    payload,
  })
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(source),
  )
  const hex = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
  return `edit-brief:${operation}:${hex.slice(0, 48)}`
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, nested]) => nested !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableJson(nested)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}
