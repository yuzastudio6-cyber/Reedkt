import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createServer } from 'node:http'

import {
  ORCHESTRA_SKILL_CALL_VERSION,
  ORCHESTRA_VISUAL_INTELLIGENCE_JOB_ROUTE_ID,
} from '../../src/types/orchestra-skill-capability'
import {
  VISUAL_INTELLIGENCE_AUTHENTICATED_READ_ROUTE_ID,
  VISUAL_INTELLIGENCE_EXECUTION_ROUTE_ID,
  VISUAL_INTELLIGENCE_INSPECTION_ROUTE_ID,
  VISUAL_INTELLIGENCE_PLANNING_OPERATION_ROUTE_ID,
  type VisualIntelligenceRequest,
} from '../../src/types/visual-intelligence'
import { getApiRouteById } from '../../src/backend/api/api-route-registry'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import { ApiError } from '../errors/api-error'
import {
  createOrchestraSkillCall,
} from '../orchestra/orchestra-skill-capability-contract'
import {
  createProfessionalHighVisualIntelligenceQualityPolicy,
  createVisualInspectionRequirement,
  createVisualIntelligenceEvidenceRef,
  createVisualIntelligencePlanningOperationInput,
  createVisualIntelligenceRequest,
} from '../visual-intelligence/visual-intelligence-contract'
import {
  createVisualIntelligenceAuthenticatedReadRequest,
} from '../visual-intelligence/visual-intelligence-authenticated-read-service'
import {
  EDIT_REFERENCE_VISUAL_INTELLIGENCE_BINDING_PREPARATION_ROUTE,
} from '../edit-references/edit-reference-visual-intelligence-result-bridge'

const token = 'visual-intelligence-route-contract-smoke-token'
const frameRate = { numerator: 24, denominator: 1 } as const
const fullRange = {
  startFrame: 0,
  endFrameExclusive: 240,
  frameRate,
} as const
const ref = (id: string, value: unknown = { id }) =>
  createVisualIntelligenceEvidenceRef(id, value)
const scope = {
  ownerUserId: 'mock-user-runtime',
  workspaceId: 'workspace-vi-route',
  projectId: 'project-vi-route',
  editSessionId: 'edit-vi-route',
  approvedSnapshotId: null,
} as const

const sourceRequest = buildRequest({
  requestId: 'vi-route-source-1',
  idempotencyKey: 'vi-route-source-idempotency-1',
  operation: 'analyze_media',
  profile: 'source_edit_planning',
  callerQuestion: null,
})
const queryRequest = buildRequest({
  requestId: 'vi-route-query-1',
  idempotencyKey: 'vi-route-query-idempotency-1',
  operation: 'query_range',
  profile: 'identify_primary_subject',
  callerQuestion: 'Identify the primary subject in this authorized range.',
})
const planningInput = createVisualIntelligencePlanningOperationInput({
  requestId: queryRequest.requestId,
  idempotencyKey: queryRequest.idempotencyKey,
  scope,
  operation: 'query_range',
  profile: 'identify_primary_subject',
  sourceEvidenceRequests: [sourceRequest],
  comparisonEvidenceRequests: [],
  requestedRanges: [fullRange],
  expectedOutcomeRefs: [],
  outputFrame: null,
  protectedZones: [],
  callerQuestion: queryRequest.callerQuestion,
  byteFreeRequest: true,
  callerPromptAccepted: false,
  callerAdmissionAccepted: false,
  callerCostAssertionAccepted: false,
  mediaLocatorIncluded: false,
  providerCredentialIncluded: false,
})

const orchestraCalls: unknown[] = []
const app = createReeditProApiApp(loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'mock',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  STORAGE_MODE: 'local',
  REEDITPRO_INTERNAL_SERVICE_TOKEN: token,
}), {
  visualIntelligenceOrchestraJobRuntimePort: Object.freeze({
    schemaVersion: 'visual-intelligence-orchestra-job-runtime-v1',
    async execute(input: unknown) {
      orchestraCalls.push(input)
      throw stopped('controlled_no_orchestra_visual_provider_call')
    },
  }),
  visualIntelligenceReportRepository: Object.freeze({
    async readAcceptedByCacheIdentity() { return null },
    async readAcceptedByRef() { return null },
    async persistImmutable() {
      throw new Error('Authenticated read route cannot persist a report.')
    },
  }),
})

const server = createServer(app)
server.listen(0, '127.0.0.1')
await once(server, 'listening')
const address = server.address()
assert.ok(address && typeof address === 'object')
const baseUrl = `http://127.0.0.1:${address.port}`

try {
  const execution = await post(
    `/v1/workspaces/${scope.workspaceId}/visual-intelligence/executions`,
    sourceRequest,
    {
      'idempotency-key': sourceRequest.idempotencyKey,
      'x-request-id': sourceRequest.requestId,
      'x-reeditpro-internal-token': token,
    },
  )
  assert.equal(execution.status, 404)

  const planning = await post(
    `/v1/workspaces/${scope.workspaceId}/visual-intelligence/planning-operations`,
    planningInput,
    {
      'idempotency-key': planningInput.idempotencyKey,
      'x-request-id': planningInput.requestId,
      'x-reeditpro-internal-token': token,
    },
  )
  assert.equal(planning.status, 404)

  const orchestraCall = createOrchestraSkillCall({
    schemaVersion: ORCHESTRA_SKILL_CALL_VERSION,
    callId: 'vi-route-orchestra-call-1',
    orchestraPlanRef: ref('vi-route-orchestra-plan'),
    orchestraJobRef: ref('vi-route-orchestra-job'),
    parentJobRef: null,
    requestedBy: { kind: 'orchestra' },
    targetSkillKey: 'visual_intelligence',
    jobType: 'source_video_understanding',
    phase: 'planning',
    scope: {
      scopeType: 'video',
      sourceArtifactRef: ref('finalized-source'),
      authorizedRanges: [fullRange],
      completeSourceCoverageRequired: true,
      outputId: null,
    },
    sceneContextSnapshotRef: null,
    sourceArtifactRefs: [ref('finalized-source')],
    comparisonArtifactRefs: [],
    expectedOutcomeRefs: [],
    requiredEvidenceRefs: [ref('orchestra-route-probe')],
    manifestRef: ref('orchestra-visual-manifest'),
    qualificationSnapshotRef: ref('orchestra-visual-qualification'),
    timeBudgetRef: ref('orchestra-time-budget'),
    creditBudgetRef: ref('orchestra-credit-budget'),
    attemptEnvelopeRef: ref('orchestra-attempt-envelope'),
    approvedSnapshotRef: null,
    idempotencyKey: 'vi-route-orchestra-idempotency-1',
    orchestraDispatchAuthorized: true,
    directProviderCallAllowed: false,
    directTimelineMutationAllowed: false,
    directArtifactMutationAllowed: false,
    scopeExpansionAllowed: false,
    peerSkillExecutionAuthorityAccepted: false,
  })
  const missingConsumerBindingField = await post(
    `/internal/v1/workspaces/${scope.workspaceId}/orchestra/skill-jobs/visual-intelligence`,
    { call: orchestraCall, supportRequest: null },
    {
      'idempotency-key': 'missing-consumer-binding-field',
      'x-request-id': orchestraCall.callId,
      'x-reeditpro-internal-token': token,
    },
  )
  assert.equal(missingConsumerBindingField.status, 400)
  assert.equal(orchestraCalls.length, 0)
  const orchestraExecution = await post(
    `/internal/v1/workspaces/${scope.workspaceId}/orchestra/skill-jobs/visual-intelligence`,
    {
      call: orchestraCall,
      supportRequest: null,
      consumerBindingRequest: null,
    },
    {
      'idempotency-key': orchestraCall.idempotencyKey,
      'x-request-id': orchestraCall.callId,
      'x-reeditpro-internal-token': token,
    },
  )
  assert.equal(orchestraExecution.status, 503)
  assert.equal(orchestraCalls.length, 1)
  const invalidOrchestraToken = await post(
    `/internal/v1/workspaces/${scope.workspaceId}/orchestra/skill-jobs/visual-intelligence`,
    {
      call: orchestraCall,
      supportRequest: null,
      consumerBindingRequest: null,
    },
    {
      'idempotency-key': orchestraCall.idempotencyKey,
      'x-request-id': orchestraCall.callId,
      'x-reeditpro-internal-token': 'wrong-token',
    },
  )
  assert.equal(invalidOrchestraToken.status, 403)
  assert.equal(orchestraCalls.length, 1)
  const wrongOrchestraIdempotency = await post(
    `/internal/v1/workspaces/${scope.workspaceId}/orchestra/skill-jobs/visual-intelligence`,
    {
      call: orchestraCall,
      supportRequest: null,
      consumerBindingRequest: null,
    },
    {
      'idempotency-key': 'wrong-idempotency',
      'x-request-id': orchestraCall.callId,
      'x-reeditpro-internal-token': token,
    },
  )
  assert.equal(wrongOrchestraIdempotency.status, 409)
  assert.equal(orchestraCalls.length, 1)

  const bindingPreparationPath =
    EDIT_REFERENCE_VISUAL_INTELLIGENCE_BINDING_PREPARATION_ROUTE
      .replace(':workspaceId', scope.workspaceId)
      .replace(':studyId', 'missing-study')
      .replace(':referenceAssetId', 'missing-reference-asset')
  const bindingPreparationWithoutInternalAuth = await post(
    bindingPreparationPath,
    { expectedStudyRevision: 1, orchestraCall },
    { 'x-request-id': 'vi-binding-preparation-no-auth' },
  )
  assert.equal(bindingPreparationWithoutInternalAuth.status, 401)
  const bindingPreparationWithInternalAuth = await post(
    bindingPreparationPath,
    { expectedStudyRevision: 1, orchestraCall },
    {
      'x-request-id': 'vi-binding-preparation-internal',
      'x-reeditpro-internal-token': token,
    },
  )
  assert.equal(bindingPreparationWithInternalAuth.status, 404)

  const crossWorkspacePlanning = await post(
    '/v1/workspaces/foreign-workspace/visual-intelligence/planning-operations',
    planningInput,
    {
      'idempotency-key': planningInput.idempotencyKey,
      'x-request-id': planningInput.requestId,
      'x-reeditpro-internal-token': token,
    },
  )
  assert.equal(crossWorkspacePlanning.status, 404)

  const requirement = createVisualInspectionRequirement({
    inspectionId: 'vi-route-inspection-1',
    owningWorkNodeId: 'caption-render-work-1',
    owningSkillId: 'caption_render_qa',
    profile: 'caption_layout_qa',
    expectedOutcomeRefs: [ref('caption-layout-outcome')],
    requestedRanges: [fullRange],
    required: true,
    blocksNextWorkNode: true,
    blocksPreview: false,
    blocksFinalExport: true,
    currentRepairCycle: 0,
  })
  const inspectionIdempotency =
    `vi-inspection-${requirement.inspectionDigestSha256.slice(7, 55)}`
  const inspection = await post(
    `/v1/workspaces/${scope.workspaceId}/visual-intelligence/inspections`,
    {
      scope: { ...scope, approvedSnapshotId: 'snapshot-vi-route' },
      requirement,
    },
    {
      'idempotency-key': inspectionIdempotency,
      'x-reeditpro-internal-token': token,
    },
  )
  assert.equal(inspection.status, 404)

  const readRequest = createVisualIntelligenceAuthenticatedReadRequest({
    requestId: 'vi-route-read-1',
    scope,
    reportRef: ref('missing-visual-report'),
  })
  const read = await post(
    `/v1/workspaces/${scope.workspaceId}/visual-intelligence/reports/authenticated-read`,
    readRequest,
  )
  assert.equal(read.status, 200)
  const envelope = await read.json() as {
    ok: boolean
    data: { authenticatedRead: { disposition: string } }
  }
  assert.equal(envelope.ok, true)
  assert.equal(envelope.data.authenticatedRead.disposition, 'not_found')

  assert.equal(
    getApiRouteById(VISUAL_INTELLIGENCE_EXECUTION_ROUTE_ID)?.status,
    'disabled',
  )
  assert.equal(
    getApiRouteById(VISUAL_INTELLIGENCE_PLANNING_OPERATION_ROUTE_ID)?.status,
    'disabled',
  )
  assert.equal(
    getApiRouteById(VISUAL_INTELLIGENCE_INSPECTION_ROUTE_ID)?.status,
    'disabled',
  )
  assert.equal(
    getApiRouteById(VISUAL_INTELLIGENCE_AUTHENTICATED_READ_ROUTE_ID)?.status,
    'frontend_safe_ready',
  )
  assert.equal(
    getApiRouteById(ORCHESTRA_VISUAL_INTELLIGENCE_JOB_ROUTE_ID)
      ?.securityLevel,
    'backend_service_role',
  )

  console.log(JSON.stringify({
    smoke: 'visual-intelligence-route-contract',
    directExecutionRouteRetired: true,
    directPlanningOperationRouteRetired: true,
    orchestraOnlyRouteReachedWithoutProviderCall: true,
    closedConsumerBindingRequestFieldRequired: true,
    invalidOrchestraServiceTokenRejected: true,
    wrongOrchestraIdempotencyRejected: true,
    editReferenceBindingPreparationRequiresStrictInternalAuth: true,
    editReferenceBindingPreparationRouteReachedWithoutProviderCall: true,
    directInspectionRouteRetired: true,
    authenticatedNotFoundReadAccepted: true,
    browserLocalCompletionAccepted: false,
  }))
} finally {
  server.close()
  await once(server, 'close')
}

function buildRequest(input: {
  requestId: string
  idempotencyKey: string
  operation: 'analyze_media' | 'query_range'
  profile: 'source_edit_planning' | 'identify_primary_subject'
  callerQuestion: string | null
}): VisualIntelligenceRequest {
  const probeRef = ref(`probe-${input.requestId}`)
  return createVisualIntelligenceRequest({
    requestId: input.requestId,
    idempotencyKey: input.idempotencyKey,
    scope,
    operation: input.operation,
    profile: input.profile,
    sourceArtifacts: [{
      artifactId: 'source-video-1',
      mediaKind: 'video',
      contentType: 'video/mp4',
      checksumSha256: '1'.repeat(64),
      byteLength: 1_000_000,
      width: 1920,
      height: 1080,
      durationFrames: 240,
      frameRate,
      finalizedMediaAuthorityRef: ref('finalized-source'),
      immutableStorageObjectAuthorityRef: ref('storage-source'),
      mediaProbeEvidenceRef: probeRef,
      privateArtifact: true,
      exactGenerationRereadRequiredAtDispatch: true,
    }],
    comparisonArtifacts: [],
    requestedRanges: [fullRange],
    requiredEvidenceRefs: [probeRef],
    expectedOutcomeRefs: [],
    outputFrame: null,
    protectedZones: [],
    qualityPolicy: createProfessionalHighVisualIntelligenceQualityPolicy(),
    admission: {
      mode: 'planning_evidence',
      authenticatedPrincipalRef: ref('principal'),
      workspaceAuthorizationRef: ref('workspace-auth'),
      finalizedSourceAuthorityRefs: [ref('finalized-source')],
      sourceChecksumSetRef: ref('source-checksums'),
      analysisAllowanceRef: ref('analysis-allowance'),
      costPreflight: {
        pricingSnapshotRef: ref('pricing-snapshot'),
        accountEffectiveRateAuthorityRef: ref('account-rate'),
        currency: 'USD',
        maximumAuthorizedCostMicros: 100_000,
        estimatedMinimumCostMicros: 1_000,
        estimatedMaximumCostMicros: 20_000,
        serviceFeeIncluded: false,
        publicListPriceUsedAsSettlementAuthority: false,
        preflightPassed: true,
      },
      retentionPolicyRef: ref('retention-policy'),
      privacyPolicyRef: ref('privacy-policy'),
      providerReleaseRef: ref('provider-release'),
      globalKillSwitchOpen: false,
      providerKillSwitchOpen: false,
      reportPersistenceAllowed: true,
      timelineMutationAllowed: false,
      editingWorkerExecutionAllowed: false,
      generationAllowed: false,
      renderAllowed: false,
      exportAllowed: false,
      deliveryAllowed: false,
    },
    callerQuestion: input.callerQuestion,
    byteFreeRequest: true,
    callerPromptAccepted: false,
    providerCredentialIncluded: false,
    publicMediaUrlIncluded: false,
    signedUrlIsSourceTruth: false,
    shellCommandIncluded: false,
    providerToolDefinitionIncluded: false,
  })
}

async function post(
  path: string,
  body: unknown,
  headers: Record<string, string> = {},
): Promise<Response> {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

function stopped(requiredGate: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'Controlled route smoke stops before a provider call.',
    503,
    { requiredGate },
  )
}
