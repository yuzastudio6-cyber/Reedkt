# SOUND-RUNTIME-MEDIA-GATE-2A Tool-Call Register

```json sound-runtime-media-gate-2a-tool-call-register
{
  "milestone": "SOUND-RUNTIME-MEDIA-GATE-2A",
  "decision": "sound_runtime_media_gate_2a_controlled_synthetic_tool_call_proof_passed_with_warnings_ready_for_tool_call_owner_review",
  "toolCandidateCount": 15,
  "directPackageCount": 13,
  "aliasToolCount": 2,
  "toolCalls": [
    {
      "toolId": "librosa",
      "version": "0.11.0",
      "probe": "librosa.feature.rms",
      "input": "synthetic_float32_sine_array",
      "status": "passed"
    },
    {
      "toolId": "audioread",
      "version": "3.1.0",
      "probe": "audioread.available_backends_no_audio_open",
      "input": "no_media_file",
      "status": "passed",
      "blockedOperations": ["audioread.audio_open", "media_file_open"]
    },
    {
      "toolId": "pydub",
      "version": "0.25.1",
      "probe": "pydub.AudioSegment.silent_gain_fade_no_file_io",
      "input": "synthetic_silent_segment",
      "status": "passed",
      "blockedOperations": ["AudioSegment.from_file", "AudioSegment.export", "ffmpeg", "ffprobe"]
    },
    {
      "toolId": "pydub_effects",
      "coveredBy": "pydub",
      "probe": "pydub.apply_gain_fade_no_file_io",
      "input": "synthetic_silent_segment",
      "status": "passed",
      "coverage": "alias"
    },
    {
      "toolId": "scipy",
      "version": "1.17.1",
      "probe": "scipy.signal.find_peaks",
      "input": "synthetic_float32_sine_array",
      "status": "passed"
    },
    {
      "toolId": "resampy",
      "version": "0.4.3",
      "probe": "resampy.resample",
      "input": "synthetic_float32_sine_array",
      "status": "passed"
    },
    {
      "toolId": "pyloudnorm",
      "version": "0.2.0",
      "probe": "pyloudnorm.Meter.integrated_loudness",
      "input": "synthetic_float32_sine_array",
      "status": "passed"
    },
    {
      "toolId": "ebu_r128_pyloudnorm",
      "coveredBy": "pyloudnorm",
      "probe": "pyloudnorm.EBU_R128_integrated_loudness",
      "input": "synthetic_float32_sine_array",
      "status": "passed",
      "coverage": "alias"
    },
    {
      "toolId": "audioflux",
      "version": "0.1.9",
      "probe": "audioflux.BFT.bft",
      "input": "synthetic_float32_sine_array",
      "status": "passed"
    },
    {
      "toolId": "music21",
      "version": "10.3.0",
      "probe": "music21.stream_note_construction",
      "input": "synthetic_note_stream",
      "status": "passed"
    },
    {
      "toolId": "pretty_midi",
      "version": "0.2.11",
      "probe": "pretty_midi.in_memory_note",
      "input": "synthetic_midi_note",
      "status": "passed"
    },
    {
      "toolId": "mido",
      "version": "1.3.3",
      "probe": "mido.Message.bytes",
      "input": "synthetic_note_on_message",
      "status": "passed"
    },
    {
      "toolId": "noisereduce",
      "version": "3.0.3",
      "probe": "noisereduce.reduce_noise_synthetic_array",
      "input": "synthetic_noisy_float32_array",
      "status": "passed"
    },
    {
      "toolId": "pedalboard",
      "version": "0.9.23",
      "probe": "pedalboard.Gain_synthetic_array",
      "input": "synthetic_float32_audio_array",
      "status": "passed"
    },
    {
      "toolId": "mir_eval",
      "version": "0.8.2",
      "probe": "mir_eval.onset.f_measure",
      "input": "synthetic_onset_timestamps",
      "status": "passed"
    }
  ],
  "allSyntheticToolCallsPassed": true,
  "acceptedForWorkerExecutionToday": false,
  "acceptedForMediaProcessingToday": false,
  "acceptedForExternalBetaToday": false
}
```
