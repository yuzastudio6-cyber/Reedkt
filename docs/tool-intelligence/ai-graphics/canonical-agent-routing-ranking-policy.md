# Canonical Agent Routing Ranking Policy

Source: PR #623 scoring model.

- `capabilityFit`: 25
- `outputQualityPotential`: 20
- `reliabilityProof`: 15
- `cloudReadiness`: 10
- `costEfficiency`: 10
- `integrationSimplicity`: 10
- `safetyAndControl`: 10
- `totalScore`: 100

Tiers: Tier A, Tier B, Tier C, Tier D, Blocked.

Current use: Planning-time candidate ranking only. Scores never authorize execution.
