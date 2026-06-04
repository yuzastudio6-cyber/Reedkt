import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const requiredDocs = [
  'docs/supabase-project-read-only-audit.md',
  'docs/supabase-project-inventory-checklist.md',
  'docs/supabase-redacted-evidence-template.md',
  'docs/supabase-project-activity-gap-analysis.md',
  'docs/supabase-read-only-audit-runbook.md',
  'docs/supabase-read-only-audit-result-template.md',
  'docs/supabase-project-drift-risk-register.md',
  'docs/prompt-24-validation-results.md',
  'docs/implementation-prompts/prompt-24-supabase-project-read-only-audit.md',
]

const requiredPriorDocs = [
  'docs/supabase-milestone-sync-policy.md',
  'docs/supabase-milestone-sync-matrix.md',
  'docs/staging-supabase-human-approval-decision-record.md',
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
  'docs/supabase-project-read-only-audit.md': [
    'Audit status: `evidence_required`.',
    'Supabase environment touched: none.',
    'SQL executed: none.',
    'Prompt 23 remains `pending_human_approval`',
    'Supabase dashboard activity can be empty',
  ],
  'docs/supabase-project-inventory-checklist.md': [
    'Project Identity',
    'Database',
    'RLS',
    'Storage',
    'Auth',
    'Edge Functions',
    'Logs And Activity',
    'Milestone Sync',
  ],
  'docs/supabase-redacted-evidence-template.md': [
    'Do not paste secrets',
    'Project ref redacted',
    'RLS-enabled tables',
    'Bucket names',
    'Enabled provider names',
    'Function names',
  ],
  'docs/supabase-project-activity-gap-analysis.md': [
    'Repository work does not automatically create Supabase dashboard activity.',
    'Prompt 24 performs none of those actions.',
    'Current Conclusion',
  ],
  'docs/supabase-read-only-audit-runbook.md': [
    'Confirm no SQL will run.',
    'Confirm no migrations will be applied.',
    'Dashboard Evidence Collection',
    'Evidence Redaction',
  ],
  'docs/supabase-read-only-audit-result-template.md': [
    'Default state: `evidence_required`.',
    'Staging SQL approved: no',
    'Production readiness approved: no',
  ],
  'docs/supabase-project-drift-risk-register.md': [
    'Repo migrations not applied remotely',
    'Staging and production confused',
    'RLS disabled remotely',
    'Storage bucket public unexpectedly',
    'Dashboard inactivity misread as project failure',
  ],
}

const forbiddenSecretPatterns = [
  /SUPABASE_SERVICE_ROLE_KEY\s*=/i,
  /SUPABASE_ANON_KEY\s*=/i,
  /JWT_SECRET\s*=/i,
  /STRIPE_SECRET_KEY\s*=/i,
  /OPENAI_API_KEY\s*=/i,
  /PROVIDER_API_KEY\s*=/i,
  /service_role_key\s*[:=]/i,
  /provider_api_key\s*[:=]/i,
  /signedUrl\s*[:=]\s*['"`]https?:\/\//i,
  /signed_url\s*[:=]\s*['"`]https?:\/\//i,
  /postgres(?:ql)?:\/\/[^@\s]+@/i,
]

const forbiddenStateClaims = [
  /\baudit status:\s*(partially_reviewed|ready_for_staging_inventory_review)\b/i,
  /\bstaging (audit|inventory|supabase|rls).{0,80}\b(completed|passed|validated|approved)\b/i,
  /\bremote (audit|supabase|rls).{0,80}\b(completed|passed|validated|approved)\b/i,
  /\bproduction (audit|supabase|readiness|beta).{0,80}\b(completed|passed|validated|approved|unlocked|ready)\b/i,
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
  /\bpsql\b.{0,80}\b(postgres|staging|production|remote)\b/i,
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

function isProhibitionLine(line) {
  return /\b(do not|must not|forbid|forbidden|blocked|never|no|not|without|prohibited|does not|did not|none|false|redact|remove|evidence_required|pending_human_approval)\b/i.test(line)
}

function isVocabularyLine(line) {
  return /\b(Result States|Default state|Decision|Checklist|Risk|Evidence needed|Allowed|Forbidden|Scope|Validation Checklist)\b/i.test(line)
}

function missingTextFindings(file, values, label) {
  const text = readFile(file)
  return values
    .filter((value) => !text.includes(value))
    .map((value) => finding(file, label, `Missing required text: ${value}`))
}

function scanPatterns(files, patterns, label) {
  const findings = []
  for (const file of files) {
    const lines = readFile(file).split('\n')
    lines.forEach((line, index) => {
      if (isProhibitionLine(line) || isVocabularyLine(line)) return
      for (const pattern of patterns) {
        if (pattern.test(line)) findings.push(finding(file, label, line, index + 1))
      }
    })
  }
  return findings
}

const missingFiles = [...requiredDocs, ...requiredPriorDocs, ...trackingFiles]
  .filter((file) => !fileExists(file))
  .map((file) => finding(file, 'requiredFileMissing', 'Required Prompt 24 file is missing.'))

const packageText = readFile('package.json')
const runnerText = readFile('scripts/validation/run-foundation-validation.mjs')
const workflowText = readFile('.github/workflows/foundation-validation.yml')

const syncIndex = runnerText.indexOf('supabase_milestone_sync_diagnostics')
const auditIndex = runnerText.indexOf('supabase_project_readonly_audit_diagnostics')

const behaviorChecks = {
  packageScriptRegistered: /"supabase:project:readonly-audit:diagnostics":\s*"node scripts\/validation\/supabase-project-readonly-audit-diagnostics\.mjs"/.test(packageText),
  diagnosticsInFoundationRunner: /supabase:project:readonly-audit:diagnostics/.test(runnerText),
  diagnosticsAfterMilestoneSyncDiagnostics: syncIndex >= 0 && auditIndex > syncIndex,
  workflowCoversPrompt23SBase: /codex\/rp-foundation-23s-supabase-milestone-sync-policy-v2/.test(workflowText),
}

const behaviorFailures = Object.entries(behaviorChecks)
  .filter(([, ok]) => !ok)
  .map(([check]) => finding('scripts/validation/supabase-project-readonly-audit-diagnostics.mjs', check, `Behavior check failed: ${check}`))

const scannedFiles = [...requiredDocs, ...trackingFiles].filter(fileExists)

const criticalFindings = [
  ...missingFiles,
  ...Object.entries(requiredTermsByFile).flatMap(([file, terms]) => missingTextFindings(file, terms, 'requiredTermMissing')),
  ...scanPatterns(scannedFiles, forbiddenSecretPatterns, 'forbiddenSecretOrConnectionStringValue'),
  ...scanPatterns(scannedFiles, forbiddenStateClaims, 'forbiddenCompletedAuditOrExecutionClaim'),
  ...scanPatterns(scannedFiles, forbiddenCommandClaims, 'forbiddenExecutableSupabaseOrDeploymentCommand'),
  ...behaviorFailures,
]

const summary = {
  generatedAt: new Date().toISOString(),
  status: criticalFindings.length === 0 ? 'passed' : 'failed',
  auditStatus: criticalFindings.length === 0 ? 'evidence_required' : 'blocked',
  supabaseUpdateType: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  environmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: false,
  prompt23DecisionState: 'pending_human_approval',
  nextRecommendedPrompt: criticalFindings.length === 0
    ? 'Prompt 24A - Supabase Project Read-Only Audit Evidence Intake'
    : 'Prompt 24A - Supabase Project Read-Only Audit Hardening',
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
    ? 'Prompt 24 read-only audit diagnostics passed. Evidence remains required; no Supabase environment was touched.'
    : 'Repair Prompt 24 audit package artifacts before treating the read-only audit packet as complete.',
}

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)
