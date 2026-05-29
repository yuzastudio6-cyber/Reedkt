import { execFile } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { buildSam2RuntimeIamPlan } from './sam2-runtime-iam-plan'
import { sam2RuntimeArtifactPrefix, sam2RuntimeConfig, validateSam2RuntimeExecutionEnv } from './sam2-runtime-policy'
import type { ApprovedSam2RuntimeEvidence, Sam2RuntimeExecutionReport } from './sam2-runtime-types'

const execFileAsync = promisify(execFile)

export async function runSam2RuntimeVerification(input: {
  execute: boolean
  runId?: string
}): Promise<{
  evidence: ApprovedSam2RuntimeEvidence
  executionReport: Sam2RuntimeExecutionReport
  localReportPath: string
  imageDigest: string
  iamChanges: string[]
}> {
  if (!input.execute) throw new Error('Pass --execute to run the Phase 35C SAM2 runtime verification flow.')
  const runId = input.runId ?? `phase35c-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 14)}`
  const artifactPrefix = sam2RuntimeArtifactPrefix(runId)
  const preflight = await runSam2RuntimePreflight()
  if (!preflight.allowed) throw new Error(`SAM2 runtime preflight blocked:\n- ${preflight.blockers.join('\n- ')}`)

  const iamChanges = await ensureSam2RuntimeIamBindings()
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
    sam2RuntimeConfig.runtimeTargetImage,
    '--push',
    '.',
  ], 3 * 60 * 60 * 1000)
  const imageInspect = await runCommand('docker', ['buildx', 'imagetools', 'inspect', sam2RuntimeConfig.runtimeTargetImage])
  const imageDigest = parseImageDigest(imageInspect)
  const imageRef = `${sam2RuntimeConfig.runtimeImageRepository}@${imageDigest}`
  await runCommand('gcloud', [
    'run',
    'jobs',
    'deploy',
    sam2RuntimeConfig.runtimeJobName,
    '--project',
    sam2RuntimeConfig.projectId,
    '--region',
    sam2RuntimeConfig.region,
    '--image',
    imageRef,
    '--service-account',
    sam2RuntimeConfig.serviceAccountEmail,
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
  const executionOutput = await runCommand('gcloud', ['run', 'jobs', 'execute', sam2RuntimeConfig.runtimeJobName, '--region', sam2RuntimeConfig.region, '--project', sam2RuntimeConfig.projectId, '--wait'], 45 * 60 * 1000)
  const executionId = parseExecutionId(executionOutput)
  const localReportPath = path.join(os.tmpdir(), `reeditpro-sam2-runtime-${runId}`, 'sam2-runtime-report.json')
  await mkdir(path.dirname(localReportPath), { recursive: true })
  const reportUri = `gs://${sam2RuntimeConfig.qaBucket}/${artifactPrefix}/reports/phase35c-report.json`
  await runCommand('gcloud', ['storage', 'cp', reportUri, localReportPath])
  const executionReport = JSON.parse(await readFile(localReportPath, 'utf8')) as Sam2RuntimeExecutionReport
  executionReport.executionId ??= executionId
  executionReport.image = {
    image: imageRef,
    digest: imageDigest,
  }
  await writeFile(localReportPath, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')

  const evidence: ApprovedSam2RuntimeEvidence = {
    phase: '35C',
    status: executionReport.ok && executionReport.qa.status !== 'blocked' ? 'verified' : 'blocked',
    runId,
    runtimeImage: imageRef,
    runtimeImageDigest: imageDigest,
    cloudRunJobName: sam2RuntimeConfig.runtimeJobName,
    cloudRunExecutionId: executionReport.executionId,
    modelId: sam2RuntimeConfig.modelId,
    checkpointSha256: sam2RuntimeConfig.checkpointSha256,
    configSha256: sam2RuntimeConfig.configSha256,
    aggregateSha256: sam2RuntimeConfig.aggregateSha256,
    generatedFixture: {
      width: executionReport.fixture.width,
      height: executionReport.fixture.height,
      frameCount: executionReport.fixture.frameCount,
      promptType: executionReport.fixture.promptType,
    },
    artifactPrefix: `gs://${sam2RuntimeConfig.generatedAssetsBucket}/${artifactPrefix}/`,
    qaReportUri: reportUri,
    phase35DReadiness: {
      readyForControlledShortRealVideoTemporalMaskTracking: executionReport.ok && executionReport.qa.status !== 'blocked',
      reason: executionReport.ok && executionReport.qa.status !== 'blocked'
        ? 'Phase 35C verified SAM2 runtime on generated synthetic frames only; Phase 35D may plan a controlled short real-video temporal mask tracking test.'
        : 'Phase 35D remains blocked because Phase 35C runtime QA did not pass.',
    },
    blockers: executionReport.qa.blockers,
    warnings: executionReport.warnings,
  }

  return { evidence, executionReport, localReportPath, imageDigest, iamChanges }
}

export async function runSam2RuntimePreflight() {
  const [activeAccount, activeProject, projectDescribe, generatedBucket, qaBucket, tempBucket, checkpoint, config, manifest, serviceAccount, jobDescribe] = await Promise.all([
    runGcloud(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
    runGcloud(['config', 'get-value', 'project']),
    runGcloud(['projects', 'describe', 'reeditpro', '--format=value(projectId)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${sam2RuntimeConfig.generatedAssetsBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${sam2RuntimeConfig.qaBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${sam2RuntimeConfig.workerTempBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'objects', 'describe', `${sam2RuntimeConfig.modelGcsPath}${sam2RuntimeConfig.checkpointFileName}`, '--format=value(size)']),
    runGcloud(['storage', 'objects', 'describe', `${sam2RuntimeConfig.modelGcsPath}${sam2RuntimeConfig.configFileName}`, '--format=value(size)']),
    runGcloud(['storage', 'objects', 'describe', `${sam2RuntimeConfig.modelGcsPath}model_tree_manifest.json`, '--format=value(size)']),
    runGcloud(['iam', 'service-accounts', 'describe', sam2RuntimeConfig.serviceAccountEmail, '--project', sam2RuntimeConfig.projectId, '--format=value(email)']),
    runGcloud(['run', 'jobs', 'describe', sam2RuntimeConfig.runtimeJobName, '--region', sam2RuntimeConfig.region, '--project', sam2RuntimeConfig.projectId, '--format=value(metadata.name)'], true),
  ])
  const blockers: string[] = []
  const warnings: string[] = []
  const activeAccountValue = lastGcloudValue(activeAccount)
  const activeProjectValue = lastGcloudValue(activeProject)
  if (!activeAccountValue) blockers.push('No active gcloud account is visible.')
  if (lastGcloudValue(projectDescribe) !== sam2RuntimeConfig.projectId) blockers.push('gcloud cannot describe project reeditpro.')
  if (lastGcloudValue(generatedBucket) !== sam2RuntimeConfig.generatedAssetsBucket) blockers.push('Generated-assets bucket is not reachable.')
  if (lastGcloudValue(qaBucket) !== sam2RuntimeConfig.qaBucket) blockers.push('QA bucket is not reachable.')
  if (lastGcloudValue(tempBucket) !== sam2RuntimeConfig.workerTempBucket) blockers.push('Worker temp bucket is not reachable.')
  if (Number(lastGcloudValue(checkpoint)) <= 0) blockers.push('Approved SAM2 checkpoint object is missing or empty.')
  if (Number(lastGcloudValue(config)) <= 0) blockers.push('Approved SAM2 config object is missing or empty.')
  if (Number(lastGcloudValue(manifest)) <= 0) blockers.push('Approved SAM2 model manifest object is missing or empty.')
  if (lastGcloudValue(serviceAccount) !== sam2RuntimeConfig.serviceAccountEmail) blockers.push('GPU worker service account is not reachable.')
  if (!lastGcloudValue(jobDescribe)) warnings.push('Cloud Run SAM2 runtime job does not exist yet and will be created.')

  const validation = validateSam2RuntimeExecutionEnv({
    projectId: process.env.GCP_PROJECT_ID,
    activeProject: activeProjectValue,
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    confirmation: process.env.REEDITPRO_CONFIRM_SAM2_RUNTIME,
    runtimeMode: process.env.REEDITPRO_SAM2_RUNTIME_MODE ?? sam2RuntimeConfig.runtimeMode,
    modelGcsPath: process.env.REEDITPRO_SAM2_MODEL_GCS_PATH ?? sam2RuntimeConfig.modelGcsPath,
    checkpointSha256: process.env.REEDITPRO_SAM2_CHECKPOINT_SHA256 ?? sam2RuntimeConfig.checkpointSha256,
    configSha256: process.env.REEDITPRO_SAM2_CONFIG_SHA256 ?? sam2RuntimeConfig.configSha256,
    aggregateSha256: process.env.REEDITPRO_SAM2_AGGREGATE_SHA256 ?? sam2RuntimeConfig.aggregateSha256,
    gpuType: sam2RuntimeConfig.gpuType,
    providerExecutionEnabled: process.env.PROVIDER_EXECUTION_ENABLED ?? 'false',
    realMediaInputEnabled: process.env.REAL_MEDIA_INPUT_ENABLED ?? 'false',
    productionReady: process.env.REEDITPRO_PRODUCTION_READY ?? 'false',
  })

  return {
    allowed: blockers.length === 0 && validation.allowed,
    blockers: [...validation.blockers, ...blockers],
    warnings: [...validation.warnings, ...warnings],
    activeAccount: activeAccountValue,
    activeProject: activeProjectValue,
  }
}

async function ensureSam2RuntimeIamBindings(): Promise<string[]> {
  const changes: string[] = []
  for (const plan of buildSam2RuntimeIamPlan()) {
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
    'REEDITPRO_CONFIRM_SAM2_RUNTIME=true',
    'REEDITPRO_SAM2_RUNTIME_MODE=generated_synthetic_sequence',
    `REEDITPRO_PHASE35C_RUN_ID=${runId}`,
    `REEDITPRO_SAM2_MODEL_GCS_PATH=${sam2RuntimeConfig.modelGcsPath}`,
    `REEDITPRO_SAM2_MODEL_RUNTIME_PATH=${sam2RuntimeConfig.modelRuntimePath}`,
    `REEDITPRO_SAM2_CHECKPOINT_SHA256=${sam2RuntimeConfig.checkpointSha256}`,
    `REEDITPRO_SAM2_CONFIG_SHA256=${sam2RuntimeConfig.configSha256}`,
    `REEDITPRO_SAM2_AGGREGATE_SHA256=${sam2RuntimeConfig.aggregateSha256}`,
    `REEDITPRO_IMAGE_REF=${imageRef}`,
    `REEDITPRO_IMAGE_DIGEST=${imageDigest}`,
    'PROVIDER_EXECUTION_ENABLED=false',
    'MODEL_DOWNLOADS_ENABLED=false',
    'REAL_MEDIA_INPUT_ENABLED=false',
    'REEDITPRO_PRODUCTION_READY=false',
    'HF_HUB_OFFLINE=1',
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

export function sam2RuntimeEvidenceToTypeScript(evidence: ApprovedSam2RuntimeEvidence): string {
  return [
    'import { sam2RuntimeConfig } from \'./sam2-runtime-policy\'',
    'import type { ApprovedSam2RuntimeEvidence } from \'./sam2-runtime-types\'',
    '',
    'export const approvedSam2RuntimeEvidence: ApprovedSam2RuntimeEvidence = ' + JSON.stringify(evidence, null, 2),
    '',
    'export function getApprovedSam2RuntimeEvidence(): ApprovedSam2RuntimeEvidence {',
    '  return {',
    '    ...approvedSam2RuntimeEvidence,',
    '    generatedFixture: approvedSam2RuntimeEvidence.generatedFixture ? { ...approvedSam2RuntimeEvidence.generatedFixture } : undefined,',
    '    phase35DReadiness: { ...approvedSam2RuntimeEvidence.phase35DReadiness },',
    '    blockers: [...approvedSam2RuntimeEvidence.blockers],',
    '    warnings: [...approvedSam2RuntimeEvidence.warnings],',
    '  }',
    '}',
    '',
    'void sam2RuntimeConfig',
    '',
  ].join('\n')
}
