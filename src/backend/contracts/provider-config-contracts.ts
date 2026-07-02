import type {
  FrontendSecretSafetyReport,
  ProviderRuntimeReadiness,
  ProviderSecretDefinition,
  ProviderSecretInventoryReport,
  ProviderSecretName,
  ReeditProProviderId,
} from '../../types'

export interface ListProviderSecretsRequest {
  providerId?: ReeditProProviderId
}

export interface ListProviderSecretsResponse {
  secrets: ProviderSecretDefinition[]
  secretValuesPrinted: false
  mockOnly: true
}

export interface CheckProviderRuntimeReadinessRequest {
  providerId?: ReeditProProviderId
  mode?: 'mock' | 'production'
  presentSecrets?: ProviderSecretName[]
}

export interface CheckProviderRuntimeReadinessResponse {
  readiness: ProviderRuntimeReadiness[]
  summary: string
  mockOnly: true
  noProviderCallMade: true
}

export interface CheckFrontendSecretSafetyRequest {
  fileReferences: Array<{ filePath: string; sourceText: string }>
}

export interface CheckFrontendSecretSafetyResponse {
  report: FrontendSecretSafetyReport
  mockOnly: true
}

export interface CreateProviderSecretInventoryReportRequest {
  inspectGate?: boolean
  confirmedProject?: string
  projectId?: string
  gcloudAvailable?: boolean
}

export interface CreateProviderSecretInventoryReportResponse {
  report: ProviderSecretInventoryReport
  secretValuesPrinted: false
  mockOnly: true
}

export interface CompareProviderSecretInventoryRequest {
  projectId?: string
  projectVerified?: boolean
  secrets: Array<{ name: string; labels?: Record<string, string>; createdAt?: string; updatedAt?: string }>
}

export interface CompareProviderSecretInventoryResponse {
  report: ProviderSecretInventoryReport
  summary: string
  secretValuesPrinted: false
  mockOnly: true
}
