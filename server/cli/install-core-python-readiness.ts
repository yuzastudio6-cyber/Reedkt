import { existsSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)))
const venvDir = resolve(readArg('--venv-dir') ?? '.reeditpro-tool-readiness-python')
const requirementsPath = resolve(readArg('--requirements') ?? 'docker/prod/tool-readiness-worker/requirements.readiness.txt')
const python = readArg('--python') ?? process.env.PYTHON_BIN ?? 'python3'
const venvPython = join(venvDir, 'bin', 'python')

if (!requirementsPath.startsWith(repoRoot)) {
  throw new Error(`Requirements file must be inside the repository: ${requirementsPath}`)
}

if (!existsSync(requirementsPath)) {
  throw new Error(`Requirements file does not exist: ${requirementsPath}`)
}

mkdirSync(venvDir, { recursive: true })

if (!existsSync(venvPython)) {
  run(python, ['-m', 'venv', venvDir], 'create readiness virtualenv')
}

run(venvPython, ['-m', 'pip', 'install', '--upgrade', 'pip', 'setuptools', 'wheel'], 'upgrade readiness pip tooling')
run(venvPython, ['-m', 'pip', 'install', '--no-cache-dir', '-r', requirementsPath], 'install core Python readiness requirements')

console.log(JSON.stringify({
  ok: true,
  venvDir,
  python: venvPython,
  requirementsPath,
  notes: [
    'Installed only the local core tool-readiness Python virtualenv.',
    'No media processing, provider calls, Docker build/run, Supabase/GCS mutation, beta activation, or production enablement occurred.',
  ],
}, null, 2))

function readArg(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function run(command: string, args: string[], label: string): void {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      PIP_DISABLE_PIP_VERSION_CHECK: '1',
    },
  })

  if (result.error) {
    throw result.error
  }
  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status ?? 'unknown'}.`)
  }
}
