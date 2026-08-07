# Exact-byte control-plane review only. This image contains no SAM source,
# checkpoint, torch, CUDA, inference runtime, media, or customer data.
FROM clamav/clamav@sha256:75fb5fd95fcbe1d7e6d240c369c1572b686ee2c95949d1042b5148de8eddebb4

ARG WEEDITPRO_SOURCE_COMMIT_SHA
ARG WEEDITPRO_SOURCE_TREE_HASH

LABEL io.weeditpro.product="WeEditPro" \
  io.weeditpro.operation.id="canonical_sam3_1_private_artifact_static_review" \
  io.weeditpro.runtime.purpose="exact-byte-security-license-malware-review-only" \
  io.weeditpro.source.commit="${WEEDITPRO_SOURCE_COMMIT_SHA}" \
  io.weeditpro.source.tree="${WEEDITPRO_SOURCE_TREE_HASH}" \
  io.weeditpro.model.weights.included="false" \
  io.weeditpro.model.execution.allowed="false" \
  io.weeditpro.runtime.gpu.required="false" \
  io.reeditpro.compatibility="legacy-cloud-coordinate-only"

USER root

RUN apk add --no-cache python3=3.12.13-r0 \
  && freshclam --stdout \
  && rm -f /var/lib/clamav/freshclam.dat /var/lib/clamav/mirrors.dat \
  && clamscan --version \
  && python3 --version

COPY docker/prod/sam31-private-artifact-review/review.py \
  /opt/weeditpro/sam31-private-artifact-review/review.py

RUN python3 -I -B -m py_compile \
      /opt/weeditpro/sam31-private-artifact-review/review.py \
  && ! grep -Eq \
      '(^|[[:space:]])(import|from)[[:space:]]+(torch|sam3)|pickle\.loads|torch\.load' \
      /opt/weeditpro/sam31-private-artifact-review/review.py \
  && chmod 0555 /opt/weeditpro/sam31-private-artifact-review/review.py \
  && find /var/lib/clamav -maxdepth 1 -type f -exec chmod 0444 '{}' +

USER 100:100
WORKDIR /tmp

ENTRYPOINT ["python3", "-I", "-B", "/opt/weeditpro/sam31-private-artifact-review/review.py"]
