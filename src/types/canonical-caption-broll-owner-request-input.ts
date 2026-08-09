import type { BrollCaptionOwnerReadRequest } from
  './caption-broll-owner-read-adapter'
import type { OrchestraSkillCall } from './orchestra-skill-contracts'

export const CANONICAL_CAPTION_BROLL_OWNER_REQUEST_READ_PORT_VERSION =
  'canonical-caption-broll-owner-request-read-port-v1' as const

export interface CanonicalCaptionBrollOwnerRequestReadPort {
  readonly schemaVersion:
    typeof CANONICAL_CAPTION_BROLL_OWNER_REQUEST_READ_PORT_VERSION
  readonly sourceAuthority:
    'canonical_approved_b_roll_caption_owner_request'
  readonly callerSuppliedOwnerRequestAccepted: false
  readExact(input: {
    readonly call: OrchestraSkillCall
  }): Promise<BrollCaptionOwnerReadRequest | null>
}
