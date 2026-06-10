import { existsSync, readFileSync } from 'node:fs'

import { SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP } from '../../src/backend/mock/mock-supabase-sound-final-owner-evidence-rollup'
import { SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RETRY_RESULT } from '../../src/backend/mock/mock-supabase-sound-local-throwaway-validation-retry-result'

const retryReportPath = 'docs/supabase-sound-local-throwaway-validation-retry-report.md'
const setupPlanPath = 'docs/supabase-sound-local-throwaway-db-setup-plan.md'
const finalRollupDocPath = 'docs/supabase-sound-final-owner-evidence-rollup.md'
const activeMigrationPath = 'supabase/migrations/999_supabase_sound_local_fixture_records_draft.sql'
const scriptName = 'smoke:supabase-sound-local-throwaway-validation-retry-result'
const scriptCommand =
  'tsx server/smoke/supabase-sound-local-throwaway-validation-retry-result-smoke.ts'
const recommendedImmediateNextPrompt =
  'SUPABASE-SOUND-4-FIX: fix draft migration/test SQL based on local validation output, no deploy'

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
  check(!lower.includes('raw_prompt'), `${label} must not contain raw prompt fields.`)
  check(!lower.includes('raw_worker_prompt'), `${label} must not contain raw worker prompt fields.`)
  check(!lower.includes('supabasecloudmutationperformed: true'), `${label} must not contain cloud mutation markers.`)
  check(!lower.includes('migrationdeployed: true'), `${label} must not contain migration deploy markers.`)
  check(!lower.includes('rowscreatedinlivedatabase: true'), `${label} must not contain live row markers.`)
  check(!lower.includes('storageobjectscreated: true'), `${label} must not contain storage object markers.`)
  check(!lower.includes('signedurlscreated: true'), `${label} must not contain signed URL markers.`)
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

check(existsSync(retryReportPath), 'Retry validation report must exist.')
check(existsSync(setupPlanPath), 'Setup plan doc must exist.')
check(existsSync(finalRollupDocPath), 'Final owner evidence rollup doc must exist.')
check(!existsSync(activeMigrationPath), 'No active migration for this draft may exist under supabase/migrations.')

const retryReport = readFileSync(retryReportPath, 'utf8')
const setupPlan = readFileSync(setupPlanPath, 'utf8')
const finalRollupDoc = readFileSync(finalRollupDocPath, 'utf8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts?: Record<string, string>
}

for (const required of [
  '# SUPABASE-SOUND-4-RETRY Local Throwaway Validation Report',
  'Workstream owner: SUPABASE_RLS_STORAGE_DATABASE.',
  'Requesting workstream: SOUND_MUSIC_AUDIO.',
  'This document reports local throwaway SQL validation only.',
  'No deployment occurred.',
  'No production or staging target was used.',
  'No live customer data was used.',
  'No generated_local_fixture_passed claim is made.',
  'Supabase row\n+ private GCS path\n+ manifest\n+ checksum\n+ approved plan snapshot',
  'user/chat request\n→ structured agent findings\n→ edit intents\n→ approved plan snapshot\n→ worker execution',
  'local target used: `reeditpro_sound_fixture_validation_throwaway`.',
  'host proof: local PostgreSQL responded on `::1/128` port `5432`.',
  'database name proof: the target name includes `throwaway` and `sound_fixture_validation`.',
  'Supabase cloud avoided: yes.',
  '`supabase/migrations` untouched: yes.',
  'draft SQL/test files unchanged: yes.',
  'executed: yes, against local throwaway database only.',
  'result: failed.',
  'relation "public.approved_plan_snapshots" does not exist',
  'executed: no.',
  'result: blocked.',
  'throwaway database created: yes.',
  'throwaway database dropped: yes.',
  'cleanup verified: yes.',
  'provider calls: false.',
  'worker dispatch: false.',
  'Supabase cloud mutation: false.',
  'storage writes: false.',
  'signed URLs: false.',
  'generated audio/assets: false.',
  'media processing: false.',
  'render/export: false.',
  'credit spend/reservation: false.',
  'localValidationAttempted: true.',
  'localValidationPassed: false.',
  'draftMigrationPassed: false.',
  'draftTestsPassed: blocked.',
  'generatedLocalFixturePassedClaimed: false.',
  recommendedImmediateNextPrompt,
]) {
  requireText(retryReport, required, `Retry report must include ${required}.`)
}

for (const owner of requiredOwners) {
  requireText(retryReport, owner, `Retry report must include owner ${owner}.`)
  check(
    SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RETRY_RESULT.ownerEvidence.some(
      (entry) => entry.owner === owner && entry.conditionalNoExecutionAcceptance,
    ),
    `Retry result must include owner ${owner}.`,
  )
}

check(
  packageJson.scripts?.[scriptName] === scriptCommand,
  `${scriptName} package script must equal ${scriptCommand}.`,
)

const retryResult = SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RETRY_RESULT
check(retryResult.workstream === 'SUPABASE_RLS_STORAGE_DATABASE', 'Workstream must be Supabase.')
check(retryResult.requestingWorkstream === 'SOUND_MUSIC_AUDIO', 'Requesting workstream must be SOUND.')
check(retryResult.mode === 'local_throwaway_validation_retry_result', 'Mode must be retry result.')
check(retryResult.claimsGeneratedLocalFixturePassed === false, 'generated_local_fixture_passed must not be claimed.')
check(retryResult.decision.localValidationAttempted === true, 'Local validation must be attempted.')
check(retryResult.decision.localValidationPassed === false, 'Local validation must fail for this result.')
check(retryResult.decision.draftMigrationPassed === false, 'Draft migration must fail.')
check(retryResult.decision.draftTestsPassed === 'blocked', 'Draft tests must be blocked.')
check(
  retryResult.decision.generatedLocalFixturePassedClaimed === false,
  'Decision must not claim generated_local_fixture_passed.',
)
check(
  retryResult.decision.recommendedImmediateNextPrompt === recommendedImmediateNextPrompt,
  'Recommended next prompt must match.',
)

check(retryResult.safety.localThrowawayOnly === true, 'Safety must require local throwaway only.')
check(retryResult.safety.noDeploy === true, 'Safety must be no deploy.')
check(retryResult.safety.noProduction === true, 'Safety must be no production.')
check(retryResult.safety.noStaging === true, 'Safety must be no staging.')
check(retryResult.safety.noLiveCustomerData === true, 'Safety must be no live customer data.')
check(retryResult.safety.supabaseCloudTouched === false, 'Supabase cloud must not be touched.')
check(retryResult.safety.supabaseMigrationsChanged === false, 'Supabase migrations must not change.')
check(retryResult.safety.draftSqlFilesChanged === false, 'Draft SQL files must not change.')
check(retryResult.safety.secretsExposed === false, 'Secrets must not be exposed.')
check(retryResult.safety.localTargetVerified === true, 'Local target must be verified.')
check(
  retryResult.safety.throwawayDatabaseName === 'reeditpro_sound_fixture_validation_throwaway',
  'Throwaway database name must match.',
)

check(retryResult.execution.sqlExecuted === true, 'SQL must be recorded as executed.')
check(
  retryResult.execution.sqlExecutedOnlyAgainstLocalThrowaway === true,
  'SQL must be local throwaway only.',
)
check(retryResult.execution.migrationDeployed === false, 'Migration must not be deployed.')
check(
  retryResult.execution.supabaseCloudMutationPerformed === false,
  'Supabase cloud mutation must not happen.',
)
check(retryResult.execution.rowsCreatedInLiveDatabase === false, 'Live rows must not be created.')
check(retryResult.execution.storageObjectsCreated === false, 'Storage objects must not be created.')
check(retryResult.execution.signedUrlsCreated === false, 'Signed URLs must not be created.')
check(retryResult.execution.providerCallsMade === false, 'Provider calls must not be made.')
check(retryResult.execution.workersDispatched === false, 'Workers must not be dispatched.')
check(retryResult.execution.generatedAudioCreated === false, 'Generated audio must not be created.')
check(retryResult.execution.generatedAssetsCreated === false, 'Generated assets must not be created.')
check(retryResult.execution.mediaProcessingRun === false, 'Media processing must not run.')
check(retryResult.execution.renderRun === false, 'Render must not run.')
check(retryResult.execution.muxRun === false, 'Mux must not run.')
check(retryResult.execution.exportRun === false, 'Export must not run.')
check(retryResult.execution.creditSpendOccurred === false, 'Credit spend must not occur.')
check(retryResult.execution.publicArtifactsCreated === false, 'Public artifacts must not be created.')

check(
  retryResult.validation.draftMigrationErrorSummary ===
    'relation "public.approved_plan_snapshots" does not exist',
  'Draft migration error summary must match.',
)
check(retryResult.cleanup.throwawayDatabaseCreated === true, 'Throwaway database must be created.')
check(retryResult.cleanup.throwawayDatabaseDropped === true, 'Throwaway database must be dropped.')
check(retryResult.cleanup.cleanupVerified === true, 'Cleanup must be verified.')

check(retryResult.sourceOfTruthPath.requiresSupabaseRow === true, 'Source-of-truth path must require Supabase row.')
check(
  retryResult.sourceOfTruthPath.requiresPrivateGcsPath === true,
  'Source-of-truth path must require private GCS path.',
)
check(retryResult.sourceOfTruthPath.requiresManifest === true, 'Source-of-truth path must require manifest.')
check(retryResult.sourceOfTruthPath.requiresChecksum === true, 'Source-of-truth path must require checksum.')
check(
  retryResult.sourceOfTruthPath.requiresApprovedPlanSnapshot === true,
  'Source-of-truth path must require approved snapshot.',
)
check(
  retryResult.sourceOfTruthPath.signedUrlsAreSourceOfTruth === false,
  'Signed URLs must not be source of truth.',
)
check(retryResult.sourceOfTruthPath.publicUrlsAllowed === false, 'Public URLs must remain blocked.')
check(
  retryResult.rawPromptRule.rawPromptDirectExecutionAllowed === false,
  'Raw prompt execution must remain blocked.',
)

check(
  SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.decision.goForSUPABASE_SOUND_4_PROPOSAL === true,
  'Prior rollup proposal must remain true.',
)
check(
  SUPABASE_SOUND_FINAL_OWNER_EVIDENCE_ROLLUP.decision.goForSUPABASE_SOUND_4_EXECUTION_NOW === false,
  'Prior rollup execution must remain false.',
)

assertNoConcreteForbiddenText(retryReport, 'retryReport')
assertNoConcreteForbiddenText(setupPlan, 'setupPlan')
assertNoConcreteForbiddenText(finalRollupDoc, 'finalRollupDoc')
scanForbiddenValues(retryResult, 'SUPABASE_SOUND_LOCAL_THROWAWAY_VALIDATION_RETRY_RESULT')

console.log(JSON.stringify({
  ok: true,
  workstream: retryResult.workstream,
  requestingWorkstream: retryResult.requestingWorkstream,
  smoke: 'supabase-sound-local-throwaway-validation-retry-result',
  mode: retryResult.mode,
  localValidationAttempted: retryResult.decision.localValidationAttempted,
  localValidationPassed: retryResult.decision.localValidationPassed,
  claimsGeneratedLocalFixturePassed: retryResult.claimsGeneratedLocalFixturePassed,
  sqlExecutedOnlyAgainstLocalThrowaway: retryResult.execution.sqlExecutedOnlyAgainstLocalThrowaway,
  migrationDeployed: retryResult.execution.migrationDeployed,
  supabaseCloudTouched: retryResult.safety.supabaseCloudTouched,
  cleanupVerified: retryResult.cleanup.cleanupVerified,
  recommendedImmediateNextPrompt: retryResult.decision.recommendedImmediateNextPrompt,
}))
