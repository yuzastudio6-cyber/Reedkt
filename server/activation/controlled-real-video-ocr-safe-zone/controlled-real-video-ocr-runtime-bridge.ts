import { execFile } from 'node:child_process'
import { access, copyFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export interface ControlledRealVideoOcrWorkerInput {
  python: string
  runId: string
  localRoot: string
  reportDir: string
  frameDir: string
  videoPath: string
  detectionModelDir: string
  recognitionModelDir: string
  dictionaryPath: string
  assetVerificationPath: string
  sampleManifestPath: string
  executionPlanPath: string
  offsetsSeconds: number[]
}

export async function ensureControlledRealVideoOcrRuntimeVenv(localRoot: string): Promise<string> {
  const venvDir = path.join(localRoot, 'venv')
  const python = path.join(venvDir, 'bin', 'python')
  const basePython = await resolveControlledRealVideoOcrPython()
  await runCommand(basePython, ['-m', 'venv', venvDir], 5 * 60 * 1000)
  await runCommand(python, ['-m', 'pip', 'install', '--upgrade', 'pip', 'setuptools', 'wheel'], 10 * 60 * 1000)
  try {
    await runCommand(python, ['-m', 'pip', 'install', '-r', 'server/workers/ocr-runtime/requirements.ocr.txt'], 45 * 60 * 1000)
  } catch (error) {
    await runCommand(python, ['-m', 'pip', 'install', '--no-deps', '-r', 'server/workers/ocr-runtime/requirements.ocr.txt'], 45 * 60 * 1000)
    await runCommand(python, ['-m', 'pip', 'install', '--no-deps', 'paddlex==3.0.0'], 10 * 60 * 1000)
    await runCommand(python, ['-m', 'pip', 'install', '-r', 'server/workers/ocr-runtime/requirements.ocr-transitive-macos-py312.txt'], 45 * 60 * 1000)
    const maybe = error as { stderr?: string }
    if (maybe.stderr) {
      await writeFile(path.join(localRoot, 'phase37d-pip-resolver-fallback.json'), `${JSON.stringify({
        phase: '37D',
        fallback: 'direct_pins_plus_curated_transitives',
        reason: maybe.stderr.slice(0, 3000),
      }, null, 2)}\n`, 'utf8')
    }
  }
  await seedPaddleXFonts(python)
  return python
}

export async function runControlledRealVideoOcrWorker(input: ControlledRealVideoOcrWorkerInput): Promise<{
  stdout: string
  stderr: string
}> {
  return runCommandWithStderr(input.python, [
    'server/workers/ocr-runtime/run-controlled-real-video-ocr-safe-zone.py',
    '--run-id',
    input.runId,
    '--output-dir',
    input.reportDir,
    '--frame-dir',
    input.frameDir,
    '--video-path',
    input.videoPath,
    '--det-model-dir',
    input.detectionModelDir,
    '--rec-model-dir',
    input.recognitionModelDir,
    '--dict-path',
    input.dictionaryPath,
    '--asset-verification-path',
    input.assetVerificationPath,
    '--sample-manifest-path',
    input.sampleManifestPath,
    '--execution-plan-path',
    input.executionPlanPath,
    '--offsets',
    input.offsetsSeconds.join(','),
  ], 60 * 60 * 1000, input.localRoot)
}

async function resolveControlledRealVideoOcrPython(): Promise<string> {
  const candidates = [
    process.env.REEDITPRO_OCR_RUNTIME_PYTHON,
    '/Users/macuser/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3',
    'python3',
  ].filter(Boolean) as string[]
  for (const candidate of candidates) {
    if (candidate.includes('/')) {
      try {
        await access(candidate)
        return candidate
      } catch {
        continue
      }
    }
    return candidate
  }
  return 'python3'
}

async function seedPaddleXFonts(python: string): Promise<void> {
  const sitePackages = (await runCommand(python, ['-c', 'import site; print(site.getsitepackages()[0])'], 60 * 1000)).trim()
  const fontDir = path.join(sitePackages, 'paddlex', 'utils', 'fonts')
  await mkdir(fontDir, { recursive: true })
  const sourceFont = await firstExistingPath([
    '/System/Library/Fonts/Supplemental/Arial.ttf',
    '/System/Library/Fonts/Supplemental/Helvetica.ttf',
    '/Library/Fonts/Arial.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  ])
  if (!sourceFont) return
  await copyFile(sourceFont, path.join(fontDir, 'PingFang-SC-Regular.ttf'))
  await copyFile(sourceFont, path.join(fontDir, 'simfang.ttf'))
}

async function firstExistingPath(candidates: string[]): Promise<string | undefined> {
  for (const candidate of candidates) {
    try {
      await access(candidate)
      return candidate
    } catch {
      continue
    }
  }
  return undefined
}

async function runCommand(command: string, args: string[], timeout = 10 * 60 * 1000): Promise<string> {
  const { stdout } = await execFileAsync(command, args, {
    timeout,
    maxBuffer: 120 * 1024 * 1024,
    env: {
      ...process.env,
      CLOUDSDK_CORE_DISABLE_PROMPTS: '1',
    },
  })
  return stdout
}

async function runCommandWithStderr(command: string, args: string[], timeout: number, localRoot: string): Promise<{
  stdout: string
  stderr: string
}> {
  const { stdout, stderr } = await execFileAsync(command, args, {
    timeout,
    maxBuffer: 180 * 1024 * 1024,
    env: {
      ...process.env,
      CLOUDSDK_CORE_DISABLE_PROMPTS: '1',
      PYTHONUNBUFFERED: '1',
      CUDA_VISIBLE_DEVICES: '',
      PADDLEOCR_HOME: path.join(localRoot, '.paddleocr-home'),
      PADDLE_HOME: path.join(localRoot, '.paddle-home'),
      HF_HUB_OFFLINE: '1',
      TRANSFORMERS_OFFLINE: '1',
      MODEL_DOWNLOADS_ENABLED: 'false',
      ARBITRARY_MEDIA_ENABLED: 'false',
      PROVIDER_EXECUTION_ENABLED: 'false',
      PUBLIC_OUTPUT_ENABLED: 'false',
      TRACK_A_EXECUTION_ENABLED: 'false',
    },
  })
  return { stdout, stderr }
}
