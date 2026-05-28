export type ActivationPhaseId =
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26
  | 27
  | 28
  | 29
  | 30
  | 31
  | 32
  | 33
  | 34
  | 35
  | 36
  | 37

export type ActivationPhaseStatus =
  | 'complete'
  | 'ready_to_start'
  | 'blocked'
  | 'not_started'
  | 'human_run_required'
  | 'future'

export type ActivationReadinessState =
  | 'ready'
  | 'blocked'
  | 'warning'
  | 'not_started'
  | 'human_run_required'

export interface ActivationPhasePlan {
  id: ActivationPhaseId
  title: string
  status: ActivationPhaseStatus
  goal: string
  why: string
  expectedFilesOrScripts: string[]
  humanRunActions: string[]
  acceptanceGates: string[]
  mustNotDo: string[]
}

export interface ActivationReadinessStateRecord {
  area: string
  state: ActivationReadinessState
  summary: string
  requiredBeforeUnblock: string[]
}

export interface ActivationBlocker {
  id: string
  phaseId?: ActivationPhaseId
  area: string
  summary: string
  state: ActivationReadinessState
}

export interface ActivationWarning {
  id: string
  phaseId?: ActivationPhaseId
  summary: string
}

export interface ActivationNextAction {
  id: string
  phaseId: ActivationPhaseId
  title: string
  owner: 'human' | 'codex' | 'reviewer'
  summary: string
}

export interface ActivationBaselineAuditReport {
  reportId: string
  createdAt: string
  sourceBranch: string
  completedMilestones: number[]
  activationPhases: ActivationPhasePlan[]
  readinessStates: ActivationReadinessStateRecord[]
  blockers: ActivationBlocker[]
  warnings: ActivationWarning[]
  safeNow: string[]
  notSafeYet: string[]
  nextActions: ActivationNextAction[]
  productionReadyAllowed: false
  externalBetaAllowed: false
  realUserMediaTestingAllowed: false
}
