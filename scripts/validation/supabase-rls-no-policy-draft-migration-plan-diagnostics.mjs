import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const requiredDocs = [
  'docs/supabase-rls-no-policy-draft-migration-plan.md',
  'docs/supabase-rls-no-policy-policy-naming-contract.md',
  'docs/supabase-rls-no-policy-policy-dependency-matrix.md',
  'docs/supabase-rls-no-policy-future-test-matrix.md',
  'docs/supabase-rls-no-policy-rollback-cleanup-plan.md',
  'docs/supabase-rls-no-policy-staging-evidence-requirements.md',
  'docs/draft-sql/supabase-advisor-remediation/rls-no-policy-draft.sql.md',
  'docs/prompt-26e-validation-results.md',
  'docs/implementation-prompts/prompt-26e-rls-no-policy-draft-migration-plan.md',
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
  'docs/supabase-rls-no-policy-draft-remediation-packet.md',
  'docs/supabase-rls-no-policy-migration-readiness-checklist.md',
  'docs/supabase-advisor-hardening-priority-matrix.md',
  'package.json',
  'scripts/validation/run-foundation-validation.mjs',
  '.github/workflows/foundation-validation.yml',
]

const noPolicyTables = [
  'activation_artifacts',
  'activation_qa_gates',
  'activation_runs',
  'feature_gates',
  'readiness_snapshots',
  'tool_capabilities',
]

const requiredTerms = {
  'docs/supabase-rls-no-policy-draft-migration-plan.md': [
    'Draft migration plan status: `rls_no_policy_draft_migration_plan_created`.',
    'Supabase update status: docs_only.',
    'Supabase environment touched: none.',
    'SQL executed: none.',
    'Migration deployed: no.',
    'Active migration files changed: no.',
    'Production capability enabled: none; RLS no-policy draft migration plan only.',
    'Prompt 26E-1 - RLS No-Policy Local Draft Migration Implementation',
    ...noPolicyTables.map((table) => `\`${table}\``),
  ],
  'docs/supabase-rls-no-policy-policy-naming-contract.md': [
    'Policy naming contract status: `rls_no_policy_policy_names_defined`.',
    'activation_artifacts_select_backend_only',
    'activation_qa_gates_select_backend_only',
    'activation_runs_select_backend_only',
    'feature_gates_select_no_client_access',
    'readiness_snapshots_select_backend_only',
    'tool_capabilities_select_no_client_access',
  ],
  'docs/supabase-rls-no-policy-policy-dependency-matrix.md': [
    'Dependency matrix status: `rls_no_policy_dependencies_planned`.',
    ...noPolicyTables.map((table) => `\`${table}\``),
  ],
  'docs/supabase-rls-no-policy-future-test-matrix.md': [
    'Future test matrix status: `rls_no_policy_future_tests_planned`.',
    'Executable SQL tests created: no.',
    'Anon denied',
    'Auth non-member denied',
    'Service-role behavior documented',
    ...noPolicyTables.map((table) => `\`${table}\``),
  ],
  'docs/supabase-rls-no-policy-rollback-cleanup-plan.md': [
    'Rollback cleanup plan status: `rls_no_policy_rollback_cleanup_planned`.',
    'Rollback executed: no.',
    'SQL executed: none.',
  ],
  'docs/supabase-rls-no-policy-staging-evidence-requirements.md': [
    'Staging evidence requirements status: `rls_no_policy_staging_evidence_requirements_defined`.',
    'Staging validation executed: no.',
    'SQL executed: none.',
  ],
  'docs/draft-sql/supabase-advisor-remediation/rls-no-policy-draft.sql.md': [
    'DRAFT ONLY — DO NOT EXECUTE',
    'NOT AN ACTIVE MIGRATION',
    'not validated',
    'not applied to Supabase',
    'requires future prompt',
    ...noPolicyTables.map((table) => table),
  ],
  'docs/prompt-26e-validation-results.md': [
    'Capability enabled: none; RLS no-policy draft migration plan only.',
    'Supabase update status: docs_only.',
    'Supabase environment touched: none.',
    'SQL executed: none.',
    'Migration deployed: no.',
    'Active migration files changed: no.',
  ],
  'docs/implementation-prompts/prompt-26e-rls-no-policy-draft-migration-plan.md': [
    'Prompt 26E - RLS No-Policy Draft Migration Plan',
    'Exact capability enabled: none; RLS no-policy draft migration plan only.',
  ],
}

const trackerTerms = {
  'PRODUCTION_FOUNDATION_STATUS.md': ['RLS No-Policy Draft Migration Plan', 'docs/supabase-rls-no-policy-draft-migration-plan.md'],
  'docs/source-of-truth-map.md': ['RLS no-policy draft migration plan', 'docs/supabase-rls-no-policy-draft-migration-plan.md'],
  'docs/production-milestone-plan.md': ['Prompt 26E - RLS No-Policy Draft Migration Plan'],
  'docs/implementation-prompts/README.md': ['26E', 'RLS No-Policy Draft Migration Plan'],
  'docs/beta-readiness-scorecard.md': ['Prompt 26E RLS no-policy draft migration plan'],
  'docs/production-beta-blocker-inventory.md': ['Prompt 26E creates the RLS no-policy draft migration plan'],
  'docs/supabase-milestone-sync-matrix.md': ['26E', 'rls_no_policy_draft_migration_plan_created'],
  'docs/supabase-advisor-hardening-prompt-sequence.md': ['Prompt 26E', 'draft migration plan'],
  'docs/supabase-rls-no-policy-draft-remediation-packet.md': ['Prompt 26E draft migration plan outcome', 'rls_no_policy_draft_migration_plan_created'],
  'docs/supabase-rls-no-policy-migration-readiness-checklist.md': ['Draft migration plan created: yes', 'Executable migration ready: no'],
  'docs/supabase-advisor-hardening-priority-matrix.md': ['Prompt 26E', 'Prompt 26E-1'],
  'package.json': ['supabase:rls-no-policy:draft-migration:diagnostics'],
  'scripts/validation/run-foundation-validation.mjs': ['supabase_rls_no_policy_draft_migration_diagnostics'],
  '.github/workflows/foundation-validation.yml': ['codex/rp-foundation-26d-rls-no-policy-table-classification-contract'],
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
  /\badvisor remediation (applied|executed|completed|validated)\b/i,
  /\bactive (RLS )?polic(?:y|ies) (created|applied|executed|deployed|validated)\b/i,
  /\bgrant (revoked|applied|changed|deployed|executed)\b/i,
  /\bfunction (altered|changed|updated|deployed|executed)\b/i,
  /\bindex(es)? (created|applied|deployed|executed)\b/i,
  /\bapplied_to_staging\b/i,
  /\bapplied_to_production\b/i,
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
  /\bsupabase\s+functions\s+deploy\b/i,
  /\bpsql\b/i,
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
  return /\b(no|not|never|forbid|forbidden|blocked|must not|do not|does not|did not|without|placeholder|reference only|metadata-only|future-only|draft only|template|redacted|none|pending|required|prohibited|warning|missing|not_applicable_no_evidence|evidence_required|access_not_verified|record only|triage only|plan only|classification only|contract only|not applied|not approved|not deployed|not remediated|not executed|not changed|not created|not fetched|not verified|not an active migration|denied|deny|denial|raw-table denial|sketch|future prompt|future migration|future executable|future approved|review-only)\b/i.test(line)
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
const prompt26EFilesToScan = [...new Set(requiredDocs)]

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

const migrationPromptMarkers = listFiles('supabase/migrations')
  .filter((file) => file.endsWith('.sql'))
  .filter((file) => file !== 'supabase/migrations/202606060001_rls_no_policy_advisor_remediation.sql')
  .flatMap((file) => {
    const text = readFile(file)
    if (/Prompt 26E|rls_no_policy_draft_migration_plan_created|activation_artifacts_select_backend_only/i.test(text)) {
      return [finding(file, 'activeMigrationPrompt26ERisk', 1, 'Prompt 26E marker found in active migration path')]
    }
    return []
  })

const executableDraftSqlFiles = listFiles('docs/draft-sql/supabase-advisor-remediation')
  .filter((file) => file.endsWith('.sql'))
  .map((file) => finding(file, 'executableDraftSqlRisk', 1, 'Executable .sql file under draft remediation docs'))

const draftLabelFindings = []
const draftText = readFile('docs/draft-sql/supabase-advisor-remediation/rls-no-policy-draft.sql.md')
for (const label of ['DRAFT ONLY — DO NOT EXECUTE', 'NOT AN ACTIVE MIGRATION', 'not validated', 'not applied to Supabase', 'requires future prompt']) {
  if (!draftText.includes(label)) {
    draftLabelFindings.push(finding('docs/draft-sql/supabase-advisor-remediation/rls-no-policy-draft.sql.md', 'missingDraftWarningLabel', 1, label))
  }
}

const findings = [
  ...missingFiles,
  ...missingTerms,
  ...draftLabelFindings,
  ...migrationPromptMarkers,
  ...executableDraftSqlFiles,
  ...scanPatterns(filesToScan, rawSecretPatterns, 'secretRisk', { redact: true }),
  ...scanPatterns(prompt26EFilesToScan, unsafeClaimPatterns, 'unsafeClaim'),
  ...scanPatterns(prompt26EFilesToScan, unsafeCommandPatterns, 'unsafeCommand'),
  ...scanProjectRefs(filesToScan),
]

const summary = {
  status: findings.length === 0 ? 'passed' : 'failed',
  draftMigrationPlanCreated: exists('docs/supabase-rls-no-policy-draft-migration-plan.md'),
  policyNamingContractCreated: exists('docs/supabase-rls-no-policy-policy-naming-contract.md'),
  dependencyMatrixCreated: exists('docs/supabase-rls-no-policy-policy-dependency-matrix.md'),
  futureTestMatrixCreated: exists('docs/supabase-rls-no-policy-future-test-matrix.md'),
  rollbackCleanupPlanCreated: exists('docs/supabase-rls-no-policy-rollback-cleanup-plan.md'),
  stagingEvidenceRequirementsCreated: exists('docs/supabase-rls-no-policy-staging-evidence-requirements.md'),
  draftSqlMarkdownUpdated: exists('docs/draft-sql/supabase-advisor-remediation/rls-no-policy-draft.sql.md') && draftText.includes('DRAFT ONLY — DO NOT EXECUTE'),
  activeMigrationPrompt26ERisk: migrationPromptMarkers.length > 0,
  executableDraftSqlFilesFound: executableDraftSqlFiles.length,
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  googleCloudApiTouched: false,
  secretManagerApiTouched: false,
  nextRecommendedPrompt: 'Prompt 26E-1 - RLS No-Policy Local Draft Migration Implementation',
  findings,
}

console.log(JSON.stringify(summary, null, 2))

if (findings.length > 0) {
  process.exit(1)
}
