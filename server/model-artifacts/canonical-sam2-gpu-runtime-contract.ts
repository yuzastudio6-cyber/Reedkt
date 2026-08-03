import { ApiError } from '../errors/api-error'
import type {
  CanonicalSam2GpuRuntimeContract,
} from './canonical-sam2-gpu-runtime-contract-types'

/**
 * Immutable SAM 2 evidence schemas remain readable, but the former runtime
 * contract compiler is deliberately a tombstone. It performs no filesystem
 * read, image-source validation, model lookup, subprocess spawn, or dispatch.
 */
export const CANONICAL_SAM2_GPU_RUNTIME_RETIREMENT = Object.freeze({
  schemaVersion: 'canonical-sam2-gpu-runtime-retirement-v1' as const,
  status: 'retired_historical_read_only' as const,
  replacementToolId: 'sam3_1' as const,
  replacementOperationId:
    'tool.sam3_1.segment_and_track_subject.v1' as const,
  freshContractCompilationAllowed: false as const,
  sourceFileReadAllowed: false as const,
  imageBuildAllowed: false as const,
  checkpointMountAllowed: false as const,
  subprocessOrModelExecutionAllowed: false as const,
  newPlanFallbackOrRepairAllowed: false as const,
  historicalEvidenceReadable: true as const,
})

/** @deprecated New work must use the separately qualified SAM 3.1 runtime. */
export async function getCanonicalSam2GpuRuntimeContract():
Promise<CanonicalSam2GpuRuntimeContract> {
  throw retired()
}

/** @deprecated New work must use the separately qualified SAM 3.1 runtime. */
export async function assertCanonicalSam2GpuRuntimeContract(
  _value: unknown,
): Promise<CanonicalSam2GpuRuntimeContract> {
  void _value
  throw retired()
}

function retired(): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'sam2_historical_only_new_dispatch_blocked',
    409,
    {
      requiredGate: 'canonical_sam3_1_gpu_runtime_release',
      replacementToolId:
        CANONICAL_SAM2_GPU_RUNTIME_RETIREMENT.replacementToolId,
      replacementOperationId:
        CANONICAL_SAM2_GPU_RUNTIME_RETIREMENT.replacementOperationId,
    },
  )
}
