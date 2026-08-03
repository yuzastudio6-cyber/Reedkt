import { ApiError } from '../errors/api-error'
import { executeCanonicalSam31CloudImageBuildOperator } from
  '../services/canonical-sam3_1-cloud-image-build-operator'

try {
  const result = await executeCanonicalSam31CloudImageBuildOperator({
    argv: process.argv.slice(2),
    environment: process.env,
  })
  console.log(JSON.stringify(result, null, 2))
  process.exitCode = result.disposition === 'submitted'
    || result.disposition === 'pending'
    || result.disposition ===
      'image_built_pending_scan_signature_and_gpu_qualification'
    ? 0
    : 2
} catch (error) {
  const errorCode = error instanceof ApiError
    ? error.code
    : error instanceof Error
      ? error.message
      : 'sam3_1_cloud_build_operator_failed'
  console.error(JSON.stringify({
    ok: false,
    errorCode,
    modelOrCheckpointBytesReadLocally: false,
    developerMachineModelInstallAllowed: false,
  }))
  process.exitCode = 1
}
