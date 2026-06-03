import { execFile as execFileCallback } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { getApprovedWebSearchCaptureReadinessEvidence } from '../web-search-capture-readiness'
import { buildWebSearchUiApiPlanSnapshot, buildWebSearchUiApiRouteAudit, buildWebSearchUiApiRunEnvelope } from './web-search-ui-api-contract'
import {
  makeWebSearchUiApiGatingRunId,
  validateWebSearchUiApiGatingExecutionEnv,
  webSearchUiApiGatingConfig,
} from './web-search-ui-api-gating-policy'
import type {
  ApprovedWebSearchUiApiGatingEvidence,
  WebSearchUiApiArtifact,
  WebSearchUiApiExecutionReport,
} from './web-search-ui-api-gating-types'
import { buildWebSearchUiApiQaSummary } from './web-search-ui-api-qa-summary'
import { validateWebSearchUiApiRequest } from './web-search-ui-api-request-validator'
import { WEB_SEARCH_UI_API_GATING_LOCAL_REPORT_PATH, webSearchUiApiGatingEvidenceToTypeScript } from './web-search-ui-api-report-builder'
import { buildWebSearchUiApiUxState } from './web-search-ui-api-ux-state'

const execFile = promisify(execFileCallback)

export interface WebSearchUiApiGatingRunResult {
  evidence: ApprovedWebSearchUiApiGatingEvidence
  evidenceModule: string
  executionReport: WebSearchUiApiExecutionReport
  localReportPath: string
}

export async function runWebSearchUiApiGating(input: { execute: boolean; runId?: string }): Promise<WebSearchUiApiGatingRunResult> {
  if (!input.execute) throw new Error('Pass --execute with REEDITPRO_CONFIRM_WEB_SEARCH_UI_API_GATING=true to run Phase 49I.')
  const envValidation = validateWebSearchUiApiGatingExecutionEnv()
  if (!envValidation.ok) throw new Error(envValidation.blockers.join('\n'))

  const runId = input.runId ?? makeWebSearchUiApiGatingRunId()
  const localRoot = path.join(os.tmpdir(), `reeditpro-phase49i-web-search-ui-api-gating-${runId}`)
  await mkdir(localRoot, { recursive: true })

  const phase49H = getApprovedWebSearchCaptureReadinessEvidence()
  const executionBlockers: string[] = []
  const executionWarnings: string[] = [...envValidation.warnings]
  await verifyGcloudPreflight(executionBlockers, executionWarnings)
  await verifyBuckets(executionBlockers)
  await verifyPhase49HEvidenceObjects(phase49H, executionBlockers)

  const routeAudit = buildWebSearchUiApiRouteAudit()
  const requestValidation = validateWebSearchUiApiRequest({})
  const planSnapshot = buildWebSearchUiApiPlanSnapshot({ request: requestValidation.request, planId: `phase49i-${runId}-approved-ui-api-gate-plan` })
  const runEnvelope = buildWebSearchUiApiRunEnvelope({ runId, planSnapshot })
  const uxState = buildWebSearchUiApiUxState()
  const provisionalQa = buildWebSearchUiApiQaSummary({
    routeAudit,
    requestValidation,
    uxState,
    docsConsistent: docsConsistent(),
    executionBlockers,
    executionWarnings,
  })
  const ok = provisionalQa.status === 'passed'
  const phase49JReadiness = ok ? 'ready_for_optional_brave_search_fallback_policy_review' : 'blocked_until_phase49i_ui_api_gating_passes'
  const artifactPrefix = `${webSearchUiApiGatingConfig.artifactPrefixBase}/${runId}`
  const artifacts: WebSearchUiApiArtifact[] = []
  const executionReport: WebSearchUiApiExecutionReport = {
    runId,
    ok,
    createdAt: new Date().toISOString(),
    config: webSearchUiApiGatingConfig,
    phase49HEvidence: {
      runId: phase49H.runId,
      status: phase49H.status,
      ready: phase49H.webSearchCaptureInternalTestingReady,
      phase49hReportUri: phase49H.phase49hReportUri,
      blockers: [...phase49H.blockers],
      warnings: [...phase49H.warnings],
    },
    routeAudit,
    requestValidation,
    planSnapshot,
    runEnvelope,
    uxState,
    qa: provisionalQa,
    artifacts,
    phase49JReadiness,
    blockers: [],
    warnings: [],
  }

  artifacts.push(await uploadJson(localRoot, webSearchUiApiGatingConfig.generatedAssetsBucket, `${artifactPrefix}/plan/approved-web-search-ui-api-gate-plan.json`, planSnapshot, 'plan_snapshot'))
  artifacts.push(await uploadJson(localRoot, webSearchUiApiGatingConfig.generatedAssetsBucket, `${artifactPrefix}/api/route-gate-audit.json`, routeAudit, 'route_gate_audit'))
  artifacts.push(await uploadJson(localRoot, webSearchUiApiGatingConfig.generatedAssetsBucket, `${artifactPrefix}/api/request-validation.json`, requestValidation, 'request_validation'))
  artifacts.push(await uploadJson(localRoot, webSearchUiApiGatingConfig.generatedAssetsBucket, `${artifactPrefix}/ux/internal-ux-gate-state.json`, uxState, 'internal_ux_gate_state'))
  const qa = buildWebSearchUiApiQaSummary({
    routeAudit,
    requestValidation,
    uxState,
    docsConsistent: docsConsistent(),
    artifacts,
    executionBlockers,
    executionWarnings,
  })
  executionReport.qa = qa
  executionReport.ok = qa.status === 'passed'
  executionReport.blockers = Array.from(new Set([...qa.blockers, ...executionBlockers]))
  executionReport.warnings = Array.from(new Set([...qa.warnings, ...executionWarnings]))
  executionReport.phase49JReadiness = executionReport.ok ? 'ready_for_optional_brave_search_fallback_policy_review' : 'blocked_until_phase49i_ui_api_gating_passes'
  artifacts.push(await uploadJson(localRoot, webSearchUiApiGatingConfig.qaBucket, `${artifactPrefix}/qa/web-search-ui-api-gating-qa.json`, qa, 'qa'))
  executionReport.artifacts = artifacts
  artifacts.push(await uploadJson(localRoot, webSearchUiApiGatingConfig.qaBucket, `${artifactPrefix}/reports/phase49i-report.json`, executionReport, 'phase49i_report'))

  await mkdir(path.dirname(WEB_SEARCH_UI_API_GATING_LOCAL_REPORT_PATH), { recursive: true })
  await writeFile(WEB_SEARCH_UI_API_GATING_LOCAL_REPORT_PATH, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')

  const evidence: ApprovedWebSearchUiApiGatingEvidence = {
    phase: '49I',
    status: executionReport.ok ? 'completed' : 'blocked',
    runId,
    phase49HRunId: phase49H.runId ?? webSearchUiApiGatingConfig.canonicalPhase49HRunId,
    privateSearxngService: webSearchUiApiGatingConfig.serviceName,
    internalApiRoutesReady: executionReport.ok,
    internalUxGateReady: executionReport.ok,
    phase49JReadiness: executionReport.phase49JReadiness,
    planSnapshotUri: gcsUri(webSearchUiApiGatingConfig.generatedAssetsBucket, `${artifactPrefix}/plan/approved-web-search-ui-api-gate-plan.json`),
    routeGateAuditUri: gcsUri(webSearchUiApiGatingConfig.generatedAssetsBucket, `${artifactPrefix}/api/route-gate-audit.json`),
    requestValidationUri: gcsUri(webSearchUiApiGatingConfig.generatedAssetsBucket, `${artifactPrefix}/api/request-validation.json`),
    uxStateUri: gcsUri(webSearchUiApiGatingConfig.generatedAssetsBucket, `${artifactPrefix}/ux/internal-ux-gate-state.json`),
    qaReportUri: gcsUri(webSearchUiApiGatingConfig.qaBucket, `${artifactPrefix}/qa/web-search-ui-api-gating-qa.json`),
    phase49iReportUri: gcsUri(webSearchUiApiGatingConfig.qaBucket, `${artifactPrefix}/reports/phase49i-report.json`),
    blockers: executionReport.blockers,
    warnings: executionReport.warnings,
  }

  return {
    evidence,
    evidenceModule: webSearchUiApiGatingEvidenceToTypeScript(evidence),
    executionReport,
    localReportPath: WEB_SEARCH_UI_API_GATING_LOCAL_REPORT_PATH,
  }
}

async function verifyGcloudPreflight(blockers: string[], warnings: string[]): Promise<void> {
  const project = await safeGcloud(['config', 'get-value', 'project'])
  if (!project.ok) {
    blockers.push(`gcloud project lookup failed: ${project.error}`)
  } else if (project.stdout.trim() !== webSearchUiApiGatingConfig.projectId) {
    blockers.push(`Active gcloud project must be ${webSearchUiApiGatingConfig.projectId}; observed ${project.stdout.trim() || 'empty'}.`)
  }
  const auth = await safeGcloud(['auth', 'list', '--format=json'])
  if (!auth.ok) blockers.push(`gcloud auth list failed: ${auth.error}`)
  else if (!auth.stdout.includes('"status": "ACTIVE"')) warnings.push('gcloud auth list did not clearly show an ACTIVE account in JSON output.')
}

async function verifyBuckets(blockers: string[]): Promise<void> {
  for (const bucket of [webSearchUiApiGatingConfig.generatedAssetsBucket, webSearchUiApiGatingConfig.qaBucket]) {
    const result = await safeGcloud(['storage', 'buckets', 'describe', `gs://${bucket}`, '--format=json'])
    if (!result.ok) blockers.push(`Unable to describe private bucket gs://${bucket}: ${result.error}`)
  }
}

async function verifyPhase49HEvidenceObjects(evidence: ReturnType<typeof getApprovedWebSearchCaptureReadinessEvidence>, blockers: string[]): Promise<void> {
  for (const uri of [
    evidence.readinessManifestUri,
    evidence.evidenceChainUri,
    evidence.providerGateAuditUri,
    evidence.artifactVerificationUri,
    evidence.serviceAccessAuditUri,
    evidence.qaReportUri,
    evidence.phase49hReportUri,
  ].filter((item): item is string => Boolean(item))) {
    const result = await safeGcloud(['storage', 'objects', 'describe', uri, '--format=json'])
    if (!result.ok) blockers.push(`Missing required Phase 49H evidence artifact ${uri}: ${result.error}`)
  }
}

async function uploadJson(localRoot: string, bucket: string, object: string, value: unknown, artifactId: string): Promise<WebSearchUiApiArtifact> {
  const localPath = await writeJson(localRoot, artifactId, value)
  const uri = gcsUri(bucket, object)
  await runGcloud(['storage', 'cp', localPath, uri])
  return { artifactId, gcsUri: uri, contentType: 'private_json' }
}

async function writeJson(localRoot: string, artifactId: string, value: unknown): Promise<string> {
  const filePath = path.join(localRoot, `${artifactId}.json`)
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  return filePath
}

function docsConsistent(): boolean {
  return [
    'docs/activation-web-search-ui-api-gating-runbook.md',
    'docs/activation-web-search-ui-api-gating-policy.md',
    'docs/activation-web-search-ui-api-gating-qa-policy.md',
    'docs/activation-phase-49i-web-search-ui-api-gating-results.md',
  ].every((doc) => existsSync(doc))
}

function gcsUri(bucket: string, object: string): string {
  return `gs://${bucket}/${object}`
}

async function safeGcloud(args: string[]): Promise<{ ok: true; stdout: string; stderr: string } | { ok: false; stdout: string; stderr: string; error: string }> {
  try {
    const result = await runGcloud(args)
    return { ok: true, stdout: result.stdout, stderr: result.stderr }
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; message?: string }
    return {
      ok: false,
      stdout: err.stdout ?? '',
      stderr: err.stderr ?? '',
      error: err.stderr || err.message || 'unknown gcloud failure',
    }
  }
}

async function runGcloud(args: string[]): Promise<{ stdout: string; stderr: string }> {
  return execFile('gcloud', args, {
    cwd: process.cwd(),
    maxBuffer: 1024 * 1024 * 20,
    env: { ...process.env, CLOUDSDK_CORE_DISABLE_PROMPTS: '1' },
  })
}
