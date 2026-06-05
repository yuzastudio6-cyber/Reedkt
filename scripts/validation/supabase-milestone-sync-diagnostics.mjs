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
  'docs/staging-supabase-human-decision-state.md',
  'docs/staging-supabase-human-decision-evidence-checklist.md',
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
  'Prompt 23A records conditional staging-only approval as `approved_for_staging_validation_when_gates_pass`.',
  'No AI-created artifact may approve production.',
  'Conditional human approval for staging does not imply staging execution, staging validation, or production approval.',
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
  '23A',
  'pending_human_approval',
  'approved_for_staging_validation_when_gates_pass',
  'conditional_approval_recorded',
  'One guarded local auth/workspace/project RLS smoke test passed.',
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

const forbiddenCurrentStateClaims = [
  /\bstaging sync status:\s*applied\b/i,
  /\bcurrent (staging )?sync status\b.{0,80}\b(applied_to_staging|validated_in_staging)\b/i,
  /\bcurrent production\b.{0,80}\b(applied_to_production|approved_for_production)\b/i,
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

function isAllowedVocabularyLine(line) {
  return /\b(Status Values|Allowed status vocabulary|Update Types|Classification Key|Allowed outcomes|future-only state|vocabulary|example)\b/i.test(line)
}

function isProhibitionLine(line) {
  return /\b(do not|must not|forbidden|prohibited|blocked|never|not run|not applied|not approved|no production|no beta|does not|did not|none|false|without human approval|future-only|draft-only|pending_human_approval|approved_for_staging_validation_when_gates_pass|conditional_approval_recorded|gates remain required)\b/i.test(line)
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
      if (isProhibitionLine(line) || isAllowedVocabularyLine(line)) return
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

const decisionIndex = runnerText.indexOf('staging_supabase_approval_decision_diagnostics')
const syncIndex = runnerText.indexOf('supabase_milestone_sync_diagnostics')

const behaviorChecks = {
  packageScriptRegistered: /"supabase:milestone:sync:diagnostics":\s*"node scripts\/validation\/supabase-milestone-sync-diagnostics\.mjs"/.test(packageText),
  diagnosticsInFoundationRunner: /supabase:milestone:sync:diagnostics/.test(runnerText),
  diagnosticsAfterPrompt23DecisionDiagnostics: decisionIndex >= 0 && syncIndex > decisionIndex,
  workflowCoversPrompt23PendingBase: /codex\/rp-foundation-23-pending-human-approval-decision-record/.test(workflowText),
  workflowCoversPrompt26DBase: /codex\/rp-foundation-26d-rls-no-policy-table-classification-contract/.test(workflowText),
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
  ...scanPatterns(scannedFiles, forbiddenCurrentStateClaims, 'forbiddenSupabaseExecutionOrProductionClaim'),
  ...behaviorFailures,
]

const matrixText = readFile('docs/supabase-milestone-sync-matrix.md')
const matrixOneLine = matrixText.replace(/\n/g, ' ')
if (!/20B-Retry.*One guarded local auth\/workspace\/project RLS smoke test passed/i.test(matrixOneLine)) {
  criticalFindings.push(finding('docs/supabase-milestone-sync-matrix.md', 'localEvidenceMissing', 'Prompt 20B-Retry local-passed evidence is not clearly recorded.'))
}

if (!/23.*pending_human_approval/i.test(matrixOneLine)) {
  criticalFindings.push(finding('docs/supabase-milestone-sync-matrix.md', 'prompt23PendingMissing', 'Prompt 23 pending human approval state is not clearly recorded.'))
}

if (!/23A.*approved_for_staging_validation_when_gates_pass.*conditional_approval_recorded/i.test(matrixOneLine)) {
  criticalFindings.push(finding('docs/supabase-milestone-sync-matrix.md', 'prompt23AConditionalApprovalMissing', 'Prompt 23A conditional approval state is not clearly recorded.'))
}

const summary = {
  generatedAt: new Date().toISOString(),
  status: criticalFindings.length === 0 ? 'passed' : 'failed',
  policyStatus: criticalFindings.length === 0 ? 'docs_status_only' : 'blocked_pending_policy_changes',
  supabaseUpdateType: 'docs/status only',
  prompt23DecisionState: 'approved_for_staging_validation_when_gates_pass',
  conditionalApprovalRecorded: true,
  stagingSyncStatus: 'not_applied',
  productionSyncStatus: 'blocked',
  nextRecommendedPrompt: criticalFindings.length === 0
    ? 'Prompt 26 - Approved Staging Supabase/RLS Validation Execution only after gates pass'
    : 'Prompt 23S-A - Supabase Milestone Sync Policy Hardening',
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
    grantsHumanApproval: false,
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
    ? 'Prompt 23S sync policy diagnostics passed. Prompt 23A records conditional approval only; no Supabase environment was run or applied.'
    : 'Repair Prompt 23S sync policy artifacts before treating the milestone reporting policy as complete.',
}

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)

if (criticalFindings.length > 0) {
  process.exitCode = 1
}
