# UWU-Template v1.0.0-beta.1 - Raw Output Feature 🎉

This release introduces the highly requested **Raw Output** feature, allowing developers to output literal template syntax without processing.

## ✨ New Features

### 🔮 Raw Output Blocks
- **NEW**: `{{{{raw}}}}...{{{{/raw}}}}` syntax for outputting literal template code
- **NEW**: Bypass all template processing within raw blocks
- **NEW**: Perfect for generating template examples in documentation
- **NEW**: Support for outputting template syntax for client-side processing

#### Usage Example:
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

## 🔧 Implementation Details

- Added 'raw' construct type to template engine
- Implemented raw block parsing with highest priority to avoid processing interference
- Added `generateRawCode()` function for literal content output
- Updated `TemplateConstruct` interface to include raw type
- Enhanced parser to handle nested template syntax within raw blocks

## 📚 Documentation Updates

- ✅ Added comprehensive Raw Output section to README
- ✅ Updated Template Syntax Reference with raw block documentation
- ✅ Added usage examples and use cases
- ✅ Updated CHANGELOG with feature details

## 🛠️ Infrastructure Improvements

- Updated benchmark tasks in `deno.json` and `package.json` with `--no-check` flag for npm compatibility
- Added `node_modules` to `.gitignore` for better npm integration
- Cleaned up temporary demo files
- Rebuilt `bundle.js` with latest features

## 🚀 Performance

Raw output blocks have **zero performance overhead** during template processing as they bypass all parsing and variable resolution.

## 🎯 Use Cases

### 📖 Documentation Generation
Perfect for generating template documentation with live examples:

```handlebars
<h2>Variable Syntax</h2>
<p>Use the following syntax for variables:</p>
{{{{raw}}}}
{{variable.name}}
{{user.email}}
{{/raw}}
```

### 🔄 Client-Side Templates
Output template syntax for client-side processing:

```handlebars
<script type="text/template" id="client-template">
{{{{raw}}}}
  <div class="user">
    <h3>{{name}}</h3>
    <p>{{email}}</p>
  </div>
{{{{/raw}}}}
</script>
```

### 📝 Code Examples
Generate code samples containing template syntax:

```handlebars
<pre><code>
{{{{raw}}}}
{{#each items}}
  <li>{{name}} - ${{price}}</li>
{{/each}}
{{{{/raw}}}}
</code></pre>
```

## 📦 Installation

### NPM (Latest)
```bash
npm install uwu-template@1.0.0-beta.1
# or
npm install uwu-template@latest
```

### Deno
```typescript
import { compile } from "https://cdn.jsdelivr.net/gh/Aiko-Suzuki/uwu-template@v1.0.0-beta.1/bundle.js";
```

## 🔄 Migration from Previous Versions

This release is **fully backward compatible**. No changes required for existing templates.

To use the new raw output feature, simply wrap content in `{{{{raw}}}}...{{{{/raw}}}}` blocks.

## 🧪 Testing

All existing tests pass, and new tests have been added for raw output functionality:

```bash
# Run tests
deno test -A

# Run benchmarks
deno task bench
```

## 📊 Benchmarks

Performance remains excellent with the new feature:
- **Simple templates**: 283,763 renders/sec
- **Complex templates**: 38,939 renders/sec
- **Raw blocks**: Zero processing overhead

## 🤝 Contributing

We welcome contributions! See our [Contributing Guide](README.md#contributing) for details.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Full Changelog**: https://github.com/beingsuz/uwu-template/compare/v1.0.0-beta...v1.0.0-beta.1
