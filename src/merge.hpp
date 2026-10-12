#pragma once

#include "sstable.hpp"

#include <cstddef>
#include <filesystem>
#include <memory>
#include <queue>
#include <stdexcept>
#include <vector>

namespace splice {

struct HeapItem {
    Record record;
    std::size_t table_index;
    std::uint64_t record_index;
};

struct HeapCompare {
    bool operator()(const HeapItem& a, const HeapItem& b) const {
        if (a.record.key != b.record.key) {
            return a.record.key > b.record.key;
        }
        return a.record.version < b.record.version;
    }
};

inline std::vector<Record> sequential_compact(
    const std::vector<std::filesystem::path>& input_paths) {
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
        if (readers[i]->size() > 0) {
            heap.push({readers[i]->read_at(0), i, 0});
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
                heap.push({
                    readers[item.table_index]->read_at(next_index),
                    item.table_index,
                    next_index
                });
            }
        }

        if (newest.operation == Operation::Put) {
            output.push_back(newest);
        }
    }

    return output;
}

} // namespace splice
