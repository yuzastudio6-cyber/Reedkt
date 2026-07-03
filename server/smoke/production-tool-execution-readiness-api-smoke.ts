import assert from 'node:assert/strict'
import { type AddressInfo } from 'node:net'

import { createReeditProApiApp } from '../app'
import type { ProductionToolExecutionReadinessGateInput } from '../beta-readiness'
import { loadRuntimeEnv } from '../config/env'
import { PRODUCTION_TOOL_IDS } from '../tool-registry'

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

try {
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  const route = `${baseUrl}/v1/beta-readiness/production-tool-execution-readiness/evaluate`
  const evidenceRoute = `${baseUrl}/v1/beta-readiness/production-tool-execution-readiness/evidence`

  const missingEvidence = await requestJson(route, {
    method: 'POST',
    body: JSON.stringify({
      sourceId: 'production-tool-execution-readiness-api-smoke:missing-evidence',
      workspaceId: 'workspace-production-readiness-api-smoke',
      projectId: 'project-production-readiness-api-smoke',
    }),
  })
  assert.equal(missingEvidence.ok, true, 'missing evidence request should return a readiness report')
  assert.equal(missingEvidence.data.report.productionToolExecutionAllowed, false, 'missing evidence must block production execution')
  assert.equal(missingEvidence.data.report.paidProductionAllowed, false, 'missing evidence must block paid production')
  assert.ok(
    missingEvidence.warnings.some((warning: string) => warning.includes('report-only')),
    'API warnings should state that no production action ran',
  )
  assert.ok(
    missingEvidence.data.report.blockers.some((blocker: string) => blocker.includes('Supabase production persistence')),
    'missing evidence report should name Supabase persistence as a blocker',
  )

  const completeEvidence = productionEvidenceFixture()
  const passing = await requestJson(route, {
    method: 'POST',
    body: JSON.stringify(completeEvidence),
  })
  assert.equal(passing.ok, true, 'complete evidence request should return ok')
  assert.equal(passing.data.report.status, 'ready_for_paid_production', 'complete evidence should pass the production gate')
  assert.equal(passing.data.report.productionToolExecutionAllowed, true, 'complete evidence should allow production tool execution')
  assert.equal(passing.data.report.paidProductionAllowed, true, 'complete evidence should allow paid production')
  assert.equal(passing.data.report.productionToolCount, PRODUCTION_TOOL_IDS.length, 'API report should count all production tools')
  assert.equal(passing.data.report.acceptedProductionToolCount, PRODUCTION_TOOL_IDS.length, 'complete evidence should accept all production tools')

  const staging = await requestJson(route, {
    method: 'POST',
    body: JSON.stringify({
      ...completeEvidence,
      supabasePersistence: {
        ...completeEvidence.supabasePersistence!,
        environment: 'staging',
      },
    }),
  })
  assert.equal(staging.data.report.productionToolExecutionAllowed, false, 'staging evidence must not pass production execution')
  assert.ok(
    staging.data.report.blockers.some((blocker: string) => blocker.includes('Evidence environment is not production')),
    'staging evidence should name production environment blocker',
  )

  const secretLike = await requestJson(route, {
    method: 'POST',
    body: JSON.stringify({
      ...completeEvidence,
      observability: {
        ...completeEvidence.observability!,
        notes: ['operator pasted service_role_key by accident'],
      },
    }),
  }, 400)
  assert.equal(secretLike.error.code, 'VALIDATION_FAILED', 'secret-like evidence should fail validation')
  assert.match(secretLike.error.message, /secret-like/, 'secret-like evidence error should explain the secret safety block')

  const secretLikeRecord = await requestJson(evidenceRoute, {
    method: 'POST',
    headers: { 'idempotency-key': 'production-readiness-api-smoke-secret-like-record' },
    body: JSON.stringify({
      ...completeEvidence,
      observability: {
        ...completeEvidence.observability!,
        notes: ['operator pasted service_role_key by accident'],
      },
    }),
  }, 400)
  assert.equal(secretLikeRecord.error.code, 'VALIDATION_FAILED', 'secret-like production evidence should not record')
  assert.match(secretLikeRecord.error.message, /secret-like/, 'secret-like production evidence record error should explain the secret safety block')

  const blockedRecord = await requestJson(evidenceRoute, {
    method: 'POST',
    headers: { 'idempotency-key': 'production-readiness-api-smoke-blocked-record' },
    body: JSON.stringify({
      sourceId: 'production-tool-execution-readiness-api-smoke:blocked-record',
      workspaceId: 'workspace-production-readiness-api-smoke',
      projectId: 'project-production-readiness-api-smoke',
    }),
  }, 400)
  assert.equal(blockedRecord.error.code, 'VALIDATION_FAILED', 'blocked production evidence should not record')
  assert.ok(
    blockedRecord.error.details.blockers.some((blocker: string) => blocker.includes('Supabase production persistence')),
    'blocked record response should include production gate blockers',
  )

  const recorded = await requestJson(evidenceRoute, {
    method: 'POST',
    headers: { 'idempotency-key': 'production-readiness-api-smoke-record' },
    body: JSON.stringify(completeEvidence),
  }, 201)
  assert.equal(recorded.ok, true, 'complete production evidence should record')
  assert.equal(recorded.data.replayed, false, 'first production evidence record should not be replayed')
  assert.equal(recorded.data.report.productionToolExecutionAllowed, true, 'recorded production evidence should include passing report')
  assert.equal(recorded.data.packet.workspaceId, completeEvidence.workspaceId, 'recorded packet should keep workspace id')

  const replayed = await requestJson(evidenceRoute, {
    method: 'POST',
    headers: { 'idempotency-key': 'production-readiness-api-smoke-record' },
    body: JSON.stringify(completeEvidence),
  })
  assert.equal(replayed.data.replayed, true, 'duplicate production evidence record should replay')
  assert.equal(replayed.data.packet.id, recorded.data.packet.id, 'idempotent replay should return original production evidence packet')

  const readback = await requestJson(`${evidenceRoute}?workspaceId=${encodeURIComponent(completeEvidence.workspaceId)}`, {
    method: 'GET',
  })
  assert.equal(readback.ok, true, 'production evidence readback should return ok')
  assert.equal(readback.data.evidencePacketCount, 1, 'production evidence readback should include one idempotent packet')
  assert.equal(readback.data.latestReport.productionToolExecutionAllowed, true, 'production evidence readback should include latest passing report')

  console.log(JSON.stringify({
    ok: true,
    route: 'POST /v1/beta-readiness/production-tool-execution-readiness/evaluate',
    missingEvidenceBlocked: missingEvidence.data.report.blockers.length,
    passingStatus: passing.data.report.status,
    stagingBlocked: staging.data.report.blockers.length,
    secretSafetyRejected: secretLike.error.code,
    secretSafetyRecordRejected: secretLikeRecord.error.code,
    recordedEvidencePacket: recorded.data.packet.id,
    idempotentEvidenceReplay: replayed.data.replayed,
    readbackEvidencePacketCount: readback.data.evidencePacketCount,
  }, null, 2))
} finally {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve())
  })
}

async function requestJson(url: string, init: RequestInit, expectedStatus = 200) {
  const response = await fetch(url, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
  const body = await response.json()
  assert.equal(response.status, expectedStatus, `Expected ${expectedStatus} for ${url}, got ${response.status}: ${JSON.stringify(body)}`)
  return body
}

function productionEvidenceFixture(): ProductionToolExecutionReadinessGateInput {
  return {
    sourceId: 'production-tool-execution-readiness-api-smoke:complete-fixture',
    sourceSha: 'e366cd25a107fc60c623660d1507e350a3d0cd1d',
    workspaceId: 'workspace-production-readiness-api-smoke',
    projectId: 'project-production-readiness-api-smoke',
    supabasePersistence: {
      ...reviewedEvidence('Supabase persistence'),
      environment: 'production',
      toolCostEventsMigrationDeployed: true,
      betaReadinessEvidenceMigrationDeployed: true,
      productionReadinessEvidenceMigrationDeployed: true,
      serviceRoleWritePathVerified: true,
      rlsMemberReadPathVerified: true,
      explicitDataApiGrantsVerified: true,
      betaEvidenceBackendOnlyAccessVerified: true,
      productionEvidenceBackendOnlyAccessVerified: true,
      backupPitrApproved: true,
      securityAdvisorReviewed: true,
      performanceAdvisorReviewed: true,
      storagePoliciesVerified: true,
    },
    toolCostLedger: {
      ...reviewedEvidence('Tool cost ledger'),
      toolCostEventWriteVerified: true,
      ledgerAppendOnlyVerified: true,
      idempotentReplayVerified: true,
      projectSummaryReadbackVerified: true,
    },
    walletSettlement: {
      ...reviewedEvidence('Wallet settlement'),
      reservationVerified: true,
      spendVerified: true,
      releaseVerified: true,
      refundVerified: true,
      settlementRpcVerified: true,
      settlementRpcServiceRoleOnlyVerified: true,
      idempotentSettlementReplayVerified: true,
      noSilentChargeVerified: true,
    },
    stripeBoundary: {
      ...reviewedEvidence('Stripe boundary'),
      billingOwnerApproved: true,
      noStripeFromToolCostSurface: true,
      serviceFeeExcludedFromToolEvents: true,
      stripeWebhookSeparatedFromToolLedger: true,
    },
    observability: {
      ...reviewedEvidence('Observability and alerts'),
      dashboardsDeployed: true,
      alertsDeployed: true,
      alertRoutingVerified: true,
      billingQaMonitoringVerified: true,
    },
    operationsControls: {
      ...reviewedEvidence('Operations controls'),
      rollbackPlanApproved: true,
      killSwitchesVerified: true,
      rateLimitsVerified: true,
      concurrencyLimitsVerified: true,
      incidentRunbookApproved: true,
    },
    toolEvidence: {
      ...reviewedEvidence('Production tool evidence'),
      sourceId: 'production-tool-execution-readiness-api-smoke:tool-evidence-fixture',
      sourceSha: 'e366cd25a107fc60c623660d1507e350a3d0cd1d',
      allProductionToolsAccepted: true,
      modelWeightLicenseReviewApproved: true,
    },
    hardSafety: {
      ...reviewedEvidence('Hard safety invariants'),
      approvedPlanSnapshotRequired: true,
      creditEstimateAndReservationRequired: true,
      idempotencyRequired: true,
      rawPromptsRejected: true,
      secretsRejected: true,
      temporaryAccessLinksRejectedAsSourceTruth: true,
      frontendHeavyExecutionBlocked: true,
      licenseAndModelWeightReviewRequired: true,
      silentBillingBlocked: true,
    },
    finalOwnerSignoff: {
      ...reviewedEvidence('Final owner signoff'),
      deploymentOwnerApproved: true,
      securityOwnerApproved: true,
      storagePrivacyOwnerApproved: true,
      legalOwnerApproved: true,
      supportOwnerApproved: true,
      billingOwnerApproved: true,
      operationsOwnerApproved: true,
      realUserMediaBetaApproved: true,
      privateMediaApproval: true,
      artifactPrivacyEvidenceReady: true,
      paidProductionApproved: true,
      finalDeliveryShareApproved: true,
    },
  }
}

function reviewedEvidence(label: string) {
  return {
    evidenceArtifactId: `prod-api-artifact:${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    reviewedBy: 'production-api-smoke-reviewer',
    reviewedAt: '2026-07-02T00:00:00.000Z',
    notes: [`${label} verified in production API smoke fixture.`],
  }
}
