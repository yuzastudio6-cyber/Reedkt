import { z } from 'zod'

import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'

export const CANONICAL_SAM3_1_L4_CROSS_ACCELERATOR_BASELINE_BINDING_VERSION =
  'canonical-sam3_1-l4-cross-accelerator-baseline-binding-v1' as const

const A100_QUALIFICATION_ID =
  'sam31-a100-v6-thirty-qualified-20260815-v1' as const
const A100_QUALIFICATION_HASH =
  'sha256:c3a0351d3542be81f0dd6e4ac821b82db2196485d64c8253b482632fc01d0552' as const
const A100_IMAGE_DIGEST =
  'sha256:953a883366f51350933bf4b7911b34e652e4edc30e4e81fdf57e661c675c055f' as const
const L4_IMAGE_RELEASE_ID =
  'sam31-production-image-supply-chain-release-1e538370613078300244ad49' as const
const L4_IMAGE_RELEASE_HASH =
  'sha256:50d2c190e6dd931a57f96a58a9320f8f0d4ea5b0f8c2be04f4028d453cdb4b34' as const
const L4_IMAGE_DIGEST =
  'sha256:3868667afbfae195ff6f952ff418c6f94babbd2e447d796fd90000231079a85f' as const

const refSchema = z.object({
  id: z.string().trim().min(1).max(240),
  version: z.literal(1),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()

const requestSchema = z.object({
  a100ServingQualificationRef: refSchema,
  a100ImmutableImageDigest: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
  l4ImageSupplyChainReleaseRef: refSchema,
  l4ImmutableImageDigest: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()

export function assertCanonicalSam31L4CrossAcceleratorBaselineBinding(
  untrusted: unknown,
) {
  assertPlainSerializedData(
    untrusted,
    'sam31_l4_cross_accelerator_baseline_binding',
  )
  const request = requestSchema.parse(untrusted)
  if (
    request.a100ServingQualificationRef.id !== A100_QUALIFICATION_ID
    || request.a100ServingQualificationRef.contentHash !==
      A100_QUALIFICATION_HASH
    || request.a100ImmutableImageDigest !== A100_IMAGE_DIGEST
    || request.l4ImageSupplyChainReleaseRef.id !== L4_IMAGE_RELEASE_ID
    || request.l4ImageSupplyChainReleaseRef.contentHash !==
      L4_IMAGE_RELEASE_HASH
    || request.l4ImmutableImageDigest !== L4_IMAGE_DIGEST
  ) {
    throw new Error(
      'sam31_l4_cross_accelerator_baseline_image_lineage_unqualified',
    )
  }
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_L4_CROSS_ACCELERATOR_BASELINE_BINDING_VERSION,
    source:
      'canonical_backend_sam3_1_l4_cross_accelerator_baseline_owner' as const,
    status: 'exact_qualified_image_pair_bound' as const,
    a100ServingQualificationRef:
      structuredClone(request.a100ServingQualificationRef),
    a100ImmutableImageDigest: request.a100ImmutableImageDigest,
    l4ImageSupplyChainReleaseRef:
      structuredClone(request.l4ImageSupplyChainReleaseRef),
    l4ImmutableImageDigest: request.l4ImmutableImageDigest,
    successorImageRequiresOwnExactA100ProbeBaseline: true as const,
    preflightMustCompleteBeforeGpuLaunch: true as const,
    gpuJobDispatched: false as const,
    customerCreditsMutated: false as const,
    qaApproved: false as const,
    runtimeReleaseGranted: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
  })
}
