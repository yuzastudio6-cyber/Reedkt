# AI Video B-roll Generation Weight Source / Checksum Plan

Status: `ai_video_broll_gen_2_weight_source_checksum_plan_no_execution`

Decision: `ai_video_broll_gen_2_weight_source_checksum_plan_completed_ready_for_dependency_install_plan`

This Gate 2 packet defines approved weight source candidates and checksum planning rules for AI video B-roll. It does not download model weights, clone model repositories into tracked source, install dependencies, run inference, generate video, run Docker, touch GCP, mutate Supabase, execute SQL, call providers, dispatch workers, create storage objects, create signed URLs, create public artifacts, mutate credits, unlock beta, unlock production, claim runtime readiness, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

No Supabase command runs. No SQL is executed. No worker is dispatched. No provider is called. No model weights are downloaded.

## Source-Of-Truth Inputs

- `docs/ai-video-broll-generation-license-provenance-approval.md`
- `docs/ai-video-broll-generation-license-provenance-evidence-matrix.md`
- `docs/ai-video-broll-generation-weight-source-eligibility-decision.md`
- `docs/ai-video-broll-generation-weight-download-storage-policy.md`
- `docs/ai-video-broll-generation-runtime-gpu-architecture-plan.md`

## Planned Source Ranking

| Rank | Candidate | Planned model source | Planned use | Reason |
| --- | --- | --- | --- | --- |
| 1 | Wan / Wan2.1 small T2V | https://huggingface.co/Wan-AI/Wan2.1-T2V-1.3B and https://www.modelscope.ai/models/Wan-AI/Wan2.1-T2V-1.3B | Realistic stock-style B-roll, establishing shots, generated filler | First cost-friendly source candidate; smaller than 14B lanes and aligned with Gate 1 primary decision. |
| 2 | Wan / Wan2.1 14B 720p routes | https://huggingface.co/Wan-AI/Wan2.1-T2V-14B and official Wan-AI 14B I2V/Diffusers variants | Higher-quality B-roll or image-to-video after GPU review | Stronger quality path, but higher cost and VRAM; not first download target. |
| 3 | LTX / LTX-Video original lane | https://huggingface.co/Lightricks/LTX-Video | Fast preview, image-to-video, keyframe and motion-graphics-adjacent clips | Cost/latency-friendly secondary lane, but version-specific license terms must remain pinned. |
| 4 | LTX / LTX-2 or LTX-2.3 lane | https://huggingface.co/Lightricks/LTX-2 and https://huggingface.co/Lightricks/LTX-2.3 | Future audio-video or newer LTX comparison only after version acceptance | not conflated with original LTX-Video; requires separate license and runtime review. |
| 5 | Mochi 1 | https://huggingface.co/genmo/mochi-1-preview | Fallback/research, prompt-adherence comparison, LoRA/research path | Permissive fallback, but heavier runtime and direct/magnet paths remain blocked. |
| Blocked | HunyuanVideo | No weight source selected in Gate 2 | Premium gated only after legal/territory/commercial acceptance | Gate 1 blocks Hunyuan from weight source planning. |

## Checksum Plan

- Required algorithm: `sha256`.
- Future checksum source: local checksum computed after an approved download in a later controlled gate.
- Future checksum evidence: private manifest entry containing model id, source URL, license URL, model card URL, file path, byte size, sha256, collection timestamp, reviewer, and cleanup result.
- No checksum is computed in Gate 2 because no model file is downloaded.
- No external checksum is trusted as sufficient unless the future owner gate records source, provenance, and reproducibility.

## Private Cache Plan

- Local proof cache must be outside tracked source and ignored by git.
- Suggested placeholder: `.local-model-cache/ai-video-broll/` only after a later approval creates or uses it.
- No cache directory is created in Gate 2.
- No model file is committed, staged, copied into `public/`, copied into `dist/`, uploaded to storage, or exposed by URL.
- Future cleanup must prove temporary files were removed or quarantined in an approved private cache.

## Blocked Source Types

- Third-party mirrors.
- Torrents or magnet links.
- Unverified ComfyUI packs.
- User-uploaded model bundles.
- Public bucket links.
- Signed URLs as source of truth.
- Repacked safetensors without upstream provenance.
- HunyuanVideo weights before legal/territory acceptance.

## Next Gate Requirements

Before dependency install planning can proceed, Gate 3 must keep these requirements:

- No model download.
- No import or inference.
- Runtime dependency plan only.
- CPU/GPU cost ranking for small preview, mid 720p, and high/premium lanes.
- Worker owner mapping for future install/import proof.
- Private cache and cleanup policy preserved.
- Existing Wan/Hailuo/Veo provider routing unchanged.

## Next Prompt

`AI-VIDEO-BROLL-GEN-3: dependency install plan`
