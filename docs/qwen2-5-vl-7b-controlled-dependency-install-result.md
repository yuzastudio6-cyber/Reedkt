# Qwen2.5-VL 7B Controlled Dependency Install Result

## Status

Decision: `qwen2_5_vl_7b_controlled_dependency_install_blocked_python313_numpy_pin_no_inference`

This packet records the controlled dependency install attempt for the Qwen2.5-VL 7B private loader gate. A private worker-style virtual environment was created outside the git worktree, but dependency installation was not run because the binary-only dependency resolution preflight failed on the current macOS arm64 Python 3.13 runtime.

This result does not install Qwen runtime dependencies, import model modules, import `torch`, import `transformers`, import `qwen_vl_utils`, start CUDA, start vLLM, start SGLang, run inference, generate assets, call providers, dispatch workers, mutate GCP, mutate Supabase, execute SQL, run Docker, create public artifacts, create signed URLs, create credits, or unlock beta/production.

## Environment

- Private environment path: `/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/runtime-envs/qwen2.5-vl-7b-loader-py313-macos-arm64-v1`
- Environment inside repo: false
- Environment created: true
- Python version: `3.13.13`
- Platform: `macOS arm64`
- Pip version: `26.0.1`
- Installed target packages: false
- Installed package list contains only `pip`

The environment reported a pip metadata warning during inspection:

```text
Ignoring invalid distribution -pip
```

That warning is recorded as an environment hygiene issue, not as runtime readiness.

## Dependency Resolution Attempt

The preflight used a binary-only dry run before any install:

```text
python -m pip install --dry-run --only-binary=:all: transformers==4.57.1 qwen-vl-utils==0.0.11 Pillow==10.4.0 numpy==1.26.4 torch==2.12.1
```

Result:

- Binary resolution attempted: true
- Dependency install run: false
- Metadata loader import run: false
- Runtime import run: false
- Model inference run: false
- Blocker: `numpy==1.26.4` has no compatible binary for the current Python 3.13 macOS arm64 environment.

The key resolver error was:

```text
No matching distribution found for numpy==1.26.4
```

## Correct Runtime Interpretation

The failure is not a model-weight failure. The private model cache remains the source of truth and was already checksum-verified.

The failure is a local dependency/runtime mismatch:

- Current local Python is `3.13.13`.
- Existing ReEditPro VLM requirements pin `numpy==1.26.4`.
- The worker proof target remains Linux/GPU, not macOS CPU.
- CPU-only Qwen2.5-VL execution remains blocked.

The next step should align the dependency proof with the intended worker runtime: Python 3.11/3.12 or an approved Linux L4 worker environment, without silently changing package pins.

## GPU And CPU Selection

The cost-friendly first GPU target remains NVIDIA L4 on Google Cloud G2:

- First GPU target: `nvidia_l4_google_cloud_g2_first`
- Recommended initial VM shape: `g2-standard-8`
- Minimum import-smoke VM shape: `g2-standard-4`
- Initial `max_model_len`: `2048`
- Initial `max_num_seqs`: `1`
- Image/frame input cap: `384px`

CPU-only execution remains blocked for Qwen2.5-VL 7B. macOS arm64 can be used for dependency planning and resolver evidence, but not for claiming Qwen2.5-VL runtime readiness.

## Tool-Call Ranking

Qwen2.5-VL remains ranked as a visual understanding, planning, and QA stack tool:

1. Source-frame visual scene understanding when deterministic tools are insufficient.
2. Caption safe-zone, visual collision, and layout QA reasoning as advisory metadata.
3. Product/demo/tutorial step recognition as planning metadata.
4. OCR/OpenCV/Remotion QA fallback support.

Qwen2.5-VL is not an AI-video generation route. Wan remains the primary generated B-roll route, LTX remains fast preview/keyframe support, Mochi remains fallback/research, and Hunyuan remains premium gated/blocked pending legal and GPU review.

## Runtime Gates

- `privateDependencyEnvironmentCreated=true`
- `binaryResolutionAttempted=true`
- `dependencyInstallRun=false`
- `metadataLoaderImportRun=false`
- `runtimeImportRun=false`
- `modelInferenceRun=false`
- `cudaInitialized=false`
- `vllmStarted=false`
- `sglangStarted=false`
- `apiServerStarted=false`
- `generatedVideoCreated=false`
- `generatedAssetsCreated=false`
- `providerCallsMade=false`
- `workersDispatched=false`
- `supabaseTouched=false`
- `sqlExecuted=false`
- `gcpMutationCreated=false`
- `dockerRun=false`
- `publicArtifactsCreated=false`
- `signedUrlsCreated=false`
- `creditMutationCreated=false`
- `betaUnlocked=false`
- `productionUnlocked=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## Remaining Blockers

- Python 3.13 macOS arm64 is not compatible with the pinned `numpy==1.26.4` binary requirement.
- The private environment has a pip metadata warning that should not be used for runtime proof.
- No metadata loader import has passed.
- No vLLM or SGLang runtime import has passed.
- No L4/G2 worker environment has installed the dependency set.
- No inference, generated fixture, user-media fixture, beta route, or production route is approved.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_6: align Qwen2.5-VL dependency runtime to Python 3.12 or Linux L4 worker, no inference`
