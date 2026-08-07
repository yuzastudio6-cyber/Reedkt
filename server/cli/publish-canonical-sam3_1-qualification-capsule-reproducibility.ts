import { publishCanonicalSam31QualificationCapsuleReproducibility } from
  '../services/canonical-sam3_1-qualification-capsule-reproducibility-runtime'

const CONFIRMATION =
  'publish-reviewed-sam31-capsule-reproducibility' as const

if (
  process.env.WEEDITPRO_SAM31_CAPSULE_REPRODUCIBILITY_CONFIRMATION !==
    CONFIRMATION
) throw new Error('SAM 3.1 capsule reproducibility confirmation is missing.')

const result = await publishCanonicalSam31QualificationCapsuleReproducibility({
  receiptId: 'sam31-qualification-capsule-reproducibility-20260807',
  primaryBuildId: '8f3cf6e1-7d82-4d73-a32c-078ea35a07b7',
  confirmationBuildId: 'd26c339a-67ca-4ac5-a30b-9fbe77b401e3',
})

console.log(JSON.stringify(result, null, 2))
