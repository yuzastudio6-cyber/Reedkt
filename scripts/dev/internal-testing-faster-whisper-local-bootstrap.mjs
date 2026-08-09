#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(scriptDir, '..', '..')
const confirmed = process.env.REEDITPRO_CONFIRM_INTERNAL_TESTING_FASTER_WHISPER_LOCAL_BOOTSTRAP === 'true'
const runtimeRoot = resolve(process.env.REEDITPRO_INTERNAL_TESTING_FASTER_WHISPER_RUNTIME_ROOT?.trim() || '/private/tmp/reeditpro-internal-testing-faster-whisper-runtime')
const venvDir = join(runtimeRoot, 'venv')
const defaultVenvPython = process.platform === 'win32' ? join(venvDir, 'Scripts', 'python.exe') : join(venvDir, 'bin', 'python')
const modelPath = resolve(process.env.REEDITPRO_INTERNAL_TESTING_FASTER_WHISPER_MODEL_PATH?.trim() || '/private/tmp/reeditpro-approved-local-models/faster-whisper-small')
const manifestPath = resolve(process.env.REEDITPRO_INTERNAL_TESTING_FASTER_WHISPER_MODEL_MANIFEST_PATH?.trim() || '/private/tmp/reeditpro-approved-local-models/faster-whisper-small.manifest.json')
const packageSpec = process.env.REEDITPRO_INTERNAL_TESTING_FASTER_WHISPER_PACKAGE_SPEC?.trim() || 'faster-whisper==1.2.1'
const modelRepo = process.env.REEDITPRO_INTERNAL_TESTING_FASTER_WHISPER_MODEL_REPO?.trim() || 'Systran/faster-whisper-small'
const modelRevision = process.env.REEDITPRO_INTERNAL_TESTING_FASTER_WHISPER_MODEL_REVISION?.trim() || 'main'
const basePython = resolvePythonCommand(process.env.REEDITPRO_INTERNAL_TESTING_FASTER_WHISPER_BOOTSTRAP_PYTHON?.trim())
const expectedFiles = ['config.json', 'model.bin', 'tokenizer.json', 'vocabulary.txt']

if (!confirmed) {
  throw new Error('Set REEDITPRO_CONFIRM_INTERNAL_TESTING_FASTER_WHISPER_LOCAL_BOOTSTRAP=true to create the local faster-whisper runtime/model bootstrap.')
}

if (modelRepo !== 'Systran/faster-whisper-small') {
  throw new Error('Only Systran/faster-whisper-small is approved for this internal-testing bootstrap.')
}
if (packageSpec !== 'faster-whisper==1.2.1') {
  throw new Error('Only faster-whisper==1.2.1 is approved for this internal-testing bootstrap.')
}
assertOutsideRepo(runtimeRoot, 'runtimeRoot')
assertOutsideRepo(modelPath, 'modelPath')
assertOutsideRepo(manifestPath, 'manifestPath')
assertNoSecretLikeText([runtimeRoot, modelPath, manifestPath, modelRepo, packageSpec].join('\n'))

console.log(JSON.stringify({
  ok: true,
  command: 'prepare:internal-testing:faster-whisper-local-bootstrap',
  scope: 'explicit local bootstrap only; normal acceptance still forbids package/model downloads',
  packageSpec,
  modelRepo,
  modelRevision,
  runtimeRoot,
  modelPath,
  manifestPath,
  blockedProductScope: {
    providerCalls: false,
    liveQwenCalls: false,
    supabaseWrites: false,
    gcsWrites: false,
    publicDelivery: false,
    finalExport: false,
    externalBeta: false,
    paidProduction: false,
  },
}, null, 2))

await mkdir(runtimeRoot, { recursive: true })
await mkdir(dirname(modelPath), { recursive: true })
await mkdir(dirname(manifestPath), { recursive: true })

if (!existsSync(defaultVenvPython)) {
  await run(basePython, ['-m', 'venv', venvDir], {
    DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
  })
}

await run(defaultVenvPython, ['-m', 'pip', 'install', '--upgrade', 'pip'], {
  DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
  PIP_DISABLE_PIP_VERSION_CHECK: '1',
})
await run(defaultVenvPython, ['-m', 'pip', 'install', packageSpec], {
  DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
  PIP_DISABLE_PIP_VERSION_CHECK: '1',
})

await run(defaultVenvPython, ['-c', 'from faster_whisper import WhisperModel; print("faster_whisper_api_ready")'], {
  DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
})

const downloadResult = await runCapture(defaultVenvPython, ['-c', buildSnapshotDownloadPython(), modelRepo, modelRevision, modelPath], {
  DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
  HF_HOME: join(runtimeRoot, 'huggingface-cache'),
  HF_HUB_DISABLE_TELEMETRY: '1',
})
const snapshot = JSON.parse(downloadResult.stdout.trim())

// huggingface_hub writes local-dir bookkeeping below .cache even when the
// requested model payload is fully pinned. Those mutable download records are
// not runtime model inputs and must not enter the reviewed model manifest.
// Remove only that exact downloader-owned directory before checking and
// hashing the four allowlisted runtime files.
await rm(join(modelPath, '.cache'), { recursive: true, force: true })

for (const expectedFile of expectedFiles) {
  const fullPath = join(modelPath, expectedFile)
  if (!existsSync(fullPath)) throw new Error(`Expected model file is missing after bootstrap: ${expectedFile}`)
}
const actualFiles = listFiles(modelPath)
  .map((filePath) => filePath.slice(modelPath.length + 1))
  .sort()
if (JSON.stringify(actualFiles) !== JSON.stringify([...expectedFiles].sort())) {
  throw new Error('Downloaded model directory contains unreviewed runtime files.')
}

const modelDirectorySha256 = hashDirectory(modelPath)
const approvedAt = new Date().toISOString()
const manifest = {
  manifestVersion: 'reeditpro-internal-testing-faster-whisper-model-v1',
  toolId: 'faster_whisper',
  modelName: modelRepo,
  modelVersion: snapshot.resolvedSha ?? modelRevision,
  source: `https://huggingface.co/${modelRepo}`,
  license: 'mit',
  commercialUseStatus: 'internal_testing_only',
  approvedForInternalTesting: true,
  approvedBy: 'local-operator-explicit-bootstrap',
  approvedAt,
  localModelPath: modelPath,
  allowModelDownload: false,
  redistributionAllowed: false,
  requiresAttribution: false,
  riskNotes: [
    'Explicit local bootstrap for ReEditPro internal testing only.',
    'Normal acceptance commands still forbid package/model downloads.',
    'This manifest does not approve production model weights, public delivery, paid production, or redistribution.',
  ],
  expectedFiles,
  modelDirectorySha256,
}

assertNoSecretLikeText(JSON.stringify(manifest))
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')

console.log(JSON.stringify({
  ok: true,
  status: 'internal_testing_faster_whisper_local_bootstrap_ready',
  pythonCommand: defaultVenvPython,
  modelPath,
  manifestPath,
  modelRepo: snapshot.repoId,
  modelRevision: snapshot.resolvedSha ?? snapshot.revision,
  expectedFiles,
  modelDirectorySha256: `${modelDirectorySha256.slice(0, 12)}...`,
  nextEnvironment: {
    REEDITPRO_INTERNAL_TESTING_FASTER_WHISPER_PYTHON_COMMAND: defaultVenvPython,
    REEDITPRO_INTERNAL_TESTING_FASTER_WHISPER_MODEL_PATH: modelPath,
    REEDITPRO_INTERNAL_TESTING_FASTER_WHISPER_MODEL_MANIFEST_PATH: manifestPath,
  },
}, null, 2))

function resolvePythonCommand(configured) {
  if (configured) return configured
  const commandLineToolsPython = '/usr/bin/python3'
  if (process.platform !== 'win32' && existsSync(commandLineToolsPython)) return commandLineToolsPython
  return process.platform === 'win32' ? 'python' : 'python3'
}

function assertOutsideRepo(targetPath, label) {
  if (!isAbsolute(targetPath)) throw new Error(`${label} must be an absolute path.`)
  const relative = targetPath.startsWith(repoRoot)
  if (relative) throw new Error(`${label} must stay outside the repository: ${targetPath}`)
}

function assertNoSecretLikeText(value) {
  if (/signed_url|supabase_service_role|api[_-]?key|secret|public_url|x-goog-signature/i.test(value)) {
    throw new Error('Bootstrap metadata contains forbidden secret/signed-url-like text.')
  }
}

function run(command, args, extraEnv = {}) {
  return new Promise((resolveRun, reject) => {
    console.log(`[run] ${command} ${args.map(sanitizeArg).join(' ')}`)
    const child = spawn(command, args, {
      cwd: repoRoot,
      env: { ...process.env, ...extraEnv },
      stdio: 'inherit',
    })
    child.on('exit', (code, signal) => {
      if (code === 0) resolveRun()
      else reject(new Error(`${command} ${args[0] ?? ''} failed with ${signal ?? code}.`))
    })
  })
}

function runCapture(command, args, extraEnv = {}) {
  return new Promise((resolveRun, reject) => {
    console.log(`[run] ${command} ${args.slice(0, 2).map(sanitizeArg).join(' ')} ...`)
    const child = spawn(command, args, {
      cwd: repoRoot,
      env: { ...process.env, ...extraEnv },
      stdio: ['ignore', 'pipe', 'inherit'],
    })
    let stdout = ''
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
    })
    child.on('exit', (code, signal) => {
      if (code === 0) resolveRun({ stdout })
      else reject(new Error(`${command} ${args[0] ?? ''} failed with ${signal ?? code}.`))
    })
  })
}

function sanitizeArg(arg) {
  if (arg.length > 96) return `${arg.slice(0, 96)}...`
  return arg
}

function buildSnapshotDownloadPython() {
  return String.raw`
import json
import sys

from huggingface_hub import HfApi, snapshot_download

repo_id = sys.argv[1]
revision = sys.argv[2]
local_dir = sys.argv[3]
allow_patterns = ["config.json", "model.bin", "tokenizer.json", "vocabulary.txt", "preprocessor_config.json"]

info = HfApi().model_info(repo_id=repo_id, revision=revision)
snapshot_download(
    repo_id=repo_id,
    revision=revision,
    local_dir=local_dir,
    local_dir_use_symlinks=False,
    allow_patterns=allow_patterns,
)

print(json.dumps({
    "repoId": repo_id,
    "revision": revision,
    "resolvedSha": getattr(info, "sha", None),
    "localDir": local_dir,
}))
`
}

function hashDirectory(directoryPath) {
  const hash = createHash('sha256')
  for (const filePath of listFiles(directoryPath).sort()) {
    const relativePath = filePath.slice(directoryPath.length + 1)
    hash.update(relativePath)
    hash.update(createHash('sha256').update(readFileSync(filePath)).digest('hex'))
  }
  return hash.digest('hex')
}

function listFiles(root) {
  const entries = readdirSync(root)
  const files = []
  for (const entry of entries) {
    const fullPath = join(root, entry)
    const stats = statSync(fullPath)
    if (stats.isDirectory()) files.push(...listFiles(fullPath))
    if (stats.isFile()) files.push(fullPath)
  }
  return files
}
