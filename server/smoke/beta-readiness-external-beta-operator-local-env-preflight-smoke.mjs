import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  buildBetaReadinessExternalBetaOperatorLocalEnvBootstrap,
  buildBetaReadinessExternalBetaOperatorHumanInputChecklist,
  buildBetaReadinessExternalBetaOperatorInputTemplate,
  writeBetaReadinessExternalBetaOperatorLocalEnvBootstrap,
} from '../cli/beta-readiness-external-beta-operator-input-template.mjs'
import {
  buildBetaReadinessExternalBetaOperatorLocalEnvPreflight,
  buildBetaReadinessExternalBetaOperatorValueProgress,
  RECOMMENDED_OPERATOR_ENV_FILE,
  renderBetaReadinessExternalBetaOperatorLocalEnvPreflightMarkdown,
  renderBetaReadinessExternalBetaOperatorValueProgressMarkdown,
} from '../cli/beta-readiness-external-beta-operator-local-env-preflight.mjs'

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
const gitignore = readFileSync('.gitignore', 'utf8')

assert.equal(
  packageJson.scripts['beta:readiness:external-beta-operator-local-env-preflight'],
  'node server/cli/beta-readiness-external-beta-operator-local-env-preflight.mjs',
)
assert.equal(
  packageJson.scripts['beta:readiness:external-beta-operator-local-env-bootstrap'],
  'node server/cli/beta-readiness-external-beta-operator-input-template.mjs --bootstrap-local-env',
)
assert.equal(
  packageJson.scripts['beta:readiness:external-beta-operator-value-progress'],
  'node server/cli/beta-readiness-external-beta-operator-local-env-preflight.mjs --progress',
)
assert.equal(
  packageJson.scripts['smoke:beta-readiness-external-beta-operator-local-env-preflight'],
  'node server/smoke/beta-readiness-external-beta-operator-local-env-preflight-smoke.mjs',
)
assert.equal(RECOMMENDED_OPERATOR_ENV_FILE, '.env.reeditpro-beta-operator.local')
assert.ok(gitignore.includes(RECOMMENDED_OPERATOR_ENV_FILE))
execFileSync('git', ['check-ignore', '-q', RECOMMENDED_OPERATOR_ENV_FILE], {
  env: gitExecEnv(),
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
const blankProgress = buildBetaReadinessExternalBetaOperatorValueProgress({
  env: {},
  envFileContent: undefined,
})
assert.equal(blankProgress.decision, 'beta_readiness_external_beta_operator_value_progress_passed_redacted_progress_review')
assert.equal(blankProgress.readyForExternalBetaEvidenceCollector, false)
assert.equal(blankProgress.progress.requiredInputs, 60)
assert.equal(blankProgress.progress.presentOrAutofilledInputs, 15)
assert.equal(blankProgress.progress.pendingInputs, 45)
assert.equal(blankProgress.progress.humanActionablePending, 45)
assert.equal(blankProgress.progress.percentComplete, 25)
assert.equal(blankProgress.blockers.includes('operator_env_file_not_provided'), true)
assert.equal(blankProgress.blockers.includes('operator_inputs_pending'), true)
assert.equal(blankProgress.valuePolicyProgress.find((row) => row.name === 'owner_approval_confirmation')?.pending, 15)
assert.equal(blankProgress.validationCommands.includes(`REEDITPRO_BETA_OPERATOR_ENV_FILE=${RECOMMENDED_OPERATOR_ENV_FILE} npm run beta:readiness:external-beta-operator-value-progress`), true)

const checklist = buildBetaReadinessExternalBetaOperatorHumanInputChecklist(
  buildBetaReadinessExternalBetaOperatorInputTemplate({}),
)
const copiedTemplate = buildBetaReadinessExternalBetaOperatorInputTemplate({})
const copiedTemplatePreflight = buildBetaReadinessExternalBetaOperatorLocalEnvPreflight({
  env: {},
  envFileContent: copiedTemplate.envTemplate,
})
assert.equal(copiedTemplatePreflight.readyForExternalBetaEvidenceCollector, false)
assert.equal(copiedTemplatePreflight.safetyGaps.includes('operator_env_file_contains_placeholder_values'), true)
assert.ok(copiedTemplatePreflight.envFile.placeholderInputPaths.length > 0)
const copiedTemplateProgress = buildBetaReadinessExternalBetaOperatorValueProgress({
  env: {},
  envFileContent: copiedTemplate.envTemplate,
})
assert.equal(copiedTemplateProgress.readyForExternalBetaEvidenceCollector, false)
assert.equal(copiedTemplateProgress.blockers.includes('operator_env_file_contains_placeholder_values'), true)
assert.equal(copiedTemplateProgress.envFile.placeholderValueCount > 0, true)

const completeEnvText = checklist.humanActionableInputs
  .map((input, index) => `${input.name}=${JSON.stringify(valueForInput(input, index))}`)
  .join('\n')
const complete = buildBetaReadinessExternalBetaOperatorLocalEnvPreflight({
  env: {},
  envFileContent: completeEnvText,
})
const serializedComplete = JSON.stringify(complete)
const markdown = renderBetaReadinessExternalBetaOperatorLocalEnvPreflightMarkdown(complete)
const completeProgress = buildBetaReadinessExternalBetaOperatorValueProgress({
  env: {},
  envFileContent: completeEnvText,
})
const completeProgressMarkdown = renderBetaReadinessExternalBetaOperatorValueProgressMarkdown(completeProgress)
const completeSourceFreshnessReady = complete.sourceFreshness.readyForDeployedEvidenceInputManifest === true

assert.equal(
  complete.decision,
  completeSourceFreshnessReady
    ? 'beta_readiness_external_beta_operator_local_env_preflight_passed_ready_for_external_beta_evidence_collector'
    : 'beta_readiness_external_beta_operator_local_env_preflight_blocked_source_freshness_not_ready',
)
assert.equal(complete.readyForExternalBetaEvidenceCollector, completeSourceFreshnessReady)
assert.equal(complete.envFile.loaded, true)
assert.equal(complete.envFile.betaInputKeysLoaded, 45)
assert.equal(complete.envFile.invalidLineCount, 0)
assert.equal(complete.operatorInputs.pending, 0)
assert.equal(complete.sourceFreshness.readyForDeployedEvidenceInputManifest, completeSourceFreshnessReady)
assert.equal(
  completeSourceFreshnessReady
    ? complete.sourceFreshness.blockingChangedFiles.length === 0
    : complete.sourceFreshness.blockingChangedFiles.length > 0,
  true,
)
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
assert.equal(markdown.includes(`Ready for external beta evidence collector: \`${completeSourceFreshnessReady}\``), true)
assert.equal(markdown.includes('Operator inputs pending: `0`'), true)
assert.equal(markdown.includes(`Source freshness ready: \`${completeSourceFreshnessReady}\``), true)
assert.equal(markdown.includes(`Recommended repo-local path: \`${RECOMMENDED_OPERATOR_ENV_FILE}\``), true)
assert.equal(complete.validationCommands.includes(`REEDITPRO_BETA_OPERATOR_ENV_FILE=${RECOMMENDED_OPERATOR_ENV_FILE} npm run beta:readiness:external-beta-operator-local-env-preflight`), true)
assert.equal(markdown.includes('operator-local-bearer-token'), false)
assert.equal(markdown.includes('workspace-beta-local'), false)
assert.equal(markdown.includes('non-secret evidence summary'), false)
assert.equal(markdown.includes('Supabase classification: no write / environment none / SQL none / migration no.'), true)
assert.equal(completeProgress.readyForExternalBetaEvidenceCollector, completeSourceFreshnessReady)
assert.equal(completeProgress.progress.presentOrAutofilledInputs, 60)
assert.equal(completeProgress.progress.pendingInputs, 0)
assert.equal(completeProgress.progress.percentComplete, 100)
assert.deepEqual(completeProgress.blockers, completeSourceFreshnessReady ? [] : ['source_freshness_not_ready'])
assert.equal(completeProgressMarkdown.includes('Complete: `100%`'), true)
assert.equal(completeProgressMarkdown.includes('operator-local-bearer-token'), false)
assert.equal(completeProgressMarkdown.includes('workspace-beta-local'), false)
assert.equal(completeProgressMarkdown.includes('non-secret evidence summary'), false)
assert.equal(completeProgressMarkdown.includes('Supabase classification: no write / environment none / SQL none / migration no.'), true)

const completeButSourceStale = buildBetaReadinessExternalBetaOperatorLocalEnvPreflight({
  env: {},
  envFileContent: completeEnvText,
  resolveGit: false,
})
assert.equal(completeButSourceStale.operatorInputs.pending, 0)
assert.equal(completeButSourceStale.ownerApprovalIntake.readyForDeployedEvidenceInputManifest, true)
assert.equal(completeButSourceStale.deployedEvidenceInputManifest.readyToRunExternalBetaEvidenceCollector, true)
assert.equal(completeButSourceStale.sourceFreshness.readyForDeployedEvidenceInputManifest, false)
assert.equal(completeButSourceStale.readyForExternalBetaEvidenceCollector, false)

const tempRoot = mkdtempSync(join(tmpdir(), 'reeditpro-operator-env-preflight-smoke-'))
process.on('exit', () => {
  rmSync(tempRoot, { recursive: true, force: true })
})
const bootstrap = buildBetaReadinessExternalBetaOperatorLocalEnvBootstrap(copiedTemplate, {
  targetPath: RECOMMENDED_OPERATOR_ENV_FILE,
})
assert.equal(bootstrap.decision, 'beta_readiness_external_beta_operator_local_env_bootstrap_passed_ready_for_human_operator_value_collection')
assert.equal(bootstrap.inputCounts.assignedSafeInputs, 14)
assert.equal(bootstrap.inputCounts.commentedHumanInputs, 46)
assert.equal(bootstrap.inputCounts.secretOrSensitiveValuesAssigned, 0)
assert.equal(bootstrap.inputCounts.ownerApprovalValuesAssigned, 0)
assert.equal(bootstrap.inputCounts.ownerEvidenceValuesAssigned, 0)
assert.equal(bootstrap.envFileContent.includes('REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_SHA='), true)
assert.equal(bootstrap.envFileContent.includes('REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN='), true)
assert.equal(/^REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN=/m.test(bootstrap.envFileContent), false)
assert.equal(/^# REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN=/m.test(bootstrap.envFileContent), true)

const bootstrapPath = join(tempRoot, RECOMMENDED_OPERATOR_ENV_FILE)
const writeBootstrap = writeBetaReadinessExternalBetaOperatorLocalEnvBootstrap({
  targetPath: bootstrapPath,
})
assert.equal(writeBootstrap.written, true)
assert.equal(writeBootstrap.permissionMode, '0600')
assert.equal(writeBootstrap.safetyGaps.length, 0)
const bootstrappedPreflight = buildBetaReadinessExternalBetaOperatorLocalEnvPreflight({
  env: {},
  envFilePath: bootstrapPath,
})
assert.equal(bootstrappedPreflight.readyForExternalBetaEvidenceCollector, false)
assert.equal(bootstrappedPreflight.envFile.permissionMode, '0600')
assert.equal(bootstrappedPreflight.envFile.betaInputKeysLoaded, 14)
assert.equal(bootstrappedPreflight.operatorInputs.pending, 45)
assert.equal(bootstrappedPreflight.envFile.placeholderInputPaths.length, 0)
assert.equal(bootstrappedPreflight.safetyGaps.includes('operator_env_file_contains_placeholder_values'), false)
const secondBootstrap = writeBetaReadinessExternalBetaOperatorLocalEnvBootstrap({
  targetPath: bootstrapPath,
})
assert.equal(secondBootstrap.written, false)
assert.equal(secondBootstrap.safetyGaps.includes('operator_local_env_bootstrap_target_exists'), true)

const secureEnvPath = join(tempRoot, 'secure.env')
writeFileSync(secureEnvPath, completeEnvText)
chmodSync(secureEnvPath, 0o600)
const secureFile = buildBetaReadinessExternalBetaOperatorLocalEnvPreflight({
  env: {},
  envFilePath: secureEnvPath,
})
assert.equal(secureFile.readyForExternalBetaEvidenceCollector, completeSourceFreshnessReady)
assert.equal(secureFile.envFile.permissionMode, '0600')
assert.equal(secureFile.envFile.ownerOnlyPermissions, true)
assert.equal(secureFile.envFile.symlink, false)
assert.equal(secureFile.envFile.safetyGaps.length, 0)
assert.equal(JSON.stringify(secureFile).includes('operator-local-bearer-token'), false)

const openEnvPath = join(tempRoot, 'open.env')
writeFileSync(openEnvPath, completeEnvText)
chmodSync(openEnvPath, 0o644)
const openFile = buildBetaReadinessExternalBetaOperatorLocalEnvPreflight({
  env: {},
  envFilePath: openEnvPath,
})
assert.equal(openFile.readyForExternalBetaEvidenceCollector, false)
assert.equal(openFile.envFile.permissionMode, '0644')
assert.equal(openFile.envFile.ownerOnlyPermissions, false)
assert.equal(openFile.envFile.safetyGaps.includes('operator_env_file_permissions_not_owner_only'), true)
assert.equal(openFile.safetyGaps.includes('operator_env_file_permissions_not_owner_only'), true)
assert.equal(JSON.stringify(openFile).includes('operator-local-bearer-token'), false)

const symlinkPath = join(tempRoot, 'linked.env')
symlinkSync(secureEnvPath, symlinkPath)
const symlinkFile = buildBetaReadinessExternalBetaOperatorLocalEnvPreflight({
  env: {},
  envFilePath: symlinkPath,
})
assert.equal(symlinkFile.readyForExternalBetaEvidenceCollector, false)
assert.equal(symlinkFile.envFile.symlink, true)
assert.equal(symlinkFile.envFile.safetyGaps.includes('operator_env_file_is_symlink'), true)
assert.equal(symlinkFile.safetyGaps.includes('operator_env_file_is_symlink'), true)
assert.equal(JSON.stringify(symlinkFile).includes('operator-local-bearer-token'), false)

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
  secureFileMode: secureFile.envFile.permissionMode,
  openFileBlocked: openFile.safetyGaps.includes('operator_env_file_permissions_not_owner_only'),
  symlinkBlocked: symlinkFile.safetyGaps.includes('operator_env_file_is_symlink'),
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

function gitExecEnv() {
  if (process.platform !== 'darwin') return process.env
  if (process.env.DEVELOPER_DIR && existsSync(process.env.DEVELOPER_DIR)) return process.env
  return {
    ...process.env,
    DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
  }
}
