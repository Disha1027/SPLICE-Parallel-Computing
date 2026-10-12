#pragma once

#include "sstable.hpp"

#include <algorithm>
#include <cmath>
#include <cstddef>
#include <cstdint>
#include <filesystem>
#include <stdexcept>
#include <vector>

namespace splice {

struct WeightedSample {
    Key key;
    std::uint64_t weight;
};

struct SampledRangePlan {
    // First boundary is 0; last boundary is keyspace_size.
    // Each adjacent pair defines a half-open range [lower, upper).
    std::vector<Key> boundaries;
    std::size_t samples_read{};
    std::size_t requested_partitions{};

    std::size_t actual_partitions() const {
        return boundaries.empty() ? 0 : boundaries.size() - 1;
    }
};

inline SampledRangePlan plan_sampled_ranges(
    const std::vector<std::filesystem::path>& input_paths,
    Key keyspace_size,
    std::size_t requested_partitions,
    double sample_fraction) {
    if (keyspace_size == 0 || requested_partitions == 0) {
        throw std::runtime_error(
            "keyspace size and partition count must be positive");
    }
    if (sample_fraction < 0.01 || sample_fraction > 0.05) {
        throw std::runtime_error(
            "sample fraction must be between 0.01 and 0.05");
    }

    std::vector<WeightedSample> samples;
    std::uint64_t total_weight = 0;

    for (const auto& path : input_paths) {
        SSTableReader reader(path);
        const std::uint64_t count = reader.size();
        if (count == 0) {
            continue;
        }

        std::uint64_t sample_count = static_cast<std::uint64_t>(
            std::ceil(static_cast<double>(count) * sample_fraction));
        sample_count = std::max<std::uint64_t>(1, sample_count);
        sample_count = std::min(sample_count, count);

        for (std::uint64_t i = 0; i < sample_count; ++i) {
            // Divide this file into strata and read one representative
            // from the middle of each stratum.
            const std::uint64_t begin = i * count / sample_count;
            const std::uint64_t end = (i + 1) * count / sample_count;
            const std::uint64_t position = begin + (end - begin) / 2;
            const Record record = reader.read_at(position);
            const std::uint64_t weight = end - begin;

            if (record.key >= keyspace_size) {
                throw std::runtime_error(
                    "sampled key is outside the configured keyspace");
            }

            samples.push_back({record.key, weight});
            total_weight += weight;
        }
    }

    if (samples.empty() || total_weight == 0) {
        throw std::runtime_error("cannot plan ranges from empty input");
    }

    std::sort(samples.begin(), samples.end(),
              [](const WeightedSample& a, const WeightedSample& b) {
                  return a.key < b.key;
              });

    SampledRangePlan plan;
    plan.boundaries.push_back(0);
    plan.requested_partitions = requested_partitions;
    plan.samples_read = samples.size();

    std::uint64_t cumulative_weight = 0;
    std::size_t next_partition = 1;
    std::size_t i = 0;

    while (i < samples.size() && next_partition < requested_partitions) {
        const Key sampled_key = samples[i].key;
        std::uint64_t key_weight = 0;

        while (i < samples.size() && samples[i].key == sampled_key) {
            key_weight += samples[i].weight;
            ++i;
        }
        cumulative_weight += key_weight;

        const long double cumulative =
            static_cast<long double>(cumulative_weight);
        const long double total = static_cast<long double>(total_weight);

        while (next_partition < requested_partitions &&
               cumulative * requested_partitions >=
                   total * next_partition) {
            // Put the sampled key and all of its versions in the range
            // to the left of this boundary.
            const Key boundary = sampled_key + 1;

            if (boundary > plan.boundaries.back() &&
                boundary < keyspace_size) {
                plan.boundaries.push_back(boundary);
            }
            ++next_partition;
        }
    }

    if (plan.boundaries.back() < keyspace_size) {
        plan.boundaries.push_back(keyspace_size);
    }

    return plan;
}

} // namespace splice
