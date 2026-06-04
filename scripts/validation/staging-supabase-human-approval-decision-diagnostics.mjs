import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const prompt23Docs = [
  'docs/staging-supabase-human-approval-decision-record.md',
  'docs/staging-supabase-approved-test-selection.md',
  'docs/staging-supabase-staging-execution-gates.md',
  'docs/staging-supabase-rollback-cleanup-acceptance.md',
  'docs/staging-supabase-human-approval-outcome.md',
  'docs/foundation-supabase-approval-reports/prompt_23_staging_supabase_human_approval_decision_record.json',
  'docs/implementation-prompts/prompt-23-staging-supabase-rls-human-approval-decision-record.md',
]

const prompt21And22Docs = [
  'docs/staging-supabase-rls-approval-packet.md',
  'docs/staging-supabase-rls-runbook.md',
  'docs/staging-rls-test-selection-matrix.md',
  'docs/staging-synthetic-fixture-plan.md',
  'docs/staging-supabase-rollback-cleanup-plan.md',
  'docs/staging-supabase-risk-register.md',
  'docs/staging-supabase-human-approval-review.md',
  'docs/staging-supabase-human-approval-checklist.md',
  'docs/staging-supabase-approval-decision-template.md',
  'docs/staging-supabase-validation-evidence-template.md',
  'docs/staging-supabase-go-no-go-rubric.md',
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

const requiredDecisionTerms = [
  'approved_for_guarded_staging_validation',
  'guarded_staging_validation_approved',
  'Decision date',
  '2026-06-04',
  'PR #168',
  'PR #170',
  'redacted_required_at_execution_time',
  'Remote SQL run',
  'Migration deployment',
  'Production affected',
  'Prompt 24 - Guarded staging Supabase/RLS validation execution',
]

const requiredSelectionTerms = [
  'database/test-sql/local/001_auth_workspace_minimal_local_rls.sql',
  'Staging migration-chain validation',
  'Synthetic auth/profile/workspace/project fixtures',
  'all `database/test-sql/006` through `020` draft SQL files',
  'storage upload/download',
  'Do not infer production readiness from a pass',
]

const requiredGateTerms = [
  'REEDITPRO_CONFIRM_STAGING_SUPABASE_RLS_VALIDATION=true',
  'REEDITPRO_CONFIRM_STAGING_SUPABASE_SQL_EXECUTION=true',
  'REEDITPRO_CONFIRM_STAGING_SUPABASE_MIGRATION_VALIDATION=true',
  'REEDITPRO_CONFIRM_STAGING_SUPABASE_SYNTHETIC_FIXTURES=true',
  'REEDITPRO_CONFIRM_STAGING_SUPABASE_CLEANUP=true',
  'REEDITPRO_CONFIRM_STAGING_SUPABASE_ROLLBACK_ACCEPTANCE=true',
  'Stop Conditions',
]

const requiredOutcomeTerms = [
  'Prompt 23 outcome: `approved_for_guarded_staging_validation`',
  'Staging execution in Prompt 23',
  'not run',
  'Production readiness',
  'not approved',
  'Beta unlock',
  'not approved',
]

const requiredReportTerms = [
  '"decision": "approved_for_guarded_staging_validation"',
  '"approvalStatus": "guarded_staging_validation_approved"',
  '"stagingSupabaseRun": false',
  '"remoteSqlRun": false',
  '"productionSqlRun": false',
  '"migrationDeployment": false',
  '"productionAffected": false',
]

const forbiddenCommandPatterns = [
  /\bsupabase\s+link\b/i,
  /\bsupabase\s+db\s+(push|reset|remote|dump|pull)\b/i,
  /\bsupabase\s+migration\s+(up|repair|squash)\b/i,
  /\bnpm\s+run\s+supabase:rls:local:run\b/i,
  /\bpsql\s+['"`-]/i,
  /\bgcloud\s+(run|functions|builds|deploy|app)\b/i,
  /\bfirebase\s+deploy\b/i,
  /\bvercel\s+(deploy|--prod)\b/i,
  /\bnetlify\s+deploy\b/i,
  /\bnpm\s+audit\s+fix\b/i,
  /\bnpm\s+(install|i|add)\b/i,
  /\byarn\s+add\b|\bpnpm\s+add\b/i,
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
  /postgresql:\/\/[^@\s]+@/i,
]

const forbiddenBroadClaims = [
  /productionBetaUnlocked\s*[:=]\s*true/i,
  /betaUnlocked\s*[:=]\s*true/i,
  /productionUnlocked\s*[:=]\s*true/i,
  /productionApproved\s*[:=]\s*true/i,
  /canProceedToProduction\s*[:=]\s*true/i,
  /\bstaging (sql|supabase|rls) (has )?(passed|run|executed)\b/i,
  /\bproduction (readiness|beta) (is )?(approved|unlocked|enabled)\b/i,
  /\bexternal beta (is )?(approved|unlocked|enabled)\b/i,
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
  return /\b(do not|must not|forbidden|prohibited|blocked|never|not run|not approved|no production|no beta|does not allow|does not run)\b/i.test(line)
    || /\b(false|no)\b/i.test(line)
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

const allRequiredFiles = [...prompt23Docs, ...prompt21And22Docs, ...trackingFiles]
const missingFiles = allRequiredFiles
  .filter((file) => !fileExists(file))
  .map((file) => finding(file, 'requiredFileMissing', 'Required Prompt 23 file is missing.'))

const packageText = readFile('package.json')
const runnerText = readFile('scripts/validation/run-foundation-validation.mjs')
const workflowText = readFile('.github/workflows/foundation-validation.yml')
const statusText = readFile('PRODUCTION_FOUNDATION_STATUS.md')
const sourceMapText = readFile('docs/source-of-truth-map.md')
const milestoneText = readFile('docs/production-milestone-plan.md')
const promptReadmeText = readFile('docs/implementation-prompts/README.md')
const blockerText = readFile('docs/production-beta-blocker-inventory.md')
const scorecardText = readFile('docs/beta-readiness-scorecard.md')

const reviewIndex = runnerText.indexOf('staging_supabase_approval_review_diagnostics')
const decisionIndex = runnerText.indexOf('staging_supabase_human_approval_decision_diagnostics')

const behaviorChecks = {
  packageScriptRegistered: /"staging:supabase:approval-decision:diagnostics":\s*"node scripts\/validation\/staging-supabase-human-approval-decision-diagnostics\.mjs"/.test(packageText),
  diagnosticsInFoundationRunner: /staging:supabase:approval-decision:diagnostics/.test(runnerText),
  diagnosticsAfterPrompt22ReviewDiagnostics: reviewIndex >= 0 && decisionIndex > reviewIndex,
  workflowCoversPrompt22Base: /codex\/rp-foundation-22-staging-supabase-rls-human-approval-review/.test(workflowText),
  statusReferencesPrompt23: /Staging Supabase\/RLS Human Approval Decision Record/.test(statusText),
  sourceMapReferencesPrompt23: /staging Supabase\/RLS human approval decision record/i.test(sourceMapText),
  milestoneReferencesPrompt23: /Prompt 23 - Staging Supabase\/RLS Human Approval Decision Record/.test(milestoneText),
  implementationReadmeReferencesPrompt23: /\| 23 \| Staging Supabase\/RLS Human Approval Decision Record \|/.test(promptReadmeText),
  blockerInventoryReferencesPrompt23: /Prompt 23 records guarded staging validation approval/i.test(blockerText),
  scorecardReferencesPrompt23: /Prompt 23 guarded decision record/i.test(scorecardText),
}

const behaviorFailures = Object.entries(behaviorChecks)
  .filter(([, ok]) => !ok)
  .map(([check]) => finding('scripts/validation/staging-supabase-human-approval-decision-diagnostics.mjs', check, `Behavior check failed: ${check}`))

const prompt23ExistingDocs = prompt23Docs.filter(fileExists)
const scannedFiles = [...prompt23ExistingDocs, ...trackingFiles.filter(fileExists)]

const criticalFindings = [
  ...missingFiles,
  ...missingTextFindings('docs/staging-supabase-human-approval-decision-record.md', requiredDecisionTerms, 'decisionRecordTermMissing'),
  ...missingTextFindings('docs/staging-supabase-approved-test-selection.md', requiredSelectionTerms, 'testSelectionTermMissing'),
  ...missingTextFindings('docs/staging-supabase-staging-execution-gates.md', requiredGateTerms, 'executionGateTermMissing'),
  ...missingTextFindings('docs/staging-supabase-human-approval-outcome.md', requiredOutcomeTerms, 'approvalOutcomeTermMissing'),
  ...missingTextFindings('docs/foundation-supabase-approval-reports/prompt_23_staging_supabase_human_approval_decision_record.json', requiredReportTerms, 'jsonReportTermMissing'),
  ...scanPatterns(prompt23ExistingDocs, forbiddenCommandPatterns, 'forbiddenExecutableCommand'),
  ...scanPatterns(scannedFiles, forbiddenSecretPatterns, 'forbiddenSecretOrConnectionStringValue'),
  ...scanPatterns(scannedFiles, forbiddenBroadClaims, 'forbiddenProductionOrExecutionClaim'),
  ...behaviorFailures,
]

let parsedReport = null
try {
  parsedReport = JSON.parse(readFile('docs/foundation-supabase-approval-reports/prompt_23_staging_supabase_human_approval_decision_record.json'))
} catch (error) {
  criticalFindings.push(finding('docs/foundation-supabase-approval-reports/prompt_23_staging_supabase_human_approval_decision_record.json', 'invalidJsonReport', error.message))
}

if (parsedReport) {
  const reportChecks = {
    decisionApproved: parsedReport.decision === 'approved_for_guarded_staging_validation',
    prompt23DoesNotRunStaging: parsedReport.executionStatusInPrompt23?.stagingSupabaseRun === false,
    prompt23DoesNotRunRemoteSql: parsedReport.executionStatusInPrompt23?.remoteSqlRun === false,
    prompt23DoesNotDeployMigrations: parsedReport.executionStatusInPrompt23?.migrationDeployment === false,
    productionUnaffected: parsedReport.executionStatusInPrompt23?.productionAffected === false,
    prompt24ConfirmationsPresent: Array.isArray(parsedReport.requiredPrompt24Confirmations) && parsedReport.requiredPrompt24Confirmations.length >= 6,
  }

  for (const [check, ok] of Object.entries(reportChecks)) {
    if (!ok) {
      criticalFindings.push(finding('docs/foundation-supabase-approval-reports/prompt_23_staging_supabase_human_approval_decision_record.json', check, `Report check failed: ${check}`))
    }
  }
}

const summary = {
  generatedAt: new Date().toISOString(),
  status: criticalFindings.length === 0 ? 'passed' : 'failed',
  decision: criticalFindings.length === 0 ? 'approved_for_guarded_staging_validation' : 'blocked_pending_packet_changes',
  approvalStatus: criticalFindings.length === 0 ? 'guarded_staging_validation_approved' : 'blocked',
  stagingExecutionAllowed: criticalFindings.length === 0 ? 'prompt_24_only_after_gates' : 'no',
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
    enablesBetaOrProduction: false,
    usesNodeBuiltInsOnly: true,
  },
  checked: {
    prompt23Docs,
    prompt21And22Docs,
    trackingFiles,
  },
  behaviorChecks,
  findings: criticalFindings,
  recommendation: criticalFindings.length === 0
    ? 'Prompt 23 decision diagnostics passed. Prompt 24 may be prepared for guarded staging validation, but Prompt 23 did not run SQL or Supabase.'
    : 'Repair Prompt 23 decision artifacts before staging validation is attempted.',
}

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)

if (criticalFindings.length > 0) {
  process.exitCode = 1
}
