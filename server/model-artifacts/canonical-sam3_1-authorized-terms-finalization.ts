import { z } from 'zod'

import { sha256AuthorityValue } from
  '../services/private-edit-authority-store'

export const CANONICAL_SAM3_1_AUTHORIZED_HUMAN_TERMS_INTENT_VERSION =
  'canonical-sam3_1-authorized-human-terms-intent-v1' as const
export const CANONICAL_SAM3_1_OFFICIAL_ACCESS_OBSERVATION_VERSION =
  'canonical-sam3_1-official-access-observation-v1' as const
export const CANONICAL_SAM3_1_AUTHORIZED_TERMS_FINALIZATION_VERSION =
  'canonical-sam3_1-authorized-terms-finalization-bundle-v1' as const

const SOURCE_REPOSITORY =
  'https://github.com/facebookresearch/sam3.git' as const
const CHECKPOINT_REPOSITORY = 'facebook/sam3.1' as const
const CHECKPOINT_REVISION =
  'daa63191845a41281374e725f4c9e51c7a824460' as const
const CHECKPOINT_FILE = 'sam3.1_multiplex.pt' as const
const LICENSE_LAST_UPDATED = '2025-11-19' as const

const safeId = z.string().trim().min(1).max(220)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()

const humanIntentWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_AUTHORIZED_HUMAN_TERMS_INTENT_VERSION,
  ),
  source: z.literal(
    'canonical_weeditpro_authorized_human_terms_acceptance_owner',
  ),
  evidenceClass: z.literal('authenticated_authorized_human_action'),
  intentId: safeId,
  intentVersion: z.literal(1),
  organizationAuthorityRef: evidenceRefSchema,
  authorizedRepresentativePrincipalRef: evidenceRefSchema,
  authenticatedSessionRef: evidenceRefSchema,
  sourceRepository: z.literal(SOURCE_REPOSITORY),
  checkpointRepository: z.literal(CHECKPOINT_REPOSITORY),
  licenseIdentity: z.literal('SAM License'),
  licenseLastUpdated: z.literal(LICENSE_LAST_UPDATED),
  acceptanceSurface: z.literal('official_hugging_face_gated_repository'),
  repositoryGating: z.literal('manual'),
  acceptedAt: timestamp,
  contactInformationSharingAcceptedByAuthorizedHuman: z.literal(true),
  approvedUseCase: z.literal(
    'private_commercial_video_editing_segmentation_and_tracking',
  ),
  militaryWarfareNuclearEspionageOrWeaponsUseAllowed: z.literal(false),
  legalReviewRef: evidenceRefSchema,
  privacyReviewRef: evidenceRefSchema,
  tradeControlsReviewRef: evidenceRefSchema,
  officialTermsPresentationEvidenceRef: evidenceRefSchema,
  boundary: z.object({
    directBrowserLoginAutomated: z.literal(false),
    termsAcceptedByAutomation: z.literal(false),
    callerTokenPathUrlOrCredentialAccepted: z.literal(false),
    thirdPartyMirrorAccepted: z.literal(false),
    browserOrWorkerSecretIncluded: z.literal(false),
  }).strict(),
  authority: z.object({
    authenticatedHumanAcceptanceEvidenceOnly: z.literal(true),
    officialRepositoryAccessVerified: z.literal(false),
    termsAcceptanceFinalized: z.literal(false),
    modelOrCheckpointDownloaded: z.literal(false),
    imageBuildAuthorized: z.literal(false),
    gpuRuntimeAuthorized: z.literal(false),
    customerCreditsMutated: z.literal(false),
    qaApproved: z.literal(false),
    publicDeliveryAuthorized: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
}).strict()

export const canonicalSam31AuthorizedHumanTermsIntentSchema =
  humanIntentWithoutHashSchema.extend({ intentHash: rawSha256 }).strict()
export type CanonicalSam31AuthorizedHumanTermsIntent = z.infer<
  typeof canonicalSam31AuthorizedHumanTermsIntentSchema
>

const humanIntentRefSchema = evidenceRefSchema.extend({
  version: z.literal(1),
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_AUTHORIZED_HUMAN_TERMS_INTENT_VERSION,
  ),
}).strict()

const accessObservationWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_OFFICIAL_ACCESS_OBSERVATION_VERSION,
  ),
  source: z.literal(
    'canonical_server_hugging_face_gated_repository_access_verifier',
  ),
  evidenceClass: z.literal(
    'official_authenticated_repository_metadata_reread',
  ),
  observationId: safeId,
  observationVersion: z.literal(1),
  humanTermsIntentRef: humanIntentRefSchema,
  checkpointRepository: z.literal(CHECKPOINT_REPOSITORY),
  checkpointRevision: z.literal(CHECKPOINT_REVISION),
  checkpointFileName: z.literal(CHECKPOINT_FILE),
  credentialVersionAuthorityRef: evidenceRefSchema,
  exactPinnedCredentialVersionUsed: z.literal(true),
  officialOriginPinned: z.literal(true),
  redirectFollowed: z.literal(false),
  repositoryMetadataResponseStatus: z.literal(200),
  repositoryGated: z.literal(true),
  authenticatedAccessGranted: z.literal(true),
  exactCheckpointRevisionObserved: z.literal(true),
  exactCheckpointFileObserved: z.literal(true),
  checkpointHeadResponseStatus: z.union([
    z.literal(302),
    z.literal(307),
  ]),
  checkpointRedirectTargetOriginAllowlisted: z.literal(true),
  checkpointLinkedByteLength: z.number().int().min(3_000_000_000)
    .max(5_000_000_000).safe(),
  checkpointLinkedEtagSha256: rawSha256,
  responseBodyDigestSha256: rawSha256,
  responseBodyPersisted: z.literal(false),
  secretValuePersistedLoggedOrReturned: z.literal(false),
  checkpointBytesDownloaded: z.literal(false),
  verifiedAt: timestamp,
  authority: z.object({
    accessObservationOnly: z.literal(true),
    humanTermsAcceptanceCreated: z.literal(false),
    artifactPublicationStarted: z.literal(false),
    imageBuildAuthorized: z.literal(false),
    gpuRuntimeAuthorized: z.literal(false),
    customerCreditsMutated: z.literal(false),
    qaApproved: z.literal(false),
    publicDeliveryAuthorized: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
}).strict()

export const canonicalSam31OfficialAccessObservationSchema =
  accessObservationWithoutHashSchema.extend({ observationHash: rawSha256 })
    .strict()
export type CanonicalSam31OfficialAccessObservation = z.infer<
  typeof canonicalSam31OfficialAccessObservationSchema
>

const accessObservationRefSchema = evidenceRefSchema.extend({
  version: z.literal(1),
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_OFFICIAL_ACCESS_OBSERVATION_VERSION,
  ),
}).strict()

const finalizationWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_AUTHORIZED_TERMS_FINALIZATION_VERSION,
  ),
  source: z.literal(
    'canonical_weeditpro_sam3_1_authorized_terms_finalization_owner',
  ),
  evidenceClass: z.literal(
    'authenticated_human_acceptance_and_official_access_reread',
  ),
  finalizationId: safeId,
  finalizationVersion: z.literal(1),
  humanTermsIntentRef: humanIntentRefSchema,
  officialAccessObservationRef: accessObservationRefSchema,
  organizationAuthorityRef: evidenceRefSchema,
  authorizedRepresentativePrincipalRef: evidenceRefSchema,
  authenticatedSessionRef: evidenceRefSchema,
  legalReviewRef: evidenceRefSchema,
  privacyReviewRef: evidenceRefSchema,
  tradeControlsReviewRef: evidenceRefSchema,
  officialTermsPresentationEvidenceRef: evidenceRefSchema,
  humanAcceptedAt: timestamp,
  officialAccessVerifiedAt: timestamp,
  finalizedAt: timestamp,
  exactHumanIntentReread: z.literal(true),
  exactOfficialAccessObservationReread: z.literal(true),
  callerAccessOrAcceptanceClaimsAccepted: z.literal(false),
  callerTokenPathUrlBytesOrCredentialsAccepted: z.literal(false),
  automatedTermsAcceptanceUsed: z.literal(false),
  thirdPartyMirrorUsed: z.literal(false),
  checkpointBytesDownloaded: z.literal(false),
  authority: z.object({
    termsFinalizationEvidenceOnly: z.literal(true),
    officialArtifactPublicationStarted: z.literal(false),
    modelInstalledOnDeveloperMachine: z.literal(false),
    imageBuildAuthorized: z.literal(false),
    gpuRuntimeAuthorized: z.literal(false),
    customerCreditsMutated: z.literal(false),
    qaApproved: z.literal(false),
    publicDeliveryAuthorized: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
}).strict().superRefine((value, context) => {
  if (
    Date.parse(value.humanAcceptedAt) >
      Date.parse(value.officialAccessVerifiedAt)
    || Date.parse(value.officialAccessVerifiedAt) >
      Date.parse(value.finalizedAt)
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 terms finalization chronology is invalid.',
  })
})

export const canonicalSam31AuthorizedTermsFinalizationBundleSchema =
  finalizationWithoutHashSchema.extend({ finalizationHash: rawSha256 }).strict()
export type CanonicalSam31AuthorizedTermsFinalizationBundle = z.infer<
  typeof canonicalSam31AuthorizedTermsFinalizationBundleSchema
>

export function createCanonicalSam31AuthorizedHumanTermsIntent(
  input: Omit<z.input<typeof humanIntentWithoutHashSchema>,
    'schemaVersion' | 'source' | 'evidenceClass'>,
): CanonicalSam31AuthorizedHumanTermsIntent {
  assertClosedPlainData(input, 'sam31_human_terms_intent')
  const payload = humanIntentWithoutHashSchema.parse({
    schemaVersion: CANONICAL_SAM3_1_AUTHORIZED_HUMAN_TERMS_INTENT_VERSION,
    source: 'canonical_weeditpro_authorized_human_terms_acceptance_owner',
    evidenceClass: 'authenticated_authorized_human_action',
    ...input,
  })
  return canonicalSam31AuthorizedHumanTermsIntentSchema.parse({
    ...payload,
    intentHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31AuthorizedHumanTermsIntent(
  value: unknown,
): CanonicalSam31AuthorizedHumanTermsIntent {
  assertClosedPlainData(value, 'sam31_human_terms_intent')
  const parsed = canonicalSam31AuthorizedHumanTermsIntentSchema.parse(value)
  const { intentHash, ...payload } = parsed
  if (intentHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 human terms intent hash is invalid.')
  }
  return parsed
}

export function canonicalSam31AuthorizedHumanTermsIntentRef(value: unknown):
z.infer<typeof humanIntentRefSchema> {
  const intent = assertCanonicalSam31AuthorizedHumanTermsIntent(value)
  return Object.freeze({
    id: intent.intentId,
    version: 1 as const,
    schemaVersion: intent.schemaVersion,
    contentHash: `sha256:${intent.intentHash}` as const,
  })
}

export function createCanonicalSam31OfficialAccessObservation(
  input: Omit<z.input<typeof accessObservationWithoutHashSchema>,
    'schemaVersion' | 'source' | 'evidenceClass'>,
): CanonicalSam31OfficialAccessObservation {
  assertClosedPlainData(input, 'sam31_official_access_observation')
  const payload = accessObservationWithoutHashSchema.parse({
    schemaVersion: CANONICAL_SAM3_1_OFFICIAL_ACCESS_OBSERVATION_VERSION,
    source: 'canonical_server_hugging_face_gated_repository_access_verifier',
    evidenceClass: 'official_authenticated_repository_metadata_reread',
    ...input,
  })
  return canonicalSam31OfficialAccessObservationSchema.parse({
    ...payload,
    observationHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31OfficialAccessObservation(
  value: unknown,
): CanonicalSam31OfficialAccessObservation {
  assertClosedPlainData(value, 'sam31_official_access_observation')
  const parsed = canonicalSam31OfficialAccessObservationSchema.parse(value)
  const { observationHash, ...payload } = parsed
  if (observationHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 official access observation hash is invalid.')
  }
  return parsed
}

export function canonicalSam31OfficialAccessObservationRef(value: unknown):
z.infer<typeof accessObservationRefSchema> {
  const observation = assertCanonicalSam31OfficialAccessObservation(value)
  return Object.freeze({
    id: observation.observationId,
    version: 1 as const,
    schemaVersion: observation.schemaVersion,
    contentHash: `sha256:${observation.observationHash}` as const,
  })
}

export function createCanonicalSam31AuthorizedTermsFinalizationBundle(
  input: Omit<z.input<typeof finalizationWithoutHashSchema>,
    'schemaVersion' | 'source' | 'evidenceClass'>,
): CanonicalSam31AuthorizedTermsFinalizationBundle {
  assertClosedPlainData(input, 'sam31_terms_finalization')
  const payload = finalizationWithoutHashSchema.parse({
    schemaVersion: CANONICAL_SAM3_1_AUTHORIZED_TERMS_FINALIZATION_VERSION,
    source: 'canonical_weeditpro_sam3_1_authorized_terms_finalization_owner',
    evidenceClass:
      'authenticated_human_acceptance_and_official_access_reread',
    ...input,
  })
  return canonicalSam31AuthorizedTermsFinalizationBundleSchema.parse({
    ...payload,
    finalizationHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31AuthorizedTermsFinalizationBundle(
  value: unknown,
): CanonicalSam31AuthorizedTermsFinalizationBundle {
  assertClosedPlainData(value, 'sam31_terms_finalization')
  const parsed = canonicalSam31AuthorizedTermsFinalizationBundleSchema.parse(
    value,
  )
  const { finalizationHash, ...payload } = parsed
  if (finalizationHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 terms finalization hash is invalid.')
  }
  return parsed
}

export function canonicalSam31AuthorizedTermsFinalizationBundleRef(
  value: unknown,
): {
  readonly id: string
  readonly version: 1
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_AUTHORIZED_TERMS_FINALIZATION_VERSION
  readonly contentHash: `sha256:${string}`
} {
  const bundle = assertCanonicalSam31AuthorizedTermsFinalizationBundle(value)
  return Object.freeze({
    id: bundle.finalizationId,
    version: 1,
    schemaVersion: bundle.schemaVersion,
    contentHash: `sha256:${bundle.finalizationHash}`,
  })
}

function assertClosedPlainData(value: unknown, label: string): void {
  const seen = new Set<object>()
  const visit = (item: unknown): void => {
    if (!item || typeof item !== 'object') return
    if (seen.has(item)) throw new Error(`${label} contains a cycle.`)
    let prototype: object | null
    let keys: readonly (string | symbol)[]
    try {
      prototype = Object.getPrototypeOf(item)
      keys = Reflect.ownKeys(item)
    } catch {
      throw new Error(`${label} contains an unreadable object.`)
    }
    if (prototype !== Object.prototype && prototype !== Array.prototype) {
      throw new Error(`${label} must contain plain data only.`)
    }
    seen.add(item)
    for (const key of keys) {
      if (typeof key !== 'string') {
        throw new Error(`${label} contains a symbol key.`)
      }
      let descriptor: PropertyDescriptor | undefined
      try {
        descriptor = Object.getOwnPropertyDescriptor(item, key)
      } catch {
        throw new Error(`${label} contains an unreadable property.`)
      }
      if (!descriptor || !('value' in descriptor)) {
        throw new Error(`${label} contains an accessor.`)
      }
      visit(descriptor.value)
    }
    seen.delete(item)
  }
  visit(value)
}
