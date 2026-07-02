# Qwen Secret Manager Runtime Boundary

RP-QWEN-01 prepares a server-only Secret Manager boundary for Qwen 3.7 without accessing real Secret Manager metadata or values. Qwen 3.7 remains ReEditPro's backend-only reasoning brain, but runtime execution is still disabled.

Boundary statement: symbolic secret references only, disabled resolver only, backend-only, no gcloud, no secret value access, no secret value printed, no provider call, no Qwen call, no Marker Chat runtime change, fake transport first by default.

Verification phrase: Qwen 3.7 remains behind symbolic secret references, a disabled resolver, backend-only access, no gcloud command, no secret value access, no provider call, no Qwen call, no Marker Chat runtime change, and fake transport first.

## Boundary

- Secret references are symbolic secret placeholders, not real values and not confirmed Secret Manager resources.
- The disabled resolver returns blocked results with `valueAccessed: false`, `valuePrinted: false`, and `gcloudCommandRun: false`.
- Frontend code must not import backend Qwen runtime modules or receive Qwen secret references.
- The runtime boundary does not run Supabase, create migrations, create provider clients, or inspect Secret Manager metadata.

## Next

RP-QWEN-02 may design a backend Qwen adapter, but it should use fake transport first unless owner approval explicitly opens real provider gates.
