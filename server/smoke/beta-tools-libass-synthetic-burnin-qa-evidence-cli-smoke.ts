import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import {
  runBetaToolsLibassSyntheticBurninQaEvidenceFromEnv,
  type LibassSyntheticBurninQaEvidenceFetch,
} from '../cli/beta-tools-libass-synthetic-burnin-qa-evidence'
import type { BetaToolsLibassSyntheticBurninQaEvidenceEnv } from '../cli/beta-tools-libass-synthetic-burnin-qa-evidence-preflight'
import type { LibassSyntheticBurninCommandRunner } from '../cli/beta-tools-libass-synthetic-burnin-qa-preflight'

const env: BetaToolsLibassSyntheticBurninQaEvidenceEnv = {
  REEDITPRO_BETA_LIBASS_BURNIN_QA_API_BASE_URL: 'https://api.staging.reeditpro.example',
  REEDITPRO_BETA_LIBASS_BURNIN_QA_BEARER_TOKEN: 'libass-burnin-qa-bearer-token-secret-for-smoke',
  REEDITPRO_BETA_LIBASS_BURNIN_QA_IDEMPOTENCY_KEY: 'libass-burnin-qa-evidence-smoke',
  REEDITPRO_BETA_LIBASS_BURNIN_QA_WORKSPACE_ID: 'workspace-libass-burnin-qa-evidence-smoke',
  REEDITPRO_BETA_LIBASS_BURNIN_QA_PROJECT_ID: 'project-libass-burnin-qa-evidence-smoke',
  REEDITPRO_BETA_LIBASS_BURNIN_QA_SOURCE_ID: 'beta-tools-libass-burnin-qa-evidence-smoke',
  REEDITPRO_BETA_LIBASS_BURNIN_QA_SOURCE_SHA: 'bfdd73f8fadfe9b7a5d38a1ddd78f689edaf4c9c',
  REEDITPRO_BETA_LIBASS_BURNIN_QA_NOTES: 'Smoke records bounded libass synthetic burn-in QA evidence.',
  REEDITPRO_BETA_LIBASS_BURNIN_QA_MODE: 'docker',
  REEDITPRO_BETA_LIBASS_BURNIN_QA_CONTAINER_IMAGE: 'reeditpro-render-worker:libass-burnin-qa-evidence-smoke',
  REEDITPRO_BETA_LIBASS_BURNIN_QA_ACCEPT_PRODUCTION_READINESS: 'true',
  REEDITPRO_BETA_LIBASS_BURNIN_QA_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE: 'true',
  REEDITPRO_BETA_LIBASS_BURNIN_QA_ACCEPT_PRODUCT_READY_LOCAL_OSS: 'true',
  REEDITPRO_BETA_LIBASS_BURNIN_QA_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE: 'true',
  REEDITPRO_BETA_LIBASS_BURNIN_QA_REQUIRE_ACCEPTED_EVIDENCE: 'true',
  REEDITPRO_BETA_LIBASS_BURNIN_QA_REQUIRE_RECORDED_EVIDENCE: 'true',
}

let postedUrl = ''
let postedHeaders: Record<string, string> = {}
let postedBody: Record<string, unknown> = {}

const result = await runBetaToolsLibassSyntheticBurninQaEvidenceFromEnv(env, fakeFetch(), fakeRunner())
assert.equal(result.ok, true, 'collector should report successful backend response')
assert.equal(result.status, 201, 'collector should preserve backend status')
assert.equal(result.endpoint, 'https://api.staging.reeditpro.example/v1/beta-readiness/evidence', 'collector should call generic evidence endpoint')
assert.equal(postedUrl, result.endpoint, 'collector should post to summarized endpoint')
assert.equal(postedHeaders.authorization, 'Bearer libass-burnin-qa-bearer-token-secret-for-smoke', 'collector should send bearer token only in auth header')
assert.equal(postedHeaders['idempotency-key'], 'libass-burnin-qa-evidence-smoke', 'collector should include idempotency key')
assert.equal(JSON.stringify(result).includes('libass-burnin-qa-bearer-token-secret-for-smoke'), false, 'summary must not print bearer token')
assert.equal(postedBody.workspaceId, 'workspace-libass-burnin-qa-evidence-smoke', 'collector should preserve workspace ID')
assert.equal(Array.isArray(postedBody.acceptedToolEvidence), true, 'collector should post accepted tool evidence')
assert.equal((postedBody.acceptedToolEvidence as Array<{ toolId: string }>)[0]?.toolId, 'libass', 'collector should post libass evidence')
assert.equal(result.acceptedToolIds.includes('libass'), true, 'collector should read back libass evidence')
assert.equal(result.acceptedToolCount, 1, 'collector should summarize one accepted tool')
assert.equal(result.proof.tempRootRemoved, true, 'collector should clean temp root after proof')
assert.equal(result.proof.burninCommandOk, true, 'collector should run burn-in proof before posting')
assert.equal(result.proof.decodeProbeOk, true, 'collector should run decode probe before posting')
assert.equal(result.toolExecution.productReadyLocalOssCount, 1, 'collector should summarize updated readiness report')

await assert.rejects(
  () => runBetaToolsLibassSyntheticBurninQaEvidenceFromEnv({
    ...env,
    REEDITPRO_BETA_LIBASS_BURNIN_QA_ACCEPT_PRODUCT_READY_LOCAL_OSS: 'false',
  }, fakeFetch(), fakeRunner()),
  /inputs are incomplete/,
  'collector should fail before proof/posting when product-ready acceptance is missing',
)

await assert.rejects(
  () => runBetaToolsLibassSyntheticBurninQaEvidenceFromEnv(env, fakeFetch({ omitLibassReadback: true }), fakeRunner()),
  /did not include accepted libass evidence/,
  'collector should fail closed when deployed readback omits libass evidence',
)

console.log(JSON.stringify({
  ok: true,
  acceptedToolIds: result.acceptedToolIds,
  productReadyLocalOssCount: result.toolExecution.productReadyLocalOssCount,
  tempRootRemoved: result.proof.tempRootRemoved,
  tokenInSummary: JSON.stringify(result).includes('bearer-token-secret-for-smoke'),
}, null, 2))

function fakeFetch(options: { omitLibassReadback?: boolean } = {}): LibassSyntheticBurninQaEvidenceFetch {
  return async (url, init) => {
    postedUrl = url
    postedHeaders = init.headers
    postedBody = JSON.parse(init.body) as Record<string, unknown>
    const acceptedToolEvidence = options.omitLibassReadback ? [] : postedBody.acceptedToolEvidence
    return {
      status: 201,
      async json() {
        return {
          ok: true,
          data: {
            replayed: false,
            packet: {
              id: 'beta-readiness-evidence-packet-libass-smoke',
              evidence: {
                ...postedBody,
                acceptedToolEvidence,
              },
            },
            report: {
              toolExecutionReadiness: {
                productReadyLocalOssCount: options.omitLibassReadback ? 0 : 1,
                externalBetaToolExecutionAllowed: false,
                productionToolExecutionAllowed: false,
                blockers: [],
                platformBlockers: [{}],
              },
            },
          },
          warnings: ['Smoke backend response; no remote backend was contacted.'],
        }
      },
    }
  }
}

function fakeRunner(): LibassSyntheticBurninCommandRunner {
  return (command, args) => {
    const mapped = mapCommand(command, args)
    const inner = mapped.innerArgs
    const first = inner[0]

    if (first === 'fc-match') return { stdout: 'DejaVuSans.ttf: DejaVu Sans' }
    if (first === 'ffprobe') return { stdout: '1.000000\n' }
    if (first === 'ffmpeg') {
      const outputPath = mapped.hostPathFor(inner.at(-1) ?? '')
      if (outputPath) {
        mkdirSync(path.dirname(outputPath), { recursive: true })
        writeFileSync(outputPath, `fake libass evidence media for ${inner.join(' ')}`)
      }
      return { stdout: 'ffmpeg fake ok' }
    }

    throw new Error(`unexpected command ${command} ${args.join(' ')}`)
  }
}

function mapCommand(command: string, args: string[]): {
  innerArgs: string[]
  hostPathFor: (value: string) => string | undefined
} {
  if (command !== 'docker') {
    return {
      innerArgs: [command, ...args],
      hostPathFor: (value) => value.startsWith('/') ? value : undefined,
    }
  }

  const volume = args[args.indexOf('-v') + 1] ?? ''
  const hostRoot = volume.split(':')[0] ?? ''
  const imageIndex = args.findIndex((arg) => arg.startsWith('reeditpro-'))
  const innerArgs = args.slice(imageIndex + 1)
  return {
    innerArgs,
    hostPathFor: (value) => value.startsWith('/work/')
      ? path.join(hostRoot, value.slice('/work/'.length))
      : undefined,
  }
}
