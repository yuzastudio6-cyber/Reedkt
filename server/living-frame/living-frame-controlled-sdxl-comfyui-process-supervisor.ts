import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { createHash } from 'node:crypto'

import type {
  LivingFrameControlledSdxlComfyUiHostRuntimeInput,
  LivingFrameControlledSdxlComfyUiHostRuntimeResult,
} from './living-frame-controlled-sdxl-comfyui-host-runtime'
import {
  executeLivingFrameControlledSdxlComfyUiHostRuntime,
} from './living-frame-controlled-sdxl-comfyui-host-runtime'

export const LIVING_FRAME_COMFYUI_FIXED_PYTHON =
  '/opt/reeditpro/gpu-operations/comfyui/venv/bin/python' as const
export const LIVING_FRAME_COMFYUI_FIXED_MAIN =
  '/opt/reeditpro/gpu-operations/comfyui/source/main.py' as const
export const LIVING_FRAME_COMFYUI_FIXED_SOURCE_ROOT =
  '/opt/reeditpro/gpu-operations/comfyui/source' as const
export const LIVING_FRAME_COMFYUI_FIXED_BASE_DIRECTORY =
  '/opt/reeditpro/gpu-operations/comfyui/runtime' as const
export const LIVING_FRAME_COMFYUI_FIXED_INPUT_DIRECTORY =
  '/mnt/reeditpro/private-input' as const
export const LIVING_FRAME_COMFYUI_FIXED_EXTRA_MODEL_PATHS =
  '/opt/reeditpro/gpu-operations/comfyui/extra_model_paths.yaml' as const
export const LIVING_FRAME_COMFYUI_FIXED_IPADAPTER_NODE_DIRECTORY =
  '/opt/reeditpro/gpu-operations/comfyui/custom_nodes/ComfyUI_IPAdapter_plus' as const
export const LIVING_FRAME_COMFYUI_FIXED_CONTROLNET_AUX_NODE_DIRECTORY =
  '/opt/reeditpro/gpu-operations/comfyui/custom_nodes/comfyui_controlnet_aux' as const

export const
LIVING_FRAME_COMFYUI_DENIED_TOP_LEVEL_IMPORTS =
  Object.freeze(['sam2'] as const)

export const LIVING_FRAME_COMFYUI_FIXED_IMPORT_GUARD_SOURCE = [
  'import importlib.abc',
  'class _ReeditProDeniedImportFinder(importlib.abc.MetaPathFinder):',
  '    def find_spec(self, fullname, path=None, target=None):',
  '        if fullname == "sam2" or fullname.startswith("sam2."):',
  '            raise ImportError("import blocked by fixed ComfyUI operation policy")',
  '        return None',
  'sys.meta_path.insert(0, _ReeditProDeniedImportFinder())',
].join('\n')

export const LIVING_FRAME_COMFYUI_FIXED_BOOTSTRAP = [
  'import runpy,sys',
  `exec(${
    JSON.stringify(
      LIVING_FRAME_COMFYUI_FIXED_IMPORT_GUARD_SOURCE,
    )
  })`,
  `sys.path.insert(0, ${
    JSON.stringify(LIVING_FRAME_COMFYUI_FIXED_SOURCE_ROOT)
  })`,
  `runpy.run_path(${
    JSON.stringify(LIVING_FRAME_COMFYUI_FIXED_MAIN)
  }, run_name="__main__")`,
].join(';')

const READY_ENDPOINT = 'http://127.0.0.1:8188/system_stats'
const MAXIMUM_CAPTURE_BYTES = 256 * 1_024
const READY_TIMEOUT_MILLISECONDS = 60_000
const READY_REQUEST_TIMEOUT_MILLISECONDS = 1_000
const STOP_TIMEOUT_MILLISECONDS = 5_000
const READY_POLL_INTERVAL_MILLISECONDS = 250
const SAFE_ISO_TIMESTAMP =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u
const SHA256 = /^[a-f0-9]{64}$/u

export const LIVING_FRAME_COMFYUI_FIXED_ARGUMENTS = Object.freeze([
  '-I',
  '-B',
  '-c',
  LIVING_FRAME_COMFYUI_FIXED_BOOTSTRAP,
  '--listen',
  '127.0.0.1',
  '--port',
  '8188',
  '--disable-auto-launch',
  '--disable-metadata',
  '--disable-api-nodes',
  '--disable-all-custom-nodes',
  '--whitelist-custom-nodes',
  LIVING_FRAME_COMFYUI_FIXED_IPADAPTER_NODE_DIRECTORY,
  LIVING_FRAME_COMFYUI_FIXED_CONTROLNET_AUX_NODE_DIRECTORY,
  '--base-directory',
  LIVING_FRAME_COMFYUI_FIXED_BASE_DIRECTORY,
  '--input-directory',
  LIVING_FRAME_COMFYUI_FIXED_INPUT_DIRECTORY,
  '--extra-model-paths-config',
  LIVING_FRAME_COMFYUI_FIXED_EXTRA_MODEL_PATHS,
  '--preview-method',
  'none',
  '--cache-none',
  '--force-fp16',
  '--cuda-device',
  '0',
] as const)

export type LivingFrameComfyUiProcessEvidenceClass =
  | 'controlled_non_promotable_process_fixture'
  | 'fixed_private_subprocess_unqualified'

export interface LivingFrameComfyUiProcessExitObservation {
  readonly exitCode: number
  readonly signal: NodeJS.Signals | null
  readonly timedOut: boolean
  readonly captureExceeded: boolean
  readonly stdoutByteLength: number
  readonly stdoutSha256: string
  readonly stderrByteLength: number
  readonly stderrSha256: string
}

export interface LivingFrameComfyUiProcessHandle {
  readonly handleClass:
    'process_bound_single_use_comfyui_process_handle_v1'
  readonly evidenceClass: LivingFrameComfyUiProcessEvidenceClass
  readonly startedAt: string
  readonly callerCommandAccepted: false
  readonly callerArgumentsAccepted: false
  readonly callerEnvironmentAccepted: false
  readonly callerPathUrlCredentialAccepted: false
  readonly externalListenAllowed: false
  readonly runtimeDownloadsAllowed: false
  readonly outOfScopeDirectVcsImportsAllowed: false
  readonly productionQualified: false
  waitUntilReady(): Promise<{
    readonly readyAt: string
    readonly loopbackOnly: true
    readonly fixedPort: 8188
    readonly externalNetworkPerformed: false
    readonly runtimeDownloadPerformed: false
  }>
  stop(): Promise<LivingFrameComfyUiProcessExitObservation>
}

export interface LivingFrameComfyUiProcessPort {
  readonly portClass:
    | 'controlled_fixture_comfyui_process_port_v1'
    | 'fixed_private_comfyui_subprocess_port_v1'
  readonly evidenceClass: LivingFrameComfyUiProcessEvidenceClass
  readonly fixedLaunchSpecDigestSha256: string
  readonly callerCommandAccepted: false
  readonly callerArgumentsAccepted: false
  readonly callerEnvironmentAccepted: false
  readonly callerPathUrlCredentialAccepted: false
  readonly externalListenAllowed: false
  readonly runtimeDownloadsAllowed: false
  readonly outOfScopeDirectVcsImportsAllowed: false
  readonly productionQualified: false
  startOnce(): Promise<LivingFrameComfyUiProcessHandle>
}

export interface LivingFrameComfyUiProcessSupervisorReceipt {
  readonly receiptVersion:
    'living-frame-comfyui-process-supervisor-receipt-v1'
  readonly receiptClass:
    'private_internal_comfyui_process_lifecycle_observation_unreleased'
  readonly evidenceClass: LivingFrameComfyUiProcessEvidenceClass
  readonly fixedLaunchSpecDigestSha256: string
  readonly processStarted: true
  readonly loopbackReady: true
  readonly hostRuntimeCompleted: true
  readonly processStopped: true
  readonly startedAt: string
  readonly readyAt: string
  readonly stoppedAt: string
  readonly elapsedMilliseconds: number
  readonly processExit: LivingFrameComfyUiProcessExitObservation
  readonly oneProcessPerAttempt: true
  readonly externalListenAllowed: false
  readonly runtimeDownloadsAllowed: false
  readonly outOfScopeDirectVcsImportsAllowed: false
  readonly callerCommandArgumentsEnvironmentOrPathAccepted: false
  readonly actualCostEvidenceCreated: false
  readonly customerChargeCreated: false
  readonly artifactPersistenceAuthority: false
  readonly dispatchAuthority: false
  readonly runtimeAuthority: false
  readonly productionAuthority: false
  readonly productionReady: false
  readonly receiptDigestSha256: string
}

export interface LivingFrameComfyUiSupervisedHostRuntimeResult {
  readonly hostRuntime:
    LivingFrameControlledSdxlComfyUiHostRuntimeResult
  readonly processLifecycle:
    LivingFrameComfyUiProcessSupervisorReceipt
}

const registeredPorts = new WeakSet<object>()
const consumedPorts = new WeakSet<object>()
const registeredHandles = new WeakSet<object>()
const consumedHandles = new WeakSet<object>()

export function registerLivingFrameComfyUiProcessPort<
  T extends LivingFrameComfyUiProcessPort,
>(port: T): T {
  if (
    !port
    || typeof port !== 'object'
    || ![
      'controlled_fixture_comfyui_process_port_v1',
      'fixed_private_comfyui_subprocess_port_v1',
    ].includes(port.portClass)
    || ![
      'controlled_non_promotable_process_fixture',
      'fixed_private_subprocess_unqualified',
    ].includes(port.evidenceClass)
    || (
      port.portClass ===
        'controlled_fixture_comfyui_process_port_v1'
      && port.evidenceClass
        !== 'controlled_non_promotable_process_fixture'
    )
    || (
      port.portClass ===
        'fixed_private_comfyui_subprocess_port_v1'
      && port.evidenceClass
        !== 'fixed_private_subprocess_unqualified'
    )
    || !SHA256.test(port.fixedLaunchSpecDigestSha256)
    || port.fixedLaunchSpecDigestSha256 !== fixedLaunchSpecDigest()
    || port.callerCommandAccepted !== false
    || port.callerArgumentsAccepted !== false
    || port.callerEnvironmentAccepted !== false
    || port.callerPathUrlCredentialAccepted !== false
    || port.externalListenAllowed !== false
    || port.runtimeDownloadsAllowed !== false
    || port.outOfScopeDirectVcsImportsAllowed !== false
    || port.productionQualified !== false
    || typeof port.startOnce !== 'function'
  ) {
    throw new LivingFrameComfyUiProcessSupervisorError(
      'process_port_invalid',
    )
  }
  registeredPorts.add(port)
  return port
}

export function createLivingFrameComfyUiControlledProcessFixturePort(
  startOnce: () => Promise<LivingFrameComfyUiProcessHandle>,
): LivingFrameComfyUiProcessPort {
  if (typeof startOnce !== 'function') {
    throw new LivingFrameComfyUiProcessSupervisorError(
      'process_port_invalid',
    )
  }
  return registerLivingFrameComfyUiProcessPort(Object.freeze({
    portClass:
      'controlled_fixture_comfyui_process_port_v1' as const,
    evidenceClass:
      'controlled_non_promotable_process_fixture' as const,
    fixedLaunchSpecDigestSha256: fixedLaunchSpecDigest(),
    callerCommandAccepted: false as const,
    callerArgumentsAccepted: false as const,
    callerEnvironmentAccepted: false as const,
    callerPathUrlCredentialAccepted: false as const,
    externalListenAllowed: false as const,
    runtimeDownloadsAllowed: false as const,
    outOfScopeDirectVcsImportsAllowed: false as const,
    productionQualified: false as const,
    startOnce: startOnce.bind(undefined),
  }))
}

export function createLivingFrameComfyUiFixedSubprocessPort():
LivingFrameComfyUiProcessPort {
  return registerLivingFrameComfyUiProcessPort(Object.freeze({
    portClass:
      'fixed_private_comfyui_subprocess_port_v1' as const,
    evidenceClass:
      'fixed_private_subprocess_unqualified' as const,
    fixedLaunchSpecDigestSha256: fixedLaunchSpecDigest(),
    callerCommandAccepted: false as const,
    callerArgumentsAccepted: false as const,
    callerEnvironmentAccepted: false as const,
    callerPathUrlCredentialAccepted: false as const,
    externalListenAllowed: false as const,
    runtimeDownloadsAllowed: false as const,
    outOfScopeDirectVcsImportsAllowed: false as const,
    productionQualified: false as const,
    startOnce: startFixedSubprocess,
  }))
}

export async function executeSupervisedLivingFrameControlledSdxlComfyUiHostRuntime(
  input: {
    readonly processPort: LivingFrameComfyUiProcessPort
    readonly hostRuntimeInput:
      LivingFrameControlledSdxlComfyUiHostRuntimeInput
  },
): Promise<LivingFrameComfyUiSupervisedHostRuntimeResult> {
  assertProcessPort(input.processPort)
  consumedPorts.add(input.processPort)

  let handle: LivingFrameComfyUiProcessHandle
  try {
    handle = await input.processPort.startOnce()
  } catch {
    throw new LivingFrameComfyUiProcessSupervisorError(
      'process_start_failed',
    )
  }
  assertHandle(handle, input.processPort.evidenceClass)
  registeredHandles.add(handle)

  let ready: Awaited<
    ReturnType<LivingFrameComfyUiProcessHandle['waitUntilReady']>
  >
  try {
    ready = await handle.waitUntilReady()
    assertReady(ready)
  } catch {
    await stopAfterFailure(handle)
    throw new LivingFrameComfyUiProcessSupervisorError(
      'process_readiness_failed',
    )
  }

  let hostRuntime:
    LivingFrameControlledSdxlComfyUiHostRuntimeResult
  try {
    hostRuntime =
      await executeLivingFrameControlledSdxlComfyUiHostRuntime(
        input.hostRuntimeInput,
      )
  } catch (error) {
    await stopAfterFailure(handle)
    throw error
  }

  const processExit = await stopExactlyOnce(handle)
  assertCleanExit(processExit)
  const stoppedAt = new Date().toISOString()
  const elapsedMilliseconds =
    Date.parse(stoppedAt) - Date.parse(handle.startedAt)
  if (
    elapsedMilliseconds < 0
    || !Number.isSafeInteger(elapsedMilliseconds)
  ) {
    throw new LivingFrameComfyUiProcessSupervisorError(
      'process_observation_invalid',
    )
  }
  const draft = {
    receiptVersion:
      'living-frame-comfyui-process-supervisor-receipt-v1' as const,
    receiptClass: (
      'private_internal_comfyui_process_lifecycle_observation_unreleased'
    ) as const,
    evidenceClass: input.processPort.evidenceClass,
    fixedLaunchSpecDigestSha256:
      input.processPort.fixedLaunchSpecDigestSha256,
    processStarted: true as const,
    loopbackReady: true as const,
    hostRuntimeCompleted: true as const,
    processStopped: true as const,
    startedAt: handle.startedAt,
    readyAt: ready.readyAt,
    stoppedAt,
    elapsedMilliseconds,
    processExit,
    oneProcessPerAttempt: true as const,
    externalListenAllowed: false as const,
    runtimeDownloadsAllowed: false as const,
    outOfScopeDirectVcsImportsAllowed: false as const,
    callerCommandArgumentsEnvironmentOrPathAccepted: false as const,
    actualCostEvidenceCreated: false as const,
    customerChargeCreated: false as const,
    artifactPersistenceAuthority: false as const,
    dispatchAuthority: false as const,
    runtimeAuthority: false as const,
    productionAuthority: false as const,
    productionReady: false as const,
  }
  return deepFreeze({
    hostRuntime,
    processLifecycle: {
      ...draft,
      receiptDigestSha256: digest(draft),
    },
  })
}

export function verifyLivingFrameComfyUiProcessSupervisorReceipt(
  value: unknown,
): value is LivingFrameComfyUiProcessSupervisorReceipt {
  if (!isRecord(value)) return false
  const receiptDigestSha256 = value.receiptDigestSha256
  if (
    typeof receiptDigestSha256 !== 'string'
    || !SHA256.test(receiptDigestSha256)
  ) return false
  const {
    receiptDigestSha256: _digest,
    ...draft
  } = value
  void _digest
  const started = Date.parse(String(draft.startedAt))
  const ready = Date.parse(String(draft.readyAt))
  const stopped = Date.parse(String(draft.stoppedAt))
  if (
    draft.receiptVersion
      !== 'living-frame-comfyui-process-supervisor-receipt-v1'
    || draft.receiptClass
      !==
        'private_internal_comfyui_process_lifecycle_observation_unreleased'
    || ![
      'controlled_non_promotable_process_fixture',
      'fixed_private_subprocess_unqualified',
    ].includes(String(draft.evidenceClass))
    || draft.fixedLaunchSpecDigestSha256 !== fixedLaunchSpecDigest()
    || draft.processStarted !== true
    || draft.loopbackReady !== true
    || draft.hostRuntimeCompleted !== true
    || draft.processStopped !== true
    || typeof draft.startedAt !== 'string'
    || !SAFE_ISO_TIMESTAMP.test(draft.startedAt)
    || typeof draft.readyAt !== 'string'
    || !SAFE_ISO_TIMESTAMP.test(draft.readyAt)
    || typeof draft.stoppedAt !== 'string'
    || !SAFE_ISO_TIMESTAMP.test(draft.stoppedAt)
    || !Number.isFinite(started)
    || !Number.isFinite(ready)
    || !Number.isFinite(stopped)
    || ready < started
    || stopped < ready
    || !Number.isSafeInteger(draft.elapsedMilliseconds)
    || Number(draft.elapsedMilliseconds) < 0
    || Number(draft.elapsedMilliseconds) !== stopped - started
    || !isExitObservation(draft.processExit)
    || draft.oneProcessPerAttempt !== true
    || draft.externalListenAllowed !== false
    || draft.runtimeDownloadsAllowed !== false
    || draft.outOfScopeDirectVcsImportsAllowed !== false
    || draft.callerCommandArgumentsEnvironmentOrPathAccepted
      !== false
    || draft.actualCostEvidenceCreated !== false
    || draft.customerChargeCreated !== false
    || draft.artifactPersistenceAuthority !== false
    || draft.dispatchAuthority !== false
    || draft.runtimeAuthority !== false
    || draft.productionAuthority !== false
    || draft.productionReady !== false
  ) return false
  return digest(draft) === receiptDigestSha256
}

export function fixedLivingFrameComfyUiLaunchSpec() {
  return deepFreeze({
    executable: LIVING_FRAME_COMFYUI_FIXED_PYTHON,
    arguments: [...LIVING_FRAME_COMFYUI_FIXED_ARGUMENTS],
    cwd: LIVING_FRAME_COMFYUI_FIXED_SOURCE_ROOT,
    listenAddress: '127.0.0.1' as const,
    listenPort: 8188 as const,
    customNodePolicy:
      'disable_all_then_whitelist_exact_two' as const,
    runtimeNetworkFetchAllowed: false as const,
    runtimeModelDownloadAllowed: false as const,
    deniedTopLevelImports: [
      ...LIVING_FRAME_COMFYUI_DENIED_TOP_LEVEL_IMPORTS,
    ],
    outOfScopeDirectVcsImportsAllowed: false as const,
    callerOverridesAllowed: false as const,
    productionQualified: false as const,
  })
}

export class LivingFrameComfyUiProcessSupervisorError
  extends Error {
  readonly code:
    | 'process_port_invalid'
    | 'process_port_reused'
    | 'process_start_failed'
    | 'process_handle_invalid'
    | 'process_readiness_failed'
    | 'process_stop_failed'
    | 'process_exit_invalid'
    | 'process_observation_invalid'

  constructor(code: LivingFrameComfyUiProcessSupervisorError['code']) {
    super('Living Frame ComfyUI process supervision failed.')
    this.name = 'LivingFrameComfyUiProcessSupervisorError'
    this.code = code
  }
}

async function startFixedSubprocess():
Promise<LivingFrameComfyUiProcessHandle> {
  const child = spawn(
    LIVING_FRAME_COMFYUI_FIXED_PYTHON,
    [...LIVING_FRAME_COMFYUI_FIXED_ARGUMENTS],
    {
      cwd: LIVING_FRAME_COMFYUI_FIXED_SOURCE_ROOT,
      env: fixedRuntimeEnvironment(),
      shell: false,
      stdio: ['pipe', 'pipe', 'pipe'],
    },
  )
  child.stdin.end()
  return createChildProcessHandle(child)
}

function createChildProcessHandle(
  child: ChildProcessWithoutNullStreams,
): LivingFrameComfyUiProcessHandle {
  const startedAt = new Date().toISOString()
  const stdout = boundedCapture(child.stdout)
  const stderr = boundedCapture(child.stderr)
  let timedOut = false
  let stopped = false
  const exitPromise = new Promise<{
    code: number
    signal: NodeJS.Signals | null
  }>((resolve, reject) => {
    child.once('error', reject)
    child.once('close', (code, signal) => resolve({
      code: code ?? -1,
      signal,
    }))
  })

  return {
    handleClass:
      'process_bound_single_use_comfyui_process_handle_v1',
    evidenceClass: 'fixed_private_subprocess_unqualified',
    startedAt,
    callerCommandAccepted: false,
    callerArgumentsAccepted: false,
    callerEnvironmentAccepted: false,
    callerPathUrlCredentialAccepted: false,
    externalListenAllowed: false,
    runtimeDownloadsAllowed: false,
    outOfScopeDirectVcsImportsAllowed: false,
    productionQualified: false,
    async waitUntilReady() {
      await waitForReady({
        child,
        exitPromise,
        captureExceeded: () =>
          stdout.exceeded() || stderr.exceeded(),
      })
      return {
        readyAt: new Date().toISOString(),
        loopbackOnly: true,
        fixedPort: 8188,
        externalNetworkPerformed: false,
        runtimeDownloadPerformed: false,
      }
    },
    async stop() {
      if (stopped) {
        throw new LivingFrameComfyUiProcessSupervisorError(
          'process_stop_failed',
        )
      }
      stopped = true
      if (child.exitCode === null && child.signalCode === null) {
        child.kill('SIGTERM')
      }
      let exit
      try {
        exit = await Promise.race([
          exitPromise,
          new Promise<never>((_resolve, reject) => {
            const timeout = setTimeout(() => {
              timedOut = true
              child.kill('SIGKILL')
              reject(new Error('stop timeout'))
            }, STOP_TIMEOUT_MILLISECONDS)
            timeout.unref()
          }),
        ])
      } catch {
        try {
          exit = await exitPromise
        } catch {
          throw new LivingFrameComfyUiProcessSupervisorError(
            'process_stop_failed',
          )
        }
      }
      const stdoutResult = stdout.result()
      const stderrResult = stderr.result()
      return {
        exitCode:
          exit.code === -1 && exit.signal === 'SIGTERM'
            ? 143
            : exit.code,
        signal: exit.signal,
        timedOut,
        captureExceeded:
          stdoutResult.exceeded || stderrResult.exceeded,
        stdoutByteLength: stdoutResult.byteLength,
        stdoutSha256: stdoutResult.sha256,
        stderrByteLength: stderrResult.byteLength,
        stderrSha256: stderrResult.sha256,
      }
    },
  }
}

async function waitForReady(input: {
  child: ChildProcessWithoutNullStreams
  exitPromise: Promise<{
    code: number
    signal: NodeJS.Signals | null
  }>
  captureExceeded(): boolean
}): Promise<void> {
  const deadline = Date.now() + READY_TIMEOUT_MILLISECONDS
  while (Date.now() < deadline) {
    if (
      input.child.exitCode !== null
      || input.child.signalCode !== null
      || input.captureExceeded()
    ) {
      throw new Error('process unavailable')
    }
    const controller = new AbortController()
    const timeout = setTimeout(
      () => controller.abort(),
      READY_REQUEST_TIMEOUT_MILLISECONDS,
    )
    timeout.unref()
    try {
      const response = await fetch(READY_ENDPOINT, {
        method: 'GET',
        redirect: 'error',
        signal: controller.signal,
      })
      const ready =
        response.ok
        && response.url === READY_ENDPOINT
        && Number(response.headers.get('content-length') ?? 0)
          <= 64 * 1_024
      await response.body?.cancel()
      if (ready) return
    } catch {
      // A loopback connection failure is expected while the fixed host loads.
    } finally {
      clearTimeout(timeout)
    }
    await Promise.race([
      delay(READY_POLL_INTERVAL_MILLISECONDS),
      input.exitPromise.then(() => {
        throw new Error('process exited')
      }),
    ])
  }
  throw new Error('readiness timeout')
}

function fixedRuntimeEnvironment(): NodeJS.ProcessEnv {
  return {
    PATH:
      '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
    HOME: '/tmp',
    LANG: 'C.UTF-8',
    LC_ALL: 'C.UTF-8',
    PYTHONHASHSEED: '0',
    PYTHONDONTWRITEBYTECODE: '1',
    PYTHONUNBUFFERED: '1',
    HF_HUB_OFFLINE: '1',
    TRANSFORMERS_OFFLINE: '1',
    CUDA_VISIBLE_DEVICES: '0',
    NVIDIA_VISIBLE_DEVICES: '0',
    NO_PROXY: '127.0.0.1,localhost',
    no_proxy: '127.0.0.1,localhost',
    LD_LIBRARY_PATH:
      '/usr/local/nvidia/lib64:/usr/local/cuda/lib64',
  }
}

function boundedCapture(
  stream: NodeJS.ReadableStream,
) {
  const chunks: Buffer[] = []
  let byteLength = 0
  let captureExceeded = false
  stream.on('data', (chunk: Buffer) => {
    byteLength += chunk.byteLength
    if (byteLength > MAXIMUM_CAPTURE_BYTES) {
      captureExceeded = true
      return
    }
    chunks.push(Buffer.from(chunk))
  })
  return {
    exceeded: () => captureExceeded,
    result: () => {
      const bytes = Buffer.concat(chunks)
      return {
        exceeded: captureExceeded,
        byteLength,
        sha256: createHash('sha256').update(bytes).digest('hex'),
      }
    },
  }
}

function assertProcessPort(
  port: LivingFrameComfyUiProcessPort,
): void {
  if (!registeredPorts.has(port) || consumedPorts.has(port)) {
    throw new LivingFrameComfyUiProcessSupervisorError(
      consumedPorts.has(port)
        ? 'process_port_reused'
        : 'process_port_invalid',
    )
  }
}

function assertHandle(
  handle: LivingFrameComfyUiProcessHandle,
  expectedEvidenceClass: LivingFrameComfyUiProcessEvidenceClass,
): void {
  if (
    !handle
    || typeof handle !== 'object'
    || handle.handleClass
      !== 'process_bound_single_use_comfyui_process_handle_v1'
    || handle.evidenceClass !== expectedEvidenceClass
    || !SAFE_ISO_TIMESTAMP.test(handle.startedAt)
    || handle.callerCommandAccepted !== false
    || handle.callerArgumentsAccepted !== false
    || handle.callerEnvironmentAccepted !== false
    || handle.callerPathUrlCredentialAccepted !== false
    || handle.externalListenAllowed !== false
    || handle.runtimeDownloadsAllowed !== false
    || handle.outOfScopeDirectVcsImportsAllowed !== false
    || handle.productionQualified !== false
    || typeof handle.waitUntilReady !== 'function'
    || typeof handle.stop !== 'function'
  ) {
    throw new LivingFrameComfyUiProcessSupervisorError(
      'process_handle_invalid',
    )
  }
}

function assertReady(
  value: Awaited<
    ReturnType<LivingFrameComfyUiProcessHandle['waitUntilReady']>
  >,
): void {
  if (
    !value
    || !SAFE_ISO_TIMESTAMP.test(value.readyAt)
    || value.loopbackOnly !== true
    || value.fixedPort !== 8188
    || value.externalNetworkPerformed !== false
    || value.runtimeDownloadPerformed !== false
  ) {
    throw new LivingFrameComfyUiProcessSupervisorError(
      'process_readiness_failed',
    )
  }
}

async function stopExactlyOnce(
  handle: LivingFrameComfyUiProcessHandle,
): Promise<LivingFrameComfyUiProcessExitObservation> {
  if (
    !registeredHandles.has(handle)
    || consumedHandles.has(handle)
  ) {
    throw new LivingFrameComfyUiProcessSupervisorError(
      'process_stop_failed',
    )
  }
  consumedHandles.add(handle)
  try {
    return await handle.stop()
  } catch {
    throw new LivingFrameComfyUiProcessSupervisorError(
      'process_stop_failed',
    )
  }
}

async function stopAfterFailure(
  handle: LivingFrameComfyUiProcessHandle,
): Promise<void> {
  if (
    registeredHandles.has(handle)
    && !consumedHandles.has(handle)
  ) {
    consumedHandles.add(handle)
    try {
      await handle.stop()
    } catch {
      // The original failure remains authoritative; cleanup is best effort.
    }
  }
}

function assertCleanExit(
  exit: LivingFrameComfyUiProcessExitObservation,
): void {
  if (
    !isExitObservation(exit)
    || exit.timedOut
    || exit.captureExceeded
    || ![0, 143].includes(exit.exitCode)
  ) {
    throw new LivingFrameComfyUiProcessSupervisorError(
      'process_exit_invalid',
    )
  }
}

function isExitObservation(
  value: unknown,
): value is LivingFrameComfyUiProcessExitObservation {
  return isRecord(value)
    && Number.isSafeInteger(value.exitCode)
    && (
      value.signal === null
      || [
        'SIGTERM',
        'SIGKILL',
      ].includes(String(value.signal))
    )
    && typeof value.timedOut === 'boolean'
    && typeof value.captureExceeded === 'boolean'
    && Number.isSafeInteger(value.stdoutByteLength)
    && Number(value.stdoutByteLength) >= 0
    && Number(value.stdoutByteLength) <= MAXIMUM_CAPTURE_BYTES
    && SHA256.test(String(value.stdoutSha256))
    && Number.isSafeInteger(value.stderrByteLength)
    && Number(value.stderrByteLength) >= 0
    && Number(value.stderrByteLength) <= MAXIMUM_CAPTURE_BYTES
    && SHA256.test(String(value.stderrSha256))
}

function fixedLaunchSpecDigest(): string {
  return digest(fixedLivingFrameComfyUiLaunchSpec())
}

function digest(value: unknown): string {
  return createHash('sha256')
    .update(canonicalJson(value), 'utf8')
    .digest('hex')
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => canonicalize(entry))
  }
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    )
  }
  return value
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    const timeout = setTimeout(resolve, milliseconds)
    timeout.unref()
  })
}

function deepFreeze<T>(value: T): T {
  if (
    value !== null
    && typeof value === 'object'
    && !Object.isFrozen(value)
  ) {
    Object.freeze(value)
    Object.values(value).forEach((child) => deepFreeze(child))
  }
  return value
}
