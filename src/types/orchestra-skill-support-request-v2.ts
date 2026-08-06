import type {
  SkillClosedAuthorityBoundary,
  SkillCanonicalScope,
  SkillContractRef,
  SkillSupportTarget,
} from './orchestra-skill-contracts'

export const SKILL_SUPPORT_REQUEST_VERSION_V2 =
  'skill-support-request-v2' as const

export type SkillSupportTargetV2 = SkillSupportTarget | 'captions'

/**
 * Additive neutral request lane for assigning work to a specialist that may
 * itself be a support producer. The hash-frozen V1 source remains byte-for-byte
 * unchanged for existing dependency-owner resume integrations.
 */
export interface SkillSupportRequestV2 {
  schemaVersion: typeof SKILL_SUPPORT_REQUEST_VERSION_V2
  requestId: string
  requestDigestSha256: string
  originalCallRef: SkillContractRef
  requestingSkillKey: string
  targetSkillKey: SkillSupportTargetV2
  requestedJobType: string
  reasonCode: string
  requestedArtifactTypes: string[]
  canonicalScope: SkillCanonicalScope
  typedPayloadType: string
  typedPayload: unknown
  mediationPolicy: {
    hqMediated: true
    directPeerDispatchAllowed: false
    assigneeMayOnlyResumeAfterInjection: true
  }
  authorityBoundary: SkillClosedAuthorityBoundary
}
