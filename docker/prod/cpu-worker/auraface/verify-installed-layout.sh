#!/bin/sh
set -eu

runtime_root=/opt/runtime/lib/python3.13/site-packages
model_root=/mnt/reeditpro/model-artifacts/auraface

test -f /app/runner.py
test -f /app/THIRD_PARTY_NOTICES.md
test -d "${runtime_root}/insightface"
test -d "${model_root}"

test -z "$(find /app /opt/runtime /mnt/reeditpro -type f \
  \( -name '*.onnx' -o -name '*.bin' -o -name '*.safetensors' \
  -o -name '*.ckpt' -o -name '*.pt' -o -name '*.pth' \) -print -quit)"

PYTHONPATH=/opt/runtime/lib/python3.13/site-packages \
python -s - <<'PY'
import importlib.metadata

expected = {
    'insightface': '1.0.1',
    'numpy': '2.4.6',
    'onnx': '1.22.0',
    'onnxruntime': '1.28.0',
    'opencv-python-headless': '5.0.0.93',
    'scikit-image': '0.26.0',
}
for package, version in expected.items():
    assert importlib.metadata.version(package) == version

from insightface.model_zoo.arcface_onnx import ArcFaceONNX
from insightface.model_zoo.scrfd import SCRFD
from insightface.utils.face_align import norm_crop

assert ArcFaceONNX is not None
assert SCRFD is not None
assert norm_crop is not None
PY

python -m py_compile /app/runner.py
