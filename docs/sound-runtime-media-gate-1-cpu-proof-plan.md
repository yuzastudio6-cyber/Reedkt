# SOUND-RUNTIME-MEDIA-GATE-1 CPU Proof Plan

Gate 1 records the proof sequence for the next prompt. It does not run the controlled CPU install proof.

```json sound-runtime-media-gate-1-cpu-proof-plan
{
  "milestone": "SOUND-RUNTIME-MEDIA-GATE-1",
  "decision": "sound_runtime_media_gate_1_completed_with_warnings_ready_for_controlled_cpu_install_proof",
  "proofScope": "proposed for Gate 1A only",
  "localControlledInstallProofPlan": [
    "create disposable Python virtual environment",
    "install existing pinned SOUND requirements manifest",
    "verify package imports without opening media files",
    "run no-media synthetic smoke assertions",
    "remove disposable environment after proof"
  ],
  "ciProofPlan": [
    "use isolated CI job with no media fixtures",
    "install pinned requirements",
    "run import smoke and no-media synthetic smoke",
    "fail closed on package mutation, media access, model download, GCP, Supabase, or artifact creation"
  ],
  "workerImageProofPlan": [
    "record planned package layer",
    "record planned no-media proof entrypoint",
    "do not create Dockerfile in Gate 1",
    "do not build or push image in Gate 1"
  ],
  "importSmokePlan": {
    "runner": "scripts/validation/sound-oss-tools-4-binary-import-proof-runner.py",
    "allowedAsFutureCommandOnly": true,
    "mediaFileOpenAllowed": false
  },
  "noMediaSyntheticSmokePlan": [
    "numeric array analysis for scipy, resampy, pyloudnorm, audioflux, noisereduce, pedalboard, mir_eval",
    "symbolic MIDI analysis for music21, pretty_midi, mido",
    "pydub module/effect import only; no media operation",
    "audioread import only; no file open"
  ],
  "binaryAbsenceExpectations": [
    "FFmpeg and ffprobe are not required for Gate 1A import proof",
    "pydub media operations remain blocked when FFmpeg or avconv is absent",
    "system binaries remain Track A or Track B handoffs"
  ],
  "failureClassification": [
    "dependency_hydration_failed",
    "package_import_failed",
    "synthetic_no_media_smoke_failed",
    "media_access_attempted",
    "package_mutation_detected",
    "forbidden_runtime_action_detected",
    "environment_blocked"
  ],
  "proposedFutureCommandsNotRunInGate1": [
    "python -m venv .venv-sound-cpu-proof",
    "python -m pip install -r server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt",
    "python scripts/validation/sound-oss-tools-4-binary-import-proof-runner.py"
  ],
  "runtimeReadinessClaim": "blocked_unclaimed",
  "nextPrompt": "SOUND-RUNTIME-MEDIA-GATE-1A: controlled CPU install proof, no media execution"
}
```
