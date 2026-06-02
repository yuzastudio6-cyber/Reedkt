# ReeditPro Phase 49F private SearXNG service image.
# CPU-only, authenticated Cloud Run service target. No paid providers, browser
# capture, Readability extraction, model weights, GPU runtime, public artifacts,
# or production gates.

FROM --platform=linux/amd64 docker.io/searxng/searxng@sha256:1e35b727bdf12b211635c0f00262fe0c2187be34e32d5cb9bb597f5740976a91

ENV SEARXNG_PORT=8080
ENV SEARXNG_BIND_ADDRESS=0.0.0.0
ENV SEARXNG_METHOD=GET
ENV SEARXNG_LIMITER=false
ENV SEARXNG_PUBLIC_INSTANCE=false
ENV REEDITPRO_RUNTIME_ROLE=phase49f_private_searxng_service
ENV PAID_PROVIDERS_ALLOWED=false
ENV PUBLIC_SEARXNG_INSTANCE_ALLOWED=false
ENV PUBLIC_UNAUTHENTICATED_ACCESS_ALLOWED=false
ENV BROWSER_CAPTURE_ALLOWED=false
ENV READABILITY_EXTRACTION_ALLOWED=false
ENV REEDITPRO_PRODUCTION_READY=false
ENV REEDITPRO_EXTERNAL_BETA_READY=false
ENV REEDITPRO_PAID_PRODUCTION_READY=false
ENV REEDITPRO_BROAD_REAL_MEDIA_READY=false

COPY docker/prod/private-searxng-service/settings.yml.template /etc/searxng/settings.yml
COPY docker/prod/private-searxng-service/limiter.toml.template /etc/searxng/limiter.toml

EXPOSE 8080
