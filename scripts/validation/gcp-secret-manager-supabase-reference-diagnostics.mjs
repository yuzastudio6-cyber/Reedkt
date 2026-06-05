import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const requiredDocs = [
  'docs/gcp-secret-manager-supabase-reference-contract.md',
  'docs/gcp-secret-manager-supabase-secret-matrix.md',
  'docs/gcp-secret-manager-supabase-access-policy.md',
  'docs/gcp-secret-manager-supabase-command-placeholder-policy.md',
  'docs/prompt-25a-validation-results.md',
  'docs/implementation-prompts/prompt-25a-gcp-secret-manager-supabase-reference-contract.md',
]

const updatedDocs = [
  'docs/staging-supabase-rls-dry-run-command-packet.md',
  'docs/staging-supabase-command-safety-checklist.md',
  'docs/staging-supabase-future-command-templates.md',
  'docs/supabase-redacted-evidence-template.md',
  'docs/supabase-readonly-audit-redaction-rules.md',
]

const trackerFiles = [
  'PRODUCTION_FOUNDATION_STATUS.md',
  'docs/source-of-truth-map.md',
  'docs/production-milestone-plan.md',
  'docs/implementation-prompts/README.md',
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/supabase-milestone-sync-matrix.md',
  'package.json',
  'scripts/validation/run-foundation-validation.mjs',
]

const requiredTermsByFile = {
  'docs/gcp-secret-manager-supabase-reference-contract.md': [
    'Capability enabled: none; GCP Secret Manager Supabase reference contract only.',
    'Supabase update required: docs/status only.',
    'Supabase update status: docs_only.',
    'Supabase environment touched: none.',
    'SQL executed: none.',
    'Prompt 23A records conditional staging-only approval, but Secret Manager reference and evidence gates remain required.',
    'All staging and production Supabase values must be handled as Secret Manager references, not copied values.',
    'Future approved discovery may confirm whether expected Secret Manager entries exist by listing redacted metadata only.',
    'Secret values may be used only by a future approved runtime or manual operator flow that keeps payloads outside Codex and outside tracked repo artifacts.',
  ],
  'docs/gcp-secret-manager-supabase-secret-matrix.md': [
    'GCP_SECRET_REF_SUPABASE_STAGING_PROJECT_REF',
    'GCP_SECRET_REF_SUPABASE_STAGING_DB_URL',
    'GCP_SECRET_REF_SUPABASE_STAGING_ANON_KEY',
    'GCP_SECRET_REF_SUPABASE_STAGING_SERVICE_ROLE_KEY',
    'GCP_SECRET_REF_SUPABASE_STAGING_JWT_SECRET',
    'GCP_SECRET_REF_SUPABASE_STAGING_STORAGE_ENDPOINT',
    'GCP_SECRET_REF_SUPABASE_PRODUCTION_PROJECT_REF',
    'GCP_SECRET_REF_SUPABASE_PRODUCTION_DB_URL',
    'GCP_SECRET_REF_SUPABASE_PRODUCTION_ANON_KEY',
    'GCP_SECRET_REF_SUPABASE_PRODUCTION_SERVICE_ROLE_KEY',
    'GCP_SECRET_REF_SUPABASE_PRODUCTION_JWT_SECRET',
    'GCP_SECRET_REF_SUPABASE_PRODUCTION_STORAGE_ENDPOINT',
    '`reference_required`; `access_not_verified`',
    'Metadata discovery means reference existence only. It does not mean payload access or value verification.',
  ],
  'docs/gcp-secret-manager-supabase-access-policy.md': [
    'Least-Privilege',
    'Service-role and JWT references must never be frontend-visible.',
    'Prompt 25A records none of these as approved.',
    'Future metadata-only discovery can verify that expected references exist without revealing payloads.',
  ],
  'docs/gcp-secret-manager-supabase-command-placeholder-policy.md': [
    '<GCP_SECRET_REF_SUPABASE_STAGING_DB_URL>',
    '${GCP_SECRET_REF_SUPABASE_STAGING_DB_URL}',
    'DO NOT RUN UNTIL HUMAN APPROVAL RECORD EXISTS.',
    'Prompt 25A does not add executable secret-fetch commands.',
    'The allowed future operation category is reference presence review, not value retrieval.',
  ],
  'docs/prompt-25a-validation-results.md': [
    'Capability enabled: none; GCP Secret Manager Supabase reference contract only.',
    'Google Cloud API touched: no.',
    'Secret Manager values fetched: no.',
    'Secret Manager metadata fetched: no.',
    'Supabase environment touched: none.',
    'SQL ran: none.',
  ],
  'docs/implementation-prompts/prompt-25a-gcp-secret-manager-supabase-reference-contract.md': [
    'Exact capability enabled: none; GCP Secret Manager Supabase reference contract only.',
    'PR title: `[foundation] Prompt 25A GCP Secret Manager Supabase reference contract`',
  ],
  'docs/staging-supabase-rls-dry-run-command-packet.md': [
    '<GCP_SECRET_REF_SUPABASE_STAGING_DB_URL>',
    'Prompt 25A requires future staging command packets to use GCP Secret Manager reference placeholders',
  ],
  'docs/staging-supabase-future-command-templates.md': [
    '<GCP_SECRET_REF_SUPABASE_STAGING_DB_URL>',
    'DO NOT RUN UNTIL HUMAN APPROVAL RECORD EXISTS.',
    'Future Secret Reference Presence Review Packet',
  ],
}

const trackerTerms = {
  'PRODUCTION_FOUNDATION_STATUS.md': ['GCP Secret Manager Supabase Reference Contract', 'docs/gcp-secret-manager-supabase-reference-contract.md'],
  'docs/source-of-truth-map.md': ['GCP Secret Manager Supabase references', 'docs/gcp-secret-manager-supabase-secret-matrix.md'],
  'docs/production-milestone-plan.md': ['Prompt 25A - GCP Secret Manager Supabase Reference Contract'],
  'docs/implementation-prompts/README.md': ['25A', 'GCP Secret Manager Supabase Reference Contract'],
  'docs/beta-readiness-scorecard.md': ['Prompt 25A adds the GCP Secret Manager reference contract'],
  'docs/production-beta-blocker-inventory.md': ['Secret Manager Supabase references'],
  'docs/supabase-milestone-sync-matrix.md': ['25A', 'GCP Secret Manager reference contract'],
  'package.json': ['gcp:supabase:secret-refs:diagnostics'],
  'scripts/validation/run-foundation-validation.mjs': ['gcp_supabase_secret_refs_diagnostics'],
}

const filesToScan = [...new Set([...requiredDocs, ...updatedDocs, ...trackerFiles])]
const commandFilesToScan = [...new Set([...requiredDocs, ...updatedDocs])]

const rawSecretPatterns = [
  /postgres(?:ql)?:\/\/[^@\s]+@/i,
  /\b(?:SUPABASE|POSTGRES|DATABASE|JWT|STRIPE|OPENAI|PROVIDER)_[A-Z0-9_]*(?:KEY|SECRET|PASSWORD|URL)\s*=\s*[^<\s][^\s]+/i,
  /\b(service[_-]?role[_-]?key|jwt[_-]?secret|provider[_-]?key|stripe[_-]?key|database[_-]?password)\s*[:=]\s*['"`]?[A-Za-z0-9_./+=-]{12,}/i,
  /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/,
  /https?:\/\/[^/\s]+\/storage\/v1\/object\/sign\//i,
]

const unsafeCommandPatterns = [
  /\bgcloud\s+secrets\s+versions\s+access\b/i,
  /\bsupabase\s+link\b/i,
  /\bsupabase\s+db\s+push\b/i,
  /\bsupabase\s+db\s+reset\b/i,
  /\bsupabase\s+migration\s+up\b/i,
  /\bpsql\b/i,
]

const unsafeClaimPatterns = [
  /\bstaging (supabase|sql|rls|migration).{0,100}\b(ran|executed|passed|completed|validated|approved|applied)\b/i,
  /\bproduction (supabase|sql|readiness|beta).{0,100}\b(ran|executed|passed|completed|validated|approved|ready|unlocked)\b/i,
  /\bSecret Manager values? (fetched|read|printed|retrieved|verified)\b/i,
  /\bSecret Manager payloads? (fetched|read|printed|retrieved|verified|accessed)\b/i,
  /\bsecret versions? (accessed|read|fetched|printed|retrieved)\b/i,
  /\bGoogle Cloud API touched:\s*yes\b/i,
  /\bSecret Manager API touched:\s*yes\b/i,
  /\bSQL (ran|executed|passed|completed)\b/i,
  /\bSQL executed:\s*(?!none\b)/i,
  /\bSupabase environment touched:\s*(?!none\b)/i,
  /\bMigration deployed:\s*yes\b/i,
  /\b(beta|production).{0,40}\bunlocked\b/i,
  /\bhuman approval (granted|approved)\b/i,
]

function resolvePath(relativePath) {
  return path.join(root, relativePath)
}

function readFile(relativePath) {
  return fs.existsSync(resolvePath(relativePath))
    ? fs.readFileSync(resolvePath(relativePath), 'utf8')
    : ''
}

function compact(value) {
  return String(value).replace(/\s+/g, ' ').slice(0, 240)
}

function finding(file, kind, line, excerpt) {
  return { file, kind, line, excerpt: compact(excerpt) }
}

function isSafeContext(line) {
  return /\b(no|not|never|forbid|forbidden|blocked|must not|do not|does not|did not|without|placeholder|reference only|future-only|template|redacted|none|pending|required|prohibited|warning|partially_reviewed_connected_metadata|connected metadata|conditional approval|approved_for_staging_validation_when_gates_pass|conditional_approval_recorded|gates remain required)\b/i.test(line)
}

function scanPatterns(files, patterns, kind, { redact = false } = {}) {
  const findings = []
  for (const file of files) {
    const text = readFile(file)
    text.split('\n').forEach((line, index) => {
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

const missingFiles = [...requiredDocs, ...updatedDocs, ...trackerFiles].filter((file) => !fs.existsSync(resolvePath(file)))

const missingTerms = []
for (const [file, terms] of Object.entries(requiredTermsByFile)) {
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

const rawSecretFindings = scanPatterns(filesToScan, rawSecretPatterns, 'rawSecretRisk', { redact: true })
const unsafeCommandFindings = scanPatterns(commandFilesToScan, unsafeCommandPatterns, 'unsafeCommand')
const unsafeClaimFindings = scanPatterns(filesToScan, unsafeClaimPatterns, 'unsafeStateClaim')

const failures = [
  ...missingFiles.map((file) => finding(file, 'missingFile', 1, file)),
  ...missingTerms,
  ...rawSecretFindings,
  ...unsafeCommandFindings,
  ...unsafeClaimFindings,
]

const summary = {
  status: failures.length === 0 ? 'passed' : 'failed',
  capabilityEnabled: 'none; GCP Secret Manager Supabase reference contract only',
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  googleCloudApiTouched: false,
  secretManagerApiTouched: false,
  secretManagerMetadataFetched: false,
  secretManagerValuesFetched: false,
  metadataOnlyDiscoveryDocumented: true,
  humanApprovalGranted: false,
  stagingExecutionApproved: false,
  requiredDocsChecked: requiredDocs.length,
  updatedDocsChecked: updatedDocs.length,
  trackerFilesChecked: trackerFiles.length,
  failures,
}

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exit(1)
}
