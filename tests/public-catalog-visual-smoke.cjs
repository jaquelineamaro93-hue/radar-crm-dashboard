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
      if(process.env.GITHUB_EVENT_NAME!=='pull_request'&&item.cards>0){
       assert.equal(await page.locator('#pageFreelancers .crm-freelancer-faq').count(),0,'Retired Freelancer FAQ still present');
       assert.equal(await page.getByRole('button',{name:'Carregar mais freelancers'}).count(),0,'Old manual pagination still present');
       const dropdown=page.locator('#freelancerOrder');
       const values=await dropdown.locator('option').evaluateAll(options=>options.map(el=>el.value));
       assert(values.includes('most_reviewed')&&values.includes('new'),'More reviewed and new options missing from dropdown');
       const raw=await page.locator('#freelancerCount').textContent();
       const total=Number((raw||'').match(/\\d+/)?.[0]||0);
       assert(total===item.cards,'Not all actual freelancers shown initially: '+JSON.stringify({total,shown:item.cards}));
       await dropdown.selectOption('most_reviewed');
       const ratedCounts=await page.locator('#freelancerResults .cx-freelancer-card-a').evaluateAll(cards=>cards.map(card=>{
        const label=card.querySelector('.cx-fc-rating small')?.textContent||'';
        return Number(label.match(/\\d+/)?.[0]||0);
       }));
       assert.equal(ratedCounts.length,total,'Review order must not hide records');
       assert(ratedCounts.every((n,i)=>i===0||ratedCounts[i-1]>=n),
        'Most reviewed must be based on actual public reviews: '+ratedCounts.join(','));
       await dropdown.selectOption('new');
       const newBadges=await page.locator('#freelancerResults .cx-freelancer-card-a').evaluateAll(cards=>cards.map(card=>
         !!card.querySelector('.cx-fc-no-reviews')));
       let sawReviewed=false;
       assert(newBadges.every(value=>{if(!value)sawReviewed=true;return !(sawReviewed&&value)}),
        'New/no-review profiles must be shown before reviewed professionals');
       await dropdown.selectOption('recent');
       item.cards=await page.locator('#freelancerResults .cx-freelancer-card-a').count();
      }
      if(process.env.GITHUB_EVENT_NAME!=='pull_request'&&item.cards>0){
       // The share control must be in the *visible header* at 100% viewport zoom;
       // a footer control below a long review panel does not meet the UX contract.
       const first=page.locator('#freelancerResults .cx-freelancer-card-a').first();
       const share=first.locator('.cx-fc-head .cx-share-card');
       await share.waitFor({state:'visible',timeout:5000});
       const placement=await share.boundingBox();
       assert(placement&&placement.width>15,'share control missing from the freelancer card header');
       const avatar=await first.locator('.cx-fc-head .pro-avatar').boundingBox();
       assert(avatar&&Math.abs(avatar.y-placement.y)<=45,
        'share action must align with name/avatar (no old vertical dead zone): '+JSON.stringify({avatar,placement}));
       const density=await first.evaluate(card=>{
        const actions=card.querySelector('.cx-fc-actions');
        const bio=card.querySelector('.cx-fc-bio');
        const rect=el=>el?.getBoundingClientRect();
        const a=rect(actions),b=rect(bio);
        return {margin:getComputedStyle(actions).marginTop,
          gap:a&&b?Math.round(a.top-b.bottom):null,
          alignSelf:getComputedStyle(card).alignSelf};
       });
       assert(density.margin!=='auto','Action buttons have an unwanted auto margin');
       assert(density.gap==null||density.gap<85,
        'Card still has a giant void before buttons: '+JSON.stringify(density));
       await share.click();
       const popup=page.locator('.cx-share-panel');
       await popup.waitFor({state:'visible',timeout:3000});
       const bounds=await popup.boundingBox();
       const vh=page.viewportSize().height;
       assert(bounds&&bounds.y>=-2&&bounds.y+bounds.height<=vh+2,
        'share popup clipped at '+view.name+': '+JSON.stringify(bounds));
       assert(await popup.getByText('Copiar link').isVisible(),'share link must be accessible');
       await page.keyboard.press('Escape');
      }
      if(item.cards===0)item.notes.push('API cards not rendered in capture; no imaginary test records added');
      if(process.env.GITHUB_EVENT_NAME!=='pull_request'){
       assert(await page.locator('#cx-profile-modal-unified').count()>0,
        'New unified modal style missing from production head');
       // Public smoke cannot log in to a private user account. Inject inert
       // replicas with real production classes and verify computed visual styles.
       // Never submit, read or modify any member data.
       const painted=await page.evaluate(()=>{
        const overlay=document.createElement('div');
        overlay.id='profileModalOverlay';overlay.className='ev-modal-overlay crm-profile-overlay';
        overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');
        overlay.innerHTML='<div class="ev-mbox crm-profile-modal"><div class="crm-profile-modal-head"><div><p class="crm-eyebrow">MEU PERFIL / CONEXÃO CRM</p><h2>Editar meu perfil</h2><p>Atualize suas informações quando precisar.</p></div><button class="crm-profile-close">Fechar</button></div><section data-pf-step="1"><div class="crm-profile-step-title"><span>01</span><div><h3>Como a comunidade vai te conhecer</h3><p>Comece pelo básico.</p></div></div><label class="ev-ilabel">Nome completo</label><input class="ev-ifield" type="text" placeholder="Nome Sobrenome"><div class="crm-profile-chips"><label><input type="checkbox" checked><span>Híbrido</span></label></div></section><div class="crm-profile-footer"><button class="crm-button crm-outline">Cancelar</button><button class="crm-button">Salvar alterações</button></div></div>';
        document.body.append(overlay);
        const inner=overlay.querySelector('.crm-profile-modal');
        const primary=overlay.querySelector('.crm-profile-footer .crm-button:not(.crm-outline)');
        const read=el=>getComputedStyle(el).backgroundColor;
        const result={surface:read(inner),button:read(primary),
          badge:read(overlay.querySelector('.crm-profile-step-title>span')),
          panelWidth:inner.getBoundingClientRect().width,
          bodyWidth:document.documentElement.clientWidth,
          modalHeight:inner.getBoundingClientRect().height,
          viewportHeight:innerHeight};
        return result;
       });
       // The real connected profile hub injects the tab strip, not the fixture.
       await page.waitForTimeout(350);
       const strips=await page.locator('#profileModalOverlay .cx-profile-tabs').count();
       assert.equal(strips,1,'Profile tabs should render once: '+strips);
       const selectedColor=await page.locator('#profileModalOverlay .crm-profile-chips label:has(input:checked) span')
        .first().evaluate(el=>getComputedStyle(el).color);
       assert(!selectedColor.includes('253, 186, 116'),'Old orange selected-chip text remains: '+selectedColor);
       assert(painted.surface==='rgb(22, 32, 51)','Profile modal old background: '+JSON.stringify(painted));
       assert(painted.button==='rgb(216, 181, 239)','Profile save button old orange: '+JSON.stringify(painted));
       assert(painted.panelWidth<=painted.bodyWidth+2,'Profile modal overflows viewport');
       assert(painted.modalHeight<=painted.viewportHeight+1,'Profile editor height not bounded');
       await page.screenshot({path:path.join(artifacts,'profile-editor-'+view.name+'.png'),animations:'disabled',timeout:10000});
       await page.locator('#profileModalOverlay').evaluate(el=>el.remove());
       const verify=await page.evaluate(()=>{
         const dlg=document.createElement('dialog');
         dlg.className='crm-join-dialog crm-submission-dialog';
         dlg.innerHTML='<form><h2>Confirme seu envio</h2><p>Responda à verificação para continuar.</p><label class="crm-field">Quanto é 3 + 13?<input name="answer" inputmode="numeric" value=""></label><p role="status"></p><div class="crm-submission-actions"><button type="submit" class="crm-button">Confirmar e enviar</button><button type="button" class="crm-button crm-outline">Cancelar</button></div><small>Até 5 envios por conta em 24 horas.</small></form>';
         document.body.append(dlg);dlg.showModal();
         const color=el=>getComputedStyle(el).backgroundColor;
         const bounds=dlg.getBoundingClientRect();
         return {surface:color(dlg),
           button:color(dlg.querySelector('button[type="submit"]')),
           left:bounds.left,right:bounds.right,
           top:bounds.top,bottom:bounds.bottom,
           screen:innerWidth,height:innerHeight};
       });
       assert(verify.surface==='rgb(22, 32, 51)','Verification old dark brown modal: '+JSON.stringify(verify));
       assert(verify.button==='rgb(216, 181, 239)','Verification old orange submit button: '+JSON.stringify(verify));
       assert(verify.left>=-1&&verify.right<=verify.screen+1&&verify.top>=-1&&verify.bottom<=verify.height+1,
         'Verification dialog overflow at '+view.name+': '+JSON.stringify(verify));
       await page.screenshot({path:path.join(artifacts,'submission-dialog-'+view.name+'.png'),animations:'disabled',timeout:10000});
       await page.locator('dialog.crm-submission-dialog').evaluate(el=>{el.close();el.remove();});
      }
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
