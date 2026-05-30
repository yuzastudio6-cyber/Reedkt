import { execFile } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { buildDeepFilterNetRuntimeIamPlan } from './deepfilternet-runtime-iam-plan'
import {
  deepFilterNetRuntimeArtifactPrefix,
  deepFilterNetRuntimeConfig,
  validateDeepFilterNetRuntimeExecutionEnv,
} from './deepfilternet-runtime-policy'
import type {
  ApprovedDeepFilterNetRuntimeEvidence,
  DeepFilterNetRuntimeExecutionReport,
} from './deepfilternet-runtime-types'

const execFileAsync = promisify(execFile)

export async function runDeepFilterNetRuntimeVerification(input: {
  execute: boolean
  runId?: string
}): Promise<{
  evidence: ApprovedDeepFilterNetRuntimeEvidence
  executionReport: DeepFilterNetRuntimeExecutionReport
  localReportPath: string
  imageDigest: string
  iamChanges: string[]
}> {
  if (!input.execute) throw new Error('Pass --execute to run the Phase 36C DeepFilterNet runtime verification flow.')
  const runId = input.runId ?? `phase36c-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 15)}`
  const artifactPrefix = deepFilterNetRuntimeArtifactPrefix(runId)
  const preflight = await runDeepFilterNetRuntimePreflight()
  if (!preflight.allowed) throw new Error(`DeepFilterNet runtime preflight blocked:\n- ${preflight.blockers.join('\n- ')}`)

  const iamChanges = await ensureDeepFilterNetRuntimeIamBindings()
  await runCommand('npm', ['run', 'build:staging-deepfilternet-runtime-worker'])
  await runCommand('find', ['dist-staging-deepfilternet-runtime-worker', '-name', '._*', '-delete'])
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
    deepFilterNetRuntimeConfig.runtimeTargetImage,
    '--push',
    '.',
  ], 90 * 60 * 1000)
  const imageInspect = await runCommand('docker', ['buildx', 'imagetools', 'inspect', deepFilterNetRuntimeConfig.runtimeTargetImage])
  const imageDigest = parseImageDigest(imageInspect)
  const imageRef = `${deepFilterNetRuntimeConfig.runtimeImageRepository}@${imageDigest}`
  await runCommand('gcloud', [
    'run',
    'jobs',
    'deploy',
    deepFilterNetRuntimeConfig.runtimeJobName,
    '--project',
    deepFilterNetRuntimeConfig.projectId,
    '--region',
    deepFilterNetRuntimeConfig.region,
    '--image',
    imageRef,
    '--service-account',
    deepFilterNetRuntimeConfig.serviceAccountEmail,
    '--cpu=4',
    '--memory=8Gi',
    '--parallelism=1',
    '--max-retries=0',
    '--set-env-vars',
    buildRuntimeEnvVars(runId, imageRef, imageDigest),
  ], 15 * 60 * 1000)
  const executionOutput = await runCommand('gcloud', ['run', 'jobs', 'execute', deepFilterNetRuntimeConfig.runtimeJobName, '--region', deepFilterNetRuntimeConfig.region, '--project', deepFilterNetRuntimeConfig.projectId, '--wait'], 45 * 60 * 1000)
  const executionId = parseExecutionId(executionOutput)
  const localReportPath = path.join(os.tmpdir(), `reeditpro-deepfilternet-runtime-${runId}`, 'deepfilternet-runtime-report.json')
  await mkdir(path.dirname(localReportPath), { recursive: true })
  const reportUri = `gs://${deepFilterNetRuntimeConfig.qaBucket}/${artifactPrefix}/reports/phase36c-report.json`
  await runCommand('gcloud', ['storage', 'cp', reportUri, localReportPath])
  const executionReport = JSON.parse(await readFile(localReportPath, 'utf8')) as DeepFilterNetRuntimeExecutionReport
  executionReport.executionId ??= executionId
  executionReport.image = {
    image: imageRef,
    digest: imageDigest,
  }
  await writeFile(localReportPath, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')

  const passed = executionReport.ok && executionReport.qa.status !== 'blocked'
  const evidence: ApprovedDeepFilterNetRuntimeEvidence = {
    phase: '36C',
    status: passed ? 'verified' : 'blocked',
    runId,
    runtimeImage: imageRef,
    runtimeImageDigest: imageDigest,
    cloudRunJobName: deepFilterNetRuntimeConfig.runtimeJobName,
    cloudRunExecutionId: executionReport.executionId,
    toolId: deepFilterNetRuntimeConfig.toolId,
    toolVersion: deepFilterNetRuntimeConfig.toolVersion,
    artifactGcsPath: deepFilterNetRuntimeConfig.artifactGcsPath,
    cliSha256: deepFilterNetRuntimeConfig.cliSha256,
    modelArchiveSha256: deepFilterNetRuntimeConfig.modelArchiveSha256,
    aggregateSha256: deepFilterNetRuntimeConfig.aggregateSha256,
    generatedFixture: {
      sampleRate: executionReport.fixture.sampleRate,
      channels: executionReport.fixture.channels,
      durationSeconds: executionReport.fixture.durationSeconds,
    },
    enhancedAudioUri: executionReport.enhancedAudio.enhancedAudioUri,
    artifactPrefix: `gs://${deepFilterNetRuntimeConfig.generatedAssetsBucket}/${artifactPrefix}/`,
    qaReportUri: reportUri,
    phase36DReadiness: {
      readyForControlledRealVideoAudioAiCleanupSample: passed,
      reason: passed
        ? 'Phase 36C verified DeepFilterNet runtime on generated audio only; Phase 36D may plan one controlled real-video audio AI cleanup sample.'
        : 'Phase 36D remains blocked because Phase 36C generated-audio runtime QA did not pass.',
    },
    blockers: executionReport.qa.blockers,
    warnings: executionReport.warnings,
  }

  return { evidence, executionReport, localReportPath, imageDigest, iamChanges }
}

export async function runDeepFilterNetRuntimePreflight() {
  const [activeAccount, activeProject, projectDescribe, generatedBucket, analysisBucket, qaBucket, tempBucket, cliObject, modelArchiveObject, manifestObject, serviceAccount, jobDescribe, generatedIam, analysisIam, qaIam, tempIam] = await Promise.all([
    runGcloud(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
    runGcloud(['config', 'get-value', 'project']),
    runGcloud(['projects', 'describe', 'reeditpro', '--format=value(projectId)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${deepFilterNetRuntimeConfig.generatedAssetsBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${deepFilterNetRuntimeConfig.analysisBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${deepFilterNetRuntimeConfig.qaBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'buckets', 'describe', `gs://${deepFilterNetRuntimeConfig.workerTempBucket}`, '--format=value(name)']),
    runGcloud(['storage', 'objects', 'describe', `${deepFilterNetRuntimeConfig.artifactGcsPath}${deepFilterNetRuntimeConfig.cliFileName}`, '--format=value(size)']),
    runGcloud(['storage', 'objects', 'describe', `${deepFilterNetRuntimeConfig.artifactGcsPath}${deepFilterNetRuntimeConfig.modelArchiveFileName}`, '--format=value(size)']),
    runGcloud(['storage', 'objects', 'describe', `${deepFilterNetRuntimeConfig.artifactGcsPath}model_tree_manifest.json`, '--format=value(size)']),
    runGcloud(['iam', 'service-accounts', 'describe', deepFilterNetRuntimeConfig.serviceAccountEmail, '--project', deepFilterNetRuntimeConfig.projectId, '--format=value(email)']),
    runGcloud(['run', 'jobs', 'describe', deepFilterNetRuntimeConfig.runtimeJobName, '--region', deepFilterNetRuntimeConfig.region, '--project', deepFilterNetRuntimeConfig.projectId, '--format=value(metadata.name)'], true),
    runGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${deepFilterNetRuntimeConfig.generatedAssetsBucket}`, '--format=json']),
    runGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${deepFilterNetRuntimeConfig.analysisBucket}`, '--format=json']),
    runGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${deepFilterNetRuntimeConfig.qaBucket}`, '--format=json']),
    runGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${deepFilterNetRuntimeConfig.workerTempBucket}`, '--format=json']),
  ])
  const blockers: string[] = []
  const warnings: string[] = []
  const activeAccountValue = lastGcloudValue(activeAccount)
  const activeProjectValue = lastGcloudValue(activeProject)
  if (!activeAccountValue) blockers.push('No active gcloud account is visible.')
  if (lastGcloudValue(projectDescribe) !== deepFilterNetRuntimeConfig.projectId) blockers.push('gcloud cannot describe project reeditpro.')
  if (lastGcloudValue(generatedBucket) !== deepFilterNetRuntimeConfig.generatedAssetsBucket) blockers.push('Generated-assets bucket is not reachable.')
  if (lastGcloudValue(analysisBucket) !== deepFilterNetRuntimeConfig.analysisBucket) blockers.push('Analysis bucket is not reachable.')
  if (lastGcloudValue(qaBucket) !== deepFilterNetRuntimeConfig.qaBucket) blockers.push('QA bucket is not reachable.')
  if (lastGcloudValue(tempBucket) !== deepFilterNetRuntimeConfig.workerTempBucket) blockers.push('Worker temp bucket is not reachable.')
  if (Number(lastGcloudValue(cliObject)) <= 0) blockers.push('Approved DeepFilterNet CLI object is missing or empty.')
  if (Number(lastGcloudValue(modelArchiveObject)) <= 0) blockers.push('Approved DeepFilterNet ONNX archive object is missing or empty.')
  if (Number(lastGcloudValue(manifestObject)) <= 0) blockers.push('Approved DeepFilterNet model manifest object is missing or empty.')
  if (lastGcloudValue(serviceAccount) !== deepFilterNetRuntimeConfig.serviceAccountEmail) blockers.push('CPU worker service account is not reachable.')
  if (!lastGcloudValue(jobDescribe)) warnings.push('Cloud Run DeepFilterNet runtime job does not exist yet and will be created.')
  if ([generatedIam, analysisIam, qaIam, tempIam].some((policy) => /allUsers|allAuthenticatedUsers/.test(policy))) blockers.push('One or more target buckets includes a public principal.')

  const validation = validateDeepFilterNetRuntimeExecutionEnv({
    projectId: process.env.GCP_PROJECT_ID,
    activeProject: activeProjectValue,
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    confirmation: process.env.REEDITPRO_CONFIRM_DEEPFILTERNET_RUNTIME,
    runtimeMode: process.env.REEDITPRO_DEEPFILTERNET_RUNTIME_MODE ?? deepFilterNetRuntimeConfig.runtimeMode,
    artifactGcsPath: process.env.REEDITPRO_DEEPFILTERNET_ARTIFACT_GCS_PATH ?? deepFilterNetRuntimeConfig.artifactGcsPath,
    cliSha256: process.env.REEDITPRO_DEEPFILTERNET_CLI_SHA256 ?? deepFilterNetRuntimeConfig.cliSha256,
    modelArchiveSha256: process.env.REEDITPRO_DEEPFILTERNET_MODEL_ARCHIVE_SHA256 ?? deepFilterNetRuntimeConfig.modelArchiveSha256,
    aggregateSha256: process.env.REEDITPRO_DEEPFILTERNET_AGGREGATE_SHA256 ?? deepFilterNetRuntimeConfig.aggregateSha256,
    generatedAudioOnly: process.env.GENERATED_AUDIO_ONLY ?? 'true',
    providerExecutionEnabled: process.env.PROVIDER_EXECUTION_ENABLED ?? 'false',
    realMediaInputEnabled: process.env.REAL_MEDIA_INPUT_ENABLED ?? 'false',
    rnnoiseEnabled: process.env.RNNOISE_ENABLED ?? 'false',
    demucsEnabled: process.env.DEMUCS_ENABLED ?? 'false',
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

async function ensureDeepFilterNetRuntimeIamBindings(): Promise<string[]> {
  const changes: string[] = []
  for (const plan of buildDeepFilterNetRuntimeIamPlan()) {
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
    'REEDITPRO_CONFIRM_DEEPFILTERNET_RUNTIME=true',
    'REEDITPRO_DEEPFILTERNET_RUNTIME_MODE=generated_audio',
    `REEDITPRO_PHASE36C_RUN_ID=${runId}`,
    `REEDITPRO_DEEPFILTERNET_ARTIFACT_GCS_PATH=${deepFilterNetRuntimeConfig.artifactGcsPath}`,
    `REEDITPRO_DEEPFILTERNET_ARTIFACT_RUNTIME_PATH=${deepFilterNetRuntimeConfig.artifactRuntimePath}`,
    `REEDITPRO_DEEPFILTERNET_CLI_SHA256=${deepFilterNetRuntimeConfig.cliSha256}`,
    `REEDITPRO_DEEPFILTERNET_MODEL_ARCHIVE_SHA256=${deepFilterNetRuntimeConfig.modelArchiveSha256}`,
    `REEDITPRO_DEEPFILTERNET_AGGREGATE_SHA256=${deepFilterNetRuntimeConfig.aggregateSha256}`,
    `REEDITPRO_IMAGE_REF=${imageRef}`,
    `REEDITPRO_IMAGE_DIGEST=${imageDigest}`,
    'GENERATED_AUDIO_ONLY=true',
    'PROVIDER_EXECUTION_ENABLED=false',
    'MODEL_DOWNLOADS_ENABLED=false',
    'REAL_MEDIA_INPUT_ENABLED=false',
    'RNNOISE_ENABLED=false',
    'DEMUCS_ENABLED=false',
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

export function deepFilterNetRuntimeEvidenceToTypeScript(evidence: ApprovedDeepFilterNetRuntimeEvidence): string {
  return [
    'import { deepFilterNetRuntimeConfig } from \'./deepfilternet-runtime-policy\'',
    'import type { ApprovedDeepFilterNetRuntimeEvidence } from \'./deepfilternet-runtime-types\'',
    '',
    'export const approvedDeepFilterNetRuntimeEvidence: ApprovedDeepFilterNetRuntimeEvidence = ' + JSON.stringify(evidence, null, 2),
    '',
    'export function getApprovedDeepFilterNetRuntimeEvidence(): ApprovedDeepFilterNetRuntimeEvidence {',
    '  return {',
    '    ...approvedDeepFilterNetRuntimeEvidence,',
    '    generatedFixture: approvedDeepFilterNetRuntimeEvidence.generatedFixture ? { ...approvedDeepFilterNetRuntimeEvidence.generatedFixture } : undefined,',
    '    phase36DReadiness: { ...approvedDeepFilterNetRuntimeEvidence.phase36DReadiness },',
    '    blockers: [...approvedDeepFilterNetRuntimeEvidence.blockers],',
    '    warnings: [...approvedDeepFilterNetRuntimeEvidence.warnings],',
    '  }',
    '}',
    '',
    'void deepFilterNetRuntimeConfig',
    '',
  ].join('\n')
}
