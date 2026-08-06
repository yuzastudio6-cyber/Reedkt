import assert from 'node:assert/strict'

import {
  getCanonicalSam2GpuRuntimeContract,
} from '../model-artifacts/historical-sam2'

let rejectionCode: string | null = null
await assert.rejects(
  () => getCanonicalSam2GpuRuntimeContract(),
  (error: unknown) => {
    const record = error as {
      code?: string
      message?: string
      details?: { requiredGate?: string }
    }
    rejectionCode = record.message ?? record.code ?? null
    assert.equal(record.code, 'TOOL_NOT_READY')
    assert.equal(
      record.message,
      'sam2_gpu_runtime_catalog_boundary_changed',
    )
    assert.equal(
      record.details?.requiredGate,
      'canonical_sam2_gpu_runtime_contract',
    )
    return true
  },
)

assert.equal(rejectionCode, 'sam2_gpu_runtime_catalog_boundary_changed')

console.log(JSON.stringify({
  smoke: 'canonical-sam2-cloud-run-admission-historical-rejection',
  freshSam2AdmissionBlocked: true,
  runtimeExecuted: false,
  cloudJobCreated: false,
  activeReplacementOperationId:
    'tool.sam3_1.segment_and_track_subject.v1',
}))
