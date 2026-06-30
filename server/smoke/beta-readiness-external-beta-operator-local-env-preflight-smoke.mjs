import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import {
  buildBetaReadinessExternalBetaOperatorHumanInputChecklist,
  buildBetaReadinessExternalBetaOperatorInputTemplate,
} from '../cli/beta-readiness-external-beta-operator-input-template.mjs'
import {
  buildBetaReadinessExternalBetaOperatorLocalEnvPreflight,
  RECOMMENDED_OPERATOR_ENV_FILE,
  renderBetaReadinessExternalBetaOperatorLocalEnvPreflightMarkdown,
} from '../cli/beta-readiness-external-beta-operator-local-env-preflight.mjs'

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
const gitignore = readFileSync('.gitignore', 'utf8')

assert.equal(
  packageJson.scripts['beta:readiness:external-beta-operator-local-env-preflight'],
  'node server/cli/beta-readiness-external-beta-operator-local-env-preflight.mjs',
)
assert.equal(
  packageJson.scripts['smoke:beta-readiness-external-beta-operator-local-env-preflight'],
  'node server/smoke/beta-readiness-external-beta-operator-local-env-preflight-smoke.mjs',
)
assert.equal(RECOMMENDED_OPERATOR_ENV_FILE, '.env.reeditpro-beta-operator.local')
assert.ok(gitignore.includes(RECOMMENDED_OPERATOR_ENV_FILE))
execFileSync('git', ['check-ignore', '-q', RECOMMENDED_OPERATOR_ENV_FILE], {
  env: { ...process.env, DEVELOPER_DIR: process.env.DEVELOPER_DIR ?? '/Library/Developer/CommandLineTools' },
})

const blank = buildBetaReadinessExternalBetaOperatorLocalEnvPreflight({
  env: {},
  envFileContent: undefined,
})
assert.equal(blank.ok, true)
assert.equal(
  blank.decision,
  'beta_readiness_external_beta_operator_local_env_preflight_blocked_missing_or_unsafe_operator_inputs',
)
assert.equal(blank.readyForExternalBetaEvidenceCollector, false)
assert.equal(blank.envFile.provided, false)
assert.equal(blank.autoFill.inputCount, 12)
assert.equal(blank.autoFill.emittedSecretOrHumanValues, 0)
assert.equal(blank.operatorInputs.pending, 45)
assert.equal(blank.operatorInputs.humanActionablePending, 45)
assert.equal(blank.operatorInputs.autoFillablePending, 0)
assert.equal(blank.ownerApprovalIntake.counts.pending, 29)
assert.equal(blank.deployedEvidenceInputManifest.pendingRequiredInputs, 45)
assert.equal(blank.safetyGaps.length, 0)

const checklist = buildBetaReadinessExternalBetaOperatorHumanInputChecklist(
  buildBetaReadinessExternalBetaOperatorInputTemplate({}),
)
const completeEnvText = checklist.humanActionableInputs
  .map((input, index) => `${input.name}=${JSON.stringify(valueForInput(input, index))}`)
  .join('\n')
const complete = buildBetaReadinessExternalBetaOperatorLocalEnvPreflight({
  env: {},
  envFileContent: completeEnvText,
})
const serializedComplete = JSON.stringify(complete)
const markdown = renderBetaReadinessExternalBetaOperatorLocalEnvPreflightMarkdown(complete)

assert.equal(
  complete.decision,
  'beta_readiness_external_beta_operator_local_env_preflight_passed_ready_for_external_beta_evidence_collector',
)
assert.equal(complete.readyForExternalBetaEvidenceCollector, true)
assert.equal(complete.envFile.loaded, true)
assert.equal(complete.envFile.betaInputKeysLoaded, 45)
assert.equal(complete.envFile.invalidLineCount, 0)
assert.equal(complete.operatorInputs.pending, 0)
assert.equal(complete.ownerApprovalIntake.readyForDeployedEvidenceInputManifest, true)
assert.equal(complete.ownerApprovalIntake.counts.pending, 0)
assert.equal(complete.deployedEvidenceInputManifest.readyToRunExternalBetaEvidenceCollector, true)
assert.equal(complete.deployedEvidenceInputManifest.pendingRequiredInputs, 0)
assert.equal(complete.deployedEvidenceInputManifest.valueGaps, 0)
assert.equal(complete.autoFill.inputCount, 12)
assert.equal(complete.autoFill.appliedInputNames.includes('REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_SHA'), true)
assert.equal(serializedComplete.includes('operator-local-bearer-token'), false)
assert.equal(serializedComplete.includes('workspace-beta-local'), false)
assert.equal(serializedComplete.includes('non-secret evidence summary'), false)
assert.equal(markdown.includes('Ready for external beta evidence collector: `true`'), true)
assert.equal(markdown.includes('Operator inputs pending: `0`'), true)
assert.equal(markdown.includes(`Recommended repo-local path: \`${RECOMMENDED_OPERATOR_ENV_FILE}\``), true)
assert.equal(complete.validationCommands.includes(`REEDITPRO_BETA_OPERATOR_ENV_FILE=${RECOMMENDED_OPERATOR_ENV_FILE} npm run beta:readiness:external-beta-operator-local-env-preflight`), true)
assert.equal(markdown.includes('operator-local-bearer-token'), false)
assert.equal(markdown.includes('workspace-beta-local'), false)
assert.equal(markdown.includes('non-secret evidence summary'), false)
assert.equal(markdown.includes('Supabase classification: no write / environment none / SQL none / migration no.'), true)

const unsafeEvidenceEnvText = completeEnvText.replace(
  /REEDITPRO_BETA_PLATFORM_RLS_READBACK_EVIDENCE="[^"]+"/,
  'REEDITPRO_BETA_PLATFORM_RLS_READBACK_EVIDENCE="Bearer leaked-secret-token"',
)
const unsafe = buildBetaReadinessExternalBetaOperatorLocalEnvPreflight({
  env: {},
  envFileContent: unsafeEvidenceEnvText,
})
const serializedUnsafe = JSON.stringify(unsafe)

assert.equal(unsafe.readyForExternalBetaEvidenceCollector, false)
assert.equal(unsafe.safetyGaps.includes('owner_evidence_contains_secret_like_material'), true)
assert.equal(unsafe.ownerApprovalIntake.secretLikeInputPaths.includes('ownerApprovalEvidence.REEDITPRO_BETA_PLATFORM_RLS_READBACK_EVIDENCE'), true)
assert.equal(serializedUnsafe.includes('leaked-secret-token'), false)

const invalid = buildBetaReadinessExternalBetaOperatorLocalEnvPreflight({
  env: {},
  envFileContent: 'NOT A VALID ENV LINE',
})
assert.equal(invalid.readyForExternalBetaEvidenceCollector, false)
assert.equal(invalid.envFile.invalidLineCount, 1)
assert.equal(invalid.safetyGaps.includes('operator_env_file_has_invalid_lines'), true)
assert.deepEqual(invalid.envFile.invalidLines, [{ lineNumber: 1, reason: 'not_key_value_assignment' }])

console.log(JSON.stringify({
  ok: true,
  decision: complete.decision,
  blankDecision: blank.decision,
  autoFillApplied: complete.autoFill.inputCount,
  completeOperatorPending: complete.operatorInputs.pending,
  completeOwnerPending: complete.ownerApprovalIntake.counts.pending,
  completeManifestPending: complete.deployedEvidenceInputManifest.pendingRequiredInputs,
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
