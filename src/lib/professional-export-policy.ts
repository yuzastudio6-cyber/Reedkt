import {
  CREDIT_RETAIL_VALUE_CENTS,
} from '../types/credit-policy'
import {
  PROFESSIONAL_EXPORT_COST_MODEL_VERSION,
  PROFESSIONAL_EXPORT_ASPECT_RATIOS,
  PROFESSIONAL_EXPORT_COST_RATES,
  PROFESSIONAL_EXPORT_POLICY_VERSION,
  PROFESSIONAL_EXPORT_PROFILE_IDS,
  PROFESSIONAL_EXPORT_SOURCE_RATE_CARD_VERSION,
  type ProfessionalExportAspectRatio,
  type ConfirmedProfessionalExportCreditCoverage,
  type ProfessionalExportCreditCoverage,
  type ProfessionalExportExecutionAuthority,
  type ProfessionalExportFrame,
  type ProfessionalExportProfileId,
} from '../types/professional-export'

const FOUR_K_COST_BASIS_PIXEL_COUNT = 8_294_400 as const
const BASIS_POINTS = 10_000

const frames: Record<ProfessionalExportAspectRatio, Record<ProfessionalExportProfileId, readonly [number, number]>> = {
  '16:9': {
    hd_1080: [1920, 1080],
    qhd_1440: [2560, 1440],
    uhd_2160: [3840, 2160],
  },
  '9:16': {
    hd_1080: [1080, 1920],
    qhd_1440: [1440, 2560],
    uhd_2160: [2160, 3840],
  },
  '1:1': {
    hd_1080: [1080, 1080],
    qhd_1440: [1440, 1440],
    uhd_2160: [2160, 2160],
  },
  '4:5': {
    hd_1080: [1080, 1350],
    qhd_1440: [1440, 1800],
    uhd_2160: [2160, 2700],
  },
  '4:3': {
    hd_1080: [1440, 1080],
    qhd_1440: [1920, 1440],
    uhd_2160: [2880, 2160],
  },
}

const profileLabels: Record<ProfessionalExportProfileId, string> = {
  hd_1080: '1080p Full HD',
  qhd_1440: '2K / 1440p',
  uhd_2160: '4K UHD',
}

export function resolveProfessionalExportFrame(
  aspectRatio: ProfessionalExportAspectRatio,
  profileId: ProfessionalExportProfileId,
): ProfessionalExportFrame {
  const [width, height] = frames[aspectRatio][profileId]
  return {
    profileId,
    aspectRatio,
    width,
    height,
    pixelCount: width * height,
    label: profileLabels[profileId],
  }
}

export function buildProfessionalExportCreditCoverage(input: {
  durationSeconds: number
  outputFps: number
  approvedAspectRatio: ProfessionalExportAspectRatio
}): ConfirmedProfessionalExportCreditCoverage
export function buildProfessionalExportCreditCoverage(input: {
  durationSeconds: number
  outputFps: number
  approvedAspectRatio?: ProfessionalExportAspectRatio
}): ProfessionalExportCreditCoverage
export function buildProfessionalExportCreditCoverage(input: {
  durationSeconds: number
  outputFps: number
  approvedAspectRatio?: ProfessionalExportAspectRatio
}): ProfessionalExportCreditCoverage {
  assertPositiveFinite(input.durationSeconds, 'durationSeconds')
  assertPositiveFinite(input.outputFps, 'outputFps')

  const megapixelFrames = (FOUR_K_COST_BASIS_PIXEL_COUNT / 1_000_000) * input.outputFps * input.durationSeconds
  const rawMicros = Math.ceil(
    PROFESSIONAL_EXPORT_COST_RATES.flatRequestMicros +
    input.durationSeconds * PROFESSIONAL_EXPORT_COST_RATES.perOutputSecondMicros +
    megapixelFrames * PROFESSIONAL_EXPORT_COST_RATES.perMegapixelFrameMicros,
  )
  const lowMicros = applyBasisPoints(rawMicros, PROFESSIONAL_EXPORT_COST_RATES.estimateLowBasisPoints)
  const highMicros = rawMicros + applyBasisPoints(
    rawMicros,
    PROFESSIONAL_EXPORT_COST_RATES.estimateHighRiskBufferBasisPoints,
  )

  return {
    policyVersion: PROFESSIONAL_EXPORT_POLICY_VERSION,
    costModelVersion: PROFESSIONAL_EXPORT_COST_MODEL_VERSION,
    sourceRateCardVersion: PROFESSIONAL_EXPORT_SOURCE_RATE_CARD_VERSION,
    assumption: 'always_estimate_4k_uhd',
    costBasisProfileId: 'uhd_2160',
    defaultDeliveryProfileId: 'uhd_2160',
    coveredProfileIds: [...PROFESSIONAL_EXPORT_PROFILE_IDS],
    approvedAspectRatio: input.approvedAspectRatio,
    approvedFrames: input.approvedAspectRatio
      ? PROFESSIONAL_EXPORT_PROFILE_IDS.map((profileId) =>
          resolveProfessionalExportFrame(input.approvedAspectRatio as ProfessionalExportAspectRatio, profileId))
      : [],
    outputFps: input.outputFps,
    durationSeconds: input.durationSeconds,
    costBasisPixelCount: FOUR_K_COST_BASIS_PIXEL_COUNT,
    megapixelFrames,
    lowInternalToolCostCredits: microsToCreditsCeil(lowMicros),
    expectedInternalToolCostCredits: microsToCreditsCeil(rawMicros),
    maximumInternalToolCostCredits: microsToCreditsCeil(highMicros),
    includedInInitialEstimate: true,
    requiresSeparateExportEstimate: false,
    allowsAdditionalExportCharge: false,
    usesApprovedEditReservation: true,
    serviceFeeIncludedInToolCost: false,
    sourceEnhancementIncluded: false,
  }
}

export function buildProfessionalExportExecutionAuthority(input: {
  approvedEstimateId: string
  approvedReservationId: string
  approvedDeliverableId: string
  approvedAspectRatio: ProfessionalExportAspectRatio
  approvedOutputFps: number
  approvedDurationSeconds: number
  selectedProfileId: ProfessionalExportProfileId
  sourceEnhancementApproved?: boolean
}): ProfessionalExportExecutionAuthority {
  if (!input.approvedEstimateId.trim()) throw new Error('approvedEstimateId is required.')
  if (!input.approvedReservationId.trim()) throw new Error('approvedReservationId is required.')
  if (!input.approvedDeliverableId.trim()) throw new Error('approvedDeliverableId is required.')
  assertPositiveFinite(input.approvedOutputFps, 'approvedOutputFps')
  assertPositiveFinite(input.approvedDurationSeconds, 'approvedDurationSeconds')
  return {
    policyVersion: PROFESSIONAL_EXPORT_POLICY_VERSION,
    approvedEstimateId: input.approvedEstimateId,
    approvedReservationId: input.approvedReservationId,
    approvedDeliverableId: input.approvedDeliverableId,
    approvedAspectRatio: input.approvedAspectRatio,
    approvedOutputFps: input.approvedOutputFps,
    approvedDurationSeconds: input.approvedDurationSeconds,
    selectedProfileId: input.selectedProfileId,
    selectedFrame: resolveProfessionalExportFrame(input.approvedAspectRatio, input.selectedProfileId),
    costBasisProfileId: 'uhd_2160',
    coveredProfileIds: [...PROFESSIONAL_EXPORT_PROFILE_IDS],
    includedInApprovedEstimate: true,
    requiresSeparateExportEstimate: false,
    allowsAdditionalExportCharge: false,
    usesApprovedEditReservation: true,
    sourceEnhancementApproved: input.sourceEnhancementApproved ?? false,
  }
}

export function isProfessionalExportFrameCovered(input: {
  authority?: ProfessionalExportExecutionAuthority
  width: number
  height: number
  aspectRatio: string
  fps: number
  durationSeconds: number
}): boolean {
  const { authority } = input
  if (!authority) return false
  if (
    !PROFESSIONAL_EXPORT_ASPECT_RATIOS.includes(authority.approvedAspectRatio) ||
    !PROFESSIONAL_EXPORT_PROFILE_IDS.includes(authority.selectedProfileId) ||
    !Number.isFinite(authority.approvedOutputFps) ||
    authority.approvedOutputFps <= 0 ||
    !Number.isFinite(authority.approvedDurationSeconds) ||
    authority.approvedDurationSeconds <= 0
  ) return false
  const expectedFrame = resolveProfessionalExportFrame(
    authority.approvedAspectRatio,
    authority.selectedProfileId,
  )
  const durationTolerance = 1 / authority.approvedOutputFps
  return Boolean(authority &&
    authority.selectedFrame &&
    Array.isArray(authority.coveredProfileIds) &&
    authority.policyVersion === PROFESSIONAL_EXPORT_POLICY_VERSION &&
    authority.costBasisProfileId === 'uhd_2160' &&
    authority.coveredProfileIds.includes(authority.selectedProfileId) &&
    authority.selectedFrame.aspectRatio === authority.approvedAspectRatio &&
    authority.selectedFrame.aspectRatio === input.aspectRatio &&
    authority.selectedFrame.width === expectedFrame.width &&
    authority.selectedFrame.height === expectedFrame.height &&
    authority.selectedFrame.pixelCount === expectedFrame.pixelCount &&
    authority.selectedFrame.width === input.width &&
    authority.selectedFrame.height === input.height &&
    authority.approvedOutputFps === input.fps &&
    Math.abs(authority.approvedDurationSeconds - input.durationSeconds) <= durationTolerance &&
    authority.approvedEstimateId.trim().length > 0 &&
    authority.approvedReservationId.trim().length > 0 &&
    authority.approvedDeliverableId.trim().length > 0 &&
    authority.includedInApprovedEstimate === true &&
    authority.requiresSeparateExportEstimate === false &&
    authority.allowsAdditionalExportCharge === false &&
    authority.usesApprovedEditReservation === true)
}

function microsToCreditsCeil(micros: number): number {
  const cents = Math.ceil(micros / PROFESSIONAL_EXPORT_COST_RATES.microsPerCent)
  return cents === 0 ? 0 : Math.ceil(cents / CREDIT_RETAIL_VALUE_CENTS)
}

function applyBasisPoints(value: number, basisPoints: number): number {
  return Math.ceil((value * basisPoints) / BASIS_POINTS)
}

function assertPositiveFinite(value: number, field: string): void {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${field} must be a positive finite number.`)
}
