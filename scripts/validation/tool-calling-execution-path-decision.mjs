import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tsImport } from 'tsx/esm/api'

function readCommittedPackageLockSha256() {
  const env = { ...process.env }
  delete env.DEVELOPER_DIR

  return createHash('sha256')
    .update(execFileSync('git', ['show', 'HEAD:package-lock.json'], {
      cwd: process.cwd(),
      env,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }))
    .digest('hex')
}

const EXPECTED_PACKAGE_LOCK_SHA256 = readCommittedPackageLockSha256()
const BINARY_FIXTURE_MILESTONE = 'REEDITPRO-TOOL-CALLING-BINARY-FIXTURE-GENERATION-1'
const LOW_RISK_EXECUTION_MILESTONE = 'REEDITPRO-TOOL-CALLING-CONTROLLED-LOW-RISK-TOOL-EXECUTION-1'

const FORBIDDEN_DECISION_KEYS = [
  'rawPrompt',
  'raw_prompt',
  'rawUserChat',
  'signedUrl',
  'signed_url',
  'serviceRole',
  'service_role',
  'serviceRoleKey',
  'providerApiKey',
  'secretValue',
  'arbitraryArgs',
  'arbitrary_args',
  'shellCommand',
  'shell_command',
  'command',
  'args',
  'argv',
  'exec',
  'spawn',
  'outputPath',
  'localPath',
  'absolutePath',
]

function runCommand(command, args, options = {}) {
  const env = { ...process.env }
  delete env.DEVELOPER_DIR

  try {
    return {
      ok: true,
      output: execFileSync(command, args, {
        cwd: process.cwd(),
        env,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        maxBuffer: 40 * 1024 * 1024,
        ...options,
      }),
      error: null,
    }
  } catch (error) {
    return {
      ok: false,
      output: `${error.stdout ?? ''}${error.stderr ?? ''}`,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

function runGit(args) {
  return runCommand('git', args)
}

function splitLines(value) {
  return value ? value.split('\n').filter(Boolean) : []
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort()
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function parseJsonOutput(output) {
  const jsonStart = output.indexOf('{')
  if (jsonStart < 0) {
    throw new Error('Expected JSON object output.')
  }

  return JSON.parse(output.slice(jsonStart))
}

function runRefreshGate() {
  const result = runCommand('node', ['scripts/validation/tool-calling-refresh-gate.mjs'])
  if (!result.output) {
    return {
      ok: false,
      continueAllowed: false,
      blockingReasons: ['refresh gate produced no JSON output'],
      warnings: [],
      error: result.error,
    }
  }

  const parsed = parseJsonOutput(result.output)
  return {
    ok: result.ok && parsed.ok === true,
    ...parsed,
    error: result.ok ? null : result.error,
  }
}

function walkFiles(root, output = []) {
  if (!existsSync(root)) return output

  for (const entry of readdirSync(root)) {
    const filePath = `${root}/${entry}`
    const stat = statSync(filePath)
    if (stat.isDirectory()) {
      if (['node_modules', '.git', 'dist', 'build', 'coverage'].includes(entry)) continue
      walkFiles(filePath, output)
    } else if (stat.isFile()) {
      output.push(filePath)
    }
  }

  return output
}

function scanRelatedFiles() {
  const roots = [
    'server',
    'docs',
    'scripts',
    'database/migration-drafts',
    'database/test-sql',
  ]
  const allFiles = roots.flatMap((root) => walkFiles(root))
  const relatedFiles = uniqueSorted(allFiles.filter((filePath) => (
    /fixture|fixtures|synthetic|dry-run|dryrun|execution|command-plan|worker/i.test(filePath) ||
    filePath.startsWith('database/migration-drafts/') ||
    filePath.startsWith('database/test-sql/')
  )))

  const existingFixtureHelpers = relatedFiles.filter((filePath) => /fixture|fixtures|synthetic/i.test(filePath))
  const existingDryRunHelpers = relatedFiles.filter((filePath) => /dry-run|dryrun/i.test(filePath))
  const existingExecutionHelpers = relatedFiles.filter((filePath) => /execution/i.test(filePath))
  const existingWorkerRoutes = relatedFiles.filter((filePath) => (
    filePath === 'server/routes/worker-routes.ts' ||
    /^server\/workers\//.test(filePath) ||
    /worker-route|worker/i.test(filePath)
  ))
  const existingMigrationDrafts = relatedFiles.filter((filePath) => filePath.startsWith('database/migration-drafts/'))
  const existingTestSqlRuntimeFiles = relatedFiles.filter((filePath) => filePath.startsWith('database/test-sql/'))

  return {
    relatedFiles,
    existingFixtureHelpers,
    existingDryRunHelpers,
    existingExecutionHelpers,
    existingWorkerRoutes,
    existingMigrationDrafts,
    existingTestSqlRuntimeFiles,
  }
}

function classifyHelper(filePath) {
  if (filePath.startsWith('server/tool-calling/')) {
    return 'reuse_existing_tool_calling_layer'
  }
  if (filePath.startsWith('database/migration-drafts/') || filePath.startsWith('database/test-sql/')) {
    return 'defer_runtime_schema_or_tests'
  }
  if (
    filePath.startsWith('server/workers/') ||
    filePath.startsWith('server/e2e/') ||
    filePath.startsWith('server/media/') ||
    filePath === 'server/routes/worker-routes.ts'
  ) {
    return 'avoid_importing_execution_surface'
  }
  if (filePath.startsWith('server/activation/') || filePath.startsWith('server/cli/')) {
    return 'avoid_importing_command_plan_surface'
  }
  if (filePath.startsWith('docs/')) {
    return 'reference_only'
  }
  if (filePath.startsWith('scripts/')) {
    return 'avoid_duplicating_deployment_or_worker_script'
  }

  return 'scan_evidence_only'
}

function summarizeHelpers(scan) {
  const notableFiles = uniqueSorted([
    ...scan.existingFixtureHelpers.filter((filePath) => /^server\/(media|e2e|tool-calling)\//.test(filePath)),
    ...scan.existingDryRunHelpers.filter((filePath) => /^server\/tool-calling\//.test(filePath) || /^docs\/tool-calling\//.test(filePath)),
    ...scan.existingExecutionHelpers.filter((filePath) => /^server\/workers\//.test(filePath)).slice(0, 30),
    ...scan.existingWorkerRoutes.filter((filePath) => /^server\/(routes|workers|tool-calling)\//.test(filePath)).slice(0, 30),
    ...scan.existingMigrationDrafts.filter((filePath) => /execution|worker/i.test(filePath)),
    ...scan.existingTestSqlRuntimeFiles.filter((filePath) => /execution|worker/i.test(filePath)),
  ])

  return notableFiles.map((filePath) => ({
    filePath,
    classification: classifyHelper(filePath),
  }))
}

function runTypecheckProbe() {
  const result = runCommand('npm', ['run', 'typecheck:server'])
  const failingFiles = uniqueSorted(
    [...result.output.matchAll(/^(server\/[^(]+)\(/gm)].map((match) => match[1]),
  )
  const failingPathGroups = uniqueSorted(
    failingFiles.map((filePath) => {
      const parts = filePath.split('/')
      return parts.length >= 3 ? `${parts[0]}/${parts[1]}/${parts[2]}` : filePath
    }),
  )
  const toolCallingFailures = failingFiles.filter((filePath) => filePath.startsWith('server/tool-calling/'))

  return {
    ok: result.ok,
    failingFiles,
    failingPathGroups,
    toolCallingFailures,
  }
}

function collectKeysDeep(value, path = '$', keys = []) {
  if (!value || typeof value !== 'object') return keys
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectKeysDeep(item, `${path}[${index}]`, keys))
    return keys
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    keys.push({ key, path: `${path}.${key}` })
    collectKeysDeep(nestedValue, `${path}.${key}`, keys)
  }

  return keys
}

function collectStringsDeep(value, path = '$', values = []) {
  if (typeof value === 'string') {
    values.push({ path, value })
    return values
  }
  if (!value || typeof value !== 'object') return values
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectStringsDeep(item, `${path}[${index}]`, values))
    return values
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    collectStringsDeep(nestedValue, `${path}.${key}`, values)
  }

  return values
}

function looksUnsafeString(value) {
  return (
    value.startsWith('/') ||
    /^[A-Za-z]:[\\/]/.test(value) ||
    /^https?:\/\//i.test(value) ||
    /&&|\|\||[|`<>]|\$\(|\r|\n/.test(value)
  )
}

function validateSafeDecisionOutput(output) {
  const forbiddenKeySet = new Set(FORBIDDEN_DECISION_KEYS)
  const forbiddenFieldsFound = collectKeysDeep(output)
    .filter((entry) => forbiddenKeySet.has(entry.key))
    .map((entry) => entry.path)
  const unsafeStringValues = collectStringsDeep(output)
    .filter((entry) => looksUnsafeString(entry.value))
    .map((entry) => entry.path)

  return {
    ok: forbiddenFieldsFound.length === 0 && unsafeStringValues.length === 0,
    forbiddenFieldsFound,
    unsafeStringValues,
  }
}

function duplicateRisk(category, severity, evidence, recommendation) {
  return {
    category,
    severity,
    evidence: uniqueSorted(evidence).slice(0, 30),
    recommendation,
  }
}

function buildPatternRequest(patternId) {
  return {
    projectId: `execution_path_decision_${patternId}`,
    mode: patternId === 'final_export_validation' ? 'final_export' : 'preview',
    qualityTarget: 'balanced',
    requestedPatternId: patternId,
    userPreferenceTags: ['professional', 'execution_path_decision_safe'],
    mediaContext: {
      mediaTypes: ['video', 'audio'],
      hasAudio: true,
      hasSpeech: true,
      hasMotion: true,
    },
  }
}

const refreshGate = runRefreshGate()
if (refreshGate.continueAllowed === false) {
  const blockedSummary = {
    ok: false,
    recommendedNextMilestone: null,
    recommendationReason: 'Refresh gate blocked execution-path decision.',
    binaryFixtureGenerationReadiness: { ready: false, blockers: ['refresh gate blocked'] },
    controlledLowRiskExecutionReadiness: { ready: false, blockers: ['refresh gate blocked'] },
    refreshGateContinueAllowed: false,
    existingFixtureHelpersCount: 0,
    existingExecutionHelpersCount: 0,
    duplicateRiskFindings: [],
    existingHelperFindings: [],
    blockers: refreshGate.blockingReasons ?? ['refresh gate blocked'],
    warnings: refreshGate.warnings ?? [],
    packageLockStaged: false,
    executesTools: false,
    binaryMediaGenerated: false,
    toolExecutionPerformed: false,
    shellExecutionPerformed: false,
    mediaProcessingPerformed: false,
    workerExecutionPerformed: false,
    providerCallsPerformed: false,
    supabaseMutationPerformed: false,
    sqlExecuted: false,
  }
  console.log(JSON.stringify(blockedSummary, null, 2))
  process.exit(1)
}

const {
  INITIAL_PIPELINE_PATTERN_IDS,
  buildToolCallingPlanWithAdaptersCommandPlansFixturesAndDryRun,
  listRuntimeIdReconciliationResults,
} = await tsImport('../../server/tool-calling/index.ts', import.meta.url)

const {
  PRODUCTION_TOOL_IDS,
} = await tsImport('../../server/tool-registry/index.ts', import.meta.url)

const productionToolIds = new Set(PRODUCTION_TOOL_IDS)
const pendingExternalToolIds = new Set(
  listRuntimeIdReconciliationResults()
    .filter((result) => result.status === 'pending_production_tool_registry_expansion')
    .map((result) => result.externalToolId ?? result.inputToolId),
)
const patternSummaries = []
const allSelectedTools = []
const allDryRunArtifacts = []
const allDryRunResults = []
let selectedPendingExternalTools = false
let allPlanningLayersWork = true

for (const patternId of INITIAL_PIPELINE_PATTERN_IDS) {
  const plan = buildToolCallingPlanWithAdaptersCommandPlansFixturesAndDryRun(buildPatternRequest(patternId))
  const adapterPlanCount = plan.adapterPlan.adapterPlans.length
  const safeCommandPlanCount = plan.safeCommandPlans.length
  const syntheticFixturePlanCount = plan.syntheticFixturePlans.length
  const dryRunResultCount = plan.syntheticFixtureDryRunResults.length
  const dryRunArtifactCount = plan.syntheticFixtureDryRunResults
    .reduce((count, result) => count + result.artifacts.length, 0)
  const selectedTools = [...plan.selectedTools].sort()
  const pendingSelectedTools = selectedTools.filter((toolId) => pendingExternalToolIds.has(toolId))

  if (
    adapterPlanCount === 0 ||
    safeCommandPlanCount === 0 ||
    syntheticFixturePlanCount === 0 ||
    dryRunResultCount === 0 ||
    dryRunArtifactCount === 0 ||
    plan.executesTools !== false ||
    plan.dryRunValidationSummary.ok !== true ||
    pendingSelectedTools.length > 0
  ) {
    allPlanningLayersWork = false
  }

  if (pendingSelectedTools.length > 0) selectedPendingExternalTools = true
  allSelectedTools.push(...selectedTools)
  allDryRunResults.push(...plan.syntheticFixtureDryRunResults)
  allDryRunArtifacts.push(...plan.syntheticFixtureDryRunResults.flatMap((result) => result.artifacts))

  patternSummaries.push({
    patternId,
    adapterPlanCount,
    safeCommandPlanCount,
    syntheticFixturePlanCount,
    dryRunResultCount,
    dryRunArtifactCount,
    selectedTools,
    pendingSelectedTools,
    executesTools: false,
  })
}

const scan = scanRelatedFiles()
const existingHelperFindings = summarizeHelpers(scan)
const typecheckProbe = runTypecheckProbe()
const changedFiles = splitLines(runGit(['diff', '--name-only']).output)
const stagedFiles = splitLines(runGit(['diff', '--cached', '--name-only']).output)
const packageLockStaged = stagedFiles.includes('package-lock.json')
const packageLockChanged = changedFiles.includes('package-lock.json')
const packageLockSha256 = existsSync('package-lock.json') ? sha256(readFileSync('package-lock.json')) : null
const openStackPullRequests = (refreshGate.relevantOpenPrs ?? [])
  .filter((pr) => /^codex\/reeditpro-tool-calling-/.test(pr.headRefName))
  .map((pr) => ({
    number: pr.number,
    title: pr.title,
    headRefName: pr.headRefName,
    baseRefName: pr.baseRefName,
  }))
const approvedToolCallingBinaryFixtureFiles = scan.relatedFiles.filter((filePath) => (
  /^(server|docs)\/tool-calling\/fixtures\//.test(filePath) &&
  /\.(json|wav|png)$/i.test(filePath)
))
const approvedBinaryFixtureArtifactsExist = approvedToolCallingBinaryFixtureFiles.length > 0
const typecheckFailsOutsideToolCalling = !typecheckProbe.ok && typecheckProbe.toolCallingFailures.length === 0
const refreshFetchUnchecked = refreshGate.fetchSkipped === true || refreshGate.staleAgainstUpstream === true

const duplicateRiskFindings = [
  duplicateRisk(
    'duplicate_binary_fixture_generator',
    'warning',
    scan.existingFixtureHelpers.filter((filePath) => /^server\/(media|e2e|workers)\//.test(filePath)),
    'Treat existing fixture helpers as evidence; add any tool-calling binary fixture generator as a separate gated layer.',
  ),
  duplicateRisk(
    'duplicate_low_risk_execution_runner',
    'warning',
    scan.existingExecutionHelpers.filter((filePath) => /^server\/workers\//.test(filePath)),
    'Do not create a parallel execution runner; future execution must reuse approved worker surfaces.',
  ),
  duplicateRisk(
    'duplicate_worker_execution_route',
    'warning',
    scan.existingWorkerRoutes.filter((filePath) => /^server\/(routes|workers|tool-calling)\//.test(filePath)),
    'Use existing worker routing boundaries instead of adding a second tool-calling route.',
  ),
  duplicateRisk(
    'duplicate_command_policy',
    'warning',
    ['server/tool-calling/safe-command-plan-policy.ts'],
    'Extend the existing safe command policy only through a future reviewed milestone.',
  ),
  duplicateRisk(
    'duplicate_adapter_execution',
    'warning',
    ['server/tool-calling/adapter-registry.ts', 'server/tool-calling/adapter-planner.ts'],
    'Keep adapter contracts planning-only until a future execution milestone explicitly bridges them.',
  ),
  duplicateRisk(
    'duplicate_supabase_runtime_table',
    'warning',
    scan.existingMigrationDrafts.filter((filePath) => /execution|worker|runtime/i.test(filePath)),
    'Do not create Supabase runtime tables in this decision milestone.',
  ),
  duplicateRisk(
    'duplicate_fixture_catalog',
    'warning',
    ['server/tool-calling/synthetic-fixture-catalog.ts', 'server/tool-calling/synthetic-fixture-planner.ts'],
    'Reuse the existing synthetic fixture catalog and planner.',
  ),
  duplicateRisk(
    'stale_base_branch',
    refreshFetchUnchecked ? 'warning' : 'info',
    refreshFetchUnchecked ? ['refresh gate fetch was skipped or stale state was detected'] : [],
    'Rerun the refresh gate with network fetch enabled before execution milestones when safe.',
  ),
  duplicateRisk(
    'package_lock_mutation_risk',
    packageLockChanged || packageLockStaged ? 'warning' : 'info',
    packageLockChanged || packageLockStaged ? ['package-lock.json is dirty or staged'] : [],
    'Keep package-lock out of tool-calling decision and fixture milestones unless explicitly intended.',
  ),
].filter((finding) => finding.severity !== 'info' || finding.evidence.length > 0)

const binaryFixtureGenerationReadiness = {
  ready: true,
  recommended: true,
  approvedBinaryFixtureArtifactsExist,
  jsonDryRunArtifactsExist: allDryRunArtifacts.length > 0,
  videoBinaryFixturesRemainDescriptorOnly: true,
  noToolExecutionRequired: true,
  blockers: [],
  warnings: uniqueSorted([
    approvedBinaryFixtureArtifactsExist ? '' : 'approved deterministic binary fixture files do not exist yet',
    packageLockChanged ? 'package-lock.json has unrelated dirty changes' : '',
    refreshFetchUnchecked ? 'refresh state is fetch-unchecked' : '',
    typecheckFailsOutsideToolCalling ? 'server typecheck fails outside server/tool-calling' : '',
    openStackPullRequests.length > 0 ? 'tool-calling stack PRs remain open' : '',
  ]),
}
const controlledLowRiskExecutionBlockers = uniqueSorted([
  approvedBinaryFixtureArtifactsExist ? '' : 'approved fixture artifacts are not materialized as files',
  openStackPullRequests.length > 0 ? 'tool-calling stack PRs remain open' : '',
  refreshFetchUnchecked ? 'refresh gate has fetch-unchecked state' : '',
  packageLockChanged ? 'package-lock.json has unrelated dirty changes' : '',
  typecheckFailsOutsideToolCalling ? 'server typecheck fails outside this milestone' : '',
  scan.existingExecutionHelpers.length > 0 ? 'existing execution helpers are runtime or smoke specific' : '',
  allPlanningLayersWork ? '' : 'one or more planning layers failed validation',
].filter(Boolean))
const controlledLowRiskExecutionReadiness = {
  ready: controlledLowRiskExecutionBlockers.length === 0,
  recommended: controlledLowRiskExecutionBlockers.length === 0,
  requiresApprovedFixtureArtifacts: true,
  requiresFirstClassProductionToolId: true,
  requiresAdapterContract: true,
  requiresSafeCommandPlan: true,
  requiresFixturePlan: true,
  requiresDryRunArtifactManifest: true,
  requiresQaGates: true,
  blockers: controlledLowRiskExecutionBlockers,
}

const recommendedNextMilestone = controlledLowRiskExecutionReadiness.ready
  ? LOW_RISK_EXECUTION_MILESTONE
  : BINARY_FIXTURE_MILESTONE
const recommendationReason = controlledLowRiskExecutionReadiness.ready
  ? 'All controlled low-risk execution prerequisites are satisfied.'
  : 'The stack has JSON-only dry-run manifests but no approved deterministic binary fixture artifacts yet; package-lock is dirty, refresh fetch is skipped or unchecked, server typecheck still fails outside server/tool-calling, and existing execution helpers are runtime or smoke specific.'

const hardBlockers = uniqueSorted([
  ...(refreshGate.blockingReasons ?? []),
  packageLockStaged ? 'package-lock.json is staged' : '',
  selectedPendingExternalTools ? 'pending external tool selected in generated plans' : '',
  typecheckProbe.toolCallingFailures.length > 0 ? 'server/tool-calling typecheck failures detected' : '',
  allPlanningLayersWork ? '' : 'planning stack validation failed',
].filter(Boolean))

const summaryWithoutSafety = {
  ok: true,
  recommendedNextMilestone,
  recommendationReason,
  binaryFixtureGenerationReadiness,
  controlledLowRiskExecutionReadiness,
  refreshGateContinueAllowed: refreshGate.continueAllowed === true,
  refreshGateWarnings: refreshGate.warnings ?? [],
  refreshGateFetchSkipped: refreshGate.fetchSkipped === true,
  openStackPullRequests,
  patternSummaries,
  selectedToolsAreFirstClassProductionToolIds: allSelectedTools.every((toolId) => productionToolIds.has(toolId)),
  pendingExternalToolsSelected: selectedPendingExternalTools,
  dryRunResultCount: allDryRunResults.length,
  dryRunArtifactCount: allDryRunArtifacts.length,
  approvedToolCallingBinaryFixtureFiles,
  existingFixtureHelpersCount: scan.existingFixtureHelpers.length,
  existingDryRunHelpersCount: scan.existingDryRunHelpers.length,
  existingExecutionHelpersCount: scan.existingExecutionHelpers.length,
  existingWorkerRoutesCount: scan.existingWorkerRoutes.length,
  existingMigrationDraftsCount: scan.existingMigrationDrafts.length,
  existingTestSqlRuntimeFilesCount: scan.existingTestSqlRuntimeFiles.length,
  existingHelperFindings,
  existingFixtureHelpers: scan.existingFixtureHelpers,
  existingDryRunHelpers: scan.existingDryRunHelpers,
  existingExecutionHelpers: scan.existingExecutionHelpers,
  existingWorkerRoutes: scan.existingWorkerRoutes,
  existingMigrationDrafts: scan.existingMigrationDrafts,
  existingTestSqlRuntimeFiles: scan.existingTestSqlRuntimeFiles,
  duplicateRiskFindings,
  typecheckServer: {
    ok: typecheckProbe.ok,
    failingPathGroups: typecheckProbe.failingPathGroups,
    toolCallingFailures: typecheckProbe.toolCallingFailures,
  },
  blockers: hardBlockers,
  warnings: uniqueSorted([
    ...(refreshGate.warnings ?? []),
    ...binaryFixtureGenerationReadiness.warnings,
    ...duplicateRiskFindings.map((finding) => finding.category),
  ]),
  packageLockStaged,
  packageLockChanged,
  packageLockSha256,
  packageLockMatchesExpected: packageLockSha256 === EXPECTED_PACKAGE_LOCK_SHA256,
  executesTools: false,
  binaryMediaGenerated: false,
  toolExecutionPerformed: false,
  shellExecutionPerformed: false,
  mediaProcessingPerformed: false,
  workerExecutionPerformed: false,
  providerCallsPerformed: false,
  supabaseMutationPerformed: false,
  sqlExecuted: false,
}
const safetyValidation = validateSafeDecisionOutput(summaryWithoutSafety)
const finalSummary = {
  ...summaryWithoutSafety,
  ok: hardBlockers.length === 0 && safetyValidation.ok,
  forbiddenFieldsFound: safetyValidation.forbiddenFieldsFound,
  unsafeStringValues: safetyValidation.unsafeStringValues,
}

console.log(JSON.stringify(finalSummary, null, 2))
if (!finalSummary.ok) {
  process.exit(1)
}
