#pragma once

#include "sstable.hpp"

#include <algorithm>
#include <array>
#include <cmath>
#include <cstdint>
#include <filesystem>
#include <fstream>
#include <iomanip>
#include <map>
#include <random>
#include <stdexcept>
#include <string>
#include <unordered_set>
#include <utility>
#include <vector>

namespace splice {

struct GeneratorConfig {
    std::uint64_t seed;
    std::uint64_t total_records;
    std::uint64_t sstable_count;
    std::uint64_t keyspace_size;
    std::string distribution;
    double zipf_alpha;
    double hot_range_fraction;
    double hot_record_fraction;
    double delete_fraction;
};

inline GeneratorConfig read_generator_config(
    const std::filesystem::path& path) {
    std::ifstream in(path);
    if (!in) throw std::runtime_error("cannot open generator config");

    std::map<std::string, std::string> values;
    std::string line;
    while (std::getline(in, line)) {
        if (!line.empty() && line.back() == '\r') line.pop_back();
        if (line.empty() || line[0] == '#') continue;

        const auto equals = line.find('=');
        if (equals == std::string::npos) {
            throw std::runtime_error("config line must be name=value");
        }
        values[line.substr(0, equals)] = line.substr(equals + 1);
    }

    GeneratorConfig c{
        std::stoull(values.at("seed")),
        std::stoull(values.at("total_input_records")),
        std::stoull(values.at("sstable_count")),
        std::stoull(values.at("keyspace_size")),
        values.at("distribution"),
        std::stod(values.at("zipf_alpha")),
        std::stod(values.at("hot_range_fraction")),
        std::stod(values.at("hot_record_fraction")),
        std::stod(values.at("delete_fraction"))
    };

    if (c.distribution != "uniform" &&
        c.distribution != "zipfian" &&
        c.distribution != "hot_range") {
        throw std::runtime_error(
            "distribution must be uniform, zipfian, or hot_range");
    }

    if (c.sstable_count == 0 || c.total_records == 0 ||
        c.total_records % c.sstable_count != 0 ||
        c.keyspace_size < c.total_records / c.sstable_count ||
        c.delete_fraction < 0.0 || c.delete_fraction > 1.0 ||
        c.zipf_alpha <= 0.0 ||
        c.hot_range_fraction <= 0.0 || c.hot_range_fraction > 1.0 ||
        c.hot_record_fraction < 0.0 || c.hot_record_fraction > 1.0) {
        throw std::runtime_error("invalid generator configuration");
    }

    const auto records_per_table = c.total_records / c.sstable_count;
    const auto hot_keys = static_cast<std::uint64_t>(
        std::ceil(c.keyspace_size * c.hot_range_fraction));

    if (hot_keys < records_per_table ||
        (hot_keys == c.keyspace_size && c.hot_record_fraction < 1.0)) {
        throw std::runtime_error(
            "hot range is too small for unique keys in each SSTable");
    }

    return c;
}

inline std::uint64_t generate_dataset(
    const GeneratorConfig& c,
    const std::filesystem::path& output_dir) {
    std::filesystem::create_directories(output_dir);

    std::mt19937_64 rng(c.seed);
    std::uniform_int_distribution<Key> all_keys(0, c.keyspace_size - 1);
    std::uniform_int_distribution<int> byte_dist(0, 255);
    std::uniform_real_distribution<double> chance(0.0, 1.0);

    const auto hot_key_count = static_cast<Key>(
        std::ceil(c.keyspace_size * c.hot_range_fraction));
    const auto records_per_table = c.total_records / c.sstable_count;
    std::map<Key, Record> latest;
    Version next_version = 1;

    auto sample_key = [&]() -> Key {
        if (c.distribution == "uniform") return all_keys(rng);

        if (c.distribution == "hot_range") {
            if (chance(rng) < c.hot_record_fraction ||
                hot_key_count == c.keyspace_size) {
                return std::uniform_int_distribution<Key>(
                    0, hot_key_count - 1)(rng);
            }
            return std::uniform_int_distribution<Key>(
                hot_key_count, c.keyspace_size - 1)(rng);
        }

        const double u = chance(rng);
        const double exponent = 1.0 - c.zipf_alpha;
        double rank;

        if (std::abs(exponent) < 1e-10) {
            rank = std::exp(u * std::log(
                static_cast<double>(c.keyspace_size)));
        } else {
            rank = std::pow(
                1.0 + u * (
                    std::pow(static_cast<double>(c.keyspace_size), exponent)
                    - 1.0),
                1.0 / exponent);
        }

        const auto bounded_rank = std::clamp<std::uint64_t>(
            static_cast<std::uint64_t>(rank), 1, c.keyspace_size);
        return bounded_rank - 1;
    };

    for (std::uint64_t table = 0; table < c.sstable_count; ++table) {
        std::unordered_set<Key> used;
        std::vector<Record> records;
        records.reserve(static_cast<std::size_t>(records_per_table));

        while (records.size() < records_per_table) {
            const Key key = sample_key();
            if (!used.insert(key).second) continue;

            Record r{};
            r.key = key;
            r.version = next_version++;
            r.operation = chance(rng) < c.delete_fraction
                ? Operation::Delete : Operation::Put;

            if (r.operation == Operation::Put) {
                for (auto& byte : r.value) {
                    byte = static_cast<std::uint8_t>(byte_dist(rng));
                }
            }

            records.push_back(r);
            latest[key] = r;
        }

        SSTableWriter::write(
            output_dir / ("input_" + std::to_string(table) + ".sst"),
            std::move(records));
    }

    std::ofstream expected(output_dir / "expected_live.tsv");
    if (!expected) throw std::runtime_error("cannot write expected answer");

    for (const auto& [key, r] : latest) {
        if (r.operation != Operation::Put) continue;
        expected << key << '\t' << r.version << '\t';
        for (const auto byte : r.value) {
            expected << std::hex << std::setw(2) << std::setfill('0')
                     << static_cast<unsigned>(byte);
        }
        expected << std::dec << '\n';
    }

    std::ofstream manifest(output_dir / "manifest.txt");
    manifest << "seed=" << c.seed << '\n'
             << "total_input_records=" << c.total_records << '\n'
             << "sstable_count=" << c.sstable_count << '\n'
             << "keyspace_size=" << c.keyspace_size << '\n'
             << "distribution=" << c.distribution << '\n'
             << "zipf_alpha=" << c.zipf_alpha << '\n'
             << "hot_range_fraction=" << c.hot_range_fraction << '\n'
             << "hot_record_fraction=" << c.hot_record_fraction << '\n'
             << "delete_fraction=" << c.delete_fraction << '\n';

    if (!expected || !manifest) {
        throw std::runtime_error("failed writing dataset metadata");
    }
    return c.total_records;
}

} // namespace splice
