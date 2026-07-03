import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

import {
  AI_VIDEO_BROLL_GEN_10R_FIX_IAP_SSH_CANARY_BOUNDED_RUNNER,
  AI_VIDEO_BROLL_GEN_10S_NO_GPU_IAP_SSH_CANARY_BOUNDED_RUNNER_EXECUTE_PROMPT,
} from '../../src/backend/mock/mock-ai-video-broll-gen-10r-fix-iap-ssh-canary-bounded-runner'

type JsonRecord = Record<string, unknown>

const SPEC = AI_VIDEO_BROLL_GEN_10R_FIX_IAP_SSH_CANARY_BOUNDED_RUNNER
const CONFIRM_ENV = 'REEDITPRO_CONFIRM_BROLL_10R_IAP_SSH_CANARY'
const SERVICE_ACCOUNT_ENV = 'REEDITPRO_BROLL_PROOF_SERVICE_ACCOUNT_EMAIL'
const DEFAULT_SUMMARY_PATH = path.join(
  '.tmp',
  'ai-video-broll-gen-10r-iap-ssh-canary-bounded-runner-summary.json',
)

type PhaseResult = {
  id: string
  ok: boolean
  exitCode: number | null
  timedOut: boolean
  stdoutSummary?: string
  stderrSummary?: string
}

type RunnerSummary = {
  ok: boolean
  mode: string
  status: 'planned' | 'blocked' | 'passed' | 'failed'
  decision: string
  summaryPath?: string
  nextPrompt: string
  runtimeRunNow: boolean
  preflightPassed: boolean
  canaryCreateAttempted: boolean
  canaryCreated: boolean
  sshAttempted: boolean
  sshSuccessEvidenceCaptured: boolean
  sshFailureEvidenceCaptured: boolean
  cleanupAttempted: boolean
  cleanupVerified: boolean
  blockers: string[]
  phaseResults: PhaseResult[]
  runtimeSideEffects: JsonRecord
}

function main() {
  const execute = process.argv.includes('--execute')
  const summaryPath = getArgValue('--summary-path') ?? DEFAULT_SUMMARY_PATH

  if (!execute) {
    print(planSummary(summaryPath))
    return
  }

  if (process.env[CONFIRM_ENV] !== SPEC.runnerCli.confirmationEnvRequiredValue) {
    print(
      blockedSummary(summaryPath, [`confirmation_env_required:${CONFIRM_ENV}=true`], {
        mode: 'ai_video_broll_gen_10r_iap_ssh_canary_bounded_runner_confirmation_blocked',
      }),
    )
    return
  }

  const serviceAccount = process.env[SERVICE_ACCOUNT_ENV]
  if (!serviceAccount) {
    print(
      blockedSummary(summaryPath, [`service_account_env_required:${SERVICE_ACCOUNT_ENV}`], {
        mode: 'ai_video_broll_gen_10r_iap_ssh_canary_bounded_runner_service_account_blocked',
      }),
    )
    return
  }

  const phaseResults: PhaseResult[] = []
  let canaryCreated = false
  let cleanupAttempted = false
  let cleanupVerified = false
  let sshSuccessEvidenceCaptured = false
  let sshFailureEvidenceCaptured = false
  let nextPrompt = AI_VIDEO_BROLL_GEN_10S_NO_GPU_IAP_SSH_CANARY_BOUNDED_RUNNER_EXECUTE_PROMPT

  const writeSummary = (partial: Partial<RunnerSummary>) => {
    writeDurableSummary(summaryPath, {
      ok: false,
      mode: 'ai_video_broll_gen_10r_iap_ssh_canary_bounded_runner_execute_result',
      status: 'failed',
      decision: SPEC.decision,
      summaryPath,
      nextPrompt,
      runtimeRunNow: true,
      preflightPassed: false,
      canaryCreateAttempted: false,
      canaryCreated,
      sshAttempted: false,
      sshSuccessEvidenceCaptured,
      sshFailureEvidenceCaptured,
      cleanupAttempted,
      cleanupVerified,
      blockers: [],
      phaseResults,
      runtimeSideEffects: futureRuntimeSideEffects(),
      ...partial,
    })
  }

  try {
    const preflight = runPreflight()
    phaseResults.push(...preflight.phaseResults)
    writeSummary({
      status: preflight.ok ? 'blocked' : 'failed',
      preflightPassed: preflight.ok,
      blockers: preflight.blockers,
    })

    if (!preflight.ok) {
      print(readableSummary(summaryPath, 'blocked', false, false, false, false, phaseResults, preflight.blockers))
      return
    }

    const create = runGcloud(
      'create_canary_vm',
      [
        'compute',
        'instances',
        'create',
        SPEC.boundedRunnerRequirements.canaryName,
        '--project',
        SPEC.boundedRunnerRequirements.projectId,
        '--zone',
        SPEC.boundedRunnerRequirements.targetZone,
        '--machine-type',
        SPEC.boundedRunnerRequirements.machineType,
        '--image',
        SPEC.boundedRunnerRequirements.imageName,
        '--image-project',
        SPEC.boundedRunnerRequirements.imageProject,
        '--network-interface',
        'network=default,no-address',
        '--tags',
        SPEC.boundedRunnerRequirements.targetTag,
        '--service-account',
        serviceAccount,
        '--scopes',
        'logging-write,monitoring-write',
        '--boot-disk-auto-delete',
        '--quiet',
      ],
      SPEC.timeoutPolicy.createVmTimeoutMs,
    )
    phaseResults.push(create)
    canaryCreated = create.ok
    writeSummary({
      preflightPassed: true,
      canaryCreateAttempted: true,
      canaryCreated,
      blockers: create.ok ? [] : ['canary_vm_create_failed_or_timed_out'],
    })

    if (!create.ok) {
      nextPrompt =
        'AI-VIDEO-BROLL-GEN-10T-CANARY-CREATE-FAILURE-REVIEW: review no-GPU canary create failure and cleanup evidence, no GPU/no model/no inference'
      cleanupAttempted = true
      const cleanup = cleanupCanary()
      phaseResults.push(...cleanup.phaseResults)
      cleanupVerified = cleanup.cleanupVerified
      writeSummary({
        status: 'failed',
        preflightPassed: true,
        canaryCreateAttempted: true,
        canaryCreated,
        cleanupAttempted,
        cleanupVerified,
        blockers: cleanupVerified
          ? ['canary_vm_create_failed_or_timed_out']
          : ['canary_vm_create_failed_or_timed_out', 'cleanup_not_verified'],
      })
      print(
        readableSummary(
          summaryPath,
          'failed',
          true,
          true,
          canaryCreated,
          cleanupVerified,
          phaseResults,
          cleanupVerified
            ? ['canary_vm_create_failed_or_timed_out']
            : ['canary_vm_create_failed_or_timed_out', 'cleanup_not_verified'],
        ),
      )
      return
    }

    for (let attempt = 1; attempt <= SPEC.timeoutPolicy.sshAttemptCount; attempt += 1) {
      const ssh = runGcloud(
        `iap_ssh_attempt_${attempt}`,
        [
          'compute',
          'ssh',
          SPEC.boundedRunnerRequirements.canaryName,
          '--project',
          SPEC.boundedRunnerRequirements.projectId,
          '--zone',
          SPEC.boundedRunnerRequirements.targetZone,
          '--tunnel-through-iap',
          '--quiet',
          '--ssh-flag=-o ConnectTimeout=15',
          '--ssh-flag=-o BatchMode=yes',
          '--ssh-flag=-o StrictHostKeyChecking=no',
          '--command',
          'echo REEDITPRO_BROLL_IAP_CANARY_OK && python3 --version',
        ],
        SPEC.timeoutPolicy.sshAttemptTimeoutMs,
      )
      phaseResults.push(ssh)
      sshSuccessEvidenceCaptured =
        sshSuccessEvidenceCaptured || Boolean(ssh.ok && ssh.stdoutSummary?.includes('REEDITPRO_BROLL_IAP_CANARY_OK'))
      sshFailureEvidenceCaptured = sshFailureEvidenceCaptured || Boolean(!ssh.ok || ssh.timedOut)
      writeSummary({
        preflightPassed: true,
        canaryCreateAttempted: true,
        canaryCreated,
        sshAttempted: true,
        sshSuccessEvidenceCaptured,
        sshFailureEvidenceCaptured,
        blockers: sshSuccessEvidenceCaptured ? [] : ['iap_ssh_success_not_yet_captured'],
      })
      if (sshSuccessEvidenceCaptured) break
    }

    cleanupAttempted = true
    const cleanup = cleanupCanary()
    phaseResults.push(...cleanup.phaseResults)
    cleanupVerified = cleanup.cleanupVerified

    const status = sshSuccessEvidenceCaptured && cleanupVerified ? 'passed' : 'failed'
    const ok = status === 'passed'
    const blockers = ok
      ? []
      : cleanupVerified
        ? ['iap_ssh_success_not_captured']
        : ['iap_ssh_success_not_captured', 'cleanup_not_verified']

    nextPrompt = ok
      ? SPEC.failureRouting.success
      : !cleanupVerified
        ? SPEC.failureRouting.cleanupFailure
        : sshFailureEvidenceCaptured
          ? SPEC.failureRouting.publicKeyFailure
          : AI_VIDEO_BROLL_GEN_10S_NO_GPU_IAP_SSH_CANARY_BOUNDED_RUNNER_EXECUTE_PROMPT

    writeSummary({
      ok,
      status,
      preflightPassed: true,
      canaryCreateAttempted: true,
      canaryCreated,
      sshAttempted: true,
      sshSuccessEvidenceCaptured,
      sshFailureEvidenceCaptured,
      cleanupAttempted,
      cleanupVerified,
      blockers,
      nextPrompt,
    })

    print({
      ok,
      mode: 'ai_video_broll_gen_10r_iap_ssh_canary_bounded_runner_execute_result',
      status,
      summaryPath,
      preflightPassed: true,
      canaryCreateAttempted: true,
      canaryCreated,
      sshAttempted: true,
      sshSuccessEvidenceCaptured,
      sshFailureEvidenceCaptured,
      cleanupAttempted,
      cleanupVerified,
      blockers,
      nextPrompt,
      runtimeSideEffects: futureRuntimeSideEffects(),
    })
  } catch (error) {
    cleanupAttempted = true
    const cleanup = cleanupCanary()
    phaseResults.push(...cleanup.phaseResults)
    cleanupVerified = cleanup.cleanupVerified
    const blockers = cleanupVerified
      ? ['runner_exception_summary_written']
      : ['runner_exception_summary_written', 'cleanup_not_verified']
    writeSummary({
      status: 'failed',
      preflightPassed: false,
      cleanupAttempted,
      cleanupVerified,
      blockers,
      nextPrompt: cleanupVerified ? AI_VIDEO_BROLL_GEN_10S_NO_GPU_IAP_SSH_CANARY_BOUNDED_RUNNER_EXECUTE_PROMPT : SPEC.failureRouting.cleanupFailure,
      phaseResults,
    })
    print({
      ok: false,
      mode: 'ai_video_broll_gen_10r_iap_ssh_canary_bounded_runner_exception',
      status: 'failed',
      summaryPath,
      errorSummary: sanitize(error instanceof Error ? error.message : String(error)),
      cleanupAttempted,
      cleanupVerified,
      blockers,
      runtimeSideEffects: futureRuntimeSideEffects(),
    })
  }
}

function planSummary(summaryPath: string): RunnerSummary {
  return {
    ok: true,
    mode: 'ai_video_broll_gen_10r_iap_ssh_canary_bounded_runner_plan',
    status: 'planned',
    decision: SPEC.decision,
    summaryPath,
    nextPrompt: SPEC.nextPrompt,
    runtimeRunNow: false,
    preflightPassed: false,
    canaryCreateAttempted: false,
    canaryCreated: false,
    sshAttempted: false,
    sshSuccessEvidenceCaptured: false,
    sshFailureEvidenceCaptured: false,
    cleanupAttempted: false,
    cleanupVerified: false,
    blockers: [],
    phaseResults: [],
    runtimeSideEffects: currentPromptRuntimeSideEffects(),
  }
}

function blockedSummary(
  summaryPath: string,
  blockers: string[],
  options: { mode: string },
): RunnerSummary {
  return {
    ok: false,
    mode: options.mode,
    status: 'blocked',
    decision: SPEC.decision,
    summaryPath,
    nextPrompt: SPEC.nextPrompt,
    runtimeRunNow: false,
    preflightPassed: false,
    canaryCreateAttempted: false,
    canaryCreated: false,
    sshAttempted: false,
    sshSuccessEvidenceCaptured: false,
    sshFailureEvidenceCaptured: false,
    cleanupAttempted: false,
    cleanupVerified: false,
    blockers,
    phaseResults: [],
    runtimeSideEffects: currentPromptRuntimeSideEffects(),
  }
}

function readableSummary(
  summaryPath: string,
  status: RunnerSummary['status'],
  preflightPassed: boolean,
  canaryCreateAttempted: boolean,
  canaryCreated: boolean,
  cleanupVerified: boolean,
  phaseResults: PhaseResult[],
  blockers: string[],
) {
  return {
    ok: status === 'passed',
    mode: 'ai_video_broll_gen_10r_iap_ssh_canary_bounded_runner_execute_result',
    status,
    summaryPath,
    preflightPassed,
    canaryCreateAttempted,
    canaryCreated,
    cleanupVerified,
    blockers,
    phaseResults,
    runtimeSideEffects: futureRuntimeSideEffects(),
  }
}

function runPreflight() {
  const phaseResults: PhaseResult[] = []
  const blockers: string[] = []
  const commands: Array<[string, string[]]> = [
    ['gcloud_project', ['config', 'get-value', 'project']],
    ['describe_canary_instance_before_create', ['compute', 'instances', 'describe', SPEC.boundedRunnerRequirements.canaryName, '--project', SPEC.boundedRunnerRequirements.projectId, '--zone', SPEC.boundedRunnerRequirements.targetZone, '--format=value(name)']],
    ['describe_canary_disk_before_create', ['compute', 'disks', 'describe', SPEC.boundedRunnerRequirements.canaryName, '--project', SPEC.boundedRunnerRequirements.projectId, '--zone', SPEC.boundedRunnerRequirements.targetZone, '--format=value(name)']],
    ['describe_canary_address_before_create', ['compute', 'addresses', 'describe', SPEC.boundedRunnerRequirements.canaryName, '--project', SPEC.boundedRunnerRequirements.projectId, '--region', SPEC.boundedRunnerRequirements.targetRegion, '--format=value(name)']],
    ['describe_canary_reservation_before_create', ['compute', 'reservations', 'describe', SPEC.boundedRunnerRequirements.canaryName, '--project', SPEC.boundedRunnerRequirements.projectId, '--zone', SPEC.boundedRunnerRequirements.targetZone, '--format=value(name)']],
  ]

  for (const [id, args] of commands) {
    const result = runGcloud(id, args, SPEC.timeoutPolicy.preflightCommandTimeoutMs)
    phaseResults.push(result)
    if (id === 'gcloud_project' && result.stdoutSummary !== SPEC.boundedRunnerRequirements.projectId) {
      blockers.push('gcloud_project_mismatch')
    }
    if (id !== 'gcloud_project' && result.ok) {
      blockers.push(`${id}_already_exists`)
    }
    if (result.timedOut) {
      blockers.push(`${id}_timed_out`)
    }
  }

  return {
    ok: blockers.length === 0,
    blockers,
    phaseResults,
  }
}

function cleanupCanary() {
  const phaseResults: PhaseResult[] = []
  const deleteResult = runGcloud(
    'delete_prompt_scoped_canary',
    [
      'compute',
      'instances',
      'delete',
      SPEC.boundedRunnerRequirements.canaryName,
      '--project',
      SPEC.boundedRunnerRequirements.projectId,
      '--zone',
      SPEC.boundedRunnerRequirements.targetZone,
      '--quiet',
    ],
    SPEC.timeoutPolicy.cleanupDeleteTimeoutMs,
  )
  phaseResults.push(deleteResult)

  const verifyCommands: Array<[string, string[]]> = [
    ['verify_instance_absent', ['compute', 'instances', 'describe', SPEC.boundedRunnerRequirements.canaryName, '--project', SPEC.boundedRunnerRequirements.projectId, '--zone', SPEC.boundedRunnerRequirements.targetZone, '--format=value(name)']],
    ['verify_disk_absent', ['compute', 'disks', 'describe', SPEC.boundedRunnerRequirements.canaryName, '--project', SPEC.boundedRunnerRequirements.projectId, '--zone', SPEC.boundedRunnerRequirements.targetZone, '--format=value(name)']],
    ['verify_address_absent', ['compute', 'addresses', 'describe', SPEC.boundedRunnerRequirements.canaryName, '--project', SPEC.boundedRunnerRequirements.projectId, '--region', SPEC.boundedRunnerRequirements.targetRegion, '--format=value(name)']],
    ['verify_reservation_absent', ['compute', 'reservations', 'describe', SPEC.boundedRunnerRequirements.canaryName, '--project', SPEC.boundedRunnerRequirements.projectId, '--zone', SPEC.boundedRunnerRequirements.targetZone, '--format=value(name)']],
  ]
  let cleanupVerified = true
  for (const [id, args] of verifyCommands) {
    const result = runGcloud(id, args, SPEC.timeoutPolicy.cleanupVerifyTimeoutMs)
    phaseResults.push(result)
    if (result.ok || result.timedOut) cleanupVerified = false
  }

  return {
    cleanupVerified,
    phaseResults,
  }
}

function runGcloud(id: string, args: string[], timeoutMs: number): PhaseResult {
  const result = spawnSync('gcloud', args, {
    cwd: process.cwd(),
    env: process.env,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 4,
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: timeoutMs,
  })

  return {
    id,
    ok: result.status === 0,
    exitCode: result.status,
    timedOut: Boolean(result.error && result.error.message.includes('ETIMEDOUT')),
    stdoutSummary: sanitize(String(result.stdout ?? '')),
    stderrSummary: sanitize(String(result.stderr ?? '')),
  }
}

function writeDurableSummary(summaryPath: string, summary: RunnerSummary) {
  mkdirSync(path.dirname(summaryPath), { recursive: true })
  writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8')
}

function currentPromptRuntimeSideEffects(): JsonRecord {
  return {
    gcpReadOnlyCommandsExecuted: false,
    gcpMutatingCommandsExecuted: false,
    computeVmCreated: false,
    diskCreated: false,
    sshSessionOpened: false,
    cleanupRun: false,
    gpuVmCreated: false,
    modelInferenceRun: false,
    generatedAssetsCreated: false,
    supabaseTouched: false,
    sqlExecuted: false,
    generatedLocalFixturePassedClaimed: false,
  }
}

function futureRuntimeSideEffects(): JsonRecord {
  return {
    gcpReadOnlyCommandsExecuted: true,
    gcpMutatingCommandsExecuted: true,
    computeVmCreated: true,
    diskCreated: true,
    sshSessionOpened: false,
    cleanupRun: true,
    gpuVmCreated: false,
    modelInferenceRun: false,
    generatedAssetsCreated: false,
    supabaseTouched: false,
    sqlExecuted: false,
    generatedLocalFixturePassedClaimed: false,
  }
}

function sanitize(value: string): string | undefined {
  const sanitized = value
    .replace(/\bhttps?:\/\/\S+/gi, 'redacted_url')
    .replace(/\bya29\.[A-Za-z0-9._-]+/g, 'redacted_access_token')
    .replace(/\bBearer\s+\S+/gi, 'Bearer redacted')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, 'redacted_email')
    .replace(/\bssh-(rsa|ed25519)\s+[A-Za-z0-9+/=]{40,}/gi, 'redacted_ssh_public_key')
    .trim()

  return sanitized ? sanitized.slice(0, 1200) : undefined
}

function getArgValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  if (index < 0) return undefined
  return process.argv[index + 1]
}

function print(value: unknown) {
  console.log(JSON.stringify(value, null, 2))
}

main()
