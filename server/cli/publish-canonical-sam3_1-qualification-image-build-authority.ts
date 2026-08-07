import { publishCanonicalSam31QualificationImageBuildAuthority } from
  '../services/canonical-sam3_1-qualification-image-authority-runtime'

const CONFIRMATION =
  'publish-reviewed-sam31-qualification-image-authority' as const

if (
  process.env.WEEDITPRO_SAM31_QUALIFICATION_IMAGE_AUTHORITY_CONFIRMATION !==
    CONFIRMATION
) throw new Error('SAM 3.1 qualification image confirmation is missing.')

const result = await publishCanonicalSam31QualificationImageBuildAuthority({
  manifestId: 'sam31-qualification-image-capsule-85b90c05fbbcb04a',
  authorityId: 'sam31-qualification-image-build-85b90c05fbbcb04a',
  ingestReceiptRef: {
    id: 'sam31-ingest-sam31-weeditpro-official-ingest-20260806-v12',
    version: 1,
    schemaVersion: 'canonical-sam3_1-private-artifact-ingest-receipt-v3',
    contentHash:
      'sha256:321dc704810497b92e63fa29cdbd168b903e9435fa24ba5b23903c3b6c919cf8',
  },
  reproducibilityReceiptRef: {
    id: 'sam31-qualification-capsule-reproducibility-20260807',
    version: 1,
    contentHash:
      'sha256:8df0b4538f6eac8c8d580898e3fecdf729b05ce05ecf85bd653cadfdb4edfb8d',
  },
})

console.log(JSON.stringify(result, null, 2))
