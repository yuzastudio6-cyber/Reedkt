import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { existsSync } from 'node:fs'
import path from 'node:path'
import {
  runBetaReadinessExternalBetaEvidenceCollectorFromEnv,
  type BetaReadinessExternalBetaEvidenceCollectorEnv,
  type BetaReadinessExternalBetaEvidenceCollectorFetch,
} from '../cli/beta-readiness-external-beta-evidence-collector'
import type { LibassSyntheticBurninCommandRunner } from '../cli/beta-tools-libass-synthetic-burnin-qa-preflight'

const baseEnv: BetaReadinessExternalBetaEvidenceCollectorEnv = {
  REEDITPRO_BETA_EXTERNAL_API_BASE_URL: 'https://api.staging.reeditpro.example',
  REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN: 'external-beta-secret-token',
  REEDITPRO_BETA_EXTERNAL_WORKSPACE_ID: 'workspace-external-beta-collector-smoke',
  REEDITPRO_BETA_EXTERNAL_PROJECT_ID: 'project-external-beta-collector-smoke',
  REEDITPRO_BETA_EXTERNAL_SOURCE_SHA: 'e9ade42f7f790341d98b14deb3da2021f1383da3',
  REEDITPRO_BETA_EXTERNAL_CONFIRM_EVIDENCE_SEQUENCE: 'true',
  REEDITPRO_BETA_EXTERNAL_REQUIRE_EXTERNAL_BETA_READY: 'true',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CORE_IDEMPOTENCY_KEY: 'external-beta-tools-core-smoke',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_IDEMPOTENCY_KEY: 'external-beta-tools-libass-smoke',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_ID: 'external-beta-tools-smoke',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_NOTES: 'Smoke records deployed evidence before external beta final readback.',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CORE_TOOL_IDS: 'hyperframe',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_ACCEPT_BOUNDED_ACCEPTED_EVIDENCE: 'true',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CONFIRM_BOUNDED_ACCEPTED_EVIDENCE_ACCEPTANCE: 'true',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRE_CORE_ACCEPTED_EVIDENCE: 'true',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRE_LIBASS_ACCEPTED_EVIDENCE: 'true',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRE_OPERATOR_READBACK: 'true',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRED_BOUNDED_ACCEPTED_TOOL_COUNT: '2',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRED_PRODUCT_READY_LOCAL_OSS_COUNT: '0',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_MODE: 'host',
  REEDITPRO_READINESS_PYTHON_BIN: findPythonPath(),
  REEDITPRO_BETA_PLATFORM_SOURCE_ID: 'external-beta-platform-smoke',
  REEDITPRO_BETA_PLATFORM_ENVIRONMENT: 'staging',
  REEDITPRO_BETA_PLATFORM_IDEMPOTENCY_KEY: 'external-beta-platform-smoke',
  REEDITPRO_BETA_PLATFORM_ALLOW_PERSISTENT_PROBE_WRITES: 'true',
  REEDITPRO_BETA_PLATFORM_WALLET_SETTLEMENT_EVENT_ID: 'tool-cost-event-external-beta-smoke',
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
  REEDITPRO_BETA_LAUNCH_SOURCE_ID: 'external-beta-launch-smoke',
  REEDITPRO_BETA_LAUNCH_IDEMPOTENCY_KEY: 'external-beta-launch-smoke',
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
}

let fetchShouldNotRun = false
await assert.rejects(
  () => runBetaReadinessExternalBetaEvidenceCollectorFromEnv({
    ...baseEnv,
    REEDITPRO_BETA_EXTERNAL_CONFIRM_EVIDENCE_SEQUENCE: 'false',
  }, async () => {
    fetchShouldNotRun = true
    throw new Error('fetch must not run without all-up confirmation')
  }, fakeLibassRunner()),
  /CONFIRM_EVIDENCE_SEQUENCE/,
  'collector should fail closed before evidence writes without explicit all-up confirmation',
)
assert.equal(fetchShouldNotRun, false, 'missing all-up confirmation must not call fetch')

const calls: Array<{ url: string; method: string; idempotencyKey?: string; body?: Record<string, unknown> }> = []
const result = await runBetaReadinessExternalBetaEvidenceCollectorFromEnv(baseEnv, fakeFetch(calls, true), fakeLibassRunner())
assert.equal(result.ok, true, 'external beta evidence collector should pass when every evidence step and final readback pass')
assert.equal(result.endpointBaseUrl, 'https://api.staging.reeditpro.example', 'collector should normalize/fill base URL')
assert.equal(result.steps.toolEvidence.localBundle.locallyAcceptedToolCount, 2, 'collector should run local accepted tool evidence first')
assert.equal(result.steps.platformEvidence.evidencePacketReady, true, 'collector should require platform evidence readiness')
assert.equal(result.steps.launchApprovalEvidence.externalBetaAllowed, true, 'collector should require launch approval readback')
assert.equal(result.steps.finalOperatorStatus.readyForExternalBeta, true, 'collector should require final external beta readback')
assert.equal(result.steps.finalOperatorStatus.currentGate.productReadyLocalOssCount, 0, 'all-up collector must preserve zero product-ready local OSS')
assert.equal(result.readinessRequirements.finalRealUserMediaBetaReady, false, 'collector must not open real-user-media beta')
assert.equal(result.readinessRequirements.finalPaidProductionReady, false, 'collector must not open paid production')
assert.ok(result.remainingBlockedScopes.includes('paid_production_scope_approval'), 'collector must preserve later paid production blocker')
assert.equal(JSON.stringify(result).includes('external-beta-secret-token'), false, 'summary must not include bearer token')

assert.equal(calls.length, 6, 'collector should run tool core, tool libass, initial status, platform, launch, final status')
assert.equal(calls[0]?.url, 'https://api.staging.reeditpro.example/v1/beta-readiness/evidence/core-real-check')
assert.equal(calls[0]?.idempotencyKey, 'external-beta-tools-core-smoke')
assert.equal(calls[0]?.body?.acceptProductionReadiness, true, 'bounded evidence should reduce production-readiness blockers')
assert.equal(calls[0]?.body?.acceptProductReadyLocalOss, false, 'bounded evidence must not request product-ready local OSS')
assert.equal(calls[1]?.url, 'https://api.staging.reeditpro.example/v1/beta-readiness/evidence')
assert.equal(calls[1]?.idempotencyKey, 'external-beta-tools-libass-smoke')
assert.equal(
  ((calls[1]?.body?.acceptedToolEvidence as Array<{ productReadyLocalOss?: boolean }> | undefined) ?? [])[0]?.productReadyLocalOss,
  false,
  'bounded libass evidence must keep product-ready local OSS false',
)
assert.equal(calls[2]?.url, 'https://api.staging.reeditpro.example/v1/beta-readiness/operator-status?workspaceId=workspace-external-beta-collector-smoke')
assert.equal(calls[3]?.url, 'https://api.staging.reeditpro.example/v1/beta-readiness/platform-deployed-evidence/probe')
assert.equal(calls[3]?.idempotencyKey, 'external-beta-platform-smoke')
assert.equal(calls[4]?.url, 'https://api.staging.reeditpro.example/v1/beta-readiness/evidence')
assert.equal(calls[4]?.idempotencyKey, 'external-beta-launch-smoke')
assert.equal(calls[5]?.url, 'https://api.staging.reeditpro.example/v1/beta-readiness/operator-status?workspaceId=workspace-external-beta-collector-smoke')

await assert.rejects(
  () => runBetaReadinessExternalBetaEvidenceCollectorFromEnv(baseEnv, fakeFetch([], false), fakeLibassRunner()),
  /external beta is not ready/,
  'collector should fail closed when final operator readback is not external-beta ready',
)

console.log(JSON.stringify({
  ok: true,
  endpointBaseUrl: result.endpointBaseUrl,
  finalExternalBetaReady: result.readinessRequirements.finalExternalBetaReady,
  finalRealUserMediaBetaReady: result.readinessRequirements.finalRealUserMediaBetaReady,
  finalPaidProductionReady: result.readinessRequirements.finalPaidProductionReady,
  calls: calls.map((call) => ({ url: call.url, method: call.method, idempotencyKey: call.idempotencyKey })),
  tokenInSummary: JSON.stringify(result).includes('external-beta-secret-token'),
}, null, 2))

function fakeFetch(
  calls: Array<{ url: string; method: string; idempotencyKey?: string; body?: Record<string, unknown> }>,
  finalExternalBetaReady: boolean,
): BetaReadinessExternalBetaEvidenceCollectorFetch {
  let statusReadCount = 0
  return async (url, init) => {
    const body = init.body ? JSON.parse(init.body) as Record<string, unknown> : undefined
    calls.push({ url, method: init.method, idempotencyKey: init.headers['idempotency-key'], body })

    if (init.method === 'POST' && url.endsWith('/v1/beta-readiness/evidence/core-real-check')) {
      return jsonResponse(201, {
        ok: true,
        data: {
          acceptedToolEvidence: [{ toolId: 'hyperframe' }],
          skippedToolResults: [],
          readinessSummary: { totalSpecs: 1, statuses: { passed: 1 } },
          report: {
            toolExecutionReadiness: {
              productReadyLocalOssCount: 0,
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

    if (init.method === 'POST' && url.endsWith('/v1/beta-readiness/evidence') && init.headers['idempotency-key'] === 'external-beta-tools-libass-smoke') {
      return jsonResponse(201, {
        ok: true,
        data: {
          replayed: false,
          packet: {
            id: 'beta-readiness-evidence-external-beta-libass-smoke',
            evidence: body,
          },
          report: {
            toolExecutionReadiness: {
              productReadyLocalOssCount: 0,
              externalBetaToolExecutionAllowed: false,
              productionToolExecutionAllowed: false,
            },
          },
        },
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
            checks: [
              { id: 'tool_cost_events_migration_deployed', status: 'passed' },
              { id: 'wallet_settlement_verified', status: 'passed' },
            ],
          },
        },
        warnings: [],
      })
    }

    if (init.method === 'POST' && url.endsWith('/v1/beta-readiness/evidence') && init.headers['idempotency-key'] === 'external-beta-launch-smoke') {
      return jsonResponse(201, {
        ok: true,
        data: {
          packet: { id: 'beta-readiness-evidence-external-beta-launch-smoke' },
          replayed: false,
          evidencePacketCount: 4,
          report: {
            goNoGo: {
              externalBetaAllowed: true,
              realUserMediaBetaAllowed: false,
              paidProductionAllowed: false,
            },
            toolExecutionReadiness: {
              externalBetaToolExecutionAllowed: true,
              productionToolExecutionAllowed: false,
            },
            blockers: [],
          },
        },
        warnings: [],
      })
    }

    if (init.method === 'GET' && url.includes('/v1/beta-readiness/operator-status')) {
      statusReadCount += 1
      return jsonResponse(200, operatorStatusPayload(statusReadCount === 1 ? false : finalExternalBetaReady))
    }

    throw new Error(`unexpected fetch ${init.method} ${url}`)
  }
}

function operatorStatusPayload(externalBetaReady: boolean): unknown {
  return {
    ok: true,
    data: {
      status: {
        evidenceSource: 'stored_workspace_evidence',
        workspaceId: 'workspace-external-beta-collector-smoke',
        evidencePacketCount: externalBetaReady ? 4 : 2,
        readyForExternalBeta: externalBetaReady,
        readyForRealUserMediaBeta: false,
        readyForPaidProduction: false,
        currentGate: {
          totalTools: 49,
          ownerCoverageToolCount: 49,
          readinessSpecToolCount: 49,
          toolBlockers: externalBetaReady ? 0 : 2,
          platformBlockers: externalBetaReady ? 0 : 1,
          productReadyLocalOssCount: 0,
          externalBetaToolExecutionAllowed: externalBetaReady,
          productionToolExecutionAllowed: false,
          blockerPolicy: 'evidence_driven_block_unsafe_actions_only',
          blockerForwardProgressPolicy: {
            intentionalBlanketBlocksAllowed: false,
            blockerScope: 'named_unsafe_action_only',
            safeForwardProgressRequired: true,
            nextSafeActionRequiredForBlockers: true,
          },
          safeBlockerReductionAllowed: true,
          blockedActionScope: externalBetaReady
            ? ['real_user_media_beta_scope_approval', 'paid_production_launch']
            : ['external_beta_tool_execution', 'external_beta_launch'],
          allowedForwardProgressScopes: [
            'deployment_preflight_and_platform_evidence_collection',
            'owner_approval_packet_collection',
          ],
        },
        evidenceGaps: {
          goNoGoBlockers: externalBetaReady ? [] : ['platform_billing_deployment_unverified'],
          blockedChecklistItems: [],
          toolBlockers: externalBetaReady ? 0 : 2,
          platformBlockers: externalBetaReady ? [] : ['production_billing_deployment_unverified'],
        },
        nextActions: externalBetaReady
          ? ['External beta evidence is ready; run scope approval preflight only for later real-user-media beta.']
          : ['Record platform and launch evidence.'],
        warnings: [],
      },
    },
    warnings: [],
  }
}

function fakeLibassRunner(): LibassSyntheticBurninCommandRunner {
  return (command, args) => {
    if (command === 'fc-match') return { stdout: 'DejaVuSans.ttf: DejaVu Sans' }
    if (command === 'ffprobe') return { stdout: '1.000000\n' }
    if (command === 'ffmpeg') {
      const outputPath = args.at(-1)
      if (outputPath) {
        mkdirSync(path.dirname(outputPath), { recursive: true })
        writeFileSync(outputPath, `fake external beta collector media for ${args.join(' ')}`)
      }
      return { stdout: 'ffmpeg fake ok' }
    }
    throw new Error(`unexpected command ${command} ${args.join(' ')}`)
  }
}

function jsonResponse(status: number, payload: unknown): ReturnType<BetaReadinessExternalBetaEvidenceCollectorFetch> {
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
