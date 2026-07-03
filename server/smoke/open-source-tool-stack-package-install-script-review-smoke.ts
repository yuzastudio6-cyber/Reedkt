import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  PACKAGE_INSTALL_SCRIPT_REVIEW_REPORT_DIR,
  buildOpenSourceToolStackPackageInstallScriptReviewPlan,
  buildOpenSourceToolStackPackageInstallScriptReviewReports,
} from '../activation/open-source-tool-stack-package-install-script-review'

const plan = buildOpenSourceToolStackPackageInstallScriptReviewPlan()
const reports = buildOpenSourceToolStackPackageInstallScriptReviewReports()

assert.equal(plan.mode, 'metadata_lifecycle_script_review_only_no_rebuild_no_import_no_proof')
assert.equal(
  reports.decision.decision,
  'package_install_script_review_passed_ready_for_duckdb_native_rebuild_execution',
)
assert.equal(reports.lifecycleScriptSafetyPolicy.packageLifecycleScriptExecutionApprovedNow, false)
assert.equal(reports.lifecycleScriptSafetyPolicy.futureCommand, 'npm rebuild duckdb --ignore-scripts=false --no-audit --no-fund')
assert.equal(reports.duckdbNativeBindingBlockerAnalysis.bindingExists, false)
assert.equal(reports.futureDuckdbProofPlan.executionAllowedInThisReview, false)

for (const file of [
  'source-of-truth-audit.json',
  'evidence-revalidation-report.json',
  'duckdb-native-binding-blocker-analysis.json',
  'lifecycle-script-safety-policy.json',
  'future-duckdb-proof-plan.json',
  'package-artifact-policy.json',
  'ffmpeg-ffprobe-follow-up-classification.json',
  'package-install-script-review-decision.json',
]) {
  assert.equal(fs.existsSync(`${PACKAGE_INSTALL_SCRIPT_REVIEW_REPORT_DIR}/${file}`), true, `Missing ${file}`)
}

console.log('Open-source package install script review smoke passed.')
