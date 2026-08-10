import {
  createCanonicalSam31GcpGpuRuntimeDriverQualificationOwner,
} from '../services/canonical-sam3_1-gpu-runtime-driver-qualification-owner'

const REQUEST_ENV =
  'WEEDITPRO_SAM31_GPU_RUNTIME_DRIVER_QUALIFICATION_REQUEST_JSON'
const raw = process.env[REQUEST_ENV]
if (!raw) throw new Error(`${REQUEST_ENV} is required.`)

let request: unknown
try {
  request = JSON.parse(raw)
} catch {
  throw new Error(`${REQUEST_ENV} is not valid JSON.`)
}

const component = await
createCanonicalSam31GcpGpuRuntimeDriverQualificationOwner()
  .compileAndPersistDriverQualificationComponent(request)

process.stdout.write(`${JSON.stringify({
  component,
  gpuJobDispatched: false,
  customerCreditsMutated: false,
  runtimeReleaseGranted: false,
  productionAuthorityGranted: false,
}, null, 2)}\n`)
