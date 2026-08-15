#!/usr/bin/env bash
set -euo pipefail

echo >&2 'Blocked: the historical CPU tool-readiness job cannot qualify fresh WeEditPro processing.'
echo >&2 'Tool and CUDA readiness must be measured inside the exact immutable A100/L4 release qualification attempt.'
exit 2
