import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
  writeSync,
} from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'

import { AI_VIDEO_BROLL_GEN_10Y_L4_PAYLOAD_INSTALL_RUNNER_CONTRACT } from './ai-video-broll-gen-10y-l4-payload-install-runner-contract'

type JsonRecord = Record<string, unknown>

type PhaseResult = {
  id: string
  ok: boolean
  exitCode: number | null
  timedOut: boolean
  stdoutSummary?: string
  stderrSummary?: string
}

type PayloadChunk = {
  index: number
  fileName: string
  path: string
  bytes: number
  sha256: string
}

type PayloadPackage = {
  packageRoot: string
  archivePath: string
  archiveSha256Path: string
  chunkManifestPath: string
  archiveBytes: number
  archiveSha256: string
  chunks: PayloadChunk[]
}

type RunnerSummary = {
  ok: boolean
  mode: string
  status: 'planned' | 'blocked' | 'passed' | 'failed'
  decision: string
  summaryPath: string
  nextPrompt: string
  blockers: string[]
  phaseResults: PhaseResult[]
  preflightPassed: boolean
  computeVmCreateAttempted: boolean
  computeVmCreated: boolean
  postCreatePrivateOnlyVerified: boolean
  bootDiskAutoDeleteVerified: boolean
  iapLookupReadinessPassed: boolean
  python312ReadinessPassed: boolean
  localPayloadPackagePrepared: boolean
  localArchiveCreated: boolean
  localArchiveSha256Verified: boolean
  localChunkManifestCreated: boolean
  privateGcsPayloadStaged: boolean
  privateGcsPayloadCleanupAttempted: boolean
  privateGcsPayloadCleanupVerified: boolean
  privateGcsPayloadDownloaded: boolean
  wheelhousePayloadTransferred: boolean
  remoteArchiveSha256Verified: boolean
  remoteArchiveExtracted: boolean
  remoteManifestValidationPassed: boolean
  offlineDependencyInstallPassed: boolean
  dependencyImportReadinessPassed: boolean
  cleanupAttempted: boolean
  cleanupVerified: boolean
  runtimeSideEffects: JsonRecord
}

const CONTRACT = AI_VIDEO_BROLL_GEN_10Y_L4_PAYLOAD_INSTALL_RUNNER_CONTRACT
const CONFIRM_ENV = 'REEDITPRO_CONFIRM_BROLL_10ZB_L4_PAYLOAD_INSTALL_RETRY'
const DEFAULT_SUMMARY_PATH = path.join(
  '.tmp',
  'ai-video-broll-gen-10zb-l4-payload-install-retry-summary.json',
)
const DEFAULT_PAYLOAD_PACKAGE_ROOT = path.join('.tmp', 'ai-video-broll-gen-10zb-payload')
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
const REQUIREMENTS_PATH = 'server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt'
const REMOTE_ROOT = '/tmp/reeditpro-broll-10zb'
const REMOTE_WHEELHOUSE = `${REMOTE_ROOT}/python312-linux-x86_64`
const REMOTE_TARGET_DEPS = `${REMOTE_ROOT}/target-deps`
const ARCHIVE_FILE_NAME = 'wan-l4-python312-wheelhouse.tar.gz'
const ARCHIVE_SHA256_FILE_NAME = 'wan-l4-python312-wheelhouse.sha256'
const CHUNK_MANIFEST_FILE_NAME = 'wan-l4-python312-wheelhouse.chunks.sha256.json'
const CHUNK_PREFIX = 'wan-l4-python312-wheelhouse.tar.gz.part-'
const CHUNK_SIZE_BYTES = 128 * 1024 * 1024
const PRIVATE_GCS_PAYLOAD_BUCKET = 'reeditpro-staging-reeditpro-model-cache'
const PRIVATE_GCS_PAYLOAD_PREFIX_ROOT = 'proof-payloads/ai-video-broll/10zb/wheelhouse-by-sha256'
const PRIVATE_GCS_PAYLOAD_TIMEOUT_MS = 60 * 60_000
const WHEELHOUSE_CACHE_MARKER_FILE_NAME = 'wheelhouse-cache-ready.json'
const EXPECTED_WHEEL_COUNT = 66
const EXPECTED_WHEELHOUSE_BYTES = 2802483442
const EXPECTED_WHEELHOUSE_SHA256 = '55ab4ba840e664996b29ee684591a500568bbb9ade332d2b48f05af8e79eab64'
const NEXT_PROMPT_IF_PASSED =
  'AI-VIDEO-BROLL-GEN-11A-MODEL-IMPORT-PLAN: plan Wan model import proof after payload/install readiness, no inference'
const NEXT_PROMPT_IF_FAILED =
  'AI-VIDEO-BROLL-GEN-10ZC-FIX-FIXED-DELIVERY-RETRY-FAILURE: fix the failing phase from the fixed-delivery payload/install retry, no model import/no inference'
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

if (child.stdout) {
  child.stdout.on('data', (chunk) => {
    stdout = append(stdout, chunk);
  });
}

if (child.stderr) {
  child.stderr.on('data', (chunk) => {
    stderr = append(stderr, chunk);
  });
}

function killChild(signal) {
  if (!child.pid) return;
  try {
    process.kill(process.platform === 'win32' ? child.pid : -child.pid, signal);
  } catch {
    try {
      child.kill(signal);
    } catch {}
  }
}

for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.once(signal, () => {
    timedOut = true;
    killChild(signal);
    setTimeout(() => {
      killChild('SIGKILL');
      emit({
        status: null,
        signal,
        timedOut,
        stdout,
        stderr: stderr || 'gcloud_timeout_wrapper_interrupted',
      });
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
  emit({
    status: null,
    signal: null,
    timedOut,
    stdout,
    stderr: stderr || String(error && error.message ? error.message : error),
  });
});

child.on('close', (status, signal) => {
  clearTimeout(timeout);
  emit({
    status,
    signal,
    timedOut,
    stdout,
    stderr,
  });
});
`

function main() {
  const execute = process.argv.includes('--execute')
  const preflightOnly = process.argv.includes('--preflight-only')
  const cacheFillOnly = process.argv.includes('--cache-fill-only')
  const preparePayloadOnly = process.argv.includes('--prepare-payload-only')
  const summaryPath = getArgValue('--summary-path') ?? DEFAULT_SUMMARY_PATH
  const payloadPackageRoot = getArgValue('--payload-package-root') ?? DEFAULT_PAYLOAD_PACKAGE_ROOT

  if (preparePayloadOnly) {
    const phaseResults: PhaseResult[] = []
    const localManifest = validateLocalWheelhouseManifest()
    phaseResults.push(localManifest)
    const localRequirements = validateLocalRequirementsManifest()
    phaseResults.push(localRequirements)

    if (!localManifest.ok || !localRequirements.ok) {
      const summary = {
        ...baseSummary(summaryPath, 'blocked'),
        mode: 'ai_video_broll_gen_10zb_l4_payload_install_runner_payload_package_preflight_blocked',
        decision: 'ai_video_broll_gen_10zb_payload_package_preflight_blocked_no_gcp_commands',
        blockers: [
          ...(localManifest.ok ? [] : ['local_wheelhouse_manifest_not_ready']),
          ...(localRequirements.ok ? [] : ['local_requirements_manifest_missing']),
        ],
        phaseResults,
        runtimeSideEffects: runtimeSideEffects({
          computeVmCreateAttempted: false,
          computeVmCreated: false,
          cleanupAttempted: false,
          cleanupVerified: false,
          gcpReadOnlyCommandsExecuted: false,
        }),
      }
      writeDurableSummary(summaryPath, summary)
      print(summary)
      return
    }

    const payloadPackage = preparePayloadPackage(payloadPackageRoot)
    phaseResults.push({
      id: 'local_archive_chunk_payload_package_ready',
      ok: true,
      exitCode: 0,
      timedOut: false,
      stdoutSummary: `archive_bytes=${payloadPackage.archiveBytes}; chunks=${payloadPackage.chunks.length}`,
    })
    const summary = {
      ...baseSummary(summaryPath, 'passed'),
      mode: 'ai_video_broll_gen_10zb_l4_payload_install_runner_payload_package_ready_no_gcp_commands',
      decision: 'ai_video_broll_gen_10zb_payload_package_ready_no_gcp_commands',
      nextPrompt:
        'AI-VIDEO-BROLL-GEN-10ZB-NO-IDLE-L4-PAYLOAD-INSTALL-RETRY-WITH-FIXED-DELIVERY: retry bounded L4 payload/install readiness with fixed payload delivery, no model import/no inference',
      phaseResults,
      localPayloadPackagePrepared: true,
      localArchiveCreated: true,
      localArchiveSha256Verified: true,
      localChunkManifestCreated: true,
      runtimeSideEffects: runtimeSideEffects({
        computeVmCreateAttempted: false,
        computeVmCreated: false,
        cleanupAttempted: false,
        cleanupVerified: false,
        gcpReadOnlyCommandsExecuted: false,
        localArchiveCreated: true,
        localArchiveChunksCreated: true,
      }),
    }
    writeDurableSummary(summaryPath, summary)
    print(summary)
    return
  }

  if (preflightOnly) {
    const phaseResults: PhaseResult[] = []
    const localManifest = validateLocalWheelhouseManifest()
    phaseResults.push(localManifest)
    const localRequirements = validateLocalRequirementsManifest()
    phaseResults.push(localRequirements)

    if (!localManifest.ok || !localRequirements.ok) {
      const summary = {
        ...baseSummary(summaryPath, 'blocked'),
        mode: 'ai_video_broll_gen_10zb_l4_payload_install_runner_read_only_preflight_blocked',
        decision: 'ai_video_broll_gen_10zb_read_only_preflight_blocked_no_vm_created',
        blockers: [
          ...(localManifest.ok ? [] : ['local_wheelhouse_manifest_not_ready']),
          ...(localRequirements.ok ? [] : ['local_requirements_manifest_missing']),
        ],
        phaseResults,
        runtimeSideEffects: runtimeSideEffects({
          computeVmCreateAttempted: false,
          computeVmCreated: false,
          cleanupAttempted: false,
          cleanupVerified: false,
          gcpReadOnlyCommandsExecuted: false,
        }),
      }
      writeDurableSummary(summaryPath, summary)
      print(summary)
      return
    }

    prepareWheelhouseCachePackage(payloadPackageRoot)
    phaseResults.push({
      id: 'local_wheelhouse_cache_payload_package_ready',
      ok: true,
      exitCode: 0,
      timedOut: false,
      stdoutSummary: `wheelhouse_bytes=${EXPECTED_WHEELHOUSE_BYTES}; wheel_count=${EXPECTED_WHEEL_COUNT}`,
    })
    const preflight = runPreflight()
    phaseResults.push(...preflight.phaseResults)
    const status = preflight.ok ? 'passed' : 'blocked'
    const summary = {
      ...baseSummary(summaryPath, status),
      mode: 'ai_video_broll_gen_10zb_l4_payload_install_runner_read_only_preflight_only',
      decision: preflight.ok
        ? 'ai_video_broll_gen_10zb_read_only_preflight_passed_vm_create_still_not_attempted'
        : 'ai_video_broll_gen_10zb_read_only_preflight_blocked_no_vm_created',
      nextPrompt:
        'AI-VIDEO-BROLL-GEN-10ZB-NO-IDLE-L4-PAYLOAD-INSTALL-RETRY-WITH-FIXED-DELIVERY: run the bounded L4 payload/install readiness retry after read-only preflight, no model import/no inference',
      blockers: preflight.blockers,
      phaseResults,
      preflightPassed: preflight.ok,
      localPayloadPackagePrepared: true,
      localArchiveCreated: false,
      localArchiveSha256Verified: false,
      localChunkManifestCreated: false,
      runtimeSideEffects: runtimeSideEffects({
        computeVmCreateAttempted: false,
        computeVmCreated: false,
        cleanupAttempted: false,
        cleanupVerified: false,
        gcpReadOnlyCommandsExecuted: true,
        localArchiveCreated: false,
        localArchiveChunksCreated: false,
      }),
    }
    writeDurableSummary(summaryPath, summary)
    print(summary)
    return
  }

  if (!execute) {
    if (cacheFillOnly) {
      const summary = baseSummary(summaryPath, 'blocked')
      summary.mode = 'ai_video_broll_gen_10zb_l4_payload_install_runner_cache_fill_confirmation_blocked'
      summary.decision = 'ai_video_broll_gen_10zb_private_gcs_cache_fill_requires_execute_confirmation'
      summary.blockers = [`confirmation_env_required:${CONFIRM_ENV}=true`]
      print(summary)
      return
    }
    const summary = baseSummary(summaryPath, 'planned')
    summary.mode = 'ai_video_broll_gen_10zb_l4_payload_install_runner_plan'
    summary.decision = 'ai_video_broll_gen_10zb_l4_payload_install_runner_static_plan_only_no_gcp_commands'
    summary.nextPrompt =
      'AI-VIDEO-BROLL-GEN-10ZB-NO-IDLE-L4-PAYLOAD-INSTALL-RETRY-WITH-FIXED-DELIVERY: retry bounded L4 payload/install readiness with fixed payload delivery, no model import/no inference'
    print(summary)
    return
  }

  if (process.env[CONFIRM_ENV] !== 'true') {
    const summary = baseSummary(summaryPath, 'blocked')
    summary.mode = 'ai_video_broll_gen_10zb_l4_payload_install_runner_confirmation_blocked'
    summary.decision = 'ai_video_broll_gen_10zb_l4_payload_install_runner_confirmation_required_no_gcp_commands'
    summary.blockers = [`confirmation_env_required:${CONFIRM_ENV}=true`]
    print(summary)
    return
  }

  if (cacheFillOnly) {
    const phaseResults: PhaseResult[] = []
    const localManifest = validateLocalWheelhouseManifest()
    phaseResults.push(localManifest)
    const localRequirements = validateLocalRequirementsManifest()
    phaseResults.push(localRequirements)
    if (!localManifest.ok || !localRequirements.ok) {
      const summary: RunnerSummary = {
        ...baseSummary(summaryPath, 'blocked'),
        mode: 'ai_video_broll_gen_10zb_l4_payload_install_runner_cache_fill_local_preflight_blocked',
        decision: 'ai_video_broll_gen_10zb_private_gcs_cache_fill_local_preflight_blocked_no_vm_created',
        blockers: [
          ...(localManifest.ok ? [] : ['local_wheelhouse_manifest_not_ready']),
          ...(localRequirements.ok ? [] : ['local_requirements_manifest_missing']),
        ],
        phaseResults,
        runtimeSideEffects: runtimeSideEffects({
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

    const payloadPackage = prepareWheelhouseCachePackage(payloadPackageRoot)
    phaseResults.push({
      id: 'local_wheelhouse_cache_payload_package_ready',
      ok: true,
      exitCode: 0,
      timedOut: false,
      stdoutSummary: `wheelhouse_bytes=${EXPECTED_WHEELHOUSE_BYTES}; wheel_count=${EXPECTED_WHEEL_COUNT}`,
    })
    const preflight = runPreflight()
    phaseResults.push(...preflight.phaseResults)
    if (!preflight.ok) {
      const summary: RunnerSummary = {
        ...baseSummary(summaryPath, 'blocked'),
        mode: 'ai_video_broll_gen_10zb_l4_payload_install_runner_cache_fill_preflight_blocked',
        decision: 'ai_video_broll_gen_10zb_private_gcs_cache_fill_preflight_blocked_no_vm_created',
        blockers: preflight.blockers,
        phaseResults,
        preflightPassed: false,
        localPayloadPackagePrepared: true,
        localArchiveCreated: false,
        localArchiveSha256Verified: false,
        localChunkManifestCreated: false,
        runtimeSideEffects: runtimeSideEffects({
          computeVmCreateAttempted: false,
          computeVmCreated: false,
          cleanupAttempted: false,
          cleanupVerified: false,
          localArchiveCreated: false,
          localArchiveChunksCreated: false,
        }),
      }
      writeDurableSummary(summaryPath, summary)
      print(summary)
      return
    }

    const gcsPrefixUri = buildPrivateGcsPayloadPrefix(payloadPackage)
    const gcsUploadResults = uploadPayloadToPrivateGcs(payloadPackage, gcsPrefixUri)
    phaseResults.push(...gcsUploadResults)
    const cacheAfterUpload = validatePrivateGcsPayloadCache(payloadPackage, gcsPrefixUri)
    phaseResults.push(...cacheAfterUpload.phaseResults)
    const privateGcsPayloadStaged = cacheAfterUpload.ok
    const summary: RunnerSummary = {
      ...baseSummary(summaryPath, privateGcsPayloadStaged ? 'passed' : 'failed'),
      mode: 'ai_video_broll_gen_10zb_l4_payload_install_runner_private_gcs_cache_fill_only',
      decision: privateGcsPayloadStaged
        ? 'ai_video_broll_gen_10zb_private_gcs_payload_cache_ready_no_vm_created'
        : 'ai_video_broll_gen_10zb_private_gcs_payload_cache_fill_failed_no_vm_created',
      blockers: privateGcsPayloadStaged ? [] : ['private_gcs_payload_cache_fill_failed'],
      phaseResults,
      preflightPassed: true,
      localPayloadPackagePrepared: true,
      localArchiveCreated: false,
      localArchiveSha256Verified: false,
      localChunkManifestCreated: false,
      privateGcsPayloadStaged,
      runtimeSideEffects: runtimeSideEffects({
        computeVmCreateAttempted: false,
        computeVmCreated: false,
        cleanupAttempted: false,
        cleanupVerified: false,
        localArchiveCreated: false,
        localArchiveChunksCreated: false,
        privateGcsPayloadStaged,
      }),
    }
    writeDurableSummary(summaryPath, summary)
    print(summary)
    return
  }

  const phaseResults: PhaseResult[] = []
  let computeVmCreated = false
  let computeVmCreateAttempted = false
  let postCreatePrivateOnlyVerified = false
  let bootDiskAutoDeleteVerified = false
  let iapLookupReadinessPassed = false
  let python312ReadinessPassed = false
  let localPayloadPackagePrepared = false
  let localArchiveCreated = false
  let localArchiveSha256Verified = false
  let localChunkManifestCreated = false
  let privateGcsPayloadPrefixUri: string | undefined
  let privateGcsPayloadStaged = false
  const privateGcsPayloadCleanupAttempted = false
  const privateGcsPayloadCleanupVerified = false
  let privateGcsPayloadDownloaded = false
  let wheelhousePayloadTransferred = false
  let remoteArchiveSha256Verified = false
  let remoteArchiveExtracted = false
  let remoteManifestValidationPassed = false
  let offlineDependencyInstallPassed = false
  let dependencyImportReadinessPassed = false
  let cleanupAttempted = false
  let cleanupVerified = false

  const writeSummary = (partial: Partial<RunnerSummary>) => {
    writeDurableSummary(summaryPath, {
      ...baseSummary(summaryPath, 'failed'),
      phaseResults,
      computeVmCreateAttempted,
      computeVmCreated,
      postCreatePrivateOnlyVerified,
      bootDiskAutoDeleteVerified,
      iapLookupReadinessPassed,
      python312ReadinessPassed,
      localPayloadPackagePrepared,
      localArchiveCreated,
      localArchiveSha256Verified,
      localChunkManifestCreated,
      privateGcsPayloadStaged,
      privateGcsPayloadCleanupAttempted,
      privateGcsPayloadCleanupVerified,
      privateGcsPayloadDownloaded,
      wheelhousePayloadTransferred,
      remoteArchiveSha256Verified,
      remoteArchiveExtracted,
      remoteManifestValidationPassed,
      offlineDependencyInstallPassed,
      dependencyImportReadinessPassed,
      cleanupAttempted,
      cleanupVerified,
      ...partial,
    })
  }

  const cleanupPromptAndPrivateGcs = () => {
    cleanupAttempted = true
    const cleanup = cleanupPromptResources()
    phaseResults.push(...cleanup.phaseResults)
    cleanupVerified = cleanup.cleanupVerified
  }

  try {
    const localManifest = validateLocalWheelhouseManifest()
    phaseResults.push(localManifest)
    const localRequirements = validateLocalRequirementsManifest()
    phaseResults.push(localRequirements)
    if (!localManifest.ok || !localRequirements.ok) {
      const blockers = [
        ...(localManifest.ok ? [] : ['local_wheelhouse_manifest_not_ready']),
        ...(localRequirements.ok ? [] : ['local_requirements_manifest_missing']),
      ]
      const blockedSummary: RunnerSummary = {
        ...baseSummary(summaryPath, 'blocked'),
        mode: 'ai_video_broll_gen_10zb_l4_payload_install_runner_local_payload_preflight_blocked',
        decision: 'ai_video_broll_gen_10zb_local_payload_preflight_blocked_no_vm_created',
        preflightPassed: false,
        blockers,
        phaseResults,
        runtimeSideEffects: runtimeSideEffects({
          computeVmCreateAttempted: false,
          computeVmCreated: false,
          cleanupAttempted: false,
          cleanupVerified: false,
        }),
      }
      writeDurableSummary(summaryPath, blockedSummary)
      print(blockedSummary)
      return
    }

    const payloadPackage = prepareWheelhouseCachePackage(payloadPackageRoot)
    localPayloadPackagePrepared = true
    localArchiveCreated = false
    localArchiveSha256Verified = false
    localChunkManifestCreated = false
    phaseResults.push({
      id: 'local_wheelhouse_cache_payload_package_ready',
      ok: true,
      exitCode: 0,
      timedOut: false,
      stdoutSummary: `wheelhouse_bytes=${EXPECTED_WHEELHOUSE_BYTES}; wheel_count=${EXPECTED_WHEEL_COUNT}`,
    })
    writeSummary({
      status: 'planned',
      mode: 'ai_video_broll_gen_10zb_l4_payload_install_runner_payload_package_ready_preflight_pending',
      decision: 'ai_video_broll_gen_10zb_payload_package_ready_preflight_pending',
      blockers: [],
      runtimeSideEffects: runtimeSideEffects({
        computeVmCreateAttempted: false,
        computeVmCreated: false,
        cleanupAttempted: false,
        cleanupVerified: false,
        localArchiveCreated,
        localArchiveChunksCreated: localChunkManifestCreated,
        privateGcsPayloadStaged,
        privateGcsPayloadCleanupAttempted,
        privateGcsPayloadCleanupVerified,
        privateGcsPayloadDownloaded,
      }),
    })

    const preflight = runPreflight()
    phaseResults.push(...preflight.phaseResults)

    if (!preflight.ok) {
      const blockedSummary: RunnerSummary = {
        ...baseSummary(summaryPath, 'blocked'),
        mode: 'ai_video_broll_gen_10zb_l4_payload_install_runner_preflight_blocked',
        decision: 'ai_video_broll_gen_10zb_l4_payload_install_preflight_blocked_no_vm_created',
        preflightPassed: false,
        blockers: preflight.blockers,
        phaseResults,
        runtimeSideEffects: runtimeSideEffects({
          computeVmCreateAttempted: false,
          computeVmCreated: false,
          cleanupAttempted: false,
          cleanupVerified: false,
          localArchiveCreated,
          localArchiveChunksCreated: localChunkManifestCreated,
        }),
      }
      writeDurableSummary(summaryPath, blockedSummary)
      print(blockedSummary)
      return
    }

    writeSummary({
      status: 'planned',
      mode: 'ai_video_broll_gen_10zb_l4_payload_install_runner_preflight_passed_private_gcs_stage_pending',
      decision: 'ai_video_broll_gen_10zb_l4_payload_install_preflight_passed_private_gcs_stage_pending',
      preflightPassed: true,
      blockers: [],
      runtimeSideEffects: runtimeSideEffects({
        computeVmCreateAttempted: false,
        computeVmCreated: false,
        cleanupAttempted: false,
        cleanupVerified: false,
      }),
    })

    privateGcsPayloadPrefixUri = buildPrivateGcsPayloadPrefix(payloadPackage)
    const gcsUploadResults = uploadPayloadToPrivateGcs(payloadPackage, privateGcsPayloadPrefixUri)
    phaseResults.push(...gcsUploadResults)
    const cacheAfterUpload = validatePrivateGcsPayloadCache(payloadPackage, privateGcsPayloadPrefixUri)
    phaseResults.push(...cacheAfterUpload.phaseResults)
    privateGcsPayloadStaged = cacheAfterUpload.ok
    writeSummary({
      status: privateGcsPayloadStaged ? 'planned' : 'failed',
      mode: 'ai_video_broll_gen_10zb_l4_payload_install_runner_private_gcs_payload_stage_checkpoint',
      decision: privateGcsPayloadStaged
        ? 'ai_video_broll_gen_10zb_private_gcs_payload_staged_vm_create_pending'
        : 'ai_video_broll_gen_10zb_private_gcs_payload_stage_failed_no_vm_created_cleanup_pending',
      preflightPassed: true,
      blockers: privateGcsPayloadStaged ? [] : ['private_gcs_payload_stage_failed'],
      runtimeSideEffects: runtimeSideEffects({
        computeVmCreateAttempted: false,
        computeVmCreated: false,
        cleanupAttempted: false,
        cleanupVerified: false,
        localArchiveCreated,
        localArchiveChunksCreated: localChunkManifestCreated,
        privateGcsPayloadStaged,
      }),
    })
    if (!privateGcsPayloadStaged) {
      finish(summaryPath, 'failed', ['private_gcs_payload_stage_failed'], {
        phaseResults,
        preflightPassed: true,
        localPayloadPackagePrepared,
        localArchiveCreated,
        localArchiveSha256Verified,
        localChunkManifestCreated,
        privateGcsPayloadStaged,
        privateGcsPayloadCleanupAttempted,
        privateGcsPayloadCleanupVerified,
        privateGcsPayloadDownloaded,
      })
      return
    }
    const stagedPrivateGcsPayloadPrefixUri = privateGcsPayloadPrefixUri
    if (!stagedPrivateGcsPayloadPrefixUri) {
      throw new Error('private_gcs_payload_prefix_missing_after_stage_success')
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
        '120GB',
        '--boot-disk-type',
        'pd-balanced',
        '--boot-disk-auto-delete',
        '--quiet',
      ],
      10 * 60_000,
    )
    phaseResults.push(create)
    computeVmCreated = create.ok || describeInstanceCompact().ok
    writeSummary({
      preflightPassed: true,
      computeVmCreateAttempted,
      computeVmCreated,
      blockers: create.ok ? [] : ['l4_vm_create_failed_or_timed_out'],
      runtimeSideEffects: runtimeSideEffects({
        computeVmCreateAttempted,
        computeVmCreated,
        cleanupAttempted,
        cleanupVerified,
        localArchiveCreated,
        localArchiveChunksCreated: localChunkManifestCreated,
        privateGcsPayloadStaged,
        privateGcsPayloadCleanupAttempted,
        privateGcsPayloadCleanupVerified,
        privateGcsPayloadDownloaded,
      }),
    })

    if (!computeVmCreated) {
      cleanupPromptAndPrivateGcs()
      finish(summaryPath, 'failed', ['l4_vm_create_failed_or_timed_out'], {
        phaseResults,
        preflightPassed: true,
        computeVmCreateAttempted,
        computeVmCreated,
        localPayloadPackagePrepared,
        localArchiveCreated,
        localArchiveSha256Verified,
        localChunkManifestCreated,
        privateGcsPayloadStaged,
        privateGcsPayloadCleanupAttempted,
        privateGcsPayloadCleanupVerified,
        privateGcsPayloadDownloaded,
        cleanupAttempted,
        cleanupVerified,
      })
      return
    }

    const readiness = waitForInstanceReadiness()
    phaseResults.push(...readiness.phaseResults)
    postCreatePrivateOnlyVerified = readiness.privateOnly
    bootDiskAutoDeleteVerified = readiness.bootDiskAutoDelete
    writeSummary({
      status: readiness.ok ? 'planned' : 'failed',
      mode: 'ai_video_broll_gen_10zb_l4_payload_install_runner_post_create_readiness_checkpoint',
      decision: readiness.ok
        ? 'ai_video_broll_gen_10zb_l4_payload_install_post_create_readiness_verified'
        : 'ai_video_broll_gen_10zb_l4_payload_install_post_create_readiness_failed_cleanup_pending',
      preflightPassed: true,
      computeVmCreateAttempted,
      computeVmCreated,
      postCreatePrivateOnlyVerified,
      bootDiskAutoDeleteVerified,
      blockers: readiness.blockers,
      runtimeSideEffects: runtimeSideEffects({
        computeVmCreateAttempted,
        computeVmCreated,
        cleanupAttempted,
        cleanupVerified,
        localArchiveCreated,
        localArchiveChunksCreated: localChunkManifestCreated,
        privateGcsPayloadStaged,
        privateGcsPayloadCleanupAttempted,
        privateGcsPayloadCleanupVerified,
        privateGcsPayloadDownloaded,
      }),
    })

    if (!readiness.ok) {
      cleanupPromptAndPrivateGcs()
      finish(summaryPath, 'failed', readiness.blockers, {
        phaseResults,
        preflightPassed: true,
        computeVmCreateAttempted,
        computeVmCreated,
        postCreatePrivateOnlyVerified,
        bootDiskAutoDeleteVerified,
        localPayloadPackagePrepared,
        localArchiveCreated,
        localArchiveSha256Verified,
        localChunkManifestCreated,
        privateGcsPayloadStaged,
        privateGcsPayloadCleanupAttempted,
        privateGcsPayloadCleanupVerified,
        privateGcsPayloadDownloaded,
        cleanupAttempted,
        cleanupVerified,
      })
      return
    }

    const iap = waitForIapLookupReadiness()
    phaseResults.push(...iap.phaseResults)
    iapLookupReadinessPassed = iap.ok
    writeSummary({
      status: iap.ok ? 'planned' : 'failed',
      mode: 'ai_video_broll_gen_10zb_l4_payload_install_runner_iap_readiness_checkpoint',
      decision: iap.ok
        ? 'ai_video_broll_gen_10zb_l4_payload_install_iap_readiness_verified'
        : 'ai_video_broll_gen_10zb_l4_payload_install_iap_readiness_failed_cleanup_pending',
      preflightPassed: true,
      computeVmCreateAttempted,
      computeVmCreated,
      postCreatePrivateOnlyVerified,
      bootDiskAutoDeleteVerified,
      iapLookupReadinessPassed,
      blockers: iap.ok ? [] : ['iap_lookup_readiness_not_captured'],
      runtimeSideEffects: runtimeSideEffects({
        computeVmCreateAttempted,
        computeVmCreated,
        cleanupAttempted,
        cleanupVerified,
        sshSessionOpened: iapLookupReadinessPassed,
        localArchiveCreated,
        localArchiveChunksCreated: localChunkManifestCreated,
        privateGcsPayloadStaged,
        privateGcsPayloadCleanupAttempted,
        privateGcsPayloadCleanupVerified,
        privateGcsPayloadDownloaded,
      }),
    })
    if (!iap.ok) {
      cleanupPromptAndPrivateGcs()
      finish(summaryPath, 'failed', ['iap_lookup_readiness_not_captured'], {
        phaseResults,
        preflightPassed: true,
        computeVmCreateAttempted,
        computeVmCreated,
        postCreatePrivateOnlyVerified,
        bootDiskAutoDeleteVerified,
        iapLookupReadinessPassed,
        localPayloadPackagePrepared,
        localArchiveCreated,
        localArchiveSha256Verified,
        localChunkManifestCreated,
        privateGcsPayloadStaged,
        privateGcsPayloadCleanupAttempted,
        privateGcsPayloadCleanupVerified,
        privateGcsPayloadDownloaded,
        cleanupAttempted,
        cleanupVerified,
      })
      return
    }

    const python = runSsh('python312_readiness_check', 'python3.12 --version', 90_000)
    phaseResults.push(python)
    python312ReadinessPassed = python.ok && Boolean(python.stdoutSummary?.includes('Python 3.12'))
    writeSummary({
      status: python312ReadinessPassed ? 'planned' : 'failed',
      mode: 'ai_video_broll_gen_10zb_l4_payload_install_runner_python312_checkpoint',
      decision: python312ReadinessPassed
        ? 'ai_video_broll_gen_10zb_l4_payload_install_python312_verified'
        : 'ai_video_broll_gen_10zb_l4_payload_install_python312_failed_cleanup_pending',
      preflightPassed: true,
      computeVmCreateAttempted,
      computeVmCreated,
      postCreatePrivateOnlyVerified,
      bootDiskAutoDeleteVerified,
      iapLookupReadinessPassed,
      python312ReadinessPassed,
      blockers: python312ReadinessPassed ? [] : ['python312_readiness_failed_before_payload_transfer'],
      runtimeSideEffects: runtimeSideEffects({
        computeVmCreateAttempted,
        computeVmCreated,
        cleanupAttempted,
        cleanupVerified,
        sshSessionOpened: iapLookupReadinessPassed,
        localArchiveCreated,
        localArchiveChunksCreated: localChunkManifestCreated,
      }),
    })
    if (!python312ReadinessPassed) {
      cleanupPromptAndPrivateGcs()
      finish(summaryPath, 'failed', ['python312_readiness_failed_before_payload_transfer'], {
        phaseResults,
        preflightPassed: true,
        computeVmCreateAttempted,
        computeVmCreated,
        postCreatePrivateOnlyVerified,
        bootDiskAutoDeleteVerified,
        iapLookupReadinessPassed,
        python312ReadinessPassed,
        localPayloadPackagePrepared,
        localArchiveCreated,
        localArchiveSha256Verified,
        localChunkManifestCreated,
        privateGcsPayloadStaged,
        privateGcsPayloadCleanupAttempted,
        privateGcsPayloadCleanupVerified,
        privateGcsPayloadDownloaded,
        cleanupAttempted,
        cleanupVerified,
      })
      return
    }

    const remotePrep = runSsh(
      'prepare_remote_payload_directory',
      `rm -rf ${REMOTE_ROOT} && mkdir -p ${REMOTE_ROOT}`,
      90_000,
    )
    phaseResults.push(remotePrep)

    const remoteGcloud = runSsh(
      'remote_gcloud_storage_readiness',
      'gcloud --version && echo REEDITPRO_BROLL_10ZB_REMOTE_GCLOUD_READY',
      120_000,
    )
    phaseResults.push(remoteGcloud)

    const remoteWheelhouseDownloadScript = buildRemoteWheelhouseDownloadScript(stagedPrivateGcsPayloadPrefixUri)
    const downloadPayload = runSsh(
      'remote_private_gcs_payload_download',
      [
        'set -e',
        '&&',
        'python3.12 -c',
        JSON.stringify(remoteWheelhouseDownloadScript),
        '&&',
        `gcloud storage cp ${stagedPrivateGcsPayloadPrefixUri}/requirements.ai-video-broll.txt ${REMOTE_ROOT}/requirements.ai-video-broll.txt`,
        '&&',
        `gcloud storage cp ${stagedPrivateGcsPayloadPrefixUri}/${WHEELHOUSE_CACHE_MARKER_FILE_NAME} ${REMOTE_ROOT}/${WHEELHOUSE_CACHE_MARKER_FILE_NAME}`,
        '&&',
        'echo REEDITPRO_BROLL_10ZB_PRIVATE_GCS_PAYLOAD_DOWNLOAD_OK',
      ].join(' '),
      PRIVATE_GCS_PAYLOAD_TIMEOUT_MS,
    )
    phaseResults.push(downloadPayload)
    privateGcsPayloadDownloaded =
      remoteGcloud.ok &&
      Boolean(remoteGcloud.stdoutSummary?.includes('REEDITPRO_BROLL_10ZB_REMOTE_GCLOUD_READY')) &&
      downloadPayload.ok &&
      Boolean(downloadPayload.stdoutSummary?.includes('REEDITPRO_BROLL_10ZB_PRIVATE_GCS_PAYLOAD_DOWNLOAD_OK'))

    wheelhousePayloadTransferred = remotePrep.ok && privateGcsPayloadDownloaded
    writeSummary({
      status: wheelhousePayloadTransferred ? 'planned' : 'failed',
      mode: 'ai_video_broll_gen_10zb_l4_payload_install_runner_private_gcs_payload_download_checkpoint',
      decision: wheelhousePayloadTransferred
        ? 'ai_video_broll_gen_10zb_l4_payload_install_private_gcs_payload_download_complete'
        : 'ai_video_broll_gen_10zb_l4_payload_install_private_gcs_payload_download_failed_cleanup_pending',
      preflightPassed: true,
      computeVmCreateAttempted,
      computeVmCreated,
      postCreatePrivateOnlyVerified,
      bootDiskAutoDeleteVerified,
      iapLookupReadinessPassed,
      python312ReadinessPassed,
      localPayloadPackagePrepared,
      localArchiveCreated,
      localArchiveSha256Verified,
      localChunkManifestCreated,
      privateGcsPayloadStaged,
      privateGcsPayloadDownloaded,
      wheelhousePayloadTransferred,
      blockers: wheelhousePayloadTransferred ? [] : ['private_gcs_payload_download_failed'],
      runtimeSideEffects: runtimeSideEffects({
        computeVmCreateAttempted,
        computeVmCreated,
        cleanupAttempted,
        cleanupVerified,
        sshSessionOpened: iapLookupReadinessPassed,
        localArchiveCreated,
        localArchiveChunksCreated: localChunkManifestCreated,
        privateGcsPayloadStaged,
        privateGcsPayloadDownloaded,
        wheelhousePayloadTransferred,
      }),
    })
    if (!wheelhousePayloadTransferred) {
      cleanupPromptAndPrivateGcs()
      finish(summaryPath, 'failed', ['private_gcs_payload_download_failed'], {
        phaseResults,
        preflightPassed: true,
        computeVmCreateAttempted,
        computeVmCreated,
        postCreatePrivateOnlyVerified,
        bootDiskAutoDeleteVerified,
        iapLookupReadinessPassed,
        python312ReadinessPassed,
        localPayloadPackagePrepared,
        localArchiveCreated,
        localArchiveSha256Verified,
        localChunkManifestCreated,
        privateGcsPayloadStaged,
        privateGcsPayloadCleanupAttempted,
        privateGcsPayloadCleanupVerified,
        privateGcsPayloadDownloaded,
        wheelhousePayloadTransferred,
        cleanupAttempted,
        cleanupVerified,
      })
      return
    }

    const cacheMarker = runSsh(
      'remote_private_gcs_cache_marker_validation',
      [
        'python3.12',
        '-c',
        JSON.stringify(
          `import json; p='${REMOTE_ROOT}/${WHEELHOUSE_CACHE_MARKER_FILE_NAME}'; j=json.load(open(p)); assert j.get('aggregateSha256') == '${EXPECTED_WHEELHOUSE_SHA256}'; assert j.get('realWheelCount') == ${EXPECTED_WHEEL_COUNT}; assert j.get('aggregateBytes') == ${EXPECTED_WHEELHOUSE_BYTES}; print('REEDITPRO_BROLL_10ZB_REMOTE_PRIVATE_GCS_CACHE_MARKER_OK')`,
        ),
      ].join(' '),
      10 * 60_000,
    )
    phaseResults.push(cacheMarker)
    remoteArchiveSha256Verified =
      cacheMarker.ok &&
      Boolean(cacheMarker.stdoutSummary?.includes('REEDITPRO_BROLL_10ZB_REMOTE_PRIVATE_GCS_CACHE_MARKER_OK'))
    if (!remoteArchiveSha256Verified) {
      cleanupPromptAndPrivateGcs()
      finish(summaryPath, 'failed', ['remote_private_gcs_cache_marker_validation_failed'], {
        phaseResults,
        preflightPassed: true,
        computeVmCreateAttempted,
        computeVmCreated,
        postCreatePrivateOnlyVerified,
        bootDiskAutoDeleteVerified,
        iapLookupReadinessPassed,
        python312ReadinessPassed,
        localPayloadPackagePrepared,
        localArchiveCreated,
        localArchiveSha256Verified,
        localChunkManifestCreated,
        privateGcsPayloadStaged,
        privateGcsPayloadCleanupAttempted,
        privateGcsPayloadCleanupVerified,
        privateGcsPayloadDownloaded,
        wheelhousePayloadTransferred,
        remoteArchiveSha256Verified,
        cleanupAttempted,
        cleanupVerified,
      })
      return
    }

    const wheelhouseDirectory = runSsh(
      'remote_wheelhouse_directory_ready',
      `test -d ${REMOTE_WHEELHOUSE} && test -f ${REMOTE_WHEELHOUSE}/SHA256SUMS.json && echo REEDITPRO_BROLL_10ZB_REMOTE_WHEELHOUSE_DIRECTORY_READY`,
      120_000,
    )
    phaseResults.push(wheelhouseDirectory)
    remoteArchiveExtracted =
      wheelhouseDirectory.ok &&
      Boolean(wheelhouseDirectory.stdoutSummary?.includes('REEDITPRO_BROLL_10ZB_REMOTE_WHEELHOUSE_DIRECTORY_READY'))
    if (!remoteArchiveExtracted) {
      cleanupPromptAndPrivateGcs()
      finish(summaryPath, 'failed', ['remote_wheelhouse_directory_not_ready'], {
        phaseResults,
        preflightPassed: true,
        computeVmCreateAttempted,
        computeVmCreated,
        postCreatePrivateOnlyVerified,
        bootDiskAutoDeleteVerified,
        iapLookupReadinessPassed,
        python312ReadinessPassed,
        localPayloadPackagePrepared,
        localArchiveCreated,
        localArchiveSha256Verified,
        localChunkManifestCreated,
        privateGcsPayloadStaged,
        privateGcsPayloadCleanupAttempted,
        privateGcsPayloadCleanupVerified,
        privateGcsPayloadDownloaded,
        wheelhousePayloadTransferred,
        remoteArchiveSha256Verified,
        remoteArchiveExtracted,
        cleanupAttempted,
        cleanupVerified,
      })
      return
    }

    const manifest = runSsh(
      'remote_wheelhouse_manifest_validation',
      [
        'python3.12',
        '-c',
        JSON.stringify(
          `import json; p='${REMOTE_WHEELHOUSE}/SHA256SUMS.json'; j=json.load(open(p)); assert j.get('realWheelCount') == ${EXPECTED_WHEEL_COUNT}; assert j.get('aggregateBytes') == ${EXPECTED_WHEELHOUSE_BYTES}; assert j.get('aggregateSha256') == '${EXPECTED_WHEELHOUSE_SHA256}'; print('REEDITPRO_BROLL_10ZB_REMOTE_MANIFEST_OK')`,
        ),
      ].join(' '),
      120_000,
    )
    phaseResults.push(manifest)
    remoteManifestValidationPassed =
      manifest.ok && Boolean(manifest.stdoutSummary?.includes('REEDITPRO_BROLL_10ZB_REMOTE_MANIFEST_OK'))
    if (!remoteManifestValidationPassed) {
      cleanupPromptAndPrivateGcs()
      finish(summaryPath, 'failed', ['remote_manifest_validation_failed'], {
        phaseResults,
        preflightPassed: true,
        computeVmCreateAttempted,
        computeVmCreated,
        postCreatePrivateOnlyVerified,
        bootDiskAutoDeleteVerified,
        iapLookupReadinessPassed,
        python312ReadinessPassed,
        localPayloadPackagePrepared,
        localArchiveCreated,
        localArchiveSha256Verified,
        localChunkManifestCreated,
        privateGcsPayloadStaged,
        privateGcsPayloadCleanupAttempted,
        privateGcsPayloadCleanupVerified,
        privateGcsPayloadDownloaded,
        wheelhousePayloadTransferred,
        remoteArchiveSha256Verified,
        remoteArchiveExtracted,
        remoteManifestValidationPassed,
        cleanupAttempted,
        cleanupVerified,
      })
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
          `import pathlib, zipfile; src=pathlib.Path('${REMOTE_WHEELHOUSE}'); dst=pathlib.Path('${REMOTE_TARGET_DEPS}'); wheels=sorted(src.glob('*.whl')); assert len(wheels) == ${EXPECTED_WHEEL_COUNT}, len(wheels); [zipfile.ZipFile(wheel).extractall(dst) for wheel in wheels]; print('REEDITPRO_BROLL_10ZB_OFFLINE_WHEEL_EXTRACT_OK')`,
        ),
        '&&',
        'echo REEDITPRO_BROLL_10ZB_OFFLINE_INSTALL_OK',
      ].join(' '),
      25 * 60_000,
    )
    phaseResults.push(install)
    offlineDependencyInstallPassed =
      install.ok && Boolean(install.stdoutSummary?.includes('REEDITPRO_BROLL_10ZB_OFFLINE_INSTALL_OK'))
    if (!offlineDependencyInstallPassed) {
      cleanupPromptAndPrivateGcs()
      finish(summaryPath, 'failed', ['offline_dependency_install_readiness_failed'], {
        phaseResults,
        preflightPassed: true,
        computeVmCreateAttempted,
        computeVmCreated,
        postCreatePrivateOnlyVerified,
        bootDiskAutoDeleteVerified,
        iapLookupReadinessPassed,
        python312ReadinessPassed,
        localPayloadPackagePrepared,
        localArchiveCreated,
        localArchiveSha256Verified,
        localChunkManifestCreated,
        privateGcsPayloadStaged,
        privateGcsPayloadCleanupAttempted,
        privateGcsPayloadCleanupVerified,
        privateGcsPayloadDownloaded,
        wheelhousePayloadTransferred,
        remoteArchiveSha256Verified,
        remoteArchiveExtracted,
        remoteManifestValidationPassed,
        offlineDependencyInstallPassed,
        cleanupAttempted,
        cleanupVerified,
      })
      return
    }

    const imports = runSsh(
      'dependency_import_readiness_no_model_load',
      [
        `PYTHONPATH=${REMOTE_TARGET_DEPS} python3.12 -c`,
        JSON.stringify(
          "import torch, diffusers, transformers; print('REEDITPRO_BROLL_10ZB_DEPENDENCY_IMPORT_OK')",
        ),
      ].join(' '),
      120_000,
    )
    phaseResults.push(imports)
    dependencyImportReadinessPassed =
      imports.ok && Boolean(imports.stdoutSummary?.includes('REEDITPRO_BROLL_10ZB_DEPENDENCY_IMPORT_OK'))

    cleanupPromptAndPrivateGcs()

    const passed = dependencyImportReadinessPassed && cleanupVerified
    finish(summaryPath, passed ? 'passed' : 'failed', passed ? [] : ['dependency_import_readiness_failed'], {
      phaseResults,
      preflightPassed: true,
      computeVmCreateAttempted,
      computeVmCreated,
      postCreatePrivateOnlyVerified,
      bootDiskAutoDeleteVerified,
      iapLookupReadinessPassed,
      python312ReadinessPassed,
      localPayloadPackagePrepared,
      localArchiveCreated,
      localArchiveSha256Verified,
      localChunkManifestCreated,
      privateGcsPayloadStaged,
      privateGcsPayloadCleanupAttempted,
      privateGcsPayloadCleanupVerified,
      privateGcsPayloadDownloaded,
      wheelhousePayloadTransferred,
      remoteArchiveSha256Verified,
      remoteArchiveExtracted,
      remoteManifestValidationPassed,
      offlineDependencyInstallPassed,
      dependencyImportReadinessPassed,
      cleanupAttempted,
      cleanupVerified,
    })
  } catch (error) {
    cleanupPromptAndPrivateGcs()
    finish(
      summaryPath,
      'failed',
      [
        `runner_exception:${sanitize(error instanceof Error ? error.message : String(error)) ?? 'unknown'}`,
        ...(cleanupVerified ? [] : ['cleanup_not_verified_after_exception']),
      ],
      {
        phaseResults,
        cleanupAttempted,
        cleanupVerified,
        computeVmCreateAttempted,
        computeVmCreated,
        postCreatePrivateOnlyVerified,
        bootDiskAutoDeleteVerified,
        iapLookupReadinessPassed,
        python312ReadinessPassed,
        localPayloadPackagePrepared,
        localArchiveCreated,
        localArchiveSha256Verified,
        localChunkManifestCreated,
        privateGcsPayloadStaged,
        privateGcsPayloadCleanupAttempted,
        privateGcsPayloadCleanupVerified,
        privateGcsPayloadDownloaded,
        wheelhousePayloadTransferred,
        remoteArchiveSha256Verified,
        remoteArchiveExtracted,
        remoteManifestValidationPassed,
        offlineDependencyInstallPassed,
        dependencyImportReadinessPassed,
      },
    )
  }
}

function runPreflight() {
  const phaseResults: PhaseResult[] = []
  const blockers: string[] = []

  const localManifest = validateLocalWheelhouseManifest()
  phaseResults.push(localManifest)
  if (!localManifest.ok) blockers.push('local_wheelhouse_manifest_not_ready')

  const localRequirements = validateLocalRequirementsManifest()
  phaseResults.push(localRequirements)
  if (!localRequirements.ok) blockers.push('local_requirements_manifest_missing')

  const iapAcceleration = validateLocalGcloudIapAcceleration()
  phaseResults.push(iapAcceleration)
  if (!iapAcceleration.ok) blockers.push('local_gcloud_iap_numpy_acceleration_missing')

  const privateGcsReadiness = validatePrivateGcsPayloadReadiness()
  phaseResults.push(...privateGcsReadiness.phaseResults)
  if (!privateGcsReadiness.ok) blockers.push(...privateGcsReadiness.blockers)

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
      'echo REEDITPRO_BROLL_10ZB_IAP_LOOKUP_READY',
      60_000,
    )
    phaseResults.push(ssh)
    ok = ssh.ok && Boolean(ssh.stdoutSummary?.includes('REEDITPRO_BROLL_10ZB_IAP_LOOKUP_READY'))
    if (ok) break
    sleep(10_000)
  }

  return { ok, phaseResults }
}

function describeInstanceCompact(id = 'describe_prompt_vm_compact_raw_json') {
  const result = runGcloud(
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
  return result
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

function validateLocalRequirementsManifest(): PhaseResult {
  const ok = existsSync(REQUIREMENTS_PATH)
  return {
    id: 'local_requirements_manifest_exists',
    ok,
    exitCode: ok ? 0 : 1,
    timedOut: false,
    stdoutSummary: ok ? 'present' : undefined,
    stderrSummary: ok ? undefined : 'missing',
  }
}

function validateLocalGcloudIapAcceleration(): PhaseResult {
  const info = spawnSync('gcloud', ['info', '--format=value(basic.python_location)'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      CLOUDSDK_CORE_DISABLE_PROMPTS: '1',
      CLOUDSDK_PYTHON_SITEPACKAGES: '1',
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
    [
      '-c',
      "import numpy; print('REEDITPRO_BROLL_10ZB_GCLOUD_IAP_NUMPY_READY')",
    ],
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
    String(numpy.stdout ?? '').includes('REEDITPRO_BROLL_10ZB_GCLOUD_IAP_NUMPY_READY')
  return {
    id: 'local_gcloud_iap_numpy_acceleration_ready',
    ok,
    exitCode: numpy.status,
    timedOut: Boolean(numpy.error && numpy.error.message.includes('ETIMEDOUT')),
    stdoutSummary: ok ? `gcloud_python=${sanitize(pythonLocation)}; numpy_import_ok` : sanitize(String(numpy.stdout ?? '')),
    stderrSummary: ok ? undefined : sanitize(String(numpy.stderr ?? numpy.error?.message ?? 'numpy_import_failed')),
  }
}

function validatePrivateGcsPayloadReadiness() {
  const phaseResults: PhaseResult[] = []
  const blockers: string[] = []

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

  const iamPolicy = runGcloud(
    'private_gcs_payload_bucket_prefix_read_binding_visible',
    [
      'storage',
      'buckets',
      'get-iam-policy',
      `gs://${PRIVATE_GCS_PAYLOAD_BUCKET}`,
      '--project',
      PROJECT_ID,
      '--format=json(bindings)',
    ],
    90_000,
    { captureRawStdout: true },
  )
  const hasPrefixReadBinding = hasPrivateGcsPayloadReadBinding(iamPolicy.rawStdout)
  phaseResults.push({
    ...stripRawStdout(iamPolicy),
    ok: iamPolicy.ok && hasPrefixReadBinding,
    exitCode: iamPolicy.ok && hasPrefixReadBinding ? 0 : iamPolicy.exitCode,
    stdoutSummary: iamPolicy.ok && hasPrefixReadBinding
      ? 'prefix_scoped_storage_object_viewer_binding_visible'
      : 'prefix_scoped_storage_object_viewer_binding_missing',
  })
  if (!iamPolicy.ok || !hasPrefixReadBinding) {
    blockers.push('private_gcs_payload_service_account_read_binding_missing')
  }

  return {
    ok: blockers.length === 0,
    blockers,
    phaseResults,
  }
}

function hasPrivateGcsPayloadReadBinding(rawPolicy: string | undefined) {
  const policy = parseJson<{ bindings?: unknown[] }>(rawPolicy)
  const member = `serviceAccount:${SERVICE_ACCOUNT}`
  const allowedExpressionPrefixes = [
    `resource.name.startsWith("projects/_/buckets/${PRIVATE_GCS_PAYLOAD_BUCKET}/objects/${PRIVATE_GCS_PAYLOAD_PREFIX_ROOT}/`,
    `resource.name.startsWith("projects/_/buckets/${PRIVATE_GCS_PAYLOAD_BUCKET}/objects/proof-payloads/ai-video-broll/`,
  ]
  return asArray(policy?.bindings).some((binding) => {
    const record = asRecord(binding)
    const members = asArray(record.members)
    const condition = asRecord(record.condition)
    return (
      record.role === 'roles/storage.objectViewer' &&
      members.includes(member) &&
      typeof condition.expression === 'string' &&
      allowedExpressionPrefixes.some((expressionPrefix) => condition.expression.startsWith(expressionPrefix))
    )
  })
}

function buildPrivateGcsPayloadPrefix(payloadPackage: PayloadPackage) {
  void payloadPackage
  return `gs://${PRIVATE_GCS_PAYLOAD_BUCKET}/${PRIVATE_GCS_PAYLOAD_PREFIX_ROOT}/${EXPECTED_WHEELHOUSE_SHA256}`
}

function uploadPayloadToPrivateGcs(payloadPackage: PayloadPackage, gcsPrefixUri: string): PhaseResult[] {
  const cacheReadiness = validatePrivateGcsPayloadCache(payloadPackage, gcsPrefixUri)
  if (cacheReadiness.ok) return cacheReadiness.phaseResults

  const markerPath = path.join(payloadPackage.packageRoot, WHEELHOUSE_CACHE_MARKER_FILE_NAME)
  writeFileSync(
    markerPath,
    `${JSON.stringify(
      {
        cacheMode: 'private_gcs_wheelhouse_directory',
        sourceDirectoryBasename: path.basename(WHEELHOUSE_PATH),
        realWheelCount: EXPECTED_WHEEL_COUNT,
        aggregateBytes: EXPECTED_WHEELHOUSE_BYTES,
        aggregateSha256: EXPECTED_WHEELHOUSE_SHA256,
        archiveSha256Reference: payloadPackage.archiveSha256,
        generatedAssetsCreated: false,
        modelDownloaded: false,
        modelInferenceRun: false,
      },
      null,
      2,
    )}\n`,
    'utf8',
  )

  return [
    ...cacheReadiness.phaseResults,
    uploadPrivateGcsDirectory(
      'upload_wheelhouse_directory_to_private_gcs',
      WHEELHOUSE_PATH,
      `${gcsPrefixUri}/`,
    ),
    uploadPrivateGcsObject(
      'upload_payload_requirements_manifest_to_private_gcs',
      REQUIREMENTS_PATH,
      `${gcsPrefixUri}/requirements.ai-video-broll.txt`,
      5 * 60_000,
    ),
    uploadPrivateGcsObject(
      'upload_payload_cache_ready_marker_to_private_gcs',
      markerPath,
      `${gcsPrefixUri}/${WHEELHOUSE_CACHE_MARKER_FILE_NAME}`,
      5 * 60_000,
    ),
  ]
}

function validatePrivateGcsPayloadCache(payloadPackage: PayloadPackage, gcsPrefixUri: string) {
  void payloadPackage
  const phaseResults: PhaseResult[] = []
  const marker = runGcloud(
    'private_gcs_payload_cache_ready_marker',
    ['storage', 'cat', `${gcsPrefixUri}/${WHEELHOUSE_CACHE_MARKER_FILE_NAME}`, '--project', PROJECT_ID],
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
  phaseResults.push({
    ...stripRawStdout(marker),
    ok,
    exitCode: ok ? 0 : marker.exitCode,
    stdoutSummary: ok ? 'private_gcs_payload_cache_ready_marker_valid' : 'private_gcs_payload_cache_ready_marker_missing_or_invalid',
  })

  phaseResults.unshift({
    id: ok ? 'private_gcs_payload_cache_hit' : 'private_gcs_payload_cache_miss_upload_required',
    ok: true,
    exitCode: 0,
    timedOut: false,
    stdoutSummary: ok
      ? 'content_addressed_private_gcs_payload_cache_ready'
      : 'content_addressed_private_gcs_payload_cache_missing_or_incomplete',
  })

  return { ok, phaseResults }
}

function buildRemoteWheelhouseDownloadScript(gcsPrefixUri: string) {
  const wheelhouseBaseName = path.basename(WHEELHOUSE_PATH)
  const fileNames = getWheelhouseCacheFileNames()
  return [
    'import pathlib, subprocess',
    `files = ${JSON.stringify(fileNames)}`,
    `base_uri = ${JSON.stringify(`${gcsPrefixUri}/${wheelhouseBaseName}`)}`,
    `target = pathlib.Path(${JSON.stringify(REMOTE_WHEELHOUSE)})`,
    'target.mkdir(parents=True, exist_ok=True)',
    "[subprocess.run(['gcloud', 'storage', 'cp', f'{base_uri}/{file_name}', str(target / file_name)], check=True) for file_name in files]",
    "print('REEDITPRO_BROLL_10ZB_PRIVATE_GCS_WHEELHOUSE_EXACT_DOWNLOAD_OK')",
  ].join('; ')
}

function getWheelhouseCacheFileNames() {
  return readdirSync(WHEELHOUSE_PATH)
    .filter((fileName) => statSync(path.join(WHEELHOUSE_PATH, fileName)).isFile())
    .sort((left, right) => left.localeCompare(right))
}

function uploadPrivateGcsDirectory(id: string, sourceDirectory: string, destinationUri: string) {
  return runGsutil(
    id,
    [
      '-m',
      'cp',
      '-n',
      '-r',
      sourceDirectory,
      destinationUri,
    ],
    PRIVATE_GCS_PAYLOAD_TIMEOUT_MS,
  )
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

function runGsutil(id: string, args: string[], timeoutMs: number): PhaseResult {
  const result = spawnSync('gsutil', args, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      CLOUDSDK_CORE_DISABLE_PROMPTS: '1',
      CLOUDSDK_PYTHON_SITEPACKAGES: '1',
    },
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 18,
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: timeoutMs,
  })
  const timedOut = Boolean(result.error && result.error.message.includes('ETIMEDOUT'))
  return {
    id,
    ok: result.status === 0 && !timedOut,
    exitCode: result.status,
    timedOut,
    stdoutSummary: sanitize(String(result.stdout ?? '')),
    stderrSummary: sanitize(String(result.stderr ?? result.error?.message ?? '')),
  }
}

function prepareWheelhouseCachePackage(packageRoot: string): PayloadPackage {
  rmSync(packageRoot, { recursive: true, force: true })
  mkdirSync(packageRoot, { recursive: true })
  return {
    packageRoot,
    archivePath: '',
    archiveSha256Path: '',
    chunkManifestPath: '',
    archiveBytes: 0,
    archiveSha256: `wheelhouse-directory-${EXPECTED_WHEELHOUSE_SHA256}`,
    chunks: [],
  }
}

function preparePayloadPackage(packageRoot: string): PayloadPackage {
  rmSync(packageRoot, { recursive: true, force: true })
  mkdirSync(packageRoot, { recursive: true })

  const tarPath = path.join(packageRoot, 'wan-l4-python312-wheelhouse.tar')
  const archivePath = path.join(packageRoot, ARCHIVE_FILE_NAME)
  const archiveSha256Path = path.join(packageRoot, ARCHIVE_SHA256_FILE_NAME)
  const chunkManifestPath = path.join(packageRoot, CHUNK_MANIFEST_FILE_NAME)

  createDeterministicTar(WHEELHOUSE_PATH, tarPath)
  const gzip = spawnSync('gzip', ['-n', '-f', tarPath], {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 30 * 60_000,
  })
  if (gzip.status !== 0) {
    throw new Error(`payload_gzip_failed:${sanitize(String(gzip.stderr ?? 'unknown'))}`)
  }

  const gzipPath = `${tarPath}.gz`
  if (gzipPath !== archivePath) renameSync(gzipPath, archivePath)

  const archiveBytes = statSync(archivePath).size
  const archiveSha256 = hashFile(archivePath)
  writeFileSync(archiveSha256Path, `${archiveSha256}  ${ARCHIVE_FILE_NAME}\n`, 'utf8')

  const chunks = splitFileIntoChunks(archivePath, packageRoot)
  writeFileSync(
    chunkManifestPath,
    `${JSON.stringify(
      {
        archiveFileName: ARCHIVE_FILE_NAME,
        archiveBytes,
        archiveSha256,
        chunkSizeBytes: CHUNK_SIZE_BYTES,
        chunks: chunks.map((chunk) => ({
          index: chunk.index,
          fileName: chunk.fileName,
          bytes: chunk.bytes,
          sha256: chunk.sha256,
        })),
      },
      null,
      2,
    )}\n`,
    'utf8',
  )

  return {
    packageRoot,
    archivePath,
    archiveSha256Path,
    chunkManifestPath,
    archiveBytes,
    archiveSha256,
    chunks,
  }
}

function createDeterministicTar(sourceDirectory: string, tarPath: string) {
  const output = openSync(tarPath, 'w')
  const entries = listTarEntries(sourceDirectory)
  try {
    writeTarHeader(output, `${path.basename(sourceDirectory)}/`, 0, '5', 0o755)
    for (const entry of entries) {
      const entryName = `${path.basename(sourceDirectory)}/${entry.relativePath}`.replace(/\/$/, '')
      if (entry.type === 'directory') {
        writeTarHeader(output, `${entryName}/`, 0, '5', 0o755)
        continue
      }

      writeTarHeader(output, entryName, entry.size, '0', 0o644)
      writeFileContentToTar(output, entry.absolutePath, entry.size)
      writeTarPadding(output, entry.size)
    }

    writeSync(output, Buffer.alloc(1024))
  } finally {
    closeSync(output)
  }
}

function listTarEntries(sourceDirectory: string): Array<{
  absolutePath: string
  relativePath: string
  size: number
  type: 'file' | 'directory'
}> {
  const entries: Array<{
    absolutePath: string
    relativePath: string
    size: number
    type: 'file' | 'directory'
  }> = []

  function walk(directory: string, relativeDirectory: string) {
    const children = readdirSync(directory, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name),
    )
    for (const child of children) {
      const absolutePath = path.join(directory, child.name)
      const relativePath = path.join(relativeDirectory, child.name).split(path.sep).join('/')
      if (child.isDirectory()) {
        entries.push({ absolutePath, relativePath, size: 0, type: 'directory' })
        walk(absolutePath, relativePath)
        continue
      }
      if (child.isFile()) {
        entries.push({
          absolutePath,
          relativePath,
          size: statSync(absolutePath).size,
          type: 'file',
        })
      }
    }
  }

  walk(sourceDirectory, '')
  return entries
}

function writeTarHeader(output: number, name: string, size: number, typeFlag: '0' | '5', mode: number) {
  const splitName = trySplitTarName(name)
  if (!splitName) {
    const longNamePayload = Buffer.concat([Buffer.from(name, 'utf8'), Buffer.from([0])])
    writeStandardTarHeader(output, '././@LongLink', longNamePayload.length, 'L', 0o644)
    writeSync(output, longNamePayload)
    writeTarPadding(output, longNamePayload.length)
    writeStandardTarHeader(output, truncateTarNamePlaceholder(name), size, typeFlag, mode)
    return
  }

  writeStandardTarHeader(output, name, size, typeFlag, mode)
}

function writeStandardTarHeader(
  output: number,
  name: string,
  size: number,
  typeFlag: '0' | '5' | 'L',
  mode: number,
) {
  const header = Buffer.alloc(512)
  const { nameField, prefixField } = splitTarName(name)
  writeString(header, nameField, 0, 100)
  writeOctal(header, mode, 100, 8)
  writeOctal(header, 0, 108, 8)
  writeOctal(header, 0, 116, 8)
  writeOctal(header, size, 124, 12)
  writeOctal(header, 0, 136, 12)
  header.fill(0x20, 148, 156)
  writeString(header, typeFlag, 156, 1)
  writeString(header, 'ustar', 257, 6)
  writeString(header, '00', 263, 2)
  writeString(header, 'root', 265, 32)
  writeString(header, 'root', 297, 32)
  writeString(header, prefixField, 345, 155)

  let checksum = 0
  for (const byte of header) checksum += byte
  writeChecksum(header, checksum)
  writeSync(output, header)
}

function trySplitTarName(name: string): { nameField: string; prefixField: string } | undefined {
  try {
    return splitTarName(name)
  } catch {
    return undefined
  }
}

function truncateTarNamePlaceholder(name: string): string {
  const baseName = path.basename(name)
  if (Buffer.byteLength(baseName) <= 100) return baseName
  return baseName.slice(0, 100)
}

function splitTarName(name: string) {
  if (Buffer.byteLength(name) <= 100) return { nameField: name, prefixField: '' }
  const parts = name.split('/')
  for (let index = 1; index < parts.length; index += 1) {
    const prefixField = parts.slice(0, index).join('/')
    const nameField = parts.slice(index).join('/')
    if (Buffer.byteLength(prefixField) <= 155 && Buffer.byteLength(nameField) <= 100) {
      return { nameField, prefixField }
    }
  }
  throw new Error(`tar_path_too_long:${name}`)
}

function writeString(buffer: Buffer, value: string, offset: number, length: number) {
  buffer.write(value, offset, length, 'utf8')
}

function writeOctal(buffer: Buffer, value: number, offset: number, length: number) {
  const text = value.toString(8).padStart(length - 1, '0')
  buffer.write(text.slice(-length + 1), offset, length - 1, 'ascii')
  buffer[offset + length - 1] = 0
}

function writeChecksum(buffer: Buffer, checksum: number) {
  const text = checksum.toString(8).padStart(6, '0')
  buffer.write(text.slice(-6), 148, 6, 'ascii')
  buffer[154] = 0
  buffer[155] = 0x20
}

function writeFileContentToTar(output: number, filePath: string, size: number) {
  const input = openSync(filePath, 'r')
  const buffer = Buffer.allocUnsafe(1024 * 1024 * 8)
  let bytesReadTotal = 0
  try {
    while (bytesReadTotal < size) {
      const bytesRead = readSync(input, buffer, 0, Math.min(buffer.length, size - bytesReadTotal), null)
      if (bytesRead <= 0) break
      writeSync(output, buffer, 0, bytesRead)
      bytesReadTotal += bytesRead
    }
  } finally {
    closeSync(input)
  }
}

function writeTarPadding(output: number, size: number) {
  const remainder = size % 512
  if (remainder === 0) return
  writeSync(output, Buffer.alloc(512 - remainder))
}

function hashFile(filePath: string): string {
  const hash = createHash('sha256')
  const input = openSync(filePath, 'r')
  const buffer = Buffer.allocUnsafe(1024 * 1024 * 16)
  try {
    while (true) {
      const bytesRead = readSync(input, buffer, 0, buffer.length, null)
      if (bytesRead <= 0) break
      hash.update(buffer.subarray(0, bytesRead))
    }
  } finally {
    closeSync(input)
  }
  return hash.digest('hex')
}

function splitFileIntoChunks(filePath: string, packageRoot: string): PayloadChunk[] {
  const chunks: PayloadChunk[] = []
  const input = openSync(filePath, 'r')
  const buffer = Buffer.allocUnsafe(1024 * 1024 * 8)
  let chunkIndex = 0
  let chunkOutput: number | undefined
  let chunkPath = ''
  let chunkBytes = 0
  let chunkHash = createHash('sha256')

  function startChunk() {
    chunkIndex += 1
    chunkBytes = 0
    chunkHash = createHash('sha256')
    chunkPath = path.join(packageRoot, `${CHUNK_PREFIX}${String(chunkIndex).padStart(4, '0')}`)
    chunkOutput = openSync(chunkPath, 'w')
  }

  function finishChunk() {
    if (chunkOutput === undefined) return
    closeSync(chunkOutput)
    const fileName = path.basename(chunkPath)
    chunks.push({
      index: chunkIndex,
      fileName,
      path: chunkPath,
      bytes: chunkBytes,
      sha256: chunkHash.digest('hex'),
    })
    chunkOutput = undefined
  }

  startChunk()
  try {
    while (true) {
      const bytesRead = readSync(input, buffer, 0, buffer.length, null)
      if (bytesRead <= 0) break
      let offset = 0
      while (offset < bytesRead) {
        if (chunkOutput === undefined) startChunk()
        const bytesAvailableInChunk = CHUNK_SIZE_BYTES - chunkBytes
        const bytesToWrite = Math.min(bytesAvailableInChunk, bytesRead - offset)
        const slice = buffer.subarray(offset, offset + bytesToWrite)
        writeSync(chunkOutput, slice)
        chunkHash.update(slice)
        chunkBytes += bytesToWrite
        offset += bytesToWrite
        if (chunkBytes === CHUNK_SIZE_BYTES) {
          finishChunk()
        }
      }
    }
  } finally {
    closeSync(input)
    finishChunk()
  }

  return chunks
}

function finish(
  summaryPath: string,
  status: 'passed' | 'failed',
  blockers: string[],
  values: Partial<RunnerSummary>,
) {
  const summary: RunnerSummary = {
    ...baseSummary(summaryPath, status),
    ...values,
    ok: status === 'passed',
    status,
    blockers: Array.from(new Set(blockers)),
    nextPrompt: status === 'passed' ? NEXT_PROMPT_IF_PASSED : NEXT_PROMPT_IF_FAILED,
    runtimeSideEffects: runtimeSideEffects({
      computeVmCreateAttempted: Boolean(values.computeVmCreateAttempted),
      computeVmCreated: Boolean(values.computeVmCreated),
      cleanupAttempted: Boolean(values.cleanupAttempted),
      cleanupVerified: Boolean(values.cleanupVerified),
      sshSessionOpened: Boolean(values.iapLookupReadinessPassed),
      iapTransferExecuted: false,
      localArchiveCreated: Boolean(values.localArchiveCreated),
      localArchiveChunksCreated: Boolean(values.localChunkManifestCreated),
      privateGcsPayloadStaged: Boolean(values.privateGcsPayloadStaged),
      privateGcsPayloadCleanupAttempted: Boolean(values.privateGcsPayloadCleanupAttempted),
      privateGcsPayloadCleanupVerified: Boolean(values.privateGcsPayloadCleanupVerified),
      privateGcsPayloadDownloaded: Boolean(values.privateGcsPayloadDownloaded),
      wheelhousePayloadTransferred: Boolean(values.wheelhousePayloadTransferred),
      remoteArchiveSha256Verified: Boolean(values.remoteArchiveSha256Verified),
      remoteArchiveExtracted: Boolean(values.remoteArchiveExtracted),
      remoteManifestValidationRun: Boolean(values.remoteManifestValidationPassed),
      dependencyInstalledOnVm: Boolean(values.offlineDependencyInstallPassed),
      dependencyImportReadinessRun: Boolean(values.dependencyImportReadinessPassed),
    }),
  }
  writeDurableSummary(summaryPath, summary)
  print(summary)
}

function baseSummary(summaryPath: string, status: RunnerSummary['status']): RunnerSummary {
  return {
    ok: status === 'passed',
    mode: 'ai_video_broll_gen_10zb_l4_payload_install_runner_execute_result',
    status,
    decision:
      status === 'passed'
        ? 'ai_video_broll_gen_10zb_l4_payload_install_retry_passed_cleanup_verified'
        : 'ai_video_broll_gen_10zb_l4_payload_install_retry_blocked_or_failed_cleanup_required',
    summaryPath,
    nextPrompt: status === 'passed' ? NEXT_PROMPT_IF_PASSED : NEXT_PROMPT_IF_FAILED,
    blockers: [],
    phaseResults: [],
    preflightPassed: false,
    computeVmCreateAttempted: false,
    computeVmCreated: false,
    postCreatePrivateOnlyVerified: false,
    bootDiskAutoDeleteVerified: false,
    iapLookupReadinessPassed: false,
    python312ReadinessPassed: false,
    localPayloadPackagePrepared: false,
    localArchiveCreated: false,
    localArchiveSha256Verified: false,
    localChunkManifestCreated: false,
    privateGcsPayloadStaged: false,
    privateGcsPayloadCleanupAttempted: false,
    privateGcsPayloadCleanupVerified: false,
    privateGcsPayloadDownloaded: false,
    wheelhousePayloadTransferred: false,
    remoteArchiveSha256Verified: false,
    remoteArchiveExtracted: false,
    remoteManifestValidationPassed: false,
    offlineDependencyInstallPassed: false,
    dependencyImportReadinessPassed: false,
    cleanupAttempted: false,
    cleanupVerified: false,
    runtimeSideEffects: currentRuntimeSideEffects(),
  }
}

function currentRuntimeSideEffects(): JsonRecord {
  return {
    ...runtimeSideEffects({
      computeVmCreateAttempted: false,
      computeVmCreated: false,
      cleanupAttempted: false,
      cleanupVerified: false,
    }),
    gcpReadOnlyCommandsExecuted: false,
  }
}

function runtimeSideEffects(overrides: {
  computeVmCreateAttempted: boolean
  computeVmCreated: boolean
  cleanupAttempted: boolean
  cleanupVerified: boolean
  gcpReadOnlyCommandsExecuted?: boolean
  sshSessionOpened?: boolean
  iapTransferExecuted?: boolean
  localArchiveCreated?: boolean
  localArchiveChunksCreated?: boolean
  privateGcsPayloadStaged?: boolean
  privateGcsPayloadCleanupAttempted?: boolean
  privateGcsPayloadCleanupVerified?: boolean
  privateGcsPayloadDownloaded?: boolean
  wheelhousePayloadTransferred?: boolean
  remoteArchiveSha256Verified?: boolean
  remoteArchiveExtracted?: boolean
  remoteManifestValidationRun?: boolean
  dependencyInstalledOnVm?: boolean
  dependencyImportReadinessRun?: boolean
}): JsonRecord {
  return {
    gcpReadOnlyCommandsExecuted: overrides.gcpReadOnlyCommandsExecuted ?? true,
    gcpMutatingCommandsExecuted:
      overrides.computeVmCreateAttempted ||
      overrides.cleanupAttempted ||
      (overrides.privateGcsPayloadStaged ?? false) ||
      (overrides.privateGcsPayloadCleanupAttempted ?? false),
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
    localArchiveCreated: overrides.localArchiveCreated ?? false,
    localArchiveChunksCreated: overrides.localArchiveChunksCreated ?? false,
    privateGcsPayloadStaged: overrides.privateGcsPayloadStaged ?? false,
    privateGcsPayloadCleanupAttempted: overrides.privateGcsPayloadCleanupAttempted ?? false,
    privateGcsPayloadCleanupVerified: overrides.privateGcsPayloadCleanupVerified ?? false,
    privateGcsPayloadDownloaded: overrides.privateGcsPayloadDownloaded ?? false,
    sshSessionOpened: overrides.sshSessionOpened ?? false,
    iapTransferExecuted: overrides.iapTransferExecuted ?? overrides.wheelhousePayloadTransferred ?? false,
    fullWheelhousePayloadTransferred: overrides.wheelhousePayloadTransferred ?? false,
    remoteArchiveSha256Verified: overrides.remoteArchiveSha256Verified ?? false,
    remoteArchiveExtracted: overrides.remoteArchiveExtracted ?? false,
    remoteWheelhouseValidationRun: overrides.remoteManifestValidationRun ?? false,
    dependencyInstalledOnVm: overrides.dependencyInstalledOnVm ?? false,
    dependencyImportReadinessRun: overrides.dependencyImportReadinessRun ?? false,
    dockerRun: false,
    modelDownloaded: false,
    modelImportRun: false,
    modelInferenceRun: false,
    generatedVideoCreated: false,
    generatedAssetsCreated: false,
    providerCallsMade: false,
    workersDispatched: false,
    supabaseTouched: false,
    sqlExecuted: false,
    storageObjectsCreated: overrides.privateGcsPayloadStaged ?? false,
    privateGcsPayloadObjectsCleanedUp: overrides.privateGcsPayloadCleanupVerified ?? false,
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
  const index = process.argv.indexOf(flag)
  if (index < 0) return undefined
  return process.argv[index + 1]
}

function print(value: unknown) {
  console.log(JSON.stringify(value, null, 2))
}

main()
