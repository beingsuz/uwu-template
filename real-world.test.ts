import { compile, registerLayout } from "./mod.ts";
import { assert, assertGreaterOrEqual } from "https://deno.land/std@0.208.0/assert/mod.ts";

Deno.test("Real-World Template Performance Verification", async (t) => {
    console.log("🌍 UWU-Template Real-World Performance Tests");
    console.log("Testing performance with realistic template scenarios");
    
    // Register common layouts
    registerLayout("header", `
        <header class="site-header">
            <nav class="navbar">
                <a href="/" class="logo">{{siteName}}</a>
                <ul class="nav-menu">
                    <li><a href="/home">Home</a></li>
                    <li><a href="/about">About</a></li>
                    <li><a href="/contact">Contact</a></li>
                </ul>
            </nav>
        </header>
    `);

    registerLayout("footer", `
        <footer class="site-footer">
            <div class="container">
                <p>&copy; {{currentYear}} {{siteName}}. All rights reserved.</p>
                <div class="social-links">
                    {{#each socialLinks}}
                    <a href="{{url}}">{{name}}</a>
                    {{/each}}
                </div>
            </div>
        </footer>
    `);

    await t.step("E-commerce Template Performance", async () => {
        console.log("Testing e-commerce template performance...");
        
        const template = await Deno.readTextFile("./templates/ecommerce.nnt");
        const compiled = compile(template);
        
        const data = {
            siteName: "TechStore Pro",
            title: "Premium Electronics",
            description: "Best deals on electronics and gadgets",
            pageTitle: "Latest Products",
            cartCount: 3,
            user: {
                isLoggedIn: true,
                name: "John Doe"
            },
            products: Array.from({ length: 24 }, (_, i) => ({
                id: i + 1,
                name: `Product ${i + 1}`,
                description: `Amazing product description for item ${i + 1}`,
                image: `/images/product-${i + 1}.jpg`,
                price: (Math.random() * 500 + 50).toFixed(2),
                originalPrice: i % 3 === 0 ? (Math.random() * 600 + 100).toFixed(2) : null,
                discount: i % 3 === 0 ? Math.floor(Math.random() * 30 + 10) : 0,
                inStock: i % 8 !== 0,
                reviewCount: Math.floor(Math.random() * 500 + 10),
                stars: Array.from({ length: 5 }, (_, j) => j < Math.floor(Math.random() * 5 + 1))
            })),
            pagination: {
                totalPages: 5,
                currentPage: 1,
                hasPrev: false,
                hasNext: true,
                nextPage: 2,
                pages: Array.from({ length: 5 }, (_, i) => ({
                    number: i + 1,
                    isCurrent: i === 0
                }))
            },
            socialLinks: [
                { name: "Facebook", url: "https://facebook.com/techstore" },
                { name: "Twitter", url: "https://twitter.com/techstore" },
                { name: "Instagram", url: "https://instagram.com/techstore" }
            ],
            currentYear: 2024,
            siteDescription: "Your trusted partner for quality electronics"
        };

        // Performance test
        const iterations = 1000;
        const start = performance.now();
        
        for (let i = 0; i < iterations; i++) {
            const result = compiled(data);
            assert(result.length > 0, "Template should produce output");
        }
        
        const end = performance.now();
        const totalTime = end - start;
        const avgTime = totalTime / iterations;
        const rendersPerSecond = Math.round(iterations / (totalTime / 1000));
        
        console.log(`   ⚡ E-commerce: ${rendersPerSecond.toLocaleString()} renders/sec`);
        console.log(`   ⏱️  Average: ${avgTime.toFixed(3)}ms per render`);
        
        // Assert performance expectations
        assertGreaterOrEqual(rendersPerSecond, 800, "E-commerce template should render at least 800 times per second");
    });

    await t.step("Blog Post Template Performance", async () => {
        console.log("Testing blog post template performance...");
        
        const template = await Deno.readTextFile("./templates/blog-post.nnt");
        const compiled = compile(template);
        
        const data = {
            blogTitle: "Tech Insights Blog",
            siteName: "TechBlog",
            post: {
                id: 1,
                title: "The Future of Web Development: Trends to Watch in 2024",
                excerpt: "Discover the latest trends shaping web development",
                content: `<p>Web development continues to evolve at a rapid pace...</p>
                         <h2>Key Trends</h2>
                         <p>Here are the most important trends...</p>`,
                author: {
                    name: "Jane Smith",
                    bio: "Senior Frontend Developer",
                    avatar: "/images/jane-avatar.jpg"
                },
                publishDate: "2024-01-15",
                readTime: "5 min read",
                tags: ["webdev", "javascript", "trends", "2024"],
                category: "Development"
            },
            relatedPosts: Array.from({ length: 6 }, (_, i) => ({
                id: i + 2,
                title: `Related Article ${i + 1}`,
                excerpt: `Excerpt for related article ${i + 1}`,
                image: `/images/blog-${i + 1}.jpg`,
                readTime: `${Math.floor(Math.random() * 10 + 3)} min read`,
                publishDate: "2024-01-10"
            })),
            comments: Array.from({ length: 15 }, (_, i) => ({
                id: i + 1,
                author: `User ${i + 1}`,
                avatar: `/images/user-${i + 1}.jpg`,
                content: `Great article! Comment ${i + 1}`,
                publishDate: "2024-01-16",
                likes: Math.floor(Math.random() * 20),
                isAuthor: i === 0
            })),
            socialLinks: [
                { name: "Twitter", url: "https://twitter.com/techblog" },
                { name: "LinkedIn", url: "https://linkedin.com/company/techblog" }
            ],
            currentYear: 2024
        };

        // Performance test
        const iterations = 1200;
        const start = performance.now();
        
        for (let i = 0; i < iterations; i++) {
            const result = compiled(data);
            assert(result.length > 0, "Template should produce output");
        }
        
        const end = performance.now();
        const totalTime = end - start;
        const avgTime = totalTime / iterations;
        const rendersPerSecond = Math.round(iterations / (totalTime / 1000));
        
        console.log(`   ⚡ Blog post: ${rendersPerSecond.toLocaleString()} renders/sec`);
        console.log(`   ⏱️  Average: ${avgTime.toFixed(3)}ms per render`);
        
        // Assert performance expectations
        assertGreaterOrEqual(rendersPerSecond, 1000, "Blog template should render at least 1000 times per second");
    });

    await t.step("Email Template Performance", async () => {
        console.log("Testing email template performance...");
        
        const template = await Deno.readTextFile("./templates/email.nnt");
        const compiled = compile(template);
        
        const data = {
            emailSubject: "Welcome to Our Platform!",
            emailType: "welcome",
            branding: {
                companyName: "TechCorp",
                primaryColor: "#007bff",
                secondaryColor: "#6c757d",
                logo: "https://example.com/logo.png",
                address: {
                    street: "123 Tech Street",
                    city: "San Francisco",
                    state: "CA",
                    zip: "94105"
                }
            },
            user: {
                firstName: "John",
                email: "john@example.com",
                accountType: "Premium",
                joinDate: "January 15, 2024"
            },
            nextSteps: [
                { description: "Complete your profile setup" },
                { description: "Explore our premium features" },
                { description: "Join our community forum" }
            ],
            actionUrl: "https://app.techcorp.com/onboarding",
            personalizedRecommendations: Array.from({ length: 4 }, (_, i) => ({
                title: `Recommended Product ${i + 1}`,
                price: (Math.random() * 100 + 20).toFixed(2),
                image: `/images/rec-${i + 1}.jpg`,
                url: `/products/rec-${i + 1}`
            })),
            socialLinks: [
                { name: "Twitter", url: "https://twitter.com/techcorp" },
                { name: "LinkedIn", url: "https://linkedin.com/company/techcorp" }
            ],
            currentYear: 2024
        };

        // Performance test
        const iterations = 1500;
        const start = performance.now();
        
        for (let i = 0; i < iterations; i++) {
            const result = compiled(data);
            assert(result.length > 0, "Template should produce output");
        }
        
        const end = performance.now();
        const totalTime = end - start;
        const avgTime = totalTime / iterations;
        const rendersPerSecond = Math.round(iterations / (totalTime / 1000));
        
        console.log(`   ⚡ Email: ${rendersPerSecond.toLocaleString()} renders/sec`);
        console.log(`   ⏱️  Average: ${avgTime.toFixed(3)}ms per render`);
        
        // Assert performance expectations
        assertGreaterOrEqual(rendersPerSecond, 1200, "Email template should render at least 1200 times per second");
    });

    await t.step("Performance Summary", () => {
        console.log("\n🎊 Real-World Performance Test Summary:");
        console.log("✅ E-commerce templates: High-performance product catalogs");
        console.log("✅ Blog post templates: Fast content rendering");
        console.log("✅ Email templates: Rapid newsletter generation");
        console.log("\n🚀 UWU-Template handles complex real-world scenarios efficiently!");
        
        // This step always passes as it's just a summary
        assert(true, "Performance summary completed");
    });
});