import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildOcrModelApprovalReport,
  ocrModelCandidates,
  ocrModelLicenseEvidence,
} from '../activation/ocr-model-approval'

const report = buildOcrModelApprovalReport()
const paddleOcr = ocrModelCandidates.find((candidate) => candidate.candidateId === 'paddleocr')
const paddlePaddle = ocrModelCandidates.find((candidate) => candidate.candidateId === 'paddlepaddle')
const ppOcrv5 = ocrModelCandidates.find((candidate) => candidate.candidateId === 'pp_ocrv5')

assert.ok(paddleOcr, 'PaddleOCR candidate must exist.')
assert.equal(paddleOcr?.officialRepoUrl, 'https://github.com/PaddlePaddle/PaddleOCR')
assert.ok(paddleOcr?.evidence.some((evidence) => evidence.sourceUrl.includes('PaddleOCR')))
assert.ok(ocrModelLicenseEvidence.some((evidence) => evidence.candidateId === 'paddleocr' && evidence.licenseName === 'Apache-2.0'))
assert.ok(paddleOcr?.taskScope.includes('OCR'))
assert.ok(paddleOcr?.taskScope.includes('text detection'))
assert.ok(paddleOcr?.taskScope.includes('text recognition'))
assert.equal(paddleOcr?.reviewStatus, 'staging_approved_for_ocr_safe_zone_planning')
assert.equal(report.ocrExecutionAllowed, false)
assert.equal(report.realVideoOcrAllowed, false)
assert.equal(report.broadRealUserMediaAllowed, false)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)

assert.ok(paddlePaddle, 'PaddlePaddle runtime candidate must exist.')
assert.equal(paddlePaddle?.runtimeStatus, 'planning_only')
assert.ok(ppOcrv5, 'PP-OCRv5 model family candidate must exist.')
assert.equal(ppOcrv5?.downloadStatus, 'blocked_until_exact_assets_selected')
assert.equal(report.downloadCommandPlan.every((plan) => plan.executionMode === 'text_only' && plan.executableCommand === null && !plan.safeToRunNow), true)
assert.ok(report.storagePlan.baseStagingPath.startsWith('gs://reeditpro-staging-reeditpro-generated-assets/model-weights/paddleocr/'))
assert.equal(report.storagePlan.sourceMediaBucketAllowed, false)
assert.ok(report.runtimeImagePlan)
assert.equal(report.runtimeImagePlan.forbidsRuntimeModelDownload, true)
assert.equal(report.runtimeImagePlan.cpuFirst, true)
assert.ok(report.manifests.some((manifest) => manifest.manifestId === 'ocr_paddleocr_ppocrv5_staging_plan_v1'))
assert.ok(report.manifests.some((manifest) => manifest.manifestId === 'ocr_paddleocr_ppocrv5_staging_plan_v1' && manifest.checksum === 'missing_until_download'))
assert.equal(report.providerAllowed, false)
assert.equal(report.publicOutputAllowed, false)
assert.equal(report.revideoAllowed, false)
assert.equal(report.ocrModelDownloadAllowed, false)
assert.equal(report.runtimeAutoDownloadAllowed, false)
assert.equal(report.phase37BReadiness.ready, true)
assert.equal(report.phase37CReadiness.ready, false)
assert.equal(report.phase37DReadiness.ready, false)

const commandText = report.downloadCommandPlan.map((plan) => plan.commandText).join('\n')
assert.doesNotMatch(commandText, /^\s*(docker|gcloud|curl|wget|python|paddleocr)\b/im)
assert.match(commandText, /TEXT_ONLY/)

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.equal(packageJson.scripts['activation:ocr-model-approval:plan'], 'tsx server/cli/activation-ocr-model-approval-plan.ts')
assert.equal(packageJson.scripts['activation:ocr-model-approval:report'], 'tsx server/cli/activation-ocr-model-approval-report.ts')
assert.equal(packageJson.scripts['activation:ocr-model-weight:summary'], 'tsx server/cli/activation-ocr-model-weight-summary.ts')
assert.equal(packageJson.scripts['smoke:activation-ocr-model-approval-workflow'], 'tsx server/smoke/activation-ocr-model-approval-workflow-smoke.ts')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'paddleocr_candidate',
    'paddleocr_license_evidence',
    'paddlepaddle_runtime_candidate',
    'pp_ocrv5_asset_selection_deferred',
    'storage_plan_private_generated_assets',
    'runtime_image_cpu_first_no_auto_download',
    'text_only_download_plan',
    'execution_gates_false',
    'package_scripts',
  ],
}))
