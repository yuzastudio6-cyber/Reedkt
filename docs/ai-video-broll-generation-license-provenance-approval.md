# AI Video B-roll Generation License / Provenance Approval

Status: `ai_video_broll_gen_1_license_provenance_approval_no_execution`

Decision: `ai_video_broll_gen_1_license_provenance_approval_completed_with_warnings_ready_for_weight_source_checksum_plan`

This Gate 1 packet records license and provenance findings for the open-source AI video B-roll lane. It does not download model weights, install dependencies, run inference, generate video, run Docker, touch GCP, mutate Supabase, execute SQL, call providers, dispatch workers, create storage objects, create signed URLs, create public artifacts, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Evidence

| Model | Evidence URL | Finding |
| --- | --- | --- |
| Wan / Wan2.1 | https://github.com/Wan-Video/Wan2.1 | Official repository presents Wan2.1 as Apache-2.0 licensed and states generated outputs are not claimed by the project, subject to license compliance. |
| Wan / Wan2.1 license | https://github.com/Wan-Video/Wan2.1/blob/main/LICENSE.txt | Apache License 2.0 text is present for the repository. |
| LTX / LTX-Video | https://github.com/Lightricks/LTX-Video | Official repository is Apache-2.0 licensed and now points to newer LTX-2/LTX development. |
| LTX / LTX-Video model card | https://huggingface.co/Lightricks/LTX-Video | Hugging Face model card is the current model-card surface for the original LTX-Video lane. |
| LTX open weights license surfaces | https://static.lightricks.com/legal/LTX-Video-Open-Weights-License-0.X.pdf and https://github.com/Lightricks/LTX-2/blob/main/LICENSE | LTX weight/model family licensing is version-sensitive and must be pinned before any weight source or runtime step. |
| Mochi 1 | https://huggingface.co/genmo/mochi-1-preview | Hugging Face model card describes Mochi 1 preview as released under a permissive Apache-2.0 license. |
| HunyuanVideo | https://github.com/Tencent-Hunyuan/HunyuanVideo and https://github.com/Tencent-Hunyuan/HunyuanVideo-1.5/blob/main/LICENSE | Hunyuan license family includes territory restrictions and remains legal-gated. |

## Approval Scope

Gate 1 approves only the next planning step for selected candidates:

- Wan / Wan2.1 may proceed to weight source and checksum planning.
- Mochi 1 may proceed to weight source and checksum planning.
- LTX / LTX-Video may proceed to weight source and checksum planning only with exact version split between legacy LTX-Video, LTXV 0.x/2B, LTX-2, and LTX-2.3 surfaces.
- HunyuanVideo may not proceed to weight download planning until legal, territory, commercial, and output-use review is accepted.

This approval is not an install approval, runtime approval, beta approval, production approval, route execution approval, provider approval, worker approval, storage approval, or billing approval.

## No-Scope Statement

No model weights are downloaded. No dependency is installed. No inference is run. No generated video is created. No Docker container is built or started. No GCP resource is touched. No Supabase command is run. No SQL is executed. No provider is called. No worker is dispatched. No storage object is created. No signed URL is created. No public artifact is created. No credit estimate, credit approval, reservation, spend, refund, or release is created. No beta, production, runtime-readiness, `dry_run_passed`, or `generated_local_fixture_passed` claim is made.

## Model Decisions

| Role | Model | Gate 1 decision | Why |
| --- | --- | --- | --- |
| Primary | Wan / Wan2.1 family | `approved_for_weight_source_checksum_planning` | Current upstream evidence is Apache-2.0-aligned enough to plan exact weight source, commit/tag, checksum, storage, and runtime review. |
| Secondary | LTX / LTX-Video | `approved_for_weight_source_checksum_planning_with_version_split_required` | Repository license is Apache-2.0, but newer LTX family surfaces include different weight/model agreements; exact version and license file must be pinned next. |
| Fallback/research | Mochi 1 | `approved_for_weight_source_checksum_planning` | Hugging Face model card states permissive Apache-2.0; next gate must choose approved weight source and reject uncontrolled direct/magnet paths unless reviewed. |
| Optional premium gated | HunyuanVideo | `blocked_pending_legal_territory_commercial_review` | Hunyuan license family includes territory restrictions and custom terms; keep optional premium gated and unavailable for weight planning by default. |

## Required Controls For Next Gate

- Pin repository commit, model card revision, license file URL, and weight source URL.
- Prefer official repository or Hugging Face sources over mirrors, repackages, torrents, magnets, or user uploads.
- Require checksum plan before any download approval.
- Require private model cache and storage policy before any weight handling.
- Require GPU/VRAM/runtime cost review before install or import.
- Require provider gateway and worker runtime owner handoff before any real execution path.
- Require safety/content policy review before any generated B-roll can be used in a user-visible preview.
- Preserve existing Wan/Hailuo/Veo routing and tier rules; this lane is open-source generated B-roll ownership, not a replacement provider router.

## Next Prompt

`AI-VIDEO-BROLL-GEN-2: weight source/checksum plan`
