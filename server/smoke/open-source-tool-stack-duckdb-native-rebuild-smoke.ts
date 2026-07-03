import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  DUCKDB_NATIVE_REBUILD_REPORT_DIR,
  buildOpenSourceToolStackDuckdbNativeRebuildPlan,
  buildOpenSourceToolStackDuckdbNativeRebuildReports,
  readOpenSourceToolStackDuckdbNativeRebuildArtifacts,
} from '../activation/open-source-tool-stack-duckdb-native-rebuild-execution'

const plan = buildOpenSourceToolStackDuckdbNativeRebuildPlan()
const reports = readOpenSourceToolStackDuckdbNativeRebuildArtifacts() ?? buildOpenSourceToolStackDuckdbNativeRebuildReports()

assert.equal(plan.approvedRebuildCommand, 'npm rebuild duckdb --ignore-scripts=false --no-audit --no-fund')
assert.deepEqual(plan.proofTargets, ['duckdb_import_version_api_shape', 'duckdb_tiny_in_memory_metadata_query'])
assert.equal(reports.decision.npmInstallAttempted, false)
assert.equal(reports.decision.polarsProofRerun, false)
assert.equal(reports.decision.ffmpegProbeRun, false)
assert.equal(reports.decision.ffprobeProbeRun, false)
assert.equal(reports.decision.systemBinaryInstallAttempted, false)
assert.equal(reports.decision.supabaseWritesAttempted, false)

const allowedDecisions = [
  'duckdb_native_rebuild_execution_passed_ready_for_qa',
  'duckdb_native_rebuild_execution_passed_ffmpeg_ffprobe_still_missing',
  'blocked_pending_duckdb_native_rebuild',
  'blocked_pending_duckdb_import_or_query',
  'blocked_pending_package_lock_integrity',
  'blocked_pending_native_artifact_policy',
  'rejected_due_runtime_safety_risk',
]
assert.ok(allowedDecisions.includes(String(reports.decision.decision)))

if (fs.existsSync(DUCKDB_NATIVE_REBUILD_REPORT_DIR)) {
  for (const file of [
    'source-of-truth-audit.json',
    'pre-rebuild-baseline-report.json',
    'pre-rebuild-baseline-report.md',
    'duckdb-native-rebuild-report.json',
    'duckdb-native-rebuild-report.md',
    'duckdb-import-proof-report.json',
    'duckdb-synthetic-query-report.json',
    'package-lock-native-artifact-integrity-report.json',
    'package-lock-native-artifact-integrity-report.md',
    'ffmpeg-ffprobe-follow-up-report.json',
    'side-effect-safety-report.json',
    'duckdb-native-rebuild-decision.json',
    'duckdb-native-rebuild-decision.md',
    'duckdb-native-rebuild-readiness-report.json',
    'duckdb-native-rebuild-private-artifact-manifest.json',
    'duckdb-native-rebuild-validation-results.md',
  ]) {
    assert.equal(fs.existsSync(`${DUCKDB_NATIVE_REBUILD_REPORT_DIR}/${file}`), true, `Missing ${file}`)
  }
}

console.log('Open-source DuckDB native rebuild smoke passed.')
