import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const prompt23Docs = [
  'docs/staging-supabase-human-approval-decision-record.md',
  'docs/staging-supabase-human-decision-evidence-checklist.md',
  'docs/staging-supabase-human-decision-state.md',
  'docs/prompt-23-validation-results.md',
  'docs/implementation-prompts/prompt-23-staging-supabase-rls-human-approval-decision-record.md',
]

const priorPacketDocs = [
  'docs/staging-supabase-rls-approval-packet.md',
  'docs/staging-supabase-human-approval-review.md',
  'docs/staging-supabase-human-approval-checklist.md',
  'docs/staging-supabase-approval-decision-template.md',
  'docs/prompt-22-validation-results.md',
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

const requiredDecisionRecordTerms = [
  'pending_human_approval',
  'Prompt 20B-Retry proves only one local auth/profile/workspace/project RLS smoke path',
  'Prompt 22 marked the approval packet as `ready_for_human_review`',
  'no human approval details were supplied',
  'Prompt 23A - Human Approval Decision Completion',
]

const requiredChecklistTerms = [
  'Prompt 23 does not complete this checklist and does not grant approval',
  'Human approver recorded: no',
  'Staging execution approved: no',
  'Staging SQL approved: no',
  'Production readiness approved: no',
  'Beta unlock approved: no',
]

const requiredValidationTerms = [
  'Decision state: `pending_human_approval`',
  'Human approver recorded: no',
  'Staging Supabase/RLS has not run',
  'Prompt 23A - Human Approval Decision Completion',
]

const forbiddenAffirmativePatterns = [
  /"stagingExecutionApproved"\s*:\s*true/i,
  /"stagingSqlApproved"\s*:\s*true/i,
  /"productionReadinessApproved"\s*:\s*true/i,
  /"betaUnlockApproved"\s*:\s*true/i,
  /"humanApproverRecorded"\s*:\s*true/i,
  /\bdecisionState\b.{0,80}\bapproved_for_staging_validation\b/i,
  /\bstaging (sql|supabase|rls) (has )?(passed|run|executed)\b/i,
  /\bstaging execution (is )?(approved|granted|allowed)\b/i,
  /\bstaging sql (is )?(approved|granted|allowed)\b/i,
  /\bhuman approval (is )?(approved|granted|recorded)\b/i,
  /\bproduction (readiness|beta) (is )?(approved|unlocked|enabled)\b/i,
  /\bbeta (is )?(approved|unlocked|enabled)\b/i,
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
  return /\b(template|future human|future owner|future decision|future prompt|only after|may only|allowed prompt|next allowed)\b/i.test(line)
}

function isProhibitionLine(line) {
  return /\b(do not|must not|forbidden|prohibited|not run|not executed|not allowed|blocked|never|does not|not granted|not approved|not collected|not supplied|not recorded|no human approval|no staging|no production|remains false|remains blocked|false|null)\b/i.test(line)
    || /\bapproved\s*[:|]\s*no\b/i.test(line)
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

function parseDecisionState() {
  const stateText = readFile('docs/staging-supabase-human-decision-state.md')
  const match = /```json\s*([\s\S]*?)```/m.exec(stateText)
  if (!match) {
    return {
      value: null,
      findings: [finding('docs/staging-supabase-human-decision-state.md', 'decisionStateJsonMissing', 'Missing JSON decision state block.')],
    }
  }

  try {
    return { value: JSON.parse(match[1]), findings: [] }
  } catch (error) {
    return {
      value: null,
      findings: [finding('docs/staging-supabase-human-decision-state.md', 'decisionStateJsonInvalid', error.message)],
    }
  }
}

function decisionStateFindings(state) {
  if (!state) return []
  const expected = {
    decisionState: 'pending_human_approval',
    stagingExecutionApproved: false,
    stagingSqlApproved: false,
    productionReadinessApproved: false,
    betaUnlockApproved: false,
    humanApproverRecorded: false,
    approvedPr: null,
    approvedCommit: null,
    approvedStagingProjectRefRedacted: null,
    nextAllowedPrompt: 'Prompt 23A - Human Approval Decision Completion',
  }

  return Object.entries(expected)
    .filter(([key, expectedValue]) => state[key] !== expectedValue)
    .map(([key, expectedValue]) =>
      finding(
        'docs/staging-supabase-human-decision-state.md',
        'decisionStateMismatch',
        `Expected ${key}=${JSON.stringify(expectedValue)}, received ${JSON.stringify(state[key])}.`,
      ),
    )
}

const allRequiredFiles = [...prompt23Docs, ...priorPacketDocs, ...trackingFiles]
const missingFiles = allRequiredFiles
  .filter((file) => !fileExists(file))
  .map((file) => finding(file, 'requiredFileMissing', 'Required Prompt 23 decision file is missing.'))

const scannedFiles = [...prompt23Docs, ...trackingFiles].filter(fileExists)
const prompt23ExistingDocs = prompt23Docs.filter(fileExists)
const { value: decisionState, findings: decisionParseFindings } = parseDecisionState()

const criticalFindings = [
  ...missingFiles,
  ...decisionParseFindings,
  ...decisionStateFindings(decisionState),
  ...missingTextFindings('docs/staging-supabase-human-approval-decision-record.md', requiredDecisionRecordTerms, 'decisionRecordTermMissing'),
  ...missingTextFindings('docs/staging-supabase-human-decision-evidence-checklist.md', requiredChecklistTerms, 'decisionChecklistTermMissing'),
  ...missingTextFindings('docs/prompt-23-validation-results.md', requiredValidationTerms, 'validationTermMissing'),
  ...scanPatterns(scannedFiles, forbiddenAffirmativePatterns, 'forbiddenApprovalOrExecutionClaim'),
  ...scanPatterns(prompt23ExistingDocs, forbiddenCommandPatterns, 'forbiddenExecutableCommand'),
  ...scanPatterns(scannedFiles, forbiddenSecretPatterns, 'forbiddenSecretOrConnectionStringValue'),
]

const packageText = readFile('package.json')
const runnerText = readFile('scripts/validation/run-foundation-validation.mjs')
const workflowText = readFile('.github/workflows/foundation-validation.yml')
const statusText = readFile('PRODUCTION_FOUNDATION_STATUS.md')
const sourceMapText = readFile('docs/source-of-truth-map.md')
const milestoneText = readFile('docs/production-milestone-plan.md')
const promptReadmeText = readFile('docs/implementation-prompts/README.md')
const blockerText = readFile('docs/production-beta-blocker-inventory.md')
const scorecardText = readFile('docs/beta-readiness-scorecard.md')
const prompt22ValidationText = readFile('docs/prompt-22-validation-results.md')

const reviewIndex = runnerText.indexOf('staging_supabase_approval_review_diagnostics')
const decisionIndex = runnerText.indexOf('staging_supabase_approval_decision_diagnostics')

const behaviorChecks = {
  packageScriptRegistered: /"staging:supabase:approval-decision:diagnostics":\s*"node scripts\/validation\/staging-supabase-human-decision-record-diagnostics\.mjs"/.test(packageText),
  diagnosticsInFoundationRunner: /staging:supabase:approval-decision:diagnostics/.test(runnerText),
  diagnosticsAfterPrompt22ReviewDiagnostics: reviewIndex >= 0 && decisionIndex > reviewIndex,
  workflowCoversPrompt22Base: /codex\/rp-foundation-22-staging-supabase-rls-human-approval-review/.test(workflowText),
  statusReferencesPrompt23: /Staging Supabase\/RLS Human Approval Decision Record/.test(statusText),
  sourceMapReferencesPrompt23: /staging Supabase\/RLS human approval decision record/i.test(sourceMapText),
  milestoneReferencesPrompt23: /Prompt 23 - Staging Supabase\/RLS Human Approval Decision Record/.test(milestoneText),
  implementationReadmeReferencesPrompt23: /\| 23 \| Staging Supabase\/RLS Human Approval Decision Record \|/.test(promptReadmeText),
  blockerInventoryReferencesPrompt23: /Prompt 23 pending decision record/i.test(blockerText),
  scorecardReferencesPrompt23: /Prompt 23 pending decision record/i.test(scorecardText),
  prompt22CiRecorded: /26964913735/.test(prompt22ValidationText),
}

const behaviorFailures = Object.entries(behaviorChecks)
  .filter(([, ok]) => !ok)
  .map(([check]) => finding('scripts/validation/staging-supabase-human-decision-record-diagnostics.mjs', check, `Behavior check failed: ${check}`))

criticalFindings.push(...behaviorFailures)

const summary = {
  generatedAt: new Date().toISOString(),
  status: criticalFindings.length === 0 ? 'passed' : 'failed',
  decisionState: criticalFindings.length === 0 ? 'pending_human_approval' : 'blocked_needs_hardening',
  approvalState: {
    humanApproverRecorded: false,
    stagingExecutionApproved: false,
    stagingSqlApproved: false,
    productionReadinessApproved: false,
    betaUnlockApproved: false,
  },
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
    processesMedia: false,
    unlocksBetaOrProduction: false,
  },
  behaviorChecks,
  findings: criticalFindings,
  nextRecommendedPrompt:
    criticalFindings.length === 0
      ? 'Prompt 23A - Human Approval Decision Completion'
      : 'Prompt 23A - Human Approval Decision Record Hardening',
}

console.log(JSON.stringify(summary, null, 2))

if (criticalFindings.length > 0) {
  process.exitCode = 1
}
