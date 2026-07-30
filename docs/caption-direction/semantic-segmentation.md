# Semantic Segmentation

## Primary rule

Caption phrases follow meaning, speech rhythm, syntax, emphasis, and visual purpose. Fixed word/character counts remain fallback bounds, not primary intelligence.

Each phrase records:

- canonical source word IDs;
- exact and display text;
- semantic role;
- clause/sentence relationship;
- emphasis candidates and reason;
- protected token groups;
- timing and confidence;
- selected/rejected line-break candidates;
- transformation provenance.

Head Intelligence may propose phrase groups and emphasis. Deterministic validation checks lineage, coverage, language rules, timing, width, claims, and renderer feasibility.

## Language-aware line breaking

Use shaped font metrics and Unicode-aware rules. Protect:

- names and organizations;
- numbers with units/currency;
- dates, negation, acronyms, and displayed URLs;
- punctuation groups;
- grapheme clusters and emoji sequences;
- RTL reading order;
- CJK line rules;
- Indic shaping and combining marks.

Avoid orphan final words, unstable widths, arbitrary character splits, size oscillation, or splitting a critical phrase across scenes.

## Meaning preservation

Creative condensation must preserve meaning and record omitted source words. Paraphrase is never treated as a caption cleanup; it requires approval, especially for quotations and claim-sensitive content. Accessible projections retain complete wording even when the creative phrase is shorter.

## Fallback ladder

1. semantic phrase with measured layout;
2. simpler semantic phrase/line layout;
3. stable verbatim phrase;
4. current deterministic word/character segmentation;
5. accessible sidecar only if open-caption creativity cannot be rendered safely.

All fallbacks preserve source lineage and visibly record degraded capability.
