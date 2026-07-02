export type CreditRuntimeMode =
  | 'mock'
  | 'frontend_estimate_only'
  | 'backend_required'
  | 'disabled'

export type CreditGateDecision =
  | 'allowed'
  | 'blocked_no_estimate'
  | 'blocked_estimate_not_approved'
  | 'blocked_insufficient_credits'
  | 'blocked_reservation_missing'
  | 'blocked_reservation_expired'
  | 'blocked_wrong_user_or_workspace'
  | 'blocked_backend_required'
  | 'blocked_unknown'

export type CreditReservationStatus =
  | 'draft'
  | 'reserved'
  | 'spent'
  | 'released'
  | 'refunded'
  | 'expired'
  | 'failed'

export type CreditSpendPurpose =
  | 'edit_planning'
  | 'music_generation'
  | 'sfx_generation'
  | 'stroke_motion_generation'
  | 'graphic_design_generation'
  | 'real_motion_generation'
  | 'video_generation'
  | 'preview_render'
  | 'final_export'
  | 'worker_job'
  | 'other'

export interface CreditGateCheckInput {
  workspaceId: string
  projectId: string
  editPlanId?: string
  creditEstimateId?: string
  creditReservationId?: string
  requestedByUserId?: string
  purpose: CreditSpendPurpose
  estimatedCredits: number
  requiresApproval: boolean
}

export interface CreditGateCheckResult {
  ok: boolean
  decision: CreditGateDecision
  message: string
  warnings: string[]
  creditEstimateId?: string
  creditReservationId?: string
  availableCredits?: number
  reservedCredits?: number
  requiredCredits?: number
  mockOnly: boolean
}

export interface CreditReservationRuntimeRecord {
  id: string
  workspaceId: string
  projectId: string
  editPlanId?: string
  creditEstimateId: string
  requestedByUserId?: string
  purpose: CreditSpendPurpose
  creditsReserved: number
  status: CreditReservationStatus
  expiresAt?: string
  createdAt: string
  updatedAt?: string
  mockOnly?: boolean
}
