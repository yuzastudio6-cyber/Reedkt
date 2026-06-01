import { execFile } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { buildDeepFilterNetFeatureE2EIamPlan } from './deepfilternet-feature-iam-plan'
import {
  deepFilterNetFeatureE2EConfig,
  deepFilterNetFeatureE2EPrefix,
  validateDeepFilterNetFeatureE2EAudioCleanupExecutionEnv,
} from './deepfilternet-feature-e2e-policy'
import type {
  ApprovedDeepFilterNetFeatureE2EEvidence,
  DeepFilterNetFeatureE2EExecutionReport,
} from './deepfilternet-feature-e2e-types'

const execFileAsync = promisify(execFile)

export async function runDeepFilterNetFeatureE2EAudioCleanup(input: {
  execute: boolean
  runId?: string
}): Promise<{
  evidence: ApprovedDeepFilterNetFeatureE2EEvidence
  executionReport: DeepFilterNetFeatureE2EExecutionReport
  localReportPath: string
  localReviewCopyPath?: string
  imageDigest: string
  iamChanges: string[]
}> {
  if (!input.execute) throw new Error('Pass --execute to run the Phase 36E DeepFilterNet feature E2E audio cleanup flow.')
  const runId = input.runId ?? `phase36e-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 15)}`
  const artifactPrefix = deepFilterNetFeatureE2EPrefix(runId)
  const preflight = await runDeepFilterNetFeatureE2EPreflight()
  if (!preflight.allowed) throw new Error(`DeepFilterNet feature E2E audio cleanup preflight blocked:\n- ${preflight.blockers.join('\n- ')}`)

  const iamChanges = await ensureDeepFilterNetFeatureE2EIamBindings()
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
    deepFilterNetFeatureE2EConfig.runtimeTargetImage,
    '--push',
    '.',
  ], 90 * 60 * 1000)
  const imageInspect = await runCommand('docker', ['buildx', 'imagetools', 'inspect', deepFilterNetFeatureE2EConfig.runtimeTargetImage])
  const imageDigest = parseImageDigest(imageInspect)
  const imageRef = `${deepFilterNetFeatureE2EConfig.runtimeImageRepository}@${imageDigest}`
  await runCommand('gcloud', [
    'run',
    'jobs',
    'deploy',
    deepFilterNetFeatureE2EConfig.runtimeJobName,
    '--project',
    deepFilterNetFeatureE2EConfig.projectId,
    '--region',
    deepFilterNetFeatureE2EConfig.region,
    '--image',
    imageRef,
    '--service-account',
    deepFilterNetFeatureE2EConfig.serviceAccountEmail,
    '--cpu=4',
    '--memory=8Gi',
    '--parallelism=1',
    '--max-retries=0',
    '--set-env-vars',
    buildRuntimeEnvVars(runId, imageRef, imageDigest),
  ], 15 * 60 * 1000)
  const executionOutput = await runCommand('gcloud', ['run', 'jobs', 'execute', deepFilterNetFeatureE2EConfig.runtimeJobName, '--region', deepFilterNetFeatureE2EConfig.region, '--project', deepFilterNetFeatureE2EConfig.projectId, '--wait'], 45 * 60 * 1000)
  const executionId = parseExecutionId(executionOutput)
  const localReportPath = path.join(os.tmpdir(), `reeditpro-deepfilternet-feature-${runId}`, 'phase36e-report.json')
  await mkdir(path.dirname(localReportPath), { recursive: true })
  const reportUri = `gs://${deepFilterNetFeatureE2EConfig.qaBucket}/${artifactPrefix}/reports/phase36e-report.json`
  await runCommand('gcloud', ['storage', 'cp', reportUri, localReportPath])
  const executionReport = JSON.parse(await readFile(localReportPath, 'utf8')) as DeepFilterNetFeatureE2EExecutionReport
  executionReport.executionId ??= executionId
  executionReport.image = {
    image: imageRef,
    digest: imageDigest,
  }
  await writeFile(localReportPath, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')
  const localReviewCopyPath = executionReport.reviewPreview.gcsUri
    ? await copyPrivateReviewPreviewToBackup(runId, executionReport.reviewPreview.gcsUri)
    : undefined

  const passed = executionReport.ok && executionReport.qa.status !== 'blocked'
  const evidence: ApprovedDeepFilterNetFeatureE2EEvidence = {
    phase: '36E',
    status: passed ? 'completed' : 'blocked',
    runId,
    runtimeImage: imageRef,
    runtimeImageDigest: imageDigest,
    cloudRunJobName: deepFilterNetFeatureE2EConfig.runtimeJobName,
    cloudRunExecutionId: executionReport.executionId,
    sourceInputVideo: deepFilterNetFeatureE2EConfig.approvedInputVideo,
    referencePhase31Audio: deepFilterNetFeatureE2EConfig.referencePhase31Audio,
    planSnapshotUri: executionReport.planSnapshot.gcsUri,
    cleanedAudioUri: executionReport.cleanedAudio.cleanedAudioUri,
    privateReviewPreviewUri: executionReport.reviewPreview.gcsUri,
    qaReportUri: reportUri,
    toolId: deepFilterNetFeatureE2EConfig.toolId,
    toolVersion: deepFilterNetFeatureE2EConfig.toolVersion,
    artifactGcsPath: deepFilterNetFeatureE2EConfig.artifactGcsPath,
    cliSha256: deepFilterNetFeatureE2EConfig.cliSha256,
    modelArchiveSha256: deepFilterNetFeatureE2EConfig.modelArchiveSha256,
    aggregateSha256: deepFilterNetFeatureE2EConfig.aggregateSha256,
    deepFilterNetFeatureE2ECompleted: passed,
    phase37AReadiness: {
      readyForOcrApprovalWorkflow: passed,
      reason: passed
        ? 'Phase 36E completed the private DeepFilterNet audio feature E2E gate; Phase 37A OCR approval workflow may start.'
        : 'Phase 37A remains blocked because Phase 36E private DeepFilterNet audio feature E2E QA did not pass.',
    },
    blockers: executionReport.qa.blockers,
    warnings: executionReport.warnings,
  }

  return { evidence, executionReport, localReportPath, localReviewCopyPath, imageDigest, iamChanges }
}

export async function runDeepFilterNetFeatureE2EPreflight() {
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
    phase36DReportObject,
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
    runGcloud(['storage', 'buckets', 'describe', `gs://${deepFilterNetFeatureE2EConfig.finalExportsBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${deepFilterNetFeatureE2EConfig.generatedAssetsBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${deepFilterNetFeatureE2EConfig.analysisBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${deepFilterNetFeatureE2EConfig.qaBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${deepFilterNetFeatureE2EConfig.workerTempBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'objects', 'describe', deepFilterNetFeatureE2EConfig.approvedInputVideo, '--format=value(size)']),
    runGcloud(['storage', 'objects', 'describe', deepFilterNetFeatureE2EConfig.referencePhase31Audio, '--format=value(size)']),
    runGcloud(['storage', 'objects', 'describe', `${deepFilterNetFeatureE2EConfig.artifactGcsPath}${deepFilterNetFeatureE2EConfig.cliFileName}`, '--format=value(size)']),
    runGcloud(['storage', 'objects', 'describe', `${deepFilterNetFeatureE2EConfig.artifactGcsPath}${deepFilterNetFeatureE2EConfig.modelArchiveFileName}`, '--format=value(size)']),
    runGcloud(['storage', 'objects', 'describe', `${deepFilterNetFeatureE2EConfig.artifactGcsPath}model_tree_manifest.json`, '--format=value(size)']),
    runGcloud(['storage', 'objects', 'describe', deepFilterNetFeatureE2EConfig.phase36DReportUri, '--format=value(size)']),
    runGcloud(['iam', 'service-accounts', 'describe', deepFilterNetFeatureE2EConfig.serviceAccountEmail, '--project', deepFilterNetFeatureE2EConfig.projectId, '--format=value(email)']),
    runGcloud(['run', 'jobs', 'describe', deepFilterNetFeatureE2EConfig.runtimeJobName, '--region', deepFilterNetFeatureE2EConfig.region, '--project', deepFilterNetFeatureE2EConfig.projectId, '--format=value(metadata.name)']),
    runGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${deepFilterNetFeatureE2EConfig.finalExportsBucket}`, '--format=json']),
    runGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${deepFilterNetFeatureE2EConfig.generatedAssetsBucket}`, '--format=json']),
    runGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${deepFilterNetFeatureE2EConfig.analysisBucket}`, '--format=json']),
    runGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${deepFilterNetFeatureE2EConfig.qaBucket}`, '--format=json']),
    runGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${deepFilterNetFeatureE2EConfig.workerTempBucket}`, '--format=json']),
  ])
  const blockers: string[] = []
  const warnings: string[] = []
  const activeAccountValue = lastGcloudValue(activeAccount)
  const activeProjectValue = lastGcloudValue(activeProject)
  if (!activeAccountValue) blockers.push('No active gcloud account is visible.')
  if (lastGcloudValue(projectDescribe) !== deepFilterNetFeatureE2EConfig.projectId) blockers.push('gcloud cannot describe project reeditpro.')
  if (lastGcloudValue(finalExportsBucket) !== deepFilterNetFeatureE2EConfig.finalExportsBucket) blockers.push('Final-exports bucket is not reachable.')
  if (lastGcloudValue(generatedBucket) !== deepFilterNetFeatureE2EConfig.generatedAssetsBucket) blockers.push('Generated-assets bucket is not reachable.')
  if (lastGcloudValue(analysisBucket) !== deepFilterNetFeatureE2EConfig.analysisBucket) blockers.push('Analysis bucket is not reachable.')
  if (lastGcloudValue(qaBucket) !== deepFilterNetFeatureE2EConfig.qaBucket) blockers.push('QA bucket is not reachable.')
  if (lastGcloudValue(tempBucket) !== deepFilterNetFeatureE2EConfig.workerTempBucket) blockers.push('Worker temp bucket is not reachable.')
  if (Number(lastGcloudValue(sourceObject)) <= 0) blockers.push('Approved Phase 32 source video object is missing or empty.')
  if (Number(lastGcloudValue(referenceObject)) <= 0) blockers.push('Approved Phase 31 reference audio object is missing or empty.')
  if (Number(lastGcloudValue(cliObject)) <= 0) blockers.push('Approved DeepFilterNet CLI object is missing or empty.')
  if (Number(lastGcloudValue(modelArchiveObject)) <= 0) blockers.push('Approved DeepFilterNet ONNX archive object is missing or empty.')
  if (Number(lastGcloudValue(manifestObject)) <= 0) blockers.push('Approved DeepFilterNet model manifest object is missing or empty.')
  if (Number(lastGcloudValue(phase36DReportObject)) <= 0) blockers.push('Approved Phase 36D QA report object is missing or empty.')
  if (lastGcloudValue(serviceAccount) !== deepFilterNetFeatureE2EConfig.serviceAccountEmail) blockers.push('CPU worker service account is not reachable.')
  if (lastGcloudValue(jobDescribe) !== deepFilterNetFeatureE2EConfig.runtimeJobName) blockers.push('Cloud Run DeepFilterNet runtime job is not reachable.')
  if ([finalExportsIam, generatedIam, analysisIam, qaIam, tempIam].some((policy) => /allUsers|allAuthenticatedUsers/.test(policy))) blockers.push('One or more target buckets includes a public principal.')

  const validation = validateDeepFilterNetFeatureE2EAudioCleanupExecutionEnv({
    projectId: process.env.GCP_PROJECT_ID,
    activeProject: activeProjectValue,
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    confirmation: process.env.REEDITPRO_CONFIRM_DEEPFILTERNET_AUDIO_FEATURE_E2E,
    runtimeMode: process.env.REEDITPRO_DEEPFILTERNET_RUNTIME_MODE ?? deepFilterNetFeatureE2EConfig.runtimeMode,
    inputVideo: process.env.REEDITPRO_PHASE36E_INPUT_VIDEO_GCS_URI ?? deepFilterNetFeatureE2EConfig.approvedInputVideo,
    referencePhase31Audio: process.env.REEDITPRO_PHASE36E_REFERENCE_AUDIO_GCS_URI ?? deepFilterNetFeatureE2EConfig.referencePhase31Audio,
    artifactGcsPath: process.env.REEDITPRO_DEEPFILTERNET_ARTIFACT_GCS_PATH ?? deepFilterNetFeatureE2EConfig.artifactGcsPath,
    cliSha256: process.env.REEDITPRO_DEEPFILTERNET_CLI_SHA256 ?? deepFilterNetFeatureE2EConfig.cliSha256,
    modelArchiveSha256: process.env.REEDITPRO_DEEPFILTERNET_MODEL_ARCHIVE_SHA256 ?? deepFilterNetFeatureE2EConfig.modelArchiveSha256,
    aggregateSha256: process.env.REEDITPRO_DEEPFILTERNET_AGGREGATE_SHA256 ?? deepFilterNetFeatureE2EConfig.aggregateSha256,
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

async function copyPrivateReviewPreviewToBackup(runId: string, reviewPreviewUri: string): Promise<string> {
  if (!reviewPreviewUri.startsWith('gs://reeditpro-staging-reeditpro-final-exports/activation-audio-ai/phase36e/')) {
    throw new Error(`Refusing to copy unexpected review preview URI: ${reviewPreviewUri}`)
  }
  const destinationDir = path.join('/Volumes/backup/codex-results/reeditpro/phase36e-deepfilternet-feature-e2e', runId)
  const destinationPath = path.join(destinationDir, 'deepfilternet-audio-feature-review.mp4')
  await mkdir(destinationDir, { recursive: true })
  await runCommand('gcloud', ['storage', 'cp', reviewPreviewUri, destinationPath], 10 * 60 * 1000, {
    CLOUDSDK_STORAGE_SLICED_OBJECT_DOWNLOAD_THRESHOLD: '0',
    CLOUDSDK_STORAGE_CHECK_HASHES: 'never',
  })
  return destinationPath
}

async function ensureDeepFilterNetFeatureE2EIamBindings(): Promise<string[]> {
  const changes: string[] = []
  for (const plan of buildDeepFilterNetFeatureE2EIamPlan()) {
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
    'REEDITPRO_CONFIRM_DEEPFILTERNET_AUDIO_FEATURE_E2E=true',
    'REEDITPRO_DEEPFILTERNET_RUNTIME_MODE=audio_feature_e2e',
    `REEDITPRO_PHASE36E_RUN_ID=${runId}`,
    `REEDITPRO_PHASE36E_INPUT_VIDEO_GCS_URI=${deepFilterNetFeatureE2EConfig.approvedInputVideo}`,
    `REEDITPRO_PHASE36E_REFERENCE_AUDIO_GCS_URI=${deepFilterNetFeatureE2EConfig.referencePhase31Audio}`,
    `REEDITPRO_DEEPFILTERNET_ARTIFACT_GCS_PATH=${deepFilterNetFeatureE2EConfig.artifactGcsPath}`,
    `REEDITPRO_DEEPFILTERNET_ARTIFACT_RUNTIME_PATH=${deepFilterNetFeatureE2EConfig.artifactRuntimePath}`,
    `REEDITPRO_DEEPFILTERNET_CLI_SHA256=${deepFilterNetFeatureE2EConfig.cliSha256}`,
    `REEDITPRO_DEEPFILTERNET_MODEL_ARCHIVE_SHA256=${deepFilterNetFeatureE2EConfig.modelArchiveSha256}`,
    `REEDITPRO_DEEPFILTERNET_AGGREGATE_SHA256=${deepFilterNetFeatureE2EConfig.aggregateSha256}`,
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

async function runCommand(command: string, args: string[], timeout = 10 * 60 * 1000, extraEnv: NodeJS.ProcessEnv = {}): Promise<string> {
  const { stdout } = await execFileAsync(command, args, {
    timeout,
    maxBuffer: 128 * 1024 * 1024,
    env: {
      ...process.env,
      ...extraEnv,
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

export function deepFilterNetFeatureE2EEvidenceToTypeScript(evidence: ApprovedDeepFilterNetFeatureE2EEvidence): string {
  return [
    'import { deepFilterNetFeatureE2EConfig } from \'./deepfilternet-feature-e2e-policy\'',
    'import type { ApprovedDeepFilterNetFeatureE2EEvidence } from \'./deepfilternet-feature-e2e-types\'',
    '',
    'export const approvedDeepFilterNetFeatureE2EEvidence: ApprovedDeepFilterNetFeatureE2EEvidence = ' + JSON.stringify(evidence, null, 2),
    '',
    'export function getApprovedDeepFilterNetFeatureE2EEvidence(): ApprovedDeepFilterNetFeatureE2EEvidence {',
    '  return {',
    '    ...approvedDeepFilterNetFeatureE2EEvidence,',
    '    phase37AReadiness: { ...approvedDeepFilterNetFeatureE2EEvidence.phase37AReadiness },',
    '    blockers: [...approvedDeepFilterNetFeatureE2EEvidence.blockers],',
    '    warnings: [...approvedDeepFilterNetFeatureE2EEvidence.warnings],',
    '  }',
    '}',
    '',
    'void deepFilterNetFeatureE2EConfig',
    '',
  ].join('\n')
}
