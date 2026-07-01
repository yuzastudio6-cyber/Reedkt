import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { EXTERNAL_AGENT_TOOL_NEXT_COMMAND } from '../../src/backend/mock/mock-external-agent-tool-next-command'

const ROOT = process.cwd()
const CLI_PATH = 'server/cli/external-agent-tool-execute-sound.ts'
const SMOKE_PATH = 'server/smoke/external-agent-tool-execute-sound-smoke.ts'
const PACKAGE_SCRIPT = 'external-agent-tool-execute-sound'
const SMOKE_SCRIPT = 'smoke:external-agent-tool-execute-sound'
const CONFIRM_ENV = 'REEDITPRO_CONFIRM_EXTERNAL_AGENT_SOUND_EVIDENCE_REVIEW'

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function runCli(args: string[] = [], confirm = false) {
  const output = execFileSync('npx', ['tsx', CLI_PATH, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 24,
    env: {
      ...process.env,
      [CONFIRM_ENV]: confirm ? 'true' : '',
    },
  })

  return JSON.parse(output) as Record<string, unknown>
}

function scanForbiddenValues(value: unknown, prefix = 'externalAgentSoundExecute'): string[] {
  const findings: string[] = []

  if (typeof value === 'string') {
    const patterns: Array<[string, RegExp]> = [
      ['concrete public URL', /\bhttps?:\/\/\S+/i],
      ['access token value', /\bya29\.[A-Za-z0-9._-]+/i],
      ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
      ['jwt value', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/i],
      ['service-role value', /\bservice[_-]?role\s*[:=]\s*['"][^'"]+/i],
      ['api key value', /\bapi[_-]?key\s*[:=]\s*['"][^'"]+/i],
      ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
      ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|Signature=|Key-Pair-Id=|Policy=)/i],
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

for (const file of [CLI_PATH, SMOKE_PATH, 'package.json', 'src/backend/mock/mock-external-agent-tool-next-command.ts']) {
  assert.equal(existsSync(path.join(ROOT, file)), true, `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
assert.equal(
  packageJson.scripts?.[PACKAGE_SCRIPT],
  'tsx server/cli/external-agent-tool-execute-sound.ts',
  'package external-agent Sound execute script mismatch',
)
assert.equal(
  packageJson.scripts?.[SMOKE_SCRIPT],
  'tsx server/smoke/external-agent-tool-execute-sound-smoke.ts',
  'package external-agent Sound execute smoke script mismatch',
)

const source = read(CLI_PATH)
for (const required of [
  CONFIRM_ENV,
  'sound-oss-tools-15:diagnostics',
  'sound-runtime-media-gate-2f:diagnostics',
  'sound_metadata_only_runtime_execution_not_accepted',
  'real_provider_worker_storage_track_qa_billing_export_handoffs_required',
  'parseJsonOutput',
  'runtimeRunNow: false',
  'providerCallsMade: false',
  'workersDispatched: false',
  'mediaProcessingRun: false',
  'generatedAudioCreated: false',
  'generatedAssetsCreated: false',
  'generatedLocalFixturePassedClaimed: false',
]) {
  assert.equal(source.includes(required), true, `Sound wrapper missing ${required}`)
}
for (const forbidden of [
  'docker ',
  'psql',
  'createdb',
  'dropdb',
  'supabase ',
  'from_pretrained',
  'torch.',
  'ffmpeg ',
  'ffprobe ',
]) {
  assert.equal(source.includes(forbidden), false, `Sound wrapper must not include runtime marker: ${forbidden}`)
}

const staticReport = runCli(['--json'])
assert.equal(staticReport.ok, false)
assert.equal(staticReport.mode, 'external_agent_sound_execution_static_guard')
assert.equal(staticReport.executeRequired, true)
assert.equal(staticReport.confirmationEnv, CONFIRM_ENV)
assert.equal(staticReport.confirmationEnvRequiredValue, 'true')
assert.deepEqual(
  staticReport.canonicalCommand,
  EXTERNAL_AGENT_TOOL_NEXT_COMMAND.soundMusicAudioEvidenceCommand,
)
assert.equal(staticReport.runtimeRunNow, false)
assert.equal(staticReport.providerCallsMade, false)
assert.equal(staticReport.workersDispatched, false)
assert.equal(staticReport.mediaProcessingRun, false)
assert.equal(staticReport.generatedAudioCreated, false)
assert.equal(staticReport.generatedAssetsCreated, false)
assert.equal(staticReport.supabaseTouched, false)
assert.equal(staticReport.sqlExecuted, false)
assert.equal(staticReport.storageObjectsCreated, false)
assert.equal(staticReport.signedUrlsCreated, false)
assert.equal(staticReport.creditMutationCreated, false)
assert.equal(staticReport.betaUnlocked, false)
assert.equal(staticReport.productionUnlocked, false)
assert.equal(staticReport.generatedLocalFixturePassedClaimed, false)

const confirmationBlocked = runCli(['--execute', '--json'])
assert.equal(confirmationBlocked.ok, false)
assert.equal(confirmationBlocked.mode, 'external_agent_sound_execution_confirmation_blocked')
assert.equal(confirmationBlocked.status, 'blocked')
assert.deepEqual(confirmationBlocked.blockers, [`confirmation_env_required:${CONFIRM_ENV}=true`])

const evidenceReview = runCli(['--execute', '--json'], true)
assert.equal(evidenceReview.ok, false)
assert.equal(evidenceReview.mode, 'external_agent_sound_execution_evidence_review_result')
assert.equal(evidenceReview.status, 'blocked')
assert.equal(
  (evidenceReview.blockers as string[]).includes('sound_metadata_only_runtime_execution_not_accepted'),
  true,
)
assert.equal(
  (evidenceReview.blockers as string[]).includes(
    'real_provider_worker_storage_track_qa_billing_export_handoffs_required',
  ),
  true,
)
assert.equal((evidenceReview.soundOssDiagnostics as Record<string, unknown>).ok, true)
assert.equal((evidenceReview.soundRuntimeRouteDiagnostics as Record<string, unknown>).ok, true)
assert.equal(evidenceReview.runtimeRunNow, false)
assert.equal(evidenceReview.providerCallsMade, false)
assert.equal(evidenceReview.workersDispatched, false)
assert.equal(evidenceReview.mediaProcessingRun, false)
assert.equal(evidenceReview.generatedAudioCreated, false)
assert.equal(evidenceReview.generatedAssetsCreated, false)
assert.equal(evidenceReview.supabaseTouched, false)
assert.equal(evidenceReview.sqlExecuted, false)
assert.equal(evidenceReview.storageObjectsCreated, false)
assert.equal(evidenceReview.signedUrlsCreated, false)
assert.equal(evidenceReview.creditMutationCreated, false)
assert.equal(evidenceReview.betaUnlocked, false)
assert.equal(evidenceReview.productionUnlocked, false)
assert.equal(evidenceReview.generatedLocalFixturePassedClaimed, false)

const forbiddenFindings = scanForbiddenValues({ staticReport, confirmationBlocked, evidenceReview })
assert.equal(forbiddenFindings.length, 0, `Forbidden values found: ${forbiddenFindings.join('; ')}`)

console.log(
  JSON.stringify(
    {
      ok: true,
      mode: 'external_agent_sound_execution_wrapper_smoke',
      staticGuardMode: staticReport.mode,
      confirmationBlockedMode: confirmationBlocked.mode,
      evidenceReviewMode: evidenceReview.mode,
      confirmationEnv: CONFIRM_ENV,
      runtimeRunNow: false,
      generatedAssetsCreated: false,
      generatedLocalFixturePassedClaimed: false,
    },
    null,
    2,
  ),
)
