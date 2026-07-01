import { execFileSync } from 'node:child_process'

import { EXTERNAL_AGENT_TOOL_QWEN_READY_PROMPT } from '../../src/backend/mock/mock-external-agent-tool-execution-readiness-rollup'

type JsonRecord = Record<string, unknown>

type CommandResult = {
  id: string
  ok: boolean
  command: string
  durationMs: number
  outputSummary?: string
  errorSummary?: string
}

const PROJECT = 'reeditpro'
const REGION = 'us-central1'
const SERVICE = 'reeditpro-qwen2-5-vl-l4-worker'
const JOB = 'reeditpro-qwen2-5-vl-private-caller'
const CONFIRM_ENV = 'REEDITPRO_CONFIRM_QWEN_58DW_BOUNDED_RETRY'
const EXACT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DW-RETRY-2: run one bounded approved-fixture private inference retry after strict structured-output fix, no generated assets/no mutation'

const SERVICE_ENABLE_ENV: Record<string, string> = {
  QWEN_APPROVED_FIXTURE_INFERENCE_ENABLED: 'true',
  QWEN_INFERENCE_ENABLED: 'true',
  QWEN_MODEL_IMPORT_ON_STARTUP: 'false',
  QWEN_VLLM_MAX_MODEL_LEN: '1024',
  QWEN_VLLM_MAX_NUM_SEQS: '1',
  QWEN_VLLM_MAX_NUM_BATCHED_TOKENS: '512',
  QWEN_VLLM_GPU_MEMORY_UTILIZATION: '0.92',
  QWEN_FIXTURE_MAX_TOKENS: '256',
  QWEN_FIXTURE_IMAGE_SIZE_PX: '384',
  QWEN_VLLM_ENFORCE_EAGER: 'true',
  QWEN_VLLM_DTYPE: 'bfloat16',
  QWEN_VLLM_MM_PROCESSOR_CACHE_GB: '0',
}

const SERVICE_RESTORE_ENV: Record<string, string> = {
  QWEN_APPROVED_FIXTURE_INFERENCE_ENABLED: 'false',
  QWEN_INFERENCE_ENABLED: 'false',
  QWEN_MODEL_IMPORT_ON_STARTUP: 'false',
}

const SERVICE_TEMP_ENV_KEYS = Object.keys(SERVICE_ENABLE_ENV).filter((key) => !(key in SERVICE_RESTORE_ENV))
const ACCEPTED_EXECUTION_PROMPTS = [EXTERNAL_AGENT_TOOL_QWEN_READY_PROMPT, EXACT_PROMPT] as const

const FORBIDDEN_OUTPUT_PATTERNS: Array<[string, RegExp]> = [
  ['run app url', /\brun\.app\b/i],
  ['http url', /\bhttps?:\/\/\S+/i],
  ['bearer token', /\bBearer\s+\S+/i],
  ['access token', /\bya29\.[A-Za-z0-9._-]+/i],
  ['jwt', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/],
  ['service account email', /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.gserviceaccount\.com/i],
  ['raw worker prompt', /\braw[_-]?worker[_-]?prompt\b/i],
]

function main() {
  const execute = process.argv.includes('--execute')
  const json = process.argv.includes('--json')

  if (!execute) {
    print({
      ok: false,
      mode: 'qwen2_5_vl_58dw_bounded_private_inference_retry_static_guard',
      exactPrompt: EXACT_PROMPT,
      externalAgentReadyPrompt: EXTERNAL_AGENT_TOOL_QWEN_READY_PROMPT,
      acceptedExecutionPrompts: ACCEPTED_EXECUTION_PROMPTS,
      executeRequired: true,
      confirmationEnv: CONFIRM_ENV,
      confirmationEnvRequiredValue: 'true',
      runtimeRunNow: false,
      generatedAssetsCreated: false,
      supabaseTouched: false,
      creditMutationCreated: false,
      generatedLocalFixturePassedClaimed: false,
    }, json)
    return
  }

  if (process.env[CONFIRM_ENV] !== 'true') {
    throw new Error(`confirmation_env_required:${CONFIRM_ENV}=true`)
  }

  const result = runBoundedRetry()
  print(result, json)
}

function runBoundedRetry() {
  const runId = `qwen58dw-${new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15)}`
  const commands: CommandResult[] = []
  const blockers: string[] = []
  let serviceWasEnabled = false
  let executionName: string | undefined
  let jobExitCode: number | undefined
  let restored = false

  const beforeService = describeService()
  const beforeJob = describeJob()
  commands.push(beforeService, beforeJob)

  const selector = runJsonCommand('next_command', 'npx', [
    'tsx',
    'server/cli/external-agent-tool-next-command.ts',
    '--json',
  ])
  commands.push(selector)
  const selectorJson = selector.json
  const selectedManualAction =
    typeof selectorJson.chosenManualAction === 'string' ? selectorJson.chosenManualAction : undefined

  if (!ACCEPTED_EXECUTION_PROMPTS.some((prompt) => prompt === selectedManualAction)) {
    blockers.push('accepted_qwen_execution_prompt_not_selected')
  }
  if (selectorJson.executionAllowedNow !== true) blockers.push('external_agent_execution_not_allowed_now')
  if (selectorJson.qwenLivePreflightPassed !== true) blockers.push('qwen_live_preflight_not_passed')
  if (selectorJson.qwenAuthRefreshPassed !== true) blockers.push('qwen_auth_refresh_not_passed')

  const beforeServiceSummary = summarizeService(beforeService.json)
  const beforeJobSummary = summarizeJob(beforeJob.json)
  if (!beforeServiceSummary.ready) blockers.push('service_not_ready')
  if (beforeServiceSummary.minScaleAnnotationPresent) blockers.push('service_min_scale_present')
  if (beforeServiceSummary.templateMaxScale !== '1') blockers.push('service_template_max_scale_not_one')
  if (beforeServiceSummary.env.QWEN_APPROVED_FIXTURE_INFERENCE_ENABLED !== 'false') {
    blockers.push('service_fixture_gate_not_fail_closed_before_retry')
  }
  if (beforeServiceSummary.env.QWEN_INFERENCE_ENABLED !== 'false') {
    blockers.push('service_inference_gate_not_fail_closed_before_retry')
  }
  if (beforeJobSummary.env.QWEN_CPU_CALLER_EXECUTION_ENABLED !== 'false') {
    blockers.push('cpu_caller_execution_gate_not_fail_closed_before_retry')
  }
  if (beforeJobSummary.env.QWEN_CPU_CALLER_EXPECT_FIXTURE_INFERENCE !== 'false') {
    blockers.push('cpu_caller_fixture_expectation_not_fail_closed_before_retry')
  }
  if (beforeJobSummary.env.QWEN_PRIVATE_INVOKE_TARGET_URL_PRESENT) {
    blockers.push('cpu_caller_target_url_persisted_before_retry')
  }
  if (beforeJobSummary.env.QWEN_PRIVATE_INVOKE_AUDIENCE_PRESENT) {
    blockers.push('cpu_caller_audience_persisted_before_retry')
  }

  if (blockers.length) {
    return buildResult({
      runId,
      status: 'blocked',
      blockers,
      commands,
      beforeServiceSummary,
      beforeJobSummary,
      restored,
      executionName,
      jobExitCode,
    })
  }

  try {
    serviceWasEnabled = true
    const enable = runCommand('enable_service_fixture_inference', 'gcloud', [
      'run',
      'services',
      'update',
      SERVICE,
      '--project',
      PROJECT,
      '--region',
      REGION,
      '--quiet',
      '--update-env-vars',
      envArg(SERVICE_ENABLE_ENV),
    ], { timeoutMs: 10 * 60_000, redactOutput: true })
    commands.push(enable)
    if (!enable.ok) blockers.push('service_fixture_enable_failed')

    const enabledService = describeService()
    commands.push(enabledService)
    const enabledServiceSummary = summarizeService(enabledService.json)
    const serviceUrl = readServiceUrl(enabledService.json)
    if (!serviceUrl) blockers.push('service_url_missing_after_enable')
    if (enabledServiceSummary.env.QWEN_APPROVED_FIXTURE_INFERENCE_ENABLED !== 'true') {
      blockers.push('service_fixture_gate_not_enabled')
    }
    if (enabledServiceSummary.env.QWEN_INFERENCE_ENABLED !== 'true') {
      blockers.push('service_inference_gate_not_enabled')
    }

    if (!blockers.length && serviceUrl) {
      const executeJob = runCommand('execute_cpu_caller_job_once', 'gcloud', [
        'run',
        'jobs',
        'execute',
        JOB,
        '--project',
        PROJECT,
        '--region',
        REGION,
        '--quiet',
        '--wait',
        '--task-timeout',
        '900s',
        '--update-env-vars',
        envArg({
          QWEN_CPU_CALLER_EXECUTION_ENABLED: 'true',
          QWEN_CPU_CALLER_EXPECT_FIXTURE_INFERENCE: 'true',
          QWEN_CPU_CALLER_TIMEOUT_SECONDS: '840',
          QWEN_CPU_CALLER_REQUEST_ID: runId,
          QWEN_CPU_CALLER_JOB_ID: `mock-qwen-58dw-private-inference-job-${runId}`,
          QWEN_CPU_CALLER_LEASE_ID: `mock-qwen-58dw-private-inference-lease-${runId}`,
          QWEN_CPU_CALLER_IDEMPOTENCY_KEY: `mock-qwen-58dw-private-inference-idempotency-${runId}`,
          QWEN_PRIVATE_INVOKE_TARGET_URL: serviceUrl,
          QWEN_PRIVATE_INVOKE_AUDIENCE: serviceUrl,
        }),
      ], { timeoutMs: 16 * 60_000, redactOutput: true })
      commands.push(executeJob)
      jobExitCode = executeJob.ok ? 0 : 1
      if (!executeJob.ok) blockers.push('cpu_caller_job_execution_failed')

      const afterExecuteJob = describeJob()
      commands.push(afterExecuteJob)
      executionName = summarizeJob(afterExecuteJob.json).latestCreatedExecution
      if (executionName) {
        const execution = runJsonCommand('describe_cpu_caller_execution', 'gcloud', [
          'run',
          'jobs',
          'executions',
          'describe',
          executionName,
          '--project',
          PROJECT,
          '--region',
          REGION,
          '--format=json',
        ])
        commands.push(execution)
      }
    }
  } finally {
    if (serviceWasEnabled) {
      const restore = runCommand('restore_service_fail_closed', 'gcloud', [
        'run',
        'services',
        'update',
        SERVICE,
        '--project',
        PROJECT,
        '--region',
        REGION,
        '--quiet',
        '--update-env-vars',
        envArg(SERVICE_RESTORE_ENV),
        '--remove-env-vars',
        SERVICE_TEMP_ENV_KEYS.join(','),
      ], { timeoutMs: 10 * 60_000, redactOutput: true })
      commands.push(restore)
    }
  }

  const afterService = describeService()
  const afterJob = describeJob()
  commands.push(afterService, afterJob)
  const afterServiceSummary = summarizeService(afterService.json)
  const afterJobSummary = summarizeJob(afterJob.json)
  restored =
    afterServiceSummary.env.QWEN_APPROVED_FIXTURE_INFERENCE_ENABLED === 'false' &&
    afterServiceSummary.env.QWEN_INFERENCE_ENABLED === 'false' &&
    !SERVICE_TEMP_ENV_KEYS.some((key) => key in afterServiceSummary.env) &&
    afterJobSummary.env.QWEN_CPU_CALLER_EXECUTION_ENABLED === 'false' &&
    afterJobSummary.env.QWEN_CPU_CALLER_EXPECT_FIXTURE_INFERENCE === 'false' &&
    !afterJobSummary.env.QWEN_PRIVATE_INVOKE_TARGET_URL_PRESENT &&
    !afterJobSummary.env.QWEN_PRIVATE_INVOKE_AUDIENCE_PRESENT

  if (!restored) blockers.push('fail_closed_restore_verification_failed')

  return buildResult({
    runId,
    status: blockers.length ? 'blocked' : 'passed',
    blockers,
    commands,
    beforeServiceSummary,
    beforeJobSummary,
    afterServiceSummary,
    afterJobSummary,
    restored,
    executionName,
    jobExitCode,
  })
}

function describeService() {
  return runJsonCommand('describe_qwen_gpu_service', 'gcloud', [
    'run',
    'services',
    'describe',
    SERVICE,
    '--project',
    PROJECT,
    '--region',
    REGION,
    '--format=json',
  ])
}

function describeJob() {
  return runJsonCommand('describe_qwen_cpu_caller_job', 'gcloud', [
    'run',
    'jobs',
    'describe',
    JOB,
    '--project',
    PROJECT,
    '--region',
    REGION,
    '--format=json',
  ])
}

function runJsonCommand(id: string, command: string, args: string[]) {
  const result = runCommand(id, command, args, { redactOutput: false })
  let json: JsonRecord = {}
  try {
    json = JSON.parse(result.rawOutput ?? '{}') as JsonRecord
  } catch {
    result.ok = false
    result.errorSummary = [result.errorSummary, 'json_parse_failed'].filter(Boolean).join('; ')
  }
  return { ...result, json }
}

function runCommand(
  id: string,
  command: string,
  args: string[],
  options: { timeoutMs?: number; redactOutput?: boolean } = {},
) {
  const started = Date.now()
  try {
    const output = execFileSync(command, args, {
      cwd: process.cwd(),
      env: {
        ...process.env,
        CLOUDSDK_CORE_DISABLE_PROMPTS: '1',
      },
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 12,
      timeout: options.timeoutMs ?? 120_000,
    })
    return {
      id,
      ok: true,
      command: safeCommand(command, args),
      durationMs: Date.now() - started,
      outputSummary: options.redactOutput ? sanitize(output).slice(0, 1200) : summarizeKnownOutput(id, output),
      rawOutput: output,
    } as CommandResult & { rawOutput?: string }
  } catch (error) {
    const commandError = error as { stdout?: string; stderr?: string; message?: string }
    return {
      id,
      ok: false,
      command: safeCommand(command, args),
      durationMs: Date.now() - started,
      outputSummary: sanitize(commandError.stdout ?? '').slice(0, 1200) || undefined,
      errorSummary: sanitize(commandError.stderr ?? commandError.message ?? 'unknown_error').slice(0, 1600),
      rawOutput: commandError.stdout,
    } as CommandResult & { rawOutput?: string }
  }
}

function buildResult(input: {
  runId: string
  status: 'passed' | 'blocked'
  blockers: string[]
  commands: CommandResult[]
  beforeServiceSummary: ReturnType<typeof summarizeService>
  beforeJobSummary: ReturnType<typeof summarizeJob>
  afterServiceSummary?: ReturnType<typeof summarizeService>
  afterJobSummary?: ReturnType<typeof summarizeJob>
  restored: boolean
  executionName?: string
  jobExitCode?: number
}) {
  return {
    ok: input.status === 'passed',
    mode: 'qwen2_5_vl_58dw_bounded_private_inference_retry_result',
    decision:
      input.status === 'passed'
        ? 'qwen2_5_vl_58dw_bounded_private_inference_retry_passed_result_review_required'
        : 'qwen2_5_vl_58dw_bounded_private_inference_retry_blocked_or_failed_result_review_required',
    exactPrompt: EXACT_PROMPT,
    externalAgentReadyPrompt: EXTERNAL_AGENT_TOOL_QWEN_READY_PROMPT,
    acceptedExecutionPrompts: ACCEPTED_EXECUTION_PROMPTS,
    runId: input.runId,
    status: input.status,
    blockers: Array.from(new Set(input.blockers)),
    executionName: input.executionName,
    jobExitCode: input.jobExitCode,
    serviceRestoredFailClosed: input.restored,
    beforeService: input.beforeServiceSummary,
    afterService: input.afterServiceSummary,
    beforeJob: input.beforeJobSummary,
    afterJob: input.afterJobSummary,
    commands: input.commands.map((command) => ({
      id: command.id,
      ok: command.ok,
      command: command.command,
      durationMs: command.durationMs,
      outputSummary: command.outputSummary,
      errorSummary: command.errorSummary,
    })),
    runtimeFlags: {
      boundedRetryPromptExecuted: input.status === 'passed',
      temporaryFixtureInferenceServiceRevisionDeployed: input.commands.some((command) => command.id === 'enable_service_fixture_inference' && command.ok),
      cpuCallerJobExecuted: input.commands.some((command) => command.id === 'execute_cpu_caller_job_once' && command.ok),
      serviceRestoredFailClosed: input.restored,
      serviceTargetResolvedAtRuntimeOnly: input.commands.some((command) => command.id === 'execute_cpu_caller_job_once'),
      serviceTargetValueStoredInRepo: false,
      audienceResolvedAtRuntimeOnly: input.commands.some((command) => command.id === 'execute_cpu_caller_job_once'),
      audienceValueStoredInRepo: false,
      identityTokenPrinted: false,
      identityTokenValueStored: false,
      modelImportRun: input.status === 'passed',
      modelLoadRun: input.status === 'passed',
      vllmEngineInitialized: input.status === 'passed',
      inferenceRun: input.status === 'passed',
      metadataOnlyEvidenceCreated: input.status === 'passed',
      rawModelOutputStored: false,
      generatedAssetsCreated: false,
      publicArtifactsCreated: false,
      signedUrlsCreated: false,
      supabaseTouched: false,
      sqlExecuted: false,
      providerCallsMade: false,
      mediaProcessingRun: false,
      renderExportRun: false,
      creditMutationCreated: false,
      betaUnlocked: false,
      productionUnlocked: false,
      dryRunPassedClaimed: false,
      generatedLocalFixturePassedClaimed: false,
    },
    nextPrompt:
      input.status === 'passed'
        ? 'QWEN2_5_VL_STACK_TOOL_58DX-PRIVATE-INFERENCE-RESULT-REVIEW: review bounded Qwen private inference retry metadata, no generated assets/no beta'
        : 'QWEN2_5_VL_STACK_TOOL_58DW-FIX-2: fix bounded Qwen private inference retry-2 blocker, no generated assets/no mutation',
  } as const
}

function summarizeService(service: JsonRecord) {
  const metadata = asRecord(service.metadata)
  const spec = asRecord(service.spec)
  const template = asRecord(spec.template)
  const templateMetadata = asRecord(template.metadata)
  const templateSpec = asRecord(template.spec)
  const annotations = asRecord(metadata.annotations)
  const templateAnnotations = asRecord(templateMetadata.annotations)
  const containers = Array.isArray(templateSpec.containers) ? templateSpec.containers : []
  const container = asRecord(containers[0])
  const env = envMap(container.env)
  return {
    name: stringValue(metadata.name),
    generation: metadata.generation,
    latestReadyRevision: stringValue(asRecord(service.status).latestReadyRevisionName),
    ready: Boolean(readServiceReady(service)),
    ingress: stringValue(annotations['run.googleapis.com/ingress']),
    serviceMaxScale: stringValue(annotations['run.googleapis.com/maxScale']),
    templateMaxScale: stringValue(
      templateAnnotations['autoscaling.knative.dev/maxScale'] ?? templateAnnotations['run.googleapis.com/maxScale'],
    ),
    minScaleAnnotationPresent:
      typeof templateAnnotations['autoscaling.knative.dev/minScale'] === 'string' ||
      typeof annotations['run.googleapis.com/minScale'] === 'string',
    timeoutSeconds: templateSpec.timeoutSeconds,
    imageTag: stringValue(container.image)?.split('/').pop(),
    serviceUrlResolvedInMemory: Boolean(readServiceUrl(service)),
    serviceUrlStoredInOutput: false,
    env,
  }
}

function summarizeJob(job: JsonRecord) {
  const metadata = asRecord(job.metadata)
  const spec = asRecord(job.spec)
  const template = asRecord(asRecord(spec.template).spec)
  const templateSpec = asRecord(asRecord(template.template).spec)
  const containers = Array.isArray(templateSpec.containers) ? templateSpec.containers : []
  const container = asRecord(containers[0])
  const env = envMap(container.env)
  return {
    name: stringValue(metadata.name),
    generation: metadata.generation,
    latestCreatedExecution: stringValue(asRecord(asRecord(job.status).latestCreatedExecution).name)?.split('/').pop(),
    taskCount: template.taskCount,
    parallelism: template.parallelism,
    maxRetries: templateSpec.maxRetries,
    timeoutSeconds: templateSpec.timeoutSeconds,
    imageTag: stringValue(container.image)?.split('/').pop(),
    serviceAccountConfigured: typeof templateSpec.serviceAccountName === 'string',
    serviceAccountValueStoredInOutput: false,
    env: {
      QWEN_CPU_CALLER_EXECUTION_ENABLED: env.QWEN_CPU_CALLER_EXECUTION_ENABLED,
      QWEN_CPU_CALLER_EXPECT_FIXTURE_INFERENCE: env.QWEN_CPU_CALLER_EXPECT_FIXTURE_INFERENCE,
      QWEN_CPU_CALLER_TIMEOUT_SECONDS: env.QWEN_CPU_CALLER_TIMEOUT_SECONDS,
      QWEN_PRIVATE_INVOKE_TARGET_URL_PRESENT: Boolean(env.QWEN_PRIVATE_INVOKE_TARGET_URL),
      QWEN_PRIVATE_INVOKE_AUDIENCE_PRESENT: Boolean(env.QWEN_PRIVATE_INVOKE_AUDIENCE),
    },
  }
}

function readServiceReady(service: JsonRecord) {
  const conditions = asRecord(service.status).conditions
  return Array.isArray(conditions) && conditions.some((condition) => {
    const row = asRecord(condition)
    return row.type === 'Ready' && row.status === 'True'
  })
}

function readServiceUrl(service: JsonRecord) {
  const url = asRecord(service.status).url
  return typeof url === 'string' && url.trim() ? url.trim() : undefined
}

function envMap(value: unknown) {
  if (!Array.isArray(value)) return {} as Record<string, string>
  return Object.fromEntries(
    value
      .map((item) => asRecord(item))
      .filter((item) => typeof item.name === 'string')
      .map((item) => [String(item.name), typeof item.value === 'string' ? item.value : '']),
  )
}

function envArg(values: Record<string, string>) {
  return Object.entries(values).map(([key, value]) => `${key}=${value}`).join(',')
}

function summarizeKnownOutput(id: string, output: string) {
  if (id === 'next_command') {
    try {
      const parsed = JSON.parse(output) as JsonRecord
      return JSON.stringify({
        ok: parsed.ok === true,
        executionAllowedNow: parsed.executionAllowedNow === true,
        qwenLivePreflightPassed: parsed.qwenLivePreflightPassed === true,
        chosenManualAction: parsed.chosenManualAction,
      })
    } catch {
      return 'next_command_json_parse_failed'
    }
  }
  if (id.includes('describe')) return `${id}_json_resolved=true`
  return sanitize(output).slice(0, 1000)
}

function safeCommand(command: string, args: string[]) {
  const safeArgs = [...args]
  const envIndex = safeArgs.findIndex((arg) => arg === '--update-env-vars')
  if (envIndex >= 0 && envIndex + 1 < safeArgs.length) {
    safeArgs[envIndex + 1] = safeArgs[envIndex + 1]
      .split(',')
      .map((entry) => {
        const [key] = entry.split('=')
        if (key === 'QWEN_PRIVATE_INVOKE_TARGET_URL' || key === 'QWEN_PRIVATE_INVOKE_AUDIENCE') {
          return `${key}=redacted_not_stored`
        }
        return entry
      })
      .join(',')
  }
  return [command, ...safeArgs].join(' ')
}

function sanitize(value: string) {
  let output = value
  for (const [, pattern] of FORBIDDEN_OUTPUT_PATTERNS) {
    output = output.replace(pattern, 'redacted_not_stored')
  }
  return output.trim()
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {}
}

function print(value: unknown, json: boolean) {
  if (json) {
    console.log(JSON.stringify(value, null, 2))
    return
  }
  console.log(JSON.stringify(value, null, 2))
}

main()
