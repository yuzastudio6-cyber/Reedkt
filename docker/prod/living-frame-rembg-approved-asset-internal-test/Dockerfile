# syntax=docker/dockerfile:1.7@sha256:a57df69d0ea827fb7266491f2813635de6f17269be881f696fbfdf2d83dda33e

ARG BASE_IMAGE=reeditpro-offline-rembg-background-removal-execution:private-local-v1
FROM ${BASE_IMAGE}

LABEL org.opencontainers.image.title="ReEditPro Living Frame private approved-asset rembg internal test" \
  com.reeditpro.runner.protocol="living-frame-rembg-approved-asset-internal-test-container-v1" \
  com.reeditpro.runner.private-internal-only="true" \
  com.reeditpro.runner.canonical-dispatch-authority="false" \
  com.reeditpro.runner.customer-billing-authority="false" \
  com.reeditpro.runner.public-delivery-authority="false" \
  com.reeditpro.runner.product-ready="false" \
  com.reeditpro.runner.external-beta-ready="false" \
  com.reeditpro.runner.production-ready="false"

USER 0:0
COPY docker/prod/living-frame-rembg-approved-asset-internal-test/runner.py /app/living_frame_approved_asset_runner.py
RUN python -m py_compile /app/living_frame_approved_asset_runner.py \
  && chmod 0444 /app/living_frame_approved_asset_runner.py

USER 10001:10001
ENTRYPOINT ["python", "-s", "/app/living_frame_approved_asset_runner.py"]
