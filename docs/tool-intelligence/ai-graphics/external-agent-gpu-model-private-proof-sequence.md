# AI Graphics External Agent GPU Model Private Proof Sequence

Decision: `ai_graphics_external_agent_gpu_model_private_proof_sequence_prepared_with_runtime_blocks`

Status: `gpu_model_private_proof_sequence_ready_kornia_first_blocked_until_scoped_private_runtime_proof`

This runner is the one-command local-only path for a scoped GPU/model proof: it calls the real local-dev controlled adapter harness, validates the resulting private proof through the SHA-checked proof-ref bridge, then recomputes all-21 external-agent readiness.

## Requested Tool

- Tool: `kornia`
- Fastest unlock candidate: `kornia`
- Local runtime attempted: `false`
- Local runtime executed for requested tool: `false`
- Accepted private proof: `false`
- Host preflight requested: `false`
- Host eligible for native GPU proof: `false`

## Kornia First Command

`npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --runtime-container-platform linux/amd64 --tool kornia --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-kornia> --source-image <private-approved-frame.png> --detect-host --require-host-eligible --require-accepted-proof`

## Kornia First Manifest Command

`npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --runtime-container-platform linux/amd64 --tool kornia --runtime-input-manifest .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-kornia>/runtime-inputs.json --detect-host --require-host-eligible --require-accepted-proof`

## Per-Tool Container Private Proof Sequence Commands

- `torch_torchvision`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --runtime-container-platform linux/amd64 --tool torch_torchvision --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-torch_torchvision> --detect-host --require-host-eligible --require-accepted-proof`
- `transformers`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --runtime-container-platform linux/amd64 --tool transformers --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-transformers> --detect-host --require-host-eligible --require-accepted-proof`
- `sam2`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --runtime-container-platform linux/amd64 --tool sam2 --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-sam2> --source-image <private-approved-frame.png> --sam2-checkpoint <private-sam2-checkpoint.pt> --detect-host --require-host-eligible --require-accepted-proof`
- `birefnet`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --runtime-container-platform linux/amd64 --tool birefnet --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-birefnet> --source-image <private-approved-frame.png> --birefnet-model <private-birefnet-model> --detect-host --require-host-eligible --require-accepted-proof`
- `real_esrgan`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --runtime-container-platform linux/amd64 --tool real_esrgan --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-real_esrgan> --source-image <private-approved-frame.png> --real-esrgan-model <private-real-esrgan-model.pth> --detect-host --require-host-eligible --require-accepted-proof`
- `kornia`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --runtime-container-platform linux/amd64 --tool kornia --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-kornia> --source-image <private-approved-frame.png> --detect-host --require-host-eligible --require-accepted-proof`
- `rembg`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --runtime-container-platform linux/amd64 --tool rembg --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-rembg> --source-image <private-approved-frame.png> --rembg-model <private-rembg-model.onnx> --detect-host --require-host-eligible --require-accepted-proof`
- `transparent_background`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --runtime-container-platform linux/amd64 --tool transparent_background --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-transparent_background> --source-image <private-approved-frame.png> --transparent-background-checkpoint <private-transparent-background-checkpoint.pth> --detect-host --require-host-eligible --require-accepted-proof`

## Per-Tool Host Python Private Proof Sequence Commands

- `torch_torchvision`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --runtime-backend host_python --allow-cpu-foundation-runtime --tool torch_torchvision --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-torch_torchvision> --detect-host --require-host-eligible --require-accepted-proof`
- `transformers`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --runtime-backend host_python --allow-cpu-foundation-runtime --tool transformers --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-transformers> --detect-host --require-host-eligible --require-accepted-proof`
- `sam2`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --tool sam2 --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-sam2> --source-image <private-approved-frame.png> --sam2-checkpoint <private-sam2-checkpoint.pt> --detect-host --require-host-eligible --require-accepted-proof`
- `birefnet`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --tool birefnet --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-birefnet> --source-image <private-approved-frame.png> --birefnet-model <private-birefnet-model> --detect-host --require-host-eligible --require-accepted-proof`
- `real_esrgan`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --tool real_esrgan --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-real_esrgan> --source-image <private-approved-frame.png> --real-esrgan-model <private-real-esrgan-model.pth> --detect-host --require-host-eligible --require-accepted-proof`
- `kornia`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --runtime-backend host_python --allow-cpu-tensor-runtime --tool kornia --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-kornia> --source-image <private-approved-frame.png> --detect-host --require-host-eligible --require-accepted-proof`
- `rembg`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --tool rembg --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-rembg> --source-image <private-approved-frame.png> --rembg-model <private-rembg-model.onnx> --detect-host --require-host-eligible --require-accepted-proof`
- `transparent_background`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --tool transparent_background --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-transparent_background> --source-image <private-approved-frame.png> --transparent-background-checkpoint <private-transparent-background-checkpoint.pth> --detect-host --require-host-eligible --require-accepted-proof`

## Per-Tool Container Private Manifest Proof Sequence Commands

- `torch_torchvision`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --runtime-container-platform linux/amd64 --tool torch_torchvision --runtime-input-manifest .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-torch_torchvision>/runtime-inputs.json --detect-host --require-host-eligible --require-accepted-proof`
- `transformers`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --runtime-container-platform linux/amd64 --tool transformers --runtime-input-manifest .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-transformers>/runtime-inputs.json --detect-host --require-host-eligible --require-accepted-proof`
- `sam2`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --runtime-container-platform linux/amd64 --tool sam2 --runtime-input-manifest .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-sam2>/runtime-inputs.json --detect-host --require-host-eligible --require-accepted-proof`
- `birefnet`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --runtime-container-platform linux/amd64 --tool birefnet --runtime-input-manifest .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-birefnet>/runtime-inputs.json --detect-host --require-host-eligible --require-accepted-proof`
- `real_esrgan`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --runtime-container-platform linux/amd64 --tool real_esrgan --runtime-input-manifest .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-real_esrgan>/runtime-inputs.json --detect-host --require-host-eligible --require-accepted-proof`
- `kornia`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --runtime-container-platform linux/amd64 --tool kornia --runtime-input-manifest .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-kornia>/runtime-inputs.json --detect-host --require-host-eligible --require-accepted-proof`
- `rembg`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --runtime-container-platform linux/amd64 --tool rembg --runtime-input-manifest .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-rembg>/runtime-inputs.json --detect-host --require-host-eligible --require-accepted-proof`
- `transparent_background`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --runtime-container-platform linux/amd64 --tool transparent_background --runtime-input-manifest .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-transparent_background>/runtime-inputs.json --detect-host --require-host-eligible --require-accepted-proof`

## Per-Tool Host Python Private Manifest Proof Sequence Commands

- `torch_torchvision`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --runtime-backend host_python --allow-cpu-foundation-runtime --tool torch_torchvision --runtime-input-manifest .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-torch_torchvision>/runtime-inputs.json --detect-host --require-host-eligible --require-accepted-proof`
- `transformers`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --runtime-backend host_python --allow-cpu-foundation-runtime --tool transformers --runtime-input-manifest .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-transformers>/runtime-inputs.json --detect-host --require-host-eligible --require-accepted-proof`
- `sam2`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --tool sam2 --runtime-input-manifest .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-sam2>/runtime-inputs.json --detect-host --require-host-eligible --require-accepted-proof`
- `birefnet`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --tool birefnet --runtime-input-manifest .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-birefnet>/runtime-inputs.json --detect-host --require-host-eligible --require-accepted-proof`
- `real_esrgan`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --tool real_esrgan --runtime-input-manifest .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-real_esrgan>/runtime-inputs.json --detect-host --require-host-eligible --require-accepted-proof`
- `kornia`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --runtime-backend host_python --allow-cpu-tensor-runtime --tool kornia --runtime-input-manifest .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-kornia>/runtime-inputs.json --detect-host --require-host-eligible --require-accepted-proof`
- `rembg`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --tool rembg --runtime-input-manifest .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-rembg>/runtime-inputs.json --detect-host --require-host-eligible --require-accepted-proof`
- `transparent_background`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --tool transparent_background --runtime-input-manifest .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-transparent_background>/runtime-inputs.json --detect-host --require-host-eligible --require-accepted-proof`

## Requested Tool Result

- Harness adapter status: `controlled_gpu_model_adapter_invoked_runtime_skipped`
- Harness execution state: `blocked_with_reason`
- Harness skip reason: `kornia_source_frame_missing`
- Harness output JSON SHA-256: `null`
- Bridge status: `blocked_missing_private_local_runtime_proof_result`
- Bridge SHA-256 accepted: `false`
- Readiness state: `blocked_with_reason`
- Readiness blocking prerequisite: `approved native CUDA host; outputDirectory; sourceImageLocalPath; nativeCudaRuntime; reviewed private proof refs; adapter skip reason: kornia_source_frame_missing`
- Final external-agent single-tool call status: `not_run_until_private_proof_is_accepted`
- Final external-agent single-tool call execution state: `null`
- Final external-agent single-tool call executable: `false`
- Final external-agent single-tool call output source: `null`
- Final external-agent single-tool call output SHA-256: `null`

## Final External-Agent Single-Tool Caller

- Command: `npm run --silent ai-graphics:external-agent-tool-call -- --tool kornia --attempt-gpu-runtime --expect-state executable --require-output-hash --require-private-only-boundary --strict-exit-code --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --runtime-container-platform linux/amd64 --gpu-output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-kornia>/external-agent-single-tool-call/kornia --result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-kornia>/external-agent-single-tool-call-result.json --source-image <private-approved-frame.png>`
- Output directory: `.local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-kornia>/external-agent-single-tool-call/kornia`
- Result path: `.local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-kornia>/external-agent-single-tool-call-result.json`

## Per-Tool Final External-Agent Single-Tool Caller Commands

### Container

- `torch_torchvision`: `npm run --silent ai-graphics:external-agent-tool-call -- --tool torch_torchvision --attempt-gpu-runtime --expect-state executable --require-output-hash --require-private-only-boundary --strict-exit-code --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --runtime-container-platform linux/amd64 --gpu-output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-torch_torchvision>/external-agent-single-tool-call/torch_torchvision --result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-torch_torchvision>/external-agent-single-tool-call-result.json`
- `transformers`: `npm run --silent ai-graphics:external-agent-tool-call -- --tool transformers --attempt-gpu-runtime --expect-state executable --require-output-hash --require-private-only-boundary --strict-exit-code --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --runtime-container-platform linux/amd64 --gpu-output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-transformers>/external-agent-single-tool-call/transformers --result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-transformers>/external-agent-single-tool-call-result.json`
- `sam2`: `npm run --silent ai-graphics:external-agent-tool-call -- --tool sam2 --attempt-gpu-runtime --expect-state executable --require-output-hash --require-private-only-boundary --strict-exit-code --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --runtime-container-platform linux/amd64 --gpu-output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-sam2>/external-agent-single-tool-call/sam2 --result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-sam2>/external-agent-single-tool-call-result.json --source-image <private-approved-frame.png> --sam2-checkpoint <private-sam2-checkpoint.pt>`
- `birefnet`: `npm run --silent ai-graphics:external-agent-tool-call -- --tool birefnet --attempt-gpu-runtime --expect-state executable --require-output-hash --require-private-only-boundary --strict-exit-code --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --runtime-container-platform linux/amd64 --gpu-output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-birefnet>/external-agent-single-tool-call/birefnet --result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-birefnet>/external-agent-single-tool-call-result.json --source-image <private-approved-frame.png> --birefnet-model <private-birefnet-model>`
- `real_esrgan`: `npm run --silent ai-graphics:external-agent-tool-call -- --tool real_esrgan --attempt-gpu-runtime --expect-state executable --require-output-hash --require-private-only-boundary --strict-exit-code --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --runtime-container-platform linux/amd64 --gpu-output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-real_esrgan>/external-agent-single-tool-call/real_esrgan --result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-real_esrgan>/external-agent-single-tool-call-result.json --source-image <private-approved-frame.png> --real-esrgan-model <private-real-esrgan-model.pth>`
- `kornia`: `npm run --silent ai-graphics:external-agent-tool-call -- --tool kornia --attempt-gpu-runtime --expect-state executable --require-output-hash --require-private-only-boundary --strict-exit-code --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --runtime-container-platform linux/amd64 --gpu-output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-kornia>/external-agent-single-tool-call/kornia --result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-kornia>/external-agent-single-tool-call-result.json --source-image <private-approved-frame.png>`
- `rembg`: `npm run --silent ai-graphics:external-agent-tool-call -- --tool rembg --attempt-gpu-runtime --expect-state executable --require-output-hash --require-private-only-boundary --strict-exit-code --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --runtime-container-platform linux/amd64 --gpu-output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-rembg>/external-agent-single-tool-call/rembg --result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-rembg>/external-agent-single-tool-call-result.json --source-image <private-approved-frame.png> --rembg-model <private-rembg-model.onnx>`
- `transparent_background`: `npm run --silent ai-graphics:external-agent-tool-call -- --tool transparent_background --attempt-gpu-runtime --expect-state executable --require-output-hash --require-private-only-boundary --strict-exit-code --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --runtime-container-platform linux/amd64 --gpu-output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-transparent_background>/external-agent-single-tool-call/transparent_background --result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-transparent_background>/external-agent-single-tool-call-result.json --source-image <private-approved-frame.png> --transparent-background-checkpoint <private-transparent-background-checkpoint.pth>`

### Host Python

- `torch_torchvision`: `npm run --silent ai-graphics:external-agent-tool-call -- --tool torch_torchvision --attempt-gpu-runtime --expect-state executable --require-output-hash --require-private-only-boundary --strict-exit-code --runtime-backend host_python --allow-cpu-foundation-runtime --gpu-output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-torch_torchvision>/external-agent-single-tool-call/torch_torchvision --result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-torch_torchvision>/external-agent-single-tool-call-result.json`
- `transformers`: `npm run --silent ai-graphics:external-agent-tool-call -- --tool transformers --attempt-gpu-runtime --expect-state executable --require-output-hash --require-private-only-boundary --strict-exit-code --runtime-backend host_python --allow-cpu-foundation-runtime --gpu-output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-transformers>/external-agent-single-tool-call/transformers --result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-transformers>/external-agent-single-tool-call-result.json`
- `sam2`: `npm run --silent ai-graphics:external-agent-tool-call -- --tool sam2 --attempt-gpu-runtime --expect-state executable --require-output-hash --require-private-only-boundary --strict-exit-code --runtime-backend host_python --gpu-output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-sam2>/external-agent-single-tool-call/sam2 --result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-sam2>/external-agent-single-tool-call-result.json --source-image <private-approved-frame.png> --sam2-checkpoint <private-sam2-checkpoint.pt>`
- `birefnet`: `npm run --silent ai-graphics:external-agent-tool-call -- --tool birefnet --attempt-gpu-runtime --expect-state executable --require-output-hash --require-private-only-boundary --strict-exit-code --runtime-backend host_python --gpu-output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-birefnet>/external-agent-single-tool-call/birefnet --result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-birefnet>/external-agent-single-tool-call-result.json --source-image <private-approved-frame.png> --birefnet-model <private-birefnet-model>`
- `real_esrgan`: `npm run --silent ai-graphics:external-agent-tool-call -- --tool real_esrgan --attempt-gpu-runtime --expect-state executable --require-output-hash --require-private-only-boundary --strict-exit-code --runtime-backend host_python --gpu-output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-real_esrgan>/external-agent-single-tool-call/real_esrgan --result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-real_esrgan>/external-agent-single-tool-call-result.json --source-image <private-approved-frame.png> --real-esrgan-model <private-real-esrgan-model.pth>`
- `kornia`: `npm run --silent ai-graphics:external-agent-tool-call -- --tool kornia --attempt-gpu-runtime --expect-state executable --require-output-hash --require-private-only-boundary --strict-exit-code --runtime-backend host_python --allow-cpu-tensor-runtime --gpu-output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-kornia>/external-agent-single-tool-call/kornia --result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-kornia>/external-agent-single-tool-call-result.json --source-image <private-approved-frame.png>`
- `rembg`: `npm run --silent ai-graphics:external-agent-tool-call -- --tool rembg --attempt-gpu-runtime --expect-state executable --require-output-hash --require-private-only-boundary --strict-exit-code --runtime-backend host_python --gpu-output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-rembg>/external-agent-single-tool-call/rembg --result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-rembg>/external-agent-single-tool-call-result.json --source-image <private-approved-frame.png> --rembg-model <private-rembg-model.onnx>`
- `transparent_background`: `npm run --silent ai-graphics:external-agent-tool-call -- --tool transparent_background --attempt-gpu-runtime --expect-state executable --require-output-hash --require-private-only-boundary --strict-exit-code --runtime-backend host_python --gpu-output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-transparent_background>/external-agent-single-tool-call/transparent_background --result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-transparent_background>/external-agent-single-tool-call-result.json --source-image <private-approved-frame.png> --transparent-background-checkpoint <private-transparent-background-checkpoint.pth>`

## Counts

- `requestedGpuModelTools`: 1
- `localRuntimeExecutionPerformedTools`: 0
- `toolExecutionApprovedNowTools`: 0
- `acceptedPrivateProofTools`: 0
- `routeSubmissionReadyWithAcceptedPrivateProofTools`: 0
- `readinessAgentExecutableTools`: 13
- `readinessGpuToolsWithValidRuntimeProof`: 0
- `readinessBlockedWithReasonTools`: 8
- `gpuRuntimeShouldStartNowTools`: 0
- `publicArtifactCreatedTools`: 0
- `signedUrlCreatedTools`: 0
- `currentHostGpuProofBlockers`: 0
- `finalExternalAgentSingleToolCallsExecuted`: 0

## Current Host Preflight

- Requested: `false`
- Eligible: `false`
- Blockers: `none`

## Safety Boundary

- `scopedToolOnly`: true
- `oneToolPerPrivateProofSequence`: true
- `defaultTool`: kornia
- `allGpuModelToolsHaveExactPrivateProofSequenceCommand`: true
- `allGpuModelToolsHaveExactContainerPrivateProofSequenceCommand`: true
- `allGpuModelToolsHaveExactHostPrivateProofSequenceCommand`: true
- `defaultToolReason`: Kornia requires one private approved frame and no private model/checkpoint file; it can use explicit CPU tensor runtime when torch/PIL/numpy/kornia are locally present, otherwise CUDA proof remains available.
- `explicitRuntimeAttemptRequired`: true
- `privateInputsRequired`: true
- `privateRuntimeInputManifestSupported`: true
- `privateRuntimeInputManifestUsedNow`: false
- `korniaCpuTensorRuntimeRequested`: false
- `foundationCpuRuntimeRequested`: false
- `privateRuntimeInputManifestMustStayUnderLocalArtifacts`: true
- `privateRuntimeInputManifestRejectedForWriteRecords`: true
- `privateProofResultMustStayUnderLocalArtifacts`: true
- `proofBridgeRequiresOutputJsonSha256Match`: true
- `noIdleGpuRuntimeApproved`: true
- `gpuMayStartOnlyDuringScopedLocalRuntimeAttempt`: false
- `noCpuFallbackForGpuModelTools`: true
- `korniaCpuTensorRuntimeAllowedWhenExplicitlyRequested`: true
- `korniaCpuTensorRuntimeDoesNotStartGpu`: true
- `foundationCpuRuntimeAllowedWhenExplicitlyRequested`: true
- `foundationCpuRuntimeDoesNotStartGpu`: true
- `noModelDownload`: true
- `noProviderRuntime`: true
- `noPublicArtifacts`: true
- `noSignedUrls`: true
- `noExternalBetaUnlock`: true
- `noProductionUnlock`: true
- `hostEligibilityGateSupported`: true
- `requireHostEligibleFlagSupported`: true
- `requireAcceptedProofFlagSupported`: true
- `perToolPrivateProofSequenceCommandsPrepared`: true
- `perToolContainerPrivateProofSequenceCommandsPrepared`: true
- `perToolHostPrivateProofSequenceCommandsPrepared`: true
- `finalExternalAgentSingleToolCallProofRunsAfterAcceptedPrivateProof`: true
- `finalExternalAgentSingleToolCallRequiresExecutableState`: true
- `allGpuModelToolsHaveExactFinalExternalAgentSingleToolCallCommand`: true
- `allGpuModelToolsHaveExactContainerFinalExternalAgentSingleToolCallCommand`: true
- `allGpuModelToolsHaveExactHostFinalExternalAgentSingleToolCallCommand`: true

## Booleans

- `externalAgentGpuModelPrivateProofSequencePrepared`: true
- `korniaFirstUnlockPathPrepared`: true
- `scopedToolOnly`: true
- `localRuntimeAttemptRequested`: false
- `privateRuntimeInputManifestSupported`: true
- `privateRuntimeInputManifestUsedNow`: false
- `localRuntimeExecutedForRequestedTool`: false
- `proofBridgeExecuted`: true
- `readinessRecomputed`: true
- `acceptedPrivateProofForRequestedTool`: false
- `finalExternalAgentSingleToolCallAttempted`: false
- `finalExternalAgentSingleToolCallExecutable`: false
- `hostPreflightRequested`: false
- `hostEligibleForNativeGpuProof`: false
- `requireHostEligible`: false
- `requireAcceptedProof`: false
- `agentCanExecute13NonGpuControlledToolsNow`: true
- `agentCanExecuteGpuModelToolsNow`: false
- `agentCanExecuteAll21ToolsNow`: false
- `gpuRuntimeOnDemandOnly`: true
- `noIdleGpuRuntimeApproved`: true
- `gpuRuntimeShouldStartNow`: false
- `gpuRuntimeStartedOnlyDuringScopedAttempt`: true
- `dependencyInstallPerformed`: false
- `packageLockMutationPerformed`: false
- `providerRuntimePerformed`: false
- `publicArtifactCreated`: false
- `signedUrlCreated`: false
- `runtimeReadyNow`: false
- `externalBetaReadyNow`: false
- `productionReadyNow`: false

## Next Action

Run the Kornia-first private proof sequence with either explicit CPU tensor runtime on a host with torch/PIL/numpy/kornia or CUDA runtime on an approved native Linux/amd64 NVIDIA CUDA host.
