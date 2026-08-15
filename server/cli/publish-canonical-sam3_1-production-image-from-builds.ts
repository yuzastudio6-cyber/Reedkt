import { z } from 'zod'

import {
  createCanonicalSam31GcpProductionCapsulePublisher,
} from '../services/canonical-sam3_1-production-capsule-publisher'
import {
  createCanonicalSam31ProductionImagePublicationCoordinator,
} from '../services/canonical-sam3_1-production-image-publication-coordinator'
import {
  createCanonicalSam31GcpProductionImageAuthorityPublisher,
} from '../services/canonical-sam3_1-production-image-authority-publisher'
import {
  createWeEditProGcpLocalOperatorAuth,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE,
} from './weeditpro-gcp-local-operator-auth'

const CONFIRMATION =
  'publish-one-qualified-sam31-production-image-from-two-builds-v2' as const
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const buildId = z.string().uuid()
const environment = z.object({
  WEEDITPRO_SAM31_PRODUCTION_IMAGE_PUBLICATION_CONFIRMATION:
    z.literal(CONFIRMATION),
  WEEDITPRO_SAM31_SOURCE_CHECKPOINT_QUALIFICATION_ID: safeId,
  WEEDITPRO_SAM31_SOURCE_CHECKPOINT_QUALIFICATION_SHA256: rawSha256,
  WEEDITPRO_SAM31_PRODUCTION_CAPSULE_PRIMARY_BUILD_ID: buildId,
  WEEDITPRO_SAM31_PRODUCTION_CAPSULE_CONFIRMATION_BUILD_ID: buildId,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH: z.literal(
    WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE,
  ),
}).strict().superRefine((value, context) => {
  if (value.WEEDITPRO_SAM31_PRODUCTION_CAPSULE_PRIMARY_BUILD_ID
    === value.WEEDITPRO_SAM31_PRODUCTION_CAPSULE_CONFIRMATION_BUILD_ID) {
    context.addIssue({
      code: 'custom',
      message: 'Two independent production capsule builds are required.',
    })
  }
}).parse({
  WEEDITPRO_SAM31_PRODUCTION_IMAGE_PUBLICATION_CONFIRMATION:
    process.env.WEEDITPRO_SAM31_PRODUCTION_IMAGE_PUBLICATION_CONFIRMATION,
  WEEDITPRO_SAM31_SOURCE_CHECKPOINT_QUALIFICATION_ID:
    process.env.WEEDITPRO_SAM31_SOURCE_CHECKPOINT_QUALIFICATION_ID,
  WEEDITPRO_SAM31_SOURCE_CHECKPOINT_QUALIFICATION_SHA256:
    process.env.WEEDITPRO_SAM31_SOURCE_CHECKPOINT_QUALIFICATION_SHA256,
  WEEDITPRO_SAM31_PRODUCTION_CAPSULE_PRIMARY_BUILD_ID:
    process.env.WEEDITPRO_SAM31_PRODUCTION_CAPSULE_PRIMARY_BUILD_ID,
  WEEDITPRO_SAM31_PRODUCTION_CAPSULE_CONFIRMATION_BUILD_ID:
    process.env.WEEDITPRO_SAM31_PRODUCTION_CAPSULE_CONFIRMATION_BUILD_ID,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH:
    process.env.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
})

const { storage } = createWeEditProGcpLocalOperatorAuth({
  confirmation: environment.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
})

const result = await createCanonicalSam31ProductionImagePublicationCoordinator({
  capsulePublisher: createCanonicalSam31GcpProductionCapsulePublisher({
    storage,
  }),
  authorityPublisher:
    createCanonicalSam31GcpProductionImageAuthorityPublisher({ storage }),
}).publish({
  sourceCheckpointQualificationRef: {
    id: environment.WEEDITPRO_SAM31_SOURCE_CHECKPOINT_QUALIFICATION_ID,
    version: 2,
    schemaVersion:
      'canonical-sam3_1-source-checkpoint-compatibility-qualification-v2',
    contentHash:
      `sha256:${environment.WEEDITPRO_SAM31_SOURCE_CHECKPOINT_QUALIFICATION_SHA256}`,
  },
  primaryBuildId:
    environment.WEEDITPRO_SAM31_PRODUCTION_CAPSULE_PRIMARY_BUILD_ID,
  confirmationBuildId:
    environment.WEEDITPRO_SAM31_PRODUCTION_CAPSULE_CONFIRMATION_BUILD_ID,
})

process.stdout.write(`${JSON.stringify(result)}\n`)
