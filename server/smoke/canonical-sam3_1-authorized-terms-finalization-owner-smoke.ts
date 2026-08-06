import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  assertCanonicalSam31AuthorizedHumanTermsIntent,
  assertCanonicalSam31AuthorizedTermsFinalizationBundle,
  assertCanonicalSam31OfficialAccessObservation,
  canonicalSam31AuthorizedHumanTermsIntentRef,
  createCanonicalSam31AuthorizedHumanTermsIntent,
  createCanonicalSam31OfficialAccessObservation,
} from '../model-artifacts/canonical-sam3_1-authorized-terms-finalization'
import {
  assertCanonicalSam31AuthorizedTermsAcceptance,
} from '../model-artifacts/canonical-sam3_1-private-artifact-ingest'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  CANONICAL_SAM3_1_AUTHORIZED_TERMS_FINALIZATION_OWNER_VERSION,
  createCanonicalSam31AuthorizedTermsFinalizationOwner,
  createCanonicalSam31AuthorizedTermsFinalizationRepository,
} from '../services/canonical-sam3_1-authorized-terms-finalization-owner'
import {
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

const intent = createIntent()
const intentRef = canonicalSam31AuthorizedHumanTermsIntentRef(intent)
const memory = memoryObjectPort()
memory.records.set(
  recordPath('private/sam3_1/terms-intent/v1', intentRef),
  Buffer.from(stableAuthorityStringify(intent), 'utf8'),
)
const repository = createCanonicalSam31AuthorizedTermsFinalizationRepository({
  objectPort: memory.port,
})
let officialAccessChecks = 0
const owner = createCanonicalSam31AuthorizedTermsFinalizationOwner({
  repository,
  officialAccessVerificationPort: {
    schemaVersion: 'canonical-sam3_1-official-access-verification-port-v1',
    async verifyOfficialGatedRepositoryAccess({ humanTermsIntent }) {
      officialAccessChecks += 1
      return createAccessObservation(humanTermsIntent)
    },
  },
  now: () => '2026-08-06T16:30:00.000Z',
})

assert.equal(owner.schemaVersion,
  CANONICAL_SAM3_1_AUTHORIZED_TERMS_FINALIZATION_OWNER_VERSION)
assert.equal(owner.evidenceClass,
  'authenticated_human_intent_plus_server_verified_official_access')
const result = await owner.finalizeAuthorizedTermsAcceptance({
  humanTermsIntentRef: intentRef,
})
assert.equal(result.disposition, 'created')
assert.equal(result.exactAuthenticatedHumanIntentReread, true)
assert.equal(result.officialGatedAccessVerifiedByServer, true)
assert.equal(result.callerAcceptanceOrAccessClaimsAccepted, false)
assert.equal(result.browserLoginOrTermsAcceptanceAutomated, false)
assert.equal(result.modelInstalledOnDeveloperMachine, false)
assert.equal(result.checkpointBytesDownloaded, false)
assert.equal(result.artifactPublicationStarted, false)
assert.equal(result.gpuRuntimeStarted, false)
assert.equal(result.customerCreditsMutated, false)
assert.equal(result.publicDeliveryAuthorized, false)
assert.equal(result.productionReady, false)
assert.equal(officialAccessChecks, 1)
assert.equal(memory.records.size, 4)

const access = assertCanonicalSam31OfficialAccessObservation(
  await repository.rereadOfficialAccessObservation({
    observationRef: result.officialAccessObservationRef,
  }),
)
const finalization = assertCanonicalSam31AuthorizedTermsFinalizationBundle(
  await repository.rereadTermsFinalization({
    finalizationRef: result.termsFinalizationRef,
  }),
)
const terms = assertCanonicalSam31AuthorizedTermsAcceptance(
  await repository.rereadTermsAcceptance({
    termsAcceptanceRef: result.termsAcceptanceRef,
  }),
)
assert.deepEqual(access.humanTermsIntentRef, intentRef)
assert.deepEqual(finalization.humanTermsIntentRef, intentRef)
assert.deepEqual(finalization.officialAccessObservationRef,
  result.officialAccessObservationRef)
assert.deepEqual(terms.termsEvidenceRef, {
  id: result.termsFinalizationRef.id,
  version: result.termsFinalizationRef.version,
  contentHash: result.termsFinalizationRef.contentHash,
})
assert.equal(terms.officialRepositoryAccessGrantedAndReread, true)
assert.equal(terms.automatedAcceptanceUsed, false)
assert.equal(terms.browserOrWorkerSecretIncluded, false)

const replay = await owner.finalizeAuthorizedTermsAcceptance({
  humanTermsIntentRef: intentRef,
})
assert.equal(replay.disposition, 'identical_replay')
assert.deepEqual(replay.termsAcceptanceRef, result.termsAcceptanceRef)
assert.equal(officialAccessChecks, 2)
assert.equal(memory.records.size, 4)

await assert.rejects(owner.finalizeAuthorizedTermsAcceptance({
  humanTermsIntentRef: intentRef,
  accessGranted: true,
} as never))
await assert.rejects(owner.finalizeAuthorizedTermsAcceptance({
  humanTermsIntentRef: intentRef,
  token: 'caller-secret',
} as never))
await assert.rejects(owner.finalizeAuthorizedTermsAcceptance({
  humanTermsIntentRef: intentRef,
  checkpointPath: '/Users/caller/checkpoint.pt',
} as never))
assert.equal(officialAccessChecks, 2)

const crossedOwner = createOwnerWithObservation((observation) => {
  observation.humanTermsIntentRef.id = 'crossed-human-intent'
  rehashObservation(observation)
})
await assert.rejects(crossedOwner.finalizeAuthorizedTermsAcceptance({
  humanTermsIntentRef: intentRef,
}))

const futureOwner = createOwnerWithObservation((observation) => {
  observation.verifiedAt = '2026-08-06T17:30:00.000Z'
  rehashObservation(observation)
})
await assert.rejects(futureOwner.finalizeAuthorizedTermsAcceptance({
  humanTermsIntentRef: intentRef,
}))

const missingIntentRepository = createCanonicalSam31AuthorizedTermsFinalizationRepository({
  objectPort: memoryObjectPort().port,
})
const missingIntentOwner = createCanonicalSam31AuthorizedTermsFinalizationOwner({
  repository: missingIntentRepository,
  officialAccessVerificationPort: {
    schemaVersion: 'canonical-sam3_1-official-access-verification-port-v1',
    async verifyOfficialGatedRepositoryAccess({ humanTermsIntent }) {
      return createAccessObservation(humanTermsIntent)
    },
  },
  now: () => '2026-08-06T16:30:00.000Z',
})
await assert.rejects(missingIntentOwner.finalizeAuthorizedTermsAcceptance({
  humanTermsIntentRef: intentRef,
}))

const tampered = structuredClone(intent)
tampered.acceptedAt = '2026-08-06T16:10:01.000Z'
assert.throws(() => assertCanonicalSam31AuthorizedHumanTermsIntent(tampered))

let getterRead = false
const accessor = structuredClone(intent) as Record<string, unknown>
Object.defineProperty(accessor, 'acceptedAt', {
  enumerable: true,
  get() {
    getterRead = true
    return intent.acceptedAt
  },
})
assert.throws(() => assertCanonicalSam31AuthorizedHumanTermsIntent(accessor))
assert.equal(getterRead, false)
assert.throws(() => assertCanonicalSam31AuthorizedHumanTermsIntent(
  new Proxy({}, { ownKeys() { throw new Error('hostile') } }),
))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-authorized-terms-finalization-owner',
  checks: 38,
  authenticatedHumanIntentReread: true,
  officialGatedAccessServerVerified: true,
  callerAccessBooleanAccepted: false,
  callerTokenPathUrlBytesAccepted: false,
  browserLoginOrTermsAcceptanceAutomated: false,
  termsFinalizationCreateOnlyAndReread: true,
  finalTermsCreateOnlyAndReread: true,
  modelInstalledOnDeveloperMachine: false,
  checkpointBytesDownloaded: false,
  artifactPublicationStarted: false,
  gpuRuntimeStarted: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))

function createIntent() {
  return createCanonicalSam31AuthorizedHumanTermsIntent({
    intentId: 'sam31-human-terms-20260806',
    intentVersion: 1,
    organizationAuthorityRef: ref('weeditpro-organization-authority'),
    authorizedRepresentativePrincipalRef: ref('authorized-principal'),
    authenticatedSessionRef: ref('authenticated-session'),
    sourceRepository: 'https://github.com/facebookresearch/sam3.git',
    checkpointRepository: 'facebook/sam3.1',
    licenseIdentity: 'SAM License',
    licenseLastUpdated: '2025-11-19',
    acceptanceSurface: 'official_hugging_face_gated_repository',
    repositoryGating: 'manual',
    acceptedAt: '2026-08-06T16:10:00.000Z',
    contactInformationSharingAcceptedByAuthorizedHuman: true,
    approvedUseCase:
      'private_commercial_video_editing_segmentation_and_tracking',
    militaryWarfareNuclearEspionageOrWeaponsUseAllowed: false,
    legalReviewRef: ref('sam31-legal-review'),
    privacyReviewRef: ref('sam31-privacy-review'),
    tradeControlsReviewRef: ref('sam31-trade-controls-review'),
    officialTermsPresentationEvidenceRef: ref('sam31-terms-presentation'),
    boundary: {
      directBrowserLoginAutomated: false,
      termsAcceptedByAutomation: false,
      callerTokenPathUrlOrCredentialAccepted: false,
      thirdPartyMirrorAccepted: false,
      browserOrWorkerSecretIncluded: false,
    },
    authority: {
      authenticatedHumanAcceptanceEvidenceOnly: true,
      officialRepositoryAccessVerified: false,
      termsAcceptanceFinalized: false,
      modelOrCheckpointDownloaded: false,
      imageBuildAuthorized: false,
      gpuRuntimeAuthorized: false,
      customerCreditsMutated: false,
      qaApproved: false,
      publicDeliveryAuthorized: false,
      productionReady: false,
    },
  })
}

function createAccessObservation(
  humanIntent: ReturnType<typeof createIntent>,
) {
  return createCanonicalSam31OfficialAccessObservation({
    observationId: `sam31-access-${humanIntent.intentId}`,
    observationVersion: 1,
    humanTermsIntentRef:
      canonicalSam31AuthorizedHumanTermsIntentRef(humanIntent),
    checkpointRepository: 'facebook/sam3.1',
    checkpointRevision: 'daa63191845a41281374e725f4c9e51c7a824460',
    checkpointFileName: 'sam3.1_multiplex.pt',
    credentialVersionAuthorityRef: ref('pinned-hf-credential-version'),
    exactPinnedCredentialVersionUsed: true,
    officialOriginPinned: true,
    redirectFollowed: false,
    repositoryMetadataResponseStatus: 200,
    repositoryGated: true,
    authenticatedAccessGranted: true,
    exactCheckpointRevisionObserved: true,
    exactCheckpointFileObserved: true,
    checkpointHeadResponseStatus: 302,
    checkpointRedirectTargetOriginAllowlisted: true,
    checkpointLinkedByteLength: 3_500_000_000,
    checkpointLinkedEtagSha256: digest('official-checkpoint-bytes'),
    responseBodyDigestSha256: digest('official-metadata-response'),
    responseBodyPersisted: false,
    secretValuePersistedLoggedOrReturned: false,
    checkpointBytesDownloaded: false,
    verifiedAt: '2026-08-06T16:20:00.000Z',
    authority: {
      accessObservationOnly: true,
      humanTermsAcceptanceCreated: false,
      artifactPublicationStarted: false,
      imageBuildAuthorized: false,
      gpuRuntimeAuthorized: false,
      customerCreditsMutated: false,
      qaApproved: false,
      publicDeliveryAuthorized: false,
      productionReady: false,
    },
  })
}

function createOwnerWithObservation(
  mutate: (observation: ReturnType<typeof createAccessObservation>) => void,
) {
  const store = memoryObjectPort()
  store.records.set(
    recordPath('private/sam3_1/terms-intent/v1', intentRef),
    Buffer.from(stableAuthorityStringify(intent), 'utf8'),
  )
  return createCanonicalSam31AuthorizedTermsFinalizationOwner({
    repository: createCanonicalSam31AuthorizedTermsFinalizationRepository({
      objectPort: store.port,
    }),
    officialAccessVerificationPort: {
      schemaVersion: 'canonical-sam3_1-official-access-verification-port-v1',
      async verifyOfficialGatedRepositoryAccess({ humanTermsIntent }) {
        const observation = createAccessObservation(humanTermsIntent)
        mutate(observation)
        return observation
      },
    },
    now: () => '2026-08-06T16:30:00.000Z',
  })
}

function rehashObservation(
  observation: ReturnType<typeof createAccessObservation>,
): void {
  const payload = structuredClone(observation) as Record<string, unknown>
  delete payload.observationHash
  observation.observationHash = digest(stableAuthorityStringify(payload))
}

function memoryObjectPort(): {
  readonly records: Map<string, Buffer>
  readonly port: CanonicalCreateOnlyJsonObjectPort
} {
  const records = new Map<string, Buffer>()
  return {
    records,
    port: {
      async createOnly({ objectPath, body, contentSha256 }) {
        assert.equal(digest(body), contentSha256)
        const existing = records.get(objectPath)
        if (existing) {
          if (!existing.equals(body)) throw new Error('create-only collision')
          return 'already_exists'
        }
        records.set(objectPath, Buffer.from(body))
        return 'created'
      },
      async readExact(objectPath) {
        const value = records.get(objectPath)
        return value ? Buffer.from(value) : null
      },
    },
  }
}

function recordPath(
  prefix: string,
  reference: { id: string; contentHash: string },
): string {
  return `${prefix}/${reference.id}-${
    reference.contentHash.slice('sha256:'.length, 'sha256:'.length + 24)
  }.json`
}

function ref(id: string) {
  return {
    id,
    version: 1,
    contentHash: `sha256:${digest(id)}` as const,
  }
}

function digest(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}
