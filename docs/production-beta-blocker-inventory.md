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

## RP-DATA-01 Supabase Schema Migration Readiness

`RP-DATA-01-SUPABASE-SCHEMA-MIGRATION-READINESS` records decision `completed_schema_migration_readiness_review_ready_for_migration_safety_packet` and execution `completed_docs_only_schema_rls_storage_readiness_no_sql_execution`.

Internal beta data foundation status: `review_ready_not_applied`. Internal beta end-to-end status: `not_ready`. Product-ready local OSS tools: `0`.

Supabase update required: `future_migration_required`. Supabase update status: `planning_only`. Supabase environment touched: `none`. SQL executed: `none`. Migration deployed: `no`. Storage buckets created: `none`.

Next Supabase action: `RP-DATA-02-SUPABASE-MIGRATION-SAFETY-PACKET`.

Package-lock/Dockerfile/.dockerignore/runtime source mutation: `none`. Generated artifacts committed: `none`.

## ReEditPro End-To-End Internal Beta Readiness 1

`REEDITPRO-INTERNAL-BETA-READINESS-1` records decision `blocked_pending_backend_worker_render_storage_billing_and_tool_runtime_gates` and execution `completed_docs_only_internal_beta_readiness_source_of_truth_no_runtime_unlock`.

Restricted metadata/internal testing remains a candidate, but the upload-to-render internal beta lane is still `not_ready`. The required gates are Supabase schema/RLS/private storage, approved plan snapshot persistence, internal credit reservation ledger, backend job queue and leases, private artifact manifests/checksums/QA/cleanup, Remotion worker private preview/export, backend-only disabled-by-default provider adapters, and negative tests for approval/credit/public-artifact/frontend-provider boundaries.

PR #736 is merged at `9b5665a5f830cabb4b550a5d4aee322821014844`. #577 remains open/draft/blocked and excluded as source-of-truth.

Internal beta end-to-end status: `not_ready`. External beta status: `blocked`. Paid production status: `blocked`. Final delivery/export status: `blocked`.

Product-ready local OSS tools: `0`. Supabase classification: no write / environment none / SQL none / migration no. Supabase update status: `not_applicable_docs_only`.

Package-lock/Dockerfile/.dockerignore/runtime source mutation: `none`. Generated artifacts committed: `none`.

## Track A GPAC/MP4Box Pinning Keyring Install Source Plan

`TRACKA-GPAC-MP4BOX-PINNING-KEYRING-INSTALL-SOURCE-PLAN-1` is metadata-only and preserves all production/beta blockers. Decision: `tracka_gpac_mp4box_pinning_keyring_install_source_plan_passed_ready_for_official_apt_install_source_execution`.

The official GPAC APT source remains `official_gpac_apt_repository` with repository `https://dist.gpac.io/gpac/linux/debian`, codename `bookworm`, component `main`, blocked component `nightly`, key endpoint `https://dist.gpac.io/gpac/linux/gpg.asc`, keyring path `/usr/share/keyrings/gpac-archive-keyring.gpg`, source file `/etc/apt/sources.list.d/gpac.sources`, preferences file `/etc/apt/preferences.d/gpac.pref`, and package candidate `gpac`.

This phase approves only the next bounded official APT install-source execution gate. It does not approve apt source mutation, apt key import, apt update, package install, Dockerfile mutation, requirements mutation, package-lock mutation, runtime source mutation, GPAC/MP4Box execution, media processing, or product/runtime use.

Next prompt: `TRACKA-GPAC-MP4BOX-OFFICIAL-APT-INSTALL-SOURCE-EXECUTION-1`.

Product-ready local OSS tools: `0`. Track B FFmpeg/FFprobe ownership remains preserved. #577 remains open/draft/blocked and excluded as source-of-truth. Supabase classification: no write / environment none / SQL none / migration no. Supabase update status: `not_applicable_docs_only`.

Package-lock/Dockerfile/.dockerignore/runtime source mutation: `none`. Generated artifacts committed: `none`.

## Track A GPAC/MP4Box Official APT Install Source Execution

`TRACKA-GPAC-MP4BOX-OFFICIAL-APT-INSTALL-SOURCE-EXECUTION-1` is a bounded local Docker install-source proof and preserves all production/beta blockers. Decision: `tracka_gpac_mp4box_official_apt_install_source_execution_passed_ready_for_install_source_qa`.

The render-worker image proof used official GPAC APT source `https://dist.gpac.io/gpac/linux/debian`, codename `bookworm`, component `main`, blocked component `nightly`, key endpoint `https://dist.gpac.io/gpac/linux/gpg.asc`, keyring path `/usr/share/keyrings/gpac-archive-keyring.gpg`, source file `/etc/apt/sources.list.d/gpac.sources`, preferences file `/etc/apt/preferences.d/gpac.pref`, and exact installed package `gpac=26.02-rev0-g118e60a90-HEAD` on `arm64`.

Accepted evidence is install-source/package presence only: `dpkg-query -W gpac` returned `gpac	26.02-rev0-g118e60a90-HEAD	arm64`, and `command -v MP4Box` returned `/usr/bin/MP4Box` under `--network none`. No `MP4Box -version`, GPAC/MP4Box media command, media processing, render/export, product runtime, beta, or production approval is granted.

Next prompt: `TRACKA-GPAC-MP4BOX-OFFICIAL-APT-INSTALL-SOURCE-QA-1`.

Product-ready local OSS tools: `0`. Track B FFmpeg/FFprobe ownership remains preserved. #577 remains open/draft/blocked and excluded as source-of-truth. Supabase classification: no write / environment none / SQL none / migration no. Supabase update status: `not_applicable_docs_only`.

Package-lock/.dockerignore/requirements/runtime source mutation: `none`. Dockerfile mutation: `approved_only_for_docker/prod/render-worker/Dockerfile`. Generated artifacts committed: `none`.

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
