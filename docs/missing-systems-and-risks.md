# Missing Systems And Risks

## Missing Systems

- StoryTiming / master timing engine.
- Real Supabase connection.
- Supabase Auth profile bootstrap.
- Supabase Storage strategy.
- Backend API routes.
- Real AI planning model integration.
- Google Cloud worker runtime.
- Real media upload pipeline.
- Real transcription/visual/audio analysis.
- Real Lyria integration.
- Real SFX provider integration.
- Real rendering/compositing.
- Real credit spend/refund service.
- Stripe checkout/webhooks.
- Production monitoring.
- Cost controls.
- Rate limits.

## Supabase Risks

- Deploying schema before StoryTiming may require later core schema changes.
- The SoundSync Music Intelligence migration is missing on this branch.
- Migrations may have enum/constraint conflicts until locally validated.
- RLS helper functions and policies need local test coverage.
- Service role access must never touch the frontend.
- No `supabase/config.toml` exists locally in this branch.
- Supabase CLI is not available in the current shell.

## Product And Runtime Risks

- App is still a Vite frontend plus mock backend architecture, not a production backend.
- Real uploads/storage are missing.
- Real rendering/export is missing.
- Real provider calls are missing.
- Worker runtime architecture exists but no workers execute.
- Editing quality depends heavily on a missing master timing system.
- Real Motion and AI video cost can grow quickly without production cost controls.

## Audio And Licensing Risks

- Generated music reuse requires provider terms, provenance, QA, and legal/commercial review.
- SFX licensing needs platform and client-work rights.
- Lyria integration is mock/disabled and should remain behind backend/worker boundaries.
- The current branch lacks the SoundSync migration expected by RP-AUDIO-03.

## Security And Privacy Risks

- Browser capture must be authorized and must not bypass auth, paywalls, CAPTCHAs, robots, rate limits, or site restrictions.
- Sensitive browser/dashboard captures need redaction planning.
- Source media access controls are not implemented.
- Secrets/API keys must stay out of the repo and frontend.

## Recommended Risk Reduction

1. Add StoryTiming architecture/types/schema before live deployment.
2. Restore or recreate the missing SoundSync migration before audio DB deployment.
3. Install Supabase CLI and run local migration validation.
4. Add explicit `.env*` ignore rules while keeping `.env.example`.
5. Build a secure backend boundary before real Supabase writes or provider calls.
6. Add cost controls before Real Motion, Lyria, and AI video execution.
