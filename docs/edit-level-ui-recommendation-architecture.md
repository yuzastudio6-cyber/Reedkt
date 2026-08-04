# Edit Level UI Recommendation Architecture

This document defines future UI behavior only. RP-EDITLEVEL-01 does not modify UI components, routes, state, or `ChatNativeEditor` behavior.

## Future Level Cards

Future level cards should show:

- display label: Normal, Premium, Ultra Premium;
- promise;
- best for;
- what is included;
- estimated depth;
- Edit Brief optional / Edit Brief recommended / Edit Brief strongly recommended guidance;
- tool depth preview;
- mock/beta limitations where relevant.

## Recommendation Behavior

ReeditPro may recommend a level based on source video, user prompt, platform, length, assets, Edit Preference, desired polish, and budget preference. The user can override the recommendation.

Example future copy:

```text
Recommended: Premium
Reason: Short talking-head video with B-roll opportunities and 9:16 social export.
```

## Copy Rules

Normal must be described as a clean professional edit, not low quality. Premium and Ultra Premium add depth, polish, analysis, QA strictness, creative layering, and future budget. Credit estimate only and render budget future language should be visible where estimates are shown.

## Boundary

No UI behavior, card rendering, recommendation runtime, persistence, progress start, credit spend, or render/export is implemented in RP-EDITLEVEL-01.
