import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createServer } from 'node:http'

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
  createProfessionalHighVisualIntelligenceQualityPolicy,
  createVisualInspectionRequirement,
  createVisualIntelligenceEvidenceRef,
  createVisualIntelligencePlanningOperationInput,
  createVisualIntelligenceRequest,
} from '../visual-intelligence/visual-intelligence-contract'
import {
  createVisualIntelligenceAuthenticatedReadRequest,
} from '../visual-intelligence/visual-intelligence-authenticated-read-service'

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

const lifecycleCalls: string[] = []
const planningCalls: unknown[] = []
const inspectionCalls: unknown[] = []
const app = createReeditProApiApp(loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'mock',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  STORAGE_MODE: 'local',
  REEDITPRO_INTERNAL_SERVICE_TOKEN: token,
}), {
  visualIntelligenceLifecyclePort: Object.freeze({
    async execute(request: VisualIntelligenceRequest) {
      lifecycleCalls.push(request.requestId)
      throw stopped('controlled_no_visual_provider_call')
    },
  }),
  visualIntelligencePlanningOperationRequestOwnerPort: Object.freeze({
    async preparePlanningOperationRequest(input: unknown) {
      planningCalls.push(input)
      return queryRequest
    },
  }),
  visualIntelligenceInspectionCoordinatorPort: Object.freeze({
    async inspect(requirement: unknown, expectedScope: unknown) {
      inspectionCalls.push({ requirement, expectedScope })
      throw stopped('controlled_no_visual_inspection_provider_call')
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
  assert.equal(execution.status, 503)
  assert.deepEqual(lifecycleCalls, [sourceRequest.requestId])

  const planning = await post(
    `/v1/workspaces/${scope.workspaceId}/visual-intelligence/planning-operations`,
    planningInput,
    {
      'idempotency-key': planningInput.idempotencyKey,
      'x-request-id': planningInput.requestId,
      'x-reeditpro-internal-token': token,
    },
  )
  assert.equal(planning.status, 503)
  assert.equal(planningCalls.length, 1)
  assert.deepEqual(lifecycleCalls, [
    sourceRequest.requestId,
    queryRequest.requestId,
  ])

  const crossWorkspacePlanning = await post(
    '/v1/workspaces/foreign-workspace/visual-intelligence/planning-operations',
    planningInput,
    {
      'idempotency-key': planningInput.idempotencyKey,
      'x-request-id': planningInput.requestId,
      'x-reeditpro-internal-token': token,
    },
  )
  assert.equal(crossWorkspacePlanning.status, 403)
  assert.equal(planningCalls.length, 1)

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
  assert.equal(inspection.status, 503)
  assert.equal(inspectionCalls.length, 1)

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
    'backend_required',
  )
  assert.equal(
    getApiRouteById(VISUAL_INTELLIGENCE_PLANNING_OPERATION_ROUTE_ID)?.status,
    'backend_required',
  )
  assert.equal(
    getApiRouteById(VISUAL_INTELLIGENCE_INSPECTION_ROUTE_ID)?.status,
    'backend_required',
  )
  assert.equal(
    getApiRouteById(VISUAL_INTELLIGENCE_AUTHENTICATED_READ_ROUTE_ID)?.status,
    'frontend_safe_ready',
  )

  console.log(JSON.stringify({
    smoke: 'visual-intelligence-route-contract',
    executionRouteReachedWithoutProviderCall: true,
    planningOwnerRereadBoundaryReachedWithoutProviderCall: true,
    crossWorkspacePlanningRejectedBeforeOwnerCall: true,
    inspectionOwnerBoundaryReachedWithoutProviderCall: true,
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
