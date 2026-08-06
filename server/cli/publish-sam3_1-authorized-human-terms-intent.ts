import { z } from 'zod'

import {
  publishCanonicalSam31AuthorizedHumanTermsIntent,
} from '../services/canonical-sam3_1-authorized-human-terms-intent-publisher'
import {
  createCanonicalSam31GcpAuthorizedTermsFinalizationRepository,
} from '../services/canonical-sam3_1-authorized-terms-finalization-owner'

const PROJECT_ID = 'reeditpro' as const
const CONTROL_PLANE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const CONFIRMATION =
  'publish-authorized-sam31-human-terms-intent-once' as const

async function main(): Promise<void> {
  const configuration = assertOperatorInvocation()
  const receipt = await publishCanonicalSam31AuthorizedHumanTermsIntent({
    repository:
      createCanonicalSam31GcpAuthorizedTermsFinalizationRepository(),
    evidence: {
      schemaVersion:
        'canonical-sam3_1-authorized-human-browser-acceptance-evidence-v1',
      source:
        'authenticated_weeditpro_owner_browser_acceptance_observation',
      organizationId: 'weeditpro',
      authorizedRepresentativeAccountHandle: 'WEeditpro',
      officialRepository: 'facebook/sam3.1',
      officialSourceRepository:
        'https://github.com/facebookresearch/sam3.git',
      gatingCollection: 'SAM3',
      requestStatus: 'accepted',
      officialCheckpointFileObserved: 'sam3.1_multiplex.pt',
      officialLicenseUrl:
        'https://github.com/facebookresearch/sam3/blob/main/LICENSE',
      officialLicenseIdentity: 'SAM License',
      officialLicenseLastUpdated: '2025-11-19',
      metaPrivacyPolicyUrl: 'https://www.facebook.com/privacy/policy/',
      humanSubmittedOfficialForm: true,
      humanAcceptedLicenseTerms: true,
      contactInformationSharingAcceptedByAuthorizedHuman: true,
      authorizedRepresentativeAcceptedForOrganization: true,
      approvedUseCase:
        'private_commercial_video_editing_segmentation_and_tracking',
      tradeControlsRepresentationAcceptedByAuthorizedHuman: true,
      militaryWarfareNuclearEspionageOrWeaponsUseAllowed: false,
      observedAt: configuration.observedAt,
      boundary: {
        browserLoginAutomated: false,
        termsAcceptanceAutomated: false,
        secretOrPersonalFormValuesCaptured: false,
        checkpointBytesDownloaded: false,
        modelInstalledOnDeveloperMachine: false,
      },
    },
  })
  process.stdout.write(`${JSON.stringify({
    operation: 'publish_sam3_1_authorized_human_terms_intent',
    disposition: receipt.disposition,
    humanTermsIntentRef: receipt.humanTermsIntentRef,
    officialRepositoryAccessClaimedByCaller:
      receipt.officialRepositoryAccessClaimedByCaller,
    officialRepositoryAccessVerificationStillRequired:
      receipt.officialRepositoryAccessVerificationStillRequired,
    tokenOrPersonalFormValuesCaptured:
      receipt.tokenOrPersonalFormValuesCaptured,
    checkpointBytesDownloaded: receipt.checkpointBytesDownloaded,
    modelInstalledOnDeveloperMachine:
      receipt.modelInstalledOnDeveloperMachine,
    imageBuildAuthorized: receipt.imageBuildAuthorized,
    gpuRuntimeAuthorized: receipt.gpuRuntimeAuthorized,
    customerCreditsMutated: receipt.customerCreditsMutated,
    productionReady: receipt.productionReady,
  })}\n`)
}

function assertOperatorInvocation(): { readonly observedAt: string } {
  if (process.argv.length !== 3 || process.argv[2] !== '--execute') {
    throw new Error('SAM 3.1 human terms intent publication is not authorized.')
  }
  return z.object({
    GOOGLE_CLOUD_PROJECT_ID: z.literal(PROJECT_ID),
    GCS_CONTROL_PLANE_STATE_BUCKET: z.literal(CONTROL_PLANE_BUCKET),
    WEEDITPRO_SAM31_HUMAN_TERMS_INTENT_CONFIRM: z.literal(CONFIRMATION),
    WEEDITPRO_SAM31_HUMAN_TERMS_ACCEPTED_AT:
      z.string().datetime({ offset: true }),
  }).strict().transform((value) => ({
    observedAt: value.WEEDITPRO_SAM31_HUMAN_TERMS_ACCEPTED_AT,
  })).parse({
    GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID,
    GCS_CONTROL_PLANE_STATE_BUCKET:
      process.env.GCS_CONTROL_PLANE_STATE_BUCKET,
    WEEDITPRO_SAM31_HUMAN_TERMS_INTENT_CONFIRM:
      process.env.WEEDITPRO_SAM31_HUMAN_TERMS_INTENT_CONFIRM,
    WEEDITPRO_SAM31_HUMAN_TERMS_ACCEPTED_AT:
      process.env.WEEDITPRO_SAM31_HUMAN_TERMS_ACCEPTED_AT,
  })
}

main().catch(() => {
  process.stderr.write(`${JSON.stringify({
    ok: false,
    code: 'sam3_1_authorized_human_terms_intent_publication_failed',
  })}\n`)
  process.exitCode = 1
})
