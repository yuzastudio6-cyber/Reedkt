# Validation Command Plan

Run no-install diagnostics for this gate and all predecessor readiness gates through the Track B product handoff and final rollup, followed by `git diff --check` and `git diff --cached --check`.

No `npm ci`, Docker, provider, storage, SQL, migration, beta, or production command is part of this validation plan.
