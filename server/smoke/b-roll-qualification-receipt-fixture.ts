import { BROLL_CAPABILITY_MANIFEST } from '../edit-skills/b-roll/b-roll-capability-manifest'
import { GENERATED_BROLL_INTERNAL_QUALIFICATION_ARTIFACT } from '../edit-skills/b-roll/generated/b-roll-internal-qualification.generated'
import { skillManifestReference } from '../edit-skills/core/skill-capability-manifest-hash'
import {
  assertSkillQualificationReceipt,
  createSkillQualificationReceiptV2,
  skillQualificationReceiptV2Schema,
  type SkillQualificationReceipt,
} from '../edit-skills/core/skill-qualification-receipt'

/**
 * Receipt-issuance commands must execute the current tree before its generated
 * receipt exists. This helper creates an in-memory component-construction
 * candidate only while the aggregate issuer gate is explicit. It is never
 * exported by runtime code, persisted as qualification evidence, or accepted
 * outside receipt issuance.
 */
export function brollQualificationReceiptFixture(): SkillQualificationReceipt {
  const current = skillManifestReference(BROLL_CAPABILITY_MANIFEST)
  const prior = skillQualificationReceiptV2Schema.parse(
    (GENERATED_BROLL_INTERNAL_QUALIFICATION_ARTIFACT as { receipt: unknown }).receipt,
  )
  if (prior.manifestRef.manifestHash === current.manifestHash) {
    return assertSkillQualificationReceipt(prior)
  }
  if (process.env.REEDITPRO_BROLL_QUALIFICATION_GENERATING !== '1') {
    throw new Error('B-Roll qualification receipt fixture refuses a stale manifest outside receipt issuance.')
  }
  const { receiptHash: _receiptHash, ...core } = prior
  void _receiptHash
  return createSkillQualificationReceiptV2({
    ...core,
    manifestRef: current,
  })
}
