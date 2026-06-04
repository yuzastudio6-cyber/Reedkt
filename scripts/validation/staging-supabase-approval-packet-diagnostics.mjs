import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const requiredDocs = [
  'docs/staging-supabase-rls-approval-packet.md',
  'docs/staging-supabase-rls-runbook.md',
  'docs/staging-rls-test-selection-matrix.md',
  'docs/staging-synthetic-fixture-plan.md',
  'docs/staging-supabase-rollback-cleanup-plan.md',
  'docs/staging-supabase-risk-register.md',
  'docs/prompt-21-validation-results.md',
  'docs/implementation-prompts/prompt-21-staging-supabase-rls-approval-packet.md',
]

const trackingFiles = [
  'PRODUCTION_FOUNDATION_STATUS.md',
  'docs/source-of-truth-map.md',
  'docs/production-milestone-plan.md',
  'docs/implementation-prompts/README.md',
  'docs/local-supabase-rls-evidence.md',
  'docs/supabase-rls-test-manifest.md',
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'package.json',
  'scripts/validation/run-foundation-validation.mjs',
  '.github/workflows/foundation-validation.yml',
]

const requiredMatrixFiles = [
  'database/test-sql/001_rls_smoke_tests.sql',
  'database/test-sql/002_approved_snapshot_immutability_tests.sql',
  'database/test-sql/003_storage_policy_smoke_tests.sql',
  'database/test-sql/004_credit_audit_append_only_tests.sql',
  'database/test-sql/005_e2e_runtime_readiness_smoke_tests.sql',
  'database/test-sql/006_auth_workspace_rls_smoke_tests.draft.sql',
  'database/test-sql/007_storage_upload_rls_smoke_tests.draft.sql',
  'database/test-sql/008_approved_snapshot_rls_smoke_tests.draft.sql',
  'database/test-sql/009_credit_ledger_approval_gate_rls_smoke_tests.draft.sql',
  'database/test-sql/010_job_worker_lease_idempotency_rls_smoke_tests.draft.sql',
  'database/test-sql/011_media_readiness_probe_timing_rls_smoke_tests.draft.sql',
  'database/test-sql/012_render_preview_export_rls_smoke_tests.draft.sql',
  'database/test-sql/013_qa_revision_fallback_rls_smoke_tests.draft.sql',
  'database/test-sql/014_tool_call_foundation_rls_smoke_tests.draft.sql',
  'database/test-sql/015_tool_readiness_worker_runtime_rls_smoke_tests.draft.sql',
  'database/test-sql/016_worker_claim_execution_contract_rls_smoke_tests.draft.sql',
  'database/test-sql/017_provider_gateway_rls_smoke_tests.draft.sql',
  'database/test-sql/018_compliance_license_security_review_rls_smoke_tests.draft.sql',
  'database/test-sql/019_observability_audit_abuse_cost_rls_smoke_tests.draft.sql',
  'database/test-sql/020_e2e_staging_smoke_readiness_rls_smoke_tests.draft.sql',
  'database/test-sql/local/001_auth_workspace_minimal_local_rls.sql',
]

const requiredApprovalTerms = [
  'Prompt 20B-Retry',
  'local evidence already collected',
  'staging evidence not yet collected',
  'production readiness not approved',
  'human approval required',
  'synthetic fixtures only',
  'cleanup plan',
  'rollback plan',
]

const requiredRunbookTerms = [
  'Pre-approval static checks',
  'Environment confirmation',
  'Fixture review',
  'Migration validation window',
  'RLS validation window',
  'Cleanup verification',
  'Decision record',
]

const requiredFixtureTerms = [
  'auth/profile/workspace/project',
  'storage records without real media',
  'approved snapshots',
  'credits',
  'jobs/workers',
  'media readiness',
  'render/export',
  'QA/revision',
  'tool/provider/compliance/observability',
  'non-member denial',
]

const requiredRiskTerms = [
  'staging project mis-target',
  'secret exposure',
  'fixture cleanup failure',
  'migration rollback ambiguity',
  'false production readiness',
]

const forbiddenAffirmativePatterns = [
  /productionBetaUnlocked\s*[:=]\s*true/i,
  /betaUnlocked\s*[:=]\s*true/i,
  /productionUnlocked\s*[:=]\s*true/i,
  /productionApproved\s*[:=]\s*true/i,
  /stagingExecutionApproved\s*[:=]\s*true/i,
  /stagingApproved\s*[:=]\s*true/i,
  /canRunStaging\s*[:=]\s*true/i,
  /canProceedToProduction\s*[:=]\s*true/i,
  /\bstaging (sql|supabase|rls) (has )?(passed|run|executed)\b/i,
  /\bproduction beta (is )?(approved|unlocked|enabled)\b/i,
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
    excerpt: String(excerpt).replace(/\s+/g, ' ').slice(0, 260),
  }
}

function isProhibitionLine(line) {
  return /\b(do not|must not|forbidden|prohibited|not run|not executed|not allowed|blocked|never)\b/i.test(line)
}

function scanPatterns(files, patterns, label) {
  const findings = []
  for (const file of files) {
    const lines = readFile(file).split('\n')
    lines.forEach((line, index) => {
      if (isProhibitionLine(line)) return
      for (const pattern of patterns) {
        const match = pattern.exec(line)
        if (match) {
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

const allFiles = [...requiredDocs, ...trackingFiles]
const missingFiles = allFiles
  .filter((file) => !fileExists(file))
  .map((file) => finding(file, 'requiredFileMissing', 'Required Prompt 21 file is missing.'))

const promptDocs = requiredDocs.filter(fileExists)
const dangerousAffirmations = scanPatterns(promptDocs, forbiddenAffirmativePatterns, 'forbiddenStagingOrProductionClaim')
const forbiddenCommands = scanPatterns(promptDocs, forbiddenCommandPatterns, 'forbiddenExecutableCommand')
const secretFindings = scanPatterns(promptDocs, forbiddenSecretPatterns, 'forbiddenSecretOrConnectionStringValue')

const approvalFindings = missingTextFindings(
  'docs/staging-supabase-rls-approval-packet.md',
  requiredApprovalTerms,
  'requiredApprovalPacketTermMissing',
)
const runbookFindings = missingTextFindings(
  'docs/staging-supabase-rls-runbook.md',
  requiredRunbookTerms,
  'requiredRunbookTermMissing',
)
const fixtureFindings = missingTextFindings(
  'docs/staging-synthetic-fixture-plan.md',
  requiredFixtureTerms,
  'requiredFixtureTermMissing',
)
const riskFindings = missingTextFindings(
  'docs/staging-supabase-risk-register.md',
  requiredRiskTerms,
  'requiredRiskTermMissing',
)
const matrixFindings = missingTextFindings(
  'docs/staging-rls-test-selection-matrix.md',
  requiredMatrixFiles,
  'requiredTestMatrixEntryMissing',
)

const packageText = readFile('package.json')
const runnerText = readFile('scripts/validation/run-foundation-validation.mjs')
const workflowText = readFile('.github/workflows/foundation-validation.yml')
const validationText = readFile('docs/prompt-21-validation-results.md')
const evidenceText = readFile('docs/local-supabase-rls-evidence.md')
const manifestText = readFile('docs/supabase-rls-test-manifest.md')
const blockerText = readFile('docs/production-beta-blocker-inventory.md')

const behaviorChecks = {
  packageScriptRegistered: /"staging:supabase:approval:diagnostics":\s*"node scripts\/validation\/staging-supabase-approval-packet-diagnostics\.mjs"/.test(packageText),
  diagnosticsInFoundationRunner: /staging:supabase:approval:diagnostics/.test(runnerText),
  diagnosticsAfterLocalPreflight: runnerText.indexOf('supabase_local_preflight') < runnerText.indexOf('staging_supabase_approval_diagnostics'),
  workflowCoversPrompt20BRetryBase: /codex\/rp-foundation-20b-retry-local-rls-first-executable-smoke-test-run/.test(workflowText),
  validationStatesNoStagingExecution: /staging\/remote\/production Supabase status: not run/i.test(validationText),
  validationStatesNoSqlExecution: /SQL execution status: not run/i.test(validationText),
  localEvidenceReferencesPrompt21: /Prompt 21 Staging Approval Packet Update/i.test(evidenceText),
  manifestReferencesPrompt21: /Prompt 21 Staging Selection Update/i.test(manifestText),
  blockerInventoryReferencesPrompt21: /Prompt 21 staging Supabase\/RLS approval packet/i.test(blockerText),
}

const behaviorFailures = Object.entries(behaviorChecks)
  .filter(([, ok]) => !ok)
  .map(([check]) => finding('scripts/validation/staging-supabase-approval-packet-diagnostics.mjs', check, `Behavior check failed: ${check}`))

const criticalFindings = [
  ...missingFiles,
  ...dangerousAffirmations,
  ...forbiddenCommands,
  ...secretFindings,
  ...approvalFindings,
  ...runbookFindings,
  ...fixtureFindings,
  ...riskFindings,
  ...matrixFindings,
  ...behaviorFailures,
]

const summary = {
  generatedAt: new Date().toISOString(),
  status: criticalFindings.length === 0 ? 'passed' : 'failed',
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
    requiredDocs,
    trackingFiles,
    requiredMatrixEntries: requiredMatrixFiles.length,
  },
  behaviorChecks,
  findings: criticalFindings,
  recommendation: criticalFindings.length === 0
    ? 'Prompt 21 staging approval packet diagnostics passed. Staging execution remains approval-gated and unrun.'
    : 'Repair Prompt 21 docs/tracking so they stay approval-only and do not claim staging or production execution.',
}

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)

if (criticalFindings.length > 0) {
  process.exitCode = 1
}
