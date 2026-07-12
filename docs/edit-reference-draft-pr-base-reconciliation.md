# Edit Reference Draft PR Base Reconciliation

Status date: 2026-07-12

Decision: **Decision B — create a clean PR branch**

## Inputs

| Input | Identity |
| --- | --- |
| Verified source | `codex/beta-integration-reconcile` at `dc2f3625ec6e7652e8ae9c064c1c96160b07a8a1` |
| Remote base | `origin/codex/reeditpro-web-ui-shell` at `e405e69e1a43fd2609854d8acaa7a4ef959b7e94` |
| Merge base | `84a0eb46c93ca5a200b1e5c9bd7976d28210e0a0` |
| Source-only commits | 49 |
| Remote-only commits | 324 |
| Selected PR branch | `codex/edit-reference-end-to-end` |

The lineages diverged substantially, so pushing or rebasing the source branch would have produced an excessively broad and unsafe PR.

## Reconciliation Method

1. Created the PR branch from the exact remote-base SHA.
2. Replayed the 21 Gate 0–8.1 Edit Reference commits in dependency order.
3. Resolved conflicts against current remote-base product architecture rather than choosing whole old files.
4. Added only missing feature dependencies.
5. Preserved the verified source branch as an unchanged rollback/reference source.
6. Re-ran focused and full branch verification.

No force reset, destructive rebase, source-branch mutation, force push, or remote-system mutation occurred.

## Product And Route Resolution

The remote base's clean edit setup remains the authority at:

`/projects/:projectId/edits/:editSessionId`

The required chat-native Edit Reference and marker planning surfaces use their dedicated routes:

- `/projects/:projectId/edits/:editSessionId/chat`
- `/projects/:projectId/edits/:editSessionId/brief`

The base workspace now exposes a clear **Open Edit Chat** action. Backend-local edit creation returns to the clean base workspace; selecting an approved Edit Reference in New Edit opens the dedicated Edit Chat with one canonical target application.

The active Preferences route opens Edit References by default. Existing current-base settings remain under Workspace Defaults. Retired pages and old shell routes were not restored as competing primary surfaces.

## UI/UX Resolution

Authority order:

1. `design.md`;
2. `design-system/MASTER.md` and `design-system/pages/edit-preferences.md`;
3. the remote base's active project-first UI;
4. UI UX Pro Max as supporting guidance only.

Reconciliation retained current ReEditPro color, typography, spacing, card, button, focus, responsive, and progressive-disclosure rules. It added a skip link, 44 px controls, bounded tabs, responsive Edit Reference layouts, and truthful safety copy without importing another visual system.

## Dependency Resolution

Earlier preference and Qwen integration commits were not cherry-picked wholesale. Missing Preference DNA primitives were added narrowly, and Marker Chat accepts a validated target-bound PreferenceApplication context without reinstating the retired marker-context dependency stack.

The server remains the authority for live-model calls. Browser packages use a deterministic non-cryptographic hash only for browser-safe content identity; server canonical records retain SHA-256.

## Migration Reconciliation

The source branch had 21 migrations. The selected remote base has 24. The three additional migrations belong to the newer base, not this feature.

Result:

- PR migration count: 24.
- Changed migration files: 0.
- AppleDouble migration files: 0.
- Remote Supabase commands: 0.
- Production database claim: none.

## Package Reconciliation

`package.json` gains Edit Reference smoke and control-plane commands. `package-lock.json` remains byte-identical to the remote base. No package installation changed tracked content.

## Test Reconciliation

The remote base intentionally removed or redirected several older active-route surfaces while retaining stale browser expectations. Tests were updated to assert the selected product architecture:

- **Edit Preferences** replaces the old sidebar label, with Edit References first and Workspace Defaults preserved.
- `/internal-testing` remains retired from the active product; direct controlled Brief tests remain available.
- Edit Setup, Edit Chat, and Edit Brief are separate routes.
- Browser copy assertions follow current base wording.
- Safe local auth/upload/preview gates are environment-controlled and reusable without enabling live providers.

No implementation assertion was deleted merely to hide an Edit Reference failure. The selected branch proves the feature with 12 focused tests and the whole branch with 43 discovered tests, 42 passed, one explicitly live-provider-gated, and zero failed.

## Rollback

The clean branch can be discarded or its bounded commits reverted while the verified source branch remains intact. No database, provider, billing, deployment, or public-delivery rollback is necessary.
