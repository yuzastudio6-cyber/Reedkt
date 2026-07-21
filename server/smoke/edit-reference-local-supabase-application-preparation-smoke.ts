import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
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

const endpointOrigin = requiredEnvironment('REEDITPRO_CANONICAL_V3_API_URL')
const serviceRoleKey = requiredEnvironment('REEDITPRO_CANONICAL_V3_SERVICE_ROLE_KEY')
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
const port = createEditReferenceLocalSupabaseApplicationPreparationPort({
  endpointOrigin,
  serviceRoleKey,
})
const input = {
  actor: {
    actorUserId,
    authenticatedAccessToken: null,
    mockActor: true,
    localStorageRoot: '/tmp/reeditpro-canonical-v3-local-application-preparation',
  },
  projectId,
  editSessionId,
  intent,
  idempotencyKeyHashSha256: '9'.repeat(64),
  preparationRequestDigestSha256,
}

const prepared = await port.prepare(input)
const replayed = await port.prepare(input)
assert.equal(prepared.transactionId, replayed.transactionId)
assert.equal(prepared.receiptDigestSha256, replayed.receiptDigestSha256)
assert.equal(prepared.applicationAuthority.applicationId, replayed.applicationAuthority.applicationId)
assert.equal(prepared.applicationAuthority.workspaceId, workspaceId)
assert.equal(prepared.applicationAuthority.projectId, projectId)
assert.equal(prepared.applicationAuthority.editSessionId, editSessionId)
assert.equal(prepared.applicationAuthority.editReferenceId, intent.editReferenceId)
assert.equal(prepared.applicationAuthority.connectionState, 'not_connected')
assert.equal(prepared.applicationConnectedToEdit, false)
assert.equal(prepared.planOrEstimateInvalidated, false)
assert.equal(prepared.approvedSnapshotMutated, false)
assert.equal(prepared.customerPriceCalculated, false)
assert.equal(prepared.customerCreditsMutated, false)
assert.equal(prepared.serviceFeeIncluded, false)
assert.equal(prepared.providerOrWorkerExecutionStarted, false)

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
  rpc: 'prepare_edit_reference_application_v1',
  exactReplayStable: true,
  tenantIsolationVerifiedLocally: true,
  browserApplicationRecordAccepted: false,
  applicationConnectedToEdit: false,
  productionAuthority: false,
  receiptDigestSha256: sha256(prepared),
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
