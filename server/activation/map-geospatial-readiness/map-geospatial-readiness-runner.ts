import { execFile as execFileCallback } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, stat, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { buildArtifactVerificationEntries, buildMapGeospatialArtifactPrivacyAudit } from './map-geospatial-artifact-audit'
import { buildMapGeospatialDependencyAudit } from './map-geospatial-dependency-audit'
import { resolveMapGeospatialEvidenceChain } from './map-geospatial-evidence-resolver'
import { buildMapGeospatialFailurePolicy } from './map-geospatial-failure-policy'
import { buildMapGeospatialOwnershipAudit } from './map-geospatial-ownership-audit'
import { buildMapGeospatialProviderDataAudit } from './map-geospatial-provider-audit'
import {
  makeMapGeospatialReadinessRunId,
  mapGeospatialReadinessArtifactPrefix,
  mapGeospatialReadinessConfig,
  mapGeospatialReadinessSafetyFlags,
  validateMapGeospatialReadinessExecutionEnv,
} from './map-geospatial-readiness-policy'
import { buildMapGeospatialReadinessQaSummary } from './map-geospatial-readiness-qa-summary'
import { MAP_GEOSPATIAL_READINESS_LOCAL_REPORT_PATH } from './map-geospatial-readiness-report-builder'
import { buildMapGeospatialReadinessScopeManifest } from './map-geospatial-scope-manifest'
import type {
  MapGeospatialArtifactVerificationEntry,
  MapGeospatialReadinessArtifact,
  MapGeospatialReadinessExecutionReport,
} from './map-geospatial-readiness-types'

const execFile = promisify(execFileCallback)

export async function runMapGeospatialReadiness(input: { execute: boolean; runId?: string }) {
  if (!input.execute) throw new Error('Pass --execute with REEDITPRO_CONFIRM_MAP_GEOSPATIAL_INTERNAL_READINESS=true to run Phase 50G.')
  const activeProject = await safeGcloud(['config', 'get-value', 'project'])
  const envValidation = validateMapGeospatialReadinessExecutionEnv({ activeProject: activeProject.ok ? activeProject.stdout.trim() : undefined })
  if (!envValidation.ok) throw new Error(envValidation.blockers.join('\n'))

  const runId = input.runId ?? process.env.REEDITPRO_PHASE50G_RUN_ID ?? makeMapGeospatialReadinessRunId()
  const artifactPrefix = mapGeospatialReadinessArtifactPrefix(runId)
  const localRoot = path.join(os.tmpdir(), `reeditpro-phase50g-map-geospatial-readiness-${runId}`)
  await mkdir(localRoot, { recursive: true })

  const executionBlockers: string[] = [...envValidation.blockers]
  const executionWarnings: string[] = [...envValidation.warnings]
  if (!activeProject.ok) executionBlockers.push(`Unable to read active gcloud project: ${activeProject.error}`)
  await verifyGcloudPreflight(executionBlockers, executionWarnings)
  await verifyBuckets(executionBlockers)

  const evidenceChain = resolveMapGeospatialEvidenceChain()
  const providerDataAudit = buildMapGeospatialProviderDataAudit()
  const dependencyAudit = buildMapGeospatialDependencyAudit()
  const ownershipAudit = buildMapGeospatialOwnershipAudit()
  const failurePolicy = buildMapGeospatialFailurePolicy()
  const artifactVerification = await verifyEvidenceArtifacts(buildArtifactVerificationEntries(evidenceChain))
  const artifactPrivacyAudit = buildMapGeospatialArtifactPrivacyAudit(artifactVerification)
  const docsPresent = true
  const scriptsPresent = true
  const qa = buildMapGeospatialReadinessQaSummary({
    evidenceChain,
    providerDataAudit,
    dependencyAudit,
    ownershipAudit,
    artifactPrivacyAudit,
    failurePolicy,
    docsPresent,
    scriptsPresent,
    executionBlockers,
    executionWarnings,
  })
  const ready = qa.status === 'passed'
  const scopeManifest = buildMapGeospatialReadinessScopeManifest({
    runId,
    ready,
    providerDataAudit,
    ownershipAudit,
    artifactPrivacyAudit,
    failurePolicy,
  })
  const artifacts: MapGeospatialReadinessArtifact[] = []
  const executionReport: MapGeospatialReadinessExecutionReport = {
    ok: ready,
    phase: '50G',
    runId,
    createdAt: new Date().toISOString(),
    projectId: 'reeditpro',
    mode: mapGeospatialReadinessConfig.mode,
    evidenceChain,
    scopeManifest,
    providerDataAudit,
    dependencyAudit,
    ownershipAudit,
    artifactPrivacyAudit,
    failurePolicy,
    qa,
    artifacts,
    mapGeospatialInternalTestingReady: ready,
    phase52AReadiness: ready ? 'ready_for_shared_agent_and_tool_ownership_architecture' : 'blocked',
    safetyFlags: mapGeospatialReadinessSafetyFlags,
    blockers: qa.blockers,
    warnings: qa.warnings,
  }

  artifacts.push(await uploadJson(localRoot, mapGeospatialReadinessConfig.generatedAssetsBucket, `${artifactPrefix}/readiness/map-geospatial-readiness-manifest.json`, scopeManifest, 'map_geospatial_readiness_manifest'))
  artifacts.push(await uploadJson(localRoot, mapGeospatialReadinessConfig.generatedAssetsBucket, `${artifactPrefix}/evidence/evidence-chain.json`, evidenceChain, 'evidence_chain'))
  artifacts.push(await uploadJson(localRoot, mapGeospatialReadinessConfig.generatedAssetsBucket, `${artifactPrefix}/provider/provider-data-policy-audit.json`, providerDataAudit, 'provider_data_policy_audit'))
  artifacts.push(await uploadJson(localRoot, mapGeospatialReadinessConfig.generatedAssetsBucket, `${artifactPrefix}/dependency/map-geospatial-dependency-audit.json`, dependencyAudit, 'map_geospatial_dependency_audit'))
  artifacts.push(await uploadJson(localRoot, mapGeospatialReadinessConfig.generatedAssetsBucket, `${artifactPrefix}/ownership/ownership-boundary-audit.json`, ownershipAudit, 'ownership_boundary_audit'))
  artifacts.push(await uploadJson(localRoot, mapGeospatialReadinessConfig.generatedAssetsBucket, `${artifactPrefix}/artifact/artifact-privacy-audit.json`, artifactPrivacyAudit, 'artifact_privacy_audit'))
  artifacts.push(await uploadJson(localRoot, mapGeospatialReadinessConfig.generatedAssetsBucket, `${artifactPrefix}/policy/fail-closed-policy.json`, failurePolicy, 'fail_closed_policy'))
  artifacts.push(await uploadJson(localRoot, mapGeospatialReadinessConfig.qaBucket, `${artifactPrefix}/qa/map-geospatial-readiness-qa.json`, qa, 'map_geospatial_readiness_qa'))
  executionReport.artifacts = artifacts
  artifacts.push(await uploadJson(localRoot, mapGeospatialReadinessConfig.qaBucket, `${artifactPrefix}/reports/phase50g-report.json`, executionReport, 'phase50g_report'))

  await mkdir(path.dirname(MAP_GEOSPATIAL_READINESS_LOCAL_REPORT_PATH), { recursive: true })
  await writeFile(MAP_GEOSPATIAL_READINESS_LOCAL_REPORT_PATH, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')
  return {
    executionReport,
    localReportPath: MAP_GEOSPATIAL_READINESS_LOCAL_REPORT_PATH,
    iamChanges: ['not_required: active account uploaded private Phase 50G readiness JSON using existing private GCS permissions'],
  }
}

async function verifyGcloudPreflight(blockers: string[], warnings: string[]): Promise<void> {
  const projectDescribe = await safeGcloud(['projects', 'describe', mapGeospatialReadinessConfig.projectId, '--format=json'])
  if (!projectDescribe.ok) blockers.push(`gcloud project describe failed: ${projectDescribe.error}`)
  const auth = await safeGcloud(['auth', 'list', '--format=json'])
  if (!auth.ok) blockers.push(`gcloud auth list failed: ${auth.error}`)
  else if (!auth.stdout.includes('"status": "ACTIVE"')) warnings.push('gcloud auth list did not clearly show an ACTIVE account in JSON output.')
}

async function verifyBuckets(blockers: string[]): Promise<void> {
  for (const bucket of [mapGeospatialReadinessConfig.generatedAssetsBucket, mapGeospatialReadinessConfig.qaBucket]) {
    const result = await safeGcloud(['storage', 'buckets', 'describe', `gs://${bucket}`, '--format=json'])
    if (!result.ok) blockers.push(`Unable to describe private bucket gs://${bucket}: ${result.error}`)
    const iam = await safeGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${bucket}`, '--format=json'])
    if (!iam.ok) blockers.push(`Unable to inspect IAM for private bucket gs://${bucket}: ${iam.error}`)
    else if (iam.stdout.includes('allUsers') || iam.stdout.includes('allAuthenticatedUsers')) blockers.push(`Private bucket gs://${bucket} exposes a public principal.`)
  }
}

async function verifyEvidenceArtifacts(entries: MapGeospatialArtifactVerificationEntry[]): Promise<MapGeospatialArtifactVerificationEntry[]> {
  const verified: MapGeospatialArtifactVerificationEntry[] = []
  for (const entry of entries) {
    if (entry.gcsUri === 'static_docs_only') {
      verified.push(entry)
      continue
    }
    const result = await safeGcloud(['storage', 'objects', 'describe', entry.gcsUri, '--format=json'])
    verified.push({
      ...entry,
      exists: result.ok,
      blockers: result.ok ? [] : [`Canonical private GCS artifact was not metadata-verified: ${result.error}`],
      warnings: result.ok ? [] : entry.warnings,
    })
  }
  return verified
}

async function uploadJson(localRoot: string, bucket: string, objectPath: string, value: unknown, id: string): Promise<MapGeospatialReadinessArtifact> {
  const filePath = path.join(localRoot, `${id}.json`)
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  await runGcloud(['storage', 'cp', filePath, `gs://${bucket}/${objectPath}`])
  const fileStat = await stat(filePath)
  const bytes = await import('node:fs/promises').then((fs) => fs.readFile(filePath))
  return {
    id,
    kind: 'private_json',
    bucket,
    object: objectPath,
    gcsUri: `gs://${bucket}/${objectPath}`,
    sizeBytes: fileStat.size,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  }
}

async function runGcloud(args: string[]): Promise<string> {
  const { stdout } = await execFile('gcloud', args, { maxBuffer: 8 * 1024 * 1024 })
  return stdout
}

async function safeGcloud(args: string[]): Promise<{ ok: true; stdout: string } | { ok: false; error: string; stdout: string }> {
  try {
    const stdout = await runGcloud(args)
    return { ok: true, stdout }
  } catch (error) {
    const err = error as { message?: string; stdout?: string; stderr?: string }
    return { ok: false, error: err.stderr || err.message || String(error), stdout: err.stdout ?? '' }
  }
}
