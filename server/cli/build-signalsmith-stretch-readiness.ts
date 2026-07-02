import { copyFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)))
const outputDir = resolve(readArg('--output-dir') ?? '.reeditpro-tool-readiness-bin')
const workDir = resolve(readArg('--work-dir') ?? '/private/tmp/reeditpro-signalsmith-stretch-readiness-build')
const outputBinary = join(outputDir, 'signalsmith-stretch')
const reportPath = join(outputDir, 'signalsmith-stretch-build-report.json')

const stretchRepo = 'https://github.com/Signalsmith-Audio/signalsmith-stretch'
const stretchCommit = '57b93f4e9206a089a45387eaa39bdc9f310d3308'
const linearRepo = 'https://github.com/Signalsmith-Audio/linear.git'
const linearCommit = '5668673560146a9cfe38c25315071e3fd68c8317'
const developerDir = process.env.REEDITPRO_DEVELOPER_DIR ?? '/Library/Developer/CommandLineTools'

if (process.env.REEDITPRO_CONFIRM_SIGNALSMITH_STRETCH_SOURCE_BUILD !== 'true') {
  throw new Error('Set REEDITPRO_CONFIRM_SIGNALSMITH_STRETCH_SOURCE_BUILD=true to run the bounded Signalsmith source build.')
}

if (!outputDir.startsWith(repoRoot)) {
  throw new Error(`Output directory must stay inside the repository so .gitignore can protect generated binaries: ${outputDir}`)
}

const startedAt = new Date().toISOString()
const stretchDir = join(workDir, 'signalsmith-stretch')
const linearDir = join(workDir, 'signalsmith-linear')
const builtBinary = join(stretchDir, 'cmd', 'out', 'stretch')

rmSync(workDir, { recursive: true, force: true })
mkdirSync(workDir, { recursive: true })
mkdirSync(outputDir, { recursive: true })

run('git', ['clone', '--recurse-submodules', stretchRepo, stretchDir], 'clone Signalsmith Stretch')
run('git', ['checkout', stretchCommit], 'checkout Signalsmith Stretch commit', stretchDir)
run('git', ['clone', linearRepo, linearDir], 'clone Signalsmith Linear')
run('git', ['checkout', linearCommit], 'checkout Signalsmith Linear commit', linearDir)

mkdirSync(join(stretchDir, 'cmd', 'out'), { recursive: true })
const compilerArgs = [
  '-std=c++11',
  '-O3',
  '-g',
  '-Wall',
  '-Wextra',
  '-Wfatal-errors',
  '-Wpedantic',
  '-pedantic-errors',
  ...(process.platform === 'darwin' ? ['-framework', 'Accelerate', '-DSIGNALSMITH_USE_ACCELERATE'] : []),
  '-I',
  join(stretchDir, 'include'),
  '-I',
  join(linearDir, 'include'),
  join(stretchDir, 'cmd', 'main.cpp'),
  '-o',
  builtBinary,
]

run(process.env.CXX ?? 'g++', compilerArgs, 'compile Signalsmith Stretch command')
run(builtBinary, ['--help'], 'run Signalsmith Stretch help shape')
copyFileSync(builtBinary, outputBinary)

const report = {
  ok: true,
  toolId: 'signalsmith_stretch',
  outputBinary: relativeToRepo(outputBinary),
  source: {
    stretchRepo,
    stretchCommit,
    linearRepo,
    linearCommit,
  },
  command: basename(outputBinary),
  proof: {
    compiled: true,
    helpShapeChecked: true,
    processedAudio: false,
    dockerBuilt: false,
    supabaseTouched: false,
    betaOrProductionEnabled: false,
  },
  startedAt,
  finishedAt: new Date().toISOString(),
}

writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify(report, null, 2))

function readArg(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function relativeToRepo(path: string): string {
  return path.startsWith(`${repoRoot}/`) ? path.slice(repoRoot.length + 1) : path
}

function run(command: string, args: string[], label: string, cwd = repoRoot): void {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      DEVELOPER_DIR: developerDir,
    },
  })

  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status ?? 'unknown'}: ${clean(result.stderr) || clean(result.stdout)}`)
  }
  if (label.includes('help')) {
    const output = `${result.stdout}\n${result.stderr}`
    if (!/Usage\s+stretch|stretch\s+<input\.wav>/i.test(output)) {
      throw new Error(`Signalsmith help output did not match expected shape: ${clean(output)}`)
    }
  }
}

function clean(value: string | undefined): string {
  return String(value ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4)
    .join(' | ')
    .slice(0, 600)
}
