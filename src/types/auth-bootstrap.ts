export type AuthBootstrapStatus =
  | 'not_configured'
  | 'signed_out'
  | 'profile_missing'
  | 'workspace_missing'
  | 'membership_missing'
  | 'ready'
  | 'error'

export type AuthBootstrapMode =
  | 'mock'
  | 'supabase_frontend'
  | 'backend_required'

export type WorkspaceBootstrapRole =
  | 'owner'
  | 'admin'
  | 'editor'
  | 'viewer'
  | 'client_reviewer'

export interface AuthenticatedUserContext {
  userId: string
  email?: string
  displayName?: string
  avatarUrl?: string
  currentWorkspaceId?: string
  roles: WorkspaceBootstrapRole[]
  bootstrapStatus: AuthBootstrapStatus
}

export interface UserProfileBootstrapResult {
  ok: boolean
  status: AuthBootstrapStatus
  mode?: AuthBootstrapMode
  userContext?: AuthenticatedUserContext
  profileId?: string
  workspaceId?: string
  membershipId?: string
  message: string
  warnings: string[]
}

export interface WorkspaceBootstrapResult {
  ok: boolean
  mode?: AuthBootstrapMode
  workspaceId?: string
  membershipId?: string
  role?: WorkspaceBootstrapRole
  message: string
  warnings: string[]
}

export type AuthBootstrapNextStep =
  | 'sign_in_required'
  | 'configure_supabase_env'
  | 'backend_profile_creation_required'
  | 'workspace_ready'
  | 'error'

export interface AuthBootstrapFlowResult {
  ok: boolean
  status: AuthBootstrapStatus
  mode: AuthBootstrapMode
  userContext?: AuthenticatedUserContext
  profileResult?: UserProfileBootstrapResult
  workspaceResult?: WorkspaceBootstrapResult
  warnings: string[]
  nextStep: AuthBootstrapNextStep
  message: string
}
