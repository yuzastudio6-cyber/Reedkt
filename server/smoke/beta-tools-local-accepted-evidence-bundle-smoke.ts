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
    const first = command
    if (first === 'fc-match') return { stdout: 'sans: DejaVu Sans' }
    if (first === 'ffprobe') return { stdout: '1.000000\n' }
    if (first === 'ffmpeg') {
      const outputPath = args.at(-1)
      if (outputPath) {
        mkdirSync(path.dirname(outputPath), { recursive: true })
        writeFileSync(outputPath, `fake media output for ${args.join(' ')}`)
      }
      return { stdout: 'ffmpeg fake ok' }
    }
    throw new Error(`unexpected fake libass command ${command} ${args.join(' ')}`)
  }
}
