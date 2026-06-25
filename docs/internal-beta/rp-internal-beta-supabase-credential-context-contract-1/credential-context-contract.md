# Credential Context Contract

Packet: `RP-INTERNAL-BETA-SUPABASE-CREDENTIAL-CONTEXT-CONTRACT-1`

Decision: `completed_backend_safe_supabase_credential_context_contract_no_payload_access`

Execution: `completed_server_config_contract_no_remote_execution`

Contract module: `server/config/internal-beta-supabase-credential-context-contract.ts`

Smoke: `npm run smoke:internal-beta-supabase-credential-context-contract`

Diagnostics: `npm run --silent rp-internal-beta-supabase-credential-context-contract-1:diagnostics`

The contract exposes:

- approved access-token alias names;
- approved read-only DB URL alias names;
- target metadata for `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`;
- decision values for missing access-token alias, missing read-only DB URL alias, both missing, or both present;
- fail-closed safety flags for remote Supabase commands, SQL, storage readback, route execution, workers, providers, rendering, signed/public artifacts, and beta/production unlocks.

The contract does not import Supabase clients, Google Cloud SDKs, provider SDKs, payment SDKs, or frontend code. It does not run commands or contact remote services.
