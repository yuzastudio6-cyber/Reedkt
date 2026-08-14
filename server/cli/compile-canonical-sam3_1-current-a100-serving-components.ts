import {
  createCanonicalGcpSam31VertexServingRuntimeComponentOwner,
  canonicalSam31VertexServingRuntimeComponentRef,
} from '../services/canonical-sam3_1-vertex-serving-runtime-component-qualification-owner'
import {
  createWeEditProGcpLocalOperatorAuth,
} from './weeditpro-gcp-local-operator-auth'

const CONFIRMATION =
  'compile-one-weeditpro-sam31-current-a100-serving-component-set-v1' as const
const SOURCE_SET_ID =
  'sam31-a100-serving-v3-thirty-run-qualified-20260814-v2' as const
const SOURCE_SET_HASH =
  'bfd7af0743a68f2a0657b9c72f718daff5e1d0df4ff275be00936151a379a074' as const
const TARGET_QUALIFICATION_ID =
  'sam31-complete-source-a100-4k-20260814-v2' as const

if (process.env.WEEDITPRO_SAM31_A100_COMPONENT_CONFIRMATION !== CONFIRMATION) {
  throw new Error('Current A100 serving component compilation is not confirmed.')
}
const { storage } = createWeEditProGcpLocalOperatorAuth({
  confirmation: process.env.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
})
const owner = createCanonicalGcpSam31VertexServingRuntimeComponentOwner({
  storage,
})
const compiled = await owner.compileAndPersist({
  targetQualificationId: TARGET_QUALIFICATION_ID,
  sourceThirtyRunQualificationRef: {
    id: SOURCE_SET_ID,
    version: 1,
    contentHash: `sha256:${SOURCE_SET_HASH}`,
  },
  driverComponentId:
    `${TARGET_QUALIFICATION_ID}:vertex-serving-driver-and-cuda`,
  deterministicComponentId:
    `${TARGET_QUALIFICATION_ID}:vertex-serving-deterministic-run-set`,
})

process.stdout.write(`${JSON.stringify({
  schemaVersion:
    'weeditpro-sam3_1-current-a100-serving-component-compilation-receipt-v1',
  targetQualificationId: TARGET_QUALIFICATION_ID,
  sourceThirtyRunQualificationRef:
    compiled.driverAndCuda.sourceThirtyRunQualificationRef,
  immutableImageDigest: compiled.driverAndCuda.immutableImageDigest,
  driverAndCudaComponentRef:
    canonicalSam31VertexServingRuntimeComponentRef(
      compiled.driverAndCuda,
    ),
  deterministicRunSetComponentRef:
    canonicalSam31VertexServingRuntimeComponentRef(
      compiled.deterministicRunSet,
    ),
  deterministicRunCount:
    compiled.deterministicRunSet.componentKind === 'deterministic_run_set'
      ? compiled.deterministicRunSet.payload.deterministicRuns.length : 0,
  dedicatedEndpointPerRunScaleToZeroClaimed: false,
  freshScaleFromZeroReadinessRequiredBeforeDispatch: true,
  gpuInferenceExecutedByThisCommand: false,
  customerCreditsMutated: false,
  qaApproved: false,
  publicDeliveryAuthorized: false,
  productionAuthorityGranted: false,
}, null, 2)}\n`)
