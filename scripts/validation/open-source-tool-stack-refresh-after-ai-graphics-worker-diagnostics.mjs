import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const baseRef = 'origin/codex/rp-github-merge-hygiene-open-pr-stack-audit'

const requiredDocs = [
  'docs/open-source-tool-stack/refresh/open-source-tool-stack-refresh-after-ai-graphics-worker.md',
  'docs/open-source-tool-stack/refresh/open-source-tool-stack-refresh-source-lockfile.md',
  'docs/open-source-tool-stack/refresh/open-source-tool-stack-refresh-canonical-counts.md',
  'docs/open-source-tool-stack/refresh/open-source-tool-stack-refresh-draft-evidence-ledger.md',
  'docs/open-source-tool-stack/refresh/open-source-tool-stack-refresh-owner-matrix.md',
  'docs/open-source-tool-stack/refresh/open-source-tool-stack-refresh-proof-status-matrix.md',
  'docs/open-source-tool-stack/refresh/open-source-tool-stack-refresh-ai-graphics-delta.md',
  'docs/open-source-tool-stack/refresh/open-source-tool-stack-refresh-worker-ai-graphics-delta.md',
  'docs/open-source-tool-stack/refresh/open-source-tool-stack-refresh-track-a-delta.md',
  'docs/open-source-tool-stack/refresh/open-source-tool-stack-refresh-track-b-delta.md',
  'docs/open-source-tool-stack/refresh/open-source-tool-stack-refresh-sound-map-web-worker-delta.md',
  'docs/open-source-tool-stack/refresh/open-source-tool-stack-refresh-provider-api-separated.md',
  'docs/open-source-tool-stack/refresh/open-source-tool-stack-refresh-blocked-register.md',
  'docs/open-source-tool-stack/refresh/open-source-tool-stack-refresh-merge-readiness.md',
  'docs/open-source-tool-stack/refresh/open-source-tool-stack-refresh-next-install-proof-batches.md',
  'docs/open-source-tool-stack/refresh/open-source-tool-stack-refresh-decision.md',
  'docs/prompt-open-source-tool-stack-refresh-after-ai-graphics-worker-results.md',
  'docs/implementation-prompts/prompt-open-source-tool-stack-refresh-after-ai-graphics-worker.md',
]

const requiredJson = [
  'docs/open-source-tool-stack/refresh/open-source-tool-stack-refresh-summary.json',
  'docs/open-source-tool-stack/refresh/open-source-tool-stack-refresh-draft-evidence-ledger.json',
  'docs/open-source-tool-stack/refresh/open-source-tool-stack-refresh-owner-matrix.json',
  'docs/open-source-tool-stack/refresh/open-source-tool-stack-refresh-proof-status-matrix.json',
  'docs/open-source-tool-stack/refresh/open-source-tool-stack-refresh-next-lanes.json',
]

const expectedTools = [
  'd3',
  'echarts',
  'vega-lite',
  'vega',
  'satori',
  '@svgdotjs/svg.js',
  '@viz-js/viz',
  'lottie-web',
  'animejs',
  'three',
  'pixi.js',
  'konva',
  'babylonjs',
]

const expectedCanonicalCounts = {
  total: 71,
  localOss: 68,
  providerApi: 3,
  packageDeclared: 22,
  systemBinary: 4,
  missing: 11,
  blocked: 9,
  smokeOnly: 14,
  docsOnly: 17,
  notProven: 31,
  e2eProven: 0,
}

const allowedDecisions = new Set([
  'open_source_tool_stack_refresh_completed_with_draft_evidence_reconciled',
  'blocked_pending_central_audit_source_read',
  'blocked_pending_duplicate_refresh_pr',
  'blocked_pending_merge_hygiene_review',
  'blocked_pending_evidence_conflict_resolution',
])

const requiredFalseScope = [
  'workerRuntimeExecuted',
  'routeRuntimeExecuted',
  'toolRuntimeExecuted',
  'providerRuntimeExecuted',
  'browserWebglCanvasRuntimeExecuted',
  'renderOrMediaRuntimeExecuted',
  'supabaseMutationExecuted',
  'gcsTransferExecuted',
  'signedUrlCreated',
  'publicArtifactCreated',
  'rawPromptExecuted',
  'internalBetaReadyNow',
  'externalBetaReadyNow',
  'productionReadyNow',
  'genericDryRunPassedClaimed',
  'generatedLocalFixturePassedClaimed',
]

const forbiddenDocPatterns = [
  ['draft_evidence_canonical_e2e', /\bdraft\b[\s\S]{0,80}\bcanonical\b[\s\S]{0,80}\bE2E\b[\s\S]{0,40}\btrue\b/i],
  ['all_tools_installed_claim', /\ball (?:tools|local\/OSS tools|OSS tools) (?:are|were|have been) installed\b/i],
  ['all_tools_proven_claim', /\ball (?:tools|local\/OSS tools|OSS tools) (?:are|were|have been) proven\b/i],
  ['internal_beta_ready_claim', /\b(?:internalBetaReadyNow|internal beta ready|internal beta unlock)\b\s*[:=]\s*(?:true|enabled|approved|ready)\b/i],
  ['production_ready_claim', /\b(?:productionReadyNow|production ready|production unlock)\b\s*[:=]\s*(?:true|enabled|approved|ready)\b/i],
  ['worker_execution_claim', /\b(?:workerRuntimeExecuted|worker execution)\b\s*[:=]\s*(?:true|enabled|executed|approved|ready)\b/i],
  ['route_execution_claim', /\b(?:routeRuntimeExecuted|route execution)\b\s*[:=]\s*(?:true|enabled|executed|approved|ready)\b/i],
  ['tool_execution_claim', /\b(?:toolRuntimeExecuted|actual tool execution)\b\s*[:=]\s*(?:true|enabled|executed|approved|ready)\b/i],
  ['provider_execution_claim', /\b(?:providerRuntimeExecuted|provider\/model runtime)\b\s*[:=]\s*(?:true|enabled|executed|approved|ready)\b/i],
  ['supabase_execution_claim', /\b(?:supabaseMutationExecuted|Supabase mutation|Supabase SQL|Supabase write)\b\s*[:=]\s*(?:true|enabled|executed|approved)\b/i],
  ['gcs_execution_claim', /\b(?:gcsTransferExecuted|GCS transfer|GCS upload)\b\s*[:=]\s*(?:true|enabled|executed|approved)\b/i],
  ['signed_url_created_claim', /\b(?:signedUrlCreated|signed URL created)\b\s*[:=]\s*(?:true|enabled|approved)\b/i],
  ['public_artifact_created_claim', /\b(?:publicArtifactCreated|public artifact created)\b\s*[:=]\s*(?:true|enabled|approved)\b/i],
  ['generic_dry_run_passed_claim', /\bdry_run_passed\b[\s\S]{0,40}\b(?:true|claimed|passed)\b/i],
  ['generated_local_fixture_passed_claim', /\bgenerated_local_fixture_passed\b[\s\S]{0,40}\b(?:true|claimed|passed)\b/i],
]

const failures = []

function git(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  }).trim()
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    failures.push(`invalid_json:${path}:${error.message}`)
    return undefined
  }
}

for (const path of [...requiredDocs, ...requiredJson]) {
  if (!existsSync(path)) failures.push(`missing_required_file:${path}`)
}

const docsText = [...requiredDocs, ...requiredJson]
  .filter((path) => existsSync(path))
  .map((path) => `\n--- ${path} ---\n${readFileSync(path, 'utf8')}`)
  .join('\n')

for (const [name, pattern] of forbiddenDocPatterns) {
  const match = docsText.match(pattern)
  if (match) failures.push(`forbidden_claim:${name}:${match[0]}`)
}

const summary = readJson('docs/open-source-tool-stack/refresh/open-source-tool-stack-refresh-summary.json')
const ledger = readJson('docs/open-source-tool-stack/refresh/open-source-tool-stack-refresh-draft-evidence-ledger.json')
const proof = readJson('docs/open-source-tool-stack/refresh/open-source-tool-stack-refresh-proof-status-matrix.json')
const owner = readJson('docs/open-source-tool-stack/refresh/open-source-tool-stack-refresh-owner-matrix.json')
const next = readJson('docs/open-source-tool-stack/refresh/open-source-tool-stack-refresh-next-lanes.json')

if (summary) {
  if (!allowedDecisions.has(summary.decision)) failures.push(`invalid_decision:${summary.decision}`)
  if (summary.decision !== 'open_source_tool_stack_refresh_completed_with_draft_evidence_reconciled') {
    failures.push(`unexpected_decision:${summary.decision}`)
  }
  if (summary.canonicalCentralAuditDecision !== 'open_source_tool_stack_audit_completed_install_proof_backlog_ready') {
    failures.push(`unexpected_canonical_audit_decision:${summary.canonicalCentralAuditDecision}`)
  }
  if (summary.sourceEvidence?.centralMergedPr?.number !== 416 || summary.sourceEvidence?.centralMergedPr?.state !== 'MERGED') {
    failures.push('missing_pr_416_merged_central_source')
  }
  if (!docsText.includes('PR #416') && !docsText.includes('#416')) failures.push('pr_416_not_cited_in_docs')
  for (const [key, value] of Object.entries(expectedCanonicalCounts)) {
    if (summary.canonicalCounts?.[key] !== value) failures.push(`canonical_count_mismatch:${key}:${summary.canonicalCounts?.[key]}`)
  }
  const pending = summary.draftPendingCounts ?? {}
  for (const key of [
    'installImportProofTools',
    'syntheticManifestFixtureTools',
    'schemaValidationMetadataTools',
    'jobPayloadDryRunMetadataTools',
    'controlledNoopMetadataTools',
    'runtimeGateMetadataTools',
  ]) {
    if (pending[key] !== 13) failures.push(`draft_pending_count_mismatch:${key}:${pending[key]}`)
  }
  if (pending.runtimeReadyTools !== 0) failures.push(`runtime_ready_tools_not_zero:${pending.runtimeReadyTools}`)
  if (pending.internalBetaReadyTools !== 0) failures.push(`internal_beta_ready_tools_not_zero:${pending.internalBetaReadyTools}`)
  if (summary.evidenceSeparation?.mergedCanonicalStatus !== 'pr_416_merged_central_audit_only') {
    failures.push(`missing_merged_canonical_status:${summary.evidenceSeparation?.mergedCanonicalStatus}`)
  }
  if (summary.evidenceSeparation?.draftPendingEvidenceStatus !== 'ai_graphics_tool_route_worker_chain_open_draft_pending_merge') {
    failures.push(`missing_draft_pending_evidence_status:${summary.evidenceSeparation?.draftPendingEvidenceStatus}`)
  }
  if (summary.evidenceSeparation?.runtimeReadyNow !== false) failures.push('runtime_ready_now_not_false')
  if (summary.evidenceSeparation?.internalBetaReadyNow !== false) failures.push('internal_beta_ready_now_not_false')
  for (const flag of requiredFalseScope) {
    if (summary.executionScope?.[flag] !== false) failures.push(`scope_flag_not_false:${flag}:${summary.executionScope?.[flag]}`)
  }
  const supabase = summary.supabaseClassification ?? {}
  if (
    supabase.updateRequired !== 'no write' ||
    supabase.classification !== 'docs_only' ||
    supabase.environment !== 'none' ||
    supabase.sql !== 'none' ||
    supabase.migration !== 'no' ||
    supabase.milestoneSync !== 'not_performed'
  ) {
    failures.push('unexpected_supabase_classification')
  }
}

if (ledger) {
  const entries = ledger.entries ?? []
  for (const pr of [425, 433, 441, 532]) {
    const entry = entries.find((candidate) => candidate.pr === pr)
    if (!entry) {
      failures.push(`missing_draft_ledger_pr:${pr}`)
      continue
    }
    if (entry.state !== 'OPEN' || entry.isDraft !== true || entry.canonical !== false) {
      failures.push(`draft_ledger_state_mismatch:${pr}`)
    }
  }
  if (!entries.some((entry) => entry.pr === 532 && entry.decision === 'worker_ai_graphics_metadata_controlled_noop_worker_gate_owner_review_passed_with_warnings')) {
    failures.push('missing_pr_532_worker_decision')
  }
}

if (proof) {
  const tools = proof.tools ?? []
  const toolNames = tools.map((entry) => entry.tool).sort()
  if (JSON.stringify(toolNames) !== JSON.stringify([...expectedTools].sort())) failures.push('proof_matrix_tool_set_mismatch')
  for (const entry of tools) {
    if (entry.draftPendingEvidenceStatus !== 'draft_pending') failures.push(`tool_not_draft_pending:${entry.tool}`)
    if (entry.runtimeReadyNow !== false) failures.push(`tool_runtime_ready_not_false:${entry.tool}`)
    if (entry.internalBetaReadyNow !== false) failures.push(`tool_internal_beta_not_false:${entry.tool}`)
  }
}

if (owner) {
  const ownerRows = owner.ownerRows ?? []
  for (const expectedOwner of ['open_source_tool_stack', 'ai_tools_creative_graphics', 'tool_route', 'worker_runtime', 'provider_api']) {
    if (!ownerRows.some((row) => row.owner === expectedOwner)) failures.push(`missing_owner_row:${expectedOwner}`)
  }
  for (const row of ownerRows) {
    if (row.runtimeReadyNow !== false) failures.push(`owner_runtime_ready_not_false:${row.owner}`)
    if (row.internalBetaReadyNow !== false) failures.push(`owner_internal_beta_not_false:${row.owner}`)
  }
}

if (next) {
  if (next.nextPrompt !== 'OPEN_SOURCE_TOOL_STACK_REFRESH_AUDIT_AFTER_AI_GRAPHICS_WORKER_QA_REVIEW') {
    failures.push(`unexpected_next_prompt:${next.nextPrompt}`)
  }
  if (!Array.isArray(next.blockedUntilSeparateGate) || next.blockedUntilSeparateGate.length < 10) {
    failures.push('missing_blocked_until_separate_gate')
  }
}

try {
  const packageBefore = JSON.parse(git(['show', `${baseRef}:package.json`]))
  const packageAfter = JSON.parse(readFileSync('package.json', 'utf8'))
  for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
    if (JSON.stringify(packageBefore[section] ?? {}) !== JSON.stringify(packageAfter[section] ?? {})) {
      failures.push(`package_dependency_section_changed:${section}`)
    }
  }
  const script = packageAfter.scripts?.['open-source-tool-stack:refresh-after-ai-graphics-worker:diagnostics']
  if (script !== 'node scripts/validation/open-source-tool-stack-refresh-after-ai-graphics-worker-diagnostics.mjs') {
    failures.push('missing_refresh_diagnostics_package_script')
  }
} catch (error) {
  failures.push(`package_json_comparison_failed:${error.message}`)
}

try {
  const beforeLock = git(['show', `${baseRef}:package-lock.json`])
  const afterLock = readFileSync('package-lock.json', 'utf8').trim()
  if (beforeLock.trim() !== afterLock) failures.push('package_lock_changed')
} catch (error) {
  failures.push(`package_lock_comparison_failed:${error.message}`)
}

let changedFiles = []
try {
  const changed = [
    git(['diff', '--name-only', `${baseRef}...HEAD`]),
    git(['diff', '--name-only']),
    git(['diff', '--cached', '--name-only']),
    git(['ls-files', '--others', '--exclude-standard']),
  ]
    .filter(Boolean)
    .join('\n')
  changedFiles = [...new Set(changed.split('\n').filter(Boolean))]
} catch (error) {
  failures.push(`changed_file_scan_failed:${error.message}`)
}

const forbiddenChangedPath = changedFiles.find((path) =>
  path.startsWith('.local-artifacts/') ||
  /(^|\/)(media|render|browser|canvas|webgl|public-artifacts|generated-artifacts)(\/|$)/i.test(path),
)
if (forbiddenChangedPath) failures.push(`forbidden_changed_artifact_path:${forbiddenChangedPath}`)

let trackedLocalArtifacts = ''
try {
  trackedLocalArtifacts = git(['ls-files', '.local-artifacts'])
} catch (error) {
  failures.push(`local_artifact_scan_failed:${error.message}`)
}
if (trackedLocalArtifacts) failures.push(`tracked_local_artifacts:${trackedLocalArtifacts}`)

if (failures.length) {
  console.error('Open-source tool stack refresh after AI graphics Worker diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Open-source tool stack refresh after AI graphics Worker diagnostics passed.')
