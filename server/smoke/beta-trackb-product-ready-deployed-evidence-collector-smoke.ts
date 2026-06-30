import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import {
  runBetaTrackBProductReadyDeployedEvidenceCollectorFromEnv,
  type BetaTrackBProductReadyDeployedEvidenceCollectorEnv,
} from '../cli/beta-trackb-product-ready-deployed-evidence-collector'
import type { BetaToolsLocalAcceptedEvidenceCollectorFetch } from '../cli/beta-tools-local-accepted-evidence-collector'
import type { LibassSyntheticBurninCommandRunner } from '../cli/beta-tools-libass-synthetic-burnin-qa-preflight'

const baseEnv: BetaTrackBProductReadyDeployedEvidenceCollectorEnv = {
  REEDITPRO_BETA_TRACKB_PRODUCT_READY_CONFIRM_DEPLOYED_EVIDENCE_SEQUENCE: 'true',
  REEDITPRO_BETA_TRACKB_PRODUCT_READY_API_BASE_URL: 'https://api.staging.reeditpro.example',
  REEDITPRO_BETA_TRACKB_PRODUCT_READY_BEARER_TOKEN: 'trackb-product-ready-bearer-secret-for-smoke',
  REEDITPRO_BETA_TRACKB_PRODUCT_READY_WORKSPACE_ID: 'workspace-trackb-product-ready-smoke',
  REEDITPRO_BETA_TRACKB_PRODUCT_READY_PROJECT_ID: 'project-trackb-product-ready-smoke',
  REEDITPRO_BETA_TRACKB_PRODUCT_READY_SOURCE_SHA: '00433c268df6b70d39156dc68ddf50f9e8ade7f2',
  REEDITPRO_BETA_TRACKB_PRODUCT_READY_CORE_IDEMPOTENCY_KEY: 'trackb-product-ready-core-smoke',
  REEDITPRO_BETA_TRACKB_PRODUCT_READY_LIBASS_IDEMPOTENCY_KEY: 'trackb-product-ready-libass-smoke',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CORE_TOOL_IDS: 'hyperframe',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_MODE: 'host',
  REEDITPRO_READINESS_PYTHON_BIN: findPythonPath(),
}

let fetchCalledWithoutConfirmation = false
await assert.rejects(
  () => runBetaTrackBProductReadyDeployedEvidenceCollectorFromEnv({
    ...baseEnv,
    REEDITPRO_BETA_TRACKB_PRODUCT_READY_CONFIRM_DEPLOYED_EVIDENCE_SEQUENCE: undefined,
  }, async () => {
    fetchCalledWithoutConfirmation = true
    throw new Error('fetch must not run without product-ready confirmation')
  }, fakeLibassRunner()),
  /CONFIRM_DEPLOYED_EVIDENCE_SEQUENCE=true/,
)
assert.equal(fetchCalledWithoutConfirmation, false, 'missing product-ready confirmation must stop before deployed fetch')

const calls: Array<{ url: string; method: string; idempotencyKey?: string; body?: Record<string, unknown> }> = []
const result = await runBetaTrackBProductReadyDeployedEvidenceCollectorFromEnv(
  baseEnv,
  fakeFetch(calls, 16),
  fakeLibassRunner(),
)

assert.equal(result.ok, true)
assert.equal(result.decision, 'beta_trackb_product_ready_deployed_evidence_collector_passed_product_ready_readback_16')
assert.equal(result.sourceReconciliation.productReadyCloseoutPr, 987)
assert.equal(result.sourceReconciliation.trackBProductReadySourceCount, 16)
assert.equal(result.sourceReconciliation.activeBetaProductReadyDeployedEvidenceCount, 0)
assert.equal(result.readbackRequirements.requiredProductReadyLocalOssCount, 16)
assert.equal(result.readbackRequirements.readbackProductReadyLocalOssCount, 16)
assert.equal(result.readbackRequirements.productReadyLocalOssCountSatisfied, true)
assert.equal(result.toolEvidence.localBundle.locallyAcceptedToolIds.includes('libass'), true)
assert.equal(result.toolEvidence.operatorReadback.currentGate.externalBetaToolExecutionAllowed, false)
assert.equal(result.toolEvidence.operatorReadback.currentGate.productionToolExecutionAllowed, false)
assert.equal(calls[0]?.body?.acceptProductReadyLocalOss, true, 'core evidence must request product-ready local OSS acceptance')
assert.equal(calls[0]?.body?.acceptProductionReadiness, true, 'core evidence must keep production-readiness acceptance explicit')
assert.equal(
  ((calls[1]?.body?.acceptedToolEvidence as Array<{ productReadyLocalOss?: boolean }> | undefined) ?? [])[0]?.productReadyLocalOss,
  true,
  'libass evidence must request product-ready local OSS acceptance',
)
assert.equal(JSON.stringify(result).includes('trackb-product-ready-bearer-secret-for-smoke'), false)

await assert.rejects(
  () => runBetaTrackBProductReadyDeployedEvidenceCollectorFromEnv(
    baseEnv,
    fakeFetch([], 15),
    fakeLibassRunner(),
  ),
  /below required count 16/,
  'product-ready deployed evidence collector must fail closed below readback count 16',
)

console.log(JSON.stringify({
  ok: result.ok,
  decision: result.decision,
  productReadySourceCount: result.sourceReconciliation.trackBProductReadySourceCount,
  productReadyReadbackCount: result.readbackRequirements.readbackProductReadyLocalOssCount,
  calls: calls.map((call) => ({ url: call.url, method: call.method, idempotencyKey: call.idempotencyKey })),
}, null, 2))

function fakeFetch(
  calls: Array<{ url: string; method: string; idempotencyKey?: string; body?: Record<string, unknown> }>,
  productReadyReadbackCount: number,
): BetaToolsLocalAcceptedEvidenceCollectorFetch {
  return async (url, init) => {
    const body = init.body ? JSON.parse(init.body) as Record<string, unknown> : undefined
    calls.push({ url, method: init.method, idempotencyKey: init.headers['idempotency-key'], body })

    if (init.method === 'POST' && url.endsWith('/v1/beta-readiness/evidence/core-real-check')) {
      return jsonResponse(201, {
        ok: true,
        data: {
          acceptedToolEvidence: [{ toolId: 'hyperframe', productReadyLocalOss: true }],
          skippedToolResults: [],
          report: {
            toolExecutionReadiness: {
              productReadyLocalOssCount: productReadyReadbackCount,
              externalBetaToolExecutionAllowed: false,
              productionToolExecutionAllowed: false,
            },
          },
        },
      })
    }

    if (init.method === 'POST' && url.endsWith('/v1/beta-readiness/evidence')) {
      return jsonResponse(201, {
        ok: true,
        data: {
          replayed: false,
          packet: {
            id: 'trackb-product-ready-libass-evidence-smoke',
            evidence: body,
          },
          report: {
            toolExecutionReadiness: {
              productReadyLocalOssCount: productReadyReadbackCount,
              externalBetaToolExecutionAllowed: false,
              productionToolExecutionAllowed: false,
            },
          },
        },
      })
    }

    if (init.method === 'GET' && url.includes('/v1/beta-readiness/operator-status')) {
      return jsonResponse(200, {
        ok: true,
        data: {
          status: {
            evidenceSource: 'stored_workspace_evidence',
            workspaceId: 'workspace-trackb-product-ready-smoke',
            evidencePacketCount: 2,
            readyForExternalBeta: false,
            readyForRealUserMediaBeta: false,
            readyForPaidProduction: false,
            currentGate: {
              totalTools: 49,
              ownerCoverageToolCount: 49,
              readinessSpecToolCount: 49,
              toolBlockers: 136,
              platformBlockers: 1,
              productReadyLocalOssCount: productReadyReadbackCount,
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
              toolBlockers: 136,
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
        writeFileSync(outputPath, `fake Track B product-ready media for ${args.join(' ')}`)
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
