#include "generator.hpp"
#include "merge.hpp"
#include "parallel_equal.hpp"
#include "parallel_executor.hpp"
#include "sampling.hpp"
#include "verify.hpp"

#include <chrono>
#include <filesystem>
#include <iomanip>
#include <iostream>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>

int main(int argc, char** argv) {
    try {
        if (argc > 1 && std::string(argv[1]) == "compact") {
            if (argc < 4) {
                throw std::runtime_error(
                    "usage: splice compact <output.sst> <input1.sst> [input2.sst ...]");
            }

            const std::filesystem::path output_path = argv[2];
            std::vector<std::filesystem::path> input_paths;
            for (int i = 3; i < argc; ++i) {
                input_paths.emplace_back(argv[i]);
            }

            auto records = splice::sequential_compact(input_paths);
            splice::SSTableWriter::write(output_path, records);

            std::cout << "Compacted " << input_paths.size()
                      << " SSTables into " << output_path.string() << '\n'
                      << "Live output records: " << records.size() << '\n';
            return 0;
        }

        if (argc > 1 && std::string(argv[1]) == "parallel-equal") {
            if (argc < 7) {
                throw std::runtime_error(
                    "usage: splice parallel-equal <output.sst> "
                    "<keyspace_size> <partitions> <threads> "
                    "<input1.sst> [input2.sst ...]");
            }

            const std::filesystem::path output_path = argv[2];
            const auto keyspace_size =
                static_cast<splice::Key>(std::stoull(argv[3]));
            const auto partitions =
                static_cast<std::size_t>(std::stoull(argv[4]));
            const auto threads =
                static_cast<std::size_t>(std::stoull(argv[5]));

            std::vector<std::filesystem::path> input_paths;
            for (int i = 6; i < argc; ++i) {
                input_paths.emplace_back(argv[i]);
            }

            auto records = splice::parallel_equal_compact(
                input_paths, keyspace_size, partitions, threads);
            splice::SSTableWriter::write(output_path, records);

            std::cout << "Equal-width compaction: " << partitions
                      << " partitions, " << threads << " requested threads\n"
                      << "Live output records: " << records.size() << '\n';
            return 0;
        }

        if (argc > 1 && std::string(argv[1]) == "splice") {
            if (argc < 8) {
                throw std::runtime_error(
                    "usage: splice splice <output.sst> <keyspace_size> "
                    "<partitions> <threads> <sample_fraction> "
                    "<input1.sst> [input2.sst ...]");
            }

            const auto total_start = std::chrono::steady_clock::now();
            const std::filesystem::path output_path = argv[2];
            const auto keyspace_size =
                static_cast<splice::Key>(std::stoull(argv[3]));
            const auto partitions =
                static_cast<std::size_t>(std::stoull(argv[4]));
            const auto threads =
                static_cast<std::size_t>(std::stoull(argv[5]));
            const double sample_fraction = std::stod(argv[6]);

            std::vector<std::filesystem::path> input_paths;
            for (int i = 7; i < argc; ++i) {
                input_paths.emplace_back(argv[i]);
            }

            const auto sampling_start = std::chrono::steady_clock::now();
            const auto plan = splice::plan_sampled_ranges(
                input_paths, keyspace_size, partitions, sample_fraction);
            const auto merge_start = std::chrono::steady_clock::now();

            auto records = splice::parallel_compact_ranges(
                input_paths, plan.boundaries, threads);
            const auto merge_end = std::chrono::steady_clock::now();

            splice::SSTableWriter::write(output_path, records);
            const auto total_end = std::chrono::steady_clock::now();

            const auto sample_ms =
                std::chrono::duration<double, std::milli>(
                    merge_start - sampling_start).count();
            const auto merge_ms =
                std::chrono::duration<double, std::milli>(
                    merge_end - merge_start).count();
            const auto total_ms =
                std::chrono::duration<double, std::milli>(
                    total_end - total_start).count();

            std::cout << std::fixed << std::setprecision(3)
                      << "SPLICE: " << plan.samples_read << " samples, "
                      << plan.actual_partitions() << " actual ranges for "
                      << partitions << " requested partitions, "
                      << threads << " requested threads\n"
                      << "Sampling and planning: " << sample_ms << " ms\n"
                      << "Parallel merge and join: " << merge_ms << " ms\n"
                      << "End-to-end including output write: "
                      << total_ms << " ms\n"
                      << "Live output records: " << records.size() << '\n';
            return 0;
        }

        if (argc > 1 && std::string(argv[1]) == "check") {
            if (argc != 4) {
                throw std::runtime_error(
                    "usage: splice check <output.sst> <expected_live.tsv>");
            }

            splice::verify_output(argv[2], argv[3]);
            std::cout << "CHECK PASSED: output matches expected answer\n";
            return 0;
        }

        const std::filesystem::path config_path =
            argc > 1 ? argv[1] : "configs/smoke.conf";
        const std::filesystem::path output_dir =
            argc > 2 ? argv[2] : "data/smoke-uniform";

        const auto config = splice::read_generator_config(config_path);
        const auto generated =
            splice::generate_dataset(config, output_dir);

        std::uint64_t actual = 0;
        for (std::uint64_t i = 0; i < config.sstable_count; ++i) {
            const auto file = output_dir /
                ("input_" + std::to_string(i) + ".sst");
            splice::SSTableReader reader(file);
            actual += reader.size();
        }

        if (actual != generated) {
            throw std::runtime_error("generated record count mismatch");
        }

        std::cout << "Generated " << actual << " records across "
                  << config.sstable_count << " SSTables\n"
                  << "Expected answer: "
                  << (output_dir / "expected_live.tsv").string() << '\n';
        return 0;
    } catch (const std::exception& error) {
        std::cerr << "Error: " << error.what() << '\n';
        return 1;
    }
}
