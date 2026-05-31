# VLM Generated Fixture QA Policy

Phase 39C fixtures are synthetic images generated locally for QA. They are not real frames, real videos, user uploads, source media, or arbitrary image inputs.

Required QA checks:

- schema validity must be `1.00`
- required label recall must be at least `0.70`
- broad region accuracy must be at least `0.70`
- ambiguous fixtures should prefer uncertainty or manual review
- safe-zone outputs must avoid risky lower-third recommendations when conflict regions exist

Generated fixture images are temporary runtime artifacts. They are not committed and are uploaded only if a later explicit private artifact policy allows it.
