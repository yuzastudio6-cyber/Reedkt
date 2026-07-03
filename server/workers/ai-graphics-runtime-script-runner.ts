import { execFile } from 'node:child_process'
import { existsSync, statSync } from 'node:fs'
import { mkdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export interface AiGraphicsRuntimeScriptResult {
  outputJson: unknown
  outputJsonPath: string
  outputJsonSizeBytes: number
  stdout: string
  stderr: string
}

export type AiGraphicsPythonRuntimeBackend = 'host_python' | 'docker_container'

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
  const outputStat = await stat(outputJsonPath)
  return {
    outputJson,
    outputJsonPath,
    outputJsonSizeBytes: outputStat.size,
    stdout: result.stdout,
    stderr: result.stderr,
  }
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
  const dockerArgs = ['run', '--rm']
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
  for (const mount of normalizeContainerBindMounts(cwd, input.containerBindMounts)) {
    dockerArgs.push('-v', `${mount.hostPath}:${mount.containerPath}:${mount.mode}`)
  }
  dockerArgs.push('-w', cwd, '--entrypoint', 'python3', image, scriptPath, ...input.args)
  return execFileAsync('docker', dockerArgs, {
    cwd,
    timeout: input.timeoutMs ?? 15 * 60 * 1000,
    windowsHide: true,
    maxBuffer: 32 * 1024 * 1024,
    env: runtimeEnv(input.extraEnv),
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

  addMount({ hostPath: cwd, containerPath: cwd, mode: 'rw' })
  for (const mount of mounts ?? []) addMount(mount)
  return [...normalized.values()]
}

function runtimeEnv(extraEnv?: Record<string, string>): NodeJS.ProcessEnv {
  return {
    ...process.env,
    HF_DATASETS_OFFLINE: '1',
    HF_HUB_OFFLINE: '1',
    MODEL_DOWNLOADS_ENABLED: 'false',
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
