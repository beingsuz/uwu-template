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
export type ComponentFunction = (
  props: ComponentProps,
  children?: string,
  context?: HelperContext,
) => string;
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
    context?: string,
  );
}

export declare class TemplateSyntaxError extends TemplateError {
  constructor(
    message: string,
    line?: number,
    column?: number,
    templateName?: string,
    context?: string,
  );
}

export declare class TemplateRuntimeError extends TemplateError {
  constructor(
    message: string,
    line?: number,
    column?: number,
    templateName?: string,
    context?: string,
  );
}

// Main functions
export declare function compile(
  template: string,
  options?: CompilerOptions,
  templateName?: string,
): TemplateFunction;

export declare function registerLayout(name: string, template: string): void;

export declare function registerHelper(
  name: string,
  fn: HelperFunction | BlockHelperFunction,
): void;

export declare function registerBlockHelper(
  name: string,
  fn: BlockHelperFunction,
): void;

export declare function registerComponent(name: string, template: string): void;

export declare function renderTemplate(
  key: string,
  data: unknown,
  template: string,
): string;

export declare function registerBaseTemplate(
  name: string,
  template: string,
): void;

export declare function clearTemplateCache(): void;
