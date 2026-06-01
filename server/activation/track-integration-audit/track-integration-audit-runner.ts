import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { mkdir, rm, stat, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { buildTrackIntegrationDocsReconciliation, buildTrackIntegrationRegistryReconciliation } from './track-integration-audit-consistency'
import { buildTrackIntegrationOwnershipMatrix } from './track-integration-audit-ownership'
import {
  makeTrackIntegrationAuditRunId,
  trackIntegrationAuditArtifactPrefix,
  trackIntegrationAuditConfig,
  validateTrackIntegrationAuditExecutionEnv,
} from './track-integration-audit-policy'
import { buildTrackIntegrationAuditManifest, buildTrackIntegrationAuditQaSummary } from './track-integration-audit-qa-summary'
import { buildIntegrationReadinessDecision, trackIntegrationAuditEvidenceToTypeScript, TRACK_INTEGRATION_AUDIT_LOCAL_REPORT_PATH } from './track-integration-audit-report-builder'
import { buildTrackIntegrationTrackASummary } from './track-integration-audit-track-a-resolver'
import { buildTrackIntegrationTrackBSummary } from './track-integration-audit-track-b-resolver'
import type {
  ApprovedTrackIntegrationAuditEvidence,
  TrackIntegrationAuditArtifact,
  TrackIntegrationAuditExecutionReport,
} from './track-integration-audit-types'

const execFileAsync = promisify(execFile)

interface GcsObjectMetadata {
  name?: string
  bucket?: string
  size?: string | number
}

export async function runTrackIntegrationAudit(input: { execute: boolean; runId?: string }) {
  if (!input.execute) throw new Error('Pass --execute to run Phase 47A Track integration audit.')
  const runId = input.runId ?? process.env.REEDITPRO_PHASE47A_RUN_ID ?? makeTrackIntegrationAuditRunId()
  const artifactPrefix = trackIntegrationAuditArtifactPrefix(runId)
  const localRoot = path.join(os.tmpdir(), `reeditpro-track-integration-audit-${runId}`)
  await rm(localRoot, { recursive: true, force: true })
  await mkdir(localRoot, { recursive: true })

  const preflight = await runTrackIntegrationAuditPreflight()
  const trackA = buildTrackIntegrationTrackASummary()
  const trackB = buildTrackIntegrationTrackBSummary()
  const ownershipMatrix = buildTrackIntegrationOwnershipMatrix()
  const registryReconciliation = buildTrackIntegrationRegistryReconciliation()
  const docsReconciliation = buildTrackIntegrationDocsReconciliation()
  const readinessDecision = buildIntegrationReadinessDecision(trackA, trackB)

  const qa = buildTrackIntegrationAuditQaSummary({
    trackA,
    trackB,
    ownershipMatrix,
    registryReconciliation,
    docsReconciliation,
    publicAccessBlocked: preflight.publicAccessBlocked && preflight.blockers.length === 0,
    productionBetaGatesBlocked: productionBetaGatesBlocked(),
  })
  const finalQa = preflight.blockers.length
    ? {
        ...qa,
        status: 'blocked' as const,
        blockers: Array.from(new Set([...qa.blockers, ...preflight.blockers])),
      }
    : qa

  const manifest = buildTrackIntegrationAuditManifest({
    phase: '47A',
    runId,
    createdAt: new Date().toISOString(),
    trackA,
    trackB,
    ownershipMatrix,
    registryReconciliation,
    docsReconciliation,
    readinessDecision,
  })
  const artifacts: TrackIntegrationAuditArtifact[] = []
  const integrationManifestArtifact = await uploadJson(trackIntegrationAuditConfig.generatedAssetsBucket, `${artifactPrefix}/integration/integration-readiness-manifest.json`, manifest, localRoot, 'integration_manifest')
  artifacts.push(integrationManifestArtifact)
  const trackAEvidenceArtifact = await uploadJson(trackIntegrationAuditConfig.generatedAssetsBucket, `${artifactPrefix}/evidence/track-a-evidence.json`, trackA, localRoot, 'track_a_evidence')
  artifacts.push(trackAEvidenceArtifact)
  const trackBEvidenceArtifact = await uploadJson(trackIntegrationAuditConfig.generatedAssetsBucket, `${artifactPrefix}/evidence/track-b-evidence.json`, trackB, localRoot, 'track_b_evidence')
  artifacts.push(trackBEvidenceArtifact)
  const ownershipArtifact = await uploadJson(trackIntegrationAuditConfig.generatedAssetsBucket, `${artifactPrefix}/ownership/ownership-matrix.json`, ownershipMatrix, localRoot, 'ownership_matrix')
  artifacts.push(ownershipArtifact)
  const registryArtifact = await uploadJson(trackIntegrationAuditConfig.generatedAssetsBucket, `${artifactPrefix}/reconciliation/registry-reconciliation.json`, registryReconciliation, localRoot, 'registry_reconciliation')
  artifacts.push(registryArtifact)
  const docsArtifact = await uploadJson(trackIntegrationAuditConfig.generatedAssetsBucket, `${artifactPrefix}/reconciliation/docs-reconciliation.json`, docsReconciliation, localRoot, 'docs_reconciliation')
  artifacts.push(docsArtifact)
  artifacts.push(await uploadJson(trackIntegrationAuditConfig.qaBucket, `${artifactPrefix}/qa/track-integration-audit-qa.json`, finalQa, localRoot, 'track_integration_audit_qa'))

  const executionReport: TrackIntegrationAuditExecutionReport = {
    ok: finalQa.status === 'passed',
    phase: '47A',
    runId,
    projectId: trackIntegrationAuditConfig.projectId,
    runtimeMode: trackIntegrationAuditConfig.runtimeMode,
    trackA,
    trackB,
    ownershipMatrix,
    registryReconciliation,
    docsReconciliation,
    readinessDecision,
    artifacts,
    qa: finalQa,
    safety: {
      mediaProcessed: false,
      providerExecuted: false,
      dockerBuiltOrPushed: false,
      cloudRunDeployedOrExecuted: false,
      publicAccessEnabled: false,
      productionReadyAllowed: false,
      externalBetaAllowed: false,
      paidProductionAllowed: false,
      broadRealUserMediaAllowed: false,
      finalDeliveryAllowed: false,
      revideoUsed: false,
    },
    blockers: finalQa.blockers,
    warnings: Array.from(new Set([...finalQa.warnings, ...preflight.warnings])),
  }
  const reportArtifact = await uploadJson(trackIntegrationAuditConfig.qaBucket, `${artifactPrefix}/reports/phase47a-report.json`, executionReport, localRoot, 'phase47a_report')
  executionReport.artifacts = [...artifacts, reportArtifact]

  const localReportPath = path.join(process.cwd(), TRACK_INTEGRATION_AUDIT_LOCAL_REPORT_PATH)
  await mkdir(path.dirname(localReportPath), { recursive: true })
  await writeFile(localReportPath, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')

  const evidence: ApprovedTrackIntegrationAuditEvidence = {
    phase: '47A',
    status: executionReport.ok ? 'completed' : 'blocked',
    runId,
    integrationManifestUri: integrationManifestArtifact.gcsUri,
    trackAEvidenceUri: trackAEvidenceArtifact.gcsUri,
    trackBEvidenceUri: trackBEvidenceArtifact.gcsUri,
    ownershipMatrixUri: ownershipArtifact.gcsUri,
    registryReconciliationUri: registryArtifact.gcsUri,
    docsReconciliationUri: docsArtifact.gcsUri,
    qaReportUri: reportArtifact.gcsUri,
    trackAReadiness: {
      status: trackA.status,
      reason: trackA.summary,
    },
    trackBReadiness: {
      status: trackB.status,
      reason: trackB.summary,
    },
    integrationReadiness: readinessDecision,
    blockers: finalQa.blockers,
    warnings: executionReport.warnings,
  }

  return {
    evidence,
    executionReport,
    localReportPath,
    iamChanges: ['not_required: Phase 47A used active account private JSON upload permissions only'],
    evidenceModule: trackIntegrationAuditEvidenceToTypeScript(evidence),
  }
}

export async function runTrackIntegrationAuditPreflight() {
  const blockers: string[] = []
  const warnings: string[] = []
  let activeProjectValue = ''
  let activeAccountValue = ''
  let publicAccessBlocked = false
  try {
    const [activeAccount, activeProject, projectDescribe, generatedAssetsBucket, qaBucket] = await Promise.all([
      runGcloud(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
      runGcloud(['config', 'get-value', 'project']),
      runGcloud(['projects', 'describe', trackIntegrationAuditConfig.projectId, '--format=value(projectId)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${trackIntegrationAuditConfig.generatedAssetsBucket}`, '--format=value(name)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${trackIntegrationAuditConfig.qaBucket}`, '--format=value(name)']),
    ])
    activeAccountValue = lastGcloudValue(activeAccount)
    activeProjectValue = lastGcloudValue(activeProject)
    if (!activeAccountValue) blockers.push('No active gcloud account is visible.')
    if (activeProjectValue !== trackIntegrationAuditConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
    if (lastGcloudValue(projectDescribe) !== trackIntegrationAuditConfig.projectId) blockers.push('gcloud cannot describe project reeditpro.')
    if (lastGcloudValue(generatedAssetsBucket) !== trackIntegrationAuditConfig.generatedAssetsBucket) blockers.push('Generated-assets bucket is not reachable.')
    if (lastGcloudValue(qaBucket) !== trackIntegrationAuditConfig.qaBucket) blockers.push('QA bucket is not reachable.')
    await assertNoPublicBucketPrincipals([
      trackIntegrationAuditConfig.generatedAssetsBucket,
      trackIntegrationAuditConfig.qaBucket,
    ])
    publicAccessBlocked = true
  } catch (error) {
    blockers.push(error instanceof Error ? error.message : String(error))
  }

  const evidenceObjects = [
    trackIntegrationAuditConfig.trackAEvidenceManifestGcsUri,
    trackIntegrationAuditConfig.trackAReportGcsUri,
    'gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase39c/generated-vlm-runtime/phase39c-20260531T214216/phase_39c_generated_vlm_runtime_report.json',
  ]
  for (const uri of evidenceObjects) {
    const described = await tryDescribeGcsObject(uri)
    if (described.error) blockers.push(`Approved evidence object is not reachable: ${uri} (${described.error})`)
    if (described.metadata.name && sizeBytes(described.metadata) <= 0) blockers.push(`Approved evidence object is empty: ${uri}`)
  }

  const envValidation = validateTrackIntegrationAuditExecutionEnv({ activeProject: activeProjectValue })
  blockers.push(...envValidation.blockers)
  warnings.push(...envValidation.warnings)

  return {
    activeAccount: activeAccountValue,
    activeProject: activeProjectValue,
    publicAccessBlocked,
    blockers: Array.from(new Set(blockers)),
    warnings: Array.from(new Set(warnings)),
  }
}

async function uploadJson(bucket: string, object: string, payload: unknown, localRoot: string, id: string): Promise<TrackIntegrationAuditArtifact> {
  const localPath = path.join(localRoot, `${id}.json`)
  await writeFile(localPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  await runGcloud(['storage', 'cp', localPath, `gs://${bucket}/${object}`])
  const metadata = await stat(localPath)
  const sha256 = createHash('sha256').update(readFileSync(localPath)).digest('hex')
  return {
    id,
    kind: 'private_json',
    bucket,
    object,
    gcsUri: `gs://${bucket}/${object}`,
    sizeBytes: metadata.size,
    sha256,
  }
}

async function tryDescribeGcsObject(uri: string): Promise<{ metadata: GcsObjectMetadata; error?: string }> {
  try {
    const stdout = await runGcloud(['storage', 'objects', 'describe', uri, '--format=json'])
    return { metadata: parseGcloudJson(stdout) as GcsObjectMetadata }
  } catch (error) {
    return { metadata: {}, error: error instanceof Error ? error.message : String(error) }
  }
}

async function assertNoPublicBucketPrincipals(buckets: string[]) {
  for (const bucket of buckets) {
    const stdout = await runGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${bucket}`, '--format=json'])
    if (/allUsers|allAuthenticatedUsers/.test(stdout)) throw new Error(`Bucket ${bucket} contains a public principal.`)
  }
}

async function runGcloud(args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('gcloud', args, {
    maxBuffer: 20 * 1024 * 1024,
    env: process.env,
  })
  return stdout.trim()
}

function lastGcloudValue(output: string): string {
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !isGcloudWarningLine(line))
    .at(-1) ?? ''
}

function parseGcloudJson(output: string): unknown {
  const objectIndex = output.indexOf('{')
  const arrayIndex = output.indexOf('[')
  const indexes = [objectIndex, arrayIndex].filter((index) => index >= 0)
  const start = indexes.length ? Math.min(...indexes) : -1
  if (start < 0) throw new Error('gcloud did not return JSON metadata.')
  return JSON.parse(output.slice(start))
}

function isGcloudWarningLine(line: string): boolean {
  return line.startsWith('WARNING:')
    || line.startsWith('To reinstall gcloud')
    || line.startsWith('$ gcloud')
    || line.startsWith('This will also prompt')
    || line.startsWith('If you have a compatible')
    || line.startsWith('/usr/local/')
    || line.startsWith('warnings.warn(')
    || line.startsWith('An error occurred:')
    || line.includes('Python 3.9.x is no longer officially supported')
    || line.includes('non-supported Python version')
}

function sizeBytes(metadata: GcsObjectMetadata): number {
  const raw = metadata.size
  if (typeof raw === 'number') return raw
  if (typeof raw === 'string') return Number(raw) || 0
  return 0
}

function productionBetaGatesBlocked(): boolean {
  return [
    process.env.PROVIDER_EXECUTION_ENABLED ?? 'false',
    process.env.REVIDEO_ENABLED ?? 'false',
    process.env.PUBLIC_ACCESS_ENABLED ?? 'false',
    process.env.FINAL_DELIVERY_ENABLED ?? 'false',
    process.env.MEDIA_PROCESSING_ENABLED ?? 'false',
    process.env.DOCKER_EXECUTION_ENABLED ?? 'false',
    process.env.CLOUD_RUN_EXECUTION_ENABLED ?? 'false',
    process.env.REEDITPRO_PRODUCTION_READY ?? 'false',
    process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false',
    process.env.REEDITPRO_PAID_PRODUCTION_READY ?? 'false',
    process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false',
  ].every((value) => value === 'false')
}
