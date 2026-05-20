# Mock Vs Real Status

## Real Frontend Implemented

- Vite/React app shell and routes
- chat-native editor
- edit plan and credit estimate cards
- SoundSync music UI
- SFX Director UI
- StoryTiming timing review UI
- frontend-safe Supabase client factory, when public env values are configured

## Mock Backend Implemented

- planning, edit quality, credit, job, generation, render/preview/revision/QA services
- SoundSync music services
- SFX Director services and worker skeletons
- StoryTiming planner, timing integration, QA, render manifest, and worker-readiness services
- provider gateway placeholders and mock clients

## Local Schema Only

- 18 Supabase migrations in `supabase/migrations`
- RLS and storage policy migrations
- SFX Director tables
- StoryTiming master timing tables

## Not Real Yet

- deployed Supabase tables
- generated Supabase database types
- auth/profile/workspace bootstrap
- real project/chat/media persistence
- storage upload runtime
- backend API/service-role runtime
- credit purchase/spend enforcement
- real provider calls
- real worker queues
- real rendering

## Safety Boundary

The Vite/browser app may use only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Service-role keys, provider secrets, Stripe secrets, and deployment secrets remain backend-only and must not be exposed to browser code.
