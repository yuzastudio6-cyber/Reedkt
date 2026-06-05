import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const requiredDocs = [
  'docs/supabase-rls-no-policy-table-classification.md',
  'docs/supabase-rls-no-policy-access-model-contract.md',
  'docs/supabase-rls-no-policy-table-policy-contract.md',
  'docs/supabase-rls-no-policy-test-contract.md',
  'docs/supabase-rls-no-policy-handoff-notes.md',
  'docs/supabase-rls-no-policy-migration-readiness-checklist.md',
  'docs/prompt-26d-validation-results.md',
  'docs/implementation-prompts/prompt-26d-rls-no-policy-table-classification-contract.md',
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

const accessModels = [
  'backend_service_role_only',
  'workspace_member_read_backend_write',
  'project_member_read_backend_write',
  'admin_read_backend_write',
  'authenticated_self_scope',
  'no_client_access',
  'future_deprecated_blocked',
  'needs_human_review',
]

const requiredTerms = {
  'docs/supabase-rls-no-policy-table-classification.md': [
    'Classification status: `rls_no_policy_classification_contract_created`.',
    'Advisor hardening status: `rls_no_policy_classified`.',
    'Supabase update status: docs_only.',
    'Supabase environment touched: none.',
    'SQL executed: none.',
    'Migration deployed: no.',
    'Active migration files changed: no.',
    'Prompt 26E - RLS No-Policy Draft Migration Plan',
    ...noPolicyTables.map((table) => `\`${table}\``),
  ],
  'docs/supabase-rls-no-policy-access-model-contract.md': [
    'Access model contract status: `rls_no_policy_access_models_defined`.',
    ...accessModels.map((model) => `\`${model}\``),
  ],
  'docs/supabase-rls-no-policy-table-policy-contract.md': [
    'Table policy contract status: `rls_no_policy_table_policy_contract_created`.',
    'Advisor remediation applied: no.',
    'Active RLS policy migration created: no.',
    ...noPolicyTables.map((table) => `\`${table}\``),
  ],
  'docs/supabase-rls-no-policy-test-contract.md': [
    'Test contract status: `rls_no_policy_test_contract_created`.',
    'Executable SQL tests created: no.',
    ...noPolicyTables.map((table) => `\`${table}\``),
  ],
  'docs/supabase-rls-no-policy-handoff-notes.md': [
    'SUPABASE_RLS_STORAGE_DATABASE',
    'WORKER_RUNTIME_JOBS',
    'AI_TOOLS_CREATIVE_GRAPHICS',
    'OBSERVABILITY_AUDIT_COST',
    'FRONTEND_PRODUCT_UX',
  ],
  'docs/supabase-rls-no-policy-migration-readiness-checklist.md': [
    'Checklist status: `migration_readiness_checklist_created`.',
    'Classification reviewed: pending.',
    'Human approval before staging: missing.',
  ],
  'docs/prompt-26d-validation-results.md': [
    'Capability enabled: none; RLS no-policy classification contract only.',
    'Classification status: `rls_no_policy_classification_contract_created`.',
    'Active migration files changed: no.',
    'SQL executed: none.',
    'Migration deployed: no.',
  ],
  'docs/implementation-prompts/prompt-26d-rls-no-policy-table-classification-contract.md': [
    'Prompt 26D - RLS No-Policy Table Classification and Policy Contract',
    'Capability enabled: none; RLS no-policy classification contract only.',
  ],
}

const trackerTerms = {
  'PRODUCTION_FOUNDATION_STATUS.md': ['RLS No-Policy Table Classification and Policy Contract', 'docs/supabase-rls-no-policy-table-classification.md'],
  'docs/source-of-truth-map.md': ['RLS no-policy classification', 'docs/supabase-rls-no-policy-table-classification.md'],
  'docs/production-milestone-plan.md': ['Prompt 26D - RLS No-Policy Table Classification and Policy Contract'],
  'docs/implementation-prompts/README.md': ['26D', 'RLS No-Policy Table Classification and Policy Contract'],
  'docs/beta-readiness-scorecard.md': ['Prompt 26D RLS no-policy classification contract'],
  'docs/production-beta-blocker-inventory.md': ['Prompt 26D classifies the RLS no-policy tables'],
  'docs/supabase-milestone-sync-matrix.md': ['26D', 'rls_no_policy_classified'],
  'docs/supabase-advisor-hardening-prompt-sequence.md': ['Prompt 26D', 'RLS no-policy table classification'],
  'docs/supabase-rls-no-policy-draft-remediation-packet.md': ['Prompt 26D classification outcome', 'rls_no_policy_classified'],
  'docs/supabase-advisor-hardening-priority-matrix.md': ['Prompt 26D', 'Prompt 26E'],
  'package.json': ['supabase:rls-no-policy:classification:diagnostics'],
  'scripts/validation/run-foundation-validation.mjs': ['supabase_rls_no_policy_classification_diagnostics'],
  '.github/workflows/foundation-validation.yml': ['codex/rp-foundation-26c-supabase-advisor-draft-remediation-packet'],
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
  /\bRLS polic(?:y|ies) (created|applied|executed|deployed|validated)\b/i,
  /\bactive (migration|policy|RLS policy).{0,80}\b(created|added|changed|deployed|applied)\b/i,
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
  return /\b(no|not|never|forbid|forbidden|blocked|must not|do not|does not|did not|without|placeholder|reference only|metadata-only|future-only|draft only|candidate only|contract only|template|redacted|none|pending|required|prohibited|warning|missing|not_applicable_no_evidence|evidence_required|access_not_verified|record only|triage only|plan only|classification only|not applied|not approved|not deployed|not remediated|not executed|not changed|not created|not fetched|not verified|denied|deny|denial|raw-table denial)\b/i.test(line)
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
const migrationFiles = listFiles('supabase/migrations').filter((file) => file.endsWith('.sql'))

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

const classificationText = readFile('docs/supabase-rls-no-policy-table-classification.md')
const missingTableClassifications = noPolicyTables
  .filter((table) => !classificationText.includes(`\`${table}\``))
  .map((table) => finding('docs/supabase-rls-no-policy-table-classification.md', 'missingTableClassification', 1, table))

const activeMigrationPromptReferences = migrationFiles.flatMap((file) => {
  const findings = []
  readFile(file).split('\n').forEach((line, index) => {
    if (/Prompt 26D|rls_no_policy_classification|RLS No-Policy Table Classification/i.test(line)) {
      findings.push(finding(file, 'activeMigrationPrompt26DReference', index + 1, line))
    }
  })
  return findings
})

const failures = [
  ...missingFiles,
  ...missingTerms,
  ...missingTableClassifications,
  ...activeMigrationPromptReferences,
  ...scanProjectRefs(filesToScan),
  ...scanPatterns(filesToScan, rawSecretPatterns, 'rawSecretRisk', { redact: true }),
  ...scanPatterns(filesToScan, unsafeClaimPatterns, 'unsafeClaim'),
  ...scanPatterns(requiredDocs, unsafeCommandPatterns, 'unsafeCommand'),
]

const summary = {
  status: failures.length === 0 ? 'passed' : 'failed',
  capabilityEnabled: 'none; RLS no-policy classification contract only',
  classificationStatus: failures.length === 0 ? 'rls_no_policy_classification_contract_created' : 'blocked',
  advisorHardeningStatus: failures.length === 0 ? 'rls_no_policy_classified' : 'blocked',
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  activeMigrationFilesChanged: 'no',
  googleCloudApiTouched: false,
  secretManagerApiTouched: false,
  secretManagerMetadataFetched: false,
  secretManagerValuesFetched: false,
  stagingExecutionApproved: false,
  humanApprovalGranted: false,
  productionBetaUnlock: false,
  tablesClassified: noPolicyTables,
  requiredDocsChecked: requiredDocs.length,
  trackerFilesChecked: trackerFiles.length,
  nextRecommendedPrompt: failures.length === 0
    ? 'Prompt 26E - RLS No-Policy Draft Migration Plan'
    : 'Prompt 26D-A - RLS No-Policy Classification Diagnostics Repair',
  failures,
}

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
