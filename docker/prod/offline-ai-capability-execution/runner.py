import base64
import hashlib
import importlib.metadata
import io
import json
import math
import struct
import sys
import wave
import warnings

MAXIMUM_REQUEST_BYTES = 8 * 1024 * 1024
MAXIMUM_ARTIFACT_BYTES = 8 * 1024 * 1024
PROTOCOL = 'offline-ai-capability-execution-v1'
CONTAINER_PROTOCOL = 'offline-ai-capability-execution-container-v1'
OPERATIONS = {
    'torch_torchvision': 'tool.torch_torchvision.verify_tensor_vision_runtime.v1',
    'transformers': 'tool.transformers.verify_transformers_runtime.v1',
    'music21': 'tool.music21.analyze_music_structure.v1',
    'kornia': 'tool.kornia.refine_mask.v1',
}
PACKAGE_IDENTITIES = {
    'torch_torchvision': {'packageName': 'torch+torchvision', 'version': '2.13.0+cpu+0.28.0+cpu'},
    'transformers': {'packageName': 'transformers', 'version': '5.13.0'},
    'music21': {'packageName': 'music21', 'version': '10.5.0'},
    'kornia': {'packageName': 'kornia', 'version': '0.8.3'},
}


def exact(value, keys, label):
    if not isinstance(value, dict) or sorted(value.keys()) != sorted(keys):
        raise ValueError(f'{label} contains unsupported fields')
    return value


def integer(value, expected, label):
    if not isinstance(value, int) or isinstance(value, bool) or value != expected:
        raise ValueError(f'{label} is unsupported')
    return value


def committed_bytes(payload, prefix, mime_type, minimum, maximum, signature):
    mime_key = f'{prefix}MimeType'
    length_key = f'{prefix}ByteLength'
    sha_key = f'{prefix}Sha256'
    bytes_key = f'{prefix}BytesBase64'
    if payload[mime_key] != mime_type or not isinstance(payload[length_key], int) or not isinstance(payload[sha_key], str) or not isinstance(payload[bytes_key], str):
        raise ValueError('content commitment is invalid')
    encoded = payload[bytes_key].encode('ascii')
    data = base64.b64decode(encoded, validate=True)
    if base64.b64encode(data) != encoded or len(data) != payload[length_key] or not minimum <= len(data) <= maximum or hashlib.sha256(data).hexdigest() != payload[sha_key] or not data.startswith(signature):
        raise ValueError('content commitment does not match bytes')
    return data


def validate_request(value):
    request = exact(value, ['schemaVersion', 'toolId', 'operationId', 'payload'], 'request')
    tool_id = request['toolId']
    if request['schemaVersion'] != PROTOCOL or tool_id not in OPERATIONS or request['operationId'] != OPERATIONS[tool_id]:
        raise ValueError('request identity is unsupported')
    if tool_id in ('torch_torchvision', 'transformers'):
        payload = exact(request['payload'], ['capabilityProfile', 'expectedRuntimeMajor'], 'capability payload')
        expected_major = 2 if tool_id == 'torch_torchvision' else 5
        if payload['capabilityProfile'] != 'cpu_import':
            raise ValueError('capability profile is unsupported')
        normalized = {'capabilityProfile': 'cpu_import', 'expectedRuntimeMajor': integer(payload['expectedRuntimeMajor'], expected_major, 'expectedRuntimeMajor')}
    elif tool_id == 'music21':
        payload = exact(request['payload'], ['sampleRate', 'channelMode', 'analysisProfileId', 'confidenceThreshold', 'sourceMimeType', 'sourceByteLength', 'sourceSha256', 'sourceBytesBase64'], 'music21 payload')
        if payload['channelMode'] != 'mono' or payload['analysisProfileId'] != 'approved_music_structure_v1' or payload['confidenceThreshold'] != 0.6:
            raise ValueError('music21 policy is unsupported')
        source = committed_bytes(payload, 'source', 'audio/wav', 1024, 4 * 1024 * 1024, b'RIFF')
        normalized = {**payload, 'sampleRate': integer(payload['sampleRate'], 48000, 'sampleRate'), 'sourceBytesBase64': base64.b64encode(source).decode('ascii')}
    else:
        payload = exact(request['payload'], ['confidenceThreshold', 'maximumSubjects', 'frameStride', 'edgeRefinementProfileId', 'preserveContactObjects', 'sourceMimeType', 'sourceByteLength', 'sourceSha256', 'sourceBytesBase64'], 'kornia payload')
        if payload['confidenceThreshold'] != 0.5 or payload['maximumSubjects'] != 1 or payload['frameStride'] != 1 or payload['edgeRefinementProfileId'] != 'approved_mask_close_v1' or payload['preserveContactObjects'] is not True:
            raise ValueError('kornia policy is unsupported')
        source = committed_bytes(payload, 'source', 'image/png', 64, 1024 * 1024, b'\x89PNG\r\n\x1a\n')
        normalized = {**payload, 'sourceBytesBase64': base64.b64encode(source).decode('ascii')}
    return {'schemaVersion': PROTOCOL, 'toolId': tool_id, 'operationId': OPERATIONS[tool_id], 'payload': normalized}


def execute_torch():
    import torch
    import torchvision
    from torchvision.transforms import functional as vision_functional
    torch.manual_seed(0)
    tensor = torch.arange(1, 10, dtype=torch.float32).reshape(1, 1, 3, 3)
    resized = vision_functional.resize(tensor, [6, 6], antialias=True)
    product = torch.matmul(tensor.reshape(3, 3), torch.eye(3))
    if resized.shape != (1, 1, 6, 6) or not torch.equal(product, tensor.reshape(3, 3)):
        raise ValueError('torch fixture failed')
    document = {'capabilityProfile': 'cpu_import', 'cudaAvailable': bool(torch.cuda.is_available()), 'tensorChecksum': round(float(resized.sum().item()), 6), 'tensorShape': list(resized.shape), 'torchVersion': torch.__version__, 'torchvisionVersion': torchvision.__version__}
    return json_artifact(document), {'entrypoint': 'torch.cuda.is_available', 'tensorOperationExecuted': True, 'torchvisionResizeExecuted': True, 'cpuOnlyVerified': not document['cudaAvailable']}


def execute_transformers():
    import transformers
    available = transformers.utils.is_torch_available()
    config = transformers.AutoConfig.for_model('bert', hidden_size=64, num_hidden_layers=2, num_attention_heads=4, intermediate_size=128, vocab_size=256)
    document = {'capabilityProfile': 'cpu_import', 'configClass': type(config).__name__, 'hiddenSize': config.hidden_size, 'modelType': config.model_type, 'torchAvailable': bool(available), 'transformersVersion': transformers.__version__}
    if not available or document['configClass'] != 'BertConfig' or document['modelType'] != 'bert':
        raise ValueError('transformers fixture failed')
    return json_artifact(document), {'entrypoint': 'utils.is_torch_available', 'offlineConfigConstructed': True, 'modelWeightsLoaded': False, 'networkRequired': False}


def execute_music21(payload):
    warnings.filterwarnings('ignore', message=r'urllib3 .*doesn.*match a supported version.*')
    from music21 import interval, note, stream
    source = base64.b64decode(payload['sourceBytesBase64'])
    with wave.open(io.BytesIO(source), 'rb') as audio:
        if audio.getnchannels() != 1 or audio.getsampwidth() != 2 or audio.getframerate() != 48000:
            raise ValueError('music21 WAV format is unsupported')
        samples = struct.unpack('<' + 'h' * audio.getnframes(), audio.readframes(audio.getnframes()))
    segment_length = len(samples) // 4
    notes = []
    score = stream.Stream()
    for segment_index in range(4):
        segment = samples[segment_index * segment_length:(segment_index + 1) * segment_length]
        crossings = sum(1 for index in range(1, len(segment)) if (segment[index - 1] < 0 <= segment[index]) or (segment[index - 1] >= 0 > segment[index]))
        frequency = crossings * 48000 / (2 * len(segment))
        midi = round(69 + 12 * math.log2(frequency / 440))
        parsed_note = note.Note(midi, quarterLength=1)
        score.append(parsed_note)
        notes.append(parsed_note.nameWithOctave)
    key = score.analyze('key')
    intervals = [interval.Interval(score.notes[index], score.notes[index + 1]).name for index in range(3)]
    document = {'analysisProfileId': 'approved_music_structure_v1', 'detectedNotes': notes, 'estimatedKey': key.tonic.name, 'estimatedMode': key.mode, 'intervals': intervals, 'sampleRate': 48000, 'sourceSha256': payload['sourceSha256']}
    return json_artifact(document), {'entrypoint': 'stream.Stream.analyze', 'approvedWavBytesVerified': True, 'fourPitchSegmentsAnalyzed': len(notes) == 4, 'musicTheoryAnalysisExecuted': True}


def execute_kornia(payload):
    import kornia
    import torch
    from PIL import Image
    from torchvision.transforms import functional as vision_functional
    source = base64.b64decode(payload['sourceBytesBase64'])
    image = Image.open(io.BytesIO(source)).convert('L')
    if image.size != (64, 64):
        raise ValueError('kornia source dimensions are unsupported')
    tensor = vision_functional.pil_to_tensor(image).float().div(255).unsqueeze(0)
    binary = (tensor >= payload['confidenceThreshold']).float()
    kernel = torch.ones(3, 3, dtype=torch.float32)
    refined = kornia.morphology.closing(binary, kernel)
    output_tensor = refined.squeeze(0).mul(255).byte()
    output_image = vision_functional.to_pil_image(output_tensor)
    output = io.BytesIO()
    output_image.save(output, format='PNG', optimize=False, compress_level=9)
    data = output.getvalue()
    active_pixels = int((refined > 0).sum().item())
    if not 100 <= active_pixels <= 3996:
        raise ValueError('kornia output lacks reviewed mask pixels')
    return binary_artifact('image/png', data), {'entrypoint': 'kornia.morphology.closing', 'approvedMaskBytesVerified': True, 'morphologyClosingExecuted': True, 'activePixelCount': active_pixels, 'width': 64, 'height': 64}


def json_artifact(document):
    data = json.dumps(document, sort_keys=True, separators=(',', ':'), ensure_ascii=True).encode('utf-8')
    return binary_artifact('application/json', data)


def binary_artifact(mime_type, data):
    if not 2 <= len(data) <= MAXIMUM_ARTIFACT_BYTES:
        raise ValueError('artifact is outside bounds')
    return {'mimeType': mime_type, 'bytesBase64': base64.b64encode(data).decode('ascii'), 'byteLength': len(data), 'sha256': hashlib.sha256(data).hexdigest()}


def verify_package_identity(tool_id):
    if tool_id == 'torch_torchvision':
        actual = f"{importlib.metadata.version('torch')}+{importlib.metadata.version('torchvision')}"
    else:
        actual = importlib.metadata.version(tool_id)
    if actual != PACKAGE_IDENTITIES[tool_id]['version']:
        raise ValueError('package identity mismatch')


try:
    stage = 'REQUEST_VALIDATION_FAILED'
    raw = sys.stdin.buffer.read(MAXIMUM_REQUEST_BYTES + 1)
    if len(raw) > MAXIMUM_REQUEST_BYTES:
        raise ValueError('request exceeds ceiling')
    request = validate_request(json.loads(raw.decode('utf-8')))
    verify_package_identity(request['toolId'])
    if request['toolId'] == 'torch_torchvision':
        stage = 'TORCH_TORCHVISION_EXECUTION_FAILED'
        artifact, semantic = execute_torch()
    elif request['toolId'] == 'transformers':
        stage = 'TRANSFORMERS_EXECUTION_FAILED'
        artifact, semantic = execute_transformers()
    elif request['toolId'] == 'music21':
        stage = 'MUSIC21_EXECUTION_FAILED'
        artifact, semantic = execute_music21(request['payload'])
    else:
        stage = 'KORNIA_EXECUTION_FAILED'
        artifact, semantic = execute_kornia(request['payload'])
    response = {
        'schemaVersion': CONTAINER_PROTOCOL, 'ok': True, 'toolId': request['toolId'], 'operationId': request['operationId'],
        'status': 'actual_ai_capability_operation_completed', 'packageIdentity': PACKAGE_IDENTITIES[request['toolId']],
        'requestEnvelopeSha256': hashlib.sha256(json.dumps(request, separators=(',', ':'), ensure_ascii=True).encode('utf-8')).hexdigest(),
        'artifact': artifact, 'semanticEvidence': {'actualPackageEntrypointExecuted': True, **semantic, 'zeroNetworkRuntimeRequired': True},
        'readiness': {'privateInternalOnly': True, 'productReady': False, 'externalBetaReady': False, 'productionReady': False},
    }
    sys.stdout.write(json.dumps(response, sort_keys=True, separators=(',', ':'), ensure_ascii=True))
except Exception:
    sys.stderr.write('Private AI capability execution failed.\n')
    sys.stdout.write(json.dumps({'ok': False, 'code': stage if 'stage' in locals() else 'EXECUTION_FAILED'}, separators=(',', ':')))
    sys.exit(3)
