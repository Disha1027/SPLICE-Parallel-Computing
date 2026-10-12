#pragma once

#include "sstable.hpp"

#include <array>
#include <cstddef>
#include <cstdint>
#include <filesystem>
#include <fstream>
#include <stdexcept>
#include <string>

namespace splice {

struct ExpectedRecord {
    Key key{};
    Version version{};
    std::array<std::uint8_t, kValueBytes> value{};
};

inline std::uint64_t parse_expected_number(
    const std::string& text, const char* field) {
    std::size_t used = 0;
    const auto value = std::stoull(text, &used);
    if (used != text.size()) {
        throw std::runtime_error(std::string("invalid ") + field);
    }
    return value;
}

inline ExpectedRecord parse_expected_line(const std::string& line) {
    const auto first_tab = line.find('\t');
    const auto second_tab = line.find('\t', first_tab + 1);

    if (first_tab == std::string::npos ||
        second_tab == std::string::npos ||
        line.find('\t', second_tab + 1) != std::string::npos) {
        throw std::runtime_error("malformed expected-answer line");
    }

    ExpectedRecord expected;
    expected.key = parse_expected_number(
        line.substr(0, first_tab), "expected key");
    expected.version = parse_expected_number(
        line.substr(first_tab + 1, second_tab - first_tab - 1),
        "expected version");

    const std::string hex = line.substr(second_tab + 1);
    if (hex.size() != kValueBytes * 2) {
        throw std::runtime_error("expected value has incorrect hex length");
    }

    auto hex_digit = [](char c) -> int {
        if (c >= '0' && c <= '9') return c - '0';
        if (c >= 'a' && c <= 'f') return c - 'a' + 10;
        if (c >= 'A' && c <= 'F') return c - 'A' + 10;
        return -1;
    };

    for (std::size_t i = 0; i < kValueBytes; ++i) {
        const int high = hex_digit(hex[i * 2]);
        const int low = hex_digit(hex[i * 2 + 1]);
        if (high < 0 || low < 0) {
            throw std::runtime_error("expected value contains invalid hex");
        }
        expected.value[i] =
            static_cast<std::uint8_t>((high << 4) | low);
    }

    return expected;
}

inline void verify_output(
    const std::filesystem::path& output_path,
    const std::filesystem::path& expected_path) {
    SSTableReader output(output_path);
    std::ifstream expected_file(expected_path);
    if (!expected_file) {
        throw std::runtime_error("cannot open expected-answer file");
    }

    std::string line;
    bool have_previous_key = false;
    Key previous_key = 0;

    for (std::uint64_t i = 0; i < output.size(); ++i) {
        if (!std::getline(expected_file, line)) {
            throw std::runtime_error(
                "output contains more records than expected");
        }

        const ExpectedRecord expected = parse_expected_line(line);
        const Record actual = output.read_at(i);

        if (have_previous_key && actual.key <= previous_key) {
            throw std::runtime_error(
                "output is unsorted or contains duplicate keys");
        }
        if (actual.operation != Operation::Put) {
            throw std::runtime_error(
                "output contains a delete marker; deleted keys must be absent");
        }
        if (actual.key != expected.key ||
            actual.version != expected.version ||
            actual.value != expected.value) {
            throw std::runtime_error(
                "output record does not match expected answer at record " +
                std::to_string(i));
        }

        previous_key = actual.key;
        have_previous_key = true;
    }

    if (std::getline(expected_file, line)) {
        throw std::runtime_error(
            "expected answer contains more records than output");
    }
}

} // namespace splice
