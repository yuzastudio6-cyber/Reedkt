import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const requiredDocs = [
  'docs/supabase-readonly-audit-evidence-intake.md',
  'docs/supabase-readonly-audit-evidence-checklist.md',
  'docs/supabase-readonly-audit-redaction-rules.md',
  'docs/supabase-readonly-audit-evidence-matrix.md',
  'docs/supabase-readonly-audit-evidence-request.md',
  'docs/supabase-readonly-audit-evidence/README.md',
  'docs/prompt-24a-validation-results.md',
  'docs/implementation-prompts/prompt-24a-supabase-project-readonly-audit-evidence-intake.md',
]

const requiredPriorDocs = [
  'docs/supabase-project-read-only-audit.md',
  'docs/supabase-read-only-audit-result-template.md',
  'docs/prompt-24-validation-results.md',
  'docs/supabase-milestone-sync-matrix.md',
  'docs/staging-supabase-human-decision-state.md',
  'docs/local-supabase-rls-evidence.md',
]

const trackingFiles = [
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

const requiredTermsByFile = {
  'docs/supabase-readonly-audit-evidence-intake.md': [
    'Current evidence status: `evidence_required`.',
    'Current redaction status: `not_applicable_no_evidence`.',
    'Current audit status: `evidence_required`.',
    '`README.md`, policy docs, checklists, templates, and matrix docs are instructions only.',
    'Repository inspection found no tracked evidence files under the allowed evidence paths.',
  ],
  'docs/supabase-readonly-audit-evidence-checklist.md': [
    'Current intake state: `evidence_required`.',
    'Evidence supplied: no.',
    'Redaction status: `not_applicable_no_evidence`.',
  ],
  'docs/supabase-readonly-audit-redaction-rules.md': [
    'service-role keys',
    'database passwords',
    'signed URLs',
    'raw row data',
    'If any supplied evidence includes secret-like material',
  ],
  'docs/supabase-readonly-audit-evidence-matrix.md': [
    'Current evidence status: `evidence_required`.',
    'Current redaction status: `not_applicable_no_evidence`.',
    'Current audit status: `evidence_required`.',
    '| Project identity | yes | none supplied | `missing`',
    'Do not mark this matrix `accepted`, `ready_for_staging_inventory_review`, or complete',
  ],
  'docs/supabase-readonly-audit-evidence-request.md': [
    'No redacted evidence files are currently present',
    'The audit state remains `evidence_required`.',
  ],
  'docs/supabase-readonly-audit-evidence/README.md': [
    'This README is an instruction file only and must not be counted as evidence.',
    'Prompt 24A does not create them.',
  ],
  'docs/prompt-24a-validation-results.md': [
    'Evidence status: `evidence_required`.',
    'Redaction status: `not_applicable_no_evidence`.',
    'Audit status: `evidence_required`.',
  ],
}

const trackerRequiredTerms = {
  'PRODUCTION_FOUNDATION_STATUS.md': ['Supabase Read-Only Audit Evidence Intake', 'docs/supabase-readonly-audit-evidence-intake.md'],
  'docs/source-of-truth-map.md': ['Supabase read-only audit evidence intake', 'docs/supabase-readonly-audit-evidence-matrix.md'],
  'docs/production-milestone-plan.md': ['Prompt 24A - Supabase Project Read-Only Audit Evidence Intake'],
  'docs/implementation-prompts/README.md': ['24A', 'Supabase Project Read-Only Audit Evidence Intake'],
  'docs/beta-readiness-scorecard.md': ['Prompt 24A evidence intake'],
  'docs/production-beta-blocker-inventory.md': ['Prompt 24A evidence intake'],
  'docs/supabase-milestone-sync-matrix.md': ['24A', 'evidence_required'],
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
  /\bevidence status:\s*(accepted|complete|ready_for_staging_inventory_review)\b/i,
  /\bredaction status:\s*(accepted|passed)\b/i,
  /\baudit status:\s*(partially_reviewed|ready_for_staging_inventory_review|complete|passed)\b/i,
  /\b(staging|remote|production) (audit|inventory|supabase|rls).{0,80}\b(completed|passed|validated|approved|ready)\b/i,
  /\bSQL (ran|executed|passed|completed)\b/i,
  /\bSupabase (was )?(mutated|updated|changed|linked)\b/i,
  /productionBetaUnlocked\s*[:=]\s*true/i,
  /betaUnlocked\s*[:=]\s*true/i,
  /canProceedToProduction\s*[:=]\s*true/i,
  /\bbackfill (ran|executed|completed)\b/i,
]

const forbiddenCommandClaims = [
  /\bsupabase link\b/i,
  /\bsupabase db push\b/i,
  /\bsupabase db reset\b/i,
  /\bsupabase migration up\b/i,
  /\bpsql\b.{0,80}\b(staging|production|remote|postgres(?:ql)?:\/\/)\b/i,
  /\bdeploy(ment|ed)?\b.{0,80}\b(staging|production|remote)\b/i,
]

function filePath(relativePath) {
  return path.join(root, relativePath)
}

function fileExists(relativePath) {
  return fs.existsSync(filePath(relativePath))
}

function readFile(relativePath) {
  if (!fileExists(relativePath)) return ''
  return fs.readFileSync(filePath(relativePath), 'utf8')
}

function finding(file, pattern, excerpt, line = 1) {
  return {
    file,
    line,
    pattern,
    excerpt: String(excerpt).replace(/\s+/g, ' ').slice(0, 260),
  }
}

function secretFinding(file, pattern, line = 1) {
  return finding(file, pattern, '[redacted secret-risk pattern]', line)
}

function isProhibitionLine(line) {
  return /\b(do not|must not|forbid|forbidden|blocked|never|no|not|without|prohibited|does not|did not|none|false|redact|remove|evidence_required|not_applicable_no_evidence|pending_human_approval|missing)\b/i.test(line)
}

function isVocabularyLine(line) {
  return /\b(Result States|Default state|Decision|Checklist|Risk|Evidence needed|Allowed|Forbidden|Scope|Validation Checklist|Acceptance Rule|What Not To Provide|Current Decision)\b/i.test(line)
}

function missingTextFindings(file, values, label) {
  const text = readFile(file)
  return values
    .filter((value) => !text.includes(value))
    .map((value) => finding(file, label, `Missing required text: ${value}`))
}

function walkFiles(relativeDir) {
  const absoluteDir = filePath(relativeDir)
  if (!fs.existsSync(absoluteDir)) return []
  const entries = fs.readdirSync(absoluteDir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
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

function scanPatterns(files, patterns, label, options = {}) {
  const findings = []
  for (const file of files) {
    const lines = readFile(file).split('\n')
    lines.forEach((line, index) => {
      if (isProhibitionLine(line) || isVocabularyLine(line)) return
      for (const pattern of patterns) {
        if (pattern.test(line)) {
          findings.push(options.redact ? secretFinding(file, label, index + 1) : finding(file, label, line, index + 1))
        }
      }
    })
  }
  return findings
}

const missingFiles = [...requiredDocs, ...requiredPriorDocs, ...trackingFiles]
  .filter((file) => !fileExists(file))
  .map((file) => finding(file, 'requiredFileMissing', 'Required Prompt 24A file is missing.'))

const evidencePathFiles = allowedEvidenceDirs.flatMap(walkFiles)
const evidenceFiles = evidencePathFiles.filter((file) => !isInstructionFile(file))
const instructionFiles = evidencePathFiles.filter(isInstructionFile)

const packageText = readFile('package.json')
const runnerText = readFile('scripts/validation/run-foundation-validation.mjs')
const readonlyAuditIndex = runnerText.indexOf('supabase_project_readonly_audit_diagnostics')
const evidenceIntakeIndex = runnerText.indexOf('supabase_project_readonly_evidence_intake_diagnostics')

const behaviorChecks = {
  packageScriptRegistered: /"supabase:project:evidence-intake:diagnostics":\s*"node scripts\/validation\/supabase-project-readonly-evidence-intake-diagnostics\.mjs"/.test(packageText),
  diagnosticsInFoundationRunner: /supabase:project:evidence-intake:diagnostics/.test(runnerText),
  diagnosticsAfterReadonlyAuditDiagnostics: readonlyAuditIndex >= 0 && evidenceIntakeIndex > readonlyAuditIndex,
  evidenceMatrixDefaultsMissing: /Current evidence status: `evidence_required`/.test(readFile('docs/supabase-readonly-audit-evidence-matrix.md'))
    && /\|\s*Project identity\s*\|\s*yes\s*\|\s*none supplied\s*\|\s*`missing`/.test(readFile('docs/supabase-readonly-audit-evidence-matrix.md')),
}

const behaviorFailures = Object.entries(behaviorChecks)
  .filter(([, ok]) => !ok)
  .map(([check]) => finding('scripts/validation/supabase-project-readonly-evidence-intake-diagnostics.mjs', check, `Behavior check failed: ${check}`))

const scannedPolicyFiles = [...requiredDocs, ...trackingFiles].filter(fileExists)
const scannedEvidenceFiles = evidencePathFiles.filter(fileExists)

const evidenceStatus = evidenceFiles.length === 0 ? 'evidence_required' : 'evidence_supplied_pending_review'
const redactionStatus = evidenceFiles.length === 0 ? 'not_applicable_no_evidence' : 'redaction_review_required'
const auditStatus = evidenceFiles.length === 0 ? 'evidence_required' : 'blocked_pending_redaction_review'

const evidenceAcceptanceClaims = []
if (evidenceFiles.length === 0) {
  const matrixText = readFile('docs/supabase-readonly-audit-evidence-matrix.md')
  if (/\baccepted\b/i.test(matrixText) && !/Do not mark this matrix `accepted`/i.test(matrixText)) {
    evidenceAcceptanceClaims.push(finding('docs/supabase-readonly-audit-evidence-matrix.md', 'acceptedEvidenceWithoutFile', 'Accepted evidence is claimed without a supplied evidence file.'))
  }
}

const criticalFindings = [
  ...missingFiles,
  ...Object.entries(requiredTermsByFile).flatMap(([file, terms]) => missingTextFindings(file, terms, 'requiredTermMissing')),
  ...Object.entries(trackerRequiredTerms).flatMap(([file, terms]) => missingTextFindings(file, terms, 'trackerReferenceMissing')),
  ...scanPatterns(scannedPolicyFiles, forbiddenSecretPatterns, 'forbiddenSecretOrConnectionStringValue', { redact: true }),
  ...scanPatterns(scannedPolicyFiles, forbiddenStateClaims, 'forbiddenAuditCompletionOrExecutionClaim'),
  ...scanPatterns(scannedPolicyFiles, forbiddenCommandClaims, 'forbiddenExecutableSupabaseOrDeploymentCommand'),
  ...scanPatterns(scannedEvidenceFiles, forbiddenSecretPatterns, 'forbiddenSecretOrConnectionStringValue', { redact: true }),
  ...scanPatterns(scannedEvidenceFiles, forbiddenStateClaims, 'forbiddenAuditCompletionOrExecutionClaim'),
  ...scanPatterns(scannedEvidenceFiles, forbiddenCommandClaims, 'forbiddenExecutableSupabaseOrDeploymentCommand'),
  ...evidenceAcceptanceClaims,
  ...behaviorFailures,
]

const summary = {
  generatedAt: new Date().toISOString(),
  status: criticalFindings.length === 0 ? 'passed' : 'failed',
  evidenceStatus: criticalFindings.length === 0 ? evidenceStatus : 'blocked',
  redactionStatus: criticalFindings.length === 0 ? redactionStatus : 'blocked',
  auditStatus: criticalFindings.length === 0 ? auditStatus : 'blocked',
  suppliedEvidenceFiles: evidenceFiles,
  instructionFiles,
  allowedEvidenceDirs,
  supabaseUpdateType: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  environmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: false,
  prompt23DecisionState: 'pending_human_approval',
  nextRecommendedPrompt: criticalFindings.length === 0
    ? 'Prompt 24B - Supabase Redacted Evidence Review'
    : 'Prompt 24A-Hardening - Supabase Evidence Intake Hardening',
  safety: {
    connectsToSupabase: false,
    executesSql: false,
    runsSupabaseLifecycle: false,
    usesRemoteSupabase: false,
    readsSecrets: false,
    printsSecrets: false,
    deploys: false,
    callsProviders: false,
    rendersMedia: false,
    executesTools: false,
    executesWorkers: false,
    transfersStorage: false,
    mutatesCredits: false,
    runsStripe: false,
    runsTelemetry: false,
    grantsHumanApproval: false,
    approvesStagingExecution: false,
    enablesBetaOrProduction: false,
    usesNodeBuiltInsOnly: true,
  },
  checked: {
    requiredDocs,
    requiredPriorDocs,
    trackingFiles,
    allowedEvidenceDirs,
  },
  behaviorChecks,
  findings: criticalFindings,
  recommendation: criticalFindings.length === 0
    ? 'Prompt 24A evidence intake diagnostics passed. Evidence remains required unless supplied in an allowed evidence path.'
    : 'Repair Prompt 24A evidence intake artifacts before treating the intake package as complete.',
}

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)

