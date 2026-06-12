import { existsSync, readFileSync } from 'node:fs'
import {
  WORKER_APPROVED_PLAN_DRY_RUN_PATHS,
  WORKER_APPROVED_PLAN_DRY_RUN_SOURCE,
} from './worker-approved-plan-dry-run-policy'
import type {
  WorkerDryRunCandidateSnapshot,
  WorkerDryRunEvidenceContext,
  WorkerDryRunSourceAudit,
} from './worker-approved-plan-dry-run-types'

function readJsonRecord(filePath: string): Record<string, unknown> {
  if (!existsSync(filePath)) return {}
  return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
}

function asArray<T = Record<string, unknown>>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : []
}

function toCandidateSnapshot(record: Record<string, unknown>): WorkerDryRunCandidateSnapshot {
  return {
    planId: String(record.planId ?? 'missing'),
    executionStatus: String(record.executionStatus ?? 'missing'),
    approvedForRuntime: record.approvedForRuntime === true,
    workerExecutionAllowed: record.workerExecutionAllowed === true,
    toolExecutionAllowed: record.toolExecutionAllowed === true,
    routeExecutionAllowed: record.routeExecutionAllowed === true,
    providerExecutionAllowed: record.providerExecutionAllowed === true,
    publicArtifactAllowed: record.publicArtifactAllowed === true,
    signedUrlSourceOfTruthAllowed: record.signedUrlSourceOfTruthAllowed === true,
    rawPromptExecution: record.rawPromptExecution === true,
    productionReadyAllowed: record.productionReadyAllowed === true,
    externalBetaAllowed: record.externalBetaAllowed === true,
    broadMediaAllowed: record.broadMediaAllowed === true,
    selectedIntents: asArray(record.selectedIntents).map((item) => ({
      intentId: String(item.intentId ?? 'missing'),
      routeLabel: String(item.routeLabel ?? 'missing'),
      ownerRoute: String(item.ownerRoute ?? 'missing'),
      executionAllowed: item.executionAllowed === true,
      routeExecutionAllowed: item.routeExecutionAllowed === true,
      ownerReviewRequired: item.ownerReviewRequired === true,
    })),
    implementationProposalRefs: asArray(record.implementationProposalRefs).map((item) => ({
      proposalId: String(item.proposalId ?? 'missing'),
      ownerRoute: String(item.ownerRoute ?? 'missing'),
      executionAllowed: item.executionAllowed === true,
      ownerReviewRequired: item.ownerReviewRequired === true,
      riskLevel: typeof item.riskLevel === 'string' ? item.riskLevel : undefined,
    })),
    ownerRoutes: asArray(record.ownerRoutes).map((item) => ({
      owner: String(item.owner ?? 'missing'),
      routePurpose: String(item.routePurpose ?? 'missing'),
      status: String(item.status ?? 'missing'),
      executionAllowed: item.executionAllowed === true,
      runtimeReady: item.runtimeReady === true,
      requiredBeforeRuntimeApproval: item.requiredBeforeRuntimeApproval === true,
    })),
    artifactPolicy: typeof record.artifactPolicy === 'object' && record.artifactPolicy !== null && !Array.isArray(record.artifactPolicy)
      ? record.artifactPolicy as Record<string, unknown>
      : {},
    rollbackPolicy: asArray<string>(record.rollbackPolicy).map(String),
    blockedActions: asArray<string>(record.blockedActions).map(String),
  }
}

export function loadWorkerDryRunEvidenceContext(sourceAudit: WorkerDryRunSourceAudit): WorkerDryRunEvidenceContext {
  const rawCandidate = readJsonRecord(WORKER_APPROVED_PLAN_DRY_RUN_PATHS.planSnapshotCandidate)
  const candidateSnapshot = toCandidateSnapshot(rawCandidate)
  const activeBlockers = [...sourceAudit.activeBlockers]
  if (candidateSnapshot.planId !== WORKER_APPROVED_PLAN_DRY_RUN_SOURCE.candidatePlanId) {
    activeBlockers.push(`candidate_plan_id_mismatch:${candidateSnapshot.planId}`)
  }

  return {
    phase: 'WORKER_1',
    sourceWorker0RunId: WORKER_APPROVED_PLAN_DRY_RUN_SOURCE.worker0RunId,
    sourcePlanSnapshotRunId: WORKER_APPROVED_PLAN_DRY_RUN_SOURCE.planSnapshotRunId,
    sourceModelDryRunId: WORKER_APPROVED_PLAN_DRY_RUN_SOURCE.modelDryRunId,
    candidatePlanId: candidateSnapshot.planId,
    candidateSnapshot,
    sourceAudit,
    rawPromptPayloadsStored: false,
    rawProviderResponsesStored: false,
    secretPayloadsStored: false,
    activeBlockers,
  }
}
