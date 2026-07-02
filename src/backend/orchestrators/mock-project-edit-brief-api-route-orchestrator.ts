import type { ApiRequestEnvelope, ApiResponseEnvelope } from '../api/api-runtime-contracts'
import { createMockApiRuntimeContext } from '../api/mock-api-router'
import {
  PROJECT_EDIT_BRIEF_API_ROUTE_REGISTRY,
  createProjectEditBriefApiRouteRegistrySummary,
} from '../api/project-edit-brief-api-route-registry'
import {
  createProjectEditBriefRouteSafetySummary,
  createProjectEditBriefRouteSummary,
  createProjectEditBriefRouteReadinessSummary,
} from '../api/project-edit-brief-route-summary-service'
import {
  MOCK_PROJECT_EDIT_BRIEF_API_ROUTE_SCENARIOS,
} from '../api/mock-project-edit-brief-api-route-scenarios'
import { handleProjectEditBriefMockRoute } from '../api/project-edit-brief-mock-route-handlers'
import { createMockDatabase, type MockDatabase } from '../mock/mock-database'

export interface MockProjectEditBriefApiRouteOrchestratorResult {
  ok: boolean
  milestone: 'RP-EDITBRIEF-04'
  flow: string
  summary: string[]
  routeIds: string[]
  responses: ApiResponseEnvelope[]
  safetyOk: boolean
  mockOnly: true
  productionReady: false
  nextStep: 'RP-EDITBRIEF-05 — Brief UI Shell: Video Player + Timeline'
}

const PROJECT_ID = 'mock-project-edit-chat-foundation'
const WORKSPACE_ID = 'mock-workspace-edit-brief'
const USER_ID = 'mock-user-edit-brief-owner'

function request(db: MockDatabase, routeId: string, body: Record<string, unknown> = {}): ApiRequestEnvelope {
  return {
    routeId,
    context: {
      ...createMockApiRuntimeContext({
        workspaceId: WORKSPACE_ID,
        projectId: PROJECT_ID,
        userId: USER_ID,
        mockOnly: true,
      }),
      mockDatabase: db,
    } as ApiRequestEnvelope['context'] & { mockDatabase: MockDatabase },
    body,
  }
}

async function runFlow(flow: string, steps: Array<[string, Record<string, unknown>?]>): Promise<MockProjectEditBriefApiRouteOrchestratorResult> {
  const db = createMockDatabase()
  const responses: ApiResponseEnvelope[] = []

  for (const [routeId, body] of steps) {
    responses.push(await handleProjectEditBriefMockRoute(request(db, routeId, body ?? {})))
  }

  const safetyOk = responses.every((response) => createProjectEditBriefRouteSafetySummary(response).ok)

  return {
    ok: responses.every((response) => response.ok) && safetyOk,
    milestone: 'RP-EDITBRIEF-04',
    flow,
    summary: [
      `${flow} exercised ${steps.length} Project Edit Brief mock route step(s).`,
      'All steps use mock/local route envelopes and repository-backed MockDatabase state.',
      'No production API, Supabase, storage, media processing, provider, worker, render, generation, or credit effect is enabled.',
    ],
    routeIds: steps.map(([routeId]) => routeId),
    responses,
    safetyOk,
    mockOnly: true,
    productionReady: false,
    nextStep: 'RP-EDITBRIEF-05 — Brief UI Shell: Video Player + Timeline',
  }
}

export function runMockProjectEditBriefApiRouteRegistryFlow(): MockProjectEditBriefApiRouteOrchestratorResult {
  const registrySummary = createProjectEditBriefApiRouteRegistrySummary()
  const routeSummary = createProjectEditBriefRouteSummary()
  return {
    ok: registrySummary.totalRoutes === PROJECT_EDIT_BRIEF_API_ROUTE_REGISTRY.length &&
      routeSummary.totalRoutes === PROJECT_EDIT_BRIEF_API_ROUTE_REGISTRY.length,
    milestone: 'RP-EDITBRIEF-04',
    flow: 'registry',
    summary: [
      'Project Edit Brief mock API route registry is loaded.',
      `${MOCK_PROJECT_EDIT_BRIEF_API_ROUTE_SCENARIOS.length} mock route scenarios are registered.`,
    ],
    routeIds: PROJECT_EDIT_BRIEF_API_ROUTE_REGISTRY.map((route) => route.id),
    responses: [],
    safetyOk: true,
    mockOnly: true,
    productionReady: false,
    nextStep: 'RP-EDITBRIEF-05 — Brief UI Shell: Video Player + Timeline',
  }
}

export function runMockProjectEditBriefRouteBriefFlow() {
  return runFlow('brief', [
    ['project.editBrief.forSession.get'],
    ['project.editBrief.create', { editSessionId: 'edit-session-api-orchestrator', title: 'API Orchestrator Brief' }],
    ['project.editBrief.summary', { editSessionId: 'edit-session-api-orchestrator' }],
    ['project.editBrief.bundle', { editSessionId: 'edit-session-api-orchestrator' }],
  ])
}

export function runMockProjectEditBriefRouteMarkerFlow() {
  return runFlow('marker', [
    ['project.editBrief.create', { editSessionId: 'edit-session-marker-flow', title: 'Marker Flow Brief' }],
    ['project.editBrief.markers.create', { editSessionId: 'edit-session-marker-flow', markerType: 'caption_text', title: 'Add hook caption' }],
    ['project.editBrief.markers.list', { editSessionId: 'edit-session-marker-flow' }],
    ['project.editBrief.markers.confirm', { editSessionId: 'edit-session-marker-flow', summary: 'Marker confirmed.' }],
  ])
}

export function runMockProjectEditBriefRouteAttachmentFlow() {
  return runFlow('attachment', [
    ['project.editBrief.create', { editSessionId: 'edit-session-attachment-flow', title: 'Attachment Flow Brief' }],
    ['project.editBrief.markers.create', { editSessionId: 'edit-session-attachment-flow', markerType: 'broll', title: 'Add B-roll' }],
    ['project.editBrief.markerAttachments.add', { editSessionId: 'edit-session-attachment-flow', label: 'Metadata-only B-roll label' }],
    ['project.editBrief.markerAttachments.list', { editSessionId: 'edit-session-attachment-flow' }],
  ])
}

export function runMockProjectEditBriefRouteMarkerMessageFlow() {
  return runFlow('marker_message', [
    ['project.editBrief.create', { editSessionId: 'edit-session-message-flow', title: 'Message Flow Brief' }],
    ['project.editBrief.markers.create', { editSessionId: 'edit-session-message-flow', markerType: 'general_note', title: 'Clarify section' }],
    ['project.editBrief.markerMessages.append', { editSessionId: 'edit-session-message-flow', text: 'Marker Chat note.' }],
    ['project.editBrief.markerMessages.list', { editSessionId: 'edit-session-message-flow' }],
  ])
}

export function runMockProjectEditBriefRouteIntentConfirmationFlow() {
  return runFlow('intent_confirmation', [
    ['project.editBrief.create', { editSessionId: 'edit-session-intent-flow', title: 'Intent Flow Brief' }],
    ['project.editBrief.markers.create', { editSessionId: 'edit-session-intent-flow', markerType: 'music_soundtrack', title: 'Music cue' }],
    ['project.editBrief.markerIntent.save', { editSessionId: 'edit-session-intent-flow', action: 'add_music_or_soundtrack', instruction: 'Add restrained music under voice.' }],
    ['project.editBrief.markerConfirmations.save', { editSessionId: 'edit-session-intent-flow', summary: 'Intent confirmed.' }],
  ])
}

export function runMockProjectEditBriefRouteConflictRevisionFlow() {
  return runFlow('conflict_revision', [
    ['project.editBrief.create', { editSessionId: 'edit-session-conflict-flow', title: 'Conflict Flow Brief' }],
    ['project.editBrief.markers.create', { editSessionId: 'edit-session-conflict-flow', markerType: 'do_not_use', title: 'Avoid clip' }],
    ['project.editBrief.markerConflicts.save', { editSessionId: 'edit-session-conflict-flow', title: 'Mock conflict' }],
    ['project.editBrief.markerRevisions.save', { editSessionId: 'edit-session-conflict-flow', summary: 'Updated marker intent.' }],
  ])
}

export function runMockProjectEditBriefRouteExportSettingsFlow() {
  return runFlow('export_settings', [
    ['project.editBrief.exportSettings.recommend', { editSessionId: 'edit-session-export-flow', platformTarget: 'youtube_standard' }],
    ['project.editBrief.exportSettings.get', { editSessionId: 'edit-session-export-flow' }],
    ['project.editBrief.exportSettings.update', { editSessionId: 'edit-session-export-flow', patch: { frameRate: 30 } }],
  ])
}

export function runMockProjectEditBriefRouteTimelineDrawerBundleFlow() {
  return runFlow('timeline_drawer_bundle', [
    ['project.editBrief.create', { editSessionId: 'edit-session-timeline-flow', title: 'Timeline Flow Brief' }],
    ['project.editBrief.markers.create', { editSessionId: 'edit-session-timeline-flow', markerType: 'transition', title: 'Add transition' }],
    ['project.editBrief.timeline.models', { editSessionId: 'edit-session-timeline-flow' }],
    ['project.editBrief.markerDrawer.get', { editSessionId: 'edit-session-timeline-flow' }],
    ['project.editBrief.bundle', { editSessionId: 'edit-session-timeline-flow' }],
  ])
}

export async function runMockProjectEditBriefRouteSafetyFlow() {
  const result = await runFlow('safety', [
    ['project.editBrief.get'],
    ['project.editBrief.markerAttachments.add', { label: 'Safe metadata-only attachment' }],
  ])
  return {
    ...result,
    ok: result.safetyOk,
  }
}

export function runMockProjectEditBriefRouteReadinessFlow(): MockProjectEditBriefApiRouteOrchestratorResult {
  const readiness = createProjectEditBriefRouteReadinessSummary()
  return {
    ok: readiness.readyForMockClient && !readiness.readyForProduction,
    milestone: 'RP-EDITBRIEF-04',
    flow: 'readiness',
    summary: readiness.summary,
    routeIds: PROJECT_EDIT_BRIEF_API_ROUTE_REGISTRY.map((route) => route.id),
    responses: [],
    safetyOk: true,
    mockOnly: true,
    productionReady: false,
    nextStep: 'RP-EDITBRIEF-05 — Brief UI Shell: Video Player + Timeline',
  }
}
