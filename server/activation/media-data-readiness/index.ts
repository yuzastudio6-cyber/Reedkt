import { readFile } from 'node:fs/promises'
import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'

export const MEDIA_DATA_READINESS_PHASE = '46A'
export const MEDIA_DATA_READINESS_RUN_ID = 'phase46a-media-data-readiness-20260602'
export const MEDIA_DATA_READINESS_REPORT_DIR = 'docs/activation-phase-46a-media-data-readiness-reports'
export const MEDIA_DATA_READINESS_ACCESSED_ON = '2026-06-02'

export type MediaDataBetaStatus =
  | 'blocked'
  | 'phase-complete but tool-family incomplete'
  | 'internally beta-ready candidate'
  | 'external beta still blocked'

export type MediaDataToolId =
  | 'opencv'
  | 'pyav'
  | 'pyscenedetect'
  | 'sharp_libvips'
  | 'duckdb'
  | 'polars'

export type MediaDataToolStatus = 'ready' | 'partial' | 'blocked'

export interface MediaDataToolRegistryEntry {
  toolId: MediaDataToolId
  displayName: string
  packageOrLibraryNames: string[]
  languageRuntime: string
  primaryPurpose: string
  futurePhaseUse: string[]
  requiredStatus: 'required_candidate' | 'reporting_candidate' | 'optional_candidate'
  expectedRuntimeLocation: string[]
  expectedInstallLocation: string[]
  licenseEvidenceStatus: 'present'
  sourceEvidenceStatus: 'present'
  dependencyCaveats: string[]
  securityPrivacyCaveats: string[]
  safeForGeneratedFixtures: boolean
  safeForControlledRealMedia: boolean
  safeForBroadUserMedia: boolean
  blockerStatus: MediaDataToolStatus
}

export interface MediaDataEvidenceItem {
  toolId: MediaDataToolId
  sourceUrl: string
  licenseUrl: string
  evidenceType: string[]
  license: string
  currentKnownReleaseOrVersion: string
  dependencyCaveats: string[]
  unresolvedLegalReviewStatus: string
  accessedOn: string
  confidence: 'high' | 'medium'
  blocker: string | null
}

export interface MediaDataReadinessReports {
  plan: ReturnType<typeof getMediaDataReadinessPlan>
  toolRegistry: {
    phase: typeof MEDIA_DATA_READINESS_PHASE
    runId: string
    tools: MediaDataToolRegistryEntry[]
  }
  sourceEvidence: {
    phase: typeof MEDIA_DATA_READINESS_PHASE
    accessedOn: string
    evidence: MediaDataEvidenceItem[]
  }
  licenseEvidence: {
    phase: typeof MEDIA_DATA_READINESS_PHASE
    accessedOn: string
    evidence: MediaDataEvidenceItem[]
  }
  runtimeInventory: {
    phase: typeof MEDIA_DATA_READINESS_PHASE
    runId: string
    repoInventoryStatus: 'complete_static_inventory'
    packageLockStatus: 'unchanged'
    rootPythonLockfiles: 'not_present_on_pr120_base'
    safeVersionChecks: 'skipped_not_required_for_phase46a'
    directDependencyFindings: Record<MediaDataToolId, string>
    existingRepoReferences: string[]
  }
  dependencyRiskReport: {
    phase: typeof MEDIA_DATA_READINESS_PHASE
    risks: Array<{ toolId: MediaDataToolId; risk: string; mitigation: string; status: 'tracked' }>
  }
  runtimeLocationPlan: {
    phase: typeof MEDIA_DATA_READINESS_PHASE
    locations: Array<{ toolId: MediaDataToolId; location: string; browserFrontend: 'forbidden'; notes: string }>
  }
  storagePrivacyPolicy: {
    phase: typeof MEDIA_DATA_READINESS_PHASE
    publicArtifacts: 'blocked'
    signedUrlsAsSourceOfTruth: 'blocked'
    rawFrameCommits: 'blocked'
    realMediaDerivedImageCommits: 'blocked'
    futurePrivatePrefixes: Record<'phase46b' | 'phase46c' | 'phase46d', string>
    policy: string[]
  }
  generatedFixtureHandoff: {
    phase: '46B'
    status: 'next_if_phase46a_passes'
    fixtures: string[]
    constraints: string[]
  }
  controlledRealMediaHandoff: {
    phase: '46C'
    status: 'blocked_until_phase46b_passes'
    plan: string[]
    constraints: string[]
  }
  reportingQaHandoff: {
    phase: '46D'
    status: 'blocked_until_phase46b_46c_evidence_exists'
    plan: string[]
    constraints: string[]
  }
  blockerReport: {
    phase: typeof MEDIA_DATA_READINESS_PHASE
    blockers: string[]
    blockedScopes: string[]
  }
  betaStatusReport: {
    phase: typeof MEDIA_DATA_READINESS_PHASE
    mediaDataToolFamilyBetaStatus: MediaDataBetaStatus
    rationale: string
    nextPhaseDecision: string
  }
  readinessReport: {
    phase: typeof MEDIA_DATA_READINESS_PHASE
    status: 'passed_as_evidence_planning_only'
    toolReadiness: Record<MediaDataToolId, MediaDataToolStatus>
    noExecution: Record<string, 'not_run'>
    mediaDataToolFamilyBetaStatus: MediaDataBetaStatus
  }
  iamPlan: {
    phase: typeof MEDIA_DATA_READINESS_PHASE
    status: 'no_iam_mutation_required'
    futurePrivatePrefixes: string[]
    notes: string[]
  }
  costSummary: {
    phase: typeof MEDIA_DATA_READINESS_PHASE
    status: 'report_only_no_runtime_cost'
    estimatedPhase46aRuntimeCostUsd: 0
    futureCostDrivers: string[]
  }
  privateArtifactManifest: {
    phase: typeof MEDIA_DATA_READINESS_PHASE
    runId: string
    committedArtifacts: string[]
    privateArtifactsUploaded: false
    forbiddenArtifactClasses: string[]
  }
}

const REPORT_FILES = [
  'phase_46a_media_data_readiness_plan.json',
  'phase_46a_media_data_tool_registry.json',
  'phase_46a_media_data_source_evidence.json',
  'phase_46a_media_data_license_evidence.json',
  'phase_46a_media_data_runtime_inventory.json',
  'phase_46a_media_data_dependency_risk_report.json',
  'phase_46a_media_data_runtime_location_plan.json',
  'phase_46a_media_data_storage_privacy_policy.json',
  'phase_46a_media_data_generated_fixture_handoff.json',
  'phase_46a_media_data_controlled_real_media_handoff.json',
  'phase_46a_media_data_reporting_qa_handoff.json',
  'phase_46a_media_data_blocker_report.json',
  'phase_46a_media_data_beta_status_report.json',
  'phase_46a_media_data_readiness_report.json',
  'phase_46a_media_data_iam_plan.json',
  'phase_46a_media_data_cost_summary.json',
  'phase_46a_media_data_private_artifact_manifest.json',
]

const BLOCKED_SCOPES = [
  'Phase 46B generated media/data analysis suite until implemented',
  'Phase 46C controlled real-video media/data suite until Phase 46B passes',
  'Phase 46D reporting/QA integration until Phase 46B/46C evidence exists',
  'VLM runtime retries',
  'provider calls',
  'production',
  'internal beta',
  'external beta',
  'paid production',
  'public output',
  'broad user media',
  'broad real-media processing',
  'arbitrary media paths',
  'real media processing',
  'Docker execution',
  'GCP mutation',
  'Cloud Run execution',
  'IAM mutation',
  'Track A runtime/visual/render stack',
]

const NO_EXECUTION = {
  packageInstallation: 'not_run',
  mediaProcessing: 'not_run',
  generatedFixtures: 'not_run',
  realMedia: 'not_run',
  docker: 'not_run',
  cloudBuild: 'not_run',
  cloudRun: 'not_run',
  gcpMutation: 'not_run',
  iamMutation: 'not_run',
  providerCalls: 'not_run',
  vlmRuntimeRetry: 'not_run',
  trackA: 'not_run',
} as const

const TOOL_REGISTRY: MediaDataToolRegistryEntry[] = [
  {
    toolId: 'opencv',
    displayName: 'OpenCV',
    packageOrLibraryNames: ['opencv-python-headless', 'opencv-python', 'cv2'],
    languageRuntime: 'Python native worker',
    primaryPurpose: 'Deterministic visual geometry, shape, safe-zone, frame QA, and future image/frame metadata support.',
    futurePhaseUse: ['Phase 46B generated image/frame checks', 'Phase 46C controlled frame metadata analysis', 'Phase 46D QA aggregation input'],
    requiredStatus: 'required_candidate',
    expectedRuntimeLocation: ['cpu_analysis_worker', 'qa_worker', 'tool_readiness_worker'],
    expectedInstallLocation: ['Python worker image; headless package preferred'],
    licenseEvidenceStatus: 'present',
    sourceEvidenceStatus: 'present',
    dependencyCaveats: ['opencv-python wheel/native dependency review', 'headless package preferred to avoid GUI dependency footprint'],
    securityPrivacyCaveats: ['face/object geometry can expose private metadata; real-media outputs must stay private/redacted'],
    safeForGeneratedFixtures: true,
    safeForControlledRealMedia: true,
    safeForBroadUserMedia: false,
    blockerStatus: 'partial',
  },
  {
    toolId: 'pyav',
    displayName: 'PyAV',
    packageOrLibraryNames: ['av', 'pyav'],
    languageRuntime: 'Python native worker',
    primaryPurpose: 'Media container probing and frame/audio access policy for future generated and controlled metadata suites.',
    futurePhaseUse: ['Phase 46B generated container probe', 'Phase 46C controlled video metadata/frame suite', 'Phase 46D manifest input'],
    requiredStatus: 'required_candidate',
    expectedRuntimeLocation: ['cpu_analysis_worker', 'tool_readiness_worker'],
    expectedInstallLocation: ['Python worker image only'],
    licenseEvidenceStatus: 'present',
    sourceEvidenceStatus: 'present',
    dependencyCaveats: ['FFmpeg libraries/codecs remain a separate legal/runtime dependency caveat'],
    securityPrivacyCaveats: ['decode/probe can expose private media metadata; no arbitrary media paths'],
    safeForGeneratedFixtures: true,
    safeForControlledRealMedia: true,
    safeForBroadUserMedia: false,
    blockerStatus: 'partial',
  },
  {
    toolId: 'pyscenedetect',
    displayName: 'PySceneDetect',
    packageOrLibraryNames: ['scenedetect', 'pyscenedetect'],
    languageRuntime: 'Python native worker',
    primaryPurpose: 'Deterministic scene-change candidates and shot-boundary metadata.',
    futurePhaseUse: ['Phase 46B generated scene-cut fixture', 'Phase 46C controlled scene manifest', 'Phase 46D cut/QA table input'],
    requiredStatus: 'required_candidate',
    expectedRuntimeLocation: ['cpu_analysis_worker', 'tool_readiness_worker'],
    expectedInstallLocation: ['Python worker image only'],
    licenseEvidenceStatus: 'present',
    sourceEvidenceStatus: 'present',
    dependencyCaveats: ['OpenCV dependency and false-positive scene boundary risk'],
    securityPrivacyCaveats: ['scene manifests from real media must remain private/redacted'],
    safeForGeneratedFixtures: true,
    safeForControlledRealMedia: true,
    safeForBroadUserMedia: false,
    blockerStatus: 'partial',
  },
  {
    toolId: 'sharp_libvips',
    displayName: 'Sharp / libvips',
    packageOrLibraryNames: ['sharp', 'libvips', 'vips'],
    languageRuntime: 'Node server/worker native module',
    primaryPurpose: 'Image metadata, thumbnails, resize/format transforms, and private preview asset preparation.',
    futurePhaseUse: ['Phase 46B generated thumbnail/metadata fixture', 'Phase 46C private preview/metadata only', 'Phase 46D artifact QA support'],
    requiredStatus: 'required_candidate',
    expectedRuntimeLocation: ['cpu_analysis_worker', 'render_worker', 'qa_worker', 'tool_readiness_worker'],
    expectedInstallLocation: ['Node worker/server image only; frontend forbidden'],
    licenseEvidenceStatus: 'present',
    sourceEvidenceStatus: 'present',
    dependencyCaveats: ['Sharp package Apache-2.0; libvips LGPL-2.1-or-later compliance and native binary review required'],
    securityPrivacyCaveats: ['untrusted image handling and native binary dependency review required'],
    safeForGeneratedFixtures: true,
    safeForControlledRealMedia: true,
    safeForBroadUserMedia: false,
    blockerStatus: 'partial',
  },
  {
    toolId: 'duckdb',
    displayName: 'DuckDB',
    packageOrLibraryNames: ['duckdb'],
    languageRuntime: 'Python or Node QA/reporting worker',
    primaryPurpose: 'Private QA report aggregation, structured artifact queries, and metrics tables.',
    futurePhaseUse: ['Phase 46B generated report tables', 'Phase 46D reporting/QA integration'],
    requiredStatus: 'reporting_candidate',
    expectedRuntimeLocation: ['qa_worker', 'tool_readiness_worker'],
    expectedInstallLocation: ['QA/reporting worker only'],
    licenseEvidenceStatus: 'present',
    sourceEvidenceStatus: 'present',
    dependencyCaveats: ['extension loading, network, and local file IO policy must be locked down before runtime'],
    securityPrivacyCaveats: ['private text/media metadata must not leak into committed reports'],
    safeForGeneratedFixtures: true,
    safeForControlledRealMedia: true,
    safeForBroadUserMedia: false,
    blockerStatus: 'partial',
  },
  {
    toolId: 'polars',
    displayName: 'Polars',
    packageOrLibraryNames: ['polars'],
    languageRuntime: 'Python QA/reporting worker',
    primaryPurpose: 'Fast tabular QA transforms, metrics, and generated/control report summaries.',
    futurePhaseUse: ['Phase 46B generated metrics transforms', 'Phase 46D reporting/QA integration'],
    requiredStatus: 'reporting_candidate',
    expectedRuntimeLocation: ['qa_worker', 'tool_readiness_worker'],
    expectedInstallLocation: ['QA/reporting worker only'],
    licenseEvidenceStatus: 'present',
    sourceEvidenceStatus: 'present',
    dependencyCaveats: ['CPU feature compatibility, rtcompat/bigidx variants, memory/streaming behavior'],
    securityPrivacyCaveats: ['private QA data transforms must emit redacted committed summaries only'],
    safeForGeneratedFixtures: true,
    safeForControlledRealMedia: true,
    safeForBroadUserMedia: false,
    blockerStatus: 'partial',
  },
]

const SOURCE_EVIDENCE: MediaDataEvidenceItem[] = [
  {
    toolId: 'opencv',
    sourceUrl: 'https://github.com/opencv/opencv',
    licenseUrl: 'https://opencv.org/license/',
    evidenceType: ['official_site_license', 'official_repository'],
    license: 'Apache-2.0 for OpenCV 4.5.0 and higher; older versions used BSD-3-Clause',
    currentKnownReleaseOrVersion: 'not_pinned_by_phase46a; repo references opencv-python-headless==4.10.0.84 in OCR/VLM worker requirements',
    dependencyCaveats: ['opencv-python wheel and native runtime dependencies require worker image review'],
    unresolvedLegalReviewStatus: 'package_variant_and_native_dependency_review_required_before_broad_runtime',
    accessedOn: MEDIA_DATA_READINESS_ACCESSED_ON,
    confidence: 'high',
    blocker: null,
  },
  {
    toolId: 'pyav',
    sourceUrl: 'https://github.com/PyAV-Org/PyAV',
    licenseUrl: 'https://github.com/PyAV-Org/PyAV/blob/main/LICENSE.txt',
    evidenceType: ['official_repository', 'license_file'],
    license: 'BSD-3-Clause',
    currentKnownReleaseOrVersion: 'not_pinned_by_phase46a',
    dependencyCaveats: ['FFmpeg library, codec, patent, and build configuration caveats remain separate'],
    unresolvedLegalReviewStatus: 'ffmpeg_dependency_review_required',
    accessedOn: MEDIA_DATA_READINESS_ACCESSED_ON,
    confidence: 'high',
    blocker: null,
  },
  {
    toolId: 'pyscenedetect',
    sourceUrl: 'https://github.com/Breakthrough/PySceneDetect',
    licenseUrl: 'https://github.com/Breakthrough/PySceneDetect/blob/main/LICENSE',
    evidenceType: ['official_repository', 'license_file'],
    license: 'BSD-3-Clause',
    currentKnownReleaseOrVersion: 'not_pinned_by_phase46a',
    dependencyCaveats: ['OpenCV dependency and scene-boundary false positives must be QA-gated'],
    unresolvedLegalReviewStatus: 'dependency_review_required_before_runtime',
    accessedOn: MEDIA_DATA_READINESS_ACCESSED_ON,
    confidence: 'high',
    blocker: null,
  },
  {
    toolId: 'sharp_libvips',
    sourceUrl: 'https://github.com/lovell/sharp and https://www.libvips.org/',
    licenseUrl: 'https://github.com/lovell/sharp/blob/main/LICENSE and https://www.libvips.org/',
    evidenceType: ['official_repository', 'license_file', 'dependency_site'],
    license: 'Sharp Apache-2.0; libvips LGPL-2.1-or-later',
    currentKnownReleaseOrVersion: 'not_pinned_by_phase46a',
    dependencyCaveats: ['libvips LGPL compliance, native binary/platform, optional dependency, and untrusted image review required'],
    unresolvedLegalReviewStatus: 'libvips_lgpl_and_native_dependency_review_required',
    accessedOn: MEDIA_DATA_READINESS_ACCESSED_ON,
    confidence: 'high',
    blocker: null,
  },
  {
    toolId: 'duckdb',
    sourceUrl: 'https://github.com/duckdb/duckdb',
    licenseUrl: 'https://github.com/duckdb/duckdb/blob/main/LICENSE',
    evidenceType: ['official_repository', 'license_file'],
    license: 'MIT',
    currentKnownReleaseOrVersion: 'not_pinned_by_phase46a',
    dependencyCaveats: ['extension loading, network access, and local file IO policy required before runtime'],
    unresolvedLegalReviewStatus: 'runtime_policy_review_required_before_private_report_execution',
    accessedOn: MEDIA_DATA_READINESS_ACCESSED_ON,
    confidence: 'high',
    blocker: null,
  },
  {
    toolId: 'polars',
    sourceUrl: 'https://github.com/pola-rs/polars',
    licenseUrl: 'https://github.com/pola-rs/polars/blob/main/LICENSE',
    evidenceType: ['official_repository', 'license_file'],
    license: 'MIT',
    currentKnownReleaseOrVersion: 'not_pinned_by_phase46a',
    dependencyCaveats: ['CPU feature compatibility, rtcompat/bigidx variants, and memory/streaming policy required before runtime'],
    unresolvedLegalReviewStatus: 'runtime_policy_review_required_before_private_report_execution',
    accessedOn: MEDIA_DATA_READINESS_ACCESSED_ON,
    confidence: 'high',
    blocker: null,
  },
]

export function getMediaDataReadinessPlan() {
  return {
    phase: MEDIA_DATA_READINESS_PHASE,
    runId: MEDIA_DATA_READINESS_RUN_ID,
    branch: 'codex/rp-activation-46a-media-data-tool-readiness-audit',
    baseIfPr120Open: 'codex/rp-activation-39c-vlm-decision-gate-recovery-plan',
    prBaseIfPr120Open: 'codex/rp-activation-39c-vlm-decision-gate-recovery-plan',
    defaultMode: 'report_only_non_mutating',
    requiredConfirmationsForReportGeneration: [
      'REEDITPRO_CONFIRM_MEDIA_DATA_READINESS_AUDIT',
      'REEDITPRO_CONFIRM_MEDIA_DATA_WEB_RESEARCH',
    ],
    forbiddenActions: Object.keys(NO_EXECUTION),
    tools: TOOL_REGISTRY.map((tool) => tool.toolId),
    reportDirectory: MEDIA_DATA_READINESS_REPORT_DIR,
    reports: REPORT_FILES,
    blockedScopes: BLOCKED_SCOPES,
    nextRecommendedPhase: 'Phase 46B generated media/data analysis suite',
    mediaDataToolFamilyBetaStatus: 'phase-complete but tool-family incomplete' as MediaDataBetaStatus,
  }
}

export function buildMediaDataReadinessReports(): MediaDataReadinessReports {
  const futurePrivatePrefixes = {
    phase46b: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase46b/generated-media-data-suite/<run-id>/',
    phase46c: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase46c/controlled-real-video-media-data/<run-id>/',
    phase46d: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase46d/reporting-qa-integration/<run-id>/',
  }

  return {
    plan: getMediaDataReadinessPlan(),
    toolRegistry: {
      phase: MEDIA_DATA_READINESS_PHASE,
      runId: MEDIA_DATA_READINESS_RUN_ID,
      tools: TOOL_REGISTRY,
    },
    sourceEvidence: {
      phase: MEDIA_DATA_READINESS_PHASE,
      accessedOn: MEDIA_DATA_READINESS_ACCESSED_ON,
      evidence: SOURCE_EVIDENCE,
    },
    licenseEvidence: {
      phase: MEDIA_DATA_READINESS_PHASE,
      accessedOn: MEDIA_DATA_READINESS_ACCESSED_ON,
      evidence: SOURCE_EVIDENCE,
    },
    runtimeInventory: {
      phase: MEDIA_DATA_READINESS_PHASE,
      runId: MEDIA_DATA_READINESS_RUN_ID,
      repoInventoryStatus: 'complete_static_inventory',
      packageLockStatus: 'unchanged',
      rootPythonLockfiles: 'not_present_on_pr120_base',
      safeVersionChecks: 'skipped_not_required_for_phase46a',
      directDependencyFindings: {
        opencv: 'opencv-python-headless==4.10.0.84 appears in OCR and VLM worker requirements; broader media/data runtime not verified.',
        pyav: 'referenced by production readiness specs and docs; not a root package dependency.',
        pyscenedetect: 'referenced by production readiness specs and docs; not a root package dependency.',
        sharp_libvips: 'referenced by production readiness specs and docs; not present in current package.json deps on PR #120 base.',
        duckdb: 'referenced by production readiness specs and docs; not a root package dependency.',
        polars: 'referenced by production readiness specs and docs; not a root package dependency.',
      },
      existingRepoReferences: [
        'server/workers/production-readiness/production-tool-readiness-specs.ts',
        'server/workers/production-readiness/core-tool-python-import-checks.ts',
        'server/workers/production-readiness/core-tool-node-import-checks.ts',
        'server/activation/container-readiness/container-readiness-expected-tools.ts',
        'server/workers/ocr-runtime/requirements.ocr.txt',
        'server/workers/vlm-runtime/requirements.vlm.txt',
        'docs/production-container-image-plan.md',
        'docs/production-tool-install-matrix.md',
      ],
    },
    dependencyRiskReport: {
      phase: MEDIA_DATA_READINESS_PHASE,
      risks: [
        { toolId: 'pyav', risk: 'FFmpeg dependency, codec exposure, patent/build configuration, and dynamic library compatibility.', mitigation: 'Keep FFmpeg review separate; no broad codec/runtime use until later approval.', status: 'tracked' },
        { toolId: 'sharp_libvips', risk: 'libvips LGPL-2.1-or-later, native binary, optional dependency, and untrusted image handling.', mitigation: 'Worker-only isolation, LGPL compliance review, and image safety QA before runtime.', status: 'tracked' },
        { toolId: 'opencv', risk: 'Native wheel/platform footprint and GUI dependency risk.', mitigation: 'Prefer opencv-python-headless in worker images and keep frontend imports forbidden.', status: 'tracked' },
        { toolId: 'pyscenedetect', risk: 'OpenCV dependency and false scene-boundary candidates.', mitigation: 'Use generated fixtures first and require manual/QA thresholds before controlled media.', status: 'tracked' },
        { toolId: 'duckdb', risk: 'Extension loading, network access, local file IO, and private metadata leakage.', mitigation: 'Disable unapproved extensions/network paths and commit only redacted summaries.', status: 'tracked' },
        { toolId: 'polars', risk: 'CPU feature compatibility, memory pressure, and schema drift.', mitigation: 'Use compatibility-aware worker images and deterministic schema tests in Phase 46D.', status: 'tracked' },
      ],
    },
    runtimeLocationPlan: {
      phase: MEDIA_DATA_READINESS_PHASE,
      locations: [
        { toolId: 'opencv', location: 'Python CPU/QA worker only', browserFrontend: 'forbidden', notes: 'No browser bundle import; Phase 46B generated fixtures before controlled media.' },
        { toolId: 'pyav', location: 'Python CPU worker only', browserFrontend: 'forbidden', notes: 'Container/probe access only after generated fixture approval.' },
        { toolId: 'pyscenedetect', location: 'Python CPU worker only', browserFrontend: 'forbidden', notes: 'Scene manifests are advisory and QA-gated.' },
        { toolId: 'sharp_libvips', location: 'Node server/worker image only', browserFrontend: 'forbidden', notes: 'No frontend import; native dependency isolated from browser.' },
        { toolId: 'duckdb', location: 'QA/reporting worker or local safe CLI only', browserFrontend: 'forbidden', notes: 'Network/extensions blocked unless approved.' },
        { toolId: 'polars', location: 'QA/reporting worker or local safe CLI only', browserFrontend: 'forbidden', notes: 'Use deterministic redacted summaries.' },
      ],
    },
    storagePrivacyPolicy: {
      phase: MEDIA_DATA_READINESS_PHASE,
      publicArtifacts: 'blocked',
      signedUrlsAsSourceOfTruth: 'blocked',
      rawFrameCommits: 'blocked',
      realMediaDerivedImageCommits: 'blocked',
      futurePrivatePrefixes,
      policy: [
        'Generated fixture outputs in Phase 46B go only to private QA artifacts.',
        'Controlled real-video outputs in Phase 46C go only to private QA artifacts.',
        'Artifact manifests may be committed only when safe and redacted.',
        'Raw metadata from controlled media remains private unless explicitly redacted.',
        'DuckDB/Polars outputs must not leak private text or media metadata into committed reports.',
        'Cleanup and retention policy is required before broader media.',
      ],
    },
    generatedFixtureHandoff: {
      phase: '46B',
      status: 'next_if_phase46a_passes',
      fixtures: [
        'generated-image-opencv-basic',
        'generated-container-pyav-probe',
        'generated-scene-cut-pyscenedetect',
        'generated-thumbnail-sharp-libvips',
        'generated-report-duckdb',
        'generated-report-polars',
        'generated-cross-tool-manifest',
      ],
      constraints: [
        'generated synthetic fixtures only',
        'no real media',
        'no arbitrary media input',
        'private artifacts only',
        'package installation/runtime image only if explicitly approved in Phase 46B',
      ],
    },
    controlledRealMediaHandoff: {
      phase: '46C',
      status: 'blocked_until_phase46b_passes',
      plan: [
        'use only previously approved private controlled real-video chain',
        'start with metadata/probe only',
        'bounded scene/frame sampling only after Phase 46B',
        'private artifacts only',
        'privacy/redaction policy required',
      ],
      constraints: [
        'no arbitrary media',
        'no broad user media',
        'no final export',
        'no public previews',
        'no committed frames or thumbnails from real media',
      ],
    },
    reportingQaHandoff: {
      phase: '46D',
      status: 'blocked_until_phase46b_46c_evidence_exists',
      plan: [
        'DuckDB/Polars aggregate OCR/VLM/audio/media QA outputs',
        'generated QA tables',
        'private report manifests',
        'deterministic output schemas',
        'redacted committed summaries only',
      ],
      constraints: [
        'no user-facing analytics leak',
        'no public artifacts',
        'no production unlock',
        'no beta unlock',
      ],
    },
    blockerReport: {
      phase: MEDIA_DATA_READINESS_PHASE,
      blockers: [
        'FFmpeg dependency/legal review unresolved for PyAV runtime',
        'libvips LGPL/native dependency review unresolved for Sharp/libvips runtime',
        'runtime availability not verified by execution in Phase 46A',
        'Phase 46B generated fixture suite not implemented yet',
        'Phase 46C controlled real-media suite blocked until Phase 46B',
        'Phase 46D reporting integration blocked until Phase 46B/46C evidence',
      ],
      blockedScopes: BLOCKED_SCOPES,
    },
    betaStatusReport: {
      phase: MEDIA_DATA_READINESS_PHASE,
      mediaDataToolFamilyBetaStatus: 'phase-complete but tool-family incomplete',
      rationale: 'Phase 46A provides source/license/runtime-readiness planning evidence only. Generated fixtures, controlled real-media verification, reporting integration, and final beta gate remain incomplete.',
      nextPhaseDecision: 'Proceed to Phase 46B generated media/data analysis suite if no Phase 46A validation blockers remain.',
    },
    readinessReport: {
      phase: MEDIA_DATA_READINESS_PHASE,
      status: 'passed_as_evidence_planning_only',
      toolReadiness: {
        opencv: 'partial',
        pyav: 'partial',
        pyscenedetect: 'partial',
        sharp_libvips: 'partial',
        duckdb: 'partial',
        polars: 'partial',
      },
      noExecution: NO_EXECUTION,
      mediaDataToolFamilyBetaStatus: 'phase-complete but tool-family incomplete',
    },
    iamPlan: {
      phase: MEDIA_DATA_READINESS_PHASE,
      status: 'no_iam_mutation_required',
      futurePrivatePrefixes: Object.values(futurePrivatePrefixes),
      notes: [
        'Phase 46A is report-only and does not require IAM changes.',
        'Future Phase 46B/46C/46D private prefixes require scoped IAM review before execution.',
        'No public bucket, public object, or signed URL source-of-truth path is allowed.',
      ],
    },
    costSummary: {
      phase: MEDIA_DATA_READINESS_PHASE,
      status: 'report_only_no_runtime_cost',
      estimatedPhase46aRuntimeCostUsd: 0,
      futureCostDrivers: [
        'Phase 46B package/runtime image installation if approved',
        'Phase 46C controlled media probe/frame/scene processing if approved',
        'Phase 46D private report aggregation at project scale',
      ],
    },
    privateArtifactManifest: {
      phase: MEDIA_DATA_READINESS_PHASE,
      runId: MEDIA_DATA_READINESS_RUN_ID,
      committedArtifacts: REPORT_FILES,
      privateArtifactsUploaded: false,
      forbiddenArtifactClasses: [
        'media files',
        'frames',
        'thumbnails',
        'private generated artifacts',
        'real-media metadata beyond redacted safe summaries',
        'secrets',
        'logs with secrets',
        'node_modules',
        'Python venv',
        'package caches',
        'runtime caches',
        'large binary payloads',
      ],
    },
  }
}

export function buildMediaDataReadinessSummary() {
  const reports = buildMediaDataReadinessReports()
  return {
    phase: MEDIA_DATA_READINESS_PHASE,
    status: reports.readinessReport.status,
    toolCount: reports.toolRegistry.tools.length,
    mediaDataToolFamilyBetaStatus: reports.betaStatusReport.mediaDataToolFamilyBetaStatus,
    nextRecommendedPhase: reports.betaStatusReport.nextPhaseDecision,
  }
}

export async function loadOrBuildMediaDataReadinessReport(
  artifactDir = MEDIA_DATA_READINESS_REPORT_DIR,
): Promise<MediaDataReadinessReports['readinessReport']> {
  try {
    return JSON.parse(await readFile(path.join(artifactDir, 'phase_46a_media_data_readiness_report.json'), 'utf8'))
  } catch {
    return buildMediaDataReadinessReports().readinessReport
  }
}

export async function writeMediaDataReadinessArtifacts(artifactDir = MEDIA_DATA_READINESS_REPORT_DIR): Promise<MediaDataReadinessReports> {
  const reports = buildMediaDataReadinessReports()
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_46a_media_data_readiness_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_46a_media_data_tool_registry.json'), reports.toolRegistry)
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_46a_media_data_source_evidence.json'), reports.sourceEvidence)
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_46a_media_data_license_evidence.json'), reports.licenseEvidence)
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_46a_media_data_runtime_inventory.json'), reports.runtimeInventory)
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_46a_media_data_dependency_risk_report.json'), reports.dependencyRiskReport)
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_46a_media_data_runtime_location_plan.json'), reports.runtimeLocationPlan)
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_46a_media_data_storage_privacy_policy.json'), reports.storagePrivacyPolicy)
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_46a_media_data_generated_fixture_handoff.json'), reports.generatedFixtureHandoff)
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_46a_media_data_controlled_real_media_handoff.json'), reports.controlledRealMediaHandoff)
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_46a_media_data_reporting_qa_handoff.json'), reports.reportingQaHandoff)
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_46a_media_data_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_46a_media_data_beta_status_report.json'), reports.betaStatusReport)
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_46a_media_data_readiness_report.json'), reports.readinessReport)
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_46a_media_data_iam_plan.json'), reports.iamPlan)
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_46a_media_data_cost_summary.json'), reports.costSummary)
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_46a_media_data_private_artifact_manifest.json'), reports.privateArtifactManifest)
  await writeVlmRuntimeTextArtifact(path.join(artifactDir, 'phase_46a_media_data_readiness_report.md'), renderReadinessMarkdown(reports))
  return reports
}

function renderReadinessMarkdown(reports: MediaDataReadinessReports): string {
  return [
    '# Phase 46A Media/Data Tool Readiness Report',
    '',
    `Run id: ${MEDIA_DATA_READINESS_RUN_ID}`,
    `Status: ${reports.readinessReport.status}`,
    `Media/data tool-family beta status: ${reports.betaStatusReport.mediaDataToolFamilyBetaStatus}`,
    '',
    '## Tools',
    '',
    ...reports.toolRegistry.tools.map((tool) => `- ${tool.displayName}: ${tool.blockerStatus}; ${tool.primaryPurpose}`),
    '',
    '## Dependency Risks',
    '',
    ...reports.dependencyRiskReport.risks.map((risk) => `- ${risk.toolId}: ${risk.risk}`),
    '',
    '## Next Phase',
    '',
    reports.betaStatusReport.nextPhaseDecision,
  ].join('\n')
}
