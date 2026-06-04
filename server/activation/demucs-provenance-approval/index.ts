import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'

type PhaseStatus = 'passed' | 'blocked' | 'warning' | 'not_run' | 'skipped'
type AudioTimingBetaStatus =
  | 'blocked'
  | 'phase-complete but tool-family incomplete'
  | 'internally beta-ready candidate'
  | 'external beta still blocked'
type DemucsDecision =
  | 'approved_for_future_guarded_36l_download_runtime_planning'
  | 'blocked_pending_human_legal_review'
  | 'blocked_pending_model_artifact_provenance'
  | 'blocked_pending_training_data_provenance'
  | 'rejected_for_current_internal_beta_scope'
  | 'deferred_not_required_for_current_audio_timing_internal_scope'

type JsonRecord = Record<string, unknown>

export const DEMUCS_PROVENANCE_PHASE = '36K'
export const DEMUCS_PROVENANCE_RUN_ID = 'phase36k-demucs-provenance-approval-retry-20260604'
export const DEMUCS_PROVENANCE_REPORT_DIR = 'docs/activation-phase-36k-demucs-provenance-approval-retry-reports'
export const DEMUCS_PROVENANCE_BRANCH = 'codex/rp-activation-36k-demucs-provenance-approval-retry'
export const DEMUCS_PROVENANCE_BASE_BRANCH = 'codex/rp-activation-36j-controlled-real-media-timing-stretch-sample'

const ACCESSED_ON = '2026-06-04'
const GITHUB_ARCHIVED_REPO = 'https://github.com/facebookresearch/demucs'
const GITHUB_MAINTAINER_FORK = 'https://github.com/adefossez/demucs'
const GITHUB_LICENSE = 'https://github.com/facebookresearch/demucs/blob/main/LICENSE'
const PYPI_PROJECT = 'https://pypi.org/project/demucs/'
const TORCHAUDIO_PIPELINES = 'https://docs.pytorch.org/audio/stable/pipelines.html'
const TORCHAUDIO_HDEMUCS_MUSDB = 'https://docs.pytorch.org/audio/2.9.0/generated/torchaudio.pipelines.HDEMUCS_HIGH_MUSDB.html'
const MUSDB_SOURCE = 'https://sigsep.github.io/datasets/musdb.html'
const ARXIV_HTDEMUCS = 'https://arxiv.org/abs/2211.08553'
const ARXIV_HDEMUCS = 'https://arxiv.org/abs/2111.03600'
const ARXIV_DEMUCS = 'https://arxiv.org/abs/1911.13254'

const PRIOR_AUDIO_REPORTS = [
  {
    phase: '36H',
    pr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/140',
    path: 'docs/activation-phase-36h-deepfilternet-runtime-hardening-controlled-speech-reports/phase_36h_deepfilternet_runtime_hardening_report.json',
    expectedStatus: 'passed',
    summary: 'DeepFilterNet linux/amd64 runtime hardening and one bounded controlled speech cleanup sample passed.',
  },
  {
    phase: '36I',
    pr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/147',
    path: 'docs/activation-phase-36i-signalsmith-stretch-generated-fixture-reports/phase_36i_signalsmith_runtime_generated_fixture_report.json',
    expectedStatus: 'passed',
    summary: 'Signalsmith Stretch exact source/runtime generated synthetic audio stretch fixtures passed.',
  },
  {
    phase: '36J',
    pr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/149',
    path: 'docs/activation-phase-36j-controlled-real-media-timing-stretch-sample-reports/phase_36j_controlled_real_media_timing_stretch_report.json',
    expectedStatus: 'passed',
    summary: 'Signalsmith controlled real-media timing/stretch sample passed for one private bounded approved window.',
  },
] as const

export const DEMUCS_PROVENANCE_EXPECTED_REPORT_FILES = [
  'phase_36k_demucs_provenance_plan.json',
  'phase_36k_audio_timing_prior_evidence_report.json',
  'phase_36k_demucs_web_research_report.json',
  'phase_36k_demucs_source_evidence.json',
  'phase_36k_demucs_license_evidence.json',
  'phase_36k_demucs_package_evidence.json',
  'phase_36k_demucs_model_candidate_inventory.json',
  'phase_36k_demucs_training_data_provenance_report.json',
  'phase_36k_demucs_weight_artifact_source_policy.json',
  'phase_36k_demucs_runtime_risk_report.json',
  'phase_36k_demucs_provenance_decision.json',
  'phase_36k_demucs_phase36l_handoff_manifest.json',
  'phase_36k_audio_timing_beta_scope_recommendation.json',
  'phase_36k_private_artifact_manifest.json',
  'phase_36k_blocker_report.json',
] as const

const FORBIDDEN_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_DEMUCS_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_DEMUCS_MODEL_DOWNLOAD',
  'REEDITPRO_CONFIRM_DEMUCS_MODEL_STAGING',
  'REEDITPRO_CONFIRM_DEMUCS_SOURCE_SEPARATION',
  'REEDITPRO_CONFIRM_DEEPFILTERNET_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_SIGNALSMITH_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_SIGNALSMITH_CONTROLLED_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_OCR_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_PROVIDER_CALLS',
  'REEDITPRO_CONFIRM_BROAD_MEDIA_PROCESSING',
  'REEDITPRO_CONFIRM_ARBITRARY_MEDIA_INPUT',
  'REEDITPRO_CONFIRM_PRODUCTION_UNLOCK',
  'REEDITPRO_CONFIRM_EXTERNAL_BETA_UNLOCK',
  'REEDITPRO_CONFIRM_TRACK_A_RUNTIME',
] as const

const BLOCKED_SCOPES = [
  'Phase 36L Demucs download/runtime until a human/legal approval resolves model provenance',
  'Demucs model downloads',
  'Demucs private staging',
  'Demucs runtime execution',
  'source separation',
  'audio/media processing',
  'arbitrary media',
  'broad media',
  'unapproved real media',
  'provider calls',
  'VLM runtime retries',
  'OCR runtime',
  'DeepFilterNet runtime reruns',
  'Signalsmith runtime reruns',
  'Docker',
  'Cloud Build',
  'Cloud Run',
  'GPU jobs',
  'IAM mutation',
  'public artifacts',
  'public output',
  'internal beta unlock',
  'external beta',
  'paid production',
  'production',
  'Track A runtime/visual/render stack',
]

const SOURCE_EVIDENCE = [
  {
    id: 'facebookresearch_demucs_archived_repo',
    sourceUrl: GITHUB_ARCHIVED_REPO,
    evidenceType: 'official_repo',
    accessedOn: ACCESSED_ON,
    status: 'available_archived',
    summary: 'Meta/facebookresearch Demucs repository is public, MIT-licensed, and archived/read-only as of January 1, 2025.',
    decisionImpact: 'Code license can be reviewed, but archived status increases maintenance and security risk for production/runtime use.',
    confidence: 'high',
  },
  {
    id: 'adefossez_demucs_maintainer_fork',
    sourceUrl: GITHUB_MAINTAINER_FORK,
    evidenceType: 'maintainer_fork',
    accessedOn: ACCESSED_ON,
    status: 'available_slow_maintenance',
    summary: 'Maintainer fork states it is the officially maintained Demucs after the author left Meta, but also says no active feature work should be expected.',
    decisionImpact: 'Future Phase 36L should choose an exact source ref only after security/dependency review.',
    confidence: 'medium',
  },
  {
    id: 'demucs_readme_pretrained_models',
    sourceUrl: GITHUB_ARCHIVED_REPO,
    evidenceType: 'official_readme',
    accessedOn: ACCESSED_ON,
    status: 'available',
    summary: 'README lists htdemucs, htdemucs_ft, htdemucs_6s, hdemucs_mmi, mdx, mdx_extra, mdx_q, and mdx_extra_q pretrained model names and training notes.',
    decisionImpact: 'The model list is discoverable, but Phase 36K still forbids downloading or staging these weights.',
    confidence: 'high',
  },
] as const

const LICENSE_EVIDENCE = [
  {
    id: 'demucs_code_license_mit',
    sourceUrl: GITHUB_LICENSE,
    evidenceType: 'license_file',
    accessedOn: ACCESSED_ON,
    license: 'MIT',
    status: 'source_code_license_evidenced',
    summary: 'The repository LICENSE file is MIT and names Meta Platforms, Inc. and affiliates.',
    decisionImpact: 'Source code license is not the blocker; model weight and training data provenance remain unresolved.',
    confidence: 'high',
  },
  {
    id: 'demucs_pypi_license_mit',
    sourceUrl: PYPI_PROJECT,
    evidenceType: 'package_metadata',
    accessedOn: ACCESSED_ON,
    license: 'MIT License',
    status: 'package_license_evidenced',
    summary: 'PyPI lists Demucs as MIT-licensed with OSI Approved MIT classifier.',
    decisionImpact: 'Package metadata supports code/package review, not pretrained weight approval.',
    confidence: 'high',
  },
] as const

const PACKAGE_EVIDENCE = {
  id: 'pypi_demucs_4_0_1',
  sourceUrl: PYPI_PROJECT,
  evidenceType: 'pypi_release',
  accessedOn: ACCESSED_ON,
  packageName: 'demucs',
  latestObservedVersion: '4.0.1',
  uploadDate: '2023-09-07',
  pythonRequirement: '>=3.8.0',
  artifactType: 'source_distribution',
  sourceDistribution: {
    fileName: 'demucs-4.0.1.tar.gz',
    size: '1.2 MB',
    sha256: 'e45a5a788bae79767c37bbf6e69aae03862ddcca05550fb79b926346a177d713',
    trustedPublishing: false,
  },
  status: 'package_metadata_evidenced_not_approved_for_install',
  dependencyCaveats: [
    'PyTorch and torchaudio runtime/dependency review required.',
    'FFmpeg/audio codec behavior requires separate review.',
    'Demucs package install is forbidden in Phase 36K.',
  ],
}

const MODEL_CANDIDATES = [
  {
    modelId: 'htdemucs',
    source: 'Demucs README pretrained model list',
    officialDescription: 'First Hybrid Transformer Demucs model; default model; trained on MUSDB plus 800 extra songs.',
    trainingDataStatus: 'blocked_extra_800_songs_unresolved',
    weightArtifactStatus: 'not_downloaded_not_staged_not_approved',
    phase36LStatus: 'blocked',
  },
  {
    modelId: 'htdemucs_ft',
    source: 'Demucs README pretrained model list',
    officialDescription: 'Fine-tuned htdemucs; same training set as htdemucs; slower but potentially better.',
    trainingDataStatus: 'blocked_extra_800_songs_unresolved',
    weightArtifactStatus: 'not_downloaded_not_staged_not_approved',
    phase36LStatus: 'blocked',
  },
  {
    modelId: 'htdemucs_6s',
    source: 'Demucs README pretrained model list',
    officialDescription: 'Experimental 6-source model adding guitar and piano; README caveats piano quality.',
    trainingDataStatus: 'blocked_extra_training_data_unresolved',
    weightArtifactStatus: 'not_downloaded_not_staged_not_approved',
    phase36LStatus: 'blocked',
  },
  {
    modelId: 'hdemucs_mmi',
    source: 'Demucs README pretrained model list',
    officialDescription: 'Hybrid Demucs v3 retrained on MUSDB plus 800 songs.',
    trainingDataStatus: 'blocked_extra_800_songs_unresolved',
    weightArtifactStatus: 'not_downloaded_not_staged_not_approved',
    phase36LStatus: 'blocked',
  },
  {
    modelId: 'mdx',
    source: 'Demucs README pretrained model list',
    officialDescription: 'MDX challenge model trained only on MUSDB HQ.',
    trainingDataStatus: 'blocked_musdb_hq_academic_and_noncommercial_caveats',
    weightArtifactStatus: 'not_downloaded_not_staged_not_approved',
    phase36LStatus: 'blocked_pending_human_legal_review',
  },
  {
    modelId: 'mdx_extra',
    source: 'Demucs README pretrained model list',
    officialDescription: 'MDX challenge model trained with extra training data including MUSDB test set.',
    trainingDataStatus: 'blocked_extra_training_data_and_test_set_use_unresolved',
    weightArtifactStatus: 'not_downloaded_not_staged_not_approved',
    phase36LStatus: 'blocked',
  },
  {
    modelId: 'mdx_q',
    source: 'Demucs README pretrained model list',
    officialDescription: 'Quantized mdx model.',
    trainingDataStatus: 'inherits_mdx_training_data_blocker',
    weightArtifactStatus: 'not_downloaded_not_staged_not_approved',
    phase36LStatus: 'blocked_pending_human_legal_review',
  },
  {
    modelId: 'mdx_extra_q',
    source: 'Demucs README pretrained model list',
    officialDescription: 'Quantized mdx_extra model.',
    trainingDataStatus: 'inherits_mdx_extra_training_data_blocker',
    weightArtifactStatus: 'not_downloaded_not_staged_not_approved',
    phase36LStatus: 'blocked',
  },
  {
    modelId: 'torchaudio:HDEMUCS_HIGH_MUSDB',
    source: TORCHAUDIO_HDEMUCS_MUSDB,
    officialDescription: 'Torchaudio pretrained Hybrid Demucs bundle trained on MUSDB-HQ training set.',
    trainingDataStatus: 'blocked_musdb_hq_academic_and_noncommercial_caveats',
    weightArtifactStatus: 'not_downloaded_not_staged_not_approved',
    phase36LStatus: 'blocked_pending_human_legal_review',
  },
  {
    modelId: 'torchaudio:HDEMUCS_HIGH_MUSDB_PLUS',
    source: TORCHAUDIO_PIPELINES,
    officialDescription: 'Torchaudio pretrained bundle trained on MUSDB-HQ train and test sets plus 150 internal Meta songs.',
    trainingDataStatus: 'blocked_internal_meta_songs_and_test_set_use_unresolved',
    weightArtifactStatus: 'not_downloaded_not_staged_not_approved',
    phase36LStatus: 'blocked',
  },
] as const

export interface DemucsProvenanceSummary {
  phase: typeof DEMUCS_PROVENANCE_PHASE
  runId: string
  status: PhaseStatus
  demucsDecision: DemucsDecision
  audioTimingToolFamilyBetaStatus: AudioTimingBetaStatus
  sourceEvidenceStatus: string
  licenseEvidenceStatus: string
  packageEvidenceStatus: string
  modelCandidateStatus: string
  trainingDataProvenanceStatus: string
  phase36LHandoffStatus: string
  nextPhaseDecision: string
}

export function getDemucsProvenancePlan() {
  return {
    phase: DEMUCS_PROVENANCE_PHASE,
    runId: DEMUCS_PROVENANCE_RUN_ID,
    branch: DEMUCS_PROVENANCE_BRANCH,
    baseBranch: DEMUCS_PROVENANCE_BASE_BRANCH,
    sourcePhase36HPr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/140',
    sourcePhase36IPr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/147',
    sourcePhase36JPr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/149',
    purpose: 'Demucs provenance/legal approval retry only.',
    allowedDecisionValues: [
      'approved_for_future_guarded_36l_download_runtime_planning',
      'blocked_pending_human_legal_review',
      'blocked_pending_model_artifact_provenance',
      'blocked_pending_training_data_provenance',
      'rejected_for_current_internal_beta_scope',
      'deferred_not_required_for_current_audio_timing_internal_scope',
    ],
    defaultDecision: 'blocked_pending_training_data_provenance',
    officialSourcesToReview: [
      GITHUB_ARCHIVED_REPO,
      GITHUB_MAINTAINER_FORK,
      GITHUB_LICENSE,
      PYPI_PROJECT,
      TORCHAUDIO_PIPELINES,
      TORCHAUDIO_HDEMUCS_MUSDB,
      MUSDB_SOURCE,
      ARXIV_DEMUCS,
      ARXIV_HDEMUCS,
      ARXIV_HTDEMUCS,
    ],
    forbiddenConfirmations: FORBIDDEN_CONFIRMATIONS,
    noPackageInstall: true,
    noModelDownload: true,
    noModelStaging: true,
    noRuntimeExecution: true,
    noSourceSeparation: true,
    noMediaProcessing: true,
    noCloudMutation: true,
    noProviderCalls: true,
    noTrackA: true,
    audioTimingToolFamilyBetaStatus: 'phase-complete but tool-family incomplete' as AudioTimingBetaStatus,
    blockedScopes: BLOCKED_SCOPES,
  }
}

export function buildDemucsProvenanceIamPlan() {
  return [
    {
      id: 'phase36k-demucs-no-iam-mutation',
      status: 'not_required',
      reason: 'Phase 36K is source/provenance metadata only and performs no private artifact upload, model staging, bucket reads, or cloud mutation.',
      commandString: 'No IAM command is generated for Phase 36K.',
    },
  ]
}

export function buildDemucsProvenanceCostSummary() {
  return {
    phase: DEMUCS_PROVENANCE_PHASE,
    runId: DEMUCS_PROVENANCE_RUN_ID,
    status: 'near_zero',
    localMetadataGeneration: 'low',
    webResearch: 'manual_browser_research_only',
    packageInstall: 'not_used',
    modelDownload: 'not_used',
    runtimeExecution: 'not_used',
    cloud: 'not_used',
    gpu: 'not_used',
    expectedCostUsd: '0 for repo execution; no cloud/runtime/model/media actions are performed.',
  }
}

export function buildDemucsWebResearchReport() {
  return {
    phase: DEMUCS_PROVENANCE_PHASE,
    runId: DEMUCS_PROVENANCE_RUN_ID,
    accessedOn: ACCESSED_ON,
    researchStatus: 'completed_for_decision_gate',
    sources: [
      ...SOURCE_EVIDENCE,
      ...LICENSE_EVIDENCE,
      {
        id: 'pypi_demucs_release_and_hash',
        sourceUrl: PYPI_PROJECT,
        evidenceType: 'package_release',
        accessedOn: ACCESSED_ON,
        summary: 'PyPI lists latest observed Demucs 4.0.1, source distribution hash, Python requirement, MIT classifier, and package upload metadata.',
        decisionImpact: 'Useful for future package pinning, but package evidence does not approve pretrained model weights.',
        confidence: 'high',
      },
      {
        id: 'torchaudio_hdemucs_musdb',
        sourceUrl: TORCHAUDIO_HDEMUCS_MUSDB,
        evidenceType: 'pretrained_bundle_docs',
        accessedOn: ACCESSED_ON,
        summary: 'Torchaudio documents HDEMUCS_HIGH_MUSDB as trained on the MUSDB-HQ training set.',
        decisionImpact: 'Training dataset is identified, but MUSDB-HQ license/access caveats still require human/legal review.',
        confidence: 'high',
      },
      {
        id: 'torchaudio_hdemucs_musdb_plus',
        sourceUrl: TORCHAUDIO_PIPELINES,
        evidenceType: 'pretrained_bundle_docs',
        accessedOn: ACCESSED_ON,
        summary: 'Torchaudio documents HDEMUCS_HIGH_MUSDB_PLUS as trained on MUSDB-HQ train/test plus 150 internal Meta songs.',
        decisionImpact: 'Internal Meta songs and test-set use are not acceptable for automatic approval.',
        confidence: 'high',
      },
      {
        id: 'musdb_dataset_license_context',
        sourceUrl: MUSDB_SOURCE,
        evidenceType: 'dataset_license_context',
        accessedOn: ACCESSED_ON,
        summary: 'MUSDB18 includes DSD100, MedleyDB Creative Commons BY-NC-SA 4.0 tracks, Native Instruments tracks, Easton Ellises BY-NC-SA 3.0 tracks, and academic-use access notes.',
        decisionImpact: 'MUSDB/MUSDB-HQ provenance is not clean enough for automatic commercial production or broad beta approval.',
        confidence: 'high',
      },
      {
        id: 'hybrid_transformer_demucs_paper',
        sourceUrl: ARXIV_HTDEMUCS,
        evidenceType: 'paper',
        accessedOn: ACCESSED_ON,
        summary: 'HT Demucs paper evidence supports model architecture/training context but does not replace artifact-level legal approval.',
        decisionImpact: 'Research evidence only; not enough for model-weight approval.',
        confidence: 'medium',
      },
    ],
    conflicts: [
      {
        id: 'code_license_vs_weight_training_data',
        summary: 'Code/package sources show MIT licensing, while pretrained model training data includes MUSDB and extra/internal songs with unresolved usage rights.',
        decisionImpact: 'Approve source code review separately from model weights; keep pretrained weight download/runtime blocked.',
      },
      {
        id: 'archived_repo_vs_maintainer_fork',
        summary: 'Meta repository is archived/read-only; maintainer fork exists but states no active feature work should be expected.',
        decisionImpact: 'Future runtime approval must include dependency/security review and exact source pinning.',
      },
    ],
  }
}

export function buildDemucsSourceEvidence() {
  return {
    phase: DEMUCS_PROVENANCE_PHASE,
    runId: DEMUCS_PROVENANCE_RUN_ID,
    status: 'source_evidence_present',
    sources: SOURCE_EVIDENCE,
    blocker: null,
  }
}

export function buildDemucsLicenseEvidence() {
  return {
    phase: DEMUCS_PROVENANCE_PHASE,
    runId: DEMUCS_PROVENANCE_RUN_ID,
    status: 'code_and_package_license_evidenced_model_weights_not_approved',
    evidence: LICENSE_EVIDENCE,
    unresolvedLegalReview: [
      'Pretrained model weights are not approved by MIT code license alone.',
      'Training data terms require human/legal review before source separation use.',
    ],
  }
}

export function buildDemucsPackageEvidence() {
  return {
    phase: DEMUCS_PROVENANCE_PHASE,
    runId: DEMUCS_PROVENANCE_RUN_ID,
    ...PACKAGE_EVIDENCE,
    phase36KPolicy: 'record_only_no_install_no_download',
  }
}

export function buildDemucsModelCandidateInventory() {
  return {
    phase: DEMUCS_PROVENANCE_PHASE,
    runId: DEMUCS_PROVENANCE_RUN_ID,
    status: 'candidates_inventoried_no_candidate_approved',
    candidates: MODEL_CANDIDATES,
    candidatePolicy: {
      phase36KDownloadAllowed: false,
      phase36KRuntimeAllowed: false,
      phase36LRequiresHumanApproval: true,
      exactArtifactSourceRequired: true,
      privateStagingRequired: true,
    },
  }
}

export function buildDemucsTrainingDataProvenanceReport() {
  return {
    phase: DEMUCS_PROVENANCE_PHASE,
    runId: DEMUCS_PROVENANCE_RUN_ID,
    status: 'blocked_pending_training_data_provenance',
    findings: [
      {
        id: 'musdb_hq_academic_noncommercial_context',
        sourceUrl: MUSDB_SOURCE,
        summary: 'MUSDB18/MUSDB18-HQ are identified as core training data for several Demucs/HDemucs candidates and include academic-use access and Creative Commons noncommercial/sharealike components.',
        impact: 'Requires human/legal review before commercial, beta, or broad user-media source separation.',
      },
      {
        id: 'extra_800_songs_unresolved',
        sourceUrl: GITHUB_MAINTAINER_FORK,
        summary: 'HT Demucs candidates are described as trained on MUSDB-HQ plus an extra training dataset of 800 songs.',
        impact: 'Extra song provenance, licenses, and artifact rights are not sufficient for automatic approval.',
      },
      {
        id: 'internal_meta_songs_unresolved',
        sourceUrl: TORCHAUDIO_PIPELINES,
        summary: 'Torchaudio HDEMUCS_HIGH_MUSDB_PLUS references additional internal Meta songs.',
        impact: 'Internal dataset provenance blocks automated approval for ReeditPro runtime use.',
      },
      {
        id: 'musdb_test_set_training_caveat',
        sourceUrl: TORCHAUDIO_PIPELINES,
        summary: 'Some pretrained bundles/docs mention training on both MUSDB-HQ train and test sets.',
        impact: 'Test-set training is not a legal blocker by itself, but it is a provenance and benchmark-interpretation caveat.',
      },
    ],
    conclusion: 'Demucs pretrained model provenance is not sufficiently clear for Phase 36L download/runtime without human/legal approval.',
  }
}

export function buildDemucsWeightArtifactSourcePolicy() {
  return {
    phase: DEMUCS_PROVENANCE_PHASE,
    runId: DEMUCS_PROVENANCE_RUN_ID,
    status: 'no_weight_artifact_source_approved',
    policy: {
      allowedInPhase36K: [
        'Record official model names.',
        'Record official source URLs and caveats.',
        'Draft future private staging requirements.',
      ],
      forbiddenInPhase36K: [
        'Download model weights.',
        'Download package artifacts.',
        'Resolve torch hub caches.',
        'Use signed URLs as source of truth.',
        'Stage model artifacts.',
        'Run source separation.',
      ],
      futurePhase36LRequirements: [
        'Human/legal approval for exact model candidate.',
        'Exact source URL and immutable version/hash manifest.',
        'Private GCS staging path.',
        'SHA-256 verification before runtime.',
        'No public artifacts or committed weights.',
        'Runtime cost and dependency approval.',
      ],
    },
  }
}

export function buildDemucsRuntimeRiskReport() {
  return {
    phase: DEMUCS_PROVENANCE_PHASE,
    runId: DEMUCS_PROVENANCE_RUN_ID,
    status: 'runtime_not_approved',
    risks: [
      {
        id: 'heavy_pytorch_torchaudio_dependency',
        severity: 'medium',
        summary: 'Demucs runtime depends on PyTorch/torchaudio-style stacks that require worker isolation and dependency/security review.',
      },
      {
        id: 'gpu_memory_and_cost',
        severity: 'medium',
        summary: 'Official docs mention CPU fallback and GPU memory segment controls; production quality/cost would need bounded worker policy.',
      },
      {
        id: 'codec_and_ffmpeg_surface',
        severity: 'medium',
        summary: 'Input/output audio formats and ffmpeg behavior must remain private-worker-only and reviewed for codec/patent/configuration exposure.',
      },
      {
        id: 'stem_outputs_privacy',
        severity: 'high',
        summary: 'Source separation outputs can expose vocals/stems from private user or controlled media and require strict private artifact policy.',
      },
      {
        id: 'music_rights_and_user_media',
        severity: 'high',
        summary: 'Broad stem separation over user media may implicate music rights and is blocked for beta/production.',
      },
    ],
  }
}

export function buildDemucsProvenanceDecision() {
  const decision: DemucsDecision = 'blocked_pending_training_data_provenance'
  return {
    phase: DEMUCS_PROVENANCE_PHASE,
    runId: DEMUCS_PROVENANCE_RUN_ID,
    status: 'blocked',
    demucsDecision: decision,
    sourceCodeDecision: 'source_code_mit_evidenced_not_runtime_approval',
    packageDecision: 'pypi_metadata_evidenced_not_install_approval',
    modelWeightDecision: 'blocked_pending_model_artifact_provenance',
    trainingDataDecision: 'blocked_pending_training_data_provenance',
    humanLegalReviewRequired: true,
    approvedForPhase36L: false,
    rationale: [
      'MIT code/package evidence does not prove pretrained model weight rights.',
      'Default and high-quality candidates reference MUSDB-HQ plus extra/internal songs with unresolved terms.',
      'MUSDB/MUSDB-HQ contains academic/noncommercial/sharealike/licensing caveats.',
      'No exact immutable model artifact source, checksum, or private staging policy is approved in Phase 36K.',
    ],
    audioTimingToolFamilyBetaStatus: 'phase-complete but tool-family incomplete' as AudioTimingBetaStatus,
    nextPhaseDecision: 'Do not run Phase 36L unless a human/legal reviewer approves an exact Demucs candidate; otherwise proceed to audio/timing internal beta gate only if Demucs is explicitly excluded from current internal scope.',
  }
}

export function buildDemucsPhase36LHandoffManifest() {
  return {
    phase: DEMUCS_PROVENANCE_PHASE,
    runId: DEMUCS_PROVENANCE_RUN_ID,
    status: 'not_eligible',
    phase36LBlocked: true,
    requiredBeforePhase36L: [
      'Human/legal approval for one exact Demucs/HDemucs model candidate.',
      'Documented training-data and pretrained-weight provenance resolution.',
      'Exact artifact URL and SHA-256 manifest without downloading in Phase 36K.',
      'Private GCS staging prefix and checksum policy.',
      'Runtime dependency and cost policy.',
      'Private generated fixture plan with no broad media.',
    ],
    candidateIfHumanApprovesLowestRiskReviewPath: 'mdx or torchaudio:HDEMUCS_HIGH_MUSDB may be reviewed first because their documented training data is MUSDB-HQ only, but MUSDB-HQ terms still require legal review.',
  }
}

export function buildAudioTimingBetaScopeRecommendation() {
  return {
    phase: DEMUCS_PROVENANCE_PHASE,
    runId: DEMUCS_PROVENANCE_RUN_ID,
    audioTimingToolFamilyBetaStatus: 'phase-complete but tool-family incomplete' as AudioTimingBetaStatus,
    demucsScopeRecommendation: 'deferred_not_required_for_current_audio_timing_internal_scope_requires_human_product_approval',
    recommendation: [
      'Keep Demucs blocked for download/runtime/source separation.',
      'Permit a future audio/timing internal beta gate to evaluate whether DeepFilterNet plus Signalsmith evidence is enough for restricted internal QA/planning scope.',
      'Do not include Demucs source separation in internal beta unless Phase 36L and later runtime evidence pass.',
    ],
    blockedUntilExplicitApproval: [
      'Source separation over broad user media.',
      'Music/stem separation features.',
      'Demucs model download/private staging.',
      'Demucs runtime execution.',
      'External beta or production use.',
    ],
  }
}

export function buildDemucsBlockerReport() {
  return {
    phase: DEMUCS_PROVENANCE_PHASE,
    runId: DEMUCS_PROVENANCE_RUN_ID,
    status: 'blocked',
    blockers: [
      {
        id: 'training_data_provenance_unresolved',
        severity: 'blocking',
        summary: 'MUSDB-HQ and extra/internal song provenance prevents automatic pretrained model approval.',
      },
      {
        id: 'model_weight_artifact_source_unapproved',
        severity: 'blocking',
        summary: 'No exact immutable Demucs model artifact URL/checksum/private staging policy is approved.',
      },
      {
        id: 'human_legal_review_required',
        severity: 'blocking',
        summary: 'A human/legal decision is required before Phase 36L can download or stage weights.',
      },
      {
        id: 'phase36l_download_runtime_blocked',
        severity: 'blocking',
        summary: 'Phase 36L must not start until the provenance decision changes to approved for future guarded planning.',
      },
    ],
    blockedScopes: BLOCKED_SCOPES,
  }
}

export async function buildAudioTimingPriorEvidenceReport(): Promise<JsonRecord> {
  const reports = []
  for (const report of PRIOR_AUDIO_REPORTS) {
    const data = await readJsonIfPresent(report.path)
    reports.push({
      ...report,
      present: Boolean(data),
      observedStatus: typeof data?.status === 'string' ? data.status : 'unknown',
      observedAudioTimingToolFamilyBetaStatus: typeof data?.audioTimingToolFamilyBetaStatus === 'string'
        ? data.audioTimingToolFamilyBetaStatus
        : 'unknown',
    })
  }
  return {
    phase: DEMUCS_PROVENANCE_PHASE,
    runId: DEMUCS_PROVENANCE_RUN_ID,
    status: reports.every((report) => report.present) ? 'prior_evidence_present' : 'prior_evidence_incomplete',
    reports,
    conclusion: 'DeepFilterNet and Signalsmith evidence supports audio/timing progress, but Demucs source separation remains provenance-blocked.',
  }
}

export async function writeDemucsProvenanceArtifacts(reportDir = DEMUCS_PROVENANCE_REPORT_DIR): Promise<void> {
  const baseReports: Record<string, unknown> = {
    'phase_36k_demucs_provenance_plan.json': getDemucsProvenancePlan(),
    'phase_36k_audio_timing_prior_evidence_report.json': await buildAudioTimingPriorEvidenceReport(),
    'phase_36k_demucs_web_research_report.json': buildDemucsWebResearchReport(),
    'phase_36k_demucs_source_evidence.json': buildDemucsSourceEvidence(),
    'phase_36k_demucs_license_evidence.json': buildDemucsLicenseEvidence(),
    'phase_36k_demucs_package_evidence.json': buildDemucsPackageEvidence(),
    'phase_36k_demucs_model_candidate_inventory.json': buildDemucsModelCandidateInventory(),
    'phase_36k_demucs_training_data_provenance_report.json': buildDemucsTrainingDataProvenanceReport(),
    'phase_36k_demucs_weight_artifact_source_policy.json': buildDemucsWeightArtifactSourcePolicy(),
    'phase_36k_demucs_runtime_risk_report.json': buildDemucsRuntimeRiskReport(),
    'phase_36k_demucs_provenance_decision.json': buildDemucsProvenanceDecision(),
    'phase_36k_demucs_phase36l_handoff_manifest.json': buildDemucsPhase36LHandoffManifest(),
    'phase_36k_audio_timing_beta_scope_recommendation.json': buildAudioTimingBetaScopeRecommendation(),
    'phase_36k_blocker_report.json': buildDemucsBlockerReport(),
  }

  for (const [file, value] of Object.entries(baseReports)) {
    await writeVlmRuntimeJsonArtifact(path.join(reportDir, file), value)
  }
  await writeVlmRuntimeJsonArtifact(
    path.join(reportDir, 'phase_36k_private_artifact_manifest.json'),
    await buildPrivateArtifactManifest(reportDir),
  )
  await writeVlmRuntimeTextArtifact(path.join(reportDir, 'README.md'), buildReportsReadme())
}

export async function readDemucsProvenanceSummary(reportDir = DEMUCS_PROVENANCE_REPORT_DIR): Promise<DemucsProvenanceSummary> {
  const decision = await readJsonIfPresent(path.join(reportDir, 'phase_36k_demucs_provenance_decision.json'))
  if (!decision) return buildSummary('not_run')
  return {
    phase: DEMUCS_PROVENANCE_PHASE,
    runId: DEMUCS_PROVENANCE_RUN_ID,
    status: toStatus(decision.status, 'blocked'),
    demucsDecision: toDecision(decision.demucsDecision, 'blocked_pending_training_data_provenance'),
    audioTimingToolFamilyBetaStatus: toBetaStatus(decision.audioTimingToolFamilyBetaStatus, 'phase-complete but tool-family incomplete'),
    sourceEvidenceStatus: 'source_evidence_present',
    licenseEvidenceStatus: 'code_and_package_license_evidenced_model_weights_not_approved',
    packageEvidenceStatus: 'package_metadata_evidenced_not_approved_for_install',
    modelCandidateStatus: 'candidates_inventoried_no_candidate_approved',
    trainingDataProvenanceStatus: 'blocked_pending_training_data_provenance',
    phase36LHandoffStatus: 'blocked',
    nextPhaseDecision: String(decision.nextPhaseDecision ?? 'Do not proceed to Phase 36L without human/legal approval.'),
  }
}

async function buildPrivateArtifactManifest(reportDir: string) {
  const artifacts = []
  if (existsSync(reportDir)) {
    for (const file of await readdir(reportDir)) {
      if (!file.endsWith('.json') || file === 'phase_36k_private_artifact_manifest.json') continue
      const fullPath = path.join(reportDir, file)
      const fileStat = await stat(fullPath)
      artifacts.push({
        file,
        localPath: fullPath,
        sizeBytes: fileStat.size,
        sha256: await sha256File(fullPath),
        committedSafeMetadataOnly: true,
      })
    }
  }
  return {
    phase: DEMUCS_PROVENANCE_PHASE,
    runId: DEMUCS_PROVENANCE_RUN_ID,
    status: 'local_safe_metadata_only',
    privateUploadStatus: 'not_run_phase36k_policy_no_cloud_mutation',
    objectCount: 0,
    artifacts: artifacts.sort((a, b) => a.file.localeCompare(b.file)),
    forbiddenArtifacts: [
      'Demucs weights',
      'audio payloads',
      'media payloads',
      'source separation outputs',
      'runtime caches',
      'credentials',
      'provider logs',
    ],
  }
}

function buildReportsReadme() {
  return [
    '# Phase 36K Demucs Provenance Approval Retry Reports',
    '',
    'These reports are safe metadata only. They do not include Demucs packages, pretrained weights, audio, media, source separation outputs, cloud logs, credentials, or private payloads.',
    '',
    'Phase 36K decision: Demucs remains blocked pending training-data provenance and human/legal review. Phase 36L download/runtime must not proceed until a future approval changes this decision.',
  ].join('\n')
}

function buildSummary(status: PhaseStatus): DemucsProvenanceSummary {
  return {
    phase: DEMUCS_PROVENANCE_PHASE,
    runId: DEMUCS_PROVENANCE_RUN_ID,
    status,
    demucsDecision: 'blocked_pending_training_data_provenance',
    audioTimingToolFamilyBetaStatus: 'phase-complete but tool-family incomplete',
    sourceEvidenceStatus: status === 'not_run' ? 'not_run' : 'source_evidence_present',
    licenseEvidenceStatus: status === 'not_run' ? 'not_run' : 'code_and_package_license_evidenced_model_weights_not_approved',
    packageEvidenceStatus: status === 'not_run' ? 'not_run' : 'package_metadata_evidenced_not_approved_for_install',
    modelCandidateStatus: status === 'not_run' ? 'not_run' : 'candidates_inventoried_no_candidate_approved',
    trainingDataProvenanceStatus: 'blocked_pending_training_data_provenance',
    phase36LHandoffStatus: 'blocked',
    nextPhaseDecision: 'Do not proceed to Phase 36L without human/legal approval; audio/timing internal beta gate may only consider Demucs excluded by explicit scoped decision.',
  }
}

async function readJsonIfPresent(filePath: string): Promise<JsonRecord | null> {
  if (!existsSync(filePath)) return null
  try {
    return JSON.parse(await readFile(filePath, 'utf8')) as JsonRecord
  } catch {
    return null
  }
}

async function sha256File(filePath: string): Promise<string> {
  return createHash('sha256').update(await readFile(filePath)).digest('hex')
}

function toStatus(value: unknown, fallback: PhaseStatus): PhaseStatus {
  return ['passed', 'blocked', 'warning', 'not_run', 'skipped'].includes(String(value)) ? value as PhaseStatus : fallback
}

function toBetaStatus(value: unknown, fallback: AudioTimingBetaStatus): AudioTimingBetaStatus {
  const allowed: AudioTimingBetaStatus[] = [
    'blocked',
    'phase-complete but tool-family incomplete',
    'internally beta-ready candidate',
    'external beta still blocked',
  ]
  return allowed.includes(value as AudioTimingBetaStatus) ? value as AudioTimingBetaStatus : fallback
}

function toDecision(value: unknown, fallback: DemucsDecision): DemucsDecision {
  const allowed: DemucsDecision[] = [
    'approved_for_future_guarded_36l_download_runtime_planning',
    'blocked_pending_human_legal_review',
    'blocked_pending_model_artifact_provenance',
    'blocked_pending_training_data_provenance',
    'rejected_for_current_internal_beta_scope',
    'deferred_not_required_for_current_audio_timing_internal_scope',
  ]
  return allowed.includes(value as DemucsDecision) ? value as DemucsDecision : fallback
}
