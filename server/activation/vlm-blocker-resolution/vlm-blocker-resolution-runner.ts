import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { mkdir, rm, stat, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { resolvePhase47AEvidence, resolveVlmBlockerEvidence } from './vlm-blocker-evidence-resolver'
import { buildVlmExclusionPolicy } from './vlm-exclusion-policy'
import {
  makeVlmBlockerResolutionRunId,
  validateVlmBlockerResolutionExecutionEnv,
  vlmBlockerResolutionArtifactPrefix,
  vlmBlockerResolutionConfig,
} from './vlm-blocker-resolution-policy'
import { buildVlmBlockerResolutionQaSummary } from './vlm-blocker-qa-summary'
import { VLM_BLOCKER_RESOLUTION_LOCAL_REPORT_PATH, vlmBlockerResolutionEvidenceToTypeScript } from './vlm-blocker-report-builder'
import { buildVlmRuntimeDecision } from './vlm-runtime-decision'
import { buildVlmSystemReadinessImpact } from './vlm-system-readiness-impact'
import type {
  ApprovedVlmBlockerResolutionEvidence,
  VlmBlockerResolutionArtifact,
  VlmBlockerResolutionExecutionReport,
} from './vlm-blocker-resolution-types'

const execFileAsync = promisify(execFile)

interface GcsObjectMetadata {
  name?: string
  bucket?: string
  size?: string | number
}

export async function runVlmBlockerResolution(input: { execute: boolean; runId?: string }) {
  if (!input.execute) throw new Error('Pass --execute to run Phase 47B VLM blocker resolution.')
  const runId = input.runId ?? process.env.REEDITPRO_PHASE47B_RUN_ID ?? makeVlmBlockerResolutionRunId()
  const artifactPrefix = vlmBlockerResolutionArtifactPrefix(runId)
  const localRoot = path.join(os.tmpdir(), `reeditpro-vlm-blocker-resolution-${runId}`)
  await rm(localRoot, { recursive: true, force: true })
  await mkdir(localRoot, { recursive: true })

  const preflight = await runVlmBlockerResolutionPreflight()
  const phase47a = resolvePhase47AEvidence()
  const blockerEvidence = resolveVlmBlockerEvidence()
  const decision = buildVlmRuntimeDecision()
  const exclusionPolicy = buildVlmExclusionPolicy(blockerEvidence)
  const systemReadinessImpact = buildVlmSystemReadinessImpact(exclusionPolicy)
  const qa = buildVlmBlockerResolutionQaSummary({
    phase47aEvidencePassed: phase47a.blockers.length === 0,
    blockerEvidence,
    runtimeDecision: decision,
    exclusionPolicy,
    systemReadinessImpact,
    publicAccessBlocked: preflight.publicAccessBlocked && preflight.blockers.length === 0,
    productionBetaGatesBlocked: productionBetaGatesBlocked(),
    preflightBlockers: preflight.blockers,
    preflightWarnings: preflight.warnings,
  })

  const artifacts: VlmBlockerResolutionArtifact[] = []
  const blockerArtifact = await uploadJson(
    vlmBlockerResolutionConfig.generatedAssetsBucket,
    `${artifactPrefix}/evidence/vlm-blocker-evidence.json`,
    blockerEvidence,
    localRoot,
    'vlm_blocker_evidence',
  )
  artifacts.push(blockerArtifact)
  const exclusionArtifact = await uploadJson(
    vlmBlockerResolutionConfig.generatedAssetsBucket,
    `${artifactPrefix}/exclusion/vlm-exclusion-manifest.json`,
    exclusionPolicy,
    localRoot,
    'vlm_exclusion_manifest',
  )
  artifacts.push(exclusionArtifact)
  const readinessArtifact = await uploadJson(
    vlmBlockerResolutionConfig.generatedAssetsBucket,
    `${artifactPrefix}/readiness/system-readiness-impact.json`,
    systemReadinessImpact,
    localRoot,
    'system_readiness_impact',
  )
  artifacts.push(readinessArtifact)
  const qaArtifact = await uploadJson(
    vlmBlockerResolutionConfig.qaBucket,
    `${artifactPrefix}/qa/vlm-blocker-resolution-qa.json`,
    qa,
    localRoot,
    'vlm_blocker_resolution_qa',
  )
  artifacts.push(qaArtifact)

  const executionReport: VlmBlockerResolutionExecutionReport = {
    ok: qa.status === 'passed',
    phase: '47B',
    runId,
    projectId: vlmBlockerResolutionConfig.projectId,
    runtimeMode: vlmBlockerResolutionConfig.runtimeMode,
    phase47aEvidenceStatus: phase47a.blockers.length === 0 ? 'verified' : 'blocked',
    decision,
    blockerEvidence,
    exclusionPolicy,
    systemReadinessImpact,
    artifacts,
    qa,
    safety: {
      mediaProcessed: false,
      providerExecuted: false,
      dockerBuiltOrPushed: false,
      cloudRunDeployedOrExecuted: false,
      modelDownloaded: false,
      publicAccessEnabled: false,
      productionReadyAllowed: false,
      externalBetaAllowed: false,
      paidProductionAllowed: false,
      broadRealUserMediaAllowed: false,
      finalDeliveryAllowed: false,
      revideoUsed: false,
    },
    blockers: qa.blockers,
    warnings: qa.warnings,
  }
  const reportArtifact = await uploadJson(
    vlmBlockerResolutionConfig.qaBucket,
    `${artifactPrefix}/reports/phase47b-report.json`,
    executionReport,
    localRoot,
    'phase47b_report',
  )
  executionReport.artifacts = [...artifacts, reportArtifact]

  const localReportPath = path.join(process.cwd(), VLM_BLOCKER_RESOLUTION_LOCAL_REPORT_PATH)
  await mkdir(path.dirname(localReportPath), { recursive: true })
  await writeFile(localReportPath, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')

  const evidence: ApprovedVlmBlockerResolutionEvidence = {
    phase: '47B',
    status: executionReport.ok ? 'completed' : 'blocked',
    runId,
    decision: decision.decision,
    blockerEvidenceUri: blockerArtifact.gcsUri,
    exclusionManifestUri: exclusionArtifact.gcsUri,
    systemReadinessImpactUri: readinessArtifact.gcsUri,
    qaReportUri: qaArtifact.gcsUri,
    phase47bReportUri: reportArtifact.gcsUri,
    runtimeFixAttempted: decision.runtimeFixAttempted,
    runtimeFixResult: decision.runtimeFixResult,
    exclusionApplied: exclusionPolicy.vlmIncludedInInitialInternalTesting === false,
    phase47CReadiness: systemReadinessImpact.phase47CReadiness,
    blockers: qa.blockers,
    warnings: executionReport.warnings,
  }

  return {
    evidence,
    executionReport,
    localReportPath,
    iamChanges: ['not_required: Phase 47B used active account private JSON upload permissions only'],
    evidenceModule: vlmBlockerResolutionEvidenceToTypeScript(evidence),
  }
}

export async function runVlmBlockerResolutionPreflight() {
  const blockers: string[] = []
  const warnings: string[] = []
  let activeProjectValue = ''
  let activeAccountValue = ''
  let publicAccessBlocked = false
  try {
    const [activeAccount, activeProject, projectDescribe, generatedAssetsBucket, qaBucket] = await Promise.all([
      runGcloud(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
      runGcloud(['config', 'get-value', 'project']),
      runGcloud(['projects', 'describe', vlmBlockerResolutionConfig.projectId, '--format=value(projectId)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${vlmBlockerResolutionConfig.generatedAssetsBucket}`, '--format=value(name)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${vlmBlockerResolutionConfig.qaBucket}`, '--format=value(name)']),
    ])
    activeAccountValue = lastGcloudValue(activeAccount)
    activeProjectValue = lastGcloudValue(activeProject)
    if (!activeAccountValue) blockers.push('No active gcloud account is visible.')
    if (activeProjectValue !== vlmBlockerResolutionConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
    if (lastGcloudValue(projectDescribe) !== vlmBlockerResolutionConfig.projectId) blockers.push('gcloud cannot describe project reeditpro.')
    if (lastGcloudValue(generatedAssetsBucket) !== vlmBlockerResolutionConfig.generatedAssetsBucket) blockers.push('Generated-assets bucket is not reachable.')
    if (lastGcloudValue(qaBucket) !== vlmBlockerResolutionConfig.qaBucket) blockers.push('QA bucket is not reachable.')
    await assertNoPublicBucketPrincipals([
      vlmBlockerResolutionConfig.generatedAssetsBucket,
      vlmBlockerResolutionConfig.qaBucket,
    ])
    publicAccessBlocked = true
  } catch (error) {
    blockers.push(error instanceof Error ? error.message : String(error))
  }

  for (const uri of [vlmBlockerResolutionConfig.phase47aReportGcsUri, vlmBlockerResolutionConfig.phase39cReportGcsUri]) {
    const described = await tryDescribeGcsObject(uri)
    if (described.error) blockers.push(`Approved evidence object is not reachable: ${uri} (${described.error})`)
    if (described.metadata.name && sizeBytes(described.metadata) <= 0) blockers.push(`Approved evidence object is empty: ${uri}`)
  }

  const envValidation = validateVlmBlockerResolutionExecutionEnv({ activeProject: activeProjectValue })
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

async function uploadJson(bucket: string, object: string, payload: unknown, localRoot: string, id: string): Promise<VlmBlockerResolutionArtifact> {
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
    process.env.MODEL_DOWNLOAD_ENABLED ?? 'false',
    process.env.REEDITPRO_PRODUCTION_READY ?? 'false',
    process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false',
    process.env.REEDITPRO_PAID_PRODUCTION_READY ?? 'false',
    process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false',
  ].every((value) => value === 'false')
}
