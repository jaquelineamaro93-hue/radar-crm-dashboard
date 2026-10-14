/* Conexão CRM: publicação de vagas pela comunidade.
 * Usa a fila e a verificação já existentes. Jamais publica sem moderação.
 */
(function(){
  'use strict';
  const IMPORT_API='https://rwkbpafpniwzvlkfngag.supabase.co/functions/v1/crm-job-import';
  const publishButtonClass='crm-add-community-job';
  const allowedCategories=[
    ['crm','CRM e Martech'],['cxcs','CX e Customer Success'],
    ['marketing','Marketing e Automação'],['revops','RevOps e SalesOps'],
    ['designer','Product Design e UX'],['data','Dados, IA e Tecnologia'],
    ['po_pm','Produtos e Projetos'],['tech','Tecnologia']
  ];
  const field=(id)=>document.getElementById('cj-'+id);
  const text=(v,max)=>String(v||'').trim().slice(0,max||6000);
  const safeUrl=(v)=>{try{const u=new URL(String(v).trim());return u.protocol==='https:'?u.href:'';}catch{return '';}};
  const onlyDigits=(s)=>String(s||'').replace(/\D/g,'');
  function showStatus(message,isError){
    const el=field('message');
    if(el){el.textContent=message;el.dataset.error=isError?'true':'false';}
  }
  function install(){
    if(!document.getElementById('crm-community-job-styles')){
      const style=document.createElement('style');
      style.id='crm-community-job-styles';
      style.textContent=[
        '.crm-job-publish-cta{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px;background:linear-gradient(100deg,#231a14,#171717);border:1px solid #744019;border-radius:12px;padding:20px;margin:18px 0 23px}',
        '.crm-job-publish-cta h3{font-size:18px;color:#f5f5f5;margin:0 0 5px}',
        '.crm-job-publish-cta p{font-size:13px;color:#bdb5af;margin:0}',
        '.crm-add-community-job,.cj-primary{border:1px solid #ff781c;background:#ff781c;color:#100d0b;font-weight:750;border-radius:9px;padding:12px 20px;cursor:pointer;font:inherit}',
        '.crm-add-community-job:hover,.cj-primary:hover{background:#ffa262}',
        '.cj-overlay{position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,.82);overflow:auto;display:flex;padding:24px 12px}',
        '.cj-dialog{background:#171717;color:#f5f5f5;border:1px solid #47403a;border-radius:18px;max-width:780px;width:100%;margin:auto;padding:clamp(18px,4vw,32px);box-shadow:0 25px 90px #0009}',
        '.cj-dialog h2{font-size:26px;margin:0 0 7px;color:#fff}',
        '.cj-intro{color:#c3bcb6;margin:0 0 22px;font-size:14px}',
        '.cj-kicker{color:#ff8a33;font-size:11px;font-weight:800;letter-spacing:.11em;text-transform:uppercase;margin-bottom:8px}',
        '.cj-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}',
        '.cj-field{display:flex;flex-direction:column;gap:6px;margin:0 0 14px;font-size:13px;font-weight:650;color:#ddd}',
        '.cj-field input,.cj-field select,.cj-field textarea{width:100%;border:1px solid #4a4542;background:#252525;color:#fff;padding:12px;border-radius:8px;font-size:14px;font-family:inherit;box-sizing:border-box}',
        '.cj-field textarea{resize:vertical;min-height:145px}',
        '.cj-field input:focus,.cj-field textarea:focus,.cj-field select:focus{outline:2px solid #f97316;outline-offset:1px}',
        '.cj-inline{display:flex;gap:9px;align-items:center;font-size:12px;color:#ccc;font-weight:400;margin:2px 0 12px}',
        '.cj-inline input{width:auto;accent-color:#f97316}',
        '.cj-import{padding:18px;background:#221d19;border:1px solid #6b4424;border-radius:12px;margin-bottom:21px}',
        '.cj-import-actions{display:flex;gap:9px;align-items:flex-end}',
        '.cj-import-actions .cj-field{flex:1;margin:0}',
        '.cj-secondary{border:1px solid #59504a;background:transparent;color:#f7f7f7;border-radius:9px;padding:12px 16px;cursor:pointer;font:inherit}',
        '.cj-section{margin:22px 0 14px;border-bottom:1px solid #39332f;padding-bottom:7px;font-size:14px;font-weight:750;color:#fff}',
        '.cj-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:23px}',
        '.cj-info{font-size:12px;color:#bfb3a9;line-height:1.5;margin:10px 0}',
        '.cj-status{min-height:21px;font-size:13px;color:#8ce1b6;margin-top:10px}',
        '.cj-status[data-error=true]{color:#ff9e95}',
        '.cj-import small{font-size:11px;color:#b7aea7;display:block;margin-top:7px}',
        '@media(max-width:650px){.cj-grid{grid-template-columns:1fr}.cj-dialog{padding:17px}.cj-overlay{padding:8px}.cj-import-actions{flex-direction:column;align-items:stretch}.cj-actions{flex-direction:column-reverse}.cj-actions button{width:100%}}'
      ].join('');
      document.head.append(style);
    }
    const page=document.getElementById('pageVagas');
    if(page && !page.querySelector('.crm-job-publish-cta')){
      const anchor=page.querySelector('.section-desc');
      if(anchor){
        const box=document.createElement('section');
        box.className='crm-job-publish-cta';
        box.innerHTML='<div><h3>Conhece uma oportunidade?</h3><p>Publique uma vaga manualmente ou importe os dados pelo link. A publicação passa por revisão.</p></div><button type="button" class="crm-add-community-job">+ Adicionar vaga</button>';
        anchor.insertAdjacentElement('afterend',box);
      }
    }
    // O caminho antigo /publicar permanece disponível para agências, mas vagas
    // usam sempre o cadastro completo e a mesma fila segura de moderação.
    const publish=document.getElementById('crmPublish');
    const legacyForm=publish?.querySelector('#crmPublishForm');
    if(legacyForm){
      const kind=legacyForm.elements.kind;
      if(kind){
        kind.querySelector('option[value="job"]')?.remove();
        kind.value='agency';
      }
      if(!publish.querySelector('#cj-publish-route-button')){
        const notice=document.createElement('section');
        notice.id='cj-publish-route-button';
        notice.className='crm-job-publish-cta';
        notice.innerHTML='<div><h3>Publicar uma vaga</h3><p>Cadastro gratuito com importação por link e aprovação da comunidade.</p></div><button type="button" class="crm-add-community-job">+ Adicionar vaga</button>';
        legacyForm.insertAdjacentElement('beforebegin',notice);
      }
      const subtitle=publish.querySelector('.crm-muted');
      if(subtitle)subtitle.textContent='Para publicar uma vaga, utilize o botão Adicionar vaga. O formulário abaixo é exclusivo para indicar agências e consultorias.';
    }
  }
  function html(){
    const categories=allowedCategories.map(([key,label])=>'<option value="'+key+'">'+label+'</option>').join('');
    return [
      '<div class="cj-overlay" id="cj-overlay"><div class="cj-dialog" role="dialog" aria-modal="true" aria-labelledby="cj-title" tabindex="-1">',
      '<div class="cj-kicker">CONEXÃO CRM / VAGAS DA COMUNIDADE</div>',
      '<h2 id="cj-title">Adicionar uma vaga</h2>',
      '<p class="cj-intro">Compartilhe uma oportunidade. Os dados importados são sugestões e podem ser corrigidos antes do envio.</p>',
      '<div class="cj-import"><div class="cj-kicker">Preencher a partir de um link</div>',
      '<div class="cj-import-actions"><label class="cj-field" for="cj-import-url">URL do anúncio<input id="cj-import-url" type="url" inputmode="url" placeholder="https://..." maxlength="1000"></label>',
      '<button type="button" class="cj-secondary" id="cj-import-button">Importar dados</button></div>',
      '<small>Sites que exigem login ou bloqueiam robôs podem não permitir a importação. Nesse caso, preencha manualmente.</small></div>',
      '<form id="cj-form"><div class="cj-section">Informações da vaga</div>',
      '<label class="cj-field">Título da vaga *<input name="title" maxlength="160" required placeholder="Ex: Analista de CRM Pleno"></label>',
      '<div class="cj-grid"><div><label class="cj-field">Empresa<input name="company" maxlength="160" placeholder="Nome da empresa"></label>',
      '<label class="cj-inline"><input type="checkbox" name="company_unknown"> Não informar a empresa</label></div>',
      '<label class="cj-field">Área / categoria *<select name="category" required><option value="">Selecione</option>'+categories+'</select></label></div>',
      '<label class="cj-field">Descrição, atividades e requisitos *<textarea name="description" minlength="20" maxlength="6000" required placeholder="O que a pessoa fará? Quais são os requisitos e benefícios?"></textarea></label>',
      '<div class="cj-grid">',
      '<label class="cj-field">Modalidade *<select name="work_model" required><option value="">Selecione</option><option>Remoto</option><option>Híbrido</option><option>Presencial</option><option>Não informado</option></select></label>',
      '<label class="cj-field">Senioridade<select name="seniority_required"><option value="">Não informada</option><option>Estágio</option><option>Júnior</option><option>Pleno</option><option>Sênior</option><option>Especialista</option><option>Coordenação</option><option>Gerência</option><option>Diretoria</option></select></label>',
      '<label class="cj-field">Tipo de contrato<select name="employment_type"><option value="">Não informado</option><option>CLT</option><option>PJ</option><option>Estágio</option><option>Temporário</option><option>Freelancer</option><option>Outro</option></select></label>',
      '<label class="cj-field">Status da vaga<select name="job_status"><option value="Aberta">Aberta</option><option value="Não informado">Não informado</option></select></label>',
      '<label class="cj-field">Estado (UF)<select name="state"><option value="">Não informado</option>'+['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(s=>'<option>'+s+'</option>').join('')+'</select></label>',
      '<label class="cj-field">Município<input name="city" maxlength="100" placeholder="Ex: São Paulo"></label>',
      '<label class="cj-field">Faixa salarial<input name="salary_range" maxlength="100" placeholder="Ex: R$ 5.000 a R$ 7.000"></label>',
      '<label class="cj-field">Benefícios (opcional)<input name="benefits" maxlength="450" placeholder="Ex: VR, assistência médica"></label>',
      '</div>',
      '<div class="cj-section">Como candidatar-se</div>',
      '<label class="cj-field">Link direto da vaga<input name="url" type="url" maxlength="1000" placeholder="https://..."></label>',
      '<p class="cj-info">Informe ao menos um canal válido de candidatura: link ou WhatsApp. O e-mail é um contato complementar.</p>',
      '<div class="cj-grid">',
      '<label class="cj-field">WhatsApp para candidatura<input name="whatsapp" type="tel" maxlength="25" placeholder="+55 (11) 99999-9999"></label>',
      '<label class="cj-field">E-mail para contato<input name="contact_email" type="email" maxlength="160" placeholder="rh@empresa.com"></label>',
      '</div>',
      '<label class="cj-inline"><input type="checkbox" name="is_ambassador"> Sou representante ou recrutador(a) desta empresa</label>',
      '<label class="cj-inline"><input type="checkbox" name="confirm" required> Confirmo que as informações são verdadeiras e autorizo a publicação dos contatos de candidatura informados *</label>',
      '<p class="cj-info">A publicação é gratuita e será analisada antes de aparecer no Radar. Vagas do bot continuam sendo contabilizadas separadamente.</p>',
      '<p id="cj-message" class="cj-status" data-error="false" role="status" aria-live="polite"></p>',
      '<div class="cj-actions"><button type="button" class="cj-secondary" id="cj-close">Cancelar</button><button type="submit" class="cj-primary" id="cj-submit">Enviar para moderação</button></div>',
      '</form></div></div>'
    ].join('');
  }
  function open(){
    if(document.getElementById('cj-overlay'))return;
    document.body.insertAdjacentHTML('beforeend',html());
    const overlay=document.getElementById('cj-overlay');
    const form=field('form');
    const close=()=>{overlay.remove();document.removeEventListener('keydown',onEscape)};
    const onEscape=(e)=>{if(e.key==='Escape')close()};
    document.addEventListener('keydown',onEscape);
    field('close').addEventListener('click',close);
    overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
    form.elements.company_unknown.addEventListener('change',e=>{
      form.elements.company.disabled=e.target.checked;
      if(e.target.checked)form.elements.company.value='';
    });
    field('import-button').addEventListener('click',()=>importLink(form));
    form.addEventListener('submit',e=>submit(e,form));
    overlay.querySelector('.cj-dialog').focus();
  }
  async function importLink(form){
    const button=field('import-button'),url=safeUrl(field('import-url').value);
    if(!url){showStatus('Cole um link HTTPS válido para importar a vaga.',true);return;}
    if(typeof crmRequireSession!=='function'){showStatus('Atualize a página e tente novamente.',true);return;}
    const session=await crmRequireSession('Entre para importar uma oportunidade.');
    if(!session){showStatus('Faça login para usar a importação por link.',true);return;}
    button.disabled=true;button.textContent='Buscando dados…';showStatus('Consultando a página da vaga…',false);
    try{
      const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
      let response;
      try{
        response=await fetch(IMPORT_API,{method:'POST',
          headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token,'apikey':AUTH_SUPABASE_KEY},
          body:JSON.stringify({url}),signal:controller.signal});
      }finally{clearTimeout(timeout)}
      const data=await response.json();
      if(!response.ok)throw Error(data.error||'Não foi possível extrair os dados deste endereço.');
      const imported=data.job||{};
      const put=(name,value)=>{if(value && form.elements[name])form.elements[name].value=text(value,name==='description'?6000:450)};
      put('title',imported.title);put('company',imported.company);put('description',imported.description);
      put('work_model',imported.work_model);put('seniority_required',imported.seniority_required);
      put('employment_type',imported.employment_type);put('city',imported.city);
      put('state',imported.state);put('salary_range',imported.salary_range);
      form.elements.url.value=url;
      if(imported.company)form.elements.company_unknown.checked=false;
      form.elements.company.disabled=false;
      showStatus('Importação concluída. Confira e complete os campos antes de enviar.',false);
    }catch(error){
      form.elements.url.value=url;
      showStatus((error.name==='AbortError'?'A página demorou para responder. ':text(error.message,190)+' ')+
        'O link foi preservado, preencha os demais campos manualmente.',true);
    }finally{button.disabled=false;button.textContent='Importar dados';}
  }
  async function submit(event,form){
    event.preventDefault();
    if(!form.reportValidity())return;
    const data=new FormData(form);
    const get=(k,n)=>text(data.get(k),n||1000);
    const title=get('title',160),company=data.has('company_unknown')?'Empresa confidencial':get('company',160);
    const description=get('description',6000),directLink=get('url',1000),whatsapp=onlyDigits(get('whatsapp',25));
    const contactEmail=get('contact_email',160);
    if(!company){showStatus('Informe a empresa ou marque Não informar a empresa.',true);return;}
    if(whatsapp && (whatsapp.length<10||whatsapp.length>15)){showStatus('Confira o número do WhatsApp com DDD e código do país.',true);return;}
    if(directLink&&!safeUrl(directLink)){showStatus('O link da vaga deve começar com https://.',true);return;}
    if(!directLink&&!whatsapp){showStatus('Informe um link de candidatura ou WhatsApp válido.',true);return;}
    if(!data.has('confirm')){showStatus('Confirme a autorização para publicar a vaga.',true);return;}
    if(typeof crmSecureInsert!=='function'){showStatus('Atualize a página para continuar.',true);return;}
    const appliedUrl=directLink||('https://wa.me/'+whatsapp);
    const location=[get('city',100),get('state',2)].filter(Boolean).join(', ');
    const extra=[
      get('salary_range',100)?'Faixa salarial: '+get('salary_range',100):'',
      get('benefits',450)?'Benefícios: '+get('benefits',450):'',
      contactEmail?'E-mail para candidatura: '+contactEmail:'',
      whatsapp?'WhatsApp para candidatura: +'+whatsapp:'',
      get('employment_type',40)?'Contratação: '+get('employment_type',40):''
    ].filter(Boolean);
    const fullDescription=description+(extra.length?'\n\nInformações de candidatura\n'+extra.join('\n'):'');
    const payload={
      title,company,url:appliedUrl,description:fullDescription.slice(0,6900),
      category:get('category',40),location,work_model:get('work_model',40),
      seniority_required:get('seniority_required',50),employment_type:get('employment_type',40),
      salary_range:get('salary_range',100),benefits:get('benefits',450),
      city:get('city',100),state:get('state',2),job_status:get('job_status',40),
      whatsapp:whatsapp?('+'+whatsapp):'',contact_email:contactEmail,
      is_ambassador:data.has('is_ambassador'),source:'Comunidade',
      is_crm_uni_recommended:false,is_confidential:data.has('company_unknown')
    };
    const button=field('submit');button.disabled=true;button.textContent='Enviando…';showStatus('Validando seu envio…',false);
    try{
      if(typeof authSb!=='undefined'&&authSb){
        const {data:existing}=await authSb.from('vagas_crm').select('id').eq('url',appliedUrl).limit(1);
        if(existing&&existing.length)throw Error('Esta vaga já está no Radar. Confira antes de enviar novamente.');
      }
      const result=await crmSecureInsert('crm_submission_requests',{user_id:CURRENT_USER?.id,kind:'job',payload});
      if(result.error)throw result.error;
      showStatus('Vaga enviada! Ela aparecerá após a aprovação da equipe Conexão CRM.',false);
      button.textContent='Enviada';
      if(typeof crmLoadSubmissions==='function'&&document.getElementById('crmSubmissionList'))crmLoadSubmissions();
      setTimeout(()=>document.getElementById('cj-overlay')?.remove(),2500);
    }catch(error){
      showStatus(text(error.message,300)||'Não foi possível enviar. Tente novamente.',true);
      button.disabled=false;button.textContent='Enviar para moderação';
    }
  }
  document.addEventListener('click',e=>{
    if(e.target.closest('.crm-add-community-job')){e.preventDefault();open();}
    const home=e.target.closest('.crm-conexo-ctas [data-crm-route="publicar"]');
    if(home){e.preventDefault();e.stopImmediatePropagation();open();}
  },true);
  window.crmCommunityOpenJobDialog=open;
  window.openAnunciarVagaModal=open;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);
  else install();
  // Sem MutationObserver global: install() altera o DOM e um observer em body
  // reexecutava a rotina em loop infinito, congelando a página inteira.
})();