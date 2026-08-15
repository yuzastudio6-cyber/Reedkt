import { z } from 'zod'

import {
  createCanonicalGcpSam31VertexServingRuntimeComponentOwner,
  canonicalSam31VertexServingRuntimeComponentRef,
} from '../services/canonical-sam3_1-vertex-serving-runtime-component-qualification-owner'
import {
  createWeEditProGcpLocalOperatorAuth,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE,
} from './weeditpro-gcp-local-operator-auth'

const CONFIRMATION =
  'compile-one-weeditpro-sam31-current-a100-serving-component-set-v1' as const
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('://'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const environment = z.object({
  WEEDITPRO_SAM31_A100_COMPONENT_CONFIRMATION: z.literal(CONFIRMATION),
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH:
    z.literal(WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE),
  WEEDITPRO_SAM31_A100_SOURCE_QUALIFICATION_SET_ID: safeId,
  WEEDITPRO_SAM31_A100_SOURCE_QUALIFICATION_RECEIPT_SHA256: sha256,
  WEEDITPRO_SAM31_A100_COMPONENT_TARGET_QUALIFICATION_ID: safeId,
}).strict().parse({
  WEEDITPRO_SAM31_A100_COMPONENT_CONFIRMATION:
    process.env.WEEDITPRO_SAM31_A100_COMPONENT_CONFIRMATION,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH:
    process.env.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
  WEEDITPRO_SAM31_A100_SOURCE_QUALIFICATION_SET_ID:
    process.env.WEEDITPRO_SAM31_A100_SOURCE_QUALIFICATION_SET_ID,
  WEEDITPRO_SAM31_A100_SOURCE_QUALIFICATION_RECEIPT_SHA256:
    process.env.WEEDITPRO_SAM31_A100_SOURCE_QUALIFICATION_RECEIPT_SHA256,
  WEEDITPRO_SAM31_A100_COMPONENT_TARGET_QUALIFICATION_ID:
    process.env.WEEDITPRO_SAM31_A100_COMPONENT_TARGET_QUALIFICATION_ID,
})
const sourceSetId =
  environment.WEEDITPRO_SAM31_A100_SOURCE_QUALIFICATION_SET_ID
const sourceSetHash =
  environment.WEEDITPRO_SAM31_A100_SOURCE_QUALIFICATION_RECEIPT_SHA256
const targetQualificationId =
  environment.WEEDITPRO_SAM31_A100_COMPONENT_TARGET_QUALIFICATION_ID
const { storage } = createWeEditProGcpLocalOperatorAuth({
  confirmation: environment.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
})
const owner = createCanonicalGcpSam31VertexServingRuntimeComponentOwner({
  storage,
})
const compiled = await owner.compileAndPersist({
  targetQualificationId,
  sourceThirtyRunQualificationRef: {
    id: sourceSetId,
    version: 1,
    contentHash: `sha256:${sourceSetHash}`,
  },
  driverComponentId:
    `${targetQualificationId}:vertex-serving-driver-and-cuda`,
  deterministicComponentId:
    `${targetQualificationId}:vertex-serving-deterministic-run-set`,
})

process.stdout.write(`${JSON.stringify({
  schemaVersion:
    'weeditpro-sam3_1-current-a100-serving-component-compilation-receipt-v1',
  targetQualificationId,
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
