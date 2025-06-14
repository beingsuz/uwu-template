# 🎉 UWU-Template v1.0.0-beta

**The first official beta release featuring a complete component system, enhanced helpers, and blazing fast performance!**

## 🌟 What's New

### 🧩 Component System
Complete reusable template system:
```typescript
// Register components
registerComponent("userCard", `<div class="card"><h3>{{name}}</h3></div>`);

// Use with props
{{component "userCard" name="John" email=user.email}}

// Access parent data
{{@parent.siteName}}
```

### 🔧 Enhanced Helper System
String literals and variable arguments:
```typescript
// String literal support
{{{helper "string literal" variable "another string"}}}

// Variable arguments
registerHelper("format", (...args) => { /* process all args */ });
```

### ⚡ Performance Results
- **2.85M renders/sec** for simple templates (14x faster than Handlebars)
- **39.3K renders/sec** for complex templates (4x faster than Handlebars)
- Comprehensive benchmarks vs all major template engines

## 📦 Installation

### npm
```bash
npm install uwu-template@beta
```

### CDN
```typescript
import { compile, registerComponent, registerHelper } from "https://cdn.jsdelivr.net/npm/uwu-template@beta/bundle.js";
```

### Deno
```typescript
import { compile, registerComponent, registerHelper } from "https://deno.land/x/uwu_template@v1.0.0-beta/mod.ts";
```

## 🔄 Breaking Changes

Helper function interface changed to support variable arguments:
```typescript
// Before
registerHelper("helper", (value, options) => processValue(value));

// After  
registerHelper("helper", (...args) => {
    const [value, ...otherArgs] = args;
    return processValue(value);
});
```

## 🧪 Testing

All tests passing with comprehensive coverage:
- ✅ Core template engine features
- ✅ Component system with complex scenarios  
- ✅ Helper functions with variable arguments
- ✅ Real-world performance benchmarks
- ✅ Production-ready compatibility

## 📚 Documentation

- [Full Documentation](https://github.com/beingsuz/uwu-template#readme)
- [Complete Changelog](https://github.com/beingsuz/uwu-template/blob/main/CHANGELOG.md)
- [Migration Guide](https://github.com/beingsuz/uwu-template/blob/main/CHANGELOG.md#migration-guide-from-v013)

---

**Ready for production testing! Please report any issues. 🦄**
