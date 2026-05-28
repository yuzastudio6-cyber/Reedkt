import { activationPhaseRoadmap } from './activation-phase-roadmap'
import type {
  ActivationBaselineAuditReport,
  ActivationBlocker,
  ActivationNextAction,
  ActivationReadinessStateRecord,
  ActivationWarning,
} from './activation-baseline-audit-types'

export const ACTIVATION_BASELINE_REPORT_ID = 'activation-phase-18-baseline-audit'
export const ACTIVATION_BASELINE_CREATED_AT = '2026-05-27T00:00:00.000Z'
export const ACTIVATION_SOURCE_BRANCH = 'codex/rp-activation-18-merge-baseline-audit'

export function buildActivationBaselineAuditReport(): ActivationBaselineAuditReport {
  return {
    reportId: ACTIVATION_BASELINE_REPORT_ID,
    createdAt: ACTIVATION_BASELINE_CREATED_AT,
    sourceBranch: ACTIVATION_SOURCE_BRANCH,
    completedMilestones: Array.from({ length: 18 }, (_value, index) => index),
    activationPhases: activationPhaseRoadmap,
    readinessStates,
    blockers,
    warnings,
    safeNow,
    notSafeYet,
    nextActions,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    realUserMediaTestingAllowed: false,
  }
}

export const readinessStates: ActivationReadinessStateRecord[] = [
  readyState('repo_baseline', 'ready', 'M0-M17 dry-run/static production runtime foundation is present.', []),
  readyState('smoke_suite', 'ready', 'Production smoke and summary scripts exist for the M17 baseline.', ['Run Phase 19 full local baseline on the activation branch.']),
  readyState('docker_build', 'human_run_required', 'Production container images have not been built by a human for activation.', ['Complete Phase 19.', 'Run Phase 20 human-approved local image builds.']),
  readyState('container_readiness', 'human_run_required', 'Container readiness has not been run against human-built images.', ['Build images in Phase 20.', 'Run Phase 21 readiness examples with explicit image tags.']),
  readyState('gcp_setup', 'human_run_required', 'Staging GCP resources are not created by this phase.', ['Complete container readiness.', 'Run Phase 22 human-reviewed GCP setup.']),
  readyState('image_push', 'human_run_required', 'Images have not been pushed to Artifact Registry.', ['Complete Phase 22 staging foundation.', 'Run Phase 23 human-reviewed image push.']),
  readyState('non_gpu_staging_deploy', 'human_run_required', 'API and non-GPU worker staging deployment has not happened.', ['Push reviewed images.', 'Run Phase 24 staging deploy templates manually.']),
  readyState('gpu_staging_deploy', 'blocked', 'GPU worker deployment is blocked until model/license approval and staging foundation are complete.', ['Approve model weights/licenses.', 'Deploy L4-only GPU worker in Phase 27.']),
  readyState('model_weights', 'not_started', 'Model weights and licenses are not yet approved for activation.', ['Complete Phase 26 model-weight/license workflow.']),
  readyState('first_real_video_speech_caption', 'blocked', 'First real video speech/caption testing is blocked until staging, readiness, storage, and model prerequisites pass.', ['Complete Phases 22-27 as applicable.', 'Use controlled private test media only.']),
  readyState('final_private_export', 'blocked', 'Private final export testing is blocked until controlled upstream video tests and render/export gates pass.', ['Complete speech/caption and smart-cut controlled tests.', 'Run Phase 30 privately.']),
  readyState('internal_beta', 'blocked', 'Limited internal beta is not ready until full private E2E and operational signoffs pass.', ['Complete Phase 35 and review Phase 36 readiness.']),
  readyState('external_beta', 'blocked', 'External beta remains blocked.', ['Complete Phase 37 go/no-go checklist with all approvals.']),
  readyState('paid_production', 'blocked', 'Paid production remains blocked and is not approved by activation Phase 18.', ['External beta evidence and separate production approval are required.']),
]

export const blockers: ActivationBlocker[] = [
  blocker('container-build-human-run-required', 20, 'container_build', 'Production containers have not been built by a human from reviewed image templates.', 'human_run_required'),
  blocker('container-readiness-human-run-required', 21, 'container_readiness', 'Container readiness has not run against reviewed local images.', 'human_run_required'),
  blocker('gcp-staging-human-run-required', 22, 'gcp_staging', 'GCP staging resources require human-run setup after baseline/container phases.', 'human_run_required'),
  blocker('model-license-not-approved', 26, 'model_weights', 'Model weights and licenses are not yet approved.', 'not_started'),
  blocker('gpu-worker-not-deployed', 27, 'gpu_worker', 'The L4 GPU worker is not deployed and remains blocked by model/readiness prerequisites.', 'blocked'),
  blocker('real-video-blocked', 28, 'real_video_testing', 'First real video testing is blocked until staging, model/license, storage, and readiness prerequisites pass.', 'blocked'),
  blocker('external-beta-blocked', 37, 'external_beta', 'External beta has no go approval.', 'blocked'),
  blocker('paid-production-blocked', 37, 'paid_production', 'Paid production has no go approval.', 'blocked'),
]

export const warnings: ActivationWarning[] = [
  { id: 'dry-run-only-baseline', phaseId: 18, summary: 'M0-M17 prove dry-run/static readiness, not production execution readiness.' },
  { id: 'generated-fixture-only-before-real-video', phaseId: 25, summary: 'Generated fixtures should remain the staging test source before controlled real video is allowed.' },
  { id: 'revideo-remains-evaluation-only', phaseId: 18, summary: 'Revideo remains evaluation-only and must not become a core render path.' },
]

export const safeNow = [
  'Run local smoke tests.',
  'Run production readiness and beta summary scripts.',
  'Run dry-run E2E workflow validation.',
  'Run local generated-fixture tests where supported.',
  'Review human-run Docker and GCP templates without executing them.',
]

export const notSafeYet = [
  'Arbitrary or real user video testing.',
  'Production cloud jobs or staging deployment from Codex.',
  'Unapproved model weights or checkpoint downloads.',
  'Provider calls or secret-value creation.',
  'External beta, public delivery/share, or paid production.',
]

export const nextActions: ActivationNextAction[] = [
  {
    id: 'review-phase-18-audit',
    phaseId: 18,
    title: 'Review Phase 18 audit',
    owner: 'reviewer',
    summary: 'Confirm activation docs and static report keep launch, external beta, and real media blocked.',
  },
  {
    id: 'run-phase-19-local-baseline',
    phaseId: 19,
    title: 'Run Phase 19 local baseline',
    owner: 'human',
    summary: 'Run the full local smoke/static readiness suite before any container build.',
  },
  {
    id: 'prepare-human-container-build',
    phaseId: 20,
    title: 'Prepare human-run container build',
    owner: 'human',
    summary: 'Choose reviewed image tags and build containers only after Phase 19 passes.',
  },
]

function readyState(
  area: string,
  state: ActivationReadinessStateRecord['state'],
  summary: string,
  requiredBeforeUnblock: string[],
): ActivationReadinessStateRecord {
  return { area, state, summary, requiredBeforeUnblock }
}

function blocker(
  id: string,
  phaseId: ActivationBlocker['phaseId'],
  area: string,
  summary: string,
  state: ActivationBlocker['state'],
): ActivationBlocker {
  return { id, phaseId, area, summary, state }
}
