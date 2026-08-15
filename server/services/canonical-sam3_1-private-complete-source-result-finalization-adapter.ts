import {
  assertCanonicalProfessionalGpuJobLaunch,
  assertCanonicalProfessionalGpuJobTerminal,
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import type {
  CanonicalProfessionalGpuDurableLifecycleStore,
} from './canonical-professional-gpu-durable-lifecycle-store'
import type {
  CanonicalSam31A100ResultFinalizationRuntimePort,
} from './canonical-sam3_1-a100-result-finalization-service'
import type {
  CanonicalSam31L4ResultFinalizationRuntimePort,
} from './canonical-sam3_1-l4-result-finalization-service'
import type {
  CanonicalSam31PrivateCompleteSourceChunkResultFinalizationPort,
  CanonicalSam31PrivateCompleteSourceChunkResultReadPort,
} from './canonical-sam3_1-private-complete-source-chunk-terminal-owner'
import {
  assertCanonicalSam31GpuRuntimeResultAdmission,
  assertCanonicalSam31PrivateOutputRereadEvidence,
  type CanonicalSam31GpuRuntimeResultStore,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-result-service'

export function createCanonicalSam31PrivateCompleteSourceResultFinalizationPort(
  input: {
    readonly a100: CanonicalSam31A100ResultFinalizationRuntimePort
    readonly l4: CanonicalSam31L4ResultFinalizationRuntimePort
  },
): CanonicalSam31PrivateCompleteSourceChunkResultFinalizationPort {
  if (typeof input.a100?.finalize !== 'function'
    || typeof input.l4?.finalize !== 'function') {
    throw new TypeError('SAM 3.1 complete-source finalizers are incomplete.')
  }
  const port: CanonicalSam31PrivateCompleteSourceChunkResultFinalizationPort = {
    schemaVersion:
      'canonical-sam3_1-private-complete-source-chunk-result-finalization-port-v1',
    privateInternalOnly: true,
    customerOrPublicDispatchAuthorized: false,
    async finalize(request) {
      assertPlainSerializedData(
        request,
        'sam3_1_private_complete_source_result_finalization_request',
      )
      if (request.routeId !== 'a100_80gb_heavy_primary'
        && request.routeId !== 'l4_heavy_fallback') {
        throw new TypeError('SAM 3.1 result route is unsupported.')
      }
      const result = request.routeId === 'a100_80gb_heavy_primary'
        ? await input.a100.finalize({
          invocationId: request.invocationId,
          launchRecordId: request.launchRecordId,
        })
        : await input.l4.finalize({
          invocationId: request.invocationId,
          launchRecordId: request.launchRecordId,
        })
      const exact = assertCanonicalSam31GpuRuntimeResultAdmission(result)
      if (exact.routeId !== request.routeId) {
        throw new TypeError('SAM 3.1 route finalizer crossed accelerators.')
      }
      return exact
    },
  }
  return Object.freeze(port)
}

export function createCanonicalSam31PrivateCompleteSourceChunkResultReadPort(
  input: {
    readonly lifecycleStore: CanonicalProfessionalGpuDurableLifecycleStore
    readonly resultStore: CanonicalSam31GpuRuntimeResultStore
  },
): CanonicalSam31PrivateCompleteSourceChunkResultReadPort {
  if (typeof input.lifecycleStore?.rereadLaunchRecord !== 'function'
    || typeof input.lifecycleStore?.rereadTerminalRecord !== 'function'
    || typeof input.resultStore?.rereadResultAdmission !== 'function'
    || typeof input.resultStore?.rereadPrivateOutputRereadEvidence !==
      'function') {
    throw new TypeError('SAM 3.1 complete-source result readers are incomplete.')
  }
  const port: CanonicalSam31PrivateCompleteSourceChunkResultReadPort = {
    schemaVersion:
      'canonical-sam3_1-private-complete-source-chunk-result-read-port-v1',
    privateInternalOnly: true,
    customerOrPublicDispatchAuthorized: false,
    async rereadLaunch({ launchRef }) {
      const launch = assertCanonicalProfessionalGpuJobLaunch(
        await input.lifecycleStore.rereadLaunchRecord({
          launchRecordId: launchRef.id,
        }),
      )
      assertRef(launchRef, launch.launchRecordId, launch.launchHash)
      return launch
    },
    async rereadTerminal({ terminalRef }) {
      const terminal = assertCanonicalProfessionalGpuJobTerminal(
        await input.lifecycleStore.rereadTerminalRecord({
          terminalRecordId: terminalRef.id,
        }),
      )
      assertRef(terminalRef, terminal.terminalRecordId, terminal.terminalHash)
      return terminal
    },
    async rereadResultAdmission({ invocationId, resultAdmissionRef }) {
      const result = assertCanonicalSam31GpuRuntimeResultAdmission(
        await input.resultStore.rereadResultAdmission(invocationId),
      )
      assertRef(
        resultAdmissionRef,
        result.resultAdmissionId,
        result.resultAdmissionHash,
      )
      return result
    },
    async rereadPrivateOutputEvidence({
      invocationId,
      privateOutputRereadEvidenceRef,
    }) {
      const output = assertCanonicalSam31PrivateOutputRereadEvidence(
        await input.resultStore.rereadPrivateOutputRereadEvidence(
          invocationId,
          privateOutputRereadEvidenceRef,
        ),
      )
      if (privateOutputRereadEvidenceRef.contentHash !==
        `sha256:${output.evidenceHash}`) {
        throw new TypeError('SAM 3.1 private output reread changed.')
      }
      return output
    },
  }
  return Object.freeze(port)
}

function assertRef(
  ref: { id: string; version: number; contentHash: string },
  id: string,
  hash: string,
): void {
  if (ref.id !== id || ref.version !== 1
    || ref.contentHash !== `sha256:${hash}`) {
    throw new TypeError('SAM 3.1 canonical result reference changed.')
  }
}
