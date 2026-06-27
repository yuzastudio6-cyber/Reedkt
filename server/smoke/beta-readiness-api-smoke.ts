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
