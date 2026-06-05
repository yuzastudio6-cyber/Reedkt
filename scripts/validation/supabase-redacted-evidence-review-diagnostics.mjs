import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const requiredDocs = [
  'docs/supabase-redacted-evidence-review.md',
  'docs/supabase-readonly-audit-evidence-matrix.md',
  'docs/supabase-read-only-audit-result-template.md',
  'docs/prompt-24b-validation-results.md',
  'docs/implementation-prompts/prompt-24b-supabase-redacted-evidence-review.md',
]

const priorDocs = [
  'docs/supabase-project-read-only-audit.md',
  'docs/supabase-readonly-audit-evidence-intake.md',
  'docs/supabase-readonly-audit-redaction-rules.md',
  'docs/gcp-secret-manager-supabase-reference-contract.md',
  'docs/gcp-secret-manager-supabase-secret-matrix.md',
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
  /checklist/i,
  /redaction/i,
  /rules/i,
  /matrix/i,
  /request/i,
  /template/i,
  /policy/i,
  /runbook/i,
]

const evidenceCategories = [
  'Project identity',
  'Project access',
  'Database migrations',
  'Database schema',
  'RLS policies',
  'Storage buckets',
  'Storage policies',
  'Auth settings',
  'Edge functions',
  'Logs/activity',
  'Milestone sync state',
  'Secret Manager reference metadata only',
]

const requiredTermsByFile = {
  'docs/supabase-redacted-evidence-review.md': [
    'Evidence review status: `evidence_required`.',
    'Audit status: `evidence_required`.',
    'Redaction status: `not_applicable_no_evidence`.',
    'Unsafe evidence detected: no.',
    'Secret Manager metadata fetched: no.',
    'Secret Manager value fetched: no.',
    'Supabase environment touched: none.',
    'SQL executed: none.',
    '`README.md`, checklist, matrix, request, template, policy, runbook, and redaction-rule files are instruction files.',
  ],
  'docs/supabase-readonly-audit-evidence-matrix.md': [
    'Current evidence status: `evidence_required`.',
    'Current redaction status: `not_applicable_no_evidence`.',
    'Current audit status: `evidence_required`.',
    '| Project identity | yes | `docs/supabase-readonly-audit-evidence/project-identity-redacted.md` | yes | `missing`',
    '| Secret Manager reference metadata only | yes | `docs/supabase-readonly-audit-evidence/gcp-secret-manager-reference-metadata-redacted.md` | yes | `missing`',
    'Do not mark this matrix `accepted`, `ready_for_staging_inventory_review`, or complete',
  ],
  'docs/supabase-read-only-audit-result-template.md': [
    '## Prompt 24B Redacted Evidence Review Result',
    'Evidence review status: `evidence_required`',
    'Unsafe evidence detected: no',
    'Audit state: `evidence_required`',
  ],
  'docs/prompt-24b-validation-results.md': [
    'Evidence status: `evidence_required`.',
    'Redaction status: `not_applicable_no_evidence`.',
    'Audit status: `evidence_required`.',
    'Google Cloud API touched: no.',
    'Secret Manager metadata fetched: no.',
    'Supabase environment touched: none.',
    'SQL ran: none.',
  ],
}

const trackerRequiredTerms = {
  'PRODUCTION_FOUNDATION_STATUS.md': ['Supabase Redacted Evidence Review', 'docs/supabase-redacted-evidence-review.md'],
  'docs/source-of-truth-map.md': ['Supabase redacted evidence review', 'docs/supabase-redacted-evidence-review.md'],
  'docs/production-milestone-plan.md': ['Prompt 24B - Supabase Redacted Evidence Review'],
  'docs/implementation-prompts/README.md': ['24B', 'Supabase Redacted Evidence Review'],
  'docs/beta-readiness-scorecard.md': ['Prompt 24B redacted evidence review'],
  'docs/production-beta-blocker-inventory.md': ['Prompt 24B redacted evidence review'],
  'docs/supabase-milestone-sync-matrix.md': ['24B', 'evidence_required'],
  'package.json': ['supabase:redacted-evidence:review:diagnostics'],
  'scripts/validation/run-foundation-validation.mjs': ['supabase_redacted_evidence_review_diagnostics'],
}

const forbiddenSecretPatterns = [
  /SUPABASE_SERVICE_ROLE_KEY\s*=/i,
  /SUPABASE_ANON_KEY\s*=/i,
  /JWT_SECRET\s*=/i,
  /DATABASE_URL\s*=\s*postgres(?:ql)?:\/\//i,
  /POSTGRES_PASSWORD\s*=/i,
  /STRIPE_SECRET_KEY\s*=/i,
  /OPENAI_API_KEY\s*=/i,
  /PROVIDER_API_KEY\s*=/i,
  /service[_-]?role[_-]?key\s*[:=]/i,
  /provider[_-]?api[_-]?key\s*[:=]/i,
  /stripe[_-]?secret[_-]?key\s*[:=]/i,
  /jwt[_-]?secret\s*[:=]/i,
  /password\s*[:=]\s*['"`][^'"`\s]{8,}/i,
  /signedUrl\s*[:=]\s*['"`]https?:\/\//i,
  /signed_url\s*[:=]\s*['"`]https?:\/\//i,
  /https?:\/\/[^/\s]+\/storage\/v1\/object\/sign\//i,
  /postgres(?:ql)?:\/\/[^@\s]+@/i,
]

const forbiddenStateClaims = [
  /\bevidence (review )?status:\s*(partially_reviewed|ready_for_staging_inventory_review|accepted|complete|passed)\b/i,
  /\bredaction status:\s*(accepted|passed)\b/i,
  /\baudit (status|state):\s*(partially_reviewed|ready_for_staging_inventory_review|complete|passed)\b/i,
  /\b(staging|remote|production) (audit|inventory|supabase|rls).{0,80}\b(completed|passed|validated|approved|ready)\b/i,
  /\bSecret Manager (metadata|values?|payloads?) (fetched|read|printed|retrieved|verified|accessed)\b/i,
  /\bSQL (ran|executed|passed|completed)\b/i,
  /\bSQL executed:\s*(?!none\b)/i,
  /\bSQL ran:\s*(?!none\b)/i,
  /\bSupabase environment touched:\s*(?!none\b)/i,
  /\bMigration deployed:\s*yes\b/i,
  /\b(beta|production).{0,40}\bunlocked\b/i,
  /\bhuman approval (granted|approved)\b/i,
  /\bstaging execution approved:\s*yes\b/i,
]

const forbiddenCommandClaims = [
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
  if (!fileExists(relativePath)) return ''
  return fs.readFileSync(resolvePath(relativePath), 'utf8')
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
  return /\b(no|not|never|forbid|forbidden|blocked|must not|do not|does not|did not|without|placeholder|reference only|future-only|template|redacted|none|pending|required|prohibited|warning|missing|not_applicable_no_evidence|evidence_required|access_not_verified|instruction file|accepted evidence categories: none|unsafe evidence detected: no)\b/i.test(line)
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

const missingFiles = [...requiredDocs, ...priorDocs, ...trackerFiles]
  .filter((file) => !fileExists(file))
  .map((file) => finding(file, 'requiredFileMissing', 1, 'Required Prompt 24B file is missing.'))

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

const matrixText = readFile('docs/supabase-readonly-audit-evidence-matrix.md')
function hasMissingCategoryRow(category) {
  const escapedCategory = category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`\\|\\s*${escapedCategory}\\s*\\|\\s*yes\\s*\\|[^\\n]*\\|\\s*\\\`missing\\\``, 'i').test(matrixText)
}

const missingCategoryRows = evidenceCategories
  .filter((category) => !hasMissingCategoryRow(category))
  .map((category) => finding('docs/supabase-readonly-audit-evidence-matrix.md', 'missingEvidenceCategory', 1, category))

const packageText = readFile('package.json')
const runnerText = readFile('scripts/validation/run-foundation-validation.mjs')
const evidenceIntakeIndex = runnerText.indexOf('supabase_project_readonly_evidence_intake_diagnostics')
const redactedReviewIndex = runnerText.indexOf('supabase_redacted_evidence_review_diagnostics')

const behaviorChecks = {
  packageScriptRegistered: /"supabase:redacted-evidence:review:diagnostics":\s*"node scripts\/validation\/supabase-redacted-evidence-review-diagnostics\.mjs"/.test(packageText),
  diagnosticsInFoundationRunner: /supabase:redacted-evidence:review:diagnostics/.test(runnerText),
  diagnosticsAfterEvidenceIntake: evidenceIntakeIndex >= 0 && redactedReviewIndex > evidenceIntakeIndex,
  countedEvidenceFilesAbsent: evidenceFiles.length === 0,
  instructionOnlyReadmePresent: instructionFiles.includes('docs/supabase-readonly-audit-evidence/README.md'),
}

const behaviorFailures = Object.entries(behaviorChecks)
  .filter(([, ok]) => !ok)
  .map(([check]) => finding('scripts/validation/supabase-redacted-evidence-review-diagnostics.mjs', check, 1, `Behavior check failed: ${check}`))

const docsToScan = [...new Set([...requiredDocs, ...priorDocs, ...trackerFiles])].filter(fileExists)
const newDocsToScan = requiredDocs.filter(fileExists)
const evidenceFilesToScan = evidencePathFiles.filter(fileExists)
const filesToScan = [...new Set([...docsToScan, ...evidenceFilesToScan])]
const commandFilesToScan = [...new Set([...newDocsToScan, ...evidenceFilesToScan])]

const rawSecretFindings = scanPatterns(filesToScan, forbiddenSecretPatterns, 'rawSecretRisk', { redact: true })
const unsafeStateFindings = scanPatterns(filesToScan, forbiddenStateClaims, 'unsafeStateClaim')
const unsafeCommandFindings = scanPatterns(commandFilesToScan, forbiddenCommandClaims, 'unsafeCommand')

const failures = [
  ...missingFiles,
  ...missingTerms,
  ...missingCategoryRows,
  ...behaviorFailures,
  ...rawSecretFindings,
  ...unsafeStateFindings,
  ...unsafeCommandFindings,
]

const summary = {
  status: failures.length === 0 ? 'passed' : 'failed',
  capabilityEnabled: 'none; Supabase redacted evidence review only',
  evidencePathsChecked: allowedEvidenceDirs,
  instructionFilesFound: instructionFiles,
  countedEvidenceFilesFound: evidenceFiles,
  evidenceStatus: 'evidence_required',
  redactionStatus: 'not_applicable_no_evidence',
  auditStatus: 'evidence_required',
  unsafeEvidenceDetected: false,
  googleCloudApiTouched: false,
  secretManagerApiTouched: false,
  secretManagerMetadataFetched: false,
  secretManagerValuesFetched: false,
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  humanApprovalGranted: false,
  stagingExecutionApproved: false,
  failures,
}

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exit(1)
}
