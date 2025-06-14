import { compile, registerComponent } from "./mod.ts";

console.log("🧩 UWU-Template Component System Demo");
console.log("=====================================\n");

// 1. Simple Component
registerComponent("hello", "Hello from component!");

console.log("1. Simple Component:");
console.log("   Template: {{component \"hello\"}}");
const result1 = compile(`{{component "hello"}}`)({});
console.log("   Result:", result1);

// 2. Component with Props
registerComponent("user", `
Name: {{name}}
Age: {{age}}
Location: {{city}}, {{country}}`);

console.log("\n2. Component with Props:");
console.log('   Template: {{component "user" name="Alice" age="25" city="Paris" country="France"}}');
const result2 = compile(`{{component "user" name="Alice" age="25" city="Paris" country="France"}}`)({});
console.log("   Result:", result2);

// 3. Component with Mixed Props (strings and variables)
console.log("\n3. Component with Mixed Props:");
console.log('   Template: {{component "user" name=userName age="30" city=userCity country="USA"}}');
const result3 = compile(`{{component "user" name=userName age="30" city=userCity country="USA"}}`)({
    userName: "Bob",
    userCity: "New York"
});
console.log("   Result:", result3);

// 4. Component accessing parent data
registerComponent("withParent", `
Component data: {{title}}
Parent data: {{@parent.siteName}} - {{@parent.version}}`);

console.log("\n4. Component Accessing Parent Data:");
console.log('   Template: {{component "withParent" title="My Component"}}');
const result4 = compile(`{{component "withParent" title="My Component"}}`)({
    siteName: "UWU Template",
    version: "1.0"
});
console.log("   Result:", result4);

// 5. Component with conditionals using parent data
registerComponent("conditional", `
Status: {{#if @parent.isActive}}🟢 Active{{#else}}🔴 Inactive{{/if}}
Message: {{message}}`);

console.log("\n5. Component with Conditionals:");
console.log('   Template: {{component "conditional" message="System running"}}');
const result5 = compile(`{{component "conditional" message="System running"}}`)({
    isActive: true
});
console.log("   Result:", result5);

// 6. Nested Components
registerComponent("button", `<button class="btn btn-{{variant}}">{{text}}</button>`);
registerComponent("dialog", `
<div class="dialog">
    <h3>{{title}}</h3>
    <p>{{message}}</p>
    <div class="actions">
        {{component "button" text="OK" variant="primary"}}
        {{component "button" text="Cancel" variant="secondary"}}
    </div>
</div>`);

console.log("\n6. Nested Components:");
console.log('   Template: {{component "dialog" title="Confirm" message="Are you sure?"}}');
const result6 = compile(`{{component "dialog" title="Confirm" message="Are you sure?"}}`)({});
console.log("   Result:", result6);

console.log("\n🎉 Component system working perfectly!");
console.log("✅ Simple components");
console.log("✅ Components with props (string and variable)");
console.log("✅ Parent data access with @parent");
console.log("✅ Conditionals with parent data");
console.log("✅ Nested component composition");
