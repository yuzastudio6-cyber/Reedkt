import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import { QWEN25_PRIVATE_INVOKE_AUTH_REVERIFY_RESULT } from './qwen2-5-vl-cloud-run-gpu-private-invoke-auth-reverify-result'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_SMOKE_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-invoke-smoke-plan'
import {
  buildQwen25VlPrivateInvokeEnvelope,
} from '../../src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-envelope'
import {
  classifyQwen25VlPrivateInvokeResponse,
  type Qwen25VlPrivateInvokeResponseClassification,
} from '../../src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-response'

const execFileAsync = promisify(execFile)

type ProbeStatus = 'passed' | 'blocked'
type ResultStatus = 'passed' | 'blocked'
type JsonRecord = Record<string, unknown>

const CONFIRMATION_ENV = 'REEDITPRO_CONFIRM_QWEN25_VL_PRIVATE_INVOKE_SMOKE'
const IMPERSONATION_ENV = 'REEDITPRO_GCP_IMPERSONATE_SERVICE_ACCOUNT'
const TARGET = QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_SMOKE_PLAN.targetService
const EXPECTED_REASON =
  QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_SMOKE_PLAN.futureSmokeShape.expectedReason
const REDACTED = 'redacted_not_stored'
const SERVICE_ACCOUNT_EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.gserviceaccount\.com$/

export interface Qwen25PrivateInvokeSmokeProbe {
  readonly id: string
  readonly status: ProbeStatus
  readonly command: string
  readonly durationMs: number
  readonly outputSummary?: string
  readonly errorSummary?: string
}

type InternalProbe = Qwen25PrivateInvokeSmokeProbe & { rawOutput?: string }

export interface Qwen25PrivateInvokeSmokeExecuteResult {
  readonly mode: 'qwen2_5_vl_private_invoke_smoke_execute_result'
  readonly runId: string
  readonly status: ResultStatus
  readonly target: typeof TARGET
  readonly authReverifyRunId: string
  readonly preflightRunId?: string
  readonly probes: readonly Qwen25PrivateInvokeSmokeProbe[]
  readonly blockers: readonly string[]
  readonly smokeRequest: {
    readonly method: 'POST'
    readonly path: '/'
    readonly bodySource: 'approved_snapshot_local_queue_fixture'
    readonly bodyByteLength: number
    readonly maxBodyBytes: number
    readonly retryAttempted: false
  }
  readonly smokeResponse?: {
    readonly httpStatus?: number
    readonly serviceReason?: string
    readonly contractSatisfiedForFutureRuntime: boolean
    readonly modelInferenceEnabled: boolean
    readonly runtimeContractExecutesNow: boolean
    readonly classificationStatus: Qwen25VlPrivateInvokeResponseClassification['status']
    readonly runtimeCanAdvanceNow: false
    readonly persistOutputAllowedNow: false
    readonly creditSpendAllowedNow: false
  }
  readonly observedCostPosture: {
    readonly selectedGpu: 'nvidia_l4'
    readonly minScaleAnnotationPresent: boolean
    readonly templateMaxScale: string
    readonly serviceMaxScale: string
    readonly singleRequestNoRetry: true
    readonly costGuardReviewedBeforeInvoke: boolean
  }
  readonly runtimeFlags: Qwen25PrivateInvokeSmokeRuntimeFlags
  readonly nextPrompt: string
}

const BASE_RUNTIME_FLAGS = {
  privateInvokeSmokeRunnerDefined: true,
  requiresExplicitExecutionFlag: true,
  requiresConfirmationEnv: true,
  authReverifyPassed: true,
  costGuardReviewedBeforeInvoke: false,
  serviceUrlResolvedNow: false,
  serviceUrlValueStored: false,
  audienceResolvedNow: false,
  audienceValueStored: false,
	  authHeaderCreated: false,
	  identityTokenFetched: false,
	  identityTokenPrinted: false,
	  identityTokenValueStored: false,
	  serviceAccountImpersonationConfigured: false,
	  serviceAccountImpersonationAttempted: false,
	  serviceAccountKeyCreated: false,
	  cloudRunInvocationAttempted: false,
  serviceRuntimeRequestSent: false,
  responseClassifiedLocally: false,
  retryAttempted: false,
  modelImportRun: false,
  modelLoadRun: false,
  vllmEngineInitialized: false,
  promptProcessed: false,
  forwardPassRun: false,
  inferenceRun: false,
  providerCallsMade: false,
  workersDispatched: false,
  supabaseTouched: false,
  sqlExecuted: false,
  generatedAssetsCreated: false,
  publicArtifactsCreated: false,
  signedUrlsCreated: false,
  creditMutationCreated: false,
  betaUnlocked: false,
  productionUnlocked: false,
  dryRunPassedClaimed: false,
  generatedLocalFixturePassedClaimed: false,
} as const

type Qwen25PrivateInvokeSmokeRuntimeFlags = {
  [Key in keyof typeof BASE_RUNTIME_FLAGS]: boolean
}

export function buildQwen25PrivateInvokeSmokeStaticReport(): Qwen25PrivateInvokeSmokeExecuteResult {
  const envelope = buildQwen25VlPrivateInvokeEnvelope().envelope
  return {
    mode: 'qwen2_5_vl_private_invoke_smoke_execute_result',
    runId: 'not-run',
    status: 'blocked',
    target: TARGET,
    authReverifyRunId: QWEN25_PRIVATE_INVOKE_AUTH_REVERIFY_RESULT.runId,
    probes: [],
    blockers: ['private_invoke_smoke_not_run'],
    smokeRequest: {
      method: 'POST',
      path: '/',
      bodySource: 'approved_snapshot_local_queue_fixture',
      bodyByteLength: envelope?.bodyByteLength ?? 0,
      maxBodyBytes: envelope?.maxBodyBytes ?? 65536,
      retryAttempted: false,
    },
    observedCostPosture: {
      selectedGpu: 'nvidia_l4',
      minScaleAnnotationPresent: false,
      templateMaxScale: 'unknown',
      serviceMaxScale: 'unknown',
      singleRequestNoRetry: true,
      costGuardReviewedBeforeInvoke: false,
    },
    runtimeFlags: BASE_RUNTIME_FLAGS,
    nextPrompt:
      'QWEN2_5_VL_STACK_TOOL_52-PRIVATE-INVOKE-SMOKE-EXECUTE: run controlled private invoke contract smoke, no inference',
  }
}

export async function runQwen25PrivateInvokeSmoke(input: {
  execute: boolean
  runId?: string
  preflightRunId?: string
}): Promise<Qwen25PrivateInvokeSmokeExecuteResult> {
  if (!input.execute) {
    throw new Error('Pass --execute to run the guarded Qwen private invoke smoke.')
  }
  if (process.env[CONFIRMATION_ENV] !== 'true') {
    throw new Error(`env_guard_mismatch:${CONFIRMATION_ENV}`)
  }

  const runId = input.runId ??
    `qwen25-private-invoke-smoke-${new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15)}`
  const probes: InternalProbe[] = []
  const blockers: string[] = []

  probes.push(await probeCommand('gcloud_version', ['--version']))
  probes.push(await probeCommand('active_project', ['config', 'get-value', 'project']))

  const serviceDescribe = await probeCommand('cloud_run_service_describe', [
    'run',
    'services',
    'describe',
    TARGET.service,
    '--region',
    TARGET.region,
    '--project',
    TARGET.project,
    '--format=json',
  ])
  probes.push(serviceDescribe)

  const service = parseJson(serviceDescribe.rawOutput ?? '')
  const activeProject = probes.find((probe) => probe.id === 'active_project')
  if (activeProject?.outputSummary?.trim() !== TARGET.project) {
    blockers.push('active_project_mismatch')
  }

  const serviceUrl = readServiceUrl(service)
  if (!serviceUrl) blockers.push('service_url_missing_from_describe')

  const costPosture = readCostPosture(service)
  if (costPosture.minScaleAnnotationPresent) blockers.push('min_scale_annotation_present')
  if (costPosture.templateMaxScale !== '1') blockers.push('template_max_scale_not_one')
  if (costPosture.serviceMaxScale !== '3') blockers.push('service_max_scale_unexpected')

  const envelopeResult = buildQwen25VlPrivateInvokeEnvelope()
  if (!envelopeResult.envelopeAcceptedForFutureTransport || !envelopeResult.envelope) {
    blockers.push('approved_snapshot_queue_envelope_invalid')
  }

  if (blockers.length || !serviceUrl || !envelopeResult.envelope) {
    return buildResult({
      runId,
      preflightRunId: input.preflightRunId,
      probes,
      blockers,
      costPosture,
      envelopeByteLength: envelopeResult.envelope?.bodyByteLength ?? 0,
      maxBodyBytes: envelopeResult.envelope?.maxBodyBytes ?? 65536,
    })
  }

	  const impersonation = await resolveImpersonationServiceAccount(probes)
	  if (impersonation.probe) probes.push(impersonation.probe)
	  if (impersonation.blocker) blockers.push(impersonation.blocker)

	  if (blockers.length || !impersonation.serviceAccount) {
	    return buildResult({
	      runId,
	      preflightRunId: input.preflightRunId,
	      probes,
	      blockers,
	      costPosture,
	      envelopeByteLength: envelopeResult.envelope.bodyByteLength,
	      maxBodyBytes: envelopeResult.envelope.maxBodyBytes,
	      runtimeFlagOverrides: {
	        serviceUrlResolvedNow: true,
	        audienceResolvedNow: true,
	        costGuardReviewedBeforeInvoke: true,
	        serviceAccountImpersonationConfigured: Boolean(impersonation.serviceAccount),
	      },
	    })
	  }

	  const tokenProbe = await probeCommand(
	    'identity_token_fetch',
	    [
	      '--quiet',
	      '--impersonate-service-account',
	      impersonation.serviceAccount,
	      'auth',
	      'print-identity-token',
	      '--audiences',
	      serviceUrl,
	    ],
	    { redactAudienceArg: true, redactImpersonationArg: true },
	  )
  probes.push(tokenProbe)

	  const identityToken = tokenProbe.rawOutput?.trim()
	  if (tokenProbe.status !== 'passed' || !identityToken) {
	    blockers.push(classifyIdentityTokenBlocker(tokenProbe.errorSummary))
	    return buildResult({
	      runId,
	      preflightRunId: input.preflightRunId,
	      probes,
      blockers,
      costPosture,
      envelopeByteLength: envelopeResult.envelope.bodyByteLength,
	      maxBodyBytes: envelopeResult.envelope.maxBodyBytes,
	      runtimeFlagOverrides: {
	        serviceUrlResolvedNow: true,
	        audienceResolvedNow: true,
	        costGuardReviewedBeforeInvoke: true,
	        serviceAccountImpersonationConfigured: true,
	        serviceAccountImpersonationAttempted: true,
	      },
	    })
  }

  const requestStarted = Date.now()
  let httpStatus: number | undefined
  let bodyJson: unknown
  let responseProbe: Qwen25PrivateInvokeSmokeProbe

  try {
    const response = await fetch(serviceUrl, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${identityToken}`,
        'content-type': envelopeResult.envelope.contentType,
      },
      body: JSON.stringify(envelopeResult.envelope.bodyJson),
      signal: AbortSignal.timeout(300000),
    })
    httpStatus = response.status
    const responseText = await response.text()
    bodyJson = parseJson(responseText)
    responseProbe = {
      id: 'cloud_run_contract_post',
      status: 'passed',
      command: 'fetch redacted_service_url POST / with redacted_identity_token',
      durationMs: Date.now() - requestStarted,
      outputSummary: summarizeResponse(httpStatus, bodyJson),
    }
  } catch (error) {
    const commandError = error as { message?: string }
    responseProbe = {
      id: 'cloud_run_contract_post',
      status: 'blocked',
      command: 'fetch redacted_service_url POST / with redacted_identity_token',
      durationMs: Date.now() - requestStarted,
      errorSummary: sanitizeText(commandError.message ?? 'unknown_transport_error'),
    }
    blockers.push('cloud_run_contract_post_blocked')
  }
  probes.push(responseProbe)

  const classification = classifyQwen25VlPrivateInvokeResponse({
    httpStatus,
    bodyJson,
  })
  const body = asRecord(bodyJson)
  const expectedResponse =
    classification.status === 'blocked_contract_valid_inference_disabled' &&
    httpStatus === 403 &&
    classification.serviceReason === EXPECTED_REASON &&
    classification.contractSatisfiedForFutureRuntime === true &&
    body.modelInferenceEnabled === false &&
    body.runtimeContractExecutesNow === false

  if (!expectedResponse) blockers.push('private_invoke_response_unexpected')

  return buildResult({
    runId,
    preflightRunId: input.preflightRunId,
    probes,
    blockers,
    costPosture,
    envelopeByteLength: envelopeResult.envelope.bodyByteLength,
    maxBodyBytes: envelopeResult.envelope.maxBodyBytes,
    classification,
    body,
    httpStatus,
    runtimeFlagOverrides: {
	      costGuardReviewedBeforeInvoke: true,
	      serviceUrlResolvedNow: true,
	      audienceResolvedNow: true,
	      authHeaderCreated: true,
	      identityTokenFetched: true,
	      serviceAccountImpersonationConfigured: true,
	      serviceAccountImpersonationAttempted: true,
	      cloudRunInvocationAttempted: true,
      serviceRuntimeRequestSent: true,
      responseClassifiedLocally: true,
    },
  })
}

async function probeCommand(
  id: string,
  args: string[],
  options: { redactAudienceArg?: boolean; redactImpersonationArg?: boolean } = {},
): Promise<InternalProbe> {
  const started = Date.now()
  try {
    const { stdout, stderr } = await execFileAsync('gcloud', args, {
      env: {
        ...process.env,
        CLOUDSDK_CORE_DISABLE_PROMPTS: '1',
      },
      maxBuffer: 1024 * 1024,
    })
    return {
      id,
      status: 'passed',
      command: commandSummary(args, options),
      durationMs: Date.now() - started,
      outputSummary: summarizeProbeOutput(id, stdout),
      errorSummary: sanitizeText(stderr),
      rawOutput: stdout,
    }
  } catch (error) {
    const commandError = error as { stdout?: string; stderr?: string; message?: string }
    return {
      id,
      status: 'blocked',
      command: commandSummary(args, options),
      durationMs: Date.now() - started,
      outputSummary: summarizeProbeOutput(id, commandError.stdout ?? ''),
      errorSummary: sanitizeText(commandError.stderr ?? commandError.message ?? 'unknown_error'),
      rawOutput: commandError.stdout,
    }
  }
}

async function resolveImpersonationServiceAccount(
  probes: readonly InternalProbe[],
): Promise<{
  readonly serviceAccount?: string
  readonly source: 'environment' | 'gcloud_config' | 'none'
  readonly probe?: InternalProbe
  readonly blocker?: string
}> {
  const explicit = process.env[IMPERSONATION_ENV]?.trim()
  if (explicit) {
    return SERVICE_ACCOUNT_EMAIL_PATTERN.test(explicit)
      ? { serviceAccount: explicit, source: 'environment' }
      : { source: 'environment', blocker: 'invalid_impersonation_service_account_email' }
  }

  const configuredProbe = await probeCommand('configured_impersonation_service_account', [
    'config',
    'get-value',
    'auth/impersonate_service_account',
  ], { redactImpersonationArg: true })
  const configured = configuredProbe.rawOutput?.trim()

  if (configured && configured !== '(unset)') {
    return SERVICE_ACCOUNT_EMAIL_PATTERN.test(configured)
      ? { serviceAccount: configured, source: 'gcloud_config', probe: configuredProbe }
      : {
          source: 'gcloud_config',
          probe: configuredProbe,
          blocker: 'invalid_configured_impersonation_service_account_email',
        }
  }

  const alreadyProbed = probes.some((probe) => probe.id === configuredProbe.id)
  return {
    source: 'none',
    probe: alreadyProbed ? undefined : configuredProbe,
    blocker: 'impersonation_service_account_not_configured',
  }
}

function classifyIdentityTokenBlocker(errorSummary?: string) {
  const text = errorSummary ?? ''
  if (/iam\.serviceAccounts\.getAccessToken|service account token creator|TokenCreator/i.test(text)) {
    return 'token_creator_permission_required'
  }
  if (/impersonat/i.test(text)) {
    return 'impersonated_identity_token_fetch_blocked'
  }
  return 'identity_token_fetch_blocked'
}

function buildResult(input: {
  runId: string
  preflightRunId?: string
  probes: readonly Qwen25PrivateInvokeSmokeProbe[]
  blockers: readonly string[]
  costPosture: ReturnType<typeof readCostPosture>
  envelopeByteLength: number
  maxBodyBytes: number
  classification?: Qwen25VlPrivateInvokeResponseClassification
  body?: JsonRecord
  httpStatus?: number
  runtimeFlagOverrides?: Partial<Qwen25PrivateInvokeSmokeRuntimeFlags>
}): Qwen25PrivateInvokeSmokeExecuteResult {
  const status: ResultStatus = input.blockers.length ? 'blocked' : 'passed'
  const body = input.body ?? {}
  return {
    mode: 'qwen2_5_vl_private_invoke_smoke_execute_result',
    runId: input.runId,
    status,
    target: TARGET,
    authReverifyRunId: QWEN25_PRIVATE_INVOKE_AUTH_REVERIFY_RESULT.runId,
    preflightRunId: input.preflightRunId,
    probes: input.probes.map(stripProbeRawOutput),
    blockers: Array.from(new Set(input.blockers)),
    smokeRequest: {
      method: 'POST',
      path: '/',
      bodySource: 'approved_snapshot_local_queue_fixture',
      bodyByteLength: input.envelopeByteLength,
      maxBodyBytes: input.maxBodyBytes,
      retryAttempted: false,
    },
    smokeResponse: input.classification
      ? {
          httpStatus: input.httpStatus,
          serviceReason: input.classification.serviceReason,
          contractSatisfiedForFutureRuntime:
            input.classification.contractSatisfiedForFutureRuntime,
          modelInferenceEnabled: body.modelInferenceEnabled === true,
          runtimeContractExecutesNow: body.runtimeContractExecutesNow === true,
          classificationStatus: input.classification.status,
          runtimeCanAdvanceNow: false,
          persistOutputAllowedNow: false,
          creditSpendAllowedNow: false,
        }
      : undefined,
    observedCostPosture: {
      selectedGpu: 'nvidia_l4',
      ...input.costPosture,
      singleRequestNoRetry: true,
      costGuardReviewedBeforeInvoke:
        input.runtimeFlagOverrides?.costGuardReviewedBeforeInvoke === true,
    },
    runtimeFlags: {
      ...BASE_RUNTIME_FLAGS,
      ...input.runtimeFlagOverrides,
    } as Qwen25PrivateInvokeSmokeRuntimeFlags,
	    nextPrompt: nextPromptForResult(status, input.blockers),
	  }
	}

function stripProbeRawOutput(probe: InternalProbe): Qwen25PrivateInvokeSmokeProbe {
  return {
    id: probe.id,
    status: probe.status,
    command: probe.command,
    durationMs: probe.durationMs,
    outputSummary: probe.outputSummary,
    errorSummary: probe.errorSummary,
  }
}

function commandSummary(
  args: readonly string[],
  options: { redactAudienceArg?: boolean; redactImpersonationArg?: boolean },
) {
  if (!options.redactAudienceArg && !options.redactImpersonationArg) {
    return ['gcloud', ...args].join(' ')
  }
  const redactedArgs = [...args]
  const audienceIndex = redactedArgs.findIndex((arg) => arg === '--audiences')
  if (audienceIndex >= 0 && audienceIndex + 1 < redactedArgs.length) {
    redactedArgs[audienceIndex + 1] = REDACTED
  }
  const impersonationIndex = redactedArgs.findIndex((arg) => arg === '--impersonate-service-account')
  if (impersonationIndex >= 0 && impersonationIndex + 1 < redactedArgs.length) {
    redactedArgs[impersonationIndex + 1] = REDACTED
  }
  return ['gcloud', ...redactedArgs].join(' ')
}

function summarizeProbeOutput(id: string, text: string) {
  if (id === 'identity_token_fetch') {
    return text.trim()
      ? 'identity_token_fetched=true\nidentity_token_value_stored=false\nidentity_token_output_printed=false\n'
      : 'identity_token_fetched=false\n'
  }
  if (id === 'cloud_run_service_describe') {
    const service = parseJson(text)
    const metadata = asRecord(asRecord(service).metadata)
    const serviceAnnotations = asRecord(metadata.annotations)
    const spec = asRecord(asRecord(service).spec)
    const template = asRecord(spec.template)
    const templateMetadata = asRecord(template.metadata)
    const templateAnnotations = asRecord(templateMetadata.annotations)
    const status = asRecord(asRecord(service).status)
    const ingress = serviceAnnotations['run.googleapis.com/ingress'] ?? 'unknown'
    const templateMaxScale = templateAnnotations['autoscaling.knative.dev/maxScale'] ??
      templateAnnotations['run.googleapis.com/maxScale'] ??
      'unknown'
    const serviceMaxScale = serviceAnnotations['run.googleapis.com/maxScale'] ?? 'unknown'
    return [
      'service_describe_passed=true',
      `service_url_resolved_in_memory=${typeof status.url === 'string'}`,
      'service_url_value_stored=false',
      `ingress=${String(ingress)}`,
      `template_max_scale=${String(templateMaxScale)}`,
      `service_max_scale=${String(serviceMaxScale)}`,
    ].join('\n')
  }
  return sanitizeText(text).slice(0, 1200)
}

function nextPromptForResult(status: ResultStatus, blockers: readonly string[]) {
  if (status === 'passed') {
    return 'QWEN2_5_VL_STACK_TOOL_53-PRIVATE-INVOKE-SMOKE-REVIEW: review controlled private invoke result and plan inference enablement gate, no inference'
  }
  if (
    blockers.includes('token_creator_permission_required') ||
    blockers.includes('impersonated_identity_token_fetch_blocked')
  ) {
    return 'QWEN2_5_VL_STACK_TOOL_52-AUTHZ-FIX-PRIVATE-INVOKE-SMOKE: approve TokenCreator or attached-service-account token path, no inference'
  }
  return 'QWEN2_5_VL_STACK_TOOL_52-FIX-PRIVATE-INVOKE-SMOKE: fix controlled private invoke smoke blocker, no inference'
}

function sanitizeText(text: string) {
  return text
    .replace(/\bhttps?:\/\/\S+/gi, REDACTED)
    .replace(/\b[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/g, REDACTED)
    .replace(/ya29\.[A-Za-z0-9_-]+/g, REDACTED)
    .replace(/\bBearer\s+\S+/gi, `Bearer ${REDACTED}`)
    .replace(/\s+$/g, '')
}

function summarizeResponse(httpStatus: number, bodyJson: unknown) {
  const body = asRecord(bodyJson)
  return JSON.stringify({
    httpStatus,
    reason: typeof body.reason === 'string' ? body.reason : 'non_json_or_missing_reason',
    contractSatisfiedForFutureRuntime: body.contractSatisfiedForFutureRuntime === true,
    modelInferenceEnabled: body.modelInferenceEnabled === true,
    runtimeContractExecutesNow: body.runtimeContractExecutesNow === true,
  })
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonRecord
    : {}
}

function readServiceUrl(value: unknown) {
  const service = asRecord(value)
  const status = asRecord(service.status)
  return typeof status.url === 'string' && status.url.trim()
    ? status.url.trim()
    : undefined
}

function readCostPosture(value: unknown) {
  const service = asRecord(value)
  const metadata = asRecord(service.metadata)
  const serviceAnnotations = asRecord(metadata.annotations)
  const spec = asRecord(service.spec)
  const template = asRecord(spec.template)
  const templateMetadata = asRecord(template.metadata)
  const templateAnnotations = asRecord(templateMetadata.annotations)
  const minScale = templateAnnotations['autoscaling.knative.dev/minScale'] ??
    serviceAnnotations['run.googleapis.com/minScale']
  const templateMaxScale = templateAnnotations['autoscaling.knative.dev/maxScale'] ??
    templateAnnotations['run.googleapis.com/maxScale'] ??
    'unknown'
  const serviceMaxScale = serviceAnnotations['run.googleapis.com/maxScale'] ?? 'unknown'
  return {
    minScaleAnnotationPresent: typeof minScale === 'string' && minScale.length > 0,
    templateMaxScale: String(templateMaxScale),
    serviceMaxScale: String(serviceMaxScale),
  }
}
