# AI Video B-roll 11H Fix Inference Proof

Decision: `ai_video_broll_gen_11h_fix_inference_proof_static_fix_ready_no_execution`.

AI-VIDEO-BROLL-GEN-11H-FIX repairs the blocked bounded Wan latent inference proof design after the 11H execution attempt timed out during `wan_pipeline_local_files_only_latent_inference_canary`. The prior attempt created one prompt-scoped no-public-IP L4 VM, transferred private payloads, validated the remote model cache, imported `WanPipeline`, then timed out while loading pipeline weights before prompt encoding, denoising, or latent canary completion. Cleanup was verified.

This fix is static and no-execution. It does not create a VM, run a GPU, call Supabase, run SQL, call providers, dispatch workers, create generated video, create generated assets, create public artifacts, create signed URLs, mutate credits, unlock beta, unlock production, or claim `generated_local_fixture_passed`.

## Fix Strategy

- Keep the selected GPU family: `nvidia_l4`.
- Keep no-idle lifecycle rules: prompt-scoped VM only, no public IP, boot disk auto-delete, delete before completion, and cleanup verification.
- Change the future proof VM from `g2-standard-4` to `g2-standard-8` for the same one-L4 GPU with more host CPU/RAM.
- Preserve `g2-standard-4` as the source payload/install proof machine type, not as the inference canary machine type.
- Add pipeline-load markers before inference:
  - `REEDITPRO_BROLL_11H_WAN_PIPELINE_LOAD_START`
  - `REEDITPRO_BROLL_11H_WAN_PIPELINE_LOAD_OK`
  - `REEDITPRO_BROLL_11H_WAN_PIPELINE_CPU_OFFLOAD_OK`
  - `REEDITPRO_BROLL_11H_LATENT_INFERENCE_CANARY_START`
- Treat `REEDITPRO_BROLL_11H_WAN_PIPELINE_LOAD_OK` as sufficient proof that local pipeline load completed, even if the later latent canary fails.
- Enable offline/parallel loading hints: `HF_ENABLE_PARALLEL_LOADING=true`, `HF_PARALLEL_LOADING_WORKERS=4`, and `PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True`.
- Extend the bounded latent canary timeout to 90 minutes.

## Source Rules

- ReeditPro plans before it edits.
- External agents must use structured tool envelopes and approved fixture inputs, not raw chat.
- Wan generates candidate B-roll assets only; Remotion owns final composition.
- GPU work must run only when explicitly confirmed and must stop after use.
- The future retry still must not decode frames, encode video, run FFmpeg, persist latent output, create generated assets, create public artifacts, use signed URLs, mutate Supabase, execute SQL, mutate credits, or unlock beta/production.

## Future Retry Command

The future bounded retry remains explicit:

`REEDITPRO_CONFIRM_BROLL_11H_INFERENCE_PROOF_EXECUTE=true npm run ai-video-broll-gen-11h:bounded-inference-proof-runner -- --execute --json`

The external-agent wrapper path remains:

`REEDITPRO_CONFIRM_EXTERNAL_AGENT_BROLL_WAN_INFERENCE_PROOF=true npm run external-agent-tool-execute-broll-wan -- --inference-proof --execute --json`

This document does not authorize running either command by itself. A future retry must repeat quota/cache/pre-existing-resource preflight and keep cleanup verification mandatory.

## Expected Outcome Mapping

- If pipeline load and the latent canary pass with cleanup verified, the next prompt is `AI-VIDEO-BROLL-GEN-11I-INFERENCE-PROOF-RESULT-REVIEW: review bounded Wan inference proof result, no generated video`.
- If pipeline load passes but latent canary fails, the next fix should target prompt encoding/denoising.
- If pipeline load still times out on `g2-standard-8`, the next fix should target component-level load isolation or an explicitly approved one-L4 larger-memory strategy.
- If cleanup fails, validation must fail regardless of model result.

## Non-Claims

- No generated B-roll video is ready.
- No generated asset row is ready.
- No beta or production route is ready.
- No paid production route is in scope.
- No always-on GPU runtime is allowed.
- `generated_local_fixture_passed` is not claimed.

## Next Prompt

`AI-VIDEO-BROLL-GEN-11H-RETRY-INFERENCE-PROOF: rerun bounded Wan latent inference proof with 11H fix, no generated video`
