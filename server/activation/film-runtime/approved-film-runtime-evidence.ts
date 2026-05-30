import type { ApprovedFilmRuntimeEvidence } from './film-runtime-types'

export const approvedFilmRuntimeEvidence: ApprovedFilmRuntimeEvidence = {
  "phase": "38C",
  "status": "verified",
  "runId": "phase38c-20260530T23315",
  "runtimeImage": "us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-film-runtime@sha256:5be105e4fe49b21bb2e4085eca8c7fc4f01de74234de742816267b04e6ca6c2a",
  "runtimeImageDigest": "sha256:5be105e4fe49b21bb2e4085eca8c7fc4f01de74234de742816267b04e6ca6c2a",
  "cloudRunJobName": "reeditpro-staging-film-runtime-job",
  "cloudRunExecutionId": "reeditpro-staging-film-runtime-job-gbwhl",
  "computeMode": "cpu",
  "artifactId": "film_net_style_saved_model",
  "aggregateSha256": "6f619330c4785a251883b96627dad6ed3a1e1aedc56ed4aa54e5e3f0b57ec97b",
  "generatedFixture": {
    "width": 256,
    "height": 256,
    "frameCount": 2,
    "interpolationTime": 0.5
  },
  "interpolatedFrameCount": 1,
  "artifactPrefix": "gs://reeditpro-staging-reeditpro-generated-assets/activation-film-runtime/phase38c/phase38c-20260530T23315/",
  "qaReportUri": "gs://reeditpro-staging-reeditpro-qa-artifacts/activation-film-runtime/phase38c/phase38c-20260530T23315/reports/phase38c-report.json",
  "phase38DReadiness": {
    "readyForControlledSelectedRealVideoSlowMotionSample": true,
    "reason": "Phase 38C verified FILM runtime on generated synthetic frames only; Phase 38D may plan one controlled selected real-video slow-motion sample."
  },
  "blockers": [],
  "warnings": [
    "Generated synthetic frames only; no real-video slow-motion QA yet.",
    "Generated-frame fixture only; no real-video slow motion QA yet."
  ]
}

export function getApprovedFilmRuntimeEvidence(): ApprovedFilmRuntimeEvidence {
  return {
    ...approvedFilmRuntimeEvidence,
    generatedFixture: approvedFilmRuntimeEvidence.generatedFixture ? { ...approvedFilmRuntimeEvidence.generatedFixture } : undefined,
    phase38DReadiness: { ...approvedFilmRuntimeEvidence.phase38DReadiness },
    blockers: [...approvedFilmRuntimeEvidence.blockers],
    warnings: [...approvedFilmRuntimeEvidence.warnings],
  }
}
