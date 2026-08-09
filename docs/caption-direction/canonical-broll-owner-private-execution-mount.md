# Canonical B-roll owner evidence mount

## Outcome

The Caption specialist can now continue the same approved scene-planning job
after the canonical B-roll owner supplies its frozen
`b_roll_caption_owner_read_result_v1` result.

Caption does not choose footage, crop footage, retime footage, read media bytes,
or dispatch B-roll work. The mount accepts only the existing byte-free public
request/result boundary.

## Canonical sequence

1. Caption emits its HQ-mediated B-roll owner-read request and returns
   `needs_followup`.
2. The shared specialist resume repository rereads the exact prior Caption call,
   result, and first pending support request.
3. A process-admitted approved-snapshot reader rereads the exact snapshot,
   output-frame, scene, frame range, MasterTiming, and planning-constraint
   authority twice.
4. A process-admitted B-roll owner reader rereads the exact owner result twice.
5. The owner result is persisted create-only and reread before any projection.
6. The frozen Caption adapter validates the complete request/result lineage and
   derives only opaque selected-media, layout, crop-timing, and visible-text
   references.
7. One authenticated specialist artifact projection is persisted and reread.
8. The Caption evidence record is persisted create-only and reread.
9. The canonical sequential-resume owner injects only that current B-roll result
   into the same Caption job. Caption reruns its own closed admission and can
   complete planning.

## Fail-closed behavior

The mount rejects an unadmitted reader, caller-supplied owner result, wrong
authenticated owner, stale or crossed snapshot/output/scene/frame/timing scope,
non-current support request, changed result between rereads, digest tampering,
unsafe serialized text, create-only collision, and mismatched injected artifact.

All source-selection, crop/timing, peer-dispatch, media-runtime, asset, cost,
billing, final-QA, public-delivery, and production authority remains false.

## Internal qualification evidence

`npm run smoke:canonical-caption-broll-support` covers the canonical rereads,
create-only persistence, opaque Caption binding, generic sequential resume,
idempotent replay, and adversarial refusal cases without starting media or model
runtime.
