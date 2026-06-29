import assert from 'node:assert/strict'
import {
  createGpacMp4boxGuardedServiceRoleRouteMockResponse,
  buildGpacMp4boxGuardedServiceRoleRouteMockRequest,
  GPAC_MP4BOX_GUARDED_SERVICE_ROLE_ROUTE_ID,
  validateGpacMp4boxGuardedServiceRoleRouteMockRequest,
} from '../../src/backend/contracts/gpac-mp4box-guarded-service-role-route-mock-contracts'
import {
  buildGpacMp4boxMockWorkerRouteIdempotencyKey,
  type GpacMp4boxCommandTemplateId,
  type GpacMp4boxMockWorkerJobEnvelope,
} from '../../src/backend/contracts/gpac-mp4box-mock-worker-interface-contracts'
import { getApiRouteById, handleMockApiRequest, createMockApiRuntimeContext } from '../../src/backend/api'

const now = new Date('2026-06-29T00:00:00.000Z').toISOString()
const commandTemplateId: GpacMp4boxCommandTemplateId = 'mp4box_package_validation_metadata_v1'
const routeIdempotencyBasis = {
  workspaceId: 'workspace-gpac-route-smoke',
  projectId: 'project-gpac-route-smoke',
  approvedSnapshotId: 'approved-snapshot-gpac-route-smoke',
  jobId: 'job-gpac-route-smoke',
  commandTemplateId,
}

const workerEnvelope: GpacMp4boxMockWorkerJobEnvelope = {
  lane: 'TRACKA-GPAC-MP4BOX-MOCK-WORKER-INTERFACE-1',
  approvedSnapshotRef: { id: routeIdempotencyBasis.approvedSnapshotId, status: 'approved' },
  approvalRecordRef: { id: 'approval-record-gpac-route-smoke', status: 'approved' },
  jobRef: { id: routeIdempotencyBasis.jobId, status: 'planned' },
  workerLeaseRef: { id: 'lease-gpac-route-smoke', status: 'active', leaseStatus: 'active' },
  routeIdempotencyKey: buildGpacMp4boxMockWorkerRouteIdempotencyKey(routeIdempotencyBasis),
  sourceSequenceMapRef: { id: 'source-sequence-map-gpac-route-smoke', status: 'approved' },
  compiledIntentRef: { id: 'compiled-intent-gpac-route-smoke', status: 'approved' },
  modelRoutingPolicyRef: { id: 'model-routing-policy-gpac-route-smoke', status: 'approved' },
  qaPolicyRef: {
    id: 'qa-policy-gpac-route-smoke',
    requiredChecks: ['manifest_integrity', 'checksum_match', 'mp4box_stdout_bounded', 'cleanup_verified'],
    blocksPreview: true,
    blocksFinalExport: true,
  },
  privateInputManifestRef: {
    id: 'private-input-manifest-gpac-route-smoke',
    sourceClass: 'generated_fixture',
    storageObjectPath: 'workspaces/workspace-gpac-route-smoke/projects/project-gpac-route-smoke/private/generated-subtitle.srt',
    checksumSha256: 'afc4c7fc017f5d41d817284aa633355d587958416df02a71c0fdd66df7829bb8',
    byteCount: 73,
    sourceOfTruth: true,
    privateArtifact: true,
  },
  privateArtifactManifestRef: {
    id: 'private-artifact-manifest-gpac-route-smoke',
    storageObjectPrefix: 'workspaces/workspace-gpac-route-smoke/projects/project-gpac-route-smoke/private/gpac-mp4box/',
    expectedOutputFileNames: ['validation-report.json', 'artifact-manifest.json'],
    expectedChecksumAlgorithm: 'sha256',
    publicArtifactsAllowed: false,
    signedUrlsAllowed: false,
  },
  privateArtifactChecksumRef: { id: 'checksum-gpac-route-smoke', status: 'planned' },
  toolRuntimePolicyRef: { id: 'tool-runtime-policy-gpac-route-smoke', status: 'approved' },
  gpacMp4boxWorkerContractRef: { id: 'worker-contract-gpac-route-smoke', status: 'approved' },
  gpacMp4boxRouteContractRef: { id: 'route-contract-gpac-route-smoke', status: 'approved' },
  cleanupPolicyRef: {
    id: 'cleanup-policy-gpac-route-smoke',
    status: 'approved',
    cleanupStatus: 'cleanup_required',
    tempArtifactScope: 'worker_temp_only',
  },
  auditRecordRef: { id: 'audit-record-gpac-route-smoke', status: 'planned' },
  commandTemplateId,
  createdAt: now,
  executionMode: 'mock_contract_only',
  runtimeExecution: false,
  workerExecution: false,
  routeExecution: false,
}

const request = buildGpacMp4boxGuardedServiceRoleRouteMockRequest({
  workerEnvelope,
  creditReservationRef: { id: 'credit-reservation-gpac-route-smoke', status: 'approved' },
  routeIdempotencyBasis,
  createdAt: now,
})

const validation = validateGpacMp4boxGuardedServiceRoleRouteMockRequest(request)
assert.equal(validation.ok, true, validation.sanitizedSummary)
assert.equal(validation.routeStatus, 'registered_disabled_backend_required')
assert.equal(validation.nextRequiredGate, 'TRACKA-GPAC-MP4BOX-GUARDED-WORKER-ENQUEUE-MOCK-IMPLEMENTATION-1')

const response = createGpacMp4boxGuardedServiceRoleRouteMockResponse(request)
assert.equal(response.routeExecution, false)
assert.equal(response.workerExecution, false)
assert.equal(response.gpacMp4boxExecution, false)
assert.equal(response.storageTransfer, false)
assert.equal(response.publicArtifactCreation, false)
assert.equal(response.signedUrlCreation, false)
assert.deepEqual(response.sanitizedBlockers, [])

const registeredRoute = getApiRouteById(GPAC_MP4BOX_GUARDED_SERVICE_ROLE_ROUTE_ID)
assert.ok(registeredRoute, 'GPAC/MP4Box route metadata must be registered')
assert.equal(registeredRoute.status, 'disabled')
assert.equal(registeredRoute.runtimeMode, 'backend_required')
assert.equal(registeredRoute.requiresServiceRole, true)

const mockRouterResponse = await handleMockApiRequest({
  routeId: GPAC_MP4BOX_GUARDED_SERVICE_ROLE_ROUTE_ID,
  context: createMockApiRuntimeContext({
    mode: 'mock',
    workspaceId: routeIdempotencyBasis.workspaceId,
    projectId: routeIdempotencyBasis.projectId,
  }),
  body: request,
})

assert.equal(mockRouterResponse.ok, false)
assert.equal(mockRouterResponse.statusCode, 424)
assert.equal(mockRouterResponse.error?.code, 'backend_runtime_required')
assert.equal(mockRouterResponse.mockOnly, true)
assert.ok(
  mockRouterResponse.warnings.some((warning) => warning.includes('intentionally blocked')),
  'mock router should preserve backend-required block warning',
)

const executionAttempt = validateGpacMp4boxGuardedServiceRoleRouteMockRequest({
  ...request,
  routeEnabled: true,
  routeExecution: true,
} as unknown as typeof request)
assert.equal(executionAttempt.ok, false)
assert.ok(executionAttempt.blockers.includes('blocked_runtime_execution_not_enabled'))

const missingCredit = validateGpacMp4boxGuardedServiceRoleRouteMockRequest({
  ...request,
  creditReservationRef: { id: '', status: 'planned' },
})
assert.equal(missingCredit.ok, false)
assert.ok(missingCredit.blockers.includes('blocked_missing_credit_reservation'))

console.log(JSON.stringify({
  ok: true,
  routeId: GPAC_MP4BOX_GUARDED_SERVICE_ROLE_ROUTE_ID,
  checks: [
    'guarded_route_mock_request_validates',
    'sanitized_response_contains_refs_only',
    'api_route_registered_disabled_backend_required',
    'mock_router_blocks_execution',
    'execution_attempt_blocks',
    'missing_credit_reservation_blocks',
  ],
  nextRequiredGate: validation.nextRequiredGate,
}, null, 2))
