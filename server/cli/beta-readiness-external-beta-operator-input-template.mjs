import { execFileSync } from 'node:child_process'
import { chmodSync, existsSync, lstatSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { buildBetaReadinessDeployedEvidenceInputManifest } from './beta-readiness-deployed-evidence-input-manifest.mjs'

const DEPLOYED_EVIDENCE_MANIFEST_PATH = 'docs/beta-readiness/deployed-evidence-input-manifest/2026-06-30-ee177-deployed-evidence-input-manifest.json'
const DECISION = 'beta_readiness_external_beta_operator_input_template_passed_ready_for_operator_value_collection'
const STATUS_DECISION = 'beta_readiness_external_beta_operator_input_status_passed_ready_for_operator_value_collection'
const AUTOFILL_DECISION = 'beta_readiness_external_beta_operator_autofill_env_passed_ready_for_human_operator_value_collection'
const AUTOFILL_LOCAL_ENV_DECISION = 'beta_readiness_external_beta_operator_autofill_local_env_passed_ready_for_human_operator_value_collection'
const AUTOFILL_LOCAL_ENV_BLOCKED_DECISION = 'beta_readiness_external_beta_operator_autofill_local_env_blocked_unsafe_local_env_file'
const HUMAN_INPUT_CHECKLIST_DECISION = 'beta_readiness_external_beta_operator_human_input_checklist_passed_ready_for_operator_owner_collection'
const BOOTSTRAP_DECISION = 'beta_readiness_external_beta_operator_local_env_bootstrap_passed_ready_for_human_operator_value_collection'

const SECRET_PLACEHOLDER = '<secret value supplied only in the operator shell>'
const NON_SECRET_PLACEHOLDER = '<operator supplied non-secret value>'
const EVIDENCE_PLACEHOLDER = '<non-secret owner evidence summary>'
const OPERATOR_CONFIRMATION_PLACEHOLDER = '<operator confirmation: set to true only after this gate is intentionally accepted>'
const OWNER_APPROVAL_PLACEHOLDER = '<owner approval: set to true only after named owner approval is recorded>'
const TECHNICAL_VERIFICATION_PLACEHOLDER = '<technical verification: set to true only after evidence readback passes>'
export const RECOMMENDED_OPERATOR_ENV_FILE = '.env.reeditpro-beta-operator.local'

export function buildBetaReadinessExternalBetaOperatorInputTemplate(env = {}) {
  const manifest = buildBetaReadinessDeployedEvidenceInputManifest(env)
  const deployedEvidence = readJson(DEPLOYED_EVIDENCE_MANIFEST_PATH)
  const deployReadback = deployedEvidence.currentApiDeployReadback ?? {}
  const defaultApiBaseUrl = clean(deployReadback.normalApiServiceUrl) ?? clean(deployReadback.serviceUrl)
  const currentSourceSha = manifest.sourceTruth.currentSourceSha

  const requiredInputs = manifest.requiredInputs.map((input) => ({
    ...input,
    templateValue: templateValue(input, {
      defaultApiBaseUrl,
      currentSourceSha,
      fixedInputs: manifest.fixedInputs,
      sourceTruth: manifest.sourceTruth,
    }),
    valuePolicy: valuePolicy(input),
  }))

  return {
    ok: true,
    decision: DECISION,
    templateId: 'beta-readiness-external-beta-operator-input-template-ee177-2026-06-30',
    sourceTruth: {
      deployedEvidenceManifestPath: DEPLOYED_EVIDENCE_MANIFEST_PATH,
      deployedEvidenceManifestDecision: deployedEvidence.decision,
      deployedApiRevision: deployReadback.normalApiRevision,
      deployedSourceSha: currentSourceSha,
      defaultApiBaseUrlSource: 'committed_ee177_deploy_readback',
      trackBToolTotals: manifest.sourceTruth.trackBToolTotals,
      productReadyLocalOssCount: manifest.sourceTruth.trackBToolTotals.productReady,
    },
    inputCounts: {
      required: requiredInputs.length,
      currentlyPendingInBlankEnvironment: manifest.pendingRequiredInputs.length,
      secretOrSensitiveInputs: requiredInputs.filter((input) => input.secret).length,
      operatorGeneratedIds: requiredInputs.filter((input) => input.valuePolicy === 'operator_unique_id').length,
      operatorEvidenceNotes: requiredInputs.filter((input) => input.valuePolicy === 'owner_evidence_note').length,
      prefilledNonSecretConstants: requiredInputs.filter((input) => input.valuePolicy === 'prefilled_non_secret_constant').length,
    },
    requiredInputGroups: groupCounts(requiredInputs),
    requiredInputs,
    envTemplate: renderEnvTemplate(requiredInputs),
    validationCommands: [
      'npm run beta:readiness:source-freshness-preflight',
      'npm run beta:readiness:external-beta-operator-local-env-bootstrap',
      'REEDITPRO_BETA_OPERATOR_ENV_FILE=.env.reeditpro-beta-operator.local npm run beta:readiness:external-beta-operator-value-progress -- --markdown',
      'npm run beta:readiness:external-beta-operator-autofill-env',
      'npm run beta:readiness:external-beta-operator-autofill-local-env',
      'npm run beta:readiness:external-beta-operator-human-input-checklist',
      'REEDITPRO_BETA_OPERATOR_ENV_FILE=.env.reeditpro-beta-operator.local npm run beta:readiness:external-beta-operator-local-env-preflight',
      'npm run beta:readiness:owner-approval-intake-status',
      'REEDITPRO_BETA_OWNER_APPROVAL_ENV_FILE=.env.reeditpro-beta-operator.local npm run beta:readiness:owner-approval-intake-preflight',
      'npm run beta:readiness:deployed-evidence-input-manifest -- --status',
      'npm run beta:readiness:deployed-evidence-input-manifest',
      'npm run beta:tools:trackb-agent-route-deployed-evidence-collector',
      'npm run beta:tools:trackb-product-ready-deployed-evidence-collector',
      'npm run beta:readiness:external-beta-sequence-preflight',
      'npm run beta:readiness:external-beta-evidence-collector',
      'npm run beta:readiness:operator-status-api',
    ],
    blockedScopeConfirmations: {
      approvalsForgedOrGranted: false,
      deployedBackendCalled: false,
      backendEvidenceRecorded: false,
      supabaseWritesRan: false,
      sqlRan: false,
      gcsWritesRan: false,
      providerCallsRan: false,
      workerDispatchRan: false,
      userMediaProcessed: false,
      externalBetaEnabled: false,
      realUserMediaBetaEnabled: false,
      paidProductionEnabled: false,
      publicArtifactsCreated: false,
      signedUrlsCreated: false,
    },
    supabaseClassification: {
      write: 'no write',
      environment: 'none',
      sql: 'none',
      migration: 'no',
    },
    nextSafeAction: 'Operators fill this template outside source control, then run source freshness, owner approval intake status, owner approval intake preflight, deployed evidence input manifest, and only then the external beta evidence collector.',
    warnings: [
      'This template is a local operator input aid only; it does not call the deployed backend or record evidence.',
      'Do not commit completed templates, bearer tokens, workspace/project identifiers if private, evidence notes, signed URLs, raw prompts, or private media references.',
      'External beta, real-user-media beta, paid production, provider calls, worker dispatch, Supabase/GCS writes, public artifacts, and signed URLs remain blocked until their named gates pass.',
    ],
  }
}

export function buildBetaReadinessExternalBetaOperatorInputStatus(report = buildBetaReadinessExternalBetaOperatorInputTemplate()) {
  const pendingInputs = report.requiredInputs.filter((input) => !input.present)
  const actionableInputs = pendingInputs.filter(isHumanActionableInput)
  const autoFillableInputs = pendingInputs.filter((input) => !isHumanActionableInput(input))
  return {
    ok: true,
    decision: STATUS_DECISION,
    templateDecision: report.decision,
    templateId: report.templateId,
    sourceTruth: report.sourceTruth,
    inputCounts: report.inputCounts,
    actionabilityCounts: {
      humanActionablePending: actionableInputs.length,
      autoFillablePending: autoFillableInputs.length,
      pendingPrefilledConstants: pendingInputs.filter((input) => input.valuePolicy === 'prefilled_non_secret_constant').length,
      pendingOperatorGeneratedIds: pendingInputs.filter((input) => input.valuePolicy === 'operator_unique_id').length,
      pendingOwnerEvidenceNotes: pendingInputs.filter((input) => input.valuePolicy === 'owner_evidence_note').length,
      pendingOwnerApprovalConfirmations: pendingInputs.filter((input) => input.valuePolicy === 'owner_approval_confirmation').length,
      pendingOperatorConfirmations: pendingInputs.filter((input) => input.valuePolicy === 'operator_confirmation').length,
      pendingTechnicalVerificationConfirmations: pendingInputs.filter((input) => input.valuePolicy === 'technical_verification_confirmation').length,
      pendingSecretOrSensitiveInputs: pendingInputs.filter((input) => input.valuePolicy === 'operator_secret_or_sensitive').length,
      pendingNonSecretOperatorValues: pendingInputs.filter((input) => input.valuePolicy === 'operator_non_secret_value').length,
    },
    requiredInputGroups: report.requiredInputGroups,
    pendingInputGroups: groupCounts(pendingInputs),
    pendingValuePolicies: groupByField(pendingInputs, 'valuePolicy'),
    humanActionablePendingInputs: actionableInputs.map(toStatusInput),
    autoFillablePendingInputs: autoFillableInputs.map(toStatusInput),
    pendingInputs: pendingInputs.map((input) => ({
      name: input.name,
      group: input.group,
      requiredFor: input.requiredFor,
      secret: input.secret === true,
      valuePolicy: input.valuePolicy,
      operatorAction: operatorAction(input),
    })),
    validationCommands: report.validationCommands,
    nextSafeAction: report.nextSafeAction,
    blockedScopeConfirmations: report.blockedScopeConfirmations,
    supabaseClassification: report.supabaseClassification,
    warnings: [
      'This status report is intentionally value-free: it prints required input names, groups, and policies only.',
      'Human-actionable pending inputs are the true operator/owner collection items; auto-fillable pending inputs are safe template constants or generated idempotency keys that must still be exported before evidence collection.',
      'Do not paste bearer tokens, workspace/project identifiers if private, owner evidence text, signed URLs, raw prompts, or private media references into source control.',
      'Use --env-template only in an operator shell or secret manager session; use --status for safe progress review.',
      'External beta, real-user-media beta, paid production, provider calls, worker dispatch, Supabase/GCS writes, public artifacts, and signed URLs remain blocked until named gates pass.',
    ],
  }
}

export function buildBetaReadinessExternalBetaOperatorAutofillEnv(report = buildBetaReadinessExternalBetaOperatorInputTemplate()) {
  const pendingInputs = report.requiredInputs.filter((input) => !input.present)
  const autoFillableInputs = pendingInputs
    .filter((input) => !isHumanActionableInput(input))
    .map((input) => ({
      name: input.name,
      group: input.group,
      requiredFor: input.requiredFor,
      valuePolicy: input.valuePolicy,
      operatorAction: operatorAction(input),
      value: input.templateValue,
    }))

  return {
    ok: true,
    decision: AUTOFILL_DECISION,
    templateDecision: report.decision,
    templateId: report.templateId,
    sourceTruth: report.sourceTruth,
    inputCounts: {
      autoFillablePending: autoFillableInputs.length,
      generatedIdempotencyKeys: autoFillableInputs.filter((input) => input.valuePolicy === 'operator_unique_id').length,
      prefilledNonSecretConstants: autoFillableInputs.filter((input) => input.valuePolicy === 'prefilled_non_secret_constant').length,
      humanActionableInputsEmitted: 0,
      secretOrSensitiveInputsEmitted: 0,
      ownerApprovalInputsEmitted: 0,
      ownerEvidenceNotesEmitted: 0,
    },
    autoFillableInputs,
    envTemplate: renderAutofillEnvTemplate(autoFillableInputs),
    validationCommands: [
      'npm run beta:readiness:external-beta-operator-input-template -- --status',
      'npm run beta:readiness:external-beta-operator-local-env-bootstrap',
      'REEDITPRO_BETA_OPERATOR_ENV_FILE=.env.reeditpro-beta-operator.local npm run beta:readiness:external-beta-operator-value-progress -- --markdown',
      'npm run beta:readiness:external-beta-operator-autofill-env',
      'npm run beta:readiness:external-beta-operator-autofill-local-env',
      'npm run beta:readiness:external-beta-operator-input-template',
      'REEDITPRO_BETA_OPERATOR_ENV_FILE=.env.reeditpro-beta-operator.local npm run beta:readiness:external-beta-operator-local-env-preflight',
      'npm run beta:readiness:owner-approval-intake-status',
      'REEDITPRO_BETA_OWNER_APPROVAL_ENV_FILE=.env.reeditpro-beta-operator.local npm run beta:readiness:owner-approval-intake-preflight',
      'npm run beta:readiness:deployed-evidence-input-manifest -- --status',
      'npm run beta:readiness:deployed-evidence-input-manifest',
      'npm run beta:tools:trackb-agent-route-deployed-evidence-collector',
      'npm run beta:tools:trackb-product-ready-deployed-evidence-collector',
      'npm run beta:readiness:external-beta-sequence-preflight',
    ],
    blockedScopeConfirmations: report.blockedScopeConfirmations,
    supabaseClassification: report.supabaseClassification,
    nextSafeAction: 'Export these auto-fillable values in an operator shell, then supply the remaining human-actionable secret, non-secret, approval, verification, and evidence-note values outside source control.',
    warnings: [
      'This auto-fill template intentionally emits only pending non-secret constants and generated idempotency keys.',
      'It does not emit bearer tokens, workspace/project identifiers, API base URLs, owner approval booleans, technical verification booleans, evidence notes, signed URLs, raw prompts, private media references, or deploy secrets.',
      'It does not grant approvals, call the deployed backend, record evidence, write Supabase/GCS, dispatch workers, process media, enable external beta, enable real-user-media beta, or enable paid production.',
    ],
  }
}

export function buildBetaReadinessExternalBetaOperatorHumanInputChecklist(report = buildBetaReadinessExternalBetaOperatorInputTemplate()) {
  const pendingInputs = report.requiredInputs.filter((input) => !input.present)
  const humanActionableInputs = pendingInputs
    .filter(isHumanActionableInput)
    .map(toHumanInputChecklistItem)

  return {
    ok: true,
    decision: HUMAN_INPUT_CHECKLIST_DECISION,
    templateDecision: report.decision,
    templateId: report.templateId,
    sourceTruth: report.sourceTruth,
    inputCounts: {
      humanActionablePending: humanActionableInputs.length,
      operatorSecretOrSensitive: humanActionableInputs.filter((input) => input.collectionRole === 'operator_secret_or_sensitive').length,
      operatorNonSecretValues: humanActionableInputs.filter((input) => input.collectionRole === 'operator_non_secret_value').length,
      operatorConfirmations: humanActionableInputs.filter((input) => input.collectionRole === 'operator_confirmation').length,
      ownerApprovalConfirmations: humanActionableInputs.filter((input) => input.collectionRole === 'owner_approval_confirmation').length,
      technicalVerificationConfirmations: humanActionableInputs.filter((input) => input.collectionRole === 'technical_verification_confirmation').length,
      ownerEvidenceNotes: humanActionableInputs.filter((input) => input.collectionRole === 'owner_evidence_note').length,
      autoFillableInputsEmitted: 0,
      valuesEmitted: 0,
    },
    pendingGroups: groupCounts(humanActionableInputs),
    pendingCollectionRoles: groupByField(humanActionableInputs, 'collectionRole'),
    humanActionableInputs,
    collectionOrder: [
      'operator_secret_or_sensitive',
      'operator_non_secret_value',
      'operator_confirmation',
      'owner_approval_confirmation',
      'technical_verification_confirmation',
      'owner_evidence_note',
    ],
    validationCommands: [
      'npm run beta:readiness:external-beta-operator-input-template -- --status',
      'npm run beta:readiness:external-beta-operator-local-env-bootstrap',
      'REEDITPRO_BETA_OPERATOR_ENV_FILE=.env.reeditpro-beta-operator.local npm run beta:readiness:external-beta-operator-value-progress -- --markdown',
      'npm run beta:readiness:external-beta-operator-autofill-env',
      'npm run beta:readiness:external-beta-operator-autofill-local-env',
      'npm run beta:readiness:external-beta-operator-human-input-checklist',
      'REEDITPRO_BETA_OPERATOR_ENV_FILE=.env.reeditpro-beta-operator.local npm run beta:readiness:external-beta-operator-local-env-preflight',
      'npm run beta:readiness:external-beta-operator-input-template',
      'npm run beta:readiness:owner-approval-intake-status',
      'REEDITPRO_BETA_OWNER_APPROVAL_ENV_FILE=.env.reeditpro-beta-operator.local npm run beta:readiness:owner-approval-intake-preflight',
      'npm run beta:readiness:deployed-evidence-input-manifest -- --status',
      'npm run beta:readiness:deployed-evidence-input-manifest',
      'npm run beta:tools:trackb-agent-route-deployed-evidence-collector',
      'npm run beta:tools:trackb-product-ready-deployed-evidence-collector',
    ],
    blockedScopeConfirmations: report.blockedScopeConfirmations,
    supabaseClassification: report.supabaseClassification,
    nextSafeAction: 'Collect the listed human-owned values outside source control, export the safe auto-fill env output, then run owner approval intake status/preflight and the deployed evidence input manifest before any deployed collector.',
    warnings: [
      'This checklist intentionally emits input names, groups, roles, and actions only; it emits no values.',
      'Bearer tokens, workspace/project identifiers, owner evidence notes, approval decisions, and technical verification confirmations must be supplied by the correct operator/owner outside source control.',
      'It does not grant approvals, call deployed services, record evidence, run tools, process media, write Supabase/GCS, enable external beta, enable real-user-media beta, or enable paid production.',
    ],
  }
}

export function renderBetaReadinessExternalBetaOperatorInputTemplateMarkdown(report) {
  const lines = [
    '# Beta Readiness External Beta Operator Input Template - ee177',
    '',
    `Decision: \`${report.decision}\``,
    '',
    `Deployed evidence manifest: \`${report.sourceTruth.deployedEvidenceManifestPath}\``,
    `Deployed evidence decision: \`${report.sourceTruth.deployedEvidenceManifestDecision}\``,
    `Deployed source SHA: \`${report.sourceTruth.deployedSourceSha}\``,
    `API revision: \`${report.sourceTruth.deployedApiRevision}\``,
    `Track B totals: \`${report.sourceTruth.trackBToolTotals.owned} owned / ${report.sourceTruth.trackBToolTotals.boundedAcceptedProven} bounded accepted-proven / ${report.sourceTruth.trackBToolTotals.blockedNotInstalledProven} blocked-not-installed-proven / ${report.sourceTruth.trackBToolTotals.productReady} product-ready\``,
    '',
    '## Input Counts',
    '',
    `- Required inputs: \`${report.inputCounts.required}\``,
    `- Pending in blank environment: \`${report.inputCounts.currentlyPendingInBlankEnvironment}\``,
    `- Secret/sensitive inputs: \`${report.inputCounts.secretOrSensitiveInputs}\``,
    `- Operator-generated ids: \`${report.inputCounts.operatorGeneratedIds}\``,
    `- Owner evidence notes: \`${report.inputCounts.operatorEvidenceNotes}\``,
    `- Prefilled non-secret constants: \`${report.inputCounts.prefilledNonSecretConstants}\``,
    '',
    '## Required Groups',
    '',
    ...Object.entries(report.requiredInputGroups).map(([group, count]) => `- ${group}: \`${count}\``),
    '',
    '## Template',
    '',
    'Fill this in an operator shell or secret manager session only. Do not commit completed values.',
    '',
    '```bash',
    report.envTemplate,
    '```',
    '',
    '## Validation Commands',
    '',
    ...report.validationCommands.map((command) => `- \`${command}\``),
    '',
    '## Boundary',
    '',
    'This report did not grant approvals, call the deployed backend, record evidence, write Supabase, run SQL, write GCS, dispatch workers, call providers, process media, enable external beta, enable real-user-media beta, enable paid production, create public artifacts, or create signed URLs.',
    '',
    'Supabase classification: no write / environment none / SQL none / migration no.',
    '',
    `Next safe action: ${report.nextSafeAction}`,
  ]
  return lines.join('\n')
}

export function buildBetaReadinessExternalBetaOperatorLocalEnvBootstrap(
  report = buildBetaReadinessExternalBetaOperatorInputTemplate(),
  options = {},
) {
  const targetPath = clean(options.targetPath) ?? RECOMMENDED_OPERATOR_ENV_FILE
  const bootstrapInputs = report.requiredInputs.map((input) => ({
    name: input.name,
    group: input.group,
    requiredFor: input.requiredFor,
    secret: input.secret === true,
    valuePolicy: input.valuePolicy,
    operatorAction: operatorAction(input),
    assigned: !isHumanActionableInput(input),
    value: input.templateValue,
  }))
  const assignedInputs = bootstrapInputs.filter((input) => input.assigned)
  const commentedHumanInputs = bootstrapInputs.filter((input) => !input.assigned)
  return {
    ok: true,
    decision: BOOTSTRAP_DECISION,
    templateDecision: report.decision,
    templateId: report.templateId,
    targetPath,
    recommendedPermissionMode: '0600',
    overwriteExistingByDefault: false,
    sourceTruth: report.sourceTruth,
    inputCounts: {
      totalInputs: bootstrapInputs.length,
      assignedSafeInputs: assignedInputs.length,
      commentedHumanInputs: commentedHumanInputs.length,
      secretOrSensitiveValuesAssigned: assignedInputs.filter((input) => input.secret).length,
      ownerApprovalValuesAssigned: assignedInputs.filter((input) => input.valuePolicy === 'owner_approval_confirmation').length,
      ownerEvidenceValuesAssigned: assignedInputs.filter((input) => input.valuePolicy === 'owner_evidence_note').length,
      technicalVerificationValuesAssigned: assignedInputs.filter((input) => input.valuePolicy === 'technical_verification_confirmation').length,
    },
    bootstrapInputs,
    envFileContent: renderLocalEnvBootstrapTemplate(bootstrapInputs),
    validationCommands: [
      `REEDITPRO_BETA_OPERATOR_ENV_FILE=${targetPath} npm run beta:readiness:external-beta-operator-local-env-preflight`,
      `REEDITPRO_BETA_OWNER_APPROVAL_ENV_FILE=${targetPath} npm run beta:readiness:owner-approval-intake-preflight`,
      'npm run beta:readiness:deployed-evidence-input-manifest -- --status',
      'npm run beta:readiness:deployed-evidence-input-manifest',
      'npm run beta:tools:trackb-agent-route-deployed-evidence-collector',
      'npm run beta:tools:trackb-product-ready-deployed-evidence-collector',
      'npm run beta:readiness:external-beta-sequence-preflight',
    ],
    blockedScopeConfirmations: report.blockedScopeConfirmations,
    supabaseClassification: report.supabaseClassification,
    warnings: [
      'The bootstrap file assigns only safe non-secret constants and generated idempotency keys.',
      'Human-owned values are commented out and must be filled by the operator/owner before preflight can pass.',
      'Existing files are not overwritten by default so local secrets and owner evidence are not destroyed.',
      'This bootstrap does not call deployed services, record evidence, write Supabase/GCS, run tools, process media, enable beta, or enable production.',
    ],
    nextSafeAction: `Create ${targetPath}, fill the commented human-owned values outside source control, chmod 600 the file, then run the local env and owner approval preflights.`,
  }
}

export function writeBetaReadinessExternalBetaOperatorLocalEnvBootstrap(options = {}) {
  const report = options.report ?? buildBetaReadinessExternalBetaOperatorInputTemplate()
  const targetPath = clean(options.targetPath) ?? RECOMMENDED_OPERATOR_ENV_FILE
  const bootstrap = buildBetaReadinessExternalBetaOperatorLocalEnvBootstrap(report, { targetPath })
  const cwd = path.resolve(options.cwd ?? process.cwd())
  const resolvedPath = path.resolve(cwd, targetPath)
  const displayPath = path.isAbsolute(targetPath) ? resolvedPath : targetPath
  if (existsSync(resolvedPath) && options.overwrite !== true) {
    return {
      ...withoutEnvFileContent(bootstrap),
      written: false,
      displayPath,
      permissionMode: undefined,
      safetyGaps: ['operator_local_env_bootstrap_target_exists'],
      nextSafeAction: `Review the existing ${displayPath} file or move it aside before bootstrapping; this command will not overwrite operator values by default.`,
    }
  }
  mkdirSync(path.dirname(resolvedPath), { recursive: true })
  writeFileSync(resolvedPath, bootstrap.envFileContent, { encoding: 'utf8', flag: options.overwrite === true ? 'w' : 'wx' })
  chmodSync(resolvedPath, 0o600)
  const permissionMode = `0${(statSync(resolvedPath).mode & 0o777).toString(8).padStart(3, '0')}`
  return {
    ...withoutEnvFileContent(bootstrap),
    written: true,
    displayPath,
    permissionMode,
    safetyGaps: [],
  }
}

export function applyBetaReadinessExternalBetaOperatorAutofillLocalEnv(options = {}) {
  const report = options.report ?? buildBetaReadinessExternalBetaOperatorInputTemplate()
  const autofill = buildBetaReadinessExternalBetaOperatorAutofillEnv(report)
  const targetPath = clean(options.targetPath) ??
    clean(options.env?.REEDITPRO_BETA_OPERATOR_ENV_FILE) ??
    clean(process.env.REEDITPRO_BETA_OPERATOR_ENV_FILE) ??
    RECOMMENDED_OPERATOR_ENV_FILE
  const cwd = path.resolve(options.cwd ?? process.cwd())
  const resolvedPath = path.resolve(cwd, targetPath)
  const displayPath = path.isAbsolute(targetPath) ? resolvedPath : targetPath
  const existingFile = existsSync(resolvedPath)
  const safety = inspectAutofillTarget({ cwd, resolvedPath, existingFile })
  const unsafeAutoFillInputs = autofill.autoFillableInputs.filter((input) => isHumanActionableInput(input) || input.secret === true)
  const safetyGaps = [
    ...safety.safetyGaps,
    ...(unsafeAutoFillInputs.length > 0 ? ['autofill_input_set_contains_human_or_secret_values'] : []),
  ]

  if (safetyGaps.length > 0) {
    return {
      ok: false,
      decision: AUTOFILL_LOCAL_ENV_BLOCKED_DECISION,
      templateDecision: report.decision,
      autofillDecision: autofill.decision,
      targetPath: displayPath,
      existingFile,
      applied: false,
      permissionMode: safety.permissionMode,
      ownerOnlyPermissions: safety.ownerOnlyPermissions,
      symlink: safety.symlink,
      insideRepo: safety.insideRepo,
      gitIgnored: safety.gitIgnored,
      inputCounts: autofillLocalEnvInputCounts(autofill, [], [], autofill.autoFillableInputs),
      updatedInputNames: [],
      appendedInputNames: [],
      unchangedInputNames: [],
      skippedInputNames: autofill.autoFillableInputs.map((input) => input.name),
      emittedSecretOrHumanValues: 0,
      safetyGaps,
      blockedScopeConfirmations: report.blockedScopeConfirmations,
      supabaseClassification: report.supabaseClassification,
      nextSafeAction: `Fix ${displayPath} safety gaps before applying auto-fill values; keep the file local, ignored, non-symlink, and owner-only.`,
      warnings: autofillLocalEnvWarnings(),
    }
  }

  const currentContent = existingFile ? readFileSync(resolvedPath, 'utf8') : ''
  const update = applyAutofillAssignments(currentContent, autofill.autoFillableInputs)
  mkdirSync(path.dirname(resolvedPath), { recursive: true })
  writeFileSync(resolvedPath, update.content, 'utf8')
  chmodSync(resolvedPath, 0o600)
  const permissionMode = `0${(statSync(resolvedPath).mode & 0o777).toString(8).padStart(3, '0')}`

  return {
    ok: true,
    decision: AUTOFILL_LOCAL_ENV_DECISION,
    templateDecision: report.decision,
    autofillDecision: autofill.decision,
    targetPath: displayPath,
    existingFile,
    applied: true,
    permissionMode,
    ownerOnlyPermissions: true,
    symlink: false,
    insideRepo: safety.insideRepo,
    gitIgnored: safety.gitIgnored,
    inputCounts: autofillLocalEnvInputCounts(autofill, update.updatedInputNames, update.appendedInputNames, update.unchangedInputNames),
    updatedInputNames: update.updatedInputNames,
    appendedInputNames: update.appendedInputNames,
    unchangedInputNames: update.unchangedInputNames,
    skippedInputNames: [],
    emittedSecretOrHumanValues: 0,
    safetyGaps: [],
    validationCommands: [
      `REEDITPRO_BETA_OPERATOR_ENV_FILE=${displayPath} npm run beta:readiness:external-beta-operator-value-progress -- --markdown`,
      `REEDITPRO_BETA_OPERATOR_ENV_FILE=${displayPath} npm run beta:readiness:external-beta-operator-local-env-preflight`,
      `REEDITPRO_BETA_OWNER_APPROVAL_ENV_FILE=${displayPath} npm run beta:readiness:owner-approval-intake-preflight`,
      'npm run beta:readiness:deployed-evidence-input-manifest -- --status',
      'npm run beta:readiness:deployed-evidence-input-manifest',
      'npm run beta:tools:trackb-agent-route-deployed-evidence-collector',
      'npm run beta:tools:trackb-product-ready-deployed-evidence-collector',
      'npm run beta:readiness:external-beta-sequence-preflight',
    ],
    blockedScopeConfirmations: report.blockedScopeConfirmations,
    supabaseClassification: report.supabaseClassification,
    nextSafeAction: `Fill the remaining human-owned values in ${displayPath}, then rerun the value progress and local env preflight commands.`,
    warnings: autofillLocalEnvWarnings(),
  }
}

export function renderBetaReadinessExternalBetaOperatorAutofillEnvMarkdown(report) {
  const lines = [
    '# Beta Readiness External Beta Operator Auto-Fill Env - ee177',
    '',
    `Decision: \`${report.decision}\``,
    `Template decision: \`${report.templateDecision}\``,
    '',
    `Auto-fillable pending inputs: \`${report.inputCounts.autoFillablePending}\``,
    `Generated idempotency keys: \`${report.inputCounts.generatedIdempotencyKeys}\``,
    `Prefilled non-secret constants: \`${report.inputCounts.prefilledNonSecretConstants}\``,
    `Human-actionable inputs emitted: \`${report.inputCounts.humanActionableInputsEmitted}\``,
    `Secret/sensitive inputs emitted: \`${report.inputCounts.secretOrSensitiveInputsEmitted}\``,
    `Owner approval inputs emitted: \`${report.inputCounts.ownerApprovalInputsEmitted}\``,
    `Owner evidence notes emitted: \`${report.inputCounts.ownerEvidenceNotesEmitted}\``,
    '',
    '## Export Template',
    '',
    '```bash',
    report.envTemplate,
    '```',
    '',
    '## Auto-Fillable Inputs',
    '',
    ...report.autoFillableInputs.map((input) => `- \`${input.name}\` (${input.group}, ${input.valuePolicy}, ${input.operatorAction})`),
    '',
    '## Validation Commands',
    '',
    ...report.validationCommands.map((command) => `- \`${command}\``),
    '',
    '## Boundary',
    '',
    'This auto-fill report emitted no bearer tokens, workspace/project identifiers, API base URLs, owner evidence text, approval booleans, technical verification booleans, signed URLs, raw prompts, private media references, or deploy secrets.',
    'It did not grant approval, call the deployed backend, record evidence, write Supabase, run SQL, write GCS, dispatch workers, call providers, process media, enable external beta, enable real-user-media beta, enable paid production, create public artifacts, or create signed URLs.',
    '',
    'Supabase classification: no write / environment none / SQL none / migration no.',
    '',
    `Next safe action: ${report.nextSafeAction}`,
  ]
  return lines.join('\n')
}

export function renderBetaReadinessExternalBetaOperatorHumanInputChecklistMarkdown(report) {
  const lines = [
    '# Beta Readiness External Beta Human Input Checklist - ee177',
    '',
    `Decision: \`${report.decision}\``,
    `Template decision: \`${report.templateDecision}\``,
    '',
    `Human-actionable pending inputs: \`${report.inputCounts.humanActionablePending}\``,
    `Operator secret/sensitive values: \`${report.inputCounts.operatorSecretOrSensitive}\``,
    `Operator non-secret values: \`${report.inputCounts.operatorNonSecretValues}\``,
    `Operator confirmations: \`${report.inputCounts.operatorConfirmations}\``,
    `Owner approval confirmations: \`${report.inputCounts.ownerApprovalConfirmations}\``,
    `Technical verification confirmations: \`${report.inputCounts.technicalVerificationConfirmations}\``,
    `Owner evidence notes: \`${report.inputCounts.ownerEvidenceNotes}\``,
    `Auto-fillable inputs emitted: \`${report.inputCounts.autoFillableInputsEmitted}\``,
    `Values emitted: \`${report.inputCounts.valuesEmitted}\``,
    '',
    '## Pending Groups',
    '',
    ...Object.entries(report.pendingGroups).map(([group, count]) => `- ${group}: \`${count}\``),
    '',
    '## Collection Roles',
    '',
    ...Object.entries(report.pendingCollectionRoles).map(([role, count]) => `- ${role}: \`${count}\``),
    '',
    '## Checklist',
    '',
  ]
  for (const role of report.collectionOrder) {
    const roleInputs = report.humanActionableInputs.filter((input) => input.collectionRole === role)
    if (roleInputs.length === 0) continue
    lines.push(`### ${role}`)
    lines.push('')
    for (const input of roleInputs) {
      lines.push(`- \`${input.name}\` (${input.group}, ${input.operatorAction})`)
    }
    lines.push('')
  }
  lines.push('## Validation Commands')
  lines.push('')
  lines.push(...report.validationCommands.map((command) => `- \`${command}\``))
  lines.push('')
  lines.push('## Boundary')
  lines.push('')
  lines.push('This checklist printed no bearer tokens, workspace/project identifiers, owner evidence text, approval values, technical verification values, signed URLs, raw prompts, private media references, API base URLs, or deploy secrets.')
  lines.push('It did not grant approval, call the deployed backend, record evidence, write Supabase, run SQL, write GCS, dispatch workers, call providers, process media, enable external beta, enable real-user-media beta, enable paid production, create public artifacts, or create signed URLs.')
  lines.push('')
  lines.push('Supabase classification: no write / environment none / SQL none / migration no.')
  lines.push('')
  lines.push(`Next safe action: ${report.nextSafeAction}`)
  return lines.join('\n')
}

export function renderBetaReadinessExternalBetaOperatorInputStatusMarkdown(status) {
  const lines = [
    '# Beta Readiness External Beta Operator Input Status - ee177',
    '',
    `Decision: \`${status.decision}\``,
    `Template decision: \`${status.templateDecision}\``,
    '',
    `Required inputs: \`${status.inputCounts.required}\``,
    `Pending in blank environment: \`${status.inputCounts.currentlyPendingInBlankEnvironment}\``,
    `Human-actionable pending inputs: \`${status.actionabilityCounts.humanActionablePending}\``,
    `Auto-fillable pending inputs: \`${status.actionabilityCounts.autoFillablePending}\``,
    `Secret/sensitive inputs: \`${status.inputCounts.secretOrSensitiveInputs}\``,
    `Operator-generated ids: \`${status.inputCounts.operatorGeneratedIds}\``,
    `Owner evidence notes: \`${status.inputCounts.operatorEvidenceNotes}\``,
    `Prefilled non-secret constants: \`${status.inputCounts.prefilledNonSecretConstants}\``,
    '',
    '## Pending Groups',
    '',
    ...Object.entries(status.pendingInputGroups).map(([group, count]) => `- ${group}: \`${count}\``),
    '',
    '## Pending Value Policies',
    '',
    ...Object.entries(status.pendingValuePolicies).map(([policy, count]) => `- ${policy}: \`${count}\``),
    '',
    '## Human-Actionable Pending Inputs',
    '',
    ...status.humanActionablePendingInputs.map((input) => `- \`${input.name}\` (${input.group}, ${input.valuePolicy}, ${input.operatorAction})`),
    '',
    '## Auto-Fillable Pending Inputs',
    '',
    ...status.autoFillablePendingInputs.map((input) => `- \`${input.name}\` (${input.group}, ${input.valuePolicy}, ${input.operatorAction})`),
    '',
    '## Pending Input Names',
    '',
    ...status.pendingInputs.map((input) => `- \`${input.name}\` (${input.group}, ${input.valuePolicy}, ${input.operatorAction})`),
    '',
    '## Validation Commands',
    '',
    ...status.validationCommands.map((command) => `- \`${command}\``),
    '',
    '## Boundary',
    '',
    'This status report printed no template values, bearer tokens, workspace/project identifiers, owner evidence text, signed URLs, raw prompts, private media references, or deploy secrets.',
    'It did not grant approvals, call the deployed backend, record evidence, write Supabase, run SQL, write GCS, dispatch workers, call providers, process media, enable external beta, enable real-user-media beta, enable paid production, create public artifacts, or create signed URLs.',
    '',
    'Supabase classification: no write / environment none / SQL none / migration no.',
    '',
    `Next safe action: ${status.nextSafeAction}`,
  ]
  return lines.join('\n')
}

function templateValue(input, context) {
  if (input.name === 'REEDITPRO_BETA_EXTERNAL_API_BASE_URL') {
    return context.defaultApiBaseUrl ?? NON_SECRET_PLACEHOLDER
  }
  if (input.secret) return SECRET_PLACEHOLDER
  if (isOwnerApprovalConfirmationName(input.name)) return OWNER_APPROVAL_PLACEHOLDER
  if (isTechnicalVerificationConfirmationName(input.name)) return TECHNICAL_VERIFICATION_PLACEHOLDER
  if (isOperatorConfirmationName(input.name)) return OPERATOR_CONFIRMATION_PLACEHOLDER
  if (input.name.endsWith('_EVIDENCE')) return EVIDENCE_PLACEHOLDER
  if (
    input.name === 'REEDITPRO_BETA_DEPLOYED_EVIDENCE_SOURCE_SHA' ||
    input.name === 'REEDITPRO_BETA_EXTERNAL_SOURCE_SHA'
  ) {
    return context.currentSourceSha
  }
  if (input.name === 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_ID') {
    return 'beta-tools-current-source-16-tool-local-accepted-evidence-bundle'
  }
  if (input.name === 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_SHA') {
    return context.sourceTruth.localAcceptedEvidenceSourceSha
  }
  if (input.name === 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CORE_TOOL_IDS') {
    return context.fixedInputs.coreToolIdsCsv
  }
  if (input.name === 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRED_BOUNDED_ACCEPTED_TOOL_COUNT') {
    return String(context.fixedInputs.requiredBoundedAcceptedToolCount)
  }
  if (input.name === 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRED_PRODUCT_READY_LOCAL_OSS_COUNT') {
    return String(context.fixedInputs.requiredProductReadyLocalOssCount)
  }
  if (input.name === 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_MODE') {
    return context.fixedInputs.libassMode
  }
  if (input.name === 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_CONTAINER_IMAGE') {
    return context.fixedInputs.libassContainerImage
  }
  if (input.name === 'REEDITPRO_BETA_PLATFORM_ENVIRONMENT') {
    return context.fixedInputs.platformEnvironment
  }
  if (input.expectedValue) return String(input.expectedValue)
  if (input.name.endsWith('_IDEMPOTENCY_KEY')) return `${input.name.toLowerCase().replaceAll('_', '-')}-${context.currentSourceSha.slice(0, 12)}`
  if (input.name.endsWith('_WORKSPACE_ID') || input.name.endsWith('_PROJECT_ID')) return NON_SECRET_PLACEHOLDER
  return NON_SECRET_PLACEHOLDER
}

function renderLocalEnvBootstrapTemplate(inputs) {
  const lines = [
    '# ReEditPro external beta local operator env bootstrap',
    '# Generated skeleton only. Do not commit completed values.',
    '# Safe assignments below are non-secret constants or generated idempotency keys.',
    '# Human-owned values stay commented out until the correct operator/owner supplies them.',
    '',
  ]
  let lastGroup
  for (const input of inputs) {
    if (input.group !== lastGroup) {
      if (lastGroup) lines.push('')
      lines.push(`# ${input.group}`)
      lastGroup = input.group
    }
    if (input.assigned) {
      lines.push(`${input.name}="${escapeTemplateValue(input.value)}"`)
    } else {
      lines.push(`# TODO ${input.operatorAction}`)
      lines.push(`# ${input.name}="${escapeTemplateValue(input.value)}"`)
    }
  }
  lines.push('')
  lines.push('# After filling human-owned values:')
  lines.push(`# chmod 600 ${RECOMMENDED_OPERATOR_ENV_FILE}`)
  lines.push(`# REEDITPRO_BETA_OPERATOR_ENV_FILE=${RECOMMENDED_OPERATOR_ENV_FILE} npm run beta:readiness:external-beta-operator-local-env-preflight`)
  lines.push(`# REEDITPRO_BETA_OWNER_APPROVAL_ENV_FILE=${RECOMMENDED_OPERATOR_ENV_FILE} npm run beta:readiness:owner-approval-intake-preflight`)
  lines.push('# npm run beta:readiness:deployed-evidence-input-manifest -- --status')
  lines.push('# npm run beta:readiness:deployed-evidence-input-manifest')
  lines.push('# npm run beta:tools:trackb-agent-route-deployed-evidence-collector')
  lines.push('# npm run beta:tools:trackb-product-ready-deployed-evidence-collector')
  lines.push('# npm run beta:readiness:external-beta-sequence-preflight')
  return lines.join('\n')
}

function withoutEnvFileContent(report) {
  const { envFileContent, bootstrapInputs, ...safeReport } = report
  return {
    ...safeReport,
    assignedInputNames: bootstrapInputs.filter((input) => input.assigned).map((input) => input.name),
    commentedHumanInputNames: bootstrapInputs.filter((input) => !input.assigned).map((input) => input.name),
  }
}

function valuePolicy(input) {
  if (input.secret) return 'operator_secret_or_sensitive'
  if (isOwnerApprovalConfirmationName(input.name)) return 'owner_approval_confirmation'
  if (isTechnicalVerificationConfirmationName(input.name)) return 'technical_verification_confirmation'
  if (isOperatorConfirmationName(input.name)) return 'operator_confirmation'
  if (input.name.endsWith('_EVIDENCE')) return 'owner_evidence_note'
  if (input.name.endsWith('_IDEMPOTENCY_KEY')) return 'operator_unique_id'
  if (input.expectedValue || input.present) return 'prefilled_non_secret_constant'
  return 'operator_non_secret_value'
}

function renderEnvTemplate(requiredInputs) {
  const lines = [
    '# ReEditPro external beta evidence input template - ee177',
    '# Fill in an operator shell or secret manager session only. Do not commit completed values.',
    '# Bearer tokens must remain in authorization headers/env only. Evidence notes must be non-secret summaries.',
    '',
  ]
  let lastGroup
  for (const input of requiredInputs) {
    if (input.group !== lastGroup) {
      if (lastGroup) lines.push('')
      lines.push(`# ${input.group}`)
      lastGroup = input.group
    }
    lines.push(`${input.name}="${escapeTemplateValue(input.templateValue)}"`)
  }
  lines.push('')
  lines.push('# Validate before collector execution:')
  lines.push('# If saving this template locally, use .env.reeditpro-beta-operator.local and run: chmod 600 .env.reeditpro-beta-operator.local')
  lines.push('# npm run beta:readiness:source-freshness-preflight')
  lines.push('# npm run beta:readiness:external-beta-operator-local-env-bootstrap')
  lines.push('# npm run beta:readiness:external-beta-operator-autofill-env')
  lines.push('# npm run beta:readiness:external-beta-operator-autofill-local-env')
  lines.push('# npm run beta:readiness:external-beta-operator-human-input-checklist')
  lines.push('# REEDITPRO_BETA_OPERATOR_ENV_FILE=.env.reeditpro-beta-operator.local npm run beta:readiness:external-beta-operator-local-env-preflight')
  lines.push('# npm run beta:readiness:owner-approval-intake-status')
  lines.push('# REEDITPRO_BETA_OWNER_APPROVAL_ENV_FILE=.env.reeditpro-beta-operator.local npm run beta:readiness:owner-approval-intake-preflight')
  lines.push('# npm run beta:readiness:deployed-evidence-input-manifest -- --status')
  lines.push('# npm run beta:readiness:deployed-evidence-input-manifest')
  lines.push('# npm run beta:tools:trackb-agent-route-deployed-evidence-collector')
  lines.push('# npm run beta:tools:trackb-product-ready-deployed-evidence-collector')
  lines.push('# npm run beta:readiness:external-beta-sequence-preflight')
  lines.push('')
  lines.push('# After collector execution:')
  lines.push('# npm run beta:readiness:external-beta-evidence-collector')
  lines.push('# npm run beta:readiness:operator-status-api')
  lines.push('# operator-status-api can reuse REEDITPRO_BETA_EXTERNAL_API_BASE_URL,')
  lines.push('# REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN, and REEDITPRO_BETA_EXTERNAL_WORKSPACE_ID')
  lines.push('# when the matching REEDITPRO_BETA_STATUS_* aliases are unset.')
  return lines.join('\n')
}

function renderAutofillEnvTemplate(autoFillableInputs) {
  const lines = [
    '# ReEditPro external beta auto-fillable operator exports - ee177',
    '# Safe to generate locally; still export only in an operator shell or secret manager session.',
    '# This file intentionally omits tokens, workspace/project IDs, API URLs, approvals, verification booleans, and evidence notes.',
    '',
  ]
  let lastGroup
  for (const input of autoFillableInputs) {
    if (input.group !== lastGroup) {
      if (lastGroup) lines.push('')
      lines.push(`# ${input.group}`)
      lastGroup = input.group
    }
    lines.push(`export ${input.name}="${escapeTemplateValue(input.value)}"`)
  }
  lines.push('')
  lines.push('# Continue with human-supplied values outside source control:')
  lines.push('# npm run beta:readiness:external-beta-operator-input-template')
  lines.push('# npm run beta:readiness:owner-approval-intake-status')
  lines.push('# REEDITPRO_BETA_OWNER_APPROVAL_ENV_FILE=.env.reeditpro-beta-operator.local npm run beta:readiness:owner-approval-intake-preflight')
  lines.push('# npm run beta:readiness:deployed-evidence-input-manifest -- --status')
  lines.push('# npm run beta:readiness:deployed-evidence-input-manifest')
  lines.push('# npm run beta:tools:trackb-agent-route-deployed-evidence-collector')
  lines.push('# npm run beta:tools:trackb-product-ready-deployed-evidence-collector')
  lines.push('# npm run beta:readiness:external-beta-sequence-preflight')
  return lines.join('\n')
}

function groupCounts(inputs) {
  return inputs.reduce((groups, input) => {
    groups[input.group] = (groups[input.group] ?? 0) + 1
    return groups
  }, {})
}

function groupByField(inputs, field) {
  return inputs.reduce((groups, input) => {
    const value = input[field] ?? 'unknown'
    groups[value] = (groups[value] ?? 0) + 1
    return groups
  }, {})
}

function operatorAction(input) {
  if (input.secret) return 'supply_secret_in_operator_shell'
  if (input.valuePolicy === 'operator_unique_id') return 'generate_unique_idempotency_key'
  if (input.valuePolicy === 'owner_evidence_note') return 'supply_non_secret_owner_evidence_note'
  if (input.valuePolicy === 'owner_approval_confirmation') return 'confirm_named_owner_approval'
  if (input.valuePolicy === 'operator_confirmation') return 'confirm_operator_gate_intent'
  if (input.valuePolicy === 'technical_verification_confirmation') return 'confirm_technical_verification'
  if (input.valuePolicy === 'prefilled_non_secret_constant') return 'export_prefilled_constant_from_template'
  return 'supply_non_secret_operator_value'
}

function isHumanActionableInput(input) {
  return (
    input.valuePolicy === 'operator_secret_or_sensitive' ||
    input.valuePolicy === 'operator_non_secret_value' ||
    input.valuePolicy === 'owner_evidence_note' ||
    input.valuePolicy === 'owner_approval_confirmation' ||
    input.valuePolicy === 'operator_confirmation' ||
    input.valuePolicy === 'technical_verification_confirmation'
  )
}

function isOwnerApprovalConfirmationName(name) {
  return name.includes('_APPROVE_') || name === 'REEDITPRO_BETA_LAUNCH_CONFIRM_EXTERNAL_BETA_APPROVAL'
}

function isTechnicalVerificationConfirmationName(name) {
  return name.endsWith('_VERIFIED')
}

function isOperatorConfirmationName(name) {
  return (
    name.includes('_CONFIRM_') ||
    name.includes('_REQUIRE_') ||
    name.includes('_ACCEPT_') ||
    name.endsWith('_RECORD_EVIDENCE') ||
    name === 'REEDITPRO_BETA_PLATFORM_ALLOW_PERSISTENT_PROBE_WRITES'
  )
}

function toStatusInput(input) {
  return {
    name: input.name,
    group: input.group,
    requiredFor: input.requiredFor,
    secret: input.secret === true,
    valuePolicy: input.valuePolicy,
    operatorAction: operatorAction(input),
  }
}

function toHumanInputChecklistItem(input) {
  return {
    name: input.name,
    group: input.group,
    requiredFor: input.requiredFor,
    collectionRole: input.valuePolicy,
    operatorAction: operatorAction(input),
    secret: input.secret === true,
    valueEmitted: false,
  }
}

function inspectAutofillTarget({ cwd, resolvedPath, existingFile }) {
  const insideRepo = isPathInside(cwd, resolvedPath)
  const safetyGaps = []
  let permissionMode
  let ownerOnlyPermissions
  let symlink = false
  let gitIgnored

  if (existingFile) {
    const lstat = lstatSync(resolvedPath)
    symlink = lstat.isSymbolicLink()
    if (symlink) safetyGaps.push('operator_local_env_autofill_target_is_symlink')
    const stat = statSync(resolvedPath)
    permissionMode = `0${(stat.mode & 0o777).toString(8).padStart(3, '0')}`
    ownerOnlyPermissions = (stat.mode & 0o077) === 0
    if (!ownerOnlyPermissions) safetyGaps.push('operator_local_env_autofill_target_not_owner_only')
  }

  if (insideRepo) {
    gitIgnored = isGitIgnored(cwd, resolvedPath)
    if (!gitIgnored) safetyGaps.push('operator_local_env_autofill_target_not_git_ignored')
  }

  return {
    permissionMode,
    ownerOnlyPermissions,
    symlink,
    insideRepo,
    gitIgnored,
    safetyGaps,
  }
}

function applyAutofillAssignments(content, inputs) {
  const nextLines = content ? content.replace(/\r\n/g, '\n').split('\n') : []
  const updatedInputNames = []
  const appendedInputNames = []
  const unchangedInputNames = []

  for (const input of inputs) {
    const assignment = `${input.name}="${escapeTemplateValue(input.value)}"`
    const lineIndex = nextLines.findIndex((line) => activeAssignmentName(line) === input.name)
    if (lineIndex === -1) {
      appendedInputNames.push(input.name)
      continue
    }
    if (nextLines[lineIndex] === assignment) {
      unchangedInputNames.push(input.name)
    } else {
      nextLines[lineIndex] = assignment
      updatedInputNames.push(input.name)
    }
  }

  const appendInputs = inputs.filter((input) => appendedInputNames.includes(input.name))
  if (appendInputs.length > 0) {
    if (nextLines.length > 0 && nextLines.at(-1) !== '') nextLines.push('')
    nextLines.push('# ReEditPro safe auto-fill values')
    for (const input of appendInputs) {
      nextLines.push(`${input.name}="${escapeTemplateValue(input.value)}"`)
    }
  }

  return {
    content: `${nextLines.join('\n').replace(/\n*$/, '')}\n`,
    updatedInputNames,
    appendedInputNames,
    unchangedInputNames,
  }
}

function activeAssignmentName(line) {
  const match = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=/)
  return match?.[1]
}

function autofillLocalEnvInputCounts(autofill, updatedInputNames, appendedInputNames, unchangedInputNames) {
  return {
    autoFillableInputs: autofill.autoFillableInputs.length,
    generatedIdempotencyKeys: autofill.inputCounts.generatedIdempotencyKeys,
    prefilledNonSecretConstants: autofill.inputCounts.prefilledNonSecretConstants,
    updatedInputs: updatedInputNames.length,
    appendedInputs: appendedInputNames.length,
    unchangedInputs: unchangedInputNames.length,
    humanActionableInputsWritten: 0,
    secretOrSensitiveInputsWritten: 0,
    ownerApprovalInputsWritten: 0,
    ownerEvidenceNotesWritten: 0,
    technicalVerificationInputsWritten: 0,
  }
}

function autofillLocalEnvWarnings() {
  return [
    'This command writes only auto-fillable non-secret constants and generated idempotency keys.',
    'It never writes bearer tokens, workspace/project IDs, owner approval confirmations, technical verification confirmations, evidence notes, signed URLs, raw prompts, or private media references.',
    'It does not call deployed services, record evidence, write Supabase/GCS, run tools, process media, enable external beta, enable real-user-media beta, or enable paid production.',
  ]
}

function isPathInside(parent, child) {
  const relative = path.relative(parent, child)
  return Boolean(relative) && !relative.startsWith('..') && !path.isAbsolute(relative)
}

function isGitIgnored(cwd, resolvedPath) {
  try {
    execFileSync('git', ['check-ignore', '-q', resolvedPath], {
      cwd,
      env: {
        ...process.env,
        DEVELOPER_DIR: process.env.DEVELOPER_DIR ?? '/Library/Developer/CommandLineTools',
      },
      stdio: 'ignore',
    })
    return true
  } catch {
    return false
  }
}

function escapeTemplateValue(value) {
  return String(value).replaceAll('\\', '\\\\').replaceAll('"', '\\"')
}

function clean(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = buildBetaReadinessExternalBetaOperatorInputTemplate()
  if (process.argv.includes('--status')) {
    console.log(JSON.stringify(buildBetaReadinessExternalBetaOperatorInputStatus(report), null, 2))
  } else if (process.argv.includes('--status-markdown')) {
    console.log(renderBetaReadinessExternalBetaOperatorInputStatusMarkdown(buildBetaReadinessExternalBetaOperatorInputStatus(report)))
  } else if (process.argv.includes('--autofill-env')) {
    console.log(buildBetaReadinessExternalBetaOperatorAutofillEnv(report).envTemplate)
  } else if (process.argv.includes('--autofill-json')) {
    console.log(JSON.stringify(buildBetaReadinessExternalBetaOperatorAutofillEnv(report), null, 2))
  } else if (process.argv.includes('--autofill-markdown')) {
    console.log(renderBetaReadinessExternalBetaOperatorAutofillEnvMarkdown(buildBetaReadinessExternalBetaOperatorAutofillEnv(report)))
  } else if (process.argv.includes('--apply-autofill-local-env')) {
    const applyResult = applyBetaReadinessExternalBetaOperatorAutofillLocalEnv({
      report,
      targetPath: readArg('--apply-autofill-path') ?? process.env.REEDITPRO_BETA_OPERATOR_ENV_FILE ?? RECOMMENDED_OPERATOR_ENV_FILE,
    })
    console.log(JSON.stringify(applyResult, null, 2))
    if (applyResult.applied !== true) process.exitCode = 1
  } else if (process.argv.includes('--human-input-checklist')) {
    console.log(JSON.stringify(buildBetaReadinessExternalBetaOperatorHumanInputChecklist(report), null, 2))
  } else if (process.argv.includes('--human-input-markdown')) {
    console.log(renderBetaReadinessExternalBetaOperatorHumanInputChecklistMarkdown(buildBetaReadinessExternalBetaOperatorHumanInputChecklist(report)))
  } else if (process.argv.includes('--bootstrap-local-env')) {
    const bootstrapResult = writeBetaReadinessExternalBetaOperatorLocalEnvBootstrap({
      report,
      targetPath: readArg('--bootstrap-path') ?? RECOMMENDED_OPERATOR_ENV_FILE,
      overwrite: process.argv.includes('--overwrite-bootstrap'),
    })
    console.log(JSON.stringify(bootstrapResult, null, 2))
    if (bootstrapResult.written !== true) process.exitCode = 1
  } else if (process.argv.includes('--env-template')) {
    console.log(report.envTemplate)
  } else if (process.argv.includes('--markdown')) {
    console.log(renderBetaReadinessExternalBetaOperatorInputTemplateMarkdown(report))
  } else {
    console.log(JSON.stringify(report, null, 2))
  }
}

function readArg(name) {
  const index = process.argv.indexOf(name)
  if (index === -1) return undefined
  return process.argv[index + 1]
}
