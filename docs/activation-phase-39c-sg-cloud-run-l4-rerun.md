# Phase 39C-SG Cloud Run L4 Rerun

The staging job remains:

`reeditpro-stg-vlm-runtime-phase39c-sglang`

Required settings:

- Region: `us-central1`
- Service account: `reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com`
- GPU: `1 x nvidia-l4`
- CPU: `8`
- Memory: `32Gi`
- Task count: `1`
- Parallelism: `1`
- Public service endpoint: none

The job may run only deterministic generated fixtures against already staged PR #87 private Qwen assets. It must keep Phase 39D, Phase 39E, provider calls, real media, public output, beta, and production blocked.

## Phase 39C-SG-BUILD Result

Run `phase39c-sg-build-20260601T232400-overlay` deployed image digest `sha256:39cdb9bf6123c4d9568a9bfd55041b138ed0c03adad9f02a9c51482fec5adfa9` and executed the job for the 2B, 4B, and 8B FP8 PR #87 candidates. The job copied and verified private model payloads and uploaded private JSON artifacts for each candidate. All candidates failed before generated fixture inference because SGLang could not import `sgl_kernel/common_ops.abi3.so`, reporting unresolved symbol `cuGreenCtxDestroy`.
