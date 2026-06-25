# AI Video B-roll Generation License / Provenance Evidence Matrix

Status: `ai_video_broll_gen_1_evidence_matrix_no_execution`

This matrix records the Gate 1 evidence used to decide which candidates may proceed to weight source and checksum planning. It does not authorize weight download, dependency install, inference, generated video, Docker, GCP, Supabase, SQL, provider calls, worker dispatch, storage, signed URLs, public artifacts, billing, beta, production, `dry_run_passed`, or `generated_local_fixture_passed`.

| Candidate | Source URL | License URL | Model-card / weight evidence URL | License classification | Output/provenance note | Gate 1 status |
| --- | --- | --- | --- | --- | --- | --- |
| Wan / Wan2.1 | https://github.com/Wan-Video/Wan2.1 | https://github.com/Wan-Video/Wan2.1/blob/main/LICENSE.txt | Official repo and linked model sources must be pinned in Gate 2 | Apache-2.0 working evidence | Generated outputs still require ReEditPro provenance, disclosure, QA, and content policy | approved for checksum planning |
| LTX / LTX-Video | https://github.com/Lightricks/LTX-Video | https://github.com/Lightricks/LTX-Video/blob/main/LICENSE | https://huggingface.co/Lightricks/LTX-Video | Apache-2.0 code repo; model/weight terms require exact-version split | Original LTX-Video, LTXV 0.x/2B, LTX-2, and LTX-2.3 must not be conflated | approved for checksum planning with version split |
| LTX / LTX family weight surfaces | https://static.lightricks.com/legal/LTX-Video-Open-Weights-License-0.X.pdf | https://github.com/Lightricks/LTX-2/blob/main/LICENSE | https://ltx.io/model/license | Version-specific and version-sensitive custom/open-weight/commercial surfaces | ARR/commercial/API/model-family terms require compliance review before runtime | version split required |
| Mochi 1 | https://github.com/genmoai/mochi | https://huggingface.co/genmo/mochi-1-preview | https://huggingface.co/genmo/mochi-1-preview | Apache-2.0 working evidence | Direct/magnet download paths are not approved by Gate 1; Gate 2 should prefer official Hugging Face checksums | approved for checksum planning |
| HunyuanVideo | https://github.com/Tencent-Hunyuan/HunyuanVideo | https://github.com/Tencent-Hunyuan/HunyuanVideo-1.5/blob/main/LICENSE | Official Hunyuan model-card/weight surfaces require legal review | Custom Tencent community license with territory limits | Not eligible for default global ReEditPro B-roll use until legal accepts territory and commercial terms | blocked |

## Compliance Notes

- `Wan / Wan2.1` remains the primary lane because its current official evidence is permissive enough to plan controlled weight-source verification.
- `LTX / LTX-Video` remains secondary and cost/preview friendly, but Gate 2 must select a specific model/version and license artifact before checksums.
- `Mochi 1` remains fallback/research because it is permissive but heavier and less product-targeted for stock-style B-roll.
- `HunyuanVideo` remains optional premium gated and blocked for the next weight-source planning step.

## Required Gate 2 Evidence

- Exact model identifier.
- Exact version, commit, tag, or model-card revision.
- License artifact URL and local notice requirements.
- Approved weight source URL.
- Checksum algorithm and expected checksum collection method.
- Private local/cache storage policy.
- Runtime owner mapping for CPU/GPU cost review.
- Explicit no-install and no-inference status until later gates.
