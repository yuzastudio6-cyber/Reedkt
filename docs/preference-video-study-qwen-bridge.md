# Preference Video Study Qwen Bridge

Status: RP-PREF-VIDEO-01 mock/local complete.

The DNA bridge service creates a `preference_video_dna_reasoning` prompt package shape for the Qwen-backed `preference_dna_analyst` role. It reuses RP-MODEL-03 reasoning-agent prompt contracts and records:

- source/reference metadata;
- mock evidence summaries;
- structured evidence item descriptors;
- transferable rule candidates;
- non-transferable detail candidates;
- do-not-copy rules;
- recommended DNA layers.

The bridge does not call Qwen, create token usage, inspect secrets, create jobs, or mutate preferences. Real Qwen runtime belongs to a later backend/model milestone.

## RP-PREF-VIDEO-07 Bridge Expansion

The Preference DNA builder now creates a richer Qwen bridge from synthesized DNA layers. The bridge contains structured layer summaries, evidence refs, rules, and schema metadata. It still records `providerCallMade: false` and `qwenCallMade: false`.

## RP-PREF-VIDEO-08 Bridge QA

Preference DNA QA verifies that the Qwen bridge remains bridge-only: `providerCallMade=false`, `qwenCallMade=false`, structured inputs exist, and do-not-copy rules are present. A bridge that implies a live model call or omits safety rules is not safe for future preference creation/save/use.
