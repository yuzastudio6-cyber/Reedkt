import { z } from 'zod'

import type {
  CanonicalSam31L4QualificationJob,
} from './canonical-sam3_1-l4-qualification-job-service'
import {
  CANONICAL_SAM3_1_L4_QUALIFICATION_JOB_RESOURCE,
  assertCanonicalSam31L4QualificationJobOnlyImageChanged,
} from './canonical-sam3_1-l4-qualification-job-service'
import { sha256AuthorityValue } from './private-edit-authority-store'

export const CANONICAL_SAM3_1_L4_QUALIFICATION_JOB_ROLLOUT_VERSION =
  'canonical-sam3_1-l4-qualification-job-image-rollout-v1' as const

const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..'))
const timestamp = z.string().datetime({ offset: true })
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const generation = z.string().regex(/^[1-9][0-9]*$/u)
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()

const receiptWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_L4_QUALIFICATION_JOB_ROLLOUT_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_l4_qualification_job_rollout_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  status: z.literal('qualification_image_rolled_out'),
  rolloutId: safeId,
  rolloutVersion: z.literal(1),
  operationId: z.literal('tool.sam3_1.segment_and_track_subject.v1'),
  jobResource: z.literal(
    CANONICAL_SAM3_1_L4_QUALIFICATION_JOB_RESOURCE,
  ),
  jobUid: z.string().uuid(),
  beforeGeneration: generation,
  afterGeneration: generation,
  previousImmutableImageDigest: prefixedSha256,
  immutableImageDigest: prefixedSha256,
  immutableImageUri: z.string().regex(
    /^us-central1-docker\.pkg\.dev\/reeditpro\/reeditpro-workers\/reeditpro-sam31-gpu@sha256:[a-f0-9]{64}$/u,
  ),
  imageSupplyChainReleaseRef: evidenceRefSchema,
  cloudRunPatchOperationRef: evidenceRefSchema,
  beforeJobConfigurationRef: evidenceRefSchema,
  afterJobConfigurationRef: evidenceRefSchema,
  rolledOutAt: timestamp,
  authority: z.object({
    exactImageSupplyChainReleaseReread: z.literal(true),
    noActiveExecutionsBeforePatch: z.literal(true),
    etagPreconditionApplied: z.literal(true),
    onlyImmutableImageDigestChanged: z.literal(true),
    exactReadyJobRereadAfterPatch: z.literal(true),
    noExecutionStartedByRollout: z.literal(true),
    noActiveExecutionsAfterPatch: z.literal(true),
    gpuRuntimeQualified: z.literal(false),
    runtimeReleaseGranted: z.literal(false),
    customerCreditMutationAllowed: z.literal(false),
    publicDeliveryAuthorized: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
}).strict().superRefine((value, context) => {
  if (
    value.previousImmutableImageDigest === value.immutableImageDigest
    || value.immutableImageUri !==
      `us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/`
        + `reeditpro-sam31-gpu@${value.immutableImageDigest}`
    || BigInt(value.afterGeneration) <= BigInt(value.beforeGeneration)
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 L4 qualification job rollout did not advance safely.',
  })
})

export const canonicalSam31L4QualificationJobRolloutReceiptSchema =
  receiptWithoutHashSchema.extend({ rolloutHash: prefixedSha256 }).strict()
export type CanonicalSam31L4QualificationJobRolloutReceipt = z.infer<
  typeof canonicalSam31L4QualificationJobRolloutReceiptSchema
>

export function createCanonicalSam31L4QualificationJobRolloutReceipt(input: {
  readonly rolloutId: string
  readonly before: CanonicalSam31L4QualificationJob
  readonly after: CanonicalSam31L4QualificationJob
  readonly imageSupplyChainReleaseRef: z.infer<typeof evidenceRefSchema>
  readonly cloudRunPatchOperationRef: z.infer<typeof evidenceRefSchema>
  readonly rolledOutAt: string
}): CanonicalSam31L4QualificationJobRolloutReceipt {
  assertCanonicalSam31L4QualificationJobOnlyImageChanged({
    before: input.before,
    after: input.after,
  })
  const previousImage = input.before.template.template.containers[0]!.image
  const immutableImageUri = input.after.template.template.containers[0]!.image
  const previousImmutableImageDigest = prefixedSha256.parse(
    previousImage.slice(previousImage.lastIndexOf('@') + 1),
  )
  const immutableImageDigest = prefixedSha256.parse(
    immutableImageUri.slice(immutableImageUri.lastIndexOf('@') + 1),
  )
  const beforeJobConfigurationRef = evidenceRef(
    `sam31-l4-job-configuration:${input.before.uid}:generation-${input.before.generation}`,
    input.before,
  )
  const afterJobConfigurationRef = evidenceRef(
    `sam31-l4-job-configuration:${input.after.uid}:generation-${input.after.generation}`,
    input.after,
  )
  const payload = receiptWithoutHashSchema.parse({
    schemaVersion: CANONICAL_SAM3_1_L4_QUALIFICATION_JOB_ROLLOUT_VERSION,
    source: 'canonical_server_sam3_1_l4_qualification_job_rollout_owner',
    evidenceClass: 'canonical_private_reread',
    status: 'qualification_image_rolled_out',
    rolloutId: input.rolloutId,
    rolloutVersion: 1,
    operationId: 'tool.sam3_1.segment_and_track_subject.v1',
    jobResource: input.after.name,
    jobUid: input.after.uid,
    beforeGeneration: input.before.generation,
    afterGeneration: input.after.generation,
    previousImmutableImageDigest,
    immutableImageDigest,
    immutableImageUri,
    imageSupplyChainReleaseRef: input.imageSupplyChainReleaseRef,
    cloudRunPatchOperationRef: input.cloudRunPatchOperationRef,
    beforeJobConfigurationRef,
    afterJobConfigurationRef,
    rolledOutAt: input.rolledOutAt,
    authority: {
      exactImageSupplyChainReleaseReread: true,
      noActiveExecutionsBeforePatch: true,
      etagPreconditionApplied: true,
      onlyImmutableImageDigestChanged: true,
      exactReadyJobRereadAfterPatch: true,
      noExecutionStartedByRollout: true,
      noActiveExecutionsAfterPatch: true,
      gpuRuntimeQualified: false,
      runtimeReleaseGranted: false,
      customerCreditMutationAllowed: false,
      publicDeliveryAuthorized: false,
      productionReady: false,
    },
  })
  return canonicalSam31L4QualificationJobRolloutReceiptSchema.parse({
    ...payload,
    rolloutHash: `sha256:${sha256AuthorityValue(payload)}`,
  })
}

export function assertCanonicalSam31L4QualificationJobRolloutReceipt(
  value: unknown,
): CanonicalSam31L4QualificationJobRolloutReceipt {
  const parsed = canonicalSam31L4QualificationJobRolloutReceiptSchema.parse(
    value,
  )
  const { rolloutHash: _rolloutHash, ...payload } = parsed
  void _rolloutHash
  if (parsed.rolloutHash !== `sha256:${sha256AuthorityValue(
    receiptWithoutHashSchema.parse(payload),
  )}`) throw new Error('sam31_l4_job_rollout_receipt_digest_changed')
  return parsed
}

function evidenceRef(id: string, value: unknown) {
  return evidenceRefSchema.parse({
    id,
    version: 1,
    contentHash: `sha256:${sha256AuthorityValue(value)}`,
  })
}
