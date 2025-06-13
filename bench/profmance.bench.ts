/**
 * Comprehensive Template Engine Benchmark
 * Fair comparison of UWU-Template vs popular template engines
 * 
 * Run with: deno bench -A
 * Or from root: deno bench bench/profmance.bench.ts -A
 */

import { compile } from "../mod.ts";
import Handlebars from "npm:handlebars@4.7.8";
import ejs from "npm:ejs@3.1.9";
import Mustache from "npm:mustache@4.2.0";
import pug from "npm:pug@3.0.2";

// Test data
const simpleData = {
  title: "My Website",
  user: {
    name: "Alice Johnson",
    premium: true
  },
  items: [
    { name: "Widget A", price: 29.99, sale: false },
    { name: "Widget B", price: 19.99, sale: true },
    { name: "Widget C", price: 39.99, sale: false }
  ]
};

const complexData = {
  ...simpleData,
  products: Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    name: `Product ${i + 1}`,
    price: Math.round((Math.random() * 100 + 10) * 100) / 100,
    category: ["Electronics", "Clothing", "Books", "Home"][i % 4],
    inStock: Math.random() > 0.3,
    rating: Math.round(Math.random() * 5 * 10) / 10,
    reviews: Math.floor(Math.random() * 500)
  }))
};

const largeData = {
  ...complexData,
  products: Array.from({ length: 1000 }, (_, i) => ({
    id: i + 1,
    name: `Product ${i + 1}`,
    price: Math.round((Math.random() * 100 + 10) * 100) / 100,
    category: ["Electronics", "Clothing", "Books", "Home"][i % 4],
    inStock: Math.random() > 0.3,
    rating: Math.round(Math.random() * 5 * 10) / 10,
    reviews: Math.floor(Math.random() * 500)
  }))
};

// UWU Templates
const uwuSimple = `
<div>
  <h1>{{title}}</h1>
  <p>Welcome {{user.name}}!</p>
  {{#if user.premium}}<span class="premium">Premium Member</span>{{/if}}
  <ul>
    {{#each items}}
    <li>{{name}} - {{price}}{{#if sale}} (SALE!){{/if}}</li>
    {{/each}}
  </ul>
</div>`;

const uwuComplex = `
<div class="dashboard">
  <header><h1>{{title}}</h1></header>
  <section class="products">
    {{#each products}}
    <div class="product {{category}}">
      <h4>{{name}}</h4>
      <p class="price">{{price}}</p>
      <p class="category">{{category}}</p>
      {{#if inStock}}
      <span class="in-stock">In Stock</span>
      {{#else}}
      <span class="out-of-stock">Out of Stock</span>
      {{/if}}
      <div class="rating">Rating: {{rating}}/5 ({{reviews}} reviews)</div>
    </div>
    {{/each}}
  </section>
</div>`;

// Handlebars templates
const handlebarsSimple = `
<div>
  <h1>{{title}}</h1>
  <p>Welcome {{user.name}}!</p>
  {{#if user.premium}}<span class="premium">Premium Member</span>{{/if}}
  <ul>
    {{#each items}}
    <li>{{name}} - {{price}}{{#if sale}} (SALE!){{/if}}</li>
    {{/each}}
  </ul>
</div>`;

const handlebarsComplex = `
<div class="dashboard">
  <header><h1>{{title}}</h1></header>
  <section class="products">
    {{#each products}}
    <div class="product {{category}}">
      <h4>{{name}}</h4>
      <p class="price">{{price}}</p>
      <p class="category">{{category}}</p>
      {{#if inStock}}
      <span class="in-stock">In Stock</span>
      {{else}}
      <span class="out-of-stock">Out of Stock</span>
      {{/if}}
      <div class="rating">Rating: {{rating}}/5 ({{reviews}} reviews)</div>
    </div>
    {{/each}}
  </section>
</div>`;

// EJS templates
const ejsSimple = `
<div>
  <h1><%- title %></h1>
  <p>Welcome <%- user.name %>!</p>
  <% if (user.premium) { %><span class="premium">Premium Member</span><% } %>
  <ul>
    <% items.forEach(item => { %>
    <li><%- item.name %> - <%- item.price %><% if (item.sale) { %> (SALE!)<% } %></li>
    <% }); %>
  </ul>
</div>`;

const ejsComplex = `
<div class="dashboard">
  <header><h1><%- title %></h1></header>
  <section class="products">
    <% products.forEach(product => { %>
    <div class="product <%- product.category %>">
      <h4><%- product.name %></h4>
      <p class="price"><%- product.price %></p>
      <p class="category"><%- product.category %></p>
      <% if (product.inStock) { %>
      <span class="in-stock">In Stock</span>
      <% } else { %>
      <span class="out-of-stock">Out of Stock</span>
      <% } %>
      <div class="rating">Rating: <%- product.rating %>/5 (<%- product.reviews %> reviews)</div>
    </div>
    <% }); %>
  </section>
</div>`;

// Mustache templates
const mustacheSimple = `
<div>
  <h1>{{title}}</h1>
  <p>Welcome {{user.name}}!</p>
  {{#user.premium}}<span class="premium">Premium Member</span>{{/user.premium}}
  <ul>
    {{#items}}
    <li>{{name}} - {{price}}{{#sale}} (SALE!){{/sale}}</li>
    {{/items}}
  </ul>
</div>`;

const mustacheComplex = `
<div class="dashboard">
  <header><h1>{{title}}</h1></header>
  <section class="products">
    {{#products}}
    <div class="product {{category}}">
      <h4>{{name}}</h4>
      <p class="price">{{price}}</p>
      <p class="category">{{category}}</p>
      {{#inStock}}
      <span class="in-stock">In Stock</span>
      {{/inStock}}
      {{^inStock}}
      <span class="out-of-stock">Out of Stock</span>
      {{/inStock}}
      <div class="rating">Rating: {{rating}}/5 ({{reviews}} reviews)</div>
    </div>
    {{/products}}
  </section>
</div>`;

// Pug templates
const pugSimple = `
div
  h1= title
  p Welcome #{user.name}!
  if user.premium
    span.premium Premium Member
  ul
    each item in items
      li #{item.name} - #{item.price}#{item.sale ? ' (SALE!)' : ''}`;

const pugComplex = `
div.dashboard
  header
    h1= title
  section.products
    each product in products
      div.product(class=product.category)
        h4= product.name
        p.price= product.price
        p.category= product.category
        if product.inStock
          span.in-stock In Stock
        else
          span.out-of-stock Out of Stock
        div.rating Rating: #{product.rating}/5 (#{product.reviews} reviews)`;

// Template Literal baselines
function templateLiteralSimple(data: typeof simpleData) {
  return `
<div>
  <h1>${data.title}</h1>
  <p>Welcome ${data.user.name}!</p>
  ${data.user.premium ? '<span class="premium">Premium Member</span>' : ''}
  <ul>
    ${data.items.map(item => `<li>${item.name} - ${item.price}${item.sale ? ' (SALE!)' : ''}</li>`).join('')}
  </ul>
</div>`;
}

function templateLiteralComplex(data: typeof complexData) {
  return `
<div class="dashboard">
  <header><h1>${data.title}</h1></header>
  <section class="products">
    ${data.products.map(product => `
    <div class="product ${product.category}">
      <h4>${product.name}</h4>
      <p class="price">${product.price}</p>
      <p class="category">${product.category}</p>
      ${product.inStock ? 
        '<span class="in-stock">In Stock</span>' : 
        '<span class="out-of-stock">Out of Stock</span>'
      }
      <div class="rating">Rating: ${product.rating}/5 (${product.reviews} reviews)</div>
    </div>`).join('')}
  </section>
</div>`;
}

// Pre-compile UWU templates
const compiledUWUSimple = compile(uwuSimple);
const compiledUWUComplex = compile(uwuComplex);

// Pre-compile other template engines
const compiledHandlebarsSimple = Handlebars.compile(handlebarsSimple);
const compiledHandlebarsComplex = Handlebars.compile(handlebarsComplex);

const compiledEjsSimple = ejs.compile(ejsSimple);
const compiledEjsComplex = ejs.compile(ejsComplex);

// Mustache doesn't need pre-compilation, but we can parse the templates
Mustache.parse(mustacheSimple);
Mustache.parse(mustacheComplex);

// Pug compilation
const compiledPugSimple = pug.compile(pugSimple);
const compiledPugComplex = pug.compile(pugComplex);

// ==========================================
// VERIFICATION: Test all engines produce similar output
// ==========================================

console.log("🔍 Verifying all template engines produce consistent output...\n");

// Test simple templates
console.log("Testing simple templates:");
const uwuSimpleResult = compiledUWUSimple(simpleData);
const handlebarsSimpleResult = compiledHandlebarsSimple(simpleData);
const ejsSimpleResult = compiledEjsSimple(simpleData);
const mustacheSimpleResult = Mustache.render(mustacheSimple, simpleData);
const pugSimpleResult = compiledPugSimple(simpleData);
const templateLiteralResult = templateLiteralSimple(simpleData);

console.log("UWU-Template output:");
console.log(uwuSimpleResult);
console.log("\nHandlebars output:");
console.log(handlebarsSimpleResult);
console.log("\nEJS output:");
console.log(ejsSimpleResult);
console.log("\nMustache output:");
console.log(mustacheSimpleResult);
console.log("\nPug output:");
console.log(pugSimpleResult);
console.log("\nTemplate Literal output:");
console.log(templateLiteralResult);

// Basic verification (check if all contain key elements)
const checkOutput = (output: string, engine: string) => {
  const checks = [
    output.includes("My Website"),
    output.includes("Alice Johnson"),
    output.includes("Premium Member"),
    output.includes("Widget A"),
    output.includes("29.99")
  ];
  
  const passed = checks.filter(Boolean).length;
  console.log(`${engine}: ${passed}/5 checks passed ${passed === 5 ? '✅' : '❌'}`);
  
  if (passed !== 5) {
    console.log(`Failed checks for ${engine}:`, checks.map((c, i) => c ? null : `Check ${i+1}`).filter(Boolean));
  }
};

console.log("\n📋 Verification Results:");
checkOutput(uwuSimpleResult, "UWU-Template    ");
checkOutput(handlebarsSimpleResult, "Handlebars     ");
checkOutput(ejsSimpleResult, "EJS            ");
checkOutput(mustacheSimpleResult, "Mustache       ");
checkOutput(pugSimpleResult, "Pug             ");
checkOutput(templateLiteralResult, "Template Literal");

// Test complex templates for basic functionality
console.log("\nTesting complex templates (sample with 5 products):");
const sampleComplexData = {
  ...simpleData,
  products: complexData.products.slice(0, 5) // Just test with 5 products for verification
};

const uwuComplexResult = compiledUWUComplex(sampleComplexData);
const handlebarsComplexResult = compiledHandlebarsComplex(sampleComplexData);
const ejsComplexResult = compiledEjsComplex(sampleComplexData);
const mustacheComplexResult = Mustache.render(mustacheComplex, sampleComplexData);
const pugComplexResult = compiledPugComplex(sampleComplexData);
const templateLiteralComplexResult = templateLiteralComplex(sampleComplexData);

const checkComplexOutput = (output: string, engine: string) => {
  const checks = [
    output.includes("dashboard"),
    output.includes("Product 1"),
    output.includes("In Stock") || output.includes("Out of Stock"),
    output.includes("Rating:"),
    output.includes("reviews")
  ];
  
  const passed = checks.filter(Boolean).length;
  console.log(`${engine}: ${passed}/5 complex checks passed ${passed === 5 ? '✅' : '❌'}`);
};

console.log("\n📋 Complex Template Verification:");
checkComplexOutput(uwuComplexResult, "UWU-Template    ");
checkComplexOutput(handlebarsComplexResult, "Handlebars     ");
checkComplexOutput(ejsComplexResult, "EJS            ");
checkComplexOutput(mustacheComplexResult, "Mustache       ");
checkComplexOutput(pugComplexResult, "Pug             ");
checkComplexOutput(templateLiteralComplexResult, "Template Literal");

console.log("\n✅ Verification complete! Starting benchmarks...\n");

console.log("🚀 UWU-Template vs Popular Template Engines Benchmark");
console.log("====================================================");

// ==========================================
// UWU-TEMPLATE BENCHMARKS (Baseline)
// ==========================================

Deno.bench({
  name: "UWU-Template (Simple)",
  group: "simple",
  baseline: true,
  fn: () => {
    compiledUWUSimple(simpleData);
  },
});

Deno.bench({
  name: "UWU-Template (Complex - 100 items)",
  group: "complex",
  baseline: true,
  fn: () => {
    compiledUWUComplex(complexData);
  },
});

Deno.bench({
  name: "UWU-Template (Large - 1000 items)",
  group: "large",
  baseline: true,
  fn: () => {
    compiledUWUComplex(largeData);
  },
});

Deno.bench({
  name: "UWU-Template (Compilation)",
  group: "compilation",
  baseline: true,
  fn: () => {
    compile(uwuSimple);
  },
});

// ==========================================
// HANDLEBARS COMPARISON
// ==========================================

Deno.bench({
  name: "Handlebars (Simple)",
  group: "simple",
  fn: () => {
    compiledHandlebarsSimple(simpleData);
  },
});

Deno.bench({
  name: "Handlebars (Complex - 100 items)",
  group: "complex",
  fn: () => {
    compiledHandlebarsComplex(complexData);
  },
});

Deno.bench({
  name: "Handlebars (Large - 1000 items)",
  group: "large",
  fn: () => {
    compiledHandlebarsComplex(largeData);
  },
});

Deno.bench({
  name: "Handlebars (Compilation)",
  group: "compilation",
  fn: () => {
    Handlebars.compile(handlebarsSimple);
  },
});

// ==========================================
// EJS COMPARISON
// ==========================================

Deno.bench({
  name: "EJS (Simple)",
  group: "simple",
  fn: () => {
    compiledEjsSimple(simpleData);
  },
});

Deno.bench({
  name: "EJS (Complex - 100 items)",
  group: "complex",
  fn: () => {
    compiledEjsComplex(complexData);
  },
});

Deno.bench({
  name: "EJS (Large - 1000 items)",
  group: "large",
  fn: () => {
    compiledEjsComplex(largeData);
  },
});

Deno.bench({
  name: "EJS (Compilation)",
  group: "compilation",
  fn: () => {
    ejs.compile(ejsSimple);
  },
});

// ==========================================
// MUSTACHE COMPARISON
// ==========================================

Deno.bench({
  name: "Mustache (Simple)",
  group: "simple",
  fn: () => {
    Mustache.render(mustacheSimple, simpleData);
  },
});

Deno.bench({
  name: "Mustache (Complex - 100 items)",
  group: "complex",
  fn: () => {
    Mustache.render(mustacheComplex, complexData);
  },
});

Deno.bench({
  name: "Mustache (Large - 1000 items)",
  group: "large",
  fn: () => {
    Mustache.render(mustacheComplex, largeData);
  },
});

Deno.bench({
  name: "Mustache (Compilation/Parse)",
  group: "compilation",
  fn: () => {
    Mustache.parse(mustacheSimple);
  },
});

// ==========================================
// PUG COMPARISON
// ==========================================

Deno.bench({
  name: "Pug (Simple)",
  group: "simple",
  fn: () => {
    compiledPugSimple(simpleData);
  },
});

Deno.bench({
  name: "Pug (Complex - 100 items)",
  group: "complex",
  fn: () => {
    compiledPugComplex(complexData);
  },
});

Deno.bench({
  name: "Pug (Large - 1000 items)",
  group: "large",
  fn: () => {
    compiledPugComplex(largeData);
  },
});

Deno.bench({
  name: "Pug (Compilation)",
  group: "compilation",
  fn: () => {
    pug.compile(pugSimple);
  },
});

// ==========================================
// TEMPLATE LITERAL BASELINE
// ==========================================

Deno.bench({
  name: "Template Literal (Simple)",
  group: "simple",
  fn: () => {
    templateLiteralSimple(simpleData);
  },
});

Deno.bench({
  name: "Template Literal (Complex - 100 items)",
  group: "complex",
  fn: () => {
    templateLiteralComplex(complexData);
  },
});

Deno.bench({
  name: "Template Literal (Large - 1000 items)",
  group: "large",
  fn: () => {
    templateLiteralComplex(largeData);
  },
});

console.log("\n📊 Benchmark completed!");
console.log("UWU-Template performance compared against popular template engines");
console.log("All templates pre-compiled for fair comparison");
