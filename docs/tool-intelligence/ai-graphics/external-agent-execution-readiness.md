# AI Graphics External Agent Execution Readiness

Decision: `ai_graphics_external_agent_execution_readiness_all21_evaluated_with_gpu_model_blocks`

Status: `external_agent_call_ready_for_all21_runtime_execution_ready_for13_plus_private_gpu_model_proof_subset`

This is the strict all-21 external-agent readiness report. It separates `callable` from `executable`: all 21 tools can receive controlled private requests, 13 tools execute controlled local adapters now, and those 13 are also proven through the mock worker-claim-to-canonical-route smoke. The eight GPU/model tools now carry explicit install-proof linkage from `gpu-model-install-build-targets`: their package/runtime images were proved at install/import-smoke level, while runtime execution still requires private proof refs and tool-specific inputs. CPU foundation proof applies to `torch_torchvision` and `transformers`, CPU tensor proof applies to `kornia`, accepted CPU-model route proof currently applies to `rembg` only; `real_esrgan` and `transparent_background` remain blocked on this host until bounded runtime proof completes or a proper CUDA/runtime target is used. Native CUDA remains required for `sam2` and `birefnet`. The mounted route also proves a capability-mismatch request returns `failed_with_diagnostics` without invoking an adapter. GPU runtime is on-demand only and does not start idle.

## State Definitions

- `callable`: The external agent can submit the controlled private route request.
- `executable`: The controlled adapter performed bounded runtime work and produced structured private output evidence.
- `blocked_with_reason`: The request shape is valid, but a required runtime/model/input prerequisite is absent.
- `failed_with_diagnostics`: Execution was attempted or route validation failed and the row includes an actionable reason.

## Execution Scope

- `agentCanSubmitControlledRequestsForAll21`: true
- `agentCanExecuteAnyControlledToolNow`: true
- `agentCanExecute13NonGpuControlledToolsNow`: true
- `agentCanExecuteGpuModelToolsNow`: false
- `agentCanExecuteAll21ControlledToolsNow`: false
- `agentExecutableToolCountNow`: 13
- `agentExecutableNonGpuToolCountNow`: 13
- `agentExecutableGpuModelToolCountNow`: 0
- `gpuModelBlockedToolCountNow`: 8
- `currentHostGpuProofPreflightRequested`: false
- `currentHostEligibleForGpuProof`: false
- `currentHostGpuProofBlockers`: none
- `currentHostGpuProofPreflightCommand`: npm run --silent ai-graphics:external-agent-execution-readiness -- --detect-host
- `agentCanExecuteGpuModelProofSubsetNow`: true
- `agentExecutableToolCountWithAcceptedProofNow`: 17
- `agentExecutableGpuModelProofSubsetToolCountNow`: 4
- `gpuModelBlockedToolCountWithAcceptedProofNow`: 4
- `acceptedProofSubsetGpuToolIds`: torch_torchvision; transformers; kornia; rembg

## Install Proof Linkage

- GPU/model install proof source: `docker_ai_graphics_install_proof_targets_for_8_gpu_model_tools`
- All eight GPU/model install-proof targets built locally: `true`
- Native GPU runtime still required before model execution: `true`
- Guard: install/import-smoke proof is not runtime execution proof and does not start native GPU, load model weights, process media, create public artifacts, or sign URLs.

## CPU-Safe GPU/Model Controlled Route Proof

- Status: `cpu_safe_gpu_model_route_proof_executed_for_3_tools_16_total_controlled_route_tools_executable`
- Attempted: `true`
- Accepted: `true`
- Expected tools: `torch_torchvision, transformers, kornia`
- Executed tools: `torch_torchvision, transformers, kornia`
- Executable tool count with this local proof: `16`
- Remaining GPU/model blocked tools: `sam2, birefnet, real_esrgan, rembg, transparent_background`
- Proof command: `npm run --silent ai-graphics:external-agent-all21-controlled-route-execution-smoke -- --scoped-gpu-tool torch_torchvision,transformers,kornia --scoped-gpu-runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --scoped-gpu-runtime-container-platform linux/amd64 --scoped-gpu-allow-cpu-foundation-runtime --scoped-gpu-allow-cpu-tensor-runtime --scoped-gpu-output-root .local-artifacts/ai-graphics/gpu-model-route-runtime-attempt-cpu-safe-diagnostic --scoped-gpu-source-image .local-artifacts/ai-graphics/gpu-model-route-private-input-preflight-diagnostic/inputs/private-approved-frame.ppm`
- Proof output root: `.local-artifacts/ai-graphics/gpu-model-route-runtime-attempt-cpu-safe-diagnostic`
- Proof source image: `.local-artifacts/ai-graphics/gpu-model-route-private-input-preflight-diagnostic/inputs/private-approved-frame.ppm`
- Guard: this proof uses the scoped controlled external-agent route, keeps GPU idle for CPU-safe model tools, writes only local private artifacts, and does not approve the five remaining model tools.

| Tool | State | Output kind | Output hash | Local GPU/model runtime performed | GPU starts now | Adapter executed |
| --- | --- | --- | --- | ---: | ---: | ---: |
| `torch_torchvision` | `executable` | `gpu_model_runtime_json` | `482dfe2900624db09aa980e13ab170c33ab9da2633b14e0fe6b935585ca90bdb` | true | false | true |
| `transformers` | `executable` | `gpu_model_runtime_json` | `f9bfc70b8d7e86679703d2ef255e6e166616187d3a5e28eeaef0760c68f3e22f` | true | false | true |
| `kornia` | `executable` | `gpu_model_runtime_json` | `acf3d68d835ffe3fbc5190108d919205b6343c3a2cfec3dd701bbf355e87b69e` | true | false | true |

## CPU-Model GPU/Model Controlled Route Proof

- Status: `cpu_model_gpu_model_route_proof_executed_for_1_tool_17_total_controlled_route_tools_executable`
- Attempted: `true`
- Accepted: `true`
- Expected tools: `rembg`
- Executed tools: `rembg`
- Combined GPU/model proof tools: `torch_torchvision, transformers, kornia, rembg`
- Executable tool count with CPU-safe plus CPU-model local proof: `17`
- Remaining GPU/model blocked tools: `sam2, birefnet, real_esrgan, transparent_background`
- Tools investigated but still blocked on this host: `real_esrgan, transparent_background`
- Proof command: `npm run --silent ai-graphics:external-agent-all21-controlled-route-execution-smoke -- --scoped-gpu-tool rembg --scoped-gpu-runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --scoped-gpu-runtime-container-platform linux/amd64 --scoped-gpu-timeout-ms 120000 --scoped-gpu-allow-cpu-model-runtime --scoped-gpu-output-root .local-artifacts/ai-graphics/gpu-model-route-runtime-attempt-cpu-model-diagnostic --scoped-gpu-source-image .local-artifacts/ai-graphics/gpu-model-route-private-input-preflight-diagnostic/inputs/private-approved-frame-96.ppm --scoped-gpu-rembg-model .local-artifacts/ai-graphics/private-model-cache/rembg/u2netp.onnx`
- Proof output root: `.local-artifacts/ai-graphics/gpu-model-route-runtime-attempt-cpu-model-diagnostic`
- Proof source image: `.local-artifacts/ai-graphics/gpu-model-route-private-input-preflight-diagnostic/inputs/private-approved-frame-96.ppm`
- Guard: this proof accepts only `rembg` because it produced structured private output through the mounted controlled route with CPU model runtime and GPU idle. `real_esrgan` and `transparent_background` remain blocked on this host until their runtime-performance proof completes or a proper native/GPU runtime target is used.

| Tool | State | Output kind | Output hash | Local GPU/model runtime performed | GPU starts now | Adapter executed |
| --- | --- | --- | --- | ---: | ---: | ---: |
| `rembg` | `executable` | `gpu_model_runtime_json` | `d545a21d0d8d61dcef679caff0fa4884f9aadc9f45e7127c6e384474b864d448` | true | false | true |

## Tool Rows

| Tool | Group | Install proof profile | Install proof present | Install/runtime state | Readiness state | Callable | Executable | Worker-route evidence accepted | Current blocker | Remaining private runtime inputs | Minimum private runtime inputs | Next exact command | Blocking prerequisite |
| --- | --- | --- | ---: | --- | --- | ---: | ---: | ---: | --- | --- | --- | --- | --- |
| `torch_torchvision` | `gpu_model` | `gpu_worker_ai_graphics` | true | `install_target_prepared_runtime_blocked_pending_cpu_foundation_private_inputs` | `blocked_with_reason` | true | false | true | `outputDirectory` | `pythonCpuFoundationRuntime` | `outputDirectory, pythonCpuFoundationRuntime` | `npm run --silent ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness -- --attempt-local-runtime --tool torch_torchvision --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run> --result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json --allow-cpu-foundation-runtime` | `approved local Python CPU foundation runtime; outputDirectory; pythonCpuFoundationRuntime; reviewed private proof refs; adapter skip reason: foundation_runtime_output_directory_missing` |
| `transformers` | `gpu_model` | `gpu_worker_ai_graphics` | true | `install_target_prepared_runtime_blocked_pending_cpu_foundation_private_inputs` | `blocked_with_reason` | true | false | true | `outputDirectory` | `pythonCpuFoundationRuntime` | `outputDirectory, pythonCpuFoundationRuntime` | `npm run --silent ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness -- --attempt-local-runtime --tool transformers --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run> --result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json --allow-cpu-foundation-runtime` | `approved local Python CPU foundation runtime; outputDirectory; pythonCpuFoundationRuntime; reviewed private proof refs; adapter skip reason: foundation_runtime_output_directory_missing` |
| `sam2` | `gpu_model` | `sam2` | true | `install_target_prepared_runtime_blocked_pending_cuda_private_inputs` | `blocked_with_reason` | true | false | true | `sam2CheckpointLocalPath` | `outputDirectory, nativeCudaRuntime, sourceImageLocalPath, modelWeightManifestEvidence` | `outputDirectory, nativeCudaRuntime, sourceImageLocalPath, sam2CheckpointLocalPath, modelWeightManifestEvidence` | `npm run --silent ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness -- --attempt-local-runtime --tool sam2 --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run> --result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json --source-image <private-approved-frame.png> --sam2-checkpoint <private-sam2-checkpoint.pt>` | `approved native CUDA host; outputDirectory; nativeCudaRuntime; sourceImageLocalPath; sam2CheckpointLocalPath; modelWeightManifestEvidence; reviewed private proof refs; adapter skip reason: sam2_checkpoint_missing` |
| `birefnet` | `gpu_model` | `birefnet` | true | `install_target_prepared_runtime_blocked_pending_cuda_private_inputs` | `blocked_with_reason` | true | false | true | `birefnetModelLocalPath` | `outputDirectory, nativeCudaRuntime, sourceImageLocalPath, modelWeightManifestEvidence` | `outputDirectory, nativeCudaRuntime, sourceImageLocalPath, birefnetModelLocalPath, modelWeightManifestEvidence` | `npm run --silent ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness -- --attempt-local-runtime --tool birefnet --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run> --result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json --source-image <private-approved-frame.png> --birefnet-model <private-birefnet-model>` | `approved native CUDA host; outputDirectory; nativeCudaRuntime; sourceImageLocalPath; birefnetModelLocalPath; modelWeightManifestEvidence; reviewed private proof refs; adapter skip reason: birefnet_model_missing` |
| `real_esrgan` | `gpu_model` | `real_esrgan` | true | `install_target_prepared_runtime_blocked_pending_cpu_model_private_inputs` | `blocked_with_reason` | true | false | true | `realEsrganModelLocalPath` | `outputDirectory, pythonCpuModelRuntime, sourceImageLocalPath, modelWeightManifestEvidence` | `outputDirectory, pythonCpuModelRuntime, sourceImageLocalPath, realEsrganModelLocalPath, modelWeightManifestEvidence` | `npm run --silent ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness -- --attempt-local-runtime --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-real-esrgan-runtime:proof-local --runtime-container-platform linux/amd64 --no-runtime-container-gpu --tool real_esrgan --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run> --result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json --allow-cpu-model-runtime --source-image <private-approved-frame.png> --real-esrgan-model <private-real-esrgan-model.pth>` | `approved local Python/Docker CPU model runtime; outputDirectory; pythonCpuModelRuntime; sourceImageLocalPath; realEsrganModelLocalPath; modelWeightManifestEvidence; reviewed private proof refs; adapter skip reason: real_esrgan_model_missing` |
| `kornia` | `gpu_model` | `gpu_worker_ai_graphics` | true | `install_target_prepared_runtime_blocked_pending_cpu_tensor_private_inputs` | `blocked_with_reason` | true | false | true | `sourceImageLocalPath` | `outputDirectory, pythonCpuTensorRuntime` | `outputDirectory, pythonCpuTensorRuntime, sourceImageLocalPath` | `npm run --silent ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness -- --attempt-local-runtime --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --runtime-container-platform linux/amd64 --tool kornia --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run> --result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json --allow-cpu-tensor-runtime --source-image <private-approved-frame.png>` | `approved local Python CPU tensor runtime; outputDirectory; pythonCpuTensorRuntime; sourceImageLocalPath; reviewed private proof refs; adapter skip reason: kornia_source_frame_missing` |
| `rembg` | `gpu_model` | `gpu_worker_ai_graphics` | true | `install_target_prepared_runtime_blocked_pending_cpu_model_private_inputs` | `blocked_with_reason` | true | false | true | `rembgModelLocalPath` | `outputDirectory, pythonCpuModelRuntime, sourceImageLocalPath, modelWeightManifestEvidence` | `outputDirectory, pythonCpuModelRuntime, sourceImageLocalPath, rembgModelLocalPath, modelWeightManifestEvidence` | `npm run --silent ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness -- --attempt-local-runtime --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --runtime-container-platform linux/amd64 --no-runtime-container-gpu --tool rembg --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run> --result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json --allow-cpu-model-runtime --source-image <private-approved-frame.png> --rembg-model <private-rembg-model.onnx>` | `approved local Python/Docker CPU model runtime; outputDirectory; pythonCpuModelRuntime; sourceImageLocalPath; rembgModelLocalPath; modelWeightManifestEvidence; reviewed private proof refs; adapter skip reason: rembg_model_missing` |
| `transparent_background` | `gpu_model` | `gpu_worker_ai_graphics` | true | `install_target_prepared_runtime_blocked_pending_cpu_model_private_inputs` | `blocked_with_reason` | true | false | true | `transparentBackgroundCheckpointLocalPath` | `outputDirectory, pythonCpuModelRuntime, sourceImageLocalPath, modelWeightManifestEvidence` | `outputDirectory, pythonCpuModelRuntime, sourceImageLocalPath, transparentBackgroundCheckpointLocalPath, modelWeightManifestEvidence` | `npm run --silent ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness -- --attempt-local-runtime --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --runtime-container-platform linux/amd64 --no-runtime-container-gpu --tool transparent_background --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run> --result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json --allow-cpu-model-runtime --source-image <private-approved-frame.png> --transparent-background-checkpoint <private-transparent-background-checkpoint.pth> --transparent-background-mode fast` | `approved local Python/Docker CPU model runtime; outputDirectory; pythonCpuModelRuntime; sourceImageLocalPath; transparentBackgroundCheckpointLocalPath; modelWeightManifestEvidence; reviewed private proof refs; adapter skip reason: transparent_background_checkpoint_missing` |
| `d3` | `cpu_static` | `node_or_browser_lockfile` | true | `controlled_runtime_present_and_executed` | `executable` | true | true | true | `none` | `none` | `none` | `npm run --silent ai-graphics:external-agent-all21-controlled-route-execution-smoke` | `none` |
| `echarts` | `browser_runtime` | `node_or_browser_lockfile` | true | `controlled_runtime_present_and_executed` | `executable` | true | true | true | `none` | `none` | `none` | `npm run --silent ai-graphics:external-agent-all21-controlled-route-execution-smoke` | `none` |
| `vega_lite` | `cpu_static` | `node_or_browser_lockfile` | true | `controlled_runtime_present_and_executed` | `executable` | true | true | true | `none` | `none` | `none` | `npm run --silent ai-graphics:external-agent-all21-controlled-route-execution-smoke` | `none` |
| `vega` | `cpu_static` | `node_or_browser_lockfile` | true | `controlled_runtime_present_and_executed` | `executable` | true | true | true | `none` | `none` | `none` | `npm run --silent ai-graphics:external-agent-all21-controlled-route-execution-smoke` | `none` |
| `satori` | `cpu_static` | `node_or_browser_lockfile` | true | `controlled_runtime_present_and_executed` | `executable` | true | true | true | `none` | `none` | `none` | `npm run --silent ai-graphics:external-agent-all21-controlled-route-execution-smoke` | `none` |
| `svgdotjs_svg_js` | `cpu_static` | `node_or_browser_lockfile` | true | `controlled_runtime_present_and_executed` | `executable` | true | true | true | `none` | `none` | `none` | `npm run --silent ai-graphics:external-agent-all21-controlled-route-execution-smoke` | `none` |
| `viz_js` | `cpu_static` | `node_or_browser_lockfile` | true | `controlled_runtime_present_and_executed` | `executable` | true | true | true | `none` | `none` | `none` | `npm run --silent ai-graphics:external-agent-all21-controlled-route-execution-smoke` | `none` |
| `lottie_web` | `browser_runtime` | `node_or_browser_lockfile` | true | `controlled_runtime_present_and_executed` | `executable` | true | true | true | `none` | `none` | `none` | `npm run --silent ai-graphics:external-agent-all21-controlled-route-execution-smoke` | `none` |
| `animejs` | `browser_runtime` | `node_or_browser_lockfile` | true | `controlled_runtime_present_and_executed` | `executable` | true | true | true | `none` | `none` | `none` | `npm run --silent ai-graphics:external-agent-all21-controlled-route-execution-smoke` | `none` |
| `three_js` | `browser_runtime` | `node_or_browser_lockfile` | true | `controlled_runtime_present_and_executed` | `executable` | true | true | true | `none` | `none` | `none` | `npm run --silent ai-graphics:external-agent-all21-controlled-route-execution-smoke` | `none` |
| `pixi_js` | `browser_runtime` | `node_or_browser_lockfile` | true | `controlled_runtime_present_and_executed` | `executable` | true | true | true | `none` | `none` | `none` | `npm run --silent ai-graphics:external-agent-all21-controlled-route-execution-smoke` | `none` |
| `konva` | `browser_runtime` | `node_or_browser_lockfile` | true | `controlled_runtime_present_and_executed` | `executable` | true | true | true | `none` | `none` | `none` | `npm run --silent ai-graphics:external-agent-all21-controlled-route-execution-smoke` | `none` |
| `babylonjs` | `browser_runtime` | `node_or_browser_lockfile` | true | `controlled_runtime_present_and_executed` | `executable` | true | true | true | `none` | `none` | `none` | `npm run --silent ai-graphics:external-agent-all21-controlled-route-execution-smoke` | `none` |

## Model-Weight Runtime Input Manifest Commands

These commands are local-only preparation steps for the five GPU/model tools that require private model/checkpoint files. They compute checksum evidence from the supplied private model file and write a strict runtime input manifest under `.local-artifacts/`; they do not start GPU, run inference, download models, call providers, create signed URLs, or create public artifacts.

| Tool | Current blocker | Manifest path | Manifest materializer command | Next scoped tool-call command |
| --- | --- | --- | --- | --- |
| `sam2` | `sam2CheckpointLocalPath` | `.local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/runtime-inputs.json` | `npm run --silent ai-graphics:external-agent-gpu-model-runtime-input-manifest -- --tool sam2 --source-image <private-approved-frame.png> --sam2-checkpoint <private-sam2-checkpoint.pt> --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run> --manifest-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/runtime-inputs.json --model-weight-manifest-id <reviewed-private-model-weight-manifest-id> --model-weight-checksum-evidence-ref private://reeditpro/ai-graphics/checksum-evidence/sam2.json --runtime-container-image reeditpro/ai-graphics-sam2-runtime:proof-local --runtime-container-platform linux/amd64` | `npm run --silent ai-graphics:external-agent-tool-call -- --tool sam2 --attempt-gpu-runtime --runtime-backend docker_container --runtime-input-manifest .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/runtime-inputs.json` |
| `birefnet` | `birefnetModelLocalPath` | `.local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/runtime-inputs.json` | `npm run --silent ai-graphics:external-agent-gpu-model-runtime-input-manifest -- --tool birefnet --source-image <private-approved-frame.png> --birefnet-model <private-birefnet-model-dir-containing-model.safetensors> --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run> --manifest-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/runtime-inputs.json --model-weight-manifest-id <reviewed-private-model-weight-manifest-id> --model-weight-checksum-evidence-ref private://reeditpro/ai-graphics/checksum-evidence/birefnet.json --runtime-container-image reeditpro/ai-graphics-birefnet-runtime:proof-local --runtime-container-platform linux/amd64` | `npm run --silent ai-graphics:external-agent-tool-call -- --tool birefnet --attempt-gpu-runtime --runtime-backend docker_container --runtime-input-manifest .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/runtime-inputs.json` |
| `real_esrgan` | `realEsrganModelLocalPath` | `.local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/runtime-inputs.json` | `npm run --silent ai-graphics:external-agent-gpu-model-runtime-input-manifest -- --tool real_esrgan --source-image <private-approved-frame.png> --real-esrgan-model <private-real-esrgan-model-dir/RealESRGAN_x4plus.pth> --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run> --manifest-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/runtime-inputs.json --model-weight-manifest-id <reviewed-private-model-weight-manifest-id> --model-weight-checksum-evidence-ref private://reeditpro/ai-graphics/checksum-evidence/real_esrgan.json --runtime-container-image reeditpro/ai-graphics-real-esrgan-runtime:proof-local --runtime-container-platform linux/amd64 --allow-cpu-model-runtime` | `npm run --silent ai-graphics:external-agent-tool-call -- --tool real_esrgan --attempt-gpu-runtime --runtime-backend docker_container --allow-cpu-model-runtime --no-runtime-container-gpu --runtime-input-manifest .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/runtime-inputs.json` |
| `rembg` | `rembgModelLocalPath` | `.local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/runtime-inputs.json` | `npm run --silent ai-graphics:external-agent-gpu-model-runtime-input-manifest -- --tool rembg --source-image <private-approved-frame.png> --rembg-model <private-rembg-model.onnx> --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run> --manifest-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/runtime-inputs.json --model-weight-manifest-id <reviewed-private-model-weight-manifest-id> --model-weight-checksum-evidence-ref private://reeditpro/ai-graphics/checksum-evidence/rembg.json --runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --runtime-container-platform linux/amd64 --allow-cpu-model-runtime` | `npm run --silent ai-graphics:external-agent-tool-call -- --tool rembg --attempt-gpu-runtime --runtime-backend docker_container --allow-cpu-model-runtime --no-runtime-container-gpu --runtime-input-manifest .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/runtime-inputs.json` |
| `transparent_background` | `transparentBackgroundCheckpointLocalPath` | `.local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/runtime-inputs.json` | `npm run --silent ai-graphics:external-agent-gpu-model-runtime-input-manifest -- --tool transparent_background --source-image <private-approved-frame.png> --transparent-background-checkpoint <private-transparent-background-checkpoint.pth> --transparent-background-mode fast --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run> --manifest-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/runtime-inputs.json --model-weight-manifest-id <reviewed-private-model-weight-manifest-id> --model-weight-checksum-evidence-ref private://reeditpro/ai-graphics/checksum-evidence/transparent_background.json --runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --runtime-container-platform linux/amd64 --allow-cpu-model-runtime` | `npm run --silent ai-graphics:external-agent-tool-call -- --tool transparent_background --attempt-gpu-runtime --runtime-backend docker_container --allow-cpu-model-runtime --no-runtime-container-gpu --runtime-input-manifest .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/runtime-inputs.json` |

## Remaining Native CUDA Closure

- Status: `remaining_native_cuda_tools_blocked_pending_native_host_and_private_model_inputs`
- Remaining native CUDA tools: `sam2, birefnet`
- Current host eligible for native GPU proof: `false`
- Current host blockers: `none`
- Host preflight command: `npm run --silent ai-graphics:gpu-runtime-proof-local-preflight -- --detect-host --require-host-eligible`
- Native CUDA script generator command: `npm run --silent ai-graphics:external-agent-native-cuda-closeout -- --detect-host --private-model-root "$REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT" --model-weight-manifest-dir "$REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_MANIFEST_DIR" --source-image <private-approved-frame.png> --output-root .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/native-cuda-closeout --existing-proof-result <accepted-proof-for-torch_torchvision-transformers-kornia.json> --existing-proof-result <accepted-proof-for-real_esrgan.json> --existing-proof-result <accepted-proof-for-rembg.json> --existing-proof-result <accepted-proof-for-transparent_background.json> --script-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/native-cuda-closeout/run-native-cuda-closeout.sh`
- Native CUDA generated script path: `.local-artifacts/ai-graphics/gpu-model-local-dev-runtime/native-cuda-closeout/run-native-cuda-closeout.sh`
- Native CUDA closeout command: `npm run --silent ai-graphics:external-agent-native-cuda-closeout -- --detect-host --private-model-root "$REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT" --model-weight-manifest-dir "$REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_MANIFEST_DIR" --source-image <private-approved-frame.png> --output-root .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/native-cuda-closeout --existing-proof-result <accepted-proof-for-torch_torchvision-transformers-kornia.json> --existing-proof-result <accepted-proof-for-real_esrgan.json> --existing-proof-result <accepted-proof-for-rembg.json> --existing-proof-result <accepted-proof-for-transparent_background.json> --attempt-local-runtime`
- Native CUDA strict closeout command: `npm run --silent ai-graphics:external-agent-native-cuda-closeout -- --detect-host --private-model-root "$REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT" --model-weight-manifest-dir "$REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_MANIFEST_DIR" --source-image <private-approved-frame.png> --output-root .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/native-cuda-closeout --existing-proof-result <accepted-proof-for-torch_torchvision-transformers-kornia.json> --existing-proof-result <accepted-proof-for-real_esrgan.json> --existing-proof-result <accepted-proof-for-rembg.json> --existing-proof-result <accepted-proof-for-transparent_background.json> --attempt-local-runtime --strict-exit-code`
- Native CUDA closeout diagnostic command: `npm run --silent ai-graphics:external-agent-native-cuda-closeout:diagnostics`
- Private model root inspected: `false`
- Private model root exists: `false`
- All-21 closeout readiness command: `npm run --silent ai-graphics:external-agent-execution-readiness -- --local-runtime-proof-result <accepted-proof-for-torch_torchvision-or-foundation-bundle.json> --local-runtime-proof-result <accepted-proof-for-real_esrgan.json> --local-runtime-proof-result <accepted-proof-for-rembg.json> --local-runtime-proof-result <accepted-proof-for-transparent_background.json> --local-runtime-proof-result .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/native-cuda-closeout/sam2/harness-result.json --local-runtime-proof-result .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/native-cuda-closeout/birefnet/harness-result.json`

| Tool | Current state | Current blocker | Model field | Expected candidates | Model candidate present | Matching candidate | Manifest command | Native proof command | Final tool call |
| --- | --- | --- | --- | --- | ---: | --- | --- | --- | --- |
| `sam2` | `blocked_with_reason` | `sam2CheckpointLocalPath` | `sam2CheckpointLocalPath` | `sam2.1_hiera_tiny.pt, sam2/sam2.1_hiera_tiny.pt, sam2/sam2-checkpoint.pt, sam2/checkpoint.pt` | false | `none` | `npm run --silent ai-graphics:external-agent-gpu-model-runtime-input-manifest -- --tool sam2 --source-image <private-approved-frame.png> --private-model-root "$REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT" --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-sam2> --manifest-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-sam2>/runtime-inputs.json --model-weight-manifest-id sam2_private_manifest_review_v1 --model-weight-checksum-evidence-ref private://reeditpro/ai-graphics/checksum-evidence/sam2.json --runtime-container-image reeditpro/ai-graphics-sam2-runtime:proof-local --runtime-container-platform linux/amd64` | `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-sam2-runtime:proof-local --runtime-container-platform linux/amd64 --tool sam2 --runtime-input-manifest .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-sam2>/runtime-inputs.json --detect-host --require-host-eligible --require-accepted-proof` | `npm run --silent ai-graphics:external-agent-tool-call -- --tool sam2 --attempt-gpu-runtime --expect-state executable --require-output-hash --require-private-only-boundary --strict-exit-code --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-sam2-runtime:proof-local --runtime-container-platform linux/amd64 --runtime-input-manifest .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-sam2>/runtime-inputs.json` |
| `birefnet` | `blocked_with_reason` | `birefnetModelLocalPath` | `birefnetModelLocalPath` | `birefnet, ZhengPeng7/BiRefNet, BiRefNet` | false | `none` | `npm run --silent ai-graphics:external-agent-gpu-model-runtime-input-manifest -- --tool birefnet --source-image <private-approved-frame.png> --private-model-root "$REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT" --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-birefnet> --manifest-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-birefnet>/runtime-inputs.json --model-weight-manifest-id birefnet_private_manifest_review_v1 --model-weight-checksum-evidence-ref private://reeditpro/ai-graphics/checksum-evidence/birefnet.json --runtime-container-image reeditpro/ai-graphics-birefnet-runtime:proof-local --runtime-container-platform linux/amd64` | `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-birefnet-runtime:proof-local --runtime-container-platform linux/amd64 --tool birefnet --runtime-input-manifest .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-birefnet>/runtime-inputs.json --detect-host --require-host-eligible --require-accepted-proof` | `npm run --silent ai-graphics:external-agent-tool-call -- --tool birefnet --attempt-gpu-runtime --expect-state executable --require-output-hash --require-private-only-boundary --strict-exit-code --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-birefnet-runtime:proof-local --runtime-container-platform linux/amd64 --runtime-input-manifest .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-birefnet>/runtime-inputs.json` |

## Counts

- `totalToolsCovered`: 21
- `packageRuntimePresentForPlannedSurfaceTools`: 21
- `packageRuntimeInstallProofPresentTools`: 21
- `gpuModelInstallProofTargetPreparedTools`: 8
- `gpuModelInstallProofImportSmokePassedTools`: 8
- `controlledExecutionRuntimePresentNowTools`: 13
- `agentCallableTools`: 21
- `agentExecutableTools`: 13
- `cpuStaticExecutableTools`: 6
- `browserRuntimeExecutableTools`: 7
- `gpuToolsWithValidRuntimeProof`: 0
- `gpuModelProofRefBridgeAcceptedTools`: 0
- `gpuModelProofRefBridgeBlockedTools`: 8
- `controlledWorkerRouteExecutableTools`: 13
- `mockWorkerQueueJobCreatedTools`: 13
- `mockWorkerClaimPerformedTools`: 13
- `mockWorkerEventRecordedTools`: 13
- `gpuModelBlockedByControlledWorkerRouteTools`: 8
- `gpuModelBlockedWithReasonTools`: 8
- `currentHostGpuProofBlockers`: 0
- `blockedWithReasonTools`: 8
- `failedWithDiagnosticsTools`: 0
- `capabilityMismatchFailureProbeTools`: 1
- `gpuRuntimeShouldStartNowTools`: 0
- `publicArtifactCreatedTools`: 0
- `signedUrlCreatedTools`: 0
- `workerDispatchPerformedTools`: 0
- `providerRuntimePerformedTools`: 0
- `runtimeReadyNowTools`: 0
- `externalBetaReadyNowTools`: 0
- `productionReadyNowTools`: 0
- `fastestGpuModelUnlockCandidateTools`: 1
- `privateLocalRuntimeProofResultSuppliedTools`: 0
- `cpuSafeGpuModelRouteProofAttemptedTools`: 3
- `cpuSafeGpuModelRouteProofExecutableTools`: 3
- `agentExecutableToolsWithCpuSafeGpuModelRouteProof`: 16
- `remainingGpuModelBlockedToolsAfterCpuSafeGpuModelRouteProof`: 5
- `cpuModelGpuModelRouteProofAttemptedTools`: 1
- `cpuModelGpuModelRouteProofExecutableTools`: 1
- `agentExecutableToolsWithCpuSafeAndCpuModelGpuModelRouteProof`: 17
- `remainingGpuModelBlockedToolsAfterCpuSafeAndCpuModelGpuModelRouteProof`: 4

## Fastest GPU/Model Unlock Candidate

- Tool: `kornia`
- Recommended backend: `docker_container`
- Canonical proof image: `reeditpro/ai-graphics-gpu-worker:proof-local`
- Reason: Kornia is the narrowest GPU/model execution unlock candidate because it uses the real controlled adapter, can prove local CPU tensor execution with a private approved frame and output directory, and does not require a model-weight manifest.
- Expected current-host blocker without attached NVIDIA GPU: `gpu_model_python_package_missing`
- Build proof-local image if missing: `docker buildx build --platform linux/amd64 --target ai_graphics_install_proof -f docker/prod/gpu-worker/Dockerfile -t reeditpro/ai-graphics-gpu-worker:proof-local .`
- Next direct harness command: `npm run --silent ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness -- --attempt-local-runtime --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --runtime-container-platform linux/amd64 --tool kornia --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run> --result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json --allow-cpu-tensor-runtime --source-image <private-approved-frame.png>`
- Next controlled route command: `npm run --silent ai-graphics:external-agent-all21-controlled-route-execution-smoke -- --scoped-gpu-tool kornia --scoped-gpu-runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --scoped-gpu-runtime-container-platform linux/amd64 --scoped-gpu-output-dir .local-artifacts/ai-graphics/gpu-model-route-runtime-attempt-smoke/kornia --scoped-gpu-allow-cpu-tensor-runtime --scoped-gpu-source-image .local-artifacts/ai-graphics/gpu-model-route-runtime-attempt-smoke/kornia/private-approved-frame.ppm`
- Next proof-ref bridge command: `npm run --silent ai-graphics:external-agent-gpu-model-runtime-proof-ref-bridge -- --local-runtime-proof-result .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json`
- Next direct readiness command with private proof: `npm run --silent ai-graphics:external-agent-execution-readiness -- --local-runtime-proof-result .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json`
- Next current-host preflight command: `npm run --silent ai-graphics:external-agent-execution-readiness -- --detect-host`

## Failure Diagnostics Guard

- Capability mismatch probe accepted: `true`
- Probe count: `1`
- Probe state: `failed_with_diagnostics`
- Guard: a valid tool with the wrong product-facing capability returns `failed_with_diagnostics` and does not invoke or execute an adapter.

## Booleans

- `externalAgentExecutionReadinessCompleted`: true
- `all21ToolsCovered`: true
- `all21ToolsHaveInstallSurfaceEvidence`: true
- `all21ToolsHaveRuntimeInstallProofEvidence`: true
- `all8GpuModelToolsHaveInstallProofTargetEvidence`: true
- `all8GpuModelInstallProofImportSmokesPassed`: true
- `gpuModelInstallProofSeparatedFromRuntimeExecution`: true
- `gpuModelInstallProofDidNotStartNativeGpu`: true
- `gpuModelInstallProofDidNotLoadModelsOrProcessMedia`: true
- `thirteenToolsHaveControlledExecutionRuntimePresentNow`: true
- `eightGpuModelToolsInstallTargetPreparedButRuntimeBlocked`: true
- `agentCanSubmitControlledToolRequests`: true
- `agentCallableToolsReady`: true
- `all13NonGpuControlledAdapterOutputsValidated`: true
- `controlledWorkerRouteSmokeAccepted`: true
- `all13NonGpuControlledWorkerRouteOutputsValidated`: true
- `mockWorkerClaimBeforeRouteExecutionAccepted`: true
- `mockWorkerEventAfterRouteExecutionAccepted`: true
- `all8GpuModelToolsBlockedByControlledWorkerRoute`: true
- `all8GpuModelToolsEvaluated`: true
- `gpuModelToolsBlockedUntilPrerequisites`: true
- `gpuModelProofRefBridgeBlocksUntilPrivateProof`: true
- `scopedGpuModelRuntimeProofAcceptedTools`: 0
- `privateLocalRuntimeProofResultSupplied`: false
- `cpuSafeGpuModelRouteProofAttempted`: true
- `cpuSafeGpuModelRouteProofAccepted`: true
- `agentCanExecuteCpuSafeGpuModelRouteProofToolsNow`: true
- `agentCanExecute16ControlledRouteToolsWithCpuSafeGpuModelRouteProofNow`: true
- `cpuModelGpuModelRouteProofAttempted`: true
- `cpuModelGpuModelRouteProofAccepted`: true
- `agentCanExecuteCpuModelGpuModelRouteProofToolsNow`: true
- `agentCanExecute17ControlledRouteToolsWithCpuSafeAndCpuModelGpuModelRouteProofNow`: true
- `strictCallableExecutableBlockedFailedContractCreated`: true
- `capabilityMismatchFailureProbeAccepted`: true
- `gpuRuntimeOnDemandOnly`: true
- `noIdleGpuRuntimeApproved`: true
- `gpuRuntimeShouldStartNow`: false
- `sourceScopedGpuRuntimeStartedOnlyDuringAcceptedProof`: true
- `agentCanSelectForPlanning`: true
- `agentCanExecuteToolsNow`: true
- `agentCanExecuteAnyControlledToolNow`: true
- `agentCanExecute13ControlledToolsNow`: true
- `agentCanExecute13NonGpuControlledToolsNow`: true
- `agentCanExecuteAll21ToolsNow`: false
- `agentCanExecuteAll21ControlledToolsNow`: false
- `agentCanExecuteGpuModelToolsNow`: false
- `currentHostGpuProofPreflightRequested`: false
- `currentHostEligibleForGpuProof`: false
- `routeExecutionApprovedNow`: true
- `routeExecutionPerformedInReadinessRunner`: true
- `controlledWorkerRouteExecutionPerformedInReadinessRunner`: true
- `toolExecutionApprovedFor13ControlledToolsNow`: true
- `toolExecutionApprovedForGpuModelToolsNow`: false
- `toolExecutionApprovedForAll21ToolsNow`: false
- `workerExecutionApprovedNow`: false
- `workerExecutionPerformed`: false
- `workerDispatchPerformed`: false
- `providerRuntimeApprovedNow`: false
- `providerRuntimePerformed`: false
- `browserWebglCanvasRuntimeApprovedNow`: false
- `gpuRuntimeApprovedNow`: false
- `gpuRuntimePerformed`: false
- `modelWeightsDownloaded`: false
- `modelWeightsLoaded`: false
- `modelInferencePerformed`: false
- `mediaProcessingPerformed`: false
- `supabaseMutationPerformed`: false
- `gcsUploadPerformed`: false
- `publicArtifactCreated`: false
- `signedUrlCreated`: false
- `runtimeReadyNow`: false
- `internalBetaReadyNow`: false
- `externalBetaReadyNow`: false
- `productionReadyNow`: false
- `dependencyInstallPerformed`: false
- `packageLockMutationPerformed`: false

## Next Action

Controlled route proof now covers 17/21 tools: 13 non-GPU tools, CPU foundation/tensor proof for torch_torchvision, transformers, and kornia, plus rembg CPU-model proof. Keep real_esrgan and transparent_background blocked on this host until their CPU/GPU runtime performance proof completes, and keep sam2/birefnet blocked until native CUDA proof exists.
