import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const requiredDocs = [
  'docs/supabase-security-definer-exposure-migration-plan.md',
  'docs/supabase-security-definer-function-classification.md',
  'docs/supabase-security-definer-grant-review-contract.md',
  'docs/supabase-security-definer-invoker-decision-contract.md',
  'docs/supabase-security-definer-future-test-matrix.md',
  'docs/supabase-security-definer-rollback-cleanup-plan.md',
  'docs/supabase-security-definer-staging-evidence-requirements.md',
  'docs/draft-sql/supabase-advisor-remediation/security-definer-grants-draft.sql.md',
  'docs/prompt-26g-validation-results.md',
  'docs/implementation-prompts/prompt-26g-security-definer-exposure-migration-plan.md',
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
  'docs/supabase-security-definer-hardening-plan.md',
  'docs/supabase-security-definer-draft-remediation-packet.md',
  'docs/supabase-advisor-hardening-priority-matrix.md',
  'package.json',
  'scripts/validation/run-foundation-validation.mjs',
  '.github/workflows/foundation-validation.yml',
]

const functionNames = [
  'has_workspace_role',
  'is_workspace_owner_or_admin',
  'is_workspace_owner_record',
  'set_updated_at',
  'can_export_render',
  'is_project_editor',
  'is_project_member',
]

const requiredLabels = [
  'DRAFT ONLY — DO NOT EXECUTE',
  'NOT AN ACTIVE MIGRATION',
  'not validated',
  'not applied to Supabase',
  'requires future prompt',
]

const requiredDocTerms = {
  'docs/supabase-security-definer-exposure-migration-plan.md': [
    'SECURITY DEFINER exposure migration plan status: `security_definer_exposure_migration_plan_created`.',
    'Supabase update required: docs/status only.',
    'Supabase update status: docs_only.',
    'Supabase environment touched: none.',
    'SQL executed: none.',
    'Migration deployed: no.',
    'Grant/revoke executed: no.',
    'Function altered: no.',
    'Active migration files changed: no.',
    'Production capability enabled: none; SECURITY DEFINER exposure migration plan only.',
    'Prompt 26G-1 - SECURITY DEFINER Local Migration Candidate',
    'Prompt 26H - FK Index Hardening Migration Plan',
  ],
  'docs/supabase-security-definer-function-classification.md': [
    'Classification status: `security_definer_function_classification_planned`.',
    '`authenticated_only`',
    '`private_schema_candidate`',
    '`needs_human_review`',
    '`no_anon_direct_execute`',
    '`service_role_backend_only`',
  ],
  'docs/supabase-security-definer-grant-review-contract.md': [
    'Grant review contract status: `security_definer_grant_review_planned`.',
    'Grant/revoke executed: no.',
  ],
  'docs/supabase-security-definer-invoker-decision-contract.md': [
    'Invoker decision contract status: `security_definer_invoker_decision_planned`.',
    'Function altered: no.',
  ],
  'docs/supabase-security-definer-future-test-matrix.md': [
    'Future test matrix status: `security_definer_future_tests_planned`.',
    'Local SQL run: no.',
    'Staging SQL run: no.',
  ],
  'docs/supabase-security-definer-rollback-cleanup-plan.md': [
    'Rollback plan status: `security_definer_rollback_requirements_defined`.',
    'Rollback executed: no.',
    'Cleanup executed: no.',
  ],
  'docs/supabase-security-definer-staging-evidence-requirements.md': [
    'Staging evidence status: `evidence_required`.',
    'Prompt 23 state on this base: `pending_human_approval`.',
    'Production readiness approved: no.',
  ],
  'docs/draft-sql/supabase-advisor-remediation/security-definer-grants-draft.sql.md': requiredLabels,
  'docs/prompt-26g-validation-results.md': [
    'SECURITY DEFINER exposure migration plan status: `security_definer_exposure_migration_plan_created`.',
    'Supabase update status: docs_only.',
    'Supabase environment touched: none.',
    'SQL executed: none.',
    'Migration deployed: no.',
    'Grant/revoke executed: no.',
    'Function altered: no.',
    'Active migration files changed: no.',
    'Google Cloud API touched: false.',
    'Secret Manager API touched: false.',
    'Production capability enabled: none; SECURITY DEFINER exposure migration plan only.',
  ],
  'docs/implementation-prompts/prompt-26g-security-definer-exposure-migration-plan.md': [
    'Prompt 26G - SECURITY DEFINER Exposure Migration Plan',
    'Production capability enabled: none; SECURITY DEFINER exposure migration plan only',
  ],
}

const trackerTerms = {
  'PRODUCTION_FOUNDATION_STATUS.md': [
    'SECURITY DEFINER Exposure Migration Plan',
    'docs/supabase-security-definer-exposure-migration-plan.md',
    'security_definer_exposure_migration_plan_created',
  ],
  'docs/source-of-truth-map.md': [
    'SECURITY DEFINER exposure migration plan',
    'docs/supabase-security-definer-exposure-migration-plan.md',
  ],
  'docs/production-milestone-plan.md': [
    'Prompt 26G - SECURITY DEFINER Exposure Migration Plan',
    'security_definer_exposure_migration_plan_created',
  ],
  'docs/implementation-prompts/README.md': [
    '26G',
    'SECURITY DEFINER Exposure Migration Plan',
  ],
  'docs/beta-readiness-scorecard.md': [
    'Prompt 26G SECURITY DEFINER exposure migration plan',
  ],
  'docs/production-beta-blocker-inventory.md': [
    'Prompt 26G records `security_definer_exposure_migration_plan_created`',
  ],
  'docs/supabase-milestone-sync-matrix.md': [
    '26G',
    'security_definer_exposure_migration_plan_created',
  ],
  'docs/supabase-advisor-hardening-prompt-sequence.md': [
    'Prompt 26G',
    'security_definer_exposure_migration_plan_created',
  ],
  'docs/supabase-security-definer-hardening-plan.md': [
    'Prompt 26G Decision',
    'security_definer_exposure_migration_plan_created',
  ],
  'docs/supabase-security-definer-draft-remediation-packet.md': [
    'Prompt 26G Planning Files',
    'security_definer_exposure_migration_plan_created',
  ],
  'docs/supabase-advisor-hardening-priority-matrix.md': [
    'Prompt 26G',
    'Prompt 26G-1',
  ],
  'package.json': [
    'supabase:security-definer:migration-plan:diagnostics',
  ],
  'scripts/validation/run-foundation-validation.mjs': [
    'supabase_security_definer_migration_plan_diagnostics',
  ],
  '.github/workflows/foundation-validation.yml': [
    'codex/rp-foundation-26f-function-search-path-hardening-migration-plan',
  ],
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
  /\bSECURITY DEFINER (remediated|fixed|applied|validated|deployed|resolved)\b/i,
  /\badvisor findings? (resolved|remediated|fixed|cleared|applied)\b/i,
  /\badvisor remediation (applied|executed|completed|validated)\b/i,
  /\b(grant|revoke|grant\/revoke|execute grant|execute grants?) (executed|applied|changed|updated|deployed|completed)\b/i,
  /\bfunction (altered|changed|updated|deployed|executed|remediated|fixed)\b/i,
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
  /\bGrant\/revoke executed:\s*(?!no\b)/i,
  /\bFunction altered:\s*(?!no\b)/i,
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
  return /\b(no|not|never|forbid|forbidden|blocked|must not|do not|does not|did not|without|placeholder|reference only|metadata-only|future-only|draft only|template|redacted|none|pending|required|prohibited|warning|missing|not_applicable_no_evidence|evidence_required|access_not_verified|record only|triage only|plan only|planning only|classification only|contract only|not applied|not approved|not deployed|not remediated|not executed|not changed|not created|not fetched|not verified|not an active migration|sketch|future prompt|future migration|future candidate|future executable|future approved|review-only|preserve|candidate only|requirements defined|planned|recommended next prompt|validation result|local-only|sanitized localhost|local validation|local supabase|toolchain|environment-blocked|manual setup|non-mutating|allowing local|deliverables after prompt)\b/i.test(line)
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

const missingFiles = [...requiredDocs, ...trackerFiles]
  .filter((file) => !exists(file))
  .map((file) => finding(file, 'missingFile', 1, file))

const missingTerms = []
for (const [file, terms] of Object.entries(requiredDocTerms)) {
  const text = readFile(file)
  for (const term of terms) {
    if (!text.includes(term)) {
      missingTerms.push(finding(file, 'missingRequiredTerm', 1, term))
    }
  }
}

for (const file of requiredDocs) {
  const text = readFile(file)
  for (const functionName of functionNames) {
    if (!text.includes(functionName)) {
      missingTerms.push(finding(file, 'missingFunctionCoverage', 1, functionName))
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

const activeMigrationMarkerFindings = listFiles('supabase/migrations')
  .filter((file) => file.endsWith('.sql'))
  .flatMap((file) =>
    readFile(file).split('\n').flatMap((line, index) => {
      if (/Prompt 26G|security_definer_exposure_migration_plan_created|SECURITY DEFINER Exposure Migration Plan/i.test(line)) {
        return [finding(file, 'activeMigrationPrompt26GMarker', index + 1, line)]
      }
      return []
    }),
  )

const executableRemediationSqlFindings = listFiles('docs/draft-sql/supabase-advisor-remediation')
  .filter((file) => file.includes('security-definer') && file.endsWith('.sql'))
  .map((file) => finding(file, 'executableRemediationSqlFile', 1, file))

const unsafeFindings = [
  ...scanPatterns(filesToScan, rawSecretPatterns, 'secretRisk', { redact: true }),
  ...scanPatterns(filesToScan, unsafeClaimPatterns, 'unsafeClaim'),
  ...scanPatterns(filesToScan, unsafeCommandPatterns, 'unsafeCommand'),
  ...scanProjectRefs(filesToScan),
]

const findings = [
  ...missingFiles,
  ...missingTerms,
  ...activeMigrationMarkerFindings,
  ...executableRemediationSqlFindings,
  ...unsafeFindings,
]

const result = {
  status: findings.length === 0 ? 'passed' : 'failed',
  securityDefinerPlanStatus: 'security_definer_exposure_migration_plan_created',
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  grantRevokeExecuted: 'no',
  functionAltered: 'no',
  activeMigrationFilesChanged: 'no',
  googleCloudApiTouched: false,
  secretManagerApiTouched: false,
  functionsCovered: functionNames.length,
  requiredDocsChecked: requiredDocs.length,
  trackerFilesChecked: trackerFiles.length,
  nextRecommendedPrompt: 'Prompt 26G-1 - SECURITY DEFINER Local Migration Candidate or Prompt 26H - FK Index Hardening Migration Plan',
  findings,
}

console.log(JSON.stringify(result, null, 2))

if (findings.length > 0) {
  process.exitCode = 1
}
