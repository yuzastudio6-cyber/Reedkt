import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { AI_VIDEO_BROLL_GEN_10Y_L4_PAYLOAD_INSTALL_RUNNER_CONTRACT } from './ai-video-broll-gen-10y-l4-payload-install-runner-contract'
import { AI_VIDEO_BROLL_WAN_FAST_CACHE_READINESS_SPEC } from '../../src/backend/mock/mock-ai-video-broll-wan-fast-cache-readiness'

type JsonRecord = Record<string, unknown>

type PhaseResult = {
  id: string
  ok: boolean
  exitCode: number | null
  timedOut: boolean
  stdoutSummary?: string
  stderrSummary?: string
}

type GcloudAccountSelection = {
  account?: string
  overrideIndexProvided: boolean
  overrideIndexSource?: 'cli' | 'env'
  overrideIndex?: number
  overrideResolved: boolean
  resolutionFailure?: string
}

type RunnerSummary = {
  ok: boolean
  mode: string
  status: 'planned' | 'blocked' | 'passed' | 'failed'
  decision: string
  summaryPath: string
  nextPrompt: string
  accountSelection: ReturnType<typeof accountSelectionOutput>
  blockers: string[]
  phaseResults: PhaseResult[]
  preflightPassed: boolean
  localModelCacheValidated: boolean
  privateGcsWheelhouseReady: boolean
  privateGcsModelCacheReady: boolean
  privateGcsModelCacheStaged: boolean
  computeVmCreateAttempted: boolean
  computeVmCreated: boolean
  postCreatePrivateOnlyVerified: boolean
  bootDiskAutoDeleteVerified: boolean
  iapLookupReadinessPassed: boolean
  python312ReadinessPassed: boolean
  privateGcsPayloadDownloaded: boolean
  wheelhousePayloadTransferred: boolean
  modelCachePayloadTransferred: boolean
  remoteModelCacheValidated: boolean
  offlineDependencyInstallPassed: boolean
  dependencyImportReadinessPassed: boolean
  wanPipelineClassImportPassed: boolean
  wanPipelineLocalLoadPassed: boolean
  cleanupAttempted: boolean
  cleanupVerified: boolean
  runtimeSideEffects: JsonRecord
}

const CONTRACT = AI_VIDEO_BROLL_GEN_10Y_L4_PAYLOAD_INSTALL_RUNNER_CONTRACT
const CACHE_SPEC = AI_VIDEO_BROLL_WAN_FAST_CACHE_READINESS_SPEC

const CONFIRM_ENV = 'REEDITPRO_CONFIRM_BROLL_11B_MODEL_IMPORT_PROOF'
const GCLOUD_ACCOUNT_OVERRIDE_INDEX_ENV = 'REEDITPRO_EXTERNAL_AGENT_GCLOUD_ACCOUNT_INDEX'
const GCLOUD_ACCOUNT_OVERRIDE_INDEX_CLI_FLAG = '--account-index'
const GCLOUD_ACCOUNT_OVERRIDE_INDEX_CLI_FLAG_ALIAS = '--gcloud-account-index'
const DEFAULT_SUMMARY_PATH = path.join('.tmp', 'ai-video-broll-gen-11b-model-import-proof-summary.json')
const PROJECT_ID = CONTRACT.projectId
const PROOF_VM_NAME = CONTRACT.proofVmName
const TARGET_REGION = CONTRACT.targetRegion
const TARGET_ZONE = CONTRACT.targetZone
const MACHINE_TYPE = CONTRACT.machineType
const ACCELERATOR = 'nvidia-l4'
const TARGET_TAG = 'ai-video-broll-wan-l4-proof'
const IMAGE_FAMILY = 'common-cu129-ubuntu-2404-nvidia-580'
const IMAGE_PROJECT = 'deeplearning-platform-release'
const SERVICE_ACCOUNT = `reeditpro-ai-broll-proof-sa@${PROJECT_ID}.iam.gserviceaccount.com`

const WHEELHOUSE_PATH =
  '/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python312-linux-x86_64'
const WHEELHOUSE_MANIFEST = path.join(WHEELHOUSE_PATH, 'SHA256SUMS.json')
const EXPECTED_WHEEL_COUNT = 66
const EXPECTED_WHEELHOUSE_BYTES = 2802483442
const EXPECTED_WHEELHOUSE_SHA256 = '55ab4ba840e664996b29ee684591a500568bbb9ade332d2b48f05af8e79eab64'

const REMOTE_ROOT = '/tmp/reeditpro-broll-11b'
const REMOTE_WHEELHOUSE = `${REMOTE_ROOT}/python312-linux-x86_64`
const REMOTE_TARGET_DEPS = `${REMOTE_ROOT}/target-deps`
const REMOTE_MODEL_CACHE = `${REMOTE_ROOT}/model-cache`
const REMOTE_HF_HOME = `${REMOTE_ROOT}/hf-home`

const PRIVATE_GCS_PAYLOAD_BUCKET = 'reeditpro-staging-reeditpro-model-cache'
const PRIVATE_GCS_WHEELHOUSE_PREFIX =
  `gs://${PRIVATE_GCS_PAYLOAD_BUCKET}/proof-payloads/ai-video-broll/10zb/wheelhouse-by-sha256/${EXPECTED_WHEELHOUSE_SHA256}`
const PRIVATE_GCS_MODEL_CACHE_PREFIX =
  `gs://${PRIVATE_GCS_PAYLOAD_BUCKET}/proof-payloads/ai-video-broll/11b/model-cache-by-commit/${CACHE_SPEC.modelRepository.replace('/', '__')}/${CACHE_SPEC.sourceCommit}`
const WHEELHOUSE_CACHE_MARKER_FILE_NAME = 'wheelhouse-cache-ready.json'
const MODEL_CACHE_MARKER_FILE_NAME = 'wan-model-cache-ready.json'
const GCS_PAYLOAD_TIMEOUT_MS = 90 * 60_000

const NEXT_PROMPT_IF_PASSED =
  'AI-VIDEO-BROLL-GEN-11C-MODEL-IMPORT-RESULT-REVIEW: review bounded Wan model import proof result, no inference'
const NEXT_PROMPT_IF_FAILED =
  'AI-VIDEO-BROLL-GEN-11B-FIX-MODEL-IMPORT-PROOF: fix blocked bounded Wan model import proof, no inference'

let cachedGcloudAccountSelection: GcloudAccountSelection | undefined

const GCLOUD_TIMEOUT_RUNNER_SCRIPT = `
const { spawn } = require('node:child_process');
const timeoutMs = Number(process.argv[1]);
const args = JSON.parse(process.argv[2]);
const suppressStdout = process.argv[3] === '1';
const maxOutputBytes = 1024 * 1024 * 16;
let stdout = '';
let stderr = '';
let timedOut = false;
let closed = false;
function append(current, chunk) {
  if (current.length >= maxOutputBytes) return current;
  const next = current + String(chunk);
  return next.length > maxOutputBytes ? next.slice(0, maxOutputBytes) : next;
}
function emit(payload) {
  if (closed) return;
  closed = true;
  process.stdout.write(JSON.stringify(payload));
}
const child = spawn('gcloud', args, {
  cwd: process.cwd(),
  detached: process.platform !== 'win32',
  env: {
    ...process.env,
    CLOUDSDK_CORE_DISABLE_PROMPTS: '1',
    CLOUDSDK_PYTHON_SITEPACKAGES: '1',
  },
  stdio: ['ignore', suppressStdout ? 'ignore' : 'pipe', 'pipe'],
});
if (child.stdout) child.stdout.on('data', (chunk) => { stdout = append(stdout, chunk); });
if (child.stderr) child.stderr.on('data', (chunk) => { stderr = append(stderr, chunk); });
function killChild(signal) {
  if (!child.pid) return;
  try {
    process.kill(process.platform === 'win32' ? child.pid : -child.pid, signal);
  } catch {
    try { child.kill(signal); } catch {}
  }
}
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.once(signal, () => {
    timedOut = true;
    killChild(signal);
    setTimeout(() => {
      killChild('SIGKILL');
      emit({ status: null, signal, timedOut, stdout, stderr: stderr || 'gcloud_timeout_wrapper_interrupted' });
    }, 5000).unref();
  });
}
const timeout = setTimeout(() => {
  timedOut = true;
  killChild('SIGTERM');
  setTimeout(() => killChild('SIGKILL'), 5000).unref();
}, timeoutMs);
child.on('error', (error) => {
  clearTimeout(timeout);
  emit({ status: null, signal: null, timedOut, stdout, stderr: stderr || String(error && error.message ? error.message : error) });
});
child.on('close', (status, signal) => {
  clearTimeout(timeout);
  emit({ status, signal, timedOut, stdout, stderr });
});
`

function main() {
  const execute = process.argv.includes('--execute')
  const preflightOnly = process.argv.includes('--preflight-only') || process.argv.includes('--read-only-preflight')
  const cacheFillOnly = process.argv.includes('--cache-fill-only')
  const summaryPath = getArgValue('--summary-path') ?? DEFAULT_SUMMARY_PATH

  if (preflightOnly) {
    const phaseResults: PhaseResult[] = []
    const localModelCache = validateLocalModelCache()
    phaseResults.push(localModelCache)
    const localWheelhouse = validateLocalWheelhouseManifest()
    phaseResults.push(localWheelhouse)
    const privateGcsWheelhouse = validatePrivateGcsWheelhouseCache()
    phaseResults.push(...privateGcsWheelhouse.phaseResults)
    const privateGcsModelCache = validatePrivateGcsModelCache()
    phaseResults.push(...privateGcsModelCache.phaseResults)
    const preflight = runPreflight()
    phaseResults.push(...preflight.phaseResults)

    const blockers = [
      ...(localModelCache.ok ? [] : ['local_model_cache_not_ready']),
      ...(localWheelhouse.ok ? [] : ['local_wheelhouse_manifest_not_ready']),
      ...(privateGcsWheelhouse.ok ? [] : ['private_gcs_wheelhouse_cache_not_ready']),
      ...(privateGcsModelCache.ok ? [] : ['private_gcs_model_cache_not_ready_cache_fill_required']),
      ...preflight.blockers,
    ]
    const passed = blockers.length === 0
    const summary: RunnerSummary = {
      ...baseSummary(summaryPath, passed ? 'passed' : 'blocked'),
      mode: 'ai_video_broll_gen_11b_l4_model_import_runner_read_only_preflight_only',
      decision: passed
        ? 'ai_video_broll_gen_11b_preflight_passed_vm_create_still_not_attempted'
        : 'ai_video_broll_gen_11b_preflight_blocked_no_vm_created',
      nextPrompt: passed
        ? 'AI-VIDEO-BROLL-GEN-11B-MODEL-IMPORT-PROOF: run bounded no-idle L4 Wan model import proof, no inference'
        : NEXT_PROMPT_IF_FAILED,
      blockers: Array.from(new Set(blockers)),
      phaseResults,
      preflightPassed: passed,
      localModelCacheValidated: localModelCache.ok,
      privateGcsWheelhouseReady: privateGcsWheelhouse.ok,
      privateGcsModelCacheReady: privateGcsModelCache.ok,
      runtimeSideEffects: runtimeSideEffects({
        gcpReadOnlyCommandsExecuted: true,
        computeVmCreateAttempted: false,
        computeVmCreated: false,
        cleanupAttempted: false,
        cleanupVerified: false,
      }),
    }
    writeDurableSummary(summaryPath, summary)
    print(summary)
    return
  }

  if (!execute) {
    const summary = baseSummary(summaryPath, 'planned')
    summary.mode = cacheFillOnly
      ? 'ai_video_broll_gen_11b_l4_model_import_runner_cache_fill_confirmation_blocked'
      : 'ai_video_broll_gen_11b_l4_model_import_runner_static_plan'
    summary.decision = cacheFillOnly
      ? 'ai_video_broll_gen_11b_model_cache_fill_requires_execute_confirmation'
      : 'ai_video_broll_gen_11b_l4_model_import_runner_static_plan_only_no_gcp_commands'
    summary.blockers = cacheFillOnly ? [`confirmation_env_required:${CONFIRM_ENV}=true`] : []
    summary.nextPrompt = 'AI-VIDEO-BROLL-GEN-11B-MODEL-IMPORT-PROOF: run bounded no-idle L4 Wan model import proof, no inference'
    print(summary)
    return
  }

  if (process.env[CONFIRM_ENV] !== 'true') {
    const summary = baseSummary(summaryPath, 'blocked')
    summary.mode = 'ai_video_broll_gen_11b_l4_model_import_runner_confirmation_blocked'
    summary.decision = 'ai_video_broll_gen_11b_l4_model_import_runner_confirmation_required_no_gcp_commands'
    summary.blockers = [`confirmation_env_required:${CONFIRM_ENV}=true`]
    print(summary)
    return
  }

  if (cacheFillOnly) {
    runCacheFill(summaryPath)
    return
  }

  runExecute(summaryPath)
}

function runCacheFill(summaryPath: string) {
  const phaseResults: PhaseResult[] = []
  const localModelCache = validateLocalModelCache()
  phaseResults.push(localModelCache)
  if (!localModelCache.ok) {
    const summary: RunnerSummary = {
      ...baseSummary(summaryPath, 'blocked'),
      mode: 'ai_video_broll_gen_11b_l4_model_import_runner_cache_fill_local_preflight_blocked',
      decision: 'ai_video_broll_gen_11b_model_cache_fill_local_preflight_blocked_no_vm_created',
      blockers: ['local_model_cache_not_ready'],
      phaseResults,
      localModelCacheValidated: false,
    }
    writeDurableSummary(summaryPath, summary)
    print(summary)
    return
  }

  const preflight = runPrivateGcsWritePreflight()
  phaseResults.push(...preflight.phaseResults)
  if (!preflight.ok) {
    const summary: RunnerSummary = {
      ...baseSummary(summaryPath, 'blocked'),
      mode: 'ai_video_broll_gen_11b_l4_model_import_runner_cache_fill_preflight_blocked',
      decision: 'ai_video_broll_gen_11b_model_cache_fill_preflight_blocked_no_vm_created',
      blockers: preflight.blockers,
      phaseResults,
      localModelCacheValidated: true,
      runtimeSideEffects: runtimeSideEffects({
        gcpReadOnlyCommandsExecuted: true,
        computeVmCreateAttempted: false,
        computeVmCreated: false,
        cleanupAttempted: false,
        cleanupVerified: false,
      }),
    }
    writeDurableSummary(summaryPath, summary)
    print(summary)
    return
  }

  const uploadResults = uploadModelCacheToPrivateGcs()
  phaseResults.push(...uploadResults)
  const cacheReadiness = validatePrivateGcsModelCache()
  phaseResults.push(...cacheReadiness.phaseResults)
  const passed = cacheReadiness.ok
  const summary: RunnerSummary = {
    ...baseSummary(summaryPath, passed ? 'passed' : 'failed'),
    mode: 'ai_video_broll_gen_11b_l4_model_import_runner_private_gcs_model_cache_fill_only',
    decision: passed
      ? 'ai_video_broll_gen_11b_private_gcs_model_cache_ready_no_vm_created'
      : 'ai_video_broll_gen_11b_private_gcs_model_cache_fill_failed_no_vm_created',
    blockers: passed ? [] : ['private_gcs_model_cache_fill_failed'],
    phaseResults,
    preflightPassed: true,
    localModelCacheValidated: true,
    privateGcsModelCacheReady: passed,
    privateGcsModelCacheStaged: passed,
    runtimeSideEffects: runtimeSideEffects({
      gcpReadOnlyCommandsExecuted: true,
      computeVmCreateAttempted: false,
      computeVmCreated: false,
      cleanupAttempted: false,
      cleanupVerified: false,
      privateGcsModelCacheStaged: passed,
    }),
  }
  writeDurableSummary(summaryPath, summary)
  print(summary)
}

function runExecute(summaryPath: string) {
  const phaseResults: PhaseResult[] = []
  let preflightPassed = false
  let localModelCacheValidated = false
  let privateGcsWheelhouseReady = false
  let privateGcsModelCacheReady = false
  let computeVmCreateAttempted = false
  let computeVmCreated = false
  let postCreatePrivateOnlyVerified = false
  let bootDiskAutoDeleteVerified = false
  let iapLookupReadinessPassed = false
  let python312ReadinessPassed = false
  let privateGcsPayloadDownloaded = false
  let wheelhousePayloadTransferred = false
  let modelCachePayloadTransferred = false
  let remoteModelCacheValidated = false
  let offlineDependencyInstallPassed = false
  let dependencyImportReadinessPassed = false
  let wanPipelineClassImportPassed = false
  let wanPipelineLocalLoadPassed = false
  let cleanupAttempted = false
  let cleanupVerified = false

  const finishWith = (status: 'passed' | 'failed' | 'blocked', blockers: string[]) => {
    const summary: RunnerSummary = {
      ...baseSummary(summaryPath, status),
      mode: 'ai_video_broll_gen_11b_l4_model_import_runner_execute_result',
      decision: status === 'passed'
        ? 'ai_video_broll_gen_11b_l4_model_import_proof_passed_cleanup_verified_no_inference'
        : 'ai_video_broll_gen_11b_l4_model_import_proof_blocked_or_failed_cleanup_required',
      blockers: Array.from(new Set(blockers)),
      phaseResults,
      preflightPassed,
      localModelCacheValidated,
      privateGcsWheelhouseReady,
      privateGcsModelCacheReady,
      computeVmCreateAttempted,
      computeVmCreated,
      postCreatePrivateOnlyVerified,
      bootDiskAutoDeleteVerified,
      iapLookupReadinessPassed,
      python312ReadinessPassed,
      privateGcsPayloadDownloaded,
      wheelhousePayloadTransferred,
      modelCachePayloadTransferred,
      remoteModelCacheValidated,
      offlineDependencyInstallPassed,
      dependencyImportReadinessPassed,
      wanPipelineClassImportPassed,
      wanPipelineLocalLoadPassed,
      cleanupAttempted,
      cleanupVerified,
      runtimeSideEffects: runtimeSideEffects({
        computeVmCreateAttempted,
        computeVmCreated,
        cleanupAttempted,
        cleanupVerified,
        sshSessionOpened: iapLookupReadinessPassed,
        privateGcsPayloadDownloaded,
        wheelhousePayloadTransferred,
        modelCachePayloadTransferred,
        remoteModelCacheValidationRun: remoteModelCacheValidated,
        dependencyInstalledOnVm: offlineDependencyInstallPassed,
        dependencyImportReadinessRun: dependencyImportReadinessPassed,
        modelImportRun: wanPipelineClassImportPassed || wanPipelineLocalLoadPassed,
        modelLoadRun: wanPipelineLocalLoadPassed,
      }),
    }
    writeDurableSummary(summaryPath, summary)
    print(summary)
  }

  const cleanupPrompt = () => {
    cleanupAttempted = true
    const cleanup = cleanupPromptResources()
    phaseResults.push(...cleanup.phaseResults)
    cleanupVerified = cleanup.cleanupVerified
  }

  try {
    const localModel = validateLocalModelCache()
    phaseResults.push(localModel)
    localModelCacheValidated = localModel.ok
    const wheelhouse = validateLocalWheelhouseManifest()
    phaseResults.push(wheelhouse)
    const privateWheelhouse = validatePrivateGcsWheelhouseCache()
    phaseResults.push(...privateWheelhouse.phaseResults)
    privateGcsWheelhouseReady = privateWheelhouse.ok
    const privateModelCache = validatePrivateGcsModelCache()
    phaseResults.push(...privateModelCache.phaseResults)
    privateGcsModelCacheReady = privateModelCache.ok
    const preflight = runPreflight()
    phaseResults.push(...preflight.phaseResults)

    const blockers = [
      ...(localModel.ok ? [] : ['local_model_cache_not_ready']),
      ...(wheelhouse.ok ? [] : ['local_wheelhouse_manifest_not_ready']),
      ...(privateWheelhouse.ok ? [] : ['private_gcs_wheelhouse_cache_not_ready']),
      ...(privateModelCache.ok ? [] : ['private_gcs_model_cache_not_ready_run_cache_fill_only_first']),
      ...preflight.blockers,
    ]
    preflightPassed = blockers.length === 0
    if (!preflightPassed) {
      finishWith('blocked', blockers)
      return
    }

    computeVmCreateAttempted = true
    const create = runGcloud(
      'create_prompt_scoped_l4_vm',
      [
        'compute',
        'instances',
        'create',
        PROOF_VM_NAME,
        '--project',
        PROJECT_ID,
        '--zone',
        TARGET_ZONE,
        '--machine-type',
        MACHINE_TYPE,
        '--accelerator',
        `type=${ACCELERATOR},count=1`,
        '--maintenance-policy',
        'TERMINATE',
        '--image-family',
        IMAGE_FAMILY,
        '--image-project',
        IMAGE_PROJECT,
        '--network-interface',
        'network=default,no-address',
        '--tags',
        TARGET_TAG,
        '--service-account',
        SERVICE_ACCOUNT,
        '--scopes',
        'logging-write,monitoring-write,storage-ro',
        '--boot-disk-size',
        '160GB',
        '--boot-disk-type',
        'pd-balanced',
        '--boot-disk-auto-delete',
        '--quiet',
      ],
      10 * 60_000,
    )
    phaseResults.push(create)
    computeVmCreated = create.ok || describeInstanceCompact().ok
    if (!computeVmCreated) {
      cleanupPrompt()
      finishWith('failed', ['l4_vm_create_failed_or_timed_out'])
      return
    }

    const readiness = waitForInstanceReadiness()
    phaseResults.push(...readiness.phaseResults)
    postCreatePrivateOnlyVerified = readiness.privateOnly
    bootDiskAutoDeleteVerified = readiness.bootDiskAutoDelete
    if (!readiness.ok) {
      cleanupPrompt()
      finishWith('failed', readiness.blockers)
      return
    }

    const iap = waitForIapLookupReadiness()
    phaseResults.push(...iap.phaseResults)
    iapLookupReadinessPassed = iap.ok
    if (!iap.ok) {
      cleanupPrompt()
      finishWith('failed', ['iap_lookup_readiness_not_captured'])
      return
    }

    const python = waitForPython312Readiness()
    phaseResults.push(...python.phaseResults)
    python312ReadinessPassed = python.ok
    if (!python312ReadinessPassed) {
      cleanupPrompt()
      finishWith('failed', ['python312_readiness_failed_before_payload_transfer'])
      return
    }

    const remotePrep = runSsh(
      'prepare_remote_payload_directory',
      `rm -rf ${REMOTE_ROOT} && mkdir -p ${REMOTE_ROOT} ${REMOTE_WHEELHOUSE} ${REMOTE_MODEL_CACHE}`,
      90_000,
    )
    phaseResults.push(remotePrep)

    const remoteGcloud = runSsh(
      'remote_gcloud_storage_readiness',
      'gcloud --version && echo REEDITPRO_BROLL_11B_REMOTE_GCLOUD_READY',
      120_000,
    )
    phaseResults.push(remoteGcloud)

    const downloadWheelhouse = runSsh(
      'remote_private_gcs_wheelhouse_download',
      [
        'set -e',
        '&&',
        'python3.12 -c',
        JSON.stringify(buildRemoteWheelhouseDownloadScript()),
        '&&',
        'echo REEDITPRO_BROLL_11B_PRIVATE_GCS_WHEELHOUSE_DOWNLOAD_OK',
      ].join(' '),
      GCS_PAYLOAD_TIMEOUT_MS,
    )
    phaseResults.push(downloadWheelhouse)

    const downloadModel = runSsh(
      'remote_private_gcs_model_cache_download',
      [
        'set -e',
        '&&',
        'python3.12 -c',
        JSON.stringify(buildRemoteModelCacheDownloadScript()),
        '&&',
        'echo REEDITPRO_BROLL_11B_PRIVATE_GCS_MODEL_CACHE_DOWNLOAD_OK',
      ].join(' '),
      GCS_PAYLOAD_TIMEOUT_MS,
    )
    phaseResults.push(downloadModel)
    privateGcsPayloadDownloaded = remoteGcloud.ok && downloadWheelhouse.ok && downloadModel.ok
    wheelhousePayloadTransferred =
      downloadWheelhouse.ok &&
      Boolean(downloadWheelhouse.stdoutSummary?.includes('REEDITPRO_BROLL_11B_PRIVATE_GCS_WHEELHOUSE_DOWNLOAD_OK'))
    modelCachePayloadTransferred =
      downloadModel.ok &&
      Boolean(downloadModel.stdoutSummary?.includes('REEDITPRO_BROLL_11B_PRIVATE_GCS_MODEL_CACHE_DOWNLOAD_OK'))

    if (!wheelhousePayloadTransferred || !modelCachePayloadTransferred) {
      cleanupPrompt()
      finishWith('failed', [
        ...(wheelhousePayloadTransferred ? [] : ['private_gcs_wheelhouse_download_failed']),
        ...(modelCachePayloadTransferred ? [] : ['private_gcs_model_cache_download_failed']),
      ])
      return
    }

    const remoteModelValidation = runSsh(
      'remote_wan_model_cache_layout_validation',
      [
        'python3.12',
        '-c',
        JSON.stringify(buildRemoteModelCacheValidationScript()),
      ].join(' '),
      10 * 60_000,
    )
    phaseResults.push(remoteModelValidation)
    remoteModelCacheValidated =
      remoteModelValidation.ok &&
      Boolean(remoteModelValidation.stdoutSummary?.includes('REEDITPRO_BROLL_11B_REMOTE_MODEL_CACHE_READY'))
    if (!remoteModelCacheValidated) {
      cleanupPrompt()
      finishWith('failed', ['remote_model_cache_layout_validation_failed'])
      return
    }

    const install = runSsh(
      'offline_dependency_install_readiness',
      [
        `rm -rf ${REMOTE_TARGET_DEPS}`,
        '&&',
        'mkdir -p',
        REMOTE_TARGET_DEPS,
        '&&',
        'python3.12 -c',
        JSON.stringify(
          `import pathlib, zipfile; src=pathlib.Path('${REMOTE_WHEELHOUSE}'); dst=pathlib.Path('${REMOTE_TARGET_DEPS}'); wheels=sorted(src.glob('*.whl')); assert len(wheels) == ${EXPECTED_WHEEL_COUNT}, len(wheels); [zipfile.ZipFile(wheel).extractall(dst) for wheel in wheels]; print('REEDITPRO_BROLL_11B_OFFLINE_WHEEL_EXTRACT_OK')`,
        ),
        '&&',
        'echo REEDITPRO_BROLL_11B_OFFLINE_INSTALL_OK',
      ].join(' '),
      25 * 60_000,
    )
    phaseResults.push(install)
    offlineDependencyInstallPassed =
      install.ok && Boolean(install.stdoutSummary?.includes('REEDITPRO_BROLL_11B_OFFLINE_INSTALL_OK'))
    if (!offlineDependencyInstallPassed) {
      cleanupPrompt()
      finishWith('failed', ['offline_dependency_install_readiness_failed'])
      return
    }

    const imports = runSsh(
      'dependency_and_wan_pipeline_class_import_readiness',
      [
        `PYTHONPATH=${REMOTE_TARGET_DEPS}`,
        'HF_HUB_OFFLINE=1 TRANSFORMERS_OFFLINE=1 DIFFUSERS_OFFLINE=1',
        'python3.12 -c',
        JSON.stringify(
          "import torch, diffusers, transformers; from diffusers import WanPipeline; print('REEDITPRO_BROLL_11B_WAN_PIPELINE_CLASS_IMPORT_OK')",
        ),
      ].join(' '),
      120_000,
    )
    phaseResults.push(imports)
    dependencyImportReadinessPassed =
      imports.ok && Boolean(imports.stdoutSummary?.includes('REEDITPRO_BROLL_11B_WAN_PIPELINE_CLASS_IMPORT_OK'))
    wanPipelineClassImportPassed = dependencyImportReadinessPassed
    if (!wanPipelineClassImportPassed) {
      cleanupPrompt()
      finishWith('failed', ['wan_pipeline_class_import_failed'])
      return
    }

    const load = runSsh(
      'wan_pipeline_local_files_only_load_no_inference',
      [
        `PYTHONPATH=${REMOTE_TARGET_DEPS}`,
        `HF_HOME=${REMOTE_HF_HOME}`,
        'HF_HUB_OFFLINE=1 TRANSFORMERS_OFFLINE=1 DIFFUSERS_OFFLINE=1',
        'python3.12 -c',
        JSON.stringify(buildWanPipelineLocalLoadScript()),
      ].join(' '),
      25 * 60_000,
    )
    phaseResults.push(load)
    wanPipelineLocalLoadPassed =
      load.ok && Boolean(load.stdoutSummary?.includes('REEDITPRO_BROLL_11B_WAN_PIPELINE_LOAD_OK'))

    cleanupPrompt()

    const passed = wanPipelineLocalLoadPassed && cleanupVerified
    finishWith(passed ? 'passed' : 'failed', passed ? [] : ['wan_pipeline_local_load_failed'])
  } catch (error) {
    cleanupPrompt()
    finishWith('failed', [
      `runner_exception:${sanitize(error instanceof Error ? error.message : String(error)) ?? 'unknown'}`,
      ...(cleanupVerified ? [] : ['cleanup_not_verified_after_exception']),
    ])
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
      if (actualBytes !== entry.expectedBytes) {
        byteMismatches.push(`${entry.relativePath}:${actualBytes}`)
      }
    }

    const modelIndex = JSON.parse(
      readFileSync(path.join(CACHE_SPEC.privateCachePath, 'model_index.json'), 'utf8'),
    ) as { _class_name?: string }
    const ok =
      missingFiles.length === 0 &&
      byteMismatches.length === 0 &&
      aggregateBytes === CACHE_SPEC.aggregateBytes &&
      modelIndex._class_name === CACHE_SPEC.expectedModelIndexClassName
    return {
      id: 'local_wan_diffusers_model_cache_ready',
      ok,
      exitCode: ok ? 0 : 1,
      timedOut: false,
      stdoutSummary: ok
        ? `model_cache_files=${CACHE_SPEC.manifest.length}; aggregate_bytes=${aggregateBytes}; class=${modelIndex._class_name}`
        : `missing=${missingFiles.length}; byte_mismatches=${byteMismatches.length}; aggregate_bytes=${aggregateBytes}; class=${modelIndex._class_name ?? 'missing'}`,
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

function validateLocalWheelhouseManifest(): PhaseResult {
  if (!existsSync(WHEELHOUSE_MANIFEST)) {
    return {
      id: 'local_wheelhouse_manifest_ready',
      ok: false,
      exitCode: 1,
      timedOut: false,
      stderrSummary: 'manifest_missing',
    }
  }

  try {
    const manifest = JSON.parse(readFileSync(WHEELHOUSE_MANIFEST, 'utf8')) as JsonRecord
    const ok =
      manifest.wheelhouseComplete === true &&
      manifest.realWheelCount === EXPECTED_WHEEL_COUNT &&
      manifest.aggregateBytes === EXPECTED_WHEELHOUSE_BYTES &&
      manifest.aggregateSha256 === EXPECTED_WHEELHOUSE_SHA256
    return {
      id: 'local_wheelhouse_manifest_ready',
      ok,
      exitCode: ok ? 0 : 1,
      timedOut: false,
      stdoutSummary: ok ? 'manifest_ready_real_wheel_count_66' : 'manifest_mismatch',
    }
  } catch {
    return {
      id: 'local_wheelhouse_manifest_ready',
      ok: false,
      exitCode: 1,
      timedOut: false,
      stderrSummary: 'manifest_parse_failed',
    }
  }
}

function validatePrivateGcsWheelhouseCache() {
  const marker = runGcloud(
    'private_gcs_wheelhouse_cache_ready_marker',
    ['storage', 'cat', `${PRIVATE_GCS_WHEELHOUSE_PREFIX}/${WHEELHOUSE_CACHE_MARKER_FILE_NAME}`, '--project', PROJECT_ID],
    90_000,
    { captureRawStdout: true },
  )
  const markerDocument = parseJson<JsonRecord>(marker.rawStdout)
  const ok =
    marker.ok &&
    markerDocument?.cacheMode === 'private_gcs_wheelhouse_directory' &&
    markerDocument?.realWheelCount === EXPECTED_WHEEL_COUNT &&
    markerDocument?.aggregateBytes === EXPECTED_WHEELHOUSE_BYTES &&
    markerDocument?.aggregateSha256 === EXPECTED_WHEELHOUSE_SHA256
  return {
    ok,
    phaseResults: [
      {
        ...stripRawStdout(marker),
        ok,
        exitCode: ok ? 0 : marker.exitCode,
        stdoutSummary: ok
          ? 'private_gcs_wheelhouse_cache_ready_marker_valid'
          : 'private_gcs_wheelhouse_cache_ready_marker_missing_or_invalid',
      },
    ],
  }
}

function validatePrivateGcsModelCache() {
  const marker = runGcloud(
    'private_gcs_model_cache_ready_marker',
    ['storage', 'cat', `${PRIVATE_GCS_MODEL_CACHE_PREFIX}/${MODEL_CACHE_MARKER_FILE_NAME}`, '--project', PROJECT_ID],
    90_000,
    { captureRawStdout: true },
  )
  const markerDocument = parseJson<JsonRecord>(marker.rawStdout)
  const markerClassMatches =
    markerDocument?.expectedModelIndexClassName === undefined ||
    markerDocument?.expectedModelIndexClassName === CACHE_SPEC.expectedModelIndexClassName
  const ok =
    marker.ok &&
    markerDocument?.cacheMode === 'private_gcs_wan_diffusers_model_cache' &&
    markerDocument?.modelRepository === CACHE_SPEC.modelRepository &&
    markerDocument?.sourceCommit === CACHE_SPEC.sourceCommit &&
    markerDocument?.runtimeEssentialFileCount === CACHE_SPEC.runtimeEssentialFileCount &&
    markerDocument?.aggregateBytes === CACHE_SPEC.aggregateBytes &&
    markerClassMatches &&
    markerDocument?.modelImportRun === false &&
    markerDocument?.modelInferenceRun === false
  return {
    ok,
    phaseResults: [
      {
        ...stripRawStdout(marker),
        ok,
        exitCode: ok ? 0 : marker.exitCode,
        stdoutSummary: ok
          ? 'private_gcs_model_cache_ready_marker_valid'
          : 'private_gcs_model_cache_ready_marker_missing_or_invalid',
      },
    ],
  }
}

function uploadModelCacheToPrivateGcs(): PhaseResult[] {
  const phaseResults: PhaseResult[] = []
  for (const entry of CACHE_SPEC.manifest) {
    const sourcePath = path.join(CACHE_SPEC.privateCachePath, entry.relativePath)
    phaseResults.push(
      uploadPrivateGcsObject(
        `upload_model_cache_${entry.relativePath.replace(/[^A-Za-z0-9]+/g, '_')}`,
        sourcePath,
        `${PRIVATE_GCS_MODEL_CACHE_PREFIX}/files/${entry.relativePath}`,
        GCS_PAYLOAD_TIMEOUT_MS,
      ),
    )
  }

  const markerPath = path.join('.tmp', 'ai-video-broll-gen-11b-model-cache-ready.json')
  mkdirSync(path.dirname(markerPath), { recursive: true })
  writeFileSync(
    markerPath,
    `${JSON.stringify(
      {
        cacheMode: 'private_gcs_wan_diffusers_model_cache',
        modelRepository: CACHE_SPEC.modelRepository,
        sourceCommit: CACHE_SPEC.sourceCommit,
        runtimeEssentialFileCount: CACHE_SPEC.runtimeEssentialFileCount,
        aggregateBytes: CACHE_SPEC.aggregateBytes,
        expectedModelIndexClassName: CACHE_SPEC.expectedModelIndexClassName,
        modelImportRun: false,
        modelInferenceRun: false,
        generatedVideoCreated: false,
        generatedAssetsCreated: false,
      },
      null,
      2,
    )}\n`,
    'utf8',
  )
  phaseResults.push(
    uploadPrivateGcsObject(
      'upload_model_cache_ready_marker_to_private_gcs',
      markerPath,
      `${PRIVATE_GCS_MODEL_CACHE_PREFIX}/${MODEL_CACHE_MARKER_FILE_NAME}`,
      5 * 60_000,
    ),
  )
  return phaseResults
}

function runPrivateGcsWritePreflight() {
  const readPreflight = runPreflight()
  const blockers = [...readPreflight.blockers]
  return {
    ok: blockers.length === 0,
    blockers,
    phaseResults: readPreflight.phaseResults,
  }
}

function runPreflight() {
  const phaseResults: PhaseResult[] = []
  const blockers: string[] = []

  const iapAcceleration = validateLocalGcloudIapAcceleration()
  phaseResults.push(iapAcceleration)
  if (!iapAcceleration.ok) blockers.push('local_gcloud_iap_numpy_acceleration_missing')

  const privateGoogleAccess = runGcloud(
    'subnet_private_google_access_enabled',
    [
      'compute',
      'networks',
      'subnets',
      'describe',
      'default',
      '--project',
      PROJECT_ID,
      '--region',
      TARGET_REGION,
      '--format=value(privateIpGoogleAccess)',
    ],
    90_000,
  )
  phaseResults.push(privateGoogleAccess)
  if (!['True', 'true'].includes(String(privateGoogleAccess.stdoutSummary ?? ''))) {
    blockers.push('subnet_private_google_access_not_enabled')
  }

  const bucket = runGcloud(
    'private_gcs_payload_bucket_visible',
    [
      'storage',
      'buckets',
      'describe',
      `gs://${PRIVATE_GCS_PAYLOAD_BUCKET}`,
      '--project',
      PROJECT_ID,
      '--format=value(name)',
    ],
    90_000,
  )
  phaseResults.push(bucket)
  if (!bucket.ok) blockers.push('private_gcs_payload_bucket_not_visible')

  const commands: Array<[string, string[], (result: PhaseResult) => void]> = [
    ['gcloud_project', ['config', 'get-value', 'project'], (result) => {
      if (result.stdoutSummary !== PROJECT_ID) blockers.push('gcloud_project_mismatch')
    }],
    ['gcloud_auth_refresh_suppressed', ['auth', 'print-access-token'], (result) => {
      if (!result.ok) blockers.push('gcloud_auth_refresh_failed')
    }],
    ['zone_status', ['compute', 'zones', 'describe', TARGET_ZONE, '--project', PROJECT_ID, '--format=value(status)'], (result) => {
      if (result.stdoutSummary !== 'UP') blockers.push('target_zone_not_up')
    }],
    ['machine_type_visible', ['compute', 'machine-types', 'describe', MACHINE_TYPE, '--project', PROJECT_ID, '--zone', TARGET_ZONE, '--format=value(name)'], (result) => {
      if (result.stdoutSummary !== MACHINE_TYPE) blockers.push('machine_type_not_visible')
    }],
    ['accelerator_visible', ['compute', 'accelerator-types', 'describe', ACCELERATOR, '--project', PROJECT_ID, '--zone', TARGET_ZONE, '--format=value(name)'], (result) => {
      if (result.stdoutSummary !== ACCELERATOR) blockers.push('accelerator_not_visible')
    }],
    ['image_family_ready', ['compute', 'images', 'describe-from-family', IMAGE_FAMILY, '--project', IMAGE_PROJECT, '--format=value(name)'], (result) => {
      if (!result.ok) blockers.push('image_family_not_ready')
    }],
    ['proof_service_account_visible', ['iam', 'service-accounts', 'describe', SERVICE_ACCOUNT, '--project', PROJECT_ID, '--format=value(disabled)'], (result) => {
      if (!result.ok || result.stdoutSummary === 'True' || result.stdoutSummary === 'true') {
        blockers.push('proof_service_account_missing_or_disabled')
      }
    }],
    ['pre_existing_instance_absent', ['compute', 'instances', 'describe', PROOF_VM_NAME, '--project', PROJECT_ID, '--zone', TARGET_ZONE, '--format=value(name,status)'], (result) => {
      if (result.ok) blockers.push('pre_existing_instance_found')
    }],
    ['pre_existing_disk_absent', ['compute', 'disks', 'describe', PROOF_VM_NAME, '--project', PROJECT_ID, '--zone', TARGET_ZONE, '--format=value(name,status)'], (result) => {
      if (result.ok) blockers.push('pre_existing_disk_found')
    }],
    ['pre_existing_address_absent', ['compute', 'addresses', 'describe', PROOF_VM_NAME, '--project', PROJECT_ID, '--region', TARGET_REGION, '--format=value(name,status)'], (result) => {
      if (result.ok) blockers.push('pre_existing_address_found')
    }],
    ['pre_existing_reservation_absent', ['compute', 'reservations', 'describe', PROOF_VM_NAME, '--project', PROJECT_ID, '--zone', TARGET_ZONE, '--format=value(name,status)'], (result) => {
      if (result.ok) blockers.push('pre_existing_reservation_found')
    }],
  ]

  for (const [id, args, check] of commands) {
    const result = runGcloud(id, args, 90_000, { suppressStdout: id === 'gcloud_auth_refresh_suppressed' })
    phaseResults.push(result)
    check(result)
    if (result.timedOut) blockers.push(`${id}_timed_out`)
  }

  return {
    ok: blockers.length === 0,
    blockers: Array.from(new Set(blockers)),
    phaseResults,
  }
}

function waitForInstanceReadiness() {
  const phaseResults: PhaseResult[] = []
  const blockers: string[] = []
  let privateOnly = false
  let bootDiskAutoDelete = false
  let running = false

  for (let attempt = 1; attempt <= 12; attempt += 1) {
    const describe = describeInstanceCompact(`describe_prompt_vm_compact_attempt_${attempt}`)
    const parsed = parseJson<JsonRecord>(describe.rawStdout)
    phaseResults.push(stripRawStdout(describe))
    const readiness = readInstanceReadiness(parsed)
    running = readiness.running
    privateOnly = readiness.privateOnly
    bootDiskAutoDelete = readiness.bootDiskAutoDelete
    if (running && privateOnly && bootDiskAutoDelete) break
    sleep(10_000)
  }

  if (!running) blockers.push('instance_running_not_verified')
  if (!privateOnly) blockers.push('private_only_network_not_verified')
  if (!bootDiskAutoDelete) blockers.push('boot_disk_auto_delete_not_verified')

  return {
    ok: blockers.length === 0,
    blockers,
    phaseResults,
    privateOnly,
    bootDiskAutoDelete,
  }
}

function waitForIapLookupReadiness() {
  const phaseResults: PhaseResult[] = []
  let ok = false

  for (let attempt = 1; attempt <= 8; attempt += 1) {
    const ssh = runSsh(
      `iap_lookup_readiness_attempt_${attempt}`,
      'echo REEDITPRO_BROLL_11B_IAP_LOOKUP_READY',
      60_000,
    )
    phaseResults.push(ssh)
    ok = ssh.ok && Boolean(ssh.stdoutSummary?.includes('REEDITPRO_BROLL_11B_IAP_LOOKUP_READY'))
    if (ok) break
    sleep(10_000)
  }

  return { ok, phaseResults }
}

function waitForPython312Readiness() {
  const phaseResults: PhaseResult[] = []
  let ok = false

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const python = runSsh(`python312_readiness_check_attempt_${attempt}`, 'python3.12 --version', 90_000)
    phaseResults.push(python)
    ok = python.ok && Boolean(python.stdoutSummary?.includes('Python 3.12'))
    if (ok) break
    if (!isTransientSshTransportFailure(python)) break
    sleep(10_000)
  }

  return { ok, phaseResults }
}

function isTransientSshTransportFailure(result: PhaseResult) {
  if (result.exitCode !== 255 && !result.timedOut) return false
  const message = result.stderrSummary ?? ''
  return [
    'Connection timed out during banner exchange',
    'Failed to lookup instance',
    'Permission denied (publickey)',
    'Connection closed by UNKNOWN port 65535',
  ].some((marker) => message.includes(marker))
}

function describeInstanceCompact(id = 'describe_prompt_vm_compact_raw_json') {
  return runGcloud(
    id,
    [
      'compute',
      'instances',
      'describe',
      PROOF_VM_NAME,
      '--project',
      PROJECT_ID,
      '--zone',
      TARGET_ZONE,
      '--format=json(status,networkInterfaces,disks)',
    ],
    90_000,
    { captureRawStdout: true },
  )
}

function cleanupPromptResources() {
  const phaseResults: PhaseResult[] = []
  const deleteResult = runGcloud(
    'delete_prompt_scoped_l4_vm_exact_name',
    [
      'compute',
      'instances',
      'delete',
      PROOF_VM_NAME,
      '--project',
      PROJECT_ID,
      '--zone',
      TARGET_ZONE,
      '--quiet',
    ],
    10 * 60_000,
  )
  phaseResults.push(deleteResult)

  const verifyCommands: Array<[string, string[]]> = [
    ['verify_prompt_instance_absent_exact_name', ['compute', 'instances', 'describe', PROOF_VM_NAME, '--project', PROJECT_ID, '--zone', TARGET_ZONE, '--format=value(name,status)']],
    ['verify_prompt_disk_absent_exact_name', ['compute', 'disks', 'describe', PROOF_VM_NAME, '--project', PROJECT_ID, '--zone', TARGET_ZONE, '--format=value(name,status)']],
    ['verify_prompt_address_absent_exact_name', ['compute', 'addresses', 'describe', PROOF_VM_NAME, '--project', PROJECT_ID, '--region', TARGET_REGION, '--format=value(name,status)']],
    ['verify_prompt_reservation_absent_exact_name', ['compute', 'reservations', 'describe', PROOF_VM_NAME, '--project', PROJECT_ID, '--zone', TARGET_ZONE, '--format=value(name,status)']],
  ]

  let cleanupVerified = true
  for (const [id, args] of verifyCommands) {
    const result = runGcloud(id, args, 90_000)
    phaseResults.push(result)
    if (result.ok || result.timedOut) cleanupVerified = false
  }

  return { phaseResults, cleanupVerified }
}

function runSsh(id: string, command: string, timeoutMs: number) {
  return runGcloud(
    id,
    [
      'compute',
      'ssh',
      PROOF_VM_NAME,
      '--project',
      PROJECT_ID,
      '--zone',
      TARGET_ZONE,
      '--tunnel-through-iap',
      '--quiet',
      '--ssh-flag=-o ConnectTimeout=20',
      '--ssh-flag=-o BatchMode=yes',
      '--ssh-flag=-o StrictHostKeyChecking=no',
      '--command',
      command,
    ],
    timeoutMs,
  )
}

function runGcloud(
  id: string,
  args: string[],
  timeoutMs: number,
  options: { suppressStdout?: boolean; captureRawStdout?: boolean } = {},
): PhaseResult & { rawStdout?: string } {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      GCLOUD_TIMEOUT_RUNNER_SCRIPT,
      String(timeoutMs),
      JSON.stringify(args),
      options.suppressStdout ? '1' : '0',
    ],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        CLOUDSDK_CORE_DISABLE_PROMPTS: '1',
        CLOUDSDK_PYTHON_SITEPACKAGES: '1',
        ...gcloudAccountEnv(),
      },
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 18,
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: timeoutMs + 30_000,
    },
  )

  let payload:
    | {
        status: number | null
        signal: string | null
        timedOut: boolean
        stdout?: string
        stderr?: string
      }
    | undefined
  try {
    payload = JSON.parse(String(result.stdout ?? '')) as typeof payload
  } catch {
    payload = undefined
  }

  if (!payload) {
    const stderr = [String(result.stderr ?? ''), String(result.error?.message ?? '')]
      .filter(Boolean)
      .join('\n')
    return {
      id,
      ok: false,
      exitCode: result.status,
      timedOut: Boolean(result.error && result.error.message.includes('ETIMEDOUT')),
      stdoutSummary: undefined,
      stderrSummary: sanitize(stderr || 'gcloud_timeout_wrapper_failed_without_json'),
    }
  }

  const rawStdout = options.suppressStdout ? undefined : String(payload.stdout ?? '')

  return {
    id,
    ok: payload.status === 0 && !payload.timedOut,
    exitCode: payload.status,
    timedOut: Boolean(payload.timedOut),
    stdoutSummary: options.suppressStdout ? undefined : sanitize(rawStdout),
    stderrSummary: sanitize(String(payload.stderr ?? '')),
    rawStdout: options.captureRawStdout ? rawStdout : undefined,
  }
}

function validateLocalGcloudIapAcceleration(): PhaseResult {
  const info = spawnSync('gcloud', ['info', '--format=value(basic.python_location)'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      CLOUDSDK_CORE_DISABLE_PROMPTS: '1',
      CLOUDSDK_PYTHON_SITEPACKAGES: '1',
      ...gcloudAccountEnv(),
    },
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 90_000,
  })
  if (info.status !== 0) {
    return {
      id: 'local_gcloud_iap_numpy_acceleration_ready',
      ok: false,
      exitCode: info.status,
      timedOut: Boolean(info.error && info.error.message.includes('ETIMEDOUT')),
      stderrSummary: sanitize(String(info.stderr ?? info.error?.message ?? 'gcloud_python_location_failed')),
    }
  }

  const pythonLocation = String(info.stdout ?? '').trim()
  if (!pythonLocation) {
    return {
      id: 'local_gcloud_iap_numpy_acceleration_ready',
      ok: false,
      exitCode: 1,
      timedOut: false,
      stderrSummary: 'gcloud_python_location_missing',
    }
  }

  const numpy = spawnSync(
    pythonLocation,
    ['-c', "import numpy; print('REEDITPRO_BROLL_11B_GCLOUD_IAP_NUMPY_READY')"],
    {
      cwd: process.cwd(),
      env: process.env,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 90_000,
    },
  )
  const ok =
    numpy.status === 0 &&
    String(numpy.stdout ?? '').includes('REEDITPRO_BROLL_11B_GCLOUD_IAP_NUMPY_READY')
  return {
    id: 'local_gcloud_iap_numpy_acceleration_ready',
    ok,
    exitCode: numpy.status,
    timedOut: Boolean(numpy.error && numpy.error.message.includes('ETIMEDOUT')),
    stdoutSummary: ok ? `gcloud_python=${sanitize(pythonLocation)}; numpy_import_ok` : sanitize(String(numpy.stdout ?? '')),
    stderrSummary: ok ? undefined : sanitize(String(numpy.stderr ?? numpy.error?.message ?? 'numpy_import_failed')),
  }
}

function uploadPrivateGcsObject(id: string, sourcePath: string, destinationUri: string, timeoutMs: number) {
  return runGcloud(
    id,
    [
      'storage',
      'cp',
      sourcePath,
      destinationUri,
      '--project',
      PROJECT_ID,
      '--no-clobber',
    ],
    timeoutMs,
  )
}

function buildRemoteWheelhouseDownloadScript() {
  const fileNames = getWheelhouseCacheFileNames()
  return buildRemoteExactGcsDownloadScript({
    fileNames,
    sourcePrefix: `${privateGcsObjectPrefix(PRIVATE_GCS_WHEELHOUSE_PREFIX)}/${path.basename(WHEELHOUSE_PATH)}`,
    targetPath: REMOTE_WHEELHOUSE,
    successMarker: 'REEDITPRO_BROLL_11B_PRIVATE_GCS_WHEELHOUSE_EXACT_DOWNLOAD_OK',
  })
}

function buildRemoteModelCacheDownloadScript() {
  const fileNames = CACHE_SPEC.manifest.map((entry) => entry.relativePath)
  return buildRemoteExactGcsDownloadScript({
    fileNames,
    sourcePrefix: `${privateGcsObjectPrefix(PRIVATE_GCS_MODEL_CACHE_PREFIX)}/files`,
    fallbackSourcePrefix: privateGcsObjectPrefix(PRIVATE_GCS_MODEL_CACHE_PREFIX),
    targetPath: REMOTE_MODEL_CACHE,
    successMarker: 'REEDITPRO_BROLL_11B_PRIVATE_GCS_MODEL_CACHE_EXACT_DOWNLOAD_OK',
  })
}

function privateGcsObjectPrefix(gcsUri: string) {
  const expectedPrefix = `gs://${PRIVATE_GCS_PAYLOAD_BUCKET}/`
  if (!gcsUri.startsWith(expectedPrefix)) {
    throw new Error(`unexpected_private_gcs_prefix:${gcsUri.replace(/^gs:\/\/[^/]+/i, 'gs://redacted_bucket')}`)
  }
  return gcsUri.slice(expectedPrefix.length)
}

function buildRemoteExactGcsDownloadScript(options: {
  fileNames: string[]
  sourcePrefix: string
  fallbackSourcePrefix?: string
  targetPath: string
  successMarker: string
}) {
  const sourcePrefixes = [
    options.sourcePrefix,
    ...(options.fallbackSourcePrefix && options.fallbackSourcePrefix !== options.sourcePrefix
      ? [options.fallbackSourcePrefix]
      : []),
  ]
  const scriptBody = [
    'import pathlib, shutil, subprocess, urllib.error, urllib.parse, urllib.request',
    `files = ${JSON.stringify(options.fileNames)}`,
    `bucket = ${JSON.stringify(PRIVATE_GCS_PAYLOAD_BUCKET)}`,
    `source_prefixes = ${JSON.stringify(sourcePrefixes)}`,
    `target = pathlib.Path(${JSON.stringify(options.targetPath)})`,
    'target.mkdir(parents=True, exist_ok=True)',
    "token = subprocess.check_output(['gcloud', 'auth', 'print-access-token'], text=True).strip()",
    "host = 'https://' + 'storage.googleapis.com'",
    "for file_name in files:\n    output_path = target / file_name\n    output_path.parent.mkdir(parents=True, exist_ok=True)\n    last_http_error = None\n    for source_prefix in source_prefixes:\n        object_name = f'{source_prefix}/{file_name}'\n        encoded_object = urllib.parse.quote(object_name, safe='/')\n        request = urllib.request.Request(f'{host}/{bucket}/{encoded_object}', headers={'Authorization': f'Bearer {token}'})\n        try:\n            with urllib.request.urlopen(request, timeout=300) as response, open(output_path, 'wb') as handle:\n                shutil.copyfileobj(response, handle, length=16 * 1024 * 1024)\n            last_http_error = None\n            break\n        except urllib.error.HTTPError as error:\n            last_http_error = error\n            if error.code == 404 and source_prefix != source_prefixes[-1]:\n                continue\n            print(f'REEDITPRO_BROLL_11B_GCS_EXACT_DOWNLOAD_FAILED file={file_name} code={error.code}')\n            raise\n    if last_http_error is not None:\n        raise last_http_error",
    `print(${JSON.stringify(options.successMarker)})`,
  ].join('\n')

  return `exec(${JSON.stringify(scriptBody)})`
}

function buildRemoteModelCacheValidationScript() {
  const scriptBody = [
    'import json, pathlib',
    `root = pathlib.Path(${JSON.stringify(REMOTE_MODEL_CACHE)})`,
    `manifest = ${JSON.stringify(CACHE_SPEC.manifest)}`,
    'missing = []',
    'byte_mismatches = []',
    'total = 0',
    "for item in manifest:\n    p = root / item['relativePath']\n    if not p.exists():\n        missing.append(item['relativePath'])\n        continue\n    size = p.stat().st_size\n    total += size\n    if size != item['expectedBytes']:\n        byte_mismatches.append([item['relativePath'], size])",
    `assert not missing, missing`,
    `assert not byte_mismatches, byte_mismatches`,
    `assert total == ${CACHE_SPEC.aggregateBytes}, total`,
    "model_index = json.load(open(root / 'model_index.json'))",
    `assert model_index.get('_class_name') == ${JSON.stringify(CACHE_SPEC.expectedModelIndexClassName)}, model_index.get('_class_name')`,
    "print('REEDITPRO_BROLL_11B_REMOTE_MODEL_CACHE_READY')",
  ].join('\n')

  return `exec(${JSON.stringify(scriptBody)})`
}

function buildWanPipelineLocalLoadScript() {
  const scriptBody = [
    'import gc, json, os, pathlib',
    "os.environ['HF_HUB_OFFLINE'] = '1'",
    "os.environ['TRANSFORMERS_OFFLINE'] = '1'",
    "os.environ['DIFFUSERS_OFFLINE'] = '1'",
    'import torch',
    'from diffusers import WanPipeline',
    `model_path = pathlib.Path(${JSON.stringify(REMOTE_MODEL_CACHE)})`,
    "model_index = json.load(open(model_path / 'model_index.json'))",
    `assert model_index.get('_class_name') == ${JSON.stringify(CACHE_SPEC.expectedModelIndexClassName)}, model_index.get('_class_name')`,
    "pipe = WanPipeline.from_pretrained(str(model_path), torch_dtype=torch.bfloat16, local_files_only=True, low_cpu_mem_usage=True)",
    "assert pipe.__class__.__name__ == 'WanPipeline', pipe.__class__.__name__",
    'del pipe',
    'gc.collect()',
    'torch.cuda.empty_cache() if torch.cuda.is_available() else None',
    "print('REEDITPRO_BROLL_11B_WAN_PIPELINE_LOAD_OK')",
  ].join('\n')

  return `exec(${JSON.stringify(scriptBody)})`
}

function getWheelhouseCacheFileNames() {
  return readdirSync(WHEELHOUSE_PATH)
    .filter((fileName) => statSync(path.join(WHEELHOUSE_PATH, fileName)).isFile())
    .sort((left, right) => left.localeCompare(right))
}

function baseSummary(summaryPath: string, status: RunnerSummary['status']): RunnerSummary {
  return {
    ok: status === 'passed',
    mode: 'ai_video_broll_gen_11b_l4_model_import_runner_result',
    status,
    decision:
      status === 'passed'
        ? 'ai_video_broll_gen_11b_l4_model_import_proof_passed_cleanup_verified_no_inference'
        : 'ai_video_broll_gen_11b_l4_model_import_proof_planned_or_blocked',
    summaryPath,
    nextPrompt: status === 'passed' ? NEXT_PROMPT_IF_PASSED : NEXT_PROMPT_IF_FAILED,
    accountSelection: accountSelectionOutput(),
    blockers: [],
    phaseResults: [],
    preflightPassed: false,
    localModelCacheValidated: false,
    privateGcsWheelhouseReady: false,
    privateGcsModelCacheReady: false,
    privateGcsModelCacheStaged: false,
    computeVmCreateAttempted: false,
    computeVmCreated: false,
    postCreatePrivateOnlyVerified: false,
    bootDiskAutoDeleteVerified: false,
    iapLookupReadinessPassed: false,
    python312ReadinessPassed: false,
    privateGcsPayloadDownloaded: false,
    wheelhousePayloadTransferred: false,
    modelCachePayloadTransferred: false,
    remoteModelCacheValidated: false,
    offlineDependencyInstallPassed: false,
    dependencyImportReadinessPassed: false,
    wanPipelineClassImportPassed: false,
    wanPipelineLocalLoadPassed: false,
    cleanupAttempted: false,
    cleanupVerified: false,
    runtimeSideEffects: runtimeSideEffects({
      computeVmCreateAttempted: false,
      computeVmCreated: false,
      cleanupAttempted: false,
      cleanupVerified: false,
    }),
  }
}

function runtimeSideEffects(overrides: {
  computeVmCreateAttempted: boolean
  computeVmCreated: boolean
  cleanupAttempted: boolean
  cleanupVerified: boolean
  gcpReadOnlyCommandsExecuted?: boolean
  sshSessionOpened?: boolean
  privateGcsModelCacheStaged?: boolean
  privateGcsPayloadDownloaded?: boolean
  wheelhousePayloadTransferred?: boolean
  modelCachePayloadTransferred?: boolean
  remoteModelCacheValidationRun?: boolean
  dependencyInstalledOnVm?: boolean
  dependencyImportReadinessRun?: boolean
  modelImportRun?: boolean
  modelLoadRun?: boolean
}): JsonRecord {
  return {
    gcpReadOnlyCommandsExecuted: overrides.gcpReadOnlyCommandsExecuted ?? true,
    gcpMutatingCommandsExecuted:
      overrides.computeVmCreateAttempted ||
      overrides.cleanupAttempted ||
      (overrides.privateGcsModelCacheStaged ?? false),
    computeVmCreateAttempted: overrides.computeVmCreateAttempted,
    computeVmCreated: overrides.computeVmCreated,
    computeVmDeleted: overrides.cleanupAttempted,
    diskCreated: overrides.computeVmCreated,
    bootDiskCreatedWithVm: overrides.computeVmCreated,
    bootDiskAutoDeleted: overrides.cleanupVerified,
    cleanupRun: overrides.cleanupAttempted,
    cleanupVerified: overrides.cleanupVerified,
    publicIpCreated: false,
    staticAddressCreated: false,
    reservationCreated: false,
    privateGcsModelCacheStaged: overrides.privateGcsModelCacheStaged ?? false,
    privateGcsPayloadDownloaded: overrides.privateGcsPayloadDownloaded ?? false,
    fullWheelhousePayloadTransferred: overrides.wheelhousePayloadTransferred ?? false,
    modelCachePayloadTransferred: overrides.modelCachePayloadTransferred ?? false,
    remoteModelCacheValidationRun: overrides.remoteModelCacheValidationRun ?? false,
    sshSessionOpened: overrides.sshSessionOpened ?? false,
    dependencyInstalledOnVm: overrides.dependencyInstalledOnVm ?? false,
    dependencyImportReadinessRun: overrides.dependencyImportReadinessRun ?? false,
    dockerRun: false,
    modelDownloaded: false,
    modelImportRun: overrides.modelImportRun ?? false,
    modelLoadRun: overrides.modelLoadRun ?? false,
    modelInferenceRun: false,
    promptEncodingRun: false,
    denoisingRun: false,
    vaeDecodeRun: false,
    frameCreationRun: false,
    videoEncodingRun: false,
    ffmpegRun: false,
    generatedVideoCreated: false,
    generatedAssetsCreated: false,
    providerCallsMade: false,
    workersDispatched: false,
    supabaseTouched: false,
    sqlExecuted: false,
    storageObjectsCreated: overrides.privateGcsModelCacheStaged ?? false,
    signedUrlsCreated: false,
    publicArtifactsCreated: false,
    creditMutationCreated: false,
    betaUnlocked: false,
    productionUnlocked: false,
    dryRunPassedClaimed: false,
    generatedLocalFixturePassedClaimed: false,
  }
}

function readInstanceReadiness(document: JsonRecord | undefined) {
  const interfaces = Array.isArray(document?.networkInterfaces) ? document.networkInterfaces : []
  const disks = Array.isArray(document?.disks) ? document.disks : []
  const hasNat = interfaces.some((networkInterface) => {
    const accessConfigs = asArray(asRecord(networkInterface).accessConfigs)
    return accessConfigs.some((accessConfig) => typeof asRecord(accessConfig).natIP === 'string')
  })
  const bootDiskAutoDelete = disks.some((disk) => asRecord(disk).boot === true && asRecord(disk).autoDelete === true)
  return {
    running: document?.status === 'RUNNING',
    privateOnly: interfaces.length > 0 && !hasNat,
    bootDiskAutoDelete,
  }
}

function accountSelectionOutput() {
  const selection = resolveAccountSelection()
  return {
    overrideIndexEnv: GCLOUD_ACCOUNT_OVERRIDE_INDEX_ENV,
    overrideIndexCliFlag: GCLOUD_ACCOUNT_OVERRIDE_INDEX_CLI_FLAG,
    overrideIndexCliFlagAlias: GCLOUD_ACCOUNT_OVERRIDE_INDEX_CLI_FLAG_ALIAS,
    overrideIndexProvided: selection.overrideIndexProvided,
    overrideIndexSource: selection.overrideIndexSource,
    overrideIndex: selection.overrideIndex,
    overrideResolved: selection.overrideResolved,
    overrideResolutionFailure: selection.resolutionFailure,
    mutatesLocalGcloudConfig: false,
  }
}

function gcloudAccountEnv(): Record<string, string> {
  const selection = resolveAccountSelection()
  return {
    ...(selection.account ? { CLOUDSDK_CORE_ACCOUNT: selection.account } : {}),
    ...(selection.overrideIndex ? { [GCLOUD_ACCOUNT_OVERRIDE_INDEX_ENV]: String(selection.overrideIndex) } : {}),
  }
}

function resolveAccountSelection(): GcloudAccountSelection {
  if (cachedGcloudAccountSelection) return cachedGcloudAccountSelection

  const cliIndex = getArgValue(GCLOUD_ACCOUNT_OVERRIDE_INDEX_CLI_FLAG) ?? getArgValue(GCLOUD_ACCOUNT_OVERRIDE_INDEX_CLI_FLAG_ALIAS)
  const envIndex = process.env[GCLOUD_ACCOUNT_OVERRIDE_INDEX_ENV]?.trim()
  const rawIndex = cliIndex ?? envIndex
  const indexSource = cliIndex ? 'cli' : envIndex ? 'env' : undefined
  if (!rawIndex) {
    cachedGcloudAccountSelection = {
      overrideIndexProvided: false,
      overrideResolved: false,
    }
    return cachedGcloudAccountSelection
  }

  const accountIndex = Number(rawIndex)
  if (!Number.isInteger(accountIndex) || accountIndex < 1) {
    cachedGcloudAccountSelection = {
      overrideIndexProvided: true,
      overrideIndexSource: indexSource,
      overrideIndex: Number.isFinite(accountIndex) ? accountIndex : undefined,
      overrideResolved: false,
      resolutionFailure: 'invalid_account_index',
    }
    return cachedGcloudAccountSelection
  }

  const result = spawnSync('gcloud', ['auth', 'list', '--format=json'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      CLOUDSDK_CORE_DISABLE_PROMPTS: '1',
    },
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 90_000,
  })

  if (result.status !== 0) {
    cachedGcloudAccountSelection = {
      overrideIndexProvided: true,
      overrideIndexSource: indexSource,
      overrideIndex: accountIndex,
      overrideResolved: false,
      resolutionFailure: 'auth_list_failed',
    }
    return cachedGcloudAccountSelection
  }

  const accounts = parseJson<Array<{ account?: string }>>(String(result.stdout ?? '')) ?? []
  const account = accounts[accountIndex - 1]?.account?.trim()
  cachedGcloudAccountSelection = {
    account,
    overrideIndexProvided: true,
    overrideIndexSource: indexSource,
    overrideIndex: accountIndex,
    overrideResolved: Boolean(account),
    resolutionFailure: account ? undefined : 'account_index_not_found',
  }
  return cachedGcloudAccountSelection
}

function parseJson<T>(raw: string | undefined): T | undefined {
  if (!raw) return undefined
  try {
    return JSON.parse(raw) as T
  } catch {
    return undefined
  }
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {}
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function writeDurableSummary(summaryPath: string, summary: RunnerSummary) {
  mkdirSync(path.dirname(summaryPath), { recursive: true })
  writeFileSync(summaryPath, `${JSON.stringify(sanitizeSummaryForOutput(summary), null, 2)}\n`, 'utf8')
}

function sleep(ms: number) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

function sanitize(value: string | undefined): string | undefined {
  if (!value) return undefined
  const sanitized = value
    .replace(/\bhttps?:\/\/\S+/gi, 'redacted_url')
    .replace(/\bgs:\/\/\S+/gi, 'redacted_gcs_uri')
    .replace(/\bya29\.[A-Za-z0-9._-]+/g, 'redacted_access_token')
    .replace(/\bBearer\s+\S+/gi, 'Bearer redacted')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, 'redacted_email')
    .replace(/\bssh-(rsa|ed25519)\s+[A-Za-z0-9+/=]{40,}/gi, 'redacted_ssh_public_key')
    .replace(new RegExp(SERVICE_ACCOUNT.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), 'redacted_service_account')
    .trim()

  return sanitized ? sanitized.slice(0, 1600) : undefined
}

function stripRawStdout<T extends PhaseResult & { rawStdout?: string }>(phaseResult: T): PhaseResult {
  const safeResult = { ...phaseResult }
  delete safeResult.rawStdout
  return safeResult
}

function sanitizeSummaryForOutput(summary: RunnerSummary): RunnerSummary {
  return {
    ...summary,
    phaseResults: summary.phaseResults.map((phaseResult) => stripRawStdout(phaseResult)),
  }
}

function getArgValue(flag: string): string | undefined {
  const inlineValue = process.argv.find((arg) => arg.startsWith(`${flag}=`))
  if (inlineValue) return inlineValue.slice(flag.length + 1)

  const index = process.argv.indexOf(flag)
  if (index < 0) return undefined
  return process.argv[index + 1]
}

function print(value: unknown) {
  console.log(JSON.stringify(value, null, 2))
}

main()
