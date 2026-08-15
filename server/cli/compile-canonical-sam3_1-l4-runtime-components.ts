import { z } from 'zod'

import {
  createCanonicalSam31GcpL4RuntimeComponentQualificationOwner,
} from '../services/canonical-sam3_1-l4-runtime-component-qualification-owner'
import {
  createWeEditProGcpLocalOperatorAuth,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE,
} from './weeditpro-gcp-local-operator-auth'

const CONFIRMATION =
  'compile-weeditpro-sam31-l4-runtime-components-v1' as const
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..'))
const environment = z.object({
  WEEDITPRO_SAM31_L4_COMPONENT_CONFIRMATION: z.literal(CONFIRMATION),
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH:
    z.literal(WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE),
  WEEDITPRO_SAM31_L4_DRIVER_COMPONENT_ID: safeId,
  WEEDITPRO_SAM31_L4_DETERMINISTIC_COMPONENT_ID: safeId,
  WEEDITPRO_SAM31_L4_QUALIFICATION_SET_ID: safeId,
  WEEDITPRO_SAM31_L4_QUALIFICATION_ID: safeId,
}).strict().parse({
  WEEDITPRO_SAM31_L4_COMPONENT_CONFIRMATION:
    process.env.WEEDITPRO_SAM31_L4_COMPONENT_CONFIRMATION,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH:
    process.env.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
  WEEDITPRO_SAM31_L4_DRIVER_COMPONENT_ID:
    process.env.WEEDITPRO_SAM31_L4_DRIVER_COMPONENT_ID,
  WEEDITPRO_SAM31_L4_DETERMINISTIC_COMPONENT_ID:
    process.env.WEEDITPRO_SAM31_L4_DETERMINISTIC_COMPONENT_ID,
  WEEDITPRO_SAM31_L4_QUALIFICATION_SET_ID:
    process.env.WEEDITPRO_SAM31_L4_QUALIFICATION_SET_ID,
  WEEDITPRO_SAM31_L4_QUALIFICATION_ID:
    process.env.WEEDITPRO_SAM31_L4_QUALIFICATION_ID,
})

const { storage } = createWeEditProGcpLocalOperatorAuth({
  confirmation: environment.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
})
const components = await
createCanonicalSam31GcpL4RuntimeComponentQualificationOwner({ storage })
  .compileAndPersistComponents({
    driverComponentId:
      environment.WEEDITPRO_SAM31_L4_DRIVER_COMPONENT_ID,
    deterministicComponentId:
      environment.WEEDITPRO_SAM31_L4_DETERMINISTIC_COMPONENT_ID,
    qualificationSetId:
      environment.WEEDITPRO_SAM31_L4_QUALIFICATION_SET_ID,
    qualificationId: environment.WEEDITPRO_SAM31_L4_QUALIFICATION_ID,
  })

process.stdout.write(`${JSON.stringify({
  ok: true,
  driverAndCuda: {
    componentId: components.driverAndCuda.componentId,
    componentHash: components.driverAndCuda.componentHash,
  },
  deterministicRunSet: {
    componentId: components.deterministicRunSet.componentId,
    componentHash: components.deterministicRunSet.componentHash,
    runCount: components.deterministicRunSet.componentKind ===
      'deterministic_run_set'
      ? components.deterministicRunSet.payload.length : 0,
  },
  gpuJobDispatched: false,
  customerCreditsMutated: false,
  runtimeReleaseGranted: false,
  productionAuthorityGranted: false,
})}\n`)
