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

export async function runAiGraphicsPythonRuntimeScript(input: {
  scriptRelativePath: string
  args: string[]
  outputJsonPath: string
  timeoutMs?: number
  extraEnv?: Record<string, string>
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

  const pythonBin = process.env.AI_GRAPHICS_PYTHON_BIN ?? process.env.PYTHON_BIN ?? 'python3'
  const result = await execFileAsync(pythonBin, [scriptPath, ...input.args], {
    cwd: process.cwd(),
    timeout: input.timeoutMs ?? 15 * 60 * 1000,
    windowsHide: true,
    maxBuffer: 32 * 1024 * 1024,
    env: {
      ...process.env,
      HF_DATASETS_OFFLINE: '1',
      HF_HUB_OFFLINE: '1',
      MODEL_DOWNLOADS_ENABLED: 'false',
      PROVIDER_EXECUTION_ENABLED: 'false',
      PYTHONUNBUFFERED: '1',
      REAL_MEDIA_INPUT_ENABLED: 'false',
      TRANSFORMERS_OFFLINE: '1',
      ...input.extraEnv,
    },
  })

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

function assertSafeRuntimeValue(value: string, label: string): void {
  if (value.includes('\0')) {
    throw new Error(`${label} contains a null byte.`)
  }
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) {
    throw new Error(`${label} must be a local/private filesystem path or command argument, not a URL.`)
  }
}
