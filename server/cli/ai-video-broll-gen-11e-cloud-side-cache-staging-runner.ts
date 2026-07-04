import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { AI_VIDEO_BROLL_WAN_FAST_CACHE_READINESS_SPEC } from '../../src/backend/mock/mock-ai-video-broll-wan-fast-cache-readiness'
import { AI_VIDEO_BROLL_GEN_11E_CLOUD_SIDE_CACHE_STAGING_RUNNER } from '../../src/backend/mock/mock-ai-video-broll-gen-11e-cloud-side-cache-staging-runner'

type JsonRecord = Record<string, unknown>

type PhaseResult = {
  id: string
  ok: boolean
  exitCode: number | null
  timedOut: boolean
  stdoutSummary?: string
  stderrSummary?: string
}

const SPEC = AI_VIDEO_BROLL_GEN_11E_CLOUD_SIDE_CACHE_STAGING_RUNNER
const CACHE_SPEC = AI_VIDEO_BROLL_WAN_FAST_CACHE_READINESS_SPEC

const CONFIRM_ENV = 'REEDITPRO_CONFIRM_BROLL_11E_CLOUD_SIDE_CACHE_STAGING' satisfies typeof SPEC.confirmationEnv
const MODEL_REPOSITORY = 'Wan-AI/Wan2.1-T2V-1.3B-Diffusers' satisfies typeof SPEC.modelRepository
const DEFAULT_SUMMARY_PATH = path.join('.tmp', 'ai-video-broll-gen-11e-cloud-side-cache-staging-runner.json')
const PROJECT_ID = 'reeditpro'
const REGION = SPEC.region
const JOB_NAME = SPEC.jobName
const SERVICE_ACCOUNT = SPEC.serviceAccount
const TARGET_BUCKET = SPEC.targetPrivateBucket
const TARGET_PREFIX = SPEC.targetPrivatePrefix
const SUPPORT_PREFIX = `proof-payloads/ai-video-broll/11e/cache-staging-runner/${CACHE_SPEC.sourceCommit}`
const SUPPORT_GCS_PREFIX = `gs://${TARGET_BUCKET}/${SUPPORT_PREFIX}`
const TARGET_GCS_PREFIX = `gs://${TARGET_BUCKET}/${TARGET_PREFIX}`
const READY_MARKER = `${TARGET_GCS_PREFIX}/wan-model-cache-ready.json`
const TMP_DIR = path.join('.tmp', 'ai-video-broll-gen-11e-cloud-side-cache-staging-runner')
const NEXT_PROMPT_IF_PASSED =
  'AI-VIDEO-BROLL-GEN-11B-MODEL-IMPORT-PROOF: run bounded no-idle L4 Wan model import proof, no inference'
const NEXT_PROMPT_IF_FAILED =
  'AI-VIDEO-BROLL-GEN-11E-FIX-CLOUD-SIDE-CACHE-STAGING-RUNNER: fix no-GPU Wan private cache staging runner, no inference/no generated video'

function main() {
  const execute = process.argv.includes('--execute')
  const preflightOnly = process.argv.includes('--preflight-only')
  const summaryPath = getArgValue('--summary-path') ?? DEFAULT_SUMMARY_PATH

  if (!execute) {
    const summary = buildSummary({
      summaryPath,
      mode: preflightOnly
        ? 'ai_video_broll_gen_11e_cloud_side_cache_staging_runner_static_preflight_plan'
        : 'ai_video_broll_gen_11e_cloud_side_cache_staging_runner_static_guard',
      status: 'planned',
      decision: 'ai_video_broll_gen_11e_runner_static_no_cloud_commands',
      nextPrompt: SPEC.nextPrompt,
      blockers: [],
      phaseResults: [],
    })
    print(summary)
    return
  }

  if (process.env[CONFIRM_ENV] !== 'true') {
    const summary = buildSummary({
      summaryPath,
      mode: 'ai_video_broll_gen_11e_cloud_side_cache_staging_runner_confirmation_blocked',
      status: 'blocked',
      decision: 'ai_video_broll_gen_11e_runner_confirmation_required_no_cloud_commands',
      nextPrompt: SPEC.nextPrompt,
      blockers: [`confirmation_env_required:${CONFIRM_ENV}=true`],
      phaseResults: [],
    })
    print(summary)
    return
  }

  runExecute(summaryPath)
}

function runExecute(summaryPath: string) {
  const phaseResults: PhaseResult[] = []
  let supportFilesUploaded = false
  let cloudRunJobCreateAttempted = false
  let cloudRunJobCreated = false
  let cloudRunJobExecuted = false
  let cloudRunJobDeleted = false
  let supportFilesCleanupAttempted = false
  let supportFilesCleanupVerified = false
  let privateGcsModelCacheStaged = false
  let readyMarkerCreated = false

  const finish = (status: 'passed' | 'failed' | 'blocked', blockers: string[]) => {
    const summary = buildSummary({
      summaryPath,
      mode: 'ai_video_broll_gen_11e_cloud_side_cache_staging_runner_execute_result',
      status,
      decision: status === 'passed'
        ? 'ai_video_broll_gen_11e_cloud_side_cache_staging_passed_no_gpu_no_inference'
        : 'ai_video_broll_gen_11e_cloud_side_cache_staging_blocked_or_failed_no_gpu_no_inference',
      nextPrompt: status === 'passed' ? NEXT_PROMPT_IF_PASSED : NEXT_PROMPT_IF_FAILED,
      blockers: Array.from(new Set(blockers)),
      phaseResults,
      runtimeOverrides: {
        gcpReadOnlyCommandsExecuted: true,
        cloudRunJobCreateAttempted,
        cloudRunJobCreated,
        cloudRunJobExecuted,
        cloudRunJobDeleted,
        supportFilesUploaded,
        supportFilesCleanupAttempted,
        supportFilesCleanupVerified,
        privateGcsModelCacheStaged,
        readyMarkerCreated,
        storageObjectsCreated: supportFilesUploaded || privateGcsModelCacheStaged || readyMarkerCreated,
      },
    })
    writeSummary(summaryPath, summary)
    print(summary)
  }

  try {
    const localModel = validateLocalModelCache()
    phaseResults.push(localModel)
    if (!localModel.ok) {
      finish('blocked', ['local_model_cache_not_ready'])
      return
    }

    const gcloud = runCommand('gcloud_path', 'which', ['gcloud'], 30_000)
    phaseResults.push(gcloud)
    if (!gcloud.ok) {
      finish('blocked', ['gcloud_not_available'])
      return
    }

    const bucketRead = runGcloud(
      'target_private_bucket_read_preflight',
      ['storage', 'ls', `gs://${TARGET_BUCKET}`, '--project', PROJECT_ID],
      90_000,
    )
    phaseResults.push(bucketRead)
    if (!bucketRead.ok) {
      finish('blocked', ['target_private_bucket_not_readable'])
      return
    }

    const existingMarker = runGcloud(
      'existing_ready_marker_probe',
      ['storage', 'cat', READY_MARKER, '--project', PROJECT_ID],
      90_000,
      { allowFailure: true, captureRawStdout: true },
    )
    phaseResults.push({
      ...existingMarker,
      ok: existingMarker.ok || String(existingMarker.stderrSummary ?? '').includes('not found'),
    })
    if (existingMarker.ok) {
      const marker = parseJson<JsonRecord>(existingMarker.rawStdout)
      if (
        marker?.modelRepository === CACHE_SPEC.modelRepository &&
        marker?.sourceCommit === CACHE_SPEC.sourceCommit &&
        marker?.aggregateBytes === CACHE_SPEC.aggregateBytes &&
        marker?.runtimeEssentialFileCount === CACHE_SPEC.runtimeEssentialFileCount
      ) {
        privateGcsModelCacheStaged = true
        readyMarkerCreated = true
        finish('passed', [])
        return
      }

      finish('blocked', ['existing_ready_marker_mismatch_manual_review_required'])
      return
    }

    const support = writeSupportFiles()
    const uploadManifest = runGcloud(
      'upload_runner_manifest_private_gcs',
      ['storage', 'cp', support.manifestPath, `${SUPPORT_GCS_PREFIX}/manifest.json`, '--project', PROJECT_ID],
      120_000,
    )
    phaseResults.push(uploadManifest)
    const uploadWorker = runGcloud(
      'upload_runner_script_private_gcs',
      ['storage', 'cp', support.workerPath, `${SUPPORT_GCS_PREFIX}/stage.py`, '--project', PROJECT_ID],
      120_000,
    )
    phaseResults.push(uploadWorker)
    supportFilesUploaded = uploadManifest.ok && uploadWorker.ok
    if (!supportFilesUploaded) {
      cleanupSupportFiles(phaseResults)
      finish('failed', ['support_file_upload_failed'])
      return
    }

    const staleJobDelete = runGcloud(
      'delete_stale_prompt_scoped_cloud_run_job_if_present',
      ['run', 'jobs', 'delete', JOB_NAME, '--project', PROJECT_ID, '--region', REGION, '--quiet'],
      120_000,
      { allowFailure: true },
    )
    phaseResults.push(staleJobDelete)

    cloudRunJobCreateAttempted = true
    const createJob = runGcloud(
      'create_prompt_scoped_no_gpu_cloud_run_job',
      [
        'run',
        'jobs',
        'create',
        JOB_NAME,
        '--project',
        PROJECT_ID,
        '--region',
        REGION,
        '--image',
        SPEC.image,
        '--service-account',
        SERVICE_ACCOUNT,
        '--tasks',
        '1',
        '--max-retries',
        '0',
        '--task-timeout',
        '86400',
        '--cpu',
        '4',
        '--memory',
        '8Gi',
        '--command',
        'bash',
        '--args',
        `-lc,gcloud storage cp ${SUPPORT_GCS_PREFIX}/stage.py /tmp/stage.py --project ${PROJECT_ID} && gcloud storage cp ${SUPPORT_GCS_PREFIX}/manifest.json /tmp/manifest.json --project ${PROJECT_ID} && python3 /tmp/stage.py /tmp/manifest.json`,
        '--set-env-vars',
        `REEDITPRO_BROLL_11E_RUN_ID=${support.runId}`,
        '--quiet',
      ],
      10 * 60_000,
    )
    phaseResults.push(createJob)
    cloudRunJobCreated = createJob.ok
    if (!cloudRunJobCreated) {
      cleanupPromptJob(phaseResults)
      cleanupSupportFiles(phaseResults)
      finish('failed', ['cloud_run_job_create_failed'])
      return
    }

    const executeJob = runGcloud(
      'execute_prompt_scoped_no_gpu_cloud_run_job',
      ['run', 'jobs', 'execute', JOB_NAME, '--project', PROJECT_ID, '--region', REGION, '--wait'],
      24 * 60 * 60_000,
    )
    phaseResults.push(executeJob)
    cloudRunJobExecuted = executeJob.ok

    const marker = runGcloud(
      'validate_private_gcs_model_cache_ready_marker',
      ['storage', 'cat', READY_MARKER, '--project', PROJECT_ID],
      120_000,
      { captureRawStdout: true },
    )
    phaseResults.push(marker)
    const markerDocument = parseJson<JsonRecord>(marker.rawStdout)
    readyMarkerCreated =
      marker.ok &&
      markerDocument?.modelRepository === CACHE_SPEC.modelRepository &&
      markerDocument?.sourceCommit === CACHE_SPEC.sourceCommit &&
      markerDocument?.aggregateBytes === CACHE_SPEC.aggregateBytes &&
      markerDocument?.runtimeEssentialFileCount === CACHE_SPEC.runtimeEssentialFileCount
    privateGcsModelCacheStaged = cloudRunJobExecuted && readyMarkerCreated

    const cleanupJob = cleanupPromptJob(phaseResults)
    cloudRunJobDeleted = cleanupJob
    const cleanupSupport = cleanupSupportFiles(phaseResults)
    supportFilesCleanupAttempted = cleanupSupport.attempted
    supportFilesCleanupVerified = cleanupSupport.verified

    const passed =
      cloudRunJobExecuted &&
      privateGcsModelCacheStaged &&
      readyMarkerCreated &&
      cloudRunJobDeleted &&
      supportFilesCleanupVerified
    finish(passed ? 'passed' : 'failed', passed ? [] : ['cloud_side_cache_staging_failed_or_cleanup_not_verified'])
  } catch (error) {
    const cleanupJob = cleanupPromptJob(phaseResults)
    cloudRunJobDeleted = cleanupJob
    const cleanupSupport = cleanupSupportFiles(phaseResults)
    supportFilesCleanupAttempted = cleanupSupport.attempted
    supportFilesCleanupVerified = cleanupSupport.verified
    finish('failed', [`runner_exception:${sanitize(error instanceof Error ? error.message : String(error)) ?? 'unknown'}`])
  }
}

function validateLocalModelCache(): PhaseResult {
  if (!existsSync(CACHE_SPEC.privateCachePath)) {
    return {
      id: 'local_wan_diffusers_model_cache_ready',
      ok: false,
      exitCode: 1,
      timedOut: false,
      stderrSummary: 'model_cache_path_missing',
    }
  }

  try {
    const missingFiles: string[] = []
    const byteMismatches: string[] = []
    let aggregateBytes = 0
    for (const entry of CACHE_SPEC.manifest) {
      const filePath = path.join(CACHE_SPEC.privateCachePath, entry.relativePath)
      if (!existsSync(filePath)) {
        missingFiles.push(entry.relativePath)
        continue
      }
      const actualBytes = statSync(filePath).size
      aggregateBytes += actualBytes
      if (actualBytes !== entry.expectedBytes) byteMismatches.push(entry.relativePath)
    }

    const ok =
      missingFiles.length === 0 &&
      byteMismatches.length === 0 &&
      aggregateBytes === CACHE_SPEC.aggregateBytes
    return {
      id: 'local_wan_diffusers_model_cache_ready',
      ok,
      exitCode: ok ? 0 : 1,
      timedOut: false,
      stdoutSummary: ok
        ? `file_count=${CACHE_SPEC.manifest.length}; aggregate_bytes=${aggregateBytes}`
        : `missing=${missingFiles.length}; byte_mismatches=${byteMismatches.length}; aggregate_bytes=${aggregateBytes}`,
    }
  } catch (error) {
    return {
      id: 'local_wan_diffusers_model_cache_ready',
      ok: false,
      exitCode: 1,
      timedOut: false,
      stderrSummary: sanitize(error instanceof Error ? error.message : String(error)),
    }
  }
}

function writeSupportFiles() {
  mkdirSync(TMP_DIR, { recursive: true })
  const runId = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)
  const manifestPath = path.join(TMP_DIR, `manifest-${runId}.json`)
  const workerPath = path.join(TMP_DIR, `stage-${runId}.py`)
  writeFileSync(manifestPath, JSON.stringify(buildManifest(), null, 2))
  writeFileSync(workerPath, buildWorkerScript())
  return { runId, manifestPath, workerPath }
}

function buildManifest() {
  return {
    modelRepository: CACHE_SPEC.modelRepository,
    sourceCommit: CACHE_SPEC.sourceCommit,
    targetPrivatePrefix: TARGET_GCS_PREFIX,
    readyMarker: READY_MARKER,
    runtimeEssentialFileCount: CACHE_SPEC.runtimeEssentialFileCount,
    aggregateBytes: CACHE_SPEC.aggregateBytes,
    entries: CACHE_SPEC.manifest.map((entry) => ({
      relativePath: entry.relativePath,
      expectedBytes: entry.expectedBytes,
      sourceUrl:
        `https://huggingface.co/${CACHE_SPEC.modelRepository}/resolve/${CACHE_SPEC.sourceCommit}/${entry.relativePath}`,
      targetUri: `${TARGET_GCS_PREFIX}/${entry.relativePath}`,
    })),
  }
}

function buildWorkerScript() {
  return String.raw`
import json
import pathlib
import subprocess
import sys
import tempfile

manifest = json.loads(pathlib.Path(sys.argv[1]).read_text())
entries = manifest["entries"]
copied = []

def run(command):
    return subprocess.run(command, check=True, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

for entry in entries:
    relative_path = entry["relativePath"]
    expected_bytes = int(entry["expectedBytes"])
    source_url = entry["sourceUrl"]
    target_uri = entry["targetUri"]
    pipe = "set -euo pipefail; curl -fL --retry 3 --retry-delay 5 --connect-timeout 30 --max-time 21600 " + json.dumps(source_url) + " | gcloud storage cp - " + json.dumps(target_uri)
    run(["bash", "-lc", pipe])
    described = run(["gcloud", "storage", "objects", "describe", target_uri, "--format=value(size)"])
    actual_bytes = int(described.stdout.strip())
    if actual_bytes != expected_bytes:
        raise RuntimeError(f"byte_mismatch:{relative_path}:{actual_bytes}:{expected_bytes}")
    copied.append({"relativePath": relative_path, "bytes": actual_bytes})
    print(f"REEDITPRO_BROLL_11E_COPIED {relative_path} {actual_bytes}", flush=True)

aggregate_bytes = sum(item["bytes"] for item in copied)
if aggregate_bytes != int(manifest["aggregateBytes"]):
    raise RuntimeError(f"aggregate_byte_mismatch:{aggregate_bytes}:{manifest['aggregateBytes']}")
if len(copied) != int(manifest["runtimeEssentialFileCount"]):
    raise RuntimeError(f"file_count_mismatch:{len(copied)}:{manifest['runtimeEssentialFileCount']}")

marker = {
    "cacheMode": "private_gcs_wan_diffusers_model_cache",
    "modelRepository": manifest["modelRepository"],
    "sourceCommit": manifest["sourceCommit"],
    "runtimeEssentialFileCount": len(copied),
    "aggregateBytes": aggregate_bytes,
    "readyMarkerCreatedBy": "ai-video-broll-gen-11e-cloud-side-cache-staging-runner",
    "modelImportRun": False,
    "modelLoadRun": False,
    "modelInferenceRun": False,
    "generatedVideoCreated": False,
    "generatedAssetsCreated": False,
}
with tempfile.NamedTemporaryFile("w", delete=False, suffix=".json") as handle:
    json.dump(marker, handle, indent=2)
    marker_path = handle.name
run(["gcloud", "storage", "cp", marker_path, manifest["readyMarker"]])
print("REEDITPRO_BROLL_11E_READY_MARKER_WRITTEN", flush=True)
`
}

function cleanupPromptJob(phaseResults: PhaseResult[]): boolean {
  const deleted = runGcloud(
    'delete_prompt_scoped_no_gpu_cloud_run_job',
    ['run', 'jobs', 'delete', JOB_NAME, '--project', PROJECT_ID, '--region', REGION, '--quiet'],
    120_000,
    { allowFailure: true },
  )
  phaseResults.push(deleted)
  const describe = runGcloud(
    'verify_prompt_scoped_no_gpu_cloud_run_job_absent',
    ['run', 'jobs', 'describe', JOB_NAME, '--project', PROJECT_ID, '--region', REGION, '--format=value(metadata.name)'],
    90_000,
    { allowFailure: true },
  )
  phaseResults.push({
    ...describe,
    ok: !describe.ok,
  })
  return !describe.ok
}

function cleanupSupportFiles(phaseResults: PhaseResult[]) {
  const remove = runGcloud(
    'cleanup_private_gcs_runner_support_files',
    ['storage', 'rm', '--recursive', SUPPORT_GCS_PREFIX, '--project', PROJECT_ID],
    120_000,
    { allowFailure: true },
  )
  phaseResults.push(remove)
  const list = runGcloud(
    'verify_private_gcs_runner_support_files_absent',
    ['storage', 'ls', SUPPORT_GCS_PREFIX, '--project', PROJECT_ID],
    90_000,
    { allowFailure: true },
  )
  phaseResults.push({
    ...list,
    ok: !list.ok,
  })
  return { attempted: true, verified: !list.ok }
}

function runGcloud(
  id: string,
  args: string[],
  timeoutMs: number,
  options: { allowFailure?: boolean; captureRawStdout?: boolean } = {},
) {
  return runCommand(id, 'gcloud', args, timeoutMs, options)
}

function runCommand(
  id: string,
  command: string,
  args: string[],
  timeoutMs: number,
  options: { allowFailure?: boolean; captureRawStdout?: boolean } = {},
): PhaseResult & { rawStdout?: string } {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      CLOUDSDK_CORE_DISABLE_PROMPTS: '1',
      CLOUDSDK_PYTHON_SITEPACKAGES: '1',
    },
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 12,
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: timeoutMs,
  })
  const ok = result.status === 0
  return {
    id,
    ok: options.allowFailure ? ok : ok,
    exitCode: result.status,
    timedOut: Boolean(result.error && result.error.message.includes('ETIMEDOUT')),
    stdoutSummary: summarize(String(result.stdout ?? '')),
    stderrSummary: summarize(String(result.stderr ?? '')),
    rawStdout: options.captureRawStdout ? String(result.stdout ?? '') : undefined,
  }
}

function buildSummary(input: {
  summaryPath: string
  mode: string
  status: 'planned' | 'blocked' | 'passed' | 'failed'
  decision: string
  nextPrompt: string
  blockers: string[]
  phaseResults: PhaseResult[]
  runtimeOverrides?: Partial<Record<string, boolean>>
}) {
  return {
    ok: input.status === 'passed',
    mode: input.mode,
    status: input.status,
    decision: input.decision,
    summaryPath: input.summaryPath,
    toolId: SPEC.toolId,
    modelRepository: MODEL_REPOSITORY,
    sourceCommit: SPEC.sourceCommit,
    selectedStrategy: SPEC.selectedStrategy,
    selectedGpu: SPEC.selectedGpu,
    confirmationEnv: CONFIRM_ENV,
    confirmationEnvRequiredValue: 'true',
    projectId: PROJECT_ID,
    region: REGION,
    jobName: JOB_NAME,
    serviceAccount: SERVICE_ACCOUNT,
    image: SPEC.image,
    targetPrivateBucket: TARGET_BUCKET,
    targetPrivatePrefix: TARGET_PREFIX,
    readyMarker: READY_MARKER,
    blockers: input.blockers,
    phaseResults: input.phaseResults,
    localModelCacheExpectedFiles: CACHE_SPEC.runtimeEssentialFileCount,
    localModelCacheExpectedBytes: CACHE_SPEC.aggregateBytes,
    runtimeSideEffects: {
      gcpReadOnlyCommandsExecuted: false,
      cloudRunJobCreateAttempted: false,
      cloudRunJobCreated: false,
      cloudRunJobExecuted: false,
      cloudRunJobDeleted: false,
      supportFilesUploaded: false,
      supportFilesCleanupAttempted: false,
      supportFilesCleanupVerified: false,
      storageObjectsCreated: false,
      readyMarkerCreated: false,
      privateGcsModelCacheStaged: false,
      computeVmCreated: false,
      gpuUsed: false,
      dockerRun: false,
      modelImportRun: false,
      modelLoadRun: false,
      modelInferenceRun: false,
      generatedVideoCreated: false,
      generatedAssetsCreated: false,
      supabaseTouched: false,
      sqlExecuted: false,
      signedUrlsCreated: false,
      publicArtifactsCreated: false,
      providerCallsMade: false,
      workersDispatched: false,
      creditMutationCreated: false,
      betaUnlocked: false,
      productionUnlocked: false,
      generatedLocalFixturePassedClaimed: false,
      ...input.runtimeOverrides,
    },
    nextPrompt: input.nextPrompt,
  }
}

function getArgValue(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  if (index === -1) return undefined
  return process.argv[index + 1]
}

function writeSummary(summaryPath: string, summary: unknown) {
  mkdirSync(path.dirname(summaryPath), { recursive: true })
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2))
}

function parseJson<T>(value: string | undefined): T | undefined {
  if (!value) return undefined
  try {
    return JSON.parse(value) as T
  } catch {
    return undefined
  }
}

function summarize(value: string): string | undefined {
  const sanitized = sanitize(value)
  return sanitized ? sanitized.slice(0, 1200) : undefined
}

function sanitize(value: string): string | undefined {
  const sanitized = value
    .replace(/\bhttps?:\/\/\S+/gi, 'redacted_url')
    .replace(/\bya29\.[A-Za-z0-9._-]+/g, 'redacted_access_token')
    .replace(/\bBearer\s+\S+/gi, 'Bearer redacted')
    .replace(/\b(X-Goog-Signature|X-Amz-Signature|Signature=)\S*/gi, 'redacted_signature')
    .trim()

  return sanitized || undefined
}

function print(value: unknown) {
  console.log(JSON.stringify(value, null, 2))
}

main()
