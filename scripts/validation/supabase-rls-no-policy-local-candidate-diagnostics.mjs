import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const migrationFile = 'supabase/migrations/202606060001_rls_no_policy_advisor_remediation.sql'
const localTestFile = 'database/test-sql/local/002_rls_no_policy_advisor_tables_local.sql'

const noPolicyTables = [
  'activation_artifacts',
  'activation_qa_gates',
  'activation_runs',
  'feature_gates',
  'readiness_snapshots',
  'tool_capabilities',
]

const policyNames = {
  activation_artifacts: [
    'activation_artifacts_select_backend_only',
    'activation_artifacts_insert_backend_only',
    'activation_artifacts_update_backend_only',
    'activation_artifacts_delete_backend_only',
  ],
  activation_qa_gates: [
    'activation_qa_gates_select_backend_only',
    'activation_qa_gates_insert_backend_only',
    'activation_qa_gates_update_backend_only',
    'activation_qa_gates_delete_backend_only',
  ],
  activation_runs: [
    'activation_runs_select_backend_only',
    'activation_runs_insert_backend_only',
    'activation_runs_update_backend_only',
    'activation_runs_delete_backend_only',
  ],
  feature_gates: [
    'feature_gates_select_no_client_access',
    'feature_gates_insert_backend_only',
    'feature_gates_update_backend_only',
    'feature_gates_delete_backend_only',
  ],
  readiness_snapshots: [
    'readiness_snapshots_select_backend_only',
    'readiness_snapshots_insert_backend_only',
    'readiness_snapshots_update_backend_only',
    'readiness_snapshots_delete_backend_only',
  ],
  tool_capabilities: [
    'tool_capabilities_select_no_client_access',
    'tool_capabilities_insert_backend_only',
    'tool_capabilities_update_backend_only',
    'tool_capabilities_delete_backend_only',
  ],
}

const requiredDocs = [
  'docs/prompt-26e1-rls-no-policy-local-migration-candidate.md',
  'docs/prompt-26e1-validation-results.md',
  'docs/implementation-prompts/prompt-26e1-rls-no-policy-local-migration-candidate.md',
  migrationFile,
  localTestFile,
]

const trackerFiles = [
  'PRODUCTION_FOUNDATION_STATUS.md',
  'docs/source-of-truth-map.md',
  'docs/production-milestone-plan.md',
  'docs/implementation-prompts/README.md',
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/supabase-milestone-sync-matrix.md',
  'docs/supabase-rls-no-policy-draft-migration-plan.md',
  'docs/supabase-rls-no-policy-policy-naming-contract.md',
  'docs/supabase-rls-no-policy-policy-dependency-matrix.md',
  'docs/supabase-rls-no-policy-future-test-matrix.md',
  'docs/supabase-rls-no-policy-rollback-cleanup-plan.md',
  'docs/supabase-rls-no-policy-staging-evidence-requirements.md',
  'docs/supabase-advisor-hardening-prompt-sequence.md',
  'docs/supabase-advisor-hardening-priority-matrix.md',
  'docs/supabase-rls-no-policy-draft-remediation-packet.md',
  'database/test-sql/local/README.md',
  'package.json',
  'scripts/validation/run-foundation-validation.mjs',
  '.github/workflows/foundation-validation.yml',
]

const requiredDocTerms = {
  'docs/prompt-26e1-rls-no-policy-local-migration-candidate.md': [
    'Prompt 26E-1 - RLS No-Policy Local Migration Candidate',
    'Local candidate status: `local_candidate_prepared`.',
    'Supabase update status: local_candidate_prepared.',
    'Production capability enabled: none; local RLS policy candidate only.',
    migrationFile,
    localTestFile,
    ...noPolicyTables.map((table) => `\`${table}\``),
  ],
  'docs/prompt-26e1-validation-results.md': [
    'Capability enabled: none; local RLS policy candidate only.',
    'Supabase update status: local_candidate_prepared.',
    'SQL executed: none.',
    'Migration deployed: no.',
    migrationFile,
    localTestFile,
  ],
  'docs/implementation-prompts/prompt-26e1-rls-no-policy-local-migration-candidate.md': [
    'Prompt 26E-1 - RLS No-Policy Local Migration Candidate',
    'Exact capability enabled: none; local RLS policy candidate only.',
  ],
}

const trackerTerms = {
  'PRODUCTION_FOUNDATION_STATUS.md': ['RLS No-Policy Local Migration Candidate', migrationFile, localTestFile],
  'docs/source-of-truth-map.md': ['RLS no-policy local migration candidate', migrationFile, localTestFile],
  'docs/production-milestone-plan.md': ['Prompt 26E-1 - RLS No-Policy Local Migration Candidate'],
  'docs/implementation-prompts/README.md': ['26E-1', 'RLS No-Policy Local Migration Candidate'],
  'docs/beta-readiness-scorecard.md': ['Prompt 26E-1 RLS no-policy local migration candidate'],
  'docs/production-beta-blocker-inventory.md': ['Prompt 26E-1 prepares the local RLS no-policy candidate'],
  'docs/supabase-milestone-sync-matrix.md': ['26E-1', 'local_candidate_prepared'],
  'docs/supabase-rls-no-policy-draft-migration-plan.md': ['Prompt 26E-1 local candidate update', migrationFile],
  'docs/supabase-rls-no-policy-policy-naming-contract.md': ['Prompt 26E-1 local candidate update', 'Explicit deny policy names prepared as local candidate'],
  'docs/supabase-rls-no-policy-policy-dependency-matrix.md': ['Prompt 26E-1 local candidate update', 'local_candidate_prepared'],
  'docs/supabase-rls-no-policy-future-test-matrix.md': ['002_rls_no_policy_advisor_tables_local.sql', 'catalog-only local candidate'],
  'docs/supabase-rls-no-policy-rollback-cleanup-plan.md': ['Prompt 26E-1 local candidate rollback note', 'drop policy if exists'],
  'docs/supabase-rls-no-policy-staging-evidence-requirements.md': ['Prompt 26E-1 staging evidence addendum', 'local candidate is not staging evidence'],
  'docs/supabase-advisor-hardening-prompt-sequence.md': ['Prompt 26E-1', 'local migration candidate'],
  'docs/supabase-advisor-hardening-priority-matrix.md': ['Prompt 26E-1', 'local_candidate_prepared'],
  'docs/supabase-rls-no-policy-draft-remediation-packet.md': ['Prompt 26E-1 local candidate outcome', 'local_candidate_prepared'],
  'database/test-sql/local/README.md': ['002_rls_no_policy_advisor_tables_local.sql', 'Prompt 26E-1'],
  'package.json': ['supabase:rls-no-policy:local-candidate:diagnostics'],
  'scripts/validation/run-foundation-validation.mjs': ['supabase_rls_no_policy_local_candidate_diagnostics'],
  '.github/workflows/foundation-validation.yml': ['codex/rp-foundation-26e-rls-no-policy-draft-migration-plan'],
}

const redactedProjectRef = 'wmyy****ishd'

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
  /\bapplied_to_staging\b/i,
  /\bapplied_to_production\b/i,
  /\bvalidated_in_staging\b/i,
  /\bstaging (supabase|sql|rls|migration).{0,100}\b(ran|executed|passed|completed|validated|approved|applied)\b/i,
  /\bproduction (supabase|sql|readiness|beta).{0,100}\b(ran|executed|passed|completed|validated|approved|ready|unlocked)\b/i,
  /\bGoogle Cloud API touched:\s*yes\b/i,
  /\bSecret Manager API touched:\s*yes\b/i,
  /\bSecret Manager (metadata|values?|payloads?) (fetched|read|printed|retrieved|verified|accessed)\b/i,
  /\bSQL executed:\s*(?!none\b)/i,
  /\bMigration deployed:\s*yes\b/i,
  /\b(beta|production).{0,40}\bunlocked\b/i,
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
  return /\b(no|not|never|forbid|forbidden|blocked|must not|do not|does not|did not|without|placeholder|reference only|metadata-only|future-only|draft only|candidate only|local candidate|template|redacted|none|pending|required|prohibited|warning|missing|not_applicable_no_evidence|evidence_required|access_not_verified|record only|triage only|plan only|classification only|contract only|not applied|not approved|not deployed|not executed|not changed|not fetched|not verified|denied|deny|denial|using \(false\)|with check \(false\)|skip|skipped|rollback|catalog-only|not browser-safe)\b/i.test(line)
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
  const projectRefPattern = /\b[a-z0-9]{20}\b/g
  for (const file of files) {
    readFile(file).split('\n').forEach((line, index) => {
      if (line.includes(redactedProjectRef)) return
      const matches = line.match(projectRefPattern) || []
      for (const match of matches) {
        if (/^[0-9]+$/.test(match)) continue
        findings.push(finding(file, 'rawProjectRefRisk', index + 1, `[redacted project-ref-like token length=${match.length}]`))
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
const promptFilesToScan = [...new Set([
  ...requiredDocs,
  'package.json',
  'scripts/validation/run-foundation-validation.mjs',
  '.github/workflows/foundation-validation.yml',
])]
const migrationText = readFile(migrationFile)
const localTestText = readFile(localTestFile)

const missingFiles = [...requiredDocs, ...trackerFiles]
  .filter((file) => !exists(file))
  .map((file) => finding(file, 'missingFile', 1, file))

const missingTerms = []
for (const [file, terms] of Object.entries(requiredDocTerms)) {
  const text = readFile(file)
  for (const term of terms) {
    if (!text.includes(term)) missingTerms.push(finding(file, 'missingRequiredTerm', 1, term))
  }
}
for (const [file, terms] of Object.entries(trackerTerms)) {
  const text = readFile(file)
  for (const term of terms) {
    if (!text.includes(term)) missingTerms.push(finding(file, 'missingTrackerTerm', 1, term))
  }
}

const missingTables = noPolicyTables
  .filter((table) => !migrationText.includes(table) || !localTestText.includes(table))
  .map((table) => finding(`${migrationFile}, ${localTestFile}`, 'missingTargetTable', 1, table))

const expectedPolicyNames = Object.values(policyNames).flat()
const missingPolicies = expectedPolicyNames
  .filter((policyName) => !migrationText.includes(policyName) || !localTestText.includes(policyName))
  .map((policyName) => finding(`${migrationFile}, ${localTestFile}`, 'missingExpectedPolicy', 1, policyName))

const expectedTableSet = new Set(noPolicyTables)
const staticPolicyTargets = [...migrationText.matchAll(/\bon\s+public\.([a-z0-9_]+)/gi)]
  .map((match) => match[1])
const unexpectedPolicyTargets = staticPolicyTargets
  .filter((table) => !expectedTableSet.has(table))
  .map((table) => finding(migrationFile, 'unexpectedPolicyTarget', 1, table))

const riskyMigrationTerms = []
const migrationRiskChecks = [
  { kind: 'grantRisk', pattern: /\bgrant\b/i },
  { kind: 'publicRoleRisk', pattern: /\bto\s+public\b/i },
  { kind: 'positiveAccessRisk', pattern: /\busing\s*\(\s*true\s*\)|\bwith\s+check\s*\(\s*true\s*\)/i },
  { kind: 'forceRlsRisk', pattern: /\bforce\s+row\s+level\s+security\b/i },
  { kind: 'serviceRolePolicyRisk', pattern: /\bto\s+service_role\b/i },
  { kind: 'helperFunctionRisk', pattern: /\bcreate\s+(or\s+replace\s+)?function\b/i },
  { kind: 'indexRisk', pattern: /\bcreate\s+index\b/i },
  { kind: 'tableDefinitionRisk', pattern: /\bcreate\s+table\b/i },
]
for (const { kind, pattern } of migrationRiskChecks) {
  migrationText.split('\n').forEach((line, index) => {
    if (pattern.test(line)) riskyMigrationTerms.push(finding(migrationFile, kind, index + 1, line))
  })
}

const localTestFixtureMutationRisks = []
localTestText.split('\n').forEach((line, index) => {
  if (/^\s*(insert|update|delete|truncate)\b/i.test(line)) {
    localTestFixtureMutationRisks.push(finding(localTestFile, 'localTestFixtureMutationRisk', index + 1, line))
  }
})

const migrationFiles = listFiles('supabase/migrations').filter((file) => file.endsWith('.sql'))
const candidateMigrationFiles = migrationFiles.filter((file) => file.includes('rls_no_policy_advisor_remediation'))
const unexpectedCandidateMigrationFiles = candidateMigrationFiles
  .filter((file) => file !== migrationFile)
  .map((file) => finding(file, 'unexpectedCandidateMigrationFile', 1, file))

const unsafeFindings = [
  ...scanPatterns(filesToScan, rawSecretPatterns, 'secretPatternRisk', { redact: true }),
  ...scanPatterns(filesToScan, unsafeClaimPatterns, 'unsafeClaimRisk'),
  ...scanPatterns(promptFilesToScan, unsafeCommandPatterns, 'unsafeCommandRisk'),
  ...scanProjectRefs(filesToScan),
]

const findings = [
  ...missingFiles,
  ...missingTerms,
  ...missingTables,
  ...missingPolicies,
  ...unexpectedPolicyTargets,
  ...riskyMigrationTerms,
  ...localTestFixtureMutationRisks,
  ...unexpectedCandidateMigrationFiles,
  ...unsafeFindings,
]

const summary = {
  status: findings.length === 0 ? 'passed' : 'failed',
  migrationCandidateExists: exists(migrationFile),
  localTestCandidateExists: exists(localTestFile),
  tablesTargeted: noPolicyTables,
  policyCount: expectedPolicyNames.filter((policyName) => migrationText.includes(policyName)).length,
  onlyExpectedTablesTargeted: unexpectedPolicyTargets.length === 0 && missingTables.length === 0,
  publicWritePolicyRisk: /\bto\s+public\b/i.test(migrationText) || /\busing\s*\(\s*true\s*\)|\bwith\s+check\s*\(\s*true\s*\)/i.test(migrationText),
  broadAnonPolicyRisk: /\bto\s+anon\b/i.test(migrationText) && /\busing\s*\(\s*true\s*\)|\bwith\s+check\s*\(\s*true\s*\)/i.test(migrationText),
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  nextRecommendedPrompt: 'Prompt 26E-2 - RLS No-Policy Local Candidate Validation Fix, or Prompt 26F - Function Search Path Hardening Migration Plan',
  findings,
}

console.log(JSON.stringify(summary, null, 2))

if (findings.length > 0) {
  process.exit(1)
}
