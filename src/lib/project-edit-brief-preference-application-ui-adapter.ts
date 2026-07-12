import type { PreferenceApplicationDownstreamContext } from '../types/edit-reference-integration'
import type { ProjectEditBriefRecord } from '../types/project-edit-brief'
import type { ProjectEditBriefApiClient } from './project-edit-brief-api-client'
import { updateProjectEditBriefViaApi } from './project-edit-brief-api-client-adapter'
import { isPreferenceApplicationDownstreamContextValid } from './edit-reference-downstream-context'

const BRIEF_METADATA_KEY = 'editReferencePreferenceApplicationContext'

export function readPreferenceApplicationContextFromEditBrief(
  brief: ProjectEditBriefRecord | undefined,
): PreferenceApplicationDownstreamContext | undefined {
  const value = brief?.metadata?.[BRIEF_METADATA_KEY]
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const context = value as PreferenceApplicationDownstreamContext
  return context.integrationStatus === 'connected_mock'
    && isPreferenceApplicationDownstreamContextValid(context, {
      projectId: brief?.projectId,
      editSessionId: brief?.editSessionId,
    })
    ? context
    : undefined
}

export async function syncPreferenceApplicationContextToProjectEditBrief(input: {
  brief: ProjectEditBriefRecord
  client: ProjectEditBriefApiClient
  context: PreferenceApplicationDownstreamContext
}) {
  if (
    input.context.integrationStatus !== 'connected_mock'
    || !isPreferenceApplicationDownstreamContextValid(input.context, {
      projectId: input.brief.projectId,
      editSessionId: input.brief.editSessionId,
    })
  ) {
    throw new Error('Only an exact connected Preference Application context can sync to this Edit Brief.')
  }
  const current = readPreferenceApplicationContextFromEditBrief(input.brief)
  if (current?.packageHash === input.context.packageHash) {
    return { brief: input.brief, changed: false, mockOnly: true as const }
  }
  const response = await updateProjectEditBriefViaApi({
    briefId: input.brief.id,
    patch: {
      metadata: {
        ...(input.brief.metadata ?? {}),
        [BRIEF_METADATA_KEY]: input.context,
        preferenceApplicationContextHash: input.context.packageHash,
        preferenceApplicationId: input.context.applicationId,
        preferenceApplicationMockOnly: true,
        preferenceApplicationReplanRequired: false,
        preferenceApplicationContextStatus: 'connected',
        plannerExecuted: false,
        approvedPlanMutationMade: false,
      },
    },
  }, input.client)
  return {
    brief: response.brief,
    changed: Boolean(response.brief),
    mockOnly: true as const,
  }
}

export async function clearPreferenceApplicationContextFromProjectEditBrief(input: {
  brief: ProjectEditBriefRecord
  client: ProjectEditBriefApiClient
}) {
  const current = readPreferenceApplicationContextFromEditBrief(input.brief)
  if (!current) return { brief: input.brief, changed: false, mockOnly: true as const }
  const metadata = { ...(input.brief.metadata ?? {}) }
  delete metadata[BRIEF_METADATA_KEY]
  delete metadata.preferenceApplicationContextHash
  delete metadata.preferenceApplicationId
  delete metadata.preferenceApplicationMockOnly
  const response = await updateProjectEditBriefViaApi({
    briefId: input.brief.id,
    patch: {
      metadata: {
        ...metadata,
        previousPreferenceApplicationId: current.applicationId,
        previousPreferenceApplicationContextHash: current.packageHash,
        preferenceApplicationContextStatus: 'inactive',
        preferenceApplicationReplanRequired: true,
        plannerExecuted: false,
        approvedPlanMutationMade: false,
      },
    },
  }, input.client)
  return {
    brief: response.brief,
    changed: Boolean(response.brief),
    mockOnly: true as const,
  }
}

export function createProjectEditBriefPreferenceApplicationSummary(
  context: PreferenceApplicationDownstreamContext,
) {
  return {
    title: context.editReferenceName,
    statusLabel: 'Connected',
    summary: context.summary,
    activeGuidanceCount: context.guidance.length,
    heldBackCount: context.heldBack.length,
    doNotCopyCount: context.doNotCopyRules.length,
    prioritySummary: 'Current instructions and confirmed Edit Brief markers outrank this target-adapted Preference DNA.',
    boundarySummary: 'The Edit Brief stores bounded planning context only. No plan, provider, worker, media, render, Supabase, or credit action ran.',
    mockOnly: true as const,
  }
}
