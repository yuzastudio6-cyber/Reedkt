import { execFile } from 'node:child_process'
import { mkdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { VLM_RUNTIME_EXPECTED_ARTIFACTS } from './vlm-runtime-blocker-policy'
import { sha256File } from './vlm-runtime-checksum-verifier'
import { parseGcloudJson, runGcloud } from './vlm-runtime-gcs-model-resolver'
import { phase39CVlmRuntimeArtifactPrefix, vlmRuntimeConfig } from './vlm-runtime-policy'
import type { VlmRuntimeArtifact, VlmRuntimeExecutionReport } from './vlm-runtime-types'

const execFileAsync = promisify(execFile)

export function phase39CVlmRuntimeImageRef(runId: string): string {
  return `${vlmRuntimeConfig.stagingImagePath}:${runId.toLowerCase()}`
}

export async function buildAndPushVlmRuntimeStagingImage(runId: string): Promise<{
  imageRef: string
  blockers: string[]
  warnings: string[]
}> {
  const imageRef = process.env.REEDITPRO_VLM_RUNTIME_IMAGE_REF || phase39CVlmRuntimeImageRef(runId)
  const blockers: string[] = []
  const warnings: string[] = []
  if (process.env.REEDITPRO_VLM_RUNTIME_IMAGE_REF) {
    if (!imageRef.startsWith(`${vlmRuntimeConfig.stagingImagePath}:`)) {
      return {
        imageRef,
        blockers: [`phase39c_unapproved_staging_image_ref:${imageRef}`],
        warnings,
      }
    }
    warnings.push(`staging_vlm_runtime_image_reused:${imageRef}`)
    return { imageRef, blockers, warnings }
  }
  try {
    await runCommand('docker', [
      'buildx',
      'build',
      '--platform',
      'linux/amd64',
      '--push',
      '--provenance=false',
      '--sbom=false',
      '-f',
      'docker/prod/vlm-runtime/Dockerfile',
      '-t',
      imageRef,
      '.',
    ], 2 * 60 * 60 * 1000)
    warnings.push(`staging_vlm_runtime_image_built_and_pushed:${imageRef}`)
  } catch (error) {
    blockers.push(`phase39c_staging_vlm_runtime_image_build_or_push_failed:${summarizeCommandError(error)}`)
  }
  return { imageRef, blockers, warnings }
}

export async function runVlmRuntimeStagingCloudRunJob(input: {
  runId: string
  reportDir: string
}): Promise<{
  executionReport?: VlmRuntimeExecutionReport
  uploadedArtifacts: VlmRuntimeArtifact[]
  blockers: string[]
  warnings: string[]
  imageRef: string
}> {
  const blockers: string[] = []
  const warnings: string[] = []
  const artifactPrefix = phase39CVlmRuntimeArtifactPrefix(input.runId)
  const imageBuild = await buildAndPushVlmRuntimeStagingImage(input.runId)
  blockers.push(...imageBuild.blockers)
  warnings.push(...imageBuild.warnings)
  if (blockers.length === 0) {
    try {
      await deployVlmRuntimeCloudRunJob({
        runId: input.runId,
        imageRef: imageBuild.imageRef,
        artifactPrefix,
      })
      warnings.push(`staging_cloud_run_job_deployed:${vlmRuntimeConfig.stagingCloudRunJobName}`)
      await runGcloud([
        'run',
        'jobs',
        'execute',
        vlmRuntimeConfig.stagingCloudRunJobName,
        '--project',
        vlmRuntimeConfig.projectId,
        '--region',
        vlmRuntimeConfig.region,
        '--wait',
      ], 3 * 60 * 60 * 1000)
      warnings.push(`staging_cloud_run_job_executed:${vlmRuntimeConfig.stagingCloudRunJobName}`)
    } catch (error) {
      blockers.push(`phase39c_staging_cloud_run_job_failed:${summarizeCommandError(error)}`)
      const diagnostics = await collectLatestCloudRunExecutionDiagnostics()
      blockers.push(...diagnostics.blockers)
      warnings.push(...diagnostics.warnings)
    }
  }

  const download = await downloadVlmRuntimeStagingReports({
    reportDir: input.reportDir,
    artifactPrefix,
  })
  blockers.push(...download.blockers)
  warnings.push(...download.warnings)
  return {
    executionReport: download.executionReport,
    uploadedArtifacts: download.uploadedArtifacts,
    blockers: Array.from(new Set(blockers)),
    warnings: Array.from(new Set(warnings)),
    imageRef: imageBuild.imageRef,
  }
}

async function deployVlmRuntimeCloudRunJob(input: {
  runId: string
  imageRef: string
  artifactPrefix: string
}): Promise<void> {
  const jobEnv = serializeEnvVars({
    GCP_PROJECT_ID: vlmRuntimeConfig.projectId,
    GCP_REGION: vlmRuntimeConfig.region,
    REEDITPRO_ENV: vlmRuntimeConfig.env,
    REEDITPRO_PHASE39C_RUN_ID: input.runId,
    REEDITPRO_VLM_MODEL_GCS_PATH: vlmRuntimeConfig.modelGcsPath,
    REEDITPRO_VLM_MODEL_REVISION: vlmRuntimeConfig.modelRevision,
    REEDITPRO_VLM_AGGREGATE_SHA256: vlmRuntimeConfig.aggregateSha256,
    REEDITPRO_PHASE39C_QA_BUCKET: vlmRuntimeConfig.qaBucket,
    REEDITPRO_PHASE39C_QA_PREFIX: input.artifactPrefix,
    REEDITPRO_CONFIRM_VLM_PRIVATE_GCS_READ: 'true',
    REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE: 'true',
    REEDITPRO_CONFIRM_VLM_RUNTIME_ARTIFACT_UPLOAD: 'true',
    REEDITPRO_CONFIRM_VLM_L4_GPU_EXECUTE: 'true',
    GENERATED_VLM_FIXTURES_ONLY: 'true',
    HF_HUB_OFFLINE: '1',
    TRANSFORMERS_OFFLINE: '1',
    HF_HUB_DISABLE_TELEMETRY: '1',
    MODEL_DOWNLOADS_ENABLED: 'false',
    RAW_VLM_PROMPT_ENABLED: 'false',
    PROVIDER_EXECUTION_ENABLED: 'false',
    MEDIA_PROCESSING_ENABLED: 'false',
    REAL_MEDIA_INPUT_ENABLED: 'false',
    ARBITRARY_MEDIA_INPUT_ENABLED: 'false',
    PUBLIC_OUTPUT_ENABLED: 'false',
    REEDITPRO_PRODUCTION_READY: 'false',
    REEDITPRO_INTERNAL_BETA_READY: 'false',
    REEDITPRO_EXTERNAL_BETA_READY: 'false',
    REEDITPRO_BROAD_REAL_MEDIA_READY: 'false',
    TRACK_A_EXECUTION_ENABLED: 'false',
    VLLM_WORKER_MULTIPROC_METHOD: 'spawn',
  })
  await runGcloud([
    'run',
    'jobs',
    'deploy',
    vlmRuntimeConfig.stagingCloudRunJobName,
    '--project',
    vlmRuntimeConfig.projectId,
    '--region',
    vlmRuntimeConfig.region,
    '--image',
    input.imageRef,
    '--service-account',
    vlmRuntimeConfig.serviceAccountEmail,
    '--tasks',
    '1',
    '--parallelism',
    '1',
    '--max-retries',
    '0',
    '--task-timeout',
    '3600s',
    '--cpu',
    '8',
    '--memory',
    '32Gi',
    '--gpu',
    '1',
    '--gpu-type',
    'nvidia-l4',
    '--no-gpu-zonal-redundancy',
    '--set-env-vars',
    jobEnv,
  ], 30 * 60 * 1000)
}

async function downloadVlmRuntimeStagingReports(input: {
  reportDir: string
  artifactPrefix: string
}): Promise<{
  executionReport?: VlmRuntimeExecutionReport
  uploadedArtifacts: VlmRuntimeArtifact[]
  blockers: string[]
  warnings: string[]
}> {
  const blockers: string[] = []
  const warnings: string[] = []
  const uploadedArtifacts: VlmRuntimeArtifact[] = []
  await mkdir(input.reportDir, { recursive: true })
  for (const fileName of VLM_RUNTIME_EXPECTED_ARTIFACTS) {
    const object = `${input.artifactPrefix}/${fileName}`
    const gcsUri = `gs://${vlmRuntimeConfig.qaBucket}/${object}`
    const localPath = path.join(input.reportDir, fileName)
    try {
      await runGcloud(['storage', 'cp', gcsUri, localPath])
      const described = parseGcloudJson(await runGcloud(['storage', 'objects', 'describe', gcsUri, '--format=json'])) as Record<string, unknown>
      const fileStat = await stat(localPath)
      uploadedArtifacts.push({
        id: fileName.replace(/[^0-9A-Za-z_-]+/g, '_'),
        kind: 'report',
        localPath,
        bucket: vlmRuntimeConfig.qaBucket,
        object,
        gcsUri,
        sizeBytes: fileStat.size,
        sha256: await sha256File(localPath),
        generation: typeof described.generation === 'string' ? described.generation : undefined,
        metageneration: typeof described.metageneration === 'string' ? described.metageneration : undefined,
        crc32c: typeof described.crc32c === 'string' ? described.crc32c : undefined,
        md5Hash: typeof described.md5Hash === 'string' ? described.md5Hash : undefined,
      })
    } catch (error) {
      blockers.push(`phase39c_staging_artifact_fetch_or_verify_failed:${fileName}:${summarizeCommandError(error)}`)
    }
  }
  let executionReport: VlmRuntimeExecutionReport | undefined
  try {
    executionReport = JSON.parse(await readFile(path.join(input.reportDir, 'phase_39c_generated_vlm_runtime_report.json'), 'utf8')) as VlmRuntimeExecutionReport
  } catch (error) {
    blockers.push(`phase39c_staging_final_report_unreadable:${summarizeCommandError(error)}`)
  }
  return {
    executionReport,
    uploadedArtifacts,
    blockers: Array.from(new Set(blockers)),
    warnings,
  }
}

async function collectLatestCloudRunExecutionDiagnostics(): Promise<{
  blockers: string[]
  warnings: string[]
}> {
  const blockers: string[] = []
  const warnings: string[] = []
  try {
    const executions = parseGcloudJson(await runGcloud([
      'run',
      'jobs',
      'executions',
      'list',
      '--job',
      vlmRuntimeConfig.stagingCloudRunJobName,
      '--region',
      vlmRuntimeConfig.region,
      '--project',
      vlmRuntimeConfig.projectId,
      '--limit',
      '1',
      '--format=json',
    ])) as Array<Record<string, unknown>>
    const execution = executions[0]
    const metadata = execution?.metadata as { name?: string } | undefined
    const executionName = metadata?.name
    const status = execution?.status as { conditions?: Array<{ type?: string; status?: string; reason?: string; message?: string }> } | undefined
    for (const condition of status?.conditions ?? []) {
      if (condition.status === 'False') blockers.push(`phase39c_cloud_run_execution_condition:${condition.type}:${condition.reason ?? 'unknown'}:${condition.message ?? ''}`.slice(0, 900))
      else if (condition.message) warnings.push(`phase39c_cloud_run_execution_condition:${condition.type}:${condition.message}`.slice(0, 900))
    }
    if (!executionName) return { blockers, warnings }
    const logFilter = [
      'resource.type="cloud_run_job"',
      `labels."run.googleapis.com/execution_name"="${executionName}"`,
    ].join(' AND ')
    const logs = parseGcloudJson(await runGcloud([
      'logging',
      'read',
      logFilter,
      '--project',
      vlmRuntimeConfig.projectId,
      '--limit',
      '80',
      '--format=json',
    ], 5 * 60 * 1000)) as Array<Record<string, unknown>>
    for (const entry of logs) {
      const payload = entry.jsonPayload as { blockers?: string[]; warnings?: string[] } | undefined
      for (const blocker of payload?.blockers ?? []) blockers.push(`phase39c_cloud_run_worker_blocker:${blocker}`.slice(0, 900))
      for (const warning of payload?.warnings ?? []) warnings.push(`phase39c_cloud_run_worker_warning:${warning}`.slice(0, 900))
      const textPayload = typeof entry.textPayload === 'string' ? entry.textPayload : ''
      if (/exit\(1\)|error|failed/i.test(textPayload)) blockers.push(`phase39c_cloud_run_log:${textPayload}`.slice(0, 900))
    }
  } catch (error) {
    warnings.push(`phase39c_cloud_run_diagnostics_unavailable:${summarizeCommandError(error)}`)
  }
  return {
    blockers: Array.from(new Set(blockers)),
    warnings: Array.from(new Set(warnings)),
  }
}

async function runCommand(command: string, args: string[], timeout: number): Promise<void> {
  await execFileAsync(command, args, {
    timeout,
    maxBuffer: 120 * 1024 * 1024,
    env: {
      ...process.env,
      CLOUDSDK_CORE_DISABLE_PROMPTS: '1',
    },
  })
}

function serializeEnvVars(values: Record<string, string>): string {
  return Object.entries(values)
    .map(([key, value]) => `${key}=${value.replaceAll(',', '\\,')}`)
    .join(',')
}

function summarizeCommandError(error: unknown): string {
  const maybe = error as { message?: string; stderr?: string; stdout?: string }
  return String(maybe?.stderr || maybe?.stdout || maybe?.message || error).replace(/\s+/g, ' ').slice(0, 900)
}
