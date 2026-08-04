# Edit Level Product Contract

RP-EDITLEVEL-01 defines the future beta product contract for Edit Level. It has no runtime implementation and does not rename the current `basic | pro | premium` runtime values.

## Product Model

- Project = workspace/container.
- ProjectEditSession = persistent video editing session / Edit Chat.
- Edit Level = quality/depth contract for the edit.
- Normal = clean professional edit.
- Premium = enhanced creative edit.
- Ultra Premium = studio-level creative treatment.
- Edit Brief = optional timeline instruction layer inside an Edit Chat.
- Edit Preference / Preference DNA = reusable style intelligence.
- Qwen 3.7 = main reasoning brain.
- Qwen2.5-VL-7B-Instruct = visual/video understanding specialist.
- DeepSeek V4 Pro = coding/tool-code/Remotion draft agent only.

## Universal Rule

All levels are a professional edit. Normal is not low quality. Higher levels increase depth, polish, analysis, QA strictness, creative layering, and future budget. Higher levels do not change basic correctness.

## Level Contract

| Level | Promise | Best for | Expected depth |
| --- | --- | --- | --- |
| Normal | Clean professional edit. Efficient, reliable, fast path. | Straightforward edits and simple creator videos. | Clean pacing, basic cut/remove guidance, simple captions when needed, basic source metadata, basic export settings, standard Qwen 3.7 reasoning, targeted visual context only when needed, baseline QA, minimal tool budget. |
| Premium | Enhanced creative edit. More polished, more directed, better creative decisions. | Creators, business content, social posts, product videos, and stronger storytelling. | Stronger hook/story/pacing, source video understanding package, Qwen2.5-VL key visual moments and marker windows, timecoded transcript when speech exists, audio/music/SFX/ducking recommendations, styled captions/cards, Edit Preference / DNA applied strongly, Edit Brief markers prioritized when present, premium QA, medium tool budget. |
| Ultra Premium | Studio-level creative treatment. Deepest analysis and strongest polish. | Launches, ads, brands, cinematic pieces, high-value social content, and complex edits. | Deep source understanding, scene-level Qwen2.5-VL visual analysis, transcript plus speech timing, audio/music/SFX/sound design planning, graphic/text/layout understanding, deep Preference DNA use, Edit Brief strongly recommended, advanced B-roll strategy, advanced captions/cards/motion direction, multi-pass Qwen 3.7 reasoning, strict QA, highest tool budget, higher future render and revision budget. |

## Public Copy Guidance

Future UI should describe the levels as increasing creative depth and production support. It must not describe Normal as cheap, low quality, ungraded, rough, or amateur. Product copy should explain that credit estimate only values, render budget future metadata, and revision budgets are planning concepts until backend gates exist.

## Runtime Boundary

RP-EDITLEVEL-01 is architecture/docs/status/smoke only. It does not add TypeScript runtime types, repositories, API routes, UI behavior, migrations, provider calls, media processing, render/export, progress, or credit spend.
