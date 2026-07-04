import { spawnSync } from 'node:child_process'

import { EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP } from '../../src/backend/mock/mock-external-agent-tool-execution-readiness-rollup'
import { EXTERNAL_AGENT_TOOL_NEXT_COMMAND } from '../../src/backend/mock/mock-external-agent-tool-next-command'

type JsonRecord = Record<string, unknown>

const CONFIRM_ENV = 'REEDITPRO_CONFIRM_EXTERNAL_AGENT_SOUND_EVIDENCE_REVIEW'
const SOUND_OSS_DIAGNOSTICS = ['run', 'sound-oss-tools-15:diagnostics'] as const
const SOUND_RUNTIME_ROUTE_DIAGNOSTICS = ['run', 'sound-runtime-media-gate-2f:diagnostics'] as const

function main() {
  const execute = process.argv.includes('--execute')
  const soundTool = EXTERNAL_AGENT_TOOL_EXECUTION_READINESS_ROLLUP.tools.find(
    (tool) => tool.toolId === 'sound_music_audio',
  )

  if (!execute) {
    print({
      ok: false,
      mode: 'external_agent_sound_execution_static_guard',
      executeRequired: true,
      confirmationEnv: CONFIRM_ENV,
      confirmationEnvRequiredValue: 'true',
      canonicalCommand: EXTERNAL_AGENT_TOOL_NEXT_COMMAND.soundMusicAudioEvidenceCommand,
      soundToolStatus: soundTool?.status,
      currentStage: soundTool?.currentStage,
      primaryBlocker: soundTool?.primaryBlocker,
      runtimeRunNow: false,
      providerCallsMade: false,
      workersDispatched: false,
      mediaProcessingRun: false,
      ffmpegRun: false,
      generatedAudioCreated: false,
      generatedAssetsCreated: false,
      supabaseTouched: false,
      sqlExecuted: false,
      storageObjectsCreated: false,
      signedUrlsCreated: false,
      creditMutationCreated: false,
      betaUnlocked: false,
      productionUnlocked: false,
      generatedLocalFixturePassedClaimed: false,
    })
    return
  }

  if (process.env[CONFIRM_ENV] !== 'true') {
    print({
      ok: false,
      mode: 'external_agent_sound_execution_confirmation_blocked',
      status: 'blocked',
      blockers: [`confirmation_env_required:${CONFIRM_ENV}=true`],
      confirmationEnv: CONFIRM_ENV,
      confirmationEnvRequiredValue: 'true',
      runtimeRunNow: false,
      providerCallsMade: false,
      workersDispatched: false,
      mediaProcessingRun: false,
      ffmpegRun: false,
      generatedAudioCreated: false,
      generatedAssetsCreated: false,
      supabaseTouched: false,
      sqlExecuted: false,
      storageObjectsCreated: false,
      signedUrlsCreated: false,
      creditMutationCreated: false,
      betaUnlocked: false,
      productionUnlocked: false,
      generatedLocalFixturePassedClaimed: false,
    })
    return
  }

  const soundOss = runJson('sound_oss_post_archive_diagnostics', 'npm', [...SOUND_OSS_DIAGNOSTICS])
  const soundRuntimeRoute = runJson('sound_runtime_route_source_diagnostics', 'npm', [
    ...SOUND_RUNTIME_ROUTE_DIAGNOSTICS,
  ])
  const blockers = validateEvidence(soundOss, soundRuntimeRoute)
  const safeEvidenceReviewCompleted = soundOss.ok && soundRuntimeRoute.ok

  print({
    ok: false,
    mode: 'external_agent_sound_execution_evidence_review_result',
    status: 'blocked',
    blockers,
    safeEvidenceReviewRun: true,
    safeEvidenceReviewCompleted,
    safeEvidenceReviewExecutableNow: true,
    supportingEvidenceOnly: true,
    runtimeExecutionBlockedAsExpected: true,
    soundOssDiagnostics: summarizeProbe(soundOss),
    soundRuntimeRouteDiagnostics: summarizeProbe(soundRuntimeRoute),
    nextPrompt:
      'SOUND-RUNTIME-MEDIA-GATE-NEXT: accept real provider, worker, storage, QA, billing, Track A/B, and export execution before any Sound runtime path',
    runtimeRunNow: false,
    providerCallsMade: false,
    workersDispatched: false,
    mediaProcessingRun: false,
    ffmpegRun: false,
    generatedAudioCreated: false,
    generatedAssetsCreated: false,
    supabaseTouched: false,
    sqlExecuted: false,
    storageObjectsCreated: false,
    signedUrlsCreated: false,
    creditMutationCreated: false,
    betaUnlocked: false,
    productionUnlocked: false,
    generatedLocalFixturePassedClaimed: false,
  })
}

function validateEvidence(
  soundOss: ReturnType<typeof runJson>,
  soundRuntimeRoute: ReturnType<typeof runJson>,
): string[] {
  const blockers = [
    'sound_metadata_only_runtime_execution_not_accepted',
    'real_provider_worker_storage_track_qa_billing_export_handoffs_required',
  ]

  if (!soundOss.ok) blockers.push('sound_oss_archive_diagnostics_failed')
  if (!soundRuntimeRoute.ok) blockers.push('sound_runtime_route_source_diagnostics_failed')

  return blockers
}

function summarizeProbe(probe: ReturnType<typeof runJson>) {
  return {
    id: probe.id,
    ok: probe.ok,
    exitCode: probe.exitCode,
    status: probe.json?.status,
    decision: probe.json?.decision,
    mode: probe.json?.mode,
    sourceImported: probe.json?.sourceImported,
    workerExecutionRun: probe.json?.workerExecutionRun,
    routeExecutionRun: probe.json?.routeExecutionRun,
    supabaseTouched: probe.json?.supabaseTouched,
    sqlExecuted: probe.json?.sqlExecuted,
    stdoutSummary: probe.stdoutSummary,
    stderrSummary: probe.stderrSummary,
  }
}

function runJson(
  id: string,
  command: string,
  args: string[],
): {
  id: string
  ok: boolean
  exitCode: number | null
  json?: JsonRecord
  stdoutSummary?: string
  stderrSummary?: string
} {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: process.env,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 16,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  const json = parseJsonOutput(String(result.stdout ?? ''))

  return {
    id,
    ok: result.status === 0,
    exitCode: result.status,
    json,
    stdoutSummary: sanitize(String(result.stdout ?? '')),
    stderrSummary: sanitize(String(result.stderr ?? '')),
  }
}

function parseJsonOutput(output: string): JsonRecord | undefined {
  const trimmed = output.trim()
  if (!trimmed) return undefined

  try {
    return JSON.parse(trimmed) as JsonRecord
  } catch {
    const start = trimmed.indexOf('{')
    const end = trimmed.lastIndexOf('}')
    if (start < 0 || end <= start) return undefined

    try {
      return JSON.parse(trimmed.slice(start, end + 1)) as JsonRecord
    } catch {
      return undefined
    }
  }
}

function sanitize(value: string): string | undefined {
  const sanitized = value
    .replace(/\bhttps?:\/\/\S+/gi, 'redacted_url')
    .replace(/\bya29\.[A-Za-z0-9._-]+/g, 'redacted_access_token')
    .replace(/\bBearer\s+\S+/gi, 'Bearer redacted')
    .trim()

  return sanitized ? sanitized.slice(0, 1000) : undefined
}

function print(value: unknown) {
  console.log(JSON.stringify(value, null, 2))
}

main()
