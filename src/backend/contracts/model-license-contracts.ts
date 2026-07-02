import type { ID, ISODateString } from '../../types/shared'
import type { LicenseFamily, ReviewStatus } from './production-tool-runtime-contracts'

export interface ModelWeightManifest {
  id: ID
  toolId: string
  modelName: string
  modelVersion: string
  source: string
  license: string
  commercialUseAllowed: boolean
  redistributionAllowed: boolean
  requiresAttribution: boolean
  reviewStatus: ReviewStatus
  riskNotes: string[]
  createdAt: ISODateString
  updatedAt: ISODateString
}

export interface LicenseReviewRecord {
  id: ID
  toolId: string
  packageName: string
  packageVersion: string
  license: string
  licenseFamily: LicenseFamily
  commercialUseAllowed: boolean
  distributionRisk: 'low' | 'medium' | 'high' | 'blocked' | 'unknown'
  networkUseRisk: 'low' | 'medium' | 'high' | 'blocked' | 'unknown'
  reviewStatus: ReviewStatus
  notes: string[]
  createdAt: ISODateString
  updatedAt: ISODateString
}
