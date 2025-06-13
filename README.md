# UWU-Template 👉👈

A **blazingly fast template engine** for Deno and JavaScript that outperforms popular alternatives while being simple to use.

## ⚡ Why UWU-Template?

- 🚀 **3-6x faster** than Handlebars, EJS, and Mustache
- 🏎️ **Nearly as fast as native Template Literals** (within 4% performance)
- 🎯 **1.5x faster** than Pug for complex templates
- 📦 **Lightweight** with minimal dependencies
- ✅ **Battle-tested** with comprehensive benchmarks
- 🔧 **Easy to use** with familiar syntax

## 🚀 Quick Start

### Installation

```js
// From CDN (recommended)
import { compile } from "https://cdn.jsdelivr.net/gh/Aiko-Suzuki/uwu-template@main/bundle.js";

// Or locally
import { compile } from "./mod.ts";
```

### Basic Usage

```js
import { compile } from "https://cdn.jsdelivr.net/gh/Aiko-Suzuki/uwu-template@main/bundle.js";

// 1. Define your template
const template = `
<div>
  <h1>{{title}}</h1>
  <p>Welcome {{user.name}}!</p>
  {{#if user.premium}}
    <span class="premium">Premium Member</span>
  {{/if}}
  <ul>
    {{#each items}}
      <li>{{name}} - ${{price}}</li>
    {{/each}}
  </ul>
</div>`;

// 2. Compile the template
const render = compile(template);

// 3. Render with data
const data = {
  title: "My Store",
  user: { name: "Alice", premium: true },
  items: [
    { name: "Widget A", price: 29.99 },
    { name: "Widget B", price: 19.99 }
  ]
};

const html = render(data);
console.log(html);
```

## 📚 Template Syntax

### Variables
```handlebars
{{title}}           <!-- Simple variable -->
{{user.name}}       <!-- Nested property -->
{{items.0.price}}   <!-- Array access -->
```

### Conditionals
```handlebars
{{#if condition}}
  Content when true
{{#elseif otherCondition}}
  Content when elseif is true
{{#else}}
  Content when false
{{/if}}
```

### Loops
```handlebars
{{#each items}}
  <li>{{name}} - {{price}}</li>
{{/each}}
```

### Built-in Helpers
```handlebars
{{json data}}       <!-- JSON.stringify -->
{{raw content}}     <!-- Unescaped content -->
```

### Custom Helpers
```js
import { registerHelper } from "./mod.ts";

registerHelper("uppercase", (text) => {
  return text.toUpperCase();
});

// Use in templates: {{uppercase name}}
```

### Block Helpers with Options
```js
import { registerBlockHelper } from "./mod.ts";

registerBlockHelper("withUser", (user, options) => {
    if (user?.active) {
        return options.fn(user);
    } else {
        return options.inverse();
    }
});

// Use in templates:
// {{#withUser currentUser}}
//   Welcome {{name}}!
// {{else}}
//   Please log in
// {{/withUser}}
```

📖 **[View detailed Block Helper documentation](./BLOCK_HELPERS.md)**

## 📊 Performance Benchmarks

**🚀 Performance Summary:**
- **1.7x faster** than Pug
- **4-7x faster** than Handlebars, EJS, and Mustache  
- **Identical performance** to native Template Literals
- **Fastest** template engine in most scenarios

### Run Benchmarks Yourself

```bash
deno task bench
```

📈 **[View detailed benchmark results](./BENCHMARK_RESULTS.md)**

## 🛠️ Advanced Usage

### File-based Templates

```js
// Read template from file
const template = await Deno.readTextFile("./templates/layout.html");
const render = compile(template);

const result = render({
  title: "My Website",
  content: "Hello, world!"
});
```

### Pre-compilation for Production

```js
// Compile once, use many times
const render = compile(template);

// Fast rendering for each request
app.get("/", (req, res) => {
  const html = render({ user: req.user });
  res.send(html);
});
```

## 🔧 Available Features

| Feature | Status | Example |
|---------|--------|---------|
| Variables | ✅ | `{{name}}` |
| Nested Properties | ✅ | `{{user.email}}` |
| Conditionals | ✅ | `{{#if active}}...{{/if}}` |
| Else/ElseIf | ✅ | `{{#else}}...{{/else}}` |
| Loops | ✅ | `{{#each items}}...{{/each}}` |
| Built-in Helpers | ✅ | `{{json data}}` |
| Custom Helpers | ✅ | `registerHelper("name", fn)` |
| Block Helpers | ✅ | `registerBlockHelper("name", fn)` |
| Helper Options | ✅ | `{{helper value key="option"}}` |
| HTML Escaping | ✅ | Automatic (use `{{raw}}` to disable) |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Run the benchmarks: `deno task bench`
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Made with ❤️ for the Deno community**

*Note: While the name says "uwu", this is a serious, high-performance template engine suitable for production use!*
