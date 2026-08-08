import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  canonicalImageSecurityReviewRef,
  createCanonicalSam31GcpQualificationImageSupplyChainEvidenceReadPort,
  createCanonicalSam31ImageSecurityReview,
  createCanonicalSam31ImageSupplyChainGoogleReadTransport,
  listCanonicalImageArtifactAnalysisOccurrences,
  verifyCanonicalImageVulnerabilityOccurrences,
} from '../services/canonical-sam3_1-cloud-image-supply-chain-evidence-read-service'
import {
  createCanonicalSam31GcpQualificationImageSupplyChainReleaseRepository,
  prepareAndPersistCanonicalSam31QualificationImageSupplyChainRelease,
} from '../services/canonical-sam3_1-cloud-image-supply-chain-release-runtime'
import {
  createCanonicalSam31GcpQualificationImageBuildRuntime,
} from '../services/canonical-sam3_1-qualification-image-build-runtime'
import {
  createCanonicalSam31GcpQualificationImageSupplyChainBuildRuntime,
} from '../services/canonical-sam3_1-qualification-image-supply-chain-build-runtime'
import {
  qualificationImageSupplyChainObservationReference,
} from '../services/canonical-sam3_1-qualification-image-supply-chain-build-phase'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

const CONFIRMATION =
  'publish-one-weeditpro-sam31-qualification-image-supply-chain-release-v1' as const
const PROJECT_ID = 'reeditpro' as const
const CONTROL_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const AUTHORITY_PREFIX =
  'private/sam3_1/qualification-image-security-review-authority/v1' as const
const timestamp = z.string().datetime({ offset: true })
const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('://'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()

if (
  process.env
    .WEEDITPRO_SAM31_QUALIFICATION_IMAGE_SUPPLY_CHAIN_RELEASE_CONFIRMATION
      !== CONFIRMATION
) throw new Error('SAM 3.1 qualification release confirmation is missing.')

const qualifiedAt = timestamp.parse(
  process.env.WEEDITPRO_SAM31_QUALIFICATION_IMAGE_RELEASED_AT,
)
const refs = {
  imageAuthorityRef: readRef('IMAGE_AUTHORITY'),
  imageSubmissionRef: readRef('IMAGE_SUBMISSION'),
  imageTerminalRef: readRef('IMAGE_TERMINAL'),
  supplyAdmissionRef: readRef('SUPPLY_CHAIN_ADMISSION'),
  supplySubmissionRef: readRef('SUPPLY_CHAIN_SUBMISSION'),
}
const imageRuntime = createCanonicalSam31GcpQualificationImageBuildRuntime()
const supplyRuntime =
  createCanonicalSam31GcpQualificationImageSupplyChainBuildRuntime()
const [imageBuildAuthority, imageBuildSubmission, imageBuildTerminal,
  supplyChainBuildAdmission, supplyChainBuildSubmission,
  supplyChainBuildObservation] = await Promise.all([
  imageRuntime.repository.rereadQualificationImageBuildAuthority({
    authorityRef: refs.imageAuthorityRef,
  }),
  imageRuntime.repository.rereadSubmission({
    submissionRef: refs.imageSubmissionRef,
  }),
  imageRuntime.repository.rereadTerminal({
    terminalRef: refs.imageTerminalRef,
  }),
  supplyRuntime.repository.rereadAdmission({
    admissionRef: refs.supplyAdmissionRef,
  }),
  supplyRuntime.repository.rereadSubmission({
    submissionRef: refs.supplySubmissionRef,
  }),
  supplyRuntime.repository.rereadTerminalForSubmission({
    submissionRef: refs.supplySubmissionRef,
  }),
])
if (
  !imageBuildAuthority || !imageBuildSubmission || !imageBuildTerminal
  || !supplyChainBuildAdmission || !supplyChainBuildSubmission
  || !supplyChainBuildObservation || !imageBuildTerminal.immutableImageUri
  || !imageBuildTerminal.immutableImageDigest
) throw new Error('SAM 3.1 qualification release lineage is absent.')

const storage = new Storage({
  projectId: PROJECT_ID,
  retryOptions: { autoRetry: false, maxRetries: 0 },
})
const releaseRepository =
  createCanonicalSam31GcpQualificationImageSupplyChainReleaseRepository({
    storage,
  })
const googleReadTransport =
  createCanonicalSam31ImageSupplyChainGoogleReadTransport()
const resourceUri = `https://${imageBuildTerminal.immutableImageUri}`
const [discoveryOccurrences, vulnerabilityOccurrences] = await Promise.all([
  listCanonicalImageArtifactAnalysisOccurrences(
    googleReadTransport,
    `kind="DISCOVERY" AND resourceUrl="${resourceUri}"`,
  ),
  listCanonicalImageArtifactAnalysisOccurrences(
    googleReadTransport,
    `kind="VULNERABILITY" AND resourceUrl="${resourceUri}"`,
  ),
])
const vulnerabilityScan = verifyCanonicalImageVulnerabilityOccurrences({
  imageDigest: imageBuildTerminal.immutableImageDigest,
  resourceUri,
  discoveryOccurrences,
  vulnerabilityOccurrences,
})
const securityAuthorityPayload = {
  schemaVersion:
    'canonical-sam3_1-qualification-image-security-review-authority-v1' as const,
  source:
    'canonical_server_sam3_1_qualification_image_security_review_owner' as const,
  evidenceClass: 'canonical_private_reread' as const,
  status: 'authorized_for_private_a100_qualification' as const,
  authorityId:
    `sam31-qualification-image-security-${vulnerabilityScan.scanRef.contentHash.slice(7, 31)}`,
  authorityVersion: 1 as const,
  ...refs,
  supplyChainObservationRef:
    qualificationImageSupplyChainObservationReference(
      supplyChainBuildObservation,
    ),
  immutableImageDigest: imageBuildTerminal.immutableImageDigest,
  vulnerabilityScanRef: vulnerabilityScan.scanRef,
  scanCompletedAt: vulnerabilityScan.scanCompletedAt,
  occurrenceSnapshotUpdatedAt: vulnerabilityScan.occurrenceSnapshotUpdatedAt,
  severityCounts: vulnerabilityScan.severityCounts,
  operatorConfirmation: CONFIRMATION,
  authorizedAt: qualifiedAt,
  exactImageBuildSupplyChainAndOccurrenceLineageReread: true as const,
  runtimeReleaseGranted: false as const,
  gpuQualificationJobDispatched: false as const,
  modelOrCheckpointExecuted: false as const,
  customerCreditsMutated: false as const,
  publicDeliveryAuthorized: false as const,
  productionReady: false as const,
}
if (
  vulnerabilityScan.severityCounts.criticalCount !== 0
  || vulnerabilityScan.severityCounts.highCount !== 0
  || vulnerabilityScan.severityCounts.unknownSeverityCount !== 0
  || Date.parse(qualifiedAt) <
    Date.parse(vulnerabilityScan.occurrenceSnapshotUpdatedAt)
) throw new Error('SAM 3.1 qualification image security review is blocked.')
const securityAuthorityHash = sha256AuthorityValue(securityAuthorityPayload)
const securityAuthorityRef = refSchema.parse({
  id: securityAuthorityPayload.authorityId,
  version: 1,
  contentHash: `sha256:${securityAuthorityHash}`,
})
const authorityBody = Buffer.from(stableAuthorityStringify({
  ...securityAuthorityPayload,
  authorityHash: securityAuthorityHash,
}), 'utf8')
const authorityObjectPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
  storage,
  bucketName: CONTROL_BUCKET,
})
const authorityPath = `${AUTHORITY_PREFIX}/${createHash('sha256')
  .update(securityAuthorityRef.id, 'utf8').digest('hex')}/${securityAuthorityHash}.json`
await authorityObjectPort.createOnly({
  objectPath: authorityPath,
  body: authorityBody,
  contentSha256: createHash('sha256').update(authorityBody).digest('hex'),
})
const authorityReread = await authorityObjectPort.readExact(authorityPath)
if (!authorityReread?.equals(authorityBody)) {
  throw new Error('SAM 3.1 qualification security authority reread failed.')
}
const review = createCanonicalSam31ImageSecurityReview({
  reviewId:
    `sam31-qualification-image-security-review-${vulnerabilityScan.scanRef.contentHash.slice(7, 31)}`,
  immutableImageDigest: imageBuildTerminal.immutableImageDigest,
  vulnerabilityScanRef: vulnerabilityScan.scanRef,
  scanCompletedAt: vulnerabilityScan.scanCompletedAt,
  occurrenceSnapshotUpdatedAt: vulnerabilityScan.occurrenceSnapshotUpdatedAt,
  severityCounts: vulnerabilityScan.severityCounts,
  reviewerAuthorityRef: securityAuthorityRef,
  reviewedAt: qualifiedAt,
})
const securityReviewRef =
  await releaseRepository.persistApprovedSecurityReviewCreateOnly({ review })
const rereadReview = await releaseRepository.rereadApprovedReview({
  immutableImageDigest: imageBuildTerminal.immutableImageDigest,
  vulnerabilityScanRef: vulnerabilityScan.scanRef,
  scanCompletedAt: vulnerabilityScan.scanCompletedAt,
  occurrenceSnapshotUpdatedAt: vulnerabilityScan.occurrenceSnapshotUpdatedAt,
  severityCounts: vulnerabilityScan.severityCounts,
})
if (
  !rereadReview
  || canonicalImageSecurityReviewRef(rereadReview).contentHash !==
    securityReviewRef.contentHash
) throw new Error('SAM 3.1 qualification security review reread failed.')

const evidenceReadPort =
  createCanonicalSam31GcpQualificationImageSupplyChainEvidenceReadPort({
    imageBuildAuthority,
    imageBuildSubmission,
    imageBuildTerminal,
    supplyChainBuildAdmission,
    supplyChainBuildSubmission,
    supplyChainBuildObservation,
    securityReviewReadPort: releaseRepository,
    googleReadTransport,
  })
const release =
  await prepareAndPersistCanonicalSam31QualificationImageSupplyChainRelease({
    releaseId:
      `sam31-qualification-image-supply-chain-release-${supplyChainBuildObservation.observationHash.slice(0, 24)}`,
    authority: imageBuildAuthority,
    imageBuildSubmission,
    imageBuildTerminal,
    supplyChainBuildAdmission,
    supplyChainBuildSubmission,
    supplyChainBuildObservation,
    evidenceReadPort,
    qualifiedAt,
    repository: releaseRepository,
  })

console.log(JSON.stringify({
  securityAuthorityRef,
  securityReviewRef,
  release,
  gpuQualificationJobDispatched: false,
  customerCreditsMutated: false,
  publicDeliveryAuthorized: false,
  productionReady: false,
}, null, 2))

function readRef(kind: string) {
  return refSchema.parse({
    id: safeId.parse(process.env[`WEEDITPRO_SAM31_QUALIFICATION_${kind}_ID`]),
    version: 1,
    contentHash: `sha256:${rawSha256.parse(
      process.env[`WEEDITPRO_SAM31_QUALIFICATION_${kind}_SHA256`],
    )}`,
  })
}
