# Production Beta Blocker Inventory

Active blockers remain:
- production deployment
- external beta
- paid production
- provider calls
- worker/tool/route execution
- public artifacts and signed URL source-of-truth flows
- raw prompt execution
- Supabase production writes
- model orchestration runtime calls

Qwen/DeepSeek repo audit does not remove these blockers.

## Track A Post-PR706 PR708 Metadata Reconciliation

`TRACKA-POST-PR706-PR708-METADATA-RECONCILIATION-1` is metadata-only and preserves the production/beta blockers above. Decision: `tracka_post_pr706_pr708_metadata_reconciliation_passed_pr708_context_preserved_ready_for_stale_pr_close_prompt`.

PR #706 remains package-source-policy source-of-truth with `TRACKA-NATIVE-CONTAINER-PACKAGE-SOURCE-POLICY-REVIEW-1 decision: blocked_no_safe_package_source_policy_available` at merge commit `a293ec57a304728b2ab4f731ab1fd58f5c9aaec8`. PR #708 remains open/dirty/stale and should not merge directly after PR #706; PR #701 remains open/dirty/stale and should not merge directly.

Preserved context: PR #708 preserved PR #701 context after PR #702; pushed post-PR690 branch classification `superseded_by_pr697_context_only_no_reconciliation_required`; later close prompt `TRACKA-CLOSE-STALE-PR701-PR708-AFTER-POST-PR706-RECONCILIATION`.

GPAC/MP4Box remains `blocked_gpac_mp4box_package_source_unavailable`. VapourSynth remains `blocked_core_vapoursynth_package_source_unavailable` and `blocked_vapoursynth_native_plugin_policy_not_satisfied`. Revideo remains `evaluation_only_non_core_owner_approval_required_before_install_source`. Hyperframe remains `handoff_only_no_install_source_change`. GStreamer/MKVToolNix remain `qa_passed_controlled_generated_private_fixture_execution_evidence`.

Product-ready local OSS tools: `0`. Track B FFmpeg/FFprobe ownership remains preserved. #577 remains open/draft/blocked and excluded as source-of-truth. Supabase classification: no write / environment none / SQL none / migration no. Supabase update status: `not_applicable_docs_only`.

Package-lock/Dockerfile/.dockerignore/runtime source mutation: `none`. Generated artifacts committed: `none`.

## Track A GPAC/MP4Box Owner Source Classification

`TRACKA-GPAC-MP4BOX-OWNER-SOURCE-CLASSIFICATION-REQUEST-1` is metadata-only and preserves all production/beta blockers. Decision: `tracka_gpac_mp4box_owner_source_classification_passed_ready_for_official_gpac_apt_repo_approval`.

Selected source class: `official_gpac_apt_repository`. The official APT source still needs a separate approval lane before any apt source/keyring/Dockerfile/install/runtime mutation. Component `main` is the only future candidate; `nightly` remains blocked. Bento4 remains `separate_not_selected_for_mp4box_command_path`.

Next prompt: `TRACKA-GPAC-MP4BOX-OFFICIAL-APT-REPO-APPROVAL-1`.

Product-ready local OSS tools: `0`. Track B FFmpeg/FFprobe ownership remains preserved. #577 remains open/draft/blocked and excluded as source-of-truth. Supabase classification: no write / environment none / SQL none / migration no. Supabase update status: `not_applicable_docs_only`.

Package-lock/Dockerfile/.dockerignore/runtime source mutation: `none`. Generated artifacts committed: `none`.

## Track A GPAC/MP4Box Official APT Repo Approval

`TRACKA-GPAC-MP4BOX-OFFICIAL-APT-REPO-APPROVAL-1` is metadata-only and preserves all production/beta blockers. Decision: `tracka_gpac_mp4box_official_apt_repo_approval_passed_ready_for_pinning_keyring_install_source_plan`.

The official GPAC APT source class is approved for a future pinning/keyring/install-source plan only. Future target metadata is `https://dist.gpac.io/gpac/linux/debian`, `bookworm`, component `main`, key endpoint `https://dist.gpac.io/gpac/linux/gpg.asc`, and package candidate `gpac`. Component `nightly` remains blocked, Bento4 remains `separate_not_selected_for_mp4box_command_path`, and no install/runtime/product approval is granted.

Next prompt: `TRACKA-GPAC-MP4BOX-PINNING-KEYRING-INSTALL-SOURCE-PLAN-1`.

Product-ready local OSS tools: `0`. Track B FFmpeg/FFprobe ownership remains preserved. #577 remains open/draft/blocked and excluded as source-of-truth. Supabase classification: no write / environment none / SQL none / migration no. Supabase update status: `not_applicable_docs_only`.

Package-lock/Dockerfile/.dockerignore/runtime source mutation: `none`. Generated artifacts committed: `none`.

## Track A GPAC/MP4Box Owner/Environment Follow-Up

`TRACKA-GPAC-MP4BOX-PACKAGE-SOURCE-OWNER-ENVIRONMENT-FOLLOWUP-1` is metadata-only and preserves all production/beta blockers. Decision: `tracka_gpac_mp4box_owner_environment_followup_blocked_no_owner_environment_source_approval`.

GPAC/MP4Box remains `blocked_no_owner_environment_source_approval_for_gpac_mp4box`, with allowed future source `none_until_owner_environment_source_approval`. Bento4 remains `separate_not_selected_for_mp4box_command_path`. PR #711 and #713 remain source-of-truth; PR #701 and PR #708 are closed without merge and stale context only.

Next prompt: `TRACKA-GPAC-MP4BOX-OWNER-SOURCE-CLASSIFICATION-REQUEST-1`.

Product-ready local OSS tools: `0`. Track B FFmpeg/FFprobe ownership remains preserved. #577 remains open/draft/blocked and excluded as source-of-truth. Supabase classification: no write / environment none / SQL none / migration no. Supabase update status: `not_applicable_docs_only`.

Package-lock/Dockerfile/.dockerignore/runtime source mutation: `none`. Generated artifacts committed: `none`.
