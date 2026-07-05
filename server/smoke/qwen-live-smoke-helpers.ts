import { createMockDatabase } from '../../src/backend/mock/mock-database'
import { createMockProjectEditBriefRepository } from '../../src/backend/repositories/mock-project-edit-brief-repository'
import type { ProjectEditBriefRepository } from '../../src/backend/repositories/project-edit-brief-repository'

export const QWEN_LIVE_SMOKE_FIXTURE = {
  workspaceId: 'qwen-live-smoke-workspace',
  userId: 'qwen-live-smoke-user',
  projectId: 'mock-project-edit-chat-foundation',
  editSessionId: 'edit-session-approved-preview',
  briefId: 'project-edit-brief-chat-confirmation',
  markerId: 'marker-keep-quote',
  messageText: 'Keep the quote, tighten the pacing, and return only the required structured marker intent JSON.',
} as const

export function createQwenLiveSmokeRepository(): ProjectEditBriefRepository {
  return createMockProjectEditBriefRepository({
    db: createMockDatabase(),
    workspaceId: QWEN_LIVE_SMOKE_FIXTURE.workspaceId,
    projectId: QWEN_LIVE_SMOKE_FIXTURE.projectId,
    userId: QWEN_LIVE_SMOKE_FIXTURE.userId,
  })
}

export function qwenLiveSmokeBlockedResult(status: string, extra: Record<string, unknown> = {}) {
  return {
    ok: false,
    status,
    ...extra,
    flags: {
      providerCallMade: false,
      qwenCallMade: false,
      secretValuePrinted: false,
      secretSentToFrontend: false,
      authorizationHeaderLogged: false,
      workerJobCreated: false,
      renderJobCreated: false,
      creditReservedOrSpent: false,
    },
  }
}

export function assertNoUnsafeQwenRuntimeEffects(input: {
  secretValuePrinted?: boolean
  secretSentToFrontend?: boolean
  authorizationHeaderLogged?: boolean
  supabaseCommandRun?: boolean
  supabaseReadMade?: boolean
  supabaseWriteMade?: boolean
  storageReadMade?: boolean
  storageWriteMade?: boolean
  signedUrlCreated?: boolean
  fileBytesRead?: boolean
  externalUrlFetched?: boolean
  mediaProcessingStarted?: boolean
  soundRuntimeInvoked?: boolean
  workerJobCreated?: boolean
  generationRequestCreated?: boolean
  renderJobCreated?: boolean
  creditReservedOrSpent?: boolean
  editPlanCreated?: boolean
  plannerExecuted?: boolean
}) {
  const unsafeFlagKeys = [
    'secretValuePrinted',
    'secretSentToFrontend',
    'authorizationHeaderLogged',
    'supabaseCommandRun',
    'supabaseReadMade',
    'supabaseWriteMade',
    'storageReadMade',
    'storageWriteMade',
    'signedUrlCreated',
    'fileBytesRead',
    'externalUrlFetched',
    'mediaProcessingStarted',
    'soundRuntimeInvoked',
    'workerJobCreated',
    'generationRequestCreated',
    'renderJobCreated',
    'creditReservedOrSpent',
    'editPlanCreated',
    'plannerExecuted',
  ] as const
  const unsafe = unsafeFlagKeys.filter((key) => input[key] === true)
  if (unsafe.length) {
    throw new Error(`Unsafe Qwen live smoke effect detected: ${unsafe.join(', ')}`)
  }
}
