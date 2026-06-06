import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const requiredDocs = [
  'docs/supabase-function-search-path-migration-plan.md',
  'docs/supabase-function-search-path-signature-preservation-contract.md',
  'docs/supabase-function-search-path-schema-qualification-checklist.md',
  'docs/supabase-function-search-path-future-test-matrix.md',
  'docs/supabase-function-search-path-rollback-cleanup-plan.md',
  'docs/supabase-function-search-path-staging-evidence-requirements.md',
  'docs/draft-sql/supabase-advisor-remediation/function-search-path-draft.sql.md',
  'docs/prompt-26f-validation-results.md',
  'docs/implementation-prompts/prompt-26f-function-search-path-hardening-migration-plan.md',
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
  'docs/supabase-function-search-path-hardening-plan.md',
  'docs/supabase-function-search-path-draft-remediation-packet.md',
  'docs/supabase-advisor-hardening-priority-matrix.md',
  'package.json',
  'scripts/validation/run-foundation-validation.mjs',
  '.github/workflows/foundation-validation.yml',
]

const functionNames = [
  'can_claim_worker_job',
  'can_start_generation',
  'prevent_approved_plan_snapshot_immutable_update',
  'can_run_job',
  'can_create_approved_plan_snapshot',
  'active_worker_claim_exists',
  'e2e_jsonb_has_secret_like_content',
  'e2e_assert_safe_json',
  'e2e_json_contains_secret_marker',
]

const requiredTerms = {
  'docs/supabase-function-search-path-migration-plan.md': [
    'Function search path migration plan status: `function_search_path_migration_plan_created`.',
    'Supabase update required: docs/status only.',
    'Supabase update status: docs_only.',
    'Supabase environment touched: none.',
    'SQL executed: none.',
    'Migration deployed: no.',
    'Active migration files changed: no.',
    'Production capability enabled: none; function search_path hardening migration plan only.',
    'Prompt 26F-1 - Function Search Path Local Migration Candidate',
    'Prompt 26G - SECURITY DEFINER Exposure Migration Plan',
    ...functionNames.map((name) => `\`${name}\``),
  ],
  'docs/supabase-function-search-path-signature-preservation-contract.md': [
    'Contract status: `signature_preservation_planned`.',
    'Prompt 20N already showed',
    ...functionNames.map((name) => `\`${name}\``),
  ],
  'docs/supabase-function-search-path-schema-qualification-checklist.md': [
    'Checklist status: `schema_qualification_planned`.',
    'Prefer fixed empty search path plus fully qualified references.',
    ...functionNames.map((name) => name),
  ],
  'docs/supabase-function-search-path-future-test-matrix.md': [
    'Future test matrix status: `future_tests_planned`.',
    'SQL executed: none.',
    'Migration deployed: no.',
    ...functionNames.map((name) => `\`${name}\``),
  ],
  'docs/supabase-function-search-path-rollback-cleanup-plan.md': [
    'Rollback plan status: `rollback_requirements_defined`.',
    'SQL executed: none.',
    'Migration deployed: no.',
    ...functionNames.map((name) => `\`${name}\``),
  ],
  'docs/supabase-function-search-path-staging-evidence-requirements.md': [
    'Staging evidence status: `evidence_required`.',
    'Prompt 23 state on this base: `pending_human_approval`.',
    'SQL executed: none.',
    'Migration deployed: no.',
  ],
  'docs/draft-sql/supabase-advisor-remediation/function-search-path-draft.sql.md': [
    'DRAFT ONLY — DO NOT EXECUTE',
    'NOT AN ACTIVE MIGRATION',
    'not validated',
    'not applied to Supabase',
    'requires future prompt',
    ...functionNames,
  ],
  'docs/prompt-26f-validation-results.md': [
    'Function search path migration plan status: `function_search_path_migration_plan_created`.',
    'Supabase update status: docs_only.',
    'Supabase environment touched: none.',
    'SQL executed: none.',
    'Migration deployed: no.',
    'Active migration files changed: no.',
    'Production capability enabled: none; function search_path hardening migration plan only.',
  ],
  'docs/implementation-prompts/prompt-26f-function-search-path-hardening-migration-plan.md': [
    'Prompt 26F - Function Search Path Hardening Migration Plan',
    'Production capability enabled: none; function search_path hardening migration plan only',
  ],
}

const trackerTerms = {
  'PRODUCTION_FOUNDATION_STATUS.md': ['Function Search Path Hardening Migration Plan', 'docs/supabase-function-search-path-migration-plan.md'],
  'docs/source-of-truth-map.md': ['Function search_path hardening migration plan', 'docs/supabase-function-search-path-migration-plan.md'],
  'docs/production-milestone-plan.md': ['Prompt 26F - Function Search Path Hardening Migration Plan'],
  'docs/implementation-prompts/README.md': ['26F', 'Function Search Path Hardening Migration Plan'],
  'docs/beta-readiness-scorecard.md': ['Prompt 26F function search_path hardening migration plan'],
  'docs/production-beta-blocker-inventory.md': ['Prompt 26F creates the function search_path hardening migration plan'],
  'docs/supabase-milestone-sync-matrix.md': ['26F', 'function_search_path_migration_plan_created'],
  'docs/supabase-advisor-hardening-prompt-sequence.md': ['Prompt 26F', 'function search_path hardening migration plan'],
  'docs/supabase-function-search-path-hardening-plan.md': ['Prompt 26F Decision', 'function_search_path_migration_plan_created'],
  'docs/supabase-function-search-path-draft-remediation-packet.md': ['Prompt 26F Planning Files', 'function_search_path_migration_plan_created'],
  'docs/supabase-advisor-hardening-priority-matrix.md': ['Prompt 26F', 'Prompt 26F-1'],
  'package.json': ['supabase:function-search-path:migration-plan:diagnostics'],
  'scripts/validation/run-foundation-validation.mjs': ['supabase_function_search_path_migration_plan_diagnostics'],
  '.github/workflows/foundation-validation.yml': ['codex/rp-foundation-26e3-local-rls-candidate-toolchain-schema-follow-up'],
}

const redactedProjectRef = 'wmyy****ishd'

const rawProjectRefPatterns = [/\b[a-z0-9]{20}\b/g]

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
  /\bfunction (altered|changed|updated|deployed|executed|remediated|fixed)\b/i,
  /\bfunction search_path (remediated|fixed|applied|validated)\b/i,
  /\bactive migration (created|added|changed|deployed)\b/i,
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
  return /\b(no|not|never|forbid|forbidden|blocked|must not|do not|does not|did not|without|placeholder|reference only|metadata-only|future-only|draft only|template|redacted|none|pending|required|prohibited|warning|missing|not_applicable_no_evidence|evidence_required|access_not_verified|record only|triage only|plan only|planning only|classification only|contract only|not applied|not approved|not deployed|not remediated|not executed|not changed|not created|not fetched|not verified|not an active migration|sketch|future prompt|future migration|future candidate|future executable|future approved|review-only|preserve|candidate only|requirements defined|planned)\b/i.test(line)
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
      if (line.includes(redactedProjectRef) || isSafeContext(line)) return
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
const prompt26FFilesToScan = [...new Set(requiredDocs)]

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

const activeMigrationPromptMarkers = listFiles('supabase/migrations')
  .filter((file) => file.endsWith('.sql'))
  .flatMap((file) => {
    const text = readFile(file)
    if (/Prompt 26F|function_search_path_migration_plan_created|Function Search Path Hardening Migration Plan/i.test(text)) {
      return [finding(file, 'activeMigrationPrompt26FRisk', 1, 'Prompt 26F marker found in active migration path')]
    }
    return []
  })

const executableDraftSqlFiles = listFiles('docs/draft-sql/supabase-advisor-remediation')
  .filter((file) => file.endsWith('.sql'))
  .map((file) => finding(file, 'executableDraftSqlRisk', 1, 'Executable .sql file under draft remediation docs'))

const draftLabelFindings = []
const draftText = readFile('docs/draft-sql/supabase-advisor-remediation/function-search-path-draft.sql.md')
for (const label of ['DRAFT ONLY — DO NOT EXECUTE', 'NOT AN ACTIVE MIGRATION', 'not validated', 'not applied to Supabase', 'requires future prompt']) {
  if (!draftText.includes(label)) {
    draftLabelFindings.push(finding('docs/draft-sql/supabase-advisor-remediation/function-search-path-draft.sql.md', 'missingDraftWarningLabel', 1, label))
  }
}

const findings = [
  ...missingFiles,
  ...missingTerms,
  ...draftLabelFindings,
  ...activeMigrationPromptMarkers,
  ...executableDraftSqlFiles,
  ...scanPatterns(filesToScan, rawSecretPatterns, 'secretRisk', { redact: true }),
  ...scanPatterns(prompt26FFilesToScan, unsafeClaimPatterns, 'unsafeClaim'),
  ...scanPatterns(prompt26FFilesToScan, unsafeCommandPatterns, 'unsafeCommand'),
  ...scanProjectRefs(filesToScan),
]

const summary = {
  status: findings.length === 0 ? 'passed' : 'failed',
  functionSearchPathPlanStatus: 'function_search_path_migration_plan_created',
  functionsCovered: functionNames.length,
  signaturePreservationContractCreated: exists('docs/supabase-function-search-path-signature-preservation-contract.md'),
  schemaQualificationChecklistCreated: exists('docs/supabase-function-search-path-schema-qualification-checklist.md'),
  futureTestMatrixCreated: exists('docs/supabase-function-search-path-future-test-matrix.md'),
  rollbackCleanupPlanCreated: exists('docs/supabase-function-search-path-rollback-cleanup-plan.md'),
  stagingEvidenceRequirementsCreated: exists('docs/supabase-function-search-path-staging-evidence-requirements.md'),
  draftSqlMarkdownUpdated: exists('docs/draft-sql/supabase-advisor-remediation/function-search-path-draft.sql.md') && draftText.includes('DRAFT ONLY — DO NOT EXECUTE'),
  activeMigrationPrompt26FRisk: activeMigrationPromptMarkers.length > 0,
  executableDraftSqlFilesFound: executableDraftSqlFiles.length,
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  googleCloudApiTouched: false,
  secretManagerApiTouched: false,
  nextRecommendedPrompt: 'Prompt 26F-1 - Function Search Path Local Migration Candidate or Prompt 26G - SECURITY DEFINER Exposure Migration Plan',
  findings,
}

console.log(JSON.stringify(summary, null, 2))

if (findings.length > 0) {
  process.exit(1)
}
