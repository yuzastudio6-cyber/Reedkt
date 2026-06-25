# RP-PROVIDER-01-INTERNAL-BETA-DISABLED-PROVIDER-ADAPTER-SCAFFOLD

Use this prompt only after `RP-RENDER-01-INTERNAL-BETA-REMOTION-RENDER-WORKER-SCAFFOLD` is merged and validated.

Implement the next narrow internal beta milestone for disabled-by-default backend provider adapter scaffolds.

Requirements:

- Do not call OpenAI, GPT-Image, Wan, Hailuo, Veo, Lyria, Google, or any provider/model.
- Do not expose provider secrets, create frontend provider adapters, execute workers, render, process media, mutate Supabase, run SQL, create signed/public artifacts, or unlock beta/production.
- Require approved snapshot, credit reservation, model-routing policy, cost caps, provider secret isolation, worker job, artifact manifest, QA, cleanup, and fallback policy before any future provider adapter can leave disabled mode.
- Keep frontend code from calling providers directly.

Expected conservative result if no explicit runtime approval is supplied:

- Decision: `completed_disabled_internal_beta_provider_adapter_scaffold_no_provider_calls`
- Execution: `completed_fail_closed_provider_adapter_scaffold_no_model_execution`
- Provider/model calls: `false`
- Secret payload access: `false`
- Internal beta end-to-end status: `not_ready`
