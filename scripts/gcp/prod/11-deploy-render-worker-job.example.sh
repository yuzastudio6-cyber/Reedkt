#!/usr/bin/env bash
set -euo pipefail

echo >&2 "Blocked: the historical CPU render worker cannot be deployed for fresh WeEditPro rendering."
echo >&2 "Use 10-deploy-gpu-worker-job.example.sh; admitted render/encode work runs on the scale-from-zero L4 standard lane."
exit 2
