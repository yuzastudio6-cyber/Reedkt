import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  QWEN_TIMEOUT_CALIBRATION_BASE_BRANCH,
  QWEN_TIMEOUT_CALIBRATION_BRANCH,
  QWEN_TIMEOUT_CALIBRATION_PHASE,
  QWEN_TIMEOUT_CALIBRATION_PR_TITLE,
  QWEN_TIMEOUT_CALIBRATION_RUN_ID,
  QWEN_TIMEOUT_KNOWN_UNAVAILABLE_MODEL,
  QWEN_TIMEOUT_PRIMARY_MODEL,
} from './qwen-timeout-calibration-policy'

const SOURCE_PATHS = [
  'docs/activation-phase-model-provider-dry-run-results.md',
  'docs/activation-model-orchestration-qwen-auth-repair-reports/qwen_auth_repair_readiness_report.json',
  'docs/activation-model-orchestration-qwen-auth-repair-reports/qwen_repaired_provider_dry_run_report.json',
  'docs/activation-model-orchestration-qwen-auth-repair-reports/qwen_auth_baseurl_probe_report.json',
  'docs/activation-model-orchestration-dry-run-approval-reports/dry_run_synthetic_cases.json',
  'docs/activation-model-orchestration-dry-run-approval-reports/dry_run_readiness_report.json',
  'docs/activation-model-orchestration-provider-dry-run-reports/provider_dry_run_decision.json',
  'docs/activation-model-orchestration-provider-dry-run-reports/qwen_provider_dry_run_report.json',
  'docs/model-orchestration-qwen-auth-repair.md',
  'docs/model-orchestration-provider-dry-run.md',
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

function pathStatus(filePath: string) {
  return { path: filePath, present: existsSync(filePath) }
}

export function buildQwenTimeoutSourceAudit() {
  const readiness = readJson('docs/activation-model-orchestration-qwen-auth-repair-reports/qwen_auth_repair_readiness_report.json')
  const repairedRun = readJson('docs/activation-model-orchestration-qwen-auth-repair-reports/qwen_repaired_provider_dry_run_report.json')
  const authProbe = readJson('docs/activation-model-orchestration-qwen-auth-repair-reports/qwen_auth_baseurl_probe_report.json')
  const providerDecision = readJson('docs/activation-model-orchestration-provider-dry-run-reports/provider_dry_run_decision.json')

  const repairedResults = asArray(repairedRun?.results).map(asRecord)
  return {
    phase: QWEN_TIMEOUT_CALIBRATION_PHASE,
    runId: QWEN_TIMEOUT_CALIBRATION_RUN_ID,
    branch: QWEN_TIMEOUT_CALIBRATION_BRANCH,
    baseBranch: QWEN_TIMEOUT_CALIBRATION_BASE_BRANCH,
    prTitle: QWEN_TIMEOUT_CALIBRATION_PR_TITLE,
    ownerWorkstream: 'PROVIDER_GATEWAY_MODELS',
    sourceEvidence: 'PR #322 Qwen auth repair plus PR #318 dry-run approval packet',
    sourcePaths: SOURCE_PATHS.map(pathStatus),
    qwenAuthRepairRunId: readiness?.runId ?? 'missing',
    qwenAuthRepairDecision: readiness?.decision ?? 'missing',
    qwenAuthRepairStatus: readiness?.status ?? 'missing',
    selectedQwenAlias: readiness?.selectedQwenAlias ?? 'missing',
    expectedPrimaryTarget: QWEN_TIMEOUT_PRIMARY_MODEL,
    activeBlockers: readiness?.activeBlockers ?? [],
    previousSchemaCaseTimeouts: repairedResults.map((item) => ({
      caseId: item.caseId,
      modelId: item.modelId,
      blocker: item.blocker,
      latencyMs: item.latencyMs,
      rawProviderResponseStored: item.rawProviderResponseStored,
      secretPayloadPrinted: item.secretPayloadPrinted,
    })),
    previousTimedOutCaseCount: repairedResults.filter((item) => item.blocker === 'provider_timeout').length,
    previousAuthProbeStatus: {
      status: authProbe?.status ?? 'missing',
      usAuthProbeCallsPassed: authProbe?.usAuthProbeCallsPassed ?? 0,
      approvedTargetCallsPassed: authProbe?.approvedTargetCallsPassed ?? 0,
      qwenMaxKnownUnavailable: QWEN_TIMEOUT_KNOWN_UNAVAILABLE_MODEL,
    },
    providerDryRunDecision: providerDecision?.decision ?? 'missing',
    deepseekCallsInThisPhase: false,
    fullProviderDryRunInThisPhase: false,
    supabaseWrites: false,
    sqlMigrationsSchemaRls: false,
    toolsWorkersRoutes: false,
    mediaProcessing: false,
    publicArtifacts: false,
    signedUrls: false,
    productionAffected: false,
    cwdEvidence: path.resolve('.'),
  }
}
