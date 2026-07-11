import type { ReEditProCanonicalEditLevel } from './edit-level'

export const CREDIT_RETAIL_VALUE_CENTS = 10 as const
export const CREDITS_PER_DOLLAR = 10 as const
export const REEDITPRO_CREDIT_POLICY_VERSION = 'rp-creditpolicy-01' as const
export const REEDITPRO_SERVICE_FEE_POLICY_VERSION = 'rp-creditpolicy-01-service-fee' as const

export const REEDITPRO_EDIT_LEVELS = [
  'normal',
  'premium',
  'ultra_premium',
] as const satisfies readonly ReEditProCanonicalEditLevel[]

export const REEDITPRO_PRODUCT_EDIT_LEVELS = REEDITPRO_EDIT_LEVELS

export type CreditPolicyErrorCode =
  | 'invalid_cents'
  | 'invalid_dollars'
  | 'invalid_duration_seconds'
  | 'invalid_edit_level'
  | 'invalid_tool_cost_credits'

export interface CreditPolicyError {
  code: CreditPolicyErrorCode
  message: string
  field: string
  value: unknown
}

export type CreditPolicyResult<T> =
  | {
      ok: true
      data: T
    }
  | {
      ok: false
      error: CreditPolicyError
    }

export class CreditPolicyInputError extends Error {
  readonly code: CreditPolicyErrorCode
  readonly field: string
  readonly value: unknown

  constructor(error: CreditPolicyError) {
    super(error.message)
    this.name = 'CreditPolicyInputError'
    this.code = error.code
    this.field = error.field
    this.value = error.value
  }
}

export type ReEditProCreditDurationBucketId =
  | '0_5_min'
  | '5_10_min'
  | '10_20_min'
  | '20_60_min'
  | '60_plus_custom'

export type ReEditProBillableDurationBucketId = Exclude<ReEditProCreditDurationBucketId, '60_plus_custom'>

export interface ReEditProCreditDurationBucket {
  id: ReEditProCreditDurationBucketId
  label: string
  minSeconds: number
  maxSeconds?: number
  customEstimateRequired: boolean
}

export interface ReEditProServiceFeeCalculationInput {
  actualToolCostCredits: number
  durationSeconds: number
  editLevel: ReEditProCanonicalEditLevel
}

export interface ReEditProServiceFeeCalculation {
  actualToolCostCredits: number
  durationBucket: ReEditProCreditDurationBucketId
  editLevel: ReEditProCanonicalEditLevel
  lengthFloorFeeCredits: number | null
  percentageFeeCredits: number
  serviceFeeCredits: number | null
  customEstimateRequired: boolean
}

export interface ReEditProFinalChargeCalculation extends ReEditProServiceFeeCalculation {
  finalChargeCredits: number | null
}

export const REEDITPRO_CREDIT_DURATION_BUCKETS: readonly ReEditProCreditDurationBucket[] = [
  {
    id: '0_5_min',
    label: '0-5 min',
    minSeconds: 0,
    maxSeconds: 300,
    customEstimateRequired: false,
  },
  {
    id: '5_10_min',
    label: '5-10 min',
    minSeconds: 300,
    maxSeconds: 600,
    customEstimateRequired: false,
  },
  {
    id: '10_20_min',
    label: '10-20 min',
    minSeconds: 600,
    maxSeconds: 1200,
    customEstimateRequired: false,
  },
  {
    id: '20_60_min',
    label: '20-60 min',
    minSeconds: 1200,
    maxSeconds: 3600,
    customEstimateRequired: false,
  },
  {
    id: '60_plus_custom',
    label: '60+ min custom',
    minSeconds: 3600,
    customEstimateRequired: true,
  },
] as const

export const SERVICE_FEE_LENGTH_FLOORS: Record<
  ReEditProBillableDurationBucketId,
  Record<ReEditProCanonicalEditLevel, number>
> = {
  '0_5_min': {
    normal: 30,
    premium: 50,
    ultra_premium: 80,
  },
  '5_10_min': {
    normal: 40,
    premium: 70,
    ultra_premium: 120,
  },
  '10_20_min': {
    normal: 70,
    premium: 120,
    ultra_premium: 200,
  },
  '20_60_min': {
    normal: 120,
    premium: 220,
    ultra_premium: 350,
  },
}

export const SERVICE_FEE_PERCENTAGES: Record<ReEditProCanonicalEditLevel, number> = {
  normal: 0.1,
  premium: 0.2,
  ultra_premium: 0.3,
}

export const REEDITPRO_FINAL_CHARGE_FORMULA =
  'final_charge_credits = actual_billable_tool_cost_credits + reeditpro_service_fee_credits'

export const REEDITPRO_TOOL_OWNER_COST_POLICY =
  'Tool owners report actual internal tool cost only. Tool owners must never include the ReEditPro service/edit fee inside tool cost events.'

export const REEDITPRO_NO_SILENT_RECOVERY_BILLING_POLICY =
  'If ReEditPro fails to pause before an unapproved overage, ReEditPro absorbs the overage. Do not silently take credits from the user next time and do not create hidden negative wallet behavior.'

export const REEDITPRO_RESERVATION_POLICY_COPY = {
  estimateRange: 'Before paid work starts, ReEditPro shows a low / expected / high estimate.',
  approvalRequired: 'User must approve the estimate before paid generation, rendering, or editing starts.',
  reserveMaximum: 'ReEditPro reserves maximumEstimatedCredits, not expected credits.',
  activeReservationRequired: 'Paid generation, rendering, and editing cannot start without an approved estimate and active reservation.',
} as const

export const REEDITPRO_REVISED_ESTIMATE_ACTION_REQUIRED_COPY = {
  title: 'Action required: revised credit estimate needed',
  explanation:
    'This edit is paused because it may exceed the credit amount you approved. No extra paid work will continue until you approve the revised estimate or choose a lower-cost option.',
  options: [
    'Approve & Continue',
    'Choose Lower-Cost Option',
    'Cancel Extra Work',
  ],
} as const

export const REVISED_CREDIT_ACTION_COPY = REEDITPRO_REVISED_ESTIMATE_ACTION_REQUIRED_COPY

export const REEDITPRO_EXPORT_LOCK_ACTION_REQUIRED_COPY = {
  title: 'Action required: add credits to export',
  allowedWhen: [
    'User approved the additional cost.',
    'Edit is ready.',
    'Approved final charge is not fully funded.',
  ],
  notAllowedWhen: [
    'ReEditPro estimated incorrectly.',
    'Provider variance occurred without user approval.',
    'ReEditPro failed to pause in time.',
  ],
} as const

export const EXPORT_CREDIT_ACTION_COPY = REEDITPRO_EXPORT_LOCK_ACTION_REQUIRED_COPY

export function centsToCredits(cents: number): number {
  return unwrapCreditPolicyResult(safeCentsToCredits(cents))
}

export function dollarsToCredits(dollars: number): number {
  return unwrapCreditPolicyResult(safeDollarsToCredits(dollars))
}

export function getCreditDurationBucket(durationSeconds: number): ReEditProCreditDurationBucketId {
  return unwrapCreditPolicyResult(safeGetCreditDurationBucket(durationSeconds))
}

export function safeCentsToCredits(cents: number): CreditPolicyResult<number> {
  const validation = validateNonNegativeFinite(cents, 'cents', 'invalid_cents')
  if (!validation.ok) return validation
  if (cents === 0) return okCreditPolicy(0)
  return okCreditPolicy(Math.ceil(cents / CREDIT_RETAIL_VALUE_CENTS))
}

export function safeDollarsToCredits(dollars: number): CreditPolicyResult<number> {
  const validation = validateNonNegativeFinite(dollars, 'dollars', 'invalid_dollars')
  if (!validation.ok) return validation
  if (dollars === 0) return okCreditPolicy(0)
  return safeCentsToCredits(Math.ceil(dollars * 100))
}

function safeGetCreditDurationBucket(durationSeconds: number): CreditPolicyResult<ReEditProCreditDurationBucketId> {
  const validation = validateNonNegativeFinite(
    durationSeconds,
    'durationSeconds',
    'invalid_duration_seconds',
  )
  if (!validation.ok) return validation
  if (durationSeconds <= 300) return okCreditPolicy('0_5_min')
  if (durationSeconds <= 600) return okCreditPolicy('5_10_min')
  if (durationSeconds <= 1200) return okCreditPolicy('10_20_min')
  if (durationSeconds < 3600) return okCreditPolicy('20_60_min')
  return okCreditPolicy('60_plus_custom')
}

export function requiresCustomCreditEstimate(
  durationSeconds: number,
  editLevel?: ReEditProCanonicalEditLevel,
): boolean {
  return unwrapCreditPolicyResult(safeRequiresCustomCreditEstimate(durationSeconds, editLevel))
}

export function safeRequiresCustomCreditEstimate(
  durationSeconds: number,
  editLevel?: ReEditProCanonicalEditLevel,
): CreditPolicyResult<boolean> {
  const editLevelValidation = validateEditLevel(editLevel)
  if (!editLevelValidation.ok) return editLevelValidation

  const bucket = safeGetCreditDurationBucket(durationSeconds)
  if (!bucket.ok) return bucket

  return okCreditPolicy(bucket.data === '60_plus_custom')
}

export function getServiceFeeLengthFloorCredits(
  durationSeconds: number,
  editLevel: ReEditProCanonicalEditLevel,
): number | null {
  return unwrapCreditPolicyResult(safeGetServiceFeeLengthFloorCredits(durationSeconds, editLevel))
}

export function safeGetServiceFeeLengthFloorCredits(
  durationSeconds: number,
  editLevel: ReEditProCanonicalEditLevel,
): CreditPolicyResult<number | null> {
  const editLevelValidation = validateEditLevel(editLevel)
  if (!editLevelValidation.ok) return editLevelValidation

  const bucketResult = safeGetCreditDurationBucket(durationSeconds)
  if (!bucketResult.ok) return bucketResult

  const bucket = bucketResult.data
  if (bucket === '60_plus_custom') return okCreditPolicy(null)
  return okCreditPolicy(SERVICE_FEE_LENGTH_FLOORS[bucket][editLevel])
}

export function getServiceFeePercentage(editLevel: ReEditProCanonicalEditLevel): number {
  return SERVICE_FEE_PERCENTAGES[editLevel]
}

export function calculateReEditProServiceFeeCredits(
  input: ReEditProServiceFeeCalculationInput,
): ReEditProServiceFeeCalculation {
  return unwrapCreditPolicyResult(safeCalculateReEditProServiceFeeCredits(input))
}

export function safeCalculateReEditProServiceFeeCredits(
  input: ReEditProServiceFeeCalculationInput,
): CreditPolicyResult<ReEditProServiceFeeCalculation> {
  const editLevelValidation = validateEditLevel(input.editLevel)
  if (!editLevelValidation.ok) return editLevelValidation

  const toolCostValidation = validateNonNegativeFinite(
    input.actualToolCostCredits,
    'actualToolCostCredits',
    'invalid_tool_cost_credits',
  )
  if (!toolCostValidation.ok) return toolCostValidation

  const durationBucketResult = safeGetCreditDurationBucket(input.durationSeconds)
  if (!durationBucketResult.ok) return durationBucketResult

  const lengthFloorFeeCreditsResult = safeGetServiceFeeLengthFloorCredits(input.durationSeconds, input.editLevel)
  if (!lengthFloorFeeCreditsResult.ok) return lengthFloorFeeCreditsResult

  const actualToolCostCredits = Math.ceil(input.actualToolCostCredits)
  const durationBucket = durationBucketResult.data
  const percentageFeeCredits = Math.ceil(actualToolCostCredits * getServiceFeePercentage(input.editLevel))
  const lengthFloorFeeCredits = lengthFloorFeeCreditsResult.data
  const customEstimateRequired = durationBucket === '60_plus_custom'
  const serviceFeeCredits = customEstimateRequired
    ? null
    : Math.max(lengthFloorFeeCredits ?? 0, percentageFeeCredits)

  return okCreditPolicy({
    actualToolCostCredits,
    durationBucket,
    editLevel: input.editLevel,
    lengthFloorFeeCredits,
    percentageFeeCredits,
    serviceFeeCredits,
    customEstimateRequired,
  })
}

export function calculateReEditProFinalChargeCredits(
  input: ReEditProServiceFeeCalculationInput,
): ReEditProFinalChargeCalculation {
  const serviceFee = calculateReEditProServiceFeeCredits(input)
  return {
    ...serviceFee,
    finalChargeCredits: serviceFee.serviceFeeCredits === null
      ? null
      : serviceFee.actualToolCostCredits + serviceFee.serviceFeeCredits,
  }
}

function validateNonNegativeFinite(
  value: number,
  field: string,
  code: CreditPolicyErrorCode,
): CreditPolicyResult<true> {
  if (!Number.isFinite(value) || value < 0) {
    return failCreditPolicy(code, `${field} must be a non-negative finite number.`, field, value)
  }

  return okCreditPolicy(true)
}

function validateEditLevel(
  editLevel: ReEditProCanonicalEditLevel | undefined,
): CreditPolicyResult<true> {
  if (!editLevel || !REEDITPRO_EDIT_LEVELS.includes(editLevel)) {
    return failCreditPolicy(
      'invalid_edit_level',
      'editLevel must be normal, premium, or ultra_premium.',
      'editLevel',
      editLevel,
    )
  }

  return okCreditPolicy(true)
}

function okCreditPolicy<T>(data: T): CreditPolicyResult<T> {
  return { ok: true, data }
}

function failCreditPolicy(
  code: CreditPolicyErrorCode,
  message: string,
  field: string,
  value: unknown,
): CreditPolicyResult<never> {
  return {
    ok: false,
    error: {
      code,
      message,
      field,
      value,
    },
  }
}

function unwrapCreditPolicyResult<T>(result: CreditPolicyResult<T>): T {
  if (!result.ok) {
    throw new CreditPolicyInputError(result.error)
  }

  return result.data
}
