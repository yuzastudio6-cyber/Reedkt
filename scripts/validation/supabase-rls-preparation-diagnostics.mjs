import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const requiredDocs = [
  'docs/staging-supabase-rls-validation-preparation.md',
  'docs/supabase-rls-test-manifest.md',
  'docs/rls-draft-to-executable-conversion-plan.md',
  'docs/staging-supabase-environment-contract.md',
  'docs/supabase-rls-fixture-contract.md',
  'docs/staging-supabase-validation-runbook.md',
  'docs/supabase-validation-evidence-checklist.md',
  'docs/prompt-19-validation-results.md',
  'docs/implementation-prompts/prompt-19-staging-supabase-rls-validation-preparation.md',
  'database/test-sql/README.md',
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

const expectedSqlFiles = [
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
]

const requiredPreparationTerms = [
  'local Supabase/RLS not run',
  'staging Supabase/RLS not run',
  'remote/prod validation prohibited',
  'synthetic fixtures',
  'no production data',
  'evidence',
  'Prompt 20',
]

const requiredConversionTerms = [
  'transaction',
  'rollback',
  'cleanup',
  'auth.uid()',
  'synthetic fixture',
  'production_never',
  'review checklist',
]

const requiredEnvironmentTerms = [
  'separate from production',
  'no production data',
  'no provider secrets',
  'no Stripe live secrets',
  'private bucket',
  'advisor output',
  'human approval',
  'no automatic production promotion',
]

const requiredFixtureTerms = [
  'users',
  'profiles',
  'workspaces',
  'workspace_members',
  'projects',
  'storage_object_records',
  'approved_plan_snapshots',
  'credit_reservations',
  'jobs',
  'provider attempts',
  'audit/observability',
]

const forbiddenAffirmativePatterns = [
  /productionBetaUnlocked\s*[:=]\s*true/i,
  /betaUnlocked\s*[:=]\s*true/i,
  /productionUnlocked\s*[:=]\s*true/i,
  /productionApproved\s*[:=]\s*true/i,
  /externalBetaAllowed\s*[:=]\s*true/i,
  /canProceedToProduction\s*[:=]\s*true/i,
  /canEnableRuntime\s*[:=]\s*true/i,
  /canRunStaging\s*[:=]\s*true/i,
  /\bproduction beta (is )?(approved|unlocked|enabled)\b/i,
]

const forbiddenExecutableCommandPatterns = [
  /\bsupabase\s+link\b/i,
  /\bsupabase\s+db\s+(push|reset|remote|dump|pull)\b/i,
  /\bsupabase\s+migration\s+(up|repair|squash)\b/i,
  /\bpsql\b.*\s-f\s+database\/test-sql\//i,
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

function lineFor(text, index) {
  return text.slice(0, index).split('\n').length
}

function finding(file, check, excerpt, line = 1) {
  return {
    file,
    line,
    check,
    excerpt: String(excerpt).replace(/\s+/g, ' ').slice(0, 240),
  }
}

function missingFiles(files, check) {
  return files
    .filter((file) => !fileExists(file))
    .map((file) => finding(file, check, 'Required Prompt 19 file is missing.'))
}

function scanPatterns(files, patterns, check) {
  const findings = []
  for (const file of files) {
    const text = readFile(file)
    for (const pattern of patterns) {
      const match = pattern.exec(text)
      if (match) findings.push(finding(file, check, match[0], lineFor(text, match.index)))
    }
  }
  return findings
}

function missingText(file, values, check) {
  const text = readFile(file)
  return values
    .filter((value) => !text.includes(value))
    .map((value) => finding(file, check, `Missing required text: ${value}`))
}

function sqlWarningFindings() {
  const findings = []
  for (const file of expectedSqlFiles) {
    const text = readFile(file)
    if (!text) continue
    const lower = text.slice(0, 1200).toLowerCase()
    if (!lower.includes('do not run')) {
      findings.push(finding(file, 'missingSqlWarningHeader', 'Missing do-not-run warning near top of SQL file.'))
    }
    if (!lower.includes('production')) {
      findings.push(finding(file, 'missingProductionWarning', 'Missing production warning near top of SQL file.'))
    }
    if (!lower.includes('local') && !lower.includes('staging')) {
      findings.push(finding(file, 'missingLocalStagingWarning', 'Missing local/staging warning near top of SQL file.'))
    }
  }
  return findings
}

function manifestCoverageFindings() {
  const manifest = readFile('docs/supabase-rls-test-manifest.md')
  const readme = readFile('database/test-sql/README.md')
  return expectedSqlFiles.flatMap((file) => {
    const basename = path.basename(file)
    const findings = []
    if (!manifest.includes(basename)) {
      findings.push(finding('docs/supabase-rls-test-manifest.md', 'manifestMissingSqlFile', basename))
    }
    if (!readme.includes(basename)) {
      findings.push(finding('database/test-sql/README.md', 'readmeMissingSqlFile', basename))
    }
    return findings
  })
}

const existingFiles = [...requiredDocs, ...trackingFiles, ...expectedSqlFiles].filter(fileExists)
const executableFiles = [
  'package.json',
  'scripts/validation/run-foundation-validation.mjs',
  'scripts/validation/supabase-rls-preparation-diagnostics.mjs',
  '.github/workflows/foundation-validation.yml',
].filter(fileExists)

const behaviorChecks = {
  packageScriptRegistered: /"supabase:rls:prep:diagnostics":\s*"node scripts\/validation\/supabase-rls-preparation-diagnostics\.mjs"/.test(readFile('package.json')),
  diagnosticsInFoundationRunner: /supabase:rls:prep:diagnostics/.test(readFile('scripts/validation/run-foundation-validation.mjs')),
  workflowCoversPrompt18Base: /codex\/rp-foundation-18-e2e-staging-smoke-test-plan/.test(readFile('.github/workflows/foundation-validation.yml')),
  noExecutableSqlOrSupabaseCommands: scanPatterns(executableFiles, forbiddenExecutableCommandPatterns, 'forbiddenExecutableCommand').length === 0,
  betaScorecardMentionsPrompt19: /Prompt 19/.test(readFile('docs/beta-readiness-scorecard.md')),
  blockerInventoryKeepsRlsCritical: /local\/staging Supabase\/RLS not executed/i.test(readFile('docs/production-beta-blocker-inventory.md')),
  prompt20DecisionRecorded: /Prompt 20 - Local Supabase\/RLS Validation Execution/.test(readFile('docs/prompt-19-validation-results.md')),
}

const behaviorFailures = Object.entries(behaviorChecks)
  .filter(([, passed]) => !passed)
  .map(([check]) => finding('scripts/validation/supabase-rls-preparation-diagnostics.mjs', check, `Behavior check failed: ${check}`))

const findings = {
  missingRequiredFiles: missingFiles(requiredDocs, 'requiredPreparationFileMissing'),
  missingTrackingFiles: missingFiles(trackingFiles, 'requiredTrackingFileMissing'),
  missingSqlFiles: missingFiles(expectedSqlFiles, 'requiredSqlFileMissing'),
  missingPreparationTerms: missingText('docs/staging-supabase-rls-validation-preparation.md', requiredPreparationTerms, 'requiredPreparationTermMissing'),
  missingConversionTerms: missingText('docs/rls-draft-to-executable-conversion-plan.md', requiredConversionTerms, 'requiredConversionTermMissing'),
  missingEnvironmentTerms: missingText('docs/staging-supabase-environment-contract.md', requiredEnvironmentTerms, 'requiredEnvironmentTermMissing'),
  missingFixtureTerms: missingText('docs/supabase-rls-fixture-contract.md', requiredFixtureTerms, 'requiredFixtureTermMissing'),
  sqlWarningFindings: sqlWarningFindings(),
  manifestCoverageFindings: manifestCoverageFindings(),
  forbiddenProductionUnlockClaims: scanPatterns(existingFiles, forbiddenAffirmativePatterns, 'forbiddenProductionUnlockClaim'),
  forbiddenExecutableCommands: scanPatterns(executableFiles, forbiddenExecutableCommandPatterns, 'forbiddenExecutableCommand'),
  forbiddenSecretsOrSignedUrls: scanPatterns(existingFiles, forbiddenSecretPatterns, 'forbiddenSecretOrSignedUrlValue'),
  behaviorFailures,
}

const criticalFindings = Object.values(findings).flat()

const result = {
  generatedAt: new Date().toISOString(),
  nodeVersion: process.version,
  platform: process.platform,
  arch: process.arch,
  safety: {
    connectsToSupabase: false,
    runsSupabaseCli: false,
    executesSql: false,
    readsEnvironmentSecrets: false,
    callsProviders: false,
    rendersMedia: false,
    executesTools: false,
    executesWorkers: false,
    processesMedia: false,
    mutatesCredits: false,
    transfersStorage: false,
    createsSignedUrls: false,
    deploys: false,
    mutatesSourceFiles: false,
  },
  files: {
    requiredDocs: requiredDocs.map((file) => ({ path: file, exists: fileExists(file) })),
    trackingFiles: trackingFiles.map((file) => ({ path: file, exists: fileExists(file) })),
    expectedSqlFiles: expectedSqlFiles.map((file) => ({ path: file, exists: fileExists(file) })),
  },
  behaviorChecks,
  findings,
  summary: {
    requiredDocCount: requiredDocs.length,
    expectedSqlFileCount: expectedSqlFiles.length,
    criticalFindingCount: criticalFindings.length,
    status: criticalFindings.length === 0 ? 'passed' : 'failed',
  },
}

console.log(JSON.stringify(result, null, 2))

if (criticalFindings.length > 0) {
  process.exitCode = 1
}
