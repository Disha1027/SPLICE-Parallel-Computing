#pragma once

#include "range_merge.hpp"

#include <exception>
#include <limits>
#include <stdexcept>
#include <vector>

namespace splice {

inline std::vector<Record> parallel_compact_ranges(
    const std::vector<std::filesystem::path>& input_paths,
    const std::vector<Key>& boundaries,
    std::size_t thread_count) {
    if (thread_count == 0) {
        throw std::runtime_error("thread count must be positive");
    }
    if (thread_count > static_cast<std::size_t>(
                           std::numeric_limits<int>::max())) {
        throw std::runtime_error("thread count is too large");
    }
    if (boundaries.size() < 2 || boundaries.front() != 0) {
        throw std::runtime_error(
            "range boundaries must start at zero and contain at least two entries");
    }
    for (std::size_t i = 1; i < boundaries.size(); ++i) {
        if (boundaries[i] < boundaries[i - 1]) {
            throw std::runtime_error("range boundaries must be ordered");
        }
    }

    const std::size_t range_count = boundaries.size() - 1;
    if (range_count > static_cast<std::size_t>(
                          std::numeric_limits<long long>::max())) {
        throw std::runtime_error("too many ranges");
    }

    std::vector<std::vector<Record>> range_outputs(range_count);
    std::vector<std::exception_ptr> errors(range_count);

    #pragma omp parallel for schedule(static) num_threads(static_cast<int>(thread_count))
    for (long long r = 0; r < static_cast<long long>(range_count); ++r) {
        const auto range = static_cast<std::size_t>(r);
        try {
            range_outputs[range] = compact_key_range(
                input_paths, boundaries[range], boundaries[range + 1]);
        } catch (...) {
            errors[range] = std::current_exception();
        }
    }

    for (const auto& error : errors) {
        if (error) {
            std::rethrow_exception(error);
        }
    }

    std::size_t total_records = 0;
    for (const auto& output : range_outputs) {
        total_records += output.size();
    }

    std::vector<Record> joined;
    joined.reserve(total_records);
    for (const auto& output : range_outputs) {
        joined.insert(joined.end(), output.begin(), output.end());
    }

    return joined;
}

} // namespace splice
