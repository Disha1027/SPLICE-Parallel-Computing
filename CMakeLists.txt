cmake_minimum_required(VERSION 3.20)
project(SPLICE LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

find_package(OpenMP REQUIRED COMPONENTS CXX)

add_executable(splice src/main.cpp)
target_link_libraries(splice PRIVATE OpenMP::OpenMP_CXX)
