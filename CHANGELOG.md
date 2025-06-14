# Changelog

All notable changes to UWU-Template will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### 🔮 Future Features
- Consider additional template syntax enhancements
- Explore advanced caching strategies
- Investigate streaming template support

### ✨ New Features Added
- **NEW**: Raw output blocks with `{{{{raw}}}}...{{{{/raw}}}}` syntax
- **NEW**: Bypass template processing for literal output of template syntax
- **NEW**: Support for outputting code examples and documentation

---

## [1.0.0-beta] - 2025-06-14

### 🎉 First Beta Release!

This marks the first official beta release of UWU-Template, featuring a complete rewrite with major performance improvements and new features.

### 🎉 Major Features Added

#### 🧩 Component System
- **NEW**: Complete component system with reusable template fragments
- **NEW**: Component registration with `registerComponent(name, template)`
- **NEW**: Component usage with `{{component "name" prop1="value" prop2=variable}}`
- **NEW**: Props system supporting both string literals and variables
- **NEW**: Parent data access with `{{@parent.propertyName}}` syntax
- **NEW**: Component composition - components can use other components
- **NEW**: Component isolation with separate data scopes

#### 🔧 Enhanced Helper System
- **NEW**: String literal support in helpers: `{{{helper "string literal"}}}`
- **NEW**: Mixed argument types: `{{{helper variable "string" anotherVar}}}`
- **NEW**: Variable argument support for helpers (`...args: unknown[]`)
- **IMPROVED**: Helper function interface now supports multiple arguments
- **NEW**: Triple brace syntax `{{{...}}}` for unescaped helper output

#### ⚡ Engine Improvements
- **REWRITE**: Complete engine rework for better performance and features
- **NEW**: Compilation-based template processing for maximum speed
- **NEW**: Advanced condition parsing supporting complex expressions
- **IMPROVED**: Enhanced data accessor generation with `@parent` support
- **NEW**: Component caching system for performance optimization
- **IMPROVED**: Better error handling and edge case management

### 🚀 Performance Enhancements
- **IMPROVED**: 3-14x performance increase over popular template engines
- **BENCHMARK**: 2,854,000 renders/sec for simple templates
- **BENCHMARK**: 39,320 renders/sec for complex templates (100 items)
- **BENCHMARK**: 3,531 renders/sec for large templates (1000 items)
- **NEW**: Pre-compilation support for production environments
- **OPTIMIZED**: Memory usage and garbage collection improvements

### 📚 Template Syntax Enhancements
- **NEW**: Complex conditional expressions: `{{#if user.active && user.premium}}`
- **IMPROVED**: Better nested property access handling
- **NEW**: Enhanced layout system integration
- **IMPROVED**: More robust variable interpolation

### 🛠️ Developer Experience
- **NEW**: Comprehensive TypeScript support with proper types
- **NEW**: Better error messages and debugging information
- **IMPROVED**: API consistency across all functions
- **NEW**: Extensive documentation with real-world examples
- **NEW**: Production-ready template patterns and best practices

### 📖 Documentation & Examples
- **NEW**: Complete rewrite of README with comprehensive examples
- **NEW**: Component system documentation with real-world use cases
- **NEW**: Helper function guide with string literal examples
- **NEW**: Performance benchmarking documentation
- **NEW**: Migration guide from other template engines
- **NEW**: API reference with TypeScript signatures
- **NEW**: Production optimization guidelines

### 🧪 Testing & Quality
- **NEW**: Comprehensive test suite for all new features
- **NEW**: Component system tests with complex scenarios
- **NEW**: Helper function tests with various argument types
- **NEW**: Performance regression tests
- **NEW**: Real-world template compatibility tests
- **IMPROVED**: Test coverage across all engine components

### 🔧 Infrastructure
- **NEW**: Updated benchmarking system with multiple engines
- **NEW**: Automated performance tracking
- **IMPROVED**: Build system optimization
- **NEW**: Template collections for testing and examples
- **UPDATED**: Deno configuration and dependencies

### 📦 API Changes

#### New Exports
```typescript
export { registerComponent } from "./src/engine.ts";
```

#### Enhanced Interfaces
```typescript
// Helper functions now support variable arguments
interface HelperFunction {
    (...args: unknown[]): string;
}

// Component support in template constructs
interface TemplateConstruct {
    type: 'variable' | 'if' | 'each' | 'layout' | 'blockHelper' | 'helper' | 'component';
    // ... other properties
}
```

#### New Template Syntax
```handlebars
<!-- Components -->
{{component "componentName" prop="value" variable=data}}

<!-- Helper string literals -->
{{{helper "string literal" variable "another string"}}}

<!-- Parent data access -->
{{@parent.propertyName}}
```

### 🔄 Breaking Changes
- **BREAKING**: Helper function interface changed to support variable arguments
- **CHANGED**: Some internal APIs restructured for better performance
- **MIGRATION**: Previous helper functions need minor signature updates

### 🐛 Bug Fixes
- **FIXED**: Condition parsing edge cases with special characters
- **FIXED**: Data accessor generation for complex property paths
- **FIXED**: Template compilation errors with nested structures
- **IMPROVED**: Error handling for missing components and helpers
- **FIXED**: Memory leaks in template caching system

### 📊 Performance Comparison

| Template Engine | Simple (ops/sec) | Complex (ops/sec) | vs UWU-Template |
|----------------|------------------|-------------------|-----------------|
| **UWU-Template** | **2,854,000** | **39,320** | **Baseline** |
| Template Literal | 2,573,000 | 37,210 | 1.11x slower |
| Pug | 1,888,000 | 24,680 | 1.51x slower |
| Mustache | 432,700 | 9,234 | 6.60x slower |
| EJS | 341,200 | 5,378 | 8.36x slower |
| Handlebars | 200,100 | 9,172 | 14.26x slower |

### 🎯 Compatibility
- **Deno**: 1.37+ (recommended: latest)
- **Node.js**: 18+ (via npm package)
- **Browsers**: Modern browsers with ES2020 support
- **TypeScript**: 4.9+

---

## [0.2.0] - 2025-01-17

### Previous Development Version
- All features from this version are included in 1.0.0-beta

## [0.1.3] - 2023-07-22

### Changed
- Updated bundle.js

## [0.1.2] - Previous Release

### Added
- Basic template engine functionality
- Variable interpolation
- Basic conditionals and loops
- Helper system foundation

## [0.1.1] - Previous Release

### Added
- Initial template engine implementation
- Core parsing and rendering

## [0.1.0] - Initial Release

### Added
- Basic template compilation
- Variable substitution
- Simple template syntax

---

## Migration Guide from v0.1.3

### Helper Functions
```typescript
// Before (v0.1.3)
registerHelper("helper", (value, options) => {
    return processValue(value);
});

// After (Current)
registerHelper("helper", (...args) => {
    const [value, ...otherArgs] = args;
    return processValue(value);
});
```

### New Features to Adopt
```typescript
// Use the new component system
registerComponent("userCard", `
<div class="card">
    <h3>{{name}}</h3>
    <p>{{email}}</p>
</div>
`);

// Use string literals in helpers
const template = `{{{formatDate "2025-01-01" "long"}}}`;

// Access parent data in components
const componentTemplate = `
<div>{{title}} - {{@parent.siteName}}</div>
`;
```

For detailed migration instructions, see the [README.md](README.md) file.
