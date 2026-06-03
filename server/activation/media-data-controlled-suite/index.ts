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

export const MEDIA_DATA_CONTROLLED_SUITE_PHASE = '46C'
export const MEDIA_DATA_CONTROLLED_SUITE_RUN_ID = 'phase46c-controlled-real-video-media-data-suite-20260603'
export const MEDIA_DATA_CONTROLLED_SUITE_REPORT_DIR = 'docs/activation-phase-46c-controlled-real-video-media-data-suite-reports'
export const MEDIA_DATA_CONTROLLED_SUITE_BRANCH = 'codex/rp-activation-46c-controlled-real-video-media-data-suite'
export const MEDIA_DATA_CONTROLLED_SUITE_BASE_BRANCH = 'codex/rp-activation-46b-generated-media-data-analysis-suite'
export const MEDIA_DATA_CONTROLLED_SUITE_PRIVATE_BUCKET = 'reeditpro-staging-reeditpro-qa-artifacts'
export const MEDIA_DATA_CONTROLLED_SUITE_PRIVATE_OBJECT_PREFIX = `activation/phase46c/controlled-real-video-media-data/${MEDIA_DATA_CONTROLLED_SUITE_RUN_ID}`
export const MEDIA_DATA_CONTROLLED_SUITE_PRIVATE_GCS_PREFIX = `gs://${MEDIA_DATA_CONTROLLED_SUITE_PRIVATE_BUCKET}/${MEDIA_DATA_CONTROLLED_SUITE_PRIVATE_OBJECT_PREFIX}/`
export const MEDIA_DATA_CONTROLLED_SUITE_WORKER_DIR = 'server/workers/media-data-controlled-suite'

export const MEDIA_DATA_CONTROLLED_SAMPLE = {
  sampleId: 'phase37d-phase32-color-export-safe-zone-window-v1',
  chainId: 'controlled-real-video-chain-phase28-through-phase32-v1',
  sourceGcsUri: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4',
  sourceSha256: '78bd798602d221b894a60dfa34ed1528602c9ece7f657e3f9bbea7fd071cc7fa',
  windowStartSeconds: 6.9,
  windowEndSeconds: 8.9,
  frameOffsetsSeconds: [6.9, 7.3, 7.7, 8.1, 8.5, 8.9],
  maxSampledFrames: 6,
  evidenceDocs: [
    'docs/activation-phase-32-real-video-color-correction-results.md',
    'docs/activation-phase-37d-controlled-real-video-ocr-safe-zone.md',
    'docs/activation-phase-37d-controlled-real-video-ocr-safe-zone-execution.md',
    'server/activation/controlled-real-video-ocr-safe-zone/controlled-real-video-ocr-safe-zone-policy.ts',
  ],
} as const

export type MediaDataControlledBetaStatus =
  | 'blocked'
  | 'phase-complete but tool-family incomplete'
  | 'internally beta-ready candidate'
  | 'external beta still blocked'

export type MediaDataControlledToolId =
  | 'opencv'
  | 'pyav'
  | 'pyscenedetect'
  | 'sharp_libvips'
  | 'duckdb'
  | 'polars'

export type MediaDataControlledStatus = 'passed' | 'failed' | 'blocked' | 'skipped' | 'warning' | 'not_run'

export interface MediaDataControlledSuitePlan {
  phase: typeof MEDIA_DATA_CONTROLLED_SUITE_PHASE
  runId: string
  branch: string
  baseIfPr125Open: string
  sourcePhase46aPr: string
  sourcePhase46bPr: string
  selectedSample: typeof MEDIA_DATA_CONTROLLED_SAMPLE
  defaultMode: 'report_only_until_execute_confirmation'
  executionConfirmations: string[]
  forbiddenConfirmations: string[]
  privateArtifactPrefix: string
  packageLockPolicy: 'unchanged_temp_runtime_only'
  mediaDataToolFamilyBetaStatus: MediaDataControlledBetaStatus
  controlledOnly: true
  blockedScopes: string[]
}

export interface MediaDataControlledSuiteSummary {
  phase: typeof MEDIA_DATA_CONTROLLED_SUITE_PHASE
  runId: string
  status: MediaDataControlledStatus
  mediaDataToolFamilyBetaStatus: MediaDataControlledBetaStatus
  toolStatus: Record<MediaDataControlledToolId, MediaDataControlledStatus>
  privateArtifactStatus: string
  selectedSampleId: string
  nextPhaseDecision: string
}

const CONTROLLED_TOOL_IDS: MediaDataControlledToolId[] = ['opencv', 'pyav', 'pyscenedetect', 'sharp_libvips', 'duckdb', 'polars']

export const MEDIA_DATA_CONTROLLED_EXPECTED_REPORT_FILES = [
  'phase_46c_controlled_real_video_plan.json',
  'phase_46c_controlled_sample_evidence.json',
  'phase_46c_controlled_runtime_preflight.json',
  'phase_46c_controlled_media_resolver_report.json',
  'phase_46c_pyav_controlled_probe_report.json',
  'phase_46c_pyscenedetect_scene_manifest.json',
  'phase_46c_opencv_frame_sample_report.json',
  'phase_46c_sharp_libvips_controlled_report.json',
  'phase_46c_duckdb_controlled_aggregation_report.json',
  'phase_46c_polars_controlled_transform_report.json',
  'phase_46c_cross_tool_manifest.json',
  'phase_46c_tool_version_report.json',
  'phase_46c_dependency_runtime_report.json',
  'phase_46c_storage_privacy_report.json',
  'phase_46c_private_artifact_manifest.json',
  'phase_46c_controlled_media_data_qa_report.json',
  'phase_46c_blocker_report.json',
  'phase_46c_controlled_real_video_media_data_suite_report.json',
]

const BLOCKED_SCOPES = [
  'Phase 46D reporting/QA integration until Phase 46C passes',
  'VLM runtime retries',
  'OCR runtime',
  'provider calls',
  'production',
  'internal beta',
  'external beta',
  'paid production',
  'public output',
  'broad user media',
  'arbitrary media paths',
  'unapproved real media',
  'public media URLs',
  'signed URLs as source of truth',
  'full-video frame extraction',
  'final exports',
  'public previews',
  'Docker execution',
  'Cloud Build',
  'Cloud Run',
  'GPU jobs',
  'IAM mutation',
  'Track A runtime/visual/render stack',
]

export function getMediaDataControlledSuitePlan(): MediaDataControlledSuitePlan {
  return {
    phase: MEDIA_DATA_CONTROLLED_SUITE_PHASE,
    runId: MEDIA_DATA_CONTROLLED_SUITE_RUN_ID,
    branch: MEDIA_DATA_CONTROLLED_SUITE_BRANCH,
    baseIfPr125Open: MEDIA_DATA_CONTROLLED_SUITE_BASE_BRANCH,
    sourcePhase46aPr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/123',
    sourcePhase46bPr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/125',
    selectedSample: MEDIA_DATA_CONTROLLED_SAMPLE,
    defaultMode: 'report_only_until_execute_confirmation',
    executionConfirmations: [
      'REEDITPRO_CONFIRM_MEDIA_DATA_CONTROLLED_REAL_VIDEO',
      'REEDITPRO_CONFIRM_MEDIA_DATA_CONTROLLED_MEDIA_READ',
      'REEDITPRO_CONFIRM_MEDIA_DATA_CONTROLLED_FRAME_SAMPLING',
      'REEDITPRO_CONFIRM_MEDIA_DATA_CONTROLLED_RUNTIME_EXECUTE',
      'REEDITPRO_CONFIRM_MEDIA_DATA_PRIVATE_ARTIFACT_UPLOAD',
    ],
    forbiddenConfirmations: [
      'REEDITPRO_CONFIRM_BROAD_MEDIA_PROCESSING',
      'REEDITPRO_CONFIRM_ARBITRARY_MEDIA_INPUT',
      'REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE',
      'REEDITPRO_CONFIRM_OCR_RUNTIME_EXECUTE',
      'REEDITPRO_CONFIRM_TRACK_A_RUNTIME',
    ],
    privateArtifactPrefix: MEDIA_DATA_CONTROLLED_SUITE_PRIVATE_GCS_PREFIX,
    packageLockPolicy: 'unchanged_temp_runtime_only',
    mediaDataToolFamilyBetaStatus: 'blocked',
    controlledOnly: true,
    blockedScopes: BLOCKED_SCOPES,
  }
}

export function buildMediaDataControlledSuiteStaticReports() {
  const toolStatus = Object.fromEntries(CONTROLLED_TOOL_IDS.map((toolId) => [toolId, 'not_run'])) as Record<MediaDataControlledToolId, MediaDataControlledStatus>
  const plan = getMediaDataControlledSuitePlan()
  const summary: MediaDataControlledSuiteSummary = {
    phase: MEDIA_DATA_CONTROLLED_SUITE_PHASE,
    runId: MEDIA_DATA_CONTROLLED_SUITE_RUN_ID,
    status: 'not_run',
    mediaDataToolFamilyBetaStatus: 'blocked',
    toolStatus,
    privateArtifactStatus: 'not_run',
    selectedSampleId: MEDIA_DATA_CONTROLLED_SAMPLE.sampleId,
    nextPhaseDecision: 'Run the bounded controlled real-video media/data suite before Phase 46D.',
  }
  return {
    plan,
    sampleEvidence: {
      phase: MEDIA_DATA_CONTROLLED_SUITE_PHASE,
      runId: MEDIA_DATA_CONTROLLED_SUITE_RUN_ID,
      status: 'planned',
      selectedSample: MEDIA_DATA_CONTROLLED_SAMPLE,
      sourceEvidence: [
        { pr: 32, evidence: 'private color-corrected export object and SHA-256' },
        { pr: 37, evidence: 'controlled OCR safe-zone sample/window/offset chain' },
        { pr: 125, evidence: 'Phase 46B generated media/data suite passed' },
      ],
      arbitraryMediaInput: 'blocked',
    },
    runtimePreflight: {
      phase: MEDIA_DATA_CONTROLLED_SUITE_PHASE,
      runId: MEDIA_DATA_CONTROLLED_SUITE_RUN_ID,
      status: 'not_run',
      strategy: 'isolated_temp_runtime_install_on_execute',
      packageLockWouldChange: false,
      dockerRequired: false,
      cloudRunRequired: false,
    },
    mediaResolverReport: {
      phase: MEDIA_DATA_CONTROLLED_SUITE_PHASE,
      runId: MEDIA_DATA_CONTROLLED_SUITE_RUN_ID,
      status: 'not_run',
      sourceGcsUri: MEDIA_DATA_CONTROLLED_SAMPLE.sourceGcsUri,
      sourceSha256Expected: MEDIA_DATA_CONTROLLED_SAMPLE.sourceSha256,
      sourceReadPolicy: 'private_gcs_only_after_confirmation',
      signedUrlsAsSourceOfTruth: 'blocked',
      publicMediaUrls: 'blocked',
    },
    storagePrivacyReport: {
      phase: MEDIA_DATA_CONTROLLED_SUITE_PHASE,
      runId: MEDIA_DATA_CONTROLLED_SUITE_RUN_ID,
      status: 'planned_private_only',
      privateArtifactPrefix: MEDIA_DATA_CONTROLLED_SUITE_PRIVATE_GCS_PREFIX,
      controlledRealMedia: 'approved_single_sample_only',
      arbitraryMediaInput: 'blocked',
      broadMedia: 'blocked',
      publicArtifacts: 'blocked',
      committedFramesOrThumbnails: 'blocked',
      signedUrlsAsSourceOfTruth: 'blocked',
    },
    iamPlan: {
      phase: MEDIA_DATA_CONTROLLED_SUITE_PHASE,
      runId: MEDIA_DATA_CONTROLLED_SUITE_RUN_ID,
      status: 'no_iam_mutation_allowed',
      privateArtifactPrefix: MEDIA_DATA_CONTROLLED_SUITE_PRIVATE_GCS_PREFIX,
      notes: ['Phase 46C may upload private QA artifacts only if existing auth/IAM allows it.', 'No IAM mutation is performed in this phase.'],
    },
    costSummary: {
      phase: MEDIA_DATA_CONTROLLED_SUITE_PHASE,
      runId: MEDIA_DATA_CONTROLLED_SUITE_RUN_ID,
      status: 'local_temp_runtime_private_gcs_only',
      estimatedCloudCostUsd: 0,
      localCostDrivers: ['temporary Python wheel downloads', 'temporary Sharp native package install', 'private GCS read/upload if auth is available'],
    },
    blockerReport: {
      phase: MEDIA_DATA_CONTROLLED_SUITE_PHASE,
      runId: MEDIA_DATA_CONTROLLED_SUITE_RUN_ID,
      status: 'blocked_until_controlled_suite_executes',
      blockers: ['controlled real-video media/data suite has not executed yet'],
      blockedScopes: BLOCKED_SCOPES,
    },
    suiteReport: {
      phase: MEDIA_DATA_CONTROLLED_SUITE_PHASE,
      runId: MEDIA_DATA_CONTROLLED_SUITE_RUN_ID,
      status: 'not_run',
      sourcePhase46aPr: plan.sourcePhase46aPr,
      sourcePhase46bPr: plan.sourcePhase46bPr,
      selectedSampleId: MEDIA_DATA_CONTROLLED_SAMPLE.sampleId,
      mediaDataToolFamilyBetaStatus: 'blocked' as MediaDataControlledBetaStatus,
      toolStatus,
      privateArtifactStatus: 'not_run',
      nextPhaseDecision: 'Phase 46D remains blocked until Phase 46C controlled real-video suite passes.',
    },
    summary,
  }
}

export async function writeMediaDataControlledSuiteStaticArtifacts(reportDir = MEDIA_DATA_CONTROLLED_SUITE_REPORT_DIR): Promise<void> {
  const reports = buildMediaDataControlledSuiteStaticReports()
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46c_controlled_real_video_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46c_controlled_sample_evidence.json'), reports.sampleEvidence)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46c_controlled_runtime_preflight.json'), reports.runtimePreflight)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46c_controlled_media_resolver_report.json'), reports.mediaResolverReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46c_storage_privacy_report.json'), reports.storagePrivacyReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46c_iam_plan.json'), reports.iamPlan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46c_cost_summary.json'), reports.costSummary)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46c_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46c_controlled_real_video_media_data_suite_report.json'), reports.suiteReport)
  await writeVlmRuntimeTextArtifact(path.join(reportDir, 'phase_46c_controlled_real_video_media_data_suite_report.md'), renderSuiteMarkdown(reports.summary))
}

export async function readMediaDataControlledSuiteSummary(reportDir = MEDIA_DATA_CONTROLLED_SUITE_REPORT_DIR): Promise<MediaDataControlledSuiteSummary> {
  const reportPath = path.join(reportDir, 'phase_46c_controlled_real_video_media_data_suite_report.json')
  if (!existsSync(reportPath)) return buildMediaDataControlledSuiteStaticReports().summary
  const report = JSON.parse(await readFile(reportPath, 'utf8')) as {
    status?: MediaDataControlledStatus
    mediaDataToolFamilyBetaStatus?: MediaDataControlledBetaStatus
    toolStatus?: Record<MediaDataControlledToolId, MediaDataControlledStatus>
    privateArtifactStatus?: string
    selectedSampleId?: string
    nextPhaseDecision?: string
  }
  return {
    phase: MEDIA_DATA_CONTROLLED_SUITE_PHASE,
    runId: MEDIA_DATA_CONTROLLED_SUITE_RUN_ID,
    status: report.status ?? 'not_run',
    mediaDataToolFamilyBetaStatus: report.mediaDataToolFamilyBetaStatus ?? 'blocked',
    toolStatus: report.toolStatus ?? buildMediaDataControlledSuiteStaticReports().summary.toolStatus,
    privateArtifactStatus: report.privateArtifactStatus ?? 'unknown',
    selectedSampleId: report.selectedSampleId ?? MEDIA_DATA_CONTROLLED_SAMPLE.sampleId,
    nextPhaseDecision: report.nextPhaseDecision ?? 'Phase 46D remains blocked until Phase 46C controlled real-video suite passes.',
  }
}

export async function executeMediaDataControlledSuite(input: {
  reportDir?: string
  keepTemp?: boolean
} = {}): Promise<MediaDataControlledSuiteSummary> {
  requireExecutionConfirmations()
  const reportDir = input.reportDir ?? MEDIA_DATA_CONTROLLED_SUITE_REPORT_DIR
  const runtimeRoot = path.join(os.tmpdir(), 'reeditpro-phase46c-controlled-real-video-media-data-suite-runtime', MEDIA_DATA_CONTROLLED_SUITE_RUN_ID)
  const outputDir = path.join(runtimeRoot, 'suite-output')
  const sourceDir = path.join(runtimeRoot, 'source')
  const sourcePath = path.join(sourceDir, 'color-corrected-export.mp4')
  const pythonVenvDir = path.join(runtimeRoot, 'python-venv')
  const nodePrefixDir = path.join(runtimeRoot, 'node-sharp')
  await mkdir(runtimeRoot, { recursive: true })
  await mkdir(outputDir, { recursive: true })
  await mkdir(sourceDir, { recursive: true })

  try {
    const python = process.env.REEDITPRO_PHASE46C_PYTHON
      ?? '/Users/macuser/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3'
    const pythonExecutable = existsSync(python) ? python : 'python3'
    const node = process.env.REEDITPRO_PHASE46C_NODE
      ?? '/Users/macuser/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node'
    const nodeExecutable = existsSync(node) ? node : 'node'
    const workerDir = path.resolve(MEDIA_DATA_CONTROLLED_SUITE_WORKER_DIR)
    const requirementsPath = path.join(workerDir, 'requirements.media-data-controlled.txt')
    const sharpRunnerPath = path.join(workerDir, 'run_sharp_controlled.js')
    const orchestratorPath = path.join(workerDir, 'run_controlled_media_data_suite.py')

    const resolverReport = await resolveApprovedControlledSample(sourcePath)
    await writeVlmRuntimeJsonArtifact(path.join(outputDir, 'phase_46c_controlled_media_resolver_report.json'), resolverReport)

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
      '--source-video',
      sourcePath,
      '--node-bin',
      nodeExecutable,
      '--sharp-node-prefix',
      nodePrefixDir,
      '--sharp-runner',
      sharpRunnerPath,
      '--run-id',
      MEDIA_DATA_CONTROLLED_SUITE_RUN_ID,
    ], {
      cwd: process.cwd(),
      label: 'controlled_suite_execute',
      timeoutMs: 900000,
    })

    const uploadReport = await uploadPrivateArtifactsIfConfirmed(outputDir)
    await updateReportsWithUploadStatus(outputDir, uploadReport)
    const finalUploadReport = await uploadUpdatedReportsIfNeeded(outputDir, uploadReport)
    if (finalUploadReport !== uploadReport) await updateReportsWithUploadStatus(outputDir, finalUploadReport)
    await copySafeReports(outputDir, reportDir)
  } catch (error) {
    await writeBlockedExecutionReports(outputDir, sanitizeError(error))
    await copySafeReports(outputDir, reportDir)
  }

  const summary = await readMediaDataControlledSuiteSummary(reportDir)
  if (!input.keepTemp) {
    // Runtime files remain under OS temp policy; media-derived binaries are never copied into the repo.
  }
  return summary
}

async function resolveApprovedControlledSample(sourcePath: string): Promise<Record<string, unknown>> {
  const metadataResult = await runCommand('gcloud', ['storage', 'objects', 'describe', MEDIA_DATA_CONTROLLED_SAMPLE.sourceGcsUri, '--format=json'], {
    label: 'controlled_source_metadata_describe',
    timeoutMs: 120000,
  })
  const copyReport = await copyApprovedPrivateSource(sourcePath)
  const actualSha256 = await sha256File(sourcePath)
  const checksumPassed = actualSha256 === MEDIA_DATA_CONTROLLED_SAMPLE.sourceSha256
  if (!checksumPassed) {
    throw new Error(`controlled sample SHA-256 mismatch: expected ${MEDIA_DATA_CONTROLLED_SAMPLE.sourceSha256}, got ${actualSha256}`)
  }
  let metadata: unknown
  try {
    metadata = JSON.parse(metadataResult.stdout)
  } catch {
    metadata = { parseStatus: 'failed' }
  }
  return {
    phase: MEDIA_DATA_CONTROLLED_SUITE_PHASE,
    runId: MEDIA_DATA_CONTROLLED_SUITE_RUN_ID,
    status: 'passed',
    selectedSample: MEDIA_DATA_CONTROLLED_SAMPLE,
    sourceGcsUri: MEDIA_DATA_CONTROLLED_SAMPLE.sourceGcsUri,
    metadata: redactGcloudObjectMetadata(metadata),
    localCopy: {
      fileName: path.basename(sourcePath),
      sha256: actualSha256,
      checksumVerification: 'passed',
      copyReport,
      arbitraryMediaInput: 'blocked',
      publicMediaUrls: 'blocked',
      signedUrlsAsSourceOfTruth: 'blocked',
    },
  }
}

async function copySafeReports(outputDir: string, reportDir: string): Promise<void> {
  await mkdir(reportDir, { recursive: true })
  for (const file of MEDIA_DATA_CONTROLLED_EXPECTED_REPORT_FILES) {
    const source = path.join(outputDir, file)
    if (!existsSync(source)) continue
    await copyFile(source, path.join(reportDir, file))
  }
  const summary = await readMediaDataControlledSuiteSummaryFromOutput(outputDir)
  await writeVlmRuntimeTextArtifact(path.join(reportDir, 'phase_46c_controlled_real_video_media_data_suite_report.md'), renderSuiteMarkdown(summary))
}

async function readMediaDataControlledSuiteSummaryFromOutput(outputDir: string): Promise<MediaDataControlledSuiteSummary> {
  const reportPath = path.join(outputDir, 'phase_46c_controlled_real_video_media_data_suite_report.json')
  if (!existsSync(reportPath)) return buildMediaDataControlledSuiteStaticReports().summary
  const report = JSON.parse(await readFile(reportPath, 'utf8')) as MediaDataControlledSuiteSummary
  return {
    phase: MEDIA_DATA_CONTROLLED_SUITE_PHASE,
    runId: MEDIA_DATA_CONTROLLED_SUITE_RUN_ID,
    status: report.status,
    mediaDataToolFamilyBetaStatus: report.mediaDataToolFamilyBetaStatus,
    toolStatus: report.toolStatus,
    privateArtifactStatus: report.privateArtifactStatus,
    selectedSampleId: report.selectedSampleId,
    nextPhaseDecision: report.nextPhaseDecision,
  }
}

async function updateReportsWithUploadStatus(outputDir: string, uploadReport: Record<string, unknown>): Promise<void> {
  const manifestPath = path.join(outputDir, 'phase_46c_private_artifact_manifest.json')
  const suitePath = path.join(outputDir, 'phase_46c_controlled_real_video_media_data_suite_report.json')
  const qaPath = path.join(outputDir, 'phase_46c_controlled_media_data_qa_report.json')
  const blockerPath = path.join(outputDir, 'phase_46c_blocker_report.json')
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as Record<string, unknown>
  const suite = JSON.parse(await readFile(suitePath, 'utf8')) as Record<string, unknown>
  const qa = JSON.parse(await readFile(qaPath, 'utf8')) as Record<string, unknown>
  const blocker = JSON.parse(await readFile(blockerPath, 'utf8')) as { blockers?: string[]; status?: string; [key: string]: unknown }
  const uploadStatus = String(uploadReport.status ?? 'unknown')
  manifest.privateUpload = uploadReport
  manifest.status = uploadStatus
  manifest.artifacts = await collectControlledArtifactManifest(outputDir)
  manifest.localArtifactCount = Array.isArray(manifest.artifacts) ? manifest.artifacts.length : manifest.localArtifactCount
  suite.privateArtifactStatus = uploadStatus
  qa.privateArtifactStatus = uploadStatus
  if (uploadStatus === 'passed' && suite.status === 'passed') {
    suite.nextPhaseDecision = 'Phase 46D DuckDB/Polars reporting/QA integration is the next media/data phase.'
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
    for (const file of MEDIA_DATA_CONTROLLED_EXPECTED_REPORT_FILES) {
      const localPath = path.join(outputDir, file)
      if (!existsSync(localPath)) continue
      await copyLocalFileToPrivateGcs(localPath, `${MEDIA_DATA_CONTROLLED_SUITE_PRIVATE_GCS_PREFIX}${file}`, `private_artifact_report_refresh_${file}`)
    }
    const objectCount = await countPrivateGcsObjects()
    return {
      ...uploadReport,
      status: 'passed',
      objectCount,
      refreshedReportObjects: MEDIA_DATA_CONTROLLED_EXPECTED_REPORT_FILES.length,
    }
  } catch (error) {
    return {
      status: 'blocked',
      prefix: MEDIA_DATA_CONTROLLED_SUITE_PRIVATE_GCS_PREFIX,
      reason: `updated report upload failed: ${sanitizeError(error)}`,
    }
  }
}

async function uploadPrivateArtifactsIfConfirmed(outputDir: string): Promise<Record<string, unknown>> {
  if (process.env.REEDITPRO_CONFIRM_MEDIA_DATA_PRIVATE_ARTIFACT_UPLOAD !== 'true') {
    return { status: 'skipped', reason: 'REEDITPRO_CONFIRM_MEDIA_DATA_PRIVATE_ARTIFACT_UPLOAD was not true', prefix: MEDIA_DATA_CONTROLLED_SUITE_PRIVATE_GCS_PREFIX }
  }
  try {
    await runCommand('gcloud', ['--version'], { label: 'gcloud_version', timeoutMs: 30000 })
    const copyReport = await copyLocalDirectoryToPrivateGcs(outputDir)
    const objectCount = await countPrivateGcsObjects()
    return {
      status: 'passed',
      prefix: MEDIA_DATA_CONTROLLED_SUITE_PRIVATE_GCS_PREFIX,
      objectCount,
      copyReport,
    }
  } catch (error) {
    return {
      status: 'blocked',
      prefix: MEDIA_DATA_CONTROLLED_SUITE_PRIVATE_GCS_PREFIX,
      reason: sanitizeError(error),
    }
  }
}

async function writeBlockedExecutionReports(outputDir: string, reason: string): Promise<void> {
  const toolStatus = Object.fromEntries(CONTROLLED_TOOL_IDS.map((toolId) => [toolId, 'blocked'])) as Record<MediaDataControlledToolId, MediaDataControlledStatus>
  const base = buildMediaDataControlledSuiteStaticReports()
  await writeVlmRuntimeJsonArtifact(path.join(outputDir, 'phase_46c_controlled_real_video_plan.json'), base.plan)
  await writeVlmRuntimeJsonArtifact(path.join(outputDir, 'phase_46c_controlled_sample_evidence.json'), base.sampleEvidence)
  await writeVlmRuntimeJsonArtifact(path.join(outputDir, 'phase_46c_controlled_runtime_preflight.json'), { ...base.runtimePreflight, status: 'blocked', reason })
  if (!existsSync(path.join(outputDir, 'phase_46c_controlled_media_resolver_report.json'))) {
    await writeVlmRuntimeJsonArtifact(path.join(outputDir, 'phase_46c_controlled_media_resolver_report.json'), { ...base.mediaResolverReport, status: 'blocked', reason })
  }
  await writeVlmRuntimeJsonArtifact(path.join(outputDir, 'phase_46c_storage_privacy_report.json'), base.storagePrivacyReport)
  await writeVlmRuntimeJsonArtifact(path.join(outputDir, 'phase_46c_private_artifact_manifest.json'), {
    phase: MEDIA_DATA_CONTROLLED_SUITE_PHASE,
    runId: MEDIA_DATA_CONTROLLED_SUITE_RUN_ID,
    status: 'blocked',
    privateArtifactPrefix: MEDIA_DATA_CONTROLLED_SUITE_PRIVATE_GCS_PREFIX,
    localArtifactCount: 0,
    privateUpload: { status: 'blocked', reason },
  })
  await writeVlmRuntimeJsonArtifact(path.join(outputDir, 'phase_46c_controlled_media_data_qa_report.json'), {
    phase: MEDIA_DATA_CONTROLLED_SUITE_PHASE,
    runId: MEDIA_DATA_CONTROLLED_SUITE_RUN_ID,
    status: 'blocked',
    mediaDataToolFamilyBetaStatus: 'blocked',
    selectedSampleId: MEDIA_DATA_CONTROLLED_SAMPLE.sampleId,
    toolStatus,
    privateArtifactStatus: 'blocked',
    reason,
  })
  await writeVlmRuntimeJsonArtifact(path.join(outputDir, 'phase_46c_blocker_report.json'), {
    phase: MEDIA_DATA_CONTROLLED_SUITE_PHASE,
    runId: MEDIA_DATA_CONTROLLED_SUITE_RUN_ID,
    status: 'blocked',
    blockers: [reason],
    blockedScopes: BLOCKED_SCOPES,
  })
  await writeVlmRuntimeJsonArtifact(path.join(outputDir, 'phase_46c_controlled_real_video_media_data_suite_report.json'), {
    phase: MEDIA_DATA_CONTROLLED_SUITE_PHASE,
    runId: MEDIA_DATA_CONTROLLED_SUITE_RUN_ID,
    status: 'blocked',
    sourcePhase46aPr: base.plan.sourcePhase46aPr,
    sourcePhase46bPr: base.plan.sourcePhase46bPr,
    selectedSampleId: MEDIA_DATA_CONTROLLED_SAMPLE.sampleId,
    mediaDataToolFamilyBetaStatus: 'blocked',
    toolStatus,
    privateArtifactStatus: 'blocked',
    packageInstallation: 'temp_runtime_only_if_reached',
    mediaProcessing: 'controlled_real_video_bounded_if_reached',
    nextPhaseDecision: 'Resolve Phase 46C blocker before Phase 46D.',
    blocker: reason,
  })
}

function requireExecutionConfirmations(): void {
  for (const name of getMediaDataControlledSuitePlan().executionConfirmations) {
    if (process.env[name] !== 'true') throw new Error(`${name}=true is required for Phase 46C controlled-suite execution.`)
  }
  for (const forbidden of getMediaDataControlledSuitePlan().forbiddenConfirmations) {
    if (process.env[forbidden] === 'true') throw new Error(`${forbidden} must not be true for Phase 46C.`)
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

async function copyApprovedPrivateSource(sourcePath: string): Promise<Record<string, unknown>> {
  try {
    await runCommand('gcloud', ['storage', 'cp', MEDIA_DATA_CONTROLLED_SAMPLE.sourceGcsUri, sourcePath], {
      label: 'controlled_source_private_copy',
      timeoutMs: 300000,
    })
    return { status: 'passed', method: 'gcloud_storage_cp' }
  } catch (error) {
    if (!await commandExists('gsutil')) throw error
    await runCommand('gsutil', ['cp', MEDIA_DATA_CONTROLLED_SAMPLE.sourceGcsUri, sourcePath], {
      label: 'controlled_source_private_copy_gsutil_fallback',
      timeoutMs: 300000,
    })
    return {
      status: 'passed',
      method: 'gsutil_cp_fallback',
      primaryMethodStatus: 'blocked',
      primaryMethodReason: summarizeGcsToolError(error),
    }
  }
}

async function copyLocalDirectoryToPrivateGcs(outputDir: string): Promise<Record<string, unknown>> {
  try {
    await runCommand('gcloud', ['storage', 'cp', '--recursive', outputDir, MEDIA_DATA_CONTROLLED_SUITE_PRIVATE_GCS_PREFIX], {
      label: 'private_artifact_upload',
      timeoutMs: 300000,
    })
    return { status: 'passed', method: 'gcloud_storage_cp_recursive' }
  } catch (error) {
    if (!await commandExists('gsutil')) throw error
    await runCommand('gsutil', ['-m', 'cp', '-r', outputDir, MEDIA_DATA_CONTROLLED_SUITE_PRIVATE_GCS_PREFIX], {
      label: 'private_artifact_upload_gsutil_fallback',
      timeoutMs: 300000,
    })
    return {
      status: 'passed',
      method: 'gsutil_cp_recursive_fallback',
      primaryMethodStatus: 'blocked',
      primaryMethodReason: summarizeGcsToolError(error),
    }
  }
}

async function copyLocalFileToPrivateGcs(localPath: string, destination: string, label: string): Promise<Record<string, unknown>> {
  try {
    await runCommand('gcloud', ['storage', 'cp', localPath, destination], {
      label,
      timeoutMs: 120000,
    })
    return { status: 'passed', method: 'gcloud_storage_cp' }
  } catch (error) {
    if (!await commandExists('gsutil')) throw error
    await runCommand('gsutil', ['cp', localPath, destination], {
      label: `${label}_gsutil_fallback`,
      timeoutMs: 120000,
    })
    return {
      status: 'passed',
      method: 'gsutil_cp_fallback',
      primaryMethodStatus: 'blocked',
      primaryMethodReason: summarizeGcsToolError(error),
    }
  }
}

async function countPrivateGcsObjects(): Promise<number> {
  try {
    const listing = await runCommand('gcloud', ['storage', 'ls', '--recursive', MEDIA_DATA_CONTROLLED_SUITE_PRIVATE_GCS_PREFIX], {
      label: 'private_artifact_list',
      timeoutMs: 120000,
    })
    return listing.stdout.split('\n').filter((line) => line.trim().startsWith('gs://')).length
  } catch (error) {
    if (!await commandExists('gsutil')) throw error
    const listing = await runCommand('gsutil', ['ls', '-r', MEDIA_DATA_CONTROLLED_SUITE_PRIVATE_GCS_PREFIX], {
      label: 'private_artifact_list_gsutil_fallback',
      timeoutMs: 120000,
    })
    return listing.stdout.split('\n').filter((line) => line.trim().startsWith('gs://')).length
  }
}

async function commandExists(command: string): Promise<boolean> {
  try {
    await execFileAsync('which', [command], { timeout: 10000 })
    return true
  } catch {
    return false
  }
}

function sanitizeError(error: unknown): string {
  const value = error instanceof Error ? error.message : String(error)
  const redacted = value
    .replace(/ya29\.[0-9A-Za-z._-]+/g, '<redacted-token>')
    .replace(/Authorization: Bearer [^\s]+/g, 'Authorization: Bearer <redacted-token>')
    .replace(/access_token["'=:\s]+[0-9A-Za-z._-]+/gi, 'access_token=<redacted-token>')
  return redacted.length > 1600 ? `${redacted.slice(0, 1600)}...<truncated>` : redacted
}

function summarizeGcsToolError(error: unknown): string {
  const value = sanitizeError(error)
  if (value.includes('controlled_source_private_copy failed') && value.includes('gcloud storage cp')) {
    return 'gcloud storage copy blocked by local Cloud SDK copy helper failure; gsutil private-copy fallback used.'
  }
  if (value.includes('private_artifact_upload failed') && value.includes('gcloud storage cp')) {
    return 'gcloud storage upload blocked by local Cloud SDK copy helper failure; gsutil private-upload fallback used.'
  }
  if (value.includes('gcloud-crc32c') && value.includes('Bad CPU type in executable')) {
    return 'gcloud storage copy blocked by local gcloud-crc32c CPU-architecture mismatch; gsutil private-copy fallback used.'
  }
  if (value.includes('Reauthentication failed') || value.includes('cannot prompt')) {
    return 'gcloud storage copy blocked by noninteractive auth prompt; fallback attempted only if existing gsutil auth worked.'
  }
  return value.length > 280 ? `${value.slice(0, 280)}...<truncated>` : value
}

function redactGcloudObjectMetadata(metadata: unknown): unknown {
  if (!metadata || typeof metadata !== 'object') return metadata
  const record = metadata as Record<string, unknown>
  return {
    name: record.name,
    bucket: record.bucket,
    size: record.size,
    contentType: record.contentType,
    timeCreated: record.timeCreated,
    updated: record.updated,
    generation: record.generation,
    metageneration: record.metageneration,
    crc32c: record.crc32c,
    md5HashPresent: Boolean(record.md5Hash),
  }
}

function renderSuiteMarkdown(summary: MediaDataControlledSuiteSummary): string {
  return [
    '# Phase 46C Controlled Real-Video Media/Data Suite Report',
    '',
    `Run ID: \`${summary.runId}\``,
    '',
    `Status: \`${summary.status}\``,
    '',
    `Media/data tool-family beta status: \`${summary.mediaDataToolFamilyBetaStatus}\``,
    '',
    `Selected sample: \`${summary.selectedSampleId}\``,
    '',
    `Private artifact status: \`${summary.privateArtifactStatus}\``,
    '',
    'Tool status:',
    ...CONTROLLED_TOOL_IDS.map((toolId) => `- ${toolId}: \`${summary.toolStatus[toolId]}\``),
    '',
    `Next phase decision: ${summary.nextPhaseDecision}`,
  ].join('\n')
}

async function collectControlledArtifactManifest(rootDir: string, prefix = ''): Promise<Array<{ relativePath: string; kind: string; sizeBytes: number; sha256: string }>> {
  const entries = await readdir(path.join(rootDir, prefix), { withFileTypes: true })
  const artifacts: Array<{ relativePath: string; kind: string; sizeBytes: number; sha256: string }> = []
  for (const entry of entries) {
    const relative = prefix ? path.join(prefix, entry.name) : entry.name
    const absolute = path.join(rootDir, relative)
    if (entry.isDirectory()) {
      artifacts.push(...await collectControlledArtifactManifest(rootDir, relative))
      continue
    }
    const fileStat = await stat(absolute)
    const normalizedRelative = relative.split(path.sep).join('/')
    artifacts.push({
      relativePath: normalizedRelative,
      kind: normalizedRelative.endsWith('.json') ? 'report' : 'controlled_real_video_private_artifact',
      sizeBytes: fileStat.size,
      sha256: await sha256File(absolute),
    })
  }
  return artifacts.sort((a, b) => a.relativePath.localeCompare(b.relativePath))
}

async function sha256File(filePath: string): Promise<string> {
  const hash = createHash('sha256')
  hash.update(await readFile(filePath))
  return hash.digest('hex')
}
