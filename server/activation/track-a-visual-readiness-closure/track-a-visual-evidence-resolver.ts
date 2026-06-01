import { buildFullVisualVideoPrivateE2eReport } from '../full-visual-video-private-e2e'
import { buildFinalRenderHardeningReport } from '../final-render-hardening'
import { buildLibassBurninReport } from '../libass-burnin-validation'
import { buildOpenTimelineIoValidationReport } from '../opentimelineio-validation'
import { buildProColorImageFeatureE2EReport } from '../pro-color-image-feature-e2e'
import { buildRealEsrganPolicyDecisionReport } from '../real-esrgan-policy-decision'
import { buildRealVideoFilmSlowmotionReport } from '../real-video-film-slowmotion'
import { buildRemotionRenderValidationReport } from '../remotion-render-validation'
import { buildSam2FeatureE2EReport } from '../sam2-feature-e2e'
import type { TrackAVisualEvidenceItem } from './track-a-visual-readiness-closure-types'

export function buildTrackAVisualEvidenceChain(): TrackAVisualEvidenceItem[] {
  const sam2 = buildSam2FeatureE2EReport()
  const realEsrgan = buildRealEsrganPolicyDecisionReport()
  const film = buildRealVideoFilmSlowmotionReport()
  const proColor = buildProColorImageFeatureE2EReport()
  const libass = buildLibassBurninReport()
  const remotion = buildRemotionRenderValidationReport()
  const otio = buildOpenTimelineIoValidationReport()
  const finalRender = buildFinalRenderHardeningReport()
  const fullE2E = buildFullVisualVideoPrivateE2eReport()

  return [
    {
      phase: '35F',
      label: 'SAM2 private feature E2E',
      reportId: sam2.reportId,
      reportScript: 'activation:sam2-feature-e2e:report',
      runId: sam2.approvedEvidence.runId ?? 'not-recorded',
      status: sam2.status,
      readyForInternalTrackA: sam2.status === 'ready' && sam2.blockers.length === 0 && sam2.approvedEvidence.status === 'verified',
      internalReadinessBlockers: sam2.blockers,
      expectedScopeBlockers: [],
      artifactUris: compact([sam2.approvedEvidence.planSnapshotUri, sam2.approvedEvidence.qaReportUri, sam2.approvedEvidence.generatedAssetsPrefix, sam2.approvedEvidence.masksPrefix, sam2.approvedEvidence.previewsPrefix]),
      summary: 'SAM2 full controlled private preview evidence is verified for internal SAM2 feature testing only.',
    },
    {
      phase: '34D/34E',
      label: 'Real-ESRGAN bounded sample and policy decision',
      reportId: realEsrgan.reportId,
      reportScript: 'activation:real-esrgan-policy-decision:report',
      runId: realEsrgan.phase34DEvidence.phase34DRunId,
      status: realEsrgan.status,
      readyForInternalTrackA: realEsrgan.phase34DEvidence.qaSummary.blockers.length === 0
        && realEsrgan.phase34DEvidence.safetyConfirmations.exactlyOneBoundedSample
        && !realEsrgan.realEsrganFullFrameAllowed
        && !realEsrgan.realEsrganFullVideoAllowed
        && !realEsrgan.productionReadyAllowed
        && !realEsrgan.externalBetaAllowed,
      internalReadinessBlockers: realEsrgan.phase34DEvidence.qaSummary.blockers,
      expectedScopeBlockers: realEsrgan.blockers,
      artifactUris: Object.values(realEsrgan.phase34DEvidence.artifacts),
      summary: 'Real-ESRGAN bounded sample evidence exists and the Phase 34E policy intentionally keeps broader enhancement blocked.',
    },
    {
      phase: '38D',
      label: 'FILM private feature E2E alias',
      reportId: film.reportId,
      reportScript: 'activation:film-feature-e2e:report',
      runId: film.approvedEvidence.runId ?? 'not-recorded',
      status: film.status,
      readyForInternalTrackA: film.status === 'ready' && film.blockers.length === 0 && film.approvedEvidence.status === 'verified',
      internalReadinessBlockers: film.blockers,
      expectedScopeBlockers: [],
      artifactUris: compact([film.approvedEvidence.artifactPrefix, film.approvedEvidence.previewPrefix, film.approvedEvidence.qaReportUri]),
      summary: 'FILM selected-segment evidence is verified through the existing feature E2E report alias.',
    },
    {
      phase: '40D',
      label: 'Pro color/image private feature E2E',
      reportId: proColor.reportId,
      reportScript: 'activation:pro-color-image-feature-e2e:report',
      runId: proColor.approvedEvidence.runId ?? 'not-recorded',
      status: proColor.status,
      readyForInternalTrackA: proColor.status === 'ready' && proColor.blockers.length === 0 && proColor.approvedEvidence.status === 'verified' && proColor.featureReadiness.readyForInternalProColorImageFeatureTesting,
      internalReadinessBlockers: proColor.blockers,
      expectedScopeBlockers: [],
      artifactUris: compact([proColor.approvedEvidence.planSnapshotUri, proColor.approvedEvidence.reviewManifestUri, proColor.approvedEvidence.contactSheetUri, proColor.approvedEvidence.qaReportUri]),
      summary: 'Pro color/image private feature E2E evidence is verified for internal feature testing only.',
    },
    renderItem('45A', 'libass caption burn-in validation', 'activation:libass-burnin-validation:report', libass.reportId, libass.approvedEvidence.runId ?? 'not-recorded', libass.status, libass.blockers, libass.approvedEvidence.status === 'verified', compact([libass.approvedEvidence.previewUri, libass.approvedEvidence.qaReportUri]), 'libass caption burn-in preview evidence is verified.'),
    renderItem('45B', 'Remotion render validation', 'activation:remotion-render-validation:report', remotion.reportId, remotion.approvedEvidence.runId ?? 'not-recorded', remotion.status, remotion.blockers, remotion.approvedEvidence.status === 'verified', compact([remotion.approvedEvidence.remotionPreviewUri, remotion.approvedEvidence.qaReportUri]), 'Remotion bounded private preview evidence is verified.'),
    renderItem('45C', 'OpenTimelineIO validation', 'activation:opentimelineio-validation:report', otio.reportId, otio.approvedEvidence.runId ?? 'not-recorded', otio.status, otio.blockers, otio.approvedEvidence.status === 'verified', compact([otio.approvedEvidence.otioTimelineUri, otio.approvedEvidence.qaReportUri]), 'OpenTimelineIO private timeline evidence is verified.'),
    renderItem('45D', 'FFmpeg/FFprobe final render/export hardening', 'activation:final-render-hardening:report', finalRender.reportId, finalRender.approvedEvidence.runId ?? 'not-recorded', finalRender.status, finalRender.blockers, finalRender.approvedEvidence.status === 'verified', compact([finalRender.approvedEvidence.hardenedReviewExportUri, finalRender.approvedEvidence.ffprobeValidationUri, finalRender.approvedEvidence.qaReportUri]), 'FFmpeg/FFprobe hardened private review export evidence is verified.'),
    {
      phase: '45E',
      label: 'Full visual-video private E2E',
      reportId: fullE2E.reportId,
      reportScript: 'activation:full-visual-video-private-e2e:report',
      runId: fullE2E.approvedEvidence.runId ?? 'not-recorded',
      status: fullE2E.status,
      readyForInternalTrackA: fullE2E.status === 'ready'
        && fullE2E.blockers.length === 0
        && fullE2E.approvedEvidence.status === 'verified'
        && fullE2E.trackAVisualVideoReadiness.readyForInternalPrivateVisualVideoTesting,
      internalReadinessBlockers: fullE2E.blockers,
      expectedScopeBlockers: [],
      artifactUris: compact([fullE2E.approvedEvidence.e2eReviewManifestUri, fullE2E.approvedEvidence.ffprobeReviewExportValidationUri, fullE2E.approvedEvidence.qaReportUri, fullE2E.approvedEvidence.canonicalPrivateReviewExportUri]),
      summary: 'Full visual-video private E2E evidence is verified and marks Track A ready for internal private testing only.',
    },
  ]
}

function renderItem(
  phase: string,
  label: string,
  reportScript: string,
  reportId: string,
  runId: string,
  status: string,
  blockers: string[],
  approvedEvidenceVerified: boolean,
  artifactUris: string[],
  summary: string,
): TrackAVisualEvidenceItem {
  return {
    phase,
    label,
    reportId,
    reportScript,
    runId,
    status,
    readyForInternalTrackA: status === 'ready' && blockers.length === 0 && approvedEvidenceVerified,
    internalReadinessBlockers: blockers,
    expectedScopeBlockers: [],
    artifactUris,
    summary,
  }
}

function compact(values: Array<string | undefined>): string[] {
  return values.filter((value): value is string => Boolean(value))
}
