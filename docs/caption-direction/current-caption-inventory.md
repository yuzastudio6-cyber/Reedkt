# CAP-00R Current Caption Inventory

Inventory base: `bfd269fa3ff6aca397f53eb4519ca0ed22b0b251`

## Committed reusable foundations

| Area | Committed owner/evidence | CAP treatment |
| --- | --- | --- |
| Professional skill catalog | `src/types/professional-skills.ts`, registry and planner | adapt flat `captions.*` entries into internal composite mappings |
| Visual Intelligence | public v1 types, skill registry, routes, lifecycle, authenticated read | consume through support; retire Caption Qwen ownership |
| StoryTiming | `src/types/storytiming.ts` and backend services | sole final frame/event authority |
| Speech/caption workers | faster-whisper/speech-caption foundations and deterministic caption builders | keep transcript/artifact inputs; remove creative phrase ownership |
| Caption output | SRT, WebVTT, fixed-canvas ASS, libass execution | keep stable fallback; add canvas/font/language-aware v2 |
| Caption QA policies | timing, readability, safe-zone and worker QA | keep as baseline; add final-raster, depth, motion, language, sound, export QA |
| Approved snapshots | approved-snapshot types/services/validation | extend with versioned Caption refs; never create a second approval |
| Work graph/asset manifest | canonical private work orchestration and asset ownership | add Caption work/artifact categories through existing owners |
| Remotion/FFmpeg | private Remotion execution and FFmpeg packaging/probe foundations | use as existing renderer/package owners |
| SAM 3.1 | canonical GPU runtime/task owner behind mask work | consume only through Track All-compatible support |
| Living Frame | public CAP-11-compatible types and server-owned internals | keep opaque; never import `server/living-frame/*` |

## Exact committed gaps

- no top-level `captions` specialist manifest;
- no committed `SkillCapabilityManifest` public type on this base;
- no `SkillQualificationSnapshot`;
- no `SkillSupportRequest`;
- no `OrchestraSkillCall`;
- no `OrchestraSkillJobResult`;
- no standalone Captions specialist harness;
- no committed `caption_design` composition graph;
- no Caption opportunity/reservation/finish/scene-graph/motion/render/repair
  domain on this base;
- no Caption-to-Visual or camera receiving execution owner;
- no general public Track All support boundary discovered on this base;
- fixed `1080×1920` ASS canvas and system-family font fallback;
- current caption builder remains single-stream, word/character bounded, and
  seconds-first;
- current deterministic QA cannot prove professional appearance.

## Historical preservation implementation

The backup tree contains:

- 39 Caption library files;
- 35 Caption public type files;
- 70 relevant server/service/smoke files;
- CAP-01–17 reports and private evidence receipts.

None of those inspected specialist files is tracked in that checkout. Treat
them as candidate implementation and adversarial-test input. Reuse requires:

1. exact per-file review against the clean base;
2. owner and public-contract reconciliation;
3. removal of direct Qwen/SAM/peer-dispatch lanes;
4. strict dependency closure;
5. tests reproduced in the clean branch;
6. reviewable commits rather than broad copying.

## Known historical evidence classes

The preservation audit reported `47 verified_private`,
`35 verified_contract`, `5 missing_integration`, and
`6 blocked_external`. Those are historical evidence labels, not a completion
percentage and not proof on this clean branch.

The highest-value candidates are strict closed-record validators, CAP-11,
multi-track scene/render contracts, visual-inspection receipts, multilingual
parity fixtures, StoryTiming motion lock, local repair/fallback logic, and
authenticated read-model patterns. The most important retirements are direct
Caption Qwen ownership, direct SAM execution, creative decisions in basic
caption workers, fixed ASS canvas authority, system-font authority, synthetic
final word motion, and browser-local completion.
