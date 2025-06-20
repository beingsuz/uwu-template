# Component System Examples

This document provides comprehensive examples of UWU-Template's component
system, demonstrating how to create reusable, composable templates.

## Table of Contents

- [Basic Components](#basic-components)
- [Component Props](#component-props)
- [Parent Data Access](#parent-data-access)
- [Component Composition](#component-composition)
- [Real-World Examples](#real-world-examples)
- [Best Practices](#best-practices)

## Basic Components

### Simple Button Component

```typescript
import { registerComponent } from "./mod.ts";

registerComponent(
	"button",
	`
<button class="btn {{class}}" type="{{type}}">
  {{text}}
</button>
`,
);
```

**Usage:**

```handlebars
{{component "button" text="Click me" class="primary" type="submit"}}
```

**Output:**

```html
<button class="btn primary" type="submit">
	Click me
</button>
```

### Alert Component

```typescript
registerComponent(
	"alert",
	`
<div class="alert alert-{{type}}">
  {{#if icon}}
    <span class="alert-icon">{{icon}}</span>
  {{/if}}
  <div class="alert-content">
    {{#if title}}
      <h4 class="alert-title">{{title}}</h4>
    {{/if}}
    <p class="alert-message">{{message}}</p>
  </div>
  {{#if dismissible}}
    <button class="alert-close" onclick="this.parentElement.remove()">×</button>
  {{/if}}
</div>
`,
);
```

**Usage:**

```handlebars
{{component "alert" 
  type="success" 
  icon="✓" 
  title="Success!" 
  message="Your changes have been saved." 
  dismissible=true}}
```

## Component Props

### Data Types

Components can receive various data types as props:

```typescript
registerComponent(
	"productCard",
	`
<div class="product-card">
  <img src="{{imageUrl}}" alt="{{name}}">
  <h3>{{name}}</h3>
  <p class="price">\${{price}}</p>
  {{#if onSale}}
    <span class="sale-badge">{{discount}}% OFF</span>
  {{/if}}
  <div class="rating">
    {{#each stars}}★{{/each}}
    <span class="rating-count">({{reviewCount}} reviews)</span>
  </div>
</div>
`,
);
```

**Usage:**

```handlebars
{{component "productCard"
  name="Wireless Headphones"
  price=99.99
  imageUrl="/images/headphones.jpg"
  onSale=true
  discount=20
  stars=stars
  reviewCount=127}}
```

### String Literals vs Variables

```handlebars
{{component "button" 
  text="Static Text"           <!-- String literal -->
  class=dynamicClass           <!-- Variable -->
  type="button"                <!-- String literal -->
  disabled=isFormInvalid}}     <!-- Variable -->
```

### Complex Object Props

```typescript
const data = {
	user: {
		name: "Alice Johnson",
		avatar: "/avatars/alice.jpg",
		role: "admin",
		preferences: {
			theme: "dark",
			notifications: true,
		},
	},
};

registerComponent(
	"userProfile",
	`
<div class="user-profile">
  <img class="avatar" src="{{avatar}}" alt="{{name}}">
  <div class="user-info">
    <h3>{{name}}</h3>
    <span class="role">{{role}}</span>
    <div class="preferences">
      <span class="theme">Theme: {{preferences.theme}}</span>
      {{#if preferences.notifications}}
        <span class="notifications">🔔 Enabled</span>
      {{/if}}
    </div>
  </div>
</div>
`,
);
```

**Usage:**

```handlebars
{{component "userProfile" 
  name=user.name 
  avatar=user.avatar 
  role=user.role 
  preferences=user.preferences}}
```

## Parent Data Access

Use `@parent` to access data from the parent template:

### Theme Context

```typescript
const data = {
	theme: "dark",
	user: { name: "Alice" },
	products: [
		{ name: "Widget A", price: 29.99 },
		{ name: "Widget B", price: 19.99 },
	],
};

registerComponent(
	"themedButton",
	`
<button class="btn btn-{{@parent.theme}} {{class}}">
  {{text}}
</button>
`,
);

registerComponent(
	"productItem",
	`
<div class="product product-{{@parent.theme}}">
  <h4>{{name}}</h4>
  <p class="price">\${{price}}</p>
  {{component "themedButton" text="Add to Cart" class="purchase-btn"}}
</div>
`,
);
```

**Usage:**

```handlebars
<div class="product-list">
  {{#each products}}
    {{component "productItem" name=name price=price}}
  {{/each}}
</div>
```

### Global Settings Access

```typescript
const data = {
	settings: {
		currency: "USD",
		language: "en",
		showPrices: true,
	},
	items: [/* ... */],
};

registerComponent(
	"priceDisplay",
	`
{{#if @parent.settings.showPrices}}
  <span class="price">
    {{#if price}}
      {{price}} {{@parent.settings.currency}}
    {{else}}
      Price on request
    {{/if}}
  </span>
{{/if}}
`,
);
```

## Component Composition

### Card with Header, Body, Footer

```typescript
registerComponent(
	"cardHeader",
	`
<div class="card-header">
  {{#if icon}}<span class="card-icon">{{icon}}</span>{{/if}}
  <h3 class="card-title">{{title}}</h3>
  {{#if actions}}
    <div class="card-actions">{{actions}}</div>
  {{/if}}
</div>
`,
);

registerComponent(
	"cardBody",
	`
<div class="card-body">
  {{content}}
</div>
`,
);

registerComponent(
	"cardFooter",
	`
<div class="card-footer">
  {{content}}
</div>
`,
);

registerComponent(
	"card",
	`
<div class="card card-{{type}}">
  {{#if header}}
    {{component "cardHeader" title=header.title icon=header.icon actions=header.actions}}
  {{/if}}
  {{component "cardBody" content=content}}
  {{#if footer}}
    {{component "cardFooter" content=footer}}
  {{/if}}
</div>
`,
);
```

**Usage:**

```handlebars
{{component "card"
  type="info"
  header=(object title="User Settings" icon="⚙️")
  content="Manage your account preferences and settings."
  footer="Last updated: Today"}}
```

### Navigation Menu

```typescript
registerComponent(
	"navItem",
	`
<li class="nav-item {{#if active}}active{{/if}}">
  <a href="{{url}}" class="nav-link">
    {{#if icon}}<span class="nav-icon">{{icon}}</span>{{/if}}
    {{text}}
    {{#if badge}}<span class="nav-badge">{{badge}}</span>{{/if}}
  </a>
</li>
`,
);

registerComponent(
	"navGroup",
	`
<div class="nav-group">
  <h4 class="nav-group-title">{{title}}</h4>
  <ul class="nav-list">
    {{#each items}}
      {{component "navItem" 
        text=text 
        url=url 
        icon=icon 
        badge=badge 
        active=active}}
    {{/each}}
  </ul>
</div>
`,
);

registerComponent(
	"sidebar",
	`
<nav class="sidebar sidebar-{{@parent.theme}}">
  <div class="sidebar-header">
    <h2>{{title}}</h2>
  </div>
  <div class="sidebar-content">
    {{#each groups}}
      {{component "navGroup" title=title items=items}}
    {{/each}}
  </div>
</nav>
`,
);
```

## Real-World Examples

### E-commerce Product Grid

```typescript
registerComponent(
	"productImage",
	`
<div class="product-image">
  <img src="{{src}}" alt="{{alt}}" loading="lazy">
  {{#if badge}}
    <span class="product-badge product-badge-{{badge.type}}">{{badge.text}}</span>
  {{/if}}
</div>
`,
);

registerComponent(
	"productPrice",
	`
<div class="product-price">
  {{#if originalPrice}}
    <span class="price-original">\${{originalPrice}}</span>
  {{/if}}
  <span class="price-current">\${{price}}</span>
  {{#if savings}}
    <span class="price-savings">Save {{savings}}%</span>
  {{/if}}
</div>
`,
);

registerComponent(
	"productRating",
	`
<div class="product-rating">
  <div class="stars">
    {{#each stars}}
      <span class="star {{#if this}}filled{{/if}}">★</span>
    {{/each}}
  </div>
  <span class="rating-text">{{rating}} ({{reviewCount}})</span>
</div>
`,
);

registerComponent(
	"productCard",
	`
<div class="product-card">
  {{component "productImage" 
    src=image 
    alt=name 
    badge=badge}}
  
  <div class="product-info">
    <h3 class="product-name">{{name}}</h3>
    <p class="product-description">{{shortDescription}}</p>
    
    {{component "productRating" 
      rating=rating 
      reviewCount=reviewCount 
      stars=starArray}}
    
    {{component "productPrice" 
      price=price 
      originalPrice=originalPrice 
      savings=savings}}
    
    <div class="product-actions">
      {{component "button" 
        text="Add to Cart" 
        class="btn-primary" 
        type="button"}}
      {{component "button" 
        text="♡" 
        class="btn-secondary btn-icon" 
        type="button"}}
    </div>
  </div>
</div>
`,
);
```

### Blog Post Layout

```typescript
registerComponent(
	"authorInfo",
	`
<div class="author-info">
  <img class="author-avatar" src="{{avatar}}" alt="{{name}}">
  <div class="author-details">
    <h4 class="author-name">{{name}}</h4>
    <time class="publish-date" datetime="{{publishedAt}}">{{formattedDate}}</time>
  </div>
</div>
`,
);

registerComponent(
	"tagList",
	`
<div class="tag-list">
  {{#each tags}}
    <span class="tag">{{this}}</span>
  {{/each}}
</div>
`,
);

registerComponent(
	"socialShare",
	`
<div class="social-share">
  <span class="share-label">Share:</span>
  <a href="https://twitter.com/intent/tweet?url={{@parent.url}}&text={{title}}" class="share-twitter">Twitter</a>
  <a href="https://www.facebook.com/sharer/sharer.php?u={{@parent.url}}" class="share-facebook">Facebook</a>
  <a href="https://www.linkedin.com/sharing/share-offsite/?url={{@parent.url}}" class="share-linkedin">LinkedIn</a>
</div>
`,
);

registerComponent(
	"blogPost",
	`
<article class="blog-post">
  <header class="post-header">
    <h1 class="post-title">{{title}}</h1>
    <p class="post-excerpt">{{excerpt}}</p>
    {{component "authorInfo" 
      name=author.name 
      avatar=author.avatar 
      publishedAt=publishedAt 
      formattedDate=formattedDate}}
  </header>
  
  <div class="post-content">
    {{content}}
  </div>
  
  <footer class="post-footer">
    {{component "tagList" tags=tags}}
    {{component "socialShare" title=title}}
  </footer>
</article>
`,
);
```

### Form Components

```typescript
registerComponent(
	"formField",
	`
<div class="form-field {{#if error}}has-error{{/if}}">
  <label class="form-label" for="{{id}}">
    {{label}}
    {{#if required}}<span class="required">*</span>{{/if}}
  </label>
  <input 
    type="{{type}}" 
    id="{{id}}" 
    name="{{name}}" 
    value="{{value}}" 
    class="form-input"
    {{#if required}}required{{/if}}
    {{#if placeholder}}placeholder="{{placeholder}}"{{/if}}>
  {{#if error}}
    <span class="form-error">{{error}}</span>
  {{/if}}
  {{#if help}}
    <span class="form-help">{{help}}</span>
  {{/if}}
</div>
`,
);

registerComponent(
	"formGroup",
	`
<fieldset class="form-group">
  {{#if legend}}
    <legend class="form-legend">{{legend}}</legend>
  {{/if}}
  {{content}}
</fieldset>
`,
);
```

**Usage:**

```handlebars
{{component "formGroup" legend="Personal Information" content=(
  component "formField" 
    type="text" 
    id="firstName" 
    name="firstName" 
    label="First Name" 
    required=true
    placeholder="Enter your first name"
)}}
```

## Best Practices

### 1. Component Naming

- Use descriptive, kebab-case names: `user-card`, `product-list`
- Prefix related components: `nav-item`, `nav-group`, `nav-sidebar`

### 2. Prop Design

- Keep props simple and focused
- Use consistent naming across components
- Provide sensible defaults when possible

### 3. Parent Data Access

- Use `@parent` sparingly for global settings
- Don't rely on deep parent data structures
- Pass data explicitly when possible

### 4. Component Composition

- Build small, focused components
- Compose larger components from smaller ones
- Keep component templates readable

### 5. Error Handling

- Provide fallbacks for missing data
- Use conditional rendering for optional elements
- Test components with various data scenarios

### 6. Performance

- Register components at startup
- Avoid complex logic in component templates
- Use caching for frequently used components

### 7. Documentation

- Document component props and usage
- Provide examples for complex components
- Keep component interfaces stable

### Example Component Documentation

```typescript
/**
 * Product Card Component
 *
 * Displays a product with image, name, price, and actions
 *
 * Props:
 * - name (string): Product name
 * - image (string): Product image URL
 * - price (number): Current price
 * - originalPrice (number, optional): Original price for sale items
 * - rating (number): Product rating (1-5)
 * - reviewCount (number): Number of reviews
 * - onSale (boolean): Whether product is on sale
 *
 * Parent data used:
 * - @parent.currency: Display currency
 * - @parent.theme: Visual theme
 *
 * Example:
 * {{component "productCard"
 *   name="Wireless Mouse"
 *   image="/images/mouse.jpg"
 *   price=29.99
 *   rating=4.5
 *   reviewCount=142}}
 */
registerComponent("productCard", `...`);
```

This component system provides the flexibility to build complex, maintainable
templates while keeping individual components simple and reusable.
