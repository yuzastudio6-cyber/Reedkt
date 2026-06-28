# Edit Level Internal Testing Plan

This document defines future tests for runtime milestones. RP-EDITLEVEL-01 adds only an architecture smoke test.

## Future Test Scenarios

- Level cards visible with Normal, Premium, and Ultra Premium.
- Recommendation visible with reason copy.
- User can choose a level.
- Selected level persists in the ProjectEditSession.
- Legacy `basic | pro | premium` values normalize to public profiles.
- Level changes tool budget metadata.
- Level changes Qwen 3.7 reasoning profile.
- Level changes Qwen2.5-VL visual depth.
- Level changes source understanding policy.
- Level changes QA profile.
- Level changes credit estimate only metadata.
- Level changes render budget future metadata.
- Edit Brief optional / Edit Brief recommended / Edit Brief strongly recommended copy appears correctly.
- No credit spend on selection.
- No render/export on selection.
- No provider/model/media worker call on selection.
- No runtime rename occurs before migration milestone.

## RP-EDITLEVEL-01 Smoke

`smoke:edit-level-architecture` should verify required architecture docs exist and contain required product, compatibility, routing, QA, estimate, fallback, and no runtime implementation terms.

## Boundary

Future Playwright and runtime tests belong to RP-EDITLEVEL-02 and later. This milestone does not add UI behavior, backend routes, repositories, migrations, providers, media workers, render/export, or credit execution.
