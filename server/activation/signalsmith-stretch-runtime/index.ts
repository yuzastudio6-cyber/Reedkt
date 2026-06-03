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

export const SIGNALSMITH_RUNTIME_PHASE = '36I'
export const SIGNALSMITH_RUNTIME_RUN_ID = 'phase36i-signalsmith-stretch-generated-fixture-20260603'
export const SIGNALSMITH_RUNTIME_REPORT_DIR = 'docs/activation-phase-36i-signalsmith-stretch-generated-fixture-reports'
export const SIGNALSMITH_RUNTIME_BRANCH = 'codex/rp-activation-36i-signalsmith-stretch-generated-fixture'
export const SIGNALSMITH_RUNTIME_BASE_BRANCH = 'codex/rp-activation-36h-deepfilternet-runtime-hardening-controlled-speech'
export const SIGNALSMITH_PRIVATE_BUCKET = 'reeditpro-staging-reeditpro-qa-artifacts'
export const SIGNALSMITH_PRIVATE_OBJECT_PREFIX = `activation/phase36i/signalsmith-stretch-generated-audio/${SIGNALSMITH_RUNTIME_RUN_ID}`
export const SIGNALSMITH_PRIVATE_GCS_PREFIX = `gs://${SIGNALSMITH_PRIVATE_BUCKET}/${SIGNALSMITH_PRIVATE_OBJECT_PREFIX}/`

const SIGNALSMITH_OFFICIAL_URL = 'https://signalsmith-audio.co.uk/code/stretch/'
const SIGNALSMITH_GITHUB_URL = 'https://github.com/Signalsmith-Audio/signalsmith-stretch'
const SIGNALSMITH_LICENSE_URL = 'https://github.com/Signalsmith-Audio/signalsmith-stretch/blob/main/LICENSE.txt'
const SIGNALSMITH_REPO_URL = 'https://github.com/Signalsmith-Audio/signalsmith-stretch.git'
const SIGNALSMITH_SELECTED_TAG = '1.1.0'
const SIGNALSMITH_SELECTED_COMMIT = '44c8f865af9da8c29cc4a70a2d5a3ec83639c711'
const SIGNALSMITH_UPSTREAM_MAIN_HEAD = '57b93f4e9206a089a45387eaa39bdc9f310d3308'
const WORKER_PATH = 'server/workers/signalsmith-stretch-runtime/run_signalsmith_generated_suite.py'

export const SIGNALSMITH_RUNTIME_EXPECTED_REPORT_FILES = [
  'phase_36i_signalsmith_runtime_plan.json',
  'phase_36i_signalsmith_source_evidence.json',
  'phase_36i_signalsmith_license_evidence.json',
  'phase_36i_signalsmith_runtime_evidence.json',
  'phase_36i_signalsmith_dependency_risk_report.json',
  'phase_36i_signalsmith_source_selection_manifest.json',
  'phase_36i_signalsmith_source_checksum_manifest.json',
  'phase_36i_signalsmith_runtime_preflight.json',
  'phase_36i_signalsmith_build_report.json',
  'phase_36i_signalsmith_runtime_binary_manifest.json',
  'phase_36i_signalsmith_generated_fixture_manifest.json',
  'phase_36i_signalsmith_generated_audio_qa_report.json',
  'phase_36i_signalsmith_audio_metrics_report.json',
  'phase_36i_private_artifact_manifest.json',
  'phase_36i_signalsmith_runtime_generated_fixture_report.json',
  'phase_36i_audio_timing_beta_status_report.json',
  'phase_36i_blocker_report.json',
] as const

const REQUIRED_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_SIGNALSMITH_APPROVAL',
  'REEDITPRO_CONFIRM_SIGNALSMITH_SOURCE_FETCH',
  'REEDITPRO_CONFIRM_SIGNALSMITH_RUNTIME_BUILD',
  'REEDITPRO_CONFIRM_SIGNALSMITH_GENERATED_AUDIO',
  'REEDITPRO_CONFIRM_SIGNALSMITH_PRIVATE_ARTIFACT_UPLOAD',
]

const FORBIDDEN_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_SIGNALSMITH_CONTROLLED_REAL_AUDIO',
  'REEDITPRO_CONFIRM_SIGNALSMITH_CONTROLLED_MEDIA_READ',
  'REEDITPRO_CONFIRM_BROAD_MEDIA_PROCESSING',
  'REEDITPRO_CONFIRM_ARBITRARY_MEDIA_INPUT',
  'REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_OCR_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_DEMUCS_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_DEEPFILTERNET_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_TRACK_A_RUNTIME',
]

const BLOCKED_SCOPES = [
  'Phase 36J controlled real-media timing/stretch until Phase 36I passes',
  'Demucs until provenance/legal approval',
  'Demucs download/runtime/source separation',
  'DeepFilterNet runtime execution in Phase 36I',
  'controlled real media',
  'real media',
  'broad media',
  'arbitrary media paths',
  'public media URLs',
  'signed URLs as source of truth',
  'VLM runtime retries',
  'OCR runtime',
  'provider calls',
  'production',
  'internal beta unlock',
  'external beta',
  'paid production',
  'public output',
  'Docker/Cloud Build/Cloud Run',
  'GPU jobs',
  'IAM mutation',
  'Track A runtime/visual/render stack',
]

const GENERATED_FIXTURES = [
  {
    fixtureId: 'generated-stretch-sine-noise-125',
    sourceKind: 'sine_440_hz_with_deterministic_noise',
    sampleRate: 48000,
    channels: 1,
    inputDurationSeconds: 2.0,
    stretchRatio: 1.25,
    expectedOutputDurationSeconds: 2.5,
    durationTolerancePercent: 2,
    blocking: true,
  },
  {
    fixtureId: 'generated-stretch-chirp-075',
    sourceKind: 'chirp_sweep_with_envelope',
    sampleRate: 48000,
    channels: 1,
    inputDurationSeconds: 2.0,
    stretchRatio: 0.75,
    expectedOutputDurationSeconds: 1.5,
    durationTolerancePercent: 2,
    blocking: true,
  },
  {
    fixtureId: 'generated-stretch-click-track-150',
    sourceKind: 'deterministic_click_track_transient_stress',
    sampleRate: 48000,
    channels: 1,
    inputDurationSeconds: 2.0,
    stretchRatio: 1.5,
    expectedOutputDurationSeconds: 3.0,
    durationTolerancePercent: 5,
    blocking: true,
    stressFixture: true,
  },
] as const

export interface SignalsmithRuntimeSummary {
  phase: typeof SIGNALSMITH_RUNTIME_PHASE
  runId: string
  status: PhaseStatus
  audioTimingToolFamilyBetaStatus: AudioTimingBetaStatus
  sourceEvidenceStatus: string
  licenseEvidenceStatus: string
  runtimeEvidenceStatus: string
  phase36HEvidenceStatus: string
  runtimePreflightStatus: string
  sourceAcquisitionStatus: string
  runtimeBuildStatus: string
  generatedFixtureStatus: string
  audioQaStatus: string
  privateArtifactStatus: string
  nextPhaseDecision: string
}

export function getSignalsmithRuntimePlan() {
  return {
    phase: SIGNALSMITH_RUNTIME_PHASE,
    runId: SIGNALSMITH_RUNTIME_RUN_ID,
    branch: SIGNALSMITH_RUNTIME_BRANCH,
    baseBranch: SIGNALSMITH_RUNTIME_BASE_BRANCH,
    sourcePhase36HPr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/140',
    sourceEvidence: {
      officialProjectPage: SIGNALSMITH_OFFICIAL_URL,
      githubMirror: SIGNALSMITH_GITHUB_URL,
      license: SIGNALSMITH_LICENSE_URL,
      selectedTag: SIGNALSMITH_SELECTED_TAG,
      selectedCommit: SIGNALSMITH_SELECTED_COMMIT,
      upstreamMainHeadForReferenceOnly: SIGNALSMITH_UPSTREAM_MAIN_HEAD,
      sourcePolicy: 'temp_fetch_exact_tag_no_vendoring',
    },
    generatedFixtures: GENERATED_FIXTURES,
    executionConfirmations: REQUIRED_CONFIRMATIONS,
    forbiddenConfirmations: FORBIDDEN_CONFIRMATIONS,
    workerPath: WORKER_PATH,
    privateArtifactPrefix: SIGNALSMITH_PRIVATE_GCS_PREFIX,
    noRealMedia: true,
    noControlledMedia: true,
    noArbitraryMedia: true,
    noBroadMedia: true,
    noDeepFilterNetRuntime: true,
    noDemucs: true,
    noVlm: true,
    noOcr: true,
    noTrackA: true,
    audioTimingToolFamilyBetaStatus: 'blocked' as AudioTimingBetaStatus,
    blockedScopes: BLOCKED_SCOPES,
  }
}

export function buildSignalsmithRuntimeIamPlan() {
  return [
    {
      id: 'phase36i-private-qa-create',
      status: 'documentation_only',
      bucket: SIGNALSMITH_PRIVATE_BUCKET,
      member: 'current operator or approved worker identity',
      role: 'roles/storage.objectCreator',
      conditionTitle: 'phase36i-signalsmith-generated-audio-create',
      conditionExpression: `resource.name.startsWith('projects/_/buckets/${SIGNALSMITH_PRIVATE_BUCKET}/objects/${SIGNALSMITH_PRIVATE_OBJECT_PREFIX}/')`,
      commandString: 'No IAM mutation is performed in Phase 36I.',
    },
    {
      id: 'phase36i-private-qa-readback',
      status: 'documentation_only',
      bucket: SIGNALSMITH_PRIVATE_BUCKET,
      member: 'current operator or approved worker identity',
      role: 'roles/storage.objectViewer',
      conditionTitle: 'phase36i-signalsmith-generated-audio-readback',
      conditionExpression: `resource.name.startsWith('projects/_/buckets/${SIGNALSMITH_PRIVATE_BUCKET}/objects/${SIGNALSMITH_PRIVATE_OBJECT_PREFIX}/')`,
      commandString: 'No IAM mutation is performed in Phase 36I.',
    },
  ]
}

export function buildSignalsmithRuntimeCostSummary() {
  return {
    phase: SIGNALSMITH_RUNTIME_PHASE,
    runId: SIGNALSMITH_RUNTIME_RUN_ID,
    status: 'estimated',
    localCpuBuild: 'low',
    generatedAudioRuntime: 'low',
    cloudBuild: 'not_used',
    cloudRun: 'not_used',
    gpu: 'not_used',
    privateArtifactUpload: 'small_generated_audio_and_json_only',
    expectedCostUsd: 'near_zero_local_plus_private_storage_egress_if_upload_runs',
  }
}

export async function writeSignalsmithRuntimeStaticArtifacts(reportDir = SIGNALSMITH_RUNTIME_REPORT_DIR): Promise<void> {
  await writeReports(buildReports({
    mode: 'static',
    reportDir,
    preflight: await buildRuntimePreflight(),
    workerResult: buildNotRunWorkerResult(),
    privateArtifactStatus: buildPrivateArtifactStatus('not_run', 'Execution confirmation not supplied.'),
  }), reportDir)
}

export async function readSignalsmithRuntimeSummary(reportDir = SIGNALSMITH_RUNTIME_REPORT_DIR): Promise<SignalsmithRuntimeSummary> {
  const reportPath = path.join(reportDir, 'phase_36i_signalsmith_runtime_generated_fixture_report.json')
  if (!existsSync(reportPath)) return buildSummary('not_run', 'blocked')
  const report = await readJson(reportPath)
  return {
    phase: SIGNALSMITH_RUNTIME_PHASE,
    runId: SIGNALSMITH_RUNTIME_RUN_ID,
    status: toStatus(report.status, 'not_run'),
    audioTimingToolFamilyBetaStatus: toBetaStatus(report.audioTimingToolFamilyBetaStatus, 'blocked'),
    sourceEvidenceStatus: String(report.sourceEvidenceStatus ?? 'unknown'),
    licenseEvidenceStatus: String(report.licenseEvidenceStatus ?? 'unknown'),
    runtimeEvidenceStatus: String(report.runtimeEvidenceStatus ?? 'unknown'),
    phase36HEvidenceStatus: String(report.phase36HEvidenceStatus ?? 'unknown'),
    runtimePreflightStatus: String(report.runtimePreflightStatus ?? 'unknown'),
    sourceAcquisitionStatus: String(report.sourceAcquisitionStatus ?? 'unknown'),
    runtimeBuildStatus: String(report.runtimeBuildStatus ?? 'unknown'),
    generatedFixtureStatus: String(report.generatedFixtureStatus ?? 'unknown'),
    audioQaStatus: String(report.audioQaStatus ?? 'unknown'),
    privateArtifactStatus: String(report.privateArtifactStatus ?? 'unknown'),
    nextPhaseDecision: String(report.nextPhaseDecision ?? 'Run Phase 36I Signalsmith generated fixture.'),
  }
}

export async function executeSignalsmithRuntime(input: {
  reportDir?: string
  keepTemp?: boolean
} = {}): Promise<SignalsmithRuntimeSummary> {
  requireExecutionConfirmations()
  const reportDir = input.reportDir ?? SIGNALSMITH_RUNTIME_REPORT_DIR
  const runtimeRoot = path.join(os.tmpdir(), 'reeditpro-phase36i-signalsmith-stretch-runtime', SIGNALSMITH_RUNTIME_RUN_ID)
  const artifactDir = path.join(runtimeRoot, 'private-artifacts')
  await mkdir(artifactDir, { recursive: true })

  const preflight = await buildRuntimePreflight()
  let workerResult = buildNotRunWorkerResult(preflight.blockers as string[] | undefined)
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
      SIGNALSMITH_PRIVATE_GCS_PREFIX,
      '--run-id',
      SIGNALSMITH_RUNTIME_RUN_ID,
      ...(input.keepTemp ? ['--keep-temp'] : []),
    ], {
      env: { ...process.env, CLOUDSDK_CORE_DISABLE_PROMPTS: '1' },
      maxBuffer: 1024 * 1024 * 20,
      timeout: 1000 * 60 * 20,
    })
    workerResult = JSON.parse(proc.stdout) as JsonRecord
  }

  const privateArtifactStatus = await buildPrivateArtifactStatusFromWorker(workerResult)
  await writeReports(buildReports({
    mode: 'execute',
    reportDir,
    preflight,
    workerResult,
    privateArtifactStatus,
  }), reportDir)
  if (!input.keepTemp) {
    // The worker removes its non-artifact temp tree; local artifacts remain in /tmp only for debugging when keep-temp is set.
  }
  return readSignalsmithRuntimeSummary(reportDir)
}

function requireExecutionConfirmations(): void {
  const missing = REQUIRED_CONFIRMATIONS.filter((name) => process.env[name] !== 'true')
  const forbidden = FORBIDDEN_CONFIRMATIONS.filter((name) => process.env[name] === 'true')
  if (missing.length || forbidden.length) {
    throw new Error(`signalsmith_confirmation_gate_failed missing=${missing.join(',')} forbidden=${forbidden.join(',')}`)
  }
}

async function buildRuntimePreflight(): Promise<JsonRecord> {
  const checks = await Promise.all([
    runOptionalVersion('python3', ['--version']),
    runOptionalVersion('c++', ['--version']),
    runOptionalVersion('clang++', ['--version']),
    runOptionalVersion('g++', ['--version']),
    runOptionalVersion('git', ['--version']),
    runOptionalVersion('curl', ['--version']),
  ])
  const compilerAvailable = checks.some((check) => ['c++', 'clang++', 'g++'].includes(String(check.command)) && check.status === 'passed')
  const blockers = [
    ...compilerAvailable ? [] : ['signalsmith_cpp_compiler_unavailable'],
    ...checks.find((check) => check.command === 'python3')?.status === 'passed' ? [] : ['python3_unavailable'],
    ...checks.find((check) => check.command === 'git')?.status === 'passed' ? [] : ['git_unavailable_for_exact_source_fetch'],
  ]
  return {
    phase: SIGNALSMITH_RUNTIME_PHASE,
    runId: SIGNALSMITH_RUNTIME_RUN_ID,
    status: blockers.length ? 'blocked' : 'passed',
    checks,
    compilerAvailable,
    platform: {
      os: os.platform(),
      arch: os.arch(),
      node: process.version,
    },
    tempWorkspacePolicy: 'temp_only_no_repo_binaries_or_source_archives',
    privateArtifactUploadPrefix: SIGNALSMITH_PRIVATE_GCS_PREFIX,
    blockers,
  }
}

async function runOptionalVersion(command: string, args: string[]): Promise<JsonRecord> {
  try {
    const started = Date.now()
    const result = await execFileAsync(command, args, { timeout: 1000 * 10, maxBuffer: 1024 * 256 })
    return {
      command,
      args,
      status: 'passed',
      durationMs: Date.now() - started,
      stdoutSummary: [...result.stdout.split('\n'), ...result.stderr.split('\n')].filter(Boolean).slice(0, 4).join('\n'),
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

function buildReports(input: {
  mode: 'static' | 'execute'
  reportDir: string
  preflight: JsonRecord
  workerResult: JsonRecord
  privateArtifactStatus: JsonRecord
}): Record<string, unknown> {
  const plan = getSignalsmithRuntimePlan()
  const worker = input.workerResult
  const sourceStatus = statusFrom(worker.sourceAcquisitionStatus, input.mode === 'static' ? 'not_run' : 'blocked')
  const buildStatus = statusFrom(worker.runtimeBuildStatus, input.mode === 'static' ? 'not_run' : 'blocked')
  const generatedStatus = statusFrom(worker.generatedFixtureStatus, input.mode === 'static' ? 'not_run' : 'blocked')
  const audioQaStatus = statusFrom(worker.audioQaStatus, input.mode === 'static' ? 'not_run' : 'blocked')
  const privateStatus = statusFrom(input.privateArtifactStatus.status, input.mode === 'static' ? 'not_run' : 'blocked')
  const finalStatus: PhaseStatus = (
    sourceStatus === 'passed'
    && buildStatus === 'passed'
    && generatedStatus === 'passed'
    && audioQaStatus === 'passed'
    && privateStatus === 'passed'
  ) ? 'passed' : input.mode === 'static' ? 'not_run' : 'blocked'
  const betaStatus: AudioTimingBetaStatus = finalStatus === 'passed' ? 'phase-complete but tool-family incomplete' : 'blocked'
  const blockers = collectBlockers(input.preflight, worker, input.privateArtifactStatus, finalStatus)

  const sourceEvidence = {
    phase: SIGNALSMITH_RUNTIME_PHASE,
    runId: SIGNALSMITH_RUNTIME_RUN_ID,
    status: 'passed',
    evidence: [
      {
        url: SIGNALSMITH_OFFICIAL_URL,
        evidenceType: 'official_project_page',
        summary: 'Official Signalsmith Stretch page documents a C++11 header-only pitch/time-stretch class, process API, latency/pre-roll caveats, compiler notes, and MIT licensing.',
        dateAccessed: '2026-06-03',
      },
      {
        url: SIGNALSMITH_GITHUB_URL,
        evidenceType: 'official_github_mirror',
        summary: 'GitHub mirror contains signalsmith-stretch.h, include/signalsmith-stretch, dsp support files, README, tags, and MIT license evidence.',
        dateAccessed: '2026-06-03',
      },
    ],
  }

  const licenseEvidence = {
    phase: SIGNALSMITH_RUNTIME_PHASE,
    runId: SIGNALSMITH_RUNTIME_RUN_ID,
    status: 'passed',
    license: 'MIT',
    licenseUrl: SIGNALSMITH_LICENSE_URL,
    productionLegalApproval: 'not_granted',
    caveat: 'Phase 36I records source/license evidence only and does not overclaim production legal approval.',
  }

  const runtimeEvidence = {
    phase: SIGNALSMITH_RUNTIME_PHASE,
    runId: SIGNALSMITH_RUNTIME_RUN_ID,
    status: 'passed',
    selectedSource: {
      repository: SIGNALSMITH_REPO_URL,
      tag: SIGNALSMITH_SELECTED_TAG,
      commit: SIGNALSMITH_SELECTED_COMMIT,
      upstreamMainHeadForReferenceOnly: SIGNALSMITH_UPSTREAM_MAIN_HEAD,
    },
    apiEvidence: [
      'signalsmith::stretch::SignalsmithStretch<float>',
      '.presetDefault(channels, sampleRate)',
      '.process(inputBuffers, inputSamples, outputBuffers, outputSamples)',
      '.setTransposeSemitones(...) available but pitch fixture deferred unless explicitly safe',
    ],
    caveats: [
      'time-stretch best for modest 0.75x-1.5x ratios',
      'latency/pre-roll and flushing must be handled by future production worker design',
      'compiler caveats include AppleClang 16 and fast-math warning from upstream README',
      'Signalsmith Linear support files are required for FFT/speedups',
      'Phase 36I does not select web/npm/Python/Rust wrappers',
    ],
  }

  const fixtureManifest = {
    phase: SIGNALSMITH_RUNTIME_PHASE,
    runId: SIGNALSMITH_RUNTIME_RUN_ID,
    status: generatedStatus,
    generatedAudioOnly: true,
    fixtures: worker.fixtures ?? GENERATED_FIXTURES,
    realMedia: 'blocked',
    controlledMedia: 'blocked',
  }

  const finalReport = {
    phase: SIGNALSMITH_RUNTIME_PHASE,
    runId: SIGNALSMITH_RUNTIME_RUN_ID,
    status: finalStatus,
    audioTimingToolFamilyBetaStatus: betaStatus,
    sourceEvidenceStatus: 'passed',
    licenseEvidenceStatus: 'passed',
    runtimeEvidenceStatus: 'passed',
    phase36HEvidenceStatus: existsSync('docs/activation-phase-36h-deepfilternet-runtime-hardening-controlled-speech-reports/phase_36h_deepfilternet_runtime_hardening_report.json') ? 'loaded' : 'blocked',
    runtimePreflightStatus: String(input.preflight.status ?? 'unknown'),
    sourceAcquisitionStatus: sourceStatus,
    runtimeBuildStatus: buildStatus,
    generatedFixtureStatus: generatedStatus,
    audioQaStatus,
    privateArtifactStatus: privateStatus,
    selectedRevision: SIGNALSMITH_SELECTED_COMMIT,
    generatedAudioOnly: true,
    realMedia: 'not_run_blocked',
    controlledMedia: 'not_run_blocked',
    providerCalls: 'not_run_blocked',
    deepFilterNetRuntime: 'not_run_blocked',
    demucs: 'not_run_blocked',
    vlm: 'not_run_blocked',
    ocr: 'not_run_blocked',
    trackA: 'not_touched',
    blockers,
    nextPhaseDecision: finalStatus === 'passed'
      ? 'Proceed to Phase 36J controlled real-media timing/stretch sample.'
      : 'Resolve exact Phase 36I blocker before controlled real-media timing/stretch.',
  }

  return {
    'phase_36i_signalsmith_runtime_plan.json': plan,
    'phase_36i_signalsmith_source_evidence.json': sourceEvidence,
    'phase_36i_signalsmith_license_evidence.json': licenseEvidence,
    'phase_36i_signalsmith_runtime_evidence.json': runtimeEvidence,
    'phase_36i_signalsmith_dependency_risk_report.json': {
      phase: SIGNALSMITH_RUNTIME_PHASE,
      runId: SIGNALSMITH_RUNTIME_RUN_ID,
      status: 'warning',
      risks: runtimeEvidence.caveats,
      wrappersNotSelected: ['web_audio_wasm_npm', 'python_binding', 'rust_wrapper'],
      productionApproval: 'blocked',
    },
    'phase_36i_signalsmith_source_selection_manifest.json': {
      phase: SIGNALSMITH_RUNTIME_PHASE,
      runId: SIGNALSMITH_RUNTIME_RUN_ID,
      status: sourceStatus,
      repository: SIGNALSMITH_REPO_URL,
      selectedTag: SIGNALSMITH_SELECTED_TAG,
      selectedCommit: SIGNALSMITH_SELECTED_COMMIT,
      upstreamMainHeadForReferenceOnly: SIGNALSMITH_UPSTREAM_MAIN_HEAD,
      actualCommit: worker.actualCommit ?? null,
      selectionPolicy: 'exact_tag_commit_no_floating_main',
    },
    'phase_36i_signalsmith_source_checksum_manifest.json': {
      phase: SIGNALSMITH_RUNTIME_PHASE,
      runId: SIGNALSMITH_RUNTIME_RUN_ID,
      status: sourceStatus,
      checksums: worker.sourceChecksums ?? [],
    },
    'phase_36i_signalsmith_runtime_preflight.json': input.preflight,
    'phase_36i_signalsmith_build_report.json': worker.buildReport ?? buildNotRunReport('runtime_build', buildStatus),
    'phase_36i_signalsmith_runtime_binary_manifest.json': worker.binaryManifest ?? buildNotRunReport('runtime_binary', buildStatus),
    'phase_36i_signalsmith_generated_fixture_manifest.json': fixtureManifest,
    'phase_36i_signalsmith_generated_audio_qa_report.json': worker.generatedAudioQaReport ?? buildNotRunReport('generated_audio_qa', generatedStatus),
    'phase_36i_signalsmith_audio_metrics_report.json': worker.audioMetricsReport ?? buildNotRunReport('audio_metrics', audioQaStatus),
    'phase_36i_private_artifact_manifest.json': input.privateArtifactStatus,
    'phase_36i_signalsmith_runtime_generated_fixture_report.json': finalReport,
    'phase_36i_audio_timing_beta_status_report.json': {
      phase: SIGNALSMITH_RUNTIME_PHASE,
      runId: SIGNALSMITH_RUNTIME_RUN_ID,
      status: finalStatus,
      audioTimingToolFamilyBetaStatus: betaStatus,
      internalBeta: 'blocked',
      externalBeta: 'blocked',
      production: 'blocked',
      nextPhaseDecision: finalReport.nextPhaseDecision,
    },
    'phase_36i_blocker_report.json': {
      phase: SIGNALSMITH_RUNTIME_PHASE,
      runId: SIGNALSMITH_RUNTIME_RUN_ID,
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
    phase: SIGNALSMITH_RUNTIME_PHASE,
    runId: SIGNALSMITH_RUNTIME_RUN_ID,
    status,
    privateArtifactPrefix: SIGNALSMITH_PRIVATE_GCS_PREFIX,
    objectCount: 0,
    reason,
    publicOutput: 'blocked',
    signedUrls: 'blocked',
  }
}

function buildNotRunWorkerResult(blockers: string[] = []): JsonRecord {
  return {
    status: 'not_run',
    sourceAcquisitionStatus: 'not_run',
    runtimeBuildStatus: 'not_run',
    generatedFixtureStatus: 'not_run',
    audioQaStatus: 'not_run',
    blockers,
  }
}

function buildNotRunReport(id: string, status: string): JsonRecord {
  return {
    id,
    phase: SIGNALSMITH_RUNTIME_PHASE,
    runId: SIGNALSMITH_RUNTIME_RUN_ID,
    status,
    reason: 'not_run',
  }
}

function collectBlockers(preflight: JsonRecord, worker: JsonRecord, privateArtifact: JsonRecord, finalStatus: PhaseStatus): string[] {
  const blockers = new Set<string>()
  for (const value of [preflight.blockers, worker.blockers, privateArtifact.blockers]) {
    if (Array.isArray(value)) for (const blocker of value) blockers.add(String(blocker))
  }
  if (finalStatus !== 'passed') {
    if (preflight.status !== 'passed') blockers.add('signalsmith_runtime_preflight_incomplete')
    if (worker.sourceAcquisitionStatus !== 'passed') blockers.add('signalsmith_exact_source_fetch_or_verification_incomplete')
    if (worker.runtimeBuildStatus !== 'passed') blockers.add('signalsmith_runtime_build_incomplete')
    if (worker.generatedFixtureStatus !== 'passed') blockers.add('signalsmith_generated_fixture_incomplete')
    if (worker.audioQaStatus !== 'passed') blockers.add('signalsmith_audio_qa_incomplete')
    if (privateArtifact.status !== 'passed') blockers.add('signalsmith_private_artifact_upload_incomplete')
  }
  return [...blockers].sort()
}

async function writeReports(reports: Record<string, unknown>, reportDir: string): Promise<void> {
  await mkdir(reportDir, { recursive: true })
  for (const [file, value] of Object.entries(reports)) {
    await writeVlmRuntimeJsonArtifact(path.join(reportDir, file), value)
  }
  await writeVlmRuntimeTextArtifact(path.join(reportDir, 'README.md'), buildReportReadme())
}

function buildReportReadme(): string {
  return [
    '# Phase 36I Signalsmith Stretch Generated Fixture Reports',
    '',
    'Safe metadata reports for the Track B Signalsmith Stretch generated-fixture phase.',
    'Generated audio payloads, source archives, build binaries, caches, real media, controlled media, and secrets are not committed.',
  ].join('\n')
}

async function readJson(filePath: string): Promise<JsonRecord> {
  return JSON.parse(await readFile(filePath, 'utf8')) as JsonRecord
}

function buildSummary(status: PhaseStatus, betaStatus: AudioTimingBetaStatus): SignalsmithRuntimeSummary {
  return {
    phase: SIGNALSMITH_RUNTIME_PHASE,
    runId: SIGNALSMITH_RUNTIME_RUN_ID,
    status,
    audioTimingToolFamilyBetaStatus: betaStatus,
    sourceEvidenceStatus: 'unknown',
    licenseEvidenceStatus: 'unknown',
    runtimeEvidenceStatus: 'unknown',
    phase36HEvidenceStatus: 'unknown',
    runtimePreflightStatus: 'unknown',
    sourceAcquisitionStatus: 'unknown',
    runtimeBuildStatus: 'unknown',
    generatedFixtureStatus: 'unknown',
    audioQaStatus: 'unknown',
    privateArtifactStatus: 'unknown',
    nextPhaseDecision: 'Run Phase 36I Signalsmith generated fixture.',
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

export async function collectSignalsmithReportArtifacts(reportDir = SIGNALSMITH_RUNTIME_REPORT_DIR): Promise<JsonRecord[]> {
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
