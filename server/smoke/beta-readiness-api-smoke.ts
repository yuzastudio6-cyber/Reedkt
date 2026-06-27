import assert from 'node:assert/strict'
import { type AddressInfo } from 'node:net'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import { PRODUCTION_TOOL_IDS } from '../tool-registry'
import { betaReadinessEvidenceEvaluationSchema } from '../validation/beta-readiness-schemas'
import type {
  BetaReadinessChecklistEvidence,
  ToolBetaAcceptedExecutionEvidence,
  ToolBetaPlatformReadinessEvidence,
} from '../beta-readiness'

const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  API_PORT: '8787',
  SUPABASE_URL: '',
  SUPABASE_SERVICE_ROLE_KEY: '',
})

const app = createReeditProApiApp(env)
const server = app.listen(0)
const smokeWorkspaceId = 'beta-readiness-api-smoke-workspace'
const coreWorkspaceId = 'beta-readiness-api-smoke-core-workspace'
const deployedEvidenceWorkspaceId = 'beta-readiness-api-smoke-deployed-platform-workspace'

try {
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`

  const defaultResponse = await requestJson(`${baseUrl}/v1/beta-readiness`, { method: 'GET' })
  assert.equal(defaultResponse.ok, true, 'default readiness route should return ok')
  assert.equal(defaultResponse.data.report.goNoGo.externalBetaAllowed, false, 'default route must keep external beta blocked')
  assert.equal(defaultResponse.data.report.toolExecutionReadiness.productReadyLocalOssCount, 0, 'default route must not claim product-ready tools')

  const platformPreflightResponse = await requestJson(`${baseUrl}/v1/beta-readiness/platform-preflight`, { method: 'GET' })
  assert.equal(platformPreflightResponse.ok, true, 'platform preflight route should return ok')
  assert.equal(platformPreflightResponse.data.report.environment, 'local_preflight', 'platform preflight must identify local preflight mode')
  assert.equal(platformPreflightResponse.data.report.wouldClearPlatformBlocker, false, 'local platform preflight must not clear the shared platform blocker')
  assert.ok(
    platformPreflightResponse.data.report.checks.some((check: { id: string; status: string }) =>
      check.id === 'tool_cost_events_migration_source_present' && check.status === 'passed'),
    'platform preflight should prove the tool_cost_events migration source exists',
  )
  assert.ok(
    platformPreflightResponse.data.report.missingEvidence.some((item: string) => item.includes('Wallet settlement')),
    'platform preflight should name wallet settlement as remaining evidence',
  )

  const defaultOperatorStatusResponse = await requestJson(`${baseUrl}/v1/beta-readiness/operator-status`, { method: 'GET' })
  assert.equal(defaultOperatorStatusResponse.ok, true, 'operator status route should return ok')
  assert.equal(defaultOperatorStatusResponse.data.status.evidenceSource, 'default_source_truth', 'operator status without workspace should use default source truth')
  assert.equal(defaultOperatorStatusResponse.data.status.readyForExternalBeta, false, 'default operator status must keep external beta blocked')
  assert.equal(defaultOperatorStatusResponse.data.status.currentGate.safeBlockerReductionAllowed, true, 'operator status should preserve scoped blocker-reduction policy')
  assert.ok(
    defaultOperatorStatusResponse.data.status.currentGate.blockedActionScope.includes('external_beta_launch'),
    'default operator status should name external beta launch as blocked',
  )
  assert.ok(
    defaultOperatorStatusResponse.data.status.nextActions.some((action: string) => action.includes('workspaceId')),
    'default operator status should tell callers to supply workspaceId for stored evidence',
  )

  const deployedVerifierReportResponse = await requestJson(`${baseUrl}/v1/beta-readiness/platform-deployed-evidence/verify`, {
    method: 'POST',
    headers: { 'idempotency-key': 'beta-readiness-api-smoke-platform-deployed-verify' },
    body: JSON.stringify(buildPassingPlatformDeployedEvidenceBody(deployedEvidenceWorkspaceId)),
  })
  assert.equal(deployedVerifierReportResponse.ok, true, 'deployed platform verifier route should return ok')
  assert.equal(deployedVerifierReportResponse.data.report.evidencePacketReady, true, 'passing deployed platform verifier route should build evidence packet')
  assert.equal(deployedVerifierReportResponse.data.report.evaluatedReadiness.toolExecutionReadiness.platformBlockers.length, 0, 'deployed platform verifier route should clear shared platform blocker in evaluated report')
  assert.equal(deployedVerifierReportResponse.data.report.evaluatedReadiness.toolExecutionReadiness.externalBetaToolExecutionAllowed, false, 'platform evidence alone must not allow tool execution beta')
  assert.equal(deployedVerifierReportResponse.data.report.externalBetaAllowed, false, 'verifier route must not claim external beta allowed')

  const failedDeployedVerifierResponse = await requestJson(`${baseUrl}/v1/beta-readiness/platform-deployed-evidence/verify`, {
    method: 'POST',
    headers: { 'idempotency-key': 'beta-readiness-api-smoke-platform-deployed-failed' },
    body: JSON.stringify({
      ...buildPassingPlatformDeployedEvidenceBody('beta-readiness-api-smoke-failed-deployed-platform-workspace'),
      probes: buildPassingDeployedProbeObservations().map((probe) =>
        probe.id === 'service_role_write_path_verified'
          ? {
            ...probe,
            status: 'failed',
            evidence: ['Service-role deployed write path was not verified.'],
            nextAction: 'Verify service-role deployed writes before recording platform evidence.',
          }
          : probe,
      ),
    }),
  })
  assert.equal(failedDeployedVerifierResponse.data.report.evidencePacketReady, false, 'failed deployed platform verifier route should not build evidence packet')
  assert.ok(
    failedDeployedVerifierResponse.data.report.missingEvidence.some((item: string) => item.includes('service role write path verified')),
    'failed deployed verifier route should name the failed service-role probe',
  )

  const supabaseProbeNoAdminResponse = await requestJson(`${baseUrl}/v1/beta-readiness/platform-deployed-evidence/probe`, {
    method: 'POST',
    headers: { 'idempotency-key': 'beta-readiness-api-smoke-platform-supabase-probe-no-admin' },
    body: JSON.stringify({
      workspaceId: 'beta-readiness-api-smoke-supabase-probe-no-admin-workspace',
      projectId: 'beta-readiness-api-smoke-supabase-probe-no-admin-project',
      sourceId: 'beta-readiness-api-smoke:platform-supabase-deployed-probe',
      sourceSha: '9999999999999999999999999999999999999999',
      environment: 'staging',
      ownerApprovals: {
        billingOwnerStripeBoundaryApproved: true,
        deploymentApproved: true,
        securityApproved: true,
        storageApproved: true,
        legalApproved: true,
        monitoringApproved: true,
        supportApproved: true,
      },
      notes: ['Smoke verifies Supabase deployed probe route fails closed without service-role runtime.'],
      allowPersistentProbeWrites: false,
    }),
  })
  assert.equal(supabaseProbeNoAdminResponse.ok, true, 'Supabase deployed probe route should return a report in mock/no-admin mode')
  assert.equal(supabaseProbeNoAdminResponse.data.report.evidencePacketReady, false, 'Supabase deployed probe route must not build evidence without deployed probes')
  assert.ok(
    supabaseProbeNoAdminResponse.data.report.checks.some((check: { evidence: string[] }) =>
      check.evidence.some((item) => item.includes('Supabase service-role admin client is unavailable'))),
    'Supabase deployed probe route should name missing service-role runtime',
  )
  assert.equal(
    supabaseProbeNoAdminResponse.data.report.evaluatedReadiness.toolExecutionReadiness.externalBetaToolExecutionAllowed,
    false,
    'Supabase deployed probe route must not enable external beta in mock/no-admin mode',
  )

  const blockedRecordResponse = await requestJson(`${baseUrl}/v1/beta-readiness/platform-deployed-evidence/verify`, {
    method: 'POST',
    headers: { 'idempotency-key': 'beta-readiness-api-smoke-platform-deployed-record-blocked' },
    body: JSON.stringify({
      ...buildPassingPlatformDeployedEvidenceBody('beta-readiness-api-smoke-record-blocked-platform-workspace'),
      recordEvidence: true,
      confirmRecordEvidence: false,
    }),
  }, 400)
  assert.equal(blockedRecordResponse.error.code, 'VALIDATION_FAILED', 'recording deployed platform evidence should require explicit confirmation')

  const storedDeployedEvidenceResponse = await requestJson(`${baseUrl}/v1/beta-readiness/platform-deployed-evidence/verify`, {
    method: 'POST',
    headers: { 'idempotency-key': 'beta-readiness-api-smoke-platform-deployed-record' },
    body: JSON.stringify({
      ...buildPassingPlatformDeployedEvidenceBody(deployedEvidenceWorkspaceId),
      recordEvidence: true,
      confirmRecordEvidence: true,
    }),
  }, 201)
  assert.equal(storedDeployedEvidenceResponse.data.replayed, false, 'first deployed platform evidence record should not replay')
  assert.equal(storedDeployedEvidenceResponse.data.packet.evidence.platformEvidence.environment, 'staging', 'stored deployed platform evidence should keep staging environment')
  assert.equal(storedDeployedEvidenceResponse.data.storedReadinessReport.toolExecutionReadiness.platformBlockers.length, 0, 'stored platform evidence should clear platform blocker in stored report')
  assert.equal(storedDeployedEvidenceResponse.data.storedReadinessReport.toolExecutionReadiness.externalBetaToolExecutionAllowed, false, 'stored platform evidence alone must not allow tool beta execution')

  const replayedDeployedEvidenceResponse = await requestJson(`${baseUrl}/v1/beta-readiness/platform-deployed-evidence/verify`, {
    method: 'POST',
    headers: { 'idempotency-key': 'beta-readiness-api-smoke-platform-deployed-record' },
    body: JSON.stringify({
      ...buildPassingPlatformDeployedEvidenceBody(deployedEvidenceWorkspaceId),
      recordEvidence: true,
      confirmRecordEvidence: true,
    }),
  })
  assert.equal(replayedDeployedEvidenceResponse.data.replayed, true, 'deployed platform evidence record should replay by idempotency key')
  assert.equal(replayedDeployedEvidenceResponse.data.packet.id, storedDeployedEvidenceResponse.data.packet.id, 'deployed platform evidence replay should return same packet')

  const platformBillingQaResponse = await requestJson(`${baseUrl}/v1/beta-readiness/platform-billing-qa`, {
    method: 'POST',
    headers: { 'idempotency-key': 'beta-readiness-api-smoke-platform-billing-qa' },
    body: JSON.stringify({
      workspaceId: smokeWorkspaceId,
      projectId: 'beta-readiness-api-smoke-platform-project',
      sourceId: 'beta-readiness-api-smoke:platform-billing-qa',
      sourceSha: '6666666666666666666666666666666666666666',
      environment: 'local_mock',
      notes: ['Smoke runs platform billing QA in mock-safe mode only.'],
    }),
  })
  assert.equal(platformBillingQaResponse.ok, true, 'platform billing QA route should return ok')
  assert.equal(platformBillingQaResponse.data.report.persistenceMode, 'mock_memory', 'platform billing QA smoke must use mock memory persistence')
  assert.equal(platformBillingQaResponse.data.report.wouldClearPlatformBlocker, false, 'platform billing QA must not clear platform blockers by itself')
  assert.ok(
    platformBillingQaResponse.data.report.checks.some((check: { id: string; status: string }) =>
      check.id === 'idempotent_replay' && check.status === 'passed'),
    'platform billing QA should prove idempotent replay',
  )
  assert.ok(
    platformBillingQaResponse.data.report.checks.some((check: { id: string; status: string }) =>
      check.id === 'stripe_boundary' && check.status === 'passed'),
    'platform billing QA should prove Stripe isolation',
  )
  assert.ok(
    platformBillingQaResponse.data.report.missingPlatformEvidence.some((item: string) => item.includes('wallet settlement')),
    'platform billing QA should still name wallet settlement as missing production evidence',
  )

  const settlementResponse = await requestJson(`${baseUrl}/v1/tool-costs/events/${encodeURIComponent(platformBillingQaResponse.data.report.toolEventId)}/settle`, {
    method: 'POST',
    headers: { 'idempotency-key': 'beta-readiness-api-smoke-tool-cost-wallet-settlement' },
    body: JSON.stringify({
      workspaceId: smokeWorkspaceId,
      projectId: 'beta-readiness-api-smoke-platform-project',
      creditEstimateId: 'platform-billing-qa-credit-estimate',
      creditReservationId: 'platform-billing-qa-credit-reservation',
      toolCostCredits: platformBillingQaResponse.data.report.toolEventCredits,
      billableToUser: true,
      failureCategory: 'none',
      settlementType: 'spend',
      metadata: { smoke: 'beta-readiness-api-tool-cost-wallet-settlement' },
    }),
  }, 201)
  assert.equal(settlementResponse.ok, true, 'tool-cost wallet settlement route should return ok')
  assert.equal(settlementResponse.data.settlement.creditsDelta, -platformBillingQaResponse.data.report.toolEventCredits, 'wallet settlement route should debit tool event credits in mock mode')
  assert.equal(settlementResponse.data.settlement.stripeCallAttempted, false, 'wallet settlement route must not call Stripe')

  const evidencePacketBody = buildCompleteEvidencePacketBody()
  const { workspaceId: _workspaceId, ...evaluationBody } = evidencePacketBody
  const schemaResult = betaReadinessEvidenceEvaluationSchema.safeParse(evaluationBody)
  assert.equal(schemaResult.success, true, 'complete evidence body should pass schema validation')

  const evaluatedResponse = await requestJson(`${baseUrl}/v1/beta-readiness/evaluate`, {
    method: 'POST',
    body: JSON.stringify(evaluationBody),
  })
  assert.equal(evaluatedResponse.ok, true, 'evaluation route should return ok')
  assert.equal(evaluatedResponse.data.report.goNoGo.externalBetaAllowed, true, 'complete evidence should open external beta gate')
  assert.equal(evaluatedResponse.data.report.goNoGo.realUserMediaBetaAllowed, false, 'real user media beta must still need explicit approval')
  assert.equal(evaluatedResponse.data.report.toolExecutionReadiness.externalBetaToolExecutionAllowed, true, 'complete tool evidence should open tool beta execution')
  assert.equal(evaluatedResponse.data.report.toolExecutionReadiness.productReadyLocalOssCount, PRODUCTION_TOOL_IDS.length, 'complete evidence should count all product-ready local OSS tools')

  const storedResponse = await requestJson(`${baseUrl}/v1/beta-readiness/evidence`, {
    method: 'POST',
    headers: { 'idempotency-key': 'beta-readiness-api-smoke-complete-evidence' },
    body: JSON.stringify(evidencePacketBody),
  }, 201)
  assert.equal(storedResponse.ok, true, 'stored evidence route should return ok')
  assert.equal(storedResponse.data.replayed, false, 'first evidence submission should not replay')
  assert.equal(storedResponse.data.report.goNoGo.externalBetaAllowed, true, 'stored complete evidence should open external beta gate')

  const replayedResponse = await requestJson(`${baseUrl}/v1/beta-readiness/evidence`, {
    method: 'POST',
    headers: { 'idempotency-key': 'beta-readiness-api-smoke-complete-evidence' },
    body: JSON.stringify(evidencePacketBody),
  })
  assert.equal(replayedResponse.data.replayed, true, 'duplicate idempotency key should replay the original evidence packet')
  assert.equal(replayedResponse.data.packet.id, storedResponse.data.packet.id, 'idempotent replay should return the same evidence packet')

  const evidenceListResponse = await requestJson(`${baseUrl}/v1/beta-readiness/evidence?workspaceId=${encodeURIComponent(smokeWorkspaceId)}`, { method: 'GET' })
  assert.equal(evidenceListResponse.data.packets.length, 1, 'stored evidence should be listed once')
  assert.equal(evidenceListResponse.data.report.goNoGo.externalBetaAllowed, true, 'stored evidence should drive evidence listing report')

  const storedOperatorStatusResponse = await requestJson(`${baseUrl}/v1/beta-readiness/operator-status?workspaceId=${encodeURIComponent(smokeWorkspaceId)}`, { method: 'GET' })
  assert.equal(storedOperatorStatusResponse.data.status.evidenceSource, 'stored_workspace_evidence', 'workspace operator status should use stored evidence')
  assert.equal(storedOperatorStatusResponse.data.status.evidencePacketCount, 1, 'workspace operator status should report stored evidence count')
  assert.equal(storedOperatorStatusResponse.data.status.readyForExternalBeta, true, 'complete stored evidence should open the external beta status gate')
  assert.equal(storedOperatorStatusResponse.data.status.readyForRealUserMediaBeta, false, 'operator status must keep real user media beta separately blocked')
  assert.equal(storedOperatorStatusResponse.data.status.readyForPaidProduction, false, 'operator status must keep paid production separately blocked')
  assert.equal(
    storedOperatorStatusResponse.data.status.currentGate.blockedActionScope.includes('external_beta_tool_execution'),
    false,
    'complete stored evidence should clear the tool-execution blocked action scope',
  )
  assert.ok(
    storedOperatorStatusResponse.data.status.currentGate.blockedActionScope.includes('paid_production_launch'),
    'complete stored evidence without paid-production approval should still block paid production launch',
  )

  const coreEvidenceResponse = await requestJson(`${baseUrl}/v1/beta-readiness/evidence/core-real-check`, {
    method: 'POST',
    headers: { 'idempotency-key': 'beta-readiness-api-smoke-core-real-check' },
    body: JSON.stringify({
      workspaceId: coreWorkspaceId,
      sourceId: 'beta-readiness-api-smoke:core-real-check',
      sourceSha: '5555555555555555555555555555555555555555',
      acceptProductionReadiness: true,
      acceptProductReadyLocalOss: true,
      notes: ['Smoke accepts only tools that pass bounded core real-check evidence.'],
    }),
  }, 201)
  const acceptedCoreToolIds = coreEvidenceResponse.data.acceptedToolEvidence.map((record: { toolId: string }) => record.toolId)
  assert.ok(acceptedCoreToolIds.includes('ffmpeg'), 'core real-check evidence should accept ffmpeg when its version check passes')
  assert.ok(acceptedCoreToolIds.includes('ffprobe'), 'core real-check evidence should accept ffprobe when its version check passes')
  assert.ok(acceptedCoreToolIds.includes('sharp'), 'core real-check evidence should accept sharp metadata after dependency install')
  assert.ok(acceptedCoreToolIds.includes('remotion'), 'core real-check evidence should accept remotion metadata after dependency install')
  assert.ok(coreEvidenceResponse.data.skippedToolResults.every((record: { status: string }) => record.status !== 'passed'), 'core real-check evidence must not skip tools that passed')
  assert.equal(coreEvidenceResponse.data.report.toolExecutionReadiness.productReadyLocalOssCount, acceptedCoreToolIds.length, 'core real-check evidence should only count accepted passed tools')

  const invalidEvidenceResponse = await requestJson(`${baseUrl}/v1/beta-readiness/evaluate`, {
    method: 'POST',
    body: JSON.stringify({
      acceptedToolEvidence: [{ ...evaluationBody.acceptedToolEvidence[0], toolId: 'unknown-tool' }],
    }),
  }, 400)
  assert.equal(invalidEvidenceResponse.error.code, 'VALIDATION_FAILED', 'unknown tool evidence should fail validation')

  const secretResponse = await requestJson(`${baseUrl}/v1/beta-readiness/evaluate`, {
    method: 'POST',
    body: JSON.stringify({
      checklistEvidence: [{
        itemId: 'model_weights_not_approved',
        sourceId: 'beta-readiness-api-smoke:secret',
        status: 'passed',
        notes: ['sk-secret-value'],
      }],
    }),
  }, 400)
  assert.equal(secretResponse.error.code, 'VALIDATION_FAILED', 'secret-like evidence should fail validation')

  console.log('beta-readiness-api-smoke passed')
} finally {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error)
      else resolve()
    })
  })
}

function buildCompleteEvidencePacketBody(): {
  workspaceId: string
  checklistEvidence: BetaReadinessChecklistEvidence[]
  acceptedToolEvidence: ToolBetaAcceptedExecutionEvidence[]
  platformEvidence: ToolBetaPlatformReadinessEvidence
  approvals: Record<string, boolean>
} {
  return {
    workspaceId: smokeWorkspaceId,
    checklistEvidence: [
      {
        itemId: 'model_weights_not_approved',
        sourceId: 'beta-readiness-api-smoke:model-license-approval',
        sourceSha: '1111111111111111111111111111111111111111',
        status: 'passed',
        notes: ['Smoke evidence clears the model/license checklist blocker.'],
      },
      {
        itemId: 'gcp_deployment_not_done',
        sourceId: 'beta-readiness-api-smoke:deployment-approval',
        sourceSha: '2222222222222222222222222222222222222222',
        status: 'passed',
        notes: ['Smoke evidence clears the deployment checklist blocker.'],
      },
    ],
    acceptedToolEvidence: PRODUCTION_TOOL_IDS.map((toolId) => ({
      toolId,
      sourceId: `beta-readiness-api-smoke:${toolId}:accepted-evidence`,
      sourceSha: '3333333333333333333333333333333333333333',
      readinessStatus: 'passed',
      realExecutionVerified: true,
      productionReadinessAccepted: true,
      productReadyLocalOss: true,
      modelWeightsApproved: true,
      notes: [`Smoke evidence accepts ${toolId} for the beta-readiness API route.`],
    })),
    platformEvidence: {
      sourceId: 'beta-readiness-api-smoke:platform-evidence',
      sourceSha: '4444444444444444444444444444444444444444',
      environment: 'staging',
      toolCostEventsMigrationDeployed: true,
      serviceRoleWritePathVerified: true,
      rlsMemberReadPathVerified: true,
      idempotentReplayVerified: true,
      walletSettlementVerified: true,
      stripeBoundaryVerified: true,
      monitoringVerified: true,
      billingQaVerified: true,
      deploymentApproved: true,
      securityApproved: true,
      storageApproved: true,
      legalApproved: true,
      supportApproved: true,
      notes: ['Smoke evidence verifies platform billing and operational readiness inputs.'],
    },
    approvals: {
      deploymentApproved: true,
      securityApproved: true,
      storageApproved: true,
      modelLicensesApproved: true,
      legalApproved: true,
      monitoringApproved: true,
      supportApproved: true,
    },
  }
}

function buildPassingPlatformDeployedEvidenceBody(workspaceId: string) {
  return {
    workspaceId,
    projectId: 'beta-readiness-api-smoke-deployed-platform-project',
    sourceId: 'beta-readiness-api-smoke:platform-deployed-evidence',
    sourceSha: '7777777777777777777777777777777777777777',
    environment: 'staging',
    ownerApprovals: {
      billingOwnerStripeBoundaryApproved: true,
      deploymentApproved: true,
      securityApproved: true,
      storageApproved: true,
      legalApproved: true,
      monitoringApproved: true,
      supportApproved: true,
    },
    notes: ['Smoke evidence verifies deployed platform evidence route without live beta activation.'],
    probes: buildPassingDeployedProbeObservations(),
  }
}

function buildPassingDeployedProbeObservations() {
  return [
    'tool_cost_events_migration_deployed',
    'beta_readiness_evidence_migration_deployed',
    'service_role_write_path_verified',
    'authenticated_rls_member_readback_verified',
    'idempotent_replay_verified',
    'wallet_settlement_verified',
    'stripe_boundary_owner_verified',
    'monitoring_deployment_verified',
    'staging_billing_qa_verified',
  ].map((id) => ({
    id,
    status: 'passed',
    evidence: [`${id} passed in API smoke fixture.`],
    nextAction: 'No action for API smoke fixture.',
  }))
}

async function requestJson(
  url: string,
  init: RequestInit,
  expectedStatus = 200,
): Promise<any> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
  const payload = await response.json()
  assert.equal(response.status, expectedStatus, `Expected ${expectedStatus} from ${url}, got ${response.status}: ${JSON.stringify(payload)}`)
  return payload
}
