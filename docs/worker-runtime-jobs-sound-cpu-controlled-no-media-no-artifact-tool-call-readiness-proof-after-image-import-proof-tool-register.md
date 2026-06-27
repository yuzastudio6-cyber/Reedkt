# WORKER_RUNTIME_JOBS SOUND CPU Controlled No-Media No-Artifact Tool-Call Readiness Proof Tool Register After Image Import Proof

```json worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-tool-call-readiness-proof-after-image-import-proof-tool-register
{
  "label": "worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-tool-call-readiness-proof-after-image-import-proof-tool-register",
  "decision": "worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_tool_call_readiness_proof_after_image_import_proof_passed_with_warnings_ready_for_tool_call_readiness_owner_review_after_image_import_proof",
  "toolCalls": [
    {
      "toolId": "librosa",
      "packageVersion": "0.11.0",
      "metadataStatus": "passed",
      "importStatus": "passed",
      "probeStatus": "passed",
      "probe": "librosa.feature.rms"
    },
    {
      "toolId": "audioread",
      "packageVersion": "3.1.0",
      "metadataStatus": "passed",
      "importStatus": "passed",
      "probeStatus": "passed",
      "probe": "audioread.available_backends_no_audio_open"
    },
    {
      "toolId": "pydub",
      "packageVersion": "0.25.1",
      "metadataStatus": "passed",
      "importStatus": "passed",
      "probeStatus": "passed",
      "probe": "pydub.AudioSegment.silent_gain_fade_no_file_io"
    },
    {
      "toolId": "scipy",
      "packageVersion": "1.17.1",
      "metadataStatus": "passed",
      "importStatus": "passed",
      "probeStatus": "passed",
      "probe": "scipy.signal.find_peaks"
    },
    {
      "toolId": "resampy",
      "packageVersion": "0.4.3",
      "metadataStatus": "passed",
      "importStatus": "passed",
      "probeStatus": "passed",
      "probe": "resampy.resample"
    },
    {
      "toolId": "pyloudnorm",
      "packageVersion": "0.2.0",
      "metadataStatus": "passed",
      "importStatus": "passed",
      "probeStatus": "passed",
      "probe": "pyloudnorm.Meter.integrated_loudness"
    },
    {
      "toolId": "audioflux",
      "packageVersion": "0.1.9",
      "metadataStatus": "passed",
      "importStatus": "passed",
      "probeStatus": "passed",
      "probe": "audioflux.BFT.bft"
    },
    {
      "toolId": "music21",
      "packageVersion": "10.3.0",
      "metadataStatus": "passed",
      "importStatus": "passed",
      "probeStatus": "passed",
      "probe": "music21.stream_note_construction"
    },
    {
      "toolId": "pretty_midi",
      "packageVersion": "0.2.11",
      "metadataStatus": "passed",
      "importStatus": "passed",
      "probeStatus": "passed",
      "probe": "pretty_midi.in_memory_note"
    },
    {
      "toolId": "mido",
      "packageVersion": "1.3.3",
      "metadataStatus": "passed",
      "importStatus": "passed",
      "probeStatus": "passed",
      "probe": "mido.Message.bytes"
    },
    {
      "toolId": "noisereduce",
      "packageVersion": "3.0.3",
      "metadataStatus": "passed",
      "importStatus": "passed",
      "probeStatus": "passed",
      "probe": "noisereduce.reduce_noise_synthetic_array"
    },
    {
      "toolId": "pedalboard",
      "packageVersion": "0.9.23",
      "metadataStatus": "passed",
      "importStatus": "passed",
      "probeStatus": "passed",
      "probe": "pedalboard.Gain_synthetic_array"
    },
    {
      "toolId": "mir_eval",
      "packageVersion": "0.8.2",
      "metadataStatus": "passed",
      "importStatus": "passed",
      "probeStatus": "passed",
      "probe": "mir_eval.onset.f_measure"
    },
    {
      "toolId": "pydub_effects",
      "coveredBy": "pydub",
      "coverage": "alias",
      "metadataStatus": "covered_by_parent_package",
      "importStatus": "covered_by_parent_package",
      "probeStatus": "passed",
      "probe": "pydub.apply_gain_fade_no_file_io"
    },
    {
      "toolId": "ebu_r128_pyloudnorm",
      "coveredBy": "pyloudnorm",
      "coverage": "alias",
      "metadataStatus": "covered_by_parent_package",
      "importStatus": "covered_by_parent_package",
      "probeStatus": "passed",
      "probe": "pyloudnorm.EBU_R128_integrated_loudness"
    }
  ],
  "counts": {
    "toolCandidateCount": 15,
    "directPackageCount": 13,
    "aliasToolCount": 2,
    "metadataPassedCount": 13,
    "importPassedCount": 13,
    "probePassedCount": 15,
    "probeFailedCount": 0,
    "readyForOwnerReviewCount": 15,
    "readyForExternalBetaCount": 0,
    "readyForProductionCount": 0
  }
}
```
