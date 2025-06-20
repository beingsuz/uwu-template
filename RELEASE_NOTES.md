# UWU-Template v1.0.0-beta Release Notes 🎉

**The first official beta release featuring a complete component system,
enhanced helpers, and blazing fast performance!**

## 🌟 What's New

### 🧩 Component System

- **Reusable templates** with `registerComponent()` and `{{component}}` syntax
- **Props support** for both string literals and variables
- **Parent data access** with `{{@parent.property}}` syntax
- **Component composition** - components can use other components

```typescript
// Register a component
registerComponent(
	"userCard",
	`
<div class="card">
    <h3>{{name}}</h3>
    <p>{{email}}</p>
    <span>{{@parent.siteName}}</span>
</div>
`,
);

// Use in templates
const template = `{{component "userCard" name="John" email=user.email}}`;
```

### 🔧 Enhanced Helper System

- **String literal support**: `{{{helper "string literal" variable}}}`
- **Variable arguments**: Helpers now accept unlimited arguments
- **Mixed argument types**: Combine strings and variables seamlessly

```typescript
registerHelper("formatCurrency", (...args) => {
	const [amount, currency = "USD", locale = "en-US"] = args;
	return new Intl.NumberFormat(locale, { style: "currency", currency })
		.format(amount);
});

// Usage: {{{formatCurrency price "EUR" "de-DE"}}}
```

## ⚡ Performance Improvements

UWU-Template is now **3-14x faster** than popular template engines:

| Engine           | Simple Templates  | Complex Templates |
| ---------------- | ----------------- | ----------------- |
| **UWU-Template** | **2.85M ops/sec** | **39.3K ops/sec** |
| Template Literal | 2.57M ops/sec     | 37.2K ops/sec     |
| Pug              | 1.89M ops/sec     | 24.7K ops/sec     |
| Mustache         | 433K ops/sec      | 9.2K ops/sec      |
| EJS              | 341K ops/sec      | 5.4K ops/sec      |
| Handlebars       | 200K ops/sec      | 9.2K ops/sec      |

## 🔄 Breaking Changes

- **Helper function interface**: Now uses `(...args: unknown[])` instead of
  `(value, options)`

```typescript
// Migration example
// Before
registerHelper("helper", (value, options) => processValue(value));

// After
registerHelper("helper", (...args) => {
	const [value, ...otherArgs] = args;
	return processValue(value);
});
```

## 📦 Installation

```typescript
// From CDN (recommended)
import {
	compile,
	registerComponent,
	registerHelper,
} from "https://cdn.jsdelivr.net/gh/Aiko-Suzuki/uwu-template@main/bundle.js";

// Or locally
import { compile, registerComponent, registerHelper } from "./mod.ts";
```

## 🔗 Links

- [Full Changelog](CHANGELOG.md)
- [Documentation](README.md)
- [Migration Guide](CHANGELOG.md#migration-guide-from-v013)

---

**Happy templating! 🦄**
