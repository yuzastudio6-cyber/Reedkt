#include <algorithm>
#include <array>
#include <cmath>
#include <cstdint>
#include <fstream>
#include <limits>
#include <stdexcept>
#include <string>
#include <vector>

#include "signalsmith-stretch.h"

namespace {

constexpr std::uint32_t kSampleRate = 48000;
constexpr std::uint16_t kChannels = 1;
constexpr std::uint16_t kBitsPerSample = 16;
constexpr std::size_t kInputFrames = 48000;
constexpr double kTimeRatio = 1.25;

std::uint16_t readU16(std::istream& stream) {
  std::array<unsigned char, 2> bytes{};
  stream.read(reinterpret_cast<char*>(bytes.data()), bytes.size());
  if (!stream) throw std::runtime_error("unexpected input end");
  return static_cast<std::uint16_t>(bytes[0]) |
         static_cast<std::uint16_t>(bytes[1] << 8);
}

std::uint32_t readU32(std::istream& stream) {
  std::array<unsigned char, 4> bytes{};
  stream.read(reinterpret_cast<char*>(bytes.data()), bytes.size());
  if (!stream) throw std::runtime_error("unexpected input end");
  return static_cast<std::uint32_t>(bytes[0]) |
         (static_cast<std::uint32_t>(bytes[1]) << 8) |
         (static_cast<std::uint32_t>(bytes[2]) << 16) |
         (static_cast<std::uint32_t>(bytes[3]) << 24);
}

void writeU16(std::ostream& stream, std::uint16_t value) {
  const std::array<unsigned char, 2> bytes{
      static_cast<unsigned char>(value),
      static_cast<unsigned char>(value >> 8),
  };
  stream.write(reinterpret_cast<const char*>(bytes.data()), bytes.size());
}

void writeU32(std::ostream& stream, std::uint32_t value) {
  const std::array<unsigned char, 4> bytes{
      static_cast<unsigned char>(value),
      static_cast<unsigned char>(value >> 8),
      static_cast<unsigned char>(value >> 16),
      static_cast<unsigned char>(value >> 24),
  };
  stream.write(reinterpret_cast<const char*>(bytes.data()), bytes.size());
}

void requireTag(std::istream& stream, const char* expected) {
  std::array<char, 4> actual{};
  stream.read(actual.data(), actual.size());
  if (!stream || !std::equal(actual.begin(), actual.end(), expected)) {
    throw std::runtime_error("unexpected WAV tag");
  }
}

std::vector<float> readApprovedWav(const std::string& path) {
  std::ifstream input(path, std::ios::binary);
  if (!input) throw std::runtime_error("input unavailable");
  requireTag(input, "RIFF");
  const std::uint32_t riffLength = readU32(input);
  requireTag(input, "WAVE");
  requireTag(input, "fmt ");
  if (readU32(input) != 16 || readU16(input) != 1 ||
      readU16(input) != kChannels || readU32(input) != kSampleRate ||
      readU32(input) != kSampleRate * 2 || readU16(input) != 2 ||
      readU16(input) != kBitsPerSample) {
    throw std::runtime_error("unsupported WAV format");
  }
  requireTag(input, "data");
  const std::uint32_t dataBytes = readU32(input);
  if (dataBytes != kInputFrames * 2 || riffLength != 36 + dataBytes) {
    throw std::runtime_error("unsupported WAV length");
  }
  std::vector<float> samples(kInputFrames);
  for (float& sample : samples) {
    const auto word = readU16(input);
    const auto signedSample = static_cast<std::int16_t>(word);
    sample = static_cast<float>(signedSample) / 32768.0F;
  }
  if (input.peek() != std::char_traits<char>::eof()) {
    throw std::runtime_error("trailing WAV data");
  }
  return samples;
}

void writeApprovedWav(const std::string& path, const float* samples,
                      std::size_t frameCount) {
  if (frameCount != 60000) throw std::runtime_error("invalid output length");
  std::ofstream output(path, std::ios::binary | std::ios::trunc);
  if (!output) throw std::runtime_error("output unavailable");
  const auto dataBytes = static_cast<std::uint32_t>(frameCount * 2);
  output.write("RIFF", 4);
  writeU32(output, 36 + dataBytes);
  output.write("WAVEfmt ", 8);
  writeU32(output, 16);
  writeU16(output, 1);
  writeU16(output, kChannels);
  writeU32(output, kSampleRate);
  writeU32(output, kSampleRate * 2);
  writeU16(output, 2);
  writeU16(output, kBitsPerSample);
  output.write("data", 4);
  writeU32(output, dataBytes);
  for (std::size_t index = 0; index < frameCount; ++index) {
    const float bounded = std::clamp(samples[index], -1.0F, 32767.0F / 32768.0F);
    const auto word = static_cast<std::int16_t>(bounded * 32768.0F);
    writeU16(output, static_cast<std::uint16_t>(word));
  }
  if (!output) throw std::runtime_error("output write failed");
}

void execute(const std::string& inputPath, const std::string& outputPath) {
  auto input = readApprovedWav(inputPath);
  signalsmith::stretch::SignalsmithStretch<float> stretch(0);
  stretch.presetDefault(kChannels, static_cast<float>(kSampleRate));
  stretch.setTransposeSemitones(0, 8000.0F / static_cast<float>(kSampleRate));

  const int inputLatency = stretch.inputLatency();
  const int outputLatency = stretch.outputLatency();
  const int outputFrames = static_cast<int>(std::lround(kInputFrames * kTimeRatio));
  input.resize(kInputFrames + inputLatency, 0.0F);
  std::vector<float> output(outputFrames + outputLatency, 0.0F);

  std::array<const float*, 1> seekInput{input.data()};
  stretch.seek(seekInput, inputLatency, 1.0 / kTimeRatio);
  std::array<const float*, 1> processInput{input.data() + inputLatency};
  std::array<float*, 1> processOutput{output.data()};
  stretch.process(processInput, static_cast<int>(kInputFrames), processOutput,
                  outputFrames);
  std::array<float*, 1> flushOutput{output.data() + outputFrames};
  stretch.flush(flushOutput, outputLatency);

  for (int index = 0; index < outputLatency; ++index) {
    const float trimmed = output[outputLatency - 1 - index];
    output[outputLatency + index] -= trimmed;
  }
  writeApprovedWav(outputPath, output.data() + outputLatency, outputFrames);
}

}  // namespace

int main(int argc, char** argv) {
  try {
    if (argc != 3) return 2;
    execute(argv[1], argv[2]);
    return 0;
  } catch (...) {
    return 3;
  }
}
