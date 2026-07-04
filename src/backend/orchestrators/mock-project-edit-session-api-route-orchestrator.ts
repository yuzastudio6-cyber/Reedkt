import type { ApiRequestEnvelope, ApiResponseEnvelope } from '../api/api-runtime-contracts'
import { createMockApiRuntimeContext, handleMockApiRequest } from '../api/mock-api-router'
import {
  createProjectEditSessionRouteReadinessSummary,
  createProjectEditSessionRouteSafetySummary,
  createProjectEditSessionRouteSummary,
} from '../api/project-edit-session-route-summary-service'
import { createMockDatabase } from '../mock/mock-database'
import type { ProjectEditSessionApiRouteId } from '../../types/api-routes'

export interface MockProjectEditSessionApiRouteFlowResult {
  route: ProjectEditSessionApiRouteId | string
  request: ApiRequestEnvelope
  response: ApiResponseEnvelope
  session?: unknown
  cardModel?: unknown
  bundle?: unknown
  summary: string[]
  warnings: string[]
  nextStep: 'RP-EDITSESSION-05 — Project Home UI with Edit Chat Cards'
}

const NEXT_STEP = 'RP-EDITSESSION-05 — Project Home UI with Edit Chat Cards' as const
const PROJECT_ID = 'mock-project-edit-chat-foundation'
const WORKSPACE_ID = 'mock-workspace-edit-session'
const USER_ID = 'mock-user-edit-session-owner'

function request(routeId: string, body: unknown = {}): ApiRequestEnvelope {
  return {
    routeId,
    context: {
      ...createMockApiRuntimeContext({
        workspaceId: WORKSPACE_ID,
        projectId: PROJECT_ID,
        userId: USER_ID,
        mockOnly: true,
      }),
      mockDatabase: createMockDatabase(),
    },
    body,
  } as ApiRequestEnvelope
}

async function run(routeId: ProjectEditSessionApiRouteId | string, body: unknown = {}): Promise<MockProjectEditSessionApiRouteFlowResult> {
  const routeRequest = request(routeId, body)
  const response = await handleMockApiRequest(routeRequest)
  const data = response.data && typeof response.data === 'object' && !Array.isArray(response.data)
    ? response.data as Record<string, unknown>
    : {}
  const safety = createProjectEditSessionRouteSafetySummary(response)
  return {
    route: routeId,
    request: routeRequest,
    response,
    session: data.session,
    cardModel: data.cardModel,
    bundle: data.bundle,
    summary: [
      `${routeId} returned ${response.ok ? 'ok' : 'safe error'}.`,
      ...safety.summary,
    ],
    warnings: response.warnings,
    nextStep: NEXT_STEP,
  }
}

export function runMockProjectEditSessionApiRouteRegistryFlow() {
  const summary = createProjectEditSessionRouteSummary()
  return {
    route: 'project.editSessions.registry',
    request: request('project.editSessions.list'),
    response: {
      ok: true,
      statusCode: 200,
      data: summary,
      warnings: summary.warnings,
      mockOnly: true,
      providerCallMade: false,
      supabaseWriteMade: false,
      generationRequestCreated: false,
      renderJobCreated: false,
      workerJobCreated: false,
      creditReservedOrSpent: false,
    },
    summary: summary.summary,
    warnings: summary.warnings,
    nextStep: NEXT_STEP,
  } satisfies MockProjectEditSessionApiRouteFlowResult
}

export async function runMockProjectEditSessionRouteListFlow() {
  return run('project.editSessions.list', { projectId: PROJECT_ID })
}

export async function runMockProjectEditSessionRouteCreateFlow() {
  return run('project.editSessions.create', {
    projectId: PROJECT_ID,
    name: 'Route Orchestrator Edit Chat',
    aspectRatio: '9:16',
    platformTarget: 'tiktok_reel',
    selectedEditLevel: 'premium',
  })
}

export async function runMockProjectEditSessionRouteMessagesFlow() {
  return run('project.editSessions.messages.append', {
    projectId: PROJECT_ID,
    editSessionId: 'edit-session-vertical-dna',
    role: 'user',
    kind: 'text',
    text: 'Add a tighter opening hook.',
  })
}

export async function runMockProjectEditSessionRouteMemoryFlow() {
  return run('project.editSessions.memory.upsert', {
    projectId: PROJECT_ID,
    editSessionId: 'edit-session-vertical-dna',
    layer: 'session_memory',
    summary: 'User likes small captions and clean pacing.',
    facts: ['Mock-only memory update.'],
  })
}

export async function runMockProjectEditSessionRouteSnapshotVersionPreviewFlow() {
  const snapshot = await run('project.editSessions.snapshots.save', {
    projectId: PROJECT_ID,
    editSessionId: 'edit-session-vertical-dna',
    kind: 'manual_checkpoint',
    summary: 'Route orchestrator checkpoint.',
  })
  const version = await run('project.editSessions.versions.save', {
    projectId: PROJECT_ID,
    editSessionId: 'edit-session-vertical-dna',
    name: 'Route Orchestrator Version',
    summary: 'Mock version for route orchestrator.',
  })
  const preview = await run('project.editSessions.previews.save', {
    projectId: PROJECT_ID,
    editSessionId: 'edit-session-vertical-dna',
    aspectRatio: '9:16',
    status: 'placeholder_mock',
  })
  return {
    ...preview,
    summary: [
      ...snapshot.summary,
      ...version.summary,
      ...preview.summary,
    ],
  }
}

export async function runMockProjectEditSessionRouteBundleFlow() {
  return run('project.editSessions.bundle.get', { editSessionId: 'edit-session-vertical-dna' })
}

export async function runMockProjectEditSessionRouteSafetyFlow() {
  const flow = await run('project.editSessions.unknown')
  return {
    ...flow,
    summary: [
      'Unknown Project Edit Session route returned a safe mock error.',
      ...flow.summary,
    ],
  }
}

export function runMockProjectEditSessionRouteReadinessFlow() {
  const readiness = createProjectEditSessionRouteReadinessSummary()
  return {
    route: 'project.editSessions.readiness',
    request: request('project.editSessions.list'),
    response: {
      ok: true,
      statusCode: 200,
      data: readiness,
      warnings: [],
      mockOnly: true,
      providerCallMade: false,
      supabaseWriteMade: false,
      generationRequestCreated: false,
      renderJobCreated: false,
      workerJobCreated: false,
      creditReservedOrSpent: false,
    },
    summary: readiness.summary,
    warnings: [],
    nextStep: NEXT_STEP,
  } satisfies MockProjectEditSessionApiRouteFlowResult
}
