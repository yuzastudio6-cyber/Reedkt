import { execFile as execFileCallback } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { resolveSearchProviderEvidenceChain } from './search-provider-evidence-resolver'
import { buildSearchProviderCostAudit } from './search-provider-cost-audit'
import { buildSearchProviderFailurePolicy } from './search-provider-failure-policy'
import { buildSearchProviderRegistryAudit } from './search-provider-registry-audit'
import { auditBraveSearchSecretMetadata } from './search-provider-secret-audit'
import {
  makeSearchProviderReadinessRunId,
  searchProviderReadinessArtifactPrefix,
  searchProviderReadinessConfig,
  validateSearchProviderReadinessExecutionEnv,
} from './search-provider-readiness-policy'
import { buildSearchProviderReadinessQaSummary } from './search-provider-readiness-qa-summary'
import { SEARCH_PROVIDER_READINESS_LOCAL_REPORT_PATH } from './search-provider-readiness-report-builder'
import { buildSearchProviderScopeManifest } from './search-provider-scope-manifest'
import { buildSearchProviderStoragePolicyAudit } from './search-provider-storage-policy-audit'
import type {
  SearchProviderArtifactVerificationEntry,
  SearchProviderReadinessArtifact,
  SearchProviderReadinessExecutionReport,
  SearchProviderServiceAudit,
} from './search-provider-readiness-types'

const execFile = promisify(execFileCallback)

export interface SearchProviderReadinessRunResult {
  executionReport: SearchProviderReadinessExecutionReport
  localReportPath: string
}

export async function runSearchProviderReadiness(input: { execute: boolean; runId?: string }): Promise<SearchProviderReadinessRunResult> {
  if (!input.execute) throw new Error('Pass --execute with REEDITPRO_CONFIRM_SEARCH_PROVIDER_READINESS_GATE=true to run Phase 49N.')
  const activeProject = await safeGcloud(['config', 'get-value', 'project'])
  const envValidation = validateSearchProviderReadinessExecutionEnv({ activeProject: activeProject.ok ? activeProject.stdout.trim() : undefined })
  if (!envValidation.ok) throw new Error(envValidation.blockers.join('\n'))

  const runId = input.runId ?? makeSearchProviderReadinessRunId()
  const localRoot = path.join(os.tmpdir(), `reeditpro-phase49n-search-provider-readiness-${runId}`)
  await mkdir(localRoot, { recursive: true })

  const executionBlockers: string[] = [...envValidation.blockers]
  const executionWarnings: string[] = [...envValidation.warnings]
  if (!activeProject.ok) executionBlockers.push(`Unable to read active gcloud project: ${activeProject.error}`)
  await verifyGcloudPreflight(executionBlockers, executionWarnings)
  await verifyBuckets(executionBlockers)

  const evidenceChain = resolveSearchProviderEvidenceChain()
  const serviceAudit = await auditPrivateSearxngService()
  const secretAudit = await auditBraveSearchSecretMetadata()
  const costAudit = buildSearchProviderCostAudit()
  const storagePolicyAudit = buildSearchProviderStoragePolicyAudit()
  const failurePolicy = buildSearchProviderFailurePolicy()
  const searxngInternalReady = serviceAudit.exists && !serviceAudit.publicUnauthenticatedAccess && !serviceAudit.gpuDetected && evidenceChain.phases.some((phase) => phase.phase === '49F' && phase.status === 'completed')
  const braveOptionalFallbackReady = secretAudit.secretExists && secretAudit.enabledVersionPresent && secretAudit.approvedServiceAccountsHaveAccess && evidenceChain.phases.some((phase) => phase.phase === '49L' && phase.status === 'completed')
  const hybridConsensusReady = evidenceChain.phases.some((phase) => phase.phase === '49M' && phase.status === 'completed' && phase.readiness === 'ready_for_search_provider_readiness_gate')
  const providerRegistryAudit = buildSearchProviderRegistryAudit({ searxngInternalReady })
  const artifactVerification = await verifyEvidenceArtifacts(buildArtifactVerificationEntries(evidenceChain))
  const provisionalReady = searxngInternalReady && braveOptionalFallbackReady && hybridConsensusReady
  const scopeManifest = buildSearchProviderScopeManifest({
    runId,
    searxngInternalReady,
    braveOptionalFallbackReady,
    hybridConsensusReady,
    ready: provisionalReady,
  })
  const qa = buildSearchProviderReadinessQaSummary({
    evidenceChain,
    scopeManifest,
    providerRegistryAudit,
    serviceAudit,
    secretAudit,
    costAudit,
    storagePolicyAudit,
    failurePolicy,
    artifactVerification,
    executionBlockers,
    executionWarnings,
  })
  const ready = qa.status === 'passed'
  const phase49OReadiness = ready
    ? 'ready_for_web_search_regression_failure_mode_suite_or_system_reconciliation'
    : 'blocked_until_search_provider_readiness_passes'
  const artifactPrefix = searchProviderReadinessArtifactPrefix(runId)
  const artifacts: SearchProviderReadinessArtifact[] = []
  const executionReport: SearchProviderReadinessExecutionReport = {
    runId,
    ok: ready,
    createdAt: new Date().toISOString(),
    config: searchProviderReadinessConfig,
    evidenceChain,
    scopeManifest: {
      ...scopeManifest,
      readinessDecision: ready ? 'ready_for_controlled_internal_testing' : 'blocked',
    },
    providerRegistryAudit,
    serviceAudit,
    secretAudit,
    costAudit,
    storagePolicyAudit,
    failurePolicy,
    artifactVerification,
    qa,
    artifacts,
    searchProviderInternalTestingReady: ready,
    phase49OReadiness,
    blockers: qa.blockers,
    warnings: qa.warnings,
  }

  artifacts.push(await uploadJson(localRoot, searchProviderReadinessConfig.generatedAssetsBucket, `${artifactPrefix}/readiness/search-provider-readiness-manifest.json`, executionReport.scopeManifest, 'search_provider_readiness_manifest'))
  artifacts.push(await uploadJson(localRoot, searchProviderReadinessConfig.generatedAssetsBucket, `${artifactPrefix}/evidence/evidence-chain.json`, evidenceChain, 'evidence_chain'))
  artifacts.push(await uploadJson(localRoot, searchProviderReadinessConfig.generatedAssetsBucket, `${artifactPrefix}/provider/provider-registry-audit.json`, providerRegistryAudit, 'provider_registry_audit'))
  artifacts.push(await uploadJson(localRoot, searchProviderReadinessConfig.generatedAssetsBucket, `${artifactPrefix}/secret/brave-secret-metadata-audit.json`, secretAudit, 'brave_secret_metadata_audit'))
  artifacts.push(await uploadJson(localRoot, searchProviderReadinessConfig.generatedAssetsBucket, `${artifactPrefix}/cost/brave-cost-policy-audit.json`, costAudit, 'brave_cost_policy_audit'))
  artifacts.push(await uploadJson(localRoot, searchProviderReadinessConfig.generatedAssetsBucket, `${artifactPrefix}/storage/brave-storage-policy-audit.json`, storagePolicyAudit, 'brave_storage_policy_audit'))
  artifacts.push(await uploadJson(localRoot, searchProviderReadinessConfig.generatedAssetsBucket, `${artifactPrefix}/policy/search-provider-failure-policy.json`, failurePolicy, 'search_provider_failure_policy'))
  artifacts.push(await uploadJson(localRoot, searchProviderReadinessConfig.qaBucket, `${artifactPrefix}/qa/search-provider-readiness-qa.json`, qa, 'search_provider_readiness_qa'))
  executionReport.artifacts = artifacts
  artifacts.push(await uploadJson(localRoot, searchProviderReadinessConfig.qaBucket, `${artifactPrefix}/reports/phase49n-report.json`, executionReport, 'phase49n_report'))

  await mkdir(path.dirname(SEARCH_PROVIDER_READINESS_LOCAL_REPORT_PATH), { recursive: true })
  await writeFile(SEARCH_PROVIDER_READINESS_LOCAL_REPORT_PATH, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')

  return { executionReport, localReportPath: SEARCH_PROVIDER_READINESS_LOCAL_REPORT_PATH }
}

async function verifyGcloudPreflight(blockers: string[], warnings: string[]): Promise<void> {
  const projectDescribe = await safeGcloud(['projects', 'describe', searchProviderReadinessConfig.projectId, '--format=json'])
  if (!projectDescribe.ok) blockers.push(`gcloud project describe failed: ${projectDescribe.error}`)
  const auth = await safeGcloud(['auth', 'list', '--format=json'])
  if (!auth.ok) blockers.push(`gcloud auth list failed: ${auth.error}`)
  else if (!auth.stdout.includes('"status": "ACTIVE"')) warnings.push('gcloud auth list did not clearly show an ACTIVE account in JSON output.')
}

async function verifyBuckets(blockers: string[]): Promise<void> {
  for (const bucket of [searchProviderReadinessConfig.generatedAssetsBucket, searchProviderReadinessConfig.qaBucket]) {
    const result = await safeGcloud(['storage', 'buckets', 'describe', `gs://${bucket}`, '--format=json'])
    if (!result.ok) blockers.push(`Unable to describe private bucket gs://${bucket}: ${result.error}`)
  }
}

async function auditPrivateSearxngService(): Promise<SearchProviderServiceAudit> {
  const describe = await safeGcloud(['run', 'services', 'describe', searchProviderReadinessConfig.serviceName, '--region', searchProviderReadinessConfig.region, '--project', searchProviderReadinessConfig.projectId, '--format=json'])
  const policy = await safeGcloud(['run', 'services', 'get-iam-policy', searchProviderReadinessConfig.serviceName, '--region', searchProviderReadinessConfig.region, '--project', searchProviderReadinessConfig.projectId, '--format=json'])
  if (!describe.ok) {
    return {
      serviceName: searchProviderReadinessConfig.serviceName,
      exists: false,
      projectId: searchProviderReadinessConfig.projectId,
      region: searchProviderReadinessConfig.region,
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
    serviceName: searchProviderReadinessConfig.serviceName,
    exists: true,
    projectId: searchProviderReadinessConfig.projectId,
    region: searchProviderReadinessConfig.region,
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
    warnings: [
      'Phase 49N inspected Cloud Run metadata and IAM only; it did not issue a health request or search query.',
    ],
  }
}

function buildArtifactVerificationEntries(evidenceChain: { phases: Array<{ phase: SearchProviderArtifactVerificationEntry['phase']; artifactUris: string[] }> }): SearchProviderArtifactVerificationEntry[] {
  return evidenceChain.phases.flatMap((phase) => phase.artifactUris.map((gcsUri, index) => ({
    artifactId: `${phase.phase.toLowerCase()}-${index + 1}`,
    phase: phase.phase,
    gcsUri,
    required: true,
  })))
}

async function verifyEvidenceArtifacts(entries: SearchProviderArtifactVerificationEntry[]): Promise<SearchProviderArtifactVerificationEntry[]> {
  const verified: SearchProviderArtifactVerificationEntry[] = []
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

async function uploadJson(localRoot: string, bucket: string, object: string, value: unknown, artifactId: string): Promise<SearchProviderReadinessArtifact> {
  const localPath = await writeJson(localRoot, artifactId, value)
  const uri = `gs://${bucket}/${object}`
  await runGcloud(['storage', 'cp', localPath, uri])
  return { artifactId, gcsUri: uri, contentType: 'private_json' }
}

async function writeJson(localRoot: string, artifactId: string, value: unknown): Promise<string> {
  const filePath = path.join(localRoot, `${artifactId}.json`)
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  return filePath
}

async function runGcloud(args: string[]): Promise<{ stdout: string; stderr: string }> {
  return execFile('gcloud', args, { maxBuffer: 30 * 1024 * 1024 })
}

async function safeGcloud(args: string[]): Promise<{ ok: true; stdout: string; stderr: string } | { ok: false; stdout: string; stderr: string; error: string }> {
  try {
    const result = await runGcloud(args)
    return { ok: true, stdout: result.stdout, stderr: result.stderr }
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; message?: string }
    return { ok: false, stdout: err.stdout ?? '', stderr: err.stderr ?? '', error: err.stderr || err.message || String(error) }
  }
}
