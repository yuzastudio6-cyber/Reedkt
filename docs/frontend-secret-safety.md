# Frontend Secret Safety

## RP-API-03 Update

RP-API-03 reinforces that Supabase service-role and provider secrets are backend-only. Mock boundary reports are metadata-only and never read, print, or return secret values; frontend-safe responses remain required for mock route execution.

Implementation date: 2026-06-18.

Frontend/browser code may use public Vite config only. It must not reference backend/provider secret names as runtime config, read server env, import provider credential helpers, or call models/providers directly.

## Safe Public Config

Safe public config is limited to the public names documented in `src/lib/reeditpro-public-runtime-config.ts`.

## Unsafe Runtime References

The frontend boundary check now scans browser runtime roots for backend/provider secret names such as Qwen, DeepSeek, Lyria, Mirelo, MMAudio, Supabase service-role, Stripe secret, and Google service account JSON names.

Type contract files and docs may mention secret names as policy. Runtime frontend code must not.

## Current Status

`npm run check:frontend-boundary` verifies server-only package imports and provider-secret-name references in frontend runtime code.
