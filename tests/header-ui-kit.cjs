'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=(p)=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const shell=read('index.html'),css=read('assets/ui-kit-header-controls.css'),lang=read('assets/site-i18n.js');
assert.match(shell,/ui-kit-header-controls\.css\?v=20261026-header1/,'versioned design system must load on every route');
assert.match(shell,/aria-label="Responder à pesquisa de Censo">Responder ao Censo <span aria-hidden="true">↗<\/span>/,'single-line census label keeps existing navigation');
assert(!shell.includes('>Responda nossa pesquisa de Censo <span>↗</span>'),'legacy wrapping label must not return');
for(const f of ['404.html','open-to-work/index.html','dashboard/index.html','plataformas/index.html','freelancers/index.html'])
 assert.equal(read(f),shell,'no out-of-sync route: '+f);
for(const token of ['--cx-control-height:40px','--cx-control-radius:10px','--cx-control-icon:19px','--cx-control-gap:10px','--cx-control-text-size:12px'])
 assert(css.includes(token),'missing UI Kit token '+token);
for(const control of ['.crm-survey-top','.crm-help-bell','#cx-site-language','.cx-language-host','.crm-text-button'])
 assert(css.includes(control),'missing unified header member '+control);
assert(css.includes('border:0!important;')&&css.includes('border:1px solid var(--cx-control-border)!important;'),'language control should have one border');
assert(css.includes('@media(max-width:900px)')&&css.includes('@media(max-width:600px)')&&css.includes('@media(max-width:370px)'),'responsive viewport bands required');
assert(css.includes(':focus-visible'),'visible keyboard focus required');
assert(lang.includes("'Responder ao Censo':['Take the census','Responder al censo']"),'all locales require a concise census label');
let depth=0;for(const ch of css){if(ch==='{')depth++;if(ch==='}')depth--;assert(depth>=0,'unexpected CSS close brace');}
assert.equal(depth,0,'CSS braces must balance');
console.log('PASS UI Kit header: shared tokens, consistent control sizes, concise CTA, localization and synchronized routes');
