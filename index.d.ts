// TypeScript declarations for UWU-Template

export interface CompilerOptions {
    escape: boolean;
}

export interface TemplateData {
    [key: string]: unknown;
}

export interface ComponentProps {
    [key: string]: unknown;
}

export interface HelperContext {
    data: TemplateData;
    parent?: TemplateData;
}

export type HelperFunction = (context: HelperContext, ...args: unknown[]) => string;
export type BlockHelperFunction = (context: HelperContext, options: { fn: (data: TemplateData) => string; inverse: (data: TemplateData) => string }, ...args: unknown[]) => string;
export type ComponentFunction = (props: ComponentProps, children?: string, context?: HelperContext) => string;
export type TemplateFunction = (data: TemplateData) => string;

// Error classes
export declare class TemplateError extends Error {
    line?: number;
    column?: number;
    templateName?: string;
    context?: string;
    
    constructor(
        message: string,
        line?: number,
        column?: number,
        templateName?: string,
        context?: string
    );
}

export declare class TemplateSyntaxError extends TemplateError {
    constructor(message: string, line?: number, column?: number, templateName?: string, context?: string);
}

export declare class TemplateRuntimeError extends TemplateError {
    constructor(message: string, line?: number, column?: number, templateName?: string, context?: string);
}

// Main functions
export declare function compile(
    template: string, 
    options?: CompilerOptions, 
    templateName?: string
): TemplateFunction;

export declare function registerLayout(name: string, template: string): void;

export declare function registerHelper(name: string, helper: HelperFunction): void;

export declare function registerBlockHelper(name: string, helper: BlockHelperFunction): void;

export declare function registerComponent(name: string, component: ComponentFunction): void;

export declare function renderTemplate(
    template: string, 
    data: TemplateData, 
    options?: CompilerOptions, 
    templateName?: string
): string;

export declare function registerBaseTemplate(name: string, template: string): void;

export declare function clearTemplateCache(): void;
