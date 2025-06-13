// Final optimized fast parser - compilation-based template engine
// Compiles templates to optimized JavaScript functions for maximum performance

export interface CompilerOptions {
    escape: boolean;
}

// Define helper types
export interface HelperFunction {
    (value: unknown, options?: HelperOptions): string;
}

export interface BlockHelperFunction {
    (context: unknown, options: BlockHelperOptions): string;
}

export interface HelperOptions {
    hash?: Record<string, unknown>;
    data?: unknown;
}

export interface BlockHelperOptions extends HelperOptions {
    fn: (context?: unknown) => string;
    inverse: (context?: unknown) => string;
    blockParams?: string[];
}

// Fast escape function using lookup table
const ESCAPE_TABLE = new Array(256);
ESCAPE_TABLE[38] = "&amp;";   // &
ESCAPE_TABLE[60] = "&lt;";    // <
ESCAPE_TABLE[62] = "&gt;";    // >
ESCAPE_TABLE[34] = "&quot;";  // "
ESCAPE_TABLE[39] = "&#39;";   // '
ESCAPE_TABLE[96] = "&#x60;";  // `

function escape(text: string): string {
    let result = "";
    let lastIndex = 0;
    
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        const escaped = ESCAPE_TABLE[char];
        if (escaped) {
            result += text.slice(lastIndex, i) + escaped;
            lastIndex = i + 1;
        }
    }
    
    return lastIndex === 0 ? text : result + text.slice(lastIndex);
}

// Store registered layouts as raw content  
const layouts = new Map<string, string>();
// Cache for compiled layout functions
const layoutCache = new Map<string, (data: unknown) => string>();
// Cache for compiled functions
const compiledCache = new Map<string, (data: unknown) => string>();
// Store registered helpers
const helpers = new Map<string, HelperFunction | BlockHelperFunction>();
// Store block helpers specifically
const blockHelpers = new Map<string, BlockHelperFunction>();

export function registerLayout(name: string, content: string) {
    layouts.set(name, content);
    // Clear any cached compiled version
    layoutCache.delete(name);
}

export function registerHelper(name: string, fn: HelperFunction | BlockHelperFunction) {
    helpers.set(name, fn);
}

export function registerBlockHelper(name: string, fn: BlockHelperFunction) {
    blockHelpers.set(name, fn);
    helpers.set(name, fn);
}

/**
 * Backwards compatibility function for renderTemplate
 */
export function renderTemplate(_key: string, data: unknown, template: string): string {
    const compiled = compile(template);
    return compiled(data);
}

/**
 * Fast template compiler that generates optimized JavaScript functions
 */
export function compile(template: string, options: CompilerOptions = { escape: true }): (data: unknown) => string {
    // Check cache first
    const cacheKey = template + JSON.stringify(options);
    if (compiledCache.has(cacheKey)) {
        return compiledCache.get(cacheKey)!;
    }

    // Generate the JavaScript function body
    const functionBody = compileToJS(template, options);
    
    // Create the optimized function
    const compiledFunction = new Function('data', 'layouts', 'layoutCache', 'compileLayout', 'escape', 'helpers', functionBody);
    
    // Helper function to compile layouts on demand
    const compileLayout = (name: string, options: CompilerOptions) => {
        if (layoutCache.has(name)) {
            return layoutCache.get(name)!;
        }
        const layoutTemplate = layouts.get(name);
        if (!layoutTemplate) return () => '';
        
        const layoutFunction = compile(layoutTemplate, options);
        layoutCache.set(name, layoutFunction);
        return layoutFunction;
    };
      // Cache and return
    const boundFunction = (data: unknown) => compiledFunction(data, layouts, layoutCache, compileLayout, escape, helpers);
    compiledCache.set(cacheKey, boundFunction);
    
    return boundFunction;
}

/**
 * Compile template to optimized JavaScript code
 */
function compileToJS(template: string, options: CompilerOptions): string {
    let code = 'let result = "";\n';
    code += processTemplate(template, options, 'data');
    code += 'return result;\n';
    return code;
}

/**
 * Process template with proper block handling
 */
function processTemplate(template: string, options: CompilerOptions, dataVar: string): string {
    let code = '';
    let pos = 0;
    
    while (pos < template.length) {
        // Find the next construct
        const nextConstruct = findNextConstruct(template, pos);
        
        if (!nextConstruct) {
            // No more constructs, add remaining content
            const remaining = template.slice(pos);
            if (remaining) {
                code += `result += ${JSON.stringify(remaining)};\n`;
            }
            break;
        }
        
        // Add static content before construct
        if (nextConstruct.start > pos) {
            const staticContent = template.slice(pos, nextConstruct.start);
            if (staticContent) {
                code += `result += ${JSON.stringify(staticContent)};\n`;
            }
        }
        
        // Generate code for construct
        code += generateConstructCode(nextConstruct, options, dataVar);
        
        pos = nextConstruct.end;
    }
    
    return code;
}

interface TemplateConstruct {
    type: 'variable' | 'if' | 'each' | 'layout' | 'blockHelper';
    start: number;
    end: number;
    variable?: string;
    condition?: string;
    content?: string;
    elseContent?: string;
    elseifConditions?: Array<{condition: string, content: string}>;
    helperArgs?: string;
}

/**
 * Find the next template construct in order
 */
function findNextConstruct(template: string, startPos: number): TemplateConstruct | null {
    const remaining = template.slice(startPos);
    
    // Find all possible constructs and their positions
    const possibilities: Array<{construct: TemplateConstruct, priority: number}> = [];
    
    // Layout {{> name}} - highest priority (simplest)
    const layoutMatch = remaining.match(/\{\{>\s*([^}]+)\}\}/);
    if (layoutMatch && layoutMatch.index !== undefined) {
        possibilities.push({
            construct: {
                type: 'layout',
                start: startPos + layoutMatch.index,
                end: startPos + layoutMatch.index + layoutMatch[0].length,
                variable: layoutMatch[1].trim()
            },
            priority: 1
        });
    }
    
    // Simple variable {{variable}} - high priority
    const varMatch = remaining.match(/\{\{([^#/>!][^}]*)\}\}/);
    if (varMatch && varMatch.index !== undefined) {
        possibilities.push({
            construct: {
                type: 'variable',
                start: startPos + varMatch.index,
                end: startPos + varMatch.index + varMatch[0].length,
                variable: varMatch[1].trim()
            },
            priority: 2
        });
    }
      // Each block {{#each}} ... {{/each}} - lower priority (complex)
    const eachMatch = remaining.match(/\{\{#each\s+([^}]+)\}\}/);
    if (eachMatch && eachMatch.index !== undefined) {
        const blockStart = startPos + eachMatch.index;
        const blockEnd = findMatchingBlockEnd(template, blockStart, 'each');
        if (blockEnd > blockStart) {
            const contentStart = blockStart + eachMatch[0].length;
            const contentEnd = blockEnd - '{{/each}}'.length;
            possibilities.push({
                construct: {
                    type: 'each',
                    start: blockStart,
                    end: blockEnd,
                    variable: eachMatch[1].trim(),
                    content: template.slice(contentStart, contentEnd)
                },
                priority: 3
            });
        }
    }
    
    // Block helper {{#helperName}} ... {{/helperName}} - similar priority to each
    const blockHelperMatch = remaining.match(/\{\{#(\w+)(?:\s+([^}]*))?\}\}/);
    if (blockHelperMatch && blockHelperMatch.index !== undefined) {
        const helperName = blockHelperMatch[1];
        // Skip built-in helpers
        if (!['if', 'each', 'elseif', 'else'].includes(helperName)) {
            const blockStart = startPos + blockHelperMatch.index;
            const blockEnd = findMatchingBlockEnd(template, blockStart, helperName);
            if (blockEnd > blockStart) {
                const contentStart = blockStart + blockHelperMatch[0].length;
                const contentEnd = blockEnd - `{{/${helperName}}}`.length;
                possibilities.push({
                    construct: {
                        type: 'blockHelper',
                        start: blockStart,
                        end: blockEnd,
                        variable: helperName,
                        content: template.slice(contentStart, contentEnd),
                        helperArgs: blockHelperMatch[2]?.trim() || ''
                    },
                    priority: 3
                });
            }
        }
    }
      // If block {{#if}} ... {{#elseif}} ... {{#else}} ... {{/if}} - lowest priority (most complex)
    const ifMatch = remaining.match(/\{\{#if\s+([^}]+)\}\}/);
    if (ifMatch && ifMatch.index !== undefined) {
        const blockStart = startPos + ifMatch.index;
        const blockEnd = findMatchingBlockEnd(template, blockStart, 'if');
        if (blockEnd > blockStart) {
            const contentStart = blockStart + ifMatch[0].length;
            const contentEnd = blockEnd - '{{/if}}'.length;
            const fullContent = template.slice(contentStart, contentEnd);
            
            // Parse if-elseif-else structure
            const ifElseStructure = parseIfElseStructure(fullContent);
            
            possibilities.push({
                construct: {
                    type: 'if',
                    start: blockStart,
                    end: blockEnd,
                    condition: ifMatch[1].trim(),
                    content: ifElseStructure.ifContent,
                    elseContent: ifElseStructure.elseContent,
                    elseifConditions: ifElseStructure.elseifConditions
                },
                priority: 4
            });
        }
    }
    
    if (possibilities.length === 0) return null;
    
    // Sort by position first, then by priority for ties
    possibilities.sort((a, b) => {
        if (a.construct.start !== b.construct.start) {
            return a.construct.start - b.construct.start;
        }
        return a.priority - b.priority;
    });
    
    return possibilities[0].construct;
}

/**
 * Find the matching end tag for a block, handling nesting
 */
function findMatchingBlockEnd(template: string, blockStart: number, blockType: string): number {
    const openPattern = new RegExp(`\\{\\{#${blockType}\\b[^}]*\\}\\}`, 'g');
    const closePattern = new RegExp(`\\{\\{\\/${blockType}\\}\\}`, 'g');
    
    let depth = 0;
    let pos = blockStart;
    
    // Skip the opening tag
    openPattern.lastIndex = pos;
    const openMatch = openPattern.exec(template);
    if (openMatch && openMatch.index === pos) {
        pos = openMatch.index + openMatch[0].length;
        depth = 1;
    }
    
    while (depth > 0 && pos < template.length) {
        openPattern.lastIndex = pos;
        closePattern.lastIndex = pos;
        
        const nextOpen = openPattern.exec(template);
        const nextClose = closePattern.exec(template);
        
        if (!nextClose) break; // No closing tag found
        
        if (nextOpen && nextOpen.index < nextClose.index) {
            // Found nested opening tag
            depth++;
            pos = nextOpen.index + nextOpen[0].length;
        } else {
            // Found closing tag
            depth--;
            pos = nextClose.index + nextClose[0].length;
            if (depth === 0) {
                return pos;
            }
        }
    }
    
    return template.length; // No matching close found
}

/**
 * Generate JavaScript code for a construct
 */
function generateConstructCode(construct: TemplateConstruct, options: CompilerOptions, dataVar: string): string {
    switch (construct.type) {
        case 'variable':
            return generateVariableCode(construct.variable!, options, dataVar);
        case 'layout':
            return generateLayoutCode(construct.variable!, options, dataVar);
        case 'each':
            return generateEachCode(construct.variable!, construct.content!, options, dataVar);
        case 'blockHelper':
            return generateBlockHelperCode(construct.variable!, construct.content!, construct.helperArgs || '', options, dataVar);
        case 'if':
            return generateIfCode(construct.condition!, construct.content!, construct.elseContent || '', construct.elseifConditions || [], options, dataVar);
        default:
            return '';
    }
}

/**
 * Generate code for a variable
 */
function generateVariableCode(variable: string, options: CompilerOptions, dataVar: string): string {
    // Check if this is a helper call
    const helperMatch = variable.match(/^(\w+)\s+(.+)$/);
    if (helperMatch) {
        const [, helperName, helperArgs] = helperMatch;
        return generateHelperCall(helperName, helperArgs, options, dataVar);
    }
    
    const accessor = generateDataAccessor(variable, dataVar);
    const varName = `val_${Math.random().toString(36).substr(2, 9)}`;
    
    if (options.escape) {
        return `
{
    let ${varName} = ${accessor};
    if (typeof ${varName} === 'string') {
        result += escape(${varName});
    } else if (${varName} != null) {
        result += String(${varName});
    }
}
`;
    } else {
        return `
{
    let ${varName} = ${accessor};
    if (${varName} != null) {
        result += String(${varName});
    }
}
`;
    }
}

/**
 * Generate code for a layout
 */
function generateLayoutCode(layoutName: string, options: CompilerOptions, dataVar: string): string {
    return `
{
    if (layouts.has(${JSON.stringify(layoutName)})) {
        const layoutFunction = compileLayout(${JSON.stringify(layoutName)}, ${JSON.stringify(options)});
        result += layoutFunction(${dataVar});
    }
}
`;
}

/**
 * Generate code for an each loop
 */
function generateEachCode(variable: string, content: string, options: CompilerOptions, dataVar: string): string {
    const accessor = generateDataAccessor(variable, dataVar);
    const itemVar = `item_${Math.random().toString(36).substr(2, 9)}`;
    const indexVar = `index_${Math.random().toString(36).substr(2, 9)}`;
    
    const innerCode = processTemplate(content, options, itemVar);
    
    return `
{
    const arr = ${accessor};
    if (Array.isArray(arr)) {
        for (let ${indexVar} = 0; ${indexVar} < arr.length; ${indexVar}++) {
            const ${itemVar} = arr[${indexVar}];
            ${innerCode}
        }
    }
}
`;
}

/**
 * Generate code for a block helper
 */
function generateBlockHelperCode(helperName: string, content: string, helperArgs: string, options: CompilerOptions, dataVar: string): string {
    const { args, hash } = parseHelperArguments(helperArgs);
    
    const fnName = `fn_${Math.random().toString(36).substr(2, 9)}`;
    const inverseName = `inverse_${Math.random().toString(36).substr(2, 9)}`;
    const hashName = `hash_${Math.random().toString(36).substr(2, 9)}`;
    const resultName = `result_${Math.random().toString(36).substr(2, 9)}`;
    
    // Parse if/else structure in the block content
    const blockStructure = parseBlockHelperStructure(content);
    
    // Generate hash object
    const hashCode = Object.entries(hash).length > 0 
        ? `const ${hashName} = {${Object.entries(hash).map(([key, value]) => {
            // If value is a quoted string, use it as a literal
            if ((value.startsWith('"') && value.endsWith('"')) || 
                (value.startsWith("'") && value.endsWith("'"))) {
                return `${JSON.stringify(key)}: ${JSON.stringify(value.slice(1, -1))}`;
            } else {
                // Otherwise treat as a data accessor
                return `${JSON.stringify(key)}: ${generateDataAccessor(value, dataVar)}`;
            }
          }).join(', ')}};`
        : `const ${hashName} = {};`;
    
    // Generate the fn and inverse functions
    const fnCode = `
        const ${fnName} = (context) => {
            const childData = context || ${dataVar};
            let childResult = '';
            ${processTemplate(blockStructure.mainContent, options, 'childData').replace(/result \+=/g, 'childResult +=')}
            return childResult;
        };
    `;
    
    const inverseCode = `
        const ${inverseName} = (context) => {
            const childData = context || ${dataVar};
            let childResult = '';
            ${processTemplate(blockStructure.elseContent, options, 'childData').replace(/result \+=/g, 'childResult +=')}
            return childResult;
        };
    `;
    
    // Generate the helper call
    let contextArg = dataVar;
    if (args.length > 0) {
        const firstArg = args[0];
        // If first argument is a quoted string, use it as a literal
        if ((firstArg.startsWith('"') && firstArg.endsWith('"')) || 
            (firstArg.startsWith("'") && firstArg.endsWith("'"))) {
            contextArg = JSON.stringify(firstArg.slice(1, -1));
        } else if (firstArg === 'true') {
            contextArg = 'true';
        } else if (firstArg === 'false') {
            contextArg = 'false';
        } else if (/^\d+$/.test(firstArg)) {
            contextArg = firstArg;
        } else {
            // Otherwise treat as a data accessor
            contextArg = generateDataAccessor(firstArg, dataVar);
        }
    }
    
    return `
{
    if (helpers.has(${JSON.stringify(helperName)})) {
        ${hashCode}
        ${fnCode}
        ${inverseCode}
        const helperOptions = {
            fn: ${fnName},
            inverse: ${inverseName},
            hash: ${hashName},
            data: ${dataVar}
        };
        const ${resultName} = helpers.get(${JSON.stringify(helperName)})?.call(null, ${contextArg}, helperOptions);
        if (${resultName} != null) {
            result += String(${resultName});
        }
    }
}
`;
}

/**
 * Generate code for an if statement with elseif support
 */
function generateIfCode(
    condition: string, 
    content: string, 
    elseContent: string, 
    elseifConditions: Array<{condition: string, content: string}>, 
    options: CompilerOptions, 
    dataVar: string
): string {
    const conditionCode = generateConditionCode(condition, dataVar);
    const ifCode = processTemplate(content, options, dataVar);
    
    let code = `
{
    if (${conditionCode}) {
        ${ifCode}`;
    
    // Add elseif blocks
    for (const elseif of elseifConditions) {
        const elseifConditionCode = generateConditionCode(elseif.condition, dataVar);
        const elseifCode = processTemplate(elseif.content, options, dataVar);
        code += `
    } else if (${elseifConditionCode}) {
        ${elseifCode}`;
    }
    
    // Add else block if present
    if (elseContent) {
        const elseCode = processTemplate(elseContent, options, dataVar);
        code += `
    } else {
        ${elseCode}`;
    }
    
    code += `
    }
}
`;
    
    return code;
}

/**
 * Generate JavaScript data accessor
 */
function generateDataAccessor(path: string, dataVar: string): string {
    if (path === 'this') {
        return dataVar;
    }
    
    // Handle simple property access
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(path)) {
        return `${dataVar}?.${path}`;
    }
    
    // Handle complex paths with dots
    const parts = path.split('.');
    let accessor = dataVar;
    
    for (const part of parts) {
        if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(part)) {
            accessor += `?.${part}`;
        } else {
            accessor += `?.[${JSON.stringify(part)}]`;
        }
    }
    
    return accessor;
}

/**
 * Generate JavaScript condition code
 */
function generateConditionCode(condition: string, dataVar: string): string {
    // Handle simple conditions like "visible", "visible == true", "user.isLoggedIn", etc.
    let code = condition.trim();
    
    // Replace dotted property paths first (e.g., user.isLoggedIn)
    code = code.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)\b/g, (match, varPath) => {
        // Don't replace reserved words or numbers
        if (['true', 'false', 'null', 'undefined', 'typeof', 'instanceof'].includes(varPath)) {
            return match;
        }
        if (/^\d+$/.test(varPath)) {
            return match;
        }
        // Check if it's a property path (contains dots)
        if (varPath.includes('.')) {
            return generateDataAccessor(varPath, dataVar);
        } else {
            return generateDataAccessor(varPath, dataVar);
        }
    });
    
    return `!!(${code})`;
}

/**
 * Parse if-elseif-else structure from content
 */
function parseIfElseStructure(content: string): {
    ifContent: string;
    elseifConditions: Array<{condition: string, content: string}>;
    elseContent: string;
} {
    const elseifConditions: Array<{condition: string, content: string}> = [];
    let ifContent = content;
    let elseContent = '';
    
    // Find all {{#elseif}} blocks
    const elseifPattern = /\{\{#elseif\s+([^}]+)\}\}/g;
    const elsePattern = /\{\{#else\}\}/;
    
    const elseifMatches: Array<{condition: string, index: number, length: number}> = [];
    let match: RegExpExecArray | null;
    
    while ((match = elseifPattern.exec(content)) !== null) {
        elseifMatches.push({
            condition: match[1].trim(),
            index: match.index,
            length: match[0].length
        });
    }
    
    const elseMatch = content.match(elsePattern);
    const elseIndex = elseMatch ? elseMatch.index! : -1;
    
    if (elseifMatches.length > 0 || elseIndex >= 0) {
        // Complex if-elseif-else structure
        
        // Get if content (up to first elseif or else)
        const firstBoundary = elseifMatches.length > 0 ? elseifMatches[0].index : elseIndex;
        if (firstBoundary >= 0) {
            ifContent = content.slice(0, firstBoundary).trim();
        }
        
        // Process elseif blocks
        for (let i = 0; i < elseifMatches.length; i++) {
            const elseifMatch = elseifMatches[i];
            const nextBoundary = i + 1 < elseifMatches.length ? 
                elseifMatches[i + 1].index : 
                (elseIndex >= 0 ? elseIndex : content.length);
            
            const elseifContent = content.slice(
                elseifMatch.index + elseifMatch.length,
                nextBoundary
            ).trim();
            
            elseifConditions.push({
                condition: elseifMatch.condition,
                content: elseifContent
            });
        }
        
        // Get else content
        if (elseIndex >= 0) {
            elseContent = content.slice(elseIndex + elseMatch![0].length).trim();
        }
    }
    
    return { ifContent, elseifConditions, elseContent };
}

/**
 * Parse block helper structure to separate main content from else content
 */
function parseBlockHelperStructure(content: string): { mainContent: string; elseContent: string } {
    const elsePattern = /\{\{else\}\}/;
    const elseMatch = content.match(elsePattern);
    
    if (elseMatch && elseMatch.index !== undefined) {
        const mainContent = content.slice(0, elseMatch.index).trim();
        const elseContent = content.slice(elseMatch.index + elseMatch[0].length).trim();
        return { mainContent, elseContent };
    }
    
    return { mainContent: content, elseContent: '' };
}

/**
 * Generate helper call with options support
 */
function generateHelperCall(helperName: string, helperArgs: string, options: CompilerOptions, dataVar: string): string {
    // Parse helper arguments and hash options
    const { args, hash } = parseHelperArguments(helperArgs);
    
    const varName = `helper_${Math.random().toString(36).substr(2, 9)}`;
    const hashName = `hash_${Math.random().toString(36).substr(2, 9)}`;
      // Generate code to build hash object
    const hashCode = Object.entries(hash).length > 0 
        ? `const ${hashName} = {${Object.entries(hash).map(([key, value]) => {
            // If value is a quoted string, use it as a literal
            if ((value.startsWith('"') && value.endsWith('"')) || 
                (value.startsWith("'") && value.endsWith("'"))) {
                return `${JSON.stringify(key)}: ${JSON.stringify(value.slice(1, -1))}`;
            } else {
                // Otherwise treat as a data accessor
                return `${JSON.stringify(key)}: ${generateDataAccessor(value, dataVar)}`;
            }
          }).join(', ')}};`
        : `const ${hashName} = {};`;
    
    // Generate code to call helper
    const helperCode = args.length > 0 
        ? `const ${varName} = helpers.get(${JSON.stringify(helperName)})?.call(null, ${args.map(arg => generateDataAccessor(arg, dataVar)).join(', ')}, { hash: ${hashName}, data: ${dataVar} });`
        : `const ${varName} = helpers.get(${JSON.stringify(helperName)})?.call(null, ${dataVar}, { hash: ${hashName}, data: ${dataVar} });`;
    
    if (options.escape) {
        return `
{
    if (helpers.has(${JSON.stringify(helperName)})) {
        ${hashCode}
        ${helperCode}
        if (typeof ${varName} === 'string') {
            result += escape(${varName});
        } else if (${varName} != null) {
            result += String(${varName});
        }
    }
}
`;
    } else {
        return `
{
    if (helpers.has(${JSON.stringify(helperName)})) {
        ${hashCode}
        ${helperCode}
        if (${varName} != null) {
            result += String(${varName});
        }
    }
}
`;
    }
}

/**
 * Parse helper arguments and hash options
 */
function parseHelperArguments(argsString: string): { args: string[], hash: Record<string, string> } {
    const args: string[] = [];
    const hash: Record<string, string> = {};
    
    // More sophisticated parsing that handles quoted strings
    const tokens = tokenizeArguments(argsString.trim());
    
    for (const token of tokens) {
        if (token.includes('=')) {
            const eqIndex = token.indexOf('=');
            const key = token.slice(0, eqIndex);
            const value = token.slice(eqIndex + 1);
            
            // Keep quotes for processing in code generation
            hash[key] = value;
        } else {
            args.push(token);
        }
    }
    
    return { args, hash };
}

/**
 * Tokenize arguments respecting quoted strings
 */
function tokenizeArguments(input: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    
    for (let i = 0; i < input.length; i++) {
        const char = input[i];
        
        if (!inQuotes && (char === '"' || char === "'")) {
            inQuotes = true;
            quoteChar = char;
            current += char;
        } else if (inQuotes && char === quoteChar) {
            inQuotes = false;
            current += char;
        } else if (!inQuotes && char === ' ') {
            if (current.trim()) {
                tokens.push(current.trim());
                current = '';
            }
        } else {
            current += char;
        }
    }
    
    if (current.trim()) {
        tokens.push(current.trim());
    }
    
    return tokens;
}
