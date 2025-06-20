# UWU-Template Comprehensive Benchmark Results

## Overview

This benchmark compares UWU-Template against 5 popular template engines:
Handlebars, EJS, Mustache, Pug, and JavaScript Template Literals. All templates
are pre-compiled for fair comparison.

## Template Engines Tested

- **UWU-Template** (our engine)
- **Handlebars** v4.7.8
- **EJS** v3.1.9
- **Mustache** v4.2.0
- **Pug** v3.0.2
- **Template Literals** (native JavaScript baseline)

## Test Environment

- **CPU**: AMD Ryzen 5 5600X 6-Core Processor
- **Runtime**: Deno 2.3.6 (x86_64-pc-windows-msvc)
- **OS**: Windows
- **Date**: June 12, 2025

## Verification

✅ All template engines produce consistent output for both simple and complex
templates

- All engines correctly render variables, conditionals, and loops
- Output verification passed for all 6 engines

## Benchmark Results

### Simple Templates (Basic variable interpolation, conditionals, loops)

| Engine           | Time/Iteration | Performance vs UWU |
| ---------------- | -------------- | ------------------ |
| **UWU-Template** | 374.2 ns       | **BASELINE**       |
| Template Literal | 362.3 ns       | 1.03x faster       |
| Pug              | 536.9 ns       | 1.44x slower       |
| Mustache         | 2.3 µs         | 6.03x slower       |
| EJS              | 2.9 µs         | 7.73x slower       |
| Handlebars       | 5.1 µs         | 13.50x slower      |

### Complex Templates (100 items with conditionals and nested data)

| Engine           | Time/Iteration | Performance vs UWU |
| ---------------- | -------------- | ------------------ |
| **UWU-Template** | 24.9 µs        | **BASELINE**       |
| Template Literal | 24.9 µs        | 1.00x slower       |
| Pug              | 41.5 µs        | 1.67x slower       |
| Mustache         | 106.8 µs       | 4.29x slower       |
| Handlebars       | 111.9 µs       | 4.49x slower       |
| EJS              | 170.5 µs       | 6.85x slower       |

### Large Templates (1000 items)

| Engine           | Time/Iteration | Performance vs UWU |
| ---------------- | -------------- | ------------------ |
| **UWU-Template** | 300.1 µs       | **BASELINE**       |
| Template Literal | 396.0 µs       | 1.32x slower       |
| Pug              | 518.2 µs       | 1.73x slower       |
| Handlebars       | 1.2 ms         | 3.84x slower       |
| Mustache         | 1.2 ms         | 3.97x slower       |
| EJS              | 1.7 ms         | 5.72x slower       |

### Compilation Performance

| Engine           | Time/Iteration | Performance vs UWU |
| ---------------- | -------------- | ------------------ |
| Handlebars       | 14.8 ns        | **19.62x faster**  |
| Mustache (Parse) | 166.6 ns       | 1.75x faster       |
| **UWU-Template** | 291.4 ns       | **BASELINE**       |
| EJS              | 19.8 µs        | 67.97x slower      |
| Pug              | 773.5 µs       | 2655x slower       |

## Key Findings

### 🚀 Runtime Performance (Most Important)

UWU-Template shows **excellent runtime performance**:

- **Fastest** or **second-fastest** in all rendering scenarios
- Competitive with native Template Literals (identical performance on complex
  templates)
- **4-7x faster** than popular engines like Handlebars, EJS, and Mustache
- **1.7x faster** than Pug for complex rendering

### ⚡ Compilation Speed

- Handlebars has the fastest compilation (very simple parsing)
- UWU-Template has **moderate compilation time** - acceptable for most use cases
- Much faster compilation than EJS and Pug (67x and 2655x faster respectively)

### 📊 Overall Assessment

UWU-Template provides:

1. **Top-tier runtime performance** - the most critical metric for production
   use
2. **Competitive compilation speed** - suitable for both build-time and runtime
   compilation
3. **Consistent performance scaling** - maintains advantage across different
   template sizes
4. **Correctness** - produces identical output to established engines

## Conclusion

UWU-Template achieves its goal of being a **high-performance template engine**
that can compete with and often outperform established alternatives. The runtime
performance is exceptional, making it an excellent choice for
performance-critical applications.

The slight compilation overhead compared to Handlebars is more than offset by
the superior runtime performance, especially in scenarios with repeated template
rendering (which is the typical use case).

## Running the Benchmark

```bash
deno task bench
```
