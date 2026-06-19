import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const baseRef = 'origin/codex/rp-open-source-tool-stack-refresh-after-ai-graphics-worker'

const requiredDocs = [
  'docs/open-source-tool-stack/refresh/open-source-tool-stack-refresh-qa-review.md',
  'docs/open-source-tool-stack/refresh/open-source-tool-stack-refresh-qa-source-lockfile.md',
  'docs/open-source-tool-stack/refresh/open-source-tool-stack-refresh-canonical-counts-qa.md',
  'docs/open-source-tool-stack/refresh/open-source-tool-stack-refresh-draft-evidence-ledger-qa.md',
  'docs/open-source-tool-stack/refresh/open-source-tool-stack-refresh-owner-matrix-qa.md',
  'docs/open-source-tool-stack/refresh/open-source-tool-stack-refresh-proof-status-matrix-qa.md',
  'docs/open-source-tool-stack/refresh/open-source-tool-stack-refresh-ai-graphics-delta-qa.md',
  'docs/open-source-tool-stack/refresh/open-source-tool-stack-refresh-worker-ai-graphics-delta-qa.md',
  'docs/open-source-tool-stack/refresh/open-source-tool-stack-refresh-track-a-delta-qa.md',
  'docs/open-source-tool-stack/refresh/open-source-tool-stack-refresh-track-b-delta-qa.md',
  'docs/open-source-tool-stack/refresh/open-source-tool-stack-refresh-sound-map-web-worker-delta-qa.md',
  'docs/open-source-tool-stack/refresh/open-source-tool-stack-refresh-provider-api-separated-qa.md',
  'docs/open-source-tool-stack/refresh/open-source-tool-stack-refresh-blocked-register-qa.md',
  'docs/open-source-tool-stack/refresh/open-source-tool-stack-refresh-merge-readiness-qa.md',
  'docs/open-source-tool-stack/refresh/open-source-tool-stack-refresh-next-install-proof-batches-qa.md',
  'docs/open-source-tool-stack/refresh/open-source-tool-stack-refresh-qa-decision.md',
  'docs/prompt-open-source-tool-stack-refresh-after-ai-graphics-worker-qa-review-results.md',
  'docs/implementation-prompts/prompt-open-source-tool-stack-refresh-after-ai-graphics-worker-qa-review.md',
]

const allowedDecisions = new Set([
  'open_source_tool_stack_refresh_qa_passed_with_warnings',
  'open_source_tool_stack_refresh_qa_passed',
  'blocked_pending_refresh_qa_fixes',
  'blocked_pending_canonical_draft_separation_review',
  'blocked_pending_tool_count_conflict_review',
  'blocked_pending_runtime_readiness_claim_review',
])

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

const expectedCounts = new Map([
  ['Total candidates', '71'],
  ['Local/OSS candidates', '68'],
  ['Provider/API separated', '3'],
  ['Smoke-only', '14'],
  ['Docs-only', '17'],
  ['Not proven', '31'],
  ['Blocked', '9'],
  ['E2E proven', '0'],
])

const forbiddenPatterns = [
  ['all_tools_installed', /\ball (?:tools|local\/OSS tools|OSS tools) (?:are|were|have been) installed\b/i],
  ['all_tools_e2e_proven', /\ball (?:tools|local\/OSS tools|OSS tools) (?:are|were|have been) E2E[- ]proven\b/i],
  ['draft_canonical_proof', /\bdraft evidence\b[\s\S]{0,80}\bcanonical (?:proof|E2E)\b/i],
  ['runtime_ready_true', /\b(?:runtime-ready tools|runtimeReadyNow|runtime readiness)\b\s*[:=]\s*(?:true|[1-9]\d*|enabled|approved|ready)\b/i],
  ['internal_beta_ready_true', /\b(?:internal-beta-ready tools|internalBetaReadyNow|internal beta readiness)\b\s*[:=]\s*(?:true|[1-9]\d*|enabled|approved|ready)\b/i],
  ['production_ready_true', /\b(?:productionReadyNow|production readiness|production unlock)\b\s*[:=]\s*(?:true|enabled|approved|ready)\b/i],
  ['worker_execution_true', /\b(?:worker execution|workerRuntimeExecuted)\b\s*[:=]\s*(?:true|enabled|executed|approved|ready)\b/i],
  ['route_execution_true', /\b(?:route execution|routeRuntimeExecuted)\b\s*[:=]\s*(?:true|enabled|executed|approved|ready)\b/i],
  ['tool_execution_true', /\b(?:actual tool execution|toolRuntimeExecuted)\b\s*[:=]\s*(?:true|enabled|executed|approved|ready)\b/i],
  ['provider_execution_true', /\b(?:provider\/model execution|provider\/model runtime|providerRuntimeExecuted)\b\s*[:=]\s*(?:true|enabled|executed|approved|ready)\b/i],
  ['supabase_gcs_true', /\b(?:Supabase|GCS|signed URL|public artifact)\b[\s\S]{0,30}\b(?:true|enabled|executed|created|approved|ready)\b/i],
  ['generic_dry_run_passed_true', /\bdry_run_passed\b[\s\S]{0,30}\b(?:true|claimed|accepted)\b/i],
  ['generated_local_fixture_passed_true', /\bgenerated_local_fixture_passed\b[\s\S]{0,30}\b(?:true|claimed|accepted)\b/i],
]

const failures = []

function git(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  }).trim()
}

for (const path of requiredDocs) {
  if (!existsSync(path)) failures.push(`missing_required_doc:${path}`)
}

const docsText = requiredDocs
  .filter((path) => existsSync(path))
  .map((path) => `\n--- ${path} ---\n${readFileSync(path, 'utf8')}`)
  .join('\n')

const decisionMatch = docsText.match(/Decision:\s*`([^`]+)`/)
const decision = decisionMatch?.[1]
if (!decision) failures.push('missing_decision')
else if (!allowedDecisions.has(decision)) failures.push(`invalid_decision:${decision}`)
else if (decision !== 'open_source_tool_stack_refresh_qa_passed_with_warnings') failures.push(`unexpected_decision:${decision}`)

for (const required of [
  '#534',
  'open_source_tool_stack_refresh_completed_with_draft_evidence_reconciled',
  '#416',
  'canonical',
  '#425',
  '#433',
  '#441',
  '#532',
  'draft_pending',
  'worker_ai_graphics_metadata_controlled_noop_worker_gate_owner_review_passed_with_warnings',
  'runtime-ready tools',
  'Internal-beta-ready tools',
]) {
  if (!docsText.includes(required)) failures.push(`missing_required_text:${required}`)
}

for (const [label, expected] of expectedCounts) {
  const pattern = new RegExp(`${label.replace('/', '\\/')}(?:\\s*\\|\\s*|\\s*[:=]\\s*)\`${expected}\`|${label.replace('/', '\\/')}(?:\\s*\\|\\s*|\\s*[:=]\\s*)${expected}`, 'i')
  if (!pattern.test(docsText)) failures.push(`missing_count:${label}:${expected}`)
}

for (const tool of expectedTools) {
  if (!docsText.includes(tool)) failures.push(`missing_tool:${tool}`)
}

for (const [name, pattern] of forbiddenPatterns) {
  const match = docsText.match(pattern)
  if (match) failures.push(`forbidden_claim:${name}:${match[0]}`)
}

try {
  const packageBefore = JSON.parse(git(['show', `${baseRef}:package.json`]))
  const packageAfter = JSON.parse(readFileSync('package.json', 'utf8'))
  for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
    if (JSON.stringify(packageBefore[section] ?? {}) !== JSON.stringify(packageAfter[section] ?? {})) {
      failures.push(`package_dependency_section_changed:${section}`)
    }
  }
  const script = packageAfter.scripts?.['open-source-tool-stack:refresh-after-ai-graphics-worker-qa:diagnostics']
  if (script !== 'node scripts/validation/open-source-tool-stack-refresh-after-ai-graphics-worker-qa-diagnostics.mjs') {
    failures.push('missing_qa_diagnostics_package_script')
  }
} catch (error) {
  failures.push(`package_json_comparison_failed:${error.message}`)
}

try {
  if (git(['show', `${baseRef}:package-lock.json`]).trim() !== readFileSync('package-lock.json', 'utf8').trim()) {
    failures.push('package_lock_changed')
  }
} catch (error) {
  failures.push(`package_lock_comparison_failed:${error.message}`)
}

let changedFiles = []
try {
  changedFiles = [
    git(['diff', '--name-only', `${baseRef}...HEAD`]),
    git(['diff', '--name-only']),
    git(['diff', '--cached', '--name-only']),
    git(['ls-files', '--others', '--exclude-standard']),
  ]
    .filter(Boolean)
    .join('\n')
    .split('\n')
    .filter(Boolean)
} catch (error) {
  failures.push(`changed_file_scan_failed:${error.message}`)
}

const forbiddenPath = changedFiles.find((path) =>
  path.startsWith('.local-artifacts/') ||
  /(^|\/)(media|render|browser|canvas|webgl|public-artifacts|generated-artifacts)(\/|$)/i.test(path),
)
if (forbiddenPath) failures.push(`forbidden_changed_artifact_path:${forbiddenPath}`)

try {
  const trackedLocalArtifacts = git(['ls-files', '.local-artifacts'])
  if (trackedLocalArtifacts) failures.push(`tracked_local_artifacts:${trackedLocalArtifacts}`)
} catch (error) {
  failures.push(`local_artifact_scan_failed:${error.message}`)
}

if (failures.length) {
  console.error('Open-source tool stack refresh QA diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Open-source tool stack refresh QA diagnostics passed.')
