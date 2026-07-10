import assert from 'node:assert/strict'
import {
  runBetaToolsLibassContainerProofPreflight,
  type BetaToolsLibassContainerProofPreflightEnv,
  type LibassProofCommandRunner,
} from '../cli/beta-tools-libass-container-proof-preflight'

const baseEnv: BetaToolsLibassContainerProofPreflightEnv = {
  REEDITPRO_BETA_LIBASS_PROOF_WORKSPACE_ID: 'workspace-libass-proof-smoke',
  REEDITPRO_BETA_LIBASS_PROOF_PROJECT_ID: 'project-libass-proof-smoke',
  REEDITPRO_BETA_LIBASS_PROOF_SOURCE_ID: 'beta-tools-libass-proof-smoke',
  REEDITPRO_BETA_LIBASS_PROOF_SOURCE_SHA: '08f015e986336a2e14cd2dca3d771a0c3d203e80',
  REEDITPRO_BETA_LIBASS_PROOF_NOTES: 'Smoke proves bounded libass filter inspection.',
  REEDITPRO_BETA_LIBASS_PROOF_ACCEPT_PRODUCTION_READINESS: 'true',
  REEDITPRO_BETA_LIBASS_PROOF_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE: 'true',
  REEDITPRO_BETA_LIBASS_PROOF_REQUIRE_ACCEPTED_EVIDENCE: 'true',
}

const missingReport = runBetaToolsLibassContainerProofPreflight({}, () => {
  throw new Error('command must not run when configuration is missing')
})
assert.equal(missingReport.ok, false, 'missing configuration should fail closed')
assert.ok(missingReport.missingConfiguration.includes('REEDITPRO_BETA_LIBASS_PROOF_WORKSPACE_ID is required.'), 'missing workspace should be named')
assert.equal(missingReport.acceptedToolEvidence.length, 0, 'missing configuration must not produce evidence')

const passingFilterOutput = `
Filters:
 ... ass               V->V       Render ASS subtitles onto input video using the libass library.
 ... subtitles         V->V       Render text subtitles onto input video using the libass library.
`
const hostRunner: LibassProofCommandRunner = (command, args) => {
  assert.equal(command, 'ffmpeg', 'host mode should run ffmpeg directly')
  assert.deepEqual(args, ['-hide_banner', '-filters'], 'host mode should inspect filters only')
  return { stdout: passingFilterOutput }
}
const hostReport = runBetaToolsLibassContainerProofPreflight(baseEnv, hostRunner)
assert.equal(hostReport.ok, true, 'host filter proof should pass with ass/subtitles filters')
assert.equal(hostReport.readyToRecordAcceptedEvidence, true, 'passing proof should be recordable as accepted evidence')
assert.equal(hostReport.proof.hasAssFilter, true, 'proof should detect ass filter')
assert.equal(hostReport.proof.hasSubtitlesFilter, true, 'proof should detect subtitles filter')
assert.equal(hostReport.acceptedToolEvidence.length, 1, 'passing proof should produce one libass evidence item')
assert.equal(hostReport.acceptedToolEvidence[0]?.toolId, 'libass', 'evidence should target libass only')
assert.equal(hostReport.acceptedToolEvidence[0]?.productionReadinessAccepted, true, 'evidence should reduce production-readiness blocker')
assert.equal(hostReport.acceptedToolEvidence[0]?.productReadyLocalOss, false, 'filter proof alone must not claim product-ready local OSS')
assert.deepEqual(hostReport.wouldReduceBlockers, ['real_execution_not_verified', 'production_readiness_blocked'], 'proof should name reduced blockers')
assert.ok(hostReport.remainingBlockers.includes('product_ready_acceptance_missing'), 'product-ready QA must remain a blocker')
assert.equal(hostReport.evidencePacket?.workspaceId, 'workspace-libass-proof-smoke', 'evidence packet should preserve workspace')
assert.equal(JSON.stringify(hostReport).includes('Smoke proves bounded libass filter inspection.'), true, 'non-secret note should be preserved')

const noFilterRunner: LibassProofCommandRunner = () => ({ stdout: 'Filters:\n ... scale V->V Scale the input video size.\n' })
const noFilterReport = runBetaToolsLibassContainerProofPreflight(baseEnv, noFilterRunner)
assert.equal(noFilterReport.ok, false, 'missing subtitle filters should fail closed')
assert.equal(noFilterReport.acceptedToolEvidence.length, 0, 'missing subtitle filters must not produce evidence')
assert.equal(noFilterReport.proof.hasAssFilter, false, 'missing output should not detect ass')
assert.ok(noFilterReport.nextSafeAction.includes('approved render/tool-readiness container image'), 'failed proof should name container proof next action')

let dockerCommand = ''
let dockerArgs: string[] = []
const dockerRunner: LibassProofCommandRunner = (command, args) => {
  dockerCommand = command
  dockerArgs = args
  return { stdout: passingFilterOutput }
}
const dockerReport = runBetaToolsLibassContainerProofPreflight({
  ...baseEnv,
  REEDITPRO_BETA_LIBASS_PROOF_MODE: 'docker',
  REEDITPRO_BETA_LIBASS_PROOF_CONTAINER_IMAGE: 'reeditpro-render-worker:libass-proof-smoke',
}, dockerRunner)
assert.equal(dockerReport.ok, true, 'docker filter proof should pass with injected filter output')
assert.equal(dockerCommand, 'docker', 'docker mode should invoke docker')
assert.deepEqual(
  dockerArgs.slice(0, 5),
  ['run', '--rm', '--network', 'none', 'reeditpro-render-worker:libass-proof-smoke'],
  'docker mode must run without network and without mounts',
)
assert.deepEqual(dockerArgs.slice(-3), ['ffmpeg', '-hide_banner', '-filters'], 'docker mode should inspect filters only')
assert.equal(dockerReport.proof.containerImage, 'reeditpro-render-worker:libass-proof-smoke', 'docker report should preserve image')

const productReadyAttempt = runBetaToolsLibassContainerProofPreflight({
  ...baseEnv,
  REEDITPRO_BETA_LIBASS_PROOF_ACCEPT_PRODUCT_READY_LOCAL_OSS: 'true',
}, hostRunner)
assert.equal(productReadyAttempt.ok, false, 'product-ready acceptance must be rejected by this preflight')
assert.ok(
  productReadyAttempt.confirmationGaps.some((gap) => gap.includes('cannot accept product-ready local OSS')),
  'product-ready rejection should point to later caption burn-in/font QA',
)

console.log(JSON.stringify({
  ok: true,
  hostReadyToRecordAcceptedEvidence: hostReport.readyToRecordAcceptedEvidence,
  dockerNetworkDisabled: dockerArgs.includes('none'),
  productReadyLocalOssAccepted: hostReport.acceptedToolEvidence[0]?.productReadyLocalOss,
  noFilterAcceptedEvidence: noFilterReport.acceptedToolEvidence.length,
}, null, 2))
