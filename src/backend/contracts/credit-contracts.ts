import type {
  ApproveCreditRevisionActionRequest,
  CancelCreditRevisionActionRequest,
  ChooseLowerCostCreditRevisionOptionRequest,
  CreditApprovalRecord,
  CreditExportLockRecord,
  CreditEstimateLineItemRecord,
  CreditEstimateRecord,
  CreditRevisionActionResolutionResponse,
  CreditRevisionActionRecord,
  CreditReservationRecord,
  CreditSettlementRecord,
  CreditWalletRecord,
  EditCreditCostSummary,
  EvaluateExportCreditGateRequest,
  ExportCreditGateResult,
  PreviewCreditSettlementRequest,
  PreviewCreditSettlementResponse,
  ReserveMaxEstimateCreditsRequest,
  ReserveMaxEstimateCreditsResponse,
  SettleCreditReservationRequest,
  SettleCreditReservationResponse,
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
  CreditExportLockRecord,
  CreditRevisionActionResolutionResponse,
  PreviewCreditSettlementRequest,
  PreviewCreditSettlementResponse,
  ReserveMaxEstimateCreditsRequest,
  ReserveMaxEstimateCreditsResponse,
  SettleCreditReservationRequest,
  SettleCreditReservationResponse,
  EvaluateExportCreditGateRequest,
  ExportCreditGateResult,
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
