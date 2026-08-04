import assert from 'node:assert/strict'
import { createHash, createHmac } from 'node:crypto'
import {
  EDIT_REFERENCE_APPLICATION_PREPARATION_INTENT_VERSION,
  type EditReferenceApplicationPreparationIntent,
} from '../../src/types/edit-reference-production-application-preparation-api'
import {
  editReferenceApplicationPreparationRequestDigest,
  stableEditReferenceApplicationPreparationJson,
} from '../edit-references/edit-reference-production-application-preparation-boundary'
import {
  assertEditReferenceLocalSupabaseApplicationPreparationPortIsNotProduction,
  createEditReferenceLocalSupabaseApplicationPreparationPort,
} from '../edit-references/edit-reference-local-supabase-application-preparation-port'
import {
  createEditReferenceLocalSupabaseDomainCapability,
  createEditReferenceLocalSupabaseDomainRepository,
} from '../edit-references/edit-reference-local-supabase-domain-repository'
import {
  createEditReferenceLocalSupabaseDomainHttpRpcClient,
} from '../edit-references/edit-reference-local-supabase-domain-http-rpc-client'
import {
  createEditReferenceCanonicalV3LocalTargetUnderstandingPackageRuntimePortFactory,
} from '../services/edit-reference-canonical-v3-local-target-understanding-package-runtime-port-factory'
import { loadRuntimeEnv } from '../config/env'

const endpointOrigin = requiredEnvironment('REEDITPRO_CANONICAL_V3_API_URL')
const serviceRoleKey = requiredEnvironment('REEDITPRO_CANONICAL_V3_SERVICE_ROLE_KEY')
const anonKey = requiredEnvironment('REEDITPRO_CANONICAL_V3_ANON_KEY')
const jwtSecret = requiredEnvironment('REEDITPRO_CANONICAL_V3_JWT_SECRET')
assert.equal(endpointOrigin, 'http://127.0.0.1:57431')

const actorUserId = '11111111-1111-4111-8111-111111111111'
const workspaceId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const projectId = 'aaaaaaaa-1000-4000-8000-000000000001'
const editSessionId = 'aaaaaaaa-2000-4000-8000-000000000001'
const intent: EditReferenceApplicationPreparationIntent = {
  schemaVersion: EDIT_REFERENCE_APPLICATION_PREPARATION_INTENT_VERSION,
  workspaceId,
  editReferenceId: 'aaaaaaaa-3000-4000-8000-000000000001',
  studySessionId: 'aaaaaaaa-4000-4000-8000-000000000001',
  dnaVersionId: 'aaaaaaaa-5000-4000-8000-000000000001',
  expectedReferenceRevision: 1,
  expectedDNAContentDigestSha256: '5'.repeat(64),
  applicationSource: 'setup_selector',
  targetUnderstandingPackageId: 'aaaaaaaa-6500-4000-8000-000000000001',
  targetUnderstandingPackageDigestSha256: 'd'.repeat(64),
  targetUnderstandingSourceStorageObjectRecordId:
    'aaaaaaaa-6100-4000-8000-000000000001',
  targetUnderstandingSourceMediaAssetId:
    'aaaaaaaa-6200-4000-8000-000000000001',
  targetUnderstandingEditBriefDigestSha256: 'c'.repeat(64),
}
const preparationRequestDigestSha256 = editReferenceApplicationPreparationRequestDigest({
  actorUserId,
  projectId,
  editSessionId,
  intent,
})
const domainClient = createEditReferenceLocalSupabaseDomainHttpRpcClient({
  endpointOrigin,
  serviceRoleKey,
})
const domainCapability = createEditReferenceLocalSupabaseDomainCapability({
  client: domainClient,
  endpointOrigin,
})
const referenceRepository = createEditReferenceLocalSupabaseDomainRepository({
  client: domainClient,
  capability: domainCapability,
})
const env = loadRuntimeEnv({
  ...process.env,
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  STORAGE_MODE: 'local',
  LOCAL_STORAGE_ROOT:
    '/tmp/reeditpro-canonical-v3-local-application-preparation',
  PROVIDER_EXECUTION_ENABLED: 'false',
  WORKER_RUNTIME_MODE: 'mock',
})
const targetUnderstandingPackageRuntimePortFactory =
  createEditReferenceCanonicalV3LocalTargetUnderstandingPackageRuntimePortFactory({
    endpointOrigin,
    anonKey,
    localInternalSigningSecret: jwtSecret,
  })
const port = createEditReferenceLocalSupabaseApplicationPreparationPort({
  endpointOrigin,
  serviceRoleKey,
  env,
  referenceRepository,
  targetUnderstandingPackageRuntimePortFactory,
})
const input = {
  actor: {
    actorUserId,
    authenticatedAccessToken: createLocalAuthenticatedJwt(actorUserId, jwtSecret),
    mockActor: false,
    localStorageRoot: '/tmp/reeditpro-canonical-v3-local-application-preparation',
  },
  projectId,
  editSessionId,
  intent,
  idempotencyKeyHashSha256: '9'.repeat(64),
  preparationRequestDigestSha256,
}

// Migration 007 retained one historical synthetic target row for baseline
// auditability. V2 must refuse it because it was not written through the raw
// target-package persistence contract. The succeeding raw-package path is
// exercised by the mounted canonical target/application journey.
await assert.rejects(port.prepare(input))

const changedIntent: EditReferenceApplicationPreparationIntent = {
  ...intent,
  applicationSource: 'chat_tag',
}
await assert.rejects(port.prepare({
  ...input,
  intent: changedIntent,
  preparationRequestDigestSha256: editReferenceApplicationPreparationRequestDigest({
    actorUserId,
    projectId,
    editSessionId,
    intent: changedIntent,
  }),
}))

assertEditReferenceLocalSupabaseApplicationPreparationPortIsNotProduction(port)
assert.equal(port.runtimeClass, 'controlled_local_contract')
assert.equal(port.evidenceClass, 'isolated_local_supabase_rls_verified')
assert.equal(port.sourceAuthority, 'canonical_v3_local_supabase_rls')
assert.equal(port.productionAuthority, false)
assert.equal(port.sameReleaseReadinessEvidenceVerified, false)

console.log(JSON.stringify({
  ok: true,
  schemaVersion: port.schemaVersion,
  rpc: 'prepare_edit_reference_application_v2',
  obsoleteSyntheticTargetRejected: true,
  tenantIsolationVerifiedLocally: true,
  browserApplicationRecordAccepted: false,
  applicationConnectedToEdit: false,
  productionAuthority: false,
  contractDigestSha256: sha256({ intent, preparationRequestDigestSha256 }),
}, null, 2))

function sha256(value: unknown): string {
  return createHash('sha256')
    .update(stableEditReferenceApplicationPreparationJson(value))
    .digest('hex')
}

function requiredEnvironment(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name}_required`)
  return value
}

function createLocalAuthenticatedJwt(subject: string, secret: string): string {
  const now = Math.floor(Date.now() / 1_000)
  const encode = (value: unknown): string => Buffer.from(JSON.stringify(value))
    .toString('base64url')
  const header = encode({ alg: 'HS256', typ: 'JWT' })
  const payload = encode({
    aud: 'authenticated',
    exp: now + 3_600,
    iat: now,
    role: 'authenticated',
    sub: subject,
  })
  const signature = createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64url')
  return `${header}.${payload}.${signature}`
}
