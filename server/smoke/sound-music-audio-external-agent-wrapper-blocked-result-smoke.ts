import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { SOUND_MUSIC_AUDIO_EXTERNAL_AGENT_WRAPPER_BLOCKED_RESULT } from '../../src/backend/mock/mock-sound-music-audio-external-agent-wrapper-blocked-result'

const ROOT = process.cwd()
const DOC_PATH = 'docs/sound-music-audio-external-agent-wrapper-blocked-result.md'
const SPEC_PATH = 'src/backend/mock/mock-sound-music-audio-external-agent-wrapper-blocked-result.ts'
const SMOKE_PATH = 'server/smoke/sound-music-audio-external-agent-wrapper-blocked-result-smoke.ts'
const WRAPPER_PATH = 'server/cli/external-agent-tool-execute-sound.ts'
const PACKAGE_SCRIPT = 'smoke:sound-music-audio-external-agent-wrapper-blocked-result'
const DECISION = 'sound_music_audio_external_agent_wrapper_blocked_evidence_review_result_recorded'
const NEXT_PROMPT =
  'SOUND-RUNTIME-MEDIA-GATE-NEXT: accept real provider, worker, storage, QA, billing, Track A/B, and export execution before any Sound runtime path'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function scanForbiddenValues(value: unknown, prefix = 'soundWrapperBlockedResult'): string[] {
  const findings: string[] = []

  if (typeof value === 'string') {
    const patterns: Array<[string, RegExp]> = [
      ['concrete public URL', /\bhttps?:\/\/\S+/i],
      ['run.app URL', /\brun\.app\b/i],
      ['access token value', /\bya29\.[A-Za-z0-9._-]+/i],
      ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
      ['jwt value', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/i],
      ['service account email', /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.gserviceaccount\.com/i],
      ['service-role value', /\bservice[_-]?role\s*[:=]\s*['"][^'"]+/i],
      ['api key value', /\bapi[_-]?key\s*[:=]\s*['"][^'"]+/i],
      ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
      ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|Signature=|Key-Pair-Id=|Policy=)/i],
      ['public storage URL', /\bstorage\.googleapis\.com\b/i],
      ['raw worker prompt field', /\braw[_-]?worker[_-]?prompt\b/i],
    ]

    for (const [name, pattern] of patterns) {
      if (pattern.test(value)) findings.push(`${prefix}: ${name}`)
    }

    return findings
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => findings.push(...scanForbiddenValues(item, `${prefix}[${index}]`)))
    return findings
  }

  if (value && typeof value === 'object') {
    for (const [key, nestedValue] of Object.entries(value)) {
      findings.push(...scanForbiddenValues(nestedValue, `${prefix}.${key}`))
    }
  }

  return findings
}

function assertFalseFlags(flags: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    assert.equal(flags[key], false, `${key} must be false`)
  }
}

for (const file of [
  DOC_PATH,
  SPEC_PATH,
  SMOKE_PATH,
  WRAPPER_PATH,
  'docs/sound-oss-tools-15-post-archive-handoff-review.md',
  'docs/sound-runtime-media-gate-2f-controlled-synthetic-route-source-validation-result.md',
  'package.json',
]) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/smoke/sound-music-audio-external-agent-wrapper-blocked-result-smoke.ts',
  'package smoke script mismatch',
)

const doc = read(DOC_PATH)
for (const required of [
  DECISION,
  'external-agent Sound wrapper -> static SOUND OSS diagnostics -> static SOUND runtime route-source diagnostics -> metadata-only blocker',
  '`REEDITPRO_CONFIRM_EXTERNAL_AGENT_SOUND_EVIDENCE_REVIEW=true npm run external-agent-tool-execute-sound -- --execute --json`',
  'wrapper status: `blocked`',
  'SOUND OSS diagnostics passed: `true`',
  'SOUND runtime route diagnostics passed: `true`',
  'runtime route diagnostics status: `sound_runtime_media_gate_2f_diagnostics_passed`',
  'source imported: `false`',
  'worker execution run: `false`',
  'route execution run: `false`',
  'Supabase touched by diagnostics: `false`',
  '`sound_metadata_only_runtime_execution_not_accepted`',
  '`real_provider_worker_storage_track_qa_billing_export_handoffs_required`',
  '`runtimeRunNow=false`',
  '`providerCallsMade=false`',
  '`workersDispatched=false`',
  '`mediaProcessingRun=false`',
  '`ffmpegRun=false`',
  '`generatedAudioCreated=false`',
  '`generatedAssetsCreated=false`',
  '`supabaseTouched=false`',
  '`sqlExecuted=false`',
  '`storageObjectsCreated=false`',
  '`signedUrlsCreated=false`',
  '`creditMutationCreated=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.equal(doc.includes(required), true, `Sound blocked result doc missing ${required}`)
}

const result = SOUND_MUSIC_AUDIO_EXTERNAL_AGENT_WRAPPER_BLOCKED_RESULT
assert.equal(result.decision, DECISION)
assert.equal(result.mode, 'sound_music_audio_external_agent_wrapper_blocked_result')
assert.equal(result.wrapperCommand.confirmationEnv, 'REEDITPRO_CONFIRM_EXTERNAL_AGENT_SOUND_EVIDENCE_REVIEW')
assert.equal(result.wrapperCommand.verifiesSoundOssArchiveDiagnosticsBeforeAnyRuntime, true)
assert.equal(result.wrapperCommand.verifiesSoundRuntimeRouteSourceDiagnosticsBeforeAnyRuntime, true)
assert.equal(result.wrapperCommand.blocksBeforeProviderWorkerStorageMediaOrExport, true)
assert.equal(result.reviewedResult.wrapperStatus, 'blocked')
assert.equal(result.reviewedResult.wrapperMode, 'external_agent_sound_execution_evidence_review_result')
assert.equal(result.reviewedResult.soundOssDiagnosticsPassed, true)
assert.equal(result.reviewedResult.soundRuntimeRouteDiagnosticsPassed, true)
assert.equal(result.reviewedResult.soundRuntimeRouteStatus, 'sound_runtime_media_gate_2f_diagnostics_passed')
assert.equal(
  result.reviewedResult.soundRuntimeRouteDecision,
  'sound_runtime_media_gate_2f_controlled_synthetic_route_source_validation_passed_with_warnings_ready_for_validation_owner_review',
)
assert.equal(result.reviewedResult.sourceImported, false)
assert.equal(result.reviewedResult.workerExecutionRun, false)
assert.equal(result.reviewedResult.routeExecutionRun, false)
assert.equal(result.reviewedResult.supabaseTouchedByDiagnostics, false)
assert.deepEqual(result.blockers, [
  'sound_metadata_only_runtime_execution_not_accepted',
  'real_provider_worker_storage_track_qa_billing_export_handoffs_required',
])
assert.deepEqual(result.requiredFutureHandoffs, [
  'PROVIDER_GATEWAY_MODELS',
  'WORKER_RUNTIME_JOBS',
  'SUPABASE_RLS_STORAGE_DATABASE',
  'TRACK_A_RENDER_EXPORT',
  'TRACK_B_MEDIA_PROCESSING',
  'OBSERVABILITY_AUDIT_COST',
  'BILLING_STRIPE_CREDITS',
])
assertFalseFlags(result.runtimeResult, [
  'runtimeRunNow',
  'providerCallsMade',
  'workersDispatched',
  'mediaProcessingRun',
  'ffmpegRun',
  'ffprobeRun',
  'generatedAudioCreated',
  'generatedAssetsCreated',
  'publicArtifactsCreated',
  'signedUrlsCreated',
  'supabaseTouched',
  'sqlExecuted',
  'storageObjectsCreated',
  'creditMutationCreated',
  'qaRowsCreated',
  'billingRowsCreated',
  'trackAFinalExportRun',
  'trackBProcessingRun',
  'betaUnlocked',
  'productionUnlocked',
  'paidProductionUnlocked',
  'dryRunPassedClaimed',
  'generatedLocalFixturePassedClaimed',
])
assert.equal(result.nextPrompt, NEXT_PROMPT)

const forbiddenFindings = scanForbiddenValues({ doc, result })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: result.decision,
      wrapperStatus: result.reviewedResult.wrapperStatus,
      soundOssDiagnosticsPassed: result.reviewedResult.soundOssDiagnosticsPassed,
      soundRuntimeRouteDiagnosticsPassed: result.reviewedResult.soundRuntimeRouteDiagnosticsPassed,
      providerCallsMade: result.runtimeResult.providerCallsMade,
      workersDispatched: result.runtimeResult.workersDispatched,
      generatedAssetsCreated: result.runtimeResult.generatedAssetsCreated,
      generatedLocalFixturePassedClaimed: result.runtimeResult.generatedLocalFixturePassedClaimed,
      nextPrompt: result.nextPrompt,
    },
    null,
    2,
  ),
)
