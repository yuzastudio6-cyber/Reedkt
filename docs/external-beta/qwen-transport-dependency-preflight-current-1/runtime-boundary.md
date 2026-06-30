# QWEN Transport Dependency Preflight Current Runtime Boundary

This phase runs only local source contract evaluation. It does not run gcloud auth probes, does not fetch identity tokens, does not resolve Cloud Run service URLs, does not call Cloud Run, and does not execute QWEN2.5-VL.

The only accepted blocker after this preflight remains `blocked_gcloud_user_and_adc_reauthentication_required_before_qwen_real_dispatch_1r`.

No full draft stack import, PR merge, retarget, branch rewrite, Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, QWEN2.5-VL execution, Cloud Run invocation, Cloud Run deployment, Cloud Run service URL resolution, audience resolution, identity token fetch, request send, worker execution, worker dispatch, service-role route execution, route execution, browser capture, signed URL creation, public artifact creation, generated asset creation, credit mutation, Stripe checkout/webhook/payment processing, broad external beta audience unlock, paid production unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, Docker execution, Remotion execution, package installation beyond dependency validation, dependency mutation, package-lock mutation, Dockerfile install-source change, requirements install-source change, or broad service-role handler was enabled.
