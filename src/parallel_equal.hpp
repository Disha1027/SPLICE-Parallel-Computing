#pragma once

#include "range_merge.hpp"

#include <exception>
#include <limits>
#include <stdexcept>
#include <vector>

namespace splice {

inline std::vector<Record> parallel_equal_compact(
    const std::vector<std::filesystem::path>& input_paths,
    Key keyspace_size,
    std::size_t partition_count,
    std::size_t thread_count) {
    if (keyspace_size == 0 || partition_count == 0 || thread_count == 0) {
        throw std::runtime_error(
            "keyspace size, partition count, and thread count must be positive");
    }
    if (thread_count > static_cast<std::size_t>(
                           std::numeric_limits<int>::max())) {
        throw std::runtime_error("thread count is too large");
    }

    std::vector<std::vector<Record>> partition_outputs(partition_count);
    std::vector<std::exception_ptr> errors(partition_count);

    #pragma omp parallel for schedule(static) num_threads(static_cast<int>(thread_count))
    for (long long p = 0;
         p < static_cast<long long>(partition_count);
         ++p) {
        const auto partition = static_cast<std::size_t>(p);
        const Key lower =
            keyspace_size * static_cast<Key>(partition) / partition_count;
        const Key upper =
            keyspace_size * static_cast<Key>(partition + 1) / partition_count;

        try {
            partition_outputs[partition] =
                compact_key_range(input_paths, lower, upper);
        } catch (...) {
            errors[partition] = std::current_exception();
        }
    }

    for (const auto& error : errors) {
        if (error) {
            std::rethrow_exception(error);
        }
    }

    std::size_t total_records = 0;
    for (const auto& output : partition_outputs) {
        total_records += output.size();
    }

    std::vector<Record> joined;
    joined.reserve(total_records);

    // Ranges are in key order, so append their outputs in partition order.
    for (const auto& output : partition_outputs) {
        joined.insert(joined.end(), output.begin(), output.end());
    }

    return joined;
}

} // namespace splice
