// src/engine.ts
var ESCAPE_TABLE = new Array(256);
ESCAPE_TABLE[38] = "&amp;";
ESCAPE_TABLE[60] = "&lt;";
ESCAPE_TABLE[62] = "&gt;";
ESCAPE_TABLE[34] = "&quot;";
ESCAPE_TABLE[39] = "&#39;";
ESCAPE_TABLE[96] = "&#x60;";
function escape(text) {
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
var layouts = /* @__PURE__ */ new Map();
var layoutCache = /* @__PURE__ */ new Map();
var compiledCache = /* @__PURE__ */ new Map();
var helpers = /* @__PURE__ */ new Map();
var blockHelpers = /* @__PURE__ */ new Map();
var components = /* @__PURE__ */ new Map();
var componentCache = /* @__PURE__ */ new Map();
function registerLayout(name, content) {
  layouts.set(name, content);
  layoutCache.delete(name);
}
function registerComponent(name, template) {
  components.set(name, template);
  componentCache.delete(name);
}
function registerHelper(name, fn) {
  helpers.set(name, fn);
}
function registerBlockHelper(name, fn) {
  blockHelpers.set(name, fn);
  helpers.set(name, fn);
}
function renderTemplate(_key, data, template) {
  const compiled = compile(template);
  return compiled(data);
}
function compile(template, options = {
  escape: true
}) {
  const cacheKey = template + JSON.stringify(options);
  if (compiledCache.has(cacheKey)) {
    return compiledCache.get(cacheKey);
  }
  const functionBody = compileToJS(template, options);
  const compiledFunction = new Function("data", "layouts", "layoutCache", "compileLayout", "escape", "helpers", "components", "componentCache", "compileComponent", functionBody);
  const compileLayout = (name, options2) => {
    if (layoutCache.has(name)) {
      return layoutCache.get(name);
    }
    const layoutTemplate = layouts.get(name);
    if (!layoutTemplate) return () => "";
    const layoutFunction = compile(layoutTemplate, options2);
    layoutCache.set(name, layoutFunction);
    return layoutFunction;
  };
  const compileComponent = (name, options2) => {
    if (componentCache.has(name)) {
      return componentCache.get(name);
    }
    const componentTemplate = components.get(name);
    if (!componentTemplate) return () => "";
    const componentFunction = compile(componentTemplate, options2);
    componentCache.set(name, componentFunction);
    return componentFunction;
  };
  const boundFunction = (data) => compiledFunction(data, layouts, layoutCache, compileLayout, escape, helpers, components, componentCache, compileComponent);
  compiledCache.set(cacheKey, boundFunction);
  return boundFunction;
}
function compileToJS(template, options) {
  let code = 'let result = "";\n';
  code += processTemplate(template, options, "data");
  code += "return result;\n";
  return code;
}
function processTemplate(template, options, dataVar) {
  let code = "";
  let pos = 0;
  while (pos < template.length) {
    const nextConstruct = findNextConstruct(template, pos);
    if (!nextConstruct) {
      const remaining = template.slice(pos);
      if (remaining) {
        code += `result += ${JSON.stringify(remaining)};
`;
      }
      break;
    }
    if (nextConstruct.start > pos) {
      const staticContent = template.slice(pos, nextConstruct.start);
      if (staticContent) {
        code += `result += ${JSON.stringify(staticContent)};
`;
      }
    }
    code += generateConstructCode(nextConstruct, options, dataVar);
    pos = nextConstruct.end;
  }
  return code;
}
function findNextConstruct(template, startPos) {
  const remaining = template.slice(startPos);
  const possibilities = [];
  const rawMatch = remaining.match(/\{\{\{\{raw\}\}\}\}/);
  if (rawMatch && rawMatch.index !== void 0) {
    const blockStart = startPos + rawMatch.index;
    const blockEnd = template.indexOf("{{{{/raw}}}}", blockStart);
    if (blockEnd > blockStart) {
      const contentStart = blockStart + rawMatch[0].length;
      const contentEnd = blockEnd;
      possibilities.push({
        construct: {
          type: "raw",
          start: blockStart,
          end: blockEnd + "{{{{/raw}}}}".length,
          content: template.slice(contentStart, contentEnd)
        },
        priority: 0.5
      });
    }
  }
  const layoutMatch = remaining.match(/\{\{>\s*([^}]+)\}\}/);
  if (layoutMatch && layoutMatch.index !== void 0) {
    possibilities.push({
      construct: {
        type: "layout",
        start: startPos + layoutMatch.index,
        end: startPos + layoutMatch.index + layoutMatch[0].length,
        variable: layoutMatch[1].trim()
      },
      priority: 1
    });
  }
  const tripleMatch = remaining.match(/\{\{\{([^}]+)\}\}\}/);
  if (tripleMatch && tripleMatch.index !== void 0) {
    const content = tripleMatch[1].trim();
    const spaceIndex = content.indexOf(" ");
    if (spaceIndex > 0) {
      const helperName = content.slice(0, spaceIndex);
      const helperArgs = content.slice(spaceIndex + 1);
      possibilities.push({
        construct: {
          type: "helper",
          start: startPos + tripleMatch.index,
          end: startPos + tripleMatch.index + tripleMatch[0].length,
          variable: helperName,
          helperArgs
        },
        priority: 1.5
      });
    } else {
      possibilities.push({
        construct: {
          type: "helper",
          start: startPos + tripleMatch.index,
          end: startPos + tripleMatch.index + tripleMatch[0].length,
          variable: content,
          helperArgs: ""
        },
        priority: 1.5
      });
    }
  }
  const componentMatch = remaining.match(/\{\{component\s+([^}]+)\}\}/);
  if (componentMatch && componentMatch.index !== void 0) {
    const content = componentMatch[1].trim();
    const spaceIndex = content.indexOf(" ");
    if (spaceIndex > 0) {
      const componentName = content.slice(0, spaceIndex);
      const componentProps = content.slice(spaceIndex + 1);
      possibilities.push({
        construct: {
          type: "component",
          start: startPos + componentMatch.index,
          end: startPos + componentMatch.index + componentMatch[0].length,
          variable: componentName.replace(/['"]/g, ""),
          helperArgs: componentProps
        },
        priority: 1.8
      });
    } else {
      possibilities.push({
        construct: {
          type: "component",
          start: startPos + componentMatch.index,
          end: startPos + componentMatch.index + componentMatch[0].length,
          variable: content.replace(/['"]/g, ""),
          helperArgs: ""
        },
        priority: 1.8
      });
    }
  }
  const varMatch = remaining.match(/\{\{([^#/>!][^}]*)\}\}/);
  if (varMatch && varMatch.index !== void 0) {
    possibilities.push({
      construct: {
        type: "variable",
        start: startPos + varMatch.index,
        end: startPos + varMatch.index + varMatch[0].length,
        variable: varMatch[1].trim()
      },
      priority: 2
    });
  }
  const eachMatch = remaining.match(/\{\{#each\s+([^}]+)\}\}/);
  if (eachMatch && eachMatch.index !== void 0) {
    const blockStart = startPos + eachMatch.index;
    const blockEnd = findMatchingBlockEnd(template, blockStart, "each");
    if (blockEnd > blockStart) {
      const contentStart = blockStart + eachMatch[0].length;
      const contentEnd = blockEnd - "{{/each}}".length;
      possibilities.push({
        construct: {
          type: "each",
          start: blockStart,
          end: blockEnd,
          variable: eachMatch[1].trim(),
          content: template.slice(contentStart, contentEnd)
        },
        priority: 3
      });
    }
  }
  const blockHelperMatch = remaining.match(/\{\{#(\w+)(?:\s+([^}]*))?\}\}/);
  if (blockHelperMatch && blockHelperMatch.index !== void 0) {
    const helperName = blockHelperMatch[1];
    if (![
      "if",
      "each",
      "elseif",
      "else"
    ].includes(helperName)) {
      const blockStart = startPos + blockHelperMatch.index;
      const blockEnd = findMatchingBlockEnd(template, blockStart, helperName);
      if (blockEnd > blockStart) {
        const contentStart = blockStart + blockHelperMatch[0].length;
        const contentEnd = blockEnd - `{{/${helperName}}}`.length;
        possibilities.push({
          construct: {
            type: "blockHelper",
            start: blockStart,
            end: blockEnd,
            variable: helperName,
            content: template.slice(contentStart, contentEnd),
            helperArgs: blockHelperMatch[2]?.trim() || ""
          },
          priority: 3
        });
      }
    }
  }
  const ifMatch = remaining.match(/\{\{#if\s+([^}]+)\}\}/);
  if (ifMatch && ifMatch.index !== void 0) {
    const blockStart = startPos + ifMatch.index;
    const blockEnd = findMatchingBlockEnd(template, blockStart, "if");
    if (blockEnd > blockStart) {
      const contentStart = blockStart + ifMatch[0].length;
      const contentEnd = blockEnd - "{{/if}}".length;
      const fullContent = template.slice(contentStart, contentEnd);
      const ifElseStructure = parseIfElseStructure(fullContent);
      possibilities.push({
        construct: {
          type: "if",
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
  possibilities.sort((a, b) => {
    if (a.construct.start !== b.construct.start) {
      return a.construct.start - b.construct.start;
    }
    return a.priority - b.priority;
  });
  return possibilities[0].construct;
}
function findMatchingBlockEnd(template, blockStart, blockType) {
  const openPattern = new RegExp(`\\{\\{#${blockType}\\b[^}]*\\}\\}`, "g");
  const closePattern = new RegExp(`\\{\\{\\/${blockType}\\}\\}`, "g");
  let depth = 0;
  let pos = blockStart;
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
    if (!nextClose) break;
    if (nextOpen && nextOpen.index < nextClose.index) {
      depth++;
      pos = nextOpen.index + nextOpen[0].length;
    } else {
      depth--;
      pos = nextClose.index + nextClose[0].length;
      if (depth === 0) {
        return pos;
      }
    }
  }
  return template.length;
}
function generateConstructCode(construct, options, dataVar) {
  switch (construct.type) {
    case "variable":
      return generateVariableCode(construct.variable, options, dataVar);
    case "layout":
      return generateLayoutCode(construct.variable, options, dataVar);
    case "each":
      return generateEachCode(construct.variable, construct.content, options, dataVar);
    case "blockHelper":
      return generateBlockHelperCode(construct.variable, construct.content, construct.helperArgs || "", options, dataVar);
    case "helper":
      return generateHelperCall(construct.variable, construct.helperArgs || "", {
        escape: false
      }, dataVar);
    case "component":
      return generateComponentCode(construct.variable, construct.helperArgs || "", options, dataVar);
    case "raw":
      return generateRawCode(construct.content);
    case "if":
      return generateIfCode(construct.condition, construct.content, construct.elseContent || "", construct.elseifConditions || [], options, dataVar);
    default:
      return "";
  }
}
function generateVariableCode(variable, options, dataVar) {
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
function generateLayoutCode(layoutName, options, dataVar) {
  return `
{
    if (layouts.has(${JSON.stringify(layoutName)})) {
        const layoutFunction = compileLayout(${JSON.stringify(layoutName)}, ${JSON.stringify(options)});
        result += layoutFunction(${dataVar});
    }
}
`;
}
function generateComponentCode(componentName, propsString, options, dataVar) {
  const varName = `component_${Math.random().toString(36).substr(2, 9)}`;
  const propsVar = `props_${Math.random().toString(36).substr(2, 9)}`;
  const { args, hash } = parseHelperArguments(propsString);
  const propsEntries = [];
  args.forEach((arg, index) => {
    if (arg.startsWith('"') && arg.endsWith('"') || arg.startsWith("'") && arg.endsWith("'")) {
      propsEntries.push(`${JSON.stringify(index.toString())}: ${arg}`);
    } else {
      propsEntries.push(`${JSON.stringify(index.toString())}: ${generateDataAccessor(arg, dataVar)}`);
    }
  });
  Object.entries(hash).forEach(([key, value]) => {
    if (value.startsWith('"') && value.endsWith('"') || value.startsWith("'") && value.endsWith("'")) {
      propsEntries.push(`${JSON.stringify(key)}: ${JSON.stringify(value.slice(1, -1))}`);
    } else {
      propsEntries.push(`${JSON.stringify(key)}: ${generateDataAccessor(value, dataVar)}`);
    }
  });
  const propsCode = propsEntries.length > 0 ? `const ${propsVar} = {${propsEntries.join(", ")}, '@parent': ${dataVar}};` : `const ${propsVar} = {'@parent': ${dataVar}};`;
  return `
{
    if (components.has(${JSON.stringify(componentName)})) {
        ${propsCode}
        const ${varName} = compileComponent(${JSON.stringify(componentName)}, ${JSON.stringify(options)});
        result += ${varName}(${propsVar});
    }
}
`;
}
function generateEachCode(variable, content, options, dataVar) {
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
function generateBlockHelperCode(helperName, content, helperArgs, options, dataVar) {
  const { args, hash } = parseHelperArguments(helperArgs);
  const fnName = `fn_${Math.random().toString(36).substr(2, 9)}`;
  const inverseName = `inverse_${Math.random().toString(36).substr(2, 9)}`;
  const hashName = `hash_${Math.random().toString(36).substr(2, 9)}`;
  const resultName = `result_${Math.random().toString(36).substr(2, 9)}`;
  const blockStructure = parseBlockHelperStructure(content);
  const hashCode = Object.entries(hash).length > 0 ? `const ${hashName} = {${Object.entries(hash).map(([key, value]) => {
    if (value.startsWith('"') && value.endsWith('"') || value.startsWith("'") && value.endsWith("'")) {
      return `${JSON.stringify(key)}: ${JSON.stringify(value.slice(1, -1))}`;
    } else {
      return `${JSON.stringify(key)}: ${generateDataAccessor(value, dataVar)}`;
    }
  }).join(", ")}};` : `const ${hashName} = {};`;
  const fnCode = `
        const ${fnName} = (context) => {
            const childData = context || ${dataVar};
            let childResult = '';
            ${processTemplate(blockStructure.mainContent, options, "childData").replace(/result \+=/g, "childResult +=")}
            return childResult;
        };
    `;
  const inverseCode = `
        const ${inverseName} = (context) => {
            const childData = context || ${dataVar};
            let childResult = '';
            ${processTemplate(blockStructure.elseContent, options, "childData").replace(/result \+=/g, "childResult +=")}
            return childResult;
        };
    `;
  let contextArg = dataVar;
  if (args.length > 0) {
    const firstArg = args[0];
    if (firstArg.startsWith('"') && firstArg.endsWith('"') || firstArg.startsWith("'") && firstArg.endsWith("'")) {
      contextArg = JSON.stringify(firstArg.slice(1, -1));
    } else if (firstArg === "true") {
      contextArg = "true";
    } else if (firstArg === "false") {
      contextArg = "false";
    } else if (/^\d+$/.test(firstArg)) {
      contextArg = firstArg;
    } else {
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
function generateIfCode(condition, content, elseContent, elseifConditions, options, dataVar) {
  const conditionCode = generateConditionCode(condition, dataVar);
  const ifCode = processTemplate(content, options, dataVar);
  let code = `
{
    if (${conditionCode}) {
        ${ifCode}`;
  for (const elseif of elseifConditions) {
    const elseifConditionCode = generateConditionCode(elseif.condition, dataVar);
    const elseifCode = processTemplate(elseif.content, options, dataVar);
    code += `
    } else if (${elseifConditionCode}) {
        ${elseifCode}`;
  }
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
function generateDataAccessor(path, dataVar) {
  if (path === "this") {
    return dataVar;
  }
  if (path.startsWith("@parent")) {
    if (path === "@parent") {
      return `${dataVar}?.['@parent']`;
    } else {
      const subPath = path.slice(8);
      return `${dataVar}?.['@parent']${generateSubPath(subPath)}`;
    }
  }
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(path)) {
    return `${dataVar}?.${path}`;
  }
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
function generateSubPath(path) {
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
function generateConditionCode(condition, dataVar) {
  let code = condition.trim();
  code = code.replace(/(@parent(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*|[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)+|[a-zA-Z_][a-zA-Z0-9_]*)\b/g, (match) => {
    if ([
      "true",
      "false",
      "null",
      "undefined",
      "typeof",
      "instanceof"
    ].includes(match)) {
      return match;
    }
    if (/^\d+$/.test(match)) {
      return match;
    }
    if (match.includes("?.") || match.includes("[")) {
      return match;
    }
    return generateDataAccessor(match, dataVar);
  });
  return `!!(${code})`;
}
function parseIfElseStructure(content) {
  const elseifConditions = [];
  let ifContent = content;
  let elseContent = "";
  const elseifPattern = /\{\{#elseif\s+([^}]+)\}\}/g;
  const elsePattern = /\{\{#else\}\}/;
  const elseifMatches = [];
  let match;
  while ((match = elseifPattern.exec(content)) !== null) {
    elseifMatches.push({
      condition: match[1].trim(),
      index: match.index,
      length: match[0].length
    });
  }
  const elseMatch = content.match(elsePattern);
  const elseIndex = elseMatch ? elseMatch.index : -1;
  if (elseifMatches.length > 0 || elseIndex >= 0) {
    const firstBoundary = elseifMatches.length > 0 ? elseifMatches[0].index : elseIndex;
    if (firstBoundary >= 0) {
      ifContent = content.slice(0, firstBoundary).trim();
    }
    for (let i = 0; i < elseifMatches.length; i++) {
      const elseifMatch = elseifMatches[i];
      const nextBoundary = i + 1 < elseifMatches.length ? elseifMatches[i + 1].index : elseIndex >= 0 ? elseIndex : content.length;
      const elseifContent = content.slice(elseifMatch.index + elseifMatch.length, nextBoundary).trim();
      elseifConditions.push({
        condition: elseifMatch.condition,
        content: elseifContent
      });
    }
    if (elseIndex >= 0) {
      elseContent = content.slice(elseIndex + elseMatch[0].length).trim();
    }
  }
  return {
    ifContent,
    elseifConditions,
    elseContent
  };
}
function parseBlockHelperStructure(content) {
  const elsePattern = /\{\{else\}\}/;
  const elseMatch = content.match(elsePattern);
  if (elseMatch && elseMatch.index !== void 0) {
    const mainContent = content.slice(0, elseMatch.index).trim();
    const elseContent = content.slice(elseMatch.index + elseMatch[0].length).trim();
    return {
      mainContent,
      elseContent
    };
  }
  return {
    mainContent: content,
    elseContent: ""
  };
}
function generateHelperCall(helperName, helperArgs, options, dataVar) {
  const { args } = parseHelperArguments(helperArgs);
  const varName = `helper_${Math.random().toString(36).substr(2, 9)}`;
  const helperCode = args.length > 0 ? `const ${varName} = helpers.get(${JSON.stringify(helperName)})?.call(null, ${args.map((arg) => {
    if (arg.startsWith('"') && arg.endsWith('"') || arg.startsWith("'") && arg.endsWith("'")) {
      return arg;
    } else {
      return generateDataAccessor(arg, dataVar);
    }
  }).join(", ")});` : `const ${varName} = helpers.get(${JSON.stringify(helperName)})?.call(null);`;
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
function parseHelperArguments(argsString) {
  const args = [];
  const hash = {};
  const tokens = tokenizeArguments(argsString.trim());
  for (const token of tokens) {
    if (token.includes("=")) {
      const eqIndex = token.indexOf("=");
      const key = token.slice(0, eqIndex);
      const value = token.slice(eqIndex + 1);
      hash[key] = value;
    } else {
      args.push(token);
    }
  }
  return {
    args,
    hash
  };
}
function tokenizeArguments(input) {
  const tokens = [];
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
function generateRawCode(content) {
  const escapedContent = JSON.stringify(content);
  return `result += ${escapedContent};
`;
}
export {
  compile,
  registerBlockHelper,
  registerComponent,
  registerHelper,
  registerLayout,
  renderTemplate
};
