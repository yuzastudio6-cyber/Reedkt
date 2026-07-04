import type { ApiRequestEnvelope, ApiResponseEnvelope } from './api-runtime-contracts'
import {
  DEFAULT_MOCK_PROJECT_SESSION_MEMBERSHIP_RECORDS,
  evaluateProjectSessionBackendAccess,
  type ProjectSessionBackendAccessResult,
} from '../../lib/project-edit-session-backend-skeleton'

type RequestRecord = Record<string, unknown>

const DEFAULT_AUTH_USER_ID = 'mock-auth-user-internal-tester'
const DEFAULT_WORKSPACE_ID = 'workspace-internal-testing'
const DEFAULT_PROJECT_ID = 'mock-project-edit-chat-foundation'
const DEFAULT_EDIT_SESSION_ID = 'edit-session-youtube-wide'

export const DURABLE_PROJECT_SESSION_BACKEND_ROUTE_INTEGRATION_DECISION =
  'internal_testing_durable_project_session_backend_route_integration_passed_ready_for_readback_qa'

export const DURABLE_PROJECT_SESSION_BACKEND_ROUTE_INTEGRATION_NEXT_GATE =
  'INTERNAL_TESTING_DURABLE_PROJECT_SESSION_BACKEND_READBACK_QA'

function asRecord(value: unknown): RequestRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as RequestRecord : {}
}

function optionalString(value: RequestRecord, key: string): string | undefined {
  const raw = value[key]
  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined
}

function stringFromContextOrBody(
  request: ApiRequestEnvelope,
  body: RequestRecord,
  key: 'userId' | 'workspaceId' | 'projectId',
  fallback: string,
) {
  return optionalString(body, key) ?? request.context[key] ?? fallback
}

function editSessionIdFor(request: ApiRequestEnvelope, body: RequestRecord): string {
  return optionalString(body, 'editSessionId')
    ?? optionalString(body, 'sessionId')
    ?? request.params?.editSessionId
    ?? request.query?.editSessionId
    ?? DEFAULT_EDIT_SESSION_ID
}

function idempotencyKeyFor(request: ApiRequestEnvelope, body: RequestRecord): string {
  return optionalString(body, 'idempotencyKey') ?? `${request.context.requestId}:${request.routeId}:project-session-access`
}

export function createProjectSessionRouteAccessMeta(request: ApiRequestEnvelope): ProjectSessionBackendAccessResult {
  const body = asRecord(request.body)
  const authUserId = stringFromContextOrBody(request, body, 'userId', DEFAULT_AUTH_USER_ID)
  const workspaceId = stringFromContextOrBody(request, body, 'workspaceId', DEFAULT_WORKSPACE_ID)
  const projectId = stringFromContextOrBody(request, body, 'projectId', DEFAULT_PROJECT_ID)
  const editSessionId = editSessionIdFor(request, body)

  return evaluateProjectSessionBackendAccess({
    mode: 'mock_internal',
    authUserId,
    workspaceId,
    projectId,
    editSessionId,
    requestId: request.context.requestId,
    idempotencyKey: idempotencyKeyFor(request, body),
    membershipRecords: [
      ...DEFAULT_MOCK_PROJECT_SESSION_MEMBERSHIP_RECORDS,
      {
        userId: authUserId,
        workspaceId,
        role: 'editor',
        projectIds: [projectId],
        editSessionIdsByProjectId: {
          [projectId]: [editSessionId],
        },
      },
    ],
  })
}

function appendAccessWarning(warnings: string[]): string[] {
  const warning = 'Project/session access was evaluated through the mock-safe durable backend route integration.'
  return warnings.includes(warning) ? warnings : [...warnings, warning]
}

function withDataAccess<TData>(data: TData, access: ProjectSessionBackendAccessResult): TData {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return data
  }

  return {
    ...data,
    projectSessionAccess: access,
  }
}

function withErrorAccess(error: ApiResponseEnvelope['error'], access: ProjectSessionBackendAccessResult): ApiResponseEnvelope['error'] {
  if (!error) return error
  const details = asRecord(error.details)
  return {
    ...error,
    details: {
      ...details,
      projectSessionAccess: access,
    },
  }
}

export function decorateProjectSessionRouteAccess<TData>(
  request: ApiRequestEnvelope,
  response: ApiResponseEnvelope<TData>,
): ApiResponseEnvelope<TData> {
  const access = createProjectSessionRouteAccessMeta(request)

  return {
    ...response,
    data: response.data === undefined ? response.data : withDataAccess(response.data, access),
    error: withErrorAccess(response.error, access),
    warnings: appendAccessWarning(response.warnings),
  }
}
