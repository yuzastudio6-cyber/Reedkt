# CAP-16 — Complete QA, Repair, and Fallback Report

Milestone: `CAP-16`

Status: `caption_qa_source_complete_with_actual_visual_evidence_external_internal_gates_closed`

## Outcome

CAP-16 adds one strict Caption-owned QA family without creating another visual
provider, renderer, tool dispatcher, asset store, final-QA owner, or delivery
owner:

- `caption-direct-visual-inspection-receipt-v1`;
- `caption-complete-qa-report-v1`; and
- `caption-local-repair-fallback-plan-v1`.

The complete report evaluates transcript, alignment, semantic integrity,
typography, visual placement, occlusion/masks, motion, sound, accessibility and
localization, render/export, and policy/security in one frozen order. It adapts
back into the existing generic `qa_report` and `repair_plan` domain contracts,
including the exact Caption composite, frame, transcript, MasterTiming,
StoryTiming, scene-group, accessibility, artifact, and inspection lineage.

## Visual QA is not simulated

CAP-16 admits only exact rasters that were opened and directly inspected during
CAP-14 and CAP-15. It does not turn a technical probe, a planned bounding box,
or a source fixture into a visual pass.

For the 16:9 output, the receipt binds sixteen `640x360` Remotion golden
rasters: eight full-motion frames and the matching eight reduced-motion frames
at frames `0, 29, 89, 149, 209, 269, 329, 359`. Full and reduced variants are
byte-identical at these settled inspection frames. The frame-329 SHA-256 was
recovered from both accepted CAP-14 inspection directories and all four copies
matched:

`d37ea1bf7ae49f783bdc570d6020f219ce91ad968993c0bed89ece602e6912ea`

The receipt also binds the accepted CAP-15 wide libass raster. The 9:16 receipt
keeps the clipped vertical raster and repaired raster as separate immutable
evidence:

| Evidence | SHA-256 | Disposition |
| --- | --- | --- |
| Wide libass overlay | `2efdd52e81e5256ef9f187c48f032f99866fc3df1b70cd2c608843e6495b24f1` | accepted after direct inspection |
| Vertical long-line overlay | `048ab957cc73ea6c64d400343abf8ebd6cf52acb76ee615210ad5ddcda083368` | visually failed; retained as failed evidence |
| Vertical compact repair | `7f26148639140abf82555b262e24a3e3aa7ee72dc8bf55d159eb42f04185cd45` | accepted after direct reinspection |

The parser recomputes the receipt digest and refuses substituted frame numbers,
wrong raster dimensions, incomplete golden sets, full/reduced settled-frame
drift, wrong duration, cross-canvas evidence, stale artifact hashes, duplicate
inspection IDs, and any claimed provider or final-QA authority.

Bounded direct raster inspection is intentionally distinct from complete-time
pixel inspection, complete motion-playback inspection, and qualified Visual
Intelligence review. Those three claims remain false unless their own exact
evidence is supplied.

## Per-output QA disposition

| Output | Passed | Needs evidence | Not applicable | Caption-scope recommendation |
| --- | ---: | ---: | ---: | --- |
| 16:9 widescreen | 3 | 7 | 1 | `blocked_external_evidence` |
| 9:16 vertical | 3 | 6 | 2 | `blocked_external_evidence` |

Both outputs pass deterministic transcript lineage, semantic preservation, and
closed policy/security checks. The wide output has bounded Remotion raster
evidence but still requires complete motion playback. The vertical libass
fixture contains no Remotion motion claim, so motion is explicitly not
applicable rather than fabricated.

The visual-placement check remains `needs_evidence` even though bounded direct
inspection passed. Professional complete-time Visual Intelligence review is a
separate external owner and cannot be inferred from selected golden rasters.

## Repairs and declared fallbacks

The vertical clipping repair is one completed, versioned, reinspected local
repair. The failed artifact remains preserved and cannot be rewritten into the
passed artifact.

The source plan selects only declared safe fallbacks:

- safe top-plane placement when qualified mask/occlusion evidence is absent;
- silence until SoundSync supplies dialogue-protected final-mix QA; and
- accessible sidecars while a complete qualified caption-track runtime is
  unavailable.

The plan blocks on named owners for authenticated alignment reread, approved
font/shaping runtime, complete-time Visual Intelligence review, complete
caption-track runtime QA, canonical FFmpeg packaging/export QA, complete motion
playback where applicable, and independent final QA. Maps, charts, browser
captures, captions, timing, masks, labels, and QA never fall back to AI video.

Repairs are scoped to the smallest affected output/scene, create new versions,
preserve prior artifacts, and allow unrelated work to continue. Hidden quality
downgrades remain forbidden.

## Closed internal gates

CAP-16 does not claim:

- authenticated final alignment reread;
- approved multilingual font/shaping execution;
- complete caption-track runtime QA;
- complete-time qualified Visual Intelligence review;
- complete motion-playback inspection;
- final dialogue-protected mix QA;
- canonical FFmpeg packaging or final export QA;
- independent final-QA approval; or
- public/production readiness.

Those are explicit internal integration or external-owner gates, not reasons to
stop unrelated Caption implementation. Provider dispatch, repair execution,
asset mutation, credit/billing, final-QA approval, public delivery, and
production authority all remain false.

## Verification

`smoke:captions-specialist-cap-16` passes 39 source and adversarial assertions.
It covers the eleven-layer QA order, exact output isolation, 19 admitted raster
items, full/reduced settled-frame parity, repaired-evidence separation, safe
fallbacks, generic-domain adaptation, exact staleness tuples, and all closed
authorities. Redigested adversarial cases cover substituted frames, wrong
dimensions/duration, parity drift, missing goldens, cross-canvas evidence,
false Visual Intelligence completion, category/disposition mismatches,
not-applicable blocking, stale repair source/codes, hidden downgrade, unknown,
inherited, and cyclic data.

No new media runtime was required for CAP-16; it binds previously inspected
CAP-14/CAP-15 evidence by exact digest. Server typecheck and focused lint are
green. Aggregate Caption and repository checks are recorded at publication.

## Next

CAP-17 connects these frozen Caption artifacts to chat-native presentation,
revision, the existing approval/credit boundary, reload-safe persistence, and
observability without browser-local completion or a Caption-owned provider
dispatcher.
