# Product workflow route authority correction — 2026-07-22

## Outcome

ReeditPro now keeps the two chat-native products separate by durable authority:

- normal named video edits open Edit Chat at `/projects/:projectId/edits/:editSessionId` and remain discoverable from `/edit-videos`;
- Motion Studio Storytelling opens Director Chat at `/motion-studio/storytelling/projects/:projectId/edits/:editSessionId`;
- content category, query parameters, route shape, and an edit ID beginning with `storytelling-edit-` cannot select Motion Studio.

An explicitly marked Motion handoff is not redirected from the normal named-edit route until the browser re-reads a current production whose project, edit, module, module-catalog version, and stage-profile identities all match. Missing, inaccessible, or mismatched production authority fails closed and creates no replacement production.

## Retained-record migration

Pre-discriminator Motion records are preserved through one narrow signed-in migration boundary. Eligibility requires the unmodified retained record to have no `productWorkflow`, the historical namespaced edit ID, and the exact historical dedicated Storytelling path. Eligibility alone grants no Motion access.

The authenticated backend then:

1. authorizes workspace write access before sensitive idempotency;
2. loads and locks the exact tenant/project/edit record;
3. re-reads the exact current Storytelling production tuple;
4. applies expected-revision CAS and deterministic replay/conflict rules;
5. persists `productWorkflow=motion_studio.storytelling`, the canonical Director path, and a digest-bound migration receipt;
6. re-reads the committed record before returning it.

The receipt binds the source and migrated revisions, request and idempotency hashes, canonical route, production ID/version/time/authority hash, and explicit closed side-effect gates. The generic edit-state writer cannot perform this migration or downgrade an already migrated record.

Local-test prefix-only records are deliberately treated as ordinary video edits. They are never promoted through a mock production or cheap compatibility rule.

## Verification

Focused source and browser acceptance covers:

- normal Storytelling-category edits remaining in Edit Videos and Edit Chat;
- prefix-only retained records remaining visible in Projects/Edit Videos and opening normal Edit Chat;
- prefix-only records remaining absent from the Motion Storytelling library without a production request;
- exact production re-verification before an explicit Motion redirect;
- missing production failing closed with zero production-create requests;
- exact retained-record migration, replay, changed-key conflict, stale/cross-project production rejection, and closed provider/commercial gates;
- the mounted Storytelling library/create/recovery route contract;
- all 64 mounted Motion Studio browser cases, including Director-native Plan Review setup, saved-plan recovery, exact private-review playback/revision, and missing-production behavior across Chat and non-Chat surfaces;
- the Projects and Edit Videos route entrypoints (4/4 focused browser cases);
- the full-stack private-review smoke using the current `New video edit` product copy.

The final source also passes the app and server typechecks, full lint and production build, the 966-file frontend/server boundary check, the 5,490-file secret scan with no values printed, canonical V3 manifest verification (20 migrations / 178 repository files), and `git diff --check`.

Production remains gated. This correction reads no provider or Secret Manager value, performs no cloud or remote Supabase mutation, starts no planning/generation/render job, changes no billing or credit state, and grants no deployment or public-delivery authority.
