import {
  getAuthClientStatus,
  getCurrentSupabaseSession,
  getCurrentSupabaseUser,
} from '../backend/auth/auth-client-service'
import {
  createProjectEditSessionBriefPath,
  createProjectEditSessionChatPath,
  createProjectHomePath,
} from './project-edit-session-navigation'
import { MOCK_PROJECT_HOME_PROJECT_ID } from './project-edit-session-project-home-ui-adapter'

export const INTERNAL_TESTING_EDIT_SESSION_ID = 'edit-session-youtube-wide'

export type InternalTestingAuthProjectAccessStatus =
  | 'not_configured'
  | 'signed_out'
  | 'signed_in_auth_only'
  | 'error'

export type InternalTestingAuthProjectAccessReadiness = {
  status: InternalTestingAuthProjectAccessStatus
  configured: boolean
  message: string
  warnings: string[]
  userEmail?: string
  projectId: string
  editSessionId: string
  routes: {
    projectHome: string
    editChat: string
    editBrief: string
  }
  source: 'frontend_anon_auth_readonly_and_mock_project_session'
  blockedScope: {
    serviceRole: false
    profileWorkspaceBootstrapWrites: false
    supabaseDataReadWrite: false
    storageSignedUrls: false
    sqlOrMigration: false
    providerOrModelCalls: false
    workerDispatch: false
    mediaProcessing: false
    renderOrExport: false
    creditSpend: false
    productReady: false
  }
}

function baseReadiness(): Omit<InternalTestingAuthProjectAccessReadiness, 'configured' | 'message' | 'status' | 'warnings' | 'userEmail'> {
  return {
    projectId: MOCK_PROJECT_HOME_PROJECT_ID,
    editSessionId: INTERNAL_TESTING_EDIT_SESSION_ID,
    routes: {
      projectHome: createProjectHomePath(MOCK_PROJECT_HOME_PROJECT_ID),
      editChat: createProjectEditSessionChatPath(MOCK_PROJECT_HOME_PROJECT_ID, INTERNAL_TESTING_EDIT_SESSION_ID),
      editBrief: createProjectEditSessionBriefPath(MOCK_PROJECT_HOME_PROJECT_ID, INTERNAL_TESTING_EDIT_SESSION_ID),
    },
    source: 'frontend_anon_auth_readonly_and_mock_project_session',
    blockedScope: {
      serviceRole: false,
      profileWorkspaceBootstrapWrites: false,
      supabaseDataReadWrite: false,
      storageSignedUrls: false,
      sqlOrMigration: false,
      providerOrModelCalls: false,
      workerDispatch: false,
      mediaProcessing: false,
      renderOrExport: false,
      creditSpend: false,
      productReady: false,
    },
  }
}

export async function readInternalTestingAuthProjectAccessReadiness(): Promise<InternalTestingAuthProjectAccessReadiness> {
  const clientStatus = getAuthClientStatus()
  const base = baseReadiness()

  if (!clientStatus.configured) {
    return {
      ...base,
      configured: false,
      status: 'not_configured',
      message: 'Supabase public auth env is not configured; internal testing will use mock project/session routes only.',
      warnings: [
        ...clientStatus.warnings,
        'This readiness check does not run profile/workspace bootstrap or create Supabase records.',
      ],
    }
  }

  try {
    const sessionResult = await getCurrentSupabaseSession()

    if (!sessionResult.session) {
      return {
        ...base,
        configured: true,
        status: 'signed_out',
        message: 'Supabase public auth is configured, but no browser session is signed in.',
        warnings: [
          ...sessionResult.warnings,
          'Sign in before authenticated project/session testing; mock project/session routes remain available for local testing.',
          'This readiness check does not run profile/workspace bootstrap or create Supabase records.',
        ],
      }
    }

    const userResult = await getCurrentSupabaseUser()

    if (!userResult.user) {
      return {
        ...base,
        configured: true,
        status: 'signed_out',
        message: userResult.message,
        warnings: [
          ...userResult.warnings,
          'A valid user is required before authenticated project/session testing can graduate beyond mock routes.',
          'This readiness check does not run profile/workspace bootstrap or create Supabase records.',
        ],
      }
    }

    return {
      ...base,
      configured: true,
      status: 'signed_in_auth_only',
      userEmail: userResult.user.email ?? undefined,
      message: 'Supabase Auth user is signed in; project/session route access remains mock-local until backend persistence gates pass.',
      warnings: [
        ...sessionResult.warnings,
        ...userResult.warnings,
        'Auth-only readiness does not prove profile/workspace rows, project membership, storage, credit, or worker access.',
      ],
    }
  } catch (error) {
    return {
      ...base,
      configured: true,
      status: 'error',
      message: error instanceof Error ? error.message : 'Auth/session readiness check failed safely.',
      warnings: [
        'Auth/session readiness failed before any profile/workspace bootstrap, storage, worker, provider, or credit action.',
      ],
    }
  }
}
