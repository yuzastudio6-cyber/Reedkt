import type {
  CanonicalPlanComponentsInput,
} from '../validation/edit-planning-authority-schemas'
import { canonicalMasterTimingAuthorityDigest } from
  '../services/canonical-master-timing-authority'

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
  return canonicalMasterTimingAuthorityDigest(masterTimingPlan)
}
