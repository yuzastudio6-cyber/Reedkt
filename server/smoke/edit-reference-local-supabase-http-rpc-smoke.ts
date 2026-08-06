import assert from 'node:assert/strict'
import { createHash, createHmac } from 'node:crypto'
import type {
  EditReferenceProductionExactEditPreferenceValues,
} from '../../src/types/edit-reference-production-exact-edit-apply-api'
import {
  type EditReferenceProductionExactEditApplyRequest,
  validateEditReferenceProductionExactEditApplyRequest,
} from '../edit-references/edit-reference-production-exact-edit-apply-boundary'
import {
  createEditReferenceLocalSupabaseHttpRpcClient,
  assertEditReferenceLocalSupabaseHttpRpcClientIsNotProduction,
} from '../edit-references/edit-reference-local-supabase-http-rpc-client'
import {
  createEditReferenceLocalSupabaseRpcAdapter,
  createEditReferenceLocalSupabaseRpcCapability,
} from '../edit-references/edit-reference-local-supabase-rpc-adapter'
import {
  createEditReferenceProductionApplicationLifecycleRequest,
} from '../edit-references/edit-reference-production-application-lifecycle'
import {
  createEditReferenceProductionOutputFrameAuthority,
} from '../edit-references/edit-reference-production-output-frame-authority'
import {
  EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION,
} from '../edit-references/edit-reference-production-persistence-contract'
const endpointOrigin = requiredEnvironment('REEDITPRO_CANONICAL_V3_API_URL')
const anonKey = requiredEnvironment('REEDITPRO_CANONICAL_V3_ANON_KEY')
const jwtSecret = requiredEnvironment('REEDITPRO_CANONICAL_V3_JWT_SECRET')
assert.equal(endpointOrigin, 'http://127.0.0.1:57431')

const ownerA = '11111111-1111-4111-8111-111111111111'
const ownerB = '22222222-2222-4222-8222-222222222222'
const workspaceA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const projectA = 'aaaaaaaa-1000-4000-8000-000000000001'
const editA = 'aaaaaaaa-2000-4000-8000-000000000001'
const tokenA = createLocalAuthenticatedJwt(ownerA, jwtSecret)
const tokenB = createLocalAuthenticatedJwt(ownerB, jwtSecret)

const clientA = createEditReferenceLocalSupabaseHttpRpcClient({
  endpointOrigin,
  anonKey,
  authenticatedAccessToken: tokenA,
})
const clientB = createEditReferenceLocalSupabaseHttpRpcClient({
  endpointOrigin,
  anonKey,
  authenticatedAccessToken: tokenB,
})
const capabilityA = createEditReferenceLocalSupabaseRpcCapability({
  client: clientA,
  endpointOrigin,
})
const adapterA = createEditReferenceLocalSupabaseRpcAdapter({
  client: clientA,
  capability: capabilityA,
})
const capabilityB = createEditReferenceLocalSupabaseRpcCapability({
  client: clientB,
  endpointOrigin,
})
const adapterB = createEditReferenceLocalSupabaseRpcAdapter({
  client: clientB,
  capability: capabilityB,
})

const preferenceValues: EditReferenceProductionExactEditPreferenceValues = {
  editLevel: 'pro',
  workflowType: 'testimonial_case_study',
  cleanupPreference: 'balanced_cleanup',
  visualPreference: 'balanced_visual_mix',
  moodStyle: 'clean',
  creditPreference: 'balanced',
  targetPlatform: 'youtube',
}
const applyAuthority = await adapterA.readExactEditApplyAuthority({
  actorUserId: ownerA,
  workspaceId: workspaceA,
  projectId: projectA,
  editSessionId: editA,
  selectedApplicationId: 'aaaaaaaa-7000-4000-8000-000000000001',
})
assert.deepEqual(applyAuthority.values, preferenceValues)
assert.equal(applyAuthority.recordRevision, 0)
assert.equal(applyAuthority.preferenceRevision, 0)
assert.equal(applyAuthority.planningInputRevision, 0)
assert.ok(applyAuthority.outputFrameAuthority)
assert.ok(applyAuthority.selectedApplicationAuthority)
const frame = applyAuthority.outputFrameAuthority
const selectedApplication = applyAuthority.selectedApplicationAuthority
assert.equal(frame.authorityDigestSha256, createEditReferenceProductionOutputFrameAuthority({
  repositoryAuthority: 'supabase_rls_transactional',
  workspaceId: workspaceA,
  projectId: projectA,
  editSessionId: editA,
  exactEditPreferenceRecordRevision: 0,
  planningInputRevision: 0,
  confirmationId: 'aaaaaaaa-8000-4000-8000-000000000001',
  aspectRatio: '16:9',
  confirmedAt: '2026-07-21T12:00:00.000Z',
}).authorityDigestSha256)
const lifecycleRequest = createEditReferenceProductionApplicationLifecycleRequest({
  mutation: 'apply',
  actorUserId: ownerA,
  workspaceId: workspaceA,
  projectId: projectA,
  editSessionId: editA,
  editReferenceId: selectedApplication.editReferenceId,
  studySessionId: selectedApplication.studySessionId,
  dnaVersionId: selectedApplication.dnaVersionId,
  applicationId: selectedApplication.applicationId,
  expectedCurrentApplicationId: null,
  expectedReferenceRevision: selectedApplication.expectedReferenceRevision,
  expectedPlanningInputRevision: applyAuthority.planningInputRevision,
  applicationContentDigestSha256: selectedApplication.applicationContentDigestSha256,
  applicationContextHashSha256: selectedApplication.applicationContextHashSha256,
  targetUnderstandingPackageDigestSha256:
    selectedApplication.targetUnderstandingPackageDigestSha256,
  outputFrameConfirmation: frame,
  idempotencyKeyHashSha256: '3'.repeat(64),
  requestedAt: '2026-07-21T13:20:00.000Z',
})
const requestWithoutDigest = {
  schemaVersion: 'edit-reference-production-exact-edit-apply-boundary-v1' as const,
  rpcName: 'apply_exact_edit_preferences_and_reference_v1' as const,
  actorUserId: ownerA,
  workspaceId: workspaceA,
  projectId: projectA,
  editSessionId: editA,
  accessCheckReceiptId: 'local-http-access-check-a',
  exactEditPreferenceAuthorityReadReceiptId: applyAuthority.authorityReadReceiptId,
  expectedPreferenceRecordRevision: applyAuthority.recordRevision,
  expectedPreferenceRevision: applyAuthority.preferenceRevision,
  expectedPlanningInputRevision: applyAuthority.planningInputRevision,
  expectedPreferenceFingerprintSha256: applyAuthority.preferenceFingerprintSha256,
  preferencePatch: { visualPreference: 'keep_visuals_minimal' as const },
  changedPreferenceFields: ['visualPreference'] as const,
  referenceLifecycleRequest: lifecycleRequest,
  referenceLifecycleExecutionPolicy: 'nested_same_transaction_never_called_separately' as const,
  planningInputRevisionIncrement: 1 as const,
  sourcePreparationDisposition: 'unchanged' as const,
  outputFrameDisposition: 'unchanged' as const,
  freshPlanAndEstimateRequired: true as const,
  approvedSnapshotPreserved: true as const,
  historicalPrivatePreviewPreserved: true as const,
  idempotencyKeyHashSha256: '3'.repeat(64),
  requestedAt: '2026-07-21T13:20:00.000Z',
  customerPriceCalculated: false as const,
  customerCreditsMutated: false as const,
  serviceFeeIncluded: false as const,
  providerOrWorkerExecutionStarted: false as const,
}
const request: EditReferenceProductionExactEditApplyRequest = {
  ...requestWithoutDigest,
  requestDigestSha256: sha256(requestWithoutDigest),
}
validateEditReferenceProductionExactEditApplyRequest(request)

const receipt = await adapterA.applyExactEditPreferencesAndReference(request)
const replay = await adapterA.applyExactEditPreferencesAndReference(request)
assert.equal(receipt.referenceMutation, 'apply')
assert.deepEqual(receipt.changedPreferenceFields, ['visualPreference'])
assert.equal(receipt.committedPreferenceRecordRevision, 1)
assert.equal(receipt.committedPreferenceRevision, 1)
assert.equal(receipt.committedPlanningInputRevision, 1)
assert.equal(receipt.transactionId, replay.transactionId)
assert.equal(
  receipt.transactionReceiptDigestSha256,
  replay.transactionReceiptDigestSha256,
)

const read = await adapterA.planningAuthorityReader.readExactApplicationState({
  actorUserId: ownerA,
  workspaceId: workspaceA,
  projectId: projectA,
  editSessionId: editA,
})
assert.equal(read.currentState, 'connected')
assert.equal(read.application?.id, 'aaaaaaaa-7000-4000-8000-000000000001')
assert.equal(read.lifecycleReceipt?.committedPlanningInputRevision, 1)

const committedApplyAuthority = await adapterA.readExactEditApplyAuthority({
  actorUserId: ownerA,
  workspaceId: workspaceA,
  projectId: projectA,
  editSessionId: editA,
  selectedApplicationId: selectedApplication.applicationId,
})
assert.equal(committedApplyAuthority.recordRevision, 1)
assert.equal(committedApplyAuthority.preferenceRevision, 1)
assert.equal(committedApplyAuthority.planningInputRevision, 1)
assert.equal(committedApplyAuthority.currentApplicationState, 'connected')
assert.equal(committedApplyAuthority.currentApplicationId, selectedApplication.applicationId)
assert.equal(committedApplyAuthority.outputFrameAuthority?.exactEditPreferenceRecordRevision, 1)
assert.equal(committedApplyAuthority.outputFrameAuthority?.planningInputRevision, 1)
assert.equal(committedApplyAuthority.selectedApplicationAuthority?.connectionState, 'connected')

const planningBefore = await adapterA.readExactEditPlanningAuthority({
  actorUserId: ownerA,
  workspaceId: workspaceA,
  projectId: projectA,
  editSessionId: editA,
})
assert.equal(planningBefore.recordRevision, 1)
assert.equal(planningBefore.preferenceRevision, 1)
assert.equal(planningBefore.planningInputRevision, 1)
assert.deepEqual(planningBefore.values, {
  ...preferenceValues,
  visualPreference: 'keep_visuals_minimal',
})
assert.equal(planningBefore.sourcePreparation.status, 'not_ready')
assert.equal(planningBefore.frameConfirmation.status, 'confirmed')

const planningAfter = await adapterA.recordExactEditPlanningEvidence({
  schemaVersion: 'canonical-exact-edit-planning-evidence-request-v1',
  actorUserId: ownerA,
  workspaceId: workspaceA,
  projectId: projectA,
  editSessionId: editA,
  expectedPreferenceRevision: planningBefore.preferenceRevision,
  expectedPlanningInputRevision: planningBefore.planningInputRevision,
  expectedPreferenceFingerprintSha256:
    planningBefore.preferenceFingerprintSha256,
  expectedBaselinePreferenceSnapshotId:
    planningBefore.baseline.preferenceSnapshotId,
  sourceCandidateHashSha256: '4'.repeat(64),
  sourcePreparationEvidenceHashSha256: '5'.repeat(64),
  confirmedAspectRatio: '16:9',
})
assert.equal(planningAfter.recordRevision, 2)
assert.equal(planningAfter.preferenceRevision, 1)
assert.equal(planningAfter.planningInputRevision, 1)
assert.equal(planningAfter.sourcePreparation.status, 'ready')
if (planningAfter.sourcePreparation.status !== 'ready') {
  throw new Error('Canonical planning evidence was not committed.')
}
assert.equal(
  planningAfter.sourcePreparation.sourceCandidateHashSha256,
  '4'.repeat(64),
)

const deniedMutation = await clientB.rpc(
  'apply_exact_edit_preferences_and_reference_v1',
  {
    p_contract_version: EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION,
    p_request: request,
  },
)
assert.equal(deniedMutation.data, null)
assert.deepEqual(deniedMutation.error, { code: '42501', status: 403 })

await assert.rejects(
  adapterB.readExactEditApplyAuthority({
    actorUserId: ownerB,
    workspaceId: workspaceA,
    projectId: projectA,
    editSessionId: editA,
    selectedApplicationId: selectedApplication.applicationId,
  }),
)

await assert.rejects(
  adapterB.planningAuthorityReader.readExactApplicationState({
    actorUserId: ownerB,
    workspaceId: workspaceA,
    projectId: projectA,
    editSessionId: editA,
  }),
)

await assert.rejects(
  adapterB.readExactEditPlanningAuthority({
    actorUserId: ownerB,
    workspaceId: workspaceA,
    projectId: projectA,
    editSessionId: editA,
  }),
)

const ownerRows = await localPostgrestJson({
  token: tokenA,
  path: `/rest/v1/exact_edit_preference_apply_events?select=id,workspace_id&workspace_id=eq.${workspaceA}`,
})
const otherRows = await localPostgrestJson({
  token: tokenB,
  path: `/rest/v1/exact_edit_preference_apply_events?select=id,workspace_id&workspace_id=eq.${workspaceA}`,
})
assert.equal(ownerRows.status, 200)
assert.equal(Array.isArray(ownerRows.body) ? ownerRows.body.length : -1, 1)
assert.equal(otherRows.status, 200)
assert.deepEqual(otherRows.body, [])

const directWrite = await localPostgrestJson({
  token: tokenA,
  path: '/rest/v1/exact_edit_preference_apply_events',
  method: 'POST',
  body: {},
})
assert.ok([401, 403].includes(directWrite.status))

let promotionRejected = false
try {
  assertEditReferenceLocalSupabaseHttpRpcClientIsNotProduction(clientA)
} catch {
  promotionRejected = true
}
assert.equal(promotionRejected, true)
assert.equal(adapterA.loopbackOnly, true)
assert.equal(adapterA.remoteDatabaseMutationAllowed, false)
assert.equal(adapterA.productionAuthority, false)

console.log(JSON.stringify({
  ok: true,
  schemaVersion: clientA.schemaVersion,
  transport: clientA.transport,
  exactApplyRpc: 'apply_exact_edit_preferences_and_reference_v1',
  exactApplyAuthorityReadRpc: 'read_exact_edit_apply_authority_v1',
  exactReplayStable: true,
  outputFrameAuthorityResealedAfterRevision: true,
  nestedLifecycleConnected: true,
  exactEditPlanningAuthorityReadVerified: true,
  sourcePreparationEvidenceCommittedWithoutPreferenceRevision: true,
  crossWorkspacePlanningAuthorityDenied: true,
  ownerVisibleApplyEvents: 1,
  crossWorkspaceVisibleApplyEvents: 0,
  crossWorkspaceMutationDenied: true,
  directTableMutationDenied: true,
  customerPricingOrCreditsMutated: false,
  remoteDatabaseMutationAllowed: false,
  productionAuthority: false,
}, null, 2))

async function localPostgrestJson(input: {
  readonly token: string
  readonly path: string
  readonly method?: 'GET' | 'POST'
  readonly body?: unknown
}): Promise<{ readonly status: number; readonly body: unknown }> {
  assert.ok(input.path.startsWith('/rest/v1/'))
  const response = await fetch(`${endpointOrigin}${input.path}`, {
    method: input.method ?? 'GET',
    headers: {
      accept: 'application/json',
      apikey: anonKey,
      authorization: `Bearer ${input.token}`,
      ...(input.body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    body: input.body === undefined ? undefined : JSON.stringify(input.body),
    signal: AbortSignal.timeout(15_000),
  })
  const text = await response.text()
  assert.ok(Buffer.byteLength(text, 'utf8') <= 2 * 1024 * 1024)
  return {
    status: response.status,
    body: text.length > 0 ? JSON.parse(text) : null,
  }
}

function createLocalAuthenticatedJwt(subject: string, secret: string): string {
  const now = Math.floor(Date.now() / 1000)
  const header = base64Url({ alg: 'HS256', typ: 'JWT' })
  const payload = base64Url({
    aud: 'authenticated',
    exp: now + 900,
    iat: now,
    role: 'authenticated',
    sub: subject,
  })
  const unsigned = `${header}.${payload}`
  const signature = createHmac('sha256', secret).update(unsigned).digest('base64url')
  return `${unsigned}.${signature}`
}

function base64Url(value: unknown): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url')
}

function sha256(value: unknown): string {
  return createHash('sha256').update(stableJson(value)).digest('hex')
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value !== null && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`)
      .join(',')}}`
  }
  const serialized = JSON.stringify(value)
  if (serialized === undefined) throw new Error('local_http_smoke_non_canonical_value')
  return serialized
}

function requiredEnvironment(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`local_http_smoke_environment_missing:${name}`)
  return value
}
