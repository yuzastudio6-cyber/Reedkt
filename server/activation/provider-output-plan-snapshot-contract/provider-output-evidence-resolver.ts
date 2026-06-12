import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  PROVIDER_OUTPUT_PLAN_SNAPSHOT_SOURCE_DECISION,
  PROVIDER_OUTPUT_PLAN_SNAPSHOT_SOURCE_REPORT_DIR,
  PROVIDER_OUTPUT_PLAN_SNAPSHOT_SOURCE_RUN_ID,
} from './provider-output-plan-snapshot-policy'
import type {
  ProviderDryRunEvidenceResult,
  ProviderOutputEvidenceContext,
} from './provider-output-plan-snapshot-types'

const SOURCE_REPORTS = [
  'provider_dry_run_readiness_report.json',
  'qwen_provider_dry_run_report.json',
  'deepseek_provider_dry_run_report.json',
  'provider_dry_run_private_artifact_manifest.json',
] as const

function readJson(filePath: string): Record<string, unknown> | undefined {
  if (!existsSync(filePath)) return undefined
  return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function firstResult(report: Record<string, unknown>): Record<string, unknown> | undefined {
  return asArray(report.results).map(asRecord).find((item) => item.status === 'passed')
}

function normalizeEvidenceResult(
  result: Record<string, unknown> | undefined,
  provider: 'qwen_dashscope' | 'deepseek',
  schemaId: 'plan_snapshot_candidate_v1' | 'agent_findings_v1',
): ProviderDryRunEvidenceResult | undefined {
  if (!result) return undefined
  return {
    caseId: asString(result.caseId),
    provider,
    modelId: asString(result.modelId),
    schemaId,
    status: result.status === 'passed' ? 'passed' : 'blocked',
    normalizedOutput: asRecord(result.normalizedOutput),
    usage: asRecord(result.usage),
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
}

export function resolveProviderOutputEvidenceContext(): ProviderOutputEvidenceContext {
  const readiness = readJson(path.join(PROVIDER_OUTPUT_PLAN_SNAPSHOT_SOURCE_REPORT_DIR, 'provider_dry_run_readiness_report.json')) ?? {}
  const qwenReport = readJson(path.join(PROVIDER_OUTPUT_PLAN_SNAPSHOT_SOURCE_REPORT_DIR, 'qwen_provider_dry_run_report.json')) ?? {}
  const deepseekReport = readJson(path.join(PROVIDER_OUTPUT_PLAN_SNAPSHOT_SOURCE_REPORT_DIR, 'deepseek_provider_dry_run_report.json')) ?? {}
  const manifest = readJson(path.join(PROVIDER_OUTPUT_PLAN_SNAPSHOT_SOURCE_REPORT_DIR, 'provider_dry_run_private_artifact_manifest.json')) ?? {}

  const qwen = normalizeEvidenceResult(firstResult(qwenReport), 'qwen_dashscope', 'plan_snapshot_candidate_v1')
  const deepseek = normalizeEvidenceResult(firstResult(deepseekReport), 'deepseek', 'agent_findings_v1')
  const blockers: string[] = []

  if (readiness.runId !== PROVIDER_OUTPUT_PLAN_SNAPSHOT_SOURCE_RUN_ID) blockers.push('source_provider_run_id_mismatch')
  if (readiness.decision !== PROVIDER_OUTPUT_PLAN_SNAPSHOT_SOURCE_DECISION) blockers.push('source_provider_decision_not_ready')
  if (readiness.planSnapshotContractReady !== true) blockers.push('source_plan_snapshot_contract_not_ready')
  if (qwen?.status !== 'passed') blockers.push('qwen_plan_snapshot_candidate_missing_or_blocked')
  if (qwen?.modelId !== 'qwen3.7-plus') blockers.push('qwen_model_mismatch')
  if (qwen?.schemaId !== 'plan_snapshot_candidate_v1') blockers.push('qwen_schema_mismatch')
  if (qwen?.normalizedOutput.schemaId !== 'plan_snapshot_candidate_v1') blockers.push('qwen_normalized_schema_mismatch')
  if (deepseek?.status !== 'passed') blockers.push('deepseek_agent_findings_missing_or_blocked')
  if (deepseek?.modelId !== 'deepseek-v4-flash') blockers.push('deepseek_model_mismatch')
  if (deepseek?.schemaId !== 'agent_findings_v1') blockers.push('deepseek_schema_mismatch')
  if (deepseek?.normalizedOutput.schemaId !== 'agent_findings_v1') blockers.push('deepseek_normalized_schema_mismatch')

  for (const flag of [
    'rawProviderResponsesStored',
    'rawProviderResponsesPrinted',
    'secretPayloadPrinted',
    'toolsWorkersRoutes',
    'mediaProcessing',
    'supabaseWrites',
    'rawPromptExecutionIntoWorkersOrTools',
    'publicArtifacts',
    'signedUrls',
    'production',
    'externalBeta',
    'paidProduction',
  ]) {
    if (readiness[flag] !== false) blockers.push(`source_safety_flag_not_false:${flag}`)
  }

  return {
    phase: 'PLAN_SNAPSHOT_1',
    sourceProviderRunId: PROVIDER_OUTPUT_PLAN_SNAPSHOT_SOURCE_RUN_ID,
    sourceDecision: asString(readiness.decision),
    sourcePlanSnapshotContractReady: readiness.planSnapshotContractReady === true,
    qwen,
    deepseek,
    sourceArtifactRefs: {
      generatedPrefix: asString(manifest.generatedArtifactPrefix) || asString(readiness.privateGeneratedArtifactPrefix),
      qaPrefix: asString(manifest.qaArtifactPrefix) || asString(readiness.privateQaArtifactPrefix),
    },
    sourceReports: SOURCE_REPORTS.map((file) => ({
      path: path.join(PROVIDER_OUTPUT_PLAN_SNAPSHOT_SOURCE_REPORT_DIR, file),
      present: existsSync(path.join(PROVIDER_OUTPUT_PLAN_SNAPSHOT_SOURCE_REPORT_DIR, file)),
    })),
    rawProviderResponsesStored: false,
    rawPromptPayloadsStored: false,
    secretPayloadsStored: false,
    activeBlockers: blockers,
  }
}
