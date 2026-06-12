import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const requiredDocs = [
  'docs/release/milestone-pr-stack-audit.md',
  'docs/release/milestone-merge-readiness-matrix.md',
  'docs/release/milestone-merge-order.md',
  'docs/release/milestone-pr-policy.md',
  'docs/release/milestone-pr-body-template.md',
  'docs/release/milestone-post-merge-checklist.md',
  'docs/release/milestone-pr-cleanup-risk-register.md',
  'docs/release/milestone-pr-stack-evidence.json',
  'docs/prompt-merge-0-validation-results.md',
  'docs/implementation-prompts/prompt-merge-0-milestone-pr-stack-audit.md',
]

const trackerFiles = [
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
]

const lifecycleStates = [
  'local_done',
  'pushed_not_pr',
  'pr_open_draft',
  'pr_open_ready',
  'ci_passed_ready_to_merge',
  'merged_to_feature_base',
  'merged_to_main_or_release_base',
  'blocked_pending_parent_merge',
  'blocked_pending_ci',
  'blocked_pending_review',
  'blocked_pending_rebase',
  'duplicate_or_superseded_review_required',
]

const readinessStates = [
  'ready_to_merge',
  'ready_after_parent_merge',
  'draft_keep_open',
  'blocked_pending_ci',
  'blocked_pending_review',
  'blocked_pending_rebase',
  'duplicate_or_superseded_review_required',
]

const exactNoScope = 'No PR merge, branch deletion, Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.'

const requiredBaseGaps = [
  'PRODUCTION_FOUNDATION_STATUS.md',
  'docs/source-of-truth-map.md',
  'docs/production-milestone-plan.md',
  'docs/implementation-prompts/README.md',
  'docs/internal-beta/',
  'docs/cross-chat/',
  'docs/runtime-unlock/',
  '.github/workflows/',
  'scripts/validation/run-foundation-validation.mjs',
]

const errors = []

function filePath(file) {
  return path.join(root, file)
}

function read(file) {
  return readFileSync(filePath(file), 'utf8')
}

function readJson(file) {
  return JSON.parse(read(file))
}

for (const file of requiredDocs) {
  if (!existsSync(filePath(file))) errors.push(`missing_required_doc:${file}`)
}

const packageJson = existsSync(filePath('package.json')) ? readJson('package.json') : { scripts: {} }
if (packageJson.scripts?.['release:milestone-pr-stack:audit:diagnostics'] !== 'node scripts/validation/milestone-pr-stack-audit-diagnostics.mjs') {
  errors.push('missing_package_script:release:milestone-pr-stack:audit:diagnostics')
}

const combinedDocs = requiredDocs
  .filter((file) => existsSync(filePath(file)) && file.endsWith('.md'))
  .map((file) => `\n--- ${file} ---\n${read(file)}`)
  .join('\n')

for (const token of [
  'MERGE-0',
  'merge_readiness_packet_created',
  'none; milestone PR stack audit and merge policy only',
  'Open PRs inspected',
  'Draft PRs',
  'Missing checks',
  'GitHub open PR metadata',
  'MERGE-1 - Parent-First Milestone PR Merge Execution',
  'MERGE-0A - PR Stack Cleanup Fixes',
  'Supabase update required: `docs/status only`',
  'Supabase update status: `docs_only`',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  exactNoScope,
]) {
  if (!combinedDocs.includes(token)) errors.push(`missing_required_text:${token}`)
}

for (const state of lifecycleStates) {
  if (!combinedDocs.includes(state)) errors.push(`missing_lifecycle_state:${state}`)
}

for (const state of readinessStates) {
  if (!combinedDocs.includes(state)) errors.push(`missing_readiness_state:${state}`)
}

for (const gap of requiredBaseGaps) {
  if (!combinedDocs.includes(gap)) errors.push(`missing_base_gap:${gap}`)
}

let evidence = null
if (existsSync(filePath('docs/release/milestone-pr-stack-evidence.json'))) {
  evidence = readJson('docs/release/milestone-pr-stack-evidence.json')
  if (!evidence.summary || !Array.isArray(evidence.prs)) {
    errors.push('invalid_evidence_shape')
  } else {
    if (evidence.summary.openPrsInspected !== evidence.prs.length) errors.push('evidence_count_mismatch')
    if (evidence.summary.openPrsInspected < 1) errors.push('evidence_no_open_prs')
    if (evidence.summary.draftPrs < 1) errors.push('evidence_no_draft_prs')
    if (evidence.summary.missingChecks < 1) errors.push('evidence_no_missing_checks')
    for (const state of readinessStates) {
      if (!(state in evidence.summary.readinessCounts)) errors.push(`evidence_missing_readiness_count:${state}`)
    }
    for (const pr of evidence.prs) {
      for (const field of ['number', 'title', 'base', 'head', 'workstream', 'checkStatus', 'mergeReadiness', 'recommendedAction']) {
        if (!(field in pr)) errors.push(`evidence_pr_missing_field:${pr.number ?? 'unknown'}:${field}`)
      }
    }
  }
}

for (const file of trackerFiles) {
  if (!existsSync(filePath(file))) {
    errors.push(`missing_tracker:${file}`)
    continue
  }
  const body = read(file)
  if (!body.includes('MERGE-0')) errors.push(`tracker_missing_merge_0:${file}`)
  if (!body.includes('merge_readiness_packet_created')) errors.push(`tracker_missing_status:${file}`)
  if (!body.includes('docs/status only')) errors.push(`tracker_missing_supabase_docs_only:${file}`)
}

const unsafePatterns = [
  /all PRs (?:are )?merged/i,
  /merged all PRs/i,
  /PR merge (?:completed|executed|enabled|approved now)/i,
  /branch deletion (?:completed|executed|enabled|approved now)/i,
  /deleted branch/i,
  /closed PR/i,
  /rebased branch/i,
  /Supabase mutation (?:completed|executed|enabled|approved now)/i,
  /\bSQL executed:\s*`?(?!none\b)[A-Za-z0-9_/-]+`?/i,
  /provider call (?:completed|executed|enabled|approved now)/i,
  /model call (?:completed|executed|enabled|approved now)/i,
  /tool execution (?:completed|executed|enabled|approved now)/i,
  /worker execution (?:completed|executed|enabled|approved now)/i,
  /route execution (?:completed|executed|enabled|approved now)/i,
  /deployment (?:completed|executed|enabled|approved now)/i,
  /internal beta unlock (?:completed|executed|enabled|approved now)/i,
  /external beta unlock (?:completed|executed|enabled|approved now)/i,
  /production unlock (?:completed|executed|enabled|approved now)/i,
  /signed URL (?:created|enabled|approved now)/i,
  /public artifact (?:created|enabled|approved now)/i,
  /broad service-role handler (?:enabled|approved now)/i,
  /\b(?:ran|run|execute|executed)\s+supabase\s+(?:db|link|start|status|migration|functions|storage)\b/i,
  /`supabase\s+(?:db|link|start|status|migration|functions|storage)\b/i,
  /\bpsql\b/i,
  new RegExp(`s${'k'}-(proj-)?[A-Za-z0-9]{20,}`),
  /Bearer\s+[A-Za-z0-9._-]{24,}/i,
  new RegExp(['X-Goog', 'Signature='].join('-'), 'i'),
  /postgres(?:ql)?:\/\//i,
]

for (const file of requiredDocs.filter((item) => existsSync(filePath(item)) && item.endsWith('.md'))) {
  const body = read(file)
  for (const pattern of unsafePatterns) {
    if (pattern.test(body)) errors.push(`unsafe_pattern:${file}:${pattern}`)
  }
}

if (existsSync(filePath('scripts/validation/run-foundation-validation.mjs'))) {
  errors.push('foundation_runner_present_unexpected_on_merge_0_base')
}

if (errors.length > 0) {
  console.error(JSON.stringify({ status: 'failed', errors }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'passed',
  milestonePrStackAuditStatus: 'merge_readiness_packet_created',
  openPrsInspected: evidence?.summary?.openPrsInspected ?? null,
  draftPrs: evidence?.summary?.draftPrs ?? null,
  missingChecks: evidence?.summary?.missingChecks ?? null,
  productionCapabilityEnabled: 'none; milestone PR stack audit and merge policy only',
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  nextRecommendedPrompt: 'MERGE-1 - Parent-First Milestone PR Merge Execution or MERGE-0A - PR Stack Cleanup Fixes',
}, null, 2))
