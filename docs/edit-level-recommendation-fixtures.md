# Edit Level Recommendation Fixtures

RP-EDITLEVEL-02 adds deterministic recommendation fixtures for future UI/backend milestones. They are not wired into the editor.

## Deterministic Rules

- Short/simple/`fast_clean` requests recommend `normal`.
- Markers, attachments, enhanced polish, social/product/story prompts recommend `premium`.
- Studio, brand, ad, launch, cinematic, complex marker sets, or high attachment count recommend `ultra_premium`.

Recommendation output includes recommended level, confidence, reasons, warnings, degraded capability notices, `userOverrideAllowed: true`, and `mockOnly: true`.

## Boundary

No UI recommendation behavior is added in RP-EDITLEVEL-02.
