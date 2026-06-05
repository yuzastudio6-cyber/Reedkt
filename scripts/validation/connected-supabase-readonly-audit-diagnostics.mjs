import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const requiredDocs = [
  'docs/connected-supabase-readonly-audit-record.md',
  'docs/connected-supabase-advisor-triage.md',
  'docs/connected-supabase-rls-no-policy-inventory.md',
  'docs/connected-supabase-security-definer-triage.md',
  'docs/connected-supabase-function-search-path-triage.md',
  'docs/connected-supabase-performance-advisor-triage.md',
  'docs/prompt-26a-validation-results.md',
  'docs/implementation-prompts/prompt-26a-connected-supabase-readonly-audit-triage.md',
]

const trackerFiles = [
  'PRODUCTION_FOUNDATION_STATUS.md',
  'docs/source-of-truth-map.md',
  'docs/production-milestone-plan.md',
  'docs/implementation-prompts/README.md',
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/supabase-milestone-sync-matrix.md',
  'docs/supabase-readonly-audit-evidence-matrix.md',
  'package.json',
  'scripts/validation/run-foundation-validation.mjs',
]

const requiredTerms = {
  'docs/connected-supabase-readonly-audit-record.md': [
    'Connected audit status: `partially_reviewed_connected_metadata`.',
    'Redacted project ref: `wmyy****ishd`.',
    'Project status: `ACTIVE_HEALTHY`.',
    'Database engine: Postgres 17.',
    'Database version: `17.6.1.121`.',
    'Edge Functions deployed: none.',
    'Supabase SQL execution: none.',
    'Secret Manager values fetched: no.',
  ],
  'docs/connected-supabase-advisor-triage.md': [
    'Connected audit status: `partially_reviewed_connected_metadata`.',
    'Prompt 26B - Supabase Advisor Hardening Plan',
    'Prompt 26A is triage only.',
  ],
  'docs/connected-supabase-rls-no-policy-inventory.md': [
    '`activation_artifacts`',
    '`activation_qa_gates`',
    '`activation_runs`',
    '`feature_gates`',
    '`readiness_snapshots`',
    '`tool_capabilities`',
  ],
  'docs/connected-supabase-security-definer-triage.md': [
    '`has_workspace_role`',
    '`is_workspace_owner_or_admin`',
    '`is_workspace_owner_record`',
    '`set_updated_at`',
    '`can_export_render`',
    '`is_project_editor`',
    '`is_project_member`',
  ],
  'docs/connected-supabase-function-search-path-triage.md': [
    '`can_claim_worker_job`',
    '`can_start_generation`',
    '`prevent_approved_plan_snapshot_immutable_update`',
    '`can_run_job`',
    '`can_create_approved_plan_snapshot`',
    '`active_worker_claim_exists`',
    '`e2e_jsonb_has_secret_like_content`',
    '`e2e_assert_safe_json`',
    '`e2e_json_contains_secret_marker`',
  ],
  'docs/connected-supabase-performance-advisor-triage.md': [
    '`ambient_sound_plans`',
    '`api_idempotency_keys`',
    '`approved_plan_snapshots`',
    '`chat_actions`',
    '`chat_attachments`',
    '`chat_messages`',
    '`credit_approvals`',
    '`credit_estimates`',
    '`credit_ledger_entries`',
    '`credit_reservations`',
    '`edit_plans`',
  ],
  'docs/prompt-26a-validation-results.md': [
    'Audit status: `partially_reviewed_connected_metadata`.',
    'Supabase mutation: no.',
    'Supabase SQL ran: none.',
    'Google Cloud API touched: no.',
    'Secret Manager API touched: no.',
  ],
  'docs/supabase-readonly-audit-evidence-matrix.md': [
    'Connected Supabase audit status: `partially_reviewed_connected_metadata`.',
    'Current evidence status: `evidence_required`.',
    'Current redaction status: `not_applicable_no_evidence`.',
  ],
}

const trackerTerms = {
  'PRODUCTION_FOUNDATION_STATUS.md': ['Connected Supabase Read-Only Audit and Advisor Triage', 'docs/connected-supabase-readonly-audit-record.md'],
  'docs/source-of-truth-map.md': ['Connected Supabase read-only audit', 'docs/connected-supabase-advisor-triage.md'],
  'docs/production-milestone-plan.md': ['Prompt 26A - Connected Supabase Read-Only Audit and Advisor Triage'],
  'docs/implementation-prompts/README.md': ['26A', 'Connected Supabase Read-Only Audit and Advisor Triage'],
  'docs/beta-readiness-scorecard.md': ['Prompt 26A connected read-only audit'],
  'docs/production-beta-blocker-inventory.md': ['Prompt 26A connected read-only audit'],
  'docs/supabase-milestone-sync-matrix.md': ['26A', 'partially_reviewed_connected_metadata'],
  'package.json': ['supabase:connected-readonly-audit:diagnostics'],
  'scripts/validation/run-foundation-validation.mjs': ['supabase_connected_readonly_audit_diagnostics'],
}

const redactedProjectRef = 'wmyy****ishd'

const rawProjectRefPatterns = [
  /\b[a-z0-9]{20}\b/g,
]

const rawSecretPatterns = [
  /postgres(?:ql)?:\/\/[^@\s]+@/i,
  /\b(?:SUPABASE|POSTGRES|DATABASE|JWT|STRIPE|OPENAI|PROVIDER)_[A-Z0-9_]*(?:KEY|SECRET|PASSWORD|URL)\s*=\s*[^<\s][^\s]+/i,
  /\b(service[_-]?role[_-]?key|jwt[_-]?secret|provider[_-]?key|stripe[_-]?key|database[_-]?password)\s*[:=]\s*['"`]?[A-Za-z0-9_./+=-]{12,}/i,
  /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/,
  /https?:\/\/[^/\s]+\/storage\/v1\/object\/sign\//i,
  /signedUrl\s*[:=]\s*['"`]https?:\/\//i,
  /signed_url\s*[:=]\s*['"`]https?:\/\//i,
]

const unsafeClaimPatterns = [
  /\bapplied_to_staging\b/i,
  /\bready_for_staging_inventory_review\b/i,
  /\bstaging (supabase|sql|rls|migration).{0,100}\b(ran|executed|passed|completed|validated|approved|applied)\b/i,
  /\bproduction (supabase|sql|readiness|beta).{0,100}\b(ran|executed|passed|completed|validated|approved|ready|unlocked)\b/i,
  /\bGoogle Cloud API touched:\s*yes\b/i,
  /\bSecret Manager API touched:\s*yes\b/i,
  /\bSecret Manager (metadata|values?|payloads?) (fetched|read|printed|retrieved|verified|accessed)\b/i,
  /\bSQL (ran|executed|passed|completed)\b/i,
  /\bSQL executed:\s*(?!none\b)/i,
  /\bMigration deployed:\s*yes\b/i,
  /\b(beta|production).{0,40}\bunlocked\b/i,
  /\bhuman approval (granted|approved)\b/i,
  /\bstaging execution approved:\s*yes\b/i,
]

const unsafeCommandPatterns = [
  /\bgcloud\b/i,
  /\bsupabase\s+link\b/i,
  /\bsupabase\s+db\s+push\b/i,
  /\bsupabase\s+db\s+reset\b/i,
  /\bsupabase\s+start\b/i,
  /\bsupabase\s+status\b/i,
  /\bsupabase\s+migration\s+up\b/i,
  /\bpsql\b/i,
  /\bdeploy(ment|ed)?\b.{0,80}\b(staging|production|remote)\b/i,
]

function resolvePath(relativePath) {
  return path.join(root, relativePath)
}

function exists(relativePath) {
  return fs.existsSync(resolvePath(relativePath))
}

function readFile(relativePath) {
  return exists(relativePath) ? fs.readFileSync(resolvePath(relativePath), 'utf8') : ''
}

function compact(value) {
  return String(value).replace(/\s+/g, ' ').slice(0, 260)
}

function finding(file, kind, line, excerpt) {
  return { file, kind, line, excerpt: compact(excerpt) }
}

function isSafeContext(line) {
  return /\b(no|not|never|forbid|forbidden|blocked|must not|do not|does not|did not|without|placeholder|reference only|metadata-only|future-only|template|redacted|none|pending|required|prohibited|warning|missing|not_applicable_no_evidence|evidence_required|access_not_verified|record only|triage only|not applied|not approved|not deployed)\b/i.test(line)
}

function scanPatterns(files, patterns, kind, { redact = false } = {}) {
  const findings = []
  for (const file of files) {
    readFile(file).split('\n').forEach((line, index) => {
      if (isSafeContext(line)) return
      for (const pattern of patterns) {
        if (pattern.test(line)) {
          findings.push(finding(file, kind, index + 1, redact ? '[redacted unsafe pattern]' : line))
        }
      }
    })
  }
  return findings
}

function scanProjectRefs(files) {
  const findings = []
  for (const file of files) {
    readFile(file).split('\n').forEach((line, index) => {
      if (line.includes(redactedProjectRef)) return
      for (const pattern of rawProjectRefPatterns) {
        const matches = line.match(pattern) || []
        for (const match of matches) {
          if (/^[0-9]+$/.test(match)) continue
          findings.push(finding(file, 'rawProjectRefRisk', index + 1, `[redacted project-ref-like token length=${match.length}]`))
        }
      }
    })
  }
  return findings
}

const filesToScan = [...new Set([...requiredDocs, ...trackerFiles])]

const missingFiles = [...requiredDocs, ...trackerFiles]
  .filter((file) => !exists(file))
  .map((file) => finding(file, 'missingFile', 1, file))

const missingTerms = []
for (const [file, terms] of Object.entries(requiredTerms)) {
  const text = readFile(file)
  for (const term of terms) {
    if (!text.includes(term)) {
      missingTerms.push(finding(file, 'missingRequiredTerm', 1, term))
    }
  }
}

for (const [file, terms] of Object.entries(trackerTerms)) {
  const text = readFile(file)
  for (const term of terms) {
    if (!text.includes(term)) {
      missingTerms.push(finding(file, 'missingTrackerTerm', 1, term))
    }
  }
}

const failures = [
  ...missingFiles,
  ...missingTerms,
  ...scanProjectRefs(filesToScan),
  ...scanPatterns(filesToScan, rawSecretPatterns, 'rawSecretRisk', { redact: true }),
  ...scanPatterns(filesToScan, unsafeClaimPatterns, 'unsafeClaim'),
  ...scanPatterns(requiredDocs, unsafeCommandPatterns, 'unsafeCommand'),
]

const summary = {
  status: failures.length === 0 ? 'passed' : 'failed',
  capabilityEnabled: 'none; connected Supabase read-only audit triage only',
  auditStatus: failures.length === 0 ? 'partially_reviewed_connected_metadata' : 'blocked',
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'read_only_connected_metadata',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  googleCloudApiTouched: false,
  secretManagerApiTouched: false,
  secretManagerMetadataFetched: false,
  secretManagerValuesFetched: false,
  stagingExecutionApproved: false,
  humanApprovalGranted: false,
  productionBetaUnlock: false,
  requiredDocsChecked: requiredDocs.length,
  trackerFilesChecked: trackerFiles.length,
  nextRecommendedPrompt: failures.length === 0
    ? 'Prompt 26B - Supabase Advisor Hardening Plan'
    : 'Prompt 26A-Hardening - Connected Supabase Read-Only Audit Triage Hardening',
  failures,
}

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}

