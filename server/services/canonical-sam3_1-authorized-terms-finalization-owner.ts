import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  CANONICAL_SAM3_1_AUTHORIZED_HUMAN_TERMS_INTENT_VERSION,
  CANONICAL_SAM3_1_AUTHORIZED_TERMS_FINALIZATION_VERSION,
  CANONICAL_SAM3_1_OFFICIAL_ACCESS_OBSERVATION_VERSION,
  assertCanonicalSam31AuthorizedHumanTermsIntent,
  assertCanonicalSam31AuthorizedTermsFinalizationBundle,
  assertCanonicalSam31OfficialAccessObservation,
  canonicalSam31AuthorizedHumanTermsIntentRef,
  canonicalSam31AuthorizedTermsFinalizationBundleRef,
  canonicalSam31OfficialAccessObservationRef,
  createCanonicalSam31AuthorizedTermsFinalizationBundle,
  type CanonicalSam31AuthorizedHumanTermsIntent,
  type CanonicalSam31AuthorizedTermsFinalizationBundle,
  type CanonicalSam31OfficialAccessObservation,
} from '../model-artifacts/canonical-sam3_1-authorized-terms-finalization'
import {
  assertCanonicalSam31AuthorizedTermsAcceptance,
  createCanonicalSam31AuthorizedTermsAcceptance,
  type CanonicalSam31AuthorizedTermsAcceptance,
} from '../model-artifacts/canonical-sam3_1-private-artifact-ingest'
import {
  type CanonicalCreateOnlyJsonObjectPort,
  createCanonicalGcsSourceAnalysisJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import { stableAuthorityStringify } from './private-edit-authority-store'

export const CANONICAL_SAM3_1_AUTHORIZED_TERMS_FINALIZATION_OWNER_VERSION =
  'canonical-sam3_1-authorized-terms-finalization-owner-v1' as const
export const CANONICAL_SAM3_1_AUTHORIZED_TERMS_FINALIZATION_REPOSITORY_VERSION =
  'canonical-sam3_1-authorized-terms-finalization-repository-v1' as const

const PROJECT_ID = 'reeditpro' as const
const CONTROL_PLANE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const INTENT_PREFIX = 'private/sam3_1/terms-intent/v1' as const
const ACCESS_PREFIX = 'private/sam3_1/official-access/v1' as const
const FINALIZATION_PREFIX = 'private/sam3_1/terms-finalization/v1' as const
const TERMS_PREFIX = 'private/sam3_1/terms-acceptance/v1' as const
const MAXIMUM_RECORD_BYTES = 512 * 1024
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()
const intentRefSchema = evidenceRefSchema.extend({
  version: z.literal(1),
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_AUTHORIZED_HUMAN_TERMS_INTENT_VERSION,
  ),
}).strict()
const accessRefSchema = evidenceRefSchema.extend({
  version: z.literal(1),
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_OFFICIAL_ACCESS_OBSERVATION_VERSION,
  ),
}).strict()
const finalizationRefSchema = evidenceRefSchema.extend({
  version: z.literal(1),
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_AUTHORIZED_TERMS_FINALIZATION_VERSION,
  ),
}).strict()
const termsRefSchema = evidenceRefSchema.extend({
  version: z.literal(1),
}).strict()

export interface CanonicalSam31OfficialAccessVerificationPort {
  readonly schemaVersion:
    'canonical-sam3_1-official-access-verification-port-v1'
  verifyOfficialGatedRepositoryAccess(input: {
    readonly humanTermsIntent: CanonicalSam31AuthorizedHumanTermsIntent
  }): Promise<CanonicalSam31OfficialAccessObservation>
}

export interface CanonicalSam31AuthorizedTermsFinalizationRepository {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_AUTHORIZED_TERMS_FINALIZATION_REPOSITORY_VERSION
  readonly evidenceClass: 'private_create_only_exact_reread'
  persistHumanTermsIntentCreateOnly(input: {
    readonly humanTermsIntent: CanonicalSam31AuthorizedHumanTermsIntent
  }): Promise<'created' | 'identical_replay'>
  rereadHumanTermsIntent(input: {
    readonly humanTermsIntentRef: z.infer<typeof intentRefSchema>
  }): Promise<CanonicalSam31AuthorizedHumanTermsIntent | null>
  persistOfficialAccessObservationCreateOnly(input: {
    readonly observation: CanonicalSam31OfficialAccessObservation
  }): Promise<'created' | 'identical_replay'>
  rereadOfficialAccessObservation(input: {
    readonly observationRef: z.infer<typeof accessRefSchema>
  }): Promise<CanonicalSam31OfficialAccessObservation | null>
  persistTermsFinalizationCreateOnly(input: {
    readonly finalization:
      CanonicalSam31AuthorizedTermsFinalizationBundle
  }): Promise<'created' | 'identical_replay'>
  rereadTermsFinalization(input: {
    readonly finalizationRef: z.infer<typeof finalizationRefSchema>
  }): Promise<CanonicalSam31AuthorizedTermsFinalizationBundle | null>
  persistTermsAcceptanceCreateOnly(input: {
    readonly termsAcceptance: CanonicalSam31AuthorizedTermsAcceptance
  }): Promise<'created' | 'identical_replay'>
  rereadTermsAcceptance(input: {
    readonly termsAcceptanceRef: z.infer<typeof termsRefSchema>
  }): Promise<CanonicalSam31AuthorizedTermsAcceptance | null>
}

export interface CanonicalSam31AuthorizedTermsFinalizationOwner {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_AUTHORIZED_TERMS_FINALIZATION_OWNER_VERSION
  readonly evidenceClass:
    'authenticated_human_intent_plus_server_verified_official_access'
  finalizeAuthorizedTermsAcceptance(input: {
    readonly humanTermsIntentRef: z.infer<typeof intentRefSchema>
  }): Promise<{
    readonly disposition: 'created' | 'identical_replay'
    readonly officialAccessObservationRef: z.infer<typeof accessRefSchema>
    readonly termsFinalizationRef: z.infer<typeof finalizationRefSchema>
    readonly termsAcceptanceRef: z.infer<typeof termsRefSchema>
    readonly exactAuthenticatedHumanIntentReread: true
    readonly officialGatedAccessVerifiedByServer: true
    readonly callerAcceptanceOrAccessClaimsAccepted: false
    readonly browserLoginOrTermsAcceptanceAutomated: false
    readonly modelInstalledOnDeveloperMachine: false
    readonly checkpointBytesDownloaded: false
    readonly artifactPublicationStarted: false
    readonly gpuRuntimeStarted: false
    readonly customerCreditsMutated: false
    readonly publicDeliveryAuthorized: false
    readonly productionReady: false
  }>
}

export function createCanonicalSam31AuthorizedTermsFinalizationOwner(input: {
  readonly repository: CanonicalSam31AuthorizedTermsFinalizationRepository
  readonly officialAccessVerificationPort:
    CanonicalSam31OfficialAccessVerificationPort
  readonly now: () => string
}): CanonicalSam31AuthorizedTermsFinalizationOwner {
  if (
    typeof input.repository?.rereadHumanTermsIntent !== 'function'
    || typeof input.repository
      .persistOfficialAccessObservationCreateOnly !== 'function'
    || typeof input.repository.rereadOfficialAccessObservation !== 'function'
    || typeof input.repository.persistTermsFinalizationCreateOnly !== 'function'
    || typeof input.repository.rereadTermsFinalization !== 'function'
    || typeof input.repository.persistTermsAcceptanceCreateOnly !== 'function'
    || typeof input.repository.rereadTermsAcceptance !== 'function'
    || typeof input.officialAccessVerificationPort
      ?.verifyOfficialGatedRepositoryAccess !== 'function'
    || typeof input.now !== 'function'
  ) throw new Error('SAM 3.1 authorized terms finalization ports are incomplete.')

  const owner: CanonicalSam31AuthorizedTermsFinalizationOwner = {
    schemaVersion:
      CANONICAL_SAM3_1_AUTHORIZED_TERMS_FINALIZATION_OWNER_VERSION,
    evidenceClass:
      'authenticated_human_intent_plus_server_verified_official_access',
    async finalizeAuthorizedTermsAcceptance(untrusted) {
      assertPlainSerializedData(untrusted, 'sam31_terms_finalization_request')
      const request = z.object({
        humanTermsIntentRef: intentRefSchema,
      }).strict().parse(untrusted)
      const intent = assertCanonicalSam31AuthorizedHumanTermsIntent(
        await input.repository.rereadHumanTermsIntent({
          humanTermsIntentRef: request.humanTermsIntentRef,
        }),
      )
      if (!sameRef(
        canonicalSam31AuthorizedHumanTermsIntentRef(intent),
        request.humanTermsIntentRef,
      )) throw new Error('SAM 3.1 human terms intent reference changed.')

      const accessObservation = assertCanonicalSam31OfficialAccessObservation(
        await input.officialAccessVerificationPort
          .verifyOfficialGatedRepositoryAccess({ humanTermsIntent: intent }),
      )
      const accessRef = accessRefSchema.parse(
        canonicalSam31OfficialAccessObservationRef(accessObservation),
      )
      if (
        !sameRef(accessObservation.humanTermsIntentRef,
          request.humanTermsIntentRef)
        || Date.parse(intent.acceptedAt) > Date.parse(accessObservation.verifiedAt)
      ) throw new Error('SAM 3.1 official access crossed human terms lineage.')
      const accessDisposition = await input.repository
        .persistOfficialAccessObservationCreateOnly({
          observation: accessObservation,
        })
      const accessReread = assertCanonicalSam31OfficialAccessObservation(
        await input.repository.rereadOfficialAccessObservation({
          observationRef: accessRef,
        }),
      )
      if (!exact(accessReread, accessObservation)) {
        throw new Error('SAM 3.1 official access persistence changed.')
      }

      const finalizedAt = z.string().datetime({ offset: true }).parse(input.now())
      if (Date.parse(accessObservation.verifiedAt) > Date.parse(finalizedAt)) {
        throw new Error('SAM 3.1 terms finalization time precedes access proof.')
      }
      const finalization = createCanonicalSam31AuthorizedTermsFinalizationBundle({
        finalizationId: safeId.parse(`sam31-final-${intent.intentId}`),
        finalizationVersion: 1,
        humanTermsIntentRef: request.humanTermsIntentRef,
        officialAccessObservationRef: accessRef,
        organizationAuthorityRef: intent.organizationAuthorityRef,
        authorizedRepresentativePrincipalRef:
          intent.authorizedRepresentativePrincipalRef,
        authenticatedSessionRef: intent.authenticatedSessionRef,
        legalReviewRef: intent.legalReviewRef,
        privacyReviewRef: intent.privacyReviewRef,
        tradeControlsReviewRef: intent.tradeControlsReviewRef,
        officialTermsPresentationEvidenceRef:
          intent.officialTermsPresentationEvidenceRef,
        humanAcceptedAt: intent.acceptedAt,
        officialAccessVerifiedAt: accessObservation.verifiedAt,
        finalizedAt,
        exactHumanIntentReread: true,
        exactOfficialAccessObservationReread: true,
        callerAccessOrAcceptanceClaimsAccepted: false,
        callerTokenPathUrlBytesOrCredentialsAccepted: false,
        automatedTermsAcceptanceUsed: false,
        thirdPartyMirrorUsed: false,
        checkpointBytesDownloaded: false,
        authority: {
          termsFinalizationEvidenceOnly: true,
          officialArtifactPublicationStarted: false,
          modelInstalledOnDeveloperMachine: false,
          imageBuildAuthorized: false,
          gpuRuntimeAuthorized: false,
          customerCreditsMutated: false,
          qaApproved: false,
          publicDeliveryAuthorized: false,
          productionReady: false,
        },
      })
      const finalizationRef = finalizationRefSchema.parse(
        canonicalSam31AuthorizedTermsFinalizationBundleRef(finalization),
      )
      const finalizationDisposition = await input.repository
        .persistTermsFinalizationCreateOnly({ finalization })
      const finalizationReread =
        assertCanonicalSam31AuthorizedTermsFinalizationBundle(
          await input.repository.rereadTermsFinalization({ finalizationRef }),
        )
      if (!exact(finalizationReread, finalization)) {
        throw new Error('SAM 3.1 terms finalization persistence changed.')
      }

      const terms = createCanonicalSam31AuthorizedTermsAcceptance({
        evidenceClass: 'canonical_private_reread',
        acceptanceRecordId: safeId.parse(`sam31-terms-${intent.intentId}`),
        acceptanceRecordVersion: 1,
        sourceRepository: intent.sourceRepository,
        checkpointRepository: intent.checkpointRepository,
        licenseIdentity: intent.licenseIdentity,
        licenseLastUpdated: intent.licenseLastUpdated,
        acceptanceSurface: intent.acceptanceSurface,
        repositoryGating: intent.repositoryGating,
        acceptedAt: intent.acceptedAt,
        acceptedByAuthorizedOrganizationRepresentative: true,
        authorizedRepresentativeAuthorityRereadVerified: true,
        contactInformationSharingAcceptedByAuthorizedHuman: true,
        officialRepositoryAccessGrantedAndReread: true,
        automatedAcceptanceUsed: false,
        thirdPartyMirrorUsed: false,
        approvedUseCase: intent.approvedUseCase,
        militaryWarfareNuclearEspionageOrWeaponsUseAllowed: false,
        legalReviewRef: intent.legalReviewRef,
        privacyReviewRef: intent.privacyReviewRef,
        tradeControlsReviewRef: intent.tradeControlsReviewRef,
        termsEvidenceRef: {
          id: finalizationRef.id,
          version: finalizationRef.version,
          contentHash: finalizationRef.contentHash,
        },
        browserOrWorkerSecretIncluded: false,
      })
      const termsRef = termsRefSchema.parse({
        id: terms.acceptanceRecordId,
        version: terms.acceptanceRecordVersion,
        contentHash: `sha256:${terms.acceptanceRecordHash}`,
      })
      const termsDisposition = await input.repository
        .persistTermsAcceptanceCreateOnly({ termsAcceptance: terms })
      const termsReread = assertCanonicalSam31AuthorizedTermsAcceptance(
        await input.repository.rereadTermsAcceptance({
          termsAcceptanceRef: termsRef,
        }),
      )
      if (
        !exact(termsReread, terms)
        || !sameRef(termsReread.termsEvidenceRef, finalizationRef)
      ) throw new Error('SAM 3.1 terms acceptance persistence changed.')

      const dispositions = [
        accessDisposition,
        finalizationDisposition,
        termsDisposition,
      ]
      const disposition = dispositions.every((value) =>
        value === 'identical_replay')
        ? 'identical_replay' as const
        : 'created' as const

      return Object.freeze({
        disposition,
        officialAccessObservationRef: accessRef,
        termsFinalizationRef: finalizationRef,
        termsAcceptanceRef: termsRef,
        exactAuthenticatedHumanIntentReread: true as const,
        officialGatedAccessVerifiedByServer: true as const,
        callerAcceptanceOrAccessClaimsAccepted: false as const,
        browserLoginOrTermsAcceptanceAutomated: false as const,
        modelInstalledOnDeveloperMachine: false as const,
        checkpointBytesDownloaded: false as const,
        artifactPublicationStarted: false as const,
        gpuRuntimeStarted: false as const,
        customerCreditsMutated: false as const,
        publicDeliveryAuthorized: false as const,
        productionReady: false as const,
      })
    },
  }
  return Object.freeze(owner)
}

export function createCanonicalSam31AuthorizedTermsFinalizationRepository(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
}): CanonicalSam31AuthorizedTermsFinalizationRepository {
  if (
    typeof input.objectPort?.createOnly !== 'function'
    || typeof input.objectPort?.readExact !== 'function'
  ) throw new Error('SAM 3.1 terms finalization object port is invalid.')

  const repository: CanonicalSam31AuthorizedTermsFinalizationRepository = {
    schemaVersion:
      CANONICAL_SAM3_1_AUTHORIZED_TERMS_FINALIZATION_REPOSITORY_VERSION,
    evidenceClass: 'private_create_only_exact_reread',
    async persistHumanTermsIntentCreateOnly(untrusted) {
      assertPlainSerializedData(untrusted, 'sam31_terms_intent_persist')
      const parsed = assertCanonicalSam31AuthorizedHumanTermsIntent(
        z.object({ humanTermsIntent: z.unknown() }).strict().parse(untrusted)
          .humanTermsIntent,
      )
      return persistRecord(input.objectPort, refPath(
        INTENT_PREFIX,
        canonicalSam31AuthorizedHumanTermsIntentRef(parsed),
      ), parsed)
    },
    async rereadHumanTermsIntent(untrusted) {
      assertPlainSerializedData(untrusted, 'sam31_terms_intent_reread')
      const { humanTermsIntentRef } = z.object({
        humanTermsIntentRef: intentRefSchema,
      }).strict().parse(untrusted)
      return readRecord({
        port: input.objectPort,
        path: refPath(INTENT_PREFIX, humanTermsIntentRef),
        parse: assertCanonicalSam31AuthorizedHumanTermsIntent,
        ref: canonicalSam31AuthorizedHumanTermsIntentRef,
        expectedRef: humanTermsIntentRef,
      })
    },
    async persistOfficialAccessObservationCreateOnly(untrusted) {
      assertPlainSerializedData(untrusted, 'sam31_access_observation_persist')
      const parsed = assertCanonicalSam31OfficialAccessObservation(
        z.object({ observation: z.unknown() }).strict().parse(untrusted)
          .observation,
      )
      return persistRecord(input.objectPort, refPath(
        ACCESS_PREFIX,
        canonicalSam31OfficialAccessObservationRef(parsed),
      ), parsed)
    },
    async rereadOfficialAccessObservation(untrusted) {
      assertPlainSerializedData(untrusted, 'sam31_access_observation_reread')
      const expectedRef = z.object({
        observationRef: accessRefSchema,
      }).strict().parse(untrusted).observationRef
      return readRecord({
        port: input.objectPort,
        path: refPath(ACCESS_PREFIX, expectedRef),
        parse: assertCanonicalSam31OfficialAccessObservation,
        ref: canonicalSam31OfficialAccessObservationRef,
        expectedRef,
      })
    },
    async persistTermsFinalizationCreateOnly(untrusted) {
      assertPlainSerializedData(untrusted, 'sam31_terms_finalization_persist')
      const parsed = assertCanonicalSam31AuthorizedTermsFinalizationBundle(
        z.object({ finalization: z.unknown() }).strict().parse(untrusted)
          .finalization,
      )
      return persistRecord(input.objectPort, refPath(
        FINALIZATION_PREFIX,
        canonicalSam31AuthorizedTermsFinalizationBundleRef(parsed),
      ), parsed)
    },
    async rereadTermsFinalization(untrusted) {
      assertPlainSerializedData(untrusted, 'sam31_terms_finalization_reread')
      const expectedRef = z.object({
        finalizationRef: finalizationRefSchema,
      }).strict().parse(untrusted).finalizationRef
      return readRecord({
        port: input.objectPort,
        path: refPath(FINALIZATION_PREFIX, expectedRef),
        parse: assertCanonicalSam31AuthorizedTermsFinalizationBundle,
        ref: canonicalSam31AuthorizedTermsFinalizationBundleRef,
        expectedRef,
      })
    },
    async persistTermsAcceptanceCreateOnly(untrusted) {
      assertPlainSerializedData(untrusted, 'sam31_terms_acceptance_persist')
      const parsed = assertCanonicalSam31AuthorizedTermsAcceptance(
        z.object({ termsAcceptance: z.unknown() }).strict().parse(untrusted)
          .termsAcceptance,
      )
      const ref = termsRefSchema.parse({
        id: parsed.acceptanceRecordId,
        version: parsed.acceptanceRecordVersion,
        contentHash: `sha256:${parsed.acceptanceRecordHash}`,
      })
      return persistRecord(
        input.objectPort,
        refPath(TERMS_PREFIX, ref),
        parsed,
      )
    },
    async rereadTermsAcceptance(untrusted) {
      assertPlainSerializedData(untrusted, 'sam31_terms_acceptance_reread')
      const expectedRef = z.object({
        termsAcceptanceRef: termsRefSchema,
      }).strict().parse(untrusted).termsAcceptanceRef
      return readRecord({
        port: input.objectPort,
        path: refPath(TERMS_PREFIX, expectedRef),
        parse: assertCanonicalSam31AuthorizedTermsAcceptance,
        ref: (value) => ({
          id: value.acceptanceRecordId,
          version: value.acceptanceRecordVersion,
          contentHash: `sha256:${value.acceptanceRecordHash}`,
        }),
        expectedRef,
      })
    },
  }
  return Object.freeze(repository)
}

export function createCanonicalSam31GcpAuthorizedTermsFinalizationRepository(
  input: { readonly storage?: Storage } = {},
): CanonicalSam31AuthorizedTermsFinalizationRepository {
  const storage = input.storage ?? new Storage({ projectId: PROJECT_ID })
  return createCanonicalSam31AuthorizedTermsFinalizationRepository({
    objectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
      storage,
      bucketName: CONTROL_PLANE_BUCKET,
    }),
  })
}

async function persistRecord(
  port: CanonicalCreateOnlyJsonObjectPort,
  objectPath: string,
  record: unknown,
): Promise<'created' | 'identical_replay'> {
  const body = serialize(record)
  const disposition = await port.createOnly({
    objectPath,
    body,
    contentSha256: sha256(body),
  })
  const reread = await port.readExact(objectPath)
  if (!reread || !reread.equals(body)) {
    throw new Error('SAM 3.1 terms finalization create-only reread changed.')
  }
  return disposition === 'created' ? 'created' : 'identical_replay'
}

async function readRecord<T>(input: {
  port: CanonicalCreateOnlyJsonObjectPort
  path: string
  parse: (value: unknown) => T
  ref: (value: T) => { id: string; version: number; contentHash: string }
  expectedRef: { id: string; version: number; contentHash: string }
}): Promise<T | null> {
  const body = await input.port.readExact(input.path)
  if (!body) return null
  const parsed = input.parse(parseJson(body))
  if (
    !sameRef(input.ref(parsed), input.expectedRef)
    || stableAuthorityStringify(parsed) !== body.toString('utf8')
  ) throw new Error('SAM 3.1 terms finalization record changed.')
  return structuredClone(parsed)
}

function refPath(
  prefix: string,
  ref: { readonly id: string; readonly contentHash: string },
): string {
  const id = safeId.parse(ref.id)
  const hash = prefixedSha256.parse(ref.contentHash).slice('sha256:'.length)
  return `${prefix}/${id}-${hash.slice(0, 24)}.json`
}

function serialize(value: unknown): Buffer {
  const body = Buffer.from(stableAuthorityStringify(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new Error('SAM 3.1 terms finalization record is oversized.')
  }
  return body
}

function parseJson(body: Buffer): unknown {
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new Error('SAM 3.1 terms finalization record bytes are invalid.')
  }
  try {
    return JSON.parse(body.toString('utf8'))
  } catch {
    throw new Error('SAM 3.1 terms finalization record JSON is invalid.')
  }
}

function sameRef(
  left: { id: string; version: number; contentHash: string },
  right: { id: string; version: number; contentHash: string },
): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function exact(left: unknown, right: unknown): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}

function sha256(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}
