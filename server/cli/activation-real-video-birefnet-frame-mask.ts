import { buildRealVideoMaskReport, summarizeRealVideoMaskReport, validateRealVideoMaskEnv } from '../activation/real-video-mask'

const args = new Set(process.argv.slice(2))
const json = args.has('--json')
const executeMode = args.has('--mode') && process.argv.includes('execute')

const report = buildRealVideoMaskReport()
if (executeMode) {
  const blockers = validateRealVideoMaskEnv({
    projectId: process.env.GCP_PROJECT_ID,
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    confirmation: process.env.REEDITPRO_CONFIRM_REAL_VIDEO_BIREFNET_FRAME_MASK,
    sourceGcsUri: process.env.REEDITPRO_PHASE33D_INPUT_GCS_URI,
    modelManifestId: process.env.REEDITPRO_APPROVED_MASK_MODEL_ID,
    modelGcsPath: process.env.REEDITPRO_MODEL_GCS_PATH,
    modelRevision: process.env.REEDITPRO_MODEL_REVISION,
    modelChecksum: process.env.REEDITPRO_MODEL_EXPECTED_SHA256,
  })
  if (blockers.length > 0) {
    console.error(blockers.join('\n'))
    process.exitCode = 1
  }
}

if (json) {
  console.log(JSON.stringify(report, null, 2))
} else {
  console.log(summarizeRealVideoMaskReport(report))
}
