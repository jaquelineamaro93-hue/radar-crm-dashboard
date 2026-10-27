'use strict';
// Production-only read-only focus inspection. No account, credentials or writes.
const {chromium}=require('playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const viewports=[{name:'phone360',width:360,height:800},{name:'phone430',width:430,height:932},{name:'tablet820',width:820,height:1180},{name:'desktop1440',width:1440,height:900}];
const target='https://conexaocrm.com/open-to-work/';
const allowed=[[205,166,227],[207,162,230],[206,156,234],[183,130,217],[216,178,242]];
const rgb=color=>String(color||'').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)?.slice(1,4).map(Number)||[];
function lilac(color){const c=rgb(color);return allowed.some(a=>a.every((v,i)=>c[i]===v))}
async function main(){
 fs.mkdirSync('visual-artifacts',{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const results=[];
 try{
  for(const vp of viewports){
   const page=await browser.newPage({viewport:{width:vp.width,height:vp.height},deviceScaleFactor:1});
   const response=await page.goto(target,{waitUntil:'domcontentloaded',timeout:45000});
   assert(response&&response.status()>=200&&response.status()<400,vp.name+': HTTP '+response?.status());
   const input=page.locator('#pageSearch #searchText');
   await input.waitFor({state:'visible',timeout:25000});
   await input.focus();
   const visual=await input.evaluate(el=>{
    const css=getComputedStyle(el),box=el.getBoundingClientRect();
    return {outline:css.outlineColor,outlineStyle:css.outlineStyle,outlineWidth:css.outlineWidth,
     borderColor:css.borderColor,boxShadow:css.boxShadow,shown:box.width>60&&box.height>28,
     visible:document.documentElement.clientWidth,
     totalWidth:document.documentElement.scrollWidth,
     title:document.title};
   });
   await page.screenshot({path:'visual-artifacts/otw-focus-'+vp.name+'.png',animations:'disabled'});
   assert(visual.shown,vp.name+': search field clipped');
   assert(visual.totalWidth<=visual.visible+6,vp.name+': horizontal overflow '+(visual.totalWidth-visual.visible)+'px');
   assert(visual.outlineStyle!=='none',vp.name+': no visible keyboard outline');
   assert(lilac(visual.outline),vp.name+': focus must be lilac, got '+visual.outline);
   assert(!/249,\s*115,\s*22|255,\s*138,\s*61|255,\s*180,\s*127|251,\s*146,\s*60|253,\s*186,\s*116/.test(visual.boxShadow),vp.name+': old orange focus shadow');
   results.push({viewport:vp.name,status:response.status(),...visual});
   await page.close();
  }
 }finally{await browser.close();fs.writeFileSync('visual-artifacts/otw-focus-results.json',JSON.stringify(results,null,2))}
 console.log('PASS production Open to Work focus and overflow across 4 viewports');
 console.log(JSON.stringify(results));
}
main().catch(e=>{console.error(e);process.exitCode=1});
