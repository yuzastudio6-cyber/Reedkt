import { createHmac } from 'node:crypto'
import { z } from 'zod'

import type { RuntimeEnv } from '../config/env'
import { ApiError } from '../errors/api-error'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

export const CANONICAL_PRIVATE_PROJECT_AUTHORITY_PORT_VERSION =
  'canonical-private-project-authority-port-v1' as const
export const CANONICAL_PRIVATE_PROJECT_REQUEST_VERSION =
  'canonical-private-project-authority-request-v1' as const
export const CANONICAL_PRIVATE_PROJECT_RESULT_VERSION =
  'canonical-private-project-authority-result-v1' as const
export const CANONICAL_PRIVATE_PROJECT_FACTORY_VERSION =
  'canonical-private-project-request-authority-factory-v1' as const

const CANONICAL_LOCAL_ENDPOINT = 'http://127.0.0.1:57431'
const CREATE_PROJECT_RPC = 'reeditpro_create_private_project_v1'
const LOCAL_HTTP_TIMEOUT_MS = 30_000
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024

const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const canonicalProjectSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  ownerUserId: z.string().uuid(),
  title: z.string().min(1).max(120),
  status: z.enum(['draft', 'active', 'archived']),
  revision: z.number().int().positive(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
}).strict()

const canonicalProjectResultSchema = z.object({
  schemaVersion: z.literal(CANONICAL_PRIVATE_PROJECT_RESULT_VERSION),
  state: z.literal('persisted'),
  project: canonicalProjectSchema,
  descriptionDigestSha256: sha256.nullable(),
  customerCreditsMutated: z.literal(false),
  providerCallMade: z.literal(false),
  workerJobCreated: z.literal(false),
  renderJobCreated: z.literal(false),
  productionAuthority: z.literal(false),
  resultHash: sha256,
}).strict()

const canonicalProjectRowSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  owner_user_id: z.string().uuid(),
  title: z.string().min(1).max(160),
  status: z.enum(['draft', 'active', 'archived']),
  revision: z.number().int().positive(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
}).strict()

export type CanonicalPrivateProject = z.infer<typeof canonicalProjectSchema>
export type CanonicalPrivateProjectResult = z.infer<
  typeof canonicalProjectResultSchema
>

export interface CanonicalPrivateProjectAuthenticatedRequestAuthority {
  readonly ownerUserId: string
  readonly authenticatedAccessToken: string
  readonly isMockUser: false
}

export interface CanonicalPrivateProjectRequestAuthorityPort {
  readonly schemaVersion: typeof CANONICAL_PRIVATE_PROJECT_AUTHORITY_PORT_VERSION
  readonly sourceAuthority:
    'canonical_v3_loopback_authenticated_project_rpc_and_rls_read'
  readonly browserDirectTableWriteAllowed: false
  readonly authenticatedRlsReadVerified: true
  readonly durableIdempotentCreateVerified: true
  readonly remoteDatabaseMutationAllowed: false
  readonly productionAuthority: false
  createProject(input: {
    readonly workspaceId: string
    readonly ownerUserId: string
    readonly title: string
    readonly descriptionDigestSha256: string | null
    readonly idempotencyKey: string
    readonly requestSha256: string
    readonly requestedAt: string
  }): Promise<CanonicalPrivateProjectResult>
  readProject(input: {
    readonly workspaceId: string
    readonly ownerUserId: string
    readonly projectId: string
  }): Promise<CanonicalPrivateProject | undefined>
  listProjects(input: {
    readonly workspaceId: string
    readonly ownerUserId: string
  }): Promise<CanonicalPrivateProject[]>
}

export interface CanonicalPrivateProjectRequestAuthorityFactory {
  readonly schemaVersion: typeof CANONICAL_PRIVATE_PROJECT_FACTORY_VERSION
  readonly sourceAuthority:
    'canonical_v3_loopback_authenticated_project_rpc_and_rls_read'
  readonly requestScopedAuthenticatedUserAuthority: true
  readonly authenticatedActorDerivedServerSide: true
  readonly browserDirectTableWriteAllowed: false
  readonly serviceRoleCredentialAccepted: false
  readonly authenticatedAccessTokenPersistedOrProjected: false
  readonly loopbackOnly: true
  readonly remoteDatabaseMutationAllowed: false
  readonly productionAuthority: false
  createForAuthenticatedRequest(input: {
    readonly env: RuntimeEnv
    readonly authority: CanonicalPrivateProjectAuthenticatedRequestAuthority
  }): CanonicalPrivateProjectRequestAuthorityPort
}

const factoryBrands = new WeakSet<object>()
const portBrands = new WeakSet<object>()

export function createCanonicalPrivateProjectLocalRequestAuthorityFactory(
  input: {
    readonly endpointOrigin: string
    readonly anonKey: string
    readonly localInternalSigningSecret: string
  },
): CanonicalPrivateProjectRequestAuthorityFactory {
  if (input.endpointOrigin !== CANONICAL_LOCAL_ENDPOINT) {
    throw unavailable('project_authority_origin_not_canonical_loopback')
  }
  if (
    !isOpaqueCredential(input.anonKey)
    || !isSigningSecret(input.localInternalSigningSecret)
  ) {
    throw unavailable('project_authority_server_credentials_invalid')
  }

  const anonKey = input.anonKey
  const localInternalSigningSecret = input.localInternalSigningSecret
  const factory: CanonicalPrivateProjectRequestAuthorityFactory = Object.freeze({
    schemaVersion: CANONICAL_PRIVATE_PROJECT_FACTORY_VERSION,
    sourceAuthority:
      'canonical_v3_loopback_authenticated_project_rpc_and_rls_read' as const,
    requestScopedAuthenticatedUserAuthority: true as const,
    authenticatedActorDerivedServerSide: true as const,
    browserDirectTableWriteAllowed: false as const,
    serviceRoleCredentialAccepted: false as const,
    authenticatedAccessTokenPersistedOrProjected: false as const,
    loopbackOnly: true as const,
    remoteDatabaseMutationAllowed: false as const,
    productionAuthority: false as const,
    createForAuthenticatedRequest(
      { env, authority }: Parameters<
        CanonicalPrivateProjectRequestAuthorityFactory[
          'createForAuthenticatedRequest'
        ]
      >[0],
    ) {
      if (!isCanonicalLocalRuntime(env)) {
        throw unavailable('project_authority_runtime_not_canonical_local')
      }
      if (
        authority.isMockUser !== false
        || !isUuid(authority.ownerUserId)
        || !isAuthenticatedJwt(authority.authenticatedAccessToken)
      ) {
        throw unavailable('project_authority_authenticated_actor_invalid')
      }
      const ownerUserId = authority.ownerUserId
      const authenticatedAccessToken = authority.authenticatedAccessToken

      const port: CanonicalPrivateProjectRequestAuthorityPort = Object.freeze({
        schemaVersion: CANONICAL_PRIVATE_PROJECT_AUTHORITY_PORT_VERSION,
        sourceAuthority:
          'canonical_v3_loopback_authenticated_project_rpc_and_rls_read' as const,
        browserDirectTableWriteAllowed: false as const,
        authenticatedRlsReadVerified: true as const,
        durableIdempotentCreateVerified: true as const,
        remoteDatabaseMutationAllowed: false as const,
        productionAuthority: false as const,
        async createProject(
          rawInput: Parameters<
            CanonicalPrivateProjectRequestAuthorityPort['createProject']
          >[0],
        ) {
          const request = parseCreateRequest(rawInput, ownerUserId)
          const response = await postJson({
            url: `${CANONICAL_LOCAL_ENDPOINT}/rest/v1/rpc/${CREATE_PROJECT_RPC}`,
            anonKey,
            authenticatedAccessToken,
            headers: {
              'x-reeditpro-local-project-authority':
                createProjectAuthoritySignature(
                  CREATE_PROJECT_RPC,
                  request,
                  localInternalSigningSecret,
                ),
            },
            body: {
              p_contract_version:
                CANONICAL_PRIVATE_PROJECT_AUTHORITY_PORT_VERSION,
              p_request: request,
            },
          })
          const parsed = canonicalProjectResultSchema.safeParse(response)
          if (!parsed.success) {
            throw unavailable('project_authority_create_result_invalid')
          }
          const { resultHash, ...resultWithoutHash } = parsed.data
          if (sha256AuthorityValue(resultWithoutHash) !== resultHash) {
            throw unavailable('project_authority_create_result_hash_invalid')
          }
          assertProjectScope(
            parsed.data.project,
            ownerUserId,
            request.workspaceId,
          )
          if (
            parsed.data.project.title !== request.title
            || parsed.data.project.status !== 'draft'
            || parsed.data.project.revision !== 1
            || parsed.data.descriptionDigestSha256
              !== request.descriptionDigestSha256
          ) {
            throw unavailable('project_authority_create_result_lineage_invalid')
          }
          return parsed.data
        },
        async readProject(
          rawInput: Parameters<
            CanonicalPrivateProjectRequestAuthorityPort['readProject']
          >[0],
        ) {
          const scope = parseReadScope(rawInput, ownerUserId, true)
          const rows = await readProjectRows({
            anonKey,
            authenticatedAccessToken,
            query: new URLSearchParams({
              select:
                'id,workspace_id,owner_user_id,title,status,revision,created_at,updated_at',
              id: `eq.${scope.projectId}`,
              workspace_id: `eq.${scope.workspaceId}`,
              owner_user_id: `eq.${ownerUserId}`,
              limit: '1',
            }),
          })
          if (rows.length === 0) return undefined
          if (rows.length !== 1) {
            throw unavailable('project_authority_read_cardinality_invalid')
          }
          return projectFromRow(rows[0], ownerUserId, scope.workspaceId)
        },
        async listProjects(
          rawInput: Parameters<
            CanonicalPrivateProjectRequestAuthorityPort['listProjects']
          >[0],
        ) {
          const scope = parseReadScope(rawInput, ownerUserId, false)
          const rows = await readProjectRows({
            anonKey,
            authenticatedAccessToken,
            query: new URLSearchParams({
              select:
                'id,workspace_id,owner_user_id,title,status,revision,created_at,updated_at',
              workspace_id: `eq.${scope.workspaceId}`,
              owner_user_id: `eq.${ownerUserId}`,
              order: 'updated_at.desc,id.asc',
              limit: '1000',
            }),
          })
          return rows.map((row) =>
            projectFromRow(row, ownerUserId, scope.workspaceId),
          )
        },
      })
      portBrands.add(port)
      return port
    },
  })
  factoryBrands.add(factory)
  return factory
}

export function assertCanonicalPrivateProjectRequestAuthorityFactory(
  value: unknown,
): asserts value is CanonicalPrivateProjectRequestAuthorityFactory {
  if (
    !value
    || typeof value !== 'object'
    || !factoryBrands.has(value)
    || (value as Partial<CanonicalPrivateProjectRequestAuthorityFactory>)
      .schemaVersion !== CANONICAL_PRIVATE_PROJECT_FACTORY_VERSION
  ) {
    throw unavailable('project_authority_factory_not_process_branded')
  }
}

export function assertCanonicalPrivateProjectRequestAuthorityPort(
  value: unknown,
): asserts value is CanonicalPrivateProjectRequestAuthorityPort {
  if (
    !value
    || typeof value !== 'object'
    || !portBrands.has(value)
    || (value as Partial<CanonicalPrivateProjectRequestAuthorityPort>)
      .schemaVersion !== CANONICAL_PRIVATE_PROJECT_AUTHORITY_PORT_VERSION
  ) {
    throw unavailable('project_authority_port_not_process_branded')
  }
}

function parseCreateRequest(
  input: Parameters<CanonicalPrivateProjectRequestAuthorityPort['createProject']>[0],
  ownerUserId: string,
) {
  const schema = z.object({
    workspaceId: z.string().uuid(),
    ownerUserId: z.literal(ownerUserId),
    title: z.string().min(1).max(120).refine((value) => value === value.trim()),
    descriptionDigestSha256: sha256.nullable(),
    idempotencyKey: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/u),
    requestSha256: sha256,
    requestedAt: z.string().datetime(),
  }).strict()
  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Canonical private project creation request is invalid.',
      400,
    )
  }
  return {
    schemaVersion: CANONICAL_PRIVATE_PROJECT_REQUEST_VERSION,
    ...parsed.data,
  }
}

function parseReadScope(
  input: unknown,
  ownerUserId: string,
  projectRequired: boolean,
): { workspaceId: string; projectId?: string } {
  const schema = z.object({
    workspaceId: z.string().uuid(),
    ownerUserId: z.literal(ownerUserId),
    ...(projectRequired ? { projectId: z.string().uuid() } : {}),
  }).strict()
  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Canonical private project read scope is invalid.',
      400,
    )
  }
  return parsed.data as { workspaceId: string; projectId?: string }
}

async function readProjectRows(input: {
  anonKey: string
  authenticatedAccessToken: string
  query: URLSearchParams
}): Promise<unknown[]> {
  const response = await requestJson({
    url: `${CANONICAL_LOCAL_ENDPOINT}/rest/v1/projects?${input.query}`,
    anonKey: input.anonKey,
    authenticatedAccessToken: input.authenticatedAccessToken,
    method: 'GET',
  })
  if (!Array.isArray(response)) {
    throw unavailable('project_authority_read_result_invalid')
  }
  return response
}

async function postJson(input: {
  url: string
  anonKey: string
  authenticatedAccessToken: string
  headers: Record<string, string>
  body: unknown
}): Promise<unknown> {
  return requestJson({
    ...input,
    method: 'POST',
  })
}

async function requestJson(input: {
  url: string
  anonKey: string
  authenticatedAccessToken: string
  method: 'GET' | 'POST'
  headers?: Record<string, string>
  body?: unknown
}): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(input.url, {
      method: input.method,
      headers: {
        accept: 'application/json',
        apikey: input.anonKey,
        authorization: `Bearer ${input.authenticatedAccessToken}`,
        ...(input.body === undefined ? {} : { 'content-type': 'application/json' }),
        ...(input.headers ?? {}),
      },
      ...(input.body === undefined ? {} : { body: JSON.stringify(input.body) }),
      cache: 'no-store',
      credentials: 'omit',
      redirect: 'error',
      signal: AbortSignal.timeout(LOCAL_HTTP_TIMEOUT_MS),
    })
  } catch {
    throw unavailable('project_authority_local_http_unavailable')
  }
  const contentLength = Number(response.headers.get('content-length') ?? 0)
  if (Number.isFinite(contentLength) && contentLength > MAX_RESPONSE_BYTES) {
    throw unavailable('project_authority_response_too_large')
  }
  const body = await response.text()
  if (Buffer.byteLength(body, 'utf8') > MAX_RESPONSE_BYTES) {
    throw unavailable('project_authority_response_too_large')
  }
  let payload: unknown
  try {
    payload = body ? JSON.parse(body) : null
  } catch {
    throw unavailable('project_authority_response_not_json')
  }
  if (!response.ok) {
    const code = safeScalar(payload, 'code')
    if (response.status === 409 || code === '23505') {
      throw new ApiError(
        'IDEMPOTENCY_CONFLICT',
        'The project idempotency key was reused with a different request.',
        409,
      )
    }
    if (response.status === 401 || response.status === 403 || code === '42501') {
      throw new ApiError(
        'WORKSPACE_ACCESS_DENIED',
        'Canonical private project authority rejected this request.',
        403,
      )
    }
    throw unavailable('project_authority_rpc_rejected')
  }
  return payload
}

function projectFromRow(
  input: unknown,
  ownerUserId: string,
  workspaceId: string,
): CanonicalPrivateProject {
  const parsed = canonicalProjectRowSchema.safeParse(input)
  if (!parsed.success) {
    throw unavailable('project_authority_row_invalid')
  }
  if (
    parsed.data.owner_user_id !== ownerUserId
    || parsed.data.workspace_id !== workspaceId
  ) {
    throw unavailable('project_authority_row_scope_invalid')
  }
  return {
    id: parsed.data.id,
    workspaceId: parsed.data.workspace_id,
    ownerUserId: parsed.data.owner_user_id,
    title: parsed.data.title,
    status: parsed.data.status,
    revision: parsed.data.revision,
    createdAt: parsed.data.created_at,
    updatedAt: parsed.data.updated_at,
  }
}

function assertProjectScope(
  project: CanonicalPrivateProject,
  ownerUserId: string,
  workspaceId: string,
): void {
  if (
    project.ownerUserId !== ownerUserId
    || project.workspaceId !== workspaceId
  ) {
    throw unavailable('project_authority_project_scope_invalid')
  }
}

function createProjectAuthoritySignature(
  functionName: string,
  request: Record<string, unknown>,
  signingSecret: string,
): string {
  return createHmac('sha256', signingSecret).update(
    `canonical_private_project_local_internal_v1:${functionName}:`
      + sha256AuthorityValue(request),
  ).digest('hex')
}

function isCanonicalLocalRuntime(env: RuntimeEnv): boolean {
  return env.nodeEnv !== 'production'
    && env.mode === 'local'
    && env.storageMode === 'local'
    && env.allowInternalTestExecutionWithSupabase
    && !env.allowMockWithoutSupabase
    && env.supabaseUrl === CANONICAL_LOCAL_ENDPOINT
}

function isOpaqueCredential(value: string): boolean {
  return typeof value === 'string' && value.length >= 20 && value.length <= 4096
}

function isSigningSecret(value: string): boolean {
  return isOpaqueCredential(value) && Buffer.byteLength(value, 'utf8') >= 32
}

function isAuthenticatedJwt(value: string): boolean {
  return isOpaqueCredential(value)
    && value.split('.').length === 3
    && /^[A-Za-z0-9._-]+$/u.test(value)
}

function isUuid(value: string): boolean {
  return /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/iu.test(
    value,
  )
}

function safeScalar(value: unknown, field: string): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const scalar = (value as Record<string, unknown>)[field]
  return typeof scalar === 'string' && /^[A-Za-z0-9_.:-]{1,120}$/u.test(scalar)
    ? scalar
    : null
}

function unavailable(reason: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_ATOMICITY_REQUIRED',
    'Canonical private project authority is unavailable or unsafe.',
    503,
    {
      reason,
      browserDirectTableWriteAllowed: false,
      remoteDatabaseMutationAllowed: false,
      productionAuthority: false,
    },
  )
}
