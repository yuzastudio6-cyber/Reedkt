# B-roll skill architecture

Status: implementation in progress

Canonical runtime identity: `b_roll`

## Decision

B-roll is one orchestra-callable edit skill. It is implemented through a
generic manifest kernel and a B-roll-owned runtime under
`server/edit-skills/`. Internal B-roll planning stages are mini-skills, not
separate global skills.

Track All is not implemented here. B-roll has no dependency on SAM2 or SAM
3.1. It may consume only the model-neutral `track_graph_v1` artifact. When
tracking is necessary and that artifact is absent, B-roll returns the typed
`needs_other_skill` disposition with `track_all` as the dependency.

## Authority chain

The exact immutable capability reference is:

```text
skillKey + skillVersion + contractVersion + manifestHash
```

It must remain identical through manifest resolution, assignment, skill plan,
canonical edit-plan component, approved snapshot, execution package, provider
authorization, and result receipt. Any mismatch fails closed. Approved work
never resolves a newer manifest implicitly.

The orchestra owns assignment, exact timeline range, primary-visual
coordination, and the decision to invoke B-roll. B-roll may read whole-video
context but may mutate only the authorized range. B-roll owns its restraint
decision, editorial role, source strategy, candidate generation request,
candidate selection, B-roll QA, and range-bounded layer handoff. Captions,
Sound, Color, Transition, Track All, Render, and final export retain their
respective final authority.

## Source route order

1. Return `use_no_broll` when the base footage is stronger.
2. Reuse an eligible existing project source.
3. Use an approved user asset.
4. Edit an approved bounded source with Gemini Omni where the account and
   region permit it.
5. Use Gemini Omni image-to-video or reference-image generation.
6. Use Gemini Omni text-to-video.

No stock-library, Wan, Hailuo, Veo, Kling, or generic generated-video fallback
may become an active B-roll route.

## Provider lineage

The existing canonical provider registries V1 through V4 are immutable
historical authority. Their baseline registry hashes are:

| Version | Registry hash |
| --- | --- |
| V1 | `17928478279cc8fd292db235286ae883db2434d79d015e7a16bfadc1a4bde1bd` |
| V2 | `6fbfdef538e3bc9ecb944892586e7eac154f518bdf1df1d3f15bbe3a9fb32d18` |
| V3 | `284b456da2610af6280e080bc9cb24c10989f2ee3401bd2711619622544bfd2b` |
| V4 | `91ea2d40a33f5198f124d6322b61e447bb29ea037dabb808b2f39887cd432eeb` |

B-roll adds a new forward-only V5 operation in a separate module:

- operation: `provider.google.generate_b_roll_candidate.v1`
- boundary profile: `google_gemini_omni_flash_b_roll_provider_boundary`
- provider route: `gemini_omni_flash`
- model: `gemini-omni-flash-preview`
- output role/type: `provider_b_roll_candidate_video_mp4`
- automatic selection: forbidden
- timeline mutation: forbidden

The provider lifecycle permits one initial submission and, only after an
eligible rejected candidate, one new refinement submission. There is no
automatic retry or alternate-provider fallback. Unknown outcomes require
reconciliation before any new submission.

## Gemini Omni constraints

The server-side transport uses the Gemini Interactions API. It supports text
to video, image to video, reference-image video, and supported bounded video
editing. It treats `16:9` and `9:16` as the only native output ratios and plans
a crop-safe handoff for other confirmed frames. Video-reference mode is not an
active dependable route because the preview documentation does not establish
reliable reference-video processing. Uploaded-video editing is blocked in
ineligible regions. Avoidance requirements are part of the main prompt because
the operation has no independent negative-prompt control.

Provider URLs, raw responses, API keys, signed URLs, and media bytes are not
canonical evidence. Output is downloaded once into private create-only,
checksum-verified storage and represented by a sanitized content-addressed
receipt. Stateful refinement stores only the minimum provider interaction
identifier needed for the one authorized refinement.

## Qualification

Qualification is evidence-driven: `declared`, `implementation_pending`,
`planning_qualified`, `internal_execution_qualified`,
`production_qualified`, `blocked`, or `retired`. A manifest claim cannot
exceed its validated qualification receipt. Compilation is not production
qualification. A real paid canary is optional and runs only behind an explicit
operator confirmation and credential/readiness gate.

## Persistence and execution boundaries

All manifests, assignments, plans, work items, candidate receipts, QA records,
and qualification receipts are strict, canonically serialized, SHA-256
addressed records. Runtime artifacts use the existing private create-only
artifact patterns. Execution requires an immutable approved snapshot, funded
reservation, idempotency identity, exact package/work item, lease, private
artifact policy, and backend-only authority.

No frontend surface can authorize provider work, choose a provider route,
provide an executable command, supply a storage path, or inject credentials.
No production database migration or production resource mutation belongs to
this implementation.
