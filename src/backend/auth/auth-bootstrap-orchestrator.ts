import type {
  AuthBootstrapFlowResult,
  AuthenticatedUserContext,
  WorkspaceBootstrapRole,
} from '../../types/auth-bootstrap'
import { MOCK_USER_ID, MOCK_WORKSPACE_ID } from '../mock/mock-service-data'
import { getAuthClientStatus, getCurrentSupabaseSession, getCurrentSupabaseUser } from './auth-client-service'
import { ensureCurrentUserProfile } from './profile-bootstrap-service'
import { ensureDefaultWorkspace } from './workspace-bootstrap-service'

function mergeWarnings(...groups: Array<string[] | undefined>): string[] {
  return groups.flatMap((group) => group ?? [])
}

export async function runAuthBootstrapFlow(): Promise<AuthBootstrapFlowResult> {
  const status = getAuthClientStatus()

  if (!status.configured) {
    return {
      ok: false,
      status: 'not_configured',
      mode: 'mock',
      warnings: status.warnings,
      nextStep: 'configure_supabase_env',
      message: status.message,
    }
  }

  return runSupabaseAuthBootstrapFlow()
}

export async function runMockAuthBootstrapFlow(): Promise<AuthBootstrapFlowResult> {
  const userContext: AuthenticatedUserContext = {
    userId: MOCK_USER_ID,
    email: 'mock-user@reeditpro.local',
    displayName: 'Mock ReeditPro User',
    currentWorkspaceId: MOCK_WORKSPACE_ID,
    roles: ['owner'],
    bootstrapStatus: 'ready',
  }

  return {
    ok: true,
    status: 'ready',
    mode: 'mock',
    userContext,
    warnings: ['Mock auth bootstrap is local-only and does not create Supabase records.'],
    nextStep: 'workspace_ready',
    message: 'Mock auth bootstrap is ready.',
  }
}

export async function runSupabaseAuthBootstrapFlow(): Promise<AuthBootstrapFlowResult> {
  const sessionResult = await getCurrentSupabaseSession()

  if (sessionResult.status === 'not_configured') {
    return {
      ok: false,
      status: 'not_configured',
      mode: 'mock',
      warnings: sessionResult.warnings,
      nextStep: 'configure_supabase_env',
      message: sessionResult.message,
    }
  }

  if (!sessionResult.session) {
    return {
      ok: false,
      status: 'signed_out',
      mode: 'supabase_frontend',
      warnings: sessionResult.warnings,
      nextStep: 'sign_in_required',
      message: 'Sign in before ReeditPro can bootstrap profile and workspace context.',
    }
  }

  const userResult = await getCurrentSupabaseUser()
  const user = userResult.user

  if (!user) {
    return {
      ok: false,
      status: 'signed_out',
      mode: 'supabase_frontend',
      warnings: mergeWarnings(sessionResult.warnings, userResult.warnings),
      nextStep: 'sign_in_required',
      message: userResult.message,
    }
  }

  const profileResult = await ensureCurrentUserProfile(user)

  if (!profileResult.ok) {
    return {
      ok: false,
      status: profileResult.status,
      mode: profileResult.mode ?? 'supabase_frontend',
      profileResult,
      warnings: mergeWarnings(sessionResult.warnings, userResult.warnings, profileResult.warnings),
      nextStep: profileResult.mode === 'backend_required' ? 'backend_profile_creation_required' : 'error',
      message: profileResult.message,
    }
  }

  const workspaceResult = await ensureDefaultWorkspace(user)

  if (!workspaceResult.ok) {
    return {
      ok: false,
      status: workspaceResult.workspaceId ? 'membership_missing' : 'workspace_missing',
      mode: workspaceResult.mode ?? 'supabase_frontend',
      userContext: profileResult.userContext,
      profileResult,
      workspaceResult,
      warnings: mergeWarnings(
        sessionResult.warnings,
        userResult.warnings,
        profileResult.warnings,
        workspaceResult.warnings,
      ),
      nextStep: workspaceResult.mode === 'backend_required' ? 'backend_profile_creation_required' : 'error',
      message: workspaceResult.message,
    }
  }

  const role: WorkspaceBootstrapRole = workspaceResult.role ?? 'owner'
  const userContext: AuthenticatedUserContext = {
    ...(profileResult.userContext as AuthenticatedUserContext),
    currentWorkspaceId: workspaceResult.workspaceId ?? profileResult.userContext?.currentWorkspaceId,
    roles: [role],
    bootstrapStatus: 'ready',
  }

  return {
    ok: true,
    status: 'ready',
    mode: 'supabase_frontend',
    userContext,
    profileResult,
    workspaceResult,
    warnings: mergeWarnings(
      sessionResult.warnings,
      userResult.warnings,
      profileResult.warnings,
      workspaceResult.warnings,
    ),
    nextStep: 'workspace_ready',
    message: 'Auth, profile, workspace, and membership bootstrap are ready.',
  }
}

export function createAuthBootstrapChatSummary(result: AuthBootstrapFlowResult): string {
  if (result.status === 'not_configured') {
    return 'Supabase is not configured. Add the public browser env values before live auth can run.'
  }

  if (result.status === 'signed_out') {
    return 'Sign in to create or load your ReeditPro profile and workspace.'
  }

  if (result.mode === 'backend_required') {
    return 'Auth is connected, but RLS requires a backend runtime to finish profile or workspace bootstrap.'
  }

  if (result.ok) {
    return 'Your ReeditPro profile and current workspace are ready.'
  }

  return result.message
}
