import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const requiredDocs = [
  'docs/supabase-advisor-draft-remediation-packet.md',
  'docs/supabase-rls-no-policy-draft-remediation-packet.md',
  'docs/supabase-security-definer-draft-remediation-packet.md',
  'docs/supabase-function-search-path-draft-remediation-packet.md',
  'docs/supabase-fk-index-draft-remediation-packet.md',
  'docs/supabase-advisor-draft-remediation-execution-readiness.md',
  'docs/draft-sql/supabase-advisor-remediation/README.md',
  'docs/draft-sql/supabase-advisor-remediation/rls-no-policy-draft.sql.md',
  'docs/draft-sql/supabase-advisor-remediation/security-definer-grants-draft.sql.md',
  'docs/draft-sql/supabase-advisor-remediation/function-search-path-draft.sql.md',
  'docs/draft-sql/supabase-advisor-remediation/fk-indexes-draft.sql.md',
  'docs/prompt-26c-validation-results.md',
  'docs/implementation-prompts/prompt-26c-supabase-advisor-draft-remediation-packet.md',
]

const draftSqlDocs = [
  'docs/draft-sql/supabase-advisor-remediation/rls-no-policy-draft.sql.md',
  'docs/draft-sql/supabase-advisor-remediation/security-definer-grants-draft.sql.md',
  'docs/draft-sql/supabase-advisor-remediation/function-search-path-draft.sql.md',
  'docs/draft-sql/supabase-advisor-remediation/fk-indexes-draft.sql.md',
]

const trackerFiles = [
  'PRODUCTION_FOUNDATION_STATUS.md',
  'docs/source-of-truth-map.md',
  'docs/production-milestone-plan.md',
  'docs/implementation-prompts/README.md',
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/supabase-milestone-sync-matrix.md',
  'docs/supabase-advisor-hardening-prompt-sequence.md',
  'package.json',
  'scripts/validation/run-foundation-validation.mjs',
]

const requiredTerms = {
  'docs/supabase-advisor-draft-remediation-packet.md': [
    'Packet status: `advisor_draft_remediation_packet_created`.',
    'Advisor hardening status: `draft_remediation_planned`.',
    'Supabase environment touched: none.',
    'SQL executed: none.',
    'Migration deployed: no.',
    'Production capability enabled: none; Supabase advisor draft remediation packet only.',
    'Prompt 26D - RLS No-Policy Table Classification and Policy Contract',
  ],
  'docs/supabase-rls-no-policy-draft-remediation-packet.md': [
    '`activation_artifacts`',
    '`activation_qa_gates`',
    '`activation_runs`',
    '`feature_gates`',
    '`readiness_snapshots`',
    '`tool_capabilities`',
    'No policy is applied in Prompt 26C.',
  ],
  'docs/supabase-security-definer-draft-remediation-packet.md': [
    '`has_workspace_role`',
    '`is_workspace_owner_or_admin`',
    '`is_workspace_owner_record`',
    '`set_updated_at`',
    '`can_export_render`',
    '`is_project_editor`',
    '`is_project_member`',
    'No function, grant, owner, security mode, or schema is changed in Prompt 26C.',
  ],
  'docs/supabase-function-search-path-draft-remediation-packet.md': [
    '`can_claim_worker_job`',
    '`can_start_generation`',
    '`prevent_approved_plan_snapshot_immutable_update`',
    '`can_run_job`',
    '`can_create_approved_plan_snapshot`',
    '`active_worker_claim_exists`',
    '`e2e_jsonb_has_secret_like_content`',
    '`e2e_assert_safe_json`',
    '`e2e_json_contains_secret_marker`',
    'No function definition is changed in Prompt 26C.',
  ],
  'docs/supabase-fk-index-draft-remediation-packet.md': [
    '`api_idempotency_keys.user_id`',
    '`approved_plan_snapshots.approved_by_user_id`',
    '`approved_plan_snapshots.credit_approval_id`',
    '`chat_actions.executed_by`',
    '`chat_actions.workspace_id`',
    '`credit_reservations.chat_session_id`',
    '`edit_plans.created_by_user_id`',
    'No index is created in Prompt 26C.',
  ],
  'docs/supabase-advisor-draft-remediation-execution-readiness.md': [
    'Local execution readiness: not ready.',
    'Staging execution readiness: blocked',
    'Production execution readiness: blocked.',
    'Advisor remediation applied: no.',
  ],
  'docs/prompt-26c-validation-results.md': [
    'Capability enabled: none; Supabase advisor draft remediation packet only.',
    'Advisor draft remediation status: `draft_remediation_planned`.',
    'Supabase environment touched: none.',
    'SQL executed: none.',
    'Migration deployed: no.',
    'Active migration files changed: no.',
  ],
  'docs/implementation-prompts/prompt-26c-supabase-advisor-draft-remediation-packet.md': [
    'Exact capability enabled: none; Supabase advisor draft remediation packet only.',
    'PR title: `[foundation] Prompt 26C Supabase advisor draft remediation packet`',
  ],
}

const trackerTerms = {
  'PRODUCTION_FOUNDATION_STATUS.md': ['Supabase Advisor Draft Remediation Packet', 'docs/supabase-advisor-draft-remediation-packet.md'],
  'docs/source-of-truth-map.md': ['Supabase advisor draft remediation', 'docs/supabase-advisor-draft-remediation-packet.md'],
  'docs/production-milestone-plan.md': ['Prompt 26C - Supabase Advisor Draft Remediation Packet'],
  'docs/implementation-prompts/README.md': ['26C', 'Supabase Advisor Draft Remediation Packet'],
  'docs/beta-readiness-scorecard.md': ['Prompt 26C advisor draft remediation packet'],
  'docs/production-beta-blocker-inventory.md': ['Prompt 26C advisor draft remediation packet'],
  'docs/supabase-milestone-sync-matrix.md': ['26C', 'draft_remediation_planned'],
  'docs/supabase-advisor-hardening-prompt-sequence.md': ['Prompt 26C', 'umbrella draft remediation packet'],
  'package.json': ['supabase:advisor:draft-remediation:diagnostics'],
  'scripts/validation/run-foundation-validation.mjs': ['supabase_advisor_draft_remediation_diagnostics'],
}

const requiredDraftLabels = [
  'DRAFT ONLY',
  'DO NOT EXECUTE',
  'not validated',
  'not applied to Supabase',
  'requires future prompt',
]

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
  /\badvisor remediation (applied|executed|completed|validated)\b/i,
  /\bhardening (applied|executed|completed)\b/i,
  /\bpolicy (created|applied|executed|deployed)\b/i,
  /\bfunction (altered|changed|updated|deployed)\b/i,
  /\bgrant (revoked|applied|changed|deployed)\b/i,
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
  /\bActive migration files changed:\s*(?!no\b)/i,
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
  return /\b(no|not|never|forbid|forbidden|blocked|must not|do not|does not|did not|without|placeholder|reference only|metadata-only|future-only|draft only|template|redacted|none|pending|required|prohibited|warning|missing|not_applicable_no_evidence|evidence_required|access_not_verified|record only|triage only|plan only|not applied|not approved|not deployed|not remediated|not executed|not changed|not created|not fetched|not verified|sketch|candidate|requires future prompt)\b/i.test(line)
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

function listFiles(directory) {
  const absolute = resolvePath(directory)
  if (!fs.existsSync(absolute)) return []
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(directory, entry.name)
    if (entry.isDirectory()) return listFiles(relative)
    return [relative]
  })
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

const draftLabelFindings = []
for (const file of draftSqlDocs) {
  const text = readFile(file)
  for (const label of requiredDraftLabels) {
    if (!text.toLowerCase().includes(label.toLowerCase())) {
      draftLabelFindings.push(finding(file, 'missingDraftWarningLabel', 1, label))
    }
  }
}

const draftDirectoryFiles = listFiles('docs/draft-sql/supabase-advisor-remediation')
const executableDraftFiles = draftDirectoryFiles
  .filter((file) => file.endsWith('.sql') || file.endsWith('.psql'))
  .map((file) => finding(file, 'executableDraftSqlFile', 1, file))

const activeMigrationPromptFindings = listFiles('supabase/migrations')
  .filter((file) => {
    const text = readFile(file)
    return /Prompt 26C|advisor_draft_remediation|draft_remediation_planned|supabase-advisor-remediation/i.test(text)
  })
  .map((file) => finding(file, 'activeMigrationContainsPrompt26CRemediation', 1, file))

const failures = [
  ...missingFiles,
  ...missingTerms,
  ...draftLabelFindings,
  ...executableDraftFiles,
  ...activeMigrationPromptFindings,
  ...scanProjectRefs(filesToScan),
  ...scanPatterns(filesToScan, rawSecretPatterns, 'rawSecretRisk', { redact: true }),
  ...scanPatterns(filesToScan, unsafeClaimPatterns, 'unsafeClaim'),
  ...scanPatterns(requiredDocs, unsafeCommandPatterns, 'unsafeCommand'),
]

const summary = {
  status: failures.length === 0 ? 'passed' : 'failed',
  capabilityEnabled: 'none; Supabase advisor draft remediation packet only',
  remediationPacketStatus: failures.length === 0 ? 'advisor_draft_remediation_packet_created' : 'blocked',
  advisorHardeningStatus: failures.length === 0 ? 'draft_remediation_planned' : 'blocked',
  draftSqlStatus: failures.length === 0 ? 'draft_only_not_executable' : 'blocked',
  activeMigrationFilesChangedByPrompt26C: false,
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
  advisorRemediationApplied: false,
  stagingExecutionApproved: false,
  humanApprovalGranted: false,
  productionBetaUnlock: false,
  requiredDocsChecked: requiredDocs.length,
  draftSqlDocsChecked: draftSqlDocs.length,
  trackerFilesChecked: trackerFiles.length,
  nextRecommendedPrompt: failures.length === 0
    ? 'Prompt 26D - RLS No-Policy Table Classification and Policy Contract'
    : 'Prompt 26C-A - Supabase Advisor Draft Remediation Packet Diagnostics Repair',
  failures,
}

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
