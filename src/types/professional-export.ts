export const PROFESSIONAL_EXPORT_POLICY_VERSION = 'rp-professional-export-4k-ceiling-v1' as const
export const PROFESSIONAL_EXPORT_COST_MODEL_VERSION = 'rp-ratecard-01-4k-ceiling-v1' as const
export const PROFESSIONAL_EXPORT_SOURCE_RATE_CARD_VERSION = 'rp-ratecard-01-mock-safe' as const

export const PROFESSIONAL_EXPORT_PROFILE_IDS = [
  'hd_1080',
  'qhd_1440',
  'uhd_2160',
] as const

export const PROFESSIONAL_EXPORT_ASPECT_RATIOS = [
  '9:16',
  '16:9',
  '1:1',
  '4:5',
  '4:3',
] as const

/**
 * Shared with the mock-safe tool-cost rate card so browser planning and the
 * backend estimate adapter cannot silently price deterministic rendering with
 * different units.
 */
export const PROFESSIONAL_EXPORT_COST_RATES = {
  microsPerCent: 10_000,
  flatRequestMicros: 4_000,
  perOutputSecondMicros: 650,
  perMegapixelFrameMicros: 120,
  estimateLowBasisPoints: 8_000,
  estimateHighRiskBufferBasisPoints: 5_000,
} as const

export type ProfessionalExportProfileId = typeof PROFESSIONAL_EXPORT_PROFILE_IDS[number]
export type ProfessionalExportAspectRatio = typeof PROFESSIONAL_EXPORT_ASPECT_RATIOS[number]

export interface ProfessionalExportFrame {
  profileId: ProfessionalExportProfileId
  aspectRatio: ProfessionalExportAspectRatio
  width: number
  height: number
  pixelCount: number
  label: string
}

export interface ProfessionalExportCreditCoverage {
  policyVersion: typeof PROFESSIONAL_EXPORT_POLICY_VERSION
  costModelVersion: typeof PROFESSIONAL_EXPORT_COST_MODEL_VERSION
  sourceRateCardVersion: typeof PROFESSIONAL_EXPORT_SOURCE_RATE_CARD_VERSION
  assumption: 'always_estimate_4k_uhd'
  costBasisProfileId: 'uhd_2160'
  defaultDeliveryProfileId: 'uhd_2160'
  coveredProfileIds: ProfessionalExportProfileId[]
  approvedAspectRatio?: ProfessionalExportAspectRatio
  approvedFrames: ProfessionalExportFrame[]
  outputFps: number
  durationSeconds: number
  costBasisPixelCount: 8_294_400
  megapixelFrames: number
  lowInternalToolCostCredits: number
  expectedInternalToolCostCredits: number
  maximumInternalToolCostCredits: number
  includedInInitialEstimate: true
  requiresSeparateExportEstimate: false
  allowsAdditionalExportCharge: false
  usesApprovedEditReservation: true
  serviceFeeIncludedInToolCost: false
  sourceEnhancementIncluded: false
}

export interface ConfirmedProfessionalExportCreditCoverage extends ProfessionalExportCreditCoverage {
  approvedAspectRatio: ProfessionalExportAspectRatio
}

export interface ProfessionalExportExecutionAuthority {
  policyVersion: typeof PROFESSIONAL_EXPORT_POLICY_VERSION
  approvedEstimateId: string
  approvedReservationId: string
  approvedDeliverableId: string
  approvedAspectRatio: ProfessionalExportAspectRatio
  approvedOutputFps: number
  approvedDurationSeconds: number
  selectedProfileId: ProfessionalExportProfileId
  selectedFrame: ProfessionalExportFrame
  costBasisProfileId: 'uhd_2160'
  coveredProfileIds: ProfessionalExportProfileId[]
  includedInApprovedEstimate: true
  requiresSeparateExportEstimate: false
  allowsAdditionalExportCharge: false
  usesApprovedEditReservation: true
  sourceEnhancementApproved: boolean
}
