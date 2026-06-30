# Blocked Scope Register

Blocked in this phase:

- Live route execution
- Worker dispatch
- Worker execution
- GStreamer execution
- MKVToolNix execution
- FFmpeg/FFprobe execution
- Docker execution
- Remotion execution
- Media processing
- Private/user media processing
- Supabase mutation
- SQL execution
- Secret Manager payload access
- Service-role secret payload access
- Broad service-role handler execution
- Signed URL creation
- Public artifact creation
- Credit mutation
- Stripe checkout/webhook/payment processing
- Deployment
- External beta expansion
- Paid production unlock
- Production unlock
- Final delivery/export
- Package installation
- Dependency mutation
- Package-lock mutation
- Dockerfile install-source change

The skeleton is a disabled backend worker metadata contract only. It makes the worker handoff shape more concrete without permitting runtime execution.
