import type {
  ApproveCreditRevisionActionRequest,
  CancelCreditRevisionActionRequest,
  ChooseLowerCostCreditRevisionOptionRequest,
  CompleteMockCreditTopUpRequest,
  CompleteMockCreditTopUpResponse,
  CreateMockCreditTopUpRequest,
  CreateMockCreditTopUpResponse,
  CreditApprovalRecord,
  CreditExportLockRecord,
  CreditEstimateLineItemRecord,
  CreditEstimateRecord,
  CreditPackDefinition,
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
  SuggestCreditTopUpRequest,
  SuggestCreditTopUpResponse,
  SuggestedCreditTopUp,
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
  CreditPackDefinition,
  EditCreditCostSummary,
  ApproveCreditRevisionActionRequest,
  CancelCreditRevisionActionRequest,
  ChooseLowerCostCreditRevisionOptionRequest,
  CompleteMockCreditTopUpRequest,
  CompleteMockCreditTopUpResponse,
  CreditExportLockRecord,
  CreditRevisionActionResolutionResponse,
  CreateMockCreditTopUpRequest,
  CreateMockCreditTopUpResponse,
  PreviewCreditSettlementRequest,
  PreviewCreditSettlementResponse,
  ReserveMaxEstimateCreditsRequest,
  ReserveMaxEstimateCreditsResponse,
  SettleCreditReservationRequest,
  SettleCreditReservationResponse,
  SuggestCreditTopUpRequest,
  SuggestCreditTopUpResponse,
  SuggestedCreditTopUp,
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
