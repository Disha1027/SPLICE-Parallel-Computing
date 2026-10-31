#pragma once

#include "range_merge.hpp"

#include <algorithm>
#include <chrono>
#include <exception>
#include <limits>
#include <numeric>
#include <omp.h>
#include <stdexcept>
#include <string>
#include <vector>

namespace splice {

enum class SchedulePolicy {
    Static,
    Dynamic,
    Guided,
    Tasks
};

inline SchedulePolicy parse_schedule_policy(const std::string& str) {
    if (str == "static") return SchedulePolicy::Static;
    if (str == "dynamic") return SchedulePolicy::Dynamic;
    if (str == "guided") return SchedulePolicy::Guided;
    if (str == "tasks" || str == "task") return SchedulePolicy::Tasks;
    throw std::runtime_error(
        "unknown schedule policy: '" + str + "' (valid options: static, dynamic, guided, tasks)");
}

inline std::string to_string(SchedulePolicy policy) {
    switch (policy) {
        case SchedulePolicy::Static: return "static";
        case SchedulePolicy::Dynamic: return "dynamic";
        case SchedulePolicy::Guided: return "guided";
        case SchedulePolicy::Tasks: return "tasks";
    }
    return "unknown";
}

struct ParallelExecutionStats {
    double load_imbalance = 0.0;
    double max_thread_ms = 0.0;
    double avg_thread_ms = 0.0;
    std::vector<double> thread_times_ms;
    SchedulePolicy policy = SchedulePolicy::Static;
};

struct ParallelCompactResult {
    std::vector<Record> records;
    ParallelExecutionStats stats;
};

inline ParallelCompactResult parallel_compact_ranges(
    const std::vector<std::filesystem::path>& input_paths,
    const std::vector<Key>& boundaries,
    std::size_t thread_count,
    SchedulePolicy policy = SchedulePolicy::Static) {
    if (thread_count == 0) {
        throw std::runtime_error("thread count must be positive");
    }
    if (thread_count > static_cast<std::size_t>(
                           std::numeric_limits<int>::max())) {
        throw std::runtime_error("thread count is too large");
    }
    if (boundaries.size() < 2 || boundaries.front() != 0) {
        throw std::runtime_error(
            "range boundaries must start at zero and contain at least two entries");
    }
    for (std::size_t i = 1; i < boundaries.size(); ++i) {
        if (boundaries[i] < boundaries[i - 1]) {
            throw std::runtime_error("range boundaries must be ordered");
        }
    }

    const std::size_t range_count = boundaries.size() - 1;
    if (range_count > static_cast<std::size_t>(
                          std::numeric_limits<long long>::max())) {
        throw std::runtime_error("too many ranges");
    }

    std::vector<std::vector<Record>> range_outputs(range_count);
    std::vector<std::exception_ptr> errors(range_count);
    std::vector<double> thread_times_ms(thread_count, 0.0);

    auto execute_range = [&](std::size_t range, int tid) {
        const auto t0 = std::chrono::steady_clock::now();
        try {
            range_outputs[range] = compact_key_range(
                input_paths, boundaries[range], boundaries[range + 1]);
        } catch (...) {
            errors[range] = std::current_exception();
        }
        const auto t1 = std::chrono::steady_clock::now();
        const double elapsed =
            std::chrono::duration<double, std::milli>(t1 - t0).count();
        if (tid >= 0 && static_cast<std::size_t>(tid) < thread_times_ms.size()) {
            #pragma omp atomic
            thread_times_ms[tid] += elapsed;
        }
    };

    if (policy == SchedulePolicy::Static) {
        #pragma omp parallel num_threads(static_cast<int>(thread_count))
        {
            const int tid = omp_get_thread_num();
            #pragma omp for schedule(static)
            for (long long r = 0; r < static_cast<long long>(range_count); ++r) {
                execute_range(static_cast<std::size_t>(r), tid);
            }
        }
    } else if (policy == SchedulePolicy::Dynamic) {
        #pragma omp parallel num_threads(static_cast<int>(thread_count))
        {
            const int tid = omp_get_thread_num();
            #pragma omp for schedule(dynamic, 1)
            for (long long r = 0; r < static_cast<long long>(range_count); ++r) {
                execute_range(static_cast<std::size_t>(r), tid);
            }
        }
    } else if (policy == SchedulePolicy::Guided) {
        #pragma omp parallel num_threads(static_cast<int>(thread_count))
        {
            const int tid = omp_get_thread_num();
            #pragma omp for schedule(guided)
            for (long long r = 0; r < static_cast<long long>(range_count); ++r) {
                execute_range(static_cast<std::size_t>(r), tid);
            }
        }
    } else if (policy == SchedulePolicy::Tasks) {
        #pragma omp parallel num_threads(static_cast<int>(thread_count))
        {
            #pragma omp single
            {
                for (long long r = 0; r < static_cast<long long>(range_count); ++r) {
                    #pragma omp task firstprivate(r)
                    {
                        const int tid = omp_get_thread_num();
                        execute_range(static_cast<std::size_t>(r), tid);
                    }
                }
            }
        }
    }

    for (const auto& error : errors) {
        if (error) {
            std::rethrow_exception(error);
        }
    }

    std::size_t total_records = 0;
    for (const auto& output : range_outputs) {
        total_records += output.size();
    }

    std::vector<Record> joined;
    joined.reserve(total_records);
    for (const auto& output : range_outputs) {
        joined.insert(joined.end(), output.begin(), output.end());
    }

    ParallelExecutionStats stats;
    stats.thread_times_ms = thread_times_ms;
    stats.policy = policy;

    if (!thread_times_ms.empty()) {
        const double max_t = *std::max_element(
            thread_times_ms.begin(), thread_times_ms.end());
        const double sum_t = std::accumulate(
            thread_times_ms.begin(), thread_times_ms.end(), 0.0);
        const double avg_t = sum_t / static_cast<double>(thread_count);

        stats.max_thread_ms = max_t;
        stats.avg_thread_ms = avg_t;
        stats.load_imbalance = (avg_t > 0.0) ? ((max_t - avg_t) / avg_t) : 0.0;
    }

    return {std::move(joined), std::move(stats)};
}

} // namespace splice
