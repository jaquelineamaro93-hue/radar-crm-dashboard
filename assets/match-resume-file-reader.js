/* Private Match resume: user-controlled, client-only document reader.
 * No file upload, no remote parsing, no automatic save, no AI inference. */
(()=>{'use strict';
if(window.CXResumeDocumentReader)return;
const MAX_BYTES=5*1024*1024,MAX_PAGES=30,MAX_CHARS=100000;
const PDF_LIB='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs';
const PDF_WORKER='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
const DOCX_LIB='https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.10.0/mammoth.browser.min.js';
let pdfLibPromise=null,docxPromise=null;
function normalize(text){
 return String(text||'').replace(/\r\n?/g,'\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/[ \t]+\n/g,'\n').replace(/\n{4,}/g,'\n\n\n').trim().slice(0,MAX_CHARS);
}
function importPdf(){
 if(!pdfLibPromise)pdfLibPromise=import(PDF_LIB).then(lib=>{
  lib.GlobalWorkerOptions.workerSrc=PDF_WORKER;return lib;
 }).catch(error=>{pdfLibPromise=null;throw error;});
 return pdfLibPromise;
}
function importDocx(){
 if(window.mammoth?.extractRawText)return Promise.resolve(window.mammoth);
 if(docxPromise)return docxPromise;
 docxPromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  script.src=DOCX_LIB;script.crossOrigin='anonymous';
  script.onload=()=>window.mammoth?.extractRawText?resolve(window.mammoth):reject(Error('Leitor DOCX indisponível.'));
  script.onerror=()=>reject(Error('Não foi possível carregar o leitor DOCX. Verifique sua conexão.'));
  document.head.append(script);
 }).catch(error=>{docxPromise=null;throw error;});
 return docxPromise;
}
async function extractText(file){
 if(!file)throw Error('Selecione um arquivo para ler.');
 if(!file.size||file.size>MAX_BYTES)throw Error('Use um arquivo de até 5 MB.');
 const name=String(file.name||'').toLowerCase();
 if(!/\.(pdf|docx|txt|md)$/.test(name))throw Error('Formatos aceitos: PDF, DOCX, TXT e MD.');
 const type=name.slice(name.lastIndexOf('.')+1);
 let result='';
 if(type==='txt'||type==='md'){
  result=await file.text();
 }else if(type==='docx'){
  const lib=await importDocx();
  const output=await lib.extractRawText({arrayBuffer:await file.arrayBuffer()});
  result=output.value||'';
 }else{
  const lib=await importPdf();
  const documentPdf=await lib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
  try{
   const pages=Math.min(documentPdf.numPages,MAX_PAGES);
   const chunks=[];
   for(let n=1;n<=pages;n++){
    const page=await documentPdf.getPage(n);
    const data=await page.getTextContent();
    chunks.push(data.items.map(item=>typeof item.str==='string'?item.str:'').join(' '));
    if(chunks.join('\n').length>=MAX_CHARS)break;
   }
   result=chunks.join('\n');
  }finally{await documentPdf.destroy();}
 }
 const extracted=normalize(result);
 if(extracted.length<40)throw Error('Não encontrei texto suficiente. O arquivo pode ser uma imagem digitalizada. Cole o texto manualmente.');
 return extracted;
}
function mount(overlay){
 if(!overlay||overlay.id!=='crmMatchResumeOverlay'||overlay.dataset.cxResumeReader==='1')return false;
 const form=overlay.querySelector('#crmMatchResumeForm');
 const cv=form?.querySelector('textarea[name="cv"]');
 if(!cv)return false;
 overlay.dataset.cxResumeReader='1';
 const card=document.createElement('section');
 card.className='cx-resume-import';
 card.setAttribute('aria-label','Importação de currículo');
 const heading=document.createElement('label');heading.textContent='Ler currículo de um arquivo';
 const input=document.createElement('input');
 input.type='file';input.accept='.pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown';
 const hint=document.createElement('p');
 hint.textContent='PDF, DOCX ou texto até 5 MB. A leitura acontece neste navegador. Você revisa antes de usar e salvar.';
 const row=document.createElement('div');row.className='cx-resume-import-actions';
 const read=document.createElement('button');read.type='button';read.textContent='Ler arquivo';
 const apply=document.createElement('button');apply.type='button';apply.textContent='Usar texto no currículo';apply.disabled=true;
 const status=document.createElement('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const preview=document.createElement('details');preview.hidden=true;
 const summary=document.createElement('summary');summary.textContent='Prévia do texto reconhecido';
 const pre=document.createElement('pre');pre.className='cx-resume-import-preview';
 preview.append(summary,pre);
 let candidate=null;
 input.addEventListener('change',()=>{candidate=null;apply.disabled=true;preview.hidden=true;status.textContent='';});
 read.addEventListener('click',async()=>{
  if(!input.files?.[0]){status.textContent='Escolha um arquivo para iniciar.';return;}
  read.disabled=true;apply.disabled=true;candidate=null;status.textContent='Lendo arquivo no seu dispositivo...';
  try{
   const parsed=await extractText(input.files[0]);
   if(!overlay.isConnected)return;
   candidate=parsed;
   pre.textContent=parsed.slice(0,900)+'\n[...]';
   preview.hidden=false;
   apply.disabled=false;
   status.textContent='Texto extraído: '+new Intl.NumberFormat('pt-BR').format(parsed.length)+' caracteres. Confira a prévia antes de aplicar.';
  }catch(error){status.textContent=error.message||'Não foi possível ler o arquivo. Você pode colar o texto manualmente.';}
  finally{read.disabled=false;}
 });
 apply.addEventListener('click',()=>{
  if(!candidate||!overlay.isConnected)return;
  if(cv.value.trim()&&!window.confirm('Substituir o texto do currículo atual pelo texto extraído? O conteúdo existente só será substituído neste formulário, até você salvar.'))return;
  cv.value=candidate;
  cv.dispatchEvent(new Event('input',{bubbles:true}));
  status.textContent='Texto colocado no currículo. Revise título, competências e experiências antes de salvar. Nenhuma alteração foi enviada.';
  cv.focus();
 });
 row.append(read,apply);card.append(heading,input,hint,row,status,preview);
 const label=cv.closest('label');
 if(label)label.before(card);else form.prepend(card);
 return true;
}
function refresh(){
 document.querySelectorAll('#crmMatchResumeOverlay').forEach(mount);
}
const observer=new MutationObserver(records=>{
 if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&(n.id==='crmMatchResumeOverlay'||n.querySelector?.('#crmMatchResumeOverlay')))))refresh();
});
function start(){if(document.body)observer.observe(document.body,{subtree:true,childList:true});refresh();}
window.CXResumeDocumentReader=Object.freeze({mount,extractText});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
