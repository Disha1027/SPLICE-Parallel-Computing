#pragma once

#include <array>
#include <cstdint>

namespace splice {

using Key = std::uint64_t;
using Version = std::uint64_t;

constexpr std::size_t kValueBytes = 16;

enum class Operation : std::uint8_t {
    Put = 0,
    Delete = 1
};

struct Record {
    Key key{};
    Version version{};
    Operation operation{Operation::Put};
    std::array<std::uint8_t, kValueBytes> value{};
};

// Sort by key ascending; for the same key, newest version first.
inline bool record_order(const Record& a, const Record& b) {
    if (a.key != b.key) {
        return a.key < b.key;
    }
    return a.version > b.version;
}

} // namespace splice
