# Safety Boundary

No remote Supabase execution, remote SQL execution, remote migration apply, Secret Manager payload access, provider call, model call, QWEN runtime execution, worker execution, worker dispatch, route execution, Cloud Run invocation, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, additional tester access grant, broad external beta unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, Docker image build/push/deploy, package installation, dependency mutation, package-lock mutation, or broad service-role handler was enabled.

Local execution was limited to the isolated Supabase DB-only harness on the configured local ports and read-only psql schema checks after migration application. Generated local Supabase containers were stopped with `--no-backup`; no generated local database state is committed.
