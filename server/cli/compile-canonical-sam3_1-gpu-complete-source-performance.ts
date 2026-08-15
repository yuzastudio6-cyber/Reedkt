import {
  createCanonicalSam31GcpGpuCompleteSourcePerformanceOwner,
} from '../services/canonical-sam3_1-gpu-complete-source-performance-owner'

const REQUEST_ENV =
  'WEEDITPRO_SAM31_GPU_COMPLETE_SOURCE_PERFORMANCE_REQUEST_JSON'
const raw = process.env[REQUEST_ENV]
if (!raw) throw new Error(`${REQUEST_ENV} is required.`)

let request: unknown
try {
  request = JSON.parse(raw)
} catch {
  throw new Error(`${REQUEST_ENV} is not valid JSON.`)
}

const performanceEvidence = await
createCanonicalSam31GcpGpuCompleteSourcePerformanceOwner()
  .compileAndPersistPerformanceEvidence(request)

process.stdout.write(`${JSON.stringify({
  performanceEvidence,
  gpuJobDispatched: false,
  customerCreditsMutated: false,
  qaApprovalGranted: false,
  runtimeReleaseGranted: false,
  productionAuthorityGranted: false,
}, null, 2)}\n`)
