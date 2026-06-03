import { execFile as execFileCallback } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { auditBraveSearchSecretMetadata } from '../search-provider-readiness'
import { buildWebSearchBetaArtifactAudit } from './web-search-beta-artifact-audit'
import { resolveWebSearchInternalBetaEvidenceChain } from './web-search-beta-evidence-resolver'
import { buildWebSearchBetaFailurePolicy } from './web-search-beta-failure-policy'
import { buildWebSearchBetaProviderAudit } from './web-search-beta-provider-audit'
import { buildWebSearchBetaRegressionAudit } from './web-search-beta-regression-audit'
import { buildWebSearchInternalBetaQaSummary } from './web-search-beta-qa-summary'
import { WEB_SEARCH_INTERNAL_BETA_LOCAL_REPORT_PATH } from './web-search-beta-report-builder'
import { buildWebSearchInternalBetaScopeManifest } from './web-search-beta-scope-manifest'
import { buildWebSearchBetaUiApiAudit } from './web-search-beta-ui-api-audit'
import {
  makeWebSearchInternalBetaRunId,
  validateWebSearchInternalBetaExecutionEnv,
  webSearchInternalBetaArtifactPrefix,
  webSearchInternalBetaConfig,
} from './web-search-internal-beta-policy'
import type {
  WebSearchInternalBetaArtifact,
  WebSearchInternalBetaArtifactAuditEntry,
  WebSearchInternalBetaEvidenceChain,
  WebSearchInternalBetaExecutionReport,
} from './web-search-internal-beta-types'
import type { SearchProviderServiceAudit } from '../search-provider-readiness'

const execFile = promisify(execFileCallback)
const artifactVerificationPhases = new Set(['49F', '49H', '49I', '49M', '49N', '49O'])

export interface WebSearchInternalBetaRunResult {
  executionReport: WebSearchInternalBetaExecutionReport
  localReportPath: string
}

export async function runWebSearchInternalBetaCandidate(input: { execute: boolean; runId?: string }): Promise<WebSearchInternalBetaRunResult> {
  if (!input.execute) throw new Error('Pass --execute with REEDITPRO_CONFIRM_WEB_SEARCH_INTERNAL_BETA_CANDIDATE=true to run Phase 49P.')
  const activeProject = await safeGcloud(['config', 'get-value', 'project'])
  const envValidation = validateWebSearchInternalBetaExecutionEnv({ activeProject: activeProject.ok ? activeProject.stdout.trim() : undefined })
  if (!envValidation.ok) throw new Error(envValidation.blockers.join('\n'))

  const runId = input.runId ?? makeWebSearchInternalBetaRunId()
  const localRoot = path.join(os.tmpdir(), `reeditpro-phase49p-web-search-internal-beta-${runId}`)
  await mkdir(localRoot, { recursive: true })

  const executionBlockers = [...envValidation.blockers]
  const executionWarnings = [...envValidation.warnings]
  if (!activeProject.ok) executionBlockers.push(`Unable to read active gcloud project: ${activeProject.error}`)
  await verifyGcloudPreflight(executionBlockers, executionWarnings)
  await verifyBuckets(executionBlockers)

  const evidenceChain = resolveWebSearchInternalBetaEvidenceChain()
  const serviceAudit = await auditPrivateSearxngService()
  const secretAudit = await auditBraveSearchSecretMetadata()
  const providerAudit = buildWebSearchBetaProviderAudit({ evidenceChain, serviceAudit, secretAudit })
  const uiApiAudit = buildWebSearchBetaUiApiAudit({ evidenceChain })
  const regressionAudit = buildWebSearchBetaRegressionAudit({ evidenceChain })
  const failurePolicy = buildWebSearchBetaFailurePolicy()
  const verifiedEntries = await verifyEvidenceArtifacts(buildArtifactVerificationEntries(evidenceChain))
  let artifactAudit = buildWebSearchBetaArtifactAudit({ evidenceChain, verifiedEntries })
  const provisionalReady = [
    evidenceChain.blockers,
    providerAudit.blockers,
    uiApiAudit.blockers,
    regressionAudit.blockers,
    artifactAudit.blockers,
    failurePolicy.blockers,
    executionBlockers,
  ].every((blockers) => blockers.length === 0)
  let scopeManifest = buildWebSearchInternalBetaScopeManifest({ runId, ready: provisionalReady })
  let qa = buildWebSearchInternalBetaQaSummary({
    evidenceChain,
    scopeManifest,
    providerAudit,
    uiApiAudit,
    regressionAudit,
    artifactAudit,
    failurePolicy,
    executionBlockers,
    executionWarnings,
  })
  const ok = qa.status === 'passed'
  scopeManifest = buildWebSearchInternalBetaScopeManifest({ runId, ready: ok })
  const artifactPrefix = webSearchInternalBetaArtifactPrefix(runId)
  const artifacts: WebSearchInternalBetaArtifact[] = []

  artifacts.push(await uploadJson(localRoot, webSearchInternalBetaConfig.generatedAssetsBucket, `${artifactPrefix}/readiness/web-search-internal-beta-candidate-manifest.json`, scopeManifest, 'web_search_internal_beta_candidate_manifest'))
  artifacts.push(await uploadJson(localRoot, webSearchInternalBetaConfig.generatedAssetsBucket, `${artifactPrefix}/evidence/evidence-chain.json`, evidenceChain, 'evidence_chain'))
  artifacts.push(await uploadJson(localRoot, webSearchInternalBetaConfig.generatedAssetsBucket, `${artifactPrefix}/ui-api/ui-api-gating-audit.json`, uiApiAudit, 'ui_api_gating_audit'))
  artifacts.push(await uploadJson(localRoot, webSearchInternalBetaConfig.generatedAssetsBucket, `${artifactPrefix}/provider/provider-scope-audit.json`, providerAudit, 'provider_scope_audit'))
  artifacts.push(await uploadJson(localRoot, webSearchInternalBetaConfig.generatedAssetsBucket, `${artifactPrefix}/regression/regression-summary.json`, regressionAudit, 'regression_summary'))
  artifacts.push(await uploadJson(localRoot, webSearchInternalBetaConfig.generatedAssetsBucket, `${artifactPrefix}/policy/final-fail-closed-policy.json`, failurePolicy, 'final_fail_closed_policy'))
  artifactAudit = buildWebSearchBetaArtifactAudit({ evidenceChain, verifiedEntries, uploadedArtifacts: artifacts })
  qa = buildWebSearchInternalBetaQaSummary({
    evidenceChain,
    scopeManifest,
    providerAudit,
    uiApiAudit,
    regressionAudit,
    artifactAudit,
    failurePolicy,
    uploadedArtifacts: artifacts,
    executionBlockers,
    executionWarnings,
  })
  artifacts.push(await uploadJson(localRoot, webSearchInternalBetaConfig.qaBucket, `${artifactPrefix}/qa/web-search-internal-beta-candidate-qa.json`, qa, 'web_search_internal_beta_candidate_qa'))

  const finalOk = qa.status === 'passed'
  scopeManifest = buildWebSearchInternalBetaScopeManifest({ runId, ready: finalOk })
  const executionReport: WebSearchInternalBetaExecutionReport = {
    runId,
    ok: finalOk,
    createdAt: new Date().toISOString(),
    config: webSearchInternalBetaConfig,
    evidenceChain,
    scopeManifest,
    providerAudit,
    uiApiAudit,
    regressionAudit,
    artifactAudit,
    failurePolicy,
    qa,
    artifacts,
    webSearchInternalBetaCandidateReady: finalOk,
    phase50AReadiness: finalOk
      ? 'ready_for_map_geospatial_stack_approval_and_architecture'
      : 'blocked_until_phase49p_passes',
    blockers: qa.blockers,
    warnings: qa.warnings,
  }
  artifacts.push(await uploadJson(localRoot, webSearchInternalBetaConfig.qaBucket, `${artifactPrefix}/reports/phase49p-report.json`, executionReport, 'phase49p_report'))
  executionReport.artifacts = artifacts

  await mkdir(path.dirname(WEB_SEARCH_INTERNAL_BETA_LOCAL_REPORT_PATH), { recursive: true })
  await writeFile(WEB_SEARCH_INTERNAL_BETA_LOCAL_REPORT_PATH, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')
  return { executionReport, localReportPath: WEB_SEARCH_INTERNAL_BETA_LOCAL_REPORT_PATH }
}

async function verifyGcloudPreflight(blockers: string[], warnings: string[]): Promise<void> {
  const projectDescribe = await safeGcloud(['projects', 'describe', webSearchInternalBetaConfig.projectId, '--format=json'])
  if (!projectDescribe.ok) blockers.push(`gcloud project describe failed: ${projectDescribe.error}`)
  const auth = await safeGcloud(['auth', 'list', '--format=json'])
  if (!auth.ok) blockers.push(`gcloud auth list failed: ${auth.error}`)
  else if (!auth.stdout.includes('"status": "ACTIVE"')) warnings.push('gcloud auth list did not clearly show an ACTIVE account in JSON output.')
}

async function verifyBuckets(blockers: string[]): Promise<void> {
  for (const bucket of [webSearchInternalBetaConfig.generatedAssetsBucket, webSearchInternalBetaConfig.qaBucket]) {
    const result = await safeGcloud(['storage', 'buckets', 'describe', `gs://${bucket}`, '--format=json'])
    if (!result.ok) blockers.push(`Unable to describe private bucket gs://${bucket}: ${result.error}`)
  }
}

async function auditPrivateSearxngService(): Promise<SearchProviderServiceAudit> {
  const describe = await safeGcloud(['run', 'services', 'describe', webSearchInternalBetaConfig.serviceName, '--region', webSearchInternalBetaConfig.region, '--project', webSearchInternalBetaConfig.projectId, '--format=json'])
  const policy = await safeGcloud(['run', 'services', 'get-iam-policy', webSearchInternalBetaConfig.serviceName, '--region', webSearchInternalBetaConfig.region, '--project', webSearchInternalBetaConfig.projectId, '--format=json'])
  if (!describe.ok) {
    return {
      serviceName: webSearchInternalBetaConfig.serviceName,
      exists: false,
      projectId: webSearchInternalBetaConfig.projectId,
      region: webSearchInternalBetaConfig.region,
      serviceUrlRedacted: 'not_resolved',
      gpuDetected: false,
      modelWeightsDetected: false,
      allUsersPresent: false,
      allAuthenticatedUsersPresent: false,
      invokerMembers: [],
      publicUnauthenticatedAccess: false,
      metadataSource: 'cloud_run_metadata_only',
      blockers: [`Private SearXNG Cloud Run service metadata could not be resolved: ${describe.error}`],
      warnings: policy.ok ? [] : [`Cloud Run IAM policy could not be resolved: ${policy.error}`],
    }
  }
  const service = JSON.parse(describe.stdout) as {
    status?: { url?: string }
    metadata?: { annotations?: Record<string, string> }
    spec?: { template?: { metadata?: { annotations?: Record<string, string> }; spec?: { serviceAccountName?: string; containers?: Array<{ image?: string; resources?: { limits?: Record<string, string> }; env?: Array<{ name?: string; value?: string }> }> } } }
  }
  const iam = policy.ok ? JSON.parse(policy.stdout) as { bindings?: Array<{ role?: string; members?: string[] }> } : { bindings: [] }
  const invokerMembers = (iam.bindings ?? [])
    .filter((binding) => binding.role === 'roles/run.invoker')
    .flatMap((binding) => binding.members ?? [])
  const allUsersPresent = invokerMembers.includes('allUsers')
  const allAuthenticatedUsersPresent = invokerMembers.includes('allAuthenticatedUsers')
  const container = service.spec?.template?.spec?.containers?.[0]
  const limits = container?.resources?.limits ?? {}
  const image = container?.image
  const envNames = (container?.env ?? []).map((env) => env.name ?? '')
  const gpuDetected = Object.keys(limits).some((key) => key.toLowerCase().includes('gpu')) || Object.values(limits).some((value) => value.toLowerCase().includes('gpu'))
  const modelWeightsDetected = envNames.some((name) => /MODEL|WEIGHT|HF_|HUGGINGFACE/i.test(name)) || Boolean(image && /model|weight|gpu/i.test(image))
  const blockers = [
    allUsersPresent ? 'Cloud Run service grants roles/run.invoker to allUsers.' : '',
    allAuthenticatedUsersPresent ? 'Cloud Run service grants roles/run.invoker to allAuthenticatedUsers.' : '',
    gpuDetected ? 'Private SearXNG Cloud Run service appears to request GPU resources.' : '',
    modelWeightsDetected ? 'Private SearXNG Cloud Run service appears to expose model-weight environment or image markers.' : '',
    policy.ok ? '' : `Cloud Run IAM policy could not be resolved: ${policy.error}`,
  ].filter(Boolean)
  return {
    serviceName: webSearchInternalBetaConfig.serviceName,
    exists: true,
    projectId: webSearchInternalBetaConfig.projectId,
    region: webSearchInternalBetaConfig.region,
    serviceUrlRedacted: service.status?.url ? 'private_authenticated_cloud_run_url_redacted' : 'not_reported',
    image,
    serviceAccountEmail: service.spec?.template?.spec?.serviceAccountName,
    ingress: service.metadata?.annotations?.['run.googleapis.com/ingress'],
    maxScale: service.spec?.template?.metadata?.annotations?.['autoscaling.knative.dev/maxScale'] ?? service.metadata?.annotations?.['autoscaling.knative.dev/maxScale'],
    cpuLimit: limits.cpu,
    memoryLimit: limits.memory,
    gpuDetected,
    modelWeightsDetected,
    allUsersPresent,
    allAuthenticatedUsersPresent,
    invokerMembers,
    publicUnauthenticatedAccess: allUsersPresent || allAuthenticatedUsersPresent,
    metadataSource: 'cloud_run_metadata_only',
    blockers,
    warnings: ['Phase 49P inspected Cloud Run metadata and IAM only; it did not run a service health request or search query.'],
  }
}

function buildArtifactVerificationEntries(evidenceChain: WebSearchInternalBetaEvidenceChain): WebSearchInternalBetaArtifactAuditEntry[] {
  return evidenceChain.phases
    .filter((phase) => artifactVerificationPhases.has(phase.phase))
    .flatMap((phase) => phase.artifactUris.map((gcsUri, index) => ({
      artifactId: `${phase.phase.toLowerCase()}-${index + 1}`,
      phase: phase.phase,
      gcsUri,
      required: true,
    })))
}

async function verifyEvidenceArtifacts(entries: WebSearchInternalBetaArtifactAuditEntry[]): Promise<WebSearchInternalBetaArtifactAuditEntry[]> {
  const verified: WebSearchInternalBetaArtifactAuditEntry[] = []
  for (const entry of entries) {
    const result = await safeGcloud(['storage', 'objects', 'describe', entry.gcsUri, '--format=json'])
    verified.push({
      ...entry,
      exists: result.ok,
      privateOnly: entry.gcsUri.startsWith('gs://reeditpro-staging-reeditpro-') && !entry.gcsUri.startsWith('http'),
      blocker: result.ok ? undefined : `Missing required evidence artifact ${entry.gcsUri}: ${result.error}`,
    })
  }
  return verified
}

async function uploadJson(localRoot: string, bucket: string, objectPath: string, value: unknown, artifactId: string): Promise<WebSearchInternalBetaArtifact> {
  const localPath = path.join(localRoot, objectPath.replace(/[/:]/g, '_'))
  await writeFile(localPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  const gcsUri = `gs://${bucket}/${objectPath}`
  const result = await safeGcloud(['storage', 'cp', localPath, gcsUri, '--content-type=application/json'])
  if (!result.ok) throw new Error(`Failed to upload ${artifactId} to ${gcsUri}: ${result.error}`)
  return { artifactId, gcsUri, contentType: 'private_json' }
}

async function safeGcloud(args: string[]): Promise<{ ok: true; stdout: string } | { ok: false; error: string; stdout: string }> {
  try {
    const { stdout } = await execFile('gcloud', args, { timeout: 60_000, maxBuffer: 20 * 1024 * 1024 })
    return { ok: true, stdout }
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; message?: string }
    return { ok: false, stdout: err.stdout ?? '', error: err.stderr || err.message || String(error) }
  }
}
