import { execFile } from 'node:child_process'
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { buildRealVideoFilmRuntimeEnvVars } from './real-video-film-command-plan'
import { buildRealVideoFilmIamPlan } from './real-video-film-iam-plan'
import { buildRealVideoFilmPlanSnapshot } from './real-video-film-plan-snapshot'
import { realVideoFilmSlowmotionArtifactPrefix, realVideoFilmSlowmotionConfig, realVideoFilmSlowmotionExpectedModelFiles, validateRealVideoFilmSlowmotionExecutionEnv } from './real-video-film-slowmotion-policy'
import type {
  ApprovedRealVideoFilmSlowmotionEvidence,
  RealVideoFilmSlowmotionExecutionReport,
} from './real-video-film-slowmotion-types'

const execFileAsync = promisify(execFile)

export async function runRealVideoFilmSlowmotion(input: {
  execute: boolean
  runId?: string
}): Promise<{
  evidence: ApprovedRealVideoFilmSlowmotionEvidence
  executionReport: RealVideoFilmSlowmotionExecutionReport
  localReportPath: string
  imageDigest: string
  iamChanges: string[]
}> {
  if (!input.execute) throw new Error('Pass --execute to run the Phase 38D real-video FILM slow-motion flow.')
  const runId = input.runId ?? `phase38d-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 14)}`
  const artifactPrefix = realVideoFilmSlowmotionArtifactPrefix(runId)
  const preflight = await runRealVideoFilmSlowmotionPreflight()
  if (!preflight.allowed) throw new Error(`Phase 38D FILM slow-motion preflight blocked:\n- ${preflight.blockers.join('\n- ')}`)

  const iamChanges = await ensureRealVideoFilmIamBindings()
  const planSnapshotGcsUri = await uploadApprovedPlanSnapshot(runId, artifactPrefix)
  await runCommand('npm', ['run', 'build:staging-film-runtime-worker'])
  await deleteAppleDoubleFiles(process.cwd())
  await runCommand('docker', [
    'buildx',
    'build',
    '--platform',
    'linux/amd64',
    '--provenance=false',
    '--sbom=false',
    '-f',
    'docker/prod/film-runtime/Dockerfile',
    '-t',
    realVideoFilmSlowmotionConfig.runtimeTargetImage,
    '--push',
    '.',
  ], 3 * 60 * 60 * 1000)
  const imageInspect = await runCommand('docker', ['buildx', 'imagetools', 'inspect', realVideoFilmSlowmotionConfig.runtimeTargetImage])
  const imageDigest = parseImageDigest(imageInspect)
  const imageRef = `${realVideoFilmSlowmotionConfig.runtimeImageRepository}@${imageDigest}`
  await runCommand('gcloud', [
    'run',
    'jobs',
    'deploy',
    realVideoFilmSlowmotionConfig.runtimeJobName,
    '--project',
    realVideoFilmSlowmotionConfig.projectId,
    '--region',
    realVideoFilmSlowmotionConfig.region,
    '--image',
    imageRef,
    '--service-account',
    realVideoFilmSlowmotionConfig.serviceAccountEmail,
    `--cpu=${realVideoFilmSlowmotionConfig.cpu}`,
    `--memory=${realVideoFilmSlowmotionConfig.memory}`,
    '--parallelism=1',
    '--max-retries=0',
    '--set-env-vars',
    buildRealVideoFilmRuntimeEnvVars(runId, imageRef, imageDigest, planSnapshotGcsUri),
  ], 15 * 60 * 1000)
  const executionOutput = await runCommand('gcloud', [
    'run',
    'jobs',
    'execute',
    realVideoFilmSlowmotionConfig.runtimeJobName,
    '--region',
    realVideoFilmSlowmotionConfig.region,
    '--project',
    realVideoFilmSlowmotionConfig.projectId,
    '--wait',
  ], 90 * 60 * 1000)
  const executionId = parseExecutionId(executionOutput)
  const localReportPath = path.join(os.tmpdir(), `reeditpro-real-video-film-${runId}`, 'phase38d-report.json')
  await mkdir(path.dirname(localReportPath), { recursive: true })
  const reportUri = `gs://${realVideoFilmSlowmotionConfig.qaBucket}/${artifactPrefix}/reports/phase38d-report.json`
  await runCommand('gcloud', ['storage', 'cp', reportUri, localReportPath])
  const executionReport = JSON.parse(await readFile(localReportPath, 'utf8')) as RealVideoFilmSlowmotionExecutionReport
  executionReport.executionId ??= executionId
  executionReport.image = { image: imageRef, digest: imageDigest }
  await writeFile(localReportPath, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')

  const verified = executionReport.ok && executionReport.qa.status !== 'blocked'
  const evidence: ApprovedRealVideoFilmSlowmotionEvidence = {
    phase: '38D',
    status: verified ? 'verified' : 'blocked',
    runId,
    runtimeImage: imageRef,
    runtimeImageDigest: imageDigest,
    cloudRunJobName: realVideoFilmSlowmotionConfig.runtimeJobName,
    cloudRunExecutionId: executionReport.executionId,
    sourceVideo: realVideoFilmSlowmotionConfig.approvedInputVideoGcsUri,
    selectedSegment: {
      startSeconds: executionReport.segment.startSeconds,
      endSeconds: executionReport.segment.endSeconds,
      durationSeconds: executionReport.segment.durationSeconds,
      sourceFrameCount: executionReport.segment.sourceFrameCount,
      width: executionReport.segment.width,
      height: executionReport.segment.height,
      outputFrameCount: executionReport.interpolation.outputFrameCount,
    },
    artifactPrefix: `gs://${realVideoFilmSlowmotionConfig.generatedAssetsBucket}/${artifactPrefix}/`,
    previewPrefix: `gs://${realVideoFilmSlowmotionConfig.previewsBucket}/${artifactPrefix}/`,
    qaReportUri: reportUri,
    phase38EReadiness: {
      readyForFilmPrivateFeatureE2EReadinessGate: verified,
      reason: verified
        ? 'Phase 38D verified one controlled selected real-video FILM slow-motion sample only; Phase 38E may plan a private FILM feature E2E readiness gate.'
        : 'Phase 38E remains blocked because Phase 38D QA did not pass.',
    },
    blockers: executionReport.qa.blockers,
    warnings: executionReport.warnings,
  }

  return { evidence, executionReport, localReportPath, imageDigest, iamChanges }
}

export async function runRealVideoFilmSlowmotionPreflight() {
  const objectChecks = realVideoFilmSlowmotionExpectedModelFiles.map((relativePath) => runGcloud(['storage', 'objects', 'describe', `${realVideoFilmSlowmotionConfig.artifactGcsPath}${relativePath}`, '--format=value(size)']))
  const [activeAccount, activeProject, projectDescribe, finalBucket, generatedBucket, previewsBucket, qaBucket, tempBucket, sourceVideo, manifest, phase38cReport, serviceAccount, jobDescribe, ...objects] = await Promise.all([
    runGcloud(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
    runGcloud(['config', 'get-value', 'project']),
    runGcloud(['projects', 'describe', 'reeditpro', '--format=value(projectId)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${realVideoFilmSlowmotionConfig.finalExportsBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${realVideoFilmSlowmotionConfig.generatedAssetsBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${realVideoFilmSlowmotionConfig.previewsBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${realVideoFilmSlowmotionConfig.qaBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${realVideoFilmSlowmotionConfig.workerTempBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'objects', 'describe', realVideoFilmSlowmotionConfig.approvedInputVideoGcsUri, '--format=value(size)']),
    runGcloud(['storage', 'objects', 'describe', `${realVideoFilmSlowmotionConfig.artifactGcsPath}model_tree_manifest.json`, '--format=value(size)']),
    runGcloud(['storage', 'objects', 'describe', `gs://${realVideoFilmSlowmotionConfig.qaBucket}/activation-film-runtime/phase38c/${realVideoFilmSlowmotionConfig.approvedPhase38CRunId}/reports/phase38c-report.json`, '--format=value(size)']),
    runGcloud(['iam', 'service-accounts', 'describe', realVideoFilmSlowmotionConfig.serviceAccountEmail, '--project', realVideoFilmSlowmotionConfig.projectId, '--format=value(email)']),
    runGcloud(['run', 'jobs', 'describe', realVideoFilmSlowmotionConfig.runtimeJobName, '--region', realVideoFilmSlowmotionConfig.region, '--project', realVideoFilmSlowmotionConfig.projectId, '--format=value(metadata.name)']),
    ...objectChecks,
  ])
  const blockers: string[] = []
  const activeAccountValue = lastGcloudValue(activeAccount)
  const activeProjectValue = lastGcloudValue(activeProject)
  if (!activeAccountValue) blockers.push('No active gcloud account is visible.')
  if (lastGcloudValue(projectDescribe) !== realVideoFilmSlowmotionConfig.projectId) blockers.push('gcloud cannot describe project reeditpro.')
  if (lastGcloudValue(finalBucket) !== realVideoFilmSlowmotionConfig.finalExportsBucket) blockers.push('Final exports bucket is not reachable.')
  if (lastGcloudValue(generatedBucket) !== realVideoFilmSlowmotionConfig.generatedAssetsBucket) blockers.push('Generated-assets bucket is not reachable.')
  if (lastGcloudValue(previewsBucket) !== realVideoFilmSlowmotionConfig.previewsBucket) blockers.push('Previews bucket is not reachable.')
  if (lastGcloudValue(qaBucket) !== realVideoFilmSlowmotionConfig.qaBucket) blockers.push('QA bucket is not reachable.')
  if (lastGcloudValue(tempBucket) !== realVideoFilmSlowmotionConfig.workerTempBucket) blockers.push('Worker temp bucket is not reachable.')
  if (Number(lastGcloudValue(sourceVideo)) <= 0) blockers.push('Approved Phase 32 source video is missing or empty.')
  if (Number(lastGcloudValue(manifest)) <= 0) blockers.push('Approved FILM model manifest is missing or empty.')
  if (Number(lastGcloudValue(phase38cReport)) <= 0) blockers.push('Approved Phase 38C runtime report is missing or empty.')
  if (lastGcloudValue(serviceAccount) !== realVideoFilmSlowmotionConfig.serviceAccountEmail) blockers.push('CPU worker service account is not reachable.')
  if (lastGcloudValue(jobDescribe) !== realVideoFilmSlowmotionConfig.runtimeJobName) blockers.push('FILM runtime Cloud Run job is not reachable.')
  objects.forEach((object, index) => {
    if (Number(lastGcloudValue(object)) <= 0) blockers.push(`Approved FILM artifact object is missing or empty: ${realVideoFilmSlowmotionExpectedModelFiles[index]}`)
  })

  const validation = validateRealVideoFilmSlowmotionExecutionEnv({
    projectId: process.env.GCP_PROJECT_ID,
    activeProject: activeProjectValue,
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    confirmation: process.env.REEDITPRO_CONFIRM_FILM_REAL_VIDEO_SLOWMOTION,
    runtimeMode: realVideoFilmSlowmotionConfig.runtimeMode,
    inputVideoGcsUri: realVideoFilmSlowmotionConfig.approvedInputVideoGcsUri,
    artifactGcsPath: realVideoFilmSlowmotionConfig.artifactGcsPath,
    kerasMetadataSha256: realVideoFilmSlowmotionConfig.kerasMetadataSha256,
    savedModelSha256: realVideoFilmSlowmotionConfig.savedModelSha256,
    variablesDataSha256: realVideoFilmSlowmotionConfig.variablesDataSha256,
    variablesIndexSha256: realVideoFilmSlowmotionConfig.variablesIndexSha256,
    aggregateSha256: realVideoFilmSlowmotionConfig.aggregateSha256,
    segmentStartSeconds: realVideoFilmSlowmotionConfig.segmentStartSeconds,
    segmentEndSeconds: realVideoFilmSlowmotionConfig.segmentEndSeconds,
    segmentDurationSeconds: realVideoFilmSlowmotionConfig.segmentDurationSeconds,
    sourceFrameCount: realVideoFilmSlowmotionConfig.sourceFrameCount,
    outputFrameCount: realVideoFilmSlowmotionConfig.outputFrameCount,
    frameWidth: realVideoFilmSlowmotionConfig.frameWidth,
    frameHeight: realVideoFilmSlowmotionConfig.frameHeight,
    providerExecutionEnabled: process.env.PROVIDER_EXECUTION_ENABLED ?? 'false',
    publicAccessEnabled: process.env.PUBLIC_ACCESS_ENABLED ?? 'false',
    revideoEnabled: process.env.REVIDEO_ENABLED ?? 'false',
    audioStretchEnabled: process.env.AUDIO_STRETCH_ENABLED ?? 'false',
    fullVideoInterpolationEnabled: process.env.FULL_VIDEO_INTERPOLATION_ENABLED ?? 'false',
    finalDeliveryEnabled: process.env.FINAL_DELIVERY_ENABLED ?? 'false',
    productionReady: process.env.REEDITPRO_PRODUCTION_READY ?? 'false',
    externalBeta: process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false',
    broadRealMedia: process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false',
  })

  return {
    allowed: blockers.length === 0 && validation.allowed,
    blockers: [...validation.blockers, ...blockers],
    warnings: validation.warnings,
    activeAccount: activeAccountValue,
    activeProject: activeProjectValue,
  }
}

async function ensureRealVideoFilmIamBindings(): Promise<string[]> {
  const changes: string[] = []
  for (const plan of buildRealVideoFilmIamPlan()) {
    const policy = await runGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${plan.bucket}`, '--format=json'])
    if (/allUsers|allAuthenticatedUsers/.test(policy)) throw new Error(`Bucket ${plan.bucket} has a public principal in IAM policy.`)
    if (policy.includes(plan.member) && policy.includes(plan.role) && policy.includes(plan.conditionTitle)) {
      changes.push(`existing:${plan.bindingId}`)
      continue
    }
    await runGcloud([
      'storage',
      'buckets',
      'add-iam-policy-binding',
      `gs://${plan.bucket}`,
      `--member=${plan.member}`,
      `--role=${plan.role}`,
      `--condition=title=${plan.conditionTitle},expression=${plan.conditionExpression},description=${plan.description}`,
    ])
    changes.push(`added:${plan.bindingId}`)
  }
  return changes
}

async function uploadApprovedPlanSnapshot(runId: string, artifactPrefix: string): Promise<string> {
  const tempDir = path.join(os.tmpdir(), `reeditpro-real-video-film-plan-${runId}`)
  await rm(tempDir, { recursive: true, force: true })
  await mkdir(tempDir, { recursive: true })
  const snapshotPath = path.join(tempDir, 'approved-plan-snapshot.json')
  const snapshot = buildRealVideoFilmPlanSnapshot(runId)
  await writeFile(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8')
  const gcsUri = `gs://${realVideoFilmSlowmotionConfig.generatedAssetsBucket}/${artifactPrefix}/plan/approved-plan-snapshot.json`
  await runCommand('gcloud', ['storage', 'cp', snapshotPath, gcsUri])
  await rm(tempDir, { recursive: true, force: true })
  return gcsUri
}

async function runGcloud(args: string[], allowFailure = false): Promise<string> {
  try {
    return await runCommand('gcloud', args)
  } catch (error) {
    if (allowFailure) return ''
    throw error
  }
}

async function runCommand(command: string, args: string[], timeout = 10 * 60 * 1000): Promise<string> {
  const { stdout } = await execFileAsync(command, args, {
    timeout,
    maxBuffer: 128 * 1024 * 1024,
    env: {
      ...process.env,
      PATH: `/private/tmp/codex-node-v24.14.0-darwin-arm64/bin:/private/tmp/codex-node-runtime/bin:${process.env.PATH ?? ''}`,
      CLOUDSDK_CORE_DISABLE_PROMPTS: '1',
    },
  })
  return stdout
}

function parseImageDigest(output: string): string {
  const match = output.match(/Digest:\s*(sha256:[a-f0-9]{64})/i) ?? output.match(/"(sha256:[a-f0-9]{64})"/i)
  if (!match) throw new Error(`Could not parse image digest from docker inspect output: ${output.slice(0, 500)}`)
  return match[1]
}

function parseExecutionId(output: string): string | undefined {
  return output.match(/Execution \[([^\]]+)\]/)?.[1] ?? output.match(/executions\/([A-Za-z0-9_-]+)/)?.[1]
}

function lastGcloudValue(output: string): string {
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .at(-1) ?? ''
}

async function deleteAppleDoubleFiles(directory: string): Promise<void> {
  const entries = await readdir(directory, { withFileTypes: true })
  await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name)
    if (entry.name.startsWith('._')) {
      await rm(entryPath, { force: true, recursive: true })
      return
    }
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') await deleteAppleDoubleFiles(entryPath)
  }))
}

export function realVideoFilmSlowmotionEvidenceToTypeScript(evidence: ApprovedRealVideoFilmSlowmotionEvidence): string {
  return [
    'import type { ApprovedRealVideoFilmSlowmotionEvidence } from \'./real-video-film-slowmotion-types\'',
    '',
    'export const approvedRealVideoFilmSlowmotionEvidence: ApprovedRealVideoFilmSlowmotionEvidence = ' + JSON.stringify(evidence, null, 2),
    '',
    'export function getApprovedRealVideoFilmSlowmotionEvidence(): ApprovedRealVideoFilmSlowmotionEvidence {',
    '  return {',
    '    ...approvedRealVideoFilmSlowmotionEvidence,',
    '    selectedSegment: approvedRealVideoFilmSlowmotionEvidence.selectedSegment ? { ...approvedRealVideoFilmSlowmotionEvidence.selectedSegment } : undefined,',
    '    phase38EReadiness: { ...approvedRealVideoFilmSlowmotionEvidence.phase38EReadiness },',
    '    blockers: [...approvedRealVideoFilmSlowmotionEvidence.blockers],',
    '    warnings: [...approvedRealVideoFilmSlowmotionEvidence.warnings],',
    '  }',
    '}',
    '',
  ].join('\n')
}
