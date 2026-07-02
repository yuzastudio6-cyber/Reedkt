import type { ProjectEditBriefApplicationLogRecord } from '../types/project-edit-brief'
import type {
  ProjectEditBriefPlanApplicationResult,
  ProjectEditBriefPlanPanelModel,
  ProjectEditBriefPlannerInputPackage,
} from '../types/project-edit-brief-plan'
import {
  createDefaultMockProjectEditBriefApiClient,
  type ProjectEditBriefApiClient,
} from './project-edit-brief-api-client'
import {
  appendProjectEditBriefApplicationLogViaApi,
  getProjectEditBriefBundleViaApi,
  getProjectEditBriefForSessionViaApi,
  getProjectEditSessionExportSettingsViaApi,
  listProjectEditBriefApplicationLogsViaApi,
} from './project-edit-brief-api-client-adapter'
import {
  PROJECT_EDIT_BRIEF_PLAN_BOUNDARY_SUMMARY,
  PROJECT_EDIT_BRIEF_PLAN_SAFETY_FLAGS,
  createProjectEditBriefPlanApplicationLogSummary,
  createProjectEditBriefPlanApplicationResult,
  createProjectEditBriefPlanPanelModel,
  createProjectEditBriefPlannerInputPackage,
} from './project-edit-brief-plan-rules'

function defaultClient(projectId: string, client?: ProjectEditBriefApiClient): ProjectEditBriefApiClient {
  return client ?? createDefaultMockProjectEditBriefApiClient({
    projectId,
    preserveMockSession: true,
  })
}

export function createProjectEditBriefPlanBoundarySummary(): string {
  return PROJECT_EDIT_BRIEF_PLAN_BOUNDARY_SUMMARY
}

export function createProjectEditBriefPlanPanelModelForUI(
  pkg: ProjectEditBriefPlannerInputPackage,
): ProjectEditBriefPlanPanelModel {
  return createProjectEditBriefPlanPanelModel(pkg)
}

export async function loadProjectEditBriefPlanPanelForUI(input: {
  projectId: string
  editSessionId: string
  client?: ProjectEditBriefApiClient
}): Promise<{
  package?: ProjectEditBriefPlannerInputPackage
  panelModel?: ProjectEditBriefPlanPanelModel
  applicationLogs: ProjectEditBriefApplicationLogRecord[]
  warnings: string[]
  mockOnly: true
}> {
  const client = defaultClient(input.projectId, input.client)
  const briefResult = await getProjectEditBriefForSessionViaApi(input.editSessionId, client)
  if (!briefResult.brief || briefResult.brief.status === 'not_created') {
    return {
      applicationLogs: [],
      warnings: ['No active mock Edit Brief is available for plan hints.'],
      mockOnly: true,
    }
  }
  const bundleResult = await getProjectEditBriefBundleViaApi(briefResult.brief.id, client)
  if (!bundleResult.bundle) {
    return {
      applicationLogs: [],
      warnings: ['Mock Edit Brief bundle was unavailable for plan hints.'],
      mockOnly: true,
    }
  }
  const exportResult = await getProjectEditSessionExportSettingsViaApi(input.editSessionId, client)
  const logsResult = await listProjectEditBriefApplicationLogsViaApi(briefResult.brief.id, client)
  const latestPlanLog = [...logsResult.applicationLogs]
    .reverse()
    .find((log) => log.metadata?.preparedMockPlanHints === true)
  const pkg = createProjectEditBriefPlannerInputPackage({
    bundle: bundleResult.bundle,
    exportSettings: exportResult.exportSettings ?? bundleResult.bundle.exportSettings,
    applicationLogSummary: latestPlanLog?.summary,
  })
  return {
    package: pkg,
    panelModel: createProjectEditBriefPlanPanelModel(pkg),
    applicationLogs: logsResult.applicationLogs,
    warnings: pkg.warnings,
    mockOnly: true,
  }
}

export async function appendProjectEditBriefPlanApplicationLogViaApi(input: {
  package: ProjectEditBriefPlannerInputPackage
  client?: ProjectEditBriefApiClient
}): Promise<{
  applicationLog?: ProjectEditBriefApplicationLogRecord
  summary: string
  warnings: string[]
  mockOnly: true
}> {
  const summary = createProjectEditBriefPlanApplicationLogSummary(input.package)
  const id = `project-edit-brief-plan-log-${input.package.briefId}`
  const existing = await listProjectEditBriefApplicationLogsViaApi(input.package.briefId, input.client)
  const existingLog = existing.applicationLogs.find((log) => log.id === id)
  if (existingLog) {
    return {
      applicationLog: existingLog,
      summary: existingLog.summary,
      warnings: ['Existing deterministic mock plan-hints application log reused.'],
      mockOnly: true,
    }
  }
  const response = await appendProjectEditBriefApplicationLogViaApi({
    id,
    projectId: input.package.projectId,
    editSessionId: input.package.editSessionId,
    briefId: input.package.briefId,
    summary,
    appliedToPlan: false,
    metadata: {
      preparedMockPlanHints: true,
      plannerExecuted: false,
      editPlanCreated: false,
      eligibleMarkerCount: input.package.eligibleMarkerCount,
      skippedMarkerCount: input.package.skippedMarkerCount,
      instructionIds: input.package.planInstructions.map((instruction) => instruction.id),
    },
  }, input.client)
  return {
    applicationLog: response.applicationLog,
    summary: response.applicationLog?.summary ?? summary,
    warnings: response.applicationLog ? [] : ['Application log append failed safely without production side effects.'],
    mockOnly: true,
  }
}

export async function prepareProjectEditBriefPlanHintsForUI(input: {
  projectId: string
  editSessionId: string
  client?: ProjectEditBriefApiClient
}): Promise<{
  result?: ProjectEditBriefPlanApplicationResult
  panelModel?: ProjectEditBriefPlanPanelModel
  package?: ProjectEditBriefPlannerInputPackage
  applicationLog?: ProjectEditBriefApplicationLogRecord
  warnings: string[]
  mockOnly: true
  plannerExecuted: false
  editPlanCreated: false
}> {
  const loaded = await loadProjectEditBriefPlanPanelForUI(input)
  if (!loaded.package) {
    return {
      warnings: loaded.warnings,
      mockOnly: true,
      plannerExecuted: false,
      editPlanCreated: false,
    }
  }
  const logResult = await appendProjectEditBriefPlanApplicationLogViaApi({
    package: loaded.package,
    client: input.client,
  })
  const pkg = {
    ...loaded.package,
    applicationLogSummary: logResult.summary,
  }
  const result = createProjectEditBriefPlanApplicationResult({
    package: pkg,
    applicationLog: logResult.applicationLog,
  })
  return {
    result,
    panelModel: createProjectEditBriefPlanPanelModel(pkg),
    package: pkg,
    applicationLog: logResult.applicationLog,
    warnings: [...loaded.warnings, ...logResult.warnings],
    mockOnly: true,
    ...PROJECT_EDIT_BRIEF_PLAN_SAFETY_FLAGS,
  }
}

export const applyProjectEditBriefPlanHintsViaApi = prepareProjectEditBriefPlanHintsForUI
