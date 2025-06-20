// Final optimized fast parser - compilation-based template engine
// Compiles templates to optimized JavaScript functions for maximum performance

export interface CompilerOptions {
	escape: boolean;
}

// Enhanced error handling
export class TemplateError extends Error {
	constructor(
		message: string,
		public line?: number,
		public column?: number,
		public templateName?: string,
		public context?: string,
	) {
		super(message);
		this.name = "TemplateError";

		// Create helpful error message with context
		let fullMessage = message;
		if (line !== undefined) {
			fullMessage = `Line ${line}${
				column !== undefined ? `, Column ${column}` : ""
			}: ${message}`;
		}
		if (templateName) {
			fullMessage = `Template "${templateName}" - ${fullMessage}`;
		}
		if (context) {
			fullMessage += `\nContext: ${context}`;
		}

		this.message = fullMessage;
	}
}

export class TemplateSyntaxError extends TemplateError {
	constructor(
		message: string,
		line?: number,
		column?: number,
		templateName?: string,
		context?: string,
	) {
		super(`Syntax Error: ${message}`, line, column, templateName, context);
		this.name = "TemplateSyntaxError";
	}
}

export class TemplateRuntimeError extends TemplateError {
	constructor(
		message: string,
		line?: number,
		column?: number,
		templateName?: string,
		context?: string,
	) {
		super(`Runtime Error: ${message}`, line, column, templateName, context);
		this.name = "TemplateRuntimeError";
	}
}

// Line tracking utility
class LineTracker {
	private lines: string[];
	private linePositions: number[];

	constructor(template: string) {
		this.lines = template.split("\n");
		this.linePositions = [0];

		let pos = 0;
		for (let i = 0; i < this.lines.length - 1; i++) {
			pos += this.lines[i].length + 1; // +1 for newline
			this.linePositions.push(pos);
		}
	}

	getPosition(index: number): { line: number; column: number } {
		let line = 1;
		for (let i = 0; i < this.linePositions.length; i++) {
			if (index < this.linePositions[i]) {
				break;
			}
			line = i + 1;
		}

		const lineStart = this.linePositions[line - 1];
		const column = index - lineStart + 1;

		return { line, column };
	}

	getLineContent(line: number): string {
		return this.lines[line - 1] || "";
	}

	getContext(index: number, contextLines = 2): string {
		const { line } = this.getPosition(index);
		const start = Math.max(1, line - contextLines);
		const end = Math.min(this.lines.length, line + contextLines);

		const contextText: string[] = [];
		for (let i = start; i <= end; i++) {
			const prefix = i === line ? ">>> " : "    ";
			contextText.push(`${prefix}${i}: ${this.lines[i - 1]}`);
		}

		return contextText.join("\n");
	}
}

// Define helper types
export interface HelperFunction {
	(...args: unknown[]): string;
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
ESCAPE_TABLE[38] = "&amp;"; // &
ESCAPE_TABLE[60] = "&lt;"; // <
ESCAPE_TABLE[62] = "&gt;"; // >
ESCAPE_TABLE[34] = "&quot;"; // "
ESCAPE_TABLE[39] = "&#39;"; // '
ESCAPE_TABLE[96] = "&#x60;"; // `

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
// Store components
const components = new Map<string, string>();
const componentCache = new Map<string, (data: unknown) => string>();

export function registerLayout(name: string, content: string) {
	if (typeof name !== "string" || name.trim().length === 0) {
		throw new Error("Layout name must be a non-empty string");
	}
	if (typeof content !== "string") {
		throw new Error("Layout content must be a string");
	}
	layouts.set(name, content);
	// Clear any cached compiled version
	layoutCache.delete(name);
}

export function registerComponent(name: string, template: string) {
	if (typeof name !== "string" || name.trim().length === 0) {
		throw new Error("Component name must be a non-empty string");
	}
	if (typeof template !== "string") {
		throw new Error("Component template must be a string");
	}
	components.set(name, template);
	// Clear any cached compiled version
	componentCache.delete(name);
}

export function registerHelper(
	name: string,
	fn: HelperFunction | BlockHelperFunction,
) {
	if (typeof name !== "string" || name.trim().length === 0) {
		throw new Error("Helper name must be a non-empty string");
	}
	if (typeof fn !== "function") {
		throw new Error("Helper function must be a function");
	}
	helpers.set(name, fn);
}

export function registerBlockHelper(name: string, fn: BlockHelperFunction) {
	if (typeof name !== "string" || name.trim().length === 0) {
		throw new Error("Block helper name must be a non-empty string");
	}
	if (typeof fn !== "function") {
		throw new Error("Block helper function must be a function");
	}
	blockHelpers.set(name, fn);
	helpers.set(name, fn);
}

/**
 * Backwards compatibility function for renderTemplate
 */
export function renderTemplate(
	_key: string,
	data: unknown,
	template: string,
): string {
	const compiled = compile(template);
	return compiled(data);
}

/**
 * Fast template compiler that generates optimized JavaScript functions
 */
export function compile(
	template: string,
	options: CompilerOptions = { escape: true },
	templateName?: string,
): (data: unknown) => string {
	// Input validation
	if (typeof template !== "string") {
		throw new TemplateSyntaxError(
			`Template must be a string, received ${typeof template}`,
			undefined,
			undefined,
			templateName,
		);
	}

	if (template.length === 0 || template.trim().length === 0) {
		throw new TemplateSyntaxError(
			"Template cannot be empty",
			undefined,
			undefined,
			templateName,
		);
	}

	if (template.length > 1000000) {
		// 1MB limit
		throw new TemplateSyntaxError(
			`Template too large (${template.length} characters). Maximum allowed is 1,000,000 characters`,
			undefined,
			undefined,
			templateName,
		);
	}

	if (options && typeof options !== "object") {
		throw new TemplateSyntaxError(
			`Options must be an object, received ${typeof options}`,
			undefined,
			undefined,
			templateName,
		);
	}

	if (templateName !== undefined && typeof templateName !== "string") {
		throw new TemplateSyntaxError(
			`Template name must be a string, received ${typeof templateName}`,
			undefined,
			undefined,
			templateName,
		);
	}

	// Check cache first
	const cacheKey = template + JSON.stringify(options) + (templateName || "");
	if (compiledCache.has(cacheKey)) {
		return compiledCache.get(cacheKey)!;
	}

	try {
		// Generate the JavaScript function body
		const lineTracker = new LineTracker(template);
		const functionBody = compileToJS(
			template,
			options,
			lineTracker,
			templateName,
		); // Create the optimized function
		const compiledFunction = new Function(
			"data",
			"layouts",
			"layoutCache",
			"compileLayout",
			"escape",
			"helpers",
			"components",
			"componentCache",
			"compileComponent",
			"lineTracker",
			"templateName",
			functionBody,
		);

		// Helper function to compile layouts on demand
		const compileLayout = (name: string, options: CompilerOptions) => {
			if (layoutCache.has(name)) {
				return layoutCache.get(name)!;
			}
			const layoutTemplate = layouts.get(name);
			if (!layoutTemplate) {
				throw new TemplateError(
					`Layout "${name}" not found`,
					undefined,
					undefined,
					templateName,
				);
			}

			const layoutFunction = compile(
				layoutTemplate,
				options,
				`layout:${name}`,
			);
			layoutCache.set(name, layoutFunction);
			return layoutFunction;
		};

		// Helper function to compile components on demand
		const compileComponent = (name: string, options: CompilerOptions) => {
			if (componentCache.has(name)) {
				return componentCache.get(name)!;
			}
			const componentTemplate = components.get(name);
			if (!componentTemplate) {
				throw new TemplateError(
					`Component "${name}" not found`,
					undefined,
					undefined,
					templateName,
				);
			}

			const componentFunction = compile(
				componentTemplate,
				options,
				`component:${name}`,
			);
			componentCache.set(name, componentFunction);
			return componentFunction;
		};
		// Cache and return
		const boundFunction = (data: unknown) => {
			// Validate data parameter
			if (
				data !== null && data !== undefined && typeof data !== "object"
			) {
				throw new TemplateRuntimeError(
					`Template data must be an object, null, or undefined. Received ${typeof data}`,
					undefined,
					undefined,
					templateName,
				);
			}

			try {
				return compiledFunction(
					data,
					layouts,
					layoutCache,
					compileLayout,
					escape,
					helpers,
					components,
					componentCache,
					compileComponent,
					lineTracker,
					templateName,
				);
			} catch (error) {
				if (error instanceof TemplateError) {
					throw error;
				}
				throw new TemplateRuntimeError(
					`Error executing template: ${
						error instanceof Error ? error.message : String(error)
					}`,
					undefined,
					undefined,
					templateName,
				);
			}
		};
		compiledCache.set(cacheKey, boundFunction);

		return boundFunction;
	} catch (error) {
		if (error instanceof TemplateError) {
			throw error;
		}
		throw new TemplateSyntaxError(
			`Error compiling template: ${
				error instanceof Error ? error.message : String(error)
			}`,
			undefined,
			undefined,
			templateName,
		);
	}
}

/**
 * Compile template to optimized JavaScript code
 */
function compileToJS(
	template: string,
	options: CompilerOptions,
	lineTracker: LineTracker,
	templateName?: string,
): string {
	let code = 'let result = "";\n';
	code += processTemplate(
		template,
		options,
		"data",
		lineTracker,
		templateName,
	);
	code += "return result;\n";
	return code;
}

/**
 * Process template with proper block handling
 */
function processTemplate(
	template: string,
	options: CompilerOptions,
	dataVar: string,
	lineTracker: LineTracker,
	templateName?: string,
): string {
	let code = "";
	let pos = 0;

	while (pos < template.length) {
		// Find the next construct
		const nextConstruct = findNextConstruct(
			template,
			pos,
			lineTracker,
			templateName,
		);

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
		code += generateConstructCode(
			nextConstruct,
			options,
			dataVar,
			lineTracker,
			templateName,
		);

		pos = nextConstruct.end;
	}

	return code;
}

interface TemplateConstruct {
	type:
		| "variable"
		| "if"
		| "each"
		| "layout"
		| "blockHelper"
		| "helper"
		| "component"
		| "raw"
		| "extends"
		| "block";
	start: number;
	end: number;
	variable?: string;
	condition?: string;
	content?: string;
	elseContent?: string;
	elseifConditions?: Array<{ condition: string; content: string }>;
	helperArgs?: string;
	line?: number;
	column?: number;
}

// Template inheritance system
const templateBlocks = new Map<string, Map<string, string>>();
const baseTemplates = new Map<string, string>();

export function registerBaseTemplate(name: string, template: string) {
	baseTemplates.set(name, template);
}

export function clearTemplateCache() {
	compiledCache.clear();
	layoutCache.clear();
	componentCache.clear();
	templateBlocks.clear();
}

/**
 * Find the next template construct in order
 */
function findNextConstruct(
	template: string,
	startPos: number,
	lineTracker: LineTracker,
	templateName?: string,
): TemplateConstruct | null {
	const remaining = template.slice(startPos);
	// Find all possible constructs and their positions
	const possibilities: Array<{
		construct: TemplateConstruct;
		priority: number;
	}> = [];

	try {
		// Template extends {{extends "base"}} - highest priority
		const extendsMatch = remaining.match(/\{\{extends\s+([^}]+)\}\}/);
		if (extendsMatch && extendsMatch.index !== undefined) {
			const position = lineTracker.getPosition(
				startPos + extendsMatch.index,
			);
			possibilities.push({
				construct: {
					type: "extends",
					start: startPos + extendsMatch.index,
					end: startPos + extendsMatch.index + extendsMatch[0].length,
					variable: extendsMatch[1].trim().replace(/['"]/g, ""),
					line: position.line,
					column: position.column,
				},
				priority: 0.1,
			});
		}

		// Block definition {{#block "name"}} ... {{/block}} - very high priority
		const blockMatch = remaining.match(/\{\{#block\s+([^}]+)\}\}/);
		if (blockMatch && blockMatch.index !== undefined) {
			const blockStart = startPos + blockMatch.index;
			const blockEnd = findMatchingBlockEnd(
				template,
				blockStart,
				"block",
			);
			if (blockEnd > blockStart) {
				const position = lineTracker.getPosition(blockStart);
				const contentStart = blockStart + blockMatch[0].length;
				const contentEnd = blockEnd - "{{/block}}".length;
				possibilities.push({
					construct: {
						type: "block",
						start: blockStart,
						end: blockEnd,
						variable: blockMatch[1].trim().replace(/['"]/g, ""),
						content: template.slice(contentStart, contentEnd),
						line: position.line,
						column: position.column,
					},
					priority: 0.2,
				});
			}
		}

		// Raw block {{{{raw}}}} ... {{{{/raw}}}} - highest priority to avoid processing
		const rawMatch = remaining.match(/\{\{\{\{raw\}\}\}\}/);
		if (rawMatch && rawMatch.index !== undefined) {
			const blockStart = startPos + rawMatch.index;
			const blockEnd = template.indexOf("{{{{/raw}}}}", blockStart);
			if (blockEnd > blockStart) {
				const position = lineTracker.getPosition(blockStart);
				const contentStart = blockStart + rawMatch[0].length;
				const contentEnd = blockEnd;
				possibilities.push({
					construct: {
						type: "raw",
						start: blockStart,
						end: blockEnd + "{{{{/raw}}}}".length,
						content: template.slice(contentStart, contentEnd),
						line: position.line,
						column: position.column,
					},
					priority: 0.5,
				});
			} else {
				const position = lineTracker.getPosition(blockStart);
				throw new TemplateSyntaxError(
					"Unclosed raw block",
					position.line,
					position.column,
					templateName,
					lineTracker.getContext(blockStart),
				);
			}
		} // Layout {{> name}} - highest priority (simplest)
		const layoutMatch = remaining.match(/\{\{>\s*([^}]+)\}\}/);
		if (layoutMatch && layoutMatch.index !== undefined) {
			const position = lineTracker.getPosition(
				startPos + layoutMatch.index,
			);
			possibilities.push({
				construct: {
					type: "layout",
					start: startPos + layoutMatch.index,
					end: startPos + layoutMatch.index + layoutMatch[0].length,
					variable: layoutMatch[1].trim(),
					line: position.line,
					column: position.column,
				},
				priority: 1,
			});
		}

		// Triple brace helper call {{{helper args}}} - very high priority
		const tripleMatch = remaining.match(/\{\{\{([^}]+)\}\}\}/);
		if (tripleMatch && tripleMatch.index !== undefined) {
			const content = tripleMatch[1].trim();
			const position = lineTracker.getPosition(
				startPos + tripleMatch.index,
			);
			// Parse helper name and arguments
			const spaceIndex = content.indexOf(" ");
			if (spaceIndex > 0) {
				const helperName = content.slice(0, spaceIndex);
				const helperArgs = content.slice(spaceIndex + 1);
				possibilities.push({
					construct: {
						type: "helper",
						start: startPos + tripleMatch.index,
						end: startPos + tripleMatch.index +
							tripleMatch[0].length,
						variable: helperName,
						helperArgs: helperArgs,
						line: position.line,
						column: position.column,
					},
					priority: 1.5,
				});
			} else {
				// No arguments, just helper name
				possibilities.push({
					construct: {
						type: "helper",
						start: startPos + tripleMatch.index,
						end: startPos + tripleMatch.index +
							tripleMatch[0].length,
						variable: content,
						helperArgs: "",
						line: position.line,
						column: position.column,
					},
					priority: 1.5,
				});
			}
		}

		// Component {{component "name" ...props}} - high priority
		const componentMatch = remaining.match(/\{\{component\s+([^}]+)\}\}/);
		if (componentMatch && componentMatch.index !== undefined) {
			const content = componentMatch[1].trim();
			const position = lineTracker.getPosition(
				startPos + componentMatch.index,
			);
			// Parse component name and props
			const spaceIndex = content.indexOf(" ");
			if (spaceIndex > 0) {
				const componentName = content.slice(0, spaceIndex);
				const componentProps = content.slice(spaceIndex + 1);
				possibilities.push({
					construct: {
						type: "component",
						start: startPos + componentMatch.index,
						end: startPos + componentMatch.index +
							componentMatch[0].length,
						variable: componentName.replace(/['"]/g, ""), // Remove quotes from component name
						helperArgs: componentProps,
						line: position.line,
						column: position.column,
					},
					priority: 1.8,
				});
			} else {
				// Component without props
				possibilities.push({
					construct: {
						type: "component",
						start: startPos + componentMatch.index,
						end: startPos + componentMatch.index +
							componentMatch[0].length,
						variable: content.replace(/['"]/g, ""), // Remove quotes from component name
						helperArgs: "",
						line: position.line,
						column: position.column,
					},
					priority: 1.8,
				});
			}
		}

		// Simple variable {{variable}} - high priority
		const varMatch = remaining.match(/\{\{([^#/>!][^}]*)\}\}/);
		if (varMatch && varMatch.index !== undefined) {
			const position = lineTracker.getPosition(startPos + varMatch.index);
			possibilities.push({
				construct: {
					type: "variable",
					start: startPos + varMatch.index,
					end: startPos + varMatch.index + varMatch[0].length,
					variable: varMatch[1].trim(),
					line: position.line,
					column: position.column,
				},
				priority: 2,
			});
		} // Each block {{#each}} ... {{/each}} - lower priority (complex)
		const eachMatch = remaining.match(/\{\{#each\s+([^}]+)\}\}/);
		if (eachMatch && eachMatch.index !== undefined) {
			const blockStart = startPos + eachMatch.index;
			const blockEnd = findMatchingBlockEnd(template, blockStart, "each");
			if (blockEnd > blockStart) {
				const position = lineTracker.getPosition(blockStart);
				const contentStart = blockStart + eachMatch[0].length;
				const contentEnd = blockEnd - "{{/each}}".length;
				possibilities.push({
					construct: {
						type: "each",
						start: blockStart,
						end: blockEnd,
						variable: eachMatch[1].trim(),
						content: template.slice(contentStart, contentEnd),
						line: position.line,
						column: position.column,
					},
					priority: 3,
				});
			} else {
				const position = lineTracker.getPosition(blockStart);
				throw new TemplateSyntaxError(
					"Unclosed each block",
					position.line,
					position.column,
					templateName,
					lineTracker.getContext(blockStart),
				);
			}
		}

		// Block helper {{#helperName}} ... {{/helperName}} - similar priority to each
		const blockHelperMatch = remaining.match(
			/\{\{#(\w+)(?:\s+([^}]*))?\}\}/,
		);
		if (blockHelperMatch && blockHelperMatch.index !== undefined) {
			const helperName = blockHelperMatch[1];
			// Skip built-in helpers
			if (
				!["if", "each", "elseif", "else", "block"].includes(helperName)
			) {
				const blockStart = startPos + blockHelperMatch.index;
				const blockEnd = findMatchingBlockEnd(
					template,
					blockStart,
					helperName,
				);
				if (blockEnd > blockStart) {
					const position = lineTracker.getPosition(blockStart);
					const contentStart = blockStart +
						blockHelperMatch[0].length;
					const contentEnd = blockEnd - `{{/${helperName}}}`.length;
					possibilities.push({
						construct: {
							type: "blockHelper",
							start: blockStart,
							end: blockEnd,
							variable: helperName,
							content: template.slice(contentStart, contentEnd),
							helperArgs: blockHelperMatch[2]?.trim() || "",
							line: position.line,
							column: position.column,
						},
						priority: 3,
					});
				} else {
					const position = lineTracker.getPosition(blockStart);
					throw new TemplateSyntaxError(
						`Unclosed block helper "${helperName}"`,
						position.line,
						position.column,
						templateName,
						lineTracker.getContext(blockStart),
					);
				}
			}
		}
		// If block {{#if}} ... {{#elseif}} ... {{#else}} ... {{/if}} - lowest priority (most complex)
		const ifMatch = remaining.match(/\{\{#if\s+([^}]+)\}\}/);
		if (ifMatch && ifMatch.index !== undefined) {
			const blockStart = startPos + ifMatch.index;
			const blockEnd = findMatchingBlockEnd(template, blockStart, "if");
			if (blockEnd > blockStart) {
				const position = lineTracker.getPosition(blockStart);
				const contentStart = blockStart + ifMatch[0].length;
				const contentEnd = blockEnd - "{{/if}}".length;
				const fullContent = template.slice(contentStart, contentEnd);

				// Parse if-elseif-else structure
				const ifElseStructure = parseIfElseStructure(fullContent);

				possibilities.push({
					construct: {
						type: "if",
						start: blockStart,
						end: blockEnd,
						condition: ifMatch[1].trim(),
						content: ifElseStructure.ifContent,
						elseContent: ifElseStructure.elseContent,
						elseifConditions: ifElseStructure.elseifConditions,
						line: position.line,
						column: position.column,
					},
					priority: 4,
				});
			} else {
				const position = lineTracker.getPosition(blockStart);
				throw new TemplateSyntaxError(
					"Unclosed if block",
					position.line,
					position.column,
					templateName,
					lineTracker.getContext(blockStart),
				);
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
	} catch (error) {
		if (error instanceof TemplateError) {
			throw error;
		}
		const position = lineTracker.getPosition(startPos);
		throw new TemplateSyntaxError(
			`Error parsing template: ${
				error instanceof Error ? error.message : String(error)
			}`,
			position.line,
			position.column,
			templateName,
			lineTracker.getContext(startPos),
		);
	}
}

/**
 * Find the matching end tag for a block, handling nesting
 */
function findMatchingBlockEnd(
	template: string,
	blockStart: number,
	blockType: string,
): number {
	const openPattern = new RegExp(`\\{\\{#${blockType}\\b[^}]*\\}\\}`, "g");
	const closePattern = new RegExp(`\\{\\{\\/${blockType}\\}\\}`, "g");

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
function generateConstructCode(
	construct: TemplateConstruct,
	options: CompilerOptions,
	dataVar: string,
	lineTracker: LineTracker,
	templateName?: string,
): string {
	try {
		switch (construct.type) {
			case "variable":
				return generateVariableCode(
					construct.variable!,
					options,
					dataVar,
				);
			case "layout":
				return generateLayoutCode(
					construct.variable!,
					options,
					dataVar,
				);
			case "each":
				return generateEachCode(
					construct.variable!,
					construct.content!,
					options,
					dataVar,
					lineTracker,
					templateName,
				);
			case "blockHelper":
				return generateBlockHelperCode(
					construct.variable!,
					construct.content!,
					construct.helperArgs || "",
					options,
					dataVar,
					lineTracker,
					templateName,
				);
			case "helper":
				return generateHelperCall(
					construct.variable!,
					construct.helperArgs || "",
					{ escape: false },
					dataVar,
				);
			case "component":
				return generateComponentCode(
					construct.variable!,
					construct.helperArgs || "",
					options,
					dataVar,
				);
			case "raw":
				return generateRawCode(construct.content!);
			case "if":
				return generateIfCode(
					construct.condition!,
					construct.content!,
					construct.elseContent || "",
					construct.elseifConditions || [],
					options,
					dataVar,
					lineTracker,
					templateName,
				);
			case "extends":
				return generateExtendsCode(construct.variable!, templateName);
			case "block":
				return generateBlockCode(
					construct.variable!,
					construct.content!,
					templateName,
				);
			default:
				throw new Error(
					`Unknown construct type: ${
						(construct as TemplateConstruct).type
					}`,
				);
		}
	} catch (error) {
		if (error instanceof TemplateError) {
			throw error;
		}
		throw new TemplateSyntaxError(
			`Error generating code for ${construct.type}: ${
				error instanceof Error ? error.message : String(error)
			}`,
			construct.line,
			construct.column,
			templateName,
			construct.line
				? lineTracker.getContext(construct.start)
				: undefined,
		);
	}
}

/**
 * Generate code for a variable
 */
function generateVariableCode(
	variable: string,
	options: CompilerOptions,
	dataVar: string,
): string {
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
function generateLayoutCode(
	layoutName: string,
	options: CompilerOptions,
	dataVar: string,
): string {
	return `
{
    if (layouts.has(${JSON.stringify(layoutName)})) {
        const layoutFunction = compileLayout(${JSON.stringify(layoutName)}, ${
		JSON.stringify(
			options,
		)
	});
        result += layoutFunction(${dataVar});
    }
}
`;
}

/**
 * Generate code for a component
 */
function generateComponentCode(
	componentName: string,
	propsString: string,
	options: CompilerOptions,
	dataVar: string,
): string {
	const varName = `component_${Math.random().toString(36).substr(2, 9)}`;
	const propsVar = `props_${Math.random().toString(36).substr(2, 9)}`;

	// Parse component props
	const { args, hash } = parseHelperArguments(propsString);

	// Generate code to build props object
	const propsEntries: string[] = [];

	// Add positional arguments as numbered props
	args.forEach((arg, index) => {
		if (
			(arg.startsWith('"') && arg.endsWith('"')) ||
			(arg.startsWith("'") && arg.endsWith("'"))
		) {
			propsEntries.push(`${JSON.stringify(index.toString())}: ${arg}`);
		} else {
			propsEntries.push(
				`${JSON.stringify(index.toString())}: ${
					generateDataAccessor(
						arg,
						dataVar,
					)
				}`,
			);
		}
	});

	// Add named props from hash
	Object.entries(hash).forEach(([key, value]) => {
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			propsEntries.push(
				`${JSON.stringify(key)}: ${JSON.stringify(value.slice(1, -1))}`,
			);
		} else {
			propsEntries.push(
				`${JSON.stringify(key)}: ${
					generateDataAccessor(value, dataVar)
				}`,
			);
		}
	});
	const propsCode = propsEntries.length > 0
		? `const ${propsVar} = {${
			propsEntries.join(
				", ",
			)
		}, '@parent': ${dataVar}};`
		: `const ${propsVar} = {'@parent': ${dataVar}};`;

	return `
{
    if (components.has(${JSON.stringify(componentName)})) {
        ${propsCode}
        const ${varName} = compileComponent(${JSON.stringify(componentName)}, ${
		JSON.stringify(
			options,
		)
	});
        result += ${varName}(${propsVar});
    }
}
`;
}

/**
 * Generate code for an each loop
 */
function generateEachCode(
	variable: string,
	content: string,
	options: CompilerOptions,
	dataVar: string,
	lineTracker: LineTracker,
	templateName?: string,
): string {
	const accessor = generateDataAccessor(variable, dataVar);
	const itemVar = `item_${Math.random().toString(36).substr(2, 9)}`;
	const indexVar = `index_${Math.random().toString(36).substr(2, 9)}`;

	const innerCode = processTemplate(
		content,
		options,
		itemVar,
		lineTracker,
		templateName,
	);

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
function generateBlockHelperCode(
	helperName: string,
	content: string,
	helperArgs: string,
	options: CompilerOptions,
	dataVar: string,
	lineTracker?: LineTracker,
	templateName?: string,
): string {
	const { args, hash } = parseHelperArguments(helperArgs);

	const fnName = `fn_${Math.random().toString(36).substr(2, 9)}`;
	const inverseName = `inverse_${Math.random().toString(36).substr(2, 9)}`;
	const hashName = `hash_${Math.random().toString(36).substr(2, 9)}`;
	const resultName = `result_${Math.random().toString(36).substr(2, 9)}`;

	// Parse if/else structure in the block content
	const blockStructure = parseBlockHelperStructure(content);

	// Use a fallback lineTracker if not provided
	const tracker = lineTracker || new LineTracker(content);

	// Generate hash object
	const hashCode = Object.entries(hash).length > 0
		? `const ${hashName} = {${
			Object.entries(hash)
				.map(([key, value]) => {
					// If value is a quoted string, use it as a literal
					if (
						(value.startsWith('"') && value.endsWith('"')) ||
						(value.startsWith("'") && value.endsWith("'"))
					) {
						return `${JSON.stringify(key)}: ${
							JSON.stringify(
								value.slice(1, -1),
							)
						}`;
					} else {
						// Otherwise treat as a data accessor
						return `${JSON.stringify(key)}: ${
							generateDataAccessor(
								value,
								dataVar,
							)
						}`;
					}
				})
				.join(", ")
		}};`
		: `const ${hashName} = {};`;

	// Generate the fn and inverse functions
	const fnCode = `
        const ${fnName} = (context) => {
            const childData = context || ${dataVar};
            let childResult = '';
            ${
		processTemplate(
			blockStructure.mainContent,
			options,
			"childData",
			tracker,
			templateName,
		).replace(/result \+=/g, "childResult +=")
	}
            return childResult;
        };
    `;

	const inverseCode = `
        const ${inverseName} = (context) => {
            const childData = context || ${dataVar};
            let childResult = '';
            ${
		processTemplate(
			blockStructure.elseContent,
			options,
			"childData",
			tracker,
			templateName,
		).replace(/result \+=/g, "childResult +=")
	}
            return childResult;
        };
    `;

	// Generate the helper call
	let contextArg = dataVar;
	if (args.length > 0) {
		const firstArg = args[0];
		// If first argument is a quoted string, use it as a literal
		if (
			(firstArg.startsWith('"') && firstArg.endsWith('"')) ||
			(firstArg.startsWith("'") && firstArg.endsWith("'"))
		) {
			contextArg = JSON.stringify(firstArg.slice(1, -1));
		} else if (firstArg === "true") {
			contextArg = "true";
		} else if (firstArg === "false") {
			contextArg = "false";
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
        const ${resultName} = helpers.get(${
		JSON.stringify(
			helperName,
		)
	})?.call(null, ${contextArg}, helperOptions);
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
	elseifConditions: Array<{ condition: string; content: string }>,
	options: CompilerOptions,
	dataVar: string,
	lineTracker: LineTracker,
	templateName?: string,
): string {
	const conditionCode = generateConditionCode(condition, dataVar);
	const ifCode = processTemplate(
		content,
		options,
		dataVar,
		lineTracker,
		templateName,
	);

	let code = `
{
    if (${conditionCode}) {
        ${ifCode}`;

	// Add elseif blocks
	for (const elseif of elseifConditions) {
		const elseifConditionCode = generateConditionCode(
			elseif.condition,
			dataVar,
		);
		const elseifCode = processTemplate(
			elseif.content,
			options,
			dataVar,
			lineTracker,
			templateName,
		);
		code += `
    } else if (${elseifConditionCode}) {
        ${elseifCode}`;
	}

	// Add else block if present
	if (elseContent) {
		const elseCode = processTemplate(
			elseContent,
			options,
			dataVar,
			lineTracker,
			templateName,
		);
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
	if (path === "this") {
		return dataVar;
	}
	// Handle @parent special case
	if (path.startsWith("@parent")) {
		if (path === "@parent") {
			return `${dataVar}?.['@parent']`;
		} else {
			// Handle @parent.property
			const subPath = path.slice(8); // Remove '@parent.'
			return `${dataVar}?.['@parent']${generateSubPath(subPath)}`;
		}
	}

	// Handle simple property access
	if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(path)) {
		return `${dataVar}?.${path}`;
	}

	// Handle complex paths with dots
	const parts = path.split(".");
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
 * Helper function to generate sub-path accessors
 */
function generateSubPath(path: string): string {
	const parts = path.split(".");
	let accessor = "";

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

	// Replace property paths from right to left to avoid nested replacements
	// This includes both @parent.xxx and regular.property.paths
	code = code.replace(
		/(@parent(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*|[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)+|[a-zA-Z_][a-zA-Z0-9_]*)\b/g,
		(match) => {
			// Don't replace reserved words or numbers
			if (
				["true", "false", "null", "undefined", "typeof", "instanceof"]
					.includes(
						match,
					)
			) {
				return match;
			}
			if (/^\d+$/.test(match)) {
				return match;
			}
			// Skip if it looks like already processed (contains operators)
			if (match.includes("?.") || match.includes("[")) {
				return match;
			}
			return generateDataAccessor(match, dataVar);
		},
	);

	return `!!(${code})`;
}

/**
 * Parse if-elseif-else structure from content
 */
function parseIfElseStructure(content: string): {
	ifContent: string;
	elseifConditions: Array<{ condition: string; content: string }>;
	elseContent: string;
} {
	const elseifConditions: Array<{ condition: string; content: string }> = [];
	let ifContent = content;
	let elseContent = "";

	// Find all {{#elseif}} blocks
	const elseifPattern = /\{\{#elseif\s+([^}]+)\}\}/g;
	const elsePattern = /\{\{#else\}\}/;

	const elseifMatches: Array<{
		condition: string;
		index: number;
		length: number;
	}> = [];
	let match: RegExpExecArray | null;

	while ((match = elseifPattern.exec(content)) !== null) {
		elseifMatches.push({
			condition: match[1].trim(),
			index: match.index,
			length: match[0].length,
		});
	}

	const elseMatch = content.match(elsePattern);
	const elseIndex = elseMatch ? elseMatch.index! : -1;

	if (elseifMatches.length > 0 || elseIndex >= 0) {
		// Complex if-elseif-else structure

		// Get if content (up to first elseif or else)
		const firstBoundary = elseifMatches.length > 0
			? elseifMatches[0].index
			: elseIndex;
		if (firstBoundary >= 0) {
			ifContent = content.slice(0, firstBoundary).trim();
		}

		// Process elseif blocks
		for (let i = 0; i < elseifMatches.length; i++) {
			const elseifMatch = elseifMatches[i];
			const nextBoundary = i + 1 < elseifMatches.length
				? elseifMatches[i + 1].index
				: elseIndex >= 0
				? elseIndex
				: content.length;

			const elseifContent = content
				.slice(elseifMatch.index + elseifMatch.length, nextBoundary)
				.trim();

			elseifConditions.push({
				condition: elseifMatch.condition,
				content: elseifContent,
			});
		}

		// Get else content
		if (elseIndex >= 0) {
			elseContent = content.slice(elseIndex + elseMatch![0].length)
				.trim();
		}
	}

	return { ifContent, elseifConditions, elseContent };
}

/**
 * Parse block helper structure to separate main content from else content
 */
function parseBlockHelperStructure(content: string): {
	mainContent: string;
	elseContent: string;
} {
	const elsePattern = /\{\{else\}\}/;
	const elseMatch = content.match(elsePattern);

	if (elseMatch && elseMatch.index !== undefined) {
		const mainContent = content.slice(0, elseMatch.index).trim();
		const elseContent = content
			.slice(elseMatch.index + elseMatch[0].length)
			.trim();
		return { mainContent, elseContent };
	}

	return { mainContent: content, elseContent: "" };
}

/**
 * Generate helper call with options support
 */
function generateHelperCall(
	helperName: string,
	helperArgs: string,
	options: CompilerOptions,
	dataVar: string,
): string {
	// Parse helper arguments
	const { args } = parseHelperArguments(helperArgs);

	const varName = `helper_${Math.random().toString(36).substr(2, 9)}`;

	// Generate code to call helper
	const helperCode = args.length > 0
		? `const ${varName} = helpers.get(${
			JSON.stringify(
				helperName,
			)
		})?.call(null, ${
			args
				.map((arg) => {
					// Check if argument is a quoted string literal
					if (
						(arg.startsWith('"') && arg.endsWith('"')) ||
						(arg.startsWith("'") && arg.endsWith("'"))
					) {
						// Return the string literal as-is (it will be a JavaScript string)
						return arg;
					} else {
						// Treat as a data accessor (variable)
						return generateDataAccessor(arg, dataVar);
					}
				})
				.join(", ")
		});`
		: `const ${varName} = helpers.get(${
			JSON.stringify(
				helperName,
			)
		})?.call(null);`;
	if (options.escape) {
		return `
{
    if (helpers.has(${JSON.stringify(helperName)})) {
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
function parseHelperArguments(argsString: string): {
	args: string[];
	hash: Record<string, string>;
} {
	const args: string[] = [];
	const hash: Record<string, string> = {};

	// More sophisticated parsing that handles quoted strings
	const tokens = tokenizeArguments(argsString.trim());

	for (const token of tokens) {
		if (token.includes("=")) {
			const eqIndex = token.indexOf("=");
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
	let current = "";
	let inQuotes = false;
	let quoteChar = "";

	for (let i = 0; i < input.length; i++) {
		const char = input[i];

		if (!inQuotes && (char === '"' || char === "'")) {
			inQuotes = true;
			quoteChar = char;
			current += char;
		} else if (inQuotes && char === quoteChar) {
			inQuotes = false;
			current += char;
		} else if (!inQuotes && char === " ") {
			if (current.trim()) {
				tokens.push(current.trim());
				current = "";
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

/**
 * Generate code for raw output (no template processing)
 */
function generateRawCode(content: string): string {
	// Escape the content to prevent JavaScript injection and properly handle quotes
	const escapedContent = JSON.stringify(content);
	return `result += ${escapedContent};\n`;
}

/**
 * Generate code for template inheritance extends
 */
function generateExtendsCode(
	baseTemplateName: string,
	_templateName?: string,
): string {
	return `
{
    // Handle template extends
    const baseTemplate = layouts.get(${
		JSON.stringify(
			baseTemplateName,
		)
	}) || components.get(${JSON.stringify(baseTemplateName)});
    if (!baseTemplate) {
        throw new Error('Base template "' + ${
		JSON.stringify(
			baseTemplateName,
		)
	} + '" not found');
    }
    const baseCompiled = compileLayout(${
		JSON.stringify(
			baseTemplateName,
		)
	}, { escape: true });
    result += baseCompiled(data);
}
`;
}

/**
 * Generate code for block definition
 */
function generateBlockCode(
	blockName: string,
	content: string,
	templateName?: string,
): string {
	// Store block content for inheritance
	const blockKey = templateName || "anonymous";
	return `
{
    // Define block for inheritance
    if (!templateBlocks.has(${JSON.stringify(blockKey)})) {
        templateBlocks.set(${JSON.stringify(blockKey)}, new Map());
    }
    templateBlocks.get(${JSON.stringify(blockKey)}).set(${
		JSON.stringify(
			blockName,
		)
	}, ${JSON.stringify(content)});

    // Render block content immediately (can be overridden)
    ${
		processTemplate(
			content,
			{ escape: true },
			"data",
			new LineTracker(content),
			templateName,
		)
	}
}
`;
}
