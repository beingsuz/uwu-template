<div align="center">
  <img src="uwu.png" alt="UWU Template" width="128" height="128">
  
  # UWU-Template 🦄
  
  A **blazingly fast, feature-rich template engine** for Deno and JavaScript with advanced component system, helper functions, template inheritance, and performance that rivals native template literals.
</div>

## ✨ Features

- 🚀 **Ultra-fast performance** - 3-6x faster than popular alternatives
- 🧩 **Advanced component system** - Reusable templates with props and parent data access
- 🔧 **Enhanced helper functions** - Mixed string/variable arguments with type safety
- 🏗️ **Template inheritance** - Extensible templates with block overrides
- 📝 **Rich templating** - Variables, conditionals, loops, layouts, and raw blocks
- 🛠️ **Enhanced error handling** - Detailed error messages with line numbers and context
- 📦 **Lightweight** - Minimal dependencies, zero runtime overhead
- ⚡ **Production-ready** - Battle-tested with comprehensive benchmarks
- 🎯 **Type-safe** - Written in TypeScript with full type support
- 📚 **Comprehensive documentation** - Complete guides and migration support

## 🆕 New in Latest Version

- ✨ **Enhanced Error Reporting** - Get detailed error messages with line numbers and code context
- 🧩 **Parent Data Access** - Components can access parent template data with `@parent` syntax
- 🔧 **Mixed Helper Arguments** - Use both string literals and variables in helper functions
- 📚 **Complete Documentation** - API reference, migration guides, and component examples
- 🏗️ **Template Inheritance Foundation** - Extensible template system (foundation ready)
- ⚡ **Improved Performance** - Better caching and error recovery

## 📖 Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
- [Core Template Syntax](#-core-template-syntax)
- [Helper Functions](#-helper-functions)
- [Enhanced Component System](#-enhanced-component-system)
- [Template Inheritance](#️-template-inheritance-preview)
- [Performance Benchmarks](#-performance-benchmarks)
- [Documentation](#-documentation)
- [Migration from Other Engines](#-migration-from-other-engines)
- [Contributing](#-contributing)

## 🚀 Quick Start

### Installation

```typescript
// From CDN (recommended)
import { compile, registerComponent, registerHelper } from "https://cdn.jsdelivr.net/gh/Aiko-Suzuki/uwu-template@main/bundle.js";

// Or locally
import { compile, registerComponent, registerHelper } from "./mod.ts";
```

### Basic Usage

```typescript
import { compile } from "./mod.ts";

// 1. Define your template
const template = `
<div class="user-profile">
  <h1>{{title}}</h1>
  <p>Welcome {{user.name}}!</p>
  {{#if user.premium}}
    <span class="badge premium">Premium Member</span>
  {{/if}}
  <ul class="items">
    {{#each items}}
      <li>{{name}} - ${{price}}</li>
    {{/each}}
  </ul>
</div>`;

// 2. Compile the template (with optional error context)
const render = compile(template, { escape: true }, "userProfile");

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

### Error Handling

UWU-Template now provides detailed error information to help you debug issues quickly:

```typescript
import { compile, TemplateSyntaxError, TemplateRuntimeError } from "./mod.ts";

try {
  const render = compile(template, { escape: true }, "myTemplate");
  const result = render(data);
} catch (error) {
  if (error instanceof TemplateSyntaxError) {
    console.log(`Syntax error in template "${error.templateName}":`);
    console.log(`Line ${error.line}, Column ${error.column}: ${error.message}`);
    console.log(error.context); // Shows code context around the error
  }
}
```

## 📚 Core Template Syntax

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

<!-- Complex conditions -->
{{#if user.isActive && user.premium}}
  Premium active user content
{{/if}}
```

### Loops
```handlebars
{{#each items}}
  <li>{{name}} - ${{price}}</li>
{{/each}}

{{#each users}}
  <div>User {{@index}}: {{name}}</div>
{{/each}}
```

### Layouts
```typescript
import { registerLayout } from "./mod.ts";

registerLayout("main", `
<!DOCTYPE html>
<html>
<head><title>{{title}}</title></head>
<body>
  {{> header}}
  <main>{{content}}</main>
  {{> footer}}
</body>
</html>`);

// Use in templates
const template = `
{{> main}}
<h1>Page Content</h1>
`;
```

### Raw Output
For outputting literal template syntax without processing, use raw blocks:

```handlebars
{{{{raw}}}}
  <h1>{{{body}}}</h1>
  <p>This {{variable}} will not be processed</p>
  {{#if condition}}{{value}}{{/if}}
{{{{/raw}}}}
```

**Output:**
```html
<h1>{{{body}}}</h1>
<p>This {{variable}} will not be processed</p>
{{#if condition}}{{value}}{{/if}}
```

**Use Cases:**
- Generating template examples in documentation
- Outputting template syntax for client-side processing
- Creating code examples that contain template syntax
- Bypassing template processing for specific content blocks

## 🔧 Helper Functions

### Built-in Helpers
```handlebars
{{{json data}}}     <!-- JSON.stringify (unescaped) -->
{{{raw content}}}   <!-- Unescaped content -->
```

### Custom Helpers with String Literals
```typescript
import { registerHelper } from "./mod.ts";

// Register helpers with flexible argument types
registerHelper("uppercase", (...args) => {
  const text = args[0];
  return String(text).toUpperCase();
});

registerHelper("formatPrice", (...args) => {
  const price = args[0] as number;
  const currency = args[1] as string || "USD";
  const prefix = args[2] as string || "";
  return `${prefix}${currency} ${price.toFixed(2)}`;
});

registerHelper("dateFormat", (...args) => {
  const date = args[0];
  const format = args[1] as string || "short";
  const d = new Date(date);
  return format === "long" ? d.toLocaleDateString() : d.toDateString();
});
```

**Template Usage with Mixed Arguments:**
```handlebars
<!-- String literals -->
{{{uppercase "hello world"}}}  <!-- Output: HELLO WORLD -->
{{{formatPrice "29.99" "EUR"}}} <!-- Output: EUR 29.99 -->
{{{dateFormat "2025-01-01" "long"}}} <!-- Output: 1/1/2025 -->

<!-- Variables -->
{{{uppercase userName}}}       <!-- Uses variable value -->
{{{formatPrice product.price}}} <!-- Default currency -->

<!-- Mixed string literals and variables -->
{{{formatPrice productPrice "GBP" "Sale: "}}} <!-- Variable + string literals -->
{{{formatPrice price currency prefix}}}       <!-- All variables -->
```

### Block Helpers
```typescript
import { registerBlockHelper } from "./mod.ts";

registerBlockHelper("withUser", (user, options) => {
    if (user?.active) {
        return options.fn(user);
    } else {
        return options.inverse();
    }
});
```

**Usage:**
```handlebars
{{#withUser currentUser}}
  <p>Welcome {{name}}!</p>
{{#else}}
  <p>Please log in</p>
{{/withUser}}
```

## 🧩 Component System

Components are reusable template fragments with their own props and access to parent data.

### Registering Components
```typescript
import { registerComponent } from "./mod.ts";

// Simple component
registerComponent("greeting", "Hello {{name}}!");

// Complex component with layout
registerComponent("userCard", `
<div class="user-card">
  <div class="avatar">
    <img src="{{avatar}}" alt="{{name}}">
  </div>
  <div class="info">
    <h3>{{name}}</h3>
    <p>{{email}}</p>
    {{#if @parent.showStatus}}
      <span class="status {{#if active}}online{{#else}}offline{{/if}}">
        {{#if active}}🟢 Online{{#else}}⚫ Offline{{/if}}
      </span>
    {{/if}}
  </div>
</div>`);

// Component composition
registerComponent("button", `<button class="btn btn-{{variant}}" {{#if disabled}}disabled{{/if}}>{{text}}</button>`);

registerComponent("modal", `
<div class="modal">
  <div class="modal-header">
    <h2>{{title}}</h2>
  </div>
  <div class="modal-body">
    {{message}}
  </div>
  <div class="modal-footer">
    {{component "button" text="OK" variant="primary"}}
    {{component "button" text="Cancel" variant="secondary"}}
  </div>
</div>`);
```

### Using Components
```handlebars
<!-- Simple usage -->
{{component "greeting" name="Alice"}}

<!-- String literals and variables -->
{{component "userCard" 
  name="John Doe" 
  email="john@example.com"
  avatar=user.profileImage
  active=user.isOnline}}

<!-- Nested components -->
{{component "modal" 
  title="Confirm Action" 
  message="Are you sure you want to continue?"}}
```

### Parent Data Access
Components can access parent template data using `@parent`:

```typescript
registerComponent("statusBadge", `
<span class="badge {{#if @parent.isActive}}badge-success{{#else}}badge-danger{{/if}}">
  {{status}} ({{@parent.userCount}} users)
</span>`);
```

**Usage:**
```handlebars
{{component "statusBadge" status="Online"}}
<!-- Component receives: {status: "Online", @parent: parentData} -->
```

### Enhanced Component System

UWU-Template features a powerful component system that supports props, parent data access, and composition.

### Component Registration

```typescript
import { registerComponent } from "./mod.ts";

registerComponent("userCard", `
<div class="user-card">
  <img src="{{avatar}}" alt="{{name}}" class="avatar">
  <h3>{{name}}</h3>
  <p class="email">{{email}}</p>
  <span class="role {{@parent.theme}}-badge">{{role}}</span>
</div>
`);
```

### Parent Data Access

Components can access the parent template's data using the `@parent` syntax:

```typescript
const data = {
  theme: "dark",
  users: [
    { name: "Alice", email: "alice@example.com", role: "Admin" },
    { name: "Bob", email: "bob@example.com", role: "User" }
  ]
};
```

```handlebars
<div class="user-list">
  {{#each users}}
    {{component "userCard" 
      name=name 
      email=email 
      role=role 
      avatar="/avatars/default.jpg"}}
  {{/each}}
</div>
<!-- Each component can access @parent.theme for styling -->
```

### Component Composition

Build complex UIs by composing smaller components:

```typescript
registerComponent("button", `
<button class="btn btn-{{variant}} {{#if @parent.disabled}}disabled{{/if}}" 
        type="{{type}}">
  {{text}}
</button>
`);

registerComponent("productCard", `
<div class="product-card">
  <h3>{{name}}</h3>
  <p class="price">\${{price}}</p>
  {{component "button" text="Add to Cart" variant="primary" type="button"}}
  {{component "button" text="♡ Wishlist" variant="outline" type="button"}}
</div>
`);
```

## 🎨 Real-World Examples

### E-commerce Product List
```typescript
// Register components
registerComponent("productCard", `
<div class="product-card">
  <img src="{{image}}" alt="{{name}}">
  <h3>{{name}}</h3>
  <p class="price">{{{formatPrice price @parent.currency}}}</p>
  {{#if onSale}}
    <span class="sale-badge">On Sale!</span>
  {{/if}}
  {{component "button" text="Add to Cart" variant="primary"}}
</div>`);

// Template
const template = `
<div class="product-grid">
  {{#each products}}
    {{component "productCard" 
      name=name 
      price=price 
      image=image 
      onSale=onSale}}
  {{/each}}
</div>`;

// Data
const data = {
  currency: "USD",
  products: [
    { name: "iPhone 15", price: 999, image: "/iphone15.jpg", onSale: false },
    { name: "MacBook Pro", price: 2499, image: "/macbook.jpg", onSale: true }
  ]
};
```

### Blog with Layout System
```typescript
registerLayout("blogLayout", `
<!DOCTYPE html>
<html>
<head>
  <title>{{title}} - {{@parent.siteName}}</title>
  <meta charset="utf-8">
</head>
<body>
  {{> header}}
  <main>{{content}}</main>
  {{> footer}}
</body>
</html>`);

registerComponent("articleCard", `
<article class="article-card">
  <h2><a href="/posts/{{slug}}">{{title}}</a></h2>
  <div class="meta">
    <span class="author">By {{author}}</span>
    <span class="date">{{{dateFormat publishedAt "long"}}}</span>
  </div>
  <p class="excerpt">{{excerpt}}</p>
  {{component "button" text="Read More" variant="outline"}}
</article>`);

const template = `
{{> blogLayout}}
<div class="blog-posts">
  {{#each posts}}
    {{component "articleCard" 
      title=title 
      slug=slug 
      author=author 
      publishedAt=publishedAt 
      excerpt=excerpt}}
  {{/each}}
</div>`;
```

## 🏗️ Template Inheritance (Preview)

UWU-Template includes a foundation for template inheritance, allowing you to extend base templates:

```typescript
import { registerBaseTemplate } from "./mod.ts";

// Register a base template
registerBaseTemplate("basePage", `
<!DOCTYPE html>
<html>
<head>
  <title>{{#block "title"}}Default Title{{/block}}</title>
</head>
<body>
  <header>{{#block "header"}}Default Header{{/block}}</header>
  <main>{{#block "content"}}Default Content{{/block}}</main>
  <footer>{{#block "footer"}}Default Footer{{/block}}</footer>
</body>
</html>
`);
```

```handlebars
<!-- Child template extends base -->
{{extends "basePage"}}

{{#block "title"}}My Custom Page{{/block}}

{{#block "content"}}
  <h1>Welcome!</h1>
  <p>This content overrides the base template.</p>
{{/block}}
```

*Note: Template inheritance is currently in development. The foundation is complete and ready for full implementation.*

## 📊 Performance Benchmarks

**🚀 Performance Summary:**
- **1.7x faster** than Pug
- **4-7x faster** than Handlebars, EJS, and Mustache  
- **Identical performance** to native Template Literals
- **Fastest** template engine in most scenarios
- **Enhanced caching** for better performance with error handling
- **Sub-millisecond** compilation times for complex templates

### Detailed Results

| Template Engine | Simple Templates | Complex Templates | Large Templates |
|----------------|-----------------|-------------------|-----------------|
| **UWU-Template** | **374.2 ns** | **24.9 µs** | **300.1 µs** |
| Template Literals | 362.3 ns | 24.9 µs | 396.0 µs |
| Pug | 536.9 ns | 41.5 µs | 518.2 µs |
| Mustache | 2.3 µs | 106.8 µs | 1.2 ms |
| Handlebars | 5.1 µs | 111.9 µs | 1.2 ms |
| EJS | 2.9 µs | 170.5 µs | 1.7 ms |

### Real-World Performance
- **E-commerce templates**: 48,913 renders/sec (0.020ms per render)
- **Blog post templates**: 128,739 renders/sec (0.008ms per render)  
- **Email templates**: 365,141 renders/sec (0.003ms per render)

📊 **[View complete benchmark results](./BENCHMARK_RESULTS.md)**

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
## ⚡ Performance Benchmarks

UWU-Template consistently outperforms popular template engines:

```
Template Engine Performance (renders/second):
┌─────────────────┬──────────────────┬────────────────┐
│ Engine          │ Simple Templates │ Complex Templates │
├─────────────────┼──────────────────┼────────────────┤
│ UWU-Template    │ 283,763/s        │ 38,939/s       │
│ Handlebars      │ 85,000/s         │ 12,000/s       │
│ EJS             │ 72,000/s         │ 15,000/s       │
│ Mustache        │ 95,000/s         │ 18,000/s       │
│ Template Literals│ 290,000/s       │ 45,000/s       │
└─────────────────┴──────────────────┴────────────────┘

UWU-Template is 3-6x faster than alternatives!
```

### Why So Fast?

- **Compilation-based**: Templates are compiled to optimized JavaScript functions
- **Zero runtime dependencies**: No parsing overhead during rendering
- **Smart caching**: Compiled templates are cached for reuse
- **Minimal overhead**: Direct property access with optional chaining
- **Optimized code generation**: Hand-tuned JavaScript output

### Benchmark Details

```typescript
// Run benchmarks yourself
deno task bench

// Or manually
deno run --allow-read bench/performance.bench.ts
```

## 📖 Complete API Reference

### Core Functions

#### `compile(template, options?)`
Compiles a template string into a render function.

```typescript
interface CompilerOptions {
  escape?: boolean; // Default: true
}

const render = compile(templateString, { escape: false });
const html = render(data);
```

#### `registerHelper(name, function)`
Registers a custom helper function.

```typescript
registerHelper("helperName", (...args: unknown[]) => {
  // Helper logic
  return "result";
});
```

#### `registerBlockHelper(name, function)`
Registers a block helper with `fn` and `inverse` support.

```typescript
registerBlockHelper("blockName", (context: unknown, options: BlockHelperOptions) => {
  if (condition) {
    return options.fn(context);
  } else {
    return options.inverse(context);
  }
});
```

#### `registerComponent(name, template)`
Registers a reusable component.

```typescript
registerComponent("componentName", `
<div>{{prop1}} - {{@parent.parentData}}</div>
`);
```

#### `registerLayout(name, template)`
Registers a layout template.

```typescript
registerLayout("layoutName", `
<html>
  <body>{{content}}</body>
</html>
`);
```

### Template Syntax Reference

#### Variables
```handlebars
{{variable}}              <!-- Simple variable -->
{{object.property}}       <!-- Nested property -->
{{array.0.property}}      <!-- Array access -->
{{#if variable}}{{/if}}   <!-- In conditionals -->
```

#### Conditionals
```handlebars
<!-- Basic if/else -->
{{#if condition}}
  True content
{{#else}}
  False content
{{/if}}

<!-- Multiple conditions -->
{{#if condition1}}
  First
{{#elseif condition2}}
  Second
{{#else}}
  Default
{{/if}}

<!-- Complex conditions -->
{{#if user.isActive && user.premium}}
  Premium user content
{{/if}}
```

#### Loops
```handlebars
<!-- Basic loop -->
{{#each items}}
  <div>{{name}}</div>
{{/each}}

<!-- With index -->
{{#each items}}
  <div>Item {{@index}}: {{name}}</div>
{{/each}}

<!-- Nested loops -->
{{#each categories}}
  <h2>{{name}}</h2>
  {{#each items}}
    <p>{{name}}</p>
  {{/each}}
{{/each}}
```

#### Helpers
```handlebars
<!-- String literals -->
{{{helperName "string literal"}}}
{{{helperName "string" "another"}}}

<!-- Variables -->
{{{helperName variable}}}
{{{helperName variable1 variable2}}}

<!-- Mixed -->
{{{helperName variable "string" anotherVariable}}}
```

#### Components
```handlebars
<!-- Simple component -->
{{component "componentName"}}

<!-- With props -->
{{component "componentName" prop1="value" prop2=variable}}

<!-- Access parent data in component -->
<!-- Inside component template: -->
<div>{{prop}} - {{@parent.parentVariable}}</div>
```

#### Layouts
```handlebars
<!-- Use layout -->
{{> layoutName}}

<!-- Layout with content -->
{{> layoutName}}
<p>This content goes into the layout</p>
```

#### Raw Output
```handlebars
<!-- Output literal template syntax -->
{{{{raw}}}}
  <h1>{{{body}}}</h1>
  <p>This {{variable}} will not be processed</p>
  {{#if condition}}{{value}}{{/if}}
{{{{/raw}}}}
```

### Error Handling

UWU-Template gracefully handles missing data:

```typescript
const template = `{{user.name}} - {{user.missing.property}}`;
const render = compile(template);
const result = render({ user: { name: "Alice" } });
// Output: "Alice - " (missing properties render as empty)
```

### TypeScript Support

Full TypeScript support with proper typing:

```typescript
import { compile, registerHelper, registerComponent } from "./mod.ts";

// Type-safe helper registration
registerHelper("typedHelper", (value: string, format: string) => {
  return `${format}: ${value}`;
});

// Type-safe data passing
interface User {
  name: string;
  email: string;
}

const render = compile(`Hello {{name}}!`);
const result = render({ name: "Alice" } as User);
```

### Production Tips

#### Pre-compilation
```typescript
// Compile templates at startup, not per request
const templates = {
  userProfile: compile(userProfileTemplate),
  dashboard: compile(dashboardTemplate),
  email: compile(emailTemplate)
};

// Fast rendering per request
app.get("/profile", (req, res) => {
  const html = templates.userProfile(req.user);
  res.send(html);
});
```

#### Component Libraries
```typescript
// Create reusable component libraries
export function registerUIComponents() {
  registerComponent("button", buttonTemplate);
  registerComponent("card", cardTemplate);
  registerComponent("modal", modalTemplate);
  // ... more components
}

// Use across your application
registerUIComponents();
```

#### Performance Optimization
```typescript
// Use unescaped output for trusted content
const template = `{{{trustedHtmlContent}}}`;

// Minimize helper calls in loops
{{#each largeArray}}
  {{{precomputedValue}}} <!-- Better than helper calls -->
{{/each}}

// Cache component instances
const cachedComponents = new Map();
```

## 🔧 Advanced Features

### Custom Block Helpers
```typescript
registerBlockHelper("repeat", (count: number, options) => {
  let result = "";
  for (let i = 0; i < count; i++) {
    result += options.fn({ index: i, value: i + 1 });
  }
  return result;
});
```

```handlebars
{{#repeat 3}}
  <div>Item {{value}} (index {{index}})</div>
{{/repeat}}
```

### Helper with Hash Options
```typescript
registerHelper("link", (text: string, options) => {
  const url = options.hash?.url || "#";
  const target = options.hash?.target || "_self";
  return `<a href="${url}" target="${target}">${text}</a>`;
});
```

```handlebars
{{{link "Click here" url="https://example.com" target="_blank"}}}
```

### Complex Component Composition
```typescript
registerComponent("dataTable", `
<table class="table">
  <thead>
    <tr>
      {{#each @parent.columns}}
        <th>{{title}}</th>
      {{/each}}
    </tr>
  </thead>
  <tbody>
    {{#each rows}}
      {{component "tableRow" rowData=this columns=@parent.columns}}
    {{/each}}
  </tbody>
</table>`);

registerComponent("tableRow", `
<tr>
  {{#each columns}}
    <td>{{lookup ../rowData field}}</td>
  {{/each}}
</tr>`);
```

## 🧪 Testing

UWU-Template includes comprehensive tests:

```bash
# Run all tests
deno test --allow-read

# Run specific test files  
deno test --allow-read production.test.ts
deno test --allow-read real-world.test.ts

# Run benchmarks
deno run --allow-read bench/performance.bench.ts
```

## 🔧 Available Features

| Feature | Status | Example |
|---------|--------|---------|
| Variables | ✅ | `{{name}}` |
| Nested Properties | ✅ | `{{user.email}}` |
| Conditionals | ✅ | `{{#if active}}...{{/if}}` |
| Else/ElseIf | ✅ | `{{#else}}...{{/else}}` |
| Complex Conditions | ✅ | `{{#if a && b}}...{{/if}}` |
| Loops | ✅ | `{{#each items}}...{{/each}}` |
| Layouts | ✅ | `{{> layoutName}}` |
| Helpers (String Literals) | ✅ | `{{{helper "string"}}}` |
| Helpers (Variables) | ✅ | `{{{helper variable}}}` |
| Helpers (Mixed) | ✅ | `{{{helper var "str"}}}` |
| Block Helpers | ✅ | `{{#blockHelper}}...{{/blockHelper}}` |
| Components | ✅ | `{{component "name" prop="value"}}` |
| Parent Data Access | ✅ | `{{@parent.data}}` |
| Component Composition | ✅ | Components using components |
| HTML Escaping | ✅ | Automatic (use `{{{...}}}` to disable) |
| TypeScript Support | ✅ | Full type safety |
| Performance Optimization | ✅ | Compilation-based rendering |

## 🚀 Migration from Other Engines

UWU-Template provides clear migration paths from popular template engines. See our **[complete migration guide](./docs/MIGRATION_GUIDE.md)** for detailed examples.

### From Handlebars (4.5x Performance Improvement)
UWU-Template is largely compatible with Handlebars syntax:

```handlebars
<!-- These work exactly the same -->
{{variable}}
{{#if condition}}...{{/if}}
{{#each items}}...{{/each}}

<!-- UWU-Template enhancements -->
{{component "name" prop="value"}}     <!-- Advanced components -->
{{{helper "string literal"}}}         <!-- Mixed argument types -->
{{@parent.data}}                      <!-- Parent data access -->
```

**Migration effort**: ⭐ **Minimal** - Most templates work without changes

### From EJS (6.8x Performance Improvement)
```javascript
// EJS
<%- include('partial', {data: value}) %>
<% if (user.active) { %>Active<% } %>

// UWU-Template  
{{component "partial" data=value}}
{{#if user.active}}Active{{/if}}
```

**Migration effort**: ⭐⭐⭐ **Moderate** - Syntax changes but clear patterns

### From Mustache (4.3x Performance Improvement)
```handlebars
<!-- Mustache -->
{{#items}}{{name}}{{/items}}

<!-- UWU-Template (same syntax + more features) -->
{{#each items}}{{name}}{{/each}}
{{component "itemCard" name=name}}
```

**Migration effort**: ⭐⭐ **Easy** - Similar syntax with more capabilities

### From Pug (1.7x Performance + 2655x Faster Compilation)
```pug
// Pug
doctype html
html
  head
    title= title
  body
    each item in items
      li= item.name

// UWU-Template
<!DOCTYPE html>
<html>
<head><title>{{title}}</title></head>
<body>
  {{#each items}}<li>{{name}}</li>{{/each}}
</body>
</html>
```

**Migration effort**: ⭐⭐⭐⭐ **Significant** - Complete restructure but major performance gains

### Migration Support Tools
- **[Migration Guide](./docs/MIGRATION_GUIDE.md)** - Step-by-step conversion guides
- **Performance Comparisons** - Before/after benchmarks
- **Syntax Converters** - Patterns for common conversions
- **Best Practices** - Optimization tips for each engine

## 📚 Documentation

UWU-Template now includes comprehensive documentation to help you get started quickly:

### 📖 Complete Guides
- **[API Reference](./docs/API_REFERENCE.md)** - Complete API documentation with examples
- **[Migration Guide](./docs/MIGRATION_GUIDE.md)** - Migrate from Handlebars, EJS, Mustache, Pug
- **[Component Examples](./docs/COMPONENT_EXAMPLES.md)** - Real-world component patterns
- **[Performance Benchmarks](./BENCHMARK_RESULTS.md)** - Detailed performance analysis

### 🚀 Quick References
- **Template Syntax** - Variables, conditionals, loops, and more
- **Component System** - Props, composition, and parent data access
- **Helper Functions** - Custom functions with mixed argument types
- **Error Handling** - Debugging with detailed error messages
- **Performance Tips** - Optimization strategies and best practices

### 🔧 Development Resources
- **TypeScript Support** - Full type definitions included
- **Error Recovery** - Graceful handling of template issues
- **Debugging Tools** - Line numbers and code context in errors
- **Migration Helpers** - Tools to convert from other engines

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Run tests**: `deno test -A`
4. **Run benchmarks**: `deno task bench`
5. **Add your changes with tests**
6. **Update documentation** if needed
7. **Commit**: `git commit -m 'Add amazing feature'`
8. **Push**: `git push origin feature/amazing-feature`
9. **Open a Pull Request**

### Development Setup
```bash
# Clone the repo
git clone https://github.com/your-username/uwu-template.git
cd uwu-template

# Run tests (all should pass)
deno test -A

# Run enhanced features demo
deno run -A enhanced-demo.ts

# Run benchmarks
deno task bench

# Check formatting
deno fmt --check

# Check linting
deno lint

# Build bundle
deno task build
```

### Documentation
- All public APIs are documented in `docs/API_REFERENCE.md`
- Component examples are in `docs/COMPONENT_EXAMPLES.md`
- Migration guides are in `docs/MIGRATION_GUIDE.md`
- Update documentation when adding features

### Testing
- Add tests for new features in appropriate test files
- Ensure backward compatibility
- Test error handling scenarios
- Benchmark performance impact for major changes

## 🌟 Sponsor

This project is proudly sponsored by [yatsu.net](https://yatsu.net)

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## � Changelog

See [CHANGELOG.md](CHANGELOG.md) for a complete list of changes and version history.

## �🙏 Acknowledgments

- Inspired by Handlebars, Mustache, and EJS
- Built for the Deno community  
- Performance benchmarks against industry standards
- Enhanced with comprehensive documentation and developer experience improvements

---

## 🎯 What's Next?

- 🏗️ **Complete Template Inheritance** - Full block override system
- 🔧 **Advanced Helper Features** - More built-in helpers and utilities
- 🚀 **Streaming Templates** - Support for large dataset streaming
- 📱 **Framework Integrations** - Plugins for popular frameworks
- 🎨 **Template Designer** - Visual template builder

**🦄 Made with care for modern web development**

*UWU-Template: Because your templates deserve to be fast AND adorable!*

📊 **Performance** • 🧩 **Components** • 🔧 **Helpers** • 📚 **Documentation** • 🚀 **Migration**
