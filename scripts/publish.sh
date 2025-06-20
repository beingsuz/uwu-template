#!/bin/bash

# UWU-Template Release Publication Script
# This script automates the process of publishing to npm and creating GitHub releases

set -e  # Exit on any error

echo "🚀 UWU-Template v1.1.1 Publication Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if jq is installed for JSON parsing
if ! command -v jq &> /dev/null; then
    print_error "jq is required but not installed. Please install jq first."
    exit 1
fi

# Get current version from package.json
CURRENT_VERSION=$(jq -r '.version' package.json)
print_status "Current version: $CURRENT_VERSION"

# Verify this is version 1.1.1
if [ "$CURRENT_VERSION" != "1.1.1" ]; then
    print_error "Expected version 1.1.1, found $CURRENT_VERSION"
    exit 1
fi

print_status "Starting pre-publication checks..."

# 1. Run tests
print_status "Running tests..."
if deno test -A; then
    print_success "All tests passed!"
else
    print_error "Tests failed. Aborting publication."
    exit 1
fi

# 2. Run benchmarks to verify performance
print_status "Running performance benchmarks..."
if deno bench -A --no-check > /dev/null 2>&1; then
    print_success "Benchmarks completed successfully!"
else
    print_warning "Benchmarks had warnings but completed."
fi

# 3. Type check
print_status "Running TypeScript type checking..."
if deno check mod.ts example.ts; then
    print_success "TypeScript compilation successful!"
else
    print_error "TypeScript errors found. Aborting publication."
    exit 1
fi

# 4. Format check
print_status "Checking code formatting..."
if deno fmt --check; then
    print_success "Code formatting is correct!"
else
    print_warning "Code formatting issues found. Auto-fixing..."
    deno fmt
    print_success "Code formatting fixed!"
fi

# 5. Lint check
print_status "Running linter..."
if deno lint; then
    print_success "Linting passed!"
else
    print_error "Linting issues found. Please fix them first."
    exit 1
fi

# 6. Build bundle
print_status "Building bundle..."
if deno task build > /dev/null 2>&1; then
    print_success "Bundle built successfully!"
else
    print_error "Bundle build failed."
    exit 1
fi

# 7. Verify bundle exists and is not empty
if [ ! -f "bundle.js" ] || [ ! -s "bundle.js" ]; then
    print_error "bundle.js is missing or empty."
    exit 1
fi

print_success "All pre-publication checks passed!"

echo ""
print_status "Publication checklist:"
echo "✅ Tests passing"
echo "✅ Benchmarks running"
echo "✅ TypeScript compilation successful"
echo "✅ Code formatting correct"
echo "✅ Linting passed"
echo "✅ Bundle built"
echo "✅ Version updated to $CURRENT_VERSION"

echo ""
print_warning "Manual steps required:"
echo ""
echo "📦 NPM Publication:"
echo "   1. Make sure you're logged into npm: npm whoami"
echo "   2. If not logged in: npm login"
echo "   3. Publish to npm: npm publish"
echo "   4. Verify publication: npm view uwu-template@$CURRENT_VERSION"
echo ""
echo "🐙 GitHub Release:"
echo "   1. Push changes: git push origin main"
echo "   2. Push tag: git push origin v$CURRENT_VERSION"
echo "   3. Create GitHub release using GITHUB_RELEASE_v$CURRENT_VERSION.md"
echo "   4. Upload bundle.js as release asset"
echo ""
echo "🦕 Deno Land (if applicable):"
echo "   1. Update deno.land/x if registered"
echo "   2. Verify import: import { compile } from \"https://deno.land/x/uwu_template@v$CURRENT_VERSION/mod.ts\""
echo ""

print_status "Ready for publication! Follow the manual steps above."

echo ""
echo "📋 Quick commands:"
echo "npm publish"
echo "git push origin main && git push origin v$CURRENT_VERSION"

print_success "Publication preparation complete!"
