import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

const REPORT_DIR = 'docs/activation-tool-route-execution-unlock-0-repo-audit-reports'
const DECISION_FILE = path.join(REPORT_DIR, 'tool_route_repo_audit_decision.json')
const SUMMARY_FILE = path.join(REPORT_DIR, 'tool_route_repo_audit_summary.json')
const EXPECTED_REPORTS = [
  'tool_route_repo_audit_decision.json',
  'tool_route_source_of_truth_audit.json',
  'tool_route_completed_tool_study_rollup.json',
  'tool_route_manifest_inventory.json',
  'tool_route_capability_routing_inventory.json',
  'tool_route_execution_contract_inventory.json',
  'tool_route_worker_handoff_inventory.json',
  'tool_route_provider_handoff_inventory.json',
  'tool_route_supabase_handoff_inventory.json',
  'tool_route_observability_cost_handoff_inventory.json',
  'tool_route_billing_credit_handoff_inventory.json',
  'tool_route_public_artifact_signed_url_blocker_register.json',
  'tool_route_raw_prompt_blocker_register.json',
  'tool_route_runtime_execution_blocker_register.json',
  'tool_route_duplicate_work_risk_register.json',
  'tool_route_internal_beta_gap_map.json',
  'tool_route_no_execution_policy.json',
  'tool_route_repo_audit_summary.json',
]
const ALLOWED_DECISIONS = [
  'tool_route_repo_audit_passed_ready_for_dry_run_plan',
  'tool_route_repo_audit_passed_with_warnings_ready_for_dry_run_plan',
  'tool_route_repo_audit_blocked_missing_tool_study',
  'tool_route_repo_audit_blocked_missing_route_manifests',
  'tool_route_repo_audit_blocked_missing_execution_contracts',
  'tool_route_repo_audit_blocked_missing_worker_handoff',
  'tool_route_repo_audit_blocked_missing_supabase_owner_handoff',
  'tool_route_repo_audit_blocked_duplicate_ownership_risk',
  'tool_route_repo_audit_blocked_source_of_truth_conflict',
]
const REQUIRED_STUDIES = [
  'docs/tool-studies/ai-tools-creative-graphics-tool-study.md',
  'docs/tool-studies/track-a-render-export-tool-study.md',
  'docs/tool-studies/track-b-media-processing-tool-study.md',
  'docs/tool-studies/sound-music-audio-tool-study.md',
]
const FORBIDDEN_COMPLETED_OWNER_STUDIES = [
  'docs/tool-studies/web-search-capture-tool-study.md',
  'docs/tool-studies/map-geospatial-tool-study.md',
]
const REQUIRED_SOURCE_FILES = [
  'docs/activation-tool-study-pending-owners-0-reports/tool_study_decision.json',
  'docs/activation-track-b-tool-route-manifest-reports/track_b_tool_route_manifest.json',
  'docs/activation-worker-runtime-unlock-4-local-fixture-plan-reports/worker_runtime_local_fixture_plan_decision.json',
  'docs/activation-model-orchestration-plan-snapshot-contract-reports/plan_snapshot_contract_decision.json',
  'docs/activation-product-internal-testing-session-0-reports/session_0_decision.json',
]
const UNSAFE_TRUE_FLAGS = [
  'runtimeExecutionAllowed',
  'toolExecutionAllowed',
  'routeExecutionAllowed',
  'workerExecutionAllowed',
  'providerExecutionAllowed',
  'jobDispatch',
  'jobClaim',
  'jobLease',
  'queueEnqueue',
  'providerCalls',
  'browserCaptureExecutionAllowed',
  'mapRenderingAllowed',
  'mediaProcessingAllowed',
  'audioProcessingAllowed',
  'renderExecutionAllowed',
  'finalExportExecutionAllowed',
  'dockerRun',
  'cloudRunJob',
  'cloudBuild',
  'supabaseWrites',
  'sqlExecuted',
  'migrationDeployed',
  'storageObjectsCreated',
  'signedUrls',
  'signedUrlsAsSourceOfTruthAllowed',
  'publicArtifacts',
  'publicArtifactsAllowed',
  'creditSpendOrReservation',
  'stripeOrBilling',
  'internalBeta',
  'externalBeta',
  'paidProduction',
  'productionReady',
  'dependencyMutation',
  'rawPromptExecution',
  'rawPromptDirectExecutionAllowed',
  'rawProviderOutputPersisted',
  'generatedLocalFixturePassedClaimed',
  'demucsRuntime',
  'trackARuntime',
  'trackBMediaProcessing',
]
const FORBIDDEN_DECISIONS = [
  'tool_route_execution_ready',
  'route_execution_ready',
  'tool_execution_ready',
  'worker_execution_ready',
  'staging_ready',
  'production_ready',
  'beta_ready',
  'external_beta_ready',
  'paid_production_ready',
  'generated_local_fixture_passed',
]

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'))
}

function readAllFiles(dir) {
  const entries = []
  if (!existsSync(dir)) return entries
  for (const name of readdirSync(dir)) {
    const fullPath = path.join(dir, name)
    if (statSync(fullPath).isDirectory()) entries.push(...readAllFiles(fullPath))
    else entries.push({ filePath: fullPath, text: readFileSync(fullPath, 'utf8') })
  }
  return entries
}

function walk(value, visitor) {
  if (Array.isArray(value)) {
    for (const item of value) walk(item, visitor)
    return
  }
  if (!value || typeof value !== 'object') return
  for (const [key, child] of Object.entries(value)) {
    visitor(key, child)
    walk(child, visitor)
  }
}

const mode = process.argv.includes('--summary')
  ? 'summary'
  : process.argv.includes('--report')
    ? 'report'
    : 'diagnostics'

const packageJson = readJson('package.json')
for (const script of [
  'tool-route-execution-unlock-0:diagnostics',
  'tool-route-execution-unlock-0:report',
  'tool-route-execution-unlock-0:summary',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

for (const report of EXPECTED_REPORTS) {
  assert(existsSync(path.join(REPORT_DIR, report)), `Missing report: ${report}`)
}
for (const file of REQUIRED_STUDIES) {
  assert(existsSync(file), `Missing required tool study: ${file}`)
}
for (const file of FORBIDDEN_COMPLETED_OWNER_STUDIES) {
  assert(!existsSync(file), `Completed owner study must not be duplicated: ${file}`)
}
for (const file of REQUIRED_SOURCE_FILES) {
  assert(existsSync(file), `Missing source evidence: ${file}`)
}
for (const file of [
  'docs/tool-route-execution-unlock-0-repo-audit.md',
  'docs/implementation-prompts/prompt-tool-route-execution-unlock-1-dry-run-plan.md',
]) {
  assert(existsSync(file), `Missing audit doc: ${file}`)
}

const reports = Object.fromEntries(
  EXPECTED_REPORTS.map((report) => [report, readJson(path.join(REPORT_DIR, report))]),
)
const decision = reports['tool_route_repo_audit_decision.json']
const summary = reports['tool_route_repo_audit_summary.json']
const sourceAudit = reports['tool_route_source_of_truth_audit.json']
const rollup = reports['tool_route_completed_tool_study_rollup.json']
const noExecution = reports['tool_route_no_execution_policy.json']

assert(ALLOWED_DECISIONS.includes(decision.decision), `Unexpected decision: ${decision.decision}`)
assert(!FORBIDDEN_DECISIONS.includes(decision.decision), `Forbidden execution-ready decision: ${decision.decision}`)
assert(decision.decision === 'tool_route_repo_audit_passed_with_warnings_ready_for_dry_run_plan', 'Expected pass-with-warnings decision for unchanged source state.')
assert(decision.readyForDryRunPlan === true, 'Audit should be ready for dry-run planning.')
assert(decision.toolExecutionReady === false, 'Tool execution readiness must remain false.')
assert(decision.routeExecutionReady === false, 'Route execution readiness must remain false.')
assert(decision.workerExecutionReady === false, 'Worker execution readiness must remain false.')
assert(decision.supabasePersistenceReady === false, 'Supabase persistence readiness must remain false.')
assert(decision.generatedLocalFixturePassedClaimed === false, 'generated_local_fixture_passed must not be claimed.')
assert(summary.nextRecommendedPrompt === 'TOOL-ROUTE-EXECUTION-UNLOCK-1: tool-route execution dry-run plan, no execution', 'Next prompt mismatch.')
assert(sourceAudit.sourceOfTruthConflictsFound === false, 'Source-of-truth conflicts must be absent.')
assert(sourceAudit.githubMergeHygiene?.pr360Merged === true, 'PR #360 must be recorded as merged.')
assert(sourceAudit.githubMergeHygiene?.pr360MergeCommit === '0699ae921af3b8980b93221bec094d842d61ddba', 'PR #360 merge commit mismatch.')

const owners = rollup.completedToolStudyOwners?.map((entry) => entry.owner) ?? []
for (const owner of [
  'AI_TOOLS_CREATIVE_GRAPHICS',
  'TRACK_A_RENDER_EXPORT',
  'TRACK_B_MEDIA_PROCESSING',
  'SOUND_MUSIC_AUDIO',
  'WEB_SEARCH_CAPTURE',
  'MAP_GEOSPATIAL',
]) {
  assert(owners.includes(owner), `Missing owner in rollup: ${owner}`)
}
assert(rollup.duplicateStudiesCreated === false, 'Completed owner studies must not be duplicated.')

for (const [fileName, json] of Object.entries(reports)) {
  walk(json, (key, value) => {
    if (UNSAFE_TRUE_FLAGS.includes(key)) {
      assert(value === false, `Unsafe true flag in ${fileName}: ${key}`)
    }
  })
}

assert(noExecution.noScopeStatement?.includes('No Supabase mutation'), 'No-scope statement missing Supabase no-op.')

const filesToScan = [
  ...readAllFiles(REPORT_DIR),
  { filePath: 'docs/tool-route-execution-unlock-0-repo-audit.md', text: readFileSync('docs/tool-route-execution-unlock-0-repo-audit.md', 'utf8') },
  {
    filePath: 'docs/implementation-prompts/prompt-tool-route-execution-unlock-1-dry-run-plan.md',
    text: readFileSync('docs/implementation-prompts/prompt-tool-route-execution-unlock-1-dry-run-plan.md', 'utf8'),
  },
]
const signedUrlMarkerPattern = new RegExp(
  `${['x', 'goog', 'signature'].join('-')}|${['x', 'amz', 'signature'].join('-')}|${['x', 'amz', 'credential'].join('-')}`,
  'i',
)
const forbiddenTextPatterns = [
  { label: 'database URL', pattern: /postgres(?:ql)?:\/\/[^\s"'`]+/i },
  { label: 'Supabase project URL', pattern: /https?:\/\/[a-z0-9-]+\.supabase\.co/i },
  { label: 'Authorization header', pattern: /authorization\s*:\s*bearer/i },
  { label: 'JWT', pattern: /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/ },
  { label: 'private key block', pattern: new RegExp('BEGIN ' + 'PRIVATE KEY', 'i') },
  { label: 'signed URL marker', pattern: signedUrlMarkerPattern },
  { label: 'provider key shape', pattern: /sk-[A-Za-z0-9]{20,}|AIza[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}/ },
  { label: 'raw provider output marker', pattern: /rawProviderOutput\s*:\s*["'][^"']+/i },
]
for (const { filePath, text } of filesToScan) {
  for (const { label, pattern } of forbiddenTextPatterns) {
    assert(!pattern.test(text), `Forbidden ${label} found in ${filePath}`)
  }
  for (const flag of UNSAFE_TRUE_FLAGS) {
    assert(!new RegExp(`"${flag}"\\s*:\\s*true`).test(text), `Unsafe true flag found in ${filePath}: ${flag}`)
  }
}

const output = mode === 'summary'
  ? {
      status: summary.status,
      decision: summary.decision,
      readyForDryRunPlan: summary.readyForDryRunPlan,
      nextRecommendedPrompt: summary.nextRecommendedPrompt,
      toolExecutionAllowed: false,
      routeExecutionAllowed: false,
      workerExecutionAllowed: false,
      generatedLocalFixturePassedClaimed: false,
    }
  : mode === 'report'
    ? decision
    : {
        status: 'passed',
        phase: 'tool-route-execution-unlock-0-repo-audit',
        decision: decision.decision,
        reportsChecked: EXPECTED_REPORTS.length,
        ownersCovered: owners.length,
        readyForDryRunPlan: decision.readyForDryRunPlan,
        toolExecutionAllowed: false,
        routeExecutionAllowed: false,
        workerExecutionAllowed: false,
        supabaseWrites: false,
        sqlExecuted: false,
        generatedLocalFixturePassedClaimed: false,
        nextRecommendedPrompt: summary.nextRecommendedPrompt,
      }

console.log(JSON.stringify(output, null, 2))
