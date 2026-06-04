import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import {
  writeVlmRuntimeJsonArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import {
  SIGNALSMITH_CONTROLLED_PRIVATE_GCS_PREFIX,
  SIGNALSMITH_CONTROLLED_REPORT_DIR,
  SIGNALSMITH_CONTROLLED_RUN_ID,
  SIGNALSMITH_CONTROLLED_SAMPLE,
  buildSignalsmithControlledRuntimeCostSummary,
  getSignalsmithControlledRuntimePlan,
  readSignalsmithControlledRuntimeSummary,
} from './controlled'

const execFileAsync = promisify(execFile)

type JsonRecord = Record<string, unknown>
type PhaseStatus = 'passed' | 'blocked' | 'warning' | 'not_run' | 'skipped'
type CommandResult = Awaited<ReturnType<typeof runCommand>>

export const SIGNALSMITH_CONTROLLED_FFMPEG_IMAGE = `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/signalsmith-controlled-runtime-phase36j:${SIGNALSMITH_CONTROLLED_RUN_ID}`
export const SIGNALSMITH_CONTROLLED_FFMPEG_JOB = 'reeditpro-stg-signalsmith-controlled-runtime-phase36j'

const PROJECT_ID = 'reeditpro'
const REGION = 'us-central1'
const SERVICE_ACCOUNT = 'reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com'
const CLOUD_BUILD_CONFIG = 'cloudbuild/signalsmith-controlled-runtime-phase36j.yaml'
const CLOUD_BUILD_IGNORE = 'cloudbuild/signalsmith-controlled-runtime-phase36j.gcloudignore'
const DOCKERFILE = 'docker/prod/signalsmith-controlled-runtime/Dockerfile.phase36j'

const SIGNALSMITH_REPO_URL = 'https://github.com/Signalsmith-Audio/signalsmith-stretch.git'
const SIGNALSMITH_TAG = '1.1.0'
const SIGNALSMITH_COMMIT = '44c8f865af9da8c29cc4a70a2d5a3ec83639c711'

const RUNTIME_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_SIGNALSMITH_CONTROLLED_REAL_AUDIO',
  'REEDITPRO_CONFIRM_SIGNALSMITH_CONTROLLED_MEDIA_READ',
  'REEDITPRO_CONFIRM_SIGNALSMITH_CONTROLLED_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_SIGNALSMITH_PRIVATE_ARTIFACT_UPLOAD',
  'REEDITPRO_CONFIRM_SIGNALSMITH_SOURCE_FETCH',
  'REEDITPRO_CONFIRM_SIGNALSMITH_RUNTIME_BUILD',
]

const FORBIDDEN_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_SIGNALSMITH_GENERATED_AUDIO',
  'REEDITPRO_CONFIRM_BROAD_MEDIA_PROCESSING',
  'REEDITPRO_CONFIRM_ARBITRARY_MEDIA_INPUT',
  'REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_OCR_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_DEMUCS_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_DEEPFILTERNET_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_TRACK_A_RUNTIME',
]

const DOWNLOADED_WORKER_REPORTS = [
  'phase_36j_signalsmith_controlled_ffmpeg_runtime_smoke_report.json',
  'phase_36j_worker_source_fetch.json',
  'phase_36j_worker_build.json',
  'phase_36j_worker_binary.json',
  'phase_36j_worker_sample_evidence.json',
  'phase_36j_worker_extraction.json',
  'phase_36j_worker_controlled_stretch.json',
  'phase_36j_worker_audio_metrics.json',
  'phase_36j_private_artifact_manifest.json',
  'phase_36j_worker_result.json',
  'phase_36j_signalsmith_controlled_cloud_worker_command.json',
]

export function getSignalsmithControlledFfmpegRuntimePlan() {
  const basePlan = getSignalsmithControlledRuntimePlan()
  return {
    ...basePlan,
    ffmpegRuntimeCompletion: {
      status: 'planned',
      reason: 'local ffmpeg/ffprobe unavailable; use private linux/amd64 CPU Cloud Run Job',
      image: SIGNALSMITH_CONTROLLED_FFMPEG_IMAGE,
      jobName: SIGNALSMITH_CONTROLLED_FFMPEG_JOB,
      projectId: PROJECT_ID,
      region: REGION,
      serviceAccount: SERVICE_ACCOUNT,
      cpu: 4,
      memory: '8Gi',
      gpu: 'blocked',
      publicService: false,
      productionTraffic: false,
      dockerfile: DOCKERFILE,
      cloudBuildConfig: CLOUD_BUILD_CONFIG,
      gcloudIgnore: CLOUD_BUILD_IGNORE,
      workerEntrypoint: 'server/workers/signalsmith-stretch-runtime/linux_controlled_entrypoint.py',
    },
    commandPlan: buildSignalsmithControlledFfmpegCommandPlan(),
  }
}

export function buildSignalsmithControlledFfmpegCommandPlan() {
  return [
    {
      commandId: 'ffmpeg-runtime-preflight',
      phase: 'preflight',
      commandString: [
        'gcloud config get-value project',
        `gcloud storage objects describe ${SIGNALSMITH_CONTROLLED_SAMPLE.sourceGcsUri}`,
        'gcloud builds list --limit=1',
        'gcloud run jobs list --region=us-central1',
      ].join(' && '),
      requiresConfirmation: false,
      textOnlyByDefault: true,
    },
    {
      commandId: 'cloud-build-signalsmith-controlled-image',
      phase: 'build',
      commandString: `gcloud builds submit --project ${PROJECT_ID} --config ${CLOUD_BUILD_CONFIG} --ignore-file ${CLOUD_BUILD_IGNORE} --substitutions _IMAGE=${SIGNALSMITH_CONTROLLED_FFMPEG_IMAGE} .`,
      requiresConfirmation: true,
      requiredConfirmations: ['REEDITPRO_CONFIRM_SIGNALSMITH_CLOUD_BUILD', 'REEDITPRO_CONFIRM_SIGNALSMITH_DOCKER_PUSH'],
      textOnlyByDefault: true,
    },
    {
      commandId: 'deploy-cloud-run-job',
      phase: 'deploy',
      commandString: `gcloud run jobs deploy ${SIGNALSMITH_CONTROLLED_FFMPEG_JOB} --project ${PROJECT_ID} --region ${REGION} --image ${SIGNALSMITH_CONTROLLED_FFMPEG_IMAGE} --service-account ${SERVICE_ACCOUNT} --cpu=4 --memory=8Gi --tasks=1 --parallelism=1 --max-retries=0 --task-timeout=1800s --set-env-vars <phase36j-safe-env>`,
      requiresConfirmation: true,
      requiredConfirmations: ['REEDITPRO_CONFIRM_SIGNALSMITH_STAGING_CLOUD_RUN_JOB', 'REEDITPRO_CONFIRM_SIGNALSMITH_CPU_WORKER_EXECUTE'],
      textOnlyByDefault: true,
    },
    {
      commandId: 'execute-cloud-run-job',
      phase: 'execute',
      commandString: `gcloud run jobs execute ${SIGNALSMITH_CONTROLLED_FFMPEG_JOB} --project ${PROJECT_ID} --region ${REGION} --wait`,
      requiresConfirmation: true,
      requiredConfirmations: RUNTIME_CONFIRMATIONS,
      textOnlyByDefault: true,
    },
  ]
}

export async function writeSignalsmithControlledFfmpegStaticArtifacts(reportDir = SIGNALSMITH_CONTROLLED_REPORT_DIR): Promise<void> {
  const preflight = await runSignalsmithControlledFfmpegPreflight()
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36j_signalsmith_controlled_ffmpeg_runtime_smoke_report.json'), {
    phase: '36J',
    runId: SIGNALSMITH_CONTROLLED_RUN_ID,
    status: 'not_run',
    reason: 'Cloud ffmpeg runtime not executed in static report mode.',
    localPreflightStatus: preflight.status,
  })
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36j_signalsmith_controlled_cloud_build_report.json'), buildStatusReport('phase_36j_signalsmith_controlled_cloud_build_report', 'not_run', ['Cloud Build not executed.']))
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36j_signalsmith_controlled_cloud_run_job_report.json'), buildStatusReport('phase_36j_signalsmith_controlled_cloud_run_job_report', 'not_run', ['Cloud Run Job not executed.']))
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36j_signalsmith_controlled_runtime_image_report.json'), buildStatusReport('phase_36j_signalsmith_controlled_runtime_image_report', 'not_run', ['Runtime image not built.']))
}

export async function executeSignalsmithControlledFfmpegRuntime(input: {
  reportDir?: string
  cloudBuildOnly?: boolean
  cloudRunOnly?: boolean
  smokeOnly?: boolean
} = {}) {
  const reportDir = input.reportDir ?? SIGNALSMITH_CONTROLLED_REPORT_DIR
  requireFfmpegConfirmations({ build: !input.cloudRunOnly && !input.smokeOnly, run: !input.cloudBuildOnly })
  const preflight = await runSignalsmithControlledFfmpegPreflight()
  if (input.smokeOnly || preflight.status !== 'passed') {
    await writeFfmpegReports(reportDir, {
      preflight,
      cloudBuild: buildStatusReport('phase_36j_signalsmith_controlled_cloud_build_report', input.smokeOnly ? 'skipped' : 'blocked', collectBlockers(preflight)),
      cloudRunJob: buildStatusReport('phase_36j_signalsmith_controlled_cloud_run_job_report', 'not_run', collectBlockers(preflight)),
      imageReport: buildStatusReport('phase_36j_signalsmith_controlled_runtime_image_report', 'not_run', collectBlockers(preflight)),
      downloaded: {},
    })
    return readSignalsmithControlledRuntimeSummary(reportDir)
  }

  const cloudBuild = input.cloudRunOnly
    ? await readExistingCloudBuildReport(reportDir)
    : await runCloudBuild()
  const imageReport = cloudBuild.status === 'passed' || input.cloudRunOnly
    ? await describeRuntimeImage()
    : buildStatusReport('phase_36j_signalsmith_controlled_runtime_image_report', 'blocked', collectBlockers(cloudBuild))

  if (input.cloudBuildOnly || cloudBuild.status !== 'passed') {
    await writeFfmpegReports(reportDir, {
      preflight,
      cloudBuild,
      cloudRunJob: buildStatusReport('phase_36j_signalsmith_controlled_cloud_run_job_report', input.cloudBuildOnly ? 'skipped' : 'blocked', collectBlockers(cloudBuild)),
      imageReport,
      downloaded: {},
    })
    return readSignalsmithControlledRuntimeSummary(reportDir)
  }

  const cloudRunJob = await runCloudRunJob()
  const downloaded = cloudRunJob.status === 'passed' ? await downloadSafeWorkerReports(reportDir) : {}
  await writeFfmpegReports(reportDir, { preflight, cloudBuild, cloudRunJob, imageReport, downloaded })
  return readSignalsmithControlledRuntimeSummary(reportDir)
}

async function readExistingCloudBuildReport(reportDir: string): Promise<JsonRecord> {
  const reportPath = path.join(reportDir, 'phase_36j_signalsmith_controlled_cloud_build_report.json')
  if (!existsSync(reportPath)) {
    return buildStatusReport('phase_36j_signalsmith_controlled_cloud_build_report', 'blocked', ['phase36j_cloud_build_report_missing_for_cloud_run_only_mode'])
  }
  try {
    const report = JSON.parse(await readFile(reportPath, 'utf8')) as JsonRecord
    if (report.status === 'passed') return report
    return buildStatusReport('phase_36j_signalsmith_controlled_cloud_build_report', 'blocked', ['phase36j_cloud_build_not_passed_before_cloud_run_only_mode'])
  } catch {
    return buildStatusReport('phase_36j_signalsmith_controlled_cloud_build_report', 'blocked', ['phase36j_cloud_build_report_unreadable_for_cloud_run_only_mode'])
  }
}

async function runSignalsmithControlledFfmpegPreflight(): Promise<JsonRecord> {
  const [activeAccount, activeProject, builds, artifactRepo, runJobs, sampleObject, qaBucket] = await Promise.all([
    runCommand('gcloud', ['--quiet', 'auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
    runCommand('gcloud', ['--quiet', 'config', 'get-value', 'project']),
    runCommand('gcloud', ['--quiet', 'builds', 'list', '--limit=1', '--format=json']),
    runCommand('gcloud', ['--quiet', 'artifacts', 'repositories', 'describe', 'reeditpro-staging-workers', '--location', REGION, '--format=json']),
    runCommand('gcloud', ['--quiet', 'run', 'jobs', 'list', '--region', REGION, '--format=json']),
    runCommand('gcloud', ['--quiet', 'storage', 'objects', 'describe', SIGNALSMITH_CONTROLLED_SAMPLE.sourceGcsUri, '--format=value(size)']),
    runCommand('gcloud', ['--quiet', 'storage', 'buckets', 'describe', 'gs://reeditpro-staging-reeditpro-qa-artifacts', '--format=value(name)']),
  ])
  const blockers: string[] = []
  if (!activeAccount.stdout.trim()) blockers.push('gcloud_active_account_missing')
  if (!activeProject.stdout.includes(PROJECT_ID)) blockers.push('gcloud_project_not_reeditpro')
  if (builds.status !== 'passed') blockers.push('cloud_build_unavailable')
  if (artifactRepo.status !== 'passed') blockers.push('artifact_registry_repo_unavailable')
  if (runJobs.status !== 'passed') blockers.push('cloud_run_jobs_unavailable')
  if (Number(sampleObject.stdout.trim()) <= 0) blockers.push('approved_controlled_sample_private_object_unavailable')
  if (!qaBucket.stdout.includes('reeditpro-staging-reeditpro-qa-artifacts')) blockers.push('qa_artifact_bucket_unavailable')
  return {
    phase: '36J',
    runId: SIGNALSMITH_CONTROLLED_RUN_ID,
    status: blockers.length ? 'blocked' : 'passed',
    activePrincipal: activeAccount.stdout.trim().split(/\r?\n/).filter(Boolean).at(-1) ?? '',
    activeProject: activeProject.stdout.trim().split(/\r?\n/).filter(Boolean).at(-1) ?? '',
    cloudBuildStatus: builds.status,
    artifactRegistryStatus: artifactRepo.status,
    cloudRunJobsStatus: runJobs.status,
    controlledSampleStatus: sampleObject.status,
    qaBucketStatus: qaBucket.status,
    blockers,
    warnings: ['Preflight is non-mutating and does not read media bytes.'],
  }
}

async function runCloudBuild(): Promise<JsonRecord> {
  const output = await runCommand('gcloud', [
    'builds',
    'submit',
    '--quiet',
    '--project',
    PROJECT_ID,
    '--config',
    CLOUD_BUILD_CONFIG,
    '--ignore-file',
    CLOUD_BUILD_IGNORE,
    '--substitutions',
    `_IMAGE=${SIGNALSMITH_CONTROLLED_FFMPEG_IMAGE}`,
    '.',
  ], 90 * 60 * 1000)
  const imageDescribe = output.status === 'passed'
    ? await runCommand('gcloud', ['artifacts', 'docker', 'images', 'describe', SIGNALSMITH_CONTROLLED_FFMPEG_IMAGE, '--format=json'], 120000)
    : buildCommandResult('blocked', '', 'cloud build did not pass', 0)
  const blockers: string[] = []
  if (output.status !== 'passed') blockers.push('phase36j_signalsmith_cloud_build_failed')
  if (imageDescribe.status !== 'passed') blockers.push('phase36j_signalsmith_artifact_registry_image_describe_failed')
  return {
    phase: '36J',
    runId: SIGNALSMITH_CONTROLLED_RUN_ID,
    status: blockers.length ? 'blocked' : 'passed',
    image: SIGNALSMITH_CONTROLLED_FFMPEG_IMAGE,
    imageDigest: parseDigest(imageDescribe.stdout),
    buildOutput: summarizeCommand(output),
    imageDescribe: summarizeCommand(imageDescribe),
    blockers,
  }
}

async function describeRuntimeImage(): Promise<JsonRecord> {
  const imageDescribe = await runCommand('gcloud', ['artifacts', 'docker', 'images', 'describe', SIGNALSMITH_CONTROLLED_FFMPEG_IMAGE, '--format=json'], 120000)
  return {
    phase: '36J',
    runId: SIGNALSMITH_CONTROLLED_RUN_ID,
    status: imageDescribe.status,
    image: SIGNALSMITH_CONTROLLED_FFMPEG_IMAGE,
    imageDigest: parseDigest(imageDescribe.stdout),
    imageDescribe: summarizeCommand(imageDescribe),
    blockers: imageDescribe.status === 'passed' ? [] : ['phase36j_signalsmith_artifact_registry_image_describe_failed'],
  }
}

async function runCloudRunJob(): Promise<JsonRecord> {
  const envVars = buildRuntimeEnvVars()
  const deploy = await runCommand('gcloud', [
    'run',
    'jobs',
    'deploy',
    SIGNALSMITH_CONTROLLED_FFMPEG_JOB,
    '--quiet',
    '--project',
    PROJECT_ID,
    '--region',
    REGION,
    '--image',
    SIGNALSMITH_CONTROLLED_FFMPEG_IMAGE,
    '--service-account',
    SERVICE_ACCOUNT,
    '--cpu=4',
    '--memory=8Gi',
    '--tasks=1',
    '--parallelism=1',
    '--max-retries=0',
    '--task-timeout=1800s',
    '--set-env-vars',
    envVars,
  ], 15 * 60 * 1000)
  const execute = deploy.status === 'passed'
    ? await runCommand('gcloud', ['run', 'jobs', 'execute', SIGNALSMITH_CONTROLLED_FFMPEG_JOB, '--quiet', '--project', PROJECT_ID, '--region', REGION, '--wait'], 45 * 60 * 1000)
    : buildCommandResult('blocked', '', 'deploy did not pass', 0)
  const executionId = parseExecutionId(execute.stdout) ?? parseExecutionId(execute.stderr)
  const executionLogs = execute.status === 'passed' || !executionId
    ? buildCommandResult('skipped', '', '', 0)
    : await readCloudRunExecutionLogs(executionId)
  const blockers: string[] = []
  if (deploy.status !== 'passed') blockers.push('phase36j_signalsmith_cloud_run_job_deploy_failed')
  if (execute.status !== 'passed') blockers.push('phase36j_signalsmith_cloud_run_job_execute_failed')
  if (executionLogs.stdout.includes('phase36j_private_artifact_upload_failed')) blockers.push('phase36j_private_artifact_upload_failed')
  if (executionLogs.stdout.includes('does not have storage.objects.get access')) blockers.push('phase36j_cpu_worker_qa_prefix_storage_objects_get_missing')
  return {
    phase: '36J',
    runId: SIGNALSMITH_CONTROLLED_RUN_ID,
    status: blockers.length ? 'blocked' : 'passed',
    jobName: SIGNALSMITH_CONTROLLED_FFMPEG_JOB,
    executionId,
    privateArtifactPrefix: SIGNALSMITH_CONTROLLED_PRIVATE_GCS_PREFIX,
    deploy: summarizeCommand(deploy),
    execute: summarizeCommand(execute),
    executionLogs: summarizeCommand(executionLogs),
    blockers,
  }
}

async function readCloudRunExecutionLogs(executionId: string): Promise<CommandResult> {
  return runCommand('gcloud', [
    '--quiet',
    'logging',
    'read',
    `resource.type="cloud_run_job" AND resource.labels.job_name="${SIGNALSMITH_CONTROLLED_FFMPEG_JOB}" AND labels."run.googleapis.com/execution_name"="${executionId}" AND (logName="projects/${PROJECT_ID}/logs/run.googleapis.com%2Fstdout" OR logName="projects/${PROJECT_ID}/logs/run.googleapis.com%2Fstderr")`,
    '--project',
    PROJECT_ID,
    '--limit=120',
    '--format=value(textPayload)',
  ], 120000)
}

async function downloadSafeWorkerReports(reportDir: string): Promise<JsonRecord> {
  await mkdir(reportDir, { recursive: true })
  const downloaded: JsonRecord = {}
  for (const reportFile of DOWNLOADED_WORKER_REPORTS) {
    const destination = path.join(reportDir, reportFile)
    const cp = await runCommand('gcloud', [
      '--quiet',
      'storage',
      'cp',
      `${SIGNALSMITH_CONTROLLED_PRIVATE_GCS_PREFIX}reports/${reportFile}`,
      destination,
    ], 120000)
    if (cp.status === 'passed' && existsSync(destination)) {
      downloaded[reportFile] = await readJson(destination)
    }
  }
  return downloaded
}

async function writeFfmpegReports(reportDir: string, input: {
  preflight: JsonRecord
  cloudBuild: JsonRecord
  cloudRunJob: JsonRecord
  imageReport: JsonRecord
  downloaded: JsonRecord
}) {
  await mkdir(reportDir, { recursive: true })
  const worker = getDownloaded(input.downloaded, 'phase_36j_worker_result.json')
  const smoke = getDownloaded(input.downloaded, 'phase_36j_signalsmith_controlled_ffmpeg_runtime_smoke_report.json')
    ?? buildStatusReport('phase_36j_signalsmith_controlled_ffmpeg_runtime_smoke_report', input.cloudRunJob.status === 'passed' ? 'blocked' : 'not_run', ['ffmpeg_runtime_smoke_report_not_downloaded'])
  const sample = worker?.sampleEvidence as JsonRecord | undefined
  const extraction = worker?.extractionReport as JsonRecord | undefined
  const stretch = worker?.controlledStretchReport as JsonRecord | undefined
  const metrics = worker?.audioMetricsReport as JsonRecord | undefined
  const privateManifest = (worker?.privateArtifactManifest as JsonRecord | undefined)
    ?? getDownloaded(input.downloaded, 'phase_36j_private_artifact_manifest.json')
    ?? buildStatusReport('phase_36j_private_artifact_manifest', 'not_run', ['private_artifact_manifest_not_downloaded'])
  const finalPassed = (
    input.preflight.status === 'passed'
    && input.cloudBuild.status === 'passed'
    && input.cloudRunJob.status === 'passed'
    && smoke.status === 'passed'
    && worker?.status === 'passed'
    && privateManifest.status === 'passed'
  )
  const blockers = uniqueStrings([
    ...collectBlockers(input.preflight),
    ...collectBlockers(input.cloudBuild),
    ...collectBlockers(input.cloudRunJob),
    ...collectBlockers(input.imageReport),
    ...collectBlockers(smoke),
    ...collectBlockers(worker ?? {}),
    ...collectBlockers(privateManifest),
    ...(!finalPassed && worker === undefined ? ['phase36j_worker_result_not_downloaded'] : []),
  ])
  const betaStatus = finalPassed ? 'phase-complete but tool-family incomplete' : 'blocked'
  const finalReport = {
    phase: '36J',
    runId: SIGNALSMITH_CONTROLLED_RUN_ID,
    status: finalPassed ? 'passed' : 'blocked',
    audioTimingToolFamilyBetaStatus: betaStatus,
    phase36HEvidenceStatus: 'loaded',
    phase36IEvidenceStatus: 'loaded',
    controlledSampleEvidenceStatus: String(worker?.controlledSampleEvidenceStatus ?? sample?.status ?? 'not_run'),
    runtimePreflightStatus: String(input.preflight.status ?? 'unknown'),
    ffmpegRuntimeStatus: String(smoke.status ?? 'unknown'),
    cloudBuildStatus: String(input.cloudBuild.status ?? 'unknown'),
    cloudRunJobStatus: String(input.cloudRunJob.status ?? 'unknown'),
    extractionStatus: String(worker?.extractionStatus ?? extraction?.status ?? 'not_run'),
    controlledStretchStatus: String(worker?.controlledStretchStatus ?? stretch?.status ?? 'not_run'),
    audioQaStatus: String(worker?.audioQaStatus ?? metrics?.status ?? 'not_run'),
    privateArtifactStatus: String(privateManifest.status ?? 'not_run'),
    selectedSample: SIGNALSMITH_CONTROLLED_SAMPLE,
    privateArtifactPrefix: SIGNALSMITH_CONTROLLED_PRIVATE_GCS_PREFIX,
    runtimeImage: SIGNALSMITH_CONTROLLED_FFMPEG_IMAGE,
    runtimeJob: SIGNALSMITH_CONTROLLED_FFMPEG_JOB,
    blockers,
    blockedScopes: getSignalsmithControlledRuntimePlan().blockedScopes,
    nextPhaseDecision: finalPassed
      ? 'Proceed to Phase 36K Demucs provenance approval retry or audio/timing beta-readiness decision gate if Demucs remains explicitly out of internal scope.'
      : 'Resolve exact Phase 36J ffmpeg/runtime blocker before Demucs or audio/timing beta gate.',
  }
  const reportMap: Record<string, unknown> = {
    'phase_36j_signalsmith_controlled_ffmpeg_runtime_smoke_report.json': smoke,
    'phase_36j_signalsmith_controlled_cloud_build_report.json': input.cloudBuild,
    'phase_36j_signalsmith_controlled_cloud_run_job_report.json': input.cloudRunJob,
    'phase_36j_signalsmith_controlled_runtime_image_report.json': input.imageReport,
    'phase_36j_controlled_timing_stretch_sample_evidence.json': sample ?? buildStatusReport('phase_36j_controlled_timing_stretch_sample_evidence', 'not_run', ['controlled_sample_not_verified']),
    'phase_36j_controlled_audio_extraction_report.json': extraction ?? buildStatusReport('phase_36j_controlled_audio_extraction_report', 'not_run', ['controlled_audio_not_extracted']),
    'phase_36j_signalsmith_controlled_stretch_report.json': stretch ?? buildStatusReport('phase_36j_signalsmith_controlled_stretch_report', 'not_run', ['controlled_stretch_not_run']),
    'phase_36j_signalsmith_controlled_audio_metrics_report.json': metrics ?? buildStatusReport('phase_36j_signalsmith_controlled_audio_metrics_report', 'not_run', ['controlled_audio_metrics_not_run']),
    'phase_36j_private_artifact_manifest.json': privateManifest,
    'phase_36j_controlled_real_media_timing_stretch_report.json': finalReport,
    'phase_36j_audio_timing_beta_status_report.json': {
      phase: '36J',
      runId: SIGNALSMITH_CONTROLLED_RUN_ID,
      status: finalReport.status,
      audioTimingToolFamilyBetaStatus: betaStatus,
      internalBetaReady: false,
      externalBetaReady: false,
      productionReady: false,
    },
    'phase_36j_blocker_report.json': {
      phase: '36J',
      runId: SIGNALSMITH_CONTROLLED_RUN_ID,
      status: blockers.length ? 'blocked' : 'passed_no_required_blockers',
      blockers,
      blockedScopes: finalReport.blockedScopes,
    },
  }
  for (const [file, value] of Object.entries(reportMap)) {
    await writeVlmRuntimeJsonArtifact(path.join(reportDir, file), value)
  }
}

function requireFfmpegConfirmations(input: { build: boolean; run: boolean }) {
  const required = [
    ...(input.build ? ['REEDITPRO_CONFIRM_SIGNALSMITH_CLOUD_BUILD', 'REEDITPRO_CONFIRM_SIGNALSMITH_DOCKER_PUSH'] : []),
    ...(input.run ? ['REEDITPRO_CONFIRM_SIGNALSMITH_STAGING_CLOUD_RUN_JOB', 'REEDITPRO_CONFIRM_SIGNALSMITH_CPU_WORKER_EXECUTE', ...RUNTIME_CONFIRMATIONS] : []),
  ]
  const missing = required.filter((name) => process.env[name] !== 'true')
  const forbidden = FORBIDDEN_CONFIRMATIONS.filter((name) => process.env[name] === 'true')
  if (missing.length || forbidden.length) {
    throw new Error(`signalsmith_ffmpeg_runtime_confirmation_gate_failed missing=${missing.join(',')} forbidden=${forbidden.join(',')}`)
  }
}

function buildRuntimeEnvVars(): string {
  const env: Record<string, string> = {
    REEDITPRO_CONFIRM_SIGNALSMITH_CONTROLLED_REAL_AUDIO: 'true',
    REEDITPRO_CONFIRM_SIGNALSMITH_CONTROLLED_MEDIA_READ: 'true',
    REEDITPRO_CONFIRM_SIGNALSMITH_CONTROLLED_RUNTIME_EXECUTE: 'true',
    REEDITPRO_CONFIRM_SIGNALSMITH_PRIVATE_ARTIFACT_UPLOAD: 'true',
    REEDITPRO_CONFIRM_SIGNALSMITH_SOURCE_FETCH: 'true',
    REEDITPRO_CONFIRM_SIGNALSMITH_RUNTIME_BUILD: 'true',
    REEDITPRO_PHASE36J_RUN_ID: SIGNALSMITH_CONTROLLED_RUN_ID,
    REEDITPRO_PHASE36J_PRIVATE_ARTIFACT_PREFIX: SIGNALSMITH_CONTROLLED_PRIVATE_GCS_PREFIX,
    REEDITPRO_PHASE36J_CONTROLLED_SAMPLE_URI: SIGNALSMITH_CONTROLLED_SAMPLE.sourceGcsUri,
    REEDITPRO_PHASE36J_CONTROLLED_SAMPLE_SHA256: SIGNALSMITH_CONTROLLED_SAMPLE.sourceSha256,
    REEDITPRO_PHASE36J_CONTROLLED_WINDOW_START_SECONDS: String(SIGNALSMITH_CONTROLLED_SAMPLE.windowStartSeconds),
    REEDITPRO_PHASE36J_CONTROLLED_WINDOW_END_SECONDS: String(SIGNALSMITH_CONTROLLED_SAMPLE.windowEndSeconds),
    REEDITPRO_PHASE36J_SIGNALSMITH_REPO_URL: SIGNALSMITH_REPO_URL,
    REEDITPRO_PHASE36J_SIGNALSMITH_TAG: SIGNALSMITH_TAG,
    REEDITPRO_PHASE36J_SIGNALSMITH_COMMIT: SIGNALSMITH_COMMIT,
  }
  return Object.entries(env).map(([key, value]) => `${key}=${value}`).join(',')
}

async function runCommand(command: string, args: string[], timeout = 120000) {
  const started = Date.now()
  try {
    const result = await execFileAsync(command, args, {
      env: { ...process.env, CLOUDSDK_CORE_DISABLE_PROMPTS: '1' },
      maxBuffer: 1024 * 1024 * 20,
      timeout,
    })
    return buildCommandResult('passed', result.stdout, result.stderr, Date.now() - started)
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; message?: string }
    return buildCommandResult('blocked', String(err.stdout ?? ''), String(err.stderr ?? err.message ?? error), Date.now() - started)
  }
}

function buildCommandResult(status: PhaseStatus, stdout: string, stderr: string, durationMs: number) {
  return { status, stdout, stderr, durationMs }
}

function summarizeCommand(result: JsonRecord) {
  return {
    status: result.status,
    durationMs: result.durationMs,
    stdoutSummary: String(result.stdout ?? '').split(/\r?\n/).filter(Boolean).slice(-12).join('\n'),
    stderrSummary: String(result.stderr ?? '').split(/\r?\n/).filter(Boolean).slice(-12).join('\n'),
  }
}

function parseDigest(value: string): string | null {
  try {
    const parsed = JSON.parse(value) as { image_summary?: { digest?: string }; digest?: string }
    return parsed.image_summary?.digest ?? parsed.digest ?? null
  } catch {
    const match = value.match(/sha256:[a-f0-9]{64}/i)
    return match?.[0] ?? null
  }
}

function parseExecutionId(value: string): string | null {
  const match = value.match(/reeditpro-stg-signalsmith-controlled-runtime-phase36j-[a-z0-9-]+/i)
  return match?.[0] ?? null
}

function buildStatusReport(id: string, status: PhaseStatus, blockers: string[]): JsonRecord {
  return {
    id,
    phase: '36J',
    runId: SIGNALSMITH_CONTROLLED_RUN_ID,
    status,
    blockers,
  }
}

function collectBlockers(report: JsonRecord): string[] {
  const blockers = report.blockers
  return Array.isArray(blockers) ? blockers.map(String) : []
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort()
}

function getDownloaded(downloaded: JsonRecord, file: string): JsonRecord | undefined {
  const value = downloaded[file]
  return value && typeof value === 'object' ? value as JsonRecord : undefined
}

async function readJson(filePath: string): Promise<JsonRecord> {
  return JSON.parse(await readFile(filePath, 'utf8')) as JsonRecord
}

export function getSignalsmithControlledFfmpegCostSummary() {
  return {
    ...buildSignalsmithControlledRuntimeCostSummary(),
    status: 'bounded_cloud_run_cpu_runtime',
    runtimeImage: SIGNALSMITH_CONTROLLED_FFMPEG_IMAGE,
    cloudBuild: 'one linux/amd64 CPU image build if execution required',
    cloudRunJob: 'one private CPU-only Cloud Run Job execution',
    noGpu: true,
    noProviderCalls: true,
    noBroadMedia: true,
  }
}
