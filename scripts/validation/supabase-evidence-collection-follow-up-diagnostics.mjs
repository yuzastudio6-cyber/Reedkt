import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const requiredDocs = [
  'docs/supabase-evidence-collection-follow-up.md',
  'docs/supabase-evidence-file-template-index.md',
  'docs/gcp-secret-manager-reference-metadata-evidence-guide.md',
  'docs/supabase-dashboard-screenshot-redaction-guide.md',
  'docs/prompt-24c-validation-results.md',
  'docs/implementation-prompts/prompt-24c-supabase-evidence-collection-follow-up.md',
]

const requiredTemplates = [
  'docs/supabase-readonly-audit-evidence/templates/project-identity-redacted.template.md',
  'docs/supabase-readonly-audit-evidence/templates/gcp-secret-manager-reference-metadata-redacted.template.md',
  'docs/supabase-readonly-audit-evidence/templates/database-migrations-redacted.template.md',
  'docs/supabase-readonly-audit-evidence/templates/database-schema-redacted.template.md',
  'docs/supabase-readonly-audit-evidence/templates/rls-policies-redacted.template.md',
  'docs/supabase-readonly-audit-evidence/templates/storage-buckets-redacted.template.md',
  'docs/supabase-readonly-audit-evidence/templates/auth-settings-redacted.template.md',
  'docs/supabase-readonly-audit-evidence/templates/edge-functions-redacted.template.md',
  'docs/supabase-readonly-audit-evidence/templates/activity-summary-redacted.template.md',
  'docs/supabase-readonly-audit-evidence/templates/milestone-sync-state-redacted.template.md',
]

const requiredUpdatedDocs = [
  'docs/supabase-readonly-audit-evidence-matrix.md',
  'docs/supabase-readonly-audit-evidence-request.md',
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

const allowedEvidenceDirs = [
  'docs/evidence',
  'docs/supabase-evidence',
  'docs/redacted-evidence',
  'docs/supabase-readonly-audit-evidence',
  'docs/supabase-read-only-audit-evidence',
]

const instructionFilePatterns = [
  /(^|\/)README\.md$/i,
  /(^|\/)templates\//i,
  /checklist/i,
  /redaction/i,
  /rules/i,
  /matrix/i,
  /request/i,
  /template/i,
  /policy/i,
  /runbook/i,
  /guide/i,
]

const requiredTermsByFile = {
  'docs/supabase-evidence-collection-follow-up.md': [
    'Evidence status: `evidence_required`.',
    'Audit status: `evidence_required`.',
    'Redaction status: `not_applicable_no_evidence`.',
    'Google Cloud API touched: no.',
    'Secret Manager metadata fetched: no.',
    'Supabase environment touched: none.',
    'SQL executed: none.',
    'Prompt 24D - Supabase Evidence Review With Supplied Files',
  ],
  'docs/supabase-evidence-file-template-index.md': [
    'Actual evidence files found: no counted evidence files.',
    '`project-identity-redacted.md`',
    '`gcp-secret-manager-reference-metadata-redacted.md`',
    '`milestone-sync-state-redacted.md`',
  ],
  'docs/gcp-secret-manager-reference-metadata-evidence-guide.md': [
    'Secret Manager values must not be fetched',
    'referenceName: GCP_SECRET_REF_SUPABASE_STAGING_DB_URL',
    'payloadViewed: no',
  ],
  'docs/supabase-dashboard-screenshot-redaction-guide.md': [
    'API settings page with keys visible',
    'Connection string page',
    'Secret Manager payload page',
  ],
  'docs/supabase-readonly-audit-evidence-matrix.md': [
    'Template files created: yes',
    '| Project identity | yes | `docs/supabase-readonly-audit-evidence/project-identity-redacted.md` | yes | `missing`',
    '| Secret Manager reference metadata only | yes | `docs/supabase-readonly-audit-evidence/gcp-secret-manager-reference-metadata-redacted.md` | yes | `missing`',
  ],
  'docs/supabase-readonly-audit-evidence-request.md': [
    '`project-identity-redacted.md`',
    '`gcp-secret-manager-reference-metadata-redacted.md`',
    'Do not fetch, paste, screenshot, or summarize Secret Manager payloads or values.',
    'Template files are instruction files only.',
  ],
  'docs/prompt-24c-validation-results.md': [
    'Actual evidence files found: no counted evidence files.',
    'Evidence status: `evidence_required`.',
    'Redaction status: `not_applicable_no_evidence`.',
    'Secret Manager values fetched: no.',
    'Supabase environment touched: none.',
    'SQL ran: none.',
  ],
}

const trackerRequiredTerms = {
  'PRODUCTION_FOUNDATION_STATUS.md': ['Supabase Evidence Collection Follow-Up', 'docs/supabase-evidence-collection-follow-up.md'],
  'docs/source-of-truth-map.md': ['Supabase evidence collection follow-up', 'docs/supabase-evidence-file-template-index.md'],
  'docs/production-milestone-plan.md': ['Prompt 24C - Supabase Evidence Collection Follow-Up'],
  'docs/implementation-prompts/README.md': ['24C', 'Supabase Evidence Collection Follow-Up'],
  'docs/beta-readiness-scorecard.md': ['Prompt 24C evidence collection follow-up'],
  'docs/production-beta-blocker-inventory.md': ['Prompt 24C evidence collection follow-up'],
  'docs/supabase-milestone-sync-matrix.md': ['24C', 'evidence_required'],
  'package.json': ['supabase:evidence:collection:diagnostics'],
  'scripts/validation/run-foundation-validation.mjs': ['supabase_evidence_collection_follow_up_diagnostics'],
}

const rawSecretPatterns = [
  /SUPABASE_SERVICE_ROLE_KEY\s*=/i,
  /SUPABASE_ANON_KEY\s*=/i,
  /JWT_SECRET\s*=/i,
  /DATABASE_URL\s*=\s*postgres(?:ql)?:\/\//i,
  /POSTGRES_PASSWORD\s*=/i,
  /STRIPE_SECRET_KEY\s*=/i,
  /OPENAI_API_KEY\s*=/i,
  /PROVIDER_API_KEY\s*=/i,
  /service[_-]?role[_-]?key\s*[:=]\s*['"`]?[A-Za-z0-9_./+=-]{12,}/i,
  /provider[_-]?key\s*[:=]\s*['"`]?[A-Za-z0-9_./+=-]{12,}/i,
  /stripe[_-]?key\s*[:=]\s*['"`]?[A-Za-z0-9_./+=-]{12,}/i,
  /jwt[_-]?secret\s*[:=]\s*['"`]?[A-Za-z0-9_./+=-]{12,}/i,
  /database[_-]?password\s*[:=]\s*['"`]?[A-Za-z0-9_./+=-]{8,}/i,
  /postgres(?:ql)?:\/\/[^@\s]+@/i,
  /https?:\/\/[^/\s]+\/storage\/v1\/object\/sign\//i,
  /signedUrl\s*[:=]\s*['"`]https?:\/\//i,
  /signed_url\s*[:=]\s*['"`]https?:\/\//i,
]

const unsafeClaimPatterns = [
  /\bevidence status:\s*(partially_reviewed|ready_for_staging_inventory_review|accepted|complete|passed)\b/i,
  /\bredaction status:\s*(accepted|passed)\b/i,
  /\baudit status:\s*(partially_reviewed|ready_for_staging_inventory_review|complete|passed)\b/i,
  /\bSecret Manager (metadata|values?|payloads?) (fetched|read|printed|retrieved|verified|accessed)\b/i,
  /\bGoogle Cloud API touched:\s*yes\b/i,
  /\bSecret Manager API touched:\s*yes\b/i,
  /\bSQL (ran|executed|passed|completed)\b/i,
  /\bSQL executed:\s*(?!none\b)/i,
  /\bSQL ran:\s*(?!none\b)/i,
  /\bSupabase environment touched:\s*(?!none\b)/i,
  /\bMigration deployed:\s*yes\b/i,
  /\b(beta|production).{0,40}\bunlocked\b/i,
  /\bhuman approval (granted|approved)\b/i,
  /\bstaging execution approved:\s*yes\b/i,
]

const unsafeCommandPatterns = [
  /\bgcloud\s+secrets\b/i,
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

function fileExists(relativePath) {
  return fs.existsSync(resolvePath(relativePath))
}

function readFile(relativePath) {
  return fileExists(relativePath) ? fs.readFileSync(resolvePath(relativePath), 'utf8') : ''
}

function compact(value) {
  return String(value).replace(/\s+/g, ' ').slice(0, 260)
}

function finding(file, kind, line, excerpt) {
  return { file, kind, line, excerpt: compact(excerpt) }
}

function secretFinding(file, kind, line) {
  return finding(file, kind, line, '[redacted secret-risk pattern]')
}

function isSafeContext(line) {
  return /\b(no|not|never|forbid|forbidden|blocked|must not|do not|does not|did not|without|placeholder|reference only|metadata-only|future-only|template|redacted|none|pending|required|prohibited|warning|missing|not_applicable_no_evidence|evidence_required|access_not_verified|partially_reviewed_connected_metadata|connected metadata|instruction file|payloadViewed: no|payload viewed: no|Payloads excluded: yes|excluded: yes|Backfill executed: no|Staging sync applied: no)\b/i.test(line)
}

function walkFiles(relativeDir) {
  const absoluteDir = resolvePath(relativeDir)
  if (!fs.existsSync(absoluteDir)) return []
  const entries = fs.readdirSync(absoluteDir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    if (entry.name === '.DS_Store' || entry.name.startsWith('._')) continue
    const absoluteEntry = path.join(absoluteDir, entry.name)
    const relativeEntry = path.relative(root, absoluteEntry)
    if (entry.isDirectory()) {
      files.push(...walkFiles(relativeEntry))
    } else if (entry.isFile()) {
      files.push(relativeEntry)
    }
  }
  return files
}

function isInstructionFile(file) {
  return instructionFilePatterns.some((pattern) => pattern.test(file))
}

function scanPatterns(files, patterns, kind, options = {}) {
  const findings = []
  for (const file of files) {
    const lines = readFile(file).split('\n')
    lines.forEach((line, index) => {
      if (isSafeContext(line)) return
      for (const pattern of patterns) {
        if (pattern.test(line)) {
          findings.push(options.redact ? secretFinding(file, kind, index + 1) : finding(file, kind, index + 1, line))
        }
      }
    })
  }
  return findings
}

const missingFiles = [...requiredDocs, ...requiredTemplates, ...requiredUpdatedDocs, ...trackerFiles]
  .filter((file) => !fileExists(file))
  .map((file) => finding(file, 'requiredFileMissing', 1, 'Required Prompt 24C file is missing.'))

const missingTerms = []
for (const [file, terms] of Object.entries(requiredTermsByFile)) {
  const text = readFile(file)
  for (const term of terms) {
    if (!text.includes(term)) {
      missingTerms.push(finding(file, 'missingRequiredTerm', 1, `Missing required text: ${term}`))
    }
  }
}

for (const [file, terms] of Object.entries(trackerRequiredTerms)) {
  const text = readFile(file)
  for (const term of terms) {
    if (!text.includes(term)) {
      missingTerms.push(finding(file, 'missingTrackerTerm', 1, `Missing tracker text: ${term}`))
    }
  }
}

const evidencePathFiles = allowedEvidenceDirs.flatMap(walkFiles)
const evidenceFiles = evidencePathFiles.filter((file) => !isInstructionFile(file))
const instructionFiles = evidencePathFiles.filter(isInstructionFile)

const templateWarnings = requiredTemplates.filter((file) => !readFile(file).includes('DO NOT PASTE SECRETS.'))
  .map((file) => finding(file, 'missingTemplateWarning', 1, 'Template must include DO NOT PASTE SECRETS.'))

const scannedFiles = [
  ...requiredDocs,
  ...requiredTemplates,
  ...requiredUpdatedDocs,
  ...trackerFiles,
  ...evidencePathFiles,
].filter(fileExists)

const docsAndTemplates = [
  ...requiredDocs,
  ...requiredTemplates,
  ...requiredUpdatedDocs,
].filter(fileExists)

const rawSecretFindings = scanPatterns(scannedFiles, rawSecretPatterns, 'rawSecretRisk', { redact: true })
const unsafeClaimFindings = scanPatterns(scannedFiles, unsafeClaimPatterns, 'unsafeStateClaim')
const unsafeCommandFindings = scanPatterns(docsAndTemplates, unsafeCommandPatterns, 'unsafeCommandClaim')

const failures = [
  ...missingFiles,
  ...missingTerms,
  ...templateWarnings,
  ...rawSecretFindings,
  ...unsafeClaimFindings,
  ...unsafeCommandFindings,
]

const evidenceStatus = evidenceFiles.length === 0 ? 'evidence_required' : 'evidence_supplied_pending_review'
const redactionStatus = evidenceFiles.length === 0 ? 'not_applicable_no_evidence' : 'redaction_review_required'
const auditStatus = evidenceFiles.length === 0 ? 'evidence_required' : 'blocked_pending_redaction_review'

const summary = {
  status: failures.length === 0 ? 'passed' : 'failed',
  capabilityEnabled: 'none; Supabase evidence collection follow-up only',
  evidenceStatus,
  redactionStatus,
  auditStatus,
  templatesCreated: requiredTemplates.every(fileExists),
  templatesCreatedCount: requiredTemplates.filter(fileExists).length,
  actualEvidenceFilesFound: evidenceFiles.length > 0,
  actualEvidenceFilesFoundCount: evidenceFiles.length,
  instructionFilesFound: instructionFiles,
  googleCloudApiTouched: false,
  secretManagerApiTouched: false,
  secretManagerMetadataFetched: false,
  secretManagerValuesFetched: false,
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  humanApprovalGranted: false,
  stagingExecutionApproved: false,
  productionBetaUnlock: false,
  nextRecommendedPrompt: evidenceFiles.length === 0
    ? 'Prompt 24D - Supabase Evidence Review With Supplied Files after evidence is supplied; Prompt 23A still required before staging execution.'
    : 'Prompt 24D - Supabase Evidence Review With Supplied Files.',
  failures,
}

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exit(1)
}
