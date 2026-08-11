import { sha256AuthorityValue } from './private-edit-authority-store'

const SHA256 = /^[a-f0-9]{64}$/u

/**
 * Returns the one canonical digest for a MasterTiming authority. Self-digesting
 * timing envelopes are verified before their embedded digest is accepted;
 * older envelopes retain their historical whole-object digest.
 */
export function canonicalMasterTimingAuthorityDigest(
  masterTimingPlan: Record<string, unknown>,
): string {
  const embeddedDigest = masterTimingPlan.timingHash
  if (embeddedDigest === undefined) {
    return sha256AuthorityValue(masterTimingPlan)
  }
  if (typeof embeddedDigest !== 'string' || !SHA256.test(embeddedDigest)) {
    throw new Error('Canonical planning rejected a malformed MasterTiming digest.')
  }
  const timingCore = { ...masterTimingPlan }
  delete timingCore.timingHash
  if (sha256AuthorityValue(timingCore) !== embeddedDigest) {
    throw new Error('Canonical planning rejected a stale MasterTiming digest.')
  }
  return embeddedDigest
}
