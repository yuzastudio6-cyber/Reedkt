# Phase 39C-Q-SO3 VLM Label Alias Policy

Phase 39C-Q-SO3 uses aliases only to recognize equivalent labels in generated synthetic fixtures. Alias matching is not a semantic repair step and cannot invent labels that the model did not provide.

Allowed aliases include controlled equivalents such as `timeline`, `timeline panel`, and `bottom track`, or `caption band`, `caption area`, and `lower third`. The alias map is committed as safe metadata in `phase_39cq_so3_label_alias_map.json`.

Alias matching remains blocked for real media, arbitrary user media, provider outputs, direct tool execution, beta, production, and Track A. If a label is missing from model output, the canary records a miss; it does not patch the output to pass.
