import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import {
  QWEN_TIMEOUT_APPROVED_BASE_URL,
  QWEN_TIMEOUT_REQUIRED_ENVIRONMENT,
  QWEN_TIMEOUT_SECRET_REFS,
} from './qwen-timeout-calibration-policy'
import type {
  LoadedDashScopeConfig,
  QwenTimeoutCalibrationCase,
  QwenTimeoutCalibrationResult,
  QwenTimeoutFailure,
  SecretAccessEntry,
  TokenUsage,
} from './qwen-timeout-calibration-types'
import { runQwenTimeoutStreamingCase } from './qwen-streaming-calibration'

const execFileAsync = promisify(execFile)
const MAX_SAFE_PROVIDER_CONTENT_CHARACTERS = 4000

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function asNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

export async function loadQwenTimeoutDashScopeConfig(): Promise<LoadedDashScopeConfig> {
  const envEntries = QWEN_TIMEOUT_SECRET_REFS
    .filter((secretRef) => (process.env[secretRef]?.trim().length ?? 0) > 0)
    .map((secretRef) => ({
      ...defaultSecretEntry(secretRef, 'failed'),
      envVarPresent: true,
      blocker: secretRef === 'DASHSCOPE_REGION' || secretRef === 'DASHSCOPE_BASE_URL' ? 'region_mismatch' : 'auth_regression',
    } satisfies SecretAccessEntry))

  if (envEntries.length > 0) {
    return {
      entries: [
        ...envEntries,
        ...QWEN_TIMEOUT_SECRET_REFS
          .filter((secretRef) => !envEntries.some((entry) => entry.secretRef === secretRef))
          .map((secretRef) => defaultSecretEntry(secretRef, 'not_attempted')),
      ],
      blockers: [...new Set(envEntries.map((entry) => entry.blocker).filter(Boolean))] as QwenTimeoutFailure[],
    }
  }

  const apiKey = await loadSecretManagerPayload('DASHSCOPE_API_KEY')
  const baseUrl = await loadSecretManagerPayload('DASHSCOPE_BASE_URL')
  const region = await loadSecretManagerPayload('DASHSCOPE_REGION')
  const entries: SecretAccessEntry[] = [
    buildLoadedSecretEntry('DASHSCOPE_API_KEY', apiKey),
    buildLoadedSecretEntry('DASHSCOPE_BASE_URL', baseUrl, baseUrl.value === QWEN_TIMEOUT_APPROVED_BASE_URL),
    buildLoadedSecretEntry('DASHSCOPE_REGION', region, region.value === 'us'),
  ]
  const blockers: QwenTimeoutFailure[] = []
  if (apiKey.status !== 'succeeded') blockers.push('auth_regression')
  if (baseUrl.status !== 'succeeded' || baseUrl.value !== QWEN_TIMEOUT_APPROVED_BASE_URL) blockers.push('region_mismatch')
  if (region.status !== 'succeeded' || region.value !== 'us') blockers.push('region_mismatch')
  return {
    apiKey: blockers.length === 0 ? apiKey.value : undefined,
    baseUrl: blockers.length === 0 ? baseUrl.value : undefined,
    entries,
    blockers: [...new Set(blockers)],
  }
}

export async function runQwenTimeoutCase(input: {
  currentCase: QwenTimeoutCalibrationCase
  baseUrl: string
  apiKey: string
}): Promise<QwenTimeoutCalibrationResult> {
  if (input.currentCase.mode === 'streaming') return runQwenTimeoutStreamingCase(input)
  return runQwenTimeoutNonStreamingCase(input)
}

export async function runQwenTimeoutNonStreamingCase(input: {
  currentCase: QwenTimeoutCalibrationCase
  baseUrl: string
  apiKey: string
}): Promise<QwenTimeoutCalibrationResult> {
  const started = Date.now()
  try {
    const response = await fetch(`${input.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${input.apiKey}`,
      },
      body: JSON.stringify(buildNonStreamingRequestBody(input.currentCase)),
      signal: AbortSignal.timeout(input.currentCase.timeoutMs),
    })
    const latencyMs = Date.now() - started
    const text = await response.text()
    if (!response.ok) {
      return buildBlockedQwenTimeoutResult(input.currentCase, classifyQwenTimeoutHttpError(response.status, text), {
        httpStatus: response.status,
        latencyMs,
        responseContentCharacters: text.length,
      })
    }

    let providerJson: Record<string, unknown>
    try {
      providerJson = JSON.parse(text) as Record<string, unknown>
    } catch {
      return buildBlockedQwenTimeoutResult(input.currentCase, 'schema_invalid', {
        httpStatus: response.status,
        latencyMs,
        responseContentCharacters: text.length,
      })
    }

    const choice = asRecord(asArray(providerJson.choices)[0])
    const message = asRecord(choice.message)
    const content = asString(message.content)
    const validation = parseAndValidateQwenTimeoutContent(content, input.currentCase)
    if (!validation.ok) {
      return buildBlockedQwenTimeoutResult(input.currentCase, validation.blocker, {
        httpStatus: response.status,
        latencyMs,
        finishReason: asString(choice.finish_reason),
        responseContentCharacters: content.length,
        usage: normalizeQwenTimeoutUsage(asRecord(providerJson.usage)),
      })
    }

    return {
      caseId: input.currentCase.caseId,
      sourceCaseId: input.currentCase.sourceCaseId,
      modelId: input.currentCase.modelId,
      stage: input.currentCase.stage,
      mode: input.currentCase.mode,
      schemaId: input.currentCase.schemaId,
      status: 'passed',
      httpStatus: response.status,
      latencyMs,
      finishReason: asString(choice.finish_reason),
      usage: normalizeQwenTimeoutUsage(asRecord(providerJson.usage)),
      responseContentCharacters: content.length,
      normalizedOutput: validation.normalized,
      rawProviderResponseStored: false,
      rawProviderResponsePrinted: false,
      secretPayloadPrinted: false,
      workerExecutionAllowed: false,
      toolExecutionAllowed: false,
      routeExecutionAllowed: false,
      publicArtifactsAllowed: false,
      signedUrlsAllowed: false,
      rawPromptForwardingAllowed: false,
      directMutationAllowed: false,
      productionMutationAllowed: false,
    }
  } catch (error) {
    return buildBlockedQwenTimeoutResult(input.currentCase, error instanceof Error && error.name === 'TimeoutError'
      ? 'provider_timeout'
      : 'provider_timeout', {
      latencyMs: Date.now() - started,
    })
  }
}

export function buildBlockedQwenTimeoutResult(
  currentCase: QwenTimeoutCalibrationCase,
  blocker: QwenTimeoutFailure,
  extra: Partial<QwenTimeoutCalibrationResult> = {},
): QwenTimeoutCalibrationResult {
  return {
    caseId: currentCase.caseId,
    sourceCaseId: currentCase.sourceCaseId,
    modelId: currentCase.modelId,
    stage: currentCase.stage,
    mode: currentCase.mode,
    schemaId: currentCase.schemaId,
    status: 'blocked',
    blocker,
    rawProviderResponseStored: false,
    rawProviderResponsePrinted: false,
    secretPayloadPrinted: false,
    workerExecutionAllowed: false,
    toolExecutionAllowed: false,
    routeExecutionAllowed: false,
    publicArtifactsAllowed: false,
    signedUrlsAllowed: false,
    rawPromptForwardingAllowed: false,
    directMutationAllowed: false,
    productionMutationAllowed: false,
    ...extra,
  }
}

export function parseAndValidateQwenTimeoutContent(
  content: string,
  currentCase: QwenTimeoutCalibrationCase,
): { ok: true; normalized: Record<string, unknown> } | { ok: false; blocker: QwenTimeoutFailure } {
  if (content.length > MAX_SAFE_PROVIDER_CONTENT_CHARACTERS) return { ok: false, blocker: 'output_too_large' }
  const clean = content.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
  let value: Record<string, unknown>
  try {
    value = JSON.parse(clean) as Record<string, unknown>
  } catch {
    return { ok: false, blocker: 'schema_invalid' }
  }
  const text = JSON.stringify(value)
  if (hasForbiddenOutputPattern(text)) return { ok: false, blocker: 'schema_invalid' }
  for (const field of currentCase.requiredTopLevelFields) {
    if (!(field in value)) return { ok: false, blocker: 'schema_invalid' }
  }
  for (const safetyField of [
    'workerExecutionAllowed',
    'toolExecutionAllowed',
    'routeExecutionAllowed',
    'publicArtifactsAllowed',
    'signedUrlsAllowed',
    'rawPromptForwardingAllowed',
    'directMutationAllowed',
    'productionMutationAllowed',
  ]) {
    if (value[safetyField] !== false) return { ok: false, blocker: 'schema_invalid' }
  }
  const normalized: Record<string, unknown> = {}
  for (const field of currentCase.requiredTopLevelFields) normalized[field] = value[field]
  normalized.schemaId = currentCase.schemaId
  return { ok: true, normalized }
}

export function normalizeQwenTimeoutUsage(value: Record<string, unknown>): TokenUsage {
  return {
    promptTokens: asNumber(value.prompt_tokens),
    completionTokens: asNumber(value.completion_tokens),
    totalTokens: asNumber(value.total_tokens),
  }
}

export function classifyQwenTimeoutHttpError(status: number, evidenceText: string): QwenTimeoutFailure {
  const evidence = evidenceText.toLowerCase()
  if (status === 401 || status === 403 || evidence.includes('unauthorized') || evidence.includes('permission')) {
    return 'auth_regression'
  }
  if (status === 404 || evidence.includes('model') || evidence.includes('not found')) return 'model_alias_unavailable'
  if (status === 408 || status === 504) return 'provider_timeout'
  if (status === 413 || evidence.includes('too large')) return 'prompt_too_large'
  return status >= 500 ? 'provider_timeout' : 'schema_invalid'
}

function buildNonStreamingRequestBody(currentCase: QwenTimeoutCalibrationCase) {
  return {
    model: currentCase.modelId,
    messages: [
      {
        role: 'system',
        content: [
          'You are a schema-only timeout calibration evaluator for ReeditPro.',
          'Return one JSON object only. Do not include markdown or prose outside JSON.',
          'Use synthetic metadata only. Do not ask to run workers, tools, routes, media, Supabase, public artifacts, signed URLs, production, external beta, or paid production.',
          'Keep hidden reasoning out of the response.',
        ].join(' '),
      },
      {
        role: 'user',
        content: currentCase.prompt,
      },
    ],
    max_tokens: currentCase.maxOutputTokens,
    temperature: 0,
    stream: false,
  }
}

async function loadSecretManagerPayload(secretRef: typeof QWEN_TIMEOUT_SECRET_REFS[number]): Promise<{
  status: SecretAccessEntry['payloadAccessStatus']
  value?: string
}> {
  try {
    const { stdout } = await execFileAsync('gcloud', [
      'secrets',
      'versions',
      'access',
      'latest',
      `--secret=${secretRef}`,
      `--project=${QWEN_TIMEOUT_REQUIRED_ENVIRONMENT.GCP_PROJECT_ID}`,
    ], {
      timeout: 20000,
      maxBuffer: 1024 * 1024,
      env: { ...process.env },
    })
    const value = stdout.trim()
    if (value.length === 0) return { status: 'failed' }
    return { status: 'succeeded', value }
  } catch {
    return { status: 'failed' }
  }
}

function buildLoadedSecretEntry(
  secretRef: typeof QWEN_TIMEOUT_SECRET_REFS[number],
  result: { status: SecretAccessEntry['payloadAccessStatus'] },
  payloadMatchedApprovedValue?: boolean,
): SecretAccessEntry {
  return {
    ...defaultSecretEntry(secretRef, result.status),
    source: result.status === 'succeeded' ? 'secret_manager' : 'unavailable',
    payloadMatchedApprovedValue,
  }
}

function defaultSecretEntry(
  secretRef: typeof QWEN_TIMEOUT_SECRET_REFS[number],
  status: SecretAccessEntry['payloadAccessStatus'],
): SecretAccessEntry {
  return {
    secretRef,
    source: 'unavailable',
    payloadAccessStatus: status,
    secretVersionSelector: 'latest',
    envVarPresent: false,
    payloadPrinted: false,
    payloadCommitted: false,
    secretValueStoredInReports: false,
  }
}

function hasForbiddenOutputPattern(text: string) {
  return [
    /postgres(?:ql)?:\/\//i,
    /service[_-]?role/i,
    /api[_-]?key/i,
    /access[_-]?token/i,
    /bearer\s+[A-Za-z0-9._-]+/i,
    /x-goog-signature=/i,
    /sk-[A-Za-z0-9]{20,}/,
    /execute\s+(worker|tool|route)/i,
    /run\s+(worker|tool|route)/i,
    /production\s+(write|deploy|mutation)/i,
  ].some((pattern) => pattern.test(text))
}
