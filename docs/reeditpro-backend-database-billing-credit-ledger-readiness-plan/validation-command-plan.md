# Validation Command Plan

Run no-install diagnostics for this gate and predecessor readiness gates, followed by `git diff --check` and `git diff --cached --check`.

No `npm ci`, SQL, migration, billing provider, credit mutation, worker, provider, media, external beta, or production command is part of this validation plan.
