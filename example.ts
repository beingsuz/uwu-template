import { compile, registerLayout } from "./mod.ts";

// Deno globals - use conditional access for compatibility
declare const Deno: any;

async function main() {
	console.log("🎯 UWU-Template Example");
	console.log(
		"Demonstrating the fast template engine with real-world templates\n",
	);

	// Register a shared layout
	registerLayout(
		"header",
		`
        <header>
            <h1>{{siteName}}</h1>
            <nav>{{#each menuItems}}<a href="{{url}}">{{name}}</a>{{/each}}</nav>
        </header>
    `,
	);

	// Example 1: Simple template
	console.log("=== Simple Template Example ===");
	const simpleTemplate = `
        {{> header}}
        <main>
            <h2>Welcome {{user.name}}!</h2>
            {{#if user.isPremium}}
                <p>Thanks for being a premium member!</p>
            {{#else}}
                <p>Consider upgrading to premium.</p>
            {{/if}}

            <h3>Your Items:</h3>            <ul>
                {{#each items}}
                <li>{{name}} - \${{price}} {{#if onSale}}(ON SALE!){{/if}}</li>
                {{/each}}
            </ul>
        </main>
    `;

	const simpleData = {
		siteName: "MyStore",
		menuItems: [
			{ name: "Home", url: "/" },
			{ name: "Products", url: "/products" },
			{ name: "About", url: "/about" },
		],
		user: {
			name: "Alice",
			isPremium: true,
		},
		items: [
			{ name: "Widget A", price: "29.99", onSale: false },
			{ name: "Widget B", price: "19.99", onSale: true },
			{ name: "Widget C", price: "39.99", onSale: false },
		],
	};

	const simpleCompiled = compile(simpleTemplate);
	const simpleResult = simpleCompiled(simpleData);
	console.log(simpleResult);

	// Example 2: Real-world e-commerce template
	console.log("\n=== Real-World E-commerce Template ===");
	const ecommerceTemplate = (await (globalThis as any).Deno?.readTextFile(
		"./templates/ecommerce.uwu",
	)) || "";
	const ecommerceCompiled = compile(ecommerceTemplate);

	const ecommerceData = {
		siteName: "TechStore",
		title: "Latest Electronics",
		description: "Best electronics at great prices",
		pageTitle: "Electronics Collection",
		cartCount: 2,
		currentYear: 2024,
		siteDescription: "Your trusted tech store",
		user: { isLoggedIn: true, name: "John Smith" },
		products: [
			{
				id: 1,
				name: "Wireless Headphones",
				description: "Premium noise-canceling headphones",
				image: "/headphones.jpg",
				price: "199.99",
				originalPrice: "249.99",
				discount: 20,
				inStock: true,
				reviewCount: 128,
				stars: [true, true, true, true, false],
			},
			{
				id: 2,
				name: "Smart Watch",
				description: "Track your fitness and stay connected",
				image: "/smartwatch.jpg",
				price: "299.99",
				originalPrice: null,
				discount: 0,
				inStock: false,
				reviewCount: 89,
				stars: [true, true, true, true, true],
			},
		],
		pagination: { totalPages: 1 },
		socialLinks: [
			{ name: "Facebook", url: "https://facebook.com/techstore" },
			{ name: "Twitter", url: "https://twitter.com/techstore" },
		],
	};

	const ecommerceResult = ecommerceCompiled(ecommerceData);
	console.log("E-commerce template rendered successfully!");
	console.log(`Output length: ${ecommerceResult.length} characters`);
	console.log(
		`Contains products: ${ecommerceResult.includes("Wireless Headphones")}`,
	);
	console.log(
		`Contains user name: ${ecommerceResult.includes("John Smith")}`,
	);
	console.log(`Contains cart count: ${ecommerceResult.includes("Cart (2)")}`);

	console.log("\n✅ All examples completed successfully!");
}

main().catch(console.error);
