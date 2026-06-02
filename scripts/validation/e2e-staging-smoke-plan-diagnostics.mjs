import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const requiredDocs = [
  'docs/e2e-staging-smoke-test-plan.md',
  'docs/beta-readiness-gate-contract.md',
  'docs/e2e-smoke-scenario-matrix.md',
  'docs/staging-smoke-fixture-contract.md',
  'docs/staging-smoke-runbook.md',
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/e2e-staging-smoke-validation-results.md',
  'docs/implementation-prompts/prompt-18-e2e-staging-smoke-test-plan.md',
  'database/test-sql/020_e2e_staging_smoke_readiness_rls_smoke_tests.draft.sql',
]

const trackingFiles = [
  'PRODUCTION_FOUNDATION_STATUS.md',
  'docs/source-of-truth-map.md',
  'docs/production-milestone-plan.md',
  'docs/implementation-prompts/README.md',
  'docs/prompt-17-validation-results.md',
  'package.json',
  'scripts/validation/run-foundation-validation.mjs',
  '.github/workflows/foundation-validation.yml',
]

const requiredGateNames = [
  'SourceOfTruthGate',
  'ArchitectureBoundaryGate',
  'CanonicalSchemaGate',
  'MigrationValidationGate',
  'RLSValidationGate',
  'AuthWorkspaceGate',
  'StorageUploadGate',
  'SignedUrlGate',
  'ApprovedSnapshotGate',
  'CreditLedgerGate',
  'BackendApiGate',
  'JobWorkerGate',
  'MediaReadinessGate',
  'RenderPreviewExportGate',
  'QARevisionFallbackGate',
  'ToolCallGate',
  'ToolReadinessGate',
  'WorkerExecutionContractGate',
  'ProviderGatewayGate',
  'ComplianceReviewGate',
  'ObservabilityAuditGate',
  'AbuseRateLimitGate',
  'CostControlGate',
  'StagingE2EGate',
  'HumanReviewGate',
  'ProductionUnlockGate',
]

const requiredScenarios = [
  'Static foundation smoke',
  'Auth/workspace/project smoke',
  'Storage/upload boundary smoke',
  'Approved snapshot boundary smoke',
  'Credit gate smoke',
  'Job/worker smoke',
  'Media readiness smoke',
  'Render/export smoke',
  'QA/revision/fallback smoke',
  'Tool-call/readiness smoke',
  'Provider gateway smoke',
  'Compliance smoke',
  'Observability smoke',
]

const requiredScorecardAreas = [
  'Source of truth',
  'Schema/RLS',
  'Auth/workspace/project',
  'Storage/upload',
  'Approved snapshots',
  'Credits/approval gate',
  'Job/worker foundation',
  'Media readiness',
  'Render/preview/export',
  'QA/revision/fallback',
  'Tool-call foundation',
  'Provider gateway',
  'Compliance/security',
  'Observability/audit/cost controls',
  'E2E staging smoke',
  'Production deployment',
  'Stripe/billing',
  'Actual execution path',
]

const forbiddenAffirmativePatterns = [
  /productionBetaUnlocked\s*[:=]\s*true/i,
  /betaUnlocked\s*[:=]\s*true/i,
  /productionUnlocked\s*[:=]\s*true/i,
  /productionApproved\s*[:=]\s*true/i,
  /externalBetaAllowed\s*[:=]\s*true/i,
  /broadRealMediaAllowed\s*[:=]\s*true/i,
  /canProceedToProduction\s*[:=]\s*true/i,
  /canEnableRuntime\s*[:=]\s*true/i,
  /canCallProvider\s*[:=]\s*true/i,
  /canExecuteTool\s*[:=]\s*true/i,
  /canExecuteWorker\s*[:=]\s*true/i,
  /canRender\s*[:=]\s*true/i,
  /canCreateSignedUrl\s*[:=]\s*true/i,
  /stripeLiveMode\s*[:=]\s*true/i,
  /\bproduction beta (is )?(approved|unlocked|enabled)\b/i,
]

const forbiddenCommandPatterns = [
  /\bsupabase\s+link\b/i,
  /\bsupabase\s+db\s+(push|reset|remote|dump|pull)\b/i,
  /\bsupabase\s+migration\s+(up|repair|squash)\b/i,
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

function finding(file, pattern, excerpt, line = 1) {
  return { file, line, pattern, excerpt: String(excerpt).replace(/\s+/g, ' ').slice(0, 240) }
}

function scanPatterns(files, patterns, label) {
  const findings = []
  for (const file of files) {
    const text = readFile(file)
    for (const pattern of patterns) {
      const match = pattern.exec(text)
      if (match) {
        findings.push(finding(file, label, match[0], text.slice(0, match.index).split('\n').length))
      }
    }
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
  .map((file) => finding(file, 'requiredFileMissing', 'Required Prompt 18 file is missing.'))

const docsForPatternScan = requiredDocs.filter(fileExists)
const dangerousAffirmations = scanPatterns(docsForPatternScan, forbiddenAffirmativePatterns, 'forbiddenProductionUnlockClaim')
const forbiddenCommands = scanPatterns(docsForPatternScan, forbiddenCommandPatterns, 'forbiddenExecutionOrDeploymentCommand')
const secretFindings = scanPatterns(docsForPatternScan, forbiddenSecretPatterns, 'forbiddenSecretOrSignedUrlValue')

const gateFindings = missingTextFindings('docs/beta-readiness-gate-contract.md', requiredGateNames, 'requiredBetaGateMissing')
const scenarioFindings = missingTextFindings('docs/e2e-smoke-scenario-matrix.md', requiredScenarios, 'requiredSmokeScenarioMissing')
const scorecardFindings = missingTextFindings('docs/beta-readiness-scorecard.md', requiredScorecardAreas, 'requiredScorecardAreaMissing')

const blockerText = readFile('docs/production-beta-blocker-inventory.md')
const blockerFindings = [
  'E2E staging smoke not run',
  'Local/staging Supabase/RLS not executed',
  'Credit transactional mutation not enabled',
  'Real job queue/worker claims not enabled',
  'Stripe/billing not implemented',
].filter((text) => !blockerText.includes(text))
  .map((text) => finding('docs/production-beta-blocker-inventory.md', 'requiredBlockerMissing', `Missing blocker: ${text}`))

const packageText = readFile('package.json')
const runnerText = readFile('scripts/validation/run-foundation-validation.mjs')
const workflowText = readFile('.github/workflows/foundation-validation.yml')
const prompt17Text = readFile('docs/prompt-17-validation-results.md')

const behaviorChecks = {
  packageScriptRegistered: /"e2e:staging:diagnostics":\s*"node scripts\/validation\/e2e-staging-smoke-plan-diagnostics\.mjs"/.test(packageText),
  diagnosticsInFoundationRunner: /e2e:staging:diagnostics/.test(runnerText),
  workflowCoversPrompt17Base: /codex\/rp-foundation-17-observability-audit-abuse-cost-controls/.test(workflowText),
  prompt17CiPassRecorded: /26823387808\/job\/79083906523/.test(prompt17Text) && /passed/i.test(prompt17Text),
  draftSqlClearlyDraftOnly: /Draft-only/i.test(readFile('database/test-sql/020_e2e_staging_smoke_readiness_rls_smoke_tests.draft.sql')),
  validationResultsStateNoExecution: /Remote\/Staging Status/.test(readFile('docs/e2e-staging-smoke-validation-results.md')) && /intentionally not used/i.test(readFile('docs/e2e-staging-smoke-validation-results.md')),
}

const behaviorFailures = Object.entries(behaviorChecks)
  .filter(([, ok]) => !ok)
  .map(([check]) => finding('scripts/validation/e2e-staging-smoke-plan-diagnostics.mjs', check, `Behavior check failed: ${check}`))

const criticalFindings = [
  ...missingFiles,
  ...dangerousAffirmations,
  ...forbiddenCommands,
  ...secretFindings,
  ...gateFindings,
  ...scenarioFindings,
  ...scorecardFindings,
  ...blockerFindings,
  ...behaviorFailures,
]

const result = {
  generatedAt: new Date().toISOString(),
  nodeVersion: process.version,
  platform: process.platform,
  arch: process.arch,
  safety: {
    connectsToSupabase: false,
    readsEnvironmentSecrets: false,
    executesSql: false,
    callsProviders: false,
    rendersMedia: false,
    executesTools: false,
    executesWorkers: false,
    processesMedia: false,
    mutatesCredits: false,
    transfersStorage: false,
    createsSignedUrls: false,
    sendsTelemetry: false,
    deploys: false,
    mutatesSourceFiles: false,
  },
  files: {
    requiredDocs: requiredDocs.map((file) => ({ path: file, exists: fileExists(file) })),
    trackingFiles: trackingFiles.map((file) => ({ path: file, exists: fileExists(file) })),
  },
  behaviorChecks,
  findings: {
    missingFiles,
    dangerousAffirmations,
    forbiddenCommands,
    secretFindings,
    gateFindings,
    scenarioFindings,
    scorecardFindings,
    blockerFindings,
    behaviorFailures,
    criticalFindings,
  },
  summary: {
    filesScanned: docsForPatternScan.length,
    missingFileCount: missingFiles.length,
    dangerousAffirmationCount: dangerousAffirmations.length,
    forbiddenCommandCount: forbiddenCommands.length,
    secretFindingCount: secretFindings.length,
    gateFindingCount: gateFindings.length,
    scenarioFindingCount: scenarioFindings.length,
    scorecardFindingCount: scorecardFindings.length,
    blockerFindingCount: blockerFindings.length,
    behaviorFailureCount: behaviorFailures.length,
    criticalFindingCount: criticalFindings.length,
  },
  recommendation: criticalFindings.length === 0
    ? 'Prompt 18 E2E staging smoke plan passed static scope diagnostics.'
    : 'Fix Prompt 18 E2E staging smoke plan diagnostics before proceeding.',
}

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)

if (criticalFindings.length > 0) {
  process.exitCode = 1
}
