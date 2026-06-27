import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

type Qwen25AuthProbeStatus = 'passed' | 'blocked' | 'failed'

export interface Qwen25AuthProbe {
  readonly id: string
  readonly status: Qwen25AuthProbeStatus
  readonly command: string
  readonly durationMs: number
  readonly outputSummary?: string
  readonly errorSummary?: string
}

export interface Qwen25PrivateInvokeAuthPreflightResult {
  readonly mode: 'qwen2_5_vl_private_invoke_auth_preflight_runner'
  readonly runId: string
  readonly status: Qwen25AuthProbeStatus
  readonly target: typeof QWEN25_PRIVATE_INVOKE_AUTH_TARGET
  readonly probes: readonly Qwen25AuthProbe[]
  readonly blockers: readonly string[]
  readonly runtimeFlags: typeof QWEN25_PRIVATE_INVOKE_AUTH_RUNTIME_FLAGS
}

const PROJECT_ID = 'reeditpro'
const REGION = 'us-central1'
const SERVICE = 'reeditpro-qwen2-5-vl-l4-worker'
const RUNTIME_IDENTITY = 'reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com'
const CONFIRMATION_ENV = 'REEDITPRO_CONFIRM_QWEN25_VL_PRIVATE_INVOKE_AUTH_PREFLIGHT'
const REDACTED = 'redacted_not_printed'

export const QWEN25_PRIVATE_INVOKE_AUTH_TARGET = {
  project: PROJECT_ID,
  region: REGION,
  service: SERVICE,
  runtimeIdentity: RUNTIME_IDENTITY
} as const

export const QWEN25_PRIVATE_INVOKE_AUTH_RUNTIME_FLAGS = {
  authPreflightRunnerDefined: true,
  defaultModeNonMutating: true,
  requiresExplicitExecutionFlag: true,
  requiresConfirmationEnv: true,
  tokenOutputPrinted: false,
  serviceAccountKeyCreated: false,
  serviceUrlResolvedNowByDefault: false,
  identityTokenFetched: false,
  cloudRunInvocationAttempted: false,
  serviceRuntimeRequestSent: false,
  iamBindingCreated: false,
  dispatchSubmitted: false,
  modelImportRun: false,
  modelLoadRun: false,
  vllmEngineInitialized: false,
  forwardPassRun: false,
  inferenceRun: false,
  supabaseTouched: false,
  sqlExecuted: false,
  generatedAssetsCreated: false,
  publicArtifactsCreated: false,
  signedUrlsCreated: false,
  creditMutationCreated: false,
  betaUnlocked: false,
  productionUnlocked: false,
  dryRunPassedClaimed: false,
  generatedLocalFixturePassedClaimed: false
} as const

export function getQwen25PrivateInvokeAuthPreflightPlan() {
  return {
    mode: 'qwen2_5_vl_private_invoke_auth_preflight_runner_plan',
    target: QWEN25_PRIVATE_INVOKE_AUTH_TARGET,
    defaultMode: 'plan_only_no_gcloud',
    executeMode: 'read_only_gcloud_describe_only',
    requiredConfirmationEnv: CONFIRMATION_ENV,
    tokenOutput: 'not_printed',
    serviceAccountKeys: 'blocked_not_created_not_committed',
    browserLoginInsideCodex: 'blocked',
    forbiddenCommands: [
      'gcloud auth login',
      'gcloud auth print-identity-token',
      'gcloud run services proxy',
      'gcloud run services update',
      'gcloud run services add-iam-policy-binding',
      'curl_service_url',
      'fetch_service_url'
    ],
    readOnlyProbeIds: [
      'gcloud_version',
      'active_project',
      'active_account',
      'cloud_run_service_describe',
      'cloud_run_service_iam_policy',
      'runtime_service_account_describe',
      'project_invoker_policy_read'
    ],
    runtimeFlags: QWEN25_PRIVATE_INVOKE_AUTH_RUNTIME_FLAGS
  } as const
}

export function buildQwen25PrivateInvokeAuthPreflightStaticReport(): Qwen25PrivateInvokeAuthPreflightResult {
  return {
    mode: 'qwen2_5_vl_private_invoke_auth_preflight_runner',
    runId: 'not-run',
    status: 'blocked',
    target: QWEN25_PRIVATE_INVOKE_AUTH_TARGET,
    probes: [],
    blockers: ['auth_preflight_not_run'],
    runtimeFlags: QWEN25_PRIVATE_INVOKE_AUTH_RUNTIME_FLAGS
  }
}

export async function runQwen25PrivateInvokeAuthPreflight(input: {
  execute: boolean
  runId?: string
}): Promise<Qwen25PrivateInvokeAuthPreflightResult> {
  if (!input.execute) {
    throw new Error('Pass --execute to run guarded read-only Qwen Cloud Run auth preflight.')
  }
  if (process.env[CONFIRMATION_ENV] !== 'true') {
    throw new Error(`env_guard_mismatch:${CONFIRMATION_ENV}`)
  }

  const runId = input.runId ?? `qwen25-private-invoke-auth-${new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15)}`
  const probes: Qwen25AuthProbe[] = []

  probes.push(await probeCommand('gcloud_version', ['--version']))
  probes.push(await probeCommand('active_project', ['config', 'get-value', 'project']))
  probes.push(await probeCommand('active_account', ['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']))
  probes.push(await probeCommand('cloud_run_service_describe', [
    'run',
    'services',
    'describe',
    SERVICE,
    '--region',
    REGION,
    '--project',
    PROJECT_ID,
    '--format=json'
  ]))
  probes.push(await probeCommand('cloud_run_service_iam_policy', [
    'run',
    'services',
    'get-iam-policy',
    SERVICE,
    '--region',
    REGION,
    '--project',
    PROJECT_ID,
    '--format=json'
  ]))
  probes.push(await probeCommand('runtime_service_account_describe', [
    'iam',
    'service-accounts',
    'describe',
    RUNTIME_IDENTITY,
    '--project',
    PROJECT_ID,
    '--format=json'
  ]))
  probes.push(await probeCommand('project_invoker_policy_read', [
    'projects',
    'get-iam-policy',
    PROJECT_ID,
    '--flatten=bindings[].members',
    `--filter=bindings.role:roles/run.invoker AND bindings.members:${RUNTIME_IDENTITY}`,
    '--format=json'
  ]))

  const blockers = collectBlockers(probes)
  return {
    mode: 'qwen2_5_vl_private_invoke_auth_preflight_runner',
    runId,
    status: blockers.length ? 'blocked' : 'passed',
    target: QWEN25_PRIVATE_INVOKE_AUTH_TARGET,
    probes,
    blockers,
    runtimeFlags: QWEN25_PRIVATE_INVOKE_AUTH_RUNTIME_FLAGS
  }
}

async function probeCommand(id: string, args: string[]): Promise<Qwen25AuthProbe> {
  const started = Date.now()
  try {
    const { stdout, stderr } = await execFileAsync('gcloud', args, {
      env: {
        ...process.env,
        CLOUDSDK_CORE_DISABLE_PROMPTS: '1'
      },
      maxBuffer: 1024 * 1024
    })
    return {
      id,
      status: 'passed',
      command: commandSummary(args),
      durationMs: Date.now() - started,
      outputSummary: sanitizeQwen25AuthProbeOutput(id, stdout),
      errorSummary: sanitizeQwen25AuthProbeOutput('gcloud_stderr', stderr)
    }
  } catch (error) {
    const commandError = error as { stdout?: string; stderr?: string; message?: string }
    return {
      id,
      status: 'blocked',
      command: commandSummary(args),
      durationMs: Date.now() - started,
      outputSummary: sanitizeQwen25AuthProbeOutput(id, commandError.stdout ?? ''),
      errorSummary: sanitizeQwen25AuthProbeOutput(
        'gcloud_stderr',
        commandError.stderr ?? commandError.message ?? 'unknown_error',
      )
    }
  }
}

function commandSummary(args: readonly string[]) {
  return ['gcloud', ...args].join(' ')
}

export function sanitizeQwen25AuthProbeOutput(probeId: string, text: string) {
  if (probeId === 'active_account') {
    return summarizeActiveAccountOutput(text)
  }

  const urlPattern = new RegExp('\\b' + 'https?' + ':\\/\\/\\S+', 'gi')
  return text
    .replace(urlPattern, REDACTED)
    .replace(/\b[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/g, REDACTED)
    .replace(/ya29\.[A-Za-z0-9_-]+/g, REDACTED)
    .slice(0, 1200)
}

function summarizeActiveAccountOutput(text: string) {
  const account = text.trim().split('\n').find(Boolean)

  if (!account) {
    return 'active_account_present=false\nactive_account_value_stored=false\n'
  }

  const domain = account.includes('@') ? account.split('@').at(-1) : 'unknown'

  return [
    'active_account_present=true',
    'active_account_value_stored=false',
    `active_account_domain=${domain}`,
    ''
  ].join('\n')
}

function collectBlockers(probes: readonly Qwen25AuthProbe[]) {
  const blockers: string[] = []
  const activeProject = probes.find((probe) => probe.id === 'active_project')
  if (activeProject?.status === 'passed') {
    const projectLine = activeProject.outputSummary?.trim().split('\n').filter(Boolean).at(-1)
    if (projectLine !== PROJECT_ID) blockers.push(`project_mismatch:${projectLine ?? 'unknown'}`)
  }
  for (const probe of probes) {
    if (probe.status !== 'passed') blockers.push(`${probe.id}_blocked`)
  }
  return Array.from(new Set(blockers))
}
