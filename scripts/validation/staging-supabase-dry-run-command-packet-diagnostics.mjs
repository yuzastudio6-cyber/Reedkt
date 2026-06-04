import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const requiredDocs = [
  'docs/staging-supabase-rls-dry-run-command-packet.md',
  'docs/staging-supabase-command-safety-checklist.md',
  'docs/staging-supabase-command-evidence-template.md',
  'docs/staging-supabase-test-command-matrix.md',
  'docs/staging-supabase-dry-run-go-no-go-checklist.md',
  'docs/staging-supabase-future-command-templates.md',
  'docs/prompt-25-validation-results.md',
  'docs/implementation-prompts/prompt-25-staging-supabase-rls-dry-run-command-packet.md',
]

const requiredPriorDocs = [
  'docs/supabase-project-read-only-audit.md',
  'docs/supabase-readonly-audit-evidence-intake.md',
  'docs/supabase-milestone-sync-matrix.md',
  'docs/staging-supabase-human-decision-state.md',
  'docs/local-supabase-rls-evidence.md',
  'docs/supabase-rls-test-manifest.md',
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
  '.github/workflows/foundation-validation.yml',
]

const requiredTermsByFile = {
  'docs/staging-supabase-rls-dry-run-command-packet.md': [
    'Dry-run packet status: `blocked_missing_evidence`.',
    'Human approval status: `blocked_missing_approval`.',
    'Supabase update required: docs/status only.',
    'Supabase update status: docs_only.',
    'Supabase environment touched: none.',
    'SQL executed: none.',
    'Migration deployed: no.',
    'Prompt 23 remains `pending_human_approval`.',
  ],
  'docs/staging-supabase-command-safety-checklist.md': [
    'Current packet state: `blocked_missing_evidence` and `blocked_missing_approval`.',
    '<REDACTED_STAGING_PROJECT_REF>',
    '<APPROVED_BRANCH>',
    '<APPROVED_COMMIT>',
    '<APPROVED_SQL_FILE>',
    '<REDACTED_LOCAL_OR_STAGING_DB_URL>',
  ],
  'docs/staging-supabase-command-evidence-template.md': [
    'Supabase environment touched by Prompt 25: none',
    'SQL executed by Prompt 25: none',
    'Migration deployed by Prompt 25: no',
  ],
  'docs/staging-supabase-test-command-matrix.md': [
    'database/test-sql/local/001_auth_workspace_minimal_local_rls.sql',
    'database/test-sql/006_auth_workspace_rls_smoke_tests.draft.sql',
    'database/test-sql/020_e2e_staging_smoke_readiness_rls_smoke_tests.draft.sql',
    'Staging SQL approved: no.',
    'Staging SQL executed: none.',
  ],
  'docs/staging-supabase-dry-run-go-no-go-checklist.md': [
    '`blocked_missing_evidence`',
    '`blocked_missing_approval`',
    'Decision: no-go.',
  ],
  'docs/staging-supabase-future-command-templates.md': [
    'DO NOT RUN UNTIL HUMAN APPROVAL RECORD EXISTS.',
    '<REDACTED_STAGING_PROJECT_REF>',
    '<APPROVED_BRANCH>',
    '<APPROVED_COMMIT>',
    '<APPROVED_SQL_FILE>',
    '<REDACTED_LOCAL_OR_STAGING_DB_URL>',
  ],
  'docs/prompt-25-validation-results.md': [
    'Dry-run packet status: `blocked_missing_evidence`.',
    'Human approval status: `blocked_missing_approval`.',
    'Supabase update required: docs/status only.',
    'Supabase update status: docs_only.',
  ],
}

const trackerRequiredTerms = {
  'PRODUCTION_FOUNDATION_STATUS.md': ['Staging Supabase/RLS Dry-Run Command Packet', 'docs/staging-supabase-rls-dry-run-command-packet.md'],
  'docs/source-of-truth-map.md': ['Staging Supabase/RLS dry-run command packet', 'docs/staging-supabase-test-command-matrix.md'],
  'docs/production-milestone-plan.md': ['Prompt 25 - Staging Supabase/RLS Dry-Run Command Packet'],
  'docs/implementation-prompts/README.md': ['25', 'Staging Supabase/RLS Dry-Run Command Packet'],
  'docs/beta-readiness-scorecard.md': ['Prompt 25 dry-run command packet'],
  'docs/production-beta-blocker-inventory.md': ['blocked dry-run command packet'],
  'docs/supabase-milestone-sync-matrix.md': ['25', 'blocked_missing_evidence', 'blocked_missing_approval'],
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
  /\bstaging (sql|supabase|rls|migration).{0,100}\b(ran|executed|passed|completed|validated|approved|applied)\b/i,
  /\b(applied_to_staging|validated_in_staging|stagingSyncStatus:\s*applied)\b/i,
  /\bproduction (sql|supabase|readiness|beta).{0,100}\b(ran|executed|passed|completed|validated|approved|ready|unlocked)\b/i,
  /\bSQL (ran|executed|passed|completed)\b/i,
  /\bMigration deployed:\s*yes\b/i,
  /\bSupabase environment touched:\s*(staging|remote|production)\b/i,
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
  /\bpsql\b/i,
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
    excerpt: String(excerpt).replace(/\s+/g, ' ').slice(0, 300),
  }
}

function secretFinding(file, pattern, line = 1) {
  return finding(file, pattern, '[redacted secret-risk pattern]', line)
}

function isProhibitionLine(line) {
  return /\b(do not|must not|forbid|forbidden|blocked|never|no|not|without|prohibited|does not|did not|none|false|redact|remove|evidence_required|not_applicable_no_evidence|pending_human_approval|blocked_missing_evidence|blocked_missing_approval|placeholder|template only|future|missing|no-go)\b/i.test(line)
}

function isVocabularyLine(line) {
  return /\b(Result States|Decision States|Current Decision|Checklist|Risk|Evidence needed|Allowed|Forbidden|Scope|Validation Checklist|Command template|Command Template|Current Result)\b/i.test(line)
}

function stripFencedBlocks(text) {
  return text.replace(/```[\s\S]*?```/g, '')
}

function fencedBlocks(text) {
  const matches = [...text.matchAll(/```[a-zA-Z0-9_-]*\n([\s\S]*?)```/g)]
  return matches.map((match) => match[1])
}

function missingTextFindings(file, values, label) {
  const text = readFile(file)
  return values
    .filter((value) => !text.includes(value))
    .map((value) => finding(file, label, `Missing required text: ${value}`))
}

function scanLines(files, patterns, label, options = {}) {
  const findings = []
  for (const file of files) {
    const text = options.ignoreCodeBlocks ? stripFencedBlocks(readFile(file)) : readFile(file)
    const lines = text.split('\n')
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

function commandBlockFindings(file) {
  const findings = []
  const blocks = fencedBlocks(readFile(file))
  blocks.forEach((block, index) => {
    if (!block.includes('DO NOT RUN UNTIL HUMAN APPROVAL RECORD EXISTS.')) {
      findings.push(finding(file, 'missingApprovalWarningInCommandBlock', `Command block ${index + 1} is missing the required warning.`))
    }
    if (/postgres(?:ql)?:\/\//i.test(block) && !block.includes('<REDACTED_LOCAL_OR_STAGING_DB_URL>')) {
      findings.push(secretFinding(file, 'rawConnectionStringInCommandBlock'))
    }
    if (/https?:\/\//i.test(block)) {
      findings.push(secretFinding(file, 'urlInCommandBlock'))
    }
    if (/\b(supabase link|supabase db push|supabase db reset|psql)\b/i.test(block)) {
      findings.push(finding(file, 'forbiddenCommandInTemplateBlock', `Command block ${index + 1} includes a command Prompt 25 must not template.`))
    }
  })
  return findings
}

const missingFiles = [...requiredDocs, ...requiredPriorDocs, ...trackingFiles]
  .filter((file) => !fileExists(file))
  .map((file) => finding(file, 'requiredFileMissing', 'Required Prompt 25 file is missing.'))

const packageText = readFile('package.json')
const runnerText = readFile('scripts/validation/run-foundation-validation.mjs')
const workflowText = readFile('.github/workflows/foundation-validation.yml')

const evidenceIntakeIndex = runnerText.indexOf('supabase_project_readonly_evidence_intake_diagnostics')
const prompt25Index = runnerText.indexOf('staging_supabase_dry_run_packet_diagnostics')

const behaviorChecks = {
  packageScriptRegistered: /"staging:supabase:dry-run-packet:diagnostics":\s*"node scripts\/validation\/staging-supabase-dry-run-command-packet-diagnostics\.mjs"/.test(packageText),
  diagnosticsInFoundationRunner: /staging:supabase:dry-run-packet:diagnostics/.test(runnerText),
  diagnosticsAfterEvidenceIntakeDiagnostics: evidenceIntakeIndex >= 0 && prompt25Index > evidenceIntakeIndex,
  workflowCoversPrompt24ABase: /codex\/rp-foundation-24a-supabase-project-readonly-audit-evidence-intake/.test(workflowText),
}

const behaviorFailures = Object.entries(behaviorChecks)
  .filter(([, ok]) => !ok)
  .map(([check]) => finding('scripts/validation/staging-supabase-dry-run-command-packet-diagnostics.mjs', check, `Behavior check failed: ${check}`))

const scannedFiles = [...requiredDocs, ...trackingFiles].filter(fileExists)
const prompt25Docs = requiredDocs.filter(fileExists)

const criticalFindings = [
  ...missingFiles,
  ...Object.entries(requiredTermsByFile).flatMap(([file, terms]) => missingTextFindings(file, terms, 'requiredTermMissing')),
  ...Object.entries(trackerRequiredTerms).flatMap(([file, terms]) => missingTextFindings(file, terms, 'trackerTermMissing')),
  ...scanLines(scannedFiles, forbiddenSecretPatterns, 'forbiddenSecretOrConnectionStringValue', { redact: true }),
  ...scanLines(scannedFiles, forbiddenStateClaims, 'forbiddenExecutionOrUnlockClaim', { ignoreCodeBlocks: true }),
  ...scanLines(prompt25Docs, forbiddenCommandClaims, 'forbiddenExecutableCommandInProse', { ignoreCodeBlocks: true }),
  ...prompt25Docs.flatMap(commandBlockFindings),
  ...behaviorFailures,
]

const summary = {
  generatedAt: new Date().toISOString(),
  status: criticalFindings.length === 0 ? 'passed' : 'failed',
  packetStatus: criticalFindings.length === 0 ? 'blocked_until_approval_and_evidence' : 'blocked_pending_packet_hardening',
  goNoGoState: ['blocked_missing_evidence', 'blocked_missing_approval'],
  supabaseUpdateType: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  environmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: false,
  nextRecommendedPrompt: criticalFindings.length === 0
    ? 'Prompt 23A - Human Approval Decision Completion and Prompt 24B - Supabase Redacted Evidence Review before Prompt 26'
    : 'Prompt 25A - Staging Supabase Dry-Run Command Packet Hardening',
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
  },
  behaviorChecks,
  findings: criticalFindings,
  recommendation: criticalFindings.length === 0
    ? 'Prompt 25 dry-run packet diagnostics passed. The packet remains blocked until human approval and redacted evidence exist.'
    : 'Repair Prompt 25 dry-run packet artifacts before treating the command packet as validation-ready.',
}

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)

if (criticalFindings.length > 0) {
  process.exitCode = 1
}
