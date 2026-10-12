#pragma once

#include "merge.hpp"

#include <filesystem>
#include <memory>
#include <queue>
#include <stdexcept>
#include <vector>

namespace splice {

// Merge keys in the half-open range [lower, upper).
inline std::vector<Record> compact_key_range(
    const std::vector<std::filesystem::path>& input_paths,
    Key lower,
    Key upper) {
    if (lower > upper) {
        throw std::runtime_error("range lower bound exceeds upper bound");
    }
    if (lower == upper) {
        return {};
    }

    std::vector<std::unique_ptr<SSTableReader>> readers;
    readers.reserve(input_paths.size());

    for (const auto& path : input_paths) {
        readers.push_back(std::make_unique<SSTableReader>(path));
    }

    std::priority_queue<
        HeapItem,
        std::vector<HeapItem>,
        HeapCompare
    > heap;

    for (std::size_t i = 0; i < readers.size(); ++i) {
        const std::uint64_t index = readers[i]->lower_bound(lower);
        if (index < readers[i]->size()) {
            Record record = readers[i]->read_at(index);
            if (record.key < upper) {
                heap.push({record, i, index});
            }
        }
    }

    std::vector<Record> output;

    while (!heap.empty()) {
        const Key key = heap.top().record.key;
        Record newest{};
        bool have_newest = false;

        while (!heap.empty() && heap.top().record.key == key) {
            const HeapItem item = heap.top();
            heap.pop();

            if (!have_newest) {
                newest = item.record;
                have_newest = true;
            } else if (item.record.version == newest.version) {
                throw std::runtime_error(
                    "same key has duplicate version numbers");
            }

            const std::uint64_t next_index = item.record_index + 1;
            if (next_index < readers[item.table_index]->size()) {
                Record next = readers[item.table_index]->read_at(next_index);
                if (next.key < upper) {
                    heap.push({next, item.table_index, next_index});
                }
            }
        }

        if (newest.operation == Operation::Put) {
            output.push_back(newest);
        }
    }

    return output;
}

} // namespace splice
