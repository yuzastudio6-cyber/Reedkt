import { execFile } from 'node:child_process'
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { buildRealVideoProColorImageEnvVars } from './real-video-pro-color-command-plan'
import { buildRealVideoProColorImageIamPlan } from './real-video-pro-color-iam-plan'
import {
  makeRealVideoProColorImageRunId,
  realVideoProColorImageArtifactPrefix,
  realVideoProColorImageConfig,
  validateRealVideoProColorImageExecutionEnv,
} from './real-video-pro-color-image-policy'
import type { ApprovedRealVideoProColorImageEvidence, RealVideoProColorImageExecutionReport } from './real-video-pro-color-image-types'

const execFileAsync = promisify(execFile)

export async function runRealVideoProColorImageSample(input: {
  execute: boolean
  runId?: string
}): Promise<{
  evidence: ApprovedRealVideoProColorImageEvidence
  executionReport: RealVideoProColorImageExecutionReport
  localReportPath: string
  imageDigest: string
  iamChanges: string[]
}> {
  if (!input.execute) throw new Error('Pass --execute to run the Phase 40C controlled real-video pro color/image sample.')
  const runId = input.runId ?? makeRealVideoProColorImageRunId()
  const artifactPrefix = realVideoProColorImageArtifactPrefix(runId)
  const preflight = await runRealVideoProColorImagePreflight()
  if (!preflight.allowed) throw new Error(`Real-video pro color/image preflight blocked:\n- ${preflight.blockers.join('\n- ')}`)

  const iamChanges = await ensureRealVideoProColorImageIamBindings()
  await runCommand('npm', ['run', 'build:staging-pro-color-image-runtime-worker'])
  await deleteAppleDoubleFiles(process.cwd())
  await runCommand('docker', [
    'buildx',
    'build',
    '--platform',
    'linux/amd64',
    '--provenance=false',
    '--sbom=false',
    '-f',
    'docker/prod/pro-color-image-runtime/Dockerfile',
    '-t',
    realVideoProColorImageConfig.runtimeTargetImage,
    '--push',
    '.',
  ], 3 * 60 * 60 * 1000)
  const imageInspect = await runCommand('docker', ['buildx', 'imagetools', 'inspect', realVideoProColorImageConfig.runtimeTargetImage])
  const imageDigest = parseImageDigest(imageInspect)
  const imageRef = `${realVideoProColorImageConfig.runtimeImageRepository}@${imageDigest}`
  await runCommand('gcloud', [
    'run',
    'jobs',
    'deploy',
    realVideoProColorImageConfig.runtimeJobName,
    '--project',
    realVideoProColorImageConfig.projectId,
    '--region',
    realVideoProColorImageConfig.region,
    '--image',
    imageRef,
    '--service-account',
    realVideoProColorImageConfig.serviceAccountEmail,
    `--cpu=${realVideoProColorImageConfig.cpu}`,
    `--memory=${realVideoProColorImageConfig.memory}`,
    '--parallelism=1',
    '--max-retries=0',
    '--set-env-vars',
    buildRealVideoProColorImageEnvVars(runId, imageRef, imageDigest),
  ], 15 * 60 * 1000)
  const executionOutput = await runCommand('gcloud', [
    'run',
    'jobs',
    'execute',
    realVideoProColorImageConfig.runtimeJobName,
    '--region',
    realVideoProColorImageConfig.region,
    '--project',
    realVideoProColorImageConfig.projectId,
    '--wait',
  ], 60 * 60 * 1000)
  const executionId = parseExecutionId(executionOutput)
    ?? lastGcloudValue(await runGcloud([
      'run',
      'jobs',
      'executions',
      'list',
      '--job',
      realVideoProColorImageConfig.runtimeJobName,
      '--region',
      realVideoProColorImageConfig.region,
      '--project',
      realVideoProColorImageConfig.projectId,
      '--limit=1',
      '--format=value(metadata.name)',
    ]))
  const localReportPath = path.join(os.tmpdir(), `reeditpro-real-video-pro-color-image-${runId}`, 'phase40c-report.json')
  await mkdir(path.dirname(localReportPath), { recursive: true })
  const reportUri = `gs://${realVideoProColorImageConfig.qaBucket}/${artifactPrefix}/reports/phase40c-report.json`
  await runCommand('gcloud', ['storage', 'cp', reportUri, localReportPath])
  const executionReport = JSON.parse(await readFile(localReportPath, 'utf8')) as RealVideoProColorImageExecutionReport
  executionReport.executionId ??= executionId
  executionReport.image = { image: imageRef, digest: imageDigest }
  await writeFile(localReportPath, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')

  const verified = executionReport.ok && executionReport.qa.status === 'passed'
  const toolStatus = Object.fromEntries(executionReport.tools.map((tool) => [tool.toolId, tool.status])) as ApprovedRealVideoProColorImageEvidence['toolResults']
  const evidence: ApprovedRealVideoProColorImageEvidence = {
    phase: '40C',
    status: verified ? 'verified' : 'blocked',
    runId,
    runtimeImage: imageRef,
    runtimeImageDigest: imageDigest,
    cloudRunJobName: realVideoProColorImageConfig.runtimeJobName,
    cloudRunExecutionId: executionReport.executionId,
    sourceInputVideo: realVideoProColorImageConfig.approvedInputVideoGcsUri,
    sample: {
      timestampsSeconds: executionReport.sample.timestampsSeconds,
      width: executionReport.sample.width,
      height: executionReport.sample.height,
      frameCount: executionReport.sample.frameCount,
    },
    artifactPrefix: `gs://${realVideoProColorImageConfig.generatedAssetsBucket}/${artifactPrefix}/`,
    qaReportUri: reportUri,
    toolResults: {
      ffprobe: toolStatus.ffprobe ?? 'blocked',
      ffmpeg: toolStatus.ffmpeg ?? 'blocked',
      opencolorio: toolStatus.opencolorio ?? 'blocked',
      openimageio: toolStatus.openimageio ?? 'blocked',
      kornia: toolStatus.kornia ?? 'blocked',
    },
    phase40DReadiness: {
      readyForProColorImagePrivateFeatureE2EReadinessGate: verified,
      reason: verified
        ? 'Phase 40C verified FFprobe, FFmpeg, OpenColorIO, OpenImageIO, and Kornia on bounded real-video-derived frames only; Phase 40D may plan the private feature E2E readiness gate.'
        : 'Phase 40D remains blocked because Phase 40C bounded real-video sample QA did not pass.',
    },
    blockers: executionReport.qa.blockers,
    warnings: executionReport.warnings,
  }

  return { evidence, executionReport, localReportPath, imageDigest, iamChanges }
}

export async function runRealVideoProColorImagePreflight() {
  const [activeAccount, activeProject, projectDescribe, finalExportsBucket, generatedBucket, previewsBucket, qaBucket, tempBucket, serviceAccount, sourceObject, phase40BReport, jobDescribe] = await Promise.all([
    runGcloud(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
    runGcloud(['config', 'get-value', 'project']),
    runGcloud(['projects', 'describe', 'reeditpro', '--format=value(projectId)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${realVideoProColorImageConfig.finalExportsBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${realVideoProColorImageConfig.generatedAssetsBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${realVideoProColorImageConfig.previewsBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${realVideoProColorImageConfig.qaBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${realVideoProColorImageConfig.workerTempBucket}`, '--format=value(name)']),
    runGcloud(['iam', 'service-accounts', 'describe', realVideoProColorImageConfig.serviceAccountEmail, '--project', realVideoProColorImageConfig.projectId, '--format=value(email)']),
    runGcloud(['storage', 'objects', 'describe', realVideoProColorImageConfig.approvedInputVideoGcsUri, '--format=value(name)']),
    runGcloud(['storage', 'objects', 'describe', realVideoProColorImageConfig.phase40BReportUri, '--format=value(name)']),
    runGcloud(['run', 'jobs', 'describe', realVideoProColorImageConfig.runtimeJobName, '--region', realVideoProColorImageConfig.region, '--project', realVideoProColorImageConfig.projectId, '--format=value(metadata.name)'], true),
  ])
  const blockers: string[] = []
  const warnings: string[] = []
  const activeAccountValue = lastGcloudValue(activeAccount)
  const activeProjectValue = lastGcloudValue(activeProject)
  if (!activeAccountValue) blockers.push('No active gcloud account is visible.')
  if (lastGcloudValue(projectDescribe) !== realVideoProColorImageConfig.projectId) blockers.push('gcloud cannot describe project reeditpro.')
  if (lastGcloudValue(finalExportsBucket) !== realVideoProColorImageConfig.finalExportsBucket) blockers.push('Final-exports bucket is not reachable.')
  if (lastGcloudValue(generatedBucket) !== realVideoProColorImageConfig.generatedAssetsBucket) blockers.push('Generated-assets bucket is not reachable.')
  if (lastGcloudValue(previewsBucket) !== realVideoProColorImageConfig.previewsBucket) blockers.push('Previews bucket is not reachable.')
  if (lastGcloudValue(qaBucket) !== realVideoProColorImageConfig.qaBucket) blockers.push('QA bucket is not reachable.')
  if (lastGcloudValue(tempBucket) !== realVideoProColorImageConfig.workerTempBucket) blockers.push('Worker temp bucket is not reachable.')
  if (lastGcloudValue(serviceAccount) !== realVideoProColorImageConfig.serviceAccountEmail) blockers.push('CPU worker service account is not reachable.')
  if (!lastGcloudValue(sourceObject)) blockers.push('Approved Phase 32 source object is not reachable.')
  if (!lastGcloudValue(phase40BReport)) blockers.push('Approved Phase 40B QA report object is not reachable.')
  if (!lastGcloudValue(jobDescribe)) warnings.push('Cloud Run pro color/image runtime job does not exist yet and will be created.')

  const validation = validateRealVideoProColorImageExecutionEnv({
    projectId: process.env.GCP_PROJECT_ID,
    activeProject: activeProjectValue,
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    confirmation: process.env.REEDITPRO_CONFIRM_REAL_VIDEO_PRO_COLOR_IMAGE_SAMPLE,
    runtimeMode: process.env.REEDITPRO_PRO_COLOR_IMAGE_RUNTIME_MODE ?? realVideoProColorImageConfig.runtimeMode,
    inputVideoGcsUri: process.env.REEDITPRO_PHASE40C_INPUT_VIDEO_GCS_URI ?? realVideoProColorImageConfig.approvedInputVideoGcsUri,
    frameCount: realVideoProColorImageConfig.preferredFrameCount,
    frameWidth: realVideoProColorImageConfig.maxFrameWidth,
    frameHeight: realVideoProColorImageConfig.maxFrameHeight,
    providerExecutionEnabled: process.env.PROVIDER_EXECUTION_ENABLED ?? 'false',
    revideoEnabled: process.env.REVIDEO_ENABLED ?? 'false',
    publicAccessEnabled: process.env.PUBLIC_ACCESS_ENABLED ?? 'false',
    fullVideoProcessingEnabled: process.env.FULL_VIDEO_PROCESSING_ENABLED ?? 'false',
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

export function realVideoProColorImageEvidenceToTypeScript(evidence: ApprovedRealVideoProColorImageEvidence): string {
  return `import type { ApprovedRealVideoProColorImageEvidence } from './real-video-pro-color-image-types'\n\nexport const approvedRealVideoProColorImageEvidence: ApprovedRealVideoProColorImageEvidence = ${JSON.stringify(evidence, null, 2)}\n\nexport function getApprovedRealVideoProColorImageEvidence(): ApprovedRealVideoProColorImageEvidence {\n  return {\n    ...approvedRealVideoProColorImageEvidence,\n    sample: approvedRealVideoProColorImageEvidence.sample ? { ...approvedRealVideoProColorImageEvidence.sample, timestampsSeconds: [...approvedRealVideoProColorImageEvidence.sample.timestampsSeconds] } : undefined,\n    toolResults: { ...approvedRealVideoProColorImageEvidence.toolResults },\n    phase40DReadiness: { ...approvedRealVideoProColorImageEvidence.phase40DReadiness },\n    blockers: [...approvedRealVideoProColorImageEvidence.blockers],\n    warnings: [...approvedRealVideoProColorImageEvidence.warnings],\n  }\n}\n`
}

async function ensureRealVideoProColorImageIamBindings(): Promise<string[]> {
  const changes: string[] = []
  for (const plan of buildRealVideoProColorImageIamPlan()) {
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
