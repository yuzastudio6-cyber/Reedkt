import { existsSync, readFileSync } from 'node:fs'
import {
  QWEN_TIMEOUT_ESCALATION_MODEL,
  QWEN_TIMEOUT_FALLBACK_SANITY_MODELS,
  QWEN_TIMEOUT_PRIMARY_MODEL,
} from './qwen-timeout-calibration-policy'
import type {
  ApprovedQwenSourceCase,
  QwenTimeoutCalibrationCase,
  QwenTimeoutModelId,
} from './qwen-timeout-calibration-types'

const APPROVED_CASES_PATH = 'docs/activation-model-orchestration-dry-run-approval-reports/dry_run_synthetic_cases.json'

export const QWEN_TIMEOUT_APPROVED_CASE_IDS = [
  'synthetic_edit_intent_extraction',
  'synthetic_timeline_planning',
  'synthetic_tool_route_metadata_recommendation',
  'synthetic_provider_fallback_comparison',
] as const

export const QWEN_TIMEOUT_SAFETY_FIELDS = [
  'workerExecutionAllowed',
  'toolExecutionAllowed',
  'routeExecutionAllowed',
  'publicArtifactsAllowed',
  'signedUrlsAllowed',
  'rawPromptForwardingAllowed',
  'directMutationAllowed',
  'productionMutationAllowed',
] as const

export const QWEN_TIMEOUT_SCHEMA_REQUIRED_FIELDS: Record<string, string[]> = {
  agent_findings_v1: ['caseId', 'findings', 'confidence', 'risks', 'blockedActions'],
  edit_intents_v1: ['caseId', 'intentSummary', 'segments', 'planningRequirements', 'approvalGates'],
  plan_snapshot_candidate_v1: ['caseId', 'candidateSummary', 'toolRouteHints', 'creditRiskNotes', 'requiredApprovals'],
  provider_fallback_assessment_v1: ['caseId', 'primaryCandidate', 'fallbackCandidate', 'comparisonReasons', 'dryRunLimits'],
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function asNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

export function loadApprovedQwenTimeoutSourceCases(): ApprovedQwenSourceCase[] {
  if (!existsSync(APPROVED_CASES_PATH)) return []
  const json = JSON.parse(readFileSync(APPROVED_CASES_PATH, 'utf8')) as Record<string, unknown>
  return asArray(json.cases)
    .map(asRecord)
    .filter((item) => QWEN_TIMEOUT_APPROVED_CASE_IDS.includes(asString(item.caseId) as typeof QWEN_TIMEOUT_APPROVED_CASE_IDS[number]))
    .filter((item) => asArray(item.allowedProviderCandidates).includes(QWEN_TIMEOUT_PRIMARY_MODEL))
    .map((item) => ({
      caseId: asString(item.caseId),
      prompt: asString(item.prompt),
      expectedOutputSchema: asString(item.expectedOutputSchema),
      maxTokens: asNumber(item.maxTokens, 900),
      timeoutMs: asNumber(item.timeoutMs, 12000),
    }))
}

export function buildQwenTimeoutCalibrationCases(options: {
  includeEscalation: boolean
  includeFallbackSanity: boolean
  escalationSourceCaseIds?: string[]
}): QwenTimeoutCalibrationCase[] {
  const cases = loadApprovedQwenTimeoutSourceCases()
  const calibrationCases: QwenTimeoutCalibrationCase[] = [
    buildMinimalCase(QWEN_TIMEOUT_PRIMARY_MODEL, 'minimal_non_stream'),
    buildMinimalCase(QWEN_TIMEOUT_PRIMARY_MODEL, 'minimal_stream'),
    ...cases.map((source) => buildReducedSchemaCase(source, QWEN_TIMEOUT_PRIMARY_MODEL)),
  ]

  if (options.includeEscalation) {
    calibrationCases.push(buildMinimalCase(QWEN_TIMEOUT_ESCALATION_MODEL, 'minimal_non_stream'))
    calibrationCases.push(buildMinimalCase(QWEN_TIMEOUT_ESCALATION_MODEL, 'minimal_stream'))
    const allowedSourceIds = options.escalationSourceCaseIds ?? cases.map((item) => item.caseId)
    calibrationCases.push(...cases
      .filter((source) => allowedSourceIds.includes(source.caseId))
      .map((source) => buildReducedSchemaCase(source, QWEN_TIMEOUT_ESCALATION_MODEL)))
  }

  if (options.includeFallbackSanity) {
    calibrationCases.push(...QWEN_TIMEOUT_FALLBACK_SANITY_MODELS.map((modelId) =>
      buildMinimalCase(modelId, 'fallback_sanity')))
  }

  return calibrationCases
}

export function buildMinimalCase(
  modelId: QwenTimeoutModelId,
  stage: 'minimal_non_stream' | 'minimal_stream' | 'fallback_sanity',
): QwenTimeoutCalibrationCase {
  const streaming = stage === 'minimal_stream'
  const requiredTopLevelFields = ['caseId', ...QWEN_TIMEOUT_SAFETY_FIELDS]
  return {
    caseId: `${stage}_${modelId.replace(/[^0-9A-Za-z]+/g, '_')}`,
    modelId,
    stage,
    mode: streaming ? 'streaming' : 'non_streaming',
    schemaId: 'qwen_timeout_minimal_v1',
    prompt: [
      'Return one compact JSON object only.',
      'Use synthetic timeout calibration metadata only.',
      'Required caseId is qwen_timeout_minimal.',
      'Set every execution, mutation, public artifact, signed URL, and raw prompt forwarding safety boolean to false.',
    ].join(' '),
    requiredTopLevelFields,
    timeoutMs: streaming ? 30000 : stage === 'fallback_sanity' ? 12000 : 20000,
    firstByteTimeoutMs: streaming ? 12000 : undefined,
    maxOutputTokens: 180,
  }
}

export function buildReducedSchemaCase(
  source: ApprovedQwenSourceCase,
  modelId: QwenTimeoutModelId,
): QwenTimeoutCalibrationCase {
  const requiredTopLevelFields = [
    ...new Set([
      ...(QWEN_TIMEOUT_SCHEMA_REQUIRED_FIELDS[source.expectedOutputSchema] ?? ['caseId']),
      ...QWEN_TIMEOUT_SAFETY_FIELDS,
    ]),
  ]
  return {
    caseId: `reduced_${source.caseId}_${modelId.replace(/[^0-9A-Za-z]+/g, '_')}`,
    sourceCaseId: source.caseId,
    modelId,
    stage: 'reduced_schema',
    mode: 'non_streaming',
    schemaId: source.expectedOutputSchema,
    prompt: [
      `Approved synthetic source case: ${source.caseId}.`,
      `Synthetic input summary: ${source.prompt}`,
      `Return JSON only for schema ${source.expectedOutputSchema}.`,
      `Required top-level fields: ${requiredTopLevelFields.join(', ')}.`,
      'Keep arrays short. Keep text values one sentence or shorter.',
      'Set all safety booleans to false. Do not request execution.',
    ].join('\n'),
    requiredTopLevelFields,
    timeoutMs: 45000,
    maxOutputTokens: Math.min(source.maxTokens, 650),
  }
}
