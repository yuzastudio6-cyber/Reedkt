import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import {
  DEEPFILTERNET_RUNTIME_HARDENING_BRANCH,
  DEEPFILTERNET_RUNTIME_HARDENING_PHASE,
  DEEPFILTERNET_RUNTIME_HARDENING_REPORT_DIR,
  getDeepFilterNetRuntimeHardeningPlan,
} from './index'

const execFileAsync = promisify(execFile)

type PhaseStatus = 'passed' | 'blocked' | 'warning' | 'not_run' | 'skipped'
type AudioTimingBetaStatus =
  | 'blocked'
  | 'phase-complete but tool-family incomplete'
  | 'internally beta-ready candidate'
  | 'external beta still blocked'
type JsonRecord = Record<string, unknown>

export const DEEPFILTERNET_LINUX_RUNTIME_RUN_ID = 'phase36h-linux-deepfilternet-runtime-completion-20260603-r5'
export const DEEPFILTERNET_LINUX_RUNTIME_IMAGE = `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/deepfilternet-runtime-phase36h:${DEEPFILTERNET_LINUX_RUNTIME_RUN_ID}`
export const DEEPFILTERNET_LINUX_RUNTIME_JOB = 'reeditpro-stg-deepfilternet-runtime-phase36h'
export const DEEPFILTERNET_LINUX_PRIVATE_GCS_PREFIX = `gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase36h/deepfilternet-controlled-speech/${DEEPFILTERNET_LINUX_RUNTIME_RUN_ID}/`

const PROJECT_ID = 'reeditpro'
const REGION = 'us-central1'
const SERVICE_ACCOUNT = 'reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com'
const CLOUD_BUILD_CONFIG = 'cloudbuild/deepfilternet-runtime-phase36h.yaml'
const CLOUD_BUILD_IGNORE = 'cloudbuild/deepfilternet-runtime-phase36h.gcloudignore'
const DOCKERFILE = 'docker/prod/deepfilternet-runtime/Dockerfile.phase36h'

const PHASE_36G_REPORT = 'docs/activation-phase-36g-audio-stack-demucs-results.md'
const PHASE_36C_REPORT = 'docs/activation-phase-36c-deepfilternet-runtime-verification-results.md'
const PHASE_36D_REPORT = 'docs/activation-phase-36d-real-video-deepfilternet-audio-cleanup-results.md'
const PHASE_36H_INITIAL_REPORT = 'docs/activation-phase-36h-deepfilternet-runtime-hardening-controlled-speech-reports/phase_36h_deepfilternet_runtime_hardening_report.json'
const WORKER_PATH = 'server/workers/deepfilternet-runtime/linux_runtime_entrypoint.py'

const ARTIFACT_PREFIX = 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/audio-ai/deepfilternet/v0.5.6/'
const CLI_FILE = 'deep-filter-0.5.6-x86_64-unknown-linux-musl'
const MODEL_ARCHIVE = 'DeepFilterNet3_onnx.tar.gz'
const CLI_SHA256 = '70775e251eee44c0f2451a1e833326cf8bcbbe304d3e7cd12851e6fce72ef7da'
const MODEL_SHA256 = 'c94d91f70911001c946e0fabb4aa9adc37045f45a03b56008cb0c8244cb63616'
const AGGREGATE_SHA256 = 'eab42c424fc818938f1b8591f4110318f86284b520e5244e571c2f3f56f5126b'

const CONTROLLED_SAMPLE = {
  sampleId: 'phase37d-phase32-color-export-safe-zone-window-v1',
  chainId: 'controlled-real-video-chain-phase28-through-phase32-v1',
  sourceGcsUri: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4',
  sourceSha256: '78bd798602d221b894a60dfa34ed1528602c9ece7f657e3f9bbea7fd071cc7fa',
  windowStartSeconds: 6.9,
  windowEndSeconds: 8.9,
}

const FORBIDDEN_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_BROAD_MEDIA_PROCESSING',
  'REEDITPRO_CONFIRM_ARBITRARY_MEDIA_INPUT',
  'REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_OCR_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_DEMUCS_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_SIGNALSMITH_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_TRACK_A_RUNTIME',
]

const BLOCKED_SCOPES = [
  'Phase 36I Signalsmith Stretch until implemented',
  'Phase 36J controlled timing/stretch until Signalsmith generated evidence exists',
  'Demucs until provenance/legal approval',
  'Demucs download/runtime/source separation',
  'broad media',
  'arbitrary media paths',
  'unapproved real media',
  'full-video audio cleanup',
  'VLM runtime retries',
  'OCR runtime',
  'provider calls',
  'production',
  'internal beta unlock',
  'external beta',
  'paid production',
  'public output',
  'GPU jobs',
  'IAM mutation',
  'Track A runtime/visual/render stack',
]

export const DEEPFILTERNET_LINUX_RUNTIME_EXPECTED_REPORT_FILES = [
  'phase_36h_deepfilternet_linux_runtime_plan.json',
  'phase_36h_deepfilternet_linux_runtime_preflight.json',
  'phase_36h_deepfilternet_linux_runtime_smoke_report.json',
  'phase_36h_deepfilternet_linux_cloud_build_report.json',
  'phase_36h_deepfilternet_linux_cloud_run_job_report.json',
  'phase_36h_deepfilternet_binary_verification_report.json',
  'phase_36h_ffmpeg_availability_report.json',
  'phase_36h_deepfilternet_generated_audio_fixture_manifest.json',
  'phase_36h_deepfilternet_generated_audio_qa_report.json',
  'phase_36h_controlled_audio_sample_evidence.json',
  'phase_36h_controlled_audio_plan.json',
  'phase_36h_controlled_audio_extraction_report.json',
  'phase_36h_controlled_deepfilternet_qa_report.json',
  'phase_36h_audio_metrics_report.json',
  'phase_36h_private_artifact_manifest.json',
  'phase_36h_deepfilternet_runtime_hardening_report.json',
  'phase_36h_audio_timing_beta_status_report.json',
  'phase_36h_blocker_report.json',
] as const

export interface DeepFilterNetLinuxRuntimeSummary {
  phase: typeof DEEPFILTERNET_RUNTIME_HARDENING_PHASE
  runId: string
  status: PhaseStatus
  audioTimingToolFamilyBetaStatus: AudioTimingBetaStatus
  linuxRuntimeStatus: string
  cloudBuildStatus: string
  cloudRunJobStatus: string
  ffmpegStatus: string
  binaryVerificationStatus: string
  generatedFixtureStatus: string
  controlledExtractionStatus: string
  controlledEnhancementStatus: string
  privateArtifactStatus: string
  privateArtifactPrefix: string
  nextPhaseDecision: string
}

export function getDeepFilterNetLinuxRuntimePlan() {
  const hardeningPlan = getDeepFilterNetRuntimeHardeningPlan()
  return {
    phase: DEEPFILTERNET_RUNTIME_HARDENING_PHASE,
    runId: DEEPFILTERNET_LINUX_RUNTIME_RUN_ID,
    sourcePr140: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/140',
    branch: DEEPFILTERNET_RUNTIME_HARDENING_BRANCH,
    status: 'planned',
    priorBlockersPreserved: [
      'approved_deepfilternet_binary_platform_incompatible:darwin_arm64',
      'ffmpeg_unavailable_for_bounded_audio_extraction',
    ],
    linuxRuntime: {
      image: DEEPFILTERNET_LINUX_RUNTIME_IMAGE,
      jobName: DEEPFILTERNET_LINUX_RUNTIME_JOB,
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
      workerEntrypoint: WORKER_PATH,
    },
    sourceEvidence: {
      github: 'https://github.com/Rikorose/DeepFilterNet',
      pypi: 'https://pypi.org/project/deepfilternet/',
      officialEvidenceSummary: 'DeepFilterNet documents a pre-compiled deep-filter binary, 48 kHz WAV-only binary support, and PyPI deepfilternet 0.5.6 evidence. Phase 36H Linux uses only the approved private binary/model artifacts.',
    },
    approvedRuntimeArtifacts: hardeningPlan.approvedRuntimeArtifacts,
    controlledSample: CONTROLLED_SAMPLE,
    executionConfirmations: [
      'REEDITPRO_CONFIRM_DEEPFILTERNET_LINUX_AMD64_RUNTIME',
      'REEDITPRO_CONFIRM_DEEPFILTERNET_RUNTIME_EXECUTE',
      'REEDITPRO_CONFIRM_DEEPFILTERNET_GENERATED_AUDIO',
      'REEDITPRO_CONFIRM_DEEPFILTERNET_CONTROLLED_REAL_AUDIO',
      'REEDITPRO_CONFIRM_DEEPFILTERNET_CONTROLLED_MEDIA_READ',
      'REEDITPRO_CONFIRM_DEEPFILTERNET_PRIVATE_ARTIFACT_UPLOAD',
      'REEDITPRO_CONFIRM_DEEPFILTERNET_CLOUD_BUILD',
      'REEDITPRO_CONFIRM_DEEPFILTERNET_DOCKER_PUSH',
      'REEDITPRO_CONFIRM_DEEPFILTERNET_STAGING_CLOUD_RUN_JOB',
      'REEDITPRO_CONFIRM_DEEPFILTERNET_CPU_WORKER_EXECUTE',
    ],
    forbiddenConfirmations: FORBIDDEN_CONFIRMATIONS,
    commandPlan: buildDeepFilterNetLinuxRuntimeCommandPlan(),
    privateArtifactPrefix: DEEPFILTERNET_LINUX_PRIVATE_GCS_PREFIX,
    noArbitraryMedia: true,
    noBroadMedia: true,
    noDemucs: true,
    noSignalsmith: true,
    noVlm: true,
    noOcr: true,
    noTrackA: true,
    audioTimingToolFamilyBetaStatus: 'blocked' as AudioTimingBetaStatus,
    blockedScopes: BLOCKED_SCOPES,
  }
}

export function buildDeepFilterNetLinuxRuntimeCommandPlan() {
  return [
    {
      commandId: 'linux-runtime-preflight',
      phase: 'preflight',
      commandString: [
        'gcloud config get-value project',
        `gcloud storage objects describe ${ARTIFACT_PREFIX}${CLI_FILE}`,
        `gcloud storage objects describe ${ARTIFACT_PREFIX}${MODEL_ARCHIVE}`,
        `gcloud storage objects describe ${ARTIFACT_PREFIX}model_tree_manifest.json`,
        `gcloud storage objects describe ${CONTROLLED_SAMPLE.sourceGcsUri}`,
        'gcloud builds list --limit=1',
        'gcloud run jobs list --region=us-central1',
      ].join(' && '),
      requiresConfirmation: false,
      textOnlyByDefault: true,
      warnings: ['Preflight does not process media or build/deploy.'],
    },
    {
      commandId: 'cloud-build-linux-image',
      phase: 'build',
      commandString: `gcloud builds submit --project ${PROJECT_ID} --config ${CLOUD_BUILD_CONFIG} --ignore-file ${CLOUD_BUILD_IGNORE} --substitutions _IMAGE=${DEEPFILTERNET_LINUX_RUNTIME_IMAGE} .`,
      requiresConfirmation: true,
      requiredConfirmations: ['REEDITPRO_CONFIRM_DEEPFILTERNET_CLOUD_BUILD', 'REEDITPRO_CONFIRM_DEEPFILTERNET_DOCKER_PUSH'],
      textOnlyByDefault: true,
      warnings: ['Builds only the Phase 36H linux/amd64 CPU image; no model/media payloads are included in build context.'],
    },
    {
      commandId: 'deploy-cloud-run-job',
      phase: 'deploy',
      commandString: `gcloud run jobs deploy ${DEEPFILTERNET_LINUX_RUNTIME_JOB} --project ${PROJECT_ID} --region ${REGION} --image ${DEEPFILTERNET_LINUX_RUNTIME_IMAGE} --service-account ${SERVICE_ACCOUNT} --cpu=4 --memory=8Gi --tasks=1 --parallelism=1 --max-retries=0 --task-timeout=1800s --set-env-vars <phase36h-safe-env>`,
      requiresConfirmation: true,
      requiredConfirmations: ['REEDITPRO_CONFIRM_DEEPFILTERNET_STAGING_CLOUD_RUN_JOB', 'REEDITPRO_CONFIRM_DEEPFILTERNET_CPU_WORKER_EXECUTE'],
      textOnlyByDefault: true,
      warnings: ['Cloud Run Job is CPU-only, private, finite, and processes generated audio plus one bounded controlled audio window only.'],
    },
    {
      commandId: 'execute-cloud-run-job',
      phase: 'execute',
      commandString: `gcloud run jobs execute ${DEEPFILTERNET_LINUX_RUNTIME_JOB} --project ${PROJECT_ID} --region ${REGION} --wait`,
      requiresConfirmation: true,
      requiredConfirmations: [
        'REEDITPRO_CONFIRM_DEEPFILTERNET_LINUX_AMD64_RUNTIME',
        'REEDITPRO_CONFIRM_DEEPFILTERNET_RUNTIME_EXECUTE',
        'REEDITPRO_CONFIRM_DEEPFILTERNET_GENERATED_AUDIO',
        'REEDITPRO_CONFIRM_DEEPFILTERNET_CONTROLLED_REAL_AUDIO',
        'REEDITPRO_CONFIRM_DEEPFILTERNET_CONTROLLED_MEDIA_READ',
        'REEDITPRO_CONFIRM_DEEPFILTERNET_PRIVATE_ARTIFACT_UPLOAD',
      ],
      textOnlyByDefault: true,
      warnings: ['Generated fixture runs before controlled media. If generated fixture fails, controlled audio is not processed.'],
    },
    {
      commandId: 'fetch-safe-json-reports',
      phase: 'fetch-report',
      commandString: `gcloud storage cp ${DEEPFILTERNET_LINUX_PRIVATE_GCS_PREFIX}reports/phase_36h_*.json ${DEEPFILTERNET_RUNTIME_HARDENING_REPORT_DIR}/`,
      requiresConfirmation: false,
      textOnlyByDefault: true,
      warnings: ['Fetch only JSON report metadata. Do not copy audio/video payloads into the repo.'],
    },
  ]
}

export async function writeDeepFilterNetLinuxRuntimeStaticArtifacts(reportDir = DEEPFILTERNET_RUNTIME_HARDENING_REPORT_DIR): Promise<void> {
  const reports = await buildLinuxReports({
    preflight: buildStaticLinuxPreflight(),
    cloudBuild: buildStatusReport('phase_36h_deepfilternet_linux_cloud_build_report', 'not_run', ['Cloud Build not executed in static mode.']),
    cloudRunJob: buildStatusReport('phase_36h_deepfilternet_linux_cloud_run_job_report', 'not_run', ['Cloud Run Job not executed in static mode.']),
    downloadedReports: {},
  })
  await writeLinuxReports(reportDir, reports)
}

export async function readDeepFilterNetLinuxRuntimeSummary(reportDir = DEEPFILTERNET_RUNTIME_HARDENING_REPORT_DIR): Promise<DeepFilterNetLinuxRuntimeSummary> {
  const reportPath = path.join(reportDir, 'phase_36h_deepfilternet_runtime_hardening_report.json')
  if (!existsSync(reportPath)) return buildLinuxSummary('not_run', 'blocked')
  const report = await readJson(reportPath)
  return {
    phase: DEEPFILTERNET_RUNTIME_HARDENING_PHASE,
    runId: String(report.runId ?? DEEPFILTERNET_LINUX_RUNTIME_RUN_ID),
    status: toStatus(report.status, 'not_run'),
    audioTimingToolFamilyBetaStatus: toBetaStatus(report.audioTimingToolFamilyBetaStatus, 'blocked'),
    linuxRuntimeStatus: String(report.linuxRuntimeStatus ?? report.runtimePreflightStatus ?? 'unknown'),
    cloudBuildStatus: String(report.cloudBuildStatus ?? 'unknown'),
    cloudRunJobStatus: String(report.cloudRunJobStatus ?? 'unknown'),
    ffmpegStatus: String(report.ffmpegStatus ?? 'unknown'),
    binaryVerificationStatus: String(report.binaryVerificationStatus ?? 'unknown'),
    generatedFixtureStatus: String(report.generatedFixtureStatus ?? 'unknown'),
    controlledExtractionStatus: String(report.controlledExtractionStatus ?? 'unknown'),
    controlledEnhancementStatus: String(report.controlledEnhancementStatus ?? 'unknown'),
    privateArtifactStatus: String(report.privateArtifactStatus ?? 'unknown'),
    privateArtifactPrefix: DEEPFILTERNET_LINUX_PRIVATE_GCS_PREFIX,
    nextPhaseDecision: String(report.nextPhaseDecision ?? 'Run Phase 36H Linux runtime completion.'),
  }
}

export async function executeDeepFilterNetLinuxRuntime(input: {
  reportDir?: string
  keepTemp?: boolean
  cloudBuildOnly?: boolean
  cloudRunOnly?: boolean
  smokeOnly?: boolean
} = {}): Promise<DeepFilterNetLinuxRuntimeSummary> {
  const reportDir = input.reportDir ?? DEEPFILTERNET_RUNTIME_HARDENING_REPORT_DIR
  requireLinuxConfirmations({ build: !input.cloudRunOnly && !input.smokeOnly, run: !input.cloudBuildOnly })
  const preflight = await runLinuxPreflight()
  if (input.smokeOnly) {
    const reports = await buildLinuxReports({
      preflight,
      cloudBuild: buildStatusReport('phase_36h_deepfilternet_linux_cloud_build_report', 'skipped', ['Smoke-only mode.']),
      cloudRunJob: buildStatusReport('phase_36h_deepfilternet_linux_cloud_run_job_report', 'skipped', ['Smoke-only mode.']),
      downloadedReports: {},
    })
    await writeLinuxReports(reportDir, reports)
    return readDeepFilterNetLinuxRuntimeSummary(reportDir)
  }
  if (preflight.status !== 'passed') {
    const reports = await buildLinuxReports({
      preflight,
      cloudBuild: buildStatusReport('phase_36h_deepfilternet_linux_cloud_build_report', 'blocked', collectBlockers(preflight)),
      cloudRunJob: buildStatusReport('phase_36h_deepfilternet_linux_cloud_run_job_report', 'not_run', collectBlockers(preflight)),
      downloadedReports: {},
    })
    await writeLinuxReports(reportDir, reports)
    return readDeepFilterNetLinuxRuntimeSummary(reportDir)
  }

  const cloudBuild = input.cloudRunOnly
    ? buildStatusReport('phase_36h_deepfilternet_linux_cloud_build_report', 'skipped', ['Cloud Build skipped by cloud-run-only mode.'])
    : await runCloudBuild()

  if (input.cloudBuildOnly || cloudBuild.status !== 'passed') {
    const reports = await buildLinuxReports({
      preflight,
      cloudBuild,
      cloudRunJob: buildStatusReport('phase_36h_deepfilternet_linux_cloud_run_job_report', input.cloudBuildOnly ? 'skipped' : 'blocked', collectBlockers(cloudBuild)),
      downloadedReports: {},
    })
    await writeLinuxReports(reportDir, reports)
    return readDeepFilterNetLinuxRuntimeSummary(reportDir)
  }

  const cloudRunJob = await runCloudRunJob()
  const downloadedReports = cloudRunJob.status === 'passed'
    ? await downloadSafeLinuxReports(reportDir)
    : {}
  const reports = await buildLinuxReports({
    preflight,
    cloudBuild,
    cloudRunJob,
    downloadedReports,
  })
  await writeLinuxReports(reportDir, reports)
  return readDeepFilterNetLinuxRuntimeSummary(reportDir)
}

export function getDeepFilterNetLinuxRuntimeIamPlan() {
  return {
    phase: DEEPFILTERNET_RUNTIME_HARDENING_PHASE,
    runId: DEEPFILTERNET_LINUX_RUNTIME_RUN_ID,
    status: 'no_iam_mutation_allowed',
    privateArtifactPrefix: DEEPFILTERNET_LINUX_PRIVATE_GCS_PREFIX,
    requiredExistingAccess: [
      `${ARTIFACT_PREFIX}${CLI_FILE}`,
      `${ARTIFACT_PREFIX}${MODEL_ARCHIVE}`,
      `${ARTIFACT_PREFIX}model_tree_manifest.json`,
      CONTROLLED_SAMPLE.sourceGcsUri,
      DEEPFILTERNET_LINUX_PRIVATE_GCS_PREFIX,
    ],
    serviceAccount: SERVICE_ACCOUNT,
    notes: [
      'Phase 36H-LINUX does not mutate IAM.',
      'If private reads/uploads fail, report the exact blocker and keep Phase 36H incomplete.',
    ],
  }
}

export function getDeepFilterNetLinuxRuntimeCostSummary() {
  return {
    phase: DEEPFILTERNET_RUNTIME_HARDENING_PHASE,
    runId: DEEPFILTERNET_LINUX_RUNTIME_RUN_ID,
    status: 'bounded_cloud_run_cpu_runtime',
    estimatedCloudCostUsd: 1,
    costDrivers: [
      'one Cloud Build linux/amd64 CPU image build',
      'one finite CPU-only Cloud Run Job execution',
      'private GCS read of two approved DeepFilterNet artifacts plus manifest',
      'private GCS read of one approved controlled sample after generated fixture passes',
      'private QA report/audio artifact upload',
    ],
    noGpu: true,
    noProviderCalls: true,
    noBroadMedia: true,
  }
}

async function runLinuxPreflight() {
  const [activeAccount, activeProject, builds, artifactRepo, runJobs, cliObject, modelObject, manifestObject, controlledObject, qaBucket] = await Promise.all([
    runCommand('gcloud', ['--quiet', 'auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
    runCommand('gcloud', ['--quiet', 'config', 'get-value', 'project']),
    runCommand('gcloud', ['--quiet', 'builds', 'list', '--limit=1', '--format=json']),
    runCommand('gcloud', ['--quiet', 'artifacts', 'repositories', 'describe', 'reeditpro-staging-workers', '--location', REGION, '--format=json']),
    runCommand('gcloud', ['--quiet', 'run', 'jobs', 'list', '--region', REGION, '--format=json']),
    runCommand('gcloud', ['--quiet', 'storage', 'objects', 'describe', `${ARTIFACT_PREFIX}${CLI_FILE}`, '--format=value(size)']),
    runCommand('gcloud', ['--quiet', 'storage', 'objects', 'describe', `${ARTIFACT_PREFIX}${MODEL_ARCHIVE}`, '--format=value(size)']),
    runCommand('gcloud', ['--quiet', 'storage', 'objects', 'describe', `${ARTIFACT_PREFIX}model_tree_manifest.json`, '--format=value(size)']),
    runCommand('gcloud', ['--quiet', 'storage', 'objects', 'describe', CONTROLLED_SAMPLE.sourceGcsUri, '--format=value(size)']),
    runCommand('gcloud', ['--quiet', 'storage', 'buckets', 'describe', 'gs://reeditpro-staging-reeditpro-qa-artifacts', '--format=value(name)']),
  ])
  const blockers: string[] = []
  if (!activeAccount.stdout.trim()) blockers.push('gcloud_active_account_missing')
  if (!activeProject.stdout.includes(PROJECT_ID)) blockers.push('gcloud_project_not_reeditpro')
  if (builds.status !== 'passed') blockers.push('cloud_build_unavailable')
  if (artifactRepo.status !== 'passed') blockers.push('artifact_registry_repo_unavailable')
  if (runJobs.status !== 'passed') blockers.push('cloud_run_jobs_unavailable')
  if (Number(cliObject.stdout.trim()) <= 0) blockers.push('approved_deepfilter_binary_private_object_unavailable')
  if (Number(modelObject.stdout.trim()) <= 0) blockers.push('approved_deepfilternet_model_archive_private_object_unavailable')
  if (Number(manifestObject.stdout.trim()) <= 0) blockers.push('approved_deepfilternet_manifest_private_object_unavailable')
  if (Number(controlledObject.stdout.trim()) <= 0) blockers.push('approved_controlled_sample_private_object_unavailable')
  if (!qaBucket.stdout.includes('reeditpro-staging-reeditpro-qa-artifacts')) blockers.push('qa_artifact_bucket_unavailable')
  return {
    phase: DEEPFILTERNET_RUNTIME_HARDENING_PHASE,
    runId: DEEPFILTERNET_LINUX_RUNTIME_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    activePrincipal: activeAccount.stdout.trim().split(/\r?\n/).filter(Boolean).at(-1) ?? '',
    activeProject: activeProject.stdout.trim().split(/\r?\n/).filter(Boolean).at(-1) ?? '',
    cloudBuildStatus: builds.status,
    artifactRegistryStatus: artifactRepo.status,
    cloudRunJobsStatus: runJobs.status,
    approvedArtifactStatus: cliObject.status === 'passed' && modelObject.status === 'passed' && manifestObject.status === 'passed' ? 'passed' : 'blocked',
    controlledSampleStatus: controlledObject.status,
    qaBucketStatus: qaBucket.status,
    blockers,
    warnings: ['Preflight is non-mutating and does not process media.'],
  }
}

async function runCloudBuild() {
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
    `_IMAGE=${DEEPFILTERNET_LINUX_RUNTIME_IMAGE}`,
    '.',
  ], 90 * 60 * 1000)
  const imageDescribe = output.status === 'passed'
    ? await runCommand('gcloud', ['artifacts', 'docker', 'images', 'describe', DEEPFILTERNET_LINUX_RUNTIME_IMAGE, '--format=json'], 120000)
    : buildCommandResult('blocked', '', 'cloud build did not pass', 0)
  const digest = parseDigest(imageDescribe.stdout)
  const blockers: string[] = []
  if (output.status !== 'passed') blockers.push('phase36h_linux_cloud_build_failed')
  if (imageDescribe.status !== 'passed') blockers.push('phase36h_linux_artifact_registry_image_describe_failed')
  return {
    phase: DEEPFILTERNET_RUNTIME_HARDENING_PHASE,
    runId: DEEPFILTERNET_LINUX_RUNTIME_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    image: DEEPFILTERNET_LINUX_RUNTIME_IMAGE,
    imageDigest: digest,
    buildOutput: summarizeCommand(output),
    imageDescribe: summarizeCommand(imageDescribe),
    blockers,
  }
}

async function runCloudRunJob() {
  const envVars = buildRuntimeEnvVars()
  const deploy = await runCommand('gcloud', [
    'run',
    'jobs',
    'deploy',
    DEEPFILTERNET_LINUX_RUNTIME_JOB,
    '--quiet',
    '--project',
    PROJECT_ID,
    '--region',
    REGION,
    '--image',
    DEEPFILTERNET_LINUX_RUNTIME_IMAGE,
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
    ? await runCommand('gcloud', ['run', 'jobs', 'execute', DEEPFILTERNET_LINUX_RUNTIME_JOB, '--quiet', '--project', PROJECT_ID, '--region', REGION, '--wait'], 45 * 60 * 1000)
    : buildCommandResult('blocked', '', 'deploy did not pass', 0)
  const executionId = parseExecutionId(execute.stdout) ?? parseExecutionId(execute.stderr)
  const blockers: string[] = []
  if (deploy.status !== 'passed') blockers.push('phase36h_linux_cloud_run_job_deploy_failed')
  if (execute.status !== 'passed') blockers.push('phase36h_linux_cloud_run_job_execute_failed')
  return {
    phase: DEEPFILTERNET_RUNTIME_HARDENING_PHASE,
    runId: DEEPFILTERNET_LINUX_RUNTIME_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    jobName: DEEPFILTERNET_LINUX_RUNTIME_JOB,
    executionId,
    privateArtifactPrefix: DEEPFILTERNET_LINUX_PRIVATE_GCS_PREFIX,
    deploy: summarizeCommand(deploy),
    execute: summarizeCommand(execute),
    blockers,
  }
}

async function downloadSafeLinuxReports(reportDir: string) {
  await mkdir(reportDir, { recursive: true })
  const downloaded: JsonRecord = {}
  for (const reportFile of DEEPFILTERNET_LINUX_RUNTIME_EXPECTED_REPORT_FILES) {
    const cp = await runCommand('gcloud', [
      '--quiet',
      'storage',
      'cp',
      `${DEEPFILTERNET_LINUX_PRIVATE_GCS_PREFIX}reports/${reportFile}`,
      path.join(reportDir, reportFile),
    ], 120000)
    if (cp.status === 'passed' && existsSync(path.join(reportDir, reportFile))) {
      downloaded[reportFile] = await readJson(path.join(reportDir, reportFile))
    }
  }
  return downloaded
}

async function buildLinuxReports(input: {
  preflight: JsonRecord
  cloudBuild: JsonRecord
  cloudRunJob: JsonRecord
  downloadedReports: JsonRecord
}) {
  const plan = getDeepFilterNetLinuxRuntimePlan()
  const downloaded = input.downloadedReports
  const smoke = getDownloaded(downloaded, 'phase_36h_deepfilternet_linux_runtime_smoke_report.json') ?? buildStatusReport('phase_36h_deepfilternet_linux_runtime_smoke_report', input.cloudRunJob.status === 'passed' ? 'blocked' : 'not_run', ['runtime_smoke_report_not_downloaded'])
  const binary = getDownloaded(downloaded, 'phase_36h_deepfilternet_binary_verification_report.json') ?? buildStatusReport('phase_36h_deepfilternet_binary_verification_report', 'not_run', ['binary_verification_not_run'])
  const ffmpeg = getDownloaded(downloaded, 'phase_36h_ffmpeg_availability_report.json') ?? buildStatusReport('phase_36h_ffmpeg_availability_report', 'not_run', ['ffmpeg_check_not_run'])
  const generatedManifest = getDownloaded(downloaded, 'phase_36h_deepfilternet_generated_audio_fixture_manifest.json') ?? buildGeneratedNotRun('manifest')
  const generatedQa = getDownloaded(downloaded, 'phase_36h_deepfilternet_generated_audio_qa_report.json') ?? buildGeneratedNotRun('qa')
  const controlledSample = getDownloaded(downloaded, 'phase_36h_controlled_audio_sample_evidence.json') ?? buildControlledNotRun('sample')
  const controlledPlan = getDownloaded(downloaded, 'phase_36h_controlled_audio_plan.json') ?? buildControlledNotRun('plan')
  const extraction = getDownloaded(downloaded, 'phase_36h_controlled_audio_extraction_report.json') ?? buildControlledNotRun('extraction')
  const controlledQa = getDownloaded(downloaded, 'phase_36h_controlled_deepfilternet_qa_report.json') ?? buildControlledNotRun('qa')
  const audioMetrics = getDownloaded(downloaded, 'phase_36h_audio_metrics_report.json') ?? buildStatusReport('phase_36h_audio_metrics_report', 'not_run', ['audio_metrics_not_run'])
  const privateArtifact = getDownloaded(downloaded, 'phase_36h_private_artifact_manifest.json') ?? buildPrivateManifestNotRun()
  const statuses = [
    input.preflight.status,
    input.cloudBuild.status === 'skipped' ? 'passed' : input.cloudBuild.status,
    input.cloudRunJob.status === 'skipped' ? 'passed' : input.cloudRunJob.status,
    smoke.status,
    binary.status,
    ffmpeg.status,
    generatedQa.status,
    extraction.status,
    controlledQa.status,
    privateArtifact.status,
  ]
  const passed = statuses.every((status) => status === 'passed')
  const blockers = uniqueStrings([
    ...collectBlockers(input.preflight),
    ...collectBlockers(input.cloudBuild),
    ...collectBlockers(input.cloudRunJob),
    ...collectBlockers(smoke),
    ...collectBlockers(binary),
    ...collectBlockers(ffmpeg),
    ...collectBlockers(generatedQa),
    ...collectBlockers(extraction),
    ...collectBlockers(controlledQa),
    ...collectBlockers(privateArtifact),
  ])
  const hardening = {
    phase: DEEPFILTERNET_RUNTIME_HARDENING_PHASE,
    runId: DEEPFILTERNET_LINUX_RUNTIME_RUN_ID,
    sourcePr140: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/140',
    status: passed ? 'passed' : 'blocked',
    cloudBuildStatus: input.cloudBuild.status,
    cloudRunJobStatus: input.cloudRunJob.status,
    runtimePreflightStatus: input.preflight.status,
    linuxRuntimeStatus: smoke.status,
    ffmpegStatus: ffmpeg.status,
    binaryVerificationStatus: binary.status,
    generatedFixtureStatus: generatedQa.status,
    controlledExtractionStatus: extraction.status,
    controlledEnhancementStatus: controlledQa.status,
    privateArtifactStatus: privateArtifact.status,
    privateArtifactPrefix: DEEPFILTERNET_LINUX_PRIVATE_GCS_PREFIX,
    controlledSampleId: CONTROLLED_SAMPLE.sampleId,
    controlledAudioWindow: {
      startSeconds: CONTROLLED_SAMPLE.windowStartSeconds,
      endSeconds: CONTROLLED_SAMPLE.windowEndSeconds,
      durationSeconds: CONTROLLED_SAMPLE.windowEndSeconds - CONTROLLED_SAMPLE.windowStartSeconds,
    },
    audioTimingToolFamilyBetaStatus: passed ? 'phase-complete but tool-family incomplete' : 'blocked',
    blockers,
    blockedScopes: BLOCKED_SCOPES,
    nextPhaseDecision: passed
      ? 'Proceed to Phase 36I Signalsmith Stretch approval/runtime/generated fixture.'
      : 'Resolve the exact Phase 36H Linux runtime blocker before Phase 36I.',
    warnings: [
      'DeepFilterNet remains approved only for bounded internal speech-cleanup QA/planning scope.',
      'Signalsmith Stretch and Demucs remain blocked.',
      'Product-wide beta, external beta, production, broad media, providers, OCR/VLM, and Track A remain blocked.',
    ],
  }
  const beta = {
    phase: DEEPFILTERNET_RUNTIME_HARDENING_PHASE,
    runId: DEEPFILTERNET_LINUX_RUNTIME_RUN_ID,
    status: hardening.status,
    audioTimingToolFamilyBetaStatus: hardening.audioTimingToolFamilyBetaStatus,
    internalBetaReady: false,
    externalBetaReady: false,
    productionReady: false,
    phase36IStatus: 'blocked_until_later_prompt',
    demucsStatus: 'blocked_pending_provenance_legal_approval',
  }
  const blockerReport = {
    phase: DEEPFILTERNET_RUNTIME_HARDENING_PHASE,
    runId: DEEPFILTERNET_LINUX_RUNTIME_RUN_ID,
    status: blockers.length === 0 ? 'passed_no_required_blockers' : 'blocked',
    blockers,
    blockedScopes: BLOCKED_SCOPES,
  }
  return {
    plan,
    preflight: input.preflight,
    cloudBuild: input.cloudBuild,
    cloudRunJob: input.cloudRunJob,
    smoke,
    binary,
    ffmpeg,
    generatedManifest,
    generatedQa,
    controlledSample,
    controlledPlan,
    extraction,
    controlledQa,
    audioMetrics,
    privateArtifact,
    hardening,
    beta,
    blockerReport,
  }
}

async function writeLinuxReports(reportDir: string, reports: Awaited<ReturnType<typeof buildLinuxReports>>): Promise<void> {
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36h_deepfilternet_linux_runtime_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36h_deepfilternet_linux_runtime_preflight.json'), reports.preflight)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36h_deepfilternet_linux_cloud_build_report.json'), reports.cloudBuild)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36h_deepfilternet_linux_cloud_run_job_report.json'), reports.cloudRunJob)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36h_deepfilternet_linux_runtime_smoke_report.json'), reports.smoke)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36h_deepfilternet_binary_verification_report.json'), reports.binary)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36h_ffmpeg_availability_report.json'), reports.ffmpeg)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36h_deepfilternet_generated_audio_fixture_manifest.json'), reports.generatedManifest)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36h_deepfilternet_generated_audio_qa_report.json'), reports.generatedQa)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36h_controlled_audio_sample_evidence.json'), reports.controlledSample)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36h_controlled_audio_plan.json'), reports.controlledPlan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36h_controlled_audio_extraction_report.json'), reports.extraction)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36h_controlled_deepfilternet_qa_report.json'), reports.controlledQa)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36h_audio_metrics_report.json'), reports.audioMetrics)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36h_private_artifact_manifest.json'), reports.privateArtifact)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36h_deepfilternet_runtime_hardening_report.json'), reports.hardening)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36h_audio_timing_beta_status_report.json'), reports.beta)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36h_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeTextArtifact(path.join(reportDir, 'phase_36h_deepfilternet_linux_runtime_completion_report.md'), renderLinuxMarkdown(reports.hardening))
}

function buildRuntimeEnvVars(): string {
  return [
    'REEDITPRO_ENV=staging',
    'REEDITPRO_CONFIRM_DEEPFILTERNET_LINUX_AMD64_RUNTIME=true',
    'REEDITPRO_CONFIRM_DEEPFILTERNET_RUNTIME_EXECUTE=true',
    'REEDITPRO_CONFIRM_DEEPFILTERNET_GENERATED_AUDIO=true',
    'REEDITPRO_CONFIRM_DEEPFILTERNET_CONTROLLED_REAL_AUDIO=true',
    'REEDITPRO_CONFIRM_DEEPFILTERNET_CONTROLLED_MEDIA_READ=true',
    'REEDITPRO_CONFIRM_DEEPFILTERNET_PRIVATE_ARTIFACT_UPLOAD=true',
    'PROVIDER_EXECUTION_ENABLED=false',
    'MODEL_DOWNLOADS_ENABLED=false',
    'REAL_MEDIA_INPUT_ENABLED=false',
    'BROAD_MEDIA_PROCESSING=false',
    'ARBITRARY_MEDIA_INPUT=false',
    'DEMUCS_ENABLED=false',
    'SIGNALSMITH_ENABLED=false',
    'VLM_RUNTIME_ENABLED=false',
    'OCR_RUNTIME_ENABLED=false',
    'REEDITPRO_PRODUCTION_READY=false',
    'REEDITPRO_EXTERNAL_BETA_READY=false',
    'REEDITPRO_BROAD_REAL_MEDIA_READY=false',
    `REEDITPRO_PHASE36H_RUN_ID=${DEEPFILTERNET_LINUX_RUNTIME_RUN_ID}`,
    `REEDITPRO_PHASE36H_ARTIFACT_PREFIX=${ARTIFACT_PREFIX}`,
    `REEDITPRO_PHASE36H_DEEPFILTER_CLI_FILE=${CLI_FILE}`,
    `REEDITPRO_PHASE36H_MODEL_ARCHIVE=${MODEL_ARCHIVE}`,
    `REEDITPRO_PHASE36H_DEEPFILTER_CLI_SHA256=${CLI_SHA256}`,
    `REEDITPRO_PHASE36H_MODEL_SHA256=${MODEL_SHA256}`,
    `REEDITPRO_PHASE36H_AGGREGATE_SHA256=${AGGREGATE_SHA256}`,
    `REEDITPRO_PHASE36H_CONTROLLED_SAMPLE_ID=${CONTROLLED_SAMPLE.sampleId}`,
    `REEDITPRO_PHASE36H_CONTROLLED_CHAIN_ID=${CONTROLLED_SAMPLE.chainId}`,
    `REEDITPRO_PHASE36H_CONTROLLED_SAMPLE_URI=${CONTROLLED_SAMPLE.sourceGcsUri}`,
    `REEDITPRO_PHASE36H_CONTROLLED_SAMPLE_SHA256=${CONTROLLED_SAMPLE.sourceSha256}`,
    `REEDITPRO_PHASE36H_CONTROLLED_WINDOW_START_SECONDS=${CONTROLLED_SAMPLE.windowStartSeconds}`,
    `REEDITPRO_PHASE36H_CONTROLLED_WINDOW_END_SECONDS=${CONTROLLED_SAMPLE.windowEndSeconds}`,
    `REEDITPRO_PHASE36H_PRIVATE_ARTIFACT_PREFIX=${DEEPFILTERNET_LINUX_PRIVATE_GCS_PREFIX}`,
  ].join(',')
}

function requireLinuxConfirmations(input: { build: boolean; run: boolean }): void {
  if (input.build) {
    for (const required of ['REEDITPRO_CONFIRM_DEEPFILTERNET_CLOUD_BUILD', 'REEDITPRO_CONFIRM_DEEPFILTERNET_DOCKER_PUSH']) {
      if (process.env[required] !== 'true') throw new Error(`${required}=true is required for Phase 36H Linux Cloud Build.`)
    }
  }
  if (input.run) {
    for (const required of [
      'REEDITPRO_CONFIRM_DEEPFILTERNET_LINUX_AMD64_RUNTIME',
      'REEDITPRO_CONFIRM_DEEPFILTERNET_RUNTIME_EXECUTE',
      'REEDITPRO_CONFIRM_DEEPFILTERNET_GENERATED_AUDIO',
      'REEDITPRO_CONFIRM_DEEPFILTERNET_CONTROLLED_REAL_AUDIO',
      'REEDITPRO_CONFIRM_DEEPFILTERNET_CONTROLLED_MEDIA_READ',
      'REEDITPRO_CONFIRM_DEEPFILTERNET_PRIVATE_ARTIFACT_UPLOAD',
      'REEDITPRO_CONFIRM_DEEPFILTERNET_STAGING_CLOUD_RUN_JOB',
      'REEDITPRO_CONFIRM_DEEPFILTERNET_CPU_WORKER_EXECUTE',
    ]) {
      if (process.env[required] !== 'true') throw new Error(`${required}=true is required for Phase 36H Linux Cloud Run Job execution.`)
    }
  }
  for (const forbidden of FORBIDDEN_CONFIRMATIONS) {
    if (process.env[forbidden] === 'true') throw new Error(`Forbidden Phase 36H confirmation is set: ${forbidden}`)
  }
}

async function runCommand(command: string, args: string[], timeoutMs = 60000) {
  const started = Date.now()
  try {
    const result = await execFileAsync(command, args, {
      timeout: timeoutMs,
      maxBuffer: 64 * 1024 * 1024,
      env: { ...process.env, CLOUDSDK_CORE_DISABLE_PROMPTS: '1' },
    })
    return buildCommandResult('passed', result.stdout, result.stderr, Date.now() - started)
  } catch (error) {
    const err = error as { stdout?: string, stderr?: string, message?: string }
    return buildCommandResult('blocked', err.stdout ?? '', err.stderr ?? err.message ?? '', Date.now() - started)
  }
}

function buildCommandResult(status: PhaseStatus, stdout: string, stderr: string, durationMs: number) {
  return { status, stdout, stderr, durationMs }
}

function summarizeCommand(command: JsonRecord) {
  return {
    status: command.status,
    durationMs: command.durationMs,
    stdoutSummary: String(command.stdout ?? '').split(/\r?\n/).filter(Boolean).slice(0, 8).join('\n'),
    stderrSummary: String(command.stderr ?? '').split(/\r?\n/).filter(Boolean).slice(0, 8).join('\n'),
  }
}

function buildStaticLinuxPreflight() {
  return {
    phase: DEEPFILTERNET_RUNTIME_HARDENING_PHASE,
    runId: DEEPFILTERNET_LINUX_RUNTIME_RUN_ID,
    status: 'not_run',
    localHostBlockerPreserved: process.platform === 'darwin' && process.arch === 'arm64' ? 'approved_deepfilternet_binary_platform_incompatible:darwin_arm64' : 'platform_not_checked',
    cloudRuntimePath: 'planned_linux_amd64_cloud_run_cpu_job',
    blockers: ['linux_runtime_preflight_not_run'],
    warnings: ['Static mode does not build images, deploy jobs, execute DeepFilterNet, or process audio.'],
  }
}

function buildStatusReport(reportId: string, status: PhaseStatus, blockers: string[] = []) {
  return {
    phase: DEEPFILTERNET_RUNTIME_HARDENING_PHASE,
    runId: DEEPFILTERNET_LINUX_RUNTIME_RUN_ID,
    reportId,
    status,
    blockers,
  }
}

function buildGeneratedNotRun(kind: string) {
  return {
    phase: DEEPFILTERNET_RUNTIME_HARDENING_PHASE,
    runId: DEEPFILTERNET_LINUX_RUNTIME_RUN_ID,
    fixtureId: 'phase36h-generated-noisy-speechlike-48khz-v1',
    generatedOnly: true,
    status: 'not_run',
    blockers: [`generated_audio_${kind}_not_run`],
  }
}

function buildControlledNotRun(kind: string) {
  return {
    phase: DEEPFILTERNET_RUNTIME_HARDENING_PHASE,
    runId: DEEPFILTERNET_LINUX_RUNTIME_RUN_ID,
    status: 'not_run',
    selectedSample: CONTROLLED_SAMPLE,
    blockers: [`controlled_audio_${kind}_not_run`],
  }
}

function buildPrivateManifestNotRun() {
  return {
    phase: DEEPFILTERNET_RUNTIME_HARDENING_PHASE,
    runId: DEEPFILTERNET_LINUX_RUNTIME_RUN_ID,
    status: 'not_run',
    privateArtifactPrefix: DEEPFILTERNET_LINUX_PRIVATE_GCS_PREFIX,
    objectCount: 0,
    committedAudioPayloads: false,
    blockers: ['phase36h_private_artifact_upload_not_run'],
  }
}

function getDownloaded(downloaded: JsonRecord, fileName: string): JsonRecord | undefined {
  const value = downloaded[fileName]
  return isRecord(value) ? value : undefined
}

function collectBlockers(value: unknown): string[] {
  if (!isRecord(value)) return []
  if (Array.isArray(value.blockers)) return value.blockers.map(String)
  return []
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)]
}

function parseDigest(output: string): string | undefined {
  const parsed = safeJson(output)
  if (isRecord(parsed)) {
    const summary = isRecord(parsed.image_summary) ? parsed.image_summary : {}
    const digest = summary.digest ?? summary.fully_qualified_digest ?? parsed.digest
    if (typeof digest === 'string' && digest.includes('sha256:')) return digest.match(/sha256:[a-f0-9]{64}/)?.[0] ?? digest
  }
  return output.match(/sha256:[a-f0-9]{64}/)?.[0]
}

function parseExecutionId(output: string): string | undefined {
  return output.match(/Execution \[([^\]]+)\]/)?.[1] ?? output.match(/executions\/([A-Za-z0-9_-]+)/)?.[1]
}

async function readJson(filePath: string): Promise<JsonRecord> {
  return JSON.parse(await readFile(filePath, 'utf8')) as JsonRecord
}

async function sha256File(filePath: string): Promise<string> {
  const hash = createHash('sha256')
  hash.update(await readFile(filePath))
  return hash.digest('hex')
}

async function collectFiles(root: string, prefix = ''): Promise<string[]> {
  if (!existsSync(root)) return []
  const current = path.join(root, prefix)
  const entries = await readdir(current, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const relative = prefix ? path.join(prefix, entry.name) : entry.name
    const absolute = path.join(root, relative)
    if (entry.isDirectory()) files.push(...await collectFiles(root, relative))
    else files.push(absolute)
  }
  return files.sort()
}

async function buildCommittedReportManifest(reportDir: string) {
  const artifacts = []
  for (const file of await collectFiles(reportDir)) {
    if (!file.endsWith('.json') && !file.endsWith('.md')) continue
    const fileStat = await stat(file)
    artifacts.push({
      relativePath: path.relative(reportDir, file).split(path.sep).join('/'),
      sizeBytes: fileStat.size,
      sha256: await sha256File(file),
    })
  }
  return artifacts
}

function safeJson(input: string): unknown {
  try {
    return JSON.parse(input)
  } catch {
    return null
  }
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null
}

function toStatus(value: unknown, fallback: PhaseStatus): PhaseStatus {
  return value === 'passed' || value === 'blocked' || value === 'warning' || value === 'not_run' || value === 'skipped'
    ? value
    : fallback
}

function toBetaStatus(value: unknown, fallback: AudioTimingBetaStatus): AudioTimingBetaStatus {
  return value === 'blocked'
    || value === 'phase-complete but tool-family incomplete'
    || value === 'internally beta-ready candidate'
    || value === 'external beta still blocked'
    ? value
    : fallback
}

function buildLinuxSummary(status: PhaseStatus, betaStatus: AudioTimingBetaStatus): DeepFilterNetLinuxRuntimeSummary {
  return {
    phase: DEEPFILTERNET_RUNTIME_HARDENING_PHASE,
    runId: DEEPFILTERNET_LINUX_RUNTIME_RUN_ID,
    status,
    audioTimingToolFamilyBetaStatus: betaStatus,
    linuxRuntimeStatus: 'not_run',
    cloudBuildStatus: 'not_run',
    cloudRunJobStatus: 'not_run',
    ffmpegStatus: 'not_run',
    binaryVerificationStatus: 'not_run',
    generatedFixtureStatus: 'not_run',
    controlledExtractionStatus: 'not_run',
    controlledEnhancementStatus: 'not_run',
    privateArtifactStatus: 'not_run',
    privateArtifactPrefix: DEEPFILTERNET_LINUX_PRIVATE_GCS_PREFIX,
    nextPhaseDecision: 'Run Phase 36H Linux runtime completion.',
  }
}

function renderLinuxMarkdown(report: JsonRecord): string {
  return [
    '# Phase 36H Linux Runtime Completion Report',
    '',
    `- Status: ${String(report.status)}`,
    `- Audio/timing tool-family beta status: ${String(report.audioTimingToolFamilyBetaStatus)}`,
    `- Cloud Build: ${String(report.cloudBuildStatus)}`,
    `- Cloud Run Job: ${String(report.cloudRunJobStatus)}`,
    `- Linux runtime smoke: ${String(report.linuxRuntimeStatus)}`,
    `- ffmpeg/ffprobe: ${String(report.ffmpegStatus)}`,
    `- Binary verification: ${String(report.binaryVerificationStatus)}`,
    `- Generated fixture: ${String(report.generatedFixtureStatus)}`,
    `- Controlled extraction: ${String(report.controlledExtractionStatus)}`,
    `- Controlled enhancement: ${String(report.controlledEnhancementStatus)}`,
    `- Private artifacts: ${String(report.privateArtifactStatus)}`,
    '',
    'Signalsmith Stretch, Demucs, VLM, OCR, providers, production, beta, public output, broad media, arbitrary media, and Track A remain blocked.',
  ].join('\n')
}

void PHASE_36G_REPORT
void PHASE_36C_REPORT
void PHASE_36D_REPORT
void PHASE_36H_INITIAL_REPORT
void buildCommittedReportManifest
