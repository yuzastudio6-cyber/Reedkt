import { execFile } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { buildRealVideoDeepFilterNetIamPlan } from './real-video-deepfilternet-iam-plan'
import {
  realVideoDeepFilterNetConfig,
  realVideoDeepFilterNetPrefix,
  validateRealVideoDeepFilterNetAudioCleanupExecutionEnv,
} from './real-video-deepfilternet-audio-cleanup-policy'
import type {
  ApprovedRealVideoDeepFilterNetEvidence,
  RealVideoDeepFilterNetExecutionReport,
} from './real-video-deepfilternet-audio-cleanup-types'

const execFileAsync = promisify(execFile)

export async function runRealVideoDeepFilterNetAudioCleanup(input: {
  execute: boolean
  runId?: string
}): Promise<{
  evidence: ApprovedRealVideoDeepFilterNetEvidence
  executionReport: RealVideoDeepFilterNetExecutionReport
  localReportPath: string
  imageDigest: string
  iamChanges: string[]
}> {
  if (!input.execute) throw new Error('Pass --execute to run the Phase 36D real-video DeepFilterNet audio cleanup flow.')
  const runId = input.runId ?? `phase36d-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 15)}`
  const artifactPrefix = realVideoDeepFilterNetPrefix(runId)
  const preflight = await runRealVideoDeepFilterNetPreflight()
  if (!preflight.allowed) throw new Error(`Real-video DeepFilterNet audio cleanup preflight blocked:\n- ${preflight.blockers.join('\n- ')}`)

  const iamChanges = await ensureRealVideoDeepFilterNetIamBindings()
  await runCommand('find', ['.', '-name', '._*', '-type', 'f', '-delete'])
  await runCommand('npm', ['run', 'build:staging-deepfilternet-runtime-worker'])
  await runCommand('find', ['.', '-name', '._*', '-type', 'f', '-delete'])
  await runCommand('docker', [
    'buildx',
    'build',
    '--platform',
    'linux/amd64',
    '--provenance=false',
    '--sbom=false',
    '-f',
    'docker/prod/deepfilternet-runtime/Dockerfile',
    '-t',
    realVideoDeepFilterNetConfig.runtimeTargetImage,
    '--push',
    '.',
  ], 90 * 60 * 1000)
  const imageInspect = await runCommand('docker', ['buildx', 'imagetools', 'inspect', realVideoDeepFilterNetConfig.runtimeTargetImage])
  const imageDigest = parseImageDigest(imageInspect)
  const imageRef = `${realVideoDeepFilterNetConfig.runtimeImageRepository}@${imageDigest}`
  await runCommand('gcloud', [
    'run',
    'jobs',
    'deploy',
    realVideoDeepFilterNetConfig.runtimeJobName,
    '--project',
    realVideoDeepFilterNetConfig.projectId,
    '--region',
    realVideoDeepFilterNetConfig.region,
    '--image',
    imageRef,
    '--service-account',
    realVideoDeepFilterNetConfig.serviceAccountEmail,
    '--cpu=4',
    '--memory=8Gi',
    '--parallelism=1',
    '--max-retries=0',
    '--set-env-vars',
    buildRuntimeEnvVars(runId, imageRef, imageDigest),
  ], 15 * 60 * 1000)
  const executionOutput = await runCommand('gcloud', ['run', 'jobs', 'execute', realVideoDeepFilterNetConfig.runtimeJobName, '--region', realVideoDeepFilterNetConfig.region, '--project', realVideoDeepFilterNetConfig.projectId, '--wait'], 45 * 60 * 1000)
  const executionId = parseExecutionId(executionOutput)
  const localReportPath = path.join(os.tmpdir(), `reeditpro-real-video-deepfilternet-${runId}`, 'phase36d-report.json')
  await mkdir(path.dirname(localReportPath), { recursive: true })
  const reportUri = `gs://${realVideoDeepFilterNetConfig.qaBucket}/${artifactPrefix}/reports/phase36d-report.json`
  await runCommand('gcloud', ['storage', 'cp', reportUri, localReportPath])
  const executionReport = JSON.parse(await readFile(localReportPath, 'utf8')) as RealVideoDeepFilterNetExecutionReport
  executionReport.executionId ??= executionId
  executionReport.image = {
    image: imageRef,
    digest: imageDigest,
  }
  await writeFile(localReportPath, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')

  const passed = executionReport.ok && executionReport.qa.status !== 'blocked'
  const evidence: ApprovedRealVideoDeepFilterNetEvidence = {
    phase: '36D',
    status: passed ? 'completed' : 'blocked',
    runId,
    runtimeImage: imageRef,
    runtimeImageDigest: imageDigest,
    cloudRunJobName: realVideoDeepFilterNetConfig.runtimeJobName,
    cloudRunExecutionId: executionReport.executionId,
    sourceInputVideo: realVideoDeepFilterNetConfig.approvedInputVideo,
    referencePhase31Audio: realVideoDeepFilterNetConfig.referencePhase31Audio,
    planSnapshotUri: executionReport.planSnapshot.gcsUri,
    cleanedAudioUri: executionReport.cleanedAudio.cleanedAudioUri,
    privateReviewPreviewUri: executionReport.reviewPreview.gcsUri,
    qaReportUri: reportUri,
    toolId: realVideoDeepFilterNetConfig.toolId,
    toolVersion: realVideoDeepFilterNetConfig.toolVersion,
    artifactGcsPath: realVideoDeepFilterNetConfig.artifactGcsPath,
    cliSha256: realVideoDeepFilterNetConfig.cliSha256,
    modelArchiveSha256: realVideoDeepFilterNetConfig.modelArchiveSha256,
    aggregateSha256: realVideoDeepFilterNetConfig.aggregateSha256,
    realMediaAudioAiCleanupCompleted: passed,
    phase36EReadiness: {
      readyForDeepFilterNetPrivateAudioFeatureE2E: passed,
      reason: passed
        ? 'Phase 36D completed one controlled real-video DeepFilterNet audio cleanup sample; Phase 36E may plan private audio feature E2E only.'
        : 'Phase 36E remains blocked because Phase 36D controlled real-video audio cleanup QA did not pass.',
    },
    blockers: executionReport.qa.blockers,
    warnings: executionReport.warnings,
  }

  return { evidence, executionReport, localReportPath, imageDigest, iamChanges }
}

export async function runRealVideoDeepFilterNetPreflight() {
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
    cliObject,
    modelArchiveObject,
    manifestObject,
    serviceAccount,
    jobDescribe,
    finalExportsIam,
    generatedIam,
    analysisIam,
    qaIam,
    tempIam,
  ] = await Promise.all([
    runGcloud(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
    runGcloud(['config', 'get-value', 'project']),
    runGcloud(['projects', 'describe', 'reeditpro', '--format=value(projectId)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${realVideoDeepFilterNetConfig.finalExportsBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${realVideoDeepFilterNetConfig.generatedAssetsBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${realVideoDeepFilterNetConfig.analysisBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${realVideoDeepFilterNetConfig.qaBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${realVideoDeepFilterNetConfig.workerTempBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'objects', 'describe', realVideoDeepFilterNetConfig.approvedInputVideo, '--format=value(size)']),
    runGcloud(['storage', 'objects', 'describe', realVideoDeepFilterNetConfig.referencePhase31Audio, '--format=value(size)']),
    runGcloud(['storage', 'objects', 'describe', `${realVideoDeepFilterNetConfig.artifactGcsPath}${realVideoDeepFilterNetConfig.cliFileName}`, '--format=value(size)']),
    runGcloud(['storage', 'objects', 'describe', `${realVideoDeepFilterNetConfig.artifactGcsPath}${realVideoDeepFilterNetConfig.modelArchiveFileName}`, '--format=value(size)']),
    runGcloud(['storage', 'objects', 'describe', `${realVideoDeepFilterNetConfig.artifactGcsPath}model_tree_manifest.json`, '--format=value(size)']),
    runGcloud(['iam', 'service-accounts', 'describe', realVideoDeepFilterNetConfig.serviceAccountEmail, '--project', realVideoDeepFilterNetConfig.projectId, '--format=value(email)']),
    runGcloud(['run', 'jobs', 'describe', realVideoDeepFilterNetConfig.runtimeJobName, '--region', realVideoDeepFilterNetConfig.region, '--project', realVideoDeepFilterNetConfig.projectId, '--format=value(metadata.name)']),
    runGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${realVideoDeepFilterNetConfig.finalExportsBucket}`, '--format=json']),
    runGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${realVideoDeepFilterNetConfig.generatedAssetsBucket}`, '--format=json']),
    runGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${realVideoDeepFilterNetConfig.analysisBucket}`, '--format=json']),
    runGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${realVideoDeepFilterNetConfig.qaBucket}`, '--format=json']),
    runGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${realVideoDeepFilterNetConfig.workerTempBucket}`, '--format=json']),
  ])
  const blockers: string[] = []
  const warnings: string[] = []
  const activeAccountValue = lastGcloudValue(activeAccount)
  const activeProjectValue = lastGcloudValue(activeProject)
  if (!activeAccountValue) blockers.push('No active gcloud account is visible.')
  if (lastGcloudValue(projectDescribe) !== realVideoDeepFilterNetConfig.projectId) blockers.push('gcloud cannot describe project reeditpro.')
  if (lastGcloudValue(finalExportsBucket) !== realVideoDeepFilterNetConfig.finalExportsBucket) blockers.push('Final-exports bucket is not reachable.')
  if (lastGcloudValue(generatedBucket) !== realVideoDeepFilterNetConfig.generatedAssetsBucket) blockers.push('Generated-assets bucket is not reachable.')
  if (lastGcloudValue(analysisBucket) !== realVideoDeepFilterNetConfig.analysisBucket) blockers.push('Analysis bucket is not reachable.')
  if (lastGcloudValue(qaBucket) !== realVideoDeepFilterNetConfig.qaBucket) blockers.push('QA bucket is not reachable.')
  if (lastGcloudValue(tempBucket) !== realVideoDeepFilterNetConfig.workerTempBucket) blockers.push('Worker temp bucket is not reachable.')
  if (Number(lastGcloudValue(sourceObject)) <= 0) blockers.push('Approved Phase 32 source video object is missing or empty.')
  if (Number(lastGcloudValue(referenceObject)) <= 0) blockers.push('Approved Phase 31 reference audio object is missing or empty.')
  if (Number(lastGcloudValue(cliObject)) <= 0) blockers.push('Approved DeepFilterNet CLI object is missing or empty.')
  if (Number(lastGcloudValue(modelArchiveObject)) <= 0) blockers.push('Approved DeepFilterNet ONNX archive object is missing or empty.')
  if (Number(lastGcloudValue(manifestObject)) <= 0) blockers.push('Approved DeepFilterNet model manifest object is missing or empty.')
  if (lastGcloudValue(serviceAccount) !== realVideoDeepFilterNetConfig.serviceAccountEmail) blockers.push('CPU worker service account is not reachable.')
  if (lastGcloudValue(jobDescribe) !== realVideoDeepFilterNetConfig.runtimeJobName) blockers.push('Cloud Run DeepFilterNet runtime job is not reachable.')
  if ([finalExportsIam, generatedIam, analysisIam, qaIam, tempIam].some((policy) => /allUsers|allAuthenticatedUsers/.test(policy))) blockers.push('One or more target buckets includes a public principal.')

  const validation = validateRealVideoDeepFilterNetAudioCleanupExecutionEnv({
    projectId: process.env.GCP_PROJECT_ID,
    activeProject: activeProjectValue,
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    confirmation: process.env.REEDITPRO_CONFIRM_REAL_VIDEO_DEEPFILTERNET_AUDIO_CLEANUP,
    runtimeMode: process.env.REEDITPRO_DEEPFILTERNET_RUNTIME_MODE ?? realVideoDeepFilterNetConfig.runtimeMode,
    inputVideo: process.env.REEDITPRO_PHASE36D_INPUT_VIDEO_GCS_URI ?? realVideoDeepFilterNetConfig.approvedInputVideo,
    referencePhase31Audio: process.env.REEDITPRO_PHASE36D_REFERENCE_AUDIO_GCS_URI ?? realVideoDeepFilterNetConfig.referencePhase31Audio,
    artifactGcsPath: process.env.REEDITPRO_DEEPFILTERNET_ARTIFACT_GCS_PATH ?? realVideoDeepFilterNetConfig.artifactGcsPath,
    cliSha256: process.env.REEDITPRO_DEEPFILTERNET_CLI_SHA256 ?? realVideoDeepFilterNetConfig.cliSha256,
    modelArchiveSha256: process.env.REEDITPRO_DEEPFILTERNET_MODEL_ARCHIVE_SHA256 ?? realVideoDeepFilterNetConfig.modelArchiveSha256,
    aggregateSha256: process.env.REEDITPRO_DEEPFILTERNET_AGGREGATE_SHA256 ?? realVideoDeepFilterNetConfig.aggregateSha256,
    providerExecutionEnabled: process.env.PROVIDER_EXECUTION_ENABLED ?? 'false',
    publicAccessEnabled: process.env.PUBLIC_ACCESS_ENABLED ?? 'false',
    rnnoiseEnabled: process.env.RNNOISE_ENABLED ?? 'false',
    demucsEnabled: process.env.DEMUCS_ENABLED ?? 'false',
    finalDeliveryEnabled: process.env.FINAL_DELIVERY_ENABLED ?? 'false',
    productionReady: process.env.REEDITPRO_PRODUCTION_READY ?? 'false',
    externalBetaReady: process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false',
    broadRealMediaReady: process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false',
  })

  return {
    allowed: blockers.length === 0 && validation.allowed,
    blockers: [...validation.blockers, ...blockers],
    warnings: [...validation.warnings, ...warnings],
    activeAccount: activeAccountValue,
    activeProject: activeProjectValue,
  }
}

async function ensureRealVideoDeepFilterNetIamBindings(): Promise<string[]> {
  const changes: string[] = []
  for (const plan of buildRealVideoDeepFilterNetIamPlan()) {
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

function buildRuntimeEnvVars(runId: string, imageRef: string, imageDigest: string): string {
  return [
    'REEDITPRO_ENV=staging',
    'REEDITPRO_CONFIRM_REAL_VIDEO_DEEPFILTERNET_AUDIO_CLEANUP=true',
    'REEDITPRO_DEEPFILTERNET_RUNTIME_MODE=real_video_audio_cleanup_sample',
    `REEDITPRO_PHASE36D_RUN_ID=${runId}`,
    `REEDITPRO_PHASE36D_INPUT_VIDEO_GCS_URI=${realVideoDeepFilterNetConfig.approvedInputVideo}`,
    `REEDITPRO_PHASE36D_REFERENCE_AUDIO_GCS_URI=${realVideoDeepFilterNetConfig.referencePhase31Audio}`,
    `REEDITPRO_DEEPFILTERNET_ARTIFACT_GCS_PATH=${realVideoDeepFilterNetConfig.artifactGcsPath}`,
    `REEDITPRO_DEEPFILTERNET_ARTIFACT_RUNTIME_PATH=${realVideoDeepFilterNetConfig.artifactRuntimePath}`,
    `REEDITPRO_DEEPFILTERNET_CLI_SHA256=${realVideoDeepFilterNetConfig.cliSha256}`,
    `REEDITPRO_DEEPFILTERNET_MODEL_ARCHIVE_SHA256=${realVideoDeepFilterNetConfig.modelArchiveSha256}`,
    `REEDITPRO_DEEPFILTERNET_AGGREGATE_SHA256=${realVideoDeepFilterNetConfig.aggregateSha256}`,
    `REEDITPRO_IMAGE_REF=${imageRef}`,
    `REEDITPRO_IMAGE_DIGEST=${imageDigest}`,
    'PROVIDER_EXECUTION_ENABLED=false',
    'MODEL_DOWNLOADS_ENABLED=false',
    'RNNOISE_ENABLED=false',
    'DEMUCS_ENABLED=false',
    'PUBLIC_ACCESS_ENABLED=false',
    'FINAL_DELIVERY_ENABLED=false',
    'REEDITPRO_PRODUCTION_READY=false',
    'REEDITPRO_EXTERNAL_BETA_READY=false',
    'REEDITPRO_BROAD_REAL_MEDIA_READY=false',
  ].join(',')
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
      PATH: `/private/tmp/codex-node-runtime/bin:${process.env.PATH ?? ''}`,
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

export function realVideoDeepFilterNetEvidenceToTypeScript(evidence: ApprovedRealVideoDeepFilterNetEvidence): string {
  return [
    'import { realVideoDeepFilterNetConfig } from \'./real-video-deepfilternet-audio-cleanup-policy\'',
    'import type { ApprovedRealVideoDeepFilterNetEvidence } from \'./real-video-deepfilternet-audio-cleanup-types\'',
    '',
    'export const approvedRealVideoDeepFilterNetEvidence: ApprovedRealVideoDeepFilterNetEvidence = ' + JSON.stringify(evidence, null, 2),
    '',
    'export function getApprovedRealVideoDeepFilterNetEvidence(): ApprovedRealVideoDeepFilterNetEvidence {',
    '  return {',
    '    ...approvedRealVideoDeepFilterNetEvidence,',
    '    phase36EReadiness: { ...approvedRealVideoDeepFilterNetEvidence.phase36EReadiness },',
    '    blockers: [...approvedRealVideoDeepFilterNetEvidence.blockers],',
    '    warnings: [...approvedRealVideoDeepFilterNetEvidence.warnings],',
    '  }',
    '}',
    '',
    'void realVideoDeepFilterNetConfig',
    '',
  ].join('\n')
}
