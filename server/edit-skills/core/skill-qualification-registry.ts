import type { SkillManifestReference } from './skill-capability-manifest-types'
import {
  assertQualificationSupportsClaim,
  assertSkillQualificationReceipt,
  type SkillQualificationReceipt,
} from './skill-qualification-receipt'

function key(ref: SkillManifestReference): string {
  return `${ref.skillKey}@${ref.skillVersion}:${ref.contractVersion}:${ref.manifestHash}`
}

export class SkillQualificationRegistry {
  readonly #receipts = new Map<string, SkillQualificationReceipt>()

  register(receipt: SkillQualificationReceipt): void {
    const parsed = assertSkillQualificationReceipt(receipt)
    const receiptKey = key(parsed.manifestRef)
    const existing = this.#receipts.get(receiptKey)
    if (existing && existing.receiptHash !== parsed.receiptHash) {
      throw new Error(`Different skill qualification receipt already exists for ${receiptKey}.`)
    }
    this.#receipts.set(receiptKey, parsed)
  }

  resolve(ref: SkillManifestReference): SkillQualificationReceipt {
    const receipt = this.#receipts.get(key(ref))
    if (!receipt) throw new Error(`No qualification receipt exists for ${key(ref)}.`)
    return receipt
  }

  assertClaim(ref: SkillManifestReference, claimedStatus: SkillQualificationReceipt['qualificationStatus']): void {
    assertQualificationSupportsClaim({ manifestRef: ref, claimedStatus, receipt: this.resolve(ref) })
  }
}
