import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  SUPABASE_STAGING_DEPLOY_TRANSPORT_EXPECTED_REPORTS,
  SUPABASE_STAGING_DEPLOY_TRANSPORT_FORBIDDEN_CONFIRMATIONS,
  SUPABASE_STAGING_DEPLOY_TRANSPORT_REPORT_DIR,
  buildSupabaseStagingDeployTransportReports,
} from '../activation/supabase-milestone-registry-schema/milestone-registry-staging-deploy-transport'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function readAllFiles(dir: string): Array<{ file: string; text: string }> {
  const files: Array<{ file: string; text: string }> = []
  if (!existsSync(dir)) return files
  for (const name of readdirSync(dir)) {
    const fullPath = path.join(dir, name)
    if (statSync(fullPath).isDirectory()) files.push(...readAllFiles(fullPath))
    else files.push({ file: fullPath, text: readFileSync(fullPath, 'utf8') })
  }
  return files
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
for (const script of [
  'activation:supabase-staging-deploy-transport:plan',
  'activation:supabase-staging-deploy-transport:preflight',
  'activation:supabase-staging-deploy-transport:deploy',
  'activation:supabase-staging-deploy-transport:verify',
  'activation:supabase-staging-deploy-transport:report',
  'activation:supabase-staging-deploy-transport:summary',
  'smoke:activation-supabase-staging-deploy-transport',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

for (const file of [
  'server/activation/supabase-milestone-registry-schema/milestone-registry-staging-deploy-transport.ts',
  'server/cli/activation-supabase-staging-deploy-transport-plan.ts',
  'server/cli/activation-supabase-staging-deploy-transport-preflight.ts',
  'server/cli/activation-supabase-staging-deploy-transport-deploy.ts',
  'server/cli/activation-supabase-staging-deploy-transport-verify.ts',
  'server/cli/activation-supabase-staging-deploy-transport-report.ts',
  'server/cli/activation-supabase-staging-deploy-transport-summary.ts',
]) {
  assert(existsSync(file), `Missing transport file: ${file}`)
}

for (const file of [
  'docs/supabase-staging-deploy-transport-policy.md',
  'docs/supabase-staging-db-url-secret-reference-policy.md',
  'docs/supabase-staging-schema-deploy-transport-rerun.md',
  'docs/supabase-trackb-backfill-rerun-after-transport-deploy.md',
  'docs/implementation-prompts/prompt-supabase-trackb-staging-backfill-after-transport-deploy.md',
]) {
  assert(existsSync(file), `Missing transport doc: ${file}`)
}

assert(!existsSync('server/workers/supabase-staging-deploy-transport'), 'Transport phase must not add a worker.')

const moduleText = readFileSync(
  'server/activation/supabase-milestone-registry-schema/milestone-registry-staging-deploy-transport.ts',
  'utf8',
)
for (const required of [
  'REEDITPRO_STAGING_SUPABASE_DB_URL',
  'SUPABASE_STAGING_DB_URL',
  'STAGING_SUPABASE_DB_URL',
  'SUPABASE_DB_URL',
  'REEDITPRO_STAGING_SUPABASE_DB_URL_SECRET_REF',
  'SUPABASE_ACCESS_TOKEN_SECRET_REF',
  'REEDITPRO_CONFIRM_SUPABASE_CLI_NPX_ALLOWED',
  'REEDITPRO_CONFIRM_SUPABASE_TEMP_CLI_EXEC',
  'temp_npm_exec_supabase_cli',
  'temp_npm_exec_not_confirmed',
  'temp_npm_exec_supabase_cli_unavailable',
  'NPM_CONFIG_CACHE',
  'NPM_CONFIG_PREFIX',
  'supabase@latest',
  'npx_cli_db_push',
  '--dry-run',
  'gcloud',
  'secrets',
  'describe',
  'secretVersionAccessRun: false',
  'payloadAccessCommandRun: false',
  'directManualSqlAllowed: false',
  'trackBRowsWritten: false',
  'productionAffected: false',
  'credentialPayloadsPrinted: false',
  'secretPayloadsRead: false',
  'dbUrlTargetMatchedApprovedStaging',
  'staging_supabase_db_url_secret_payload_access_denied',
  'staging_supabase_db_url_secret_payload_invalid',
  'staging_db_url_target_ref_mismatch',
  'staging_db_url_target_unparseable',
  'staging_db_url_target_ref_missing',
]) {
  assert(moduleText.includes(required), `Transport module missing guard: ${required}`)
}

for (const forbidden of [
  'REEDITPRO_CONFIRM_SUPABASE_TRACKB_MILESTONE_STAGING_BACKFILL=true',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_METADATA_WRITE=true',
  'REEDITPRO_CONFIRM_SUPABASE_PRODUCTION_WRITE=true',
  'execute_sql',
  'supabase.from(',
  'secrets versions access',
  "'versions', 'access'",
  '"versions", "access"',
  'from "../track-a',
  'from "../../track-a',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'console.log(process.env',
  'npm install -g',
  '--global',
]) {
  assert(!moduleText.includes(forbidden), `Transport module must not include forbidden path/token: ${forbidden}`)
}

const savedEnv = new Map<string, string | undefined>()
for (const name of [
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_TARGET_PROOF',
  'REEDITPRO_CONFIRM_SUPABASE_PLUGIN_STAGING_TARGET_CHECK',
  'REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_SCHEMA_DEPLOY',
  'REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY_STAGING_VERIFY',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_SCHEMA_MUTATION',
  'REEDITPRO_CONFIRM_SUPABASE_CLI_NPX_ALLOWED',
  'REEDITPRO_CONFIRM_SUPABASE_TEMP_CLI_EXEC',
  'REEDITPRO_STAGING_SUPABASE_DB_URL_SECRET_PAYLOAD_ACCESS_STATUS',
  'REEDITPRO_STAGING_SUPABASE_DB_URL',
  'SUPABASE_STAGING_DB_URL',
  'STAGING_SUPABASE_DB_URL',
  ...SUPABASE_STAGING_DEPLOY_TRANSPORT_FORBIDDEN_CONFIRMATIONS,
]) {
  savedEnv.set(name, process.env[name])
  delete process.env[name]
}

const baselineReports = await buildSupabaseStagingDeployTransportReports()
const baselinePreflight = baselineReports.preflightReport as {
  status?: string
  tempNpmExecPreflightReport?: {
    status?: string
    npmExecAttempted?: boolean
    tempCliDownloadAttempted?: boolean
    repoDependencyInstalled?: boolean
    packageLockChanged?: boolean
    globalInstallAttempted?: boolean
    blockers?: string[]
    tempCachePolicy?: {
      cacheInsideRepo?: boolean
      prefixInsideRepo?: boolean
      repoDependencyInstalled?: boolean
      packageLockChanged?: boolean
      globalInstallAttempted?: boolean
    }
  }
  npxPreflightReport?: { status?: string; npxDownloadAttempted?: boolean; blockers?: string[] }
  secretReferenceGuardReport?: {
    blockers?: string[]
    dbUrlPayloadViewed?: boolean
    dbUrlValuePrinted?: boolean
    dbUrlTargetMatchedApprovedStaging?: boolean
    dbUrlTargetValidation?: { status?: string; dbUrlProvided?: boolean; dbUrlValuePrinted?: boolean }
  }
}
const baselineStrategy = baselineReports.strategyReport as {
  selectedStrategy?: string
  blockers?: string[]
  tempNpmExecSupabaseCli?: {
    available?: boolean
    requiresConfirmation?: string
    cachePolicy?: { cacheInsideRepo?: boolean; prefixInsideRepo?: boolean; packageLockChanged?: boolean }
  }
}
const baselineDeploy = baselineReports.schemaDeployTransportReport as {
  deployPerformed?: boolean
  dryRunPerformed?: boolean
  trackBRowsWritten?: boolean
  productionAffected?: boolean
  directManualSqlRun?: boolean
}
const baselineSecretDiscovery = baselineReports.secretReferenceDiscoveryReport as {
  payloadAccessCommandRun?: boolean
  secretVersionAccessRun?: boolean
  recommendedDbUrlSecretRef?: string | null
  optionalAccessTokenSecretRef?: string | null
}
const baselineSecretCandidates = baselineReports.secretReferenceCandidates as {
  selectedDbUrlCandidate?: string | null
  selectedDbUrlConfidence?: string | null
  recommendedEnvMapping?: {
    REEDITPRO_STAGING_SUPABASE_DB_URL_SECRET_REF?: string | null
    SUPABASE_ACCESS_TOKEN_SECRET_REF?: string | null
  }
  candidates?: Array<{
    secretName?: string
    candidateType?: string
    selectedForDbUrlEnvInjection?: boolean
    payloadViewed?: boolean
    secretValuesPrinted?: boolean
  }>
}
const baselineSecretReadiness = baselineReports.secretReferenceReadinessReport as {
  candidateDbUrlSecretRef?: string | null
  optionalAccessTokenSecretRef?: string | null
  payloadAccessCommandRun?: boolean
  supabaseSqlRun?: boolean
  migrationDeployment?: boolean
  trackBBackfillWrite?: boolean
}
assert(baselinePreflight.npxPreflightReport?.status === 'skipped', 'npx preflight must skip without confirmation.')
assert(baselinePreflight.npxPreflightReport?.npxDownloadAttempted === false, 'npx must not download without confirmation.')
assert(
  baselinePreflight.tempNpmExecPreflightReport?.status === 'skipped' &&
    baselinePreflight.tempNpmExecPreflightReport.npmExecAttempted === false &&
    baselinePreflight.tempNpmExecPreflightReport.tempCliDownloadAttempted === false,
  'Temp npm exec preflight must skip without confirmation.',
)
assert(
  baselinePreflight.tempNpmExecPreflightReport?.blockers?.includes('temp_npm_exec_not_confirmed'),
  'Temp npm exec preflight must record the explicit confirmation blocker.',
)
assert(
  baselinePreflight.tempNpmExecPreflightReport?.repoDependencyInstalled === false &&
    baselinePreflight.tempNpmExecPreflightReport.packageLockChanged === false &&
    baselinePreflight.tempNpmExecPreflightReport.globalInstallAttempted === false,
  'Temp npm exec preflight must not install repo dependencies, change package-lock, or use global install.',
)
assert(
  baselinePreflight.tempNpmExecPreflightReport?.tempCachePolicy?.cacheInsideRepo === false &&
    baselinePreflight.tempNpmExecPreflightReport.tempCachePolicy.prefixInsideRepo === false &&
    baselinePreflight.tempNpmExecPreflightReport.tempCachePolicy.packageLockChanged === false,
  'Temp npm exec cache and prefix must stay outside the repo.',
)
assert(
  baselinePreflight.secretReferenceGuardReport?.dbUrlPayloadViewed === false &&
    baselinePreflight.secretReferenceGuardReport?.dbUrlValuePrinted === false,
  'DB URL guard must not view or print payloads.',
)
assert(
  baselinePreflight.secretReferenceGuardReport?.dbUrlTargetValidation?.status === 'skipped' &&
    baselinePreflight.secretReferenceGuardReport.dbUrlTargetValidation.dbUrlProvided === false,
  'DB URL target validation must skip safely when no DB URL reference is present.',
)
assert(
  baselinePreflight.secretReferenceGuardReport?.dbUrlTargetMatchedApprovedStaging === false,
  'Missing DB URL must not be reported as matching approved staging.',
)
assert(
  baselineStrategy.selectedStrategy === 'blocked_target_not_staging' ||
    baselineStrategy.selectedStrategy === 'blocked_credentials_unavailable' ||
    baselineStrategy.selectedStrategy === 'blocked_no_migration_safe_deploy_path',
  `Unexpected baseline strategy: ${baselineStrategy.selectedStrategy}`,
)
assert(
  baselineStrategy.tempNpmExecSupabaseCli?.available === false &&
    baselineStrategy.tempNpmExecSupabaseCli.requiresConfirmation === 'REEDITPRO_CONFIRM_SUPABASE_TEMP_CLI_EXEC' &&
    baselineStrategy.tempNpmExecSupabaseCli.cachePolicy?.cacheInsideRepo === false &&
    baselineStrategy.tempNpmExecSupabaseCli.cachePolicy.prefixInsideRepo === false,
  'Strategy report must expose the gated temp npm exec fallback without selecting it by default.',
)
assert(baselineDeploy.deployPerformed === false, 'Smoke must not deploy.')
assert(baselineDeploy.dryRunPerformed === false, 'Smoke must not run dry-run.')
assert(baselineDeploy.trackBRowsWritten === false, 'Smoke must not write Track B rows.')
assert(baselineDeploy.productionAffected === false, 'Smoke must not affect production.')
assert(baselineDeploy.directManualSqlRun === false, 'Smoke must not run direct/manual SQL.')
assert(baselineSecretDiscovery.payloadAccessCommandRun === false, 'Secret Manager discovery must not access payloads.')
assert(baselineSecretDiscovery.secretVersionAccessRun === false, 'Secret Manager discovery must not run secret-version access.')
assert(
  baselineSecretDiscovery.recommendedDbUrlSecretRef === 'SUPABASE_DB_URL',
  'Secret Manager discovery must classify SUPABASE_DB_URL as the candidate DB URL ref.',
)
assert(
  baselineSecretDiscovery.optionalAccessTokenSecretRef === null,
  'Secret Manager discovery should record no optional Supabase access-token candidate when none is present.',
)
assert(
  baselineSecretCandidates.selectedDbUrlCandidate === 'SUPABASE_DB_URL' &&
    baselineSecretCandidates.selectedDbUrlConfidence === 'medium',
  'Secret Manager candidates must select SUPABASE_DB_URL with medium confidence until staging label/operator injection is present.',
)
assert(
  baselineSecretCandidates.recommendedEnvMapping?.REEDITPRO_STAGING_SUPABASE_DB_URL_SECRET_REF === 'SUPABASE_DB_URL' &&
    baselineSecretCandidates.recommendedEnvMapping?.SUPABASE_ACCESS_TOKEN_SECRET_REF === null,
  'Secret Manager report must emit reference-name-only env mapping.',
)
const candidateTypesByName = new Map(
  (baselineSecretCandidates.candidates ?? []).map((candidate) => [candidate.secretName, candidate]),
)
assert(
  candidateTypesByName.get('SUPABASE_URL')?.candidateType === 'supabase_project_url_not_db_url',
  'SUPABASE_URL must be classified as a project URL, not a deploy DB URL.',
)
assert(
  candidateTypesByName.get('SUPABASE_SERVICE_ROLE_KEY')?.candidateType === 'service_role_key_not_db_url',
  'SUPABASE_SERVICE_ROLE_KEY must not be treated as a deploy DB URL.',
)
assert(
  (baselineSecretCandidates.candidates ?? []).every(
    (candidate) => candidate.payloadViewed === false && candidate.secretValuesPrinted === false,
  ),
  'Secret Manager candidates must record names only, never payloads.',
)
assert(baselineSecretReadiness.payloadAccessCommandRun === false, 'Secret readiness must not access payloads.')
assert(baselineSecretReadiness.supabaseSqlRun === false, 'Secret readiness must not run Supabase SQL.')
assert(baselineSecretReadiness.migrationDeployment === false, 'Secret readiness must not deploy migrations.')
assert(baselineSecretReadiness.trackBBackfillWrite === false, 'Secret readiness must not write Track B backfill rows.')

process.env.REEDITPRO_CONFIRM_SUPABASE_STAGING_TARGET_PROOF = 'true'
process.env.REEDITPRO_CONFIRM_SUPABASE_PLUGIN_STAGING_TARGET_CHECK = 'true'
const proofReports = await buildSupabaseStagingDeployTransportReports()
const proofPreflight = proofReports.preflightReport as {
  pluginTargetProofReport?: { stagingTargetConfirmed?: boolean }
  secretReferenceGuardReport?: { blockers?: string[] }
}
const proofStrategy = proofReports.strategyReport as { selectedStrategy?: string; blockers?: string[] }
assert(proofPreflight.pluginTargetProofReport?.stagingTargetConfirmed === true, 'Target proof should pass with approved proof confirmations.')
assert(
  proofPreflight.secretReferenceGuardReport?.blockers?.includes('staging_supabase_db_url_secret_reference_missing'),
  'Missing DB URL secret reference must block transport.',
)
assert(
  proofStrategy.selectedStrategy === 'blocked_credentials_unavailable' ||
    proofStrategy.selectedStrategy === 'blocked_no_migration_safe_deploy_path',
  `Proof-confirmed strategy must remain blocked without DB URL/CLI transport, saw ${proofStrategy.selectedStrategy}`,
)

process.env.REEDITPRO_STAGING_SUPABASE_DB_URL = [
  'postgresql',
  '://',
  'postgres',
  '.',
  'wmyyttnynmteqgcdishd',
  ':redacted@aws-0-us-central1.pooler.supabase.com:6543/postgres',
].join('')
const matchingDbUrlReports = await buildSupabaseStagingDeployTransportReports()
const matchingPreflight = matchingDbUrlReports.preflightReport as {
  secretReferenceGuardReport?: {
    status?: string
    selectedDbUrlReferenceName?: string
    dbUrlValuePrinted?: boolean
    credentialPayloadsPrinted?: boolean
    productionTargetSelected?: boolean
    dbUrlTargetMatchedApprovedStaging?: boolean
    dbUrlTargetValidation?: {
      status?: string
      dbUrlParsedInMemory?: boolean
      dbUrlValuePrinted?: boolean
      hostnamePrinted?: boolean
      usernamePrinted?: boolean
      passwordPrinted?: boolean
      dbUrlTargetMatchedApprovedStaging?: boolean
      poolerUsernamePatternRecognized?: boolean
      blockers?: string[]
    }
  }
}
assert(
  matchingPreflight.secretReferenceGuardReport?.status === 'passed',
  'Synthetic matching staging DB URL should pass the redacted secret-reference guard.',
)
assert(
  matchingPreflight.secretReferenceGuardReport?.selectedDbUrlReferenceName === 'REEDITPRO_STAGING_SUPABASE_DB_URL',
  'Synthetic matching DB URL should select the approved env reference name only.',
)
assert(
  matchingPreflight.secretReferenceGuardReport?.dbUrlTargetMatchedApprovedStaging === true &&
    matchingPreflight.secretReferenceGuardReport.dbUrlTargetValidation?.dbUrlTargetMatchedApprovedStaging === true,
  'Synthetic matching DB URL should match the approved staging project ref.',
)
assert(
  matchingPreflight.secretReferenceGuardReport?.dbUrlValuePrinted === false &&
    matchingPreflight.secretReferenceGuardReport.credentialPayloadsPrinted === false &&
    matchingPreflight.secretReferenceGuardReport.productionTargetSelected === false &&
    matchingPreflight.secretReferenceGuardReport.dbUrlTargetValidation?.hostnamePrinted === false &&
    matchingPreflight.secretReferenceGuardReport.dbUrlTargetValidation.usernamePrinted === false &&
    matchingPreflight.secretReferenceGuardReport.dbUrlTargetValidation.passwordPrinted === false,
  'Synthetic matching DB URL validation must report only redacted target status.',
)
assert(
  matchingPreflight.secretReferenceGuardReport?.dbUrlTargetValidation?.poolerUsernamePatternRecognized === true,
  'Synthetic pooler DB URL should be recognized through the username project-ref pattern.',
)

process.env.REEDITPRO_STAGING_SUPABASE_DB_URL = [
  'postgresql',
  '://',
  'postgres',
  '.',
  'aaaaaaaaaaaaaaaaaaaa',
  ':redacted@aws-0-us-central1.pooler.supabase.com:6543/postgres',
].join('')
const mismatchedDbUrlReports = await buildSupabaseStagingDeployTransportReports()
const mismatchedPreflight = mismatchedDbUrlReports.preflightReport as {
  secretReferenceGuardReport?: {
    status?: string
    dbUrlTargetMatchedApprovedStaging?: boolean
    blockers?: string[]
    dbUrlTargetValidation?: { blockers?: string[]; dbUrlValuePrinted?: boolean }
  }
}
assert(
  mismatchedPreflight.secretReferenceGuardReport?.status === 'blocked' &&
    mismatchedPreflight.secretReferenceGuardReport.dbUrlTargetMatchedApprovedStaging === false,
  'Synthetic mismatched DB URL must block before deploy.',
)
assert(
  mismatchedPreflight.secretReferenceGuardReport?.blockers?.includes('staging_db_url_target_ref_mismatch') &&
    mismatchedPreflight.secretReferenceGuardReport.dbUrlTargetValidation?.blockers?.includes(
      'staging_db_url_target_ref_mismatch',
    ),
  'Synthetic mismatched DB URL must report the redacted target-ref mismatch blocker.',
)
assert(
  mismatchedPreflight.secretReferenceGuardReport?.dbUrlTargetValidation?.dbUrlValuePrinted === false,
  'Synthetic mismatched DB URL must not print the URL value.',
)

for (const [name, value] of savedEnv) {
  if (value === undefined) delete process.env[name]
  else process.env[name] = value
}

for (const report of SUPABASE_STAGING_DEPLOY_TRANSPORT_EXPECTED_REPORTS) {
  assert(existsSync(path.join(SUPABASE_STAGING_DEPLOY_TRANSPORT_REPORT_DIR, report)), `Missing transport report: ${report}`)
}

const reportText = readAllFiles(SUPABASE_STAGING_DEPLOY_TRANSPORT_REPORT_DIR).map(({ text }) => text).join('\n')
for (const forbidden of [
  'BEGIN PRIVATE KEY',
  'postgres://',
  'postgresql://',
  '"serviceRoleKey":',
  '"secretValue"',
  '"signedUrl"',
  'postgres.wmyyttnynmteqgcdishd',
  'postgres.aaaaaaaaaaaaaaaaaaaa',
  'secrets versions access',
  'gcloud secrets versions',
  'private-user-images.githubusercontent.com',
]) {
  assert(!reportText.includes(forbidden), `Transport reports must not include forbidden payload: ${forbidden}`)
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'supabase-staging-deploy-transport-rerun',
  reportDir: SUPABASE_STAGING_DEPLOY_TRANSPORT_REPORT_DIR,
  expectedReports: SUPABASE_STAGING_DEPLOY_TRANSPORT_EXPECTED_REPORTS.length,
  npxSkippedWithoutConfirmation: true,
  tempNpmExecSkippedWithoutConfirmation: true,
  targetProofPassesWithAllowedConfirmations: true,
  secretManagerCandidateDbUrlRef: 'SUPABASE_DB_URL',
  secretManagerAccessTokenCandidate: null,
  secretManagerPayloadAccess: false,
  syntheticMatchingDbUrlTargetCheck: true,
  syntheticMismatchedDbUrlBlocks: true,
  deployPerformed: false,
  trackBRowsWritten: false,
  productionAffected: false,
  directManualSqlRun: false,
  trackA: 'not_touched',
}, null, 2))
