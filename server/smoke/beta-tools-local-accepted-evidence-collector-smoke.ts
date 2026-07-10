import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { existsSync } from 'node:fs'
import path from 'node:path'
import {
  runBetaToolsLocalAcceptedEvidenceCollectorFromEnv,
  type BetaToolsLocalAcceptedEvidenceCollectorEnv,
  type BetaToolsLocalAcceptedEvidenceCollectorFetch,
} from '../cli/beta-tools-local-accepted-evidence-collector'
import type { LibassSyntheticBurninCommandRunner } from '../cli/beta-tools-libass-synthetic-burnin-qa-preflight'

const baseEnv: BetaToolsLocalAcceptedEvidenceCollectorEnv = {
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_API_BASE_URL: 'https://api.staging.reeditpro.example',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_BEARER_TOKEN: 'local-bundle-bearer-token-secret-for-smoke',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CORE_IDEMPOTENCY_KEY: 'local-bundle-core-evidence-smoke',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_IDEMPOTENCY_KEY: 'local-bundle-libass-evidence-smoke',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_WORKSPACE_ID: 'workspace-local-bundle-collector-smoke',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_PROJECT_ID: 'project-local-bundle-collector-smoke',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_ID: 'beta-tools-local-bundle-collector-smoke',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_SHA: '9b8d512139ebdcca550345ab49087f3faac72267',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_NOTES: 'Smoke records deployed evidence for a local accepted evidence bundle.',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CORE_TOOL_IDS: 'hyperframe',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_ACCEPT_PRODUCTION_READINESS: 'true',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE: 'true',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_ACCEPT_PRODUCT_READY_LOCAL_OSS: 'true',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE: 'true',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRE_CORE_ACCEPTED_EVIDENCE: 'true',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRE_LIBASS_ACCEPTED_EVIDENCE: 'true',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_MODE: 'host',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRE_OPERATOR_READBACK: 'true',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRED_PRODUCT_READY_LOCAL_OSS_COUNT: '2',
  REEDITPRO_READINESS_PYTHON_BIN: findPythonPath(),
}

let fetchShouldNotRun = false
await assert.rejects(
  () => runBetaToolsLocalAcceptedEvidenceCollectorFromEnv({}, async () => {
    fetchShouldNotRun = true
    throw new Error('fetch must not run with missing collector inputs')
  }, fakeLibassRunner()),
  /inputs are incomplete/,
  'collector should fail closed before local proof or deployed calls when config is missing',
)
assert.equal(fetchShouldNotRun, false, 'missing config must not call deployed fetch')

const calls: Array<{ url: string; method: string; idempotencyKey?: string; body?: Record<string, unknown> }> = []
const result = await runBetaToolsLocalAcceptedEvidenceCollectorFromEnv(baseEnv, fakeFetch(calls), fakeLibassRunner())
assert.equal(result.ok, true, 'collector should pass with accepted core/libass evidence and operator readback')
assert.equal(result.endpointBaseUrl, 'https://api.staging.reeditpro.example', 'collector should normalize API base URL')
assert.equal(result.noBackendEvidenceRecorded, false, 'collector is the deployed evidence recording step')
assert.deepEqual(result.localBundle.locallyAcceptedToolIds.sort(), ['hyperframe', 'libass'].sort(), 'collector should use local bundle accepted tools')
assert.equal(result.coreEvidence.acceptedToolCount, 1, 'collector should record one scoped core tool in smoke')
assert.deepEqual(result.coreEvidence.acceptedToolIds, ['hyperframe'], 'collector should read back scoped core evidence')
assert.deepEqual(result.libassEvidence.acceptedToolIds, ['libass'], 'collector should read back libass evidence')
assert.equal(result.operatorReadback.currentGate.productReadyLocalOssCount, 2, 'operator readback should confirm combined tool count')
assert.equal(result.readbackRequirements.productReadyLocalOssCountSatisfied, true, 'readback requirement should be satisfied')
assert.equal(result.operatorReadback.currentGate.externalBetaToolExecutionAllowed, false, 'collector must not claim external beta tool execution is enabled')
assert.equal(result.operatorReadback.currentGate.productionToolExecutionAllowed, false, 'collector must not claim production tool execution is enabled')
assert.ok(result.remainingGateBlockers.includes('platform_billing_deployment_evidence_pending'), 'collector must preserve platform evidence blocker')
assert.ok(result.remainingGateBlockers.includes('launch_owner_approval_evidence_pending'), 'collector must preserve launch approval blocker')
assert.equal(JSON.stringify(result).includes('local-bundle-bearer-token-secret-for-smoke'), false, 'summary must not print bearer token')

assert.equal(calls.length, 3, 'collector should make core POST, libass POST, and status GET calls')
assert.equal(calls[0]?.url, 'https://api.staging.reeditpro.example/v1/beta-readiness/evidence/core-real-check')
assert.equal(calls[0]?.method, 'POST')
assert.equal(calls[0]?.idempotencyKey, 'local-bundle-core-evidence-smoke')
assert.equal(calls[1]?.url, 'https://api.staging.reeditpro.example/v1/beta-readiness/evidence')
assert.equal(calls[1]?.method, 'POST')
assert.equal(calls[1]?.idempotencyKey, 'local-bundle-libass-evidence-smoke')
assert.equal(calls[2]?.url, 'https://api.staging.reeditpro.example/v1/beta-readiness/operator-status?workspaceId=workspace-local-bundle-collector-smoke')
assert.equal(calls[2]?.method, 'GET')

await assert.rejects(
  () => runBetaToolsLocalAcceptedEvidenceCollectorFromEnv({
    ...baseEnv,
    REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRED_PRODUCT_READY_LOCAL_OSS_COUNT: '3',
  }, fakeFetch([]), fakeLibassRunner()),
  /below required count 3/,
  'collector should fail closed when operator readback is below the required count',
)

await assert.rejects(
  () => runBetaToolsLocalAcceptedEvidenceCollectorFromEnv({
    ...baseEnv,
    REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_NOTES: 'Bearer should-not-be-here',
  }, fakeFetch([]), fakeLibassRunner()),
  /secret-like|incomplete/,
  'collector should reject secret-like notes before deployed calls',
)

console.log(JSON.stringify({
  ok: true,
  localAcceptedToolIds: result.localBundle.locallyAcceptedToolIds,
  productReadyLocalOssCount: result.operatorReadback.currentGate.productReadyLocalOssCount,
  calls: calls.map((call) => ({ url: call.url, method: call.method, idempotencyKey: call.idempotencyKey })),
  tokenInSummary: JSON.stringify(result).includes('local-bundle-bearer-token-secret-for-smoke'),
}, null, 2))

function fakeFetch(calls: Array<{ url: string; method: string; idempotencyKey?: string; body?: Record<string, unknown> }>): BetaToolsLocalAcceptedEvidenceCollectorFetch {
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
              productReadyLocalOssCount: 1,
              externalBetaToolExecutionAllowed: false,
              productionToolExecutionAllowed: false,
              blockers: [],
              platformBlockers: [{ blockerId: 'production_billing_deployment_unverified' }],
            },
          },
        },
        warnings: ['Fake core evidence response; no remote backend was contacted.'],
      })
    }

    if (init.method === 'POST' && url.endsWith('/v1/beta-readiness/evidence')) {
      return jsonResponse(201, {
        ok: true,
        data: {
          replayed: false,
          packet: {
            id: 'beta-readiness-evidence-local-bundle-libass-smoke',
            evidence: body,
          },
          report: {
            toolExecutionReadiness: {
              productReadyLocalOssCount: 2,
              externalBetaToolExecutionAllowed: false,
              productionToolExecutionAllowed: false,
            },
          },
        },
        warnings: ['Fake libass evidence response; no remote backend was contacted.'],
      })
    }

    if (init.method === 'GET' && url.includes('/v1/beta-readiness/operator-status')) {
      return jsonResponse(200, {
        ok: true,
        data: {
          status: {
            evidenceSource: 'stored_workspace_evidence',
            workspaceId: 'workspace-local-bundle-collector-smoke',
            evidencePacketCount: 2,
            readyForExternalBeta: false,
            readyForRealUserMediaBeta: false,
            readyForPaidProduction: false,
            currentGate: {
              totalTools: 49,
              ownerCoverageToolCount: 49,
              readinessSpecToolCount: 49,
              toolBlockers: 168,
              platformBlockers: 1,
              productReadyLocalOssCount: 2,
              externalBetaToolExecutionAllowed: false,
              productionToolExecutionAllowed: false,
              blockerPolicy: 'evidence_driven_block_unsafe_actions_only',
              safeBlockerReductionAllowed: true,
              blockedActionScope: ['external_beta_tool_execution', 'paid_production_tool_execution'],
              allowedForwardProgressScopes: ['deployment_preflight_and_platform_evidence_collection'],
            },
            evidenceGaps: {
              goNoGoBlockers: ['platform_billing_deployment_unverified'],
              blockedChecklistItems: [],
              toolBlockers: 168,
              platformBlockers: ['production_billing_deployment_unverified'],
            },
            nextActions: ['Record platform evidence and launch approvals before external beta.'],
            warnings: ['Fake operator status response; no remote backend was contacted.'],
          },
        },
      })
    }

    throw new Error(`unexpected fetch ${init.method} ${url}`)
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
        writeFileSync(outputPath, `fake local bundle collector media for ${args.join(' ')}`)
      }
      return { stdout: 'ffmpeg fake ok' }
    }
    throw new Error(`unexpected command ${command} ${args.join(' ')}`)
  }
}

function jsonResponse(status: number, payload: unknown): ReturnType<BetaToolsLocalAcceptedEvidenceCollectorFetch> {
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
