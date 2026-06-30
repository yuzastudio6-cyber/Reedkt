import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { existsSync } from 'node:fs'
import path from 'node:path'
import {
  runBetaReadinessPaidProductionEvidenceCollectorFromEnv,
  type BetaReadinessPaidProductionEvidenceCollectorEnv,
  type BetaReadinessPaidProductionEvidenceCollectorFetch,
} from '../cli/beta-readiness-paid-production-evidence-collector'
import type { LibassSyntheticBurninCommandRunner } from '../cli/beta-tools-libass-synthetic-burnin-qa-preflight'

const baseEnv: BetaReadinessPaidProductionEvidenceCollectorEnv = {
  REEDITPRO_BETA_PAID_PRODUCTION_API_BASE_URL: 'https://api.staging.reeditpro.example',
  REEDITPRO_BETA_PAID_PRODUCTION_BEARER_TOKEN: 'paid-production-secret-token',
  REEDITPRO_BETA_PAID_PRODUCTION_WORKSPACE_ID: 'workspace-paid-production-collector-smoke',
  REEDITPRO_BETA_PAID_PRODUCTION_PROJECT_ID: 'project-paid-production-collector-smoke',
  REEDITPRO_BETA_PAID_PRODUCTION_SOURCE_SHA: '4620f1c06dbd011fce6818f0d9966438b9b1d6c0',
  REEDITPRO_BETA_PAID_PRODUCTION_CONFIRM_EVIDENCE_SEQUENCE: 'true',
  REEDITPRO_BETA_EXTERNAL_CONFIRM_EVIDENCE_SEQUENCE: 'true',
  REEDITPRO_BETA_EXTERNAL_REQUIRE_EXTERNAL_BETA_READY: 'true',
  REEDITPRO_BETA_TRACKB_AGENT_ROUTE_CONFIRM_DEPLOYED_ROUTE_PROOF: 'true',
  REEDITPRO_BETA_TRACKB_AGENT_ROUTE_IDEMPOTENCY_PREFIX: 'paid-production-agent-route-smoke',
  REEDITPRO_BETA_TRACKB_AGENT_ROUTE_APPROVED_SNAPSHOT_ID: 'approved-snapshot-paid-production-agent-route-smoke',
  REEDITPRO_BETA_TRACKB_AGENT_ROUTE_TOOL_EXECUTION_PLAN_PREFIX: 'tool-exec-paid-production-agent-route-smoke',
  REEDITPRO_BETA_TRACKB_AGENT_LIVE_CREDIT_ESTIMATE_ID: 'credit-estimate-paid-production-live-smoke',
  REEDITPRO_BETA_TRACKB_AGENT_LIVE_CREDIT_RESERVATION_ID: 'credit-reservation-paid-production-live-smoke',
  REEDITPRO_BETA_TRACKB_AGENT_LIVE_APPROVED_RESERVATION_REMAINING_CREDITS: '250',
  REEDITPRO_BETA_TRACKB_AGENT_LIVE_ESTIMATED_FINAL_VIDEO_DURATION_SECONDS: '30',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CORE_IDEMPOTENCY_KEY: 'paid-production-tools-core-smoke',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_IDEMPOTENCY_KEY: 'paid-production-tools-libass-smoke',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_ID: 'paid-production-tools-smoke',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_NOTES: 'Smoke records tool evidence before paid-production final readback.',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CORE_TOOL_IDS: 'hyperframe',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_ACCEPT_PRODUCTION_READINESS: 'true',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE: 'true',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_ACCEPT_PRODUCT_READY_LOCAL_OSS: 'true',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE: 'true',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRE_CORE_ACCEPTED_EVIDENCE: 'true',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRE_LIBASS_ACCEPTED_EVIDENCE: 'true',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRE_OPERATOR_READBACK: 'true',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRED_PRODUCT_READY_LOCAL_OSS_COUNT: '16',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_MODE: 'host',
  REEDITPRO_READINESS_PYTHON_BIN: findPythonPath(),
  REEDITPRO_BETA_PLATFORM_SOURCE_ID: 'paid-production-platform-smoke',
  REEDITPRO_BETA_PLATFORM_ENVIRONMENT: 'staging',
  REEDITPRO_BETA_PLATFORM_IDEMPOTENCY_KEY: 'paid-production-platform-smoke',
  REEDITPRO_BETA_PLATFORM_ALLOW_PERSISTENT_PROBE_WRITES: 'true',
  REEDITPRO_BETA_PLATFORM_WALLET_SETTLEMENT_EVENT_ID: 'tool-cost-event-paid-production-smoke',
  REEDITPRO_BETA_PLATFORM_RECORD_EVIDENCE: 'true',
  REEDITPRO_BETA_PLATFORM_CONFIRM_RECORD_EVIDENCE: 'true',
  REEDITPRO_BETA_PLATFORM_APPROVE_BILLING_STRIPE_BOUNDARY: 'true',
  REEDITPRO_BETA_PLATFORM_APPROVE_DEPLOYMENT: 'true',
  REEDITPRO_BETA_PLATFORM_APPROVE_SECURITY: 'true',
  REEDITPRO_BETA_PLATFORM_APPROVE_STORAGE: 'true',
  REEDITPRO_BETA_PLATFORM_APPROVE_LEGAL: 'true',
  REEDITPRO_BETA_PLATFORM_APPROVE_MONITORING: 'true',
  REEDITPRO_BETA_PLATFORM_APPROVE_SUPPORT: 'true',
  REEDITPRO_BETA_PLATFORM_RLS_READBACK_VERIFIED: 'true',
  REEDITPRO_BETA_PLATFORM_RLS_READBACK_EVIDENCE: 'Staging RLS member and non-member readback passed.',
  REEDITPRO_BETA_PLATFORM_STRIPE_BOUNDARY_VERIFIED: 'true',
  REEDITPRO_BETA_PLATFORM_STRIPE_BOUNDARY_EVIDENCE: 'Billing owner approved Stripe boundary.',
  REEDITPRO_BETA_PLATFORM_MONITORING_VERIFIED: 'true',
  REEDITPRO_BETA_PLATFORM_MONITORING_EVIDENCE: 'Monitoring dashboard and alert routing verified.',
  REEDITPRO_BETA_PLATFORM_BILLING_QA_VERIFIED: 'true',
  REEDITPRO_BETA_PLATFORM_BILLING_QA_EVIDENCE: 'Staging billing QA passed.',
  REEDITPRO_BETA_LAUNCH_SOURCE_ID: 'paid-production-launch-smoke',
  REEDITPRO_BETA_LAUNCH_IDEMPOTENCY_KEY: 'paid-production-launch-smoke',
  REEDITPRO_BETA_LAUNCH_CONFIRM_EXTERNAL_BETA_APPROVAL: 'true',
  REEDITPRO_BETA_LAUNCH_APPROVE_DEPLOYMENT: 'true',
  REEDITPRO_BETA_LAUNCH_APPROVE_SECURITY: 'true',
  REEDITPRO_BETA_LAUNCH_APPROVE_STORAGE: 'true',
  REEDITPRO_BETA_LAUNCH_APPROVE_MODEL_LICENSES: 'true',
  REEDITPRO_BETA_LAUNCH_APPROVE_LEGAL: 'true',
  REEDITPRO_BETA_LAUNCH_APPROVE_MONITORING: 'true',
  REEDITPRO_BETA_LAUNCH_APPROVE_SUPPORT: 'true',
  REEDITPRO_BETA_LAUNCH_MODEL_LICENSE_EVIDENCE: 'Model and license owner approved external beta scope.',
  REEDITPRO_BETA_LAUNCH_DEPLOYMENT_EVIDENCE: 'Deployment owner approved staging deployment evidence.',
  REEDITPRO_BETA_LAUNCH_SECURITY_EVIDENCE: 'Security owner approved external beta readiness.',
  REEDITPRO_BETA_LAUNCH_STORAGE_EVIDENCE: 'Storage/privacy owner approved external beta storage scope.',
  REEDITPRO_BETA_LAUNCH_LEGAL_EVIDENCE: 'Legal owner approved external beta scope.',
  REEDITPRO_BETA_LAUNCH_MONITORING_EVIDENCE: 'Monitoring owner approved alerting coverage.',
  REEDITPRO_BETA_LAUNCH_SUPPORT_EVIDENCE: 'Support owner approved incident response coverage.',
  REEDITPRO_BETA_SCOPE_SEQUENCE_SOURCE_ID: 'paid-production-scope-smoke',
  REEDITPRO_BETA_SCOPE_SEQUENCE_CONFIRM_APPROVAL_SEQUENCE: 'true',
  REEDITPRO_BETA_SCOPE_SEQUENCE_CONFIRM_REAL_USER_MEDIA_BETA: 'true',
  REEDITPRO_BETA_SCOPE_SEQUENCE_CONFIRM_PAID_PRODUCTION: 'true',
  REEDITPRO_BETA_SCOPE_SEQUENCE_REAL_USER_MEDIA_IDEMPOTENCY_KEY: 'paid-production-real-user-smoke',
  REEDITPRO_BETA_SCOPE_SEQUENCE_PAID_PRODUCTION_IDEMPOTENCY_KEY: 'paid-production-paid-production-smoke',
  REEDITPRO_BETA_SCOPE_SEQUENCE_REAL_USER_MEDIA_BETA_EVIDENCE: 'Owner approved real-user-media beta after external beta readiness passed.',
  REEDITPRO_BETA_SCOPE_SEQUENCE_PAID_PRODUCTION_EVIDENCE: 'Owner approved paid production after real-user-media beta readiness passed.',
  REEDITPRO_BETA_SCOPE_SEQUENCE_REQUIRE_PAID_PRODUCTION_READY: 'true',
}

let fetchShouldNotRun = false
await assert.rejects(
  () => runBetaReadinessPaidProductionEvidenceCollectorFromEnv({
    ...baseEnv,
    REEDITPRO_BETA_PAID_PRODUCTION_CONFIRM_EVIDENCE_SEQUENCE: 'false',
  }, async () => {
    fetchShouldNotRun = true
    throw new Error('fetch must not run without final evidence confirmation')
  }, fakeLibassRunner()),
  /PAID_PRODUCTION_CONFIRM_EVIDENCE_SEQUENCE/,
  'paid-production collector should fail before evidence writes without explicit confirmation',
)
assert.equal(fetchShouldNotRun, false, 'missing final confirmation must not call fetch')

const calls: Array<{ url: string; method: string; idempotencyKey?: string; body?: Record<string, unknown> }> = []
const result = await runBetaReadinessPaidProductionEvidenceCollectorFromEnv(baseEnv, fakeFetch(calls, true), fakeLibassRunner())
assert.equal(result.ok, true, 'paid-production collector should pass after external, scope, and final paid-production readbacks pass')
assert.equal(result.steps.externalBetaEvidence.readinessRequirements.finalExternalBetaReady, true, 'external beta collector should prove external beta readiness')
assert.equal(result.steps.externalBetaEvidence.steps.agentRouteProof.boundedRuntimeProbeToolCount, 16, 'external beta collector should prove all 16 bounded runtime probes before paid-production scope evidence')
assert.equal(result.steps.externalBetaEvidence.steps.agentRouteProof.routeProofToolCount, 16, 'external beta collector should prove all 16 Track B route contracts before paid-production scope evidence')
assert.equal(result.steps.externalBetaEvidence.steps.toolEvidence.readbackRequirements.readbackProductReadyLocalOssCount, 16, 'external beta collector should prove product-ready deployed readback 16 before paid-production scope evidence')
assert.equal(result.steps.externalBetaEvidence.steps.agentLiveAdmissionProof.backendLiveAdmissionToolCount, 15, 'external beta collector should prove backend live admission before paid-production scope evidence')
assert.equal(result.steps.externalBetaEvidence.steps.agentLiveAdmissionProof.frontendPreviewBoundaryToolCount, 1, 'external beta collector should keep Hyperframe in preview boundary before paid-production scope evidence')
assert.equal(result.steps.scopeApprovals.readinessRequirements.finalPaidProductionReady, true, 'scope sequence should prove paid-production readiness')
assert.equal(result.readinessRequirements.finalExternalBetaReady, true, 'final status should preserve external beta readiness')
assert.equal(result.readinessRequirements.finalRealUserMediaBetaReady, true, 'final status should preserve real-user-media beta readiness')
assert.equal(result.readinessRequirements.finalPaidProductionReady, true, 'final status should preserve paid-production readiness')
assert.equal(JSON.stringify(result).includes('paid-production-secret-token'), false, 'summary must not include bearer token')
const routeProofCalls = calls.filter((call) => call.url.endsWith('/v1/agent-tools/trackb/execute'))
const boundedRuntimeProbeCalls = routeProofCalls.slice(0, 16)
const safeRouteProofCalls = routeProofCalls.slice(16, 32)
const liveAdmissionRouteCalls = routeProofCalls.slice(32)
assert.equal(calls.length, 61, 'collector should run external-beta bounded probes, route/product/live-admission evidence, scope sequence, then final status readback')
assert.equal(routeProofCalls.length, 48, 'paid-production wrapper should inherit all 16 bounded probes, 16 route proofs, and 16 live-admission checks')
assert.equal(boundedRuntimeProbeCalls.every((call) => call.body?.mode === 'bounded_runtime_probe'), true)
assert.equal(safeRouteProofCalls.every((call) => call.body?.mode === 'mock_safe_worker_dispatch' || call.body?.mode === 'frontend_preview_boundary'), true)
assert.equal(liveAdmissionRouteCalls.filter((call) => call.body?.toolId !== 'hyperframe').every((call) => call.body?.mode === 'deployed_live_execution'), true)
assert.equal(liveAdmissionRouteCalls.find((call) => call.body?.toolId === 'hyperframe')?.body?.mode, 'frontend_preview_boundary')
assert.equal(calls[32]?.idempotencyKey, 'paid-production-tools-core-smoke')
assert.equal(calls[33]?.idempotencyKey, 'paid-production-tools-libass-smoke')
assert.equal(calls[52]?.idempotencyKey, 'paid-production-platform-smoke')
assert.equal(calls[53]?.idempotencyKey, 'paid-production-launch-smoke')
assert.equal(calls[56]?.idempotencyKey, 'paid-production-real-user-smoke')
assert.equal(calls[58]?.idempotencyKey, 'paid-production-paid-production-smoke')
assert.equal(calls[60]?.method, 'GET', 'last call should be the final operator-status readback')

await assert.rejects(
  () => runBetaReadinessPaidProductionEvidenceCollectorFromEnv(baseEnv, fakeFetch([], false), fakeLibassRunner()),
  /paid production is not ready|target gate is still not ready/,
  'paid-production collector should fail closed when paid-production readback is not ready',
)

await assert.rejects(
  () => runBetaReadinessPaidProductionEvidenceCollectorFromEnv({
    ...baseEnv,
    REEDITPRO_BETA_SCOPE_SEQUENCE_PAID_PRODUCTION_EVIDENCE: 'sk-secret-paid-production',
  }, fakeFetch([], true), fakeLibassRunner()),
  /secret-like|paidProductionEvidence/,
  'paid-production collector should reject secret-like nested approval evidence before deployed calls',
)

console.log(JSON.stringify({
  ok: true,
  finalPaidProductionReady: result.readinessRequirements.finalPaidProductionReady,
  calls: calls.map((call) => ({ url: call.url, method: call.method, idempotencyKey: call.idempotencyKey })),
  tokenInSummary: JSON.stringify(result).includes('paid-production-secret-token'),
}, null, 2))

function fakeFetch(
  calls: Array<{ url: string; method: string; idempotencyKey?: string; body?: Record<string, unknown> }>,
  finalPaidProductionReady: boolean,
): BetaReadinessPaidProductionEvidenceCollectorFetch {
  let statusReadCount = 0
  return async (url, init) => {
    const body = init.body ? JSON.parse(init.body) as Record<string, unknown> : undefined
    calls.push({ url, method: init.method, idempotencyKey: init.headers['idempotency-key'], body })

    if (init.method === 'POST' && url.endsWith('/v1/agent-tools/trackb/execute')) {
      if (body?.mode === 'bounded_runtime_probe') {
        return jsonResponse(202, {
          ok: true,
          data: {
            trackBAgentToolExecution: {
              status: 'completed',
              decision: 'trackb_agent_tool_execution_bounded_runtime_probe_completed',
              toolId: body.toolId,
              agentInvocationId: body.agentInvocationId,
              mode: body.mode,
              liveExecutionReady: false,
              paymentScope: 'excluded_from_this_runtime_boundary',
              serviceFeeIncluded: false,
              runtimeReadinessProof: {
                toolId: body.toolId,
                probeKind: 'command_import_package_metadata_only',
                mediaProcessing: false,
                productRuntimeExecution: false,
                backendEvidenceRecorded: false,
                status: 'passed',
                checkedAt: new Date().toISOString(),
                checkModes: ['node_package_metadata'],
                commandChecks: [],
                pythonImportChecks: [],
                nodePackageChecks: [],
                warnings: [],
              },
            },
          },
        })
      }
      if (body?.mode === 'deployed_live_execution') {
        return jsonResponse(202, {
          ok: true,
          data: {
            trackBAgentToolExecution: {
              status: 'completed',
              decision: 'trackb_agent_tool_execution_deployed_live_execution_completed',
              liveExecutionReady: true,
              workerPayload: {
                executionMode: 'production_ready',
                creditReservationId: body.creditReservationId,
              },
              workerResult: {
                status: 'completed',
                toolCostMetadata: {
                  serviceFeeIncluded: false,
                  emittedEvents: [{ billableToUser: true }],
                },
              },
            },
          },
        })
      }
      return jsonResponse(202, {
        ok: true,
        data: {
          trackBAgentToolExecution: {
            status: 'completed',
            decision: 'trackb_agent_tool_execution_completed_mock_safe',
            liveExecutionReady: false,
            workerPayload: body?.mode === 'mock_safe_worker_dispatch'
              ? { executionMode: 'mock_safe_worker_dispatch' }
              : undefined,
            previewBoundary: body?.mode === 'frontend_preview_boundary'
              ? { workerDispatchSkipped: true }
              : undefined,
          },
        },
      })
    }

    if (init.method === 'POST' && url.endsWith('/v1/beta-readiness/evidence/core-real-check')) {
      return jsonResponse(201, {
        ok: true,
        data: {
          acceptedToolEvidence: [{ toolId: 'hyperframe', productReadyLocalOss: true }],
          skippedToolResults: [],
          readinessSummary: { totalSpecs: 1, statuses: { passed: 1 } },
          report: {
            toolExecutionReadiness: {
              productReadyLocalOssCount: 16,
              externalBetaToolExecutionAllowed: false,
              productionToolExecutionAllowed: false,
              blockers: [],
              platformBlockers: [{ blockerId: 'production_billing_deployment_unverified' }],
            },
          },
        },
        warnings: [],
      })
    }

    if (init.method === 'POST' && url.endsWith('/v1/beta-readiness/platform-deployed-evidence/probe')) {
      return jsonResponse(200, {
        ok: true,
        data: {
          report: {
            evidencePacketReady: true,
            externalBetaAllowed: false,
            productionAllowed: false,
            missingEvidence: [],
            ownerApprovalGaps: [],
            checks: [{ id: 'tool_cost_events_migration_deployed', status: 'passed' }],
          },
        },
        warnings: [],
      })
    }

    if (init.method === 'POST' && url.endsWith('/v1/beta-readiness/evidence')) {
      const approvals = isRecord(body?.approvals) ? body.approvals : {}
      if (init.headers['idempotency-key'] === 'paid-production-tools-libass-smoke') {
        return genericEvidenceResponse({
          externalBetaAllowed: false,
          realUserMediaBetaAllowed: false,
          paidProductionAllowed: false,
        }, 2)
      }
      if (init.headers['idempotency-key'] === 'paid-production-launch-smoke') {
        return genericEvidenceResponse({
          externalBetaAllowed: true,
          realUserMediaBetaAllowed: false,
          paidProductionAllowed: false,
        }, 4)
      }
      if (approvals.realUserMediaBetaApproved === true) {
        return genericEvidenceResponse({
          externalBetaAllowed: true,
          realUserMediaBetaAllowed: true,
          paidProductionAllowed: false,
        }, 5)
      }
      if (approvals.paidProductionApproved === true) {
        return genericEvidenceResponse({
          externalBetaAllowed: true,
          realUserMediaBetaAllowed: true,
          paidProductionAllowed: finalPaidProductionReady,
        }, 6)
      }
    }

    if (init.method === 'GET' && url.includes('/v1/beta-readiness/operator-status')) {
      statusReadCount += 1
      return operatorStatusResponse(statusForRead(statusReadCount, finalPaidProductionReady))
    }

    throw new Error(`unexpected fetch ${init.method} ${url}`)
  }
}

function statusForRead(count: number, finalPaidProductionReady: boolean): {
  readyForExternalBeta: boolean
  readyForRealUserMediaBeta: boolean
  readyForPaidProduction: boolean
} {
  if (count <= 1) {
    return { readyForExternalBeta: false, readyForRealUserMediaBeta: false, readyForPaidProduction: false }
  }
  if (count <= 3) {
    return { readyForExternalBeta: true, readyForRealUserMediaBeta: false, readyForPaidProduction: false }
  }
  if (count === 4) {
    return { readyForExternalBeta: true, readyForRealUserMediaBeta: true, readyForPaidProduction: false }
  }
  return { readyForExternalBeta: true, readyForRealUserMediaBeta: true, readyForPaidProduction: finalPaidProductionReady }
}

function operatorStatusResponse(status: {
  readyForExternalBeta: boolean
  readyForRealUserMediaBeta: boolean
  readyForPaidProduction: boolean
}): Promise<{ status: number; json(): Promise<unknown> }> {
  return Promise.resolve({
    status: 200,
    async json() {
      return {
        ok: true,
        data: {
          status: {
            ...status,
            evidenceSource: 'stored_workspace_evidence',
            workspaceId: 'workspace-paid-production-collector-smoke',
            evidencePacketCount: 6,
            currentGate: {
              productReadyLocalOssCount: 16,
              externalBetaToolExecutionAllowed: status.readyForExternalBeta,
              productionToolExecutionAllowed: status.readyForPaidProduction,
              blockedActionScope: status.readyForPaidProduction ? [] : ['paid_production_launch'],
              allowedForwardProgressScopes: ['owner_approval_packet_collection'],
            },
            evidenceGaps: {
              goNoGoBlockers: status.readyForPaidProduction ? [] : ['paid_production_scope_approval_pending'],
              blockedChecklistItems: [],
              platformBlockers: [],
            },
            nextActions: [],
          },
        },
        warnings: [],
      }
    },
  })
}

function genericEvidenceResponse(goNoGo: {
  externalBetaAllowed: boolean
  realUserMediaBetaAllowed: boolean
  paidProductionAllowed: boolean
}, evidencePacketCount: number): Promise<{ status: number; json(): Promise<unknown> }> {
  return Promise.resolve({
    status: 201,
    async json() {
      return {
        ok: true,
        data: {
          packet: { id: 'paid-production-evidence-packet-smoke', evidence: { acceptedToolEvidence: [{ toolId: 'libass' }] } },
          replayed: false,
          evidencePacketCount,
          report: {
            goNoGo,
            toolExecutionReadiness: {
              productReadyLocalOssCount: 16,
              externalBetaToolExecutionAllowed: goNoGo.externalBetaAllowed,
              productionToolExecutionAllowed: goNoGo.paidProductionAllowed,
            },
          },
        },
        warnings: ['Fake server warning: paid-production collector smoke did not touch staging.'],
      }
    },
  })
}

function fakeLibassRunner(): LibassSyntheticBurninCommandRunner {
  return (command, args) => {
    if (command === 'fc-match') return { stdout: 'DejaVuSans.ttf: DejaVu Sans' }
    if (command === 'ffprobe') return { stdout: '1.000000\n' }
    if (command === 'ffmpeg') {
      const outputPath = args.at(-1)
      if (outputPath) {
        mkdirSync(path.dirname(outputPath), { recursive: true })
        writeFileSync(outputPath, `fake paid production collector media for ${args.join(' ')}`)
      }
      return { stdout: 'ffmpeg fake ok' }
    }
    throw new Error(`unexpected command ${command} ${args.join(' ')}`)
  }
}

function jsonResponse(status: number, payload: unknown): ReturnType<BetaReadinessPaidProductionEvidenceCollectorFetch> {
  return Promise.resolve({
    status,
    async json() {
      return payload
    },
  })
}

function findPythonPath(): string {
  const candidates = [
    process.env.REEDITPRO_READINESS_PYTHON_BIN,
    '.reeditpro-tool-readiness-python/bin/python',
    '/usr/bin/python3',
    '/opt/homebrew/bin/python3',
  ].filter((candidate): candidate is string => Boolean(candidate))

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate
  }
  return process.execPath
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}
