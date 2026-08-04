# Canonical Professional Edit Brief Workspace Verification

Date: 2026-07-24

## Outcome

The mounted named-edit workflow now presents Edit Brief as the professional
secondary workspace it was designed to be: private source playback, a
time-based marker lane, point/range marker editing, priority and confirmation,
Marker Chat, and the existing structured Brief fields all remain inside the
same `EditorPage -> ChatNativeEditor` authority.

Chat remains the editor. This slice adds no standalone Brief route, second
editor, second plan, second approval, or second persistence authority.

## Authority flow

1. A browser-selected source `File` may be held in JavaScript memory for local
   playback. It is never copied into localStorage, sessionStorage, IndexedDB,
   a request body, or a planning record. A full reload requires re-selection.
2. Browser-safe Brief and marker commands use the existing authenticated
   `/v1/projects/:projectId/edit-sessions/:editSessionId/edit-brief` routes with
   exact workspace scope, revision CAS, and domain idempotency.
3. Canonical planning re-reads the uploaded source binding and confirmed output
   frame, then creates source-verified marker context, deterministic QA, and
   plan hints before publication.
4. Draft, archived, stale, conflicting, source-unverified, or frame-unconfirmed
   markers cannot silently become approved planning input.
5. Approval-time locking and immutable approved-snapshot behavior remain in the
   existing canonical authority.

## User-facing behavior

- Private video player with truthful reload/re-selection behavior.
- Scrubbable playhead and timeline ruler.
- Exact point or range markers with edit intent, priority, title, and notes.
- Confirmation, reopen/archive history, and Marker Chat direction.
- Responsive one-column behavior at narrow widths and 44-pixel interactive
  targets.
- One-time workspace focus when Edit Brief is opened; delayed rerenders cannot
  steal the user’s scroll position.
- Provider, credential, internal-cost, and hidden-reasoning details remain
  outside the browser projection.

## Verification

- `npm run smoke:edit-brief-authority`
- `npm run typecheck:server`
- `npm run build`
- focused ESLint for every changed server, client, component, and browser path
- `npm run qa:editor` — 20/20 Chromium scenarios
- `git diff --check`

The authority smoke includes rich Brief-field persistence, tenant/CAS/replay
and tamper checks, approval locking, exact source candidate and source-sequence
hash binding, confirmed 3840x2160 output-frame binding, frame-authoritative
marker conversion, deterministic QA, and plan-hint readiness.

## Closed gates

This is reviewed private/local source and browser evidence. It does not prove a
deployed Supabase repository/RLS adapter, hosted private-media playback,
deployed provider or worker execution, customer billing, public delivery, or
production readiness. Those gates remain fail-closed.
