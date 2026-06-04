import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const prompt22Docs = [
  'docs/staging-supabase-human-approval-review.md',
  'docs/staging-supabase-human-approval-checklist.md',
  'docs/staging-supabase-approval-decision-template.md',
  'docs/staging-supabase-validation-evidence-template.md',
  'docs/staging-supabase-go-no-go-rubric.md',
  'docs/prompt-22-validation-results.md',
  'docs/implementation-prompts/prompt-22-staging-supabase-rls-human-approval-review.md',
]

const prompt21Docs = [
  'docs/staging-supabase-rls-approval-packet.md',
  'docs/staging-supabase-rls-runbook.md',
  'docs/staging-rls-test-selection-matrix.md',
  'docs/staging-synthetic-fixture-plan.md',
  'docs/staging-supabase-rollback-cleanup-plan.md',
  'docs/staging-supabase-risk-register.md',
  'docs/prompt-21-validation-results.md',
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

const requiredReviewTerms = [
  'ready_for_human_review',
  'Prompt 20B-Retry',
  'Prompt 21',
  'Prompt 22 does not grant actual approval',
  'Prompt 20B-Retry proves only one local auth/profile/workspace/project RLS smoke path',
  'staging evidence is not yet collected',
  'production readiness is not approved',
  'human approval',
]

const requiredChecklistTerms = [
  'This checklist is for a future human owner',
  'Actual human approval: not granted',
  'Staging execution: not run',
  'SQL execution: not run',
]

const requiredDecisionTerms = [
  'This is a future human-owned decision template',
  'approved_for_staging_validation',
  'approved_with_restrictions',
  'blocked_pending_changes',
  'rejected',
  'Prompt 22 decision: no human approval granted',
]

const requiredEvidenceTerms = [
  'Prompt 22 does not collect staging evidence',
  'Staging evidence collected: no',
  'Production readiness approved: no',
  'Beta unlock approved: no',
]

const requiredRubricTerms = [
  'Go',
  'Conditional Go',
  'No-Go',
  'Stop Criteria',
  'Actual approval is not granted',
]

const forbiddenAffirmativePatterns = [
  /productionBetaUnlocked\s*[:=]\s*true/i,
  /betaUnlocked\s*[:=]\s*true/i,
  /productionUnlocked\s*[:=]\s*true/i,
  /productionApproved\s*[:=]\s*true/i,
  /humanApprovalGranted\s*[:=]\s*true/i,
  /stagingExecutionApproved\s*[:=]\s*true/i,
  /stagingApproved\s*[:=]\s*true/i,
  /canRunStaging\s*[:=]\s*true/i,
  /canProceedToProduction\s*[:=]\s*true/i,
  /\bactual human approval:\s*(approved|granted|yes)\b/i,
  /\bhuman approval (is )?(approved|granted)\b/i,
  /\bstaging execution (is )?(approved|granted)\b/i,
  /\bstaging (sql|supabase|rls) (has )?(passed|run|executed)\b/i,
  /\bproduction (readiness|beta) (is )?(approved|unlocked|enabled)\b/i,
]

const forbiddenCommandPatterns = [
  /\bsupabase\s+start\b/i,
  /\bsupabase\s+status\b/i,
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
  /STRIPE_SECRET_KEY\s*=/i,
  /OPENAI_API_KEY\s*=/i,
  /PROVIDER_API_KEY\s*=/i,
  /service_role_key\s*[:=]/i,
  /provider_api_key\s*[:=]/i,
  /signedUrl\s*[:=]\s*['"`]https?:\/\//i,
  /signed_url\s*[:=]\s*['"`]https?:\/\//i,
  /postgresql:\/\/[^@\s]+@/i,
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
    excerpt: String(excerpt).replace(/\s+/g, ' ').slice(0, 280),
  }
}

function isAllowedTemplateLine(line) {
  return /\b(template|decision option|choose exactly one future decision|future reviewer may choose)\b/i.test(line)
}

function isProhibitionLine(line) {
  return /\b(do not|must not|forbidden|prohibited|not run|not executed|not allowed|blocked|never|does not|not granted|not approved|not collected|future only|future approved|no human approval)\b/i.test(line)
    || /\bapproved:\s*no\b/i.test(line)
}

function scanPatterns(files, patterns, label) {
  const findings = []
  for (const file of files) {
    const lines = readFile(file).split('\n')
    lines.forEach((line, index) => {
      if (isProhibitionLine(line) || isAllowedTemplateLine(line)) return
      for (const pattern of patterns) {
        if (pattern.test(line)) {
          findings.push(finding(file, label, line, index + 1))
        }
      }
    })
  }
  return findings
}

function missingTextFindings(file, values, label) {
  const text = readFile(file)
  return values
    .filter((value) => !text.includes(value))
    .map((value) => finding(file, label, `Missing required text: ${value}`))
}

const allRequiredFiles = [...prompt22Docs, ...prompt21Docs, ...trackingFiles]
const missingFiles = allRequiredFiles
  .filter((file) => !fileExists(file))
  .map((file) => finding(file, 'requiredFileMissing', 'Required staging human approval review file is missing.'))

const prompt22ExistingDocs = prompt22Docs.filter(fileExists)
const scannedFiles = [...prompt22ExistingDocs, ...trackingFiles.filter(fileExists)]

const criticalFindings = [
  ...missingFiles,
  ...missingTextFindings('docs/staging-supabase-human-approval-review.md', requiredReviewTerms, 'reviewTermMissing'),
  ...missingTextFindings('docs/staging-supabase-human-approval-checklist.md', requiredChecklistTerms, 'checklistTermMissing'),
  ...missingTextFindings('docs/staging-supabase-approval-decision-template.md', requiredDecisionTerms, 'decisionTemplateTermMissing'),
  ...missingTextFindings('docs/staging-supabase-validation-evidence-template.md', requiredEvidenceTerms, 'evidenceTemplateTermMissing'),
  ...missingTextFindings('docs/staging-supabase-go-no-go-rubric.md', requiredRubricTerms, 'rubricTermMissing'),
  ...scanPatterns(scannedFiles, forbiddenAffirmativePatterns, 'forbiddenApprovalOrProductionClaim'),
  ...scanPatterns(prompt22ExistingDocs, forbiddenCommandPatterns, 'forbiddenExecutableCommand'),
  ...scanPatterns(scannedFiles, forbiddenSecretPatterns, 'forbiddenSecretOrConnectionStringValue'),
]

const packageText = readFile('package.json')
const runnerText = readFile('scripts/validation/run-foundation-validation.mjs')
const workflowText = readFile('.github/workflows/foundation-validation.yml')
const validationText = readFile('docs/prompt-22-validation-results.md')
const statusText = readFile('PRODUCTION_FOUNDATION_STATUS.md')
const sourceMapText = readFile('docs/source-of-truth-map.md')
const milestoneText = readFile('docs/production-milestone-plan.md')
const promptReadmeText = readFile('docs/implementation-prompts/README.md')
const blockerText = readFile('docs/production-beta-blocker-inventory.md')
const scorecardText = readFile('docs/beta-readiness-scorecard.md')
const packetText = readFile('docs/staging-supabase-rls-approval-packet.md')
const runbookText = readFile('docs/staging-supabase-rls-runbook.md')
const matrixText = readFile('docs/staging-rls-test-selection-matrix.md')
const riskText = readFile('docs/staging-supabase-risk-register.md')

const approvalIndex = runnerText.indexOf('staging_supabase_approval_diagnostics')
const reviewIndex = runnerText.indexOf('staging_supabase_approval_review_diagnostics')

const behaviorChecks = {
  packageScriptRegistered: /"staging:supabase:approval-review:diagnostics":\s*"node scripts\/validation\/staging-supabase-human-approval-review-diagnostics\.mjs"/.test(packageText),
  diagnosticsInFoundationRunner: /staging:supabase:approval-review:diagnostics/.test(runnerText),
  diagnosticsAfterPrompt21ApprovalDiagnostics: approvalIndex >= 0 && reviewIndex > approvalIndex,
  workflowCoversPrompt21Base: /codex\/rp-foundation-21-staging-supabase-rls-approval-packet/.test(workflowText),
  validationStatesReadyForHumanReview: /Packet completeness result: `ready_for_human_review`/.test(validationText),
  validationStatesNoApprovalGrant: /Human approval status: not granted/.test(validationText),
  validationStatesNoStagingExecution: /staging\/remote\/production Supabase status: not run/i.test(validationText),
  validationStatesNoSqlExecution: /SQL execution status: not run/i.test(validationText),
  statusReferencesPrompt22: /Staging Supabase\/RLS Human Approval Review/.test(statusText),
  sourceMapReferencesPrompt22: /staging Supabase\/RLS human approval review/i.test(sourceMapText),
  milestoneReferencesPrompt22: /Prompt 22 - Staging Supabase\/RLS Human Approval Review/.test(milestoneText),
  implementationReadmeReferencesPrompt22: /\| 22 \| Staging Supabase\/RLS Human Approval Review \|/.test(promptReadmeText),
  blockerInventoryReferencesPrompt22: /Prompt 22 human approval review/i.test(blockerText),
  scorecardReferencesPrompt22: /Prompt 22 human approval review/i.test(scorecardText),
  prompt21PacketReferencesPrompt22: /Prompt 22 human review/i.test(packetText),
  prompt21RunbookReferencesPrompt22: /Prompt 22 human review/i.test(runbookText),
  matrixReferencesPrompt22: /Prompt 22 human review/i.test(matrixText),
  riskRegisterReferencesPrompt22: /Prompt 22 human review/i.test(riskText),
}

const behaviorFailures = Object.entries(behaviorChecks)
  .filter(([, ok]) => !ok)
  .map(([check]) => finding('scripts/validation/staging-supabase-human-approval-review-diagnostics.mjs', check, `Behavior check failed: ${check}`))

criticalFindings.push(...behaviorFailures)

const summary = {
  generatedAt: new Date().toISOString(),
  status: criticalFindings.length === 0 ? 'passed' : 'failed',
  reviewState: criticalFindings.length === 0 ? 'ready_for_human_review' : 'blocked_needs_hardening',
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
    grantsHumanApproval: false,
    enablesBetaOrProduction: false,
    usesNodeBuiltInsOnly: true,
  },
  checked: {
    prompt22Docs,
    prompt21Docs,
    trackingFiles,
  },
  behaviorChecks,
  findings: criticalFindings,
  recommendation: criticalFindings.length === 0
    ? 'Prompt 22 review packet diagnostics passed. Packet is ready for human review, but approval is not granted and staging remains unrun.'
    : 'Repair Prompt 22 review docs/tracking before any human decision record.',
}

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)

if (criticalFindings.length > 0) {
  process.exitCode = 1
}
