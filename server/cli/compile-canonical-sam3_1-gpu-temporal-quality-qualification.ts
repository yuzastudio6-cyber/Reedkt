import {
  createCanonicalSam31GcpGpuTemporalQualityQualificationOwner,
} from '../services/canonical-sam3_1-gpu-temporal-quality-qualification-owner'

const REQUEST_ENV =
  'WEEDITPRO_SAM31_GPU_TEMPORAL_QUALITY_QUALIFICATION_REQUEST_JSON'
const raw = process.env[REQUEST_ENV]
if (!raw) throw new Error(`${REQUEST_ENV} is required.`)

let request: unknown
try {
  request = JSON.parse(raw)
} catch {
  throw new Error(`${REQUEST_ENV} is not valid JSON.`)
}

const component = await
createCanonicalSam31GcpGpuTemporalQualityQualificationOwner()
  .compileAndPersistTemporalQualityComponent(request)

process.stdout.write(`${JSON.stringify({
  component,
  gpuJobDispatched: false,
  customerCreditsMutated: false,
  qaApprovalGranted: false,
  runtimeReleaseGranted: false,
  productionAuthorityGranted: false,
}, null, 2)}\n`)
