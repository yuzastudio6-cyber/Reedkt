import { execFile as execFileCallback } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { buildPlannedWebSearchArtifactVerification } from './web-search-artifact-verifier'
import {
  makeWebSearchCaptureReadinessRunId,
  validateWebSearchCaptureReadinessExecutionEnv,
  webSearchCaptureReadinessConfig,
} from './web-search-capture-readiness-policy'
import type {
  ApprovedWebSearchCaptureReadinessEvidence,
  WebSearchArtifactVerificationEntry,
  WebSearchReadinessArtifact,
  WebSearchReadinessExecutionReport,
  WebSearchServiceAccessAudit,
} from './web-search-capture-readiness-types'
import { resolveWebSearchCaptureEvidenceChain } from './web-search-evidence-resolver'
import { buildWebSearchFailurePolicy } from './web-search-failure-policy'
import { buildWebSearchInternalScopeManifest } from './web-search-internal-scope-manifest'
import { buildWebSearchProviderGateAudit } from './web-search-provider-gate'
import { buildWebSearchReadinessQaSummary } from './web-search-readiness-qa-summary'
import { WEB_SEARCH_CAPTURE_READINESS_LOCAL_REPORT_PATH, webSearchCaptureReadinessEvidenceToTypeScript } from './web-search-readiness-report-builder'

const execFile = promisify(execFileCallback)

export interface WebSearchCaptureReadinessRunResult {
  evidence: ApprovedWebSearchCaptureReadinessEvidence
  evidenceModule: string
  executionReport: WebSearchReadinessExecutionReport
  localReportPath: string
}

export async function runWebSearchCaptureReadiness(input: { execute: boolean; runId?: string }): Promise<WebSearchCaptureReadinessRunResult> {
  if (!input.execute) throw new Error('Pass --execute with REEDITPRO_CONFIRM_WEB_SEARCH_CAPTURE_INTERNAL_READINESS=true to run Phase 49H.')
  const envValidation = validateWebSearchCaptureReadinessExecutionEnv()
  if (!envValidation.ok) throw new Error(envValidation.blockers.join('\n'))

  const runId = input.runId ?? makeWebSearchCaptureReadinessRunId()
  const localRoot = path.join(os.tmpdir(), `reeditpro-phase49h-web-search-readiness-${runId}`)
  await mkdir(localRoot, { recursive: true })

  const evidenceChain = resolveWebSearchCaptureEvidenceChain()
  const providerGateAudit = buildWebSearchProviderGateAudit()
  const failurePolicy = buildWebSearchFailurePolicy()
  const docsConsistent = phase49HDocsPresent()
  const executionBlockers: string[] = []
  const executionWarnings: string[] = [...envValidation.warnings]

  await verifyGcloudPreflight(executionBlockers, executionWarnings)
  await verifyBuckets(executionBlockers)

  const serviceAccessAudit = await auditPrivateSearxngCloudRunService()
  const artifactVerification = await verifyEvidenceArtifacts(buildPlannedWebSearchArtifactVerification(evidenceChain))

  const provisionalQa = buildWebSearchReadinessQaSummary({
    evidenceChain,
    providerGateAudit,
    artifactVerification,
    serviceAccessAudit,
    docsConsistent,
    executionBlockers,
    executionWarnings,
  })
  const ok = provisionalQa.status === 'passed'
  const phase49IReadiness = ok ? 'ready_for_ui_api_integration_internal_ux_gating' : 'blocked_until_phase49h_readiness_passes'
  const internalScopeManifest = buildWebSearchInternalScopeManifest({
    runId,
    internalTestingReady: ok,
    phase49IReadiness,
  })
  const qa = buildWebSearchReadinessQaSummary({
    evidenceChain,
    providerGateAudit,
    artifactVerification,
    serviceAccessAudit,
    docsConsistent,
    executionBlockers,
    executionWarnings,
  })
  const blockers = Array.from(new Set([...qa.blockers, ...executionBlockers]))
  const warnings = Array.from(new Set([...qa.warnings, ...executionWarnings]))
  const artifactPrefix = `${webSearchCaptureReadinessConfig.artifactPrefixBase}/${runId}`
  const artifacts: WebSearchReadinessArtifact[] = []

  const executionReport: WebSearchReadinessExecutionReport = {
    runId,
    ok,
    createdAt: new Date().toISOString(),
    config: webSearchCaptureReadinessConfig,
    evidenceChain,
    internalScopeManifest,
    providerGateAudit,
    artifactVerification,
    serviceAccessAudit,
    failurePolicy,
    qa,
    artifacts,
    phase49IReadiness,
    blockers,
    warnings,
  }

  artifacts.push(await uploadJson(localRoot, webSearchCaptureReadinessConfig.generatedAssetsBucket, `${artifactPrefix}/readiness/web-search-capture-internal-scope-manifest.json`, internalScopeManifest, 'internal_scope_manifest'))
  artifacts.push(await uploadJson(localRoot, webSearchCaptureReadinessConfig.generatedAssetsBucket, `${artifactPrefix}/evidence/evidence-chain.json`, evidenceChain, 'evidence_chain'))
  artifacts.push(await uploadJson(localRoot, webSearchCaptureReadinessConfig.generatedAssetsBucket, `${artifactPrefix}/providers/provider-gate-audit.json`, providerGateAudit, 'provider_gate_audit'))
  artifacts.push(await uploadJson(localRoot, webSearchCaptureReadinessConfig.generatedAssetsBucket, `${artifactPrefix}/artifacts/private-artifact-verification.json`, artifactVerification, 'private_artifact_verification'))
  artifacts.push(await uploadJson(localRoot, webSearchCaptureReadinessConfig.generatedAssetsBucket, `${artifactPrefix}/service/private-searxng-access-audit.json`, serviceAccessAudit, 'private_searxng_access_audit'))
  artifacts.push(await uploadJson(localRoot, webSearchCaptureReadinessConfig.generatedAssetsBucket, `${artifactPrefix}/failure/fail-closed-policy.json`, failurePolicy, 'fail_closed_policy'))
  artifacts.push(await uploadJson(localRoot, webSearchCaptureReadinessConfig.qaBucket, `${artifactPrefix}/qa/web-search-capture-readiness-qa.json`, qa, 'qa'))
  executionReport.artifacts = artifacts
  artifacts.push(await uploadJson(localRoot, webSearchCaptureReadinessConfig.qaBucket, `${artifactPrefix}/reports/phase49h-report.json`, executionReport, 'phase49h_report'))

  await mkdir(path.dirname(WEB_SEARCH_CAPTURE_READINESS_LOCAL_REPORT_PATH), { recursive: true })
  await writeFile(WEB_SEARCH_CAPTURE_READINESS_LOCAL_REPORT_PATH, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')

  const evidence: ApprovedWebSearchCaptureReadinessEvidence = {
    phase: '49H',
    status: ok ? 'completed' : 'blocked',
    runId,
    privateSearxngService: webSearchCaptureReadinessConfig.serviceName,
    readinessManifestUri: gcsUri(webSearchCaptureReadinessConfig.generatedAssetsBucket, `${artifactPrefix}/readiness/web-search-capture-internal-scope-manifest.json`),
    evidenceChainUri: gcsUri(webSearchCaptureReadinessConfig.generatedAssetsBucket, `${artifactPrefix}/evidence/evidence-chain.json`),
    providerGateAuditUri: gcsUri(webSearchCaptureReadinessConfig.generatedAssetsBucket, `${artifactPrefix}/providers/provider-gate-audit.json`),
    artifactVerificationUri: gcsUri(webSearchCaptureReadinessConfig.generatedAssetsBucket, `${artifactPrefix}/artifacts/private-artifact-verification.json`),
    serviceAccessAuditUri: gcsUri(webSearchCaptureReadinessConfig.generatedAssetsBucket, `${artifactPrefix}/service/private-searxng-access-audit.json`),
    qaReportUri: gcsUri(webSearchCaptureReadinessConfig.qaBucket, `${artifactPrefix}/qa/web-search-capture-readiness-qa.json`),
    phase49hReportUri: gcsUri(webSearchCaptureReadinessConfig.qaBucket, `${artifactPrefix}/reports/phase49h-report.json`),
    webSearchCaptureInternalTestingReady: ok,
    phase49IReadiness,
    blockers,
    warnings,
  }

  return {
    evidence,
    evidenceModule: webSearchCaptureReadinessEvidenceToTypeScript(evidence),
    executionReport,
    localReportPath: WEB_SEARCH_CAPTURE_READINESS_LOCAL_REPORT_PATH,
  }
}

async function verifyGcloudPreflight(blockers: string[], warnings: string[]): Promise<void> {
  const project = await safeGcloud(['config', 'get-value', 'project'])
  if (!project.ok) {
    blockers.push(`gcloud project lookup failed: ${project.error}`)
  } else if (project.stdout.trim() !== webSearchCaptureReadinessConfig.projectId) {
    blockers.push(`Active gcloud project must be ${webSearchCaptureReadinessConfig.projectId}; observed ${project.stdout.trim() || 'empty'}.`)
  }
  const projectDescribe = await safeGcloud(['projects', 'describe', webSearchCaptureReadinessConfig.projectId, '--format=json'])
  if (!projectDescribe.ok) blockers.push(`gcloud project describe failed: ${projectDescribe.error}`)
  const auth = await safeGcloud(['auth', 'list', '--format=json'])
  if (!auth.ok) blockers.push(`gcloud auth list failed: ${auth.error}`)
  else if (!auth.stdout.includes('"status": "ACTIVE"')) warnings.push('gcloud auth list did not clearly show an ACTIVE account in JSON output.')
}

async function verifyBuckets(blockers: string[]): Promise<void> {
  for (const bucket of [webSearchCaptureReadinessConfig.generatedAssetsBucket, webSearchCaptureReadinessConfig.qaBucket]) {
    const result = await safeGcloud(['storage', 'buckets', 'describe', `gs://${bucket}`, '--format=json'])
    if (!result.ok) blockers.push(`Unable to describe private bucket gs://${bucket}: ${result.error}`)
  }
}

async function auditPrivateSearxngCloudRunService(): Promise<WebSearchServiceAccessAudit> {
  const describe = await safeGcloud(['run', 'services', 'describe', webSearchCaptureReadinessConfig.serviceName, '--region', webSearchCaptureReadinessConfig.region, '--project', webSearchCaptureReadinessConfig.projectId, '--format=json'])
  const policy = await safeGcloud(['run', 'services', 'get-iam-policy', webSearchCaptureReadinessConfig.serviceName, '--region', webSearchCaptureReadinessConfig.region, '--project', webSearchCaptureReadinessConfig.projectId, '--format=json'])
  if (!describe.ok) {
    return {
      serviceName: webSearchCaptureReadinessConfig.serviceName,
      exists: false,
      projectId: webSearchCaptureReadinessConfig.projectId,
      region: webSearchCaptureReadinessConfig.region,
      serviceUrlRedacted: 'not_resolved',
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
    spec?: { template?: { spec?: { serviceAccountName?: string; containers?: Array<{ image?: string }> } } }
  }
  const iam = policy.ok ? JSON.parse(policy.stdout) as { bindings?: Array<{ role?: string; members?: string[] }> } : { bindings: [] }
  const invokerMembers = (iam.bindings ?? [])
    .filter((binding) => binding.role === 'roles/run.invoker')
    .flatMap((binding) => binding.members ?? [])
  const allUsersPresent = invokerMembers.includes('allUsers')
  const allAuthenticatedUsersPresent = invokerMembers.includes('allAuthenticatedUsers')
  const blockers = [
    allUsersPresent ? 'Cloud Run service grants roles/run.invoker to allUsers.' : '',
    allAuthenticatedUsersPresent ? 'Cloud Run service grants roles/run.invoker to allAuthenticatedUsers.' : '',
    policy.ok ? '' : `Cloud Run IAM policy could not be resolved: ${policy.error}`,
  ].filter(Boolean)
  return {
    serviceName: webSearchCaptureReadinessConfig.serviceName,
    exists: true,
    projectId: webSearchCaptureReadinessConfig.projectId,
    region: webSearchCaptureReadinessConfig.region,
    serviceUrlRedacted: service.status?.url ? 'private_authenticated_cloud_run_url_redacted' : 'not_reported',
    ingress: service.metadata?.annotations?.['run.googleapis.com/ingress'],
    serviceAccountEmail: service.spec?.template?.spec?.serviceAccountName,
    image: service.spec?.template?.spec?.containers?.[0]?.image,
    allUsersPresent,
    allAuthenticatedUsersPresent,
    invokerMembers,
    publicUnauthenticatedAccess: allUsersPresent || allAuthenticatedUsersPresent,
    metadataSource: 'cloud_run_metadata_only',
    blockers,
    warnings: [
      'Phase 49H inspected Cloud Run metadata and IAM only; it did not issue a health request or search query.',
    ],
  }
}

async function verifyEvidenceArtifacts(entries: WebSearchArtifactVerificationEntry[]): Promise<WebSearchArtifactVerificationEntry[]> {
  const verified: WebSearchArtifactVerificationEntry[] = []
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

async function uploadJson(localRoot: string, bucket: string, object: string, value: unknown, artifactId: string): Promise<WebSearchReadinessArtifact> {
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

function phase49HDocsPresent(): boolean {
  return [
    'docs/activation-web-search-capture-readiness-runbook.md',
    'docs/activation-web-search-capture-readiness-policy.md',
    'docs/activation-web-search-capture-readiness-artifact-policy.md',
    'docs/activation-web-search-capture-readiness-qa-policy.md',
    'docs/activation-phase-49h-web-search-capture-readiness-results.md',
  ].every((doc) => existsSync(doc))
}
