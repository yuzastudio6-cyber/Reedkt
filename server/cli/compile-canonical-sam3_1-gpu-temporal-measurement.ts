import {
  createCanonicalSam31GcpGpuTemporalMeasurementCompiler,
} from '../services/canonical-sam3_1-gpu-temporal-measurement-compiler'

const REQUEST_ENV =
  'WEEDITPRO_SAM31_GPU_TEMPORAL_MEASUREMENT_REQUEST_JSON'
const raw = process.env[REQUEST_ENV]
if (!raw) throw new Error(`${REQUEST_ENV} is required.`)

let request: unknown
try {
  request = JSON.parse(raw)
} catch {
  throw new Error(`${REQUEST_ENV} is not valid JSON.`)
}

const measurementSet = await
createCanonicalSam31GcpGpuTemporalMeasurementCompiler()
  .compileAndPersistMeasurementSet(request)

process.stdout.write(`${JSON.stringify({
  measurementSet,
  gpuJobDispatched: false,
  customerCreditsMutated: false,
  qaApprovalGranted: false,
  runtimeReleaseGranted: false,
  productionAuthorityGranted: false,
}, null, 2)}\n`)
