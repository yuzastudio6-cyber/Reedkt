import { z } from 'zod'

import {
  assertCanonicalSam31AuthorizedHumanTermsIntent,
  canonicalSam31AuthorizedHumanTermsIntentRef,
  createCanonicalSam31AuthorizedHumanTermsIntent,
} from '../model-artifacts/canonical-sam3_1-authorized-terms-finalization'
import type {
  CanonicalSam31AuthorizedTermsFinalizationRepository,
} from './canonical-sam3_1-authorized-terms-finalization-owner'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_AUTHORIZED_HUMAN_TERMS_INTENT_PUBLISHER_VERSION =
  'canonical-sam3_1-authorized-human-terms-intent-publisher-v1' as const

const OFFICIAL_REPOSITORY = 'facebook/sam3.1' as const
const OFFICIAL_SOURCE =
  'https://github.com/facebookresearch/sam3.git' as const
const OFFICIAL_CHECKPOINT = 'sam3.1_multiplex.pt' as const
const OFFICIAL_LICENSE =
  'https://github.com/facebookresearch/sam3/blob/main/LICENSE' as const
const META_PRIVACY_POLICY =
  'https://www.facebook.com/privacy/policy/' as const
const LICENSE_LAST_UPDATED = '2025-11-19' as const

const acceptanceEvidenceSchema = z.object({
  schemaVersion: z.literal(
    'canonical-sam3_1-authorized-human-browser-acceptance-evidence-v1',
  ),
  source: z.literal(
    'authenticated_weeditpro_owner_browser_acceptance_observation',
  ),
  organizationId: z.literal('weeditpro'),
  authorizedRepresentativeAccountHandle: z.literal('WEeditpro'),
  officialRepository: z.literal(OFFICIAL_REPOSITORY),
  officialSourceRepository: z.literal(OFFICIAL_SOURCE),
  gatingCollection: z.literal('SAM3'),
  requestStatus: z.literal('accepted'),
  officialCheckpointFileObserved: z.literal(OFFICIAL_CHECKPOINT),
  officialLicenseUrl: z.literal(OFFICIAL_LICENSE),
  officialLicenseIdentity: z.literal('SAM License'),
  officialLicenseLastUpdated: z.literal(LICENSE_LAST_UPDATED),
  metaPrivacyPolicyUrl: z.literal(META_PRIVACY_POLICY),
  humanSubmittedOfficialForm: z.literal(true),
  humanAcceptedLicenseTerms: z.literal(true),
  contactInformationSharingAcceptedByAuthorizedHuman: z.literal(true),
  authorizedRepresentativeAcceptedForOrganization: z.literal(true),
  approvedUseCase: z.literal(
    'private_commercial_video_editing_segmentation_and_tracking',
  ),
  tradeControlsRepresentationAcceptedByAuthorizedHuman: z.literal(true),
  militaryWarfareNuclearEspionageOrWeaponsUseAllowed: z.literal(false),
  observedAt: z.string().datetime({ offset: true }),
  boundary: z.object({
    browserLoginAutomated: z.literal(false),
    termsAcceptanceAutomated: z.literal(false),
    secretOrPersonalFormValuesCaptured: z.literal(false),
    checkpointBytesDownloaded: z.literal(false),
    modelInstalledOnDeveloperMachine: z.literal(false),
  }).strict(),
}).strict()

export type CanonicalSam31AuthorizedHumanBrowserAcceptanceEvidence =
  z.infer<typeof acceptanceEvidenceSchema>

export async function publishCanonicalSam31AuthorizedHumanTermsIntent(input: {
  readonly repository: CanonicalSam31AuthorizedTermsFinalizationRepository
  readonly evidence: CanonicalSam31AuthorizedHumanBrowserAcceptanceEvidence
}): Promise<{
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_AUTHORIZED_HUMAN_TERMS_INTENT_PUBLISHER_VERSION
  readonly disposition: 'created' | 'identical_replay'
  readonly humanTermsIntentRef: ReturnType<
    typeof canonicalSam31AuthorizedHumanTermsIntentRef
  >
  readonly officialRepositoryAccessClaimedByCaller: false
  readonly officialRepositoryAccessVerificationStillRequired: true
  readonly tokenOrPersonalFormValuesCaptured: false
  readonly checkpointBytesDownloaded: false
  readonly modelInstalledOnDeveloperMachine: false
  readonly imageBuildAuthorized: false
  readonly gpuRuntimeAuthorized: false
  readonly customerCreditsMutated: false
  readonly productionReady: false
}> {
  if (
    typeof input.repository?.persistHumanTermsIntentCreateOnly !== 'function'
    || typeof input.repository.rereadHumanTermsIntent !== 'function'
  ) throw new Error('SAM 3.1 human terms intent repository is incomplete.')
  assertPlainSerializedData(input.evidence, 'sam31_human_acceptance_evidence')
  const evidence = acceptanceEvidenceSchema.parse(input.evidence)
  const dateKey = evidence.observedAt.slice(0, 10).replaceAll('-', '')
  const humanTermsIntent = createCanonicalSam31AuthorizedHumanTermsIntent({
    intentId: `sam31-human-terms-weeditpro-${dateKey}`,
    intentVersion: 1,
    organizationAuthorityRef: evidenceRef(
      'weeditpro-private-owner-authorization',
      {
        schemaVersion: 'weeditpro-private-owner-authorization-evidence-v1',
        organizationId: evidence.organizationId,
        authorizedUseCase: evidence.approvedUseCase,
        authorizedRepresentativeAcceptedForOrganization:
          evidence.authorizedRepresentativeAcceptedForOrganization,
      },
    ),
    authorizedRepresentativePrincipalRef: evidenceRef(
      'weeditpro-hugging-face-authorized-representative',
      {
        schemaVersion:
          'weeditpro-hugging-face-authorized-representative-evidence-v1',
        organizationId: evidence.organizationId,
        accountHandle: evidence.authorizedRepresentativeAccountHandle,
        humanSubmittedOfficialForm: evidence.humanSubmittedOfficialForm,
      },
    ),
    authenticatedSessionRef: evidenceRef(
      `weeditpro-hugging-face-accepted-session-${dateKey}`,
      {
        schemaVersion:
          'weeditpro-hugging-face-accepted-session-evidence-v1',
        accountHandle: evidence.authorizedRepresentativeAccountHandle,
        officialRepository: evidence.officialRepository,
        requestStatus: evidence.requestStatus,
        observedAt: evidence.observedAt,
        browserLoginAutomated: evidence.boundary.browserLoginAutomated,
      },
    ),
    sourceRepository: evidence.officialSourceRepository,
    checkpointRepository: evidence.officialRepository,
    licenseIdentity: evidence.officialLicenseIdentity,
    licenseLastUpdated: evidence.officialLicenseLastUpdated,
    acceptanceSurface: 'official_hugging_face_gated_repository',
    repositoryGating: 'manual',
    acceptedAt: evidence.observedAt,
    contactInformationSharingAcceptedByAuthorizedHuman:
      evidence.contactInformationSharingAcceptedByAuthorizedHuman,
    approvedUseCase: evidence.approvedUseCase,
    militaryWarfareNuclearEspionageOrWeaponsUseAllowed:
      evidence.militaryWarfareNuclearEspionageOrWeaponsUseAllowed,
    legalReviewRef: evidenceRef('sam31-official-license-human-acceptance', {
      schemaVersion:
        'sam31-official-license-human-acceptance-evidence-v1',
      officialLicenseUrl: evidence.officialLicenseUrl,
      officialLicenseIdentity: evidence.officialLicenseIdentity,
      officialLicenseLastUpdated: evidence.officialLicenseLastUpdated,
      humanAcceptedLicenseTerms: evidence.humanAcceptedLicenseTerms,
      approvedUseCase: evidence.approvedUseCase,
    }),
    privacyReviewRef: evidenceRef('sam31-contact-sharing-privacy-review', {
      schemaVersion: 'sam31-contact-sharing-privacy-review-evidence-v1',
      metaPrivacyPolicyUrl: evidence.metaPrivacyPolicyUrl,
      contactInformationSharingAcceptedByAuthorizedHuman:
        evidence.contactInformationSharingAcceptedByAuthorizedHuman,
      secretOrPersonalFormValuesCaptured:
        evidence.boundary.secretOrPersonalFormValuesCaptured,
    }),
    tradeControlsReviewRef: evidenceRef('sam31-trade-controls-review', {
      schemaVersion: 'sam31-trade-controls-review-evidence-v1',
      officialLicenseUrl: evidence.officialLicenseUrl,
      tradeControlsRepresentationAcceptedByAuthorizedHuman:
        evidence.tradeControlsRepresentationAcceptedByAuthorizedHuman,
      militaryWarfareNuclearEspionageOrWeaponsUseAllowed:
        evidence.militaryWarfareNuclearEspionageOrWeaponsUseAllowed,
    }),
    officialTermsPresentationEvidenceRef: evidenceRef(
      'sam31-official-hugging-face-terms-presentation',
      {
        schemaVersion:
          'sam31-official-hugging-face-terms-presentation-evidence-v1',
        officialRepository: evidence.officialRepository,
        gatingCollection: evidence.gatingCollection,
        requestStatus: evidence.requestStatus,
        officialCheckpointFileObserved:
          evidence.officialCheckpointFileObserved,
        observedAt: evidence.observedAt,
      },
    ),
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
  const expectedRef = canonicalSam31AuthorizedHumanTermsIntentRef(
    humanTermsIntent,
  )
  const disposition = await input.repository.persistHumanTermsIntentCreateOnly({
    humanTermsIntent,
  })
  const reread = assertCanonicalSam31AuthorizedHumanTermsIntent(
    await input.repository.rereadHumanTermsIntent({
      humanTermsIntentRef: expectedRef,
    }),
  )
  if (stableAuthorityStringify(reread)
    !== stableAuthorityStringify(humanTermsIntent)) {
    throw new Error('SAM 3.1 human terms intent exact reread changed.')
  }
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_AUTHORIZED_HUMAN_TERMS_INTENT_PUBLISHER_VERSION,
    disposition,
    humanTermsIntentRef: expectedRef,
    officialRepositoryAccessClaimedByCaller: false as const,
    officialRepositoryAccessVerificationStillRequired: true as const,
    tokenOrPersonalFormValuesCaptured: false as const,
    checkpointBytesDownloaded: false as const,
    modelInstalledOnDeveloperMachine: false as const,
    imageBuildAuthorized: false as const,
    gpuRuntimeAuthorized: false as const,
    customerCreditsMutated: false as const,
    productionReady: false as const,
  })
}

function evidenceRef(id: string, value: unknown): {
  readonly id: string
  readonly version: 1
  readonly contentHash: `sha256:${string}`
} {
  return Object.freeze({
    id,
    version: 1 as const,
    contentHash: `sha256:${sha256AuthorityValue(value)}` as const,
  })
}
