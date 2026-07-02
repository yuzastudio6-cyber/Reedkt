import type {
  CommandSafetyValidationResult,
  SupabaseCommandGuardPolicy,
  SupabaseCommandPatternKind,
} from '../../types/command-safety'

export interface ValidateCommandSafetyRequest {
  commandPreview: string
  mockOnly: true
}

export interface ValidateCommandSafetyResponse {
  result: CommandSafetyValidationResult
  mockOnly: true
}

export interface ClassifySupabaseCommandPatternRequest {
  commandPreview: string
  mockOnly: true
}

export interface ClassifySupabaseCommandPatternResponse {
  patternKind: SupabaseCommandPatternKind
  mockOnly: true
}

export interface CreateSupabaseCommandGuardPolicyRequest {
  mockOnly: true
}

export interface CreateSupabaseCommandGuardPolicyResponse {
  policy: SupabaseCommandGuardPolicy
  summary: string
  mockOnly: true
}

export interface CreateCommandSafetyReportRequest {
  commandPreview: string
  mockOnly: true
}

export interface CreateCommandSafetyReportResponse {
  result: CommandSafetyValidationResult
  report: string
  remoteCommandsRun: false
  remoteMutationsRun: false
  remoteSQLRun: false
  remoteTypegenRun: false
  secretsPrinted: false
  mockOnly: true
}
