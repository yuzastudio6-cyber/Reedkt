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
  const sourceFreshness = buildBetaReadinessSourceFreshnessPreflight(effectiveEnv, {
    resolveGit: options.resolveGit,
  })
  const ownerPreflight = buildBetaReadinessOwnerApprovalIntakePreflight(effectiveEnv)
  const ownerStatus = buildBetaReadinessOwnerApprovalIntakeStatus(ownerPreflight)
  const deployedManifest = buildBetaReadinessDeployedEvidenceInputManifest(effectiveEnv)
  const safetyGaps = [
    ...envFile.safetyGaps,
    ...(envFile.invalidLines.length > 0 ? ['operator_env_file_has_invalid_lines'] : []),
    ...(ownerPreflight.secretLikeInputPaths.length > 0 ? ['owner_evidence_contains_secret_like_material'] : []),
    ...(deployedManifest.secretLikeInputPaths.length > 0 ? ['deployed_manifest_inputs_contain_secret_like_material'] : []),
  ]
  const readyForExternalBetaEvidenceCollector = operatorStatus.pendingInputs.length === 0 &&
    sourceFreshness.readyForDeployedEvidenceInputManifest === true &&
    ownerPreflight.readyForDeployedEvidenceInputManifest === true &&
    deployedManifest.readyToRunExternalBetaEvidenceCollector === true &&
    safetyGaps.length === 0

  return {
    ok: true,
    decision: readyForExternalBetaEvidenceCollector ? DECISION_READY : DECISION_BLOCKED,
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
      'npm run beta:readiness:external-beta-operator-autofill-env',
      'npm run beta:readiness:external-beta-operator-human-input-checklist',
      `REEDITPRO_BETA_OPERATOR_ENV_FILE=${RECOMMENDED_OPERATOR_ENV_FILE} npm run beta:readiness:external-beta-operator-local-env-preflight`,
      `REEDITPRO_BETA_OWNER_APPROVAL_ENV_FILE=${RECOMMENDED_OPERATOR_ENV_FILE} npm run beta:readiness:owner-approval-intake-preflight`,
      'npm run beta:readiness:deployed-evidence-input-manifest',
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

function readArg(name) {
  const index = process.argv.indexOf(name)
  if (index === -1) return undefined
  return process.argv[index + 1]
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = buildBetaReadinessExternalBetaOperatorLocalEnvPreflight({
    envFilePath: readArg('--env-file'),
  })
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
