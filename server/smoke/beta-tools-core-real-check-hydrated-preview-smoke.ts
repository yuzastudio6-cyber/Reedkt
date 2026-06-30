import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
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
  REEDITPRO_BETA_TOOLS_PREVIEW_READINESS_BIN_DIR: join(tmpdir(), 'reeditpro-missing-readiness-bin-for-smoke'),
})
assert.equal(missingReport.ok, false, 'missing hydrated Python should fail closed')
assert.equal(missingReport.previewOnly, true, 'missing hydrated Python report should still be preview-only')
assert.equal(missingReport.hydratedPythonReady, false, 'missing hydrated Python should not be ready')
assert.equal(missingReport.readinessBinIncludedInPath, false, 'missing readiness bin should not be included in PATH')
assert.equal(missingReport.setupCommand, 'npm run tools:readiness:install-core-python', 'missing hydrated Python should name setup command')
assert.ok(missingReport.warnings.some((warning) => warning.includes('Hydrated readiness Python is missing')), 'missing hydrated Python should be named')
assert.equal(missingReport.previewReport, undefined, 'missing hydrated Python should not run the underlying preview')

const pythonPath = findPythonPath()
let hydratedPassRan = false

if (pythonPath) {
  const readinessBinDir = mkdtempSync(join(tmpdir(), 'reeditpro-readiness-bin-smoke-'))
  const previousPath = process.env.PATH
  const readyReport = runBetaToolsCoreRealCheckHydratedPreview({
    ...baseEnv,
    REEDITPRO_READINESS_PYTHON_BIN: pythonPath,
    REEDITPRO_BETA_TOOLS_PREVIEW_READINESS_BIN_DIR: readinessBinDir,
  })
  hydratedPassRan = true
  assert.equal(readyReport.previewOnly, true, 'hydrated preview report should be preview-only')
  assert.equal(readyReport.hydratedPythonReady, true, 'existing Python should satisfy hydration gate')
  assert.equal(readyReport.hydratedPythonSource, 'env_override', 'explicit Python should be reported as an override')
  assert.equal(readyReport.readinessBinPath, readinessBinDir, 'hydrated preview should report the readiness bin path')
  assert.equal(readyReport.readinessBinIncludedInPath, true, 'existing readiness bin should be included in PATH')
  assert.ok(readyReport.previewReport, 'hydrated preview should include the underlying preview report')
  assert.equal(readyReport.previewReport?.ok, true, 'scoped Hyperframe hydrated preview should pass')
  assert.deepEqual(readyReport.previewReport?.acceptedToolIds, ['hyperframe'], 'hydrated preview should accept scoped Hyperframe metadata evidence')
  assert.equal(readyReport.previewReport?.previewOnly, true, 'underlying preview should remain preview-only')
  assert.equal(process.env.PATH, previousPath, 'hydrated preview should restore PATH after running')
  assert.equal(
    process.env.REEDITPRO_READINESS_PYTHON_BIN,
    undefined,
    'hydrated preview should restore REEDITPRO_READINESS_PYTHON_BIN after running',
  )

  const localDefaultsReport = runBetaToolsCoreRealCheckHydratedPreview({
    REEDITPRO_READINESS_PYTHON_BIN: pythonPath,
    REEDITPRO_BETA_TOOLS_PREVIEW_READINESS_BIN_DIR: readinessBinDir,
  }, {
    localDefaults: true,
    sourceSha: 'dddddddddddddddddddddddddddddddddddddddd',
  })
  assert.equal(localDefaultsReport.ok, true, 'hydrated local defaults preview should pass without manual preview env')
  assert.equal(localDefaultsReport.previewReport?.localDefaultsApplied, true, 'hydrated local defaults should reach the underlying preview')
  assert.ok(
    localDefaultsReport.previewReport?.localDefaultedInputNames.includes('REEDITPRO_BETA_TOOLS_PREVIEW_WORKSPACE_ID'),
    'hydrated local defaults should fill the workspace ID',
  )
  assert.equal(
    localDefaultsReport.previewReport?.readyToRecordAcceptedEvidence,
    true,
    'hydrated local defaults should collect bounded accepted evidence',
  )
  assert.equal(process.env.PATH, previousPath, 'hydrated local defaults preview should restore PATH after running')
  rmSync(readinessBinDir, { recursive: true, force: true })
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
