import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  TRACKA_BUILD_CONTEXT_GENERATION_EXECUTION_REPORT_DIR,
  readTrackaBuildContextGenerationArtifacts,
} from '../activation/open-source-tool-stack-tracka-build-context-generation-execution'

const reports = readTrackaBuildContextGenerationArtifacts()
assert.ok(reports, 'Track A build-context generation reports must exist')

const decision = reports.decision as Record<string, unknown>
const cleanup = reports.generatedArtifactCleanupReport as Record<string, unknown>
const scan = reports.generatedArtifactScanReport as Record<string, unknown>
const integrity = reports.packageDockerfileIntegrityReport as Record<string, unknown>

assert.equal(decision.decision, 'build_context_generation_execution_passed_ready_for_docker_build_probe_execution')
assert.equal(decision.readyForDockerBuildProbeExecution, true)
assert.equal(scan.passed, true)
assert.equal(cleanup.passed, true)
assert.equal(integrity.passed, true)

for (const dir of [
  'dist-server',
  'dist-remotion-worker',
  'dist-staging-fixture-worker',
  'dist-staging-real-video-export-worker',
]) {
  assert.equal(fs.existsSync(dir), false, `${dir} must be removed before commit`)
}

const requiredReports = [
  'source-of-truth-audit.json',
  'pre-execution-validation-report.json',
  'pre-execution-validation-report.md',
  'dist-server-generation-report.json',
  'dist-remotion-worker-generation-report.json',
  'dist-staging-fixture-worker-generation-report.json',
  'dist-staging-real-video-export-worker-generation-report.json',
  'generated-artifact-scan-report.json',
  'generated-artifact-scan-report.md',
  'build-context-generation-manifest.json',
  'build-context-generation-manifest.md',
  'generated-artifact-cleanup-report.json',
  'package-dockerfile-integrity-report.json',
  'package-dockerfile-integrity-report.md',
  'side-effect-safety-report.json',
  'build-context-generation-execution-decision.json',
  'build-context-generation-execution-decision.md',
  'build-context-generation-execution-readiness-report.json',
  'build-context-generation-execution-private-artifact-manifest.json',
  'build-context-generation-execution-validation-results.md',
]

for (const report of requiredReports) {
  assert.equal(fs.existsSync(`${TRACKA_BUILD_CONTEXT_GENERATION_EXECUTION_REPORT_DIR}/${report}`), true, `Missing ${report}`)
}

console.log('Open-source tool stack Track A build-context generation execution smoke passed.')
