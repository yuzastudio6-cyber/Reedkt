# Exact Asset Identity Review

Requested asset: `PingFang-SC-Regular.ttf`

Requesting component: PaddleX font assets via `paddlex.utils.fonts.PINGFANG_FONT`.

PR #600 evidence showed PaddleOCR/PaddleX attempting to reach `https://paddle-model-ecology.bj.bcebos.com/paddlex/PaddleX3.0/fonts/PingFang-SC-Regular.ttf` under `--network none`. The asset is a runtime font fetch, not a committed repo asset or a model file proven by checksum.

No font asset was downloaded, copied, uploaded, staged, or committed in this review.
