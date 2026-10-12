#pragma once

#include "record.hpp"

#include <algorithm>
#include <array>
#include <cstdint>
#include <filesystem>
#include <fstream>
#include <limits>
#include <optional>
#include <stdexcept>
#include <vector>

namespace splice {

inline constexpr std::array<char, 8> kSSTableMagic{
    'S', 'P', 'L', 'S', 'S', 'T', '0', '1'
};
inline constexpr std::uint64_t kSSTableHeaderBytes = 16;
inline constexpr std::uint64_t kSSTableRecordBytes = 33;

inline void write_u64(std::ostream& out, std::uint64_t value) {
    for (unsigned i = 0; i < 8; ++i) {
        out.put(static_cast<char>((value >> (8 * i)) & 0xff));
    }
    if (!out) {
        throw std::runtime_error("failed writing SSTable");
    }
}

inline std::uint64_t read_u64(std::istream& in) {
    std::uint64_t value = 0;
    for (unsigned i = 0; i < 8; ++i) {
        const int byte = in.get();
        if (byte == std::char_traits<char>::eof()) {
            throw std::runtime_error("unexpected end of SSTable");
        }
        value |= static_cast<std::uint64_t>(
                     static_cast<unsigned char>(byte)) << (8 * i);
    }
    return value;
}

inline void validate_operation(Operation operation) {
    if (operation != Operation::Put && operation != Operation::Delete) {
        throw std::runtime_error("invalid SSTable operation");
    }
}

class SSTableWriter {
public:
    static void write(const std::filesystem::path& path,
                      std::vector<Record> records) {
        std::sort(records.begin(), records.end(), record_order);

        for (std::size_t i = 0; i < records.size(); ++i) {
            validate_operation(records[i].operation);
            if (i > 0 && records[i - 1].key == records[i].key) {
                throw std::runtime_error(
                    "SSTable input must contain one record per key");
            }
        }

        std::ofstream out(path, std::ios::binary | std::ios::trunc);
        if (!out) {
            throw std::runtime_error("cannot create SSTable");
        }

        out.write(kSSTableMagic.data(),
                  static_cast<std::streamsize>(kSSTableMagic.size()));
        write_u64(out, static_cast<std::uint64_t>(records.size()));

        for (const Record& record : records) {
            write_u64(out, record.key);
            write_u64(out, record.version);
            out.put(static_cast<char>(record.operation));
            out.write(reinterpret_cast<const char*>(record.value.data()),
                      static_cast<std::streamsize>(record.value.size()));
            if (!out) {
                throw std::runtime_error("failed writing SSTable record");
            }
        }

        out.flush();
        if (!out) {
            throw std::runtime_error("failed finishing SSTable");
        }
    }
};

class SSTableReader {
public:
    explicit SSTableReader(const std::filesystem::path& path)
        : in_(path, std::ios::binary) {
        if (!in_) {
            throw std::runtime_error("cannot open SSTable");
        }

        std::array<char, 8> magic{};
        in_.read(magic.data(), static_cast<std::streamsize>(magic.size()));
        if (!in_ || magic != kSSTableMagic) {
            throw std::runtime_error("invalid SSTable header");
        }

        record_count_ = read_u64(in_);

        const auto max_count =
            (std::numeric_limits<std::uint64_t>::max() -
             kSSTableHeaderBytes) / kSSTableRecordBytes;
        if (record_count_ > max_count) {
            throw std::runtime_error("invalid SSTable record count");
        }

        const auto expected_size =
            kSSTableHeaderBytes + record_count_ * kSSTableRecordBytes;
        if (std::filesystem::file_size(path) != expected_size) {
            throw std::runtime_error("SSTable file size does not match header");
        }
    }

    std::uint64_t size() const noexcept {
        return record_count_;
    }

    Record read_at(std::uint64_t index) {
        if (index >= record_count_) {
            throw std::out_of_range("SSTable record index out of range");
        }

        const auto offset = kSSTableHeaderBytes + index * kSSTableRecordBytes;
        in_.clear();
        in_.seekg(static_cast<std::streamoff>(offset), std::ios::beg);
        if (!in_) {
            throw std::runtime_error("failed seeking in SSTable");
        }

        Record record{};
        record.key = read_u64(in_);
        record.version = read_u64(in_);

        const int operation = in_.get();
        if (operation == std::char_traits<char>::eof()) {
            throw std::runtime_error("truncated SSTable record");
        }
        record.operation = static_cast<Operation>(
            static_cast<std::uint8_t>(operation));
        validate_operation(record.operation);

        in_.read(reinterpret_cast<char*>(record.value.data()),
                 static_cast<std::streamsize>(record.value.size()));
        if (!in_) {
            throw std::runtime_error("truncated SSTable value");
        }

        return record;
    }

    std::uint64_t lower_bound(Key key) {
        std::uint64_t first = 0;
        std::uint64_t last = record_count_;

        while (first < last) {
            const std::uint64_t middle = first + (last - first) / 2;
            if (read_at(middle).key < key) {
                first = middle + 1;
            } else {
                last = middle;
            }
        }
        return first;
    }

    std::optional<Record> find(Key key) {
        const auto index = lower_bound(key);
        if (index == record_count_) {
            return std::nullopt;
        }

        Record record = read_at(index);
        if (record.key != key) {
            return std::nullopt;
        }
        return record;
    }

private:
    std::ifstream in_;
    std::uint64_t record_count_{};
};

} // namespace splice
