import assert from 'node:assert/strict'

import { INTERNAL_BETA_API_ROUTES } from '../../src/backend/api/routes/internal-beta-api-routes'
import {
  assertInternalBetaApiRouteRuntimeFacadeFailClosed,
  createInternalBetaApiRouteRuntimeFacadeReport,
  createInternalBetaApiRouteRuntimeFacadeResponse,
} from '../services/internal-beta-api-route-runtime-facade'

const report = createInternalBetaApiRouteRuntimeFacadeReport({
  workspaceId: 'workspace_api_facade_smoke',
  projectId: 'project_api_facade_smoke',
  userId: 'user_api_facade_smoke',
  requestId: 'request_api_facade_smoke',
  approvedPlanSnapshotId: 'approved_snapshot_api_facade_smoke',
  creditReservationId: 'credit_reservation_api_facade_smoke',
  jobId: 'job_api_facade_smoke',
  artifactManifestId: 'artifact_manifest_api_facade_smoke',
  qaReportId: 'qa_report_api_facade_smoke',
  idempotencyKey: 'idempotency_api_facade_smoke',
  params: { jobId: 'job_api_facade_smoke' },
  query: {
    view: 'summary',
    token: 'must_not_appear',
  },
  payload: {
    safe: true,
    serviceRoleKey: 'must_not_appear',
    signedUrl: 'must_not_appear',
  },
})

assert.equal(report.ok, false)
assert.equal(report.status, 'blocked_pending_supabase_target_validation_and_runtime_enablement')
assert.equal(report.routeCount, 8)
assert.equal(report.backendRequiredRouteCount, 7)
assert.equal(report.disabledRouteCount, 1)
assert.equal(report.facadeResponses.length, 8)
assert.equal(report.internalBetaEndToEndReady, false)
assert.equal(report.productReadyEndToEndLocalOssTools, 0)
assert.equal(report.nextMilestone, 'RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R-CONFIRMED-RUN')
assert.deepEqual(
  report.facadeResponses.map((response) => response.routeId),
  INTERNAL_BETA_API_ROUTES.map((route) => route.id),
)
assert(!JSON.stringify(report).includes('must_not_appear'), 'secret-like input must be sanitized from facade report')
assertInternalBetaApiRouteRuntimeFacadeFailClosed(report)

for (const response of report.facadeResponses) {
  assert.equal(response.ok, false)
  assert.equal(response.httpStatusCode, 202)
  assert.equal(response.routeHandlerRegistered, false)
  assert.equal(response.mockHandlerRegistered, false)
  assert.equal(response.routeExecution, false)
  assert.equal(response.serviceRoleRouteExecution, false)
  assert.equal(response.remoteSupabaseMutation, false)
  assert.equal(response.sqlExecution, false)
  assert.equal(response.storageWrite, false)
  assert.equal(response.storageRead, false)
  assert.equal(response.signedUrlCreation, false)
  assert.equal(response.publicArtifactCreation, false)
  assert.equal(response.creditMutation, false)
  assert.equal(response.workerDispatch, false)
  assert.equal(response.workerExecution, false)
  assert.equal(response.providerModelCall, false)
  assert.equal(response.modelCall, false)
  assert.equal(response.rawPromptExecution, false)
  assert.equal(response.renderExportExecution, false)
  assert.equal(response.mediaProcessing, false)
  assert.equal(response.internalBetaUnlock, false)
  assert.equal(response.externalBetaUnlock, false)
  assert.equal(response.productionUnlock, false)
  assert.equal(response.scaffoldResult.status, 'disabled_pending_runtime_gate')
  assert(response.requiredBeforeEnablement.includes('confirmed_supabase_target_rls_storage_validation'))
  assert(response.requiredBeforeEnablement.includes('service_role_route_handler_implementation'))
}

const privateAccessResponse = createInternalBetaApiRouteRuntimeFacadeResponse(
  'internalBeta.privateArtifactAccess.create',
)
assert.equal(privateAccessResponse.contractStatus, 'disabled')
assert.equal(privateAccessResponse.serviceRoleRequired, true)
assert.equal(privateAccessResponse.signedUrlCreation, false)
assert.equal(privateAccessResponse.publicArtifactCreation, false)

console.log('internal-beta-api-route-runtime-facade-smoke passed')
