import type {
  ApproveCreditRevisionActionRequest,
  CancelCreditRevisionActionRequest,
  ChooseLowerCostCreditRevisionOptionRequest,
  CreditApprovalRecord,
  CreditEstimateLineItemRecord,
  CreditEstimateRecord,
  CreditRevisionActionResolutionResponse,
  CreditRevisionActionRecord,
  CreditReservationRecord,
  CreditSettlementRecord,
  CreditWalletRecord,
  EditCreditCostSummary,
  PreviewCreditSettlementRequest,
  PreviewCreditSettlementResponse,
  ReserveMaxEstimateCreditsRequest,
  ReserveMaxEstimateCreditsResponse,
} from '../../types'

export interface CreateCreditEstimateRequest {
  workspaceId: string
  projectId: string
  editPlanId: string
  chatSessionId?: string
}

export interface CreateCreditEstimateResponse {
  creditEstimate: CreditEstimateRecord
  lineItems: CreditEstimateLineItemRecord[]
}

export interface ApproveCreditEstimateRequest {
  workspaceId: string
  projectId: string
  creditEstimateId: string
  approvedByUserId: string
}

export interface ApproveCreditEstimateResponse {
  creditApproval: CreditApprovalRecord
  creditEstimate: CreditEstimateRecord
}

export interface ReserveCreditsRequest {
  workspaceId: string
  projectId: string
  creditWalletId: string
  creditEstimateId: string
  creditApprovalId: string
}

export interface ReserveCreditsResponse {
  creditReservation: CreditReservationRecord
  creditWallet: CreditWalletRecord
}

export type {
  CreditRevisionActionRecord,
  CreditSettlementRecord,
  EditCreditCostSummary,
  ApproveCreditRevisionActionRequest,
  CancelCreditRevisionActionRequest,
  ChooseLowerCostCreditRevisionOptionRequest,
  CreditRevisionActionResolutionResponse,
  PreviewCreditSettlementRequest,
  PreviewCreditSettlementResponse,
  ReserveMaxEstimateCreditsRequest,
  ReserveMaxEstimateCreditsResponse,
}

export interface ListCreditSettlementsResponse {
  settlements: CreditSettlementRecord[]
}

export interface CreateCreditRevisionActionResponse {
  action: CreditRevisionActionRecord
}

export interface ListCreditRevisionActionsResponse {
  actions: CreditRevisionActionRecord[]
}
