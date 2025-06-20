# UWU-Template API Reference

## Table of Contents

- [Core Functions](#core-functions)
- [Template Registration](#template-registration)
- [Error Handling](#error-handling)
- [Component System](#component-system)
- [Helper System](#helper-system)
- [Template Inheritance](#template-inheritance)
- [Syntax Reference](#syntax-reference)

## Core Functions

### `compile(template: string, options?: CompilerOptions, templateName?: string)`

Compiles a template string into an optimized rendering function.

**Parameters:**

- `template` (string): The template string to compile
- `options` (CompilerOptions, optional): Compilation options
  - `escape` (boolean): Whether to HTML-escape output (default: true)
- `templateName` (string, optional): Name for error reporting

**Returns:** `(data: unknown) => string` - Compiled template function

**Example:**

```typescript
import { compile } from "./mod.ts";

const template = `<h1>{{title}}</h1>
<p>Welcome {{user.name}}!</p>`;

const render = compile(template, { escape: true }, "welcomeTemplate");
const html = render({
	title: "My Site",
	user: { name: "Alice" },
});
```

### `renderTemplate(key: string, data: unknown, template: string)`

Legacy function for backwards compatibility. Compiles and renders a template in
one call.

**Parameters:**

- `key` (string): Template identifier (unused, kept for compatibility)
- `data` (unknown): Data to render
- `template` (string): Template string

**Returns:** `string` - Rendered HTML

## Template Registration

### `registerLayout(name: string, content: string)`

Registers a layout template for use with `{{> layoutName}}` syntax.

**Example:**

```typescript
import { registerLayout } from "./mod.ts";

registerLayout(
	"mainLayout",
	`
<html>
<head><title>{{title}}</title></head>
<body>
  {{> content}}
</body>
</html>
`,
);
```

### `registerComponent(name: string, template: string)`

Registers a reusable component template.

**Example:**

```typescript
import { registerComponent } from "./mod.ts";

registerComponent(
	"userCard",
	`
<div class="user-card">
  <h3>{{name}}</h3>
  <p>{{email}}</p>
  <span class="{{@parent.theme}}-badge">{{role}}</span>
</div>
`,
);
```

### `registerBaseTemplate(name: string, template: string)`

Registers a base template for inheritance.

**Example:**

```typescript
import { registerBaseTemplate } from "./mod.ts";

registerBaseTemplate(
	"basePage",
	`
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
`,
);
```

### `clearTemplateCache()`

Clears all compiled template caches. Useful for development or when templates
change dynamically.

## Error Handling

### `TemplateError`

Base class for all template-related errors.

**Properties:**

- `line` (number, optional): Line number where error occurred
- `column` (number, optional): Column number where error occurred
- `templateName` (string, optional): Name of the template
- `context` (string, optional): Contextual code around the error

### `TemplateSyntaxError extends TemplateError`

Thrown when template syntax is invalid.

**Example:**

```typescript
try {
	const render = compile("{{#if unclosed block");
} catch (error) {
	if (error instanceof TemplateSyntaxError) {
		console.log(`Syntax error at line ${error.line}: ${error.message}`);
		console.log(error.context);
	}
}
```

### `TemplateRuntimeError extends TemplateError`

Thrown when template execution fails.

## Component System

### Basic Component Usage

```handlebars
{{component "componentName" prop1="value" prop2=variable}}
```

### Component Props

Components receive props as their data context:

```typescript
registerComponent(
	"productCard",
	`
<div class="product">
  <h3>{{name}}</h3>
  <p class="price">\${{price}}</p>
  <p class="description">{{description}}</p>
</div>
`,
);
```

```handlebars
{{component "productCard" name="Widget" price=29.99 description="A useful widget"}}
```

### Parent Data Access

Access parent template data using `@parent`:

```handlebars
<!-- Parent template has: { theme: "dark", user: { role: "admin" } } -->
{{component "button" text="Click me" class="{{@parent.theme}}-button"}}
```

### Component Composition

Components can use other components:

```typescript
registerComponent(
	"userProfile",
	`
<div class="profile">
  {{component "avatar" src=avatarUrl size="large"}}
  {{component "userInfo" name=name email=email}}
</div>
`,
);
```

## Helper System

### `registerHelper(name: string, fn: HelperFunction)`

Registers a simple helper function.

**Example:**

```typescript
import { registerHelper } from "./mod.ts";

registerHelper("uppercase", (text: string) => {
	return text.toString().toUpperCase();
});

registerHelper("formatDate", (date: Date, format: string) => {
	// Custom date formatting logic
	return date.toLocaleDateString();
});
```

### `registerBlockHelper(name: string, fn: BlockHelperFunction)`

Registers a block helper that can wrap content.

**Example:**

```typescript
import { registerBlockHelper } from "./mod.ts";

registerBlockHelper(
	"repeat",
	(context: unknown, options: BlockHelperOptions) => {
		const count = context as number;
		let result = "";
		for (let i = 0; i < count; i++) {
			result += options.fn({ index: i, value: i + 1 });
		}
		return result;
	},
);
```

### Helper Usage in Templates

```handlebars
<!-- Simple helpers -->
{{uppercase name}}
{{{formatDate publishedAt "MM/DD/YYYY"}}}

<!-- Block helpers -->
{{#repeat 3}}
  <p>Item {{index}}: {{value}}</p>
{{/repeat}}
```

### String Literals in Helpers

Helpers support both variables and string literals:

```handlebars
{{{helper variable "string literal" anotherVariable}}}
```

## Template Inheritance

### Extending Templates

```handlebars
{{extends "basePage"}}

{{#block "title"}}My Custom Title{{/block}}

{{#block "content"}}
  <h1>Welcome to my page!</h1>
  <p>This content overrides the base template.</p>
{{/block}}
```

### Block Definitions

Blocks define overrideable sections:

```handlebars
<!-- Base template -->
{{#block "header"}}
  <h1>Default Header</h1>
{{/block}}

{{#block "content"}}
  <p>Default content</p>
{{/block}}
```

### Block Inheritance Chain

Templates can extend other templates that also extend templates:

```typescript
// Base
registerBaseTemplate(
	"layout",
	`
<html>
{{#block "head"}}Default head{{/block}}
<body>{{#block "body"}}Default body{{/block}}</body>
</html>
`,
);

// Page template
registerBaseTemplate(
	"page",
	`
{{extends "layout"}}
{{#block "head"}}<title>{{title}}</title>{{/block}}
{{#block "body"}}<main>{{#block "main"}}Default main{{/block}}</main>{{/block}}
`,
);
```

```handlebars
<!-- Final template -->
{{extends "page"}}
{{#block "main"}}
  <h1>My Content</h1>
{{/block}}
```

## Syntax Reference

### Variables

```handlebars
{{variable}}              <!-- Simple variable -->
{{object.property}}       <!-- Nested property -->
{{array.0}}              <!-- Array index -->
{{deeply.nested.value}}   <!-- Deep nesting -->
```

### HTML Escaping

```handlebars
{{variable}}              <!-- HTML escaped -->
{{{variable}}}           <!-- Raw, unescaped -->
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
  Premium user content
{{/if}}
```

### Loops

```handlebars
{{#each items}}
  <li>{{name}} - {{price}}</li>
{{/each}}

<!-- With index -->
{{#each users}}
  <div>User {{@index}}: {{name}}</div>
{{/each}}
```

### Layouts

```handlebars
{{> layoutName}}          <!-- Include layout -->
{{> "layout with spaces"}} <!-- Quoted layout name -->
```

### Components

```handlebars
{{component "name"}}                    <!-- Simple component -->
{{component "name" prop="value"}}       <!-- With props -->
{{component "name" prop=variable}}      <!-- Variable prop -->
{{component "name" prop="value" key=var}} <!-- Mixed props -->
```

### Raw Blocks

```handlebars
{{{{raw}}}}
This content is not processed:
{{variable}} remains as-is
{{#if condition}} also remains
{{{{/raw}}}}
```

### Comments

```handlebars
{{!-- This is a comment --}}
{{! Single line comment }}
```

## Performance Tips

1. **Precompile templates** when possible
2. **Use caching** - compiled templates are automatically cached
3. **Avoid complex expressions** in conditionals
4. **Register components and layouts** at startup
5. **Use string literals** in helpers for better performance

## Migration Examples

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed migration examples
from other template engines.
