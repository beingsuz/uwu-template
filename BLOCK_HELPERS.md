# UWU-Template Block Helper Documentation

## Block Helper Registration with Options

UWU-Template now supports advanced block helpers with options support, allowing you to create powerful reusable template components.

### Basic Block Helper Registration

```typescript
import { registerBlockHelper } from "./mod.ts";

registerBlockHelper("myHelper", (context: unknown, options: {
    fn: (context?: unknown) => string;
    inverse: (context?: unknown) => string;
    hash?: Record<string, unknown>;
}) => {
    // Your helper logic here
    if (someCondition) {
        return options.fn(context);  // Render main content
    } else {
        return options.inverse();    // Render {{else}} content
    }
});
```

### Block Helper Features

#### 1. Context Passing
```typescript
// Template: {{#myHelper user}}{{name}}{{/myHelper}}
// The helper receives the 'user' object as context
```

#### 2. Hash Options
```typescript
// Template: {{#myHelper user role="admin" theme="dark"}}...{{/myHelper}}
// Access via options.hash.role and options.hash.theme
```

#### 3. If/Else Logic
```typescript
// Template:
// {{#myHelper condition}}
//   Main content
// {{else}}
//   Fallback content
// {{/myHelper}}
```

### Real Examples

#### Conditional User Display
```typescript
registerBlockHelper("withUser", (user: unknown, options) => {
    const userData = user as { active?: boolean };
    const role = options.hash?.role || "user";
    
    if (userData?.active) {
        return options.fn({ ...userData, role });
    } else {
        return options.inverse({ role: "guest" });
    }
});

// Usage:
// {{#withUser currentUser role="admin"}}
//   <h2>Welcome {{name}} ({{role}})</h2>
// {{else}}
//   <p>Please log in</p>
// {{/withUser}}
```

#### Iteration Helper with Options
```typescript
registerBlockHelper("times", (count: unknown, options) => {
    const num = Number(count) || 0;
    const offset = Number(options.hash?.offset) || 0;
    
    if (num <= 0) return options.inverse();
    
    let result = '';
    for (let i = 0; i < num; i++) {
        result += options.fn({
            index: i + offset,
            number: i + offset + 1,
            isFirst: i === 0,
            isLast: i === num - 1
        });
    }
    return result;
});

// Usage:
// {{#times 3 offset=5}}
//   <li>Item {{number}} ({{index}}){{#if isFirst}} - First!{{/if}}</li>
// {{else}}
//   <li>No items</li>
// {{/times}}
```

### Simple Helpers with Hash Options

You can also register simple helpers that accept hash options:

```typescript
import { registerHelper } from "./mod.ts";

registerHelper("format", (value: unknown, options?: { hash?: Record<string, unknown> }) => {
    const prefix = String(options?.hash?.prefix || "");
    const suffix = String(options?.hash?.suffix || "");
    const transform = String(options?.hash?.transform || "");
    
    let result = String(value || "");
    
    if (transform === "upper") result = result.toUpperCase();
    if (transform === "lower") result = result.toLowerCase();
    
    return `${prefix}${result}${suffix}`;
});

// Usage: {{format name prefix="Mr. " transform="upper"}}
```

### Key Differences from Built-in Helpers

- Use `{{else}}` (not `{{#else}}`) for block helper alternative content
- Block helpers receive a context argument and options object
- Hash options are available in both simple and block helpers
- Block helpers can conditionally render main or alternative content

### Performance Notes

Block helpers are compiled to optimized JavaScript functions just like other UWU-Template features, maintaining the engine's high performance characteristics.
