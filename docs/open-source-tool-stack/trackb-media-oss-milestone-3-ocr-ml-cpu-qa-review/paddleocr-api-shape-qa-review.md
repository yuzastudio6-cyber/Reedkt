# PaddleOCR API-Shape QA Review

PaddleOCR is accepted as bounded CPU import/API-shape proof only.
The accepted local font config is `PADDLE_PDX_LOCAL_FONT_FILE_PATH=/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc`.
No PaddleOCR object instantiation, OCR inference, model/font asset operation, exact PingFang use, or network access is accepted.
