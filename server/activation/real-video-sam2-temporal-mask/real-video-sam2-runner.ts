import { execFile } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { buildRealVideoSam2IamPlan } from './real-video-sam2-iam-plan'
import { realVideoSam2TemporalMaskArtifactPrefix, realVideoSam2TemporalMaskConfig, validateRealVideoSam2TemporalMaskExecutionEnv } from './real-video-sam2-temporal-mask-policy'
import type {
  ApprovedRealVideoSam2TemporalMaskEvidence,
  RealVideoSam2TemporalMaskExecutionReport,
} from './real-video-sam2-temporal-mask-types'

const execFileAsync = promisify(execFile)

export async function runRealVideoSam2TemporalMask(input: {
  execute: boolean
  runId?: string
}): Promise<{
  evidence: ApprovedRealVideoSam2TemporalMaskEvidence
  executionReport: RealVideoSam2TemporalMaskExecutionReport
  localReportPath: string
  imageDigest: string
  iamChanges: string[]
}> {
  if (!input.execute) throw new Error('Pass --execute to run the Phase 35D real-video SAM2 temporal mask flow.')
  const runId = input.runId ?? `phase35d-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 14)}`
  const artifactPrefix = realVideoSam2TemporalMaskArtifactPrefix(runId)
  const preflight = await runRealVideoSam2TemporalMaskPreflight()
  if (!preflight.allowed) throw new Error(`Phase 35D SAM2 temporal mask preflight blocked:\n- ${preflight.blockers.join('\n- ')}`)

  const iamChanges = await ensureRealVideoSam2IamBindings()
  await runCommand('npm', ['run', 'build:staging-sam2-runtime-worker'])
  await runCommand('docker', [
    'buildx',
    'build',
    '--platform',
    'linux/amd64',
    '--provenance=false',
    '--sbom=false',
    '-f',
    'docker/prod/sam2-runtime/Dockerfile',
    '-t',
    realVideoSam2TemporalMaskConfig.runtimeTargetImage,
    '--push',
    '.',
  ], 3 * 60 * 60 * 1000)
  const imageInspect = await runCommand('docker', ['buildx', 'imagetools', 'inspect', realVideoSam2TemporalMaskConfig.runtimeTargetImage])
  const imageDigest = parseImageDigest(imageInspect)
  const imageRef = `${realVideoSam2TemporalMaskConfig.runtimeImageRepository}@${imageDigest}`
  await runCommand('gcloud', [
    'run',
    'jobs',
    'deploy',
    realVideoSam2TemporalMaskConfig.runtimeJobName,
    '--project',
    realVideoSam2TemporalMaskConfig.projectId,
    '--region',
    realVideoSam2TemporalMaskConfig.region,
    '--image',
    imageRef,
    '--service-account',
    realVideoSam2TemporalMaskConfig.serviceAccountEmail,
    '--gpu=1',
    '--gpu-type=nvidia-l4',
    '--cpu=4',
    '--memory=16Gi',
    '--parallelism=1',
    '--max-retries=0',
    '--no-gpu-zonal-redundancy',
    '--set-env-vars',
    buildRuntimeEnvVars(runId, imageRef, imageDigest),
  ], 15 * 60 * 1000)
  const executionOutput = await runCommand('gcloud', ['run', 'jobs', 'execute', realVideoSam2TemporalMaskConfig.runtimeJobName, '--region', realVideoSam2TemporalMaskConfig.region, '--project', realVideoSam2TemporalMaskConfig.projectId, '--wait'], 90 * 60 * 1000)
  const executionId = parseExecutionId(executionOutput)
  const localReportPath = path.join(os.tmpdir(), `reeditpro-real-video-sam2-${runId}`, 'phase35d-report.json')
  await mkdir(path.dirname(localReportPath), { recursive: true })
  const reportUri = `gs://${realVideoSam2TemporalMaskConfig.qaBucket}/${artifactPrefix}/reports/phase35d-report.json`
  await runCommand('gcloud', ['storage', 'cp', reportUri, localReportPath])
  const executionReport = JSON.parse(await readFile(localReportPath, 'utf8')) as RealVideoSam2TemporalMaskExecutionReport
  executionReport.executionId ??= executionId
  executionReport.image = {
    image: imageRef,
    digest: imageDigest,
  }
  await writeFile(localReportPath, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')

  const verified = executionReport.ok && executionReport.qa.status !== 'blocked'
  const evidence: ApprovedRealVideoSam2TemporalMaskEvidence = {
    phase: '35D',
    status: verified ? 'verified' : 'blocked',
    runId,
    runtimeImage: imageRef,
    runtimeImageDigest: imageDigest,
    cloudRunJobName: realVideoSam2TemporalMaskConfig.runtimeJobName,
    cloudRunExecutionId: executionReport.executionId,
    sourceVideo: realVideoSam2TemporalMaskConfig.approvedInputVideoGcsUri,
    selectedSegment: {
      startSeconds: executionReport.segment.startSeconds,
      endSeconds: executionReport.segment.endSeconds,
      durationSeconds: executionReport.segment.durationSeconds,
      frameCount: executionReport.segment.frameCount,
      width: executionReport.segment.width,
      height: executionReport.segment.height,
    },
    prompt: {
      source: 'phase33d_mask_bbox',
      type: 'box',
      promptFrameIndex: executionReport.prompt.promptFrameIndex,
      scaledBoundingBox: executionReport.prompt.scaledBoundingBox,
    },
    modelId: realVideoSam2TemporalMaskConfig.modelId,
    checkpointSha256: realVideoSam2TemporalMaskConfig.checkpointSha256,
    configSha256: realVideoSam2TemporalMaskConfig.configSha256,
    aggregateSha256: realVideoSam2TemporalMaskConfig.aggregateSha256,
    artifactPrefix: `gs://${realVideoSam2TemporalMaskConfig.generatedAssetsBucket}/${artifactPrefix}/`,
    masksPrefix: `gs://${realVideoSam2TemporalMaskConfig.masksBucket}/${artifactPrefix}/`,
    qaReportUri: reportUri,
    phase35EReadiness: {
      readyForControlledSegmentTextBehindSubjectPreview: verified,
      reason: verified
        ? 'Phase 35D verified SAM2 temporal masks on one approved short real-video segment only; Phase 35E may plan a controlled segment text-behind-subject preview.'
        : 'Phase 35E remains blocked because Phase 35D QA did not pass.',
    },
    blockers: executionReport.qa.blockers,
    warnings: executionReport.warnings,
  }

  return { evidence, executionReport, localReportPath, imageDigest, iamChanges }
}

export async function runRealVideoSam2TemporalMaskPreflight() {
  const [activeAccount, activeProject, projectDescribe, finalBucket, generatedBucket, masksBucket, qaBucket, tempBucket, sourceVideo, anchorFrame, anchorMask, anchorCutout, checkpoint, config, manifest, serviceAccount, jobDescribe] = await Promise.all([
    runGcloud(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
    runGcloud(['config', 'get-value', 'project']),
    runGcloud(['projects', 'describe', 'reeditpro', '--format=value(projectId)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${realVideoSam2TemporalMaskConfig.finalExportsBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${realVideoSam2TemporalMaskConfig.generatedAssetsBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${realVideoSam2TemporalMaskConfig.masksBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${realVideoSam2TemporalMaskConfig.qaBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${realVideoSam2TemporalMaskConfig.workerTempBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'objects', 'describe', realVideoSam2TemporalMaskConfig.approvedInputVideoGcsUri, '--format=value(size)']),
    runGcloud(['storage', 'objects', 'describe', realVideoSam2TemporalMaskConfig.approvedAnchorFrameGcsUri, '--format=value(size)']),
    runGcloud(['storage', 'objects', 'describe', realVideoSam2TemporalMaskConfig.approvedAnchorMaskGcsUri, '--format=value(size)']),
    runGcloud(['storage', 'objects', 'describe', realVideoSam2TemporalMaskConfig.approvedAnchorCutoutGcsUri, '--format=value(size)']),
    runGcloud(['storage', 'objects', 'describe', `${realVideoSam2TemporalMaskConfig.modelGcsPath}${realVideoSam2TemporalMaskConfig.checkpointFileName}`, '--format=value(size)']),
    runGcloud(['storage', 'objects', 'describe', `${realVideoSam2TemporalMaskConfig.modelGcsPath}${realVideoSam2TemporalMaskConfig.configFileName}`, '--format=value(size)']),
    runGcloud(['storage', 'objects', 'describe', `${realVideoSam2TemporalMaskConfig.modelGcsPath}model_tree_manifest.json`, '--format=value(size)']),
    runGcloud(['iam', 'service-accounts', 'describe', realVideoSam2TemporalMaskConfig.serviceAccountEmail, '--project', realVideoSam2TemporalMaskConfig.projectId, '--format=value(email)']),
    runGcloud(['run', 'jobs', 'describe', realVideoSam2TemporalMaskConfig.runtimeJobName, '--region', realVideoSam2TemporalMaskConfig.region, '--project', realVideoSam2TemporalMaskConfig.projectId, '--format=value(metadata.name)']),
  ])
  const blockers: string[] = []
  const activeAccountValue = lastGcloudValue(activeAccount)
  const activeProjectValue = lastGcloudValue(activeProject)
  if (!activeAccountValue) blockers.push('No active gcloud account is visible.')
  if (lastGcloudValue(projectDescribe) !== realVideoSam2TemporalMaskConfig.projectId) blockers.push('gcloud cannot describe project reeditpro.')
  if (lastGcloudValue(finalBucket) !== realVideoSam2TemporalMaskConfig.finalExportsBucket) blockers.push('Final exports bucket is not reachable.')
  if (lastGcloudValue(generatedBucket) !== realVideoSam2TemporalMaskConfig.generatedAssetsBucket) blockers.push('Generated-assets bucket is not reachable.')
  if (lastGcloudValue(masksBucket) !== realVideoSam2TemporalMaskConfig.masksBucket) blockers.push('Masks bucket is not reachable.')
  if (lastGcloudValue(qaBucket) !== realVideoSam2TemporalMaskConfig.qaBucket) blockers.push('QA bucket is not reachable.')
  if (lastGcloudValue(tempBucket) !== realVideoSam2TemporalMaskConfig.workerTempBucket) blockers.push('Worker temp bucket is not reachable.')
  for (const [label, output] of [
    ['approved Phase 32 input video', sourceVideo],
    ['approved Phase 33D anchor frame', anchorFrame],
    ['approved Phase 33D anchor mask', anchorMask],
    ['approved Phase 33D anchor cutout', anchorCutout],
    ['approved SAM2 checkpoint', checkpoint],
    ['approved SAM2 config', config],
    ['approved SAM2 manifest', manifest],
  ] as const) {
    if (Number(lastGcloudValue(output)) <= 0) blockers.push(`${label} is missing or empty.`)
  }
  if (lastGcloudValue(serviceAccount) !== realVideoSam2TemporalMaskConfig.serviceAccountEmail) blockers.push('GPU worker service account is not reachable.')
  if (lastGcloudValue(jobDescribe) !== realVideoSam2TemporalMaskConfig.runtimeJobName) blockers.push('SAM2 runtime Cloud Run job is not reachable.')

  const validation = validateRealVideoSam2TemporalMaskExecutionEnv({
    projectId: process.env.GCP_PROJECT_ID,
    activeProject: activeProjectValue,
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    confirmation: process.env.REEDITPRO_CONFIRM_SAM2_REAL_VIDEO_TEMPORAL_MASK,
    runtimeMode: realVideoSam2TemporalMaskConfig.runtimeMode,
    inputVideoGcsUri: realVideoSam2TemporalMaskConfig.approvedInputVideoGcsUri,
    anchorFrameGcsUri: realVideoSam2TemporalMaskConfig.approvedAnchorFrameGcsUri,
    anchorMaskGcsUri: realVideoSam2TemporalMaskConfig.approvedAnchorMaskGcsUri,
    anchorCutoutGcsUri: realVideoSam2TemporalMaskConfig.approvedAnchorCutoutGcsUri,
    modelGcsPath: realVideoSam2TemporalMaskConfig.modelGcsPath,
    checkpointSha256: realVideoSam2TemporalMaskConfig.checkpointSha256,
    configSha256: realVideoSam2TemporalMaskConfig.configSha256,
    aggregateSha256: realVideoSam2TemporalMaskConfig.aggregateSha256,
    segmentStartSeconds: realVideoSam2TemporalMaskConfig.segmentStartSeconds,
    segmentEndSeconds: realVideoSam2TemporalMaskConfig.segmentEndSeconds,
    segmentDurationSeconds: realVideoSam2TemporalMaskConfig.maxSegmentDurationSeconds,
    frameCount: realVideoSam2TemporalMaskConfig.preferredFrameCount,
    gpuType: realVideoSam2TemporalMaskConfig.gpuType,
    providerExecutionEnabled: process.env.PROVIDER_EXECUTION_ENABLED ?? 'false',
    publicAccessEnabled: process.env.PUBLIC_ACCESS_ENABLED ?? 'false',
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

async function ensureRealVideoSam2IamBindings(): Promise<string[]> {
  const changes: string[] = []
  for (const plan of buildRealVideoSam2IamPlan()) {
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
    'REEDITPRO_CONFIRM_SAM2_REAL_VIDEO_TEMPORAL_MASK=true',
    'REEDITPRO_SAM2_RUNTIME_MODE=real_video_temporal_mask_sample',
    `REEDITPRO_PHASE35D_RUN_ID=${runId}`,
    `REEDITPRO_SAM2_MODEL_GCS_PATH=${realVideoSam2TemporalMaskConfig.modelGcsPath}`,
    `REEDITPRO_SAM2_MODEL_RUNTIME_PATH=${realVideoSam2TemporalMaskConfig.modelRuntimePath}`,
    `REEDITPRO_SAM2_CHECKPOINT_SHA256=${realVideoSam2TemporalMaskConfig.checkpointSha256}`,
    `REEDITPRO_SAM2_CONFIG_SHA256=${realVideoSam2TemporalMaskConfig.configSha256}`,
    `REEDITPRO_SAM2_AGGREGATE_SHA256=${realVideoSam2TemporalMaskConfig.aggregateSha256}`,
    `REEDITPRO_PHASE35D_INPUT_VIDEO_GCS_URI=${realVideoSam2TemporalMaskConfig.approvedInputVideoGcsUri}`,
    `REEDITPRO_PHASE35D_ANCHOR_FRAME_GCS_URI=${realVideoSam2TemporalMaskConfig.approvedAnchorFrameGcsUri}`,
    `REEDITPRO_PHASE35D_ANCHOR_MASK_GCS_URI=${realVideoSam2TemporalMaskConfig.approvedAnchorMaskGcsUri}`,
    `REEDITPRO_PHASE35D_ANCHOR_CUTOUT_GCS_URI=${realVideoSam2TemporalMaskConfig.approvedAnchorCutoutGcsUri}`,
    `REEDITPRO_PHASE35D_ANCHOR_TIMESTAMP_SECONDS=${realVideoSam2TemporalMaskConfig.anchorTimestampSeconds}`,
    `REEDITPRO_PHASE35D_SEGMENT_START_SECONDS=${realVideoSam2TemporalMaskConfig.segmentStartSeconds}`,
    `REEDITPRO_PHASE35D_SEGMENT_END_SECONDS=${realVideoSam2TemporalMaskConfig.segmentEndSeconds}`,
    `REEDITPRO_PHASE35D_MAX_SEGMENT_SECONDS=${realVideoSam2TemporalMaskConfig.maxSegmentDurationSeconds}`,
    `REEDITPRO_PHASE35D_FRAME_COUNT=${realVideoSam2TemporalMaskConfig.preferredFrameCount}`,
    `REEDITPRO_PHASE35D_MAX_FRAMES=${realVideoSam2TemporalMaskConfig.maxFrames}`,
    `REEDITPRO_PHASE35D_FRAME_WIDTH=${realVideoSam2TemporalMaskConfig.frameWidth}`,
    `REEDITPRO_PHASE35D_FRAME_HEIGHT=${realVideoSam2TemporalMaskConfig.frameHeight}`,
    `REEDITPRO_IMAGE_REF=${imageRef}`,
    `REEDITPRO_IMAGE_DIGEST=${imageDigest}`,
    'PROVIDER_EXECUTION_ENABLED=false',
    'MODEL_DOWNLOADS_ENABLED=false',
    'REAL_MEDIA_INPUT_SCOPE=approved_phase35d_short_segment_only',
    'FULL_VIDEO_MASK_ENABLED=false',
    'TEXT_BEHIND_SUBJECT_VIDEO_ENABLED=false',
    'PUBLIC_ACCESS_ENABLED=false',
    'REEDITPRO_PRODUCTION_READY=false',
    'HF_HUB_OFFLINE=1',
  ].join(',')
}

async function runGcloud(args: string[]): Promise<string> {
  return runCommand('gcloud', args)
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

export function realVideoSam2TemporalMaskEvidenceToTypeScript(evidence: ApprovedRealVideoSam2TemporalMaskEvidence): string {
  return [
    'import { realVideoSam2TemporalMaskConfig } from \'./real-video-sam2-temporal-mask-policy\'',
    'import type { ApprovedRealVideoSam2TemporalMaskEvidence } from \'./real-video-sam2-temporal-mask-types\'',
    '',
    'export const approvedRealVideoSam2TemporalMaskEvidence: ApprovedRealVideoSam2TemporalMaskEvidence = {',
    `  phase: '35D',`,
    `  status: '${evidence.status}',`,
    evidence.runId ? `  runId: '${evidence.runId}',` : undefined,
    evidence.runtimeImage ? `  runtimeImage: '${evidence.runtimeImage}',` : undefined,
    evidence.runtimeImageDigest ? `  runtimeImageDigest: '${evidence.runtimeImageDigest}',` : undefined,
    '  cloudRunJobName: realVideoSam2TemporalMaskConfig.runtimeJobName,',
    evidence.cloudRunExecutionId ? `  cloudRunExecutionId: '${evidence.cloudRunExecutionId}',` : undefined,
    '  sourceVideo: realVideoSam2TemporalMaskConfig.approvedInputVideoGcsUri,',
    evidence.selectedSegment ? `  selectedSegment: ${JSON.stringify(evidence.selectedSegment, null, 2).replace(/\n/g, '\n  ')},` : undefined,
    evidence.prompt ? `  prompt: ${JSON.stringify(evidence.prompt, null, 2).replace(/\n/g, '\n  ')},` : undefined,
    '  modelId: realVideoSam2TemporalMaskConfig.modelId,',
    '  checkpointSha256: realVideoSam2TemporalMaskConfig.checkpointSha256,',
    '  configSha256: realVideoSam2TemporalMaskConfig.configSha256,',
    '  aggregateSha256: realVideoSam2TemporalMaskConfig.aggregateSha256,',
    evidence.artifactPrefix ? `  artifactPrefix: '${evidence.artifactPrefix}',` : undefined,
    evidence.masksPrefix ? `  masksPrefix: '${evidence.masksPrefix}',` : undefined,
    evidence.qaReportUri ? `  qaReportUri: '${evidence.qaReportUri}',` : undefined,
    `  phase35EReadiness: ${JSON.stringify(evidence.phase35EReadiness, null, 2).replace(/\n/g, '\n  ')},`,
    `  blockers: ${JSON.stringify(evidence.blockers, null, 2).replace(/\n/g, '\n  ')},`,
    `  warnings: ${JSON.stringify(evidence.warnings, null, 2).replace(/\n/g, '\n  ')},`,
    '}',
    '',
    'export function getApprovedRealVideoSam2TemporalMaskEvidence(): ApprovedRealVideoSam2TemporalMaskEvidence {',
    '  return {',
    '    ...approvedRealVideoSam2TemporalMaskEvidence,',
    '    selectedSegment: approvedRealVideoSam2TemporalMaskEvidence.selectedSegment ? { ...approvedRealVideoSam2TemporalMaskEvidence.selectedSegment } : undefined,',
    '    prompt: approvedRealVideoSam2TemporalMaskEvidence.prompt',
    '      ? { ...approvedRealVideoSam2TemporalMaskEvidence.prompt, scaledBoundingBox: [...approvedRealVideoSam2TemporalMaskEvidence.prompt.scaledBoundingBox] }',
    '      : undefined,',
    '    phase35EReadiness: { ...approvedRealVideoSam2TemporalMaskEvidence.phase35EReadiness },',
    '    blockers: [...approvedRealVideoSam2TemporalMaskEvidence.blockers],',
    '    warnings: [...approvedRealVideoSam2TemporalMaskEvidence.warnings],',
    '  }',
    '}',
    '',
  ].filter((line): line is string => line !== undefined).join('\n')
}
