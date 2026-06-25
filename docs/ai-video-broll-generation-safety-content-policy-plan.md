# AI Video B-roll Generation Safety / Content Policy Plan

Status: `ai_video_broll_gen_0_safety_content_policy_plan_no_execution`

Gate 0 is policy planning only. It does not run moderation, model inference, media processing, worker execution, provider calls, storage writes, signed URL creation, public artifact creation, beta unlock, or production unlock.

## Prohibited Prompt Classes

- Sexual content, sexualized minors, exploitation, or abuse.
- Instructions to create deceptive evidence, fake news footage, false documentary proof, or impersonation.
- Instructions to generate private individuals, biometric likeness, or identifiable persons without approval.
- Graphic violence, extremist praise, illegal activity facilitation, or targeted harassment.
- Copyrighted characters, living artist style requests, protected logos, or brand misuse without rights.
- Medical, legal, financial, political, or public safety claims presented as real footage without review.

## People / Likeness Policy

Generated B-roll should avoid realistic identifiable people unless a later policy and user approval explicitly allow it. Synthetic people must not imply endorsement, identity, or real-event evidence.

## Brands / Logos Policy

Use generic product/environment visuals by default. Brand logos, product UI, packaging, storefronts, and trademarks require user-supplied source material or legal/brand approval.

## Violence / Adult / Minors Policy

Minors and adult/sexualized content are blocked for generated B-roll. Violence must remain non-graphic and contextually safe only after moderation and human review if needed.

## Misinformation / Deepfake Policy

Generated B-roll must not represent itself as captured footage. Documentary, news, legal, political, or proof-oriented use cases require disclosure and human review. Deepfake-like use is blocked unless a future compliance owner approves a narrow policy.

## Copyrighted Style / Character Policy

Do not request living artist imitation, studio-specific style replication, copyrighted characters, or protected fictional worlds. Use generic descriptive visual language.

## User Disclosure Policy

Future UI must label generated B-roll candidates as AI-generated or synthetic when appropriate. Provenance metadata must be preserved through private artifact and export handoffs.

## Moderation And Human Review Gates

Future gates require prompt moderation, output QA, provenance review, sensitive-use classification, abuse review, audit logs, and human review for high-risk categories.

## Audit Log Policy

Future audit records must include plan snapshot ID, model candidate, prompt summary, safety classification, user approval state, blocked-use findings, generated artifact references if any, and reviewer evidence. No audit row is created in Gate 0.
