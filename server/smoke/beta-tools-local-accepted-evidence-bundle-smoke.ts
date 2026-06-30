import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import {
  runBetaToolsLocalAcceptedEvidenceBundle,
  type BetaToolsLocalAcceptedEvidenceBundleEnv,
} from '../cli/beta-tools-local-accepted-evidence-bundle'
import type { LibassSyntheticBurninCommandRunner } from '../cli/beta-tools-libass-synthetic-burnin-qa-preflight'

const baseEnv: BetaToolsLocalAcceptedEvidenceBundleEnv = {
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_WORKSPACE_ID: 'workspace-local-accepted-evidence-bundle-smoke',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_PROJECT_ID: 'project-local-accepted-evidence-bundle-smoke',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_ID: 'beta-tools-local-accepted-evidence-bundle-smoke',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_SHA: '1720323b47848465261e3c7c6e3acaf79125c78d',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_NOTES: 'Smoke verifies the local accepted evidence bundle without backend writes.',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CORE_TOOL_IDS: 'hyperframe',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_ACCEPT_PRODUCTION_READINESS: 'true',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE: 'true',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_ACCEPT_PRODUCT_READY_LOCAL_OSS: 'true',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE: 'true',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRE_CORE_ACCEPTED_EVIDENCE: 'true',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRE_LIBASS_ACCEPTED_EVIDENCE: 'true',
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_MODE: 'host',
}

const missingReport = runBetaToolsLocalAcceptedEvidenceBundle({}, () => {
  throw new Error('libass runner must not execute when bundle config is missing')
})
assert.equal(missingReport.ok, false, 'missing config should fail closed')
assert.equal(missingReport.previewOnly, true, 'bundle should always be preview-only')
assert.equal(missingReport.noBackendEvidenceRecorded, true, 'bundle must not record backend evidence')
assert.equal(missingReport.locallyAcceptedToolCount, 0, 'missing config must not accept tools')
assert.ok(
  missingReport.missingConfiguration.some((item) => item.includes('WORKSPACE_ID')),
  'missing workspace should be reported',
)
assert.ok(
  missingReport.nextSafeActions.some((action) => action.includes('beta:tools:core-real-check-evidence-preflight')),
  'bundle should name the deployed core evidence preflight as a next safe action',
)

const readyReport = runBetaToolsLocalAcceptedEvidenceBundle(baseEnv, createFakeLibassRunner())
assert.equal(readyReport.ok, true, 'scoped bundle should pass with bounded core and fake libass evidence')
assert.equal(readyReport.readyToRecordDeployedEvidence, true, 'passing local bundle should be ready for deployed evidence recording')
assert.deepEqual(readyReport.coreAcceptedToolIds, ['hyperframe'], 'bundle should include scoped core accepted evidence')
assert.deepEqual(readyReport.libassAcceptedToolIds, ['libass'], 'bundle should include libass accepted evidence')
assert.deepEqual(readyReport.locallyAcceptedToolIds.sort(), ['hyperframe', 'libass'].sort(), 'bundle should combine unique local accepted tools')
assert.equal(readyReport.locallyAcceptedToolCount, 2, 'bundle should count unique accepted tools')
assert.equal(readyReport.corePreview.previewOnly, true, 'core preview must remain local-only')
assert.equal(readyReport.libassPreview.previewOnly, true, 'libass preview must remain local-only')
assert.equal(readyReport.libassPreview.proof.tempRootRemoved, true, 'libass temp root should be removed')
assert.ok(
  readyReport.remainingGateBlockers.includes('platform_billing_deployment_evidence_pending'),
  'bundle must preserve platform evidence blocker',
)
assert.ok(
  readyReport.remainingGateBlockers.includes('launch_owner_approval_evidence_pending'),
  'bundle must preserve launch approval blocker',
)
assert.equal(JSON.stringify(readyReport).includes('Bearer'), false, 'bundle summary must not include bearer-token text')
assert.equal(JSON.stringify(readyReport).includes('gs://'), false, 'bundle summary must not include private GCS paths')
assert.equal(readyReport.duplicateContext.openDuplicatePrsObserved, 0, 'bundle should preserve duplicate-search result')
assert.deepEqual(readyReport.duplicateContext.historicalContextPrs, [73], 'bundle should preserve historical libass PR context')

const localDefaultsReport = runBetaToolsLocalAcceptedEvidenceBundle({}, createFakeLibassRunner(), {
  localDefaults: true,
  sourceSha: 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
})
assert.equal(localDefaultsReport.ok, true, 'local defaults bundle should pass without manual env')
assert.equal(localDefaultsReport.previewOnly, true, 'local defaults bundle must remain preview-only')
assert.equal(localDefaultsReport.noBackendEvidenceRecorded, true, 'local defaults bundle must not record backend evidence')
assert.equal(localDefaultsReport.localDefaultsApplied, true, 'local defaults bundle should report default application')
assert.ok(
  localDefaultsReport.localDefaultedInputNames.includes('REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_WORKSPACE_ID'),
  'local defaults should fill the workspace ID',
)
assert.equal(
  localDefaultsReport.coreAcceptedToolIds.some((toolId) => toolId === 'libass'),
  false,
  'local defaults should keep libass in the separate QA lane',
)
assert.equal(
  localDefaultsReport.libassPreview.acceptedToolEvidence[0]?.productReadyLocalOss,
  false,
  'local defaults must not claim product-ready local OSS for libass',
)
assert.equal(
  localDefaultsReport.corePreview.previewReport?.acceptedToolIds.includes('signalsmith_stretch'),
  true,
  'local defaults should include the current 15-tool hydrated core scope',
)
assert.equal(
  localDefaultsReport.readyToRecordDeployedEvidence,
  true,
  'local defaults bundle should be ready only for deployed evidence recording',
)
assert.ok(
  localDefaultsReport.remainingGateBlockers.includes('final_operator_status_readback_pending'),
  'local defaults bundle must preserve final operator readback blocker',
)

const secretReport = runBetaToolsLocalAcceptedEvidenceBundle({
  ...baseEnv,
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_NOTES: 'sk-should-not-be-here',
}, createFakeLibassRunner())
assert.equal(secretReport.ok, false, 'secret-like notes should fail closed')
assert.ok(secretReport.secretLikeInputPaths.length > 0, 'secret-like notes should be named')

console.log(JSON.stringify({
  ok: true,
  acceptedToolIds: readyReport.locallyAcceptedToolIds,
  remainingGateBlockers: readyReport.remainingGateBlockers,
  noBackendEvidenceRecorded: readyReport.noBackendEvidenceRecorded,
}, null, 2))

function createFakeLibassRunner(): LibassSyntheticBurninCommandRunner {
  return (command, args) => {
    const dockerImageIndex = command === 'docker' ? args.findIndex((arg) => arg.includes('reeditpro-staging-libass-burnin-validation')) : -1
    const dockerWorkDir = command === 'docker'
      ? args.find((arg) => arg.endsWith(':/work:rw'))?.replace(':/work:rw', '')
      : undefined
    const innerCommand = command === 'docker' && dockerImageIndex >= 0
      ? args[dockerImageIndex + 1]
      : command
    const innerArgs = command === 'docker' && dockerImageIndex >= 0
      ? args.slice(dockerImageIndex + 2)
      : args
    const first = innerCommand
    if (first === 'fc-match') return { stdout: 'sans: DejaVu Sans' }
    if (first === 'ffprobe') return { stdout: '1.000000\n' }
    if (first === 'ffmpeg') {
      const rawOutputPath = innerArgs.at(-1)
      const outputPath = rawOutputPath?.startsWith('/work/') && dockerWorkDir
        ? path.join(dockerWorkDir, rawOutputPath.slice('/work/'.length))
        : rawOutputPath
      if (outputPath) {
        mkdirSync(path.dirname(outputPath), { recursive: true })
        writeFileSync(outputPath, `fake media output for ${innerArgs.join(' ')}`)
      }
      return { stdout: 'ffmpeg fake ok' }
    }
    throw new Error(`unexpected fake libass command ${command} ${args.join(' ')}`)
  }
}
