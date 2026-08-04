# Edit Level QA By Level

## Normal

Normal uses `qaStrictness: baseline` and readiness `ready_for_mock_planning`.

It requires baseline safety/copy, source presence, source metadata, export settings, caption safe-zone, basic audio sanity, and marker time-range validity. Missing marker assets, marker clarification, and marker conflicts are warning-only. Render, revision, and credit gates are future-only.

Normal remains a clean professional edit, not a low-quality edit.

## Premium

Premium uses `qaStrictness: premium` and readiness `ready_with_warnings`.

It includes all Normal gates plus caption readability, B-roll timing, pacing, styled graphic/card QA, music/SFX/ducking guidance, Preference DNA match, source-context warnings, Qwen response validation policy, Qwen2.5-VL confidence warnings, and plan completeness.

## Ultra Premium

Ultra Premium uses `qaStrictness: ultra` and readiness `blocked_by_future_runtime_gate`.

It includes all Premium gates plus strict copy-risk, story/style quality, visual/audio/design confidence, graphic layout, source context completeness, strict Preference DNA, strict Edit Brief marker priority, strict plan completeness, and future render/revision/credit gates.

Ultra Premium may show Premium-safe degraded fallback notices until the future runtime systems exist.
