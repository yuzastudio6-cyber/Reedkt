# Preference DNA Qwen Bridge

The Qwen bridge package prepares structured inputs for a future `preference_dna_analyst` reasoning step. It includes DNA layer summaries, confidence, evidence ref IDs, must-follow rules, avoid rules, do-not-copy rules, and an expected output schema.

RP-PREF-VIDEO-07 does not call Qwen. The bridge is a typed prompt package only:

- `providerCallMade: false`
- `qwenCallMade: false`
- no token usage
- no cost
- no worker
- no route
- no persistence

Future reasoning runtime must still pass provider config, backend runtime, approval, credit, worker, and do-not-copy gates.

RP-PREF-VIDEO-08 adds QA over this bridge. The QA layer blocks any bridge that implies provider/Qwen calls, omits structured inputs, or loses do-not-copy rules.
