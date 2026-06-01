import { execFile } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import type { DeepFilterNetFeatureE2EExecutionReport } from '../deepfilternet-feature-e2e'
import { buildAudioSystemBetaScopeManifest, audioSystemBetaScopeManifestUri } from './audio-system-beta-scope'
import { buildAudioSystemEvidenceChain } from './audio-system-evidence-resolver'
import { requiredPhase36EArtifactIds } from './audio-system-artifact-verifier'
import { buildAudioSystemReadinessQaSummary } from './audio-system-qa-summary'
import {
  audioSystemReadinessConfig,
  audioSystemReadinessPrefix,
  validateAudioSystemReadinessExecutionEnv,
} from './audio-system-readiness-policy'
import type {
  ApprovedAudioSystemReadinessEvidence,
  AudioSystemArtifactVerification,
  AudioSystemReadinessExecutionReport,
} from './audio-system-readiness-types'

const execFileAsync = promisify(execFile)

export async function runAudioSystemReadiness(input: {
  execute: boolean
  runId?: string
}): Promise<{
  evidence: ApprovedAudioSystemReadinessEvidence
  executionReport: AudioSystemReadinessExecutionReport
  localReportPath: string
  localBetaScopePath: string
}> {
  if (!input.execute) throw new Error('Pass --execute to run the Phase 36F audio system readiness verification.')
  const runId = input.runId ?? `phase36f-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 15)}`
  const prefix = audioSystemReadinessPrefix(runId)
  const preflight = await runAudioSystemReadinessPreflight()
  if (!preflight.allowed) throw new Error(`Audio system readiness preflight blocked:\n- ${preflight.blockers.join('\n- ')}`)

  const tempDir = path.join(os.tmpdir(), `reeditpro-audio-system-readiness-${runId}`)
  await mkdir(tempDir, { recursive: true })
  const phase36EReportPath = path.join(tempDir, 'phase36e-report.json')
  await runCommand('gcloud', ['storage', 'cp', audioSystemReadinessConfig.phase36EReportUri, phase36EReportPath], 5 * 60 * 1000, gcloudCopyEnv())
  const phase36EReport = JSON.parse(await readFile(phase36EReportPath, 'utf8')) as DeepFilterNetFeatureE2EExecutionReport

  const artifactVerification = await verifyPhase36EArtifacts(phase36EReport, preflight.publicBuckets)
  const evidenceChain = buildAudioSystemEvidenceChain()
  const betaScopeUri = audioSystemBetaScopeManifestUri(runId)
  const betaScope = buildAudioSystemBetaScopeManifest({
    runId,
    phase36EArtifacts: artifactVerification.map((artifact) => artifact.gcsUri),
    ready: false,
  })
  const localBetaScopePath = path.join(tempDir, 'audio-system-beta-scope.json')
  await writeFile(localBetaScopePath, `${JSON.stringify(betaScope, null, 2)}\n`, 'utf8')
  await runCommand('gcloud', ['storage', 'cp', localBetaScopePath, betaScopeUri], 5 * 60 * 1000, gcloudCopyEnv())

  const qa = buildAudioSystemReadinessQaSummary({
    evidenceChain,
    artifactVerification,
    phase36EReport,
    betaScopeExists: true,
    publicAccessDetected: preflight.publicBuckets.size > 0,
  })
  const ready = qa.blockers.length === 0
  const finalBetaScope = buildAudioSystemBetaScopeManifest({
    runId,
    phase36EArtifacts: artifactVerification.map((artifact) => artifact.gcsUri),
    ready,
  })
  await writeFile(localBetaScopePath, `${JSON.stringify(finalBetaScope, null, 2)}\n`, 'utf8')
  await runCommand('gcloud', ['storage', 'cp', localBetaScopePath, betaScopeUri], 5 * 60 * 1000, gcloudCopyEnv())

  const reportUri = `gs://${audioSystemReadinessConfig.qaBucket}/${prefix}/reports/phase36f-report.json`
  const reportObject = `${prefix}/reports/phase36f-report.json`
  const executionReport: AudioSystemReadinessExecutionReport = {
    ok: ready,
    phase: '36F',
    runId,
    createdAt: new Date().toISOString(),
    projectId: audioSystemReadinessConfig.projectId,
    evidenceChain,
    phase36EReportUri: audioSystemReadinessConfig.phase36EReportUri,
    phase36EArtifactVerification: artifactVerification,
    audioBetaScopeManifestUri: betaScopeUri,
    betaScope: finalBetaScope,
    qa,
    rollbackFallbackPlan: rollbackFallbackPlan(),
    operationalNotes: operationalNotes(phase36EReport),
    readiness: {
      audioSystemInternalFeatureTestingReady: ready,
      reason: ready
        ? 'Phase 36F verified Phase 31 and Phase 36A-36E evidence plus private Phase 36E artifacts; internal audio feature testing may begin for the approved scope only.'
        : 'Phase 36F readiness remains blocked because one or more mandatory gates failed.',
    },
    phase37AReadiness: {
      readyForOcrApprovalWorkflow: ready,
      reason: ready
        ? 'Audio system internal readiness is closed; Phase 37A OCR approval workflow may start.'
        : 'Phase 37A remains blocked until Phase 36F audio system readiness passes.',
    },
    safety: {
      productionReadyAllowed: false,
      externalBetaAllowed: false,
      paidProductionAllowed: false,
      broadRealUserMediaAllowed: false,
      arbitraryRealUserMediaAllowed: false,
      rnnoiseAllowed: false,
      demucsAllowed: false,
      providerAllowed: false,
      revideoAllowed: false,
      filmAllowed: false,
      slowMotionAllowed: false,
    },
    uploadedReport: {
      bucket: audioSystemReadinessConfig.qaBucket,
      object: reportObject,
      gcsUri: reportUri,
    },
  }
  const localReportPath = path.join(tempDir, 'phase36f-report.json')
  await writeFile(localReportPath, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')
  await runCommand('gcloud', ['storage', 'cp', localReportPath, reportUri], 5 * 60 * 1000, gcloudCopyEnv())

  const evidence: ApprovedAudioSystemReadinessEvidence = {
    phase: '36F',
    status: ready ? 'completed' : 'blocked',
    runId,
    phase36ERunId: audioSystemReadinessConfig.phase36ERunId,
    phase36EReportUri: audioSystemReadinessConfig.phase36EReportUri,
    betaScopeManifestUri: betaScopeUri,
    qaReportUri: reportUri,
    audioSystemInternalFeatureTestingReady: ready,
    phase37AReadiness: {
      readyForOcrApprovalWorkflow: ready,
      reason: ready
        ? 'Phase 36F verified the audio system internal testing scope; Phase 37A OCR approval workflow may start.'
        : 'Phase 37A remains blocked until Phase 36F readiness blockers are resolved.',
    },
    blockers: qa.blockers,
    warnings: qa.warnings,
  }

  return { evidence, executionReport, localReportPath, localBetaScopePath }
}

export async function runAudioSystemReadinessPreflight(): Promise<{
  allowed: boolean
  blockers: string[]
  warnings: string[]
  publicBuckets: Set<string>
}> {
  const checks = await Promise.all([
    runGcloud(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
    runGcloud(['config', 'get-value', 'project']),
    runGcloud(['projects', 'describe', audioSystemReadinessConfig.projectId, '--format=value(projectId)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${audioSystemReadinessConfig.finalExportsBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${audioSystemReadinessConfig.generatedAssetsBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${audioSystemReadinessConfig.analysisBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${audioSystemReadinessConfig.qaBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${audioSystemReadinessConfig.workerTempBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'objects', 'describe', audioSystemReadinessConfig.approvedInputVideo, '--format=value(size)']),
    runGcloud(['storage', 'objects', 'describe', audioSystemReadinessConfig.referencePhase31Audio, '--format=value(size)']),
    runGcloud(['storage', 'objects', 'describe', audioSystemReadinessConfig.phase36EReportUri, '--format=value(size)']),
    runGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${audioSystemReadinessConfig.finalExportsBucket}`, '--format=json']),
    runGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${audioSystemReadinessConfig.generatedAssetsBucket}`, '--format=json']),
    runGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${audioSystemReadinessConfig.analysisBucket}`, '--format=json']),
    runGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${audioSystemReadinessConfig.qaBucket}`, '--format=json']),
    runGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${audioSystemReadinessConfig.workerTempBucket}`, '--format=json']),
  ])
  const [
    activeAccount,
    activeProject,
    projectDescribe,
    finalExportsBucket,
    generatedBucket,
    analysisBucket,
    qaBucket,
    tempBucket,
    sourceObject,
    referenceObject,
    phase36EReportObject,
    finalExportsIam,
    generatedIam,
    analysisIam,
    qaIam,
    tempIam,
  ] = checks
  const blockers: string[] = []
  const warnings: string[] = []
  const activeProjectValue = lastGcloudValue(activeProject)
  if (!lastGcloudValue(activeAccount)) blockers.push('No active gcloud account is visible.')
  if (activeProjectValue !== audioSystemReadinessConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (lastGcloudValue(projectDescribe) !== audioSystemReadinessConfig.projectId) blockers.push('gcloud cannot describe project reeditpro.')
  if (lastGcloudValue(finalExportsBucket) !== audioSystemReadinessConfig.finalExportsBucket) blockers.push('Final-exports bucket is not reachable.')
  if (lastGcloudValue(generatedBucket) !== audioSystemReadinessConfig.generatedAssetsBucket) blockers.push('Generated-assets bucket is not reachable.')
  if (lastGcloudValue(analysisBucket) !== audioSystemReadinessConfig.analysisBucket) blockers.push('Analysis bucket is not reachable.')
  if (lastGcloudValue(qaBucket) !== audioSystemReadinessConfig.qaBucket) blockers.push('QA bucket is not reachable.')
  if (lastGcloudValue(tempBucket) !== audioSystemReadinessConfig.workerTempBucket) blockers.push('Worker-temp bucket is not reachable.')
  if (Number(lastGcloudValue(sourceObject)) <= 0) blockers.push('Approved Phase 32 source video object is missing or empty.')
  if (Number(lastGcloudValue(referenceObject)) <= 0) blockers.push('Approved Phase 31 reference object is missing or empty.')
  if (Number(lastGcloudValue(phase36EReportObject)) <= 0) blockers.push('Approved Phase 36E report object is missing or empty.')

  const publicBuckets = new Set<string>()
  for (const [bucket, policy] of [
    [audioSystemReadinessConfig.finalExportsBucket, finalExportsIam],
    [audioSystemReadinessConfig.generatedAssetsBucket, generatedIam],
    [audioSystemReadinessConfig.analysisBucket, analysisIam],
    [audioSystemReadinessConfig.qaBucket, qaIam],
    [audioSystemReadinessConfig.workerTempBucket, tempIam],
  ] as const) {
    if (/allUsers|allAuthenticatedUsers/.test(policy)) publicBuckets.add(bucket)
  }
  if (publicBuckets.size > 0) blockers.push(`Public principal detected on required buckets: ${Array.from(publicBuckets).join(', ')}`)

  const validation = validateAudioSystemReadinessExecutionEnv({
    projectId: process.env.GCP_PROJECT_ID,
    activeProject: activeProjectValue,
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    confirmation: process.env.REEDITPRO_CONFIRM_AUDIO_SYSTEM_INTERNAL_BETA_READINESS,
    approvedInputVideo: audioSystemReadinessConfig.approvedInputVideo,
    phase36ERunId: audioSystemReadinessConfig.phase36ERunId,
    providerExecutionEnabled: process.env.PROVIDER_EXECUTION_ENABLED ?? 'false',
    publicAccessEnabled: process.env.PUBLIC_ACCESS_ENABLED ?? 'false',
    rnnoiseEnabled: process.env.RNNOISE_ENABLED ?? 'false',
    demucsEnabled: process.env.DEMUCS_ENABLED ?? 'false',
    productionReady: process.env.REEDITPRO_PRODUCTION_READY ?? 'false',
    externalBetaReady: process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false',
    paidProductionReady: process.env.REEDITPRO_PAID_PRODUCTION_READY ?? 'false',
    broadRealMediaReady: process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false',
  })
  blockers.push(...validation.blockers)
  warnings.push(...validation.warnings)
  return { allowed: blockers.length === 0, blockers, warnings, publicBuckets }
}

async function verifyPhase36EArtifacts(
  report: DeepFilterNetFeatureE2EExecutionReport,
  publicBuckets: Set<string>,
): Promise<AudioSystemArtifactVerification[]> {
  const byId = new Map(report.artifacts.map((artifact) => [artifact.id, artifact]))
  const results: AudioSystemArtifactVerification[] = []
  for (const artifactId of requiredPhase36EArtifactIds) {
    const artifact = byId.get(artifactId)
    if (!artifact) {
      results.push({
        artifactId,
        gcsUri: '(missing from Phase 36E report)',
        required: true,
        exists: false,
        private: false,
        blocker: `Required Phase 36E artifact ${artifactId} is missing from the report.`,
      })
      continue
    }
    const described = await describeGcsObject(artifact.gcsUri)
    const sizeBytes = described.sizeBytes ?? artifact.sizeBytes
    results.push({
      artifactId,
      gcsUri: artifact.gcsUri,
      required: true,
      exists: described.exists,
      private: !publicBuckets.has(artifact.bucket) && !artifact.gcsUri.startsWith('http'),
      sizeBytes,
      blocker: described.exists && Number(sizeBytes ?? 0) > 0
        ? undefined
        : `Required Phase 36E artifact ${artifactId} is missing or empty at ${artifact.gcsUri}.`,
    })
  }
  return results
}

async function describeGcsObject(gcsUri: string): Promise<{ exists: boolean; sizeBytes?: number }> {
  const result = await runCommand('gcloud', ['storage', 'objects', 'describe', gcsUri, '--format=json'], 5 * 60 * 1000, undefined, true)
  if (!result.ok) return { exists: false }
  try {
    const parsed = JSON.parse(result.stdout) as { size?: string | number }
    return { exists: true, sizeBytes: Number(parsed.size ?? 0) }
  } catch {
    return { exists: true }
  }
}

function rollbackFallbackPlan(): string[] {
  return [
    'If DeepFilterNet fails during internal testing, block AI audio cleanup for that job.',
    'Fall back only to FFmpeg loudness-only normalization when the approved source and plan snapshot allow it.',
    'Keep source audio immutable and preserve original/intermediate artifacts.',
    'Produce a private error and QA report instead of public output.',
    'Do not auto-run RNNoise, Demucs, providers, Revideo, FILM, or slow motion.',
  ]
}

function operationalNotes(report: DeepFilterNetFeatureE2EExecutionReport): string[] {
  return [
    `Phase 36E runtime job: ${report.jobName}`,
    `Phase 36E runtime image: ${report.image?.image ?? audioSystemReadinessConfig.phase36ERuntimeImage}`,
    'Expected failure modes: missing private artifact, checksum mismatch, FFmpeg decode failure, DeepFilterNet runtime failure, review remux failure, or QA blocker.',
    'Artifact retention and cleanup remain governed by private staging GCS lifecycle policies; Phase 36F does not create public delivery artifacts.',
    'Runtime cost remains bounded by existing short controlled-chain audio runs and does not authorize broad media.',
  ]
}

async function runGcloud(args: string[]): Promise<string> {
  const result = await runCommand('gcloud', args, 5 * 60 * 1000, undefined, true)
  return result.ok ? result.stdout : ''
}

async function runCommand(
  command: string,
  args: string[],
  timeout = 10 * 60 * 1000,
  extraEnv?: NodeJS.ProcessEnv,
  allowFailure = false,
): Promise<{ ok: boolean; stdout: string; stderr: string }> {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      timeout,
      maxBuffer: 64 * 1024 * 1024,
      env: { ...process.env, ...extraEnv },
    })
    return { ok: true, stdout, stderr }
  } catch (error) {
    if (allowFailure) {
      const maybe = error as { stdout?: string; stderr?: string }
      return { ok: false, stdout: maybe.stdout ?? '', stderr: maybe.stderr ?? String(error) }
    }
    throw error
  }
}

function lastGcloudValue(output: string): string {
  return output.trim().split(/\r?\n/).map((line) => line.trim()).filter(Boolean).at(-1) ?? ''
}

function gcloudCopyEnv(): NodeJS.ProcessEnv {
  return {
    CLOUDSDK_STORAGE_SLICED_OBJECT_DOWNLOAD_THRESHOLD: '0',
    CLOUDSDK_STORAGE_CHECK_HASHES: 'never',
  }
}
