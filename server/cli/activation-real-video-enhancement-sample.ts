import { buildRealVideoEnhancementSampleReport, summarizeRealVideoEnhancementSampleReport, validateRealVideoEnhancementSampleEnv } from '../activation/real-video-enhancement-sample'

const args = new Set(process.argv.slice(2))
const json = args.has('--json')
const executeMode = args.has('--mode') && process.argv.includes('execute')

const report = buildRealVideoEnhancementSampleReport()
if (executeMode) {
  const blockers = validateRealVideoEnhancementSampleEnv({
    projectId: process.env.GCP_PROJECT_ID,
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    confirmation: process.env.REEDITPRO_CONFIRM_REAL_VIDEO_ENHANCEMENT_SAMPLE,
    sourceFrameGcsUri: process.env.REEDITPRO_PHASE34D_INPUT_FRAME_GCS_URI,
    modelManifestId: process.env.REEDITPRO_APPROVED_ENHANCEMENT_MODEL_ID,
    modelGcsPath: process.env.REEDITPRO_MODEL_GCS_PATH,
    fileSha256: process.env.REEDITPRO_MODEL_EXPECTED_FILE_SHA256,
    aggregateSha256: process.env.REEDITPRO_MODEL_EXPECTED_AGGREGATE_SHA256,
    gpuType: process.env.REEDITPRO_GPU_TYPE,
    faceEnhance: process.env.REAL_ESRGAN_FACE_ENHANCE,
    providerExecution: process.env.PROVIDER_EXECUTION_ENABLED,
    modelDownloads: process.env.MODEL_DOWNLOADS_ENABLED,
  })
  if (blockers.length > 0) {
    console.error(blockers.join('\n'))
    process.exitCode = 1
  }
}

if (json) {
  console.log(JSON.stringify(report, null, 2))
} else {
  console.log(summarizeRealVideoEnhancementSampleReport(report))
}
