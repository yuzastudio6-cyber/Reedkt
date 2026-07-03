import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
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
  dockerArgs.push(
    '-v',
    `${cwd}:${cwd}`,
    '-w',
    cwd,
    '--entrypoint',
    'python3',
    image,
    scriptPath,
    ...input.args,
  )
  return execFileAsync('docker', dockerArgs, {
    cwd,
    timeout: input.timeoutMs ?? 15 * 60 * 1000,
    windowsHide: true,
    maxBuffer: 32 * 1024 * 1024,
    env: runtimeEnv(input.extraEnv),
  })
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
