import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import {
  runBetaToolsLibassSyntheticBurninQaPreflight,
  type BetaToolsLibassSyntheticBurninQaPreflightEnv,
  type LibassSyntheticBurninCommandRunner,
} from '../cli/beta-tools-libass-synthetic-burnin-qa-preflight'

const baseEnv: BetaToolsLibassSyntheticBurninQaPreflightEnv = {
  REEDITPRO_BETA_LIBASS_BURNIN_QA_WORKSPACE_ID: 'workspace-libass-burnin-qa-smoke',
  REEDITPRO_BETA_LIBASS_BURNIN_QA_PROJECT_ID: 'project-libass-burnin-qa-smoke',
  REEDITPRO_BETA_LIBASS_BURNIN_QA_SOURCE_ID: 'beta-tools-libass-burnin-qa-smoke',
  REEDITPRO_BETA_LIBASS_BURNIN_QA_SOURCE_SHA: 'a0601e2a35bfc8ca68f9ce5b121037b1592807be',
  REEDITPRO_BETA_LIBASS_BURNIN_QA_NOTES: 'Smoke proves bounded synthetic libass burn-in QA.',
  REEDITPRO_BETA_LIBASS_BURNIN_QA_ACCEPT_PRODUCTION_READINESS: 'true',
  REEDITPRO_BETA_LIBASS_BURNIN_QA_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE: 'true',
  REEDITPRO_BETA_LIBASS_BURNIN_QA_ACCEPT_PRODUCT_READY_LOCAL_OSS: 'true',
  REEDITPRO_BETA_LIBASS_BURNIN_QA_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE: 'true',
  REEDITPRO_BETA_LIBASS_BURNIN_QA_REQUIRE_ACCEPTED_EVIDENCE: 'true',
}

const missingReport = runBetaToolsLibassSyntheticBurninQaPreflight({}, () => {
  throw new Error('runner must not execute with missing config')
})
assert.equal(missingReport.ok, false, 'missing config should fail closed')
assert.equal(missingReport.acceptedToolEvidence.length, 0, 'missing config must not produce accepted evidence')
assert.ok(
  missingReport.missingConfiguration.includes('REEDITPRO_BETA_LIBASS_BURNIN_QA_WORKSPACE_ID is required.'),
  'missing workspace should be named',
)
assert.equal(missingReport.duplicateContext.openHistoricalPr, 73, 'report should preserve PR #73 duplicate-adjacent context')

const hostRunner = createFakeRunner()
const hostReport = runBetaToolsLibassSyntheticBurninQaPreflight(baseEnv, hostRunner)
assert.equal(hostReport.ok, true, 'host synthetic burn-in QA should pass with fake runner')
assert.equal(hostReport.readyToRecordAcceptedEvidence, true, 'passing QA should be recordable as accepted evidence')
assert.equal(hostReport.proof.mode, 'host', 'default mode should be host')
assert.equal(hostReport.proof.noPrivateOrUserMedia, true, 'proof must stay synthetic-only')
assert.equal(hostReport.proof.tempRootRemoved, true, 'temp root must be removed')
assert.equal(hostReport.proof.captionFile.safeStylePresetAccepted, true, 'safe ASS style must be accepted')
assert.equal(hostReport.proof.outputVideo.exists, true, 'burn-in output should be observed')
assert.equal(hostReport.proof.outputVideo.durationSeconds, 1, 'decode probe duration should be recorded')
assert.deepEqual(
  hostReport.wouldReduceBlockers,
  ['real_execution_not_verified', 'production_readiness_blocked', 'product_ready_acceptance_missing'],
  'passing QA should name all reduced libass blockers',
)
assert.equal(hostReport.acceptedToolEvidence[0]?.toolId, 'libass', 'accepted evidence should target libass')
assert.equal(hostReport.acceptedToolEvidence[0]?.productReadyLocalOss, true, 'synthetic QA with explicit acceptance can mark libass product-ready local OSS')
assert.equal(JSON.stringify(hostReport).includes('gs://'), false, 'report must not contain private GCS artifact paths')

let dockerArgs: string[] = []
const dockerRunner = createFakeRunner((command, args) => {
  if (command === 'docker') dockerArgs = args
})
const dockerReport = runBetaToolsLibassSyntheticBurninQaPreflight({
  ...baseEnv,
  REEDITPRO_BETA_LIBASS_BURNIN_QA_MODE: 'docker',
  REEDITPRO_BETA_LIBASS_BURNIN_QA_CONTAINER_IMAGE: 'reeditpro-render-worker:libass-burnin-qa-smoke',
}, dockerRunner)
assert.equal(dockerReport.ok, true, 'docker synthetic burn-in QA should pass with fake runner')
assert.equal(dockerReport.proof.noNetwork, true, 'docker proof must be network disabled')
assert.deepEqual(dockerArgs.slice(0, 4), ['run', '--rm', '--network', 'none'], 'docker mode must use --network none')
assert.ok(dockerArgs.includes('reeditpro-render-worker:libass-burnin-qa-smoke'), 'docker mode should use supplied image')
assert.ok(dockerArgs.some((arg) => arg.endsWith(':/work:rw')), 'docker mode should mount only the temp work root')

const noAcceptanceReport = runBetaToolsLibassSyntheticBurninQaPreflight({
  ...baseEnv,
  REEDITPRO_BETA_LIBASS_BURNIN_QA_ACCEPT_PRODUCT_READY_LOCAL_OSS: 'false',
}, createFakeRunner())
assert.equal(noAcceptanceReport.ok, false, 'missing product-ready acceptance should fail closed')
assert.equal(noAcceptanceReport.acceptedToolEvidence.length, 0, 'missing product-ready acceptance must not produce evidence')
assert.ok(
  noAcceptanceReport.confirmationGaps.some((gap) => gap.includes('ACCEPT_PRODUCT_READY_LOCAL_OSS')),
  'product-ready acceptance gap should be named',
)

const failingRunner = createFakeRunner((_command, args) => {
  if (args.includes('subtitles=') || args.some((arg) => arg.startsWith('subtitles='))) {
    throw new Error('libass burn-in failed')
  }
})
const failingReport = runBetaToolsLibassSyntheticBurninQaPreflight(baseEnv, failingRunner)
assert.equal(failingReport.ok, false, 'burn-in failure should fail closed')
assert.equal(failingReport.acceptedToolEvidence.length, 0, 'failed burn-in must not produce accepted evidence')
assert.equal(failingReport.proof.tempRootRemoved, true, 'failed run should still clean temp root')

console.log(JSON.stringify({
  ok: true,
  hostAccepted: hostReport.readyToRecordAcceptedEvidence,
  dockerNetworkDisabled: dockerReport.proof.noNetwork,
  productReadyLocalOssAccepted: hostReport.acceptedToolEvidence[0]?.productReadyLocalOss,
  historicalDuplicateContext: hostReport.duplicateContext.openHistoricalPr,
}, null, 2))

function createFakeRunner(
  observe?: (command: string, args: string[]) => void,
): LibassSyntheticBurninCommandRunner {
  return (command, args) => {
    observe?.(command, args)
    const mapped = mapCommand(command, args)
    const inner = mapped.innerArgs
    const first = inner[0]

    if (first === 'fc-match') {
      return { stdout: 'sans: DejaVu Sans' }
    }
    if (first === 'ffprobe') {
      return { stdout: '1.000000\n' }
    }
    if (first === 'ffmpeg') {
      const outputPath = mapped.hostPathFor(inner.at(-1) ?? '')
      if (outputPath) {
        mkdirSync(path.dirname(outputPath), { recursive: true })
        writeFileSync(outputPath, `fake media output for ${inner.join(' ')}`)
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
