import type {
  CanonicalPlanComponentsInput,
} from '../validation/edit-planning-authority-schemas'
import { sha256AuthorityValue } from
  '../services/private-edit-authority-store'

const SHA256 = /^[a-f0-9]{64}$/u

/**
 * Shared timing owners may publish a self-digesting `master_timing_plan_v1`
 * projection. Caption must bind that canonical digest rather than hashing the
 * envelope a second time, which would manufacture a parallel clock identity.
 * Older plans without an embedded digest retain the historical whole-object
 * digest for backward compatibility.
 */
export function canonicalCaptionMasterTimingDigest(
  masterTimingPlan: CanonicalPlanComponentsInput['masterTimingPlan'],
): string {
  const embeddedDigest = masterTimingPlan.timingHash
  if (embeddedDigest === undefined) {
    return sha256AuthorityValue(masterTimingPlan)
  }
  if (typeof embeddedDigest !== 'string' || !SHA256.test(embeddedDigest)) {
    throw new Error(
      'Canonical Caption planning rejected a malformed MasterTiming digest.',
    )
  }
  const timingCore = { ...masterTimingPlan }
  delete timingCore.timingHash
  if (sha256AuthorityValue(timingCore) !== embeddedDigest) {
    throw new Error(
      'Canonical Caption planning rejected a stale MasterTiming digest.',
    )
  }
  return embeddedDigest
}
