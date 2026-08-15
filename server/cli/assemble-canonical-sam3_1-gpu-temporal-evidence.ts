import {
  createCanonicalSam31GcpGpuTemporalEvidenceAssembler,
} from '../services/canonical-sam3_1-gpu-temporal-evidence-assembler'

const REQUEST_ENV =
  'WEEDITPRO_SAM31_GPU_TEMPORAL_EVIDENCE_ASSEMBLY_REQUEST_JSON'
const raw = process.env[REQUEST_ENV]
if (!raw) throw new Error(`${REQUEST_ENV} is required.`)

let request: unknown
try {
  request = JSON.parse(raw)
} catch {
  throw new Error(`${REQUEST_ENV} is not valid JSON.`)
}

const assembly = await createCanonicalSam31GcpGpuTemporalEvidenceAssembler()
  .assembleAndPersist(request)

process.stdout.write(`${JSON.stringify({
  assembly,
  gpuJobDispatched: false,
  customerCreditsMutated: false,
  qaApprovalGranted: false,
  runtimeReleaseGranted: false,
  productionAuthorityGranted: false,
}, null, 2)}\n`)
