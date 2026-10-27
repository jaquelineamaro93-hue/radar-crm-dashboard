'use strict';
// Public production smoke. No login, no data mutations and no private user fixtures.
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root='https://conexaocrm.com';
const sizes=[
 {name:'phone-360',width:360,height:800},
 {name:'phone-430',width:430,height:932},
 {name:'tablet-820',width:820,height:1180},
 {name:'desktop-1440',width:1440,height:900}
];
const routes=[
 {path:'freelancers',section:'#pageFreelancers'},
 {path:'vagas',section:'#pageVagas'},
 {path:'comunidade',section:'#comPanelGrupos'},
 {path:'cursos',section:'#pageCourses'}
];
async function run(){
 const artifacts='visual-artifacts';
 fs.mkdirSync(artifacts,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const failures=[],results=[];
 try{
  for(const view of sizes){
   const context=await browser.newContext({viewport:{width:view.width,height:view.height},deviceScaleFactor:1});
   for(const route of routes){
    const page=await context.newPage();
    const url=root+'/'+route.path+'/';
    const item={route:route.path,viewport:view.name,url,code:null,visible:false,overflow:null,cards:0,notes:[]};
    try{
     const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
     item.code=response?.status()??null;
     assert(item.code>=200&&item.code<400,'HTTP '+item.code);
     await page.locator(route.section).first().waitFor({state:'visible',timeout:20000});
     // Allow initial styles, data fetching and state transitions to settle.
     await page.waitForTimeout(1200);
     item.visible=await page.locator(route.section).first().isVisible();
     const metrics=await page.evaluate(()=>{
      const el=document.documentElement;
      return {width:el.clientWidth,scrollWidth:el.scrollWidth};
     });
     item.overflow=Math.max(0,metrics.scrollWidth-metrics.width);
     assert(item.visible,route.section+' remained hidden');
     assert(item.overflow<=6,'horizontal overflow '+item.overflow+'px');
     if(route.path==='freelancers'){
      item.cards=await page.locator('#freelancerResults .cx-freelancer-card-a').count();
      if(item.cards===0){
       await page.locator('#freelancerResults .cx-freelancer-card-a').first()
        .waitFor({state:'attached',timeout:5000}).catch(()=>{});
       item.cards=await page.locator('#freelancerResults .cx-freelancer-card-a').count();
      }
      const oldCards=await page.locator('#freelancerResults .pro-card:not(.cx-freelancer-card-a)').count();
      assert.equal(oldCards,0,'legacy freelancer card rendered');
      const loaded=await page.locator('link[href*="freelancer-card-a-20261026.css"]').count();
      assert(loaded>0,'published Freelancer A stylesheet missing');
      if(item.cards===0)item.notes.push('API cards not rendered in capture; no imaginary test records added');
     }
     if(route.path==='vagas'){
      // Pull-request runs inspect production, which still serves the previous
      // release. Enforce the new UI only after merge and deployment to main.
      if(process.env.GITHUB_EVENT_NAME!=='pull_request'){
       const title=page.locator('#pageVagas .crm-radar-header h2').first();
       assert(await title.isVisible(),'Radar title must be visible, not hidden as duplicate');
       assert(await page.locator('#crmPublicWorkspace .crm-public-pagebar').first().isHidden(),
        'Redundant public breadcrumb must be removed');
       const controls=page.locator('#cxRadarViewbar');
       assert(await controls.isVisible(),'Real Cards/Lista navigation missing');
       const listButton=controls.getByRole('button',{name:'Lista'});
       await listButton.click();
       assert(await page.locator('#vagasContainerHub').evaluate(el=>el.classList.contains('cx-radar-list-mode')),
        'List view must change the existing live cards');
       await controls.getByRole('button',{name:'Cards'}).click();
      }
      item.cards=await page.locator('#vagasContainerHub>.crm-job-card').count();
      if(item.cards){
       const bg=await page.locator('#vagasContainerHub>.crm-job-card').first().evaluate(el=>getComputedStyle(el).backgroundColor);
       const triplet=bg.match(/\d+/g);
       assert(triplet&&triplet.length>=3,'Radar card RGB components unavailable: '+bg);
       const [red,green,blue]=triplet.slice(0,3).map(Number);
       assert(blue>red&&blue>green&&red<65&&green<80&&blue<120,
        'Radar card uses retired/non-navy surface '+bg);
      }else item.notes.push('No live job cards to check; filter shell and overflow checked');
     }
     if(route.path==='comunidade'){
      item.cards=await page.locator('#comPanelGrupos .cx-group-row').count();
      assert(item.cards>0,'community group cards absent');
      const columns=await page.locator('#comPanelGrupos .cx-group-list').first().evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length);
      if(view.width<=820)assert.equal(columns,1,'Groups must be one column on tablet/phone');
      else assert(columns>=2,'Groups must be two columns on desktop');
     }
     if(route.path==='cursos'){
      item.cards=await page.locator('#courseResults .pro-card,#courseResults .c-card,#courseResults .course-card').count();
      if(!item.cards)item.notes.push('Live course card count unavailable; layout shell checked');
     }
    }catch(err){
     item.error=String(err.message||err);
     failures.push(route.path+' '+view.name+': '+item.error);
    }finally{
     try{
      await page.screenshot({path:path.join(artifacts,route.path+'-'+view.name+'.png'),fullPage:false,animations:'disabled',timeout:10000});
     }catch(err){item.notes.push('Screenshot unavailable: '+String(err.message||err).slice(0,120));}
     results.push(item);
     console.log(JSON.stringify(item));
     await page.close();
    }
   }
   await context.close();
  }
 }finally{await browser.close();}
 fs.writeFileSync(path.join(artifacts,'report.json'),JSON.stringify({at:new Date().toISOString(),results,failures},null,2));
 if(failures.length){console.error('PUBLIC VISUAL QA FAILURE\n'+failures.join('\n'));process.exitCode=1;}
 else console.log('PASS public visual QA: 4 public routes × 4 viewport sizes, no horizontal overflow');
}
run().catch(err=>{console.error(err);process.exitCode=1});
