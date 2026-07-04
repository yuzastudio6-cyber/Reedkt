import type { MockProjectEditSessionPreferenceOrchestratorResult } from '../../types/project-edit-session-preference'
import { createMockDatabase, type MockDatabase } from '../mock/mock-database'
import { createMockProjectEditSessionRepository } from '../repositories/mock-project-edit-session-repository'
import {
  createPreferenceStateFromSession,
} from '../project-edit-session-preference/project-edit-session-preference-state-service'
import {
  findProjectEditSessionPreferenceOption,
  listProjectEditSessionPreferenceOptions,
} from '../project-edit-session-preference/project-edit-session-preference-option-service'
import {
  applyPreferenceToProjectEditSessionMock,
  clearPreferenceFromProjectEditSessionMock,
} from '../project-edit-session-preference/project-edit-session-preference-application-service'
import {
  createProjectEditSessionPreferencePanelModel,
  createProjectEditSessionPreferenceReadableSummary,
} from '../project-edit-session-preference/project-edit-session-preference-summary-service'
import {
  validateNoProjectEditSessionPreferenceSideEffects,
  validateProjectEditSessionPreferenceApplicationPlan,
} from '../project-edit-session-preference/project-edit-session-preference-validation-service'

const NEXT_STEP = 'RP-EDITSESSION-11 — Editor Route and Navigation Model' as const
const DEFAULT_SESSION_ID = 'edit-session-vertical-dna'

async function baseFlow(input: {
  db?: MockDatabase
  editSessionId?: string
  preference?: string
  clear?: boolean
} = {}): Promise<MockProjectEditSessionPreferenceOrchestratorResult> {
  const db = input.db ?? createMockDatabase()
  const repository = createMockProjectEditSessionRepository({ db })
  const session = (await repository.getProjectEditSession(input.editSessionId ?? DEFAULT_SESSION_ID)).data
    ?? db.projectEditSessions[0]
  const options = listProjectEditSessionPreferenceOptions(db)
  const option = input.clear
    ? findProjectEditSessionPreferenceOption(db, 'none')
    : findProjectEditSessionPreferenceOption(db, input.preference ?? '@lifestyle-travel-vlog')
  const state = createPreferenceStateFromSession(session)
  const applicationPlan = input.clear
    ? clearPreferenceFromProjectEditSessionMock({ projectId: session.projectId, editSessionId: session.id, currentSession: session })
    : applyPreferenceToProjectEditSessionMock({ projectId: session.projectId, editSessionId: session.id, option, currentSession: session })
  const validation = validateProjectEditSessionPreferenceApplicationPlan(applicationPlan)
  return {
    options,
    state,
    applicationPlan,
    panelModel: createProjectEditSessionPreferencePanelModel(state, applicationPlan),
    memoryUpdates: applicationPlan.memoryUpdates,
    historyEvents: applicationPlan.historyEvents,
    validation,
    summary: [
      ...createProjectEditSessionPreferenceReadableSummary(state),
      `Application plan status: ${applicationPlan.status}.`,
    ],
    warnings: applicationPlan.warnings,
    nextStep: NEXT_STEP,
  }
}

export function runMockProjectEditSessionPreferenceFlow(db?: MockDatabase) {
  return baseFlow({ db })
}

export async function runMockPreferenceOptionsFlow(db?: MockDatabase) {
  const flow = await baseFlow({ db, preference: 'none' })
  return { ...flow, validation: validateNoProjectEditSessionPreferenceSideEffects() }
}

export function runMockLegacyPreferenceApplicationFlow(db?: MockDatabase) {
  return baseFlow({ db, preference: '@legacy-clean-edit' })
}

export function runMockDNAPreferenceApplicationFlow(db?: MockDatabase) {
  return baseFlow({ db, preference: '@lifestyle-travel-vlog' })
}

export function runMockReviewRequiredPreferenceFlow(db?: MockDatabase) {
  return baseFlow({ db, editSessionId: 'edit-session-needs-review', preference: '@lifestyle-travel-vlog' })
}

export async function runMockBlockedPreferenceFlow(db?: MockDatabase) {
  const flow = await baseFlow({ db, preference: '@lifestyle-travel-vlog' })
  return {
    ...flow,
    applicationPlan: flow.applicationPlan ? { ...flow.applicationPlan, status: 'dna_blocked_by_qa' as const } : undefined,
    validation: validateNoProjectEditSessionPreferenceSideEffects(),
    warnings: ['Blocked DNA QA path is represented without applying unsafe DNA.'],
  }
}

export function runMockClearPreferenceFlow(db?: MockDatabase) {
  return baseFlow({ db, clear: true })
}

export function runMockPreferenceMemoryHistoryFlow(db?: MockDatabase) {
  return baseFlow({ db, preference: '@lifestyle-travel-vlog' })
}

export function runMockPreferencePanelModelFlow(db?: MockDatabase) {
  return baseFlow({ db, preference: '@legacy-clean-edit' })
}

export function runMockProjectEditSessionPreferenceValidationFlow() {
  return baseFlow()
}

export function runMockProjectEditSessionPreferenceReadinessFlow() {
  return baseFlow()
}
