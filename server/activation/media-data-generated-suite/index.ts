import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { copyFile, mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'

const execFileAsync = promisify(execFile)

export const MEDIA_DATA_GENERATED_SUITE_PHASE = '46B'
export const MEDIA_DATA_GENERATED_SUITE_RUN_ID = 'phase46b-generated-media-data-suite-20260603'
export const MEDIA_DATA_GENERATED_SUITE_REPORT_DIR = 'docs/activation-phase-46b-generated-media-data-suite-reports'
export const MEDIA_DATA_GENERATED_SUITE_BRANCH = 'codex/rp-activation-46b-generated-media-data-analysis-suite'
export const MEDIA_DATA_GENERATED_SUITE_BASE_BRANCH = 'codex/rp-activation-46a-media-data-tool-readiness-audit'
export const MEDIA_DATA_GENERATED_SUITE_PRIVATE_BUCKET = 'reeditpro-staging-reeditpro-qa-artifacts'
export const MEDIA_DATA_GENERATED_SUITE_PRIVATE_OBJECT_PREFIX = `activation/phase46b/generated-media-data-suite/${MEDIA_DATA_GENERATED_SUITE_RUN_ID}`
export const MEDIA_DATA_GENERATED_SUITE_PRIVATE_GCS_PREFIX = `gs://${MEDIA_DATA_GENERATED_SUITE_PRIVATE_BUCKET}/${MEDIA_DATA_GENERATED_SUITE_PRIVATE_OBJECT_PREFIX}/`
export const MEDIA_DATA_GENERATED_SUITE_WORKER_DIR = 'server/workers/media-data-generated-suite'

export type MediaDataGeneratedBetaStatus =
  | 'blocked'
  | 'phase-complete but tool-family incomplete'
  | 'internally beta-ready candidate'
  | 'external beta still blocked'

export type MediaDataGeneratedToolId =
  | 'opencv'
  | 'pyav'
  | 'pyscenedetect'
  | 'sharp_libvips'
  | 'duckdb'
  | 'polars'

export type MediaDataGeneratedFixtureId =
  | 'generated-image-opencv-basic'
  | 'generated-container-pyav-probe'
  | 'generated-scene-cut-pyscenedetect'
  | 'generated-thumbnail-sharp-libvips'
  | 'generated-report-duckdb'
  | 'generated-report-polars'
  | 'generated-cross-tool-manifest'

export type MediaDataGeneratedStatus = 'passed' | 'failed' | 'blocked' | 'skipped' | 'not_run'

export interface MediaDataGeneratedFixtureSpec {
  fixtureId: MediaDataGeneratedFixtureId
  toolId: MediaDataGeneratedToolId | 'cross_tool'
  purpose: string
  generatedOnly: true
  expectedChecks: string[]
}

export interface MediaDataGeneratedSuitePlan {
  phase: typeof MEDIA_DATA_GENERATED_SUITE_PHASE
  runId: string
  branch: string
  baseIfPr123Open: string
  sourcePhase46aPr: string
  defaultMode: 'report_only_until_execute_confirmation'
  executionConfirmations: string[]
  privateArtifactPrefix: string
  packageLockPolicy: 'unchanged_temp_runtime_only'
  mediaDataToolFamilyBetaStatus: MediaDataGeneratedBetaStatus
  fixtureIds: MediaDataGeneratedFixtureId[]
  blockedScopes: string[]
}

export interface MediaDataGeneratedSuiteSummary {
  phase: typeof MEDIA_DATA_GENERATED_SUITE_PHASE
  runId: string
  status: MediaDataGeneratedStatus
  mediaDataToolFamilyBetaStatus: MediaDataGeneratedBetaStatus
  toolStatus: Record<MediaDataGeneratedToolId, MediaDataGeneratedStatus>
  privateArtifactStatus: string
  nextPhaseDecision: string
}

export const MEDIA_DATA_GENERATED_FIXTURES: MediaDataGeneratedFixtureSpec[] = [
  {
    fixtureId: 'generated-image-opencv-basic',
    toolId: 'opencv',
    purpose: 'OpenCV generated PNG dimensions, color, and deterministic shape detection.',
    generatedOnly: true,
    expectedChecks: ['dimensions_match', 'red_rectangle_detected', 'blue_circle_detected', 'green_line_detected'],
  },
  {
    fixtureId: 'generated-container-pyav-probe',
    toolId: 'pyav',
    purpose: 'PyAV generated container open/probe/decode on synthetic frames.',
    generatedOnly: true,
    expectedChecks: ['video_stream_present', 'fps_within_tolerance', 'decoded_frame_count_within_tolerance'],
  },
  {
    fixtureId: 'generated-scene-cut-pyscenedetect',
    toolId: 'pyscenedetect',
    purpose: 'PySceneDetect generated three-block scene cut detection.',
    generatedOnly: true,
    expectedChecks: ['scene_count_matches', 'boundaries_within_tolerance'],
  },
  {
    fixtureId: 'generated-thumbnail-sharp-libvips',
    toolId: 'sharp_libvips',
    purpose: 'Sharp/libvips generated image metadata and thumbnail resize.',
    generatedOnly: true,
    expectedChecks: ['metadata_read', 'thumbnail_dimensions_match', 'libvips_version_recorded'],
  },
  {
    fixtureId: 'generated-report-duckdb',
    toolId: 'duckdb',
    purpose: 'DuckDB in-memory aggregation of generated-only QA metrics.',
    generatedOnly: true,
    expectedChecks: ['metrics_loaded', 'aggregate_counts_match', 'network_extensions_not_used'],
  },
  {
    fixtureId: 'generated-report-polars',
    toolId: 'polars',
    purpose: 'Polars transform/group generated-only QA metrics.',
    generatedOnly: true,
    expectedChecks: ['metrics_loaded', 'group_by_status_matches', 'row_count_recorded'],
  },
  {
    fixtureId: 'generated-cross-tool-manifest',
    toolId: 'cross_tool',
    purpose: 'Combined generated-only QA manifest across all tool reports.',
    generatedOnly: true,
    expectedChecks: ['tool_versions_present', 'artifact_hashes_present', 'privacy_status_private'],
  },
]

export const MEDIA_DATA_GENERATED_EXPECTED_REPORT_FILES = [
  'phase_46b_generated_media_data_plan.json',
  'phase_46b_runtime_preflight.json',
  'phase_46b_generated_fixture_manifest.json',
  'phase_46b_opencv_generated_report.json',
  'phase_46b_pyav_generated_report.json',
  'phase_46b_pyscenedetect_generated_report.json',
  'phase_46b_sharp_libvips_generated_report.json',
  'phase_46b_duckdb_generated_report.json',
  'phase_46b_polars_generated_report.json',
  'phase_46b_cross_tool_manifest.json',
  'phase_46b_tool_version_report.json',
  'phase_46b_dependency_runtime_report.json',
  'phase_46b_storage_privacy_report.json',
  'phase_46b_private_artifact_manifest.json',
  'phase_46b_generated_media_data_qa_report.json',
  'phase_46b_blocker_report.json',
  'phase_46b_generated_media_data_suite_report.json',
]

const GENERATED_TOOL_IDS: MediaDataGeneratedToolId[] = ['opencv', 'pyav', 'pyscenedetect', 'sharp_libvips', 'duckdb', 'polars']

const BLOCKED_SCOPES = [
  'Phase 46C controlled real-video metadata/scene/frame suite until Phase 46B passes',
  'Phase 46D reporting/QA integration until reporting integration phase',
  'controlled real media',
  'broad user media',
  'arbitrary media paths',
  'real media processing',
  'VLM runtime retries',
  'OCR runtime',
  'provider calls',
  'production',
  'internal beta',
  'external beta',
  'paid production',
  'public output',
  'Docker execution unless separately approved',
  'Cloud Build',
  'Cloud Run',
  'GCP mutation except optional private QA artifact upload',
  'IAM mutation',
  'Track A runtime/visual/render stack',
]

export function getMediaDataGeneratedSuitePlan(): MediaDataGeneratedSuitePlan {
  return {
    phase: MEDIA_DATA_GENERATED_SUITE_PHASE,
    runId: MEDIA_DATA_GENERATED_SUITE_RUN_ID,
    branch: MEDIA_DATA_GENERATED_SUITE_BRANCH,
    baseIfPr123Open: MEDIA_DATA_GENERATED_SUITE_BASE_BRANCH,
    sourcePhase46aPr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/123',
    defaultMode: 'report_only_until_execute_confirmation',
    executionConfirmations: [
      'REEDITPRO_CONFIRM_MEDIA_DATA_GENERATED_FIXTURES',
      'REEDITPRO_CONFIRM_MEDIA_DATA_RUNTIME_EXECUTE',
      'REEDITPRO_CONFIRM_MEDIA_DATA_PRIVATE_ARTIFACT_UPLOAD',
    ],
    privateArtifactPrefix: MEDIA_DATA_GENERATED_SUITE_PRIVATE_GCS_PREFIX,
    packageLockPolicy: 'unchanged_temp_runtime_only',
    mediaDataToolFamilyBetaStatus: 'blocked',
    fixtureIds: MEDIA_DATA_GENERATED_FIXTURES.map((fixture) => fixture.fixtureId),
    blockedScopes: BLOCKED_SCOPES,
  }
}

export function buildMediaDataGeneratedSuiteStaticReports() {
  const toolStatus = Object.fromEntries(GENERATED_TOOL_IDS.map((toolId) => [toolId, 'not_run'])) as Record<MediaDataGeneratedToolId, MediaDataGeneratedStatus>
  const plan = getMediaDataGeneratedSuitePlan()
  const summary: MediaDataGeneratedSuiteSummary = {
    phase: MEDIA_DATA_GENERATED_SUITE_PHASE,
    runId: MEDIA_DATA_GENERATED_SUITE_RUN_ID,
    status: 'not_run',
    mediaDataToolFamilyBetaStatus: 'blocked',
    toolStatus,
    privateArtifactStatus: 'not_run',
    nextPhaseDecision: 'Run generated-only suite before Phase 46C.',
  }
  return {
    plan,
    runtimePreflight: {
      phase: MEDIA_DATA_GENERATED_SUITE_PHASE,
      runId: MEDIA_DATA_GENERATED_SUITE_RUN_ID,
      status: 'not_run',
      localPreflightFromPlanning: {
        pythonPackages: 'missing_in_clean_worktree',
        sharp: 'missing_in_clean_worktree',
        strategy: 'isolated_temp_runtime_install_on_execute',
        packageLockWouldChange: false,
        dockerRequired: false,
      },
    },
    fixtureManifest: {
      phase: MEDIA_DATA_GENERATED_SUITE_PHASE,
      runId: MEDIA_DATA_GENERATED_SUITE_RUN_ID,
      fixtures: MEDIA_DATA_GENERATED_FIXTURES,
      generatedOnly: true,
      realMedia: 'blocked',
      arbitraryMediaInput: 'blocked',
    },
    storagePrivacyReport: {
      phase: MEDIA_DATA_GENERATED_SUITE_PHASE,
      runId: MEDIA_DATA_GENERATED_SUITE_RUN_ID,
      status: 'planned_private_only',
      privateArtifactPrefix: MEDIA_DATA_GENERATED_SUITE_PRIVATE_GCS_PREFIX,
      publicArtifacts: 'blocked',
      signedUrlsAsSourceOfTruth: 'blocked',
      realMediaMetadata: 'not_present',
    },
    blockerReport: {
      phase: MEDIA_DATA_GENERATED_SUITE_PHASE,
      runId: MEDIA_DATA_GENERATED_SUITE_RUN_ID,
      status: 'blocked_until_generated_suite_executes',
      blockers: ['generated fixture suite has not executed yet'],
      blockedScopes: BLOCKED_SCOPES,
    },
    suiteReport: {
      phase: MEDIA_DATA_GENERATED_SUITE_PHASE,
      runId: MEDIA_DATA_GENERATED_SUITE_RUN_ID,
      status: 'not_run',
      sourcePhase46aPr: plan.sourcePhase46aPr,
      mediaDataToolFamilyBetaStatus: 'blocked' as MediaDataGeneratedBetaStatus,
      toolStatus,
      privateArtifactStatus: 'not_run',
      nextPhaseDecision: 'Phase 46C remains blocked until Phase 46B generated suite passes.',
    },
    iamPlan: {
      phase: MEDIA_DATA_GENERATED_SUITE_PHASE,
      runId: MEDIA_DATA_GENERATED_SUITE_RUN_ID,
      status: 'no_iam_mutation_allowed',
      privateArtifactPrefix: MEDIA_DATA_GENERATED_SUITE_PRIVATE_GCS_PREFIX,
      notes: ['Phase 46B may upload private QA artifacts only if existing auth/IAM allows it.', 'No IAM mutation is performed in this phase.'],
    },
    costSummary: {
      phase: MEDIA_DATA_GENERATED_SUITE_PHASE,
      runId: MEDIA_DATA_GENERATED_SUITE_RUN_ID,
      status: 'local_temp_runtime_only',
      estimatedCloudCostUsd: 0,
      localCostDrivers: ['temporary Python wheel downloads', 'temporary Sharp native package install', 'private GCS upload if auth is available'],
    },
    summary,
  }
}

export async function writeMediaDataGeneratedSuiteStaticArtifacts(reportDir = MEDIA_DATA_GENERATED_SUITE_REPORT_DIR): Promise<void> {
  const reports = buildMediaDataGeneratedSuiteStaticReports()
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46b_generated_media_data_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46b_runtime_preflight.json'), reports.runtimePreflight)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46b_generated_fixture_manifest.json'), reports.fixtureManifest)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46b_storage_privacy_report.json'), reports.storagePrivacyReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46b_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46b_generated_media_data_suite_report.json'), reports.suiteReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46b_iam_plan.json'), reports.iamPlan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46b_cost_summary.json'), reports.costSummary)
  await writeVlmRuntimeTextArtifact(path.join(reportDir, 'phase_46b_generated_media_data_suite_report.md'), renderSuiteMarkdown(reports.summary))
}

export async function readMediaDataGeneratedSuiteSummary(reportDir = MEDIA_DATA_GENERATED_SUITE_REPORT_DIR): Promise<MediaDataGeneratedSuiteSummary> {
  const reportPath = path.join(reportDir, 'phase_46b_generated_media_data_suite_report.json')
  if (!existsSync(reportPath)) return buildMediaDataGeneratedSuiteStaticReports().summary
  const report = JSON.parse(await readFile(reportPath, 'utf8')) as {
    status?: MediaDataGeneratedStatus
    mediaDataToolFamilyBetaStatus?: MediaDataGeneratedBetaStatus
    toolStatus?: Record<MediaDataGeneratedToolId, MediaDataGeneratedStatus>
    privateArtifactStatus?: string
    nextPhaseDecision?: string
  }
  return {
    phase: MEDIA_DATA_GENERATED_SUITE_PHASE,
    runId: MEDIA_DATA_GENERATED_SUITE_RUN_ID,
    status: report.status ?? 'not_run',
    mediaDataToolFamilyBetaStatus: report.mediaDataToolFamilyBetaStatus ?? 'blocked',
    toolStatus: report.toolStatus ?? buildMediaDataGeneratedSuiteStaticReports().summary.toolStatus,
    privateArtifactStatus: report.privateArtifactStatus ?? 'unknown',
    nextPhaseDecision: report.nextPhaseDecision ?? 'Phase 46C remains blocked until Phase 46B generated suite passes.',
  }
}

export async function executeMediaDataGeneratedSuite(input: {
  reportDir?: string
  keepTemp?: boolean
} = {}): Promise<MediaDataGeneratedSuiteSummary> {
  requireExecutionConfirmations()
  const reportDir = input.reportDir ?? MEDIA_DATA_GENERATED_SUITE_REPORT_DIR
  const runtimeRoot = path.join(os.tmpdir(), 'reeditpro-phase46b-generated-media-data-suite-runtime', MEDIA_DATA_GENERATED_SUITE_RUN_ID)
  const outputDir = path.join(runtimeRoot, 'suite-output')
  const pythonVenvDir = path.join(runtimeRoot, 'python-venv')
  const nodePrefixDir = path.join(runtimeRoot, 'node-sharp')
  await mkdir(runtimeRoot, { recursive: true })
  await mkdir(outputDir, { recursive: true })

  const python = process.env.REEDITPRO_PHASE46B_PYTHON
    ?? '/Users/macuser/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3'
  const pythonExecutable = existsSync(python) ? python : 'python3'
  const node = process.env.REEDITPRO_PHASE46B_NODE
    ?? '/Users/macuser/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node'
  const nodeExecutable = existsSync(node) ? node : 'node'
  const workerDir = path.resolve(MEDIA_DATA_GENERATED_SUITE_WORKER_DIR)
  const requirementsPath = path.join(workerDir, 'requirements.media-data-generated.txt')
  const sharpRunnerPath = path.join(workerDir, 'run_sharp_generated.js')
  const orchestratorPath = path.join(workerDir, 'run_generated_media_data_suite.py')

  await runCommand(pythonExecutable, ['-m', 'venv', pythonVenvDir], { cwd: process.cwd(), label: 'python_venv_create' })
  const venvPython = path.join(pythonVenvDir, 'bin', 'python')
  const venvPip = path.join(pythonVenvDir, 'bin', 'pip')
  await runCommand(venvPip, ['install', '--disable-pip-version-check', '-r', requirementsPath], {
    cwd: process.cwd(),
    label: 'python_dependency_install',
    timeoutMs: 1800000,
  })

  await mkdir(nodePrefixDir, { recursive: true })
  await writeFile(path.join(nodePrefixDir, 'package.json'), `${JSON.stringify({ private: true, type: 'module' }, null, 2)}\n`, 'utf8')
  await runCommand('npm', ['install', '--prefix', nodePrefixDir, '--no-save', '--no-audit', '--fund=false', 'sharp@0.34.5'], {
    cwd: process.cwd(),
    label: 'sharp_temp_install',
    timeoutMs: 600000,
    env: {
      ...process.env,
      PATH: `${path.dirname(nodeExecutable)}:${process.env.PATH ?? ''}`,
    },
  })

  await runCommand(venvPython, [
    orchestratorPath,
    '--output-dir',
    outputDir,
    '--node-bin',
    nodeExecutable,
    '--sharp-node-prefix',
    nodePrefixDir,
    '--sharp-runner',
    sharpRunnerPath,
    '--run-id',
    MEDIA_DATA_GENERATED_SUITE_RUN_ID,
  ], {
    cwd: process.cwd(),
    label: 'generated_suite_execute',
    timeoutMs: 900000,
  })

  const uploadReport = await uploadPrivateArtifactsIfConfirmed(outputDir)
  await updateReportsWithUploadStatus(outputDir, uploadReport)
  const finalUploadReport = await uploadUpdatedReportsIfNeeded(outputDir, uploadReport)
  if (finalUploadReport !== uploadReport) await updateReportsWithUploadStatus(outputDir, finalUploadReport)
  await copySafeReports(outputDir, reportDir)
  const summary = await readMediaDataGeneratedSuiteSummary(reportDir)
  if (!input.keepTemp) {
    // Leave cleanup to the OS temp policy. Generated binaries are not copied into the repo.
  }
  return summary
}

async function copySafeReports(outputDir: string, reportDir: string): Promise<void> {
  await mkdir(reportDir, { recursive: true })
  for (const file of MEDIA_DATA_GENERATED_EXPECTED_REPORT_FILES) {
    await copyFile(path.join(outputDir, file), path.join(reportDir, file))
  }
  const summary = JSON.parse(await readFile(path.join(outputDir, 'phase_46b_generated_media_data_suite_report.json'), 'utf8')) as MediaDataGeneratedSuiteSummary
  await writeVlmRuntimeTextArtifact(path.join(reportDir, 'phase_46b_generated_media_data_suite_report.md'), renderSuiteMarkdown(summary))
}

async function updateReportsWithUploadStatus(outputDir: string, uploadReport: Record<string, unknown>): Promise<void> {
  const manifestPath = path.join(outputDir, 'phase_46b_private_artifact_manifest.json')
  const suitePath = path.join(outputDir, 'phase_46b_generated_media_data_suite_report.json')
  const qaPath = path.join(outputDir, 'phase_46b_generated_media_data_qa_report.json')
  const blockerPath = path.join(outputDir, 'phase_46b_blocker_report.json')
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as Record<string, unknown>
  const suite = JSON.parse(await readFile(suitePath, 'utf8')) as Record<string, unknown>
  const qa = JSON.parse(await readFile(qaPath, 'utf8')) as Record<string, unknown>
  const blocker = JSON.parse(await readFile(blockerPath, 'utf8')) as { blockers?: string[]; status?: string; [key: string]: unknown }
  const uploadStatus = String(uploadReport.status ?? 'unknown')
  manifest.privateUpload = uploadReport
  manifest.status = uploadStatus
  manifest.artifacts = await collectGeneratedArtifactManifest(outputDir)
  manifest.localArtifactCount = Array.isArray(manifest.artifacts) ? manifest.artifacts.length : manifest.localArtifactCount
  suite.privateArtifactStatus = uploadStatus
  qa.privateArtifactStatus = uploadStatus
  if (uploadStatus === 'passed') {
    suite.nextPhaseDecision = 'Phase 46C controlled real-video media/data suite is the next media/data phase.'
  }
  if (uploadStatus !== 'passed') {
    suite.status = 'blocked'
    suite.mediaDataToolFamilyBetaStatus = 'blocked'
    qa.status = 'blocked'
    qa.mediaDataToolFamilyBetaStatus = 'blocked'
    blocker.status = 'blocked'
    blocker.blockers = [...new Set([...(blocker.blockers ?? []), `private artifact upload ${uploadStatus}`])]
  }
  await writeVlmRuntimeJsonArtifact(manifestPath, manifest)
  await writeVlmRuntimeJsonArtifact(suitePath, suite)
  await writeVlmRuntimeJsonArtifact(qaPath, qa)
  await writeVlmRuntimeJsonArtifact(blockerPath, blocker)
}

async function uploadUpdatedReportsIfNeeded(outputDir: string, uploadReport: Record<string, unknown>): Promise<Record<string, unknown>> {
  if (uploadReport.status !== 'passed') return uploadReport
  try {
    for (const file of MEDIA_DATA_GENERATED_EXPECTED_REPORT_FILES) {
      await runCommand('gcloud', ['storage', 'cp', path.join(outputDir, file), `${MEDIA_DATA_GENERATED_SUITE_PRIVATE_GCS_PREFIX}${file}`], {
        label: `private_artifact_report_refresh_${file}`,
        timeoutMs: 120000,
      })
    }
    const listing = await runCommand('gcloud', ['storage', 'ls', '--recursive', MEDIA_DATA_GENERATED_SUITE_PRIVATE_GCS_PREFIX], {
      label: 'private_artifact_final_list',
      timeoutMs: 120000,
    })
    const objectCount = listing.stdout.split('\n').filter((line) => line.trim().startsWith('gs://')).length
    return {
      ...uploadReport,
      status: 'passed',
      objectCount,
      refreshedReportObjects: MEDIA_DATA_GENERATED_EXPECTED_REPORT_FILES.length,
    }
  } catch (error) {
    return {
      status: 'blocked',
      prefix: MEDIA_DATA_GENERATED_SUITE_PRIVATE_GCS_PREFIX,
      reason: `updated report upload failed: ${sanitizeError(error)}`,
    }
  }
}

async function uploadPrivateArtifactsIfConfirmed(outputDir: string): Promise<Record<string, unknown>> {
  if (process.env.REEDITPRO_CONFIRM_MEDIA_DATA_PRIVATE_ARTIFACT_UPLOAD !== 'true') {
    return { status: 'skipped', reason: 'REEDITPRO_CONFIRM_MEDIA_DATA_PRIVATE_ARTIFACT_UPLOAD was not true', prefix: MEDIA_DATA_GENERATED_SUITE_PRIVATE_GCS_PREFIX }
  }
  try {
    await runCommand('gcloud', ['--version'], { label: 'gcloud_version', timeoutMs: 30000 })
    await runCommand('gcloud', ['storage', 'cp', '--recursive', outputDir, MEDIA_DATA_GENERATED_SUITE_PRIVATE_GCS_PREFIX], {
      label: 'private_artifact_upload',
      timeoutMs: 300000,
    })
    const listing = await runCommand('gcloud', ['storage', 'ls', '--recursive', MEDIA_DATA_GENERATED_SUITE_PRIVATE_GCS_PREFIX], {
      label: 'private_artifact_list',
      timeoutMs: 120000,
    })
    const objectCount = listing.stdout.split('\n').filter((line) => line.trim().startsWith('gs://')).length
    return {
      status: 'passed',
      prefix: MEDIA_DATA_GENERATED_SUITE_PRIVATE_GCS_PREFIX,
      objectCount,
    }
  } catch (error) {
    return {
      status: 'blocked',
      prefix: MEDIA_DATA_GENERATED_SUITE_PRIVATE_GCS_PREFIX,
      reason: sanitizeError(error),
    }
  }
}

function requireExecutionConfirmations(): void {
  const required = [
    'REEDITPRO_CONFIRM_MEDIA_DATA_GENERATED_FIXTURES',
    'REEDITPRO_CONFIRM_MEDIA_DATA_RUNTIME_EXECUTE',
    'REEDITPRO_CONFIRM_MEDIA_DATA_PRIVATE_ARTIFACT_UPLOAD',
  ]
  for (const name of required) {
    if (process.env[name] !== 'true') throw new Error(`${name}=true is required for Phase 46B generated-suite execution.`)
  }
  for (const forbidden of [
    'REEDITPRO_CONFIRM_CONTROLLED_REAL_MEDIA',
    'REEDITPRO_CONFIRM_REAL_MEDIA_PROCESSING',
    'REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE',
    'REEDITPRO_CONFIRM_TRACK_A_RUNTIME',
  ]) {
    if (process.env[forbidden] === 'true') throw new Error(`${forbidden} must not be true for Phase 46B.`)
  }
}

async function runCommand(command: string, args: string[], input: {
  cwd?: string
  label: string
  timeoutMs?: number
  env?: NodeJS.ProcessEnv
}): Promise<{ stdout: string; stderr: string }> {
  try {
    const result = await execFileAsync(command, args, {
      cwd: input.cwd,
      env: input.env ?? process.env,
      timeout: input.timeoutMs ?? 120000,
      maxBuffer: 1024 * 1024 * 8,
    })
    return { stdout: result.stdout, stderr: result.stderr }
  } catch (error) {
    throw new Error(`${input.label} failed: ${sanitizeError(error)}`, { cause: error })
  }
}

function sanitizeError(error: unknown): string {
  const value = error instanceof Error ? error.message : String(error)
  return value.replace(/ya29\.[0-9A-Za-z._-]+/g, '<redacted-token>').replace(/Authorization: Bearer [^\s]+/g, 'Authorization: Bearer <redacted-token>')
}

function renderSuiteMarkdown(summary: MediaDataGeneratedSuiteSummary): string {
  return [
    '# Phase 46B Generated Media/Data Analysis Suite Report',
    '',
    `Run ID: \`${summary.runId}\``,
    '',
    `Status: \`${summary.status}\``,
    '',
    `Media/data tool-family beta status: \`${summary.mediaDataToolFamilyBetaStatus}\``,
    '',
    `Private artifact status: \`${summary.privateArtifactStatus}\``,
    '',
    'Tool status:',
    ...GENERATED_TOOL_IDS.map((toolId) => `- ${toolId}: \`${summary.toolStatus[toolId]}\``),
    '',
    `Next phase decision: ${summary.nextPhaseDecision}`,
  ].join('\n')
}

async function collectGeneratedArtifactManifest(rootDir: string, prefix = ''): Promise<Array<{ relativePath: string; kind: string; sizeBytes: number; sha256: string }>> {
  const entries = await readdir(path.join(rootDir, prefix), { withFileTypes: true })
  const artifacts: Array<{ relativePath: string; kind: string; sizeBytes: number; sha256: string }> = []
  for (const entry of entries) {
    const relative = prefix ? path.join(prefix, entry.name) : entry.name
    const absolute = path.join(rootDir, relative)
    if (entry.isDirectory()) {
      artifacts.push(...await collectGeneratedArtifactManifest(rootDir, relative))
      continue
    }
    const fileStat = await stat(absolute)
    const normalizedRelative = relative.split(path.sep).join('/')
    artifacts.push({
      relativePath: normalizedRelative,
      kind: normalizedRelative.endsWith('.json') ? 'report' : 'generated_private_artifact',
      sizeBytes: fileStat.size,
      sha256: await sha256GeneratedFile(absolute),
    })
  }
  return artifacts.sort((a, b) => a.relativePath.localeCompare(b.relativePath))
}

async function sha256GeneratedFile(filePath: string): Promise<string> {
  const hash = createHash('sha256')
  hash.update(await readFile(filePath))
  return hash.digest('hex')
}
