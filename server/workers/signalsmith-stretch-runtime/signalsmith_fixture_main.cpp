#include <algorithm>
#include <cmath>
#include <cstdlib>
#include <fstream>
#include <iostream>
#include <string>
#include <vector>

#include "signalsmith-stretch.h"

static bool readFloats(const std::string &path, std::vector<float> &samples) {
  std::ifstream in(path, std::ios::binary);
  if (!in) return false;
  in.seekg(0, std::ios::end);
  const std::streamoff size = in.tellg();
  in.seekg(0, std::ios::beg);
  if (size < 0 || size % static_cast<std::streamoff>(sizeof(float)) != 0) return false;
  samples.resize(static_cast<size_t>(size / sizeof(float)));
  in.read(reinterpret_cast<char *>(samples.data()), size);
  return in.good() || in.eof();
}

static bool writeFloats(const std::string &path, const std::vector<float> &samples) {
  std::ofstream out(path, std::ios::binary);
  if (!out) return false;
  out.write(reinterpret_cast<const char *>(samples.data()), static_cast<std::streamsize>(samples.size() * sizeof(float)));
  return out.good();
}

int main(int argc, char **argv) {
  if (argc != 6) {
    std::cerr << "usage: signalsmith_fixture_main <input.raw> <output.raw> <sample-rate> <input-samples> <output-samples>\n";
    return 2;
  }

  const std::string inputPath = argv[1];
  const std::string outputPath = argv[2];
  const int sampleRate = std::atoi(argv[3]);
  const int inputSamples = std::atoi(argv[4]);
  const int outputSamples = std::atoi(argv[5]);
  if (sampleRate <= 0 || inputSamples <= 0 || outputSamples <= 0) {
    std::cerr << "invalid numeric args\n";
    return 2;
  }

  std::vector<float> input;
  if (!readFloats(inputPath, input)) {
    std::cerr << "failed to read input\n";
    return 3;
  }
  if (static_cast<int>(input.size()) != inputSamples) {
    std::cerr << "input sample count mismatch\n";
    return 4;
  }

  std::vector<float> output(static_cast<size_t>(outputSamples), 0.0f);
  float *inputChannel = input.data();
  float *outputChannel = output.data();
  float *inputBuffers[1] = { inputChannel };
  float *outputBuffers[1] = { outputChannel };

  signalsmith::stretch::SignalsmithStretch<float> stretch;
  stretch.presetDefault(1, sampleRate);
  stretch.reset();
  stretch.process(inputBuffers, inputSamples, outputBuffers, outputSamples);

  for (float &sample : output) {
    if (!std::isfinite(sample)) sample = 0.0f;
    sample = std::max(-1.0f, std::min(1.0f, sample));
  }

  if (!writeFloats(outputPath, output)) {
    std::cerr << "failed to write output\n";
    return 5;
  }
  std::cout << "{"
    << "\"status\":\"passed\","
    << "\"sampleRate\":" << sampleRate << ","
    << "\"inputSamples\":" << inputSamples << ","
    << "\"outputSamples\":" << outputSamples << ","
    << "\"inputLatency\":" << stretch.inputLatency() << ","
    << "\"outputLatency\":" << stretch.outputLatency()
    << "}\n";
  return 0;
}
