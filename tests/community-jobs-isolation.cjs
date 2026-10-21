const fs=require('node:fs');
const assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
const migration=read('supabase/migrations/20261014232000_isolate_community_jobs.sql');
const html=read('index.html');
const fallback=read('404.html');
const form=read('assets/community-job-publish.js');
assert.equal(html,fallback,'Pages deep-link fallback must match');
assert(migration.includes('create table if not exists public.crm_community_jobs'),'Dedicated community storage required');
assert(migration.includes('security_invoker=true'),'Unified view must honor underlying RLS');
assert(migration.includes('revoke all on table public.crm_community_jobs'),'No public write permissions');
assert(migration.includes('create policy crm_community_published_read'),'Public can only see approved jobs');
assert(migration.includes('create or replace function public.crm_moderate_community_job'),'New dedicated moderation function required');
assert(migration.includes('drop trigger if exists crm_sync_approved_community_job'),'Legacy sync trigger must be removed');
assert(!/(?:insert\s+into|update|delete\s+from|truncate)\s+public\.(?:vagas_crm|vagas_scraper|vagas_salvas|saved_scraped_jobs)\b/i.test(migration),'Production bot/saved tables must never be modified by this feature');
assert((html.match(/from\('crm_radar_jobs_public'\)/g)||[]).length>=2,'Main Radar and filtered Radar must use unified read-only view');
assert(html.includes("vgSb.from('crm_radar_jobs_public')"),'Legacy listing uses the same read-only view');
assert(html.includes("row.kind==='job'"),'Job approvals must be routed by type');
assert(html.includes("rpc('crm_moderate_community_job'"),'Admin must use isolated approval function');
assert(html.includes('function saveScrapedJob(url, title, company)'),'Existing URL-based saved jobs must be preserved');
assert(form.includes("crmSecureInsert('crm_submission_requests'"),'Queue and quota verification must remain active');
assert(form.includes('Importar dados')&&form.includes('Enviar para moderação'),'User must review before moderation');
assert(!/MutationObserver\s*\(\s*\(\s*\)\s*=>\s*install\(\)/.test(form),'Job form must not run an observer-triggered DOM write loop');
assert(!migration.includes('drop table public.vagas_'),'No bot table drops');

const radarUx=read('assets/radar-ux.js');
const radarCss=read('assets/radar-ux.css');
assert(html.includes('class="section-head crm-radar-header"'),'Radar must render its header CTA without JavaScript insertion');
assert(html.includes('class="crm-add-community-job" aria-label="Adicionar uma vaga ao Radar"'),'Add job action must be visible beside Radar heading');
assert(/\/assets\/radar-ux\.js\?v=[\w-]+/.test(html)&&/\/assets\/radar-ux\.css\?v=[\w-]+/.test(html),'Radar compact assets must load with cache invalidation');
assert(radarUx.includes("const visibleIds=['filtro-categoria','filtro-cargo','filtro-modalidade']"),'Primary filters stay visible');
assert(radarUx.includes("if(el.id==='filtro-ordem-hub')"),'Default ordering must not expand advanced filters');
assert(radarCss.includes('.crm-radar-filterbox:not(.is-expanded) .crm-filter-extra'),'Secondary filters must collapse');
assert(!html.includes('function crmEnhanceCards(){')&&!radarUx.includes('data-analyze-job'),'Radar must not automatically insert AI buttons');


// As vagas encerradas nunca aparecem no Radar, mas não são apagadas nem do bot nem dos salvos.
assert(html.includes("vagas=(vagas||[]).filter(v=>String(v.availability_status||'').toLowerCase()!=='closed')"),
  'Cards must exclude closed vacancies even when a caller passes unfiltered data');
assert((html.match(/\.neq\('availability_status',\s*'closed'\)/g)||[]).length>=2,
  'Both primary Radar fetches must exclude vacancies marked closed');
assert(html.includes('crm-job-clean-apply')&&html.includes('data-job-apply="1"'),
  'Application tracking and full-width Candidatar action must be preserved');
assert(!html.includes("'Encerrada':'A verificar'"),
  'Unverified jobs must not be mislabeled as confirmed or clutter cards');
assert(!html.includes('id="crmRadarArchive"'),
  'Closed vacancies must not be shown in an archive on the Radar page');
assert(!html.includes('<h3 style="font-weight:700; font-size:14px; margin:0; color:var(--text);">Vagas encontradas nos últimos 14 dias</h3>'),
  'Redundant 14-day jobs heading must not occupy screen space');
assert(radarCss.includes('background:#fff1b5!important')&&radarCss.includes('color:#4a3526!important')&&radarCss.includes('border-radius:13px!important'),
  'Candidatar must retain baby-yellow, dark brown text and rounded corners');
assert(radarCss.includes('.crm-job-clean-apply')&&radarCss.includes('grid-template-columns:repeat(3,minmax(0,1fr))'),
  'Lightweight card presentation and bottom CTA must be responsive');


assert(html.includes('let crmRadarRequestInFlight=false;')&&html.includes('let crmRadarLastLoadedAt=0;'),
  'Radar must dedupe requests and keep recent results cached');
assert(html.includes('if(!keepCards)container.innerHTML ='),
  'Filtering and refresh should preserve existing cards without loading flash');
assert(!html.includes("if(tab==='vagas'){ carregarVagasHub();"),
  'Returning to Radar must not start an unconditional fetch');
assert(!html.includes('setInterval(carregarVagasHub, 60000)')&&!html.includes('vagasAutoRefreshStarted=true;'),
  'Do not repaint the Radar while visitors are scrolling: bot updates independently');
assert(html.includes("if(route==='freelancers'){crmSelectFreelancerView('directory');if(!FREELANCERS.length"),
  'Freelancer data must not reload on every navigation');
assert(html.includes("if(e.detail>0)")&&html.includes("if(tapped)tapped.blur();"),
  'Pointer navigation must clear stale focus while preserving keyboard focus');
assert(html.includes("crmToggleMenu(false);window.scrollTo(0,0);"),
  'Route switch should not animate the previous page into view');
assert(html.includes('if(renderSeq!==crmVagasRenderSeq)return;'),
  'Old job requests must not overwrite newer results');


// Freelancer IA must be an internal section, not a giant panel above the directory.
const freelancersCSS=read('assets/freelancers-subnav.css');
const freelancerPage=html.slice(html.indexOf('id="pageFreelancers"'),html.indexOf('id="pageAgencias"'));
assert(html.includes('freelancers-subnav.css?v=20261014-1'),'Freelancers internal navigation CSS must be loaded');
assert(freelancerPage.includes('id="crmFreelancerDirectoryView"')&&freelancerPage.includes('id="crmFreelancerAIView"'),
  'Freelancers must have separate directory and AI internal views');
assert(freelancerPage.indexOf('id="crmFreelancerDirectoryView"')<freelancerPage.indexOf('id="freelancerSearchText"'),
  'Profile search must stay in directory view');
assert(freelancerPage.indexOf('id="crmFreelancerAIView"')<freelancerPage.indexOf('id="freelancerChallenge"'),
  'AI challenge must appear only in AI view');
assert(freelancerPage.includes('id="crmFreelancerAIView" aria-labelledby="crmFreelancerTabAI" hidden'),
  'AI panel must be hidden by default');
assert(html.includes("function crmSelectFreelancerView(view)")&&html.includes("if(route==='freelancers'){crmSelectFreelancerView('directory');"),
  'Switching to freelancers must restore the directory by default');
assert(freelancersCSS.includes('#crmFreelancerAIView[hidden]')&&freelancersCSS.includes(':focus-visible'),
  'Subnavigation must be responsive, keyboard accessible and hidden when inactive');
// Two admin-only navigation actions also require graphical icons.
assert(html.includes('b.innerHTML=')&&html.includes('<svg viewBox="0 0 24 24" focusable="false">'),
  'Dynamically inserted admin/team links need SVG icons');
assert(!html.includes('crm-nav-glyph">⚙')&&!html.includes('crm-nav-glyph">◎'),
  'Do not insert invisible text-symbol icons under zero-font-size glyph styles');

console.log('PASS community isolation: separate tables, view+RLS, secure moderation, preservation of bot and saved jobs');
