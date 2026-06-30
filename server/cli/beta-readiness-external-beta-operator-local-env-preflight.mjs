import { execFileSync } from 'node:child_process'
import { existsSync, lstatSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  buildBetaReadinessExternalBetaOperatorAutofillEnv,
  buildBetaReadinessExternalBetaOperatorInputStatus,
  buildBetaReadinessExternalBetaOperatorInputTemplate,
} from './beta-readiness-external-beta-operator-input-template.mjs'
import {
  buildBetaReadinessOwnerApprovalIntakePreflight,
  buildBetaReadinessOwnerApprovalIntakeStatus,
} from './beta-readiness-owner-approval-intake-preflight.mjs'
import { buildBetaReadinessDeployedEvidenceInputManifest } from './beta-readiness-deployed-evidence-input-manifest.mjs'
import { buildBetaReadinessSourceFreshnessPreflight } from './beta-readiness-source-freshness-preflight.mjs'

const DECISION_READY = 'beta_readiness_external_beta_operator_local_env_preflight_passed_ready_for_external_beta_evidence_collector'
const DECISION_BLOCKED = 'beta_readiness_external_beta_operator_local_env_preflight_blocked_missing_or_unsafe_operator_inputs'
const DECISION_SOURCE_FRESHNESS_BLOCKED = 'beta_readiness_external_beta_operator_local_env_preflight_blocked_source_freshness_not_ready'
const PROGRESS_DECISION = 'beta_readiness_external_beta_operator_value_progress_passed_redacted_progress_review'
export const RECOMMENDED_OPERATOR_ENV_FILE = '.env.reeditpro-beta-operator.local'

export function buildBetaReadinessExternalBetaOperatorLocalEnvPreflight(options = {}) {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd())
  const envFilePath = clean(options.envFilePath ?? options.env?.REEDITPRO_BETA_OPERATOR_ENV_FILE ?? process.env.REEDITPRO_BETA_OPERATOR_ENV_FILE)
  const envFile = readOperatorEnvFile({ envFilePath, envFileContent: options.envFileContent, repoRoot })
  const baseEnv = { ...(options.env ?? process.env) }
  const autofill = buildBetaReadinessExternalBetaOperatorAutofillEnv(buildBetaReadinessExternalBetaOperatorInputTemplate({}))
  const autofillEnv = Object.fromEntries(autofill.autoFillableInputs.map((input) => [input.name, input.value]))
  const effectiveEnv = {
    ...baseEnv,
    ...Object.fromEntries(Object.entries(autofillEnv).filter(([name]) => !present(baseEnv[name]))),
    ...envFile.values,
  }
  const operatorTemplate = buildBetaReadinessExternalBetaOperatorInputTemplate(effectiveEnv)
  const operatorStatus = buildBetaReadinessExternalBetaOperatorInputStatus(operatorTemplate)
  const placeholderInputPaths = operatorTemplate.requiredInputs
    .filter((input) => present(effectiveEnv[input.name]) && isPlaceholderValue(effectiveEnv[input.name]))
    .map((input) => `operatorEnv.${input.name}`)
  const sourceFreshness = buildBetaReadinessSourceFreshnessPreflight(effectiveEnv, {
    resolveGit: options.resolveGit,
  })
  const ownerPreflight = buildBetaReadinessOwnerApprovalIntakePreflight(effectiveEnv)
  const ownerStatus = buildBetaReadinessOwnerApprovalIntakeStatus(ownerPreflight)
  const deployedManifest = buildBetaReadinessDeployedEvidenceInputManifest(effectiveEnv)
  const safetyGaps = [
    ...envFile.safetyGaps,
    ...(envFile.invalidLines.length > 0 ? ['operator_env_file_has_invalid_lines'] : []),
    ...(placeholderInputPaths.length > 0 ? ['operator_env_file_contains_placeholder_values'] : []),
    ...(ownerPreflight.secretLikeInputPaths.length > 0 ? ['owner_evidence_contains_secret_like_material'] : []),
    ...(deployedManifest.secretLikeInputPaths.length > 0 ? ['deployed_manifest_inputs_contain_secret_like_material'] : []),
  ]
  const readyForExternalBetaEvidenceCollector = operatorStatus.pendingInputs.length === 0 &&
    sourceFreshness.readyForDeployedEvidenceInputManifest === true &&
    ownerPreflight.readyForDeployedEvidenceInputManifest === true &&
    deployedManifest.readyToRunExternalBetaEvidenceCollector === true &&
    safetyGaps.length === 0
  const blockedOnlyBySourceFreshness = !readyForExternalBetaEvidenceCollector &&
    operatorStatus.pendingInputs.length === 0 &&
    sourceFreshness.readyForDeployedEvidenceInputManifest !== true &&
    ownerPreflight.readyForDeployedEvidenceInputManifest === true &&
    deployedManifest.readyToRunExternalBetaEvidenceCollector === true &&
    safetyGaps.length === 0
  const decision = readyForExternalBetaEvidenceCollector
    ? DECISION_READY
    : (blockedOnlyBySourceFreshness ? DECISION_SOURCE_FRESHNESS_BLOCKED : DECISION_BLOCKED)

  return {
    ok: true,
    decision,
    readyForExternalBetaEvidenceCollector,
    envFile: {
      provided: Boolean(envFilePath || options.envFileContent),
      loaded: envFile.loaded,
      displayPath: envFile.displayPath,
      recommendedRepoLocalPath: RECOMMENDED_OPERATOR_ENV_FILE,
      permissionMode: envFile.permissionMode,
      ownerOnlyPermissions: envFile.ownerOnlyPermissions,
      symlink: envFile.symlink,
      insideRepo: envFile.insideRepo,
      gitIgnored: envFile.gitIgnored,
      parsedLineCount: envFile.parsedLineCount,
      betaInputKeysLoaded: envFile.betaInputKeysLoaded,
      invalidLineCount: envFile.invalidLines.length,
      invalidLines: envFile.invalidLines,
      placeholderInputPaths,
      safetyGaps: envFile.safetyGaps,
    },
    autoFill: {
      applied: true,
      inputCount: autofill.autoFillableInputs.length,
      generatedIdempotencyKeys: autofill.inputCounts.generatedIdempotencyKeys,
      prefilledNonSecretConstants: autofill.inputCounts.prefilledNonSecretConstants,
      emittedSecretOrHumanValues: 0,
      appliedInputNames: autofill.autoFillableInputs.map((input) => input.name),
    },
    operatorInputs: {
      decision: operatorStatus.decision,
      required: operatorStatus.inputCounts.required,
      pending: operatorStatus.pendingInputs.length,
      humanActionablePending: operatorStatus.actionabilityCounts.humanActionablePending,
      autoFillablePending: operatorStatus.actionabilityCounts.autoFillablePending,
      pendingGroups: operatorStatus.pendingInputGroups,
      pendingValuePolicies: operatorStatus.pendingValuePolicies,
      pendingInputNames: operatorStatus.pendingInputs.map((input) => input.name),
    },
    sourceFreshness: {
      decision: sourceFreshness.decision,
      readyForOwnerApprovalIntake: sourceFreshness.readyForOwnerApprovalIntake,
      readyForDeployedEvidenceInputManifest: sourceFreshness.readyForDeployedEvidenceInputManifest,
      currentSourceSha: sourceFreshness.currentSourceSha,
      deployedSourceSha: sourceFreshness.deployedSourceSha,
      metadataOnlySourceDriftAllowed: sourceFreshness.sourceDriftClassification?.metadataOnlySourceDriftAllowed === true,
      blockingChangedFiles: sourceFreshness.sourceDriftClassification?.blockingChangedFiles ?? [],
      valueGaps: sourceFreshness.valueGaps,
    },
    ownerApprovalIntake: {
      decision: ownerPreflight.decision,
      readyForDeployedEvidenceInputManifest: ownerPreflight.readyForDeployedEvidenceInputManifest,
      counts: ownerStatus.inputCounts,
      pendingInputNames: ownerStatus.pendingInputs.map((input) => input.name),
      invalidBooleanInputs: ownerStatus.invalidBooleanInputs,
      rejectedScopeInputs: ownerStatus.rejectedScopeInputs,
      secretLikeInputPaths: ownerStatus.secretLikeInputPaths,
    },
    deployedEvidenceInputManifest: {
      decision: deployedManifest.decision,
      readyToRunExternalBetaEvidenceCollector: deployedManifest.readyToRunExternalBetaEvidenceCollector,
      pendingRequiredInputs: deployedManifest.pendingRequiredInputs.length,
      valueGaps: deployedManifest.valueGaps.length,
      secretLikeInputPaths: deployedManifest.secretLikeInputPaths,
    },
    sourceTruth: {
      templateId: operatorTemplate.templateId,
      deployedEvidenceManifestPath: operatorTemplate.sourceTruth.deployedEvidenceManifestPath,
      deployedSourceSha: operatorTemplate.sourceTruth.deployedSourceSha,
      trackBToolTotals: operatorTemplate.sourceTruth.trackBToolTotals,
      productReadyLocalOssCount: operatorTemplate.sourceTruth.productReadyLocalOssCount,
    },
    safetyGaps,
    validationCommands: [
      'npm run beta:readiness:external-beta-operator-local-env-bootstrap',
      'npm run beta:readiness:external-beta-operator-autofill-env',
      'npm run beta:readiness:external-beta-operator-autofill-local-env',
      'npm run beta:readiness:external-beta-operator-human-input-checklist',
      `REEDITPRO_BETA_OPERATOR_ENV_FILE=${RECOMMENDED_OPERATOR_ENV_FILE} npm run beta:readiness:external-beta-operator-local-env-preflight`,
      `REEDITPRO_BETA_OWNER_APPROVAL_ENV_FILE=${RECOMMENDED_OPERATOR_ENV_FILE} npm run beta:readiness:owner-approval-intake-preflight`,
      'npm run beta:readiness:deployed-evidence-input-manifest -- --status',
      'npm run beta:readiness:deployed-evidence-input-manifest',
      'npm run beta:tools:trackb-product-ready-deployed-evidence-collector',
      'npm run beta:readiness:external-beta-sequence-preflight',
      'npm run beta:readiness:external-beta-evidence-collector',
    ],
    blockedScopeConfirmations: operatorTemplate.blockedScopeConfirmations,
    supabaseClassification: operatorTemplate.supabaseClassification,
    warnings: [
      'This preflight loads a local operator env file in memory only and prints names/counts, never values.',
      'Auto-fillable non-secret constants and idempotency keys are applied in memory so operators can validate only the human-owned values they supplied.',
      `If the env file lives inside the repo, use the git-ignored ${RECOMMENDED_OPERATOR_ENV_FILE} path or another git-ignored local-only path; committed completed env files remain forbidden.`,
      'If the env file is loaded from disk on POSIX systems it must not be a symlink and must be owner-only, for example chmod 600 .env.reeditpro-beta-operator.local.',
      'This command does not call deployed services, record evidence, write Supabase/GCS, run tools, process media, enable beta, or enable production.',
    ],
    nextSafeAction: readyForExternalBetaEvidenceCollector
      ? 'Run source freshness, owner approval intake preflight, deployed evidence input manifest, then the external beta evidence collector from an operator shell that contains the same approved values.'
      : blockedOnlyBySourceFreshness
        ? 'Redeploy or prove source freshness for the current central source, then rerun this local env preflight before any deployed evidence collector.'
      : 'Fill the listed pending human/operator/owner values in a local ignored env file, rerun this preflight, then run owner approval intake and deployed evidence input manifest before any deployed collector.',
  }
}

export function renderBetaReadinessExternalBetaOperatorLocalEnvPreflightMarkdown(report) {
  const lines = [
    '# Beta Readiness External Beta Operator Local Env Preflight',
    '',
    `Decision: \`${report.decision}\``,
    `Ready for external beta evidence collector: \`${report.readyForExternalBetaEvidenceCollector}\``,
    '',
    '## Env File',
    '',
    `- Provided: \`${report.envFile.provided}\``,
    `- Loaded: \`${report.envFile.loaded}\``,
    `- Path: \`${report.envFile.displayPath ?? 'none'}\``,
    `- Recommended repo-local path: \`${report.envFile.recommendedRepoLocalPath}\``,
    `- Permission mode: \`${report.envFile.permissionMode ?? 'not_applicable'}\``,
    `- Owner-only permissions: \`${report.envFile.ownerOnlyPermissions ?? 'not_applicable'}\``,
    `- Symlink: \`${report.envFile.symlink ?? 'not_applicable'}\``,
    `- Inside repo: \`${report.envFile.insideRepo}\``,
    `- Git ignored: \`${report.envFile.gitIgnored ?? 'not_applicable'}\``,
    `- Parsed beta input keys: \`${report.envFile.betaInputKeysLoaded}\``,
    `- Invalid lines: \`${report.envFile.invalidLineCount}\``,
    `- Placeholder values: \`${report.envFile.placeholderInputPaths.length}\``,
    '',
    '## Counts',
    '',
    `- Auto-fill inputs applied in memory: \`${report.autoFill.inputCount}\``,
    `- Operator inputs pending: \`${report.operatorInputs.pending}\``,
    `- Human-actionable pending: \`${report.operatorInputs.humanActionablePending}\``,
    `- Source freshness ready: \`${report.sourceFreshness.readyForDeployedEvidenceInputManifest}\``,
    `- Source freshness blocking files: \`${report.sourceFreshness.blockingChangedFiles.length}\``,
    `- Owner intake pending: \`${report.ownerApprovalIntake.counts.pending}\``,
    `- Deployed manifest pending inputs: \`${report.deployedEvidenceInputManifest.pendingRequiredInputs}\``,
    `- Deployed manifest value gaps: \`${report.deployedEvidenceInputManifest.valueGaps}\``,
    `- Safety gaps: \`${report.safetyGaps.length}\``,
    '',
    '## Pending Operator Inputs',
    '',
    ...report.operatorInputs.pendingInputNames.map((name) => `- \`${name}\``),
    '',
    '## Pending Owner Inputs',
    '',
    ...report.ownerApprovalIntake.pendingInputNames.map((name) => `- \`${name}\``),
    '',
    '## Boundary',
    '',
    'This report printed no bearer token, workspace/project value, owner evidence text, signed URL, raw prompt, private media reference, or secret value.',
    'It did not grant approval, call deployed services, record evidence, write Supabase, run SQL, write GCS, dispatch workers, call providers, process media, enable external beta, enable real-user-media beta, enable paid production, create public artifacts, or create signed URLs.',
    '',
    'Supabase classification: no write / environment none / SQL none / migration no.',
    '',
    `Next safe action: ${report.nextSafeAction}`,
  ]
  return lines.join('\n')
}

export function buildBetaReadinessExternalBetaOperatorValueProgress(options = {}) {
  const preflight = buildBetaReadinessExternalBetaOperatorLocalEnvPreflight(options)
  const template = buildBetaReadinessExternalBetaOperatorInputTemplate({})
  const requiredGroups = groupByField(template.requiredInputs, 'group')
  const requiredValuePolicies = groupByField(template.requiredInputs, 'valuePolicy')
  const pendingGroups = preflight.operatorInputs.pendingGroups ?? {}
  const pendingValuePolicies = preflight.operatorInputs.pendingValuePolicies ?? {}
  const presentGroups = subtractCounts(requiredGroups, pendingGroups)
  const presentValuePolicies = subtractCounts(requiredValuePolicies, pendingValuePolicies)
  const blockers = progressBlockers(preflight)
  return {
    ok: true,
    decision: PROGRESS_DECISION,
    preflightDecision: preflight.decision,
    readyForExternalBetaEvidenceCollector: preflight.readyForExternalBetaEvidenceCollector,
    envFile: {
      provided: preflight.envFile.provided,
      loaded: preflight.envFile.loaded,
      displayPath: preflight.envFile.displayPath,
      recommendedRepoLocalPath: preflight.envFile.recommendedRepoLocalPath,
      permissionMode: preflight.envFile.permissionMode,
      ownerOnlyPermissions: preflight.envFile.ownerOnlyPermissions,
      symlink: preflight.envFile.symlink,
      insideRepo: preflight.envFile.insideRepo,
      gitIgnored: preflight.envFile.gitIgnored,
      betaInputKeysLoaded: preflight.envFile.betaInputKeysLoaded,
      invalidLineCount: preflight.envFile.invalidLineCount,
      placeholderValueCount: preflight.envFile.placeholderInputPaths.length,
      safetyGaps: preflight.envFile.safetyGaps,
    },
    progress: {
      requiredInputs: preflight.operatorInputs.required,
      presentOrAutofilledInputs: preflight.operatorInputs.required - preflight.operatorInputs.pending,
      pendingInputs: preflight.operatorInputs.pending,
      percentComplete: percentage(preflight.operatorInputs.required - preflight.operatorInputs.pending, preflight.operatorInputs.required),
      humanActionablePending: preflight.operatorInputs.humanActionablePending,
      autoFillAppliedInMemory: preflight.autoFill.inputCount,
      autoFillablePending: preflight.operatorInputs.autoFillablePending,
    },
    groupProgress: progressRows(requiredGroups, presentGroups, pendingGroups),
    valuePolicyProgress: progressRows(requiredValuePolicies, presentValuePolicies, pendingValuePolicies),
    gateProgress: {
      sourceFreshnessReady: preflight.sourceFreshness.readyForDeployedEvidenceInputManifest,
      ownerApprovalReady: preflight.ownerApprovalIntake.readyForDeployedEvidenceInputManifest,
      deployedManifestReady: preflight.deployedEvidenceInputManifest.readyToRunExternalBetaEvidenceCollector,
      sourceFreshnessDecision: preflight.sourceFreshness.decision,
      ownerApprovalDecision: preflight.ownerApprovalIntake.decision,
      deployedManifestDecision: preflight.deployedEvidenceInputManifest.decision,
    },
    blockers,
    pendingInputNames: preflight.operatorInputs.pendingInputNames,
    pendingOwnerInputNames: preflight.ownerApprovalIntake.pendingInputNames,
    sourceTruth: preflight.sourceTruth,
    blockedScopeConfirmations: preflight.blockedScopeConfirmations,
    supabaseClassification: preflight.supabaseClassification,
    validationCommands: [
      'npm run beta:readiness:external-beta-operator-local-env-bootstrap',
      `REEDITPRO_BETA_OPERATOR_ENV_FILE=${RECOMMENDED_OPERATOR_ENV_FILE} npm run beta:readiness:external-beta-operator-value-progress`,
      `REEDITPRO_BETA_OPERATOR_ENV_FILE=${RECOMMENDED_OPERATOR_ENV_FILE} npm run beta:readiness:external-beta-operator-local-env-preflight`,
      `REEDITPRO_BETA_OWNER_APPROVAL_ENV_FILE=${RECOMMENDED_OPERATOR_ENV_FILE} npm run beta:readiness:owner-approval-intake-preflight`,
      'npm run beta:readiness:deployed-evidence-input-manifest -- --status',
      'npm run beta:readiness:deployed-evidence-input-manifest',
      'npm run beta:tools:trackb-product-ready-deployed-evidence-collector',
    ],
    warnings: [
      'This progress report is redacted: it prints names, counts, decisions, and blocker ids only.',
      'It never prints bearer tokens, workspace/project values, owner evidence text, signed URLs, raw prompts, private media references, or secret values.',
      'It does not grant approval, call deployed services, record evidence, write Supabase/GCS, run tools, process media, enable external beta, enable real-user-media beta, or enable paid production.',
    ],
    nextSafeAction: nextProgressAction(preflight, blockers),
  }
}

export function renderBetaReadinessExternalBetaOperatorValueProgressMarkdown(report) {
  const lines = [
    '# Beta Readiness External Beta Operator Value Progress',
    '',
    `Decision: \`${report.decision}\``,
    `Preflight decision: \`${report.preflightDecision}\``,
    `Ready for external beta evidence collector: \`${report.readyForExternalBetaEvidenceCollector}\``,
    '',
    '## Progress',
    '',
    `- Required inputs: \`${report.progress.requiredInputs}\``,
    `- Present or auto-filled in memory: \`${report.progress.presentOrAutofilledInputs}\``,
    `- Pending inputs: \`${report.progress.pendingInputs}\``,
    `- Complete: \`${report.progress.percentComplete}%\``,
    `- Human-actionable pending: \`${report.progress.humanActionablePending}\``,
    `- Auto-fill applied in memory: \`${report.progress.autoFillAppliedInMemory}\``,
    '',
    '## Env File',
    '',
    `- Provided: \`${report.envFile.provided}\``,
    `- Loaded: \`${report.envFile.loaded}\``,
    `- Path: \`${report.envFile.displayPath ?? 'none'}\``,
    `- Permission mode: \`${report.envFile.permissionMode ?? 'not_applicable'}\``,
    `- Owner-only permissions: \`${report.envFile.ownerOnlyPermissions ?? 'not_applicable'}\``,
    `- Symlink: \`${report.envFile.symlink ?? 'not_applicable'}\``,
    `- Inside repo: \`${report.envFile.insideRepo}\``,
    `- Git ignored: \`${report.envFile.gitIgnored ?? 'not_applicable'}\``,
    `- Parsed beta input keys: \`${report.envFile.betaInputKeysLoaded}\``,
    `- Invalid lines: \`${report.envFile.invalidLineCount}\``,
    `- Placeholder values: \`${report.envFile.placeholderValueCount}\``,
    '',
    '## Gates',
    '',
    `- Source freshness ready: \`${report.gateProgress.sourceFreshnessReady}\``,
    `- Owner approval ready: \`${report.gateProgress.ownerApprovalReady}\``,
    `- Deployed manifest ready: \`${report.gateProgress.deployedManifestReady}\``,
    '',
    '## Pending By Group',
    '',
    ...report.groupProgress.map((row) => `- ${row.name}: \`${row.present}/${row.required}\` present, \`${row.pending}\` pending`),
    '',
    '## Pending By Value Policy',
    '',
    ...report.valuePolicyProgress.map((row) => `- ${row.name}: \`${row.present}/${row.required}\` present, \`${row.pending}\` pending`),
    '',
    '## Blockers',
    '',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- \`${blocker}\``) : ['- `none`']),
    '',
    '## Boundary',
    '',
    'This report printed no bearer token, workspace/project value, owner evidence text, signed URL, raw prompt, private media reference, or secret value.',
    'It did not grant approval, call deployed services, record evidence, write Supabase, run SQL, write GCS, dispatch workers, call providers, process media, enable external beta, enable real-user-media beta, enable paid production, create public artifacts, or create signed URLs.',
    '',
    'Supabase classification: no write / environment none / SQL none / migration no.',
    '',
    `Next safe action: ${report.nextSafeAction}`,
  ]
  return lines.join('\n')
}

function readOperatorEnvFile({ envFilePath, envFileContent, repoRoot }) {
  const provided = Boolean(envFilePath || envFileContent)
  if (!provided) {
    return {
      loaded: false,
      displayPath: undefined,
      permissionMode: undefined,
      ownerOnlyPermissions: undefined,
      symlink: undefined,
      insideRepo: false,
      gitIgnored: undefined,
      parsedLineCount: 0,
      betaInputKeysLoaded: 0,
      invalidLines: [],
      safetyGaps: [],
      values: {},
    }
  }
  const resolvedPath = envFilePath ? path.resolve(envFilePath) : undefined
  const displayPath = resolvedPath ? redactHome(resolvedPath) : 'inline-env-content'
  const safetyGaps = []
  let text = envFileContent
  let fileSecurity
  if (text === undefined) {
    if (!resolvedPath || !existsSync(resolvedPath)) {
      return {
        loaded: false,
        displayPath,
        permissionMode: undefined,
        ownerOnlyPermissions: undefined,
        symlink: undefined,
        insideRepo: false,
        gitIgnored: undefined,
        parsedLineCount: 0,
        betaInputKeysLoaded: 0,
        invalidLines: [],
        safetyGaps: ['operator_env_file_missing'],
        values: {},
      }
    }
    const security = inspectOperatorEnvFileSecurity(resolvedPath)
    safetyGaps.push(...security.safetyGaps)
    text = readFileSync(resolvedPath, 'utf8')
    fileSecurity = security
  }
  const insideRepo = resolvedPath ? isInside(repoRoot, resolvedPath) : false
  const gitIgnored = insideRepo && resolvedPath ? isGitIgnored(repoRoot, resolvedPath) : undefined
  if (insideRepo && gitIgnored !== true) {
    safetyGaps.push('operator_env_file_inside_repo_not_gitignored')
  }
  const parsed = parseEnvText(text)
  return {
    loaded: true,
    displayPath,
    permissionMode: fileSecurity?.permissionMode,
    ownerOnlyPermissions: fileSecurity?.ownerOnlyPermissions,
    symlink: fileSecurity?.symlink,
    insideRepo,
    gitIgnored,
    parsedLineCount: parsed.parsedLineCount,
    betaInputKeysLoaded: Object.keys(parsed.values).filter((name) => name.startsWith('REEDITPRO_BETA_')).length,
    invalidLines: parsed.invalidLines,
    safetyGaps,
    values: parsed.values,
  }
}

function parseEnvText(text) {
  const values = {}
  const invalidLines = []
  let parsedLineCount = 0
  String(text).split(/\r?\n/).forEach((rawLine, index) => {
    const lineNumber = index + 1
    const trimmed = rawLine.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const assignment = trimmed.startsWith('export ') ? trimmed.slice('export '.length).trim() : trimmed
    const match = assignment.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match) {
      invalidLines.push({ lineNumber, reason: 'not_key_value_assignment' })
      return
    }
    const [, name, rawValue] = match
    values[name] = parseEnvValue(rawValue)
    parsedLineCount += 1
  })
  return { values, invalidLines, parsedLineCount }
}

function inspectOperatorEnvFileSecurity(filePath) {
  try {
    const stat = lstatSync(filePath)
    const permissionMode = `0${(stat.mode & 0o777).toString(8).padStart(3, '0')}`
    const symlink = stat.isSymbolicLink()
    const ownerOnlyPermissions = !symlink && (stat.mode & 0o077) === 0
    const safetyGaps = [
      ...(symlink ? ['operator_env_file_is_symlink'] : []),
      ...(!ownerOnlyPermissions ? ['operator_env_file_permissions_not_owner_only'] : []),
    ]
    return { permissionMode, ownerOnlyPermissions, symlink, safetyGaps }
  } catch {
    return {
      permissionMode: undefined,
      ownerOnlyPermissions: undefined,
      symlink: undefined,
      safetyGaps: ['operator_env_file_permission_check_failed'],
    }
  }
}

function parseEnvValue(rawValue) {
  const trimmed = String(rawValue).trim()
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    const body = trimmed.slice(1, -1)
    if (trimmed.startsWith("'")) return body
    return body
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
  }
  return trimmed.replace(/\s+#.*$/, '')
}

function isInside(root, candidate) {
  const relative = path.relative(root, candidate)
  return Boolean(relative) && !relative.startsWith('..') && !path.isAbsolute(relative)
}

function isGitIgnored(repoRoot, filePath) {
  try {
    execFileSync('git', ['check-ignore', '-q', path.relative(repoRoot, filePath)], {
      cwd: repoRoot,
      stdio: 'ignore',
      env: gitExecEnv(),
    })
    return true
  } catch {
    return false
  }
}

function gitExecEnv() {
  if (process.platform !== 'darwin') return process.env
  if (process.env.DEVELOPER_DIR && existsSync(process.env.DEVELOPER_DIR)) return process.env
  return {
    ...process.env,
    DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
  }
}

function redactHome(filePath) {
  const home = process.env.HOME
  if (home && filePath.startsWith(`${home}/`)) return `~/${filePath.slice(home.length + 1)}`
  return filePath
}

function clean(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

function present(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function isPlaceholderValue(value) {
  const cleaned = clean(value)
  return Boolean(cleaned && /^<[^>]+>$/.test(cleaned))
}

function groupByField(items, field) {
  return items.reduce((counts, item) => {
    const key = item[field] ?? 'unknown'
    counts[key] = (counts[key] ?? 0) + 1
    return counts
  }, {})
}

function subtractCounts(required, pending) {
  return Object.fromEntries(
    Object.entries(required).map(([key, count]) => [key, Math.max(0, count - (pending[key] ?? 0))]),
  )
}

function progressRows(required, present, pending) {
  return Object.keys(required).sort().map((name) => ({
    name,
    required: required[name] ?? 0,
    present: present[name] ?? 0,
    pending: pending[name] ?? 0,
    percentComplete: percentage(present[name] ?? 0, required[name] ?? 0),
  }))
}

function percentage(value, total) {
  if (!total) return 100
  return Math.round((value / total) * 100)
}

function progressBlockers(preflight) {
  return [
    ...(preflight.envFile.provided ? [] : ['operator_env_file_not_provided']),
    ...(preflight.envFile.loaded ? [] : ['operator_env_file_not_loaded']),
    ...(preflight.envFile.invalidLineCount > 0 ? ['operator_env_file_has_invalid_lines'] : []),
    ...(preflight.envFile.placeholderInputPaths.length > 0 ? ['operator_env_file_contains_placeholder_values'] : []),
    ...preflight.safetyGaps,
    ...(preflight.operatorInputs.pending > 0 ? ['operator_inputs_pending'] : []),
    ...(preflight.sourceFreshness.readyForDeployedEvidenceInputManifest ? [] : ['source_freshness_not_ready']),
    ...(preflight.ownerApprovalIntake.readyForDeployedEvidenceInputManifest ? [] : ['owner_approval_intake_not_ready']),
    ...(preflight.deployedEvidenceInputManifest.readyToRunExternalBetaEvidenceCollector ? [] : ['deployed_evidence_manifest_not_ready']),
  ].filter((value, index, values) => values.indexOf(value) === index)
}

function nextProgressAction(preflight, blockers) {
  if (preflight.readyForExternalBetaEvidenceCollector) {
    return 'Run the source freshness preflight, owner approval intake preflight, deployed evidence input manifest, and then the external beta evidence collector from the same approved operator shell.'
  }
  if (blockers.includes('operator_env_file_not_provided') || blockers.includes('operator_env_file_not_loaded')) {
    return `Run npm run beta:readiness:external-beta-operator-local-env-bootstrap, fill ${RECOMMENDED_OPERATOR_ENV_FILE} outside source control, chmod 600 it, then rerun this progress report.`
  }
  if (blockers.includes('operator_env_file_contains_placeholder_values')) {
    return 'Replace every placeholder value with the correct operator/owner/technical evidence value outside source control, then rerun the local env preflight.'
  }
  if (blockers.includes('operator_inputs_pending')) {
    return 'Continue filling the pending operator/owner/technical values shown by name only, then rerun this progress report and the local env preflight.'
  }
  if (blockers.includes('source_freshness_not_ready')) return 'Refresh or re-record source freshness evidence before deployed evidence collection.'
  if (blockers.includes('owner_approval_intake_not_ready')) return 'Run the owner approval intake status/preflight with the same local env file and resolve remaining owner inputs.'
  if (blockers.includes('deployed_evidence_manifest_not_ready')) return 'Run the deployed evidence input manifest and resolve its named gaps before the collector.'
  return 'Resolve the listed safety gaps, then rerun this progress report.'
}

function readArg(name) {
  const index = process.argv.indexOf(name)
  if (index === -1) return undefined
  return process.argv[index + 1]
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const options = {
    envFilePath: readArg('--env-file'),
  }
  if (process.argv.includes('--progress')) {
    const report = buildBetaReadinessExternalBetaOperatorValueProgress(options)
    if (process.argv.includes('--markdown')) {
      console.log(renderBetaReadinessExternalBetaOperatorValueProgressMarkdown(report))
    } else {
      console.log(JSON.stringify(report, null, 2))
    }
  } else {
    const report = buildBetaReadinessExternalBetaOperatorLocalEnvPreflight(options)
    if (process.argv.includes('--markdown')) {
      console.log(renderBetaReadinessExternalBetaOperatorLocalEnvPreflightMarkdown(report))
    } else {
      console.log(JSON.stringify(report, null, 2))
    }
    if (report.envFile.provided && report.safetyGaps.length > 0) {
      process.exitCode = 1
    }
    if (process.argv.includes('--require-ready') && !report.readyForExternalBetaEvidenceCollector) {
      process.exitCode = 1
    }
  }
}
