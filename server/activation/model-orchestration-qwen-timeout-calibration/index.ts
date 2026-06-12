import {
  QWEN_TIMEOUT_CALIBRATION_PHASE,
  QWEN_TIMEOUT_FORBIDDEN_CONFIRMATIONS,
  QWEN_TIMEOUT_REQUIRED_CONFIRMATIONS,
  QWEN_TIMEOUT_REQUIRED_ENVIRONMENT,
  QWEN_TIMEOUT_SECRET_REFS,
} from './qwen-timeout-calibration-policy'
import type {
  QwenTimeoutCalibrationCase,
  QwenTimeoutCalibrationResult,
  QwenTimeoutExecutionOptions,
  SecretAccessEntry,
} from './qwen-timeout-calibration-types'
import {
  buildMinimalCase,
  buildQwenTimeoutCalibrationCases,
  buildReducedSchemaCase,
  loadApprovedQwenTimeoutSourceCases,
} from './qwen-schema-case-minimizer'
import { uploadQwenTimeoutPrivateArtifacts } from './qwen-timeout-artifacts'
import { analyzeQwenTimeoutResults } from './qwen-timeout-result-analyzer'
import {
  buildQwenTimeoutCalibrationReports,
  readQwenTimeoutCalibrationSummary,
  writeQwenTimeoutCalibrationArtifacts,
} from './qwen-timeout-report-builder'
import {
  loadQwenTimeoutDashScopeConfig,
  runQwenTimeoutCase,
} from './qwen-timeout-target-runner'

export * from './qwen-timeout-calibration-types'
export * from './qwen-timeout-calibration-policy'
export * from './qwen-timeout-source-audit'
export * from './qwen-schema-case-minimizer'
export * from './qwen-timeout-target-runner'
export * from './qwen-streaming-calibration'
export * from './qwen-timeout-result-analyzer'
export * from './qwen-timeout-artifacts'
export * from './qwen-timeout-report-builder'

export async function executeQwenTimeoutCalibration(
  options: QwenTimeoutExecutionOptions,
): Promise<{ exitCode: number }> {
  if (!options.execute) {
    const reports = buildQwenTimeoutCalibrationReports({
      executed: false,
      status: 'blocked',
      decision: 'blocked_pending_qwen_schema_timeout',
      activeBlockers: ['execution_requires_explicit_execute_flag'],
      secretEntries: defaultSecretEntries('not_attempted'),
    })
    await writeQwenTimeoutCalibrationArtifacts(reports)
    return { exitCode: 1 }
  }

  const environmentBlockers = Object.entries(QWEN_TIMEOUT_REQUIRED_ENVIRONMENT)
    .filter(([key, value]) => process.env[key] !== value)
    .map(([key, value]) => `missing_or_mismatched_environment:${key}:${value}`)
  const missingConfirmations = QWEN_TIMEOUT_REQUIRED_CONFIRMATIONS
    .filter((name) => process.env[name] !== 'true')
    .map((name) => `missing_confirmation:${name}`)
  const forbiddenConfirmations = QWEN_TIMEOUT_FORBIDDEN_CONFIRMATIONS
    .filter((name) => process.env[name] === 'true')
    .map((name) => `forbidden_confirmation:${name}`)
  const guardBlockers = [...environmentBlockers, ...missingConfirmations, ...forbiddenConfirmations]
  if (guardBlockers.length > 0) {
    const reports = buildQwenTimeoutCalibrationReports({
      executed: true,
      status: 'blocked',
      decision: 'blocked_pending_qwen_schema_timeout',
      activeBlockers: guardBlockers,
      secretEntries: defaultSecretEntries('not_attempted'),
    })
    await writeQwenTimeoutCalibrationArtifacts(reports)
    return { exitCode: 1 }
  }

  const dashScopeConfig = await loadQwenTimeoutDashScopeConfig()
  if (!dashScopeConfig.apiKey || !dashScopeConfig.baseUrl) {
    const decision = dashScopeConfig.blockers.includes('region_mismatch')
      ? 'blocked_pending_dashscope_region_review'
      : 'blocked_pending_qwen_auth_regression'
    const reports = buildQwenTimeoutCalibrationReports({
      executed: true,
      status: 'blocked',
      decision,
      activeBlockers: dashScopeConfig.blockers,
      secretEntries: dashScopeConfig.entries,
    })
    await writeQwenTimeoutCalibrationArtifacts(reports)
    return { exitCode: 1 }
  }

  const sourceCases = loadApprovedQwenTimeoutSourceCases()
  if (sourceCases.length !== 4) {
    const reports = buildQwenTimeoutCalibrationReports({
      executed: true,
      sourceCases,
      status: 'blocked',
      decision: 'blocked_pending_qwen_schema_contract_fix',
      activeBlockers: [`expected_4_approved_qwen_cases_found_${sourceCases.length}`],
      secretEntries: dashScopeConfig.entries,
    })
    await writeQwenTimeoutCalibrationArtifacts(reports)
    return { exitCode: 1 }
  }

  const primaryCases = buildQwenTimeoutCalibrationCases({
    includeEscalation: false,
    includeFallbackSanity: false,
  })
  const results: QwenTimeoutCalibrationResult[] = []
  for (const currentCase of primaryCases) {
    results.push(await runQwenTimeoutCase({
      currentCase,
      baseUrl: dashScopeConfig.baseUrl,
      apiKey: dashScopeConfig.apiKey,
    }))
  }

  const failedPrimary = results.filter((item) => item.status === 'blocked')
  if (failedPrimary.length > 0) {
    const escalationCases = buildEscalationCases(failedPrimary)
    for (const currentCase of escalationCases) {
      results.push(await runQwenTimeoutCase({
        currentCase,
        baseUrl: dashScopeConfig.baseUrl,
        apiKey: dashScopeConfig.apiKey,
      }))
    }
  }

  const approvedTargetPassed = results.some((item) =>
    (item.modelId === 'qwen3.7-plus' || item.modelId === 'qwen3.7-max') && item.status === 'passed')
  if (!approvedTargetPassed) {
    const fallbackCases: QwenTimeoutCalibrationCase[] = [
      buildMinimalCase('qwen-plus-us', 'fallback_sanity'),
      buildMinimalCase('qwen-flash-us', 'fallback_sanity'),
    ]
    for (const currentCase of fallbackCases) {
      results.push(await runQwenTimeoutCase({
        currentCase,
        baseUrl: dashScopeConfig.baseUrl,
        apiKey: dashScopeConfig.apiKey,
      }))
    }
  }

  const analyzed = analyzeQwenTimeoutResults(results)
  let reports = buildQwenTimeoutCalibrationReports({
    executed: true,
    sourceCases,
    calibrationCases: [
      ...primaryCases,
      ...buildEscalationCases(failedPrimary),
      ...(approvedTargetPassed ? [] : [
        buildMinimalCase('qwen-plus-us', 'fallback_sanity'),
        buildMinimalCase('qwen-flash-us', 'fallback_sanity'),
      ]),
    ],
    results,
    secretEntries: dashScopeConfig.entries,
    status: analyzed.status,
    decision: analyzed.decision,
    activeBlockers: analyzed.activeBlockers,
    analysis: analyzed.analysis,
    recommendation: analyzed.recommendation,
  })
  const upload = await uploadQwenTimeoutPrivateArtifacts(reports)
  reports = buildQwenTimeoutCalibrationReports({
    executed: true,
    sourceCases,
    calibrationCases: [
      ...primaryCases,
      ...buildEscalationCases(failedPrimary),
      ...(approvedTargetPassed ? [] : [
        buildMinimalCase('qwen-plus-us', 'fallback_sanity'),
        buildMinimalCase('qwen-flash-us', 'fallback_sanity'),
      ]),
    ],
    results,
    secretEntries: dashScopeConfig.entries,
    status: analyzed.status,
    decision: analyzed.decision,
    activeBlockers: analyzed.activeBlockers,
    analysis: analyzed.analysis,
    recommendation: analyzed.recommendation,
    privateArtifactUpload: upload,
  })
  await writeQwenTimeoutCalibrationArtifacts(reports)
  return { exitCode: analyzed.status === 'passed' && upload.status === 'uploaded' ? 0 : 1 }
}

export {
  buildQwenTimeoutCalibrationReports,
  readQwenTimeoutCalibrationSummary,
  writeQwenTimeoutCalibrationArtifacts,
}

function buildEscalationCases(failedPrimary: QwenTimeoutCalibrationResult[]): QwenTimeoutCalibrationCase[] {
  const sourceCases = loadApprovedQwenTimeoutSourceCases()
  const cases: QwenTimeoutCalibrationCase[] = []
  if (failedPrimary.some((item) => item.stage === 'minimal_non_stream')) {
    cases.push(buildMinimalCase('qwen3.7-max', 'minimal_non_stream'))
  }
  if (failedPrimary.some((item) => item.stage === 'minimal_stream')) {
    cases.push(buildMinimalCase('qwen3.7-max', 'minimal_stream'))
  }
  const failedSourceIds = failedPrimary
    .filter((item) => item.stage === 'reduced_schema' && item.sourceCaseId)
    .map((item) => String(item.sourceCaseId))
  for (const source of sourceCases.filter((item) => failedSourceIds.includes(item.caseId))) {
    cases.push(buildReducedSchemaCase(source, 'qwen3.7-max'))
  }
  return cases
}

function defaultSecretEntries(status: SecretAccessEntry['payloadAccessStatus']): SecretAccessEntry[] {
  return QWEN_TIMEOUT_SECRET_REFS.map((secretRef) => ({
    secretRef,
    source: 'unavailable',
    payloadAccessStatus: status,
    secretVersionSelector: 'latest',
    envVarPresent: false,
    payloadPrinted: false,
    payloadCommitted: false,
    secretValueStoredInReports: false,
  }))
}

void QWEN_TIMEOUT_CALIBRATION_PHASE
