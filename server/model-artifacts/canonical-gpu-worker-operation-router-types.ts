import type {
  CanonicalFasterWhisperGpuRuntimeRunnerRequest,
} from './canonical-faster-whisper-gpu-runtime-request-types'
import type {
  CanonicalFasterWhisperGpuRuntimeSuccessWireResponse,
} from './canonical-faster-whisper-gpu-runtime-result-types'

export const CANONICAL_GPU_WORKER_OPERATION_ROUTER_VERSION =
  'canonical-gpu-worker-operation-router-v1' as const
export const CANONICAL_GPU_WORKER_OPERATION_ROUTER_RECEIPT_VERSION =
  'canonical-gpu-worker-operation-router-receipt-v1' as const

export type CanonicalGpuWorkerOperationId =
  'tool.faster_whisper.transcribe_private_audio.v1'

export type CanonicalGpuWorkerRuntimePortEvidenceClass =
  | 'controlled_source_fixture'
  | 'fixed_gpu_subprocess_unqualified'

export interface CanonicalGpuWorkerOperationRuntimePortResult {
  readonly wireResponse: unknown
  readonly process: {
    readonly exitCode: number
    readonly timedOut: boolean
    readonly oomKilled: boolean
    readonly stdoutByteLength: number
    readonly stderrByteLength: number
    readonly stderrSha256: string
  }
}

export interface CanonicalGpuWorkerOperationRuntimePort {
  readonly portVersion:
    'canonical-gpu-worker-operation-runtime-port-v1'
  readonly evidenceClass:
    CanonicalGpuWorkerRuntimePortEvidenceClass
  readonly supportedOperationIds:
    readonly ['tool.faster_whisper.transcribe_private_audio.v1']
  execute(input: {
    readonly request:
      CanonicalFasterWhisperGpuRuntimeRunnerRequest
    readonly serializedRequest: string
    readonly maximumResponseBytes: number
    readonly timeoutMilliseconds: number
  }): Promise<CanonicalGpuWorkerOperationRuntimePortResult>
}

export interface CanonicalGpuWorkerOperationRouterReceipt {
  readonly receiptVersion:
    typeof CANONICAL_GPU_WORKER_OPERATION_ROUTER_RECEIPT_VERSION
  readonly routerVersion:
    typeof CANONICAL_GPU_WORKER_OPERATION_ROUTER_VERSION
  readonly receiptClass:
    'source_verified_operation_route_non_authoritative'
  readonly operation: {
    readonly operationId:
      'tool.faster_whisper.transcribe_private_audio.v1'
    readonly sharedWorkerType: 'gpu_ai_worker'
    readonly executionTarget: 'google_cloud_run_gpu'
    readonly accelerator: 'nvidia_l4'
    readonly device: 'cuda'
    readonly computeType: 'float16'
    readonly cpuFallbackAllowed: false
  }
  readonly request: {
    readonly admissionDigestSha256: string
    readonly requestBindingSha256: string
    readonly dispatchIntentId: string
    readonly dispatchBindingHash: string
    readonly attemptPlanHash: string
    readonly runtimeRegion: 'europe-west1'
    readonly serializedRequestByteLength: number
  }
  readonly runtimeContract: {
    readonly contractDigestSha256: string
    readonly sourceDigestSha256: string
    readonly exactCurrentSourceRevalidated: true
    readonly exactModelFileSetRevalidated: true
    readonly exactCudaOnlyProtocolRevalidated: true
  }
  readonly runtimePort: {
    readonly evidenceClass:
      CanonicalGpuWorkerRuntimePortEvidenceClass
    readonly processInvoked: true
    readonly oneShotPortConsumed: true
    readonly exitCode: 0
    readonly timedOut: false
    readonly oomKilled: false
    readonly stdoutByteLength: number
    readonly stderrByteLength: number
    readonly stderrSha256: string
  }
  readonly response:
    CanonicalFasterWhisperGpuRuntimeSuccessWireResponse
  readonly summary: {
    readonly exactOperationMatched: true
    readonly exactRequestBindingMatched: true
    readonly exactResponseLineageMatched: true
    readonly cudaSuccessWireShapeMatched: true
    readonly outputCount: 3
    readonly outputBytesIncluded: false
    readonly transcriptTextIncluded: false
    readonly callerPathsIncluded: false
    readonly callerUrlsIncluded: false
    readonly credentialsIncluded: false
  }
  readonly blockers: readonly string[]
  readonly boundaries: {
    readonly operationRouterSourceImplemented: true
    readonly processBoundRuntimePortRequired: true
    readonly controlledFixtureOnly:
      boolean
    readonly canonicalAttemptAuthorityRereadVerified: false
    readonly canonicalWorkerReceiptVerified: false
    readonly canonicalCompletionReceiptVerified: false
    readonly actualCloudRunExecutionVerified: false
    readonly runtimeImageIdentityVerified: false
    readonly liveServiceIdentityAndIamVerified: false
    readonly privateInputAndModelMountsVerified: false
    readonly outputBytesRereadVerified: false
    readonly outputArtifactCommitAuthority: false
    readonly transcriptAlignmentQaAuthority: false
    readonly captionTimingQaAuthority: false
    readonly attemptInternalCostEvidenceVerified: false
    readonly customerCostAuthority: false
    readonly cloudDispatchAuthority: false
    readonly providerAuthority: false
    readonly toolRegistryAuthority: false
    readonly workGraphAuthority: false
    readonly queueMutationAuthority: false
    readonly assetManifestAuthority: false
    readonly approvalAuthority: false
    readonly snapshotAuthority: false
    readonly renderAuthority: false
    readonly productionAuthority: false
  }
  readonly receiptDigestSha256: string
}
