import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, rm, stat, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { buildTrackAVisualEvidenceChain } from './track-a-visual-evidence-resolver'
import {
  makeTrackAVisualReadinessRunId,
  trackAVisualReadinessArtifactPrefix,
  trackAVisualReadinessConfig,
  trackAVisualReadinessRequiredDocs,
  trackAVisualReadinessRequiredScripts,
  validateTrackAVisualReadinessExecutionEnv,
} from './track-a-visual-readiness-closure-policy'
import { trackAVisualReadinessClosureEvidenceToTypeScript, TRACK_A_VISUAL_READINESS_LOCAL_REPORT_PATH } from './track-a-visual-readiness-closure-report-builder'
import { buildTrackAVisualReadinessClosureQaSummary, buildTrackAVisualReadinessManifest } from './track-a-visual-readiness-closure-qa-summary'
import type {
  ApprovedTrackAVisualReadinessClosureEvidence,
  TrackAVisualReadinessArtifact,
  TrackAVisualReadinessExecutionReport,
} from './track-a-visual-readiness-closure-types'

const execFileAsync = promisify(execFile)

interface GcsObjectMetadata {
  name?: string
  bucket?: string
  size?: string | number
}

export async function runTrackAVisualReadinessClosure(input: { execute: boolean; runId?: string }) {
  if (!input.execute) throw new Error('Pass --execute to run Phase 45F Track A visual-video readiness closure.')
  const runId = input.runId ?? process.env.REEDITPRO_PHASE45F_RUN_ID ?? makeTrackAVisualReadinessRunId()
  const artifactPrefix = trackAVisualReadinessArtifactPrefix(runId)
  const localRoot = path.join(os.tmpdir(), `reeditpro-track-a-visual-readiness-closure-${runId}`)
  await rm(localRoot, { recursive: true, force: true })
  await mkdir(localRoot, { recursive: true })

  const preflight = await runTrackAVisualReadinessClosurePreflight()
  const evidenceChain = buildTrackAVisualEvidenceChain()
  const [canonicalPrivateReviewExport, e2eReviewManifest, phase45EReport] = await Promise.all([
    tryDescribeGcsObject(trackAVisualReadinessConfig.canonicalPrivateReviewExportGcsUri),
    tryDescribeGcsObject(trackAVisualReadinessConfig.approvedPhase45EManifestGcsUri),
    tryDescribeGcsObject(trackAVisualReadinessConfig.approvedPhase45EReportGcsUri),
  ])
  const priorEvidenceObjects = await validatePriorEvidenceObjects(evidenceChain)
  const privateE2EArtifactValidation = {
    phase45ERunId: trackAVisualReadinessConfig.approvedPhase45ERunId,
    canonicalPrivateReviewExportGcsUri: trackAVisualReadinessConfig.canonicalPrivateReviewExportGcsUri,
    canonicalPrivateReviewExportExists: Boolean(canonicalPrivateReviewExport.metadata.name),
    canonicalPrivateReviewExportSizeBytes: sizeBytes(canonicalPrivateReviewExport.metadata),
    e2eReviewManifestGcsUri: trackAVisualReadinessConfig.approvedPhase45EManifestGcsUri,
    e2eReviewManifestExists: Boolean(e2eReviewManifest.metadata.name),
    e2eReviewManifestSizeBytes: sizeBytes(e2eReviewManifest.metadata),
    phase45EReportGcsUri: trackAVisualReadinessConfig.approvedPhase45EReportGcsUri,
    phase45EReportExists: Boolean(phase45EReport.metadata.name),
    phase45EReportSizeBytes: sizeBytes(phase45EReport.metadata),
    privateGcsOnly: [
      trackAVisualReadinessConfig.canonicalPrivateReviewExportGcsUri,
      trackAVisualReadinessConfig.approvedPhase45EManifestGcsUri,
      trackAVisualReadinessConfig.approvedPhase45EReportGcsUri,
    ].every((uri) => uri.startsWith('gs://reeditpro-staging-reeditpro-')),
  }
  const scriptsValid = requiredScriptsPresent()
  const docsValid = requiredDocsPresent()

  const qa = buildTrackAVisualReadinessClosureQaSummary({
    evidenceChain,
    privateE2EArtifactValidation,
    artifacts: [],
    scriptsValid,
    docsValid,
    publicAccessBlocked: preflight.publicAccessBlocked && priorEvidenceObjects.missing.length === 0 && preflight.blockers.length === 0,
  })
  const preflightBlockers = [
    ...preflight.blockers,
    ...priorEvidenceObjects.missing.map((uri) => `Prior evidence object is not reachable: ${uri}`),
    ...(canonicalPrivateReviewExport.error ? [`Canonical private review export is not reachable: ${canonicalPrivateReviewExport.error}`] : []),
    ...(e2eReviewManifest.error ? [`Phase 45E manifest is not reachable: ${e2eReviewManifest.error}`] : []),
    ...(phase45EReport.error ? [`Phase 45E report is not reachable: ${phase45EReport.error}`] : []),
  ]
  const mergedQa = preflightBlockers.length
    ? {
        ...qa,
        status: 'blocked' as const,
        blockers: Array.from(new Set([...qa.blockers, ...preflightBlockers])),
      }
    : qa
  const readinessManifest = buildTrackAVisualReadinessManifest({ runId, evidenceChain, qa: mergedQa })
  const evidenceChainPayload = {
    phase: '45F',
    track: trackAVisualReadinessConfig.track,
    runId,
    evidenceChain,
    priorEvidenceObjectValidation: priorEvidenceObjects,
  }
  const artifacts: TrackAVisualReadinessArtifact[] = []
  const readinessManifestArtifact = await uploadJson(trackAVisualReadinessConfig.generatedAssetsBucket, `${artifactPrefix}/readiness/track-a-readiness-manifest.json`, readinessManifest, localRoot, 'track_a_readiness_manifest')
  artifacts.push(readinessManifestArtifact)
  const evidenceChainArtifact = await uploadJson(trackAVisualReadinessConfig.generatedAssetsBucket, `${artifactPrefix}/evidence/evidence-chain.json`, evidenceChainPayload, localRoot, 'evidence_chain')
  artifacts.push(evidenceChainArtifact)
  const artifactValidationArtifact = await uploadJson(trackAVisualReadinessConfig.generatedAssetsBucket, `${artifactPrefix}/evidence/private-e2e-artifact-validation.json`, privateE2EArtifactValidation, localRoot, 'private_e2e_artifact_validation')
  artifacts.push(artifactValidationArtifact)

  const qaWithArtifacts = buildTrackAVisualReadinessClosureQaSummary({
    evidenceChain,
    privateE2EArtifactValidation,
    artifacts,
    scriptsValid,
    docsValid,
    publicAccessBlocked: preflight.publicAccessBlocked && priorEvidenceObjects.missing.length === 0 && preflight.blockers.length === 0,
  })
  const finalQa = preflightBlockers.length
    ? {
        ...qaWithArtifacts,
        status: 'blocked' as const,
        blockers: Array.from(new Set([...qaWithArtifacts.blockers, ...preflightBlockers])),
      }
    : qaWithArtifacts
  artifacts.push(await uploadJson(trackAVisualReadinessConfig.qaBucket, `${artifactPrefix}/qa/track-a-visual-readiness-qa.json`, finalQa, localRoot, 'track_a_visual_readiness_qa'))

  const executionReport: TrackAVisualReadinessExecutionReport = {
    ok: finalQa.status === 'passed',
    phase: '45F',
    runId,
    projectId: trackAVisualReadinessConfig.projectId,
    runtimeMode: trackAVisualReadinessConfig.runtimeMode,
    evidenceChain,
    privateE2EArtifactValidation,
    readinessManifestGcsUri: readinessManifestArtifact.gcsUri,
    artifacts,
    qa: finalQa,
    trackAInternalReadiness: {
      readyForInternalPrivateVisualVideoTesting: finalQa.status === 'passed',
      reason: finalQa.status === 'passed'
        ? 'Phase 45F passed; Track A visual-video is ready for internal private visual-video testing only.'
        : `Phase 45F blocked: ${finalQa.blockers.join('; ')}`,
    },
    remainingTrackABlockers: finalQa.status === 'passed'
      ? ['No internal Track A readiness blockers remain; final delivery, production, external beta, paid production, broad real media, providers, Revideo, and Track B remain blocked.']
      : finalQa.blockers,
    safety: {
      newMediaProcessed: false,
      renderCreated: false,
      finalDeliveryCreated: false,
      providerExecuted: false,
      revideoUsed: false,
      trackBToolsUsed: false,
      publicAccessEnabled: false,
      productionReadyAllowed: false,
      externalBetaAllowed: false,
      paidProductionAllowed: false,
      broadRealUserMediaAllowed: false,
    },
    blockers: finalQa.blockers,
    warnings: Array.from(new Set([...finalQa.warnings, ...preflight.warnings])),
  }
  artifacts.push(await uploadJson(trackAVisualReadinessConfig.qaBucket, `${artifactPrefix}/reports/phase45f-report.json`, executionReport, localRoot, 'phase45f_report'))
  executionReport.artifacts = artifacts

  const localReportPath = path.join(process.cwd(), TRACK_A_VISUAL_READINESS_LOCAL_REPORT_PATH)
  await mkdir(path.dirname(localReportPath), { recursive: true })
  await writeFile(localReportPath, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')

  const evidence: ApprovedTrackAVisualReadinessClosureEvidence = {
    phase: '45F',
    status: executionReport.ok && finalQa.status === 'passed' ? 'verified' : 'blocked',
    runId,
    readinessManifestUri: readinessManifestArtifact.gcsUri,
    evidenceChainUri: evidenceChainArtifact.gcsUri,
    privateE2EArtifactValidationUri: artifactValidationArtifact.gcsUri,
    qaReportUri: `gs://${trackAVisualReadinessConfig.qaBucket}/${artifactPrefix}/reports/phase45f-report.json`,
    trackAInternalReadiness: executionReport.trackAInternalReadiness,
    remainingTrackABlockers: executionReport.remainingTrackABlockers,
    blockers: finalQa.blockers,
    warnings: executionReport.warnings,
  }

  return {
    evidence,
    executionReport,
    localReportPath,
    iamChanges: ['not_required: active account uploads used existing private GCS permissions'],
    evidenceModule: trackAVisualReadinessClosureEvidenceToTypeScript(evidence),
  }
}

export async function runTrackAVisualReadinessClosurePreflight() {
  const blockers: string[] = []
  const warnings: string[] = []
  let activeProjectValue = ''
  let activeAccountValue = ''
  let publicAccessBlocked = false
  try {
    const [activeAccount, activeProject, projectDescribe, generatedAssetsBucket, qaBucket, finalExportsBucket, previewsBucket, masksBucket] = await Promise.all([
      runGcloud(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
      runGcloud(['config', 'get-value', 'project']),
      runGcloud(['projects', 'describe', trackAVisualReadinessConfig.projectId, '--format=value(projectId)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${trackAVisualReadinessConfig.generatedAssetsBucket}`, '--format=value(name)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${trackAVisualReadinessConfig.qaBucket}`, '--format=value(name)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${trackAVisualReadinessConfig.finalExportsBucket}`, '--format=value(name)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${trackAVisualReadinessConfig.previewsBucket}`, '--format=value(name)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${trackAVisualReadinessConfig.masksBucket}`, '--format=value(name)']),
    ])
    activeAccountValue = lastGcloudValue(activeAccount)
    activeProjectValue = lastGcloudValue(activeProject)
    if (!activeAccountValue) blockers.push('No active gcloud account is visible.')
    if (activeProjectValue !== trackAVisualReadinessConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
    if (lastGcloudValue(projectDescribe) !== trackAVisualReadinessConfig.projectId) blockers.push('gcloud cannot describe project reeditpro.')
    if (lastGcloudValue(generatedAssetsBucket) !== trackAVisualReadinessConfig.generatedAssetsBucket) blockers.push('Generated-assets bucket is not reachable.')
    if (lastGcloudValue(qaBucket) !== trackAVisualReadinessConfig.qaBucket) blockers.push('QA bucket is not reachable.')
    if (lastGcloudValue(finalExportsBucket) !== trackAVisualReadinessConfig.finalExportsBucket) blockers.push('Final-exports bucket is not reachable.')
    if (lastGcloudValue(previewsBucket) !== trackAVisualReadinessConfig.previewsBucket) blockers.push('Previews bucket is not reachable.')
    if (lastGcloudValue(masksBucket) !== trackAVisualReadinessConfig.masksBucket) blockers.push('Masks bucket is not reachable.')
    await assertNoPublicBucketPrincipals([
      trackAVisualReadinessConfig.generatedAssetsBucket,
      trackAVisualReadinessConfig.qaBucket,
      trackAVisualReadinessConfig.finalExportsBucket,
      trackAVisualReadinessConfig.previewsBucket,
      trackAVisualReadinessConfig.masksBucket,
    ], blockers)
    publicAccessBlocked = !blockers.some((blocker) => blocker.includes('public IAM principal'))
  } catch (error) {
    blockers.push(error instanceof Error ? error.message : String(error))
  }

  const validation = validateTrackAVisualReadinessExecutionEnv({
    projectId: process.env.GCP_PROJECT_ID,
    activeProject: activeProjectValue,
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    confirmation: process.env.REEDITPRO_CONFIRM_TRACK_A_VISUAL_READINESS_CLOSURE,
    runtimeMode: process.env.REEDITPRO_TRACK_A_VISUAL_READINESS_RUNTIME_MODE ?? trackAVisualReadinessConfig.runtimeMode,
    providerExecutionEnabled: process.env.PROVIDER_EXECUTION_ENABLED ?? 'false',
    revideoEnabled: process.env.REVIDEO_ENABLED ?? 'false',
    trackBEnabled: process.env.TRACK_B_TOOLS_ENABLED ?? 'false',
    publicAccessEnabled: process.env.PUBLIC_ACCESS_ENABLED ?? 'false',
    finalDeliveryEnabled: process.env.FINAL_DELIVERY_ENABLED ?? 'false',
    productionReady: process.env.REEDITPRO_PRODUCTION_READY ?? 'false',
    externalBetaReady: process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false',
    paidProductionReady: process.env.REEDITPRO_PAID_PRODUCTION_READY ?? 'false',
    broadRealMediaReady: process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false',
  })

  return {
    allowed: blockers.length === 0 && validation.allowed,
    blockers: [...validation.blockers, ...blockers],
    warnings: [...validation.warnings, ...warnings],
    activeAccount: activeAccountValue,
    activeProject: activeProjectValue,
    publicAccessBlocked,
  }
}

async function validatePriorEvidenceObjects(evidenceChain: ReturnType<typeof buildTrackAVisualEvidenceChain>) {
  const objects = Array.from(new Set(evidenceChain.flatMap((item) => item.artifactUris).filter((uri) => uri.startsWith('gs://') && !uri.endsWith('/'))))
  const results = await Promise.all(objects.map(async (uri) => ({ uri, result: await tryDescribeGcsObject(uri) })))
  return {
    checked: results.map((item) => ({
      uri: item.uri,
      exists: Boolean(item.result.metadata.name),
      sizeBytes: sizeBytes(item.result.metadata),
      error: item.result.error,
    })),
    missing: results.filter((item) => !item.result.metadata.name).map((item) => item.uri),
  }
}

async function uploadJson(bucket: string, object: string, payload: unknown, root: string, kind: string): Promise<TrackAVisualReadinessArtifact> {
  const filePath = path.join(root, `${kind}.json`)
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  const stats = await stat(filePath)
  const sha256 = await sha256File(filePath)
  await runCommand('gcloud', ['storage', 'cp', filePath, `gs://${bucket}/${object}`])
  return {
    id: path.basename(object).replace(/[^a-zA-Z0-9_-]/g, '_'),
    kind,
    bucket,
    object,
    gcsUri: `gs://${bucket}/${object}`,
    sizeBytes: stats.size,
    sha256,
  }
}

async function tryDescribeGcsObject(uri: string): Promise<{ metadata: GcsObjectMetadata; error?: string }> {
  try {
    const metadata = parseGcloudJson(await runGcloud(['storage', 'objects', 'describe', uri, '--format=json'])) as GcsObjectMetadata
    return { metadata }
  } catch (error) {
    return { metadata: {}, error: error instanceof Error ? error.message : String(error) }
  }
}

async function assertNoPublicBucketPrincipals(buckets: string[], blockers: string[]) {
  for (const bucket of buckets) {
    const policy = await runGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${bucket}`, '--format=json'])
    if (policy.includes('allUsers') || policy.includes('allAuthenticatedUsers')) blockers.push(`Bucket ${bucket} has a public IAM principal.`)
  }
}

function requiredScriptsPresent(): boolean {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
  const scripts = packageJson.scripts ?? {}
  return trackAVisualReadinessRequiredScripts.every((script) => Boolean(scripts[script]))
}

function requiredDocsPresent(): boolean {
  return trackAVisualReadinessRequiredDocs.every((doc) => existsSync(doc))
}

async function runGcloud(args: string[]): Promise<string> {
  const result = await execFileAsync('gcloud', args, { maxBuffer: 20 * 1024 * 1024 })
  return result.stdout ?? ''
}

async function runCommand(command: string, args: string[], timeout = 10 * 60 * 1000): Promise<string> {
  const result = await execFileAsync(command, args, { timeout, maxBuffer: 128 * 1024 * 1024 })
  return `${result.stdout ?? ''}${result.stderr ?? ''}`
}

async function sha256File(filePath: string): Promise<string> {
  const hash = createHash('sha256')
  hash.update(readFileSync(filePath))
  return hash.digest('hex')
}

function sizeBytes(metadata: GcsObjectMetadata): number {
  const value = typeof metadata.size === 'number' ? metadata.size : Number(metadata.size ?? 0)
  return Number.isFinite(value) ? value : 0
}

function lastGcloudValue(output: string): string {
  const lines = output.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('WARNING:') && !line.includes('Python 3.9.x'))
  return lines.at(-1) ?? ''
}

function parseGcloudJson(output: string): unknown {
  const objectStart = output.indexOf('{')
  const arrayStart = output.indexOf('[')
  const start = [objectStart, arrayStart].filter((index) => index >= 0).sort((a, b) => a - b)[0]
  if (start === undefined) throw new Error(`gcloud output did not include JSON: ${output.slice(0, 160)}`)
  return JSON.parse(output.slice(start))
}
