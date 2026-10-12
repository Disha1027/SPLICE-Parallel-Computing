#pragma once

#include "record.hpp"

#include <cstddef>
#include <map>
#include <stdexcept>
#include <utility>
#include <vector>

namespace splice {

class MemTable {
public:
    void add(Record record) {
        auto it = records_.find(record.key);

        if (it == records_.end()) {
            records_.emplace(record.key, std::move(record));
            return;
        }

        if (record.version == it->second.version) {
            throw std::invalid_argument("duplicate version for key");
        }

        if (record.version > it->second.version) {
            it->second = std::move(record);
        }
    }

    std::vector<Record> sorted_records() const {
        std::vector<Record> result;
        result.reserve(records_.size());

        for (const auto& [key, record] : records_) {
            result.push_back(record);
        }

        return result;
    }

    std::size_t size() const noexcept {
        return records_.size();
    }

    bool empty() const noexcept {
        return records_.empty();
    }

    void clear() noexcept {
        records_.clear();
    }

private:
    std::map<Key, Record> records_;
};

} // namespace splice
