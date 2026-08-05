# CAP-19 — Migration and Retirement Report

Milestone: `CAP-19`

Status: `source_complete`

## Outcome

CAP-19 publishes a closed, versioned compatibility boundary for historical
Caption plans and snapshots without granting historical code a new execution
path. The boundary preserves all ten CAP-02 legacy skill mappings, all eleven
CAP-10 legacy style IDs, the simple subtitle/export compatibility lane, and an
explicit rollback manifest. It also freezes seven retired owner identities so
that old evidence remains readable while fresh work, automatic rollback, and
owner reactivation remain impossible.

This milestone performs no media, model, provider, worker, dispatch, billing,
public-delivery, or production action. It does not implement the Orchestra.

## Historical decoding

The new public types distinguish the immutable historical envelope from a
current canonical projection:

- `caption-legacy-plan-envelope-v1` carries byte-free historical intent, old
  skill IDs, old style ID, layout hints, and immutability flags;
- `caption-legacy-snapshot-envelope-v1` carries old snapshot lineage plus
  nullable current approved-snapshot, confirmed-frame, and MasterTiming refs;
- `caption-legacy-migration-projection-v1` records the deterministic decode and
  keeps `executionReady=false` in every disposition.

An old plan without an exact tenant-scoped reread of the current immutable
snapshot, current confirmed output frame, and current MasterTiming is decoded
as read-only. Exact current lineage may yield a
`decoded_current_simple_overlay_candidate`, but the candidate still requires a
fresh plan, estimate, and approval before any canonical owner may create work.
The legacy approved snapshot is never mutated.

Unknown custom styles fail closed until they carry the exact versioned custom
style approval ref. A historical `captions.no_caption_policy` value decodes
only to the exclusive `no_captions` restraint, never to the Caption composite.

## Stable compatibility lane

The only preserved rendering fallback is
`caption_legacy_simple_stable_overlay_v1`. It is deliberately constrained to:

- one stable top-plane Caption track;
- SRT, WebVTT, ASS, or stable burn-in outputs;
- the existing `tool.libass.render_approved_caption_track.v1` renderer;
- the existing `tool.ffmpeg.execute_approved_media_recipe.v1` packager;
- the exact confirmed output frame, never fixed `1080x1920` authority;
- approved immutable font-registry assets, never mutable system-font lookup;
- no intentional subject occlusion, object anchoring, or cross-system
  transform;
- Remotion as final-canvas owner.

The compatibility record is a plan candidate, not a dispatcher, work item,
asset, rendered result, or delivery authorization.

## Retired owners

`caption-retirement-registry-v1` freezes the following dispositions:

| Retired owner | Historical source | Replacement owner | Disposition |
| --- | --- | --- | --- |
| Flat Caption IDs as primary owner | legacy flat skill registry | `captions` | historical read-only |
| Direct Qwen Caption owner | historical Qwen Caption adapters | Visual Intelligence | historical read-only |
| Basic Caption worker creative owner | `caption-execution-runner` | `captions` | historical read-only |
| Fixed ASS canvas authority | `ass-caption-builder` | confirmed-frame owner | historical read-only |
| Mutable system-font authority | `caption-style-policy` | canonical font runtime | historical read-only |
| Synthetic final word-motion authority | synthetic word timing | StoryTiming | prohibited |
| Direct Caption SAM authority | direct SAM 2/SAM 3.1 routes | Track All | prohibited |

Every entry has `historicalReadAllowed=true`, `freshWorkAllowed=false`, and
`rollbackMayReactivateOwner=false`. No file is destructively deleted. A static
source assertion verifies that the current Caption specialist imports none of
the retired Qwen, old worker, fixed ASS, mutable-font, or direct-SAM
implementations.

The old Qwen transport tombstone remains separately verified as
`retired_historical_read_only`, with fresh execution, filesystem media reads,
model loads, subprocesses, network/provider calls, and runtime credential reads
all disabled.

## Rollback boundary

`caption-rollback-manifest-v1` preserves recovery only to the simple stable
overlay with `clean_subtitle` or `minimal_accessibility_captions`. Activation is
never automatic. A canonical owner must create and approve a new version with:

1. a fresh plan and estimate;
2. explicit user approval;
3. a current immutable approved snapshot;
4. the exact confirmed output frame and MasterTiming;
5. an approved font pack;
6. deterministic Caption QA;
7. direct visual inspection; and
8. private review.

Rollback cannot mutate the prior snapshot, reactivate Qwen/SAM, restore the
fixed canvas or system fonts, manufacture final word timing, dispatch an
operation, charge credits, or unlock delivery.

## Verification

`smoke:captions-specialist-cap-19` passes 46 assertions. Positive coverage
includes known-style decode, canonical-order mini-skill mapping, exact current
snapshot candidate admission, no-caption restraint, blocked and approved
custom styles, all legacy mappings/styles, all retired owners, the Qwen
tombstone, the compatibility route, rollback controls, and the current source
import boundary.

Adversarial coverage refuses unknown, mixed, or duplicated legacy skills;
unknown versions; URL-shaped IDs; unknown fields; inherited and cyclic input;
digest tampering; incomplete current-authority claims; cross-scope or stale
plan/snapshot lineage; reactivated execution/SAM flags; reordered components;
missing or reordered retired owners; fresh work; automatic rollback; restored
fixed canvas/system fonts; dispatch; altered styles/mappings; and a false
Orchestra-completion claim.

Focused lint and the complete server typecheck pass. Publication-time aggregate
Caption and repository checks are recorded with the frozen commit receipt.

## Next

CAP-20 will run the final private-internal release regression, security and
dependency/license checks, performance/cost review, exact qualified-versus-
blocked job report, release manifest, complete documentation, and a future
Orchestra mounting guide. The backend workflow owner may consume the frozen
Caption public surfaces in parallel, but no Caption-specific dispatcher or
central Orchestra is added here.
