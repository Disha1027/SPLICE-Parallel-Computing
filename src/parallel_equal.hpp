#pragma once

#include "parallel_executor.hpp"

#include <cstddef>
#include <stdexcept>
#include <vector>

namespace splice {

inline std::vector<Record> parallel_equal_compact(
    const std::vector<std::filesystem::path>& input_paths,
    Key keyspace_size,
    std::size_t partition_count,
    std::size_t thread_count) {
    if (keyspace_size == 0 || partition_count == 0) {
        throw std::runtime_error(
            "keyspace size and partition count must be positive");
    }

    std::vector<Key> boundaries(partition_count + 1);
    for (std::size_t p = 0; p <= partition_count; ++p) {
        boundaries[p] =
            keyspace_size * static_cast<Key>(p) / partition_count;
    }

    return parallel_compact_ranges(
        input_paths, boundaries, thread_count);
}

} // namespace splice
