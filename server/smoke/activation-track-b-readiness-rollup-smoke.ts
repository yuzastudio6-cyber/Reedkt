import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  TRACK_B_READINESS_ROLLUP_EXPECTED_REPORTS,
  TRACK_B_READINESS_ROLLUP_REPORT_DIR,
  buildTrackBReadinessRollupReports,
} from '../activation/track-b-readiness-rollup'
import { TRACK_B_TOOL_IDS } from '../activation/track-b-capability-manifests/track-b-tool-registry'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function readAllFiles(dir: string): Array<{ file: string; text: string }> {
  const entries: Array<{ file: string; text: string }> = []
  for (const name of readdirSync(dir)) {
    const fullPath = path.join(dir, name)
    if (statSync(fullPath).isDirectory()) entries.push(...readAllFiles(fullPath))
    else entries.push({ file: fullPath, text: readFileSync(fullPath, 'utf8') })
  }
  return entries
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }

for (const script of [
  'activation:track-b-readiness-rollup:plan',
  'activation:track-b-readiness-rollup',
  'activation:track-b-readiness-rollup:report',
  'activation:track-b-readiness-rollup:summary',
  'activation:track-b-readiness-rollup:iam-plan',
  'activation:track-b-readiness-rollup:cost-summary',
  'smoke:activation-track-b-readiness-rollup',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

assert(existsSync('server/activation/track-b-readiness-rollup'), 'Phase 44P activation module missing.')
assert(!existsSync('server/workers/track-b-readiness-rollup'), 'Phase 44P must not add a worker.')
assert(TRACK_B_READINESS_ROLLUP_REPORT_DIR === 'docs/activation-track-b-readiness-rollup-reports', 'Unexpected Phase 44P report directory.')
assert(TRACK_B_READINESS_ROLLUP_EXPECTED_REPORTS.length === 13, 'Phase 44P expected report list must include the 13 required JSON reports.')
for (const report of TRACK_B_READINESS_ROLLUP_EXPECTED_REPORTS) {
  assert(existsSync(path.join(TRACK_B_READINESS_ROLLUP_REPORT_DIR, report)), `Missing Phase 44P report: ${report}`)
}

for (const doc of [
  'docs/track-b-readiness-rollup.md',
  'docs/track-b-supabase-milestone-export.md',
  'docs/track-b-next-phase-recommendation.md',
  'docs/track-b-blocked-scope-rollup.md',
  'docs/implementation-prompts/prompt-track-b-supabase-milestone-staging-backfill.md',
]) {
  assert(existsSync(doc), `Missing Phase 44P doc: ${doc}`)
}

for (const { file, text } of readAllFiles('server/activation/track-b-readiness-rollup')) {
  assert(!text.includes("from 'node:child_process'"), `Phase 44P must not import child_process: ${file}`)
  assert(!text.includes('spawn('), `Phase 44P must not spawn processes: ${file}`)
  assert(!text.includes('spawnSync('), `Phase 44P must not spawn processes: ${file}`)
  assert(!text.includes('execFile'), `Phase 44P must not execute commands: ${file}`)
  assert(!text.includes('fetch('), `Phase 44P must not make network calls: ${file}`)
  assert(!/from ['"].*track-a/i.test(text), `Phase 44P must not import Track A: ${file}`)
  assert(!/from ['"].*supabase/i.test(text), `Phase 44P must not import Supabase clients or sync code: ${file}`)
  assert(!text.includes('createClient('), `Phase 44P must not create Supabase clients: ${file}`)
  assert(!text.includes('SUPABASE_SERVICE_ROLE_KEY'), `Phase 44P must not reference service-role env vars: ${file}`)
  assert(!text.includes('OPENAI_API_KEY'), `Phase 44P must not reference provider env vars: ${file}`)
  assert(!text.includes('ANTHROPIC_API_KEY'), `Phase 44P must not reference provider env vars: ${file}`)
}

const reports = buildTrackBReadinessRollupReports()
const toolRollup = reports.toolStatusRollup as {
  status?: string
  totalTools?: number
  missingToolIds?: string[]
  tools?: Array<{
    toolId: string
    currentStatus: string
    internalReady: boolean
    supabaseExportEligible: boolean
    blockedScope: string[]
  }>
}
assert(toolRollup.status === 'passed', 'Tool status rollup must pass.')
assert(toolRollup.totalTools === 18, 'Tool status rollup must include exactly 18 tools.')
assert((toolRollup.missingToolIds ?? []).length === 0, 'Tool status rollup must not miss canonical tool ids.')
for (const toolId of TRACK_B_TOOL_IDS) {
  assert(toolRollup.tools?.some((tool) => tool.toolId === toolId), `Missing tool status rollup entry: ${toolId}`)
}

const demucs = toolRollup.tools?.find((tool) => tool.toolId === 'demucs')
assert(demucs?.currentStatus === 'blocked_pending_training_data_provenance', 'Demucs must remain blocked pending provenance.')
assert(demucs?.internalReady === false, 'Demucs must not be internally ready.')
assert(demucs?.blockedScope.includes('model_download'), 'Demucs model download must be blocked.')

for (const toolId of ['qwen3_vl', 'vllm']) {
  const vlm = toolRollup.tools?.find((tool) => tool.toolId === toolId)
  assert(vlm?.currentStatus === 'excluded_for_initial_internal_testing', `${toolId} must remain excluded.`)
  assert(vlm?.internalReady === false, `${toolId} must not be internally ready.`)
}

const exportReport = reports.supabaseMilestoneExport as {
  supabaseWritePerformed?: boolean
  remoteSqlRun?: boolean
  migrationDeployment?: boolean
  records?: Array<Record<string, unknown>>
}
assert(exportReport.supabaseWritePerformed === false, 'Supabase write must not run.')
assert(exportReport.remoteSqlRun === false, 'Remote SQL must not run.')
assert(exportReport.migrationDeployment === false, 'Migration deployment must not run.')
assert((exportReport.records ?? []).length >= 29, 'Supabase milestone export must include the requested Track B evidence records.')

const recordText = JSON.stringify(exportReport.records)
for (const forbiddenKey of ['serviceRoleKey', 'providerKey', 'signedUrl', 'rawPayload', 'userPii', 'secretValue']) {
  assert(!recordText.includes(forbiddenKey), `Supabase export records must not include forbidden payload key: ${forbiddenKey}`)
}
assert(!recordText.includes('private-user-images.githubusercontent.com'), 'Supabase export records must not include private image URLs.')
assert(!recordText.includes('BEGIN PRIVATE KEY'), 'Supabase export records must not include private keys.')

const schema = reports.supabaseMilestoneExportSchema as { policy?: { forbids?: string[]; noSupabaseWriteInPhase44P?: boolean } }
for (const requiredForbidden of ['service_role_key', 'provider_key', 'signed_url', 'raw_media_payload', 'raw_audio_payload', 'model_weight_payload', 'user_pii']) {
  assert(schema.policy?.forbids?.includes(requiredForbidden), `Schema must forbid ${requiredForbidden}.`)
}
assert(schema.policy?.noSupabaseWriteInPhase44P === true, 'Schema must record no Supabase write in Phase 44P.')

const routeDryRun = reports.routeDryRunStatusRollup as {
  status?: string
  liveRouteExecution?: string
  workerExecution?: string
  sidecarExecution?: string
  toolRuntimeExecution?: string
  phase44oMetadataDryRun?: { status?: string; executionPerformed?: boolean; routeExecutionPerformed?: boolean }
}
assert(routeDryRun.status === 'passed', 'Route dry-run rollup must pass.')
assert(routeDryRun.phase44oMetadataDryRun?.status === 'passed', 'Phase 44O metadata route dry-run evidence must pass.')
assert(routeDryRun.phase44oMetadataDryRun?.executionPerformed === false, 'Phase 44O must remain metadata-only.')
assert(routeDryRun.phase44oMetadataDryRun?.routeExecutionPerformed === false, 'Phase 44O route execution must remain false.')
assert(routeDryRun.liveRouteExecution === 'blocked', 'Live route execution must remain blocked.')
assert(routeDryRun.workerExecution === 'blocked', 'Worker execution must remain blocked.')
assert(routeDryRun.sidecarExecution === 'blocked', 'Sidecar execution must remain blocked.')
assert(routeDryRun.toolRuntimeExecution === 'blocked', 'Tool runtime execution must remain blocked.')

const readinessReport = reports.readinessRollupReport as {
  status?: string
  production?: string
  externalBeta?: string
  paidProduction?: string
  trackA?: string
  routeExecution?: string
  workerExecution?: string
  providerCalls?: string
}
assert(readinessReport.status === 'passed', 'Readiness rollup report must pass.')
assert(readinessReport.production === 'blocked', 'Production must remain blocked.')
assert(readinessReport.externalBeta === 'blocked', 'External beta must remain blocked.')
assert(readinessReport.paidProduction === 'blocked', 'Paid production must remain blocked.')
assert(readinessReport.routeExecution === 'not_run', 'Route execution must not run.')
assert(readinessReport.workerExecution === 'not_run', 'Worker execution must not run.')
assert(readinessReport.providerCalls === 'not_run', 'Provider calls must not run.')
assert(readinessReport.trackA === 'not_touched', 'Track A must remain untouched.')

console.log(JSON.stringify({
  status: 'passed',
  phase: '44P',
  reportDir: TRACK_B_READINESS_ROLLUP_REPORT_DIR,
  totalTools: toolRollup.totalTools,
  exportRecords: exportReport.records?.length,
  supabaseWrite: 'not_run',
  remoteSql: 'not_run',
  migrationDeployment: 'not_run',
  routeExecution: 'not_run',
  workerExecution: 'not_run',
  production: 'blocked',
  externalBeta: 'blocked',
  trackA: 'not_touched',
}, null, 2))
