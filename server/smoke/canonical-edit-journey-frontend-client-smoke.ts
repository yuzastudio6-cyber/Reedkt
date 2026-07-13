import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import {
  CANONICAL_EDIT_JOURNEY_STAGES,
  createCanonicalEditJourneyPresentation,
  parseCanonicalEditJourney,
  type CanonicalEditJourneyStage,
} from '../../src/lib/canonical-edit-journey'
import type { ProjectPersistenceScope } from '../../src/lib/project-persistence-scope'
import { canonicalEditJourneyResponseSchema } from '../validation/canonical-edit-journey-schemas'

const identity = {
  workspaceId: 'workspace-ui-smoke',
  projectId: 'project-ui-smoke',
  editSessionId: 'edit-ui-smoke',
}

for (const stage of CANONICAL_EDIT_JOURNEY_STAGES) {
  const fixture = journeyFixture(stage)
  assert.equal(
    canonicalEditJourneyResponseSchema.safeParse(fixture).success,
    true,
    `${stage} fixture should remain valid against the canonical backend schema.`,
  )
  const parsed = parseCanonicalEditJourney(fixture, identity)
  assert.equal(parsed.ok, true, `${stage} should parse through the browser-safe projection.`)
  if (!parsed.ok) continue
  assert.equal(parsed.value.stage, stage, `${stage} should preserve its exact stage.`)
  assert.equal(parsed.value.inspectionOnly, true, `${stage} should remain inspection-only.`)
  assert.equal(parsed.value.testOnly, true, `${stage} should remain private-test-only.`)
  if (stage === 'plan_approval_required') {
    assert.deepEqual(parsed.value.approvalAuthority, {
      planId: 'plan-ui-smoke',
      estimateId: 'estimate-ui-smoke',
      expectedPlanHash: hash('1'),
      expectedEstimateHash: hash('2'),
    })
  } else {
    assert.equal(parsed.value.approvalAuthority, undefined)
  }
  if (stage === 'approved_snapshot_available') {
    assert.deepEqual(parsed.value.executionPackageAuthority, {
      snapshotId: 'snapshot-ui-smoke',
      expectedSnapshotHash: hash('3'),
    })
  } else {
    assert.equal(parsed.value.executionPackageAuthority, undefined)
  }
  if (stage === 'execution_in_progress' || stage === 'private_review_assembly_required') {
    assert.deepEqual(parsed.value.privateEditPreparationAuthority, {
      packageRecordId: 'package-ui-smoke',
      expectedPackageHash: hash('4'),
      snapshotId: 'snapshot-ui-smoke',
      expectedSnapshotHash: hash('3'),
    })
  } else {
    assert.equal(parsed.value.privateEditPreparationAuthority, undefined)
  }

  const presentation = createCanonicalEditJourneyPresentation(parsed.value)
  assert.ok(presentation.title.length > 0, `${stage} should have a user-facing title.`)
  assert.ok(presentation.summary.length > 0, `${stage} should have a user-facing summary.`)
  assert.ok(presentation.nextStep.length > 0, `${stage} should have one clear next step.`)
  assert.doesNotMatch(
    JSON.stringify(presentation),
    /\/v1\/|[a-f0-9]{64}|planning_handoff|internal_service|packageRecordId|snapshotId|filesystem|credential|provider/i,
    `${stage} presentation must not expose backend authority or private lineage details.`,
  )
}

assertRejected('foreign workspace identity', mutateJourney('plan_approval_required', (fixture) => {
  asRecord(fixture.identity).workspaceId = 'workspace-foreign'
}))
assertRejected('substituted next-action route', mutateJourney('plan_approval_required', (fixture) => {
  asRecord(fixture.nextAction).routeTemplate = '/v1/edit-plans/foreign-plan/canonical-approval'
}))
assertRejected('unexpected raw planning input', mutateJourney('planning_handoff_required', (fixture) => {
  fixture.rawPlanInputs = { prompt: 'must-not-cross-boundary' }
}))
assertRejected('tool execution permission escalation', mutateJourney('execution_in_progress', (fixture) => {
  asRecord(fixture.permissions).toolExecution = true
}))
assertRejected('cross-stage review decision injection', mutateJourney('private_review_ready', (fixture) => {
  const review = asRecord(fixture.review)
  review.decision = 'accept_private_internal_review'
  review.decisionStatus = 'private_internal_review_accepted'
  review.decisionManifestSha256 = hash('f')
  review.privateHistoryDownload = privateHistoryDescriptor()
}))
assertRejected('inconsistent progress counts', mutateJourney('execution_in_progress', (fixture) => {
  asRecord(fixture.workGraphProgress).pendingJobCount = 99
}))
assertRejected('foreign private history lineage', mutateJourney('private_review_accepted', (fixture) => {
  const review = asRecord(fixture.review)
  const descriptor = asRecord(review.privateHistoryDownload)
  asRecord(descriptor.query).expectedFinalArtifactSha256 = hash('0')
}))

const originalMode = process.env.VITE_REEDITPRO_API_MODE
const originalBaseUrl = process.env.VITE_REEDITPRO_API_BASE_URL
const originalE2E = process.env.VITE_REEDITPRO_E2E
const originalE2EToken = process.env.VITE_REEDITPRO_E2E_AUTH_TOKEN
let responseMode: 'valid' | 'foreign' | 'unavailable' = 'valid'
const seenRequests: Array<{ authorization?: string; method?: string; url?: string }> = []

const server = createServer((request, response) => {
  seenRequests.push({
    authorization: request.headers.authorization,
    method: request.method,
    url: request.url,
  })
  response.setHeader('content-type', 'application/json')
  if (responseMode === 'unavailable') {
    response.statusCode = 503
    response.end(JSON.stringify({
      ok: false,
      error: { code: 'BACKEND_UNAVAILABLE', message: 'Fixture unavailable.' },
      warnings: [],
    }))
    return
  }

  const fixture = journeyFixture('plan_approval_required')
  if (responseMode === 'foreign') asRecord(fixture.identity).workspaceId = 'workspace-foreign'
  response.end(JSON.stringify({
    ok: true,
    data: { canonicalEditJourney: fixture },
    warnings: ['Canonical journey frontend-client smoke response.'],
  }))
})

await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
const address = server.address()
assert(address && typeof address === 'object', 'Frontend-client smoke server should expose an address.')

process.env.VITE_REEDITPRO_API_MODE = 'frontend_safe'
process.env.VITE_REEDITPRO_API_BASE_URL = `http://127.0.0.1:${address.port}`
process.env.VITE_REEDITPRO_E2E = 'true'
process.env.VITE_REEDITPRO_E2E_AUTH_TOKEN = 'canonical-journey-ui-smoke-token'

const scope: ProjectPersistenceScope = {
  authMode: 'local_test',
  userId: 'user-ui-smoke',
  workspaceId: identity.workspaceId,
}

try {
  const { getApiRouteById } = await import('../../src/backend/api/api-route-registry')
  const { readCanonicalEditJourney } = await import('../../src/lib/canonical-edit-journey-client')

  const route = getApiRouteById('planning.canonicalJourney.get')
  assert.equal(route?.path, '/v1/projects/:projectId/edit-sessions/:editSessionId/canonical-journey')
  assert.equal(route?.runtimeMode, 'frontend_safe')
  assert.equal(route?.status, 'frontend_safe_ready')
  assert.equal(route?.requiresServiceRole, false)
  assert.equal(route?.requiresProviderSecret, false)
  assert.equal(route?.requiresStripeSecret, false)

  const initialRead = readCanonicalEditJourney(scope, identity.projectId, identity.editSessionId)
  const duplicateRead = readCanonicalEditJourney(scope, identity.projectId, identity.editSessionId)
  assert.equal(duplicateRead, initialRead, 'Identical in-flight recovery reads should share one bounded request.')
  const ready = await initialRead
  assert.equal(ready.status, 'ready', 'Reviewed HTTP transport should recover the canonical journey.')
  if (ready.status === 'ready') assert.equal(ready.journey.stage, 'plan_approval_required')
  assert.equal(seenRequests[0]?.method, 'GET')
  assert.equal(
    seenRequests[0]?.url,
    `/v1/projects/${identity.projectId}/edit-sessions/${identity.editSessionId}/canonical-journey?workspaceId=${identity.workspaceId}`,
  )
  assert.equal(seenRequests[0]?.authorization, 'Bearer canonical-journey-ui-smoke-token')
  assert.equal(seenRequests.length, 1, 'The duplicate in-flight read must not create another HTTP request.')

  responseMode = 'foreign'
  const foreign = await readCanonicalEditJourney(scope, identity.projectId, identity.editSessionId)
  assert.equal(foreign.status, 'invalid_response', 'Foreign backend identity must fail closed in the browser client.')
  assert.equal(foreign.retryable, false)

  responseMode = 'unavailable'
  const unavailable = await readCanonicalEditJourney(scope, identity.projectId, identity.editSessionId)
  assert.equal(unavailable.status, 'unavailable', 'Transport failure should remain distinct from an empty workflow.')
  assert.equal(unavailable.retryable, true)
} finally {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve())
  })
  restoreEnv('VITE_REEDITPRO_API_MODE', originalMode)
  restoreEnv('VITE_REEDITPRO_API_BASE_URL', originalBaseUrl)
  restoreEnv('VITE_REEDITPRO_E2E', originalE2E)
  restoreEnv('VITE_REEDITPRO_E2E_AUTH_TOKEN', originalE2EToken)
}

console.log('Canonical edit journey frontend client smoke passed.')

function journeyFixture(stage: CanonicalEditJourneyStage): Record<string, unknown> {
  const fixture: Record<string, unknown> = {
    schemaVersion: 'canonical-edit-journey-recovery-v1',
    source: 'canonical_edit_journey_service',
    identity: { ...identity },
    stage,
    nextAction: actionFor(stage),
    permissions: {
      inspectionOnly: true,
      rawPlanInputsReturned: false,
      filesystemPathReturned: false,
      credentialReturned: false,
      snapshotMutation: false,
      creditMutation: false,
      toolExecution: false,
      providerCall: false,
      render: false,
    },
    testOnly: true,
  }

  if (stage === 'planning_handoff_required') return fixture

  fixture.planningHandoff = planningHandoff(
    stage === 'publication_request_required' || stage === 'internal_publication_pending'
      ? 'unpublished'
      : 'published',
  )
  if (stage === 'publication_request_required') return fixture

  fixture.publicationRequest = publicationRequest(
    stage === 'internal_publication_pending' ? 'pending_internal_publication' : 'published',
  )
  if (stage === 'internal_publication_pending') return fixture

  if (stage === 'cancellation_pending') {
    fixture.plan = plan('cancellation_pending', 'approved')
    return fixture
  }
  if (stage === 'replanning_required') {
    fixture.plan = plan('superseded', 'superseded')
    return fixture
  }

  fixture.plan = stage === 'plan_approval_required'
    ? plan('presented', 'presented')
    : plan('approved', 'approved')
  if (stage === 'plan_approval_required') return fixture

  fixture.approval = approval()
  if (stage === 'approved_snapshot_available') return fixture

  fixture.execution = execution()
  if (stage === 'execution_in_progress') {
    fixture.workGraphProgress = workGraphProgress()
    return fixture
  }
  if (stage === 'private_review_assembly_required') {
    fixture.workGraph = completedWorkGraph()
    return fixture
  }

  fixture.review = review(stage)
  return fixture
}

function actionFor(stage: CanonicalEditJourneyStage): Record<string, unknown> {
  const projectRoute = (suffix: string) =>
    `/v1/projects/${identity.projectId}/edit-sessions/${identity.editSessionId}/${suffix}`
  switch (stage) {
    case 'planning_handoff_required':
    case 'revision_requested':
    case 'replanning_required':
      return { code: stage === 'planning_handoff_required' ? 'prepare_planning_handoff' : 'prepare_replacement_plan', actor: 'planning_client', method: 'POST', routeTemplate: projectRoute('canonical-planning-handoff') }
    case 'publication_request_required':
      return { code: 'submit_publication_request', actor: 'planning_client', method: 'POST', routeTemplate: projectRoute('canonical-planning-handoffs/handoff-ui-smoke/publication-requests') }
    case 'internal_publication_pending':
      return { code: 'await_internal_publication', actor: 'internal_service', method: 'POST', routeTemplate: projectRoute('canonical-planning-handoffs/handoff-ui-smoke/publication-requests/candidate-ui-smoke/publish') }
    case 'plan_approval_required':
      return { code: 'approve_canonical_plan', actor: 'authenticated_user', method: 'POST', routeTemplate: '/v1/edit-plans/plan-ui-smoke/canonical-approval' }
    case 'approved_snapshot_available':
      return { code: 'request_execution_package', actor: 'authenticated_user', method: 'POST', routeTemplate: '/v1/approved-snapshots/snapshot-ui-smoke/canonical-execution-package' }
    case 'execution_in_progress':
    case 'private_review_assembly_required':
      return { code: 'prepare_private_edit_review', actor: 'authenticated_user', method: 'POST', routeTemplate: '/v1/edit-executions/packages/package-ui-smoke/canonical-private-edit-preparation' }
    case 'private_review_ready':
      return { code: 'record_private_review_decision', actor: 'authenticated_user', method: 'POST', routeTemplate: '/v1/edit-executions/private-review-assemblies/review-assembly-ui-smoke/decisions' }
    case 'private_review_accepted':
      return { code: 'await_public_delivery_authorization', actor: 'internal_service', method: 'GET', routeTemplate: projectRoute('canonical-journey') }
    case 'cancellation_pending':
      return { code: 'await_cancellation_reconciliation', actor: 'internal_service', method: 'GET', routeTemplate: '/v1/edit-plans/plan-ui-smoke/authority' }
  }
}

function planningHandoff(publicationStatus: 'unpublished' | 'published') {
  return {
    handoffId: 'handoff-ui-smoke',
    handoffHash: hash('a'),
    canonicalPlanComponentsHash: hash('b'),
    publicationStatus,
  }
}

function publicationRequest(publicationStatus: 'pending_internal_publication' | 'published') {
  return {
    candidateId: 'candidate-ui-smoke',
    candidateHash: hash('c'),
    publicationRequestHash: hash('d'),
    publicationStatus,
  }
}

function plan(
  status: 'presented' | 'approved' | 'superseded' | 'cancellation_pending',
  estimateStatus: 'presented' | 'approved' | 'superseded',
) {
  return {
    planId: 'plan-ui-smoke',
    planVersion: 3,
    status,
    planHash: hash('1'),
    estimateId: 'estimate-ui-smoke',
    estimateStatus,
    estimateHash: hash('2'),
    approvedMaximumCredits: 84,
    workItemCount: 4,
  }
}

function approval() {
  return {
    approvalId: 'approval-ui-smoke',
    snapshotId: 'snapshot-ui-smoke',
    snapshotHash: hash('3'),
    reservationId: 'reservation-ui-smoke',
    reservationStatus: 'reserved',
    reservedCredits: 84,
    jobCount: 4,
    readyJobCount: 1,
    blockedJobCount: 3,
  }
}

function execution() {
  return {
    packageRecordId: 'package-ui-smoke',
    packageHash: hash('4'),
    snapshotId: 'snapshot-ui-smoke',
    purpose: 'private_internal_execution_handoff',
  }
}

function workGraphProgress() {
  return {
    packageRecordId: 'package-ui-smoke',
    approvedPlanSnapshotId: 'snapshot-ui-smoke',
    checkpointHash: hash('5'),
    checkpointSequence: 2,
    status: 'advancing_private_test_work_graph',
    runFinished: false,
    updatedAt: '2026-07-13T12:00:00.000Z',
    totalJobCount: 4,
    completedJobCount: 2,
    capabilityBlockedJobCount: 0,
    dependencyBlockedJobCount: 0,
    pendingJobCount: 2,
    requiredIncompleteJobCount: 2,
    allRequiredJobsCompleted: false,
    nextRequiredGate: 'canonical_private_work_graph_advancement',
  }
}

function completedWorkGraph() {
  return {
    packageRecordId: 'package-ui-smoke',
    approvedPlanSnapshotId: 'snapshot-ui-smoke',
    responseHash: hash('6'),
    status: 'completed_private_test_work_graph',
    completedAt: '2026-07-13T12:05:00.000Z',
    totalJobCount: 4,
    completedJobCount: 4,
    requiredBlockedJobCount: 0,
    allRequiredJobsCompleted: true,
    nextRequiredGate: 'canonical_terminal_private_review_assembly',
  }
}

function review(stage: CanonicalEditJourneyStage) {
  const base: Record<string, unknown> = {
    reviewAssemblyId: 'review-assembly-ui-smoke',
    manifestSha256: hash('7'),
    finalArtifactSha256: hash('8'),
  }
  if (stage === 'revision_requested') {
    base.decision = 'request_revision'
    base.decisionStatus = 'canonical_revision_requested'
    base.decisionManifestSha256 = hash('9')
    base.privateHistoryDownload = privateHistoryDescriptor()
  }
  if (stage === 'private_review_accepted') {
    base.decision = 'accept_private_internal_review'
    base.decisionStatus = 'private_internal_review_accepted'
    base.decisionManifestSha256 = hash('9')
    base.privateHistoryDownload = privateHistoryDescriptor()
  }
  return base
}

function privateHistoryDescriptor() {
  return {
    method: 'GET',
    routeTemplate: '/v1/edit-executions/private-review-history/review-assembly-ui-smoke/file',
    query: {
      workspaceId: identity.workspaceId,
      packageRecordId: 'package-ui-smoke',
      expectedDecisionManifestSha256: hash('9'),
      expectedFinalArtifactSha256: hash('8'),
      purpose: 'download_canonical_private_review_history_artifact',
    },
  }
}

function mutateJourney(
  stage: CanonicalEditJourneyStage,
  mutate: (fixture: Record<string, unknown>) => void,
): Record<string, unknown> {
  const fixture = structuredClone(journeyFixture(stage))
  mutate(fixture)
  return fixture
}

function assertRejected(label: string, fixture: Record<string, unknown>): void {
  const parsed = parseCanonicalEditJourney(fixture, identity)
  assert.equal(parsed.ok, false, `${label} must fail closed in the frontend parser.`)
}

function asRecord(value: unknown): Record<string, unknown> {
  assert(value && typeof value === 'object' && !Array.isArray(value))
  return value as Record<string, unknown>
}

function hash(character: string): string {
  return character.repeat(64)
}

function restoreEnv(key: string, value: string | undefined): void {
  if (value === undefined) delete process.env[key]
  else process.env[key] = value
}
