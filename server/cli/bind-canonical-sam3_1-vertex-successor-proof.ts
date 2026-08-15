import { z } from 'zod'

import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalSam31PrivateCompleteSourceQualificationAdmissionRepository,
} from '../services/canonical-sam3_1-private-complete-source-qualification-admission-owner'
import {
  assertCanonicalSam31VertexCompleteSourceQualificationResult,
  createCanonicalSam31VertexCompleteSourceQualificationInvocationRepository,
} from '../services/canonical-sam3_1-vertex-complete-source-qualification-invocation-service'
import {
  createCanonicalSam31VertexCompleteSourceQualificationPreparationRepository,
} from '../services/canonical-sam3_1-vertex-complete-source-qualification-preparation-service'
import {
  assertCanonicalSam31VertexServingRuntimeComponentEvidence,
  canonicalSam31VertexServingRuntimeComponentRef,
} from '../services/canonical-sam3_1-vertex-serving-runtime-component-qualification-owner'
import {
  canonicalSam31VertexSuccessorProofBindingRef,
  createCanonicalSam31VertexSuccessorProofBindingOwner,
  createCanonicalSam31VertexSuccessorProofBindingRepository,
} from '../services/canonical-sam3_1-vertex-successor-proof-binding-owner'
import {
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  createWeEditProGcpLocalOperatorAuth,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE,
} from './weeditpro-gcp-local-operator-auth'

const CONFIRMATION =
  'bind-one-weeditpro-sam31-vertex-successor-proof-v1' as const
const CONTROL_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const QUALIFICATION_ID =
  'sam31-complete-source-a100-v8-4k-corrected-20260815-v1' as const
const INVOCATION_ID =
  `sam31-a100-qualification:${QUALIFICATION_ID}.chunk-001.run-01.execution` as const
const DRIVER_COMPONENT_ID =
  `${QUALIFICATION_ID}:vertex-serving-driver-and-cuda` as const
const DETERMINISTIC_COMPONENT_ID =
  `${QUALIFICATION_ID}:vertex-serving-deterministic-run-set` as const
const COMPONENT_PREFIX =
  'private/sam3_1/gpu-runtime-qualification/v3/vertex-serving-components'
const PROOF_BINDING_ID =
  'sam31-a100-v8-4k-corrected-successor-proof-20260815-v1' as const

z.object({
  WEEDITPRO_SAM31_VERTEX_SUCCESSOR_PROOF_CONFIRMATION:
    z.literal(CONFIRMATION),
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH:
    z.literal(WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE),
}).strict().parse({
  WEEDITPRO_SAM31_VERTEX_SUCCESSOR_PROOF_CONFIRMATION:
    process.env.WEEDITPRO_SAM31_VERTEX_SUCCESSOR_PROOF_CONFIRMATION,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH:
    process.env.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
})

const { storage } = createWeEditProGcpLocalOperatorAuth({
  confirmation: WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE,
})
const objectPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
  storage,
  bucketName: CONTROL_BUCKET,
})
const [driverBody, deterministicBody] = await Promise.all([
  objectPort.readExact(`${COMPONENT_PREFIX}/${DRIVER_COMPONENT_ID}.json`),
  objectPort.readExact(
    `${COMPONENT_PREFIX}/${DETERMINISTIC_COMPONENT_ID}.json`,
  ),
])
if (!driverBody || !deterministicBody) {
  throw new Error('Current successor continuity evidence is absent.')
}
const driver = assertCanonicalSam31VertexServingRuntimeComponentEvidence(
  JSON.parse(driverBody.toString('utf8')) as unknown,
)
const deterministic =
  assertCanonicalSam31VertexServingRuntimeComponentEvidence(
    JSON.parse(deterministicBody.toString('utf8')) as unknown,
  )
if (stableAuthorityStringify(driver) !== driverBody.toString('utf8')
  || stableAuthorityStringify(deterministic) !==
    deterministicBody.toString('utf8')) {
  throw new Error('Current successor continuity evidence changed.')
}

const invocationRepository =
  createCanonicalSam31VertexCompleteSourceQualificationInvocationRepository({
    objectPort,
  })
const terminal =
  assertCanonicalSam31VertexCompleteSourceQualificationResult(
    await invocationRepository.rereadTerminal({
      invocationId: INVOCATION_ID,
    }),
  )
const parentRepository =
  createCanonicalSam31PrivateCompleteSourceQualificationAdmissionRepository({
    objectPort,
  })
const preparationRepository =
  createCanonicalSam31VertexCompleteSourceQualificationPreparationRepository({
    objectPort,
  })
const [parent, preparation] = await Promise.all([
  parentRepository.reread({
    admissionRef: terminal.parentQualificationAdmissionRef,
  }),
  preparationRepository.reread({ invocationId: INVOCATION_ID }),
])
if (!parent || !preparation) {
  throw new Error('Current successor proof admission or preparation is absent.')
}

const owner = createCanonicalSam31VertexSuccessorProofBindingOwner({
  readPort: {
    async rereadContinuityComponent({ componentRef }) {
      const driverRef = canonicalSam31VertexServingRuntimeComponentRef(driver)
      const deterministicRef =
        canonicalSam31VertexServingRuntimeComponentRef(deterministic)
      if (sameRef(componentRef, driverRef)) return structuredClone(driver)
      if (sameRef(componentRef, deterministicRef)) {
        return structuredClone(deterministic)
      }
      return null
    },
    async rereadParentAdmission({ admissionRef }) {
      return sameRef(admissionRef, terminal.parentQualificationAdmissionRef)
        ? structuredClone(parent) : null
    },
    async rereadPreparation({ invocationId }) {
      return invocationId === INVOCATION_ID
        ? structuredClone(preparation) : null
    },
    async rereadTerminalResult({ invocationId }) {
      return invocationId === INVOCATION_ID
        ? structuredClone(terminal) : null
    },
  },
  repository: createCanonicalSam31VertexSuccessorProofBindingRepository({
    objectPort,
  }),
})
const binding = await owner.bindAndPersist({
  proofBindingId: PROOF_BINDING_ID,
  continuityDriverComponentRef:
    canonicalSam31VertexServingRuntimeComponentRef(driver),
  continuityDeterministicComponentRef:
    canonicalSam31VertexServingRuntimeComponentRef(deterministic),
  parentQualificationAdmissionRef: terminal.parentQualificationAdmissionRef,
  qualificationPreparationRef: terminal.qualificationPreparationRef,
  invocationId: INVOCATION_ID,
  recordedAt: new Date().toISOString(),
})

process.stdout.write(`${JSON.stringify({
  schemaVersion: 'weeditpro-sam31-vertex-successor-proof-cli-receipt-v1',
  proofBindingRef: canonicalSam31VertexSuccessorProofBindingRef(binding),
  qualificationId: binding.qualificationId,
  immutableImageDigest: binding.immutableImageDigest,
  successorSingle4kChunkGpuExecutionVerified:
    binding.successorSingle4kChunkGpuExecutionVerified,
  predecessorThirtyRunEvidenceRetained:
    binding.predecessorThirtyRunEvidenceRetained,
  successorThirtyRunPerformanceClaimed:
    binding.successorThirtyRunPerformanceClaimed,
  exactEightMinutePerformanceClaimed:
    binding.exactEightMinutePerformanceClaimed,
  independentTemporalQualityClaimed:
    binding.independentTemporalQualityClaimed,
  gpuJobStarted: false,
  automaticRetryOrFallbackStarted: false,
  customerCreditsMutated: false,
  publicDeliveryAuthorized: false,
  productionAuthorityGranted: false,
}, null, 2)}\n`)

function sameRef(
  left: { id: string; version: number; contentHash: string },
  right: { id: string; version: number; contentHash: string },
): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}
