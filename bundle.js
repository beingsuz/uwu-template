var C=new Array(256);C[38]="&amp;";C[60]="&lt;";C[62]="&gt;";C[34]="&quot;";C[39]="&#39;";C[96]="&#x60;";function E(e){let t="",n=0;for(let s=0;s<e.length;s++){let o=e.charCodeAt(s),i=C[o];i&&(t+=e.slice(n,s)+i,n=s+1)}return n===0?e:t+e.slice(n)}var M=new Map,S=new Map,A=new Map,_=new Map,v=new Map,J=new Map,b=new Map;function z(e,t){M.set(e,t),S.delete(e)}function Z(e,t){J.set(e,t),b.delete(e)}function H(e,t){_.set(e,t)}function I(e,t){v.set(e,t),_.set(e,t)}function B(e,t,n){return O(n)(t)}function O(e,t={escape:!0}){let n=e+JSON.stringify(t);if(A.has(n))return A.get(n);let s=R(e,t),o=new Function("data","layouts","layoutCache","compileLayout","escape","helpers","components","componentCache","compileComponent",s),i=(l,f)=>{if(S.has(l))return S.get(l);let d=M.get(l);if(!d)return()=>"";let a=O(d,f);return S.set(l,a),a},r=(l,f)=>{if(b.has(l))return b.get(l);let d=J.get(l);if(!d)return()=>"";let a=O(d,f);return b.set(l,a),a},c=l=>o(l,M,S,i,E,_,J,b,r);return A.set(n,c),c}function R(e,t){let n=`let result = "";
`;return n+=m(e,t,"data"),n+=`return result;
`,n}function m(e,t,n){let s="",o=0;for(;o<e.length;){let i=F(e,o);if(!i){let r=e.slice(o);r&&(s+=`result += ${JSON.stringify(r)};
`);break}if(i.start>o){let r=e.slice(o,i.start);r&&(s+=`result += ${JSON.stringify(r)};
`)}s+=L(i,t,n),o=i.end}return s}function F(e,t){let n=e.slice(t),s=[],o=n.match(/\{\{\{\{raw\}\}\}\}/);if(o&&o.index!==void 0){let u=t+o.index,h=e.indexOf("{{{{/raw}}}}",u);if(h>u){let g=u+o[0].length,p=h;s.push({construct:{type:"raw",start:u,end:h+12,content:e.slice(g,p)},priority:.5})}}let i=n.match(/\{\{>\s*([^}]+)\}\}/);i&&i.index!==void 0&&s.push({construct:{type:"layout",start:t+i.index,end:t+i.index+i[0].length,variable:i[1].trim()},priority:1});let r=n.match(/\{\{\{([^}]+)\}\}\}/);if(r&&r.index!==void 0){let u=r[1].trim(),h=u.indexOf(" ");if(h>0){let g=u.slice(0,h),p=u.slice(h+1);s.push({construct:{type:"helper",start:t+r.index,end:t+r.index+r[0].length,variable:g,helperArgs:p},priority:1.5})}else s.push({construct:{type:"helper",start:t+r.index,end:t+r.index+r[0].length,variable:u,helperArgs:""},priority:1.5})}let c=n.match(/\{\{component\s+([^}]+)\}\}/);if(c&&c.index!==void 0){let u=c[1].trim(),h=u.indexOf(" ");if(h>0){let g=u.slice(0,h),p=u.slice(h+1);s.push({construct:{type:"component",start:t+c.index,end:t+c.index+c[0].length,variable:g.replace(/['"]/g,""),helperArgs:p},priority:1.8})}else s.push({construct:{type:"component",start:t+c.index,end:t+c.index+c[0].length,variable:u.replace(/['"]/g,""),helperArgs:""},priority:1.8})}let l=n.match(/\{\{([^#/>!][^}]*)\}\}/);l&&l.index!==void 0&&s.push({construct:{type:"variable",start:t+l.index,end:t+l.index+l[0].length,variable:l[1].trim()},priority:2});let f=n.match(/\{\{#each\s+([^}]+)\}\}/);if(f&&f.index!==void 0){let u=t+f.index,h=N(e,u,"each");if(h>u){let g=u+f[0].length,p=h-9;s.push({construct:{type:"each",start:u,end:h,variable:f[1].trim(),content:e.slice(g,p)},priority:3})}}let d=n.match(/\{\{#(\w+)(?:\s+([^}]*))?\}\}/);if(d&&d.index!==void 0){let u=d[1];if(!["if","each","elseif","else"].includes(u)){let h=t+d.index,g=N(e,h,u);if(g>h){let p=h+d[0].length,$=g-`{{/${u}}}`.length;s.push({construct:{type:"blockHelper",start:h,end:g,variable:u,content:e.slice(p,$),helperArgs:d[2]?.trim()||""},priority:3})}}}let a=n.match(/\{\{#if\s+([^}]+)\}\}/);if(a&&a.index!==void 0){let u=t+a.index,h=N(e,u,"if");if(h>u){let g=u+a[0].length,p=h-7,$=e.slice(g,p),y=U($);s.push({construct:{type:"if",start:u,end:h,condition:a[1].trim(),content:y.ifContent,elseContent:y.elseContent,elseifConditions:y.elseifConditions},priority:4})}}return s.length===0?null:(s.sort((u,h)=>u.construct.start!==h.construct.start?u.construct.start-h.construct.start:u.priority-h.priority),s[0].construct)}function N(e,t,n){let s=new RegExp(`\\{\\{#${n}\\b[^}]*\\}\\}`,"g"),o=new RegExp(`\\{\\{\\/${n}\\}\\}`,"g"),i=0,r=t;s.lastIndex=r;let c=s.exec(e);for(c&&c.index===r&&(r=c.index+c[0].length,i=1);i>0&&r<e.length;){s.lastIndex=r,o.lastIndex=r;let l=s.exec(e),f=o.exec(e);if(!f)break;if(l&&l.index<f.index)i++,r=l.index+l[0].length;else if(i--,r=f.index+f[0].length,i===0)return r}return e.length}function L(e,t,n){switch(e.type){case"variable":return j(e.variable,t,n);case"layout":return T(e.variable,t,n);case"each":return q(e.variable,e.content,t,n);case"blockHelper":return K(e.variable,e.content,e.helperArgs||"",t,n);case"helper":return W(e.variable,e.helperArgs||"",{escape:!1},n);case"component":return D(e.variable,e.helperArgs||"",t,n);case"raw":return P(e.content);case"if":return Q(e.condition,e.content,e.elseContent||"",e.elseifConditions||[],t,n);default:return""}}function j(e,t,n){let s=e.match(/^(\w+)\s+(.+)$/);if(s){let[,r,c]=s;return W(r,c,t,n)}let o=x(e,n),i=`val_${Math.random().toString(36).substr(2,9)}`;return t.escape?`
{
    let ${i} = ${o};
    if (typeof ${i} === 'string') {
        result += escape(${i});
    } else if (${i} != null) {
        result += String(${i});
    }
}
`:`
{
    let ${i} = ${o};
    if (${i} != null) {
        result += String(${i});
    }
}
`}function T(e,t,n){return`
{
    if (layouts.has(${JSON.stringify(e)})) {
        const layoutFunction = compileLayout(${JSON.stringify(e)}, ${JSON.stringify(t)});
        result += layoutFunction(${n});
    }
}
`}function D(e,t,n,s){let o=`component_${Math.random().toString(36).substr(2,9)}`,i=`props_${Math.random().toString(36).substr(2,9)}`,{args:r,hash:c}=w(t),l=[];r.forEach((d,a)=>{d.startsWith('"')&&d.endsWith('"')||d.startsWith("'")&&d.endsWith("'")?l.push(`${JSON.stringify(a.toString())}: ${d}`):l.push(`${JSON.stringify(a.toString())}: ${x(d,s)}`)}),Object.entries(c).forEach(([d,a])=>{a.startsWith('"')&&a.endsWith('"')||a.startsWith("'")&&a.endsWith("'")?l.push(`${JSON.stringify(d)}: ${JSON.stringify(a.slice(1,-1))}`):l.push(`${JSON.stringify(d)}: ${x(a,s)}`)});let f=l.length>0?`const ${i} = {${l.join(", ")}, '@parent': ${s}};`:`const ${i} = {'@parent': ${s}};`;return`
{
    if (components.has(${JSON.stringify(e)})) {
        ${f}
        const ${o} = compileComponent(${JSON.stringify(e)}, ${JSON.stringify(n)});
        result += ${o}(${i});
    }
}
`}function q(e,t,n,s){let o=x(e,s),i=`item_${Math.random().toString(36).substr(2,9)}`,r=`index_${Math.random().toString(36).substr(2,9)}`,c=m(t,n,i);return`
{
    const arr = ${o};
    if (Array.isArray(arr)) {
        for (let ${r} = 0; ${r} < arr.length; ${r}++) {
            const ${i} = arr[${r}];
            ${c}
        }
    }
}
`}function K(e,t,n,s,o){let{args:i,hash:r}=w(n),c=`fn_${Math.random().toString(36).substr(2,9)}`,l=`inverse_${Math.random().toString(36).substr(2,9)}`,f=`hash_${Math.random().toString(36).substr(2,9)}`,d=`result_${Math.random().toString(36).substr(2,9)}`,a=X(t),u=Object.entries(r).length>0?`const ${f} = {${Object.entries(r).map(([$,y])=>y.startsWith('"')&&y.endsWith('"')||y.startsWith("'")&&y.endsWith("'")?`${JSON.stringify($)}: ${JSON.stringify(y.slice(1,-1))}`:`${JSON.stringify($)}: ${x(y,o)}`).join(", ")}};`:`const ${f} = {};`,h=`
        const ${c} = (context) => {
            const childData = context || ${o};
            let childResult = '';
            ${m(a.mainContent,s,"childData").replace(/result \+=/g,"childResult +=")}
            return childResult;
        };
    `,g=`
        const ${l} = (context) => {
            const childData = context || ${o};
            let childResult = '';
            ${m(a.elseContent,s,"childData").replace(/result \+=/g,"childResult +=")}
            return childResult;
        };
    `,p=o;if(i.length>0){let $=i[0];$.startsWith('"')&&$.endsWith('"')||$.startsWith("'")&&$.endsWith("'")?p=JSON.stringify($.slice(1,-1)):$==="true"?p="true":$==="false"?p="false":/^\d+$/.test($)?p=$:p=x($,o)}return`
{
    if (helpers.has(${JSON.stringify(e)})) {
        ${u}
        ${h}
        ${g}
        const helperOptions = {
            fn: ${c},
            inverse: ${l},
            hash: ${f},
            data: ${o}
        };
        const ${d} = helpers.get(${JSON.stringify(e)})?.call(null, ${p}, helperOptions);
        if (${d} != null) {
            result += String(${d});
        }
    }
}
`}function Q(e,t,n,s,o,i){let r=k(e,i),c=m(t,o,i),l=`
{
    if (${r}) {
        ${c}`;for(let f of s){let d=k(f.condition,i),a=m(f.content,o,i);l+=`
    } else if (${d}) {
        ${a}`}if(n){let f=m(n,o,i);l+=`
    } else {
        ${f}`}return l+=`
    }
}
`,l}function x(e,t){if(e==="this")return t;if(e.startsWith("@parent")){if(e==="@parent")return`${t}?.['@parent']`;{let o=e.slice(8);return`${t}?.['@parent']${G(o)}`}}if(/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(e))return`${t}?.${e}`;let n=e.split("."),s=t;for(let o of n)/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(o)?s+=`?.${o}`:s+=`?.[${JSON.stringify(o)}]`;return s}function G(e){let t=e.split("."),n="";for(let s of t)/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)?n+=`?.${s}`:n+=`?.[${JSON.stringify(s)}]`;return n}function k(e,t){let n=e.trim();return n=n.replace(/(@parent(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*|[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)+|[a-zA-Z_][a-zA-Z0-9_]*)\b/g,s=>["true","false","null","undefined","typeof","instanceof"].includes(s)||/^\d+$/.test(s)||s.includes("?.")||s.includes("[")?s:x(s,t)),`!!(${n})`}function U(e){let t=[],n=e,s="",o=/\{\{#elseif\s+([^}]+)\}\}/g,i=/\{\{#else\}\}/,r=[],c;for(;(c=o.exec(e))!==null;)r.push({condition:c[1].trim(),index:c.index,length:c[0].length});let l=e.match(i),f=l?l.index:-1;if(r.length>0||f>=0){let d=r.length>0?r[0].index:f;d>=0&&(n=e.slice(0,d).trim());for(let a=0;a<r.length;a++){let u=r[a],h=a+1<r.length?r[a+1].index:f>=0?f:e.length,g=e.slice(u.index+u.length,h).trim();t.push({condition:u.condition,content:g})}f>=0&&(s=e.slice(f+l[0].length).trim())}return{ifContent:n,elseifConditions:t,elseContent:s}}function X(e){let t=/\{\{else\}\}/,n=e.match(t);if(n&&n.index!==void 0){let s=e.slice(0,n.index).trim(),o=e.slice(n.index+n[0].length).trim();return{mainContent:s,elseContent:o}}return{mainContent:e,elseContent:""}}function W(e,t,n,s){let{args:o}=w(t),i=`helper_${Math.random().toString(36).substr(2,9)}`,r=o.length>0?`const ${i} = helpers.get(${JSON.stringify(e)})?.call(null, ${o.map(c=>c.startsWith('"')&&c.endsWith('"')||c.startsWith("'")&&c.endsWith("'")?c:x(c,s)).join(", ")});`:`const ${i} = helpers.get(${JSON.stringify(e)})?.call(null);`;return n.escape?`
{
    if (helpers.has(${JSON.stringify(e)})) {
        ${r}
        if (typeof ${i} === 'string') {
            result += escape(${i});
        } else if (${i} != null) {
            result += String(${i});
        }
    }
}
`:`
{
    if (helpers.has(${JSON.stringify(e)})) {
        ${r}
        if (${i} != null) {
            result += String(${i});
        }
    }
}
`}function w(e){let t=[],n={},s=Y(e.trim());for(let o of s)if(o.includes("=")){let i=o.indexOf("="),r=o.slice(0,i),c=o.slice(i+1);n[r]=c}else t.push(o);return{args:t,hash:n}}function Y(e){let t=[],n="",s=!1,o="";for(let i=0;i<e.length;i++){let r=e[i];!s&&(r==='"'||r==="'")?(s=!0,o=r,n+=r):s&&r===o?(s=!1,n+=r):!s&&r===" "?n.trim()&&(t.push(n.trim()),n=""):n+=r}return n.trim()&&t.push(n.trim()),t}function P(e){return`result += ${JSON.stringify(e)};
`}export{O as compile,I as registerBlockHelper,Z as registerComponent,H as registerHelper,z as registerLayout,B as renderTemplate};
