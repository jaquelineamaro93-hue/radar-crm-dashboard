'use strict';
/* Static regression: no reintroduction of overlapping Radar palettes or legacy group cards. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const radar=fs.readFileSync('assets/radar-ux.css','utf8');
const groups=fs.readFileSync('assets/catalog-refinement-20261026.css','utf8');
const markup=fs.readFileSync('index.html','utf8');
function balanced(css,name){
 let d=0;for(const c of css){if(c==='{')d++;if(c==='}')d--;assert(d>=0,name+' has stray closing brace');}
 assert.equal(d,0,name+' has unmatched CSS braces');
}
balanced(radar,'radar');
balanced(groups,'groups');
assert(radar.includes('--cx-radar-surface:#172235'),'navy surface token missing');
assert(radar.includes('--cx-radar-accent:#cda5ed'),'accessible lilac accent missing');
assert(!/#(?:181614|3b3430|fff1b5|f97316|fbbf91)\b/i.test(radar),'legacy orange/brown palette returned');
assert(radar.includes('#vagasContainerHub>.crm-job-card'),'real job cards must remain styled');
assert(radar.includes('.crm-job-clean-apply'),'original apply action must remain');
assert(radar.includes('.crm-radar-extra-fields[hidden]'),'closed filters must stay hidden');
assert(radar.includes('crm-radar-filter-disclosure'),'filter disclosure must remain functional');
for(const bp of ['max-width:1100px','max-width:760px','max-width:670px','max-width:480px'])
 assert(radar.includes(bp),'missing responsive breakpoint '+bp);
assert(radar.includes('prefers-reduced-motion'),'motion preference missing');
assert(radar.includes('#pageVagas #btn-buscar'),'Search action must use the unified palette');
assert(radar.includes('#pageVagas .crm-add-community-job'),'Community add action must use the unified palette');
assert(groups.includes('#pageCourses #btnGoToCourseForm'),'Course suggestion must use scoped portal palette');
assert(groups.includes('background:#312842!important'),'Course action must not inherit orange event CTA');
for(const selector of ['.cx-group-list','.cx-group-row','.cx-group-links a'])
 assert(groups.includes(selector),'group structure missing: '+selector);
assert(groups.includes('grid-template-columns:repeat(2,minmax(0,1fr))'),'desktop group layout missing');
assert(groups.includes('max-width:820px'),'tablet group layout missing');
assert(groups.includes('max-width:520px'),'mobile group layout missing');
assert(groups.includes('focus-visible'),'group link keyboard focus missing');
assert(markup.includes('id="comPanelGrupos"'),'group panel missing from markup');
assert(markup.includes('id="vagasContainerHub"'),'job results missing from markup');
console.log('PASS: Radar and Grupos use coherent navy/lilac visual system, actual data/actions and accessible breakpoints');
