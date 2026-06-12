import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

const REPORT_DIR = 'docs/activation-tool-study-pending-owners-0-reports'
const STUDY_DIR = 'docs/tool-studies'
const EXPECTED_REPORTS = [
  'tool_study_source_audit.json',
  'tool_study_owner_inventory.json',
  'tool_study_capability_cards.json',
  'tool_study_routing_hints.json',
  'tool_study_tool_combination_maps.json',
  'tool_study_artifact_io_maps.json',
  'tool_study_readiness_matrix.json',
  'tool_study_blocked_use_register.json',
  'tool_study_handoff_requirements.json',
  'tool_study_duplicate_owner_guard.json',
  'tool_study_no_execution_policy.json',
  'tool_study_decision.json',
  'tool_study_summary.json',
]
const EXPECTED_STUDIES = [
  'ai-tools-creative-graphics-tool-study.md',
  'track-a-render-export-tool-study.md',
  'track-b-media-processing-tool-study.md',
  'sound-music-audio-tool-study.md',
]
const PENDING_OWNERS = [
  'AI_TOOLS_CREATIVE_GRAPHICS',
  'TRACK_A_RENDER_EXPORT',
  'TRACK_B_MEDIA_PROCESSING',
  'SOUND_MUSIC_AUDIO',
]
const COMPLETED_OWNERS = ['WEB_SEARCH_CAPTURE', 'MAP_GEOSPATIAL']
const FORBIDDEN_STUDY_PATHS = [
  'docs/tool-studies/web-search-capture-tool-study.md',
  'docs/tool-studies/map-geospatial-tool-study.md',
]
const UNSAFE_TRUE_FLAGS = [
  'runtimeExecutionAllowed',
  'workerExecutionAllowed',
  'toolExecutionAllowed',
  'routeExecutionAllowed',
  'providerExecutionAllowed',
  'browserCaptureExecutionAllowed',
  'mapGeospatialExecutionAllowed',
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
  'publicArtifacts',
  'creditSpendOrReservation',
  'stripeOrBilling',
  'internalBeta',
  'externalBeta',
  'paidProduction',
  'dependencyMutation',
  'rawPromptExecution',
  'rawProviderOutputPersisted',
  'generatedLocalFixturePassedClaimed',
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

const packageJson = readJson('package.json')
assert(
  packageJson.scripts?.['tool-study-pending-owners-0:diagnostics'] ===
    'node scripts/validation/tool-study-pending-owners-0-diagnostics.mjs',
  'Missing package script tool-study-pending-owners-0:diagnostics.',
)

for (const report of EXPECTED_REPORTS) {
  assert(existsSync(path.join(REPORT_DIR, report)), `Missing report: ${report}`)
}

for (const study of EXPECTED_STUDIES) {
  assert(existsSync(path.join(STUDY_DIR, study)), `Missing owner study: ${study}`)
}

for (const forbiddenPath of FORBIDDEN_STUDY_PATHS) {
  assert(!existsSync(forbiddenPath), `Completed owner study must not be duplicated: ${forbiddenPath}`)
}

const sourceAudit = readJson(path.join(REPORT_DIR, 'tool_study_source_audit.json'))
const ownerInventory = readJson(path.join(REPORT_DIR, 'tool_study_owner_inventory.json'))
const duplicateGuard = readJson(path.join(REPORT_DIR, 'tool_study_duplicate_owner_guard.json'))
const noExecution = readJson(path.join(REPORT_DIR, 'tool_study_no_execution_policy.json'))
const decision = readJson(path.join(REPORT_DIR, 'tool_study_decision.json'))
const summary = readJson(path.join(REPORT_DIR, 'tool_study_summary.json'))

assert(sourceAudit.status === 'passed', 'Source audit must pass.')
assert(sourceAudit.sourceOfTruthConflictsFound === false, 'Source audit must not contain conflicts.')
assert(decision.decision === 'tool_study_pending_owners_completed_ready_for_tool_route_execution_unlock_audit', 'Unexpected decision.')
assert(decision.readyForToolRouteExecutionUnlockAudit === true, 'Packet must be ready for tool-route execution unlock audit.')
assert(decision.runtimeExecutionReadyClaimed === false, 'Runtime readiness must not be claimed.')
assert(decision.toolRouteExecutionReadyClaimed === false, 'Tool-route execution readiness must not be claimed.')
assert(summary.nextRecommendedPrompt === 'TOOL-ROUTE-EXECUTION-UNLOCK-0: tool-route execution unlock repo audit, no execution', 'Next prompt mismatch.')

for (const owner of PENDING_OWNERS) {
  assert(ownerInventory.pendingOwnersStudied.includes(owner), `Missing pending owner: ${owner}`)
}
for (const owner of COMPLETED_OWNERS) {
  assert(ownerInventory.completedOwnersNotDuplicated.includes(owner), `Missing completed owner reference: ${owner}`)
  assert(duplicateGuard.completedOwners.includes(owner), `Missing duplicate guard owner: ${owner}`)
}
assert(duplicateGuard.webSearchCaptureDuplicated === false, 'WEB_SEARCH_CAPTURE must not be duplicated.')
assert(duplicateGuard.mapGeospatialDuplicated === false, 'MAP_GEOSPATIAL must not be duplicated.')

const reports = EXPECTED_REPORTS.map((report) => ({
  filePath: path.join(REPORT_DIR, report),
  json: readJson(path.join(REPORT_DIR, report)),
}))
for (const { filePath, json } of reports) {
  walk(json, (key, value) => {
    if (UNSAFE_TRUE_FLAGS.includes(key)) {
      assert(value === false, `Unsafe runtime flag must be false in ${filePath}: ${key}`)
    }
  })
}

const filesToScan = [
  ...readAllFiles(REPORT_DIR),
  ...readAllFiles(STUDY_DIR),
  { filePath: 'docs/tool-study-pending-owners-0.md', text: readFileSync('docs/tool-study-pending-owners-0.md', 'utf8') },
  {
    filePath: 'docs/implementation-prompts/prompt-tool-route-execution-unlock-0-repo-audit.md',
    text: readFileSync('docs/implementation-prompts/prompt-tool-route-execution-unlock-0-repo-audit.md', 'utf8'),
  },
  {
    filePath: 'scripts/validation/tool-study-pending-owners-0-diagnostics.mjs',
    text: readFileSync('scripts/validation/tool-study-pending-owners-0-diagnostics.mjs', 'utf8'),
  },
]

const forbiddenPatterns = [
  { label: 'real URL', pattern: /https?:\/\//i },
  { label: 'database URL', pattern: /postgres(?:ql)?:\/\/[^\s"'`]+/i },
  { label: 'Supabase project URL', pattern: /supabase\.co/i },
  { label: 'Authorization header', pattern: /authorization\s*:\s*bearer/i },
  { label: 'JWT', pattern: /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/ },
  { label: 'private key block', pattern: new RegExp('BEGIN ' + 'PRIVATE KEY', 'i') },
  {
    label: 'signed URL marker',
    pattern: new RegExp(
      ['x-' + 'goog-' + 'signature', 'x-' + 'amz-' + 'signature', 'x-' + 'amz-' + 'credential', 'expires' + '='].join('|'),
      'i',
    ),
  },
  { label: 'provider key shape', pattern: /(sk-[A-Za-z0-9]{20,}|AIza[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16})/ },
  { label: 'raw provider output marker', pattern: /rawProviderOutput\s*:\s*["'][^"']+/i },
]

for (const { filePath, text } of filesToScan) {
  for (const { label, pattern } of forbiddenPatterns) {
    assert(!pattern.test(text), `Forbidden ${label} found in ${filePath}`)
  }
  for (const flag of UNSAFE_TRUE_FLAGS) {
    const truePattern = new RegExp(`"${flag}"\\s*:\\s*true`)
    assert(!truePattern.test(text), `Unsafe true flag found in ${filePath}: ${flag}`)
  }
}

assert(noExecution.noScopeStatement.includes('No Supabase mutation'), 'No-scope statement must include Supabase no-op.')
assert(noExecution.generatedLocalFixturePassedClaimed === false, 'generated_local_fixture_passed must remain unclaimed.')

console.log(JSON.stringify({
  status: 'passed',
  phase: 'tool-study-pending-owners-0',
  decision: decision.decision,
  pendingOwnersStudied: PENDING_OWNERS.length,
  completedOwnersDuplicated: false,
  readyForToolRouteExecutionUnlockAudit: true,
  runtimeExecutionAllowed: false,
  toolExecutionAllowed: false,
  routeExecutionAllowed: false,
  generatedLocalFixturePassedClaimed: false,
  nextRecommendedPrompt: summary.nextRecommendedPrompt,
}, null, 2))
