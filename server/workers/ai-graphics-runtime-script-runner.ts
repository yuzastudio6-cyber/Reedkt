import { execFile, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, statSync } from 'node:fs'
import { mkdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const dockerContainerNamePrefix = 'reeditpro-ai-graphics-runtime'

export interface AiGraphicsRuntimeScriptResult {
  outputJson: unknown
  outputJsonPath: string
  outputJsonSizeBytes: number
  outputJsonSha256: string
  stdout: string
  stderr: string
}

export type AiGraphicsPythonRuntimeBackend = 'host_python' | 'docker_container'

export interface AiGraphicsRuntimeProofExpectation {
  expectedToolId: string
  requireCuda?: boolean
  requireCudaExecutionProvider?: boolean
  requireCpuModelRuntime?: boolean
  requireNoModelDownload?: boolean
  requireNoProviderRuntime?: boolean
  requireNoPublicArtifact?: boolean
  requireNoSignedUrl?: boolean
}

export interface AiGraphicsRuntimeContainerBindMount {
  hostPath: string
  containerPath?: string
  mode?: 'ro' | 'rw'
}

export async function runAiGraphicsPythonRuntimeScript(input: {
  scriptRelativePath: string
  args: string[]
  outputJsonPath: string
  timeoutMs?: number
  extraEnv?: Record<string, string>
  runtimeBackend?: AiGraphicsPythonRuntimeBackend
  containerImage?: string
  containerPlatform?: string
  containerGpu?: boolean
  containerBindMounts?: AiGraphicsRuntimeContainerBindMount[]
  proofExpectation?: AiGraphicsRuntimeProofExpectation
}): Promise<AiGraphicsRuntimeScriptResult> {
  const scriptPath = path.resolve(process.cwd(), input.scriptRelativePath)
  assertSafeRuntimeValue(scriptPath, 'scriptPath')
  if (!existsSync(scriptPath)) {
    throw new Error(`AI graphics runtime script is missing: ${input.scriptRelativePath}`)
  }

  for (const arg of input.args) {
    assertSafeRuntimeValue(arg, 'runtimeArg')
  }

  const outputJsonPath = path.resolve(input.outputJsonPath)
  await mkdir(path.dirname(outputJsonPath), { recursive: true })

  const result = input.runtimeBackend === 'docker_container'
    ? await runPythonRuntimeInDockerContainer(input, scriptPath)
    : await runPythonRuntimeOnHost(input, scriptPath)

  const rawOutput = await readFile(outputJsonPath, 'utf8')
  const outputJson = JSON.parse(rawOutput)
  if (input.proofExpectation) {
    assertAiGraphicsRuntimeProofOutput(outputJson, input.proofExpectation)
  }
  const outputStat = await stat(outputJsonPath)
  return {
    outputJson,
    outputJsonPath,
    outputJsonSizeBytes: outputStat.size,
    outputJsonSha256: createHash('sha256').update(rawOutput).digest('hex'),
    stdout: result.stdout,
    stderr: result.stderr,
  }
}

export function assertAiGraphicsRuntimeProofOutput(
  outputJson: unknown,
  expectation: AiGraphicsRuntimeProofExpectation,
): void {
  const root = asRecord(outputJson)
  if (root.ok !== true) {
    throw new Error('AI graphics runtime proof output must include ok=true.')
  }

  const toolId = firstStringValue(root, ['toolId']) ??
    firstStringValue(asRecord(root.runtime), ['toolId'])
  if (toolId !== expectation.expectedToolId) {
    throw new Error(
      `AI graphics runtime proof output toolId mismatch: expected ${expectation.expectedToolId}, got ${toolId ?? 'missing'}.`,
    )
  }

  if (
    expectation.requireCuda === true &&
    firstBooleanValue(outputJson, ['cudaAvailable']) !== true
  ) {
    throw new Error('AI graphics runtime proof output must prove cudaAvailable=true.')
  }

  if (
    expectation.requireCudaExecutionProvider === true &&
    firstBooleanValue(outputJson, ['cudaExecutionProviderAvailable']) !== true
  ) {
    throw new Error(
      'AI graphics runtime proof output must prove cudaExecutionProviderAvailable=true.',
    )
  }

  if (expectation.requireCpuModelRuntime === true) {
    if (firstBooleanValue(outputJson, ['cpuModelRuntimeAllowed']) !== true) {
      throw new Error(
        'AI graphics runtime proof output must prove cpuModelRuntimeAllowed=true.',
      )
    }
    const runtimeDevice = firstStringValueDeep(outputJson, [
      'runtimeDevice',
      'onnxRuntimeDevice',
    ])
    if (typeof runtimeDevice !== 'string' || !/cpu/i.test(runtimeDevice)) {
      throw new Error(
        `AI graphics runtime proof output must prove CPU runtime device; got ${runtimeDevice ?? 'missing'}.`,
      )
    }
    const selectedProviders = firstStringArrayValue(outputJson, [
      'selectedProviders',
    ])
    if (
      selectedProviders &&
      selectedProviders.some((provider) => /cuda/i.test(provider))
    ) {
      throw new Error(
        'AI graphics runtime proof output must not select CUDA providers for CPU model runtime proof.',
      )
    }
  }

  assertFalseProofBoolean(outputJson, expectation.requireNoModelDownload, [
    'modelDownloadedExternally',
    'externalModelDownloadAttempted',
    'modelWeightsDownloaded',
  ])
  assertFalseProofBoolean(outputJson, expectation.requireNoProviderRuntime, [
    'providerRuntimePerformed',
  ])
  assertFalseProofBoolean(outputJson, expectation.requireNoPublicArtifact, [
    'publicArtifactCreated',
  ])
  assertFalseProofBoolean(outputJson, expectation.requireNoSignedUrl, [
    'signedUrlCreated',
  ])
}

function assertFalseProofBoolean(
  outputJson: unknown,
  required: boolean | undefined,
  keys: string[],
): void {
  if (required !== true) return
  const found = firstBooleanValue(outputJson, keys)
  if (found !== false) {
    throw new Error(
      `AI graphics runtime proof output must include ${keys.join('/')}=false.`,
    )
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function firstStringValue(
  record: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string') return value
  }
  return undefined
}

function firstStringValueDeep(value: unknown, keys: string[]): string | undefined {
  const record = asRecord(value)
  for (const key of keys) {
    const direct = record[key]
    if (typeof direct === 'string') return direct
  }

  for (const nested of Object.values(record)) {
    if (!nested || typeof nested !== 'object') continue
    if (Array.isArray(nested)) {
      for (const item of nested) {
        const valueInItem = firstStringValueDeep(item, keys)
        if (typeof valueInItem === 'string') return valueInItem
      }
      continue
    }
    const valueInNested = firstStringValueDeep(nested, keys)
    if (typeof valueInNested === 'string') return valueInNested
  }

  return undefined
}

function firstStringArrayValue(value: unknown, keys: string[]): string[] | undefined {
  const record = asRecord(value)
  for (const key of keys) {
    const direct = record[key]
    if (Array.isArray(direct) && direct.every((item) => typeof item === 'string')) {
      return direct
    }
  }

  for (const nested of Object.values(record)) {
    if (!nested || typeof nested !== 'object') continue
    if (Array.isArray(nested)) {
      for (const item of nested) {
        const valueInItem = firstStringArrayValue(item, keys)
        if (valueInItem) return valueInItem
      }
      continue
    }
    const valueInNested = firstStringArrayValue(nested, keys)
    if (valueInNested) return valueInNested
  }

  return undefined
}

function firstBooleanValue(value: unknown, keys: string[]): boolean | undefined {
  const record = asRecord(value)
  for (const key of keys) {
    const direct = record[key]
    if (typeof direct === 'boolean') return direct
  }

  for (const nested of Object.values(record)) {
    if (!nested || typeof nested !== 'object') continue
    if (Array.isArray(nested)) {
      for (const item of nested) {
        const valueInItem = firstBooleanValue(item, keys)
        if (typeof valueInItem === 'boolean') return valueInItem
      }
      continue
    }
    const valueInNested = firstBooleanValue(nested, keys)
    if (typeof valueInNested === 'boolean') return valueInNested
  }

  return undefined
}

async function runPythonRuntimeOnHost(
  input: {
    args: string[]
    timeoutMs?: number
    extraEnv?: Record<string, string>
  },
  scriptPath: string,
): Promise<{ stdout: string; stderr: string }> {
  const pythonBin = process.env.AI_GRAPHICS_PYTHON_BIN ?? process.env.PYTHON_BIN ?? 'python3'
  return execFileAsync(pythonBin, [scriptPath, ...input.args], {
    cwd: process.cwd(),
    timeout: input.timeoutMs ?? 15 * 60 * 1000,
    windowsHide: true,
    maxBuffer: 32 * 1024 * 1024,
    env: runtimeEnv(input.extraEnv),
  })
}

async function runPythonRuntimeInDockerContainer(
  input: {
    args: string[]
    outputJsonPath: string
    timeoutMs?: number
    extraEnv?: Record<string, string>
    containerImage?: string
    containerPlatform?: string
    containerGpu?: boolean
    containerBindMounts?: AiGraphicsRuntimeContainerBindMount[]
  },
  scriptPath: string,
): Promise<{ stdout: string; stderr: string }> {
  const image = input.containerImage
  if (!image) {
    throw new Error('Docker container runtime requires containerImage.')
  }
  assertSafeRuntimeValue(image, 'containerImage')
  const cwd = process.cwd()
  const containerName = runtimeContainerName()
  const dockerArgs = ['run', '--rm']
  dockerArgs.push('--name', containerName)
  if (input.containerPlatform) {
    assertSafeRuntimeValue(input.containerPlatform, 'containerPlatform')
    dockerArgs.push('--platform', input.containerPlatform)
  }
  if (input.containerGpu !== false) {
    dockerArgs.push('--gpus', 'all')
  }
  for (const [key, value] of Object.entries(containerRuntimeEnv(input.extraEnv))) {
    dockerArgs.push('-e', `${key}=${value}`)
  }
  for (const mount of normalizeContainerBindMounts(
    cwd,
    input.outputJsonPath,
    input.containerBindMounts,
  )) {
    dockerArgs.push('-v', `${mount.hostPath}:${mount.containerPath}:${mount.mode}`)
  }
  dockerArgs.push('-w', cwd, '--entrypoint', 'python3', image, scriptPath, ...input.args)
  return execFileWithRuntimeTimeout('docker', dockerArgs, {
    cwd,
    timeout: input.timeoutMs ?? 15 * 60 * 1000,
    windowsHide: true,
    maxBuffer: 32 * 1024 * 1024,
    env: runtimeEnv(input.extraEnv),
    onTimeout: () => {
      try {
        execFile('docker', ['rm', '-f', containerName], {
          cwd,
          windowsHide: true,
          env: runtimeEnv(input.extraEnv),
        }, () => undefined)
      } catch {
        // Best-effort cleanup; the original timeout error is more useful.
      }
    },
  })
}

function runtimeContainerName(): string {
  return [
    dockerContainerNamePrefix,
    String(process.pid),
    String(Date.now()),
    Math.random().toString(16).slice(2),
  ].join('-').replace(/[^a-zA-Z0-9_.-]/g, '-').slice(0, 120)
}

function execFileWithRuntimeTimeout(
  command: string,
  args: string[],
  options: {
    cwd: string
    timeout: number
    windowsHide: boolean
    maxBuffer: number
    env: NodeJS.ProcessEnv
    onTimeout?: () => void
  },
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      windowsHide: options.windowsHide,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    const stdoutChunks: Buffer[] = []
    const stderrChunks: Buffer[] = []
    let stdoutBytes = 0
    let stderrBytes = 0
    let settled = false
    let timedOut = false
    let sigkillTimer: NodeJS.Timeout | null = null

    const cleanup = () => {
      if (timer) clearTimeout(timer)
      if (sigkillTimer) clearTimeout(sigkillTimer)
    }
    const fail = (error: Error) => {
      if (settled) return
      settled = true
      cleanup()
      reject(error)
    }
    const append = (
      chunks: Buffer[],
      currentBytes: number,
      chunk: Buffer,
      label: 'stdout' | 'stderr',
    ): number => {
      const nextBytes = currentBytes + chunk.length
      if (nextBytes > options.maxBuffer) {
        child.kill('SIGTERM')
        fail(new Error(`${command} ${label} exceeded maxBuffer`))
        return currentBytes
      }
      chunks.push(chunk)
      return nextBytes
    }

    const timer = setTimeout(() => {
      timedOut = true
      options.onTimeout?.()
      child.kill('SIGTERM')
      sigkillTimer = setTimeout(() => {
        if (!settled) child.kill('SIGKILL')
      }, 2_000)
    }, options.timeout)

    child.stdout?.on('data', (chunk: Buffer) => {
      stdoutBytes = append(stdoutChunks, stdoutBytes, chunk, 'stdout')
    })
    child.stderr?.on('data', (chunk: Buffer) => {
      stderrBytes = append(stderrChunks, stderrBytes, chunk, 'stderr')
    })
    child.on('error', fail)
    child.on('close', (code, signal) => {
      if (settled) return
      settled = true
      cleanup()
      const stdout = Buffer.concat(stdoutChunks).toString('utf8')
      const stderr = Buffer.concat(stderrChunks).toString('utf8')
      if (timedOut) {
        const error = new Error(
          `${command} timed out after ${options.timeout}ms`,
        ) as Error & {
          code?: string
          signal?: NodeJS.Signals | null
          stdout?: string
          stderr?: string
        }
        error.code = 'ETIMEDOUT'
        error.signal = signal
        error.stdout = stdout
        error.stderr = stderr
        reject(error)
        return
      }
      if (code !== 0) {
        const error = new Error(
          `${command} exited with code ${code ?? 'null'}`,
        ) as Error & {
          code?: number | null
          signal?: NodeJS.Signals | null
          stdout?: string
          stderr?: string
        }
        error.code = code
        error.signal = signal
        error.stdout = stdout
        error.stderr = stderr
        reject(error)
        return
      }
      resolve({ stdout, stderr })
    })
  })
}

export function buildAiGraphicsRuntimeContainerBindMounts(input: {
  readOnlyPaths?: Array<string | undefined>
  readWritePaths?: Array<string | undefined>
}): AiGraphicsRuntimeContainerBindMount[] {
  const mounts: AiGraphicsRuntimeContainerBindMount[] = []
  for (const candidate of input.readOnlyPaths ?? []) {
    if (candidate) {
      mounts.push({
        hostPath: bindMountDirectoryForPath(candidate),
        mode: 'ro',
      })
    }
  }
  for (const candidate of input.readWritePaths ?? []) {
    if (candidate) {
      mounts.push({
        hostPath: bindMountDirectoryForPath(candidate),
        mode: 'rw',
      })
    }
  }
  return mounts
}

function bindMountDirectoryForPath(candidate: string): string {
  assertSafeRuntimeValue(candidate, 'containerBindMountPath')
  const resolved = path.resolve(candidate)
  assertSafeRuntimeValue(resolved, 'containerBindMountPath')
  if (resolved === path.parse(resolved).root) {
    throw new Error('containerBindMountPath cannot be the filesystem root.')
  }
  if (existsSync(resolved)) {
    const existing = statSync(resolved)
    return existing.isDirectory() ? resolved : path.dirname(resolved)
  }
  return path.extname(resolved) ? path.dirname(resolved) : resolved
}

function normalizeContainerBindMounts(
  cwd: string,
  outputJsonPath: string,
  mounts: AiGraphicsRuntimeContainerBindMount[] | undefined,
): Required<AiGraphicsRuntimeContainerBindMount>[] {
  const normalized = new Map<string, Required<AiGraphicsRuntimeContainerBindMount>>()
  const addMount = (mount: AiGraphicsRuntimeContainerBindMount) => {
    assertSafeRuntimeValue(mount.hostPath, 'containerBindMountHostPath')
    const hostPath = path.resolve(mount.hostPath)
    assertSafeRuntimeValue(hostPath, 'containerBindMountHostPath')
    if (hostPath === path.parse(hostPath).root) {
      throw new Error('containerBindMountHostPath cannot be the filesystem root.')
    }
    const containerPath = mount.containerPath
      ? path.resolve(mount.containerPath)
      : hostPath
    assertSafeRuntimeValue(containerPath, 'containerBindMountContainerPath')
    const mode = mount.mode === 'ro' ? 'ro' : 'rw'
    const key = `${hostPath}\0${containerPath}`
    const existing = normalized.get(key)
    normalized.set(key, {
      hostPath,
      containerPath,
      mode: existing?.mode === 'rw' || mode === 'rw' ? 'rw' : 'ro',
    })
  }

  addMount({ hostPath: cwd, containerPath: cwd, mode: 'ro' })
  addMount({
    hostPath: bindMountDirectoryForPath(outputJsonPath),
    containerPath: bindMountDirectoryForPath(outputJsonPath),
    mode: 'rw',
  })
  for (const mount of mounts ?? []) addMount(mount)
  return [...normalized.values()]
}

function runtimeEnv(extraEnv?: Record<string, string>): NodeJS.ProcessEnv {
  return {
    ...process.env,
    HF_DATASETS_OFFLINE: '1',
    HF_HUB_OFFLINE: '1',
    MODEL_DOWNLOADS_ENABLED: 'false',
    NUMBA_DISABLE_JIT: '1',
    PROVIDER_EXECUTION_ENABLED: 'false',
    PYTHONUNBUFFERED: '1',
    REAL_MEDIA_INPUT_ENABLED: 'false',
    TRANSFORMERS_OFFLINE: '1',
    ...extraEnv,
  }
}

function containerRuntimeEnv(extraEnv?: Record<string, string>): Record<string, string> {
  return {
    HF_DATASETS_OFFLINE: '1',
    HF_HUB_OFFLINE: '1',
    MODEL_DOWNLOADS_ENABLED: 'false',
    NUMBA_DISABLE_JIT: '1',
    PROVIDER_EXECUTION_ENABLED: 'false',
    PYTHONUNBUFFERED: '1',
    REAL_MEDIA_INPUT_ENABLED: 'false',
    TRANSFORMERS_OFFLINE: '1',
    ...extraEnv,
  }
}

function assertSafeRuntimeValue(value: string, label: string): void {
  if (value.includes('\0')) {
    throw new Error(`${label} contains a null byte.`)
  }
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) {
    throw new Error(`${label} must be a local/private filesystem path or command argument, not a URL.`)
  }
}
