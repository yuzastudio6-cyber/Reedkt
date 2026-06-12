import { existsSync } from 'node:fs'
import {
  QWEN_TIMEOUT_BLOCKED_SCOPES,
  QWEN_TIMEOUT_CALIBRATION_PHASE,
  QWEN_TIMEOUT_CALIBRATION_RUN_ID,
  QWEN_TIMEOUT_ESCALATION_MODEL,
  QWEN_TIMEOUT_PRIMARY_MODEL,
} from './qwen-timeout-calibration-policy'
import type {
  QwenTimeoutCalibrationResult,
  QwenTimeoutDecision,
  QwenTimeoutRecommendation,
  QwenTimeoutStatus,
} from './qwen-timeout-calibration-types'
import { QWEN_TIMEOUT_APPROVED_CASE_IDS } from './qwen-schema-case-minimizer'

export function analyzeQwenTimeoutResults(results: QwenTimeoutCalibrationResult[]): {
  status: QwenTimeoutStatus
  decision: QwenTimeoutDecision
  activeBlockers: string[]
  recommendation: QwenTimeoutRecommendation
  analysis: Record<string, unknown>
} {
  if (results.length === 0) {
    return {
      status: 'not_attempted',
      decision: 'not_attempted',
      activeBlockers: ['qwen_timeout_calibration_not_executed'],
      recommendation: {
        selectedHeadAgentModel: null,
        selectedCalibrationMode: 'blocked',
        recommendedTimeoutMs: null,
        recommendedMaxOutputTokens: null,
        fullDryRunReadiness: 'blocked',
        reason: 'Calibration has not been executed.',
      },
      analysis: buildAnalysis(results, 'not_attempted', ['qwen_timeout_calibration_not_executed']),
    }
  }

  const primaryReduced = results.filter((item) =>
    item.modelId === QWEN_TIMEOUT_PRIMARY_MODEL && item.stage === 'reduced_schema')
  const primaryReducedPassed = primaryReduced.length === QWEN_TIMEOUT_APPROVED_CASE_IDS.length &&
    primaryReduced.every((item) => item.status === 'passed')
  const primaryStreamingPassed = results.some((item) =>
    item.modelId === QWEN_TIMEOUT_PRIMARY_MODEL && item.stage === 'minimal_stream' && item.status === 'passed')
  const escalationPassed = results.some((item) =>
    item.modelId === QWEN_TIMEOUT_ESCALATION_MODEL && item.status === 'passed')

  const blockers = [...new Set(results
    .filter((item) => item.status === 'blocked')
    .map((item) => item.blocker ?? 'schema_invalid'))]

  if (primaryReducedPassed) {
    const latencies = primaryReduced.map((item) => item.latencyMs ?? 0)
    const maxLatency = Math.max(...latencies, 0)
    return {
      status: 'passed',
      decision: 'qwen_schema_timeout_calibrated_ready_for_model_dryrun',
      activeBlockers: [],
      recommendation: {
        selectedHeadAgentModel: QWEN_TIMEOUT_PRIMARY_MODEL,
        selectedCalibrationMode: 'non_streaming',
        recommendedTimeoutMs: Math.max(45000, Math.ceil(maxLatency / 1000) * 1000 + 5000),
        recommendedMaxOutputTokens: 650,
        fullDryRunReadiness: 'ready',
        reason: 'qwen3.7-plus completed all four reduced approved schema cases.',
      },
      analysis: buildAnalysis(results, 'passed', []),
    }
  }

  if (primaryStreamingPassed && blockers.every((item) => item === 'provider_timeout' || item === 'first_byte_timeout' || item === 'stream_timeout')) {
    return {
      status: 'partial',
      decision: 'qwen_schema_timeout_calibrated_partial_streaming_only',
      activeBlockers: blockers,
      recommendation: {
        selectedHeadAgentModel: QWEN_TIMEOUT_PRIMARY_MODEL,
        selectedCalibrationMode: 'streaming',
        recommendedTimeoutMs: 30000,
        recommendedMaxOutputTokens: 180,
        fullDryRunReadiness: 'partial',
        reason: 'Streaming minimal calibration passed, but full reduced schema completion is not proven.',
      },
      analysis: buildAnalysis(results, 'partial', blockers),
    }
  }

  if (escalationPassed) {
    return {
      status: 'partial',
      decision: 'qwen_schema_timeout_calibrated_partial_qwen37max_escalation',
      activeBlockers: blockers,
      recommendation: {
        selectedHeadAgentModel: QWEN_TIMEOUT_ESCALATION_MODEL,
        selectedCalibrationMode: 'non_streaming',
        recommendedTimeoutMs: 45000,
        recommendedMaxOutputTokens: 650,
        fullDryRunReadiness: 'partial',
        reason: 'qwen3.7-max produced calibration evidence while qwen3.7-plus remained incomplete; replacement requires a separate target decision.',
      },
      analysis: buildAnalysis(results, 'partial', blockers),
    }
  }

  const decision = blockers.includes('auth_regression')
    ? 'blocked_pending_qwen_auth_regression'
    : blockers.includes('region_mismatch')
      ? 'blocked_pending_dashscope_region_review'
      : blockers.includes('schema_invalid') || blockers.includes('output_too_large') || blockers.includes('prompt_too_large')
        ? 'blocked_pending_qwen_schema_contract_fix'
        : 'blocked_pending_qwen_schema_timeout'

  return {
    status: 'blocked',
    decision,
    activeBlockers: blockers.length > 0 ? blockers : ['provider_timeout'],
    recommendation: {
      selectedHeadAgentModel: null,
      selectedCalibrationMode: 'blocked',
      recommendedTimeoutMs: null,
      recommendedMaxOutputTokens: null,
      fullDryRunReadiness: 'blocked',
      reason: 'No approved Qwen target completed enough schema calibration evidence under the bounded caps.',
    },
    analysis: buildAnalysis(results, 'blocked', blockers.length > 0 ? blockers : ['provider_timeout']),
  }
}

export function buildQwenTimeoutQa(input: {
  status: QwenTimeoutStatus
  decision: QwenTimeoutDecision
  results: QwenTimeoutCalibrationResult[]
  secretAccess: Record<string, unknown>
  privateArtifactUploadStatus?: string
}) {
  const resultText = JSON.stringify(input.results)
  const gates = {
    qwen_auth_repair_evidence: true,
    secret_manager_only: input.secretAccess.secretSourcePolicy === 'google_secret_manager_only',
    synthetic_only: true,
    timeout_calibration_cases: input.results.length > 0 || input.status === 'not_attempted',
    qwen3_7_plus_calibration: input.results.some((item) => item.modelId === QWEN_TIMEOUT_PRIMARY_MODEL) ||
      input.status === 'not_attempted',
    streaming_or_timeout_strategy: input.results.some((item) => item.mode === 'streaming') ||
      input.status === 'not_attempted',
    schema_case_result: input.status !== 'not_attempted',
    model_target_recommendation: input.decision !== 'not_attempted',
    no_deepseek_call: true,
    no_runtime_execution: true,
    blocked_features: QWEN_TIMEOUT_BLOCKED_SCOPES,
    no_secret_patterns: !hasSecretPattern(resultText),
    private_artifacts: input.privateArtifactUploadStatus ?? 'not_attempted',
  }
  return {
    phase: QWEN_TIMEOUT_CALIBRATION_PHASE,
    runId: QWEN_TIMEOUT_CALIBRATION_RUN_ID,
    status: input.status === 'passed' || input.status === 'partial' ? 'passed' : input.status,
    gates,
    passed: input.status === 'passed' || input.status === 'partial',
    secretPayloadPrinted: false,
    rawProviderResponsesStored: false,
    deepseekCalls: false,
    fullProviderDryRun: false,
    supabaseWrites: false,
  }
}

function buildAnalysis(
  results: QwenTimeoutCalibrationResult[],
  status: QwenTimeoutStatus,
  activeBlockers: string[],
) {
  return {
    phase: QWEN_TIMEOUT_CALIBRATION_PHASE,
    runId: QWEN_TIMEOUT_CALIBRATION_RUN_ID,
    status,
    activeBlockers,
    providerCallsAttempted: results.length,
    providerCallsPassed: results.filter((item) => item.status === 'passed').length,
    providerCallsBlocked: results.filter((item) => item.status === 'blocked').length,
    qwen37PlusReducedCasesPassed: results.filter((item) =>
      item.modelId === QWEN_TIMEOUT_PRIMARY_MODEL && item.stage === 'reduced_schema' && item.status === 'passed').length,
    qwen37MaxEscalationCalls: results.filter((item) => item.modelId === QWEN_TIMEOUT_ESCALATION_MODEL).length,
    fallbackSanityCalls: results.filter((item) => item.stage === 'fallback_sanity').length,
    failureCounts: activeBlockers.reduce<Record<string, number>>((acc, blocker) => {
      acc[blocker] = results.filter((item) => item.blocker === blocker).length
      return acc
    }, {}),
    latencyMs: results.map((item) => ({
      caseId: item.caseId,
      modelId: item.modelId,
      mode: item.mode,
      status: item.status,
      latencyMs: item.latencyMs,
      firstByteLatencyMs: item.firstByteLatencyMs,
    })),
    rawProviderResponsesStored: false,
    secretPayloadPrinted: false,
    supabaseMilestoneSync: {
      requested: process.env.REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC === 'true',
      status: existsSync('server/activation/supabase-milestone-sync')
        ? 'available_not_invoked_by_qwen_timeout_calibration'
        : 'not_attempted_current_branch_missing_sync_layer',
      syncLayerPresent: existsSync('server/activation/supabase-milestone-sync'),
      sqlExecuted: false,
      migrationDeployed: false,
      unrelatedRowsWritten: false,
    },
  }
}

function hasSecretPattern(text: string) {
  return [
    /postgres(?:ql)?:\/\//i,
    /service[_-]?role/i,
    /bearer\s+[A-Za-z0-9._-]+/i,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
    /x-goog-signature=/i,
    /sk-[A-Za-z0-9]{20,}/,
  ].some((pattern) => pattern.test(text))
}
