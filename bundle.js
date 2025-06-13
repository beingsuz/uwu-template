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
function registerLayout(name, content) {
  layouts.set(name, content);
  layoutCache.delete(name);
}
function registerHelper(name, fn) {
  helpers.set(name, fn);
}
function renderTemplate(key, data, template) {
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
  const compiledFunction = new Function("data", "layouts", "layoutCache", "compileLayout", "escape", "helpers", functionBody);
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
  const boundFunction = (data) => compiledFunction(data, layouts, layoutCache, compileLayout, escape, helpers);
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
    case "if":
      return generateIfCode(construct.condition, construct.content, construct.elseContent || "", construct.elseifConditions || [], options, dataVar);
    default:
      return "";
  }
}
function generateVariableCode(variable, options, dataVar) {
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
function generateConditionCode(condition, dataVar) {
  let code = condition.trim();
  code = code.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)\b/g, (match, varPath) => {
    if ([
      "true",
      "false",
      "null",
      "undefined",
      "typeof",
      "instanceof"
    ].includes(varPath)) {
      return match;
    }
    if (/^\d+$/.test(varPath)) {
      return match;
    }
    if (varPath.includes(".")) {
      return generateDataAccessor(varPath, dataVar);
    } else {
      return generateDataAccessor(varPath, dataVar);
    }
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
export {
  compile,
  registerHelper,
  registerLayout,
  renderTemplate
};
