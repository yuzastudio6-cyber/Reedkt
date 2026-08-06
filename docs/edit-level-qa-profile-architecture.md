# Edit Level QA Profile Architecture

Every level must satisfy the professional edit baseline. Higher levels add stricter QA, not basic correctness.

## QA Profiles

| Profile | Checks |
| --- | --- |
| Normal QA profile | Baseline safety, export sanity, caption safe-zone basics, audio obvious issue check, copy-risk block, missing required source check, and existing Basic/Pro/Premium model-rule compatibility. |
| Premium QA profile | All Normal checks plus pacing consistency, B-roll timing, caption readability, music ducking, SFX restraint, Preference DNA match, Edit Brief marker conflicts, and missing asset checks. |
| Ultra Premium QA profile | All Premium checks plus story arc quality, style consistency, sound design coherence, motion/card consistency, visual context confidence, multi-platform export checks, strict copy-risk review, and plan completeness. |

## Approval Relationship

QA profile selection should become part of the approved plan snapshot once runtime profiles exist. Workers must execute the approved QA profile and fallback policy rather than reinterpret raw chat.

## Boundary

No QA service, route, repository, worker, provider call, media analysis, render/export, or credit spend is implemented here.
