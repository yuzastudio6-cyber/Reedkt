import type { ReeditProApiResponseEnvelope } from '../types/api-routes'
import type { ProjectEditSessionCardModel } from '../types/project-edit-session'
import type { ProjectEditSessionBundleRecord } from '../types/project-edit-session-repository'

export const PROJECT_EDIT_SESSION_API_CLIENT_SAFETY = {
  mockOnly: true,
  providerCallMade: false,
  supabaseWriteMade: false,
  storageReadMade: false,
  storageWriteMade: false,
  fileBytesRead: false,
  externalUrlFetched: false,
  mediaProcessingStarted: false,
  generationRequestCreated: false,
  renderJobCreated: false,
  workerJobCreated: false,
  creditReservedOrSpent: false,
} as const

export function createProjectEditSessionApiClientSummary() {
  return {
    milestone: 'RP-EDITSESSION-04',
    status: 'browser_mock_api_client_ready',
    mockOnly: true,
    realHttpUsed: false,
    productionRouteCalled: false,
    safety: PROJECT_EDIT_SESSION_API_CLIENT_SAFETY,
    summary: [
      'Project Edit Session API client uses browser-safe mock envelopes only.',
      'No production HTTP, Supabase, storage, provider, worker, render, generation, credit, file-byte, external URL, or media-processing effect is allowed.',
    ],
  }
}

export function createProjectEditSessionApiResultSummary(response: ReeditProApiResponseEnvelope) {
  const data = response.data && typeof response.data === 'object' && !Array.isArray(response.data)
    ? response.data as { safety?: Partial<typeof PROJECT_EDIT_SESSION_API_CLIENT_SAFETY> }
    : {}
  const blockedReasons: string[] = []

  for (const [key, expected] of Object.entries(PROJECT_EDIT_SESSION_API_CLIENT_SAFETY)) {
    const envelopeValue = key in response ? (response as unknown as Record<string, unknown>)[key] : undefined
    const dataValue = data.safety?.[key as keyof typeof PROJECT_EDIT_SESSION_API_CLIENT_SAFETY]
    if (envelopeValue !== undefined && envelopeValue !== expected) blockedReasons.push(`Envelope ${key} must be false.`)
    if (dataValue !== undefined && dataValue !== expected) blockedReasons.push(`Data safety ${key} must be false.`)
  }

  return {
    ok: response.ok && blockedReasons.length === 0,
    routeId: response.routeId,
    requestId: response.requestId,
    mockOnly: response.mockOnly,
    blockedReasons,
    warnings: response.warnings,
    summary: blockedReasons.length
      ? [`${response.routeId} has unsafe mock-client flags.`]
      : [`${response.routeId} returned a browser-safe mock result.`],
  }
}

export function createProjectEditSessionCardListSummary(cardModels: ProjectEditSessionCardModel[]) {
  return {
    count: cardModels.length,
    dnaBackedCount: cardModels.filter((card) => card.badges.some((badge) => badge.toLowerCase().includes('dna'))).length,
    legacyCount: cardModels.filter((card) => !card.badges.some((badge) => badge.toLowerCase().includes('dna'))).length,
    cardShapes: Array.from(new Set(cardModels.map((card) => card.cardShape))),
    summary: [
      `${cardModels.length} mock Edit Chat card model(s) are ready for future Project Home UI.`,
      'Card models are read-only UI projections from ProjectEditSession records.',
    ],
  }
}

export function createProjectEditSessionBundleClientSummary(bundle: ProjectEditSessionBundleRecord | undefined) {
  if (!bundle) {
    return {
      ok: false,
      summary: ['No Project Edit Session bundle was returned.'],
      warnings: ['Bundle is missing from mock client response.'],
    }
  }

  return {
    ok: true,
    editSessionId: bundle.session.id,
    messageCount: bundle.messages.length,
    sourceCount: bundle.sources.length,
    memoryCount: bundle.memories.length,
    versionCount: bundle.versions.length,
    previewCount: bundle.previews.length,
    revisionCount: bundle.revisions.length,
    eventCount: bundle.events.length,
    summary: [
      `${bundle.session.name} loaded with ${bundle.messages.length} message(s), ${bundle.sources.length} source(s), and ${bundle.versions.length} version(s).`,
      'Raw large packages remain hidden behind compact future UI summaries.',
    ],
    warnings: bundle.warnings,
  }
}
