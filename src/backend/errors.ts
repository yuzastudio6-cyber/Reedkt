export type BackendErrorCode =
  | 'PROJECT_NOT_FOUND'
  | 'CHAT_SESSION_NOT_FOUND'
  | 'CHAT_MESSAGE_NOT_FOUND'
  | 'MEDIA_ASSET_NOT_FOUND'
  | 'SOURCE_SEQUENCE_NOT_FOUND'
  | 'NO_SOURCE_CLIPS'
  | 'MISSING_USER_INTENT'
  | 'INTENT_ANALYSIS_NOT_FOUND'
  | 'EDIT_PLAN_NOT_FOUND'
  | 'EDIT_PLAN_NOT_READY'
  | 'CREDIT_WALLET_NOT_FOUND'
  | 'CREDIT_ESTIMATE_NOT_FOUND'
  | 'CREDIT_ESTIMATE_NOT_READY'
  | 'CREDIT_APPROVAL_NOT_FOUND'
  | 'PLAN_NOT_APPROVED'
  | 'CREDITS_NOT_RESERVED'
  | 'GENERATION_NOT_ALLOWED'
  | 'GENERATION_REQUEST_NOT_FOUND'
  | 'GENERATED_ASSET_NOT_FOUND'
  | 'JOB_NOT_FOUND'
  | 'JOB_DEPENDENCY_NOT_READY'
  | 'RENDER_JOB_NOT_FOUND'
  | 'RENDER_NOT_FOUND'
  | 'QA_REPORT_NOT_FOUND'
  | 'REVISION_REQUEST_NOT_FOUND'
  | 'MOCK_ONLY'
  | 'UNKNOWN_ERROR'

export class BackendServiceError extends Error {
  public readonly code: BackendErrorCode
  public readonly details?: unknown

  constructor(
    code: BackendErrorCode,
    message: string,
    details?: unknown,
  ) {
    super(message)
    this.name = 'BackendServiceError'
    this.code = code
    this.details = details
  }
}
