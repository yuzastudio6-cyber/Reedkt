# Qwen2.5-VL Private Invoke CPU Caller Image Source

This directory defines the future CPU-only Cloud Run Job caller image source for Qwen private-invoke contract validation.

The image source is intentionally standard-library Python only:

- no CUDA base image;
- no GPU packages;
- no model weights;
- no Qwen or vLLM dependencies;
- no build or deploy performed by this checkpoint.

The future job should run with one task, zero retries, no GPU, no minimum instances, Direct VPC egress through the dedicated Qwen caller subnet, and a narrow service account. It should fetch an identity token only inside the future job, never print token values, and send only the structured contract payload.
