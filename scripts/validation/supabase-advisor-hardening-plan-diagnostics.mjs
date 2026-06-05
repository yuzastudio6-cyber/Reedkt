import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const requiredDocs = [
  'docs/supabase-advisor-hardening-plan.md',
  'docs/supabase-advisor-hardening-priority-matrix.md',
  'docs/supabase-rls-no-policy-hardening-plan.md',
  'docs/supabase-security-definer-hardening-plan.md',
  'docs/supabase-function-search-path-hardening-plan.md',
  'docs/supabase-fk-index-hardening-plan.md',
  'docs/supabase-advisor-hardening-prompt-sequence.md',
  'docs/prompt-26b-validation-results.md',
  'docs/implementation-prompts/prompt-26b-supabase-advisor-hardening-plan.md',
]

const trackerFiles = [
  'PRODUCTION_FOUNDATION_STATUS.md',
  'docs/source-of-truth-map.md',
  'docs/production-milestone-plan.md',
  'docs/implementation-prompts/README.md',
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/supabase-milestone-sync-matrix.md',
  'docs/connected-supabase-advisor-triage.md',
  'package.json',
  'scripts/validation/run-foundation-validation.mjs',
]

const requiredTerms = {
  'docs/supabase-advisor-hardening-plan.md': [
    'Plan status: `advisor_hardening_planned`.',
    'Connected audit status: `partially_reviewed_connected_metadata`.',
    'Supabase environment touched: none in Prompt 26B.',
    'SQL executed: none.',
    'Migration deployed: no.',
    'Production capability enabled: none; Supabase advisor hardening plan only.',
    '`activation_artifacts`',
    '`tool_capabilities`',
    'Prompt 26C - Supabase Advisor Draft Remediation Packet',
  ],
  'docs/supabase-advisor-hardening-priority-matrix.md': [
    'P0',
    'RLS enabled/no policies',
    'SECURITY DEFINER exposure',
    'Mutable function `search_path`',
    'Unindexed foreign keys',
  ],
  'docs/supabase-rls-no-policy-hardening-plan.md': [
    '`activation_artifacts`',
    '`activation_qa_gates`',
    '`activation_runs`',
    '`feature_gates`',
    '`readiness_snapshots`',
    '`tool_capabilities`',
    'No RLS policy is applied in Prompt 26B.',
  ],
  'docs/supabase-security-definer-hardening-plan.md': [
    '`has_workspace_role`',
    '`is_workspace_owner_or_admin`',
    '`is_workspace_owner_record`',
    '`set_updated_at`',
    '`can_export_render`',
    '`is_project_editor`',
    '`is_project_member`',
    'No function, grant, schema, or SECURITY DEFINER setting is changed in Prompt 26B.',
  ],
  'docs/supabase-function-search-path-hardening-plan.md': [
    '`can_claim_worker_job`',
    '`can_start_generation`',
    '`prevent_approved_plan_snapshot_immutable_update`',
    '`can_run_job`',
    '`can_create_approved_plan_snapshot`',
    '`active_worker_claim_exists`',
    '`e2e_jsonb_has_secret_like_content`',
    '`e2e_assert_safe_json`',
    '`e2e_json_contains_secret_marker`',
    'No function definition is changed in Prompt 26B.',
  ],
  'docs/supabase-fk-index-hardening-plan.md': [
    '`api_idempotency_keys.user_id`',
    '`approved_plan_snapshots.approved_by_user_id`',
    '`approved_plan_snapshots.credit_approval_id`',
    '`chat_actions.executed_by`',
    '`chat_actions.workspace_id`',
    '`credit_estimates.chat_message_id`',
    '`credit_reservations.chat_session_id`',
    '`edit_plans.created_by_user_id`',
    'No index is created in Prompt 26B.',
  ],
  'docs/supabase-advisor-hardening-prompt-sequence.md': [
    'Prompt 26B',
    'Prompt 26C',
    'Prompt 26D',
    'Prompt 26E',
    'Prompt 23A',
    'Prompt 24D',
  ],
  'docs/prompt-26b-validation-results.md': [
    'Advisor hardening status: `advisor_hardening_planned`.',
    'Supabase environment touched: none.',
    'Supabase SQL ran: none.',
    'Function/policy/index hardening applied: no.',
    'Production/beta unlock: no.',
  ],
}

const trackerTerms = {
  'PRODUCTION_FOUNDATION_STATUS.md': ['Supabase Advisor Hardening Plan', 'docs/supabase-advisor-hardening-plan.md'],
  'docs/source-of-truth-map.md': ['Supabase advisor hardening', 'docs/supabase-advisor-hardening-plan.md'],
  'docs/production-milestone-plan.md': ['Prompt 26B - Supabase Advisor Hardening Plan'],
  'docs/implementation-prompts/README.md': ['26B', 'Supabase Advisor Hardening Plan'],
  'docs/beta-readiness-scorecard.md': ['Prompt 26B advisor hardening plan'],
  'docs/production-beta-blocker-inventory.md': ['Prompt 26B advisor hardening plan'],
  'docs/supabase-milestone-sync-matrix.md': ['26B', 'advisor_hardening_planned'],
  'docs/connected-supabase-advisor-triage.md': ['Prompt 26B - Supabase Advisor Hardening Plan'],
  'package.json': ['supabase:advisor:hardening-plan:diagnostics'],
  'scripts/validation/run-foundation-validation.mjs': ['supabase_advisor_hardening_plan_diagnostics'],
}

const redactedProjectRef = 'wmyy****ishd'

const rawProjectRefPatterns = [
  /\b[a-z0-9]{20}\b/g,
]

const rawSecretPatterns = [
  /postgres(?:ql)?:\/\/[^@\s]+@/i,
  /\b(?:SUPABASE|POSTGRES|DATABASE|JWT|STRIPE|OPENAI|PROVIDER|GOOGLE|GCP)_[A-Z0-9_]*(?:KEY|SECRET|PASSWORD|TOKEN|URL)\s*=\s*[^<\s][^\s]+/i,
  /\b(service[_-]?role[_-]?key|jwt[_-]?secret|provider[_-]?key|stripe[_-]?key|database[_-]?password|secret manager value|secret payload)\s*[:=]\s*['"`]?[A-Za-z0-9_./+=-]{12,}/i,
  /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/,
  /https?:\/\/[^/\s]+\/storage\/v1\/object\/sign\//i,
  /signedUrl\s*[:=]\s*['"`]https?:\/\//i,
  /signed_url\s*[:=]\s*['"`]https?:\/\//i,
]

const unsafeClaimPatterns = [
  /\badvisor findings? (resolved|remediated|fixed|cleared|applied)\b/i,
  /\bhardening (applied|executed|completed)\b/i,
  /\bpolicy (created|applied|executed|deployed)\b/i,
  /\bfunction (altered|changed|updated|deployed)\b/i,
  /\bindex(es)? (created|applied|deployed)\b/i,
  /\bapplied_to_staging\b/i,
  /\bvalidated_in_staging\b/i,
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
  return /\b(no|not|never|forbid|forbidden|blocked|must not|do not|does not|did not|without|placeholder|reference only|metadata-only|future-only|candidate only|template|redacted|none|pending|required|prohibited|warning|missing|not_applicable_no_evidence|evidence_required|access_not_verified|record only|triage only|plan only|not applied|not approved|not deployed|not remediated|not executed|not changed|not created|not fetched|not verified)\b/i.test(line)
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
  capabilityEnabled: 'none; Supabase advisor hardening plan only',
  advisorHardeningStatus: failures.length === 0 ? 'advisor_hardening_planned' : 'blocked',
  auditStatus: failures.length === 0 ? 'partially_reviewed_connected_metadata' : 'blocked',
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  googleCloudApiTouched: false,
  secretManagerApiTouched: false,
  secretManagerMetadataFetched: false,
  secretManagerValuesFetched: false,
  policyHardeningApplied: false,
  functionHardeningApplied: false,
  indexHardeningApplied: false,
  stagingExecutionApproved: false,
  humanApprovalGranted: false,
  productionBetaUnlock: false,
  requiredDocsChecked: requiredDocs.length,
  trackerFilesChecked: trackerFiles.length,
  nextRecommendedPrompt: failures.length === 0
    ? 'Prompt 26C - Supabase Advisor Draft Remediation Packet'
    : 'Prompt 26B-A - Supabase Advisor Hardening Plan Diagnostics Repair',
  failures,
}

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
