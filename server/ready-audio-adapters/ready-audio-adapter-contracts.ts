import type {
  ProductionStorageBucketPurpose,
  QualityGateType,
  ToolArtifactType,
} from '../../src/backend/contracts/production-tool-runtime-contracts'
import type { ProductionWorkerRuntimeType } from '../workers/production/production-worker-types'
import {
  READY_AUDIO_ADAPTER_TOOL_IDS,
  READY_AUDIO_LICENSE_REVIEW_TOOL_IDS,
  type ReadyAudioAdapterExecutionMode,
  type ReadyAudioAdapterToolId,
} from './ready-audio-adapter-schemas'

export interface ReadyAudioAdapterArtifactRequirement {
  artifactType: ToolArtifactType
  storageBucketPurpose: ProductionStorageBucketPurpose
  required: boolean
  description: string
}

export interface ReadyAudioAdapterQAContract {
  checkId: string
  gateType?: QualityGateType
  required: boolean
  description: string
}

export interface ReadyAudioAdapterContract {
  toolId: ReadyAudioAdapterToolId
  displayName: string
  capability: string
  userFacingActivity: string
  workerType: ProductionWorkerRuntimeType
  allowedExecutionModes: ReadyAudioAdapterExecutionMode[]
  inputManifest: ReadyAudioAdapterArtifactRequirement[]
  outputManifest: ReadyAudioAdapterArtifactRequirement[]
  qaChecks: ReadyAudioAdapterQAContract[]
  boundedExecutionScope: string
  implementationBoundary: string
  licenseReviewRequired: boolean
}

const commonAudioQA: ReadyAudioAdapterQAContract[] = [
  {
    checkId: 'approved_snapshot_credit_gate',
    required: true,
    description: 'Approved snapshot, credit estimate, credit reservation, and idempotency must be present before any backend dispatch.',
  },
  {
    checkId: 'private_artifact_manifest',
    required: true,
    description: 'All audio inputs and planned outputs must use private source-of-truth artifact manifest paths, not signed URLs or raw URLs.',
  },
  {
    checkId: 'tool_result_schema',
    required: true,
    description: 'Adapter output must parse as a ready-audio tool result schema before dispatch is considered valid.',
  },
  {
    checkId: 'chat_summary_no_raw_tool_names',
    required: true,
    description: 'User-facing chat status must describe the edit activity and not expose raw library/tool identifiers by default.',
  },
]

const sourceAudioInput: ReadyAudioAdapterArtifactRequirement = {
  artifactType: 'source_media',
  storageBucketPurpose: 'source_media',
  required: true,
  description: 'Approved private source audio or source media reference for the bounded backend audio job.',
}

function analysisOutputs(description: string): ReadyAudioAdapterArtifactRequirement[] {
  return [
    {
      artifactType: 'audio_analysis_json',
      storageBucketPurpose: 'analysis_artifacts',
      required: true,
      description,
    },
    {
      artifactType: 'qa_report',
      storageBucketPurpose: 'qa_artifacts',
      required: true,
      description: 'Private QA report for the bounded audio/music adapter result.',
    },
  ]
}

function cleanedAudioOutputs(description: string): ReadyAudioAdapterArtifactRequirement[] {
  return [
    {
      artifactType: 'cleaned_audio',
      storageBucketPurpose: 'generated_assets',
      required: true,
      description,
    },
    {
      artifactType: 'qa_report',
      storageBucketPurpose: 'qa_artifacts',
      required: true,
      description: 'Private QA report for cleanup/effects naturalness, loudness, and sync checks.',
    },
  ]
}

function adapter(input: Omit<ReadyAudioAdapterContract, 'allowedExecutionModes' | 'inputManifest' | 'workerType' | 'licenseReviewRequired'> & {
  workerType?: ProductionWorkerRuntimeType
  inputManifest?: ReadyAudioAdapterArtifactRequirement[]
  licenseReviewRequired?: boolean
}): ReadyAudioAdapterContract {
  return {
    ...input,
    workerType: input.workerType ?? 'cpu_analysis_worker',
    allowedExecutionModes: ['dry_run', 'bounded_execution'],
    inputManifest: input.inputManifest ?? [sourceAudioInput],
    licenseReviewRequired: input.licenseReviewRequired ?? (READY_AUDIO_LICENSE_REVIEW_TOOL_IDS as readonly string[]).includes(input.toolId),
  }
}

export const READY_AUDIO_ADAPTER_CONTRACTS = {
  librosa: adapter({
    toolId: 'librosa',
    displayName: 'librosa',
    capability: 'Feature, tempo, onset, beat, and spectral analysis support for approved audio recipes.',
    userFacingActivity: 'audio timing and feature analysis',
    outputManifest: analysisOutputs('Private feature, rhythm, onset, or spectral analysis report.'),
    qaChecks: [
      ...commonAudioQA,
      { checkId: 'feature_timing_consistency', gateType: 'audio_sync', required: true, description: 'Feature and timing outputs must remain aligned to approved source timing.' },
    ],
    boundedExecutionScope: 'Approved backend audio analysis only; no frontend execution, media export, model download, or provider call.',
    implementationBoundary: 'Adapter contract and gateway hook only. This pack does not import librosa or process audio.',
  }),
  audioread: adapter({
    toolId: 'audioread',
    displayName: 'audioread',
    capability: 'Audio decode support for bounded CPU analysis recipes.',
    userFacingActivity: 'source audio compatibility check',
    outputManifest: analysisOutputs('Private audio decode compatibility and metadata report.'),
    qaChecks: [
      ...commonAudioQA,
      { checkId: 'decode_metadata_only', gateType: 'render_asset_integrity', required: true, description: 'Decode checks must remain metadata-only and must not create final media outputs.' },
    ],
    boundedExecutionScope: 'Approved decode metadata support only against private artifacts.',
    implementationBoundary: 'Adapter contract and gateway hook only. This pack does not import audioread or decode audio.',
  }),
  pydub: adapter({
    toolId: 'pydub',
    displayName: 'pydub',
    capability: 'Simple slicing, gain, fade, and cleanup preparation support for approved audio recipes.',
    userFacingActivity: 'simple audio cleanup preparation',
    outputManifest: cleanedAudioOutputs('Private cleaned/prepared audio candidate when a bounded backend recipe is later approved.'),
    qaChecks: [
      ...commonAudioQA,
      { checkId: 'cleanup_naturalness', gateType: 'audio_naturalness', required: true, description: 'Cleanup preparation must preserve natural speech/music quality and avoid final mux/export.' },
    ],
    boundedExecutionScope: 'Approved private audio cleanup preparation only; no final mix, mux, export, or browser execution.',
    implementationBoundary: 'Adapter contract and gateway hook only. This pack does not import pydub or mutate media.',
  }),
  scipy: adapter({
    toolId: 'scipy',
    displayName: 'SciPy',
    capability: 'Signal-processing support for bounded backend audio analysis recipes.',
    userFacingActivity: 'signal quality analysis',
    outputManifest: analysisOutputs('Private signal quality or transform analysis report.'),
    qaChecks: [
      ...commonAudioQA,
      { checkId: 'signal_analysis_bounds', gateType: 'audio_naturalness', required: true, description: 'Signal analysis must be bounded to approved recipe settings and private artifacts.' },
    ],
    boundedExecutionScope: 'Approved CPU signal analysis only; no arbitrary numerical jobs or frontend execution.',
    implementationBoundary: 'Adapter contract and gateway hook only. This pack does not import SciPy or process audio.',
  }),
  resampy: adapter({
    toolId: 'resampy',
    displayName: 'resampy',
    capability: 'Resampling support for approved audio worker recipes.',
    userFacingActivity: 'audio sample-rate compatibility check',
    outputManifest: analysisOutputs('Private sample-rate compatibility or resampling-plan report.'),
    qaChecks: [
      ...commonAudioQA,
      { checkId: 'sample_rate_plan', gateType: 'audio_sync', required: true, description: 'Resampling plans must preserve timing and approved audio duration.' },
    ],
    boundedExecutionScope: 'Approved sample-rate planning/support only; no final mix/export.',
    implementationBoundary: 'Adapter contract and gateway hook only. This pack does not import resampy or resample audio.',
  }),
  pyloudnorm: adapter({
    toolId: 'pyloudnorm',
    displayName: 'pyloudnorm',
    capability: 'Loudness measurement and EBU R128 support for approved audio QA recipes.',
    userFacingActivity: 'loudness check',
    outputManifest: analysisOutputs('Private loudness measurement and normalization recommendation report.'),
    qaChecks: [
      ...commonAudioQA,
      { checkId: 'loudness_target_policy', gateType: 'audio_loudness', required: true, description: 'Loudness outputs must respect approved target/range policy and speech clarity.' },
    ],
    boundedExecutionScope: 'Approved loudness analysis only; no silent gain mutation or export.',
    implementationBoundary: 'Adapter contract and gateway hook only. This pack does not import pyloudnorm or process audio.',
  }),
  audioflux: adapter({
    toolId: 'audioflux',
    displayName: 'AudioFlux',
    capability: 'Spectral, rhythm, and SoundSync cue analysis support.',
    userFacingActivity: 'music cue inspection',
    outputManifest: analysisOutputs('Private spectral, rhythm, or SoundSync cue report.'),
    qaChecks: [
      ...commonAudioQA,
      { checkId: 'cue_alignment', gateType: 'music_over_voice', required: true, description: 'Cue reports must preserve speech-safe timing and approved beat-grid policy.' },
    ],
    boundedExecutionScope: 'Approved backend music/audio analysis only; no model download, media export, or frontend execution.',
    implementationBoundary: 'Adapter contract and gateway hook only. This pack does not import AudioFlux or process audio.',
  }),
  music21: adapter({
    toolId: 'music21',
    displayName: 'music21',
    capability: 'Symbolic music structure analysis support for approved music-lane recipes.',
    userFacingActivity: 'music structure analysis',
    outputManifest: analysisOutputs('Private symbolic music structure and timing report.'),
    qaChecks: [
      ...commonAudioQA,
      { checkId: 'symbolic_music_scope', gateType: 'music_over_voice', required: true, description: 'Symbolic analysis must remain private and cannot create or publish generated music.' },
    ],
    boundedExecutionScope: 'Approved symbolic music analysis only; no public artifacts, generation, or export.',
    implementationBoundary: 'Adapter contract and gateway hook only. This pack does not import music21 or read music files.',
  }),
  pretty_midi: adapter({
    toolId: 'pretty_midi',
    displayName: 'pretty_midi',
    capability: 'MIDI structure and timing support for approved music-lane recipes.',
    userFacingActivity: 'MIDI timing analysis',
    outputManifest: analysisOutputs('Private MIDI structure and timing report.'),
    qaChecks: [
      ...commonAudioQA,
      { checkId: 'midi_timing_scope', gateType: 'audio_sync', required: true, description: 'MIDI timing analysis must not generate final audio or publish MIDI artifacts.' },
    ],
    boundedExecutionScope: 'Approved MIDI metadata analysis only; no final audio generation or export.',
    implementationBoundary: 'Adapter contract and gateway hook only. This pack does not import pretty_midi or read MIDI files.',
  }),
  mido: adapter({
    toolId: 'mido',
    displayName: 'mido',
    capability: 'Low-level MIDI message validation support for approved music-lane recipes.',
    userFacingActivity: 'MIDI message validation',
    outputManifest: analysisOutputs('Private MIDI validation and message-shape report.'),
    qaChecks: [
      ...commonAudioQA,
      { checkId: 'midi_message_scope', gateType: 'audio_sync', required: true, description: 'MIDI validation must stay metadata-only and private.' },
    ],
    boundedExecutionScope: 'Approved MIDI metadata validation only.',
    implementationBoundary: 'Adapter contract and gateway hook only. This pack does not import mido or read MIDI files.',
  }),
  noisereduce: adapter({
    toolId: 'noisereduce',
    displayName: 'noisereduce',
    capability: 'Noise-reduction candidate support with naturalness QA.',
    userFacingActivity: 'noise cleanup preparation',
    outputManifest: cleanedAudioOutputs('Private denoise candidate only when a bounded backend cleanup recipe is later approved.'),
    qaChecks: [
      ...commonAudioQA,
      { checkId: 'denoise_naturalness', gateType: 'audio_naturalness', required: true, description: 'Noise reduction must preserve speech/music quality and avoid artifacts.' },
    ],
    boundedExecutionScope: 'Approved private denoise candidate only; no final mix/export or model download.',
    implementationBoundary: 'Adapter contract and gateway hook only. This pack does not import noisereduce or alter audio.',
  }),
  pedalboard: adapter({
    toolId: 'pedalboard',
    displayName: 'Pedalboard',
    capability: 'Future effects evaluation candidate.',
    userFacingActivity: 'effects preparation review',
    outputManifest: cleanedAudioOutputs('Private effects candidate only after a separate owner/license approval gate.'),
    qaChecks: [
      ...commonAudioQA,
      { checkId: 'effects_license_review', gateType: 'audio_naturalness', required: true, description: 'Effects execution remains blocked until owner/license review explicitly approves this package.' },
    ],
    boundedExecutionScope: 'Blocked pending owner/license review; no backend execution is allowed by this adapter pack.',
    implementationBoundary: 'Adapter contract and gateway hook only. This pack blocks Pedalboard execution until a later approval.',
    licenseReviewRequired: true,
  }),
  mir_eval: adapter({
    toolId: 'mir_eval',
    displayName: 'mir_eval',
    capability: 'Music-information-retrieval metric QA support.',
    userFacingActivity: 'music analysis QA',
    workerType: 'qa_worker',
    outputManifest: analysisOutputs('Private MIR metric QA report.'),
    qaChecks: [
      ...commonAudioQA,
      { checkId: 'mir_metric_private_qa', gateType: 'music_over_voice', required: true, description: 'Metric reports must remain private QA evidence and not product-ready claims.' },
    ],
    boundedExecutionScope: 'Approved QA metric report only; no media mutation or final output.',
    implementationBoundary: 'Adapter contract and gateway hook only. This pack does not import mir_eval or evaluate audio.',
  }),
  pydub_effects: adapter({
    toolId: 'pydub_effects',
    displayName: 'pydub effects',
    capability: 'Pydub effects wrapper for simple approved cleanup/effects recipes.',
    userFacingActivity: 'simple audio effects preparation',
    outputManifest: cleanedAudioOutputs('Private pydub effects candidate only when a bounded backend recipe is later approved.'),
    qaChecks: [
      ...commonAudioQA,
      { checkId: 'effects_naturalness', gateType: 'audio_naturalness', required: true, description: 'Simple effects must preserve speech clarity and avoid final mux/export.' },
    ],
    boundedExecutionScope: 'Approved simple private effects preparation only; no final mix/export.',
    implementationBoundary: 'Adapter contract and gateway hook only. This pack does not import pydub.effects or alter audio.',
  }),
  ebu_r128_pyloudnorm: adapter({
    toolId: 'ebu_r128_pyloudnorm',
    displayName: 'EBU R128 pyloudnorm',
    capability: 'EBU R128 loudness QA wrapper over pyloudnorm.',
    userFacingActivity: 'broadcast loudness QA',
    outputManifest: analysisOutputs('Private EBU R128 loudness QA report.'),
    qaChecks: [
      ...commonAudioQA,
      { checkId: 'ebu_r128_policy', gateType: 'audio_loudness', required: true, description: 'EBU R128 checks must remain QA evidence and cannot silently normalize/export audio.' },
    ],
    boundedExecutionScope: 'Approved loudness QA only; no silent gain mutation or export.',
    implementationBoundary: 'Adapter contract and gateway hook only. This pack does not import pyloudnorm or process audio.',
  }),
} as const satisfies Record<ReadyAudioAdapterToolId, ReadyAudioAdapterContract>

export function getReadyAudioAdapterContract(toolId: ReadyAudioAdapterToolId): ReadyAudioAdapterContract {
  return READY_AUDIO_ADAPTER_CONTRACTS[toolId]
}

export function listReadyAudioAdapterContracts(): ReadyAudioAdapterContract[] {
  return READY_AUDIO_ADAPTER_TOOL_IDS.map((toolId) => READY_AUDIO_ADAPTER_CONTRACTS[toolId])
}
