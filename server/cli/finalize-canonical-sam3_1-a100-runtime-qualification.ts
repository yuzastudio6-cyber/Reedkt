import { loadRuntimeEnv } from '../config/env'
import {
  createCanonicalTrackAllSam31ProductionRuntime,
} from '../services/canonical-track-all-sam3_1-production-runtime'

const REQUEST_ENV =
  'WEEDITPRO_SAM31_A100_RUNTIME_QUALIFICATION_FINALIZE_REQUEST_JSON'
const raw = process.env[REQUEST_ENV]
if (!raw) {
  throw new Error(`${REQUEST_ENV} is required.`)
}

let request: unknown
try {
  request = JSON.parse(raw)
} catch {
  throw new Error(`${REQUEST_ENV} is not valid JSON.`)
}

const runtime = createCanonicalTrackAllSam31ProductionRuntime(loadRuntimeEnv({
  ...process.env,
  E2E_RUNTIME_MODE: 'cloud_run',
  STORAGE_MODE: 'gcs',
  GOOGLE_CLOUD_PROJECT_ID: 'reeditpro',
  GOOGLE_CLOUD_REGION: 'us-central1',
  GCS_CONTROL_PLANE_STATE_BUCKET:
    'reeditpro-production-reeditpro-control-plane-state',
  GCS_PROCESSED_MEDIA_BUCKET: 'reeditpro-production-reeditpro-masks',
}))
if (!runtime) throw new Error('SAM 3.1 cloud runtime is not mounted.')

const result = await runtime.sam31A100ResultFinalizationRuntimePort.finalize(
  request as Parameters<
    typeof runtime.sam31A100ResultFinalizationRuntimePort.finalize
  >[0],
)

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
