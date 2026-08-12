import { ApiError } from '../errors/api-error'
import { executeCanonicalSam31CloudImageBuildOperator } from
  '../services/canonical-sam3_1-cloud-image-build-operator'
import { createCanonicalSam31GcpCloudImageBuildRuntime } from
  '../services/canonical-sam3_1-cloud-image-build-runtime'
import {
  createWeEditProGcpLocalOperatorAuth,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE,
} from './weeditpro-gcp-local-operator-auth'

try {
  if (
    process.env.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH !==
      WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE
  ) throw new Error('weeditpro_gcp_local_operator_auth_confirmation_missing')
  const { authClient, storage } = createWeEditProGcpLocalOperatorAuth({
    confirmation: process.env.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
  })
  const result = await executeCanonicalSam31CloudImageBuildOperator({
    argv: process.argv.slice(2),
    environment: process.env,
    runtime: createCanonicalSam31GcpCloudImageBuildRuntime({
      storage,
      auth: authClient,
    }),
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
