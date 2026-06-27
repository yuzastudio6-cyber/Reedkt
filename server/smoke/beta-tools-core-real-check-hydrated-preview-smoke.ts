import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import {
  runBetaToolsCoreRealCheckHydratedPreview,
  type BetaToolsCoreRealCheckHydratedPreviewEnv,
} from '../cli/beta-tools-core-real-check-hydrated-preview'

const baseEnv: BetaToolsCoreRealCheckHydratedPreviewEnv = {
  REEDITPRO_BETA_TOOLS_PREVIEW_WORKSPACE_ID: 'workspace-core-real-check-hydrated-preview-smoke',
  REEDITPRO_BETA_TOOLS_PREVIEW_PROJECT_ID: 'project-core-real-check-hydrated-preview-smoke',
  REEDITPRO_BETA_TOOLS_PREVIEW_SOURCE_ID: 'beta-tools-core-real-check-hydrated-preview-smoke',
  REEDITPRO_BETA_TOOLS_PREVIEW_SOURCE_SHA: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  REEDITPRO_BETA_TOOLS_PREVIEW_NOTES: 'Local hydrated preview smoke for bounded Hyperframe metadata evidence.',
  REEDITPRO_BETA_TOOLS_PREVIEW_TOOL_IDS: 'hyperframe',
  REEDITPRO_BETA_TOOLS_PREVIEW_INCLUDE_WARNINGS: 'false',
  REEDITPRO_BETA_TOOLS_PREVIEW_ACCEPT_PRODUCTION_READINESS: 'true',
  REEDITPRO_BETA_TOOLS_PREVIEW_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE: 'true',
  REEDITPRO_BETA_TOOLS_PREVIEW_ACCEPT_PRODUCT_READY_LOCAL_OSS: 'true',
  REEDITPRO_BETA_TOOLS_PREVIEW_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE: 'true',
  REEDITPRO_BETA_TOOLS_PREVIEW_REQUIRE_ACCEPTED_EVIDENCE: 'true',
}

const missingReport = runBetaToolsCoreRealCheckHydratedPreview({
  ...baseEnv,
  REEDITPRO_READINESS_PYTHON_BIN: '/tmp/reeditpro-missing-readiness-python-for-smoke/bin/python',
})
assert.equal(missingReport.ok, false, 'missing hydrated Python should fail closed')
assert.equal(missingReport.previewOnly, true, 'missing hydrated Python report should still be preview-only')
assert.equal(missingReport.hydratedPythonReady, false, 'missing hydrated Python should not be ready')
assert.equal(missingReport.setupCommand, 'npm run tools:readiness:install-core-python', 'missing hydrated Python should name setup command')
assert.ok(missingReport.warnings.some((warning) => warning.includes('Hydrated readiness Python is missing')), 'missing hydrated Python should be named')
assert.equal(missingReport.previewReport, undefined, 'missing hydrated Python should not run the underlying preview')

const pythonPath = findPythonPath()
let hydratedPassRan = false

if (pythonPath) {
  const readyReport = runBetaToolsCoreRealCheckHydratedPreview({
    ...baseEnv,
    REEDITPRO_READINESS_PYTHON_BIN: pythonPath,
  })
  hydratedPassRan = true
  assert.equal(readyReport.previewOnly, true, 'hydrated preview report should be preview-only')
  assert.equal(readyReport.hydratedPythonReady, true, 'existing Python should satisfy hydration gate')
  assert.equal(readyReport.hydratedPythonSource, 'env_override', 'explicit Python should be reported as an override')
  assert.ok(readyReport.previewReport, 'hydrated preview should include the underlying preview report')
  assert.equal(readyReport.previewReport?.ok, true, 'scoped Hyperframe hydrated preview should pass')
  assert.deepEqual(readyReport.previewReport?.acceptedToolIds, ['hyperframe'], 'hydrated preview should accept scoped Hyperframe metadata evidence')
  assert.equal(readyReport.previewReport?.previewOnly, true, 'underlying preview should remain preview-only')
  assert.equal(
    process.env.REEDITPRO_READINESS_PYTHON_BIN,
    undefined,
    'hydrated preview should restore REEDITPRO_READINESS_PYTHON_BIN after running',
  )
}

console.log(JSON.stringify({
  ok: true,
  missingHydratedPythonFailsClosed: missingReport.hydratedPythonReady === false,
  setupCommand: missingReport.setupCommand,
  hydratedPassRan,
  pythonPathChecked: pythonPath ?? 'not_available',
}, null, 2))

function findPythonPath(): string | undefined {
  const candidates = [
    process.env.REEDITPRO_READINESS_PYTHON_BIN,
    '.reeditpro-tool-readiness-python/bin/python',
    '/usr/bin/python3',
    '/opt/homebrew/bin/python3',
  ].filter((candidate): candidate is string => Boolean(candidate))

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate
  }

  const which = spawnSync('python3', ['-c', 'import sys; print(sys.executable)'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  })
  const resolved = which.stdout.trim()
  return which.status === 0 && resolved ? resolved : undefined
}
