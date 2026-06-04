import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, readdir, stat } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'

const execFileAsync = promisify(execFile)

type PhaseStatus = 'passed' | 'blocked' | 'warning' | 'not_run' | 'skipped'
type AudioTimingBetaStatus =
  | 'blocked'
  | 'phase-complete but tool-family incomplete'
  | 'internally beta-ready candidate'
  | 'external beta still blocked'
type JsonRecord = Record<string, unknown>

export const SIGNALSMITH_CONTROLLED_PHASE = '36J'
export const SIGNALSMITH_CONTROLLED_RUN_ID = 'phase36j-controlled-real-media-timing-stretch-20260603'
export const SIGNALSMITH_CONTROLLED_REPORT_DIR = 'docs/activation-phase-36j-controlled-real-media-timing-stretch-sample-reports'
export const SIGNALSMITH_CONTROLLED_BRANCH = 'codex/rp-activation-36j-controlled-real-media-timing-stretch-sample'
export const SIGNALSMITH_CONTROLLED_BASE_BRANCH = 'codex/rp-activation-36i-signalsmith-stretch-generated-fixture'
export const SIGNALSMITH_CONTROLLED_PRIVATE_BUCKET = 'reeditpro-staging-reeditpro-qa-artifacts'
export const SIGNALSMITH_CONTROLLED_PRIVATE_OBJECT_PREFIX = `activation/phase36j/controlled-real-media-timing-stretch/${SIGNALSMITH_CONTROLLED_RUN_ID}`
export const SIGNALSMITH_CONTROLLED_PRIVATE_GCS_PREFIX = `gs://${SIGNALSMITH_CONTROLLED_PRIVATE_BUCKET}/${SIGNALSMITH_CONTROLLED_PRIVATE_OBJECT_PREFIX}/`

const SIGNALSMITH_REPO_URL = 'https://github.com/Signalsmith-Audio/signalsmith-stretch.git'
const SIGNALSMITH_SELECTED_TAG = '1.1.0'
const SIGNALSMITH_SELECTED_COMMIT = '44c8f865af9da8c29cc4a70a2d5a3ec83639c711'
const SIGNALSMITH_PHASE36I_REPORT = 'docs/activation-phase-36i-signalsmith-stretch-generated-fixture-reports/phase_36i_signalsmith_runtime_generated_fixture_report.json'
const DEEPFILTERNET_PHASE36H_REPORT = 'docs/activation-phase-36h-deepfilternet-runtime-hardening-controlled-speech-reports/phase_36h_deepfilternet_runtime_hardening_report.json'
const WORKER_PATH = 'server/workers/signalsmith-stretch-runtime/run_signalsmith_controlled_suite.py'

export const SIGNALSMITH_CONTROLLED_SAMPLE = {
  sampleId: 'phase37d-phase32-color-export-safe-zone-window-v1',
  chainId: 'controlled-real-video-chain-phase28-through-phase32-v1',
  sourceGcsUri: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4',
  sourceSha256: '78bd798602d221b894a60dfa34ed1528602c9ece7f657e3f9bbea7fd071cc7fa',
  windowStartSeconds: 6.9,
  windowEndSeconds: 8.9,
  maxDurationSeconds: 5,
  privateOnly: true,
} as const

export const SIGNALSMITH_CONTROLLED_EXPECTED_REPORT_FILES = [
  'phase_36j_signalsmith_controlled_plan.json',
  'phase_36j_phase36i_evidence_report.json',
  'phase_36j_controlled_timing_stretch_sample_evidence.json',
  'phase_36j_signalsmith_controlled_runtime_preflight.json',
  'phase_36j_signalsmith_controlled_ffmpeg_runtime_smoke_report.json',
  'phase_36j_signalsmith_controlled_cloud_build_report.json',
  'phase_36j_signalsmith_controlled_cloud_run_job_report.json',
  'phase_36j_signalsmith_controlled_runtime_image_report.json',
  'phase_36j_signalsmith_qa_prefix_access_preflight.json',
  'phase_36j_signalsmith_qa_prefix_iam_before.json',
  'phase_36j_signalsmith_qa_prefix_iam_after.json',
  'phase_36j_signalsmith_qa_prefix_iam_delta_report.json',
  'phase_36j_controlled_audio_extraction_report.json',
  'phase_36j_signalsmith_controlled_stretch_report.json',
  'phase_36j_signalsmith_controlled_audio_metrics_report.json',
  'phase_36j_private_artifact_manifest.json',
  'phase_36j_controlled_real_media_timing_stretch_report.json',
  'phase_36j_audio_timing_beta_status_report.json',
  'phase_36j_blocker_report.json',
] as const

const REQUIRED_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_SIGNALSMITH_CONTROLLED_REAL_AUDIO',
  'REEDITPRO_CONFIRM_SIGNALSMITH_CONTROLLED_MEDIA_READ',
  'REEDITPRO_CONFIRM_SIGNALSMITH_CONTROLLED_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_SIGNALSMITH_PRIVATE_ARTIFACT_UPLOAD',
]

const CONDITIONAL_BUILD_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_SIGNALSMITH_SOURCE_FETCH',
  'REEDITPRO_CONFIRM_SIGNALSMITH_RUNTIME_BUILD',
]

const FORBIDDEN_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_SIGNALSMITH_GENERATED_AUDIO',
  'REEDITPRO_CONFIRM_DEEPFILTERNET_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_DEMUCS_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_OCR_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_TRACK_A_RUNTIME',
  'REEDITPRO_CONFIRM_BROAD_MEDIA_PROCESSING',
  'REEDITPRO_CONFIRM_ARBITRARY_MEDIA_INPUT',
  'REEDITPRO_CONFIRM_PROVIDER_CALLS',
  'REEDITPRO_CONFIRM_PRODUCTION_UNLOCK',
  'REEDITPRO_CONFIRM_EXTERNAL_BETA_UNLOCK',
]

const BLOCKED_SCOPES = [
  'Demucs until provenance/legal approval',
  'Demucs download/runtime/source separation',
  'DeepFilterNet runtime execution in Phase 36J',
  'Signalsmith generated fixture rerun except evidence read',
  'OCR runtime',
  'VLM runtime retries',
  'provider calls',
  'arbitrary media paths',
  'broad media',
  'unapproved real media',
  'public media URLs',
  'signed URLs as source of truth',
  'full-video processing',
  'final export',
  'public output',
  'production',
  'internal beta unlock',
  'external beta',
  'paid production',
  'Docker/Cloud Build/Cloud Run unless separately approved',
  'IAM mutation',
  'Track A runtime/visual/render stack',
]

const CONTROLLED_STRETCH_FIXTURES = [
  {
    fixtureId: 'controlled-stretch-expand-110',
    stretchRatio: 1.1,
    durationTolerancePercent: 2,
    blocking: true,
  },
  {
    fixtureId: 'controlled-stretch-contract-090',
    stretchRatio: 0.9,
    durationTolerancePercent: 2,
    blocking: true,
  },
  {
    fixtureId: 'controlled-stretch-expand-125',
    stretchRatio: 1.25,
    durationTolerancePercent: 3,
    blocking: false,
    stressFixture: true,
  },
] as const

export interface SignalsmithControlledSummary {
  phase: typeof SIGNALSMITH_CONTROLLED_PHASE
  runId: string
  status: PhaseStatus
  audioTimingToolFamilyBetaStatus: AudioTimingBetaStatus
  phase36HEvidenceStatus: string
  phase36IEvidenceStatus: string
  controlledSampleEvidenceStatus: string
  runtimePreflightStatus: string
  extractionStatus: string
  controlledStretchStatus: string
  audioQaStatus: string
  privateArtifactStatus: string
  nextPhaseDecision: string
}

export function getSignalsmithControlledRuntimePlan() {
  return {
    phase: SIGNALSMITH_CONTROLLED_PHASE,
    runId: SIGNALSMITH_CONTROLLED_RUN_ID,
    branch: SIGNALSMITH_CONTROLLED_BRANCH,
    baseBranch: SIGNALSMITH_CONTROLLED_BASE_BRANCH,
    sourcePhase36HPr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/140',
    sourcePhase36IPr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/147',
    signalsmithSource: {
      repository: SIGNALSMITH_REPO_URL,
      selectedTag: SIGNALSMITH_SELECTED_TAG,
      selectedCommit: SIGNALSMITH_SELECTED_COMMIT,
      policy: 'reuse_phase36i_exact_source_runtime_path_temp_only',
    },
    selectedSample: SIGNALSMITH_CONTROLLED_SAMPLE,
    controlledStretchFixtures: CONTROLLED_STRETCH_FIXTURES,
    executionConfirmations: REQUIRED_CONFIRMATIONS,
    conditionalBuildConfirmations: CONDITIONAL_BUILD_CONFIRMATIONS,
    forbiddenConfirmations: FORBIDDEN_CONFIRMATIONS,
    workerPath: WORKER_PATH,
    privateArtifactPrefix: SIGNALSMITH_CONTROLLED_PRIVATE_GCS_PREFIX,
    noArbitraryMedia: true,
    noBroadMedia: true,
    noFullVideoProcessing: true,
    noDeepFilterNetRuntime: true,
    noDemucs: true,
    noVlm: true,
    noOcr: true,
    noProviderCalls: true,
    noTrackA: true,
    audioTimingToolFamilyBetaStatus: 'blocked' as AudioTimingBetaStatus,
    blockedScopes: BLOCKED_SCOPES,
  }
}

export function buildSignalsmithControlledRuntimeIamPlan() {
  return [
    {
      id: 'phase36j-source-sample-read',
      status: 'documentation_only',
      bucket: 'reeditpro-staging-reeditpro-final-exports',
      member: 'current operator or approved worker identity',
      role: 'roles/storage.objectViewer',
      conditionTitle: 'phase36j-controlled-source-read',
      conditionExpression: "resource.name == 'projects/_/buckets/reeditpro-staging-reeditpro-final-exports/objects/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4'",
      commandString: 'No IAM mutation is performed in Phase 36J.',
    },
    {
      id: 'phase36j-private-qa-create',
      status: 'documentation_only',
      bucket: SIGNALSMITH_CONTROLLED_PRIVATE_BUCKET,
      member: 'current operator or approved worker identity',
      role: 'roles/storage.objectCreator',
      conditionTitle: 'phase36j-signalsmith-controlled-create',
      conditionExpression: `resource.name.startsWith('projects/_/buckets/${SIGNALSMITH_CONTROLLED_PRIVATE_BUCKET}/objects/${SIGNALSMITH_CONTROLLED_PRIVATE_OBJECT_PREFIX}/')`,
      commandString: 'No IAM mutation is performed in Phase 36J.',
    },
    {
      id: 'phase36j-private-qa-readback',
      status: 'documentation_only',
      bucket: SIGNALSMITH_CONTROLLED_PRIVATE_BUCKET,
      member: 'current operator or approved worker identity',
      role: 'roles/storage.objectViewer',
      conditionTitle: 'phase36j-signalsmith-controlled-readback',
      conditionExpression: `resource.name.startsWith('projects/_/buckets/${SIGNALSMITH_CONTROLLED_PRIVATE_BUCKET}/objects/${SIGNALSMITH_CONTROLLED_PRIVATE_OBJECT_PREFIX}/')`,
      commandString: 'No IAM mutation is performed in Phase 36J.',
    },
  ]
}

export function buildSignalsmithControlledRuntimeCostSummary() {
  return {
    phase: SIGNALSMITH_CONTROLLED_PHASE,
    runId: SIGNALSMITH_CONTROLLED_RUN_ID,
    status: 'estimated',
    localCpuBuild: 'low_if_compiler_available',
    privateControlledSampleRead: 'one_private_mp4_object_read',
    boundedAudioProcessing: '2_second_window_only',
    cloudBuild: 'one_linux_amd64_cpu_image_rebuild_after_worker_upload_patch',
    cloudRun: 'one_private_cpu_only_cloud_run_job_execution',
    gpu: 'not_used',
    privateArtifactUpload: 'small_bounded_audio_and_json_only',
    expectedCostUsd: 'near_zero_local_plus_private_storage_operations',
  }
}

export async function writeSignalsmithControlledRuntimeStaticArtifacts(reportDir = SIGNALSMITH_CONTROLLED_REPORT_DIR): Promise<void> {
  await writeControlledReports(buildControlledReports({
    mode: 'static',
    preflight: await buildControlledRuntimePreflight(),
    workerResult: buildNotRunControlledWorkerResult(),
    privateArtifactStatus: buildPrivateArtifactStatus('not_run', 'Execution confirmation not supplied.'),
  }), reportDir)
}

export async function readSignalsmithControlledRuntimeSummary(reportDir = SIGNALSMITH_CONTROLLED_REPORT_DIR): Promise<SignalsmithControlledSummary> {
  const reportPath = path.join(reportDir, 'phase_36j_controlled_real_media_timing_stretch_report.json')
  if (!existsSync(reportPath)) return buildControlledSummary('not_run', 'blocked')
  const report = await readJson(reportPath)
  return {
    phase: SIGNALSMITH_CONTROLLED_PHASE,
    runId: SIGNALSMITH_CONTROLLED_RUN_ID,
    status: toStatus(report.status, 'not_run'),
    audioTimingToolFamilyBetaStatus: toBetaStatus(report.audioTimingToolFamilyBetaStatus, 'blocked'),
    phase36HEvidenceStatus: String(report.phase36HEvidenceStatus ?? 'unknown'),
    phase36IEvidenceStatus: String(report.phase36IEvidenceStatus ?? 'unknown'),
    controlledSampleEvidenceStatus: String(report.controlledSampleEvidenceStatus ?? 'unknown'),
    runtimePreflightStatus: String(report.runtimePreflightStatus ?? 'unknown'),
    extractionStatus: String(report.extractionStatus ?? 'unknown'),
    controlledStretchStatus: String(report.controlledStretchStatus ?? 'unknown'),
    audioQaStatus: String(report.audioQaStatus ?? 'unknown'),
    privateArtifactStatus: String(report.privateArtifactStatus ?? 'unknown'),
    nextPhaseDecision: String(report.nextPhaseDecision ?? 'Run Phase 36J controlled real-media timing/stretch sample.'),
  }
}

export async function executeSignalsmithControlledRuntime(input: {
  reportDir?: string
  keepTemp?: boolean
} = {}): Promise<SignalsmithControlledSummary> {
  requireControlledExecutionConfirmations()
  const reportDir = input.reportDir ?? SIGNALSMITH_CONTROLLED_REPORT_DIR
  const runtimeRoot = path.join(os.tmpdir(), 'reeditpro-phase36j-signalsmith-controlled-runtime', SIGNALSMITH_CONTROLLED_RUN_ID)
  const artifactDir = path.join(runtimeRoot, 'private-artifacts')
  await mkdir(artifactDir, { recursive: true })

  const preflight = await buildControlledRuntimePreflight()
  let workerResult = buildNotRunControlledWorkerResult(preflight.blockers as string[] | undefined)
  if (preflight.status === 'passed') {
    const proc = await execFileAsync('python3', [
      WORKER_PATH,
      '--work-root',
      runtimeRoot,
      '--artifact-dir',
      artifactDir,
      '--repo-url',
      SIGNALSMITH_REPO_URL,
      '--tag',
      SIGNALSMITH_SELECTED_TAG,
      '--commit',
      SIGNALSMITH_SELECTED_COMMIT,
      '--private-prefix',
      SIGNALSMITH_CONTROLLED_PRIVATE_GCS_PREFIX,
      '--run-id',
      SIGNALSMITH_CONTROLLED_RUN_ID,
      '--source-gcs-uri',
      SIGNALSMITH_CONTROLLED_SAMPLE.sourceGcsUri,
      '--source-sha256',
      SIGNALSMITH_CONTROLLED_SAMPLE.sourceSha256,
      '--window-start',
      String(SIGNALSMITH_CONTROLLED_SAMPLE.windowStartSeconds),
      '--window-end',
      String(SIGNALSMITH_CONTROLLED_SAMPLE.windowEndSeconds),
      ...(input.keepTemp ? ['--keep-temp'] : []),
    ], {
      env: { ...process.env, CLOUDSDK_CORE_DISABLE_PROMPTS: '1' },
      maxBuffer: 1024 * 1024 * 30,
      timeout: 1000 * 60 * 30,
    })
    workerResult = JSON.parse(proc.stdout) as JsonRecord
  }

  const privateArtifactStatus = await buildPrivateArtifactStatusFromWorker(workerResult)
  await writeControlledReports(buildControlledReports({
    mode: 'execute',
    preflight,
    workerResult,
    privateArtifactStatus,
  }), reportDir)
  return readSignalsmithControlledRuntimeSummary(reportDir)
}

function requireControlledExecutionConfirmations(): void {
  const missing = REQUIRED_CONFIRMATIONS.filter((name) => process.env[name] !== 'true')
  const buildMissing = CONDITIONAL_BUILD_CONFIRMATIONS.filter((name) => process.env[name] !== 'true')
  const forbidden = FORBIDDEN_CONFIRMATIONS.filter((name) => process.env[name] === 'true')
  if (missing.length || buildMissing.length || forbidden.length) {
    throw new Error(`signalsmith_controlled_confirmation_gate_failed missing=${missing.join(',')} conditionalBuildMissing=${buildMissing.join(',')} forbidden=${forbidden.join(',')}`)
  }
}

async function buildControlledRuntimePreflight(): Promise<JsonRecord> {
  const checks = await Promise.all([
    runOptionalVersion('python3', ['--version']),
    runOptionalVersion('c++', ['--version']),
    runOptionalVersion('clang++', ['--version']),
    runOptionalVersion('g++', ['--version']),
    runOptionalVersion('git', ['--version']),
    runOptionalVersion('ffmpeg', ['-version']),
    runOptionalVersion('ffprobe', ['-version']),
    runOptionalVersion('gcloud', ['--version']),
  ])
  const compilerAvailable = checks.some((check) => ['c++', 'clang++', 'g++'].includes(String(check.command)) && check.status === 'passed')
  const blockers = [
    ...compilerAvailable ? [] : ['signalsmith_cpp_compiler_unavailable'],
    ...checks.find((check) => check.command === 'python3')?.status === 'passed' ? [] : ['python3_unavailable'],
    ...checks.find((check) => check.command === 'git')?.status === 'passed' ? [] : ['git_unavailable_for_exact_source_fetch'],
    ...checks.find((check) => check.command === 'ffmpeg')?.status === 'passed' ? [] : ['ffmpeg_unavailable_for_bounded_audio_extraction'],
    ...checks.find((check) => check.command === 'ffprobe')?.status === 'passed' ? [] : ['ffprobe_unavailable_for_bounded_audio_validation'],
    ...checks.find((check) => check.command === 'gcloud')?.status === 'passed' ? [] : ['gcloud_unavailable_for_private_sample_read_or_upload'],
    ...existsSync(SIGNALSMITH_PHASE36I_REPORT) ? [] : ['phase36i_generated_fixture_evidence_missing'],
    ...existsSync(DEEPFILTERNET_PHASE36H_REPORT) ? [] : ['phase36h_deepfilternet_evidence_missing'],
  ]
  return {
    phase: SIGNALSMITH_CONTROLLED_PHASE,
    runId: SIGNALSMITH_CONTROLLED_RUN_ID,
    status: blockers.length ? 'blocked' : 'passed',
    checks,
    compilerAvailable,
    phase36IReport: SIGNALSMITH_PHASE36I_REPORT,
    phase36HReport: DEEPFILTERNET_PHASE36H_REPORT,
    selectedSample: SIGNALSMITH_CONTROLLED_SAMPLE,
    platform: {
      os: os.platform(),
      arch: os.arch(),
      node: process.version,
    },
    privateArtifactUploadPrefix: SIGNALSMITH_CONTROLLED_PRIVATE_GCS_PREFIX,
    blockers,
  }
}

async function runOptionalVersion(command: string, args: string[]): Promise<JsonRecord> {
  try {
    const started = Date.now()
    const result = await execFileAsync(command, args, { timeout: 1000 * 10, maxBuffer: 1024 * 512 })
    return {
      command,
      args,
      status: 'passed',
      durationMs: Date.now() - started,
      stdoutSummary: [...result.stdout.split('\n'), ...result.stderr.split('\n')].filter(Boolean).slice(0, 5).join('\n'),
    }
  } catch (error) {
    return {
      command,
      args,
      status: 'blocked',
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

function buildControlledReports(input: {
  mode: 'static' | 'execute'
  preflight: JsonRecord
  workerResult: JsonRecord
  privateArtifactStatus: JsonRecord
}): Record<string, unknown> {
  const worker = input.workerResult
  const extractionStatus = statusFrom(worker.extractionStatus, input.mode === 'static' ? 'not_run' : 'blocked')
  const stretchStatus = statusFrom(worker.controlledStretchStatus, input.mode === 'static' ? 'not_run' : 'blocked')
  const audioQaStatus = statusFrom(worker.audioQaStatus, input.mode === 'static' ? 'not_run' : 'blocked')
  const privateStatus = statusFrom(input.privateArtifactStatus.status, input.mode === 'static' ? 'not_run' : 'blocked')
  const phase36IStatus = existsSync(SIGNALSMITH_PHASE36I_REPORT) ? 'loaded' : 'blocked'
  const phase36HStatus = existsSync(DEEPFILTERNET_PHASE36H_REPORT) ? 'loaded' : 'blocked'
  const sampleStatus = statusFrom(worker.controlledSampleEvidenceStatus, input.mode === 'static' ? 'not_run' : 'blocked')
  const finalStatus: PhaseStatus = (
    phase36IStatus === 'loaded'
    && sampleStatus === 'passed'
    && extractionStatus === 'passed'
    && stretchStatus === 'passed'
    && audioQaStatus === 'passed'
    && privateStatus === 'passed'
  ) ? 'passed' : input.mode === 'static' ? 'not_run' : 'blocked'
  const betaStatus: AudioTimingBetaStatus = finalStatus === 'passed' ? 'phase-complete but tool-family incomplete' : 'blocked'
  const blockers = collectControlledBlockers(input.preflight, worker, input.privateArtifactStatus, finalStatus)

  const sampleEvidence = {
    phase: SIGNALSMITH_CONTROLLED_PHASE,
    runId: SIGNALSMITH_CONTROLLED_RUN_ID,
    status: sampleStatus,
    selectedSample: SIGNALSMITH_CONTROLLED_SAMPLE,
    evidenceSources: [
      'docs/activation-phase-36h-deepfilternet-runtime-hardening-controlled-speech-reports/phase_36h_controlled_audio_sample_evidence.json',
      'docs/activation-phase-46c-controlled-real-video-media-data-suite-reports/phase_46c_controlled_sample_evidence.json',
      'docs/activation-phase-37d-controlled-real-video-ocr-safe-zone.md',
    ],
    sourceSha256Verified: worker.sourceSha256Verified ?? false,
    privateOnly: true,
    publicUrlStatus: 'blocked',
    signedUrlAsSourceOfTruth: 'blocked',
  }

  const finalReport = {
    phase: SIGNALSMITH_CONTROLLED_PHASE,
    runId: SIGNALSMITH_CONTROLLED_RUN_ID,
    status: finalStatus,
    audioTimingToolFamilyBetaStatus: betaStatus,
    phase36HEvidenceStatus: phase36HStatus,
    phase36IEvidenceStatus: phase36IStatus,
    controlledSampleEvidenceStatus: sampleStatus,
    runtimePreflightStatus: String(input.preflight.status ?? 'unknown'),
    extractionStatus,
    controlledStretchStatus: stretchStatus,
    audioQaStatus,
    privateArtifactStatus: privateStatus,
    selectedSample: SIGNALSMITH_CONTROLLED_SAMPLE,
    stretchFixtures: CONTROLLED_STRETCH_FIXTURES,
    boundedControlledAudioOnly: true,
    arbitraryMedia: 'not_run_blocked',
    broadMedia: 'not_run_blocked',
    providerCalls: 'not_run_blocked',
    deepFilterNetRuntime: 'not_run_blocked',
    demucs: 'not_run_blocked',
    vlm: 'not_run_blocked',
    ocr: 'not_run_blocked',
    trackA: 'not_touched',
    blockers,
    nextPhaseDecision: finalStatus === 'passed'
      ? 'Proceed to Phase 36K Demucs provenance approval retry or audio/timing beta-readiness decision gate if Demucs remains explicitly out of internal scope.'
      : 'Resolve exact Phase 36J blocker before audio/timing beta-readiness or Demucs follow-up.',
  }

  return {
    'phase_36j_signalsmith_controlled_plan.json': getSignalsmithControlledRuntimePlan(),
    'phase_36j_phase36i_evidence_report.json': {
      phase: SIGNALSMITH_CONTROLLED_PHASE,
      runId: SIGNALSMITH_CONTROLLED_RUN_ID,
      status: phase36IStatus,
      phase36IReport: SIGNALSMITH_PHASE36I_REPORT,
      phase36HReport: DEEPFILTERNET_PHASE36H_REPORT,
      selectedSignalsmithCommit: SIGNALSMITH_SELECTED_COMMIT,
      generatedFixtureEvidenceRequired: true,
      signalsmithGeneratedFixtureRerun: 'not_run',
    },
    'phase_36j_controlled_timing_stretch_sample_evidence.json': sampleEvidence,
    'phase_36j_signalsmith_controlled_runtime_preflight.json': input.preflight,
    'phase_36j_controlled_audio_extraction_report.json': worker.extractionReport ?? buildNotRunReport('controlled_audio_extraction', extractionStatus),
    'phase_36j_signalsmith_controlled_stretch_report.json': worker.controlledStretchReport ?? buildNotRunReport('controlled_stretch', stretchStatus),
    'phase_36j_signalsmith_controlled_audio_metrics_report.json': worker.audioMetricsReport ?? buildNotRunReport('controlled_audio_metrics', audioQaStatus),
    'phase_36j_private_artifact_manifest.json': input.privateArtifactStatus,
    'phase_36j_controlled_real_media_timing_stretch_report.json': finalReport,
    'phase_36j_audio_timing_beta_status_report.json': {
      phase: SIGNALSMITH_CONTROLLED_PHASE,
      runId: SIGNALSMITH_CONTROLLED_RUN_ID,
      status: finalStatus,
      audioTimingToolFamilyBetaStatus: betaStatus,
      internalBeta: 'blocked',
      externalBeta: 'blocked',
      production: 'blocked',
      nextPhaseDecision: finalReport.nextPhaseDecision,
    },
    'phase_36j_blocker_report.json': {
      phase: SIGNALSMITH_CONTROLLED_PHASE,
      runId: SIGNALSMITH_CONTROLLED_RUN_ID,
      status: blockers.length ? 'blocked' : 'passed',
      blockers,
      blockedScopes: BLOCKED_SCOPES,
    },
  }
}

async function buildPrivateArtifactStatusFromWorker(workerResult: JsonRecord): Promise<JsonRecord> {
  if (workerResult.privateArtifactManifest && typeof workerResult.privateArtifactManifest === 'object') {
    return workerResult.privateArtifactManifest as JsonRecord
  }
  return buildPrivateArtifactStatus('blocked', 'Worker did not emit private artifact manifest.')
}

function buildPrivateArtifactStatus(status: PhaseStatus, reason: string): JsonRecord {
  return {
    phase: SIGNALSMITH_CONTROLLED_PHASE,
    runId: SIGNALSMITH_CONTROLLED_RUN_ID,
    status,
    privateArtifactPrefix: SIGNALSMITH_CONTROLLED_PRIVATE_GCS_PREFIX,
    objectCount: 0,
    reason,
    publicOutput: 'blocked',
    signedUrls: 'blocked',
  }
}

function buildNotRunControlledWorkerResult(blockers: string[] = []): JsonRecord {
  return {
    status: 'not_run',
    controlledSampleEvidenceStatus: 'not_run',
    extractionStatus: 'not_run',
    controlledStretchStatus: 'not_run',
    audioQaStatus: 'not_run',
    blockers,
  }
}

function buildNotRunReport(id: string, status: string): JsonRecord {
  return {
    id,
    phase: SIGNALSMITH_CONTROLLED_PHASE,
    runId: SIGNALSMITH_CONTROLLED_RUN_ID,
    status,
    reason: 'not_run',
  }
}

function collectControlledBlockers(preflight: JsonRecord, worker: JsonRecord, privateArtifact: JsonRecord, finalStatus: PhaseStatus): string[] {
  const blockers = new Set<string>()
  for (const value of [preflight.blockers, worker.blockers, privateArtifact.blockers]) {
    if (Array.isArray(value)) for (const blocker of value) blockers.add(String(blocker))
  }
  if (finalStatus !== 'passed') {
    if (preflight.status !== 'passed') {
      blockers.add('signalsmith_controlled_runtime_preflight_incomplete')
      return [...blockers].sort()
    }
    if (!existsSync(SIGNALSMITH_PHASE36I_REPORT)) blockers.add('phase36i_generated_fixture_evidence_missing')
    if (worker.controlledSampleEvidenceStatus !== 'passed') blockers.add('approved_controlled_timing_stretch_sample_missing')
    if (worker.extractionStatus !== 'passed') blockers.add('controlled_audio_extraction_incomplete')
    if (worker.controlledStretchStatus !== 'passed') blockers.add('signalsmith_controlled_stretch_incomplete')
    if (worker.audioQaStatus !== 'passed') blockers.add('signalsmith_controlled_audio_qa_incomplete')
    if (privateArtifact.status !== 'passed') blockers.add('signalsmith_controlled_private_artifact_upload_incomplete')
  }
  return [...blockers].sort()
}

async function writeControlledReports(reports: Record<string, unknown>, reportDir: string): Promise<void> {
  await mkdir(reportDir, { recursive: true })
  for (const [file, value] of Object.entries(reports)) {
    await writeVlmRuntimeJsonArtifact(path.join(reportDir, file), value)
  }
  await writeVlmRuntimeTextArtifact(path.join(reportDir, 'README.md'), buildControlledReportReadme())
}

function buildControlledReportReadme(): string {
  return [
    '# Phase 36J Controlled Real-Media Timing Stretch Reports',
    '',
    'Safe metadata reports for one bounded approved private controlled sample through the Phase 36I Signalsmith Stretch runtime path.',
    'Raw controlled media, bounded audio, stretched audio, waveforms, spectrograms, transcripts, public URLs, and secrets are not committed.',
  ].join('\n')
}

async function readJson(filePath: string): Promise<JsonRecord> {
  return JSON.parse(await readFile(filePath, 'utf8')) as JsonRecord
}

function buildControlledSummary(status: PhaseStatus, betaStatus: AudioTimingBetaStatus): SignalsmithControlledSummary {
  return {
    phase: SIGNALSMITH_CONTROLLED_PHASE,
    runId: SIGNALSMITH_CONTROLLED_RUN_ID,
    status,
    audioTimingToolFamilyBetaStatus: betaStatus,
    phase36HEvidenceStatus: 'unknown',
    phase36IEvidenceStatus: 'unknown',
    controlledSampleEvidenceStatus: 'unknown',
    runtimePreflightStatus: 'unknown',
    extractionStatus: 'unknown',
    controlledStretchStatus: 'unknown',
    audioQaStatus: 'unknown',
    privateArtifactStatus: 'unknown',
    nextPhaseDecision: 'Run Phase 36J controlled real-media timing/stretch sample.',
  }
}

function toStatus(value: unknown, fallback: PhaseStatus): PhaseStatus {
  return ['passed', 'blocked', 'warning', 'not_run', 'skipped'].includes(String(value)) ? value as PhaseStatus : fallback
}

function toBetaStatus(value: unknown, fallback: AudioTimingBetaStatus): AudioTimingBetaStatus {
  return [
    'blocked',
    'phase-complete but tool-family incomplete',
    'internally beta-ready candidate',
    'external beta still blocked',
  ].includes(String(value)) ? value as AudioTimingBetaStatus : fallback
}

function statusFrom(value: unknown, fallback: PhaseStatus): PhaseStatus {
  return toStatus(value, fallback)
}

export async function collectSignalsmithControlledReportArtifacts(reportDir = SIGNALSMITH_CONTROLLED_REPORT_DIR): Promise<JsonRecord[]> {
  if (!existsSync(reportDir)) return []
  const files = await collectFiles(reportDir)
  return Promise.all(files.map(async (file) => {
    const fileStat = await stat(file)
    const relative = path.relative(reportDir, file).split(path.sep).join('/')
    return {
      relativePath: relative,
      sizeBytes: fileStat.size,
      sha256: createHash('sha256').update(await readFile(file)).digest('hex'),
    }
  }))
}

async function collectFiles(root: string, prefix = ''): Promise<string[]> {
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
