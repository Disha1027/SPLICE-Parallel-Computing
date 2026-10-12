#include "generator.hpp"
#include "merge.hpp"
#include "verify.hpp"

#include <filesystem>
#include <iostream>
#include <stdexcept>
#include <string>
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

            const auto output_records =
                splice::sequential_compact(input_paths);
            splice::SSTableWriter::write(output_path, output_records);

            std::cout << "Compacted " << input_paths.size()
                      << " SSTables into " << output_path.string() << '\n'
                      << "Live output records: " << output_records.size()
                      << '\n';
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
