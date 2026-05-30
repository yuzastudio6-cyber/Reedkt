import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  OCR_MODEL_DOWNLOAD_EXPECTED_ARTIFACTS,
  OCR_MODEL_DOWNLOAD_GCS_PATH,
  OCR_MODEL_DOWNLOAD_TARGET_PREFIX,
  PP_LCNET_TEXTLINE_ORI_FILE_NAME,
  PP_OCRV5_DICT_FILE_NAME,
  PP_OCRV5_DICT_SOURCE_URL,
  PP_OCRV5_MOBILE_DET_FILE_NAME,
  PP_OCRV5_MOBILE_DET_SOURCE_URL,
  PP_OCRV5_MOBILE_REC_FILE_NAME,
  PP_OCRV5_MOBILE_REC_SOURCE_URL,
  buildOcrAssetSelectionManifest,
  buildOcrChecksumTextManifest,
  buildOcrModelDownloadArtifactMap,
  buildOcrModelDownloadExecutionCommandPlans,
  buildOcrModelDownloadReport,
  buildOcrModelDownloadStoragePlan,
  buildOcrModelTreeManifest,
  buildPendingOcrChecksumManifest,
  hasExactlySelectedOcrModelAssetUrls,
  optionalDeferredOcrModelAssets,
  selectedOcrModelAssetRelativePaths,
  selectedOcrModelAssetUrls,
  selectedOcrModelAssets,
  validateOcrModelDownloadExecutionEnv,
  validateOcrModelDownloadStaticPlan,
} from '../activation/ocr-model-download'

assert.equal(OCR_MODEL_DOWNLOAD_GCS_PATH, 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/paddleocr/pp-ocrv5/paddle3.0.0-mobile-safe-zone-v1/')
assert.equal(OCR_MODEL_DOWNLOAD_TARGET_PREFIX, 'model-weights/paddleocr/pp-ocrv5/paddle3.0.0-mobile-safe-zone-v1/')
assert.equal(selectedOcrModelAssets.length, 3)
assert.deepEqual(selectedOcrModelAssets.map((asset) => asset.fileName).sort(), [
  PP_OCRV5_DICT_FILE_NAME,
  PP_OCRV5_MOBILE_DET_FILE_NAME,
  PP_OCRV5_MOBILE_REC_FILE_NAME,
].sort())
assert.deepEqual(selectedOcrModelAssetUrls.sort(), [
  PP_OCRV5_DICT_SOURCE_URL,
  PP_OCRV5_MOBILE_DET_SOURCE_URL,
  PP_OCRV5_MOBILE_REC_SOURCE_URL,
].sort())
assert.equal(hasExactlySelectedOcrModelAssetUrls(selectedOcrModelAssetUrls), true)
assert.equal(hasExactlySelectedOcrModelAssetUrls([...selectedOcrModelAssetUrls, 'https://example.com/extra.tar']), false)
assert.equal(selectedOcrModelAssetRelativePaths.includes('det/PP-OCRv5_mobile_det_infer.tar'), true)
assert.equal(selectedOcrModelAssetRelativePaths.includes('rec/PP-OCRv5_mobile_rec_infer.tar'), true)
assert.equal(selectedOcrModelAssetRelativePaths.includes('dict/ppocrv5_dict.txt'), true)

assert.equal(optionalDeferredOcrModelAssets.length, 1)
assert.equal(optionalDeferredOcrModelAssets[0].fileName, PP_LCNET_TEXTLINE_ORI_FILE_NAME)
assert.equal(optionalDeferredOcrModelAssets[0].selectionStatus, 'optional_deferred')
assert.equal(optionalDeferredOcrModelAssets[0].requiredForSafeZoneV1, false)
assert.equal(optionalDeferredOcrModelAssets[0].runtimeAutoDownloadBlocked, true)

const storagePlan = buildOcrModelDownloadStoragePlan()
assert.equal(storagePlan.targetGcsPath, OCR_MODEL_DOWNLOAD_GCS_PATH)
assert.equal(storagePlan.privateStorageRequired, true)
assert.equal(storagePlan.sourceMediaBucketAllowed, false)
assert.equal(storagePlan.publicAccessAllowed, false)
assert.equal(storagePlan.signedUrlSourceOfTruthAllowed, false)
assert.equal(storagePlan.committedToGitAllowed, false)

const staticPlan = validateOcrModelDownloadStaticPlan({
  projectId: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  targetPrefix: OCR_MODEL_DOWNLOAD_TARGET_PREFIX,
  assetUrls: selectedOcrModelAssetUrls,
})
assert.equal(staticPlan.allowed, true)
assert.ok(validateOcrModelDownloadStaticPlan({ assetUrls: ['https://example.com/model.tar'] }).blockers.length > 0)

const executionEnv = validateOcrModelDownloadExecutionEnv({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  downloadConfirmation: 'true',
  privateGcsUploadConfirmation: 'true',
  bucketName: 'reeditpro-staging-reeditpro-generated-assets',
  targetPrefix: OCR_MODEL_DOWNLOAD_TARGET_PREFIX,
  assetUrls: selectedOcrModelAssetUrls,
  localTempDir: '/tmp/reeditpro-ocr-model-download/paddle3.0.0-mobile-safe-zone-v1',
  providerExecutionEnabled: 'false',
  productionReady: 'false',
  externalBetaReady: 'false',
  broadRealMediaReady: 'false',
  betaReady: 'false',
})
assert.equal(executionEnv.allowed, true)
assert.ok(validateOcrModelDownloadExecutionEnv({ downloadConfirmation: 'false', privateGcsUploadConfirmation: 'true' }).blockers.some((blocker) => blocker.includes('REEDITPRO_CONFIRM_OCR_MODEL_DOWNLOAD=true')))
assert.ok(validateOcrModelDownloadExecutionEnv({ downloadConfirmation: 'true', privateGcsUploadConfirmation: 'false' }).blockers.some((blocker) => blocker.includes('REEDITPRO_CONFIRM_PRIVATE_GCS_UPLOAD=true')))
assert.ok(validateOcrModelDownloadExecutionEnv({ productionReady: 'true' }).blockers.some((blocker) => blocker.includes('Production readiness')))
assert.ok(validateOcrModelDownloadExecutionEnv({ externalBetaReady: 'true' }).blockers.some((blocker) => blocker.includes('External beta')))
assert.ok(validateOcrModelDownloadExecutionEnv({ broadRealMediaReady: 'true' }).blockers.some((blocker) => blocker.includes('Broad real-media')))

const assetSelectionManifest = buildOcrAssetSelectionManifest('2026-05-30T00:00:00.000Z')
assert.equal(assetSelectionManifest.safeZoneRuntimeProfile.use_doc_orientation_classify, false)
assert.equal(assetSelectionManifest.safeZoneRuntimeProfile.use_doc_unwarping, false)
assert.equal(assetSelectionManifest.safeZoneRuntimeProfile.use_textline_orientation, false)
assert.equal(assetSelectionManifest.safeZoneRuntimeProfile.blockTextlineOrientationAutoDownload, true)
assert.equal(assetSelectionManifest.downloadExecuted, false)
assert.equal(assetSelectionManifest.privateGcsUploadVerified, false)

const pendingChecksumManifest = buildPendingOcrChecksumManifest('2026-05-30T00:00:00.000Z')
assert.equal(pendingChecksumManifest.status, 'pending_until_download')
assert.equal(pendingChecksumManifest.entries.length, 3)
assert.ok(buildOcrChecksumTextManifest(pendingChecksumManifest.entries).includes('pending_until_download  det/PP-OCRv5_mobile_det_infer.tar'))

const modelTreeManifest = buildOcrModelTreeManifest({
  createdAt: '2026-05-30T00:00:00.000Z',
  files: pendingChecksumManifest.entries,
})
assert.equal(modelTreeManifest.aggregateSha256, 'pending_until_download')
assert.equal(modelTreeManifest.runtimeAutoDownloadAllowed, false)
assert.equal(modelTreeManifest.textlineOrientationAutoDownloadAllowed, false)
assert.equal(modelTreeManifest.ocrRuntimeAllowed, false)
assert.equal(modelTreeManifest.ocrInferenceAllowed, false)
assert.equal(modelTreeManifest.realMediaOcrAllowed, false)
assert.equal(modelTreeManifest.realVideoOcrAllowed, false)
assert.equal(modelTreeManifest.captionRenderIntegrationAllowed, false)
assert.equal(modelTreeManifest.productionReadyAllowed, false)
assert.equal(modelTreeManifest.externalBetaAllowed, false)
assert.equal(modelTreeManifest.paidProductionAllowed, false)
assert.equal(modelTreeManifest.broadRealUserMediaAllowed, false)
assert.equal(modelTreeManifest.providerAllowed, false)
assert.equal(modelTreeManifest.revideoAllowed, false)

const executionPlans = buildOcrModelDownloadExecutionCommandPlans()
assert.ok(executionPlans.some((plan) => plan.commandId === 'ocr_model_download_ppocrv5-mobile-det-infer'))
assert.ok(executionPlans.some((plan) => plan.commandId === 'ocr_model_download_ppocrv5-mobile-rec-infer'))
assert.ok(executionPlans.some((plan) => plan.commandId === 'ocr_model_download_ppocrv5-recognition-dictionary'))
assert.ok(executionPlans.every((plan) => plan.textOnlyByDefault))
assert.ok(executionPlans.filter((plan) => plan.phase === 'download').every((plan) => plan.confirmationEnvVar === 'REEDITPRO_CONFIRM_OCR_MODEL_DOWNLOAD'))
assert.ok(executionPlans.filter((plan) => plan.phase === 'upload').every((plan) => plan.confirmationEnvVar === 'REEDITPRO_CONFIRM_PRIVATE_GCS_UPLOAD'))
assert.ok(executionPlans.every((plan) => !/allUsers|allAuthenticatedUsers|signed-url|gcloud\s+run|deploy|docker\s+(build|push)|provider/i.test(plan.commandString)))

const report = buildOcrModelDownloadReport()
assert.equal(report.status, 'asset_selection_approved_download_pending')
assert.equal(report.downloadEvidence.targetGcsPath, OCR_MODEL_DOWNLOAD_GCS_PATH)
assert.equal(report.downloadEvidence.licenseName, 'Apache-2.0')
assert.equal(report.downloadEvidence.productionLegalApprovalComplete, false)
assert.equal(report.exactAssetSelectionApproved, true)
assert.equal(report.ocrModelDownloadCompleted, false)
assert.equal(report.phase37CReadiness.readyForGeneratedOcrRuntimeVerification, false)
assert.equal(report.ocrRuntimeAllowed, false)
assert.equal(report.ocrInferenceAllowed, false)
assert.equal(report.realMediaOcrAllowed, false)
assert.equal(report.realVideoOcrAllowed, false)
assert.equal(report.captionRenderIntegrationAllowed, false)
assert.equal(report.runtimeAutoDownloadAllowed, false)
assert.equal(report.textlineOrientationAutoDownloadAllowed, false)
assert.equal(report.providerAllowed, false)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.paidProductionAllowed, false)
assert.equal(report.broadRealUserMediaAllowed, false)
assert.equal(report.publicOutputAllowed, false)
assert.equal(report.signedUrlSourceOfTruthAllowed, false)
assert.ok(report.blockers.some((blocker) => blocker.includes('not yet verified') || blocker.includes('missing')))

const artifactMap = buildOcrModelDownloadArtifactMap()
for (const artifactName of OCR_MODEL_DOWNLOAD_EXPECTED_ARTIFACTS) {
  assert.ok(artifactMap[artifactName].length > 0, `${artifactName} should be emitted`)
}
assert.ok(JSON.parse(artifactMap['source_evidence.json']).selectedAssets.length === 3)
assert.equal(JSON.parse(artifactMap['license_evidence.json']).licenseName, 'Apache-2.0')
assert.equal(JSON.parse(artifactMap['asset_selection_manifest.json']).exactAssetSelectionApproved, true)
assert.equal(JSON.parse(artifactMap['checksum_manifest.json']).status, 'pending_until_download')
assert.equal(JSON.parse(artifactMap['model_tree_manifest.json']).publicOutputAllowed, false)
assert.equal(JSON.parse(artifactMap['download_report.json']).downloadExecuted, false)
assert.equal(JSON.parse(artifactMap['private_gcs_upload_report.json']).uploadVerified, false)
assert.equal(JSON.parse(artifactMap['phase_37b_ocr_model_download_report.json']).ocrInferenceAllowed, false)

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.equal(packageJson.scripts['activation:ocr-model-download:plan'], 'tsx server/cli/activation-ocr-model-download-plan.ts')
assert.equal(packageJson.scripts['activation:ocr-model-download'], 'tsx server/cli/activation-ocr-model-download.ts')
assert.equal(packageJson.scripts['activation:ocr-model-download:report'], 'tsx server/cli/activation-ocr-model-download-report.ts')
assert.equal(packageJson.scripts['smoke:activation-ocr-model-download'], 'tsx server/smoke/activation-ocr-model-download-smoke.ts')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'exact_ppocrv5_mobile_assets',
    'optional_textline_orientation_deferred',
    'apache_2_license_evidence',
    'private_gcs_prefix',
    'download_and_upload_confirmations_required',
    'dry_run_no_download_no_upload',
    'checksum_and_tree_manifest_schemas',
    'false_runtime_real_media_beta_public_gates',
    'package_scripts',
  ],
  status: report.status,
}))
