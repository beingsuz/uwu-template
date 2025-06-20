# Migration Guide to UWU-Template

This guide helps you migrate from popular template engines to UWU-Template while
taking advantage of its performance benefits and advanced features.

## Table of Contents

- [From Handlebars](#from-handlebars)
- [From EJS](#from-ejs)
- [From Mustache](#from-mustache)
- [From Pug](#from-pug)
- [Performance Comparison](#performance-comparison)
- [Advanced Features Migration](#advanced-features-migration)

## From Handlebars

UWU-Template syntax is very similar to Handlebars, making migration
straightforward.

### Basic Syntax (No Changes Needed)

```handlebars
<!-- Variables -->
{{name}}
{{user.email}}

<!-- Conditionals -->
{{#if condition}}
  Content
{{else}}
  Other content
{{/if}}

<!-- Loops -->
{{#each items}}
  {{name}}: {{value}}
{{/each}}
```

### Helpers Migration

**Handlebars:**

```javascript
Handlebars.registerHelper("uppercase", function (str) {
	return str.toUpperCase();
});

Handlebars.registerHelper("repeat", function (count, options) {
	let result = "";
	for (let i = 0; i < count; i++) {
		result += options.fn(this);
	}
	return result;
});
```

**UWU-Template:**

```typescript
import { registerBlockHelper, registerHelper } from "./mod.ts";

registerHelper("uppercase", (str: string) => {
	return str.toUpperCase();
});

registerBlockHelper("repeat", (count: unknown, options) => {
	const num = count as number;
	let result = "";
	for (let i = 0; i < num; i++) {
		result += options.fn({ index: i });
	}
	return result;
});
```

### Partials to Layouts

**Handlebars:**

```javascript
Handlebars.registerPartial("header", headerTemplate);
```

```handlebars
{{> header}}
```

**UWU-Template:**

```typescript
import { registerLayout } from "./mod.ts";

registerLayout("header", headerTemplate);
```

```handlebars
{{> header}}
```

### Performance Improvement

- **4.5x faster** rendering than Handlebars
- **Compilation caching** automatically handled
- **Better memory efficiency**

### Migration Steps

1. Replace `Handlebars.compile()` with `compile()` from UWU-Template
2. Convert `registerPartial()` to `registerLayout()`
3. Convert helpers to TypeScript (optional but recommended)
4. Test templates - most should work without changes

## From EJS

EJS uses a different syntax, requiring more changes but offering significant
performance gains.

### Variables

**EJS:**

```ejs
<h1><%= title %></h1>
<p><%- rawHtml %></p>
```

**UWU-Template:**

```handlebars
<h1>{{title}}</h1>
<p>{{{rawHtml}}}</p>
```

### Conditionals

**EJS:**

```ejs
<% if (user.isActive) { %>
  <span>Active User</span>
<% } else { %>
  <span>Inactive User</span>
<% } %>
```

**UWU-Template:**

```handlebars
{{#if user.isActive}}
  <span>Active User</span>
{{else}}
  <span>Inactive User</span>
{{/if}}
```

### Loops

**EJS:**

```ejs
<% items.forEach(function(item, index) { %>
  <li><%- index %>: <%= item.name %></li>
<% }) %>
```

**UWU-Template:**

```handlebars
{{#each items}}
  <li>{{@index}}: {{name}}</li>
{{/each}}
```

### Includes

**EJS:**

```ejs
<%- include('header', { title: 'My Page' }) %>
```

**UWU-Template:**

```typescript
// Register as component
registerComponent("header", headerTemplate);
```

```handlebars
{{component "header" title="My Page"}}
```

### Performance Improvement

- **6.8x faster** rendering than EJS
- **Much faster compilation** (67x faster)
- **Cleaner syntax** without embedded JavaScript

## From Mustache

Mustache is logic-less and very similar to UWU-Template syntax.

### Basic Syntax (Mostly Compatible)

**Mustache/UWU-Template:**

```mustache
{{name}}
{{#items}}
  {{name}}: {{value}}
{{/items}}
{{#isActive}}
  Active!
{{/isActive}}
```

### Inverted Sections

**Mustache:**

```mustache
{{^items}}
  No items found
{{/items}}
```

**UWU-Template:**

```handlebars
{{#if items}}
{{else}}
  No items found
{{/if}}
```

### Lambdas to Helpers

**Mustache:**

```javascript
const data = {
	name: "World",
	uppercase: function () {
		return function (text, render) {
			return render(text).toUpperCase();
		};
	},
};
```

**UWU-Template:**

```typescript
registerHelper("uppercase", (text: string) => {
	return text.toUpperCase();
});
```

```handlebars
{{{uppercase name}}}
```

### Performance Improvement

- **4.3x faster** rendering than Mustache
- **More features** while maintaining simplicity
- **Better error handling**

## From Pug

Pug uses indentation-based syntax, requiring significant template rewrites.

### Basic Structure

**Pug:**

```pug
doctype html
html
  head
    title= title
  body
    h1= heading
    p= description
    if user.isActive
      .active-badge Active User
    each item in items
      li= item.name
```

**UWU-Template:**

```handlebars
<!DOCTYPE html>
<html>
<head>
  <title>{{title}}</title>
</head>
<body>
  <h1>{{heading}}</h1>
  <p>{{description}}</p>
  {{#if user.isActive}}
    <div class="active-badge">Active User</div>
  {{/if}}
  {{#each items}}
    <li>{{name}}</li>
  {{/each}}
</body>
</html>
```

### Mixins to Components

**Pug:**

```pug
mixin userCard(user)
  .user-card
    h3= user.name
    p= user.email

+userCard(currentUser)
```

**UWU-Template:**

```typescript
registerComponent(
	"userCard",
	`
<div class="user-card">
  <h3>{{name}}</h3>
  <p>{{email}}</p>
</div>
`,
);
```

```handlebars
{{component "userCard" name=currentUser.name email=currentUser.email}}
```

### Performance Improvement

- **1.7x faster** rendering than Pug
- **2655x faster** compilation than Pug
- **More explicit** HTML structure

### Migration Strategy

1. Convert indented structure to HTML tags
2. Replace Pug variables (`= variable`) with `{{variable}}`
3. Convert conditionals and loops to Handlebars syntax
4. Convert mixins to UWU-Template components
5. Test thoroughly as this requires the most changes

## Performance Comparison

| Template Engine   | Rendering Speed | Compilation Speed | Memory Usage |
| ----------------- | --------------- | ----------------- | ------------ |
| UWU-Template      | **Baseline**    | **Baseline**      | **Lowest**   |
| Template Literals | 1.0x slower     | N/A               | Low          |
| Pug               | 1.7x slower     | 2655x slower      | Medium       |
| Mustache          | 4.3x slower     | 1.8x faster       | Medium       |
| Handlebars        | 4.5x slower     | 19.6x faster      | High         |
| EJS               | 6.8x slower     | 68x slower        | High         |

## Advanced Features Migration

### Template Inheritance

UWU-Template introduces template inheritance not available in most other
engines:

```typescript
// Register base template
registerBaseTemplate(
	"basePage",
	`
<!DOCTYPE html>
<html>
<head>
  <title>{{#block "title"}}Default Title{{/block}}</title>
</head>
<body>
  {{#block "content"}}Default Content{{/block}}
</body>
</html>
`,
);
```

```handlebars
<!-- Child template -->
{{extends "basePage"}}

{{#block "title"}}My Custom Page{{/block}}

{{#block "content"}}
  <h1>Welcome!</h1>
  <p>This content replaces the default.</p>
{{/block}}
```

### Enhanced Error Reporting

UWU-Template provides detailed error messages with line numbers:

```typescript
try {
	const render = compile(template, { escape: true }, "myTemplate");
	const result = render(data);
} catch (error) {
	if (error instanceof TemplateSyntaxError) {
		console.log(`Template "myTemplate" syntax error:`);
		console.log(
			`Line ${error.line}, Column ${error.column}: ${error.message}`,
		);
		console.log(error.context); // Shows code context
	}
}
```

### Component System

Components provide better organization than partials:

```typescript
// Define reusable components
registerComponent(
	"productCard",
	`
<div class="product-card">
  <h3>{{name}}</h3>
  <p class="price">\${{price}}</p>
  <p class="description">{{description}}</p>
  <span class="category {{@parent.theme}}">{{category}}</span>
</div>
`,
);
```

```handlebars
<!-- Use components with props -->
{{#each products}}
  {{component "productCard" 
    name=name 
    price=price 
    description=description 
    category=category}}
{{/each}}
```

## Migration Checklist

### Pre-Migration

- [ ] Audit current template usage
- [ ] Identify custom helpers/mixins/partials
- [ ] Create performance benchmarks
- [ ] Plan template organization

### During Migration

- [ ] Convert templates to UWU-Template syntax
- [ ] Migrate helpers and register them properly
- [ ] Convert partials/includes to layouts or components
- [ ] Add error handling with proper template names
- [ ] Test with real data

### Post-Migration

- [ ] Benchmark performance improvements
- [ ] Optimize templates for UWU-Template features
- [ ] Consider using template inheritance
- [ ] Update documentation
- [ ] Train team on new syntax (if needed)

### Common Gotchas

1. **Helper return types**: Ensure helpers return strings
2. **Escaping**: Use `{{{...}}}` for unescaped content
3. **Component props**: Pass data explicitly as props
4. **Error handling**: Wrap compilation in try-catch
5. **Cache warming**: Compile templates at startup for best performance

## Need Help?

- Check the [API Reference](./API_REFERENCE.md) for detailed documentation
- Review [examples](../templates/) in the project
- Compare [benchmark results](../BENCHMARK_RESULTS.md) for your use case
- Open an issue for migration-specific questions
