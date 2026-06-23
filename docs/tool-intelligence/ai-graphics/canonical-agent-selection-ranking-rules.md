# Canonical Agent Selection Ranking Rules

Decision: `ai_graphics_canonical_agent_selection_review_passed_with_warnings`.

- Rank candidate tools by task fit first.
- Prefer higher proof level when task fit is comparable.
- Demote tools requiring unapproved browser/WebGL/canvas runtime.
- Demote tools requiring unapproved GPU/model weights.
- Prefer lower-cost and lower-complexity planning paths when capability fit is similar.
- Return missing-proof requirements before any execution can be considered.
