import assert from 'node:assert/strict'
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  buildBetaReadinessExternalBetaOperatorHumanInputChecklist,
  buildBetaReadinessExternalBetaOperatorInputTemplate,
} from '../cli/beta-readiness-external-beta-operator-input-template.mjs'
import { RECOMMENDED_OPERATOR_ENV_FILE } from '../cli/beta-readiness-external-beta-operator-local-env-preflight.mjs'
import {
  buildBetaReadinessExternalBetaSequencePreflight,
  renderBetaReadinessExternalBetaSequencePreflightMarkdown,
} from '../cli/beta-readiness-external-beta-sequence-preflight.mjs'

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))

assert.equal(
  packageJson.scripts['beta:readiness:external-beta-sequence-preflight'],
  'node server/cli/beta-readiness-external-beta-sequence-preflight.mjs',
)
assert.equal(
  packageJson.scripts['smoke:beta-readiness-external-beta-sequence-preflight'],
  'node server/smoke/beta-readiness-external-beta-sequence-preflight-smoke.mjs',
)

const blank = buildBetaReadinessExternalBetaSequencePreflight({
  env: {},
  envFileContent: undefined,
})
const blankMarkdown = renderBetaReadinessExternalBetaSequencePreflightMarkdown(blank)

assert.equal(blank.ok, true)
assert.equal(blank.decision, 'beta_readiness_external_beta_sequence_preflight_blocked_missing_or_unsafe_inputs')
assert.equal(blank.readyToRunExternalBetaEvidenceCollector, false)
assert.equal(blank.counts.requiredOperatorInputs, 62)
assert.equal(blank.counts.pendingOperatorInputs, 47)
assert.equal(blank.counts.humanActionablePending, 47)
assert.equal(blank.counts.autoFillablePending, 0)
assert.equal(blank.counts.ownerApprovalPending, 29)
assert.equal(blank.counts.deployedManifestPending, 47)
assert.equal(blank.counts.safetyGaps, 0)
assert.deepEqual(blank.steps.map((step) => step.stepId), [
  'operator_local_env',
  'source_freshness',
  'owner_approval_intake',
  'deployed_evidence_manifest',
  'external_beta_evidence_collector',
])
assert.equal(blank.steps.find((step) => step.stepId === 'operator_local_env')?.ready, false)
assert.equal(blank.steps.find((step) => step.stepId === 'external_beta_evidence_collector')?.ready, false)
assert.equal(blank.validationCommands[0], 'npm run beta:readiness:external-beta-sequence-preflight')
assert.equal(
  blank.validationCommands.indexOf('npm run beta:readiness:external-beta-sequence-preflight'),
  blank.validationCommands.lastIndexOf('npm run beta:readiness:external-beta-sequence-preflight'),
)
assert.equal(
  blank.validationCommands.indexOf('npm run beta:readiness:external-beta-sequence-preflight') <
    blank.validationCommands.indexOf('npm run beta:readiness:external-beta-evidence-collector'),
  true,
)
assert.equal(blankMarkdown.includes('Ready for external beta evidence collector: `false`'), true)
assert.equal(blankMarkdown.includes('Supabase classification: no write / environment none / SQL none / migration no.'), true)

const checklist = buildBetaReadinessExternalBetaOperatorHumanInputChecklist(
  buildBetaReadinessExternalBetaOperatorInputTemplate({}),
)
const completeEnvText = checklist.humanActionableInputs
  .map((input, index) => `${input.name}=${JSON.stringify(valueForInput(input, index))}`)
  .join('\n')

const complete = buildBetaReadinessExternalBetaSequencePreflight({
  env: {},
  envFileContent: completeEnvText,
})
const completeMarkdown = renderBetaReadinessExternalBetaSequencePreflightMarkdown(complete)
const completeSerialized = JSON.stringify(complete)
const completeSourceFreshnessReady = complete.sourceFreshness.readyForDeployedEvidenceInputManifest === true

assert.equal(
  complete.decision,
  completeSourceFreshnessReady
    ? 'beta_readiness_external_beta_sequence_preflight_passed_ready_for_evidence_collector'
    : 'beta_readiness_external_beta_sequence_preflight_blocked_missing_or_unsafe_inputs',
)
assert.equal(complete.readyToRunExternalBetaEvidenceCollector, completeSourceFreshnessReady)
assert.equal(complete.counts.pendingOperatorInputs, 0)
assert.equal(complete.counts.ownerApprovalPending, 0)
assert.equal(complete.counts.deployedManifestPending, 0)
assert.equal(complete.counts.safetyGaps, 0)
assert.equal(complete.steps.find((step) => step.stepId === 'operator_local_env')?.ready, true)
assert.equal(complete.steps.find((step) => step.stepId === 'owner_approval_intake')?.ready, true)
assert.equal(complete.steps.find((step) => step.stepId === 'deployed_evidence_manifest')?.ready, true)
assert.equal(complete.steps.find((step) => step.stepId === 'source_freshness')?.ready, completeSourceFreshnessReady)
assert.equal(complete.steps.find((step) => step.stepId === 'external_beta_evidence_collector')?.ready, completeSourceFreshnessReady)
assert.equal(completeMarkdown.includes(`Ready for external beta evidence collector: \`${completeSourceFreshnessReady}\``), true)
assert.equal(completeMarkdown.includes('Pending operator inputs: `0`'), true)
assert.equal(completeSerialized.includes('operator-local-bearer-token'), false)
assert.equal(completeSerialized.includes('workspace-beta-local'), false)
assert.equal(completeSerialized.includes('project-beta-local'), false)
assert.equal(completeSerialized.includes('non-secret evidence summary'), false)
assert.equal(completeMarkdown.includes('operator-local-bearer-token'), false)
assert.equal(completeMarkdown.includes('workspace-beta-local'), false)
assert.equal(completeMarkdown.includes('non-secret evidence summary'), false)

const sourceStale = buildBetaReadinessExternalBetaSequencePreflight({
  env: {},
  envFileContent: completeEnvText,
  resolveGit: false,
})
assert.equal(sourceStale.readyToRunExternalBetaEvidenceCollector, false)
assert.equal(sourceStale.steps.find((step) => step.stepId === 'operator_local_env')?.ready, true)
assert.equal(sourceStale.steps.find((step) => step.stepId === 'source_freshness')?.ready, false)
assert.equal(sourceStale.steps.find((step) => step.stepId === 'external_beta_evidence_collector')?.ready, false)

const tempRoot = mkdtempSync(join(tmpdir(), 'reeditpro-sequence-preflight-smoke-'))
process.on('exit', () => {
  rmSync(tempRoot, { recursive: true, force: true })
})

const secureEnvPath = join(tempRoot, RECOMMENDED_OPERATOR_ENV_FILE)
writeFileSync(secureEnvPath, completeEnvText)
chmodSync(secureEnvPath, 0o600)
const secureFile = buildBetaReadinessExternalBetaSequencePreflight({
  env: {},
  envFilePath: secureEnvPath,
})
assert.equal(secureFile.counts.safetyGaps, 0)
assert.equal(secureFile.envFile.permissionMode, '0600')
assert.equal(JSON.stringify(secureFile).includes('operator-local-bearer-token'), false)

const openEnvPath = join(tempRoot, 'open.env')
writeFileSync(openEnvPath, completeEnvText)
chmodSync(openEnvPath, 0o644)
const openFile = buildBetaReadinessExternalBetaSequencePreflight({
  env: {},
  envFilePath: openEnvPath,
})
assert.equal(openFile.readyToRunExternalBetaEvidenceCollector, false)
assert.equal(openFile.counts.safetyGaps > 0, true)
assert.equal(openFile.steps.find((step) => step.stepId === 'operator_local_env')?.ready, false)
assert.equal(openFile.envFile.safetyGaps.includes('operator_env_file_permissions_not_owner_only'), true)

const symlinkPath = join(tempRoot, 'linked.env')
symlinkSync(secureEnvPath, symlinkPath)
const symlinkFile = buildBetaReadinessExternalBetaSequencePreflight({
  env: {},
  envFilePath: symlinkPath,
})
assert.equal(symlinkFile.readyToRunExternalBetaEvidenceCollector, false)
assert.equal(symlinkFile.counts.safetyGaps > 0, true)
assert.equal(symlinkFile.envFile.safetyGaps.includes('operator_env_file_is_symlink'), true)

assert.equal(existsSync(secureEnvPath), true)

console.log(JSON.stringify({
  ok: true,
  decision: complete.decision,
  blankDecision: blank.decision,
  completeReady: complete.readyToRunExternalBetaEvidenceCollector,
  completeOperatorPending: complete.counts.pendingOperatorInputs,
  completeOwnerPending: complete.counts.ownerApprovalPending,
  completeManifestPending: complete.counts.deployedManifestPending,
  secureFileMode: secureFile.envFile.permissionMode,
  openFileBlocked: openFile.envFile.safetyGaps.includes('operator_env_file_permissions_not_owner_only'),
  symlinkBlocked: symlinkFile.envFile.safetyGaps.includes('operator_env_file_is_symlink'),
}))

function valueForInput(input, index) {
  if (input.name === 'REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN') return 'operator-local-bearer-token'
  if (input.name === 'REEDITPRO_BETA_EXTERNAL_WORKSPACE_ID') return 'workspace-beta-local'
  if (input.name === 'REEDITPRO_BETA_EXTERNAL_PROJECT_ID') return 'project-beta-local'
  if (input.name === 'REEDITPRO_BETA_PLATFORM_WALLET_SETTLEMENT_EVENT_ID') return 'wallet-settlement-fixture-event-local'
  if (
    input.collectionRole === 'operator_confirmation' ||
    input.collectionRole === 'owner_approval_confirmation' ||
    input.collectionRole === 'technical_verification_confirmation'
  ) {
    return 'true'
  }
  if (input.collectionRole === 'owner_evidence_note') {
    return `non-secret evidence summary ${index}`
  }
  return `operator-value-${index}`
}
