import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const requiredPrompt23SDocs = [
  'docs/supabase-milestone-sync-policy.md',
  'docs/supabase-milestone-ledger-contract.md',
  'docs/supabase-milestone-sync-matrix.md',
  'docs/supabase-update-gate-contract.md',
  'docs/supabase-success-milestone-reporting-standard.md',
  'docs/supabase-milestone-backfill-plan.md',
  'docs/supabase-status-record-schema-draft.md',
  'docs/prompt-23s-validation-results.md',
  'docs/implementation-prompts/prompt-23s-supabase-milestone-sync-policy.md',
]

const requiredPriorDocs = [
  'docs/staging-supabase-human-approval-decision-record.md',
  'docs/staging-supabase-approved-test-selection.md',
  'docs/staging-supabase-staging-execution-gates.md',
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
  'package.json',
  'scripts/validation/run-foundation-validation.mjs',
  '.github/workflows/foundation-validation.yml',
]

const matrixRequiredTerms = [
  'Prompt 0-19',
  '20G',
  '20H',
  '20I',
  '20J',
  '20K',
  '20L',
  '20M',
  '20N',
  '20O',
  '20P',
  '20P2',
  '20B-Retry',
  '21',
  '22',
  '23',
  'Guarded approval exists for future Prompt 24 only. Staging sync is not applied.',
]

const policyRequiredTerms = [
  'Supabase dashboard activity',
  '`none`',
  '`docs/status only`',
  '`local evidence only`',
  '`staging approval packet only`',
  '`staging migration candidate`',
  '`staging RLS validation candidate`',
  '`staging status record`',
  '`production candidate`',
  '`production update`',
  'No AI-created artifact may approve production.',
  'No staging update may happen without human approval',
]

const ledgerRequiredTerms = [
  'append-only',
  'No AI-created production approval is valid.',
  'No staging update is valid without human approval',
  'No production update is valid without staging evidence',
  '`milestoneId`',
  '`stagingSyncStatus`',
  '`productionSyncStatus`',
]

const reportingRequiredTerms = [
  'Supabase update required',
  'Supabase update status',
  'Supabase environment touched',
  'SQL executed',
  'Migration deployed',
  'Prompt 23S reporting line',
]

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

const forbiddenExecutionClaims = [
  /\bstaging sync status:\s*applied\b/i,
  /\bstaging (sql|supabase|rls) (has )?(passed|run|executed|completed)\b/i,
  /\bproduction (sync|update|readiness|beta) (has )?(passed|run|executed|completed|approved|unlocked)\b/i,
  /productionBetaUnlocked\s*[:=]\s*true/i,
  /betaUnlocked\s*[:=]\s*true/i,
  /productionUnlocked\s*[:=]\s*true/i,
  /canProceedToProduction\s*[:=]\s*true/i,
  /\bSupabase milestone backfill (has )?(run|executed|completed)\b/i,
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
  return /\b(do not|must not|forbidden|prohibited|blocked|never|not run|not applied|not approved|no production|no beta|does not|did not|none|false)\b/i.test(line)
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
      if (isProhibitionLine(line)) return
      for (const pattern of patterns) {
        if (pattern.test(line)) findings.push(finding(file, label, line, index + 1))
      }
    })
  }
  return findings
}

const missingFiles = [...requiredPrompt23SDocs, ...requiredPriorDocs, ...trackingFiles]
  .filter((file) => !fileExists(file))
  .map((file) => finding(file, 'requiredFileMissing', 'Required Prompt 23S file is missing.'))

const packageText = readFile('package.json')
const runnerText = readFile('scripts/validation/run-foundation-validation.mjs')
const workflowText = readFile('.github/workflows/foundation-validation.yml')

const decisionIndex = runnerText.indexOf('staging_supabase_human_approval_decision_diagnostics')
const syncIndex = runnerText.indexOf('supabase_milestone_sync_diagnostics')

const behaviorChecks = {
  packageScriptRegistered: /"supabase:milestone:sync:diagnostics":\s*"node scripts\/validation\/supabase-milestone-sync-diagnostics\.mjs"/.test(packageText),
  diagnosticsInFoundationRunner: /supabase:milestone:sync:diagnostics/.test(runnerText),
  diagnosticsAfterPrompt23DecisionDiagnostics: decisionIndex >= 0 && syncIndex > decisionIndex,
  workflowCoversPrompt23Base: /codex\/rp-foundation-23-staging-supabase-rls-human-approval-decision-record/.test(workflowText),
}

const behaviorFailures = Object.entries(behaviorChecks)
  .filter(([, ok]) => !ok)
  .map(([check]) => finding('scripts/validation/supabase-milestone-sync-diagnostics.mjs', check, `Behavior check failed: ${check}`))

const prompt23SFiles = requiredPrompt23SDocs.filter(fileExists)
const scannedFiles = [...prompt23SFiles, ...trackingFiles.filter(fileExists)]

const criticalFindings = [
  ...missingFiles,
  ...missingTextFindings('docs/supabase-milestone-sync-policy.md', policyRequiredTerms, 'policyTermMissing'),
  ...missingTextFindings('docs/supabase-milestone-ledger-contract.md', ledgerRequiredTerms, 'ledgerTermMissing'),
  ...missingTextFindings('docs/supabase-milestone-sync-matrix.md', matrixRequiredTerms, 'matrixTermMissing'),
  ...missingTextFindings('docs/supabase-success-milestone-reporting-standard.md', reportingRequiredTerms, 'reportingTermMissing'),
  ...scanPatterns(scannedFiles, forbiddenSecretPatterns, 'forbiddenSecretOrConnectionStringValue'),
  ...scanPatterns(scannedFiles, forbiddenExecutionClaims, 'forbiddenSupabaseExecutionOrProductionClaim'),
  ...behaviorFailures,
]

const matrixText = readFile('docs/supabase-milestone-sync-matrix.md')
const matrixOneLine = matrixText.replace(/\n/g, ' ')
if (!/20B-Retry.*one guarded local auth\/workspace\/project RLS smoke test passed/i.test(matrixOneLine)) {
  criticalFindings.push(finding('docs/supabase-milestone-sync-matrix.md', 'localEvidenceMissing', 'Prompt 20B-Retry local-passed evidence is not clearly recorded.'))
}

if (!/Prompt 23.*future Prompt 24 only/i.test(matrixOneLine)) {
  criticalFindings.push(finding('docs/supabase-milestone-sync-matrix.md', 'prompt23FutureOnlyMissing', 'Prompt 23 future-only staging approval state is not clearly recorded.'))
}

const summary = {
  generatedAt: new Date().toISOString(),
  status: criticalFindings.length === 0 ? 'passed' : 'failed',
  policyStatus: criticalFindings.length === 0 ? 'docs_status_only' : 'blocked_pending_policy_changes',
  supabaseUpdateType: 'docs/status only',
  stagingSyncStatus: 'not_applied',
  productionSyncStatus: 'blocked',
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
    mutatesCredits: false,
    runsBackfill: false,
    enablesBetaOrProduction: false,
    usesNodeBuiltInsOnly: true,
  },
  checked: {
    requiredPrompt23SDocs,
    requiredPriorDocs,
    trackingFiles,
  },
  behaviorChecks,
  findings: criticalFindings,
  recommendation: criticalFindings.length === 0
    ? 'Prompt 23S sync policy diagnostics passed. Prompt 24 may remain the next guarded staging validation planning path; Prompt 23S did not run or apply Supabase.'
    : 'Repair Prompt 23S sync policy artifacts before treating the milestone reporting policy as complete.',
}

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)

if (criticalFindings.length > 0) {
  process.exitCode = 1
}
