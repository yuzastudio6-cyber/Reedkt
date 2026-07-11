import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import { INTERNAL_SERVICE_TOKEN_HEADER } from '../middleware/internal-service-auth'
import {
  clearPrivateCanonicalWorkerLeaseProcessStateForSmoke,
  readPrivateCanonicalWorkerLeaseAggregate,
} from '../services/private-canonical-worker-lease-store'
import { readPrivateEditAuthorityAggregate } from '../services/private-edit-authority-store'
import { canonicalAuthoritySmokeRoot } from './canonical-authority-smoke-root'

// Reuse the complete approved-plan/source/package fixture without consuming a
// worker attempt through the service-level lease smoke.
await import('./canonical-execution-readiness-smoke')

const localStorageRoot = canonicalAuthoritySmokeRoot
const workspaceId = 'workspace-authority-smoke'
const routeWorkspaceId = 'workspace-authority-route-smoke'
const userId = 'user-authority-smoke'
const bearerToken = 'verified-canonical-worker-lease-http-token'
const internalServiceToken = 'rp-http-lease-internal-8Kq4Tw9Nv2Lc6Yh1Zd7Pm5Fs0Bj'
const leaseCredentialHeader = 'x-reeditpro-worker-lease-credential'

clearPrivateCanonicalWorkerLeaseProcessStateForSmoke()
const mainAuthority = await requireEditAuthority(workspaceId)
const mainSnapshot = mainAuthority.snapshots.find((snapshot) =>
  mainAuthority.executionPackages.some((executionPackage) =>
    executionPackage.snapshotId === snapshot.snapshotId))
assert.ok(mainSnapshot)
const rootJob = mainAuthority.jobs.find((job) =>
  job.snapshotId === mainSnapshot.snapshotId && job.dependencyJobIds.length === 0)
const dependentJob = mainAuthority.jobs.find((job) =>
  job.snapshotId === mainSnapshot.snapshotId && job.dependencyJobIds.length > 0)
assert.ok(rootJob)
assert.ok(dependentJob)

const routeAuthority = await requireEditAuthority(routeWorkspaceId)
const routeSnapshot = routeAuthority.snapshots.find((snapshot) =>
  routeAuthority.executionPackages.some((executionPackage) =>
    executionPackage.snapshotId === snapshot.snapshotId))
assert.ok(routeSnapshot)
const routeRootJob = routeAuthority.jobs.find((job) =>
  job.snapshotId === routeSnapshot.snapshotId && job.dependencyJobIds.length === 0)
assert.ok(routeRootJob)

const user = {
  id: userId,
  email: 'canonical-worker-lease-http@reeditpro.local',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date(0).toISOString(),
} as User
const memberships = [
  { workspaceId, userId, role: 'owner' },
  { workspaceId: routeWorkspaceId, userId, role: 'owner' },
]
const clients = {
  admin: createMembershipAdminClient(memberships),
  public: createPublicAuthClient(new Map([[bearerToken, user]])),
}
const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  WORKER_RUNTIME_MODE: 'local',
  STORAGE_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'false',
  REEDITPRO_INTERNAL_SERVICE_TOKEN: internalServiceToken,
  LOCAL_STORAGE_ROOT: localStorageRoot,
})
const server = createServer(createReeditProApiApp(env, { clients }))
await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
const address = server.address() as AddressInfo
const baseUrl = `http://127.0.0.1:${address.port}`
const claimUrl = `${baseUrl}/v1/edit-executions/jobs/${rootJob.id}/leases`
const claimBody = {
  workspaceId,
  projectId: mainSnapshot.projectId,
  editSessionId: mainSnapshot.editSessionId,
  purpose: 'private_internal_canonical_lease_claim',
}
const userAuthHeader = { authorization: `Bearer ${bearerToken}` }
const internalAuthHeader = { [INTERNAL_SERVICE_TOKEN_HEADER]: internalServiceToken }
const dualAuthHeaders = { ...userAuthHeader, ...internalAuthHeader }

let leaseCredential: string
let leaseId: string
try {
  const missingInternal = await postJson(claimUrl, claimBody, {
    ...userAuthHeader,
    'idempotency-key': 'http-claim-missing-internal',
  })
  await assertError(missingInternal, 401, 'INTERNAL_SERVICE_AUTH_REQUIRED')

  const wrongInternal = await postJson(claimUrl, claimBody, {
    ...userAuthHeader,
    [INTERNAL_SERVICE_TOKEN_HEADER]: 'wrong-internal-service-token',
    'idempotency-key': 'http-claim-wrong-internal',
  })
  await assertError(wrongInternal, 403, 'INTERNAL_SERVICE_AUTH_INVALID')

  const missingUser = await postJson(claimUrl, claimBody, {
    ...internalAuthHeader,
    'idempotency-key': 'http-claim-missing-user',
  })
  await assertError(missingUser, 401, 'AUTH_REQUIRED')

  const bodyIdempotencyCannotReplaceHeader = await postJson(claimUrl, {
    ...claimBody,
    idempotencyKey: 'caller-body-key-is-not-authority',
  }, dualAuthHeaders)
  await assertError(bodyIdempotencyCannotReplaceHeader, 400, 'IDEMPOTENCY_KEY_REQUIRED')

  const strictClaimBody = await postJson(claimUrl, {
    ...claimBody,
    approvedPlanSnapshot: { callerAuthored: true },
    workerIdentity: 'caller-selected-worker',
  }, {
    ...dualAuthHeaders,
    'idempotency-key': 'http-claim-strict-body-rejection',
  })
  await assertError(strictClaimBody, 400, 'VALIDATION_FAILED')

  const claimHeaders = {
    ...dualAuthHeaders,
    'idempotency-key': 'http-canonical-lease-claim-1',
  }
  const claimResponse = await postJson(claimUrl, claimBody, claimHeaders)
  assert.equal(claimResponse.status, 201)
  assertNoStore(claimResponse)
  assert.equal(claimResponse.headers.get(leaseCredentialHeader), null)
  assert.equal(claimResponse.headers.get('set-cookie'), null)
  const claimText = await claimResponse.text()
  const claimEnvelope = JSON.parse(claimText) as {
    ok?: boolean
    data?: { workerLeaseClaim?: Record<string, unknown> }
  }
  assert.equal(claimEnvelope.ok, true)
  const claim = asRecord(claimEnvelope.data?.workerLeaseClaim)
  const lease = asRecord(claim.lease)
  const executionAuthority = asRecord(claim.executionAuthority)
  const persistenceEvidence = asRecord(claim.persistenceEvidence)
  leaseCredential = String(claim.leaseCredential)
  leaseId = String(lease.leaseId)
  assert.match(leaseCredential, /^rpwl_v1_[A-Za-z0-9_-]{43}$/)
  assert.equal(occurrenceCount(claimText, leaseCredential), 1)
  assert.equal(lease.jobId, rootJob.id)
  assert.equal(executionAuthority.dispatchAuthorized, false)
  assert.equal(executionAuthority.toolExecutionAuthorized, false)
  assert.equal(executionAuthority.providerCallAuthorized, false)
  assert.equal(executionAuthority.sourceObjectReadAuthorized, false)
  assert.equal(executionAuthority.artifactWriteAuthorized, false)
  assert.equal(executionAuthority.renderAuthorized, false)
  assert.equal(executionAuthority.creditSpendAuthorized, false)
  assert.equal(persistenceEvidence.singleHostPrivateLocalOnly, true)
  assert.equal(persistenceEvidence.productionAuthority, false)

  const persistedLeaseAuthority = await readPrivateCanonicalWorkerLeaseAggregate({
    localStorageRoot,
    ownerUserId: userId,
    workspaceId,
  })
  assert.ok(persistedLeaseAuthority)
  assert.equal(JSON.stringify(persistedLeaseAuthority).includes(leaseCredential), false)
  assert.equal('leaseCredential' in persistedLeaseAuthority.leases[0]!, false)

  const replayedClaim = await postJson(claimUrl, claimBody, claimHeaders)
  assert.equal(replayedClaim.status, 201)
  assert.equal(
    replayedClaim.headers.get('idempotency-replayed'),
    null,
    'Sensitive lease responses must replay from the domain authority without entering the generic body cache.',
  )
  assertNoStore(replayedClaim)
  const replayedClaimText = await replayedClaim.text()
  assert.equal(replayedClaimText, claimText)
  assert.equal(occurrenceCount(replayedClaimText, leaseCredential), 1)

  const heartbeatUrl = `${baseUrl}/v1/edit-executions/jobs/${rootJob.id}/leases/${leaseId}/heartbeat`
  const heartbeatBody = {
    workspaceId,
    projectId: mainSnapshot.projectId,
    editSessionId: mainSnapshot.editSessionId,
    purpose: 'private_internal_canonical_lease_heartbeat',
  }
  const missingCredential = await postJson(heartbeatUrl, heartbeatBody, {
    ...dualAuthHeaders,
    'idempotency-key': 'http-heartbeat-missing-credential',
  })
  await assertError(missingCredential, 409, 'WORKER_LEASE_EXPIRED', [leaseCredential])

  const forgedCredential = `rpwl_v1_${'A'.repeat(43)}`
  const forgedCredentialResponse = await postJson(heartbeatUrl, heartbeatBody, {
    ...dualAuthHeaders,
    [leaseCredentialHeader]: forgedCredential,
    'idempotency-key': 'http-heartbeat-forged-credential',
  })
  await assertError(forgedCredentialResponse, 409, 'WORKER_LEASE_EXPIRED', [leaseCredential, forgedCredential])

  const strictHeartbeatBody = await postJson(heartbeatUrl, {
    ...heartbeatBody,
    leaseCredential,
    approvedSnapshotId: mainSnapshot.snapshotId,
  }, {
    ...dualAuthHeaders,
    [leaseCredentialHeader]: leaseCredential,
    'idempotency-key': 'http-heartbeat-strict-body-rejection',
  })
  await assertError(strictHeartbeatBody, 400, 'VALIDATION_FAILED', [leaseCredential])

  const crossJob = await postJson(
    `${baseUrl}/v1/edit-executions/jobs/${dependentJob.id}/leases/${leaseId}/heartbeat`,
    heartbeatBody,
    {
      ...dualAuthHeaders,
      [leaseCredentialHeader]: leaseCredential,
      'idempotency-key': 'http-heartbeat-cross-job',
    },
  )
  await assertError(crossJob, 409, 'WORKER_LEASE_EXPIRED', [leaseCredential])

  const crossScope = await postJson(
    `${baseUrl}/v1/edit-executions/jobs/${routeRootJob.id}/leases/${leaseId}/heartbeat`,
    {
      workspaceId: routeWorkspaceId,
      projectId: routeSnapshot.projectId,
      editSessionId: routeSnapshot.editSessionId,
      purpose: 'private_internal_canonical_lease_heartbeat',
    },
    {
      ...dualAuthHeaders,
      [leaseCredentialHeader]: leaseCredential,
      'idempotency-key': 'http-heartbeat-cross-workspace',
    },
  )
  await assertError(crossScope, 409, 'WORKER_LEASE_EXPIRED', [leaseCredential])

  const heartbeatHeaders = {
    ...dualAuthHeaders,
    [leaseCredentialHeader]: leaseCredential,
    'idempotency-key': 'http-canonical-lease-heartbeat-1',
  }
  const heartbeat = await postJson(heartbeatUrl, heartbeatBody, heartbeatHeaders)
  assert.equal(heartbeat.status, 200)
  assertNoStore(heartbeat)
  const heartbeatText = await heartbeat.text()
  assert.equal(heartbeatText.includes(leaseCredential), false)
  assert.equal(heartbeat.headers.get(leaseCredentialHeader), null)
  const heartbeatReplay = await postJson(heartbeatUrl, heartbeatBody, heartbeatHeaders)
  assert.equal(heartbeatReplay.status, 200)
  assert.equal(heartbeatReplay.headers.get('idempotency-replayed'), null)
  assertNoStore(heartbeatReplay)
  assert.equal(await heartbeatReplay.text(), heartbeatText)

  const releaseUrl = `${baseUrl}/v1/edit-executions/jobs/${rootJob.id}/leases/${leaseId}/release`
  const releaseBody = {
    workspaceId,
    projectId: mainSnapshot.projectId,
    editSessionId: mainSnapshot.editSessionId,
    purpose: 'private_internal_canonical_lease_release',
  }
  const missingReleaseCredential = await postJson(releaseUrl, releaseBody, {
    ...dualAuthHeaders,
    'idempotency-key': 'http-release-missing-credential',
  })
  await assertError(missingReleaseCredential, 409, 'WORKER_LEASE_EXPIRED', [leaseCredential])

  const releaseHeaders = {
    ...dualAuthHeaders,
    [leaseCredentialHeader]: leaseCredential,
    'idempotency-key': 'http-canonical-lease-release-1',
  }
  const release = await postJson(releaseUrl, releaseBody, releaseHeaders)
  assert.equal(release.status, 200)
  assertNoStore(release)
  const releaseText = await release.text()
  assert.equal(releaseText.includes(leaseCredential), false)
  assert.equal(release.headers.get(leaseCredentialHeader), null)
  const releaseReplay = await postJson(releaseUrl, releaseBody, releaseHeaders)
  assert.equal(releaseReplay.status, 200)
  assert.equal(releaseReplay.headers.get('idempotency-replayed'), null)
  assertNoStore(releaseReplay)
  assert.equal(await releaseReplay.text(), releaseText)

  const capturedErrorLogs: string[] = []
  const originalConsoleError = console.error
  console.error = (...values: unknown[]) => { capturedErrorLogs.push(values.map(String).join(' ')) }
  let legacyResponse: Response
  try {
    legacyResponse = await postJson(
      `${baseUrl}/v1/edit-executions/private-internal-test-runs`,
      { workspaceId },
      {
        ...dualAuthHeaders,
        [leaseCredentialHeader]: leaseCredential,
      },
    )
  } finally {
    console.error = originalConsoleError
  }
  await assertError(legacyResponse!, 503, 'TOOL_NOT_READY', [leaseCredential])
  assert.equal(capturedErrorLogs.some((log) => log.includes(leaseCredential)), false)
} finally {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
}

const productionEnv = loadRuntimeEnv({
  NODE_ENV: 'production',
  E2E_RUNTIME_MODE: 'cloud_run',
  WORKER_RUNTIME_MODE: 'disabled',
  STORAGE_MODE: 'gcs_disabled',
  API_ALLOWED_CORS_ORIGINS: 'https://app.reeditpro.test',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'anon-placeholder',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-placeholder',
  REEDITPRO_INTERNAL_SERVICE_TOKEN: internalServiceToken,
})
const productionServer = createServer(createReeditProApiApp(productionEnv, { clients }))
await new Promise<void>((resolve) => productionServer.listen(0, '127.0.0.1', resolve))
try {
  const productionAddress = productionServer.address() as AddressInfo
  const productionResponse = await postJson(
    `http://127.0.0.1:${productionAddress.port}/v1/edit-executions/jobs/${rootJob.id}/leases`,
    claimBody,
    {
      ...dualAuthHeaders,
      'idempotency-key': 'production-lease-route-must-not-mount',
    },
  )
  assert.equal(productionResponse.status, 404)
  assertNoStore(productionResponse)
  const productionText = await productionResponse.text()
  assert.equal(productionText.includes(leaseCredential), false)
} finally {
  await new Promise<void>((resolve, reject) => productionServer.close((error) => error ? reject(error) : resolve()))
}

console.log(JSON.stringify({
  ok: true,
  checks: [
    'canonical_worker_lease_routes_require_internal_service_auth',
    'canonical_worker_lease_routes_require_verified_user_auth',
    'idempotency_header_required_and_exactly_replayed',
    'strict_claim_heartbeat_body_rejection',
    'claim_returns_one_opaque_credential',
    'credential_header_required_for_heartbeat_and_release',
    'forged_credential_rejected_without_echo',
    'cross_job_and_cross_workspace_lease_rejected',
    'heartbeat_and_release_do_not_return_credential',
    'cache_control_no_store_on_success_error_and_replay',
    'plaintext_credential_absent_from_persistent_lease_authority',
    'credential_absent_from_error_response_and_server_error_log',
    'legacy_edit_execution_routes_remain_blocked',
    'production_lease_routes_not_mounted',
  ],
}))

async function requireEditAuthority(targetWorkspaceId: string) {
  const aggregate = await readPrivateEditAuthorityAggregate({
    localStorageRoot,
    ownerUserId: userId,
    workspaceId: targetWorkspaceId,
  })
  assert.ok(aggregate)
  return aggregate
}

function postJson(url: string, body: unknown, headers: Record<string, string>): Promise<Response> {
  return fetch(url, {
    method: 'POST',
    headers: { ...headers, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function assertError(
  response: Response,
  status: number,
  code: string,
  forbiddenValues: string[] = [],
): Promise<void> {
  assert.equal(response.status, status)
  assertNoStore(response)
  const text = await response.text()
  const envelope = JSON.parse(text) as { error?: { code?: string } }
  assert.equal(envelope.error?.code, code)
  for (const value of forbiddenValues.filter(Boolean)) assert.equal(text.includes(value), false)
  assert.equal(response.headers.get(leaseCredentialHeader), null)
}

function assertNoStore(response: Response): void {
  assert.match(response.headers.get('cache-control') ?? '', /(?:^|,)\s*no-store(?:,|$)/i)
}

function asRecord(value: unknown): Record<string, unknown> {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value))
  return value as Record<string, unknown>
}

function occurrenceCount(value: string, needle: string): number {
  return value.split(needle).length - 1
}

function createMembershipAdminClient(
  membershipRows: Array<{ workspaceId: string; userId: string; role: string }>,
): SupabaseClient {
  return {
    from(table: string) {
      if (table !== 'workspace_members') throw new Error(`Unexpected table ${table}.`)
      let selectedWorkspaceId = ''
      let selectedUserId = ''
      const query = {
        select() { return query },
        eq(column: string, value: string) {
          if (column === 'workspace_id') selectedWorkspaceId = value
          if (column === 'user_id') selectedUserId = value
          return query
        },
        async maybeSingle() {
          const membership = membershipRows.find((candidate) =>
            candidate.workspaceId === selectedWorkspaceId && candidate.userId === selectedUserId)
          return {
            data: membership ? {
              workspace_id: membership.workspaceId,
              user_id: membership.userId,
              role: membership.role,
            } : null,
            error: null,
          }
        },
      }
      return query
    },
  } as unknown as SupabaseClient
}

function createPublicAuthClient(usersByToken: Map<string, User>): SupabaseClient {
  return {
    auth: {
      async getUser(token: string) {
        const authenticatedUser = usersByToken.get(token)
        return {
          data: { user: authenticatedUser ?? null },
          error: authenticatedUser ? null : { message: 'invalid test token' },
        }
      },
    },
  } as unknown as SupabaseClient
}
