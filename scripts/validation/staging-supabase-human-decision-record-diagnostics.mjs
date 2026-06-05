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

const prompt23aDocs = [
  'docs/prompt-23a-validation-results.md',
  'docs/implementation-prompts/prompt-23a-human-approval-decision-completion.md',
]

const priorPacketDocs = [
  'docs/staging-supabase-rls-approval-packet.md',
  'docs/staging-supabase-human-approval-review.md',
  'docs/staging-supabase-human-approval-checklist.md',
  'docs/staging-supabase-approval-decision-template.md',
  'docs/prompt-22-validation-results.md',
]

const laterGateDocs = [
  'docs/staging-supabase-rls-dry-run-command-packet.md',
  'docs/gcp-secret-manager-supabase-reference-contract.md',
  'docs/supabase-milestone-sync-matrix.md',
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
  'approved_for_staging_validation_when_gates_pass',
  'conditional_staging_validation_approval',
  'user_owner_chat_authorization',
  'conditional staging-only approval',
  'Prompt 20B-Retry proves only one local auth/profile/workspace/project RLS smoke path',
  'public/exposed schema tables',
  '`anon`, `authenticated`, and `service_role`',
]

const requiredChecklistTerms = [
  'Human authorization supplied through chat.',
  'Approval source recorded as `user_owner_chat_authorization`.',
  'Accepted Supabase evidence: still required.',
  'Approved PR/commit: still required before execution.',
  'Production approval: no.',
  'Beta unlock: no.',
]

const requiredValidationTerms = [
  'Decision state: `approved_for_staging_validation_when_gates_pass`',
  'Approval type: `conditional_staging_validation_approval`',
  'Approval source: `user_owner_chat_authorization`',
  'Staging Supabase/RLS has not run',
]

const requiredRubricTerms = [
  'conditional_go_pending_gates',
  'execution is still blocked until evidence, project identity, commit, test-set, Secret Manager reference, synthetic fixture, rollback, and cleanup gates are complete',
]

const forbiddenAffirmativePatterns = [
  /"stagingExecutionApproved"\s*:\s*true/i,
  /"stagingSqlApproved"\s*:\s*true/i,
  /"productionReadinessApproved"\s*:\s*true/i,
  /"betaUnlockApproved"\s*:\s*true/i,
  /\b(applied_to_staging|validated_in_staging|applied_to_production|approved_for_production)\b/i,
  /\bstaging (sql|supabase|rls) (has )?(passed|run|executed)\b/i,
  /\bstaging execution (is )?(unconditionally )?(granted|allowed)\b/i,
  /\bstaging sql (is )?(unconditionally )?(granted|allowed)\b/i,
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
  /\bgcloud\s+(run|functions|builds|deploy|app|secrets)\b/i,
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

function isAllowedConditionalLine(line) {
  return /\b(when gates pass|conditional|conditional_go_pending_gates|future-only|future staging|future execution|only after|required gates|next allowed|placeholder|template)\b/i.test(line)
}

function isProhibitionLine(line) {
  return /\b(do not|must not|forbidden|prohibited|not run|not executed|not allowed|blocked|never|does not|not granted|not approved|not collected|not supplied|not recorded|no staging|no production|remains false|remains blocked|false|null|still required|missing)\b/i.test(line)
    || /\bno[.:]?\s*$/i.test(line)
    || /\bapproved\s*[:|]\s*no\b/i.test(line)
}

function scanPatterns(files, patterns, label) {
  const findings = []
  for (const file of files) {
    const lines = readFile(file).split('\n')
    lines.forEach((line, index) => {
      if (isProhibitionLine(line) || isAllowedConditionalLine(line)) return
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
    decisionState: 'approved_for_staging_validation_when_gates_pass',
    approvalType: 'conditional_staging_validation_approval',
    approvalSource: 'user_owner_chat_authorization',
    stagingExecutionApprovedWhenGatesPass: true,
    stagingSqlApprovedWhenGatesPass: true,
    productionReadinessApproved: false,
    betaUnlockApproved: false,
    humanApproverRecorded: true,
    approverRole: 'owner_user',
    approvedPr: null,
    approvedCommit: null,
    approvedStagingProjectRefRedacted: null,
    requiresAcceptedSupabaseEvidence: true,
    requiresGcpSecretManagerReferences: true,
    requiresDryRunPacket: true,
    requiresCleanupRollbackPlan: true,
    nextAllowedPrompt: 'Prompt 26 — Approved Staging Supabase/RLS Validation Execution only after gates pass',
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

const allRequiredFiles = [...prompt23Docs, ...prompt23aDocs, ...priorPacketDocs, ...laterGateDocs, ...trackingFiles]
const missingFiles = allRequiredFiles
  .filter((file) => !fileExists(file))
  .map((file) => finding(file, 'requiredFileMissing', 'Required Prompt 23A decision file is missing.'))

const scannedFiles = [...prompt23Docs, ...prompt23aDocs, ...laterGateDocs, ...trackingFiles].filter(fileExists)
const promptDecisionDocs = [...prompt23Docs, ...prompt23aDocs].filter(fileExists)
const { value: decisionState, findings: decisionParseFindings } = parseDecisionState()

const criticalFindings = [
  ...missingFiles,
  ...decisionParseFindings,
  ...decisionStateFindings(decisionState),
  ...missingTextFindings('docs/staging-supabase-human-approval-decision-record.md', requiredDecisionRecordTerms, 'decisionRecordTermMissing'),
  ...missingTextFindings('docs/staging-supabase-human-decision-evidence-checklist.md', requiredChecklistTerms, 'decisionChecklistTermMissing'),
  ...missingTextFindings('docs/staging-supabase-go-no-go-rubric.md', requiredRubricTerms, 'goNoGoTermMissing'),
  ...missingTextFindings('docs/prompt-23a-validation-results.md', requiredValidationTerms, 'validationTermMissing'),
  ...scanPatterns(scannedFiles, forbiddenAffirmativePatterns, 'forbiddenApprovalOrExecutionClaim'),
  ...scanPatterns(promptDecisionDocs, forbiddenCommandPatterns, 'forbiddenExecutableCommand'),
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

const reviewIndex = runnerText.indexOf('staging_supabase_approval_review_diagnostics')
const decisionIndex = runnerText.indexOf('staging_supabase_approval_decision_diagnostics')

const behaviorChecks = {
  packageScriptRegistered: /"staging:supabase:approval-decision:diagnostics":\s*"node scripts\/validation\/staging-supabase-human-decision-record-diagnostics\.mjs"/.test(packageText),
  diagnosticsInFoundationRunner: /staging:supabase:approval-decision:diagnostics/.test(runnerText),
  diagnosticsAfterPrompt22ReviewDiagnostics: reviewIndex >= 0 && decisionIndex > reviewIndex,
  workflowCoversPrompt26DBase: /codex\/rp-foundation-26d-rls-no-policy-table-classification-contract/.test(workflowText),
  statusReferencesPrompt23A: /Human Approval Decision Completion/.test(statusText),
  sourceMapReferencesPrompt23A: /conditional staging-only human approval/i.test(sourceMapText),
  milestoneReferencesPrompt23A: /Prompt 23A - Human Approval Decision Completion/.test(milestoneText),
  implementationReadmeReferencesPrompt23A: /\| 23A \| Human Approval Decision Completion \|/.test(promptReadmeText),
  blockerInventoryReferencesPrompt23A: /conditional staging approval recorded/i.test(blockerText),
  scorecardReferencesPrompt23A: /Prompt 23A conditional approval/i.test(scorecardText),
}

const behaviorFailures = Object.entries(behaviorChecks)
  .filter(([, ok]) => !ok)
  .map(([check]) => finding('scripts/validation/staging-supabase-human-decision-record-diagnostics.mjs', check, `Behavior check failed: ${check}`))

criticalFindings.push(...behaviorFailures)

const summary = {
  generatedAt: new Date().toISOString(),
  status: criticalFindings.length === 0 ? 'passed' : 'failed',
  decisionState: criticalFindings.length === 0 ? 'approved_for_staging_validation_when_gates_pass' : 'blocked_needs_hardening',
  approvalType: 'conditional_staging_validation_approval',
  approvalSource: 'user_owner_chat_authorization',
  approvalState: {
    humanApproverRecorded: true,
    stagingExecutionApprovedWhenGatesPass: true,
    stagingSqlApprovedWhenGatesPass: true,
    productionReadinessApproved: false,
    betaUnlockApproved: false,
    requiresAcceptedSupabaseEvidence: true,
    requiresGcpSecretManagerReferences: true,
    requiresDryRunPacket: true,
    requiresCleanupRollbackPlan: true,
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
      ? 'Prompt 26 - Approved Staging Supabase/RLS Validation Execution only after gates pass'
      : 'Prompt 23A-A - Human Approval Decision Record Hardening',
}

console.log(JSON.stringify(summary, null, 2))

if (criticalFindings.length > 0) {
  process.exitCode = 1
}
