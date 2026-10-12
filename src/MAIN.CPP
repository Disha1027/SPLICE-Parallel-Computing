#include "generator.hpp"

#include <filesystem>
#include <iostream>
#include <stdexcept>

int main(int argc, char** argv) {
    try {
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
