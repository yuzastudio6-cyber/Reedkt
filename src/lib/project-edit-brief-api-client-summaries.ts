import type { ReeditProApiResponseEnvelope } from '../types/api-routes'
import type { ProjectEditBriefBundleRecord, ProjectEditBriefTimelineMarkerModel } from '../types/project-edit-brief'
import type { ReeditProApiClientSafetySummary } from './reeditpro-api-client-types'

export interface ProjectEditBriefApiResultSummary {
  ok: boolean
  blocked: boolean
  blockedReasons: string[]
  mockOnly: boolean
  summary: string[]
}

export const PROJECT_EDIT_BRIEF_API_CLIENT_SAFETY: ReeditProApiClientSafetySummary & {
  storageReadMade: false
  storageWriteMade: false
  signedUrlCreated: false
  fileBytesRead: false
  externalUrlFetched: false
  mediaProcessingStarted: false
} = {
  mockOnly: true,
  providerCallMade: false,
  supabaseWriteMade: false,
  storageReadMade: false,
  storageWriteMade: false,
  signedUrlCreated: false,
  fileBytesRead: false,
  externalUrlFetched: false,
  mediaProcessingStarted: false,
  generationRequestCreated: false,
  renderJobCreated: false,
  workerJobCreated: false,
  creditReservedOrSpent: false,
  summary: 'Project Edit Brief browser mock API client only; no production route or side effect is allowed.',
  warnings: [
    'No production HTTP route is called.',
    'No Supabase read/write, storage write, signed URL, file-byte read, external URL fetch, media processing, provider call, worker job, render job, generation request, or credit reservation occurs.',
  ],
}

const EXPECTED_FALSE_KEYS = [
  'providerCallMade',
  'modelCallMade',
  'supabaseReadMade',
  'supabaseWriteMade',
  'storageReadMade',
  'storageWriteMade',
  'signedUrlCreated',
  'fileBytesRead',
  'externalUrlFetched',
  'mediaProcessingStarted',
  'generationRequestCreated',
  'renderJobCreated',
  'workerJobCreated',
  'creditReservedOrSpent',
] as const

function dataSafety(response: ReeditProApiResponseEnvelope): Record<string, unknown> {
  const data = response.data && typeof response.data === 'object' && !Array.isArray(response.data)
    ? response.data as { safety?: Record<string, unknown> }
    : {}
  const details = response.error?.details && typeof response.error.details === 'object' && !Array.isArray(response.error.details)
    ? response.error.details as { safety?: Record<string, unknown> }
    : {}
  return data.safety ?? details.safety ?? {}
}

export function createProjectEditBriefApiClientSummary() {
  return {
    milestone: 'RP-EDITBRIEF-04',
    status: 'browser_mock_api_client_ready',
    routeClientReady: true,
    productionReady: false,
    safety: PROJECT_EDIT_BRIEF_API_CLIENT_SAFETY,
    summary: [
      'Project Edit Brief browser-safe client uses mock route envelopes and fixture-backed local state.',
      'No backend repository, route handler, Supabase, provider, worker, render, media, or credit runtime is imported by the client layer.',
    ],
    nextStep: 'RP-EDITBRIEF-05 — Brief UI Shell: Video Player + Timeline',
  }
}

export function createProjectEditBriefApiResultSummary(
  response: ReeditProApiResponseEnvelope,
): ProjectEditBriefApiResultSummary {
  const safety = dataSafety(response)
  const blockedReasons: string[] = []

  for (const key of EXPECTED_FALSE_KEYS) {
    const envelopeValue = key in response ? (response as unknown as Record<string, unknown>)[key] : undefined
    const dataValue = safety[key]
    if (envelopeValue !== undefined && envelopeValue !== false) blockedReasons.push(`Envelope ${key} must be false.`)
    if (dataValue !== undefined && dataValue !== false) blockedReasons.push(`Data safety ${key} must be false.`)
  }

  if (!response.mockOnly) blockedReasons.push('Response must be mockOnly.')

  return {
    ok: blockedReasons.length === 0,
    blocked: blockedReasons.length > 0,
    blockedReasons,
    mockOnly: response.mockOnly,
    summary: blockedReasons.length
      ? ['Project Edit Brief API client response has unsafe side-effect flags.']
      : ['Project Edit Brief API client response proves no production side effects.'],
  }
}

export function createProjectEditBriefBundleSummaryForUI(bundle: ProjectEditBriefBundleRecord) {
  return {
    ok: bundle.mockOnly,
    briefId: bundle.brief.id,
    title: bundle.brief.title,
    markerCount: bundle.markers.length,
    confirmedMarkerCount: bundle.brief.confirmedMarkerCount,
    conflictCount: bundle.conflicts.length,
    attachmentCount: bundle.attachments.length,
    markerMessageCount: bundle.messages.length,
    warningCount: bundle.warnings.length,
    exportSettingsSummary: bundle.exportSettings?.summary,
    mockOnly: bundle.mockOnly,
    boundary: 'Mock/local Edit Brief bundle only; no planning, render, upload, media processing, or provider execution starts.',
  }
}

export function createProjectEditBriefTimelineSummaryForUI(timelineMarkers: ProjectEditBriefTimelineMarkerModel[]) {
  return {
    count: timelineMarkers.length,
    lanes: Array.from(new Set(timelineMarkers.map((marker) => marker.lane))).sort(),
    conflicts: timelineMarkers.filter((marker) => marker.status === 'conflict').length,
    mustFollow: timelineMarkers.filter((marker) => marker.priority === 'must_follow').length,
    mockOnly: timelineMarkers.every((marker) => marker.mockOnly),
  }
}
