import { execFile as execFileCallback } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { selectScenariosByCategory, buildWebSearchRegressionMatrix } from './web-search-regression-scenarios'
import {
  makeWebSearchRegressionRunId,
  validateWebSearchRegressionExecutionEnv,
  webSearchRegressionArtifactPrefix,
  webSearchRegressionConfig,
} from './web-search-regression-policy'
import { buildFailClosedPolicyVerification, WEB_SEARCH_REGRESSION_LOCAL_REPORT_PATH } from './web-search-regression-report-builder'
import { buildWebSearchRegressionQaSummary } from './web-search-regression-qa-summary'
import type {
  WebSearchPhase49NEvidence,
  WebSearchRegressionArtifact,
  WebSearchRegressionExecutionReport,
} from './web-search-regression-types'

const execFile = promisify(execFileCallback)

export interface WebSearchRegressionRunResult {
  executionReport: WebSearchRegressionExecutionReport
  localReportPath: string
}

export async function runWebSearchRegressionSuite(input: { execute: boolean; runId?: string }): Promise<WebSearchRegressionRunResult> {
  if (!input.execute) throw new Error('Pass --execute with REEDITPRO_CONFIRM_WEB_SEARCH_REGRESSION_FAILURE_SUITE=true to run Phase 49O.')
  const activeProject = await safeGcloud(['config', 'get-value', 'project'])
  const envValidation = validateWebSearchRegressionExecutionEnv({ activeProject: activeProject.ok ? activeProject.stdout.trim() : undefined })
  if (!envValidation.ok) throw new Error(envValidation.blockers.join('\n'))

  const runId = input.runId ?? makeWebSearchRegressionRunId()
  const localRoot = path.join(os.tmpdir(), `reeditpro-phase49o-web-search-regression-${runId}`)
  await mkdir(localRoot, { recursive: true })

  const executionBlockers = [...envValidation.blockers]
  const executionWarnings = [...envValidation.warnings]
  if (!activeProject.ok) executionBlockers.push(`Unable to read active gcloud project: ${activeProject.error}`)
  await verifyBuckets(executionBlockers)
  const phase49nEvidence = await verifyPhase49NEvidence()
  const matrix = buildWebSearchRegressionMatrix()
  const failClosedPolicy = buildFailClosedPolicyVerification(matrix)
  const artifacts: WebSearchRegressionArtifact[] = []
  const provisionalQa = buildWebSearchRegressionQaSummary({
    phase49nEvidence,
    matrix,
    failClosedPolicy,
    artifacts,
    executionBlockers,
    executionWarnings,
  })
  const artifactPrefix = webSearchRegressionArtifactPrefix(runId)

  artifacts.push(await uploadJson(localRoot, webSearchRegressionConfig.generatedAssetsBucket, `${artifactPrefix}/regression/web-search-regression-matrix.json`, matrix, 'web_search_regression_matrix'))
  artifacts.push(await uploadJson(localRoot, webSearchRegressionConfig.generatedAssetsBucket, `${artifactPrefix}/regression/provider-failure-scenarios.json`, selectScenariosByCategory(matrix, ['success_baseline', 'provider_blocking', 'brave_policy', 'searxng_policy']), 'provider_failure_scenarios'))
  artifacts.push(await uploadJson(localRoot, webSearchRegressionConfig.generatedAssetsBucket, `${artifactPrefix}/regression/capture-failure-scenarios.json`, selectScenariosByCategory(matrix, ['capture_policy', 'browser_capture_failure']), 'capture_failure_scenarios'))
  artifacts.push(await uploadJson(localRoot, webSearchRegressionConfig.generatedAssetsBucket, `${artifactPrefix}/regression/extraction-failure-scenarios.json`, selectScenariosByCategory(matrix, ['sharp_failure', 'readability_failure']), 'extraction_failure_scenarios'))
  artifacts.push(await uploadJson(localRoot, webSearchRegressionConfig.generatedAssetsBucket, `${artifactPrefix}/regression/artifact-privacy-scenarios.json`, selectScenariosByCategory(matrix, ['artifact_privacy', 'production_beta']), 'artifact_privacy_scenarios'))
  artifacts.push(await uploadJson(localRoot, webSearchRegressionConfig.generatedAssetsBucket, `${artifactPrefix}/regression/api-gating-regression.json`, selectScenariosByCategory(matrix, ['api_ui_gating']), 'api_gating_regression'))
  artifacts.push(await uploadJson(localRoot, webSearchRegressionConfig.generatedAssetsBucket, `${artifactPrefix}/policy/fail-closed-policy-verification.json`, failClosedPolicy, 'fail_closed_policy_verification'))

  const qa = buildWebSearchRegressionQaSummary({
    phase49nEvidence,
    matrix,
    failClosedPolicy,
    artifacts,
    executionBlockers,
    executionWarnings,
  })
  artifacts.push(await uploadJson(localRoot, webSearchRegressionConfig.qaBucket, `${artifactPrefix}/qa/web-search-regression-suite-qa.json`, qa, 'web_search_regression_suite_qa'))

  const ok = qa.status === 'passed'
  const executionReport: WebSearchRegressionExecutionReport = {
    runId,
    ok,
    createdAt: new Date().toISOString(),
    config: webSearchRegressionConfig,
    phase49nEvidence,
    matrix,
    failClosedPolicy,
    qa,
    artifacts,
    phase49PReadiness: ok
      ? 'ready_for_controlled_internal_beta_candidate_gate_or_system_reconciliation'
      : 'blocked_until_web_search_regression_suite_passes',
    blockers: qa.blockers,
    warnings: qa.warnings,
  }
  artifacts.push(await uploadJson(localRoot, webSearchRegressionConfig.qaBucket, `${artifactPrefix}/reports/phase49o-report.json`, executionReport, 'phase49o_report'))
  executionReport.artifacts = artifacts

  await mkdir(path.dirname(WEB_SEARCH_REGRESSION_LOCAL_REPORT_PATH), { recursive: true })
  await writeFile(WEB_SEARCH_REGRESSION_LOCAL_REPORT_PATH, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')

  if (provisionalQa.status === 'blocked' && qa.status === 'passed') {
    executionReport.warnings.push('Artifact privacy gate passed after private Phase 49O artifacts were uploaded.')
  }
  return { executionReport, localReportPath: WEB_SEARCH_REGRESSION_LOCAL_REPORT_PATH }
}

async function verifyBuckets(blockers: string[]): Promise<void> {
  for (const bucket of [webSearchRegressionConfig.generatedAssetsBucket, webSearchRegressionConfig.qaBucket]) {
    const result = await safeGcloud(['storage', 'buckets', 'describe', `gs://${bucket}`, '--format=json'])
    if (!result.ok) blockers.push(`Unable to describe private bucket gs://${bucket}: ${result.error}`)
  }
}

async function verifyPhase49NEvidence(): Promise<WebSearchPhase49NEvidence> {
  const runId = webSearchRegressionConfig.canonicalPhase49NRunId
  const readinessReportUri = `gs://${webSearchRegressionConfig.qaBucket}/activation-web-search/phase49n/${runId}/reports/phase49n-report.json`
  const readinessManifestUri = `gs://${webSearchRegressionConfig.generatedAssetsBucket}/activation-web-search/phase49n/${runId}/readiness/search-provider-readiness-manifest.json`
  const report = await safeGcloud(['storage', 'objects', 'describe', readinessReportUri, '--format=json'])
  const manifest = await safeGcloud(['storage', 'objects', 'describe', readinessManifestUri, '--format=json'])
  const blockers = [
    report.ok ? '' : `Phase 49N report artifact missing or inaccessible: ${report.error}`,
    manifest.ok ? '' : `Phase 49N readiness manifest missing or inaccessible: ${manifest.error}`,
  ].filter(Boolean)
  return {
    runId,
    status: blockers.length === 0 ? 'verified' : 'not_verified',
    readinessReportUri,
    readinessManifestUri,
    gcsVerified: blockers.length === 0,
    blockers,
    warnings: ['Phase 49O verifies Phase 49N GCS evidence only; it does not rerun Phase 49N or issue search/capture work.'],
  }
}

async function uploadJson(localRoot: string, bucket: string, objectPath: string, value: unknown, artifactId: string): Promise<WebSearchRegressionArtifact> {
  const localPath = path.join(localRoot, objectPath.replace(/[/:]/g, '_'))
  await writeFile(localPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  const gcsUri = `gs://${bucket}/${objectPath}`
  const result = await safeGcloud(['storage', 'cp', localPath, gcsUri, '--content-type=application/json'])
  if (!result.ok) throw new Error(`Failed to upload ${artifactId} to ${gcsUri}: ${result.error}`)
  return { artifactId, gcsUri, contentType: 'private_json' }
}

async function safeGcloud(args: string[]): Promise<{ ok: true; stdout: string } | { ok: false; error: string; stdout: string }> {
  try {
    const { stdout } = await execFile('gcloud', args, { timeout: 60_000, maxBuffer: 10 * 1024 * 1024 })
    return { ok: true, stdout }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    return { ok: false, error: detail, stdout: '' }
  }
}
