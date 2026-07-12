import type {
  ProjectEditBriefMarkerConflictRecord,
  ProjectEditBriefMarkerRecord,
  ProjectEditBriefQAStatus,
} from '../types/project-edit-brief'
import type {
  ProjectEditBriefMarkerQAPanelModel,
  ProjectEditBriefQAPackage,
  ProjectEditBriefQASummaryModel,
} from '../types/project-edit-brief-qa'
import type { PreferenceApplicationDownstreamContext } from '../types/edit-reference-integration'
import {
  createDefaultMockProjectEditBriefApiClient,
  type ProjectEditBriefApiClient,
} from './project-edit-brief-api-client'
import {
  getProjectEditBriefBundleViaApi,
  getProjectEditBriefForSessionViaApi,
  getProjectEditBriefMarkerDrawerViaApi,
  getProjectEditSessionExportSettingsViaApi,
  listProjectEditBriefMarkerConflictsViaApi,
  saveProjectEditBriefMarkerConflictViaApi,
  updateProjectEditBriefMarkerViaApi,
  updateProjectEditBriefMarkerQAStatusViaApi,
} from './project-edit-brief-api-client-adapter'
import {
  PROJECT_EDIT_BRIEF_QA_SAFETY_FLAGS,
  createProjectEditBriefQAPackage,
  createProjectEditBriefMarkerQAReadableSummary,
  runProjectEditBriefMarkerQA,
} from './project-edit-brief-qa-rules'
import { createPreferenceApplicationQAContextSummary } from './edit-reference-downstream-context'

export const PROJECT_EDIT_BRIEF_QA_UI_SAFETY_FLAGS = PROJECT_EDIT_BRIEF_QA_SAFETY_FLAGS

function defaultClient(projectId: string, client?: ProjectEditBriefApiClient): ProjectEditBriefApiClient {
  return client ?? createDefaultMockProjectEditBriefApiClient({
    projectId,
    preserveMockSession: true,
  })
}

function titleCase(value: string | undefined): string {
  if (!value) return 'Not checked'
  return value.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function statusPatchFor(marker: ProjectEditBriefMarkerRecord, qaStatus: ProjectEditBriefQAStatus) {
  if (qaStatus === 'needs_asset') return { qaStatus, status: 'needs_asset' as const }
  if (qaStatus === 'needs_clarification') return { qaStatus, status: 'needs_clarification' as const }
  if (qaStatus === 'conflict') return { qaStatus, status: 'conflict' as const }
  if (qaStatus === 'blocked') return { qaStatus, status: marker.status === 'confirmed' ? 'changed_after_plan' as const : marker.status }
  return { qaStatus }
}

export function createProjectEditBriefQABoundarySummary(): string {
  return 'Marker QA is deterministic mock/local metadata only. It does not call Qwen, DeepSeek, providers, embeddings, vector DB, sound runtime, Docker, Supabase, workers, render/export/progress, credits, read file bytes, fetch URLs, or apply markers to an edit plan.'
}

export function createProjectEditBriefQASummaryModel(
  qaPackage: ProjectEditBriefQAPackage,
): ProjectEditBriefQASummaryModel {
  return {
    briefId: qaPackage.briefId,
    readinessStatus: qaPackage.readinessStatus,
    readinessLabel: titleCase(qaPackage.readinessStatus),
    markerCountLabel: `${qaPackage.markerCount} marker${qaPackage.markerCount === 1 ? '' : 's'} checked`,
    passedCount: qaPackage.passedCount,
    warningCount: qaPackage.warningCount,
    needsAssetCount: qaPackage.needsAssetCount,
    needsClarificationCount: qaPackage.needsClarificationCount,
    conflictCount: qaPackage.conflictCount,
    blockedCount: qaPackage.blockedCount,
    readableSummary: qaPackage.readableSummary,
    preferenceApplicationQA: qaPackage.preferenceApplicationQA,
    canRunMockQA: true,
    boundarySummary: createProjectEditBriefQABoundarySummary(),
    mockOnly: true,
    warnings: qaPackage.warnings,
    ...PROJECT_EDIT_BRIEF_QA_UI_SAFETY_FLAGS,
  }
}

export function createProjectEditBriefMarkerQAPanelModel(
  qaPackage: ProjectEditBriefQAPackage,
  markerId: string,
  existingConflicts: ProjectEditBriefMarkerConflictRecord[] = [],
): ProjectEditBriefMarkerQAPanelModel | undefined {
  const markerPackage = qaPackage.markerPackages.find((candidate) => candidate.markerId === markerId)
  if (!markerPackage) return undefined
  const conflicts = [
    ...existingConflicts,
    ...markerPackage.conflictRecords.filter((conflict) => !existingConflicts.some((existing) => existing.id === conflict.id)),
  ]
  return {
    markerId,
    title: markerPackage.markerTitle,
    qaStatus: markerPackage.qaStatus,
    qaStatusLabel: titleCase(markerPackage.qaStatus),
    readinessStatus: markerPackage.readinessStatus,
    findings: markerPackage.findings,
    conflicts,
    recommendedNextAction: markerPackage.recommendedNextAction,
    boundarySummary: createProjectEditBriefQABoundarySummary(),
    canRunMockQA: true,
    mockOnly: true,
    warnings: markerPackage.warnings,
    ...PROJECT_EDIT_BRIEF_QA_UI_SAFETY_FLAGS,
  }
}

export async function loadProjectEditBriefQAPackageForUI(input: {
  projectId: string
  editSessionId: string
  client?: ProjectEditBriefApiClient
  preferenceApplicationContext?: PreferenceApplicationDownstreamContext
}): Promise<ProjectEditBriefQAPackage | undefined> {
  const client = defaultClient(input.projectId, input.client)
  const briefResult = await getProjectEditBriefForSessionViaApi(input.editSessionId, client)
  if (!briefResult.brief || briefResult.brief.status === 'not_created') return undefined
  const bundleResult = await getProjectEditBriefBundleViaApi(briefResult.brief.id, client)
  if (!bundleResult.bundle) return undefined
  const exportResult = await getProjectEditSessionExportSettingsViaApi(input.editSessionId, client)
  return createProjectEditBriefQAPackage({
    bundle: bundleResult.bundle,
    exportSettings: exportResult.exportSettings ?? bundleResult.bundle.exportSettings,
    durationSeconds: typeof exportResult.exportSettings?.metadata?.durationSeconds === 'number'
      ? exportResult.exportSettings.metadata.durationSeconds
      : undefined,
    preferenceApplicationContext: input.preferenceApplicationContext,
  })
}

export async function saveProjectEditBriefQAConflictsViaApi(
  conflicts: ProjectEditBriefMarkerConflictRecord[],
  client?: ProjectEditBriefApiClient,
) {
  const saved: ProjectEditBriefMarkerConflictRecord[] = []
  const warnings: string[] = []
  for (const conflict of conflicts) {
    const existing = await listProjectEditBriefMarkerConflictsViaApi({
      briefId: conflict.briefId,
      markerId: conflict.markerId,
    }, client)
    if (existing.conflicts.some((candidate) => candidate.id === conflict.id)) {
      saved.push(conflict)
      continue
    }
    const response = await saveProjectEditBriefMarkerConflictViaApi(conflict, client)
    if (response.conflict) saved.push(response.conflict)
    else warnings.push(`Conflict ${conflict.id} failed safely.`)
  }
  return {
    saved,
    warnings,
    mockOnly: true,
    ...PROJECT_EDIT_BRIEF_QA_UI_SAFETY_FLAGS,
  }
}

export async function updateProjectEditBriefMarkerQAStatusForUI(
  marker: ProjectEditBriefMarkerRecord,
  qaStatus: ProjectEditBriefQAStatus,
  client?: ProjectEditBriefApiClient,
) {
  const patch = statusPatchFor(marker, qaStatus)
  if ('status' in patch) {
    return updateProjectEditBriefMarkerViaApi({
      markerId: marker.id,
      patch,
    }, client)
  }
  return updateProjectEditBriefMarkerQAStatusViaApi({
    markerId: marker.id,
    qaStatus: patch.qaStatus,
  }, client)
}

export async function runProjectEditBriefQAViaApi(input: {
  projectId: string
  editSessionId: string
  client?: ProjectEditBriefApiClient
  preferenceApplicationContext?: PreferenceApplicationDownstreamContext
}) {
  const client = defaultClient(input.projectId, input.client)
  const briefResult = await getProjectEditBriefForSessionViaApi(input.editSessionId, client)
  if (!briefResult.brief) {
    return {
      qaPackage: undefined,
      summaryModel: undefined,
      savedConflicts: [],
      warnings: ['No mock Edit Brief record was available for QA.'],
      mockOnly: true,
      ...PROJECT_EDIT_BRIEF_QA_UI_SAFETY_FLAGS,
    }
  }
  const bundleResult = await getProjectEditBriefBundleViaApi(briefResult.brief.id, client)
  if (!bundleResult.bundle) {
    return {
      qaPackage: undefined,
      summaryModel: undefined,
      savedConflicts: [],
      warnings: ['Mock Edit Brief bundle was unavailable for QA.'],
      mockOnly: true,
      ...PROJECT_EDIT_BRIEF_QA_UI_SAFETY_FLAGS,
    }
  }
  const exportResult = await getProjectEditSessionExportSettingsViaApi(input.editSessionId, client)
  const qaPackage = createProjectEditBriefQAPackage({
    bundle: bundleResult.bundle,
    exportSettings: exportResult.exportSettings ?? bundleResult.bundle.exportSettings,
    preferenceApplicationContext: input.preferenceApplicationContext,
  })
  const saveResult = await saveProjectEditBriefQAConflictsViaApi(
    qaPackage.markerPackages.flatMap((markerPackage) => markerPackage.conflictRecords),
    client,
  )
  for (const markerPackage of qaPackage.markerPackages) {
    const marker = bundleResult.bundle.markers.find((candidate) => candidate.id === markerPackage.markerId)
    if (marker) await updateProjectEditBriefMarkerQAStatusForUI(marker, markerPackage.qaStatus, client)
  }
  return {
    qaPackage,
    summaryModel: createProjectEditBriefQASummaryModel(qaPackage),
    savedConflicts: saveResult.saved,
    warnings: [...qaPackage.warnings, ...saveResult.warnings],
    mockOnly: true,
    ...PROJECT_EDIT_BRIEF_QA_UI_SAFETY_FLAGS,
  }
}

export async function runProjectEditBriefMarkerQAViaApi(input: {
  markerId: string
  client?: ProjectEditBriefApiClient
  preferenceApplicationContext?: PreferenceApplicationDownstreamContext
}) {
  const drawerResult = await getProjectEditBriefMarkerDrawerViaApi(input.markerId, input.client)
  if (!drawerResult.drawer) return undefined
  const client = input.client ?? createDefaultMockProjectEditBriefApiClient({
    projectId: drawerResult.drawer.marker.projectId,
    preserveMockSession: true,
  })
  const bundleResult = await getProjectEditBriefBundleViaApi(drawerResult.drawer.marker.briefId, client)
  if (!bundleResult.bundle) return undefined
  const exportResult = await getProjectEditSessionExportSettingsViaApi(drawerResult.drawer.marker.editSessionId, client)
  const markerPackage = runProjectEditBriefMarkerQA({
    marker: drawerResult.drawer.marker,
    allMarkers: bundleResult.bundle.markers,
    attachments: bundleResult.bundle.attachments,
    intent: drawerResult.drawer.intent,
    exportSettings: exportResult.exportSettings ?? bundleResult.bundle.exportSettings,
  })
  const preferenceApplicationQA = input.preferenceApplicationContext
    ? createPreferenceApplicationQAContextSummary({
        context: input.preferenceApplicationContext,
        projectId: drawerResult.drawer.marker.projectId,
        editSessionId: drawerResult.drawer.marker.editSessionId,
        markers: bundleResult.bundle.markers,
      })
    : undefined
  const saveResult = await saveProjectEditBriefQAConflictsViaApi(markerPackage.conflictRecords, client)
  await updateProjectEditBriefMarkerQAStatusForUI(drawerResult.drawer.marker, markerPackage.qaStatus, client)
  return {
    markerPackage,
    panelModel: {
      markerId: markerPackage.markerId,
      title: markerPackage.markerTitle,
      qaStatus: markerPackage.qaStatus,
      qaStatusLabel: titleCase(markerPackage.qaStatus),
      readinessStatus: markerPackage.readinessStatus,
      findings: markerPackage.findings,
      conflicts: saveResult.saved,
      recommendedNextAction: markerPackage.recommendedNextAction,
      boundarySummary: createProjectEditBriefQABoundarySummary(),
      canRunMockQA: true,
      mockOnly: true,
      warnings: markerPackage.warnings,
      preferenceApplicationQA,
      ...PROJECT_EDIT_BRIEF_QA_UI_SAFETY_FLAGS,
    } satisfies ProjectEditBriefMarkerQAPanelModel,
    summary: createProjectEditBriefMarkerQAReadableSummary(markerPackage),
    warnings: [...markerPackage.warnings, ...(preferenceApplicationQA?.findings ?? []), ...saveResult.warnings],
    mockOnly: true,
    ...PROJECT_EDIT_BRIEF_QA_UI_SAFETY_FLAGS,
  }
}
