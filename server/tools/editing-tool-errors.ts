import type { EditingToolId } from './editing-tool-contracts'

export const EDITING_TOOL_ERROR_CODES = {
  TOOL_NOT_REGISTERED: 'TOOL_NOT_REGISTERED',
  TOOL_REQUIRED_MISSING: 'TOOL_REQUIRED_MISSING',
  TOOL_CHECK_FAILED: 'TOOL_CHECK_FAILED',
  TOOL_STRICT_READINESS_FAILED: 'TOOL_STRICT_READINESS_FAILED',
} as const

export type EditingToolErrorCode = keyof typeof EDITING_TOOL_ERROR_CODES

export class EditingToolReadinessError extends Error {
  readonly code: string
  readonly missingToolIds: EditingToolId[]

  constructor(code: string, message: string, missingToolIds: EditingToolId[] = []) {
    super(message)
    this.name = 'EditingToolReadinessError'
    this.code = code
    this.missingToolIds = missingToolIds
  }
}
