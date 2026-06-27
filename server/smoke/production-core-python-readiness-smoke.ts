import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { runProductionToolReadiness } from '../workers/production-readiness'

function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

const venvPython = resolve(process.env.REEDITPRO_READINESS_PYTHON_BIN ?? '.reeditpro-tool-readiness-python/bin/python')

check(existsSync(venvPython), `Core Python readiness virtualenv is missing. Run npm run tools:readiness:install-core-python first. Expected ${venvPython}`)

process.env.REEDITPRO_READINESS_PYTHON_BIN = venvPython

const report = runProductionToolReadiness({ realCheckMode: true })
const statusByTool = new Map(report.results.map((result) => [result.toolId, result.status]))
const expectedPassedPythonTools = [
  'pyav',
  'pyscenedetect',
  'opencv',
  'duckdb',
  'polars',
  'opentimelineio',
  'opencolorio',
  'openimageio',
] as const

for (const toolId of expectedPassedPythonTools) {
  check(statusByTool.get(toolId) === 'passed', `${toolId} should pass Python import readiness from ${venvPython}.`)
}

check(statusByTool.get('ffmpeg') === 'passed', 'ffmpeg command readiness should still pass.')
check(statusByTool.get('ffprobe') === 'passed', 'ffprobe command readiness should still pass.')
check(statusByTool.get('sharp') === 'passed', 'sharp metadata readiness should still pass.')
check(statusByTool.get('remotion') === 'passed', 'remotion metadata readiness should still pass.')
check(statusByTool.get('hyperframe') !== 'passed', 'Hyperframe should not be claimed by this Python readiness lane.')

console.log(JSON.stringify({
  ok: true,
  venvPython,
  passedPythonTools: expectedPassedPythonTools,
  statuses: Object.fromEntries([...statusByTool.entries()].sort()),
  notes: [
    'Core Python readiness smoke imports packages only.',
    'No media processing, provider calls, Docker build/run, Supabase/GCS mutation, beta activation, or production enablement occurred.',
  ],
}, null, 2))
