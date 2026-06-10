import { existsSync, readFileSync } from 'node:fs'

import { SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP } from '../../src/backend/mock/mock-supabase-sound-final-owner-evidence-rollup'
import { SUPABASE_SOUND_LOCAL_BASELINE_VALIDATION_RESULT } from '../../src/backend/mock/mock-supabase-sound-local-baseline-validation-result'

const reportPath = 'docs/supabase-sound-local-baseline-validation-report.md'
const activeMigrationPath = 'supabase/migrations/999_supabase_sound_local_fixture_records_draft.sql'
const scriptName = 'smoke:supabase-sound-local-baseline-validation-result'
const scriptCommand =
  'tsx server/smoke/supabase-sound-local-baseline-validation-result-smoke.ts'
const recommendedImmediateNextPrompt =
  'SUPABASE-SOUND-4-BASELINE-PLAN: define approved local baseline schema harness, no SQL'

const requiredOwners = [
  'SOUND_MUSIC_AUDIO',
  'SUPABASE_RLS_STORAGE_DATABASE',
  'WORKER_RUNTIME_JOBS',
  'PROVIDER_GATEWAY_MODELS',
  'OBSERVABILITY_AUDIT_COST',
  'BILLING_STRIPE_CREDITS',
  'TRACK_A_RENDER_EXPORT',
  'TRACK_B_MEDIA_PROCESSING',
] as const

function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

function requireText(source: string, text: string, message = `Missing required text: ${text}`): void {
  check(source.includes(text), message)
}

function assertNoConcreteForbiddenText(source: string, label: string): void {
  const lower = source.toLowerCase()
  check(!/^https?:\/\//im.test(source), `${label} must not contain concrete public URLs.`)
  check(!lower.includes('x-goog-signature'), `${label} must not contain signed URL signatures.`)
  check(!lower.includes('x-amz-signature'), `${label} must not contain signed URL signatures.`)
  check(!lower.includes('signature='), `${label} must not contain signed URL query values.`)
  check(!lower.includes('token='), `${label} must not contain tokenized URL values.`)
  check(!lower.includes('storage.googleapis.com'), `${label} must not contain storage public URLs.`)
  check(!lower.includes('gs://'), `${label} must not contain concrete storage URIs.`)
  check(!lower.includes('gcs://'), `${label} must not contain concrete storage URIs.`)
  check(!lower.includes('provider_secret'), `${label} must not contain provider secret fields.`)
  check(!lower.includes('providercredential'), `${label} must not contain provider credential markers.`)
  check(!lower.includes('service_role_key'), `${label} must not contain service-role key fields.`)
  check(!lower.includes('service-role key value'), `${label} must not contain service-role key values.`)
  check(!lower.includes('secret_value'), `${label} must not contain secret value fields.`)
  check(!lower.includes('api_key'), `${label} must not contain API key fields.`)
  check(!lower.includes('database_password'), `${label} must not contain database password fields.`)
  check(!lower.includes('db_password'), `${label} must not contain database password fields.`)
  check(!lower.includes('password='), `${label} must not contain database password values.`)
  check(!lower.includes('raw_worker_prompt'), `${label} must not contain raw worker prompt fields.`)
  check(!lower.includes('raw_provider_prompt'), `${label} must not contain raw provider prompt fields.`)
  check(!/akia[0-9a-z]{12,}/i.test(source), `${label} must not contain access key shapes.`)
  check(!/sk-[a-z0-9_-]{12,}/i.test(source), `${label} must not contain provider credential shapes.`)
}

function scanForbiddenValues(value: unknown, label: string): void {
  if (typeof value === 'string') {
    assertNoConcreteForbiddenText(value, label)
    return
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => scanForbiddenValues(item, `${label}[${index}]`))
    return
  }

  if (value && typeof value === 'object') {
    for (const [key, nestedValue] of Object.entries(value)) {
      assertNoConcreteForbiddenText(key, `${label}.${key}`)
      scanForbiddenValues(nestedValue, `${label}.${key}`)
    }
  }
}

check(existsSync(reportPath), 'Baseline validation report must exist.')
check(!existsSync(activeMigrationPath), 'No active 999 draft migration may exist under supabase/migrations.')

const report = readFileSync(reportPath, 'utf8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts?: Record<string, string>
}
const result = SUPABASE_SOUND_LOCAL_BASELINE_VALIDATION_RESULT

for (const required of [
  '# SUPABASE-SOUND-4-RETRY-BASELINE Local Baseline Validation Report',
  'Workstream owner: SUPABASE_RLS_STORAGE_DATABASE.',
  'Requesting workstream: SOUND_MUSIC_AUDIO.',
  'This document reports local throwaway baseline SQL validation only.',
  'No deployment occurred.',
  'No production or staging target was used.',
  'No live customer data was used.',
  'No generated_local_fixture_passed claim is made.',
  'Supabase row\n+ private GCS path\n+ manifest\n+ checksum\n+ approved plan snapshot',
  'user/chat request\n→ structured agent findings\n→ edit intents\n→ approved plan snapshot\n→ worker execution',
  'local target used: `reeditpro_sound_fixture_baseline_validation_throwaway`.',
  'host proof: local PostgreSQL responded on `::1/128` port `5432`.',
  'Supabase cloud avoided: yes.',
  '`supabase/migrations` untouched: yes.',
  'draft SQL/test files unchanged: yes.',
  'migration files discovered: 21.',
  'migration files attempted: 0.',
  'migration files succeeded: 0.',
  'approved_plan_snapshots exists after baseline: not attempted.',
  '`auth.users`: missing.',
  '`storage.buckets`: missing.',
  '`storage.objects`: missing.',
  'throwaway database created: yes.',
  'throwaway database dropped: yes.',
  'cleanup verified: yes.',
  'localBaselineValidationAttempted: false.',
  'localBaselineValidationPassed: false.',
  'baselineSchemaLoaded: blocked.',
  'draftMigrationPassed: blocked.',
  'draftTestsPassed: blocked.',
  'generatedLocalFixturePassedClaimed: false.',
  recommendedImmediateNextPrompt,
]) {
  requireText(report, required, `Report must include ${required}.`)
}

for (const owner of requiredOwners) {
  requireText(report, owner, `Report must include owner ${owner}.`)
  check(
    result.ownerEvidence.some(
      (entry) =>
        entry.owner === owner &&
        entry.conditionalNoExecutionAcceptance === true &&
        entry.executionAllowedNow === false,
    ),
    `Result must include owner ${owner}.`,
  )
}

check(
  packageJson.scripts?.[scriptName] === scriptCommand,
  `${scriptName} package script must equal ${scriptCommand}.`,
)

check(result.workstream === 'SUPABASE_RLS_STORAGE_DATABASE', 'Workstream must be Supabase.')
check(result.requestingWorkstream === 'SOUND_MUSIC_AUDIO', 'Requesting workstream must be SOUND.')
check(result.mode === 'local_baseline_validation_result', 'Mode must be local baseline result.')
check(result.currentUnlockStage === 'dry_run_passed', 'Current stage must be dry_run_passed.')
check(
  result.targetFutureUnlockStage === 'generated_local_fixture_passed',
  'Target stage must be generated_local_fixture_passed.',
)
check(result.claimsGeneratedLocalFixturePassed === false, 'Fixture pass must not be claimed.')
check(result.decision.localBaselineValidationAttempted === false, 'Baseline validation must be blocked.')
check(result.decision.localBaselineValidationPassed === false, 'Baseline validation must not pass.')
check(result.decision.baselineSchemaLoaded === 'blocked', 'Baseline schema load must be blocked.')
check(result.decision.draftMigrationPassed === 'blocked', 'Draft migration must be blocked.')
check(result.decision.draftTestsPassed === 'blocked', 'Draft tests must be blocked.')
check(
  result.decision.generatedLocalFixturePassedClaimed === false,
  'Decision must not claim generated_local_fixture_passed.',
)
check(
  result.decision.recommendedImmediateNextPrompt === recommendedImmediateNextPrompt,
  'Recommended next prompt must match.',
)

check(result.baseline.baselineMigrationFilesDiscovered === 21, 'Baseline should discover 21 real migration files.')
check(result.baseline.baselineMigrationFilesAttempted === 0, 'No migration files may be attempted.')
check(result.baseline.baselineMigrationFilesSucceeded === 0, 'No migration files may succeed.')
check(
  result.baseline.approvedPlanSnapshotsExistsAfterBaseline === 'not_attempted',
  'approved_plan_snapshots must be not attempted.',
)
for (const missing of ['auth.users', 'storage.buckets', 'storage.objects']) {
  check(
    result.baseline.missingPlatformPrerequisites.includes(missing),
    `Missing platform prerequisite ${missing} must be recorded.`,
  )
}

check(result.safety.localThrowawayOnly === true, 'Safety must be local throwaway only.')
check(result.safety.localMaintenanceProofQueriesExecuted === true, 'Maintenance proof queries must be recorded.')
check(result.safety.noDeploy === true, 'Safety must be no deploy.')
check(result.safety.noProduction === true, 'Safety must be no production.')
check(result.safety.noStaging === true, 'Safety must be no staging.')
check(result.safety.noLiveCustomerData === true, 'Safety must be no live customer data.')
check(result.safety.supabaseCloudTouched === false, 'Supabase cloud must not be touched.')
check(result.safety.supabaseMigrationsChanged === false, 'Supabase migrations must not change.')
check(result.safety.draftSqlFilesChanged === false, 'Draft SQL files must not change.')
check(result.safety.secretsExposed === false, 'Secrets must not be exposed.')

check(result.execution.sqlExecuted === true, 'Local proof SQL must be recorded.')
check(
  result.execution.sqlExecutedOnlyAgainstLocalThrowaway === true,
  'SQL must be local maintenance/throwaway only.',
)
check(result.execution.migrationDeployed === false, 'Migration must not be deployed.')
check(result.execution.supabaseCloudMutationPerformed === false, 'Supabase cloud mutation must not happen.')
check(result.execution.rowsCreatedInLiveDatabase === false, 'Live rows must not be created.')
check(result.execution.storageObjectsCreated === false, 'Storage objects must not be created.')
check(result.execution.signedUrlsCreated === false, 'Signed URLs must not be created.')
check(result.execution.providerCallsMade === false, 'Provider calls must not be made.')
check(result.execution.workersDispatched === false, 'Workers must not be dispatched.')
check(result.execution.generatedAudioCreated === false, 'Generated audio must not be created.')
check(result.execution.generatedAssetsCreated === false, 'Generated assets must not be created.')
check(result.execution.mediaProcessingRun === false, 'Media processing must not run.')
check(result.execution.renderRun === false, 'Render must not run.')
check(result.execution.muxRun === false, 'Mux must not run.')
check(result.execution.exportRun === false, 'Export must not run.')
check(result.execution.creditSpendOccurred === false, 'Credit spend must not occur.')
check(result.execution.publicArtifactsCreated === false, 'Public artifacts must not be created.')

check(result.cleanup.throwawayDatabaseCreated === true, 'Throwaway database must be created.')
check(result.cleanup.throwawayDatabaseDropped === true, 'Throwaway database must be dropped.')
check(result.cleanup.cleanupVerified === true, 'Cleanup must be verified.')

check(result.sourceOfTruthPath.requiresSupabaseRow === true, 'Source-of-truth path must require Supabase row.')
check(
  result.sourceOfTruthPath.requiresPrivateGcsPath === true,
  'Source-of-truth path must require private GCS path.',
)
check(result.sourceOfTruthPath.requiresManifest === true, 'Source-of-truth path must require manifest.')
check(result.sourceOfTruthPath.requiresChecksum === true, 'Source-of-truth path must require checksum.')
check(
  result.sourceOfTruthPath.requiresApprovedPlanSnapshot === true,
  'Source-of-truth path must require approved plan snapshot.',
)
check(
  result.sourceOfTruthPath.signedUrlsAreSourceOfTruth === false,
  'Signed URLs must not be source of truth.',
)
check(result.sourceOfTruthPath.publicUrlsAllowed === false, 'Public URLs must remain blocked.')
check(
  result.rawPromptRule.rawPromptDirectExecutionAllowed === false,
  'Raw prompt direct execution must remain blocked.',
)
check(
  result.rawPromptRule.requiresStructuredAgentFindings === true,
  'Structured findings must be required.',
)
check(result.rawPromptRule.requiresEditIntents === true, 'Edit intents must be required.')
check(
  result.rawPromptRule.requiresApprovedPlanSnapshot === true,
  'Approved plan snapshot must be required.',
)

check(
  SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.decision.goForSUPABASE_SOUND_4_PROPOSAL === true,
  'Prior rollup proposal must remain true.',
)
check(
  SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.decision.goForSUPABASE_SOUND_4_EXECUTION_NOW === false,
  'Prior rollup execution must remain false.',
)

assertNoConcreteForbiddenText(report, 'report')
scanForbiddenValues(result, 'SUPABASE_SOUND_LOCAL_BASELINE_VALIDATION_RESULT')

console.log(JSON.stringify({
  ok: true,
  workstream: result.workstream,
  requestingWorkstream: result.requestingWorkstream,
  smoke: 'supabase-sound-local-baseline-validation-result',
  mode: result.mode,
  localBaselineValidationAttempted: result.decision.localBaselineValidationAttempted,
  localBaselineValidationPassed: result.decision.localBaselineValidationPassed,
  baselineSchemaLoaded: result.decision.baselineSchemaLoaded,
  draftMigrationPassed: result.decision.draftMigrationPassed,
  claimsGeneratedLocalFixturePassed: result.claimsGeneratedLocalFixturePassed,
  sqlExecutedOnlyAgainstLocalThrowaway: result.execution.sqlExecutedOnlyAgainstLocalThrowaway,
  migrationDeployed: result.execution.migrationDeployed,
  supabaseCloudTouched: result.safety.supabaseCloudTouched,
  recommendedImmediateNextPrompt: result.decision.recommendedImmediateNextPrompt,
}))
