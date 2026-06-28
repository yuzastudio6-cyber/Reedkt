import type {
  EditLevelToolCapabilityDefinition,
  EditLevelToolRouterSideEffectFlags,
  EditLevelToolRouterValidationResult,
  EditLevelToolRoutingPackage,
  ReEditProCanonicalEditLevel,
} from '../../types'

export interface ListEditLevelToolCapabilitiesRequest {
  includeMockOnly?: boolean
}

export interface ListEditLevelToolCapabilitiesResponse {
  capabilities: EditLevelToolCapabilityDefinition[]
  sideEffectFlags: EditLevelToolRouterSideEffectFlags
  mockOnly: true
}

export interface CreateEditLevelToolRoutingPackageRequest {
  level: ReEditProCanonicalEditLevel
}

export interface CreateEditLevelToolRoutingPackageResponse {
  routingPackage: EditLevelToolRoutingPackage
  sideEffectFlags: EditLevelToolRouterSideEffectFlags
  mockOnly: true
}

export interface CreateEditLevelToolSummaryRequest {
  level: ReEditProCanonicalEditLevel
}

export interface CreateEditLevelToolSummaryResponse {
  summary: string[]
  sideEffectFlags: EditLevelToolRouterSideEffectFlags
  mockOnly: true
}

export interface ValidateEditLevelToolRoutingRequest {
  routingPackage: EditLevelToolRoutingPackage
}

export interface ValidateEditLevelToolRoutingResponse {
  validation: EditLevelToolRouterValidationResult
  sideEffectFlags: EditLevelToolRouterSideEffectFlags
  mockOnly: true
}
