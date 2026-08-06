import assert from 'node:assert/strict'
import { ApiError } from '../errors/api-error'
import { loadRuntimeEnv } from '../config/env'
import {
  authorizeWorkspaceAccess,
  createDetachedWorkspaceAccessContext,
} from '../services/workspace-access-service'
import type { ServiceContext } from '../types'

const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  STORAGE_MODE: 'local',
  LOCAL_STORAGE_ROOT: `/tmp/reeditpro-detached-workspace-access-${process.pid}`,
  SUPABASE_URL: 'https://detached-workspace-access.reeditpro.local',
  SUPABASE_ANON_KEY: 'test-anon-key',
})
const originalFetch = globalThis.fetch
let membershipReads = 0
let bearerAvailable = true

globalThis.fetch = async (_input, init) => {
  membershipReads += 1
  const authorization = new Headers(init?.headers).get('authorization')
  if (!bearerAvailable) {
    return new Response(JSON.stringify({ message: 'expired' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    })
  }
  const membership = authorization === 'Bearer owner-token'
    ? {
        workspace_id: 'workspace-alpha',
        user_id: 'user-owner',
        role: 'owner',
      }
    : authorization === 'Bearer viewer-token'
      ? {
          workspace_id: 'workspace-alpha',
          user_id: 'user-viewer',
          role: 'viewer',
        }
      : undefined
  if (!membership) {
    return new Response(JSON.stringify({ message: 'invalid' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    })
  }
  return new Response(JSON.stringify([
    membership,
  ]), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

try {
  const requestContext = context('user-owner', 'owner-token')
  const detachedContext = await createDetachedWorkspaceAccessContext(
    requestContext,
    'workspace-alpha',
  )
  assert.equal(membershipReads, 1)

  bearerAvailable = false
  assert.deepEqual(
    await authorizeWorkspaceAccess(
      detachedContext,
      'workspace-alpha',
      'write',
    ),
    {
      workspaceId: 'workspace-alpha',
      userId: 'user-owner',
      role: 'owner',
    },
  )
  assert.equal(
    membershipReads,
    1,
    'Detached background authorization must not reread an expired browser bearer token.',
  )

  assert.deepEqual(
    await authorizeWorkspaceAccess(
      { ...detachedContext },
      'workspace-alpha',
      'write',
    ),
    {
      workspaceId: 'workspace-alpha',
      userId: 'user-owner',
      role: 'owner',
    },
  )
  assert.equal(
    membershipReads,
    1,
    'A service-scoped context wrapper must preserve the same frozen process-bound auth authority.',
  )

  await rejectsCode(
    () => authorizeWorkspaceAccess(
      detachedContext,
      'workspace-beta',
      'write',
    ),
    'WORKSPACE_ACCESS_DENIED',
  )
  assert.equal(membershipReads, 1)

  await rejectsCode(
    () => authorizeWorkspaceAccess(
      { ...detachedContext, auth: { ...detachedContext.auth! } },
      'workspace-alpha',
      'write',
    ),
    'WORKSPACE_ACCESS_DENIED',
  )
  assert.equal(
    membershipReads,
    2,
    'Copying a detached context must not copy its process-bound authority.',
  )

  bearerAvailable = true
  await rejectsCode(
    () => createDetachedWorkspaceAccessContext(
      context('user-viewer', 'viewer-token'),
      'workspace-alpha',
    ),
    'WORKSPACE_ACCESS_DENIED',
  )
  assert.equal(membershipReads, 3)

  await rejectsCode(
    () => authorizeWorkspaceAccess(
      context('user-owner', undefined),
      'workspace-alpha',
      'write',
    ),
    'AUTH_INVALID',
  )

  console.log(JSON.stringify({
    smoke: 'detached-workspace-access-authority',
    initialMembershipReads: 1,
    detachedWriteAfterBearerExpiry: true,
    serviceContextWrapperPreserved: true,
    wrongWorkspaceRejected: true,
    copiedContextRejected: true,
    viewerDetachedWriteRejected: true,
    unbrandedMissingBearerRejected: true,
  }))
} finally {
  globalThis.fetch = originalFetch
}

function context(userId: string, accessToken: string | undefined): ServiceContext {
  return {
    env,
    clients: {
      admin: null,
      public: null,
    },
    requestId: `detached-workspace-access-${userId}`,
    auth: {
      userId,
      accessToken,
      isMockUser: false,
    },
  }
}

async function rejectsCode(
  operation: () => Promise<unknown>,
  code: string,
): Promise<void> {
  await assert.rejects(operation, (error: unknown) =>
    error instanceof ApiError && error.code === code)
}
