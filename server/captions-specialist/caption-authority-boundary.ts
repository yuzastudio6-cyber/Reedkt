import type { SkillClosedAuthorityBoundary } from
  '../../src/types/orchestra-skill-contracts'

export const CAPTIONS_CLOSED_AUTHORITY_BOUNDARY:
Readonly<SkillClosedAuthorityBoundary> = Object.freeze({
  scopeExpansionGranted: false,
  timelineMutationGranted: false,
  directPeerDispatchGranted: false,
  providerCallGranted: false,
  runtimeExecutionGranted: false,
  assetCreationGranted: false,
  costAuthorityGranted: false,
  billingAuthorityGranted: false,
  qaApprovalGranted: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
})
