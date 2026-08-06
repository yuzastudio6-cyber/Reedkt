# Repo Milestone File Presence Audit

This report checks representative milestone files in both local paths. It does not copy, move, delete, stage, or reconcile files.

## Summary

| Milestone group | Primary `/Volumes/backup/REeditpro` | Historical `/Users/macuser/Developer/REeditpro` | Result |
| --- | --- | --- | --- |
| Edit Brief | missing | present untracked | historical-only local work |
| Media | missing | present untracked | historical-only local work |
| Qwen | missing | present untracked | historical-only local work |
| Video Context / Qwen2.5-VL | missing | present untracked | historical-only local work |
| Edit Level | present untracked | missing | primary-only local work |
| RC / staging docs | missing | present untracked | historical-only local work |

## Edit Brief Samples

| File | Primary | Historical |
| --- | --- | --- |
| `server/smoke/project-edit-brief-e2e-smoke.ts` | missing | untracked |
| `tests/e2e/project-edit-brief-e2e.spec.ts` | missing | untracked |
| `src/types/project-edit-brief.ts` | missing | untracked |
| `src/types/project-edit-brief-marker-chat.ts` | missing | untracked |
| `src/types/project-edit-brief-attachments.ts` | missing | untracked |
| `src/types/project-edit-brief-export-settings.ts` | missing | untracked |
| `src/types/project-edit-brief-qa.ts` | missing | untracked |
| `src/types/project-edit-brief-plan.ts` | missing | untracked |

## Media Samples

| File | Primary | Historical |
| --- | --- | --- |
| `src/types/project-source-video.ts` | missing | untracked |
| `src/lib/project-source-video-local-preview.ts` | missing | untracked |
| `src/lib/project-source-video-metadata-mappers.ts` | missing | untracked |
| `server/smoke/project-source-video-brief-playback-smoke.ts` | missing | untracked |
| `tests/e2e/project-source-video-brief-playback.spec.ts` | missing | untracked |

## Qwen Samples

| File | Primary | Historical |
| --- | --- | --- |
| `src/types/qwen-runtime-boundary.ts` | missing | untracked |
| `src/types/qwen-runtime-adapter.ts` | missing | untracked |
| `src/types/qwen-marker-chat-runtime.ts` | missing | untracked |
| `src/backend/qwen-runtime/` | missing | untracked |
| `server/smoke/qwen-runtime-boundary-smoke.ts` | missing | untracked |
| `server/smoke/qwen-runtime-beta-smoke.ts` | missing | untracked |
| `scripts/check-qwen-secret-leakage.mjs` | missing | untracked |

## Video Context / Qwen2.5-VL Samples

| File | Primary | Historical |
| --- | --- | --- |
| `docs/video-context-qwen25vl-tool-selection.md` | missing | untracked |
| `docs/video-context-updated-tool-routing-map.md` | missing | untracked |
| `docs/qwen25vl-visual-understanding-role.md` | missing | untracked |
| `docs/qwen37-vs-qwen25vl-role-split.md` | missing | untracked |
| `server/smoke/video-context-qwen25vl-tool-selection-smoke.ts` | missing | untracked |

## Edit Level Samples

| File | Primary | Historical |
| --- | --- | --- |
| `src/types/edit-level.ts` | untracked | missing |
| `src/types/edit-level-repository.ts` | untracked | missing |
| `src/lib/mock-edit-level-profiles.ts` | untracked | missing |
| `src/lib/edit-level-api-client.ts` | untracked | missing |
| `src/backend/repositories/mock-edit-level-repository.ts` | untracked | missing |
| `src/backend/api/edit-level-api-route-registry.ts` | untracked | missing |
| `server/smoke/edit-level-types-smoke.ts` | untracked | missing |
| `server/smoke/edit-level-repository-smoke.ts` | untracked | missing |
| `server/smoke/edit-level-api-routes-smoke.ts` | untracked | missing |
| `server/smoke/edit-level-api-client-smoke.ts` | untracked | missing |

## RC / Staging Docs

| File | Primary | Historical |
| --- | --- | --- |
| `docs/rc-pr-split-manifest.md` | missing | untracked |
| `docs/rc-owner-review-packet.md` | missing | untracked |
| `docs/rc-pr-01-dry-run-staging-plan.md` | missing | untracked |
| `docs/rc-pr-01-file-list.md` | missing | untracked |
| `docs/rc-worktree-file-inventory.md` | missing | untracked |
| `docs/rc-pr-stage-readiness-gates.md` | missing | untracked |

## Result

Recent milestone files are not merged into one local source of truth. The next safe staging plan must start with source-of-truth confirmation, not bulk staging.
