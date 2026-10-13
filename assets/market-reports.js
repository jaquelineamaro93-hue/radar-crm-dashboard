
/* Conexão CRM — Open to Work market report, native portal view. */
(()=>{'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const brl=n=>n==null?'N/D':'R$ '+(Number(n)/1000).toLocaleString('pt-BR',{maximumFractionDigits:1})+'k';
const pct=n=>Number(n||0).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%';
const entries=o=>Object.entries(o||{});
const colors=['#ff8a3d','#a86a40','#d7a47e','#765443','#d0c2b5','#9b8b7e','#5f554d','#e0b18e'];
let reportCharts=[];

function tabs(){
 return '<div class="crm-panel-actions" style="margin:16px 0 0">'+
 '<button class="crm-button crm-outline" type="button" onclick="crmNavigate(\'cargos\')">Cargos &amp; Salários</button>'+
 '<button class="crm-button" type="button" aria-current="page" onclick="crmNavigate(\'mercado\')">Open to Work</button></div>';
}
function bar(id,title,data,h=380){
 return '<div class="card" style="min-height:'+h+'px;position:relative"><h3>'+esc(title)+'</h3><div style="height:'+(h-85)+'px;position:relative;margin:14px 0 4px"><canvas id="'+id+'"></canvas></div><p style="font-size:12px;color:#b8b1aa;margin:8px 0 0">Unidade: número de respostas · passe o cursor ou toque para detalhes</p>'+tableFor(id,data)+'</div>';
}
function total(rows){return rows.reduce((n,x)=>n+Number(x[1]||0),0)}
function top(rows){return [...rows].sort((a,b)=>Number(b[1]||0)-Number(a[1]||0))[0]}
function insight(rows,description){
 const sum=total(rows),leader=top(rows);
 if(!leader||!sum)return '<div class="note" role="note">Não há respostas suficientes para interpretar esta distribuição.</div>';
 const share=100*Number(leader[1])/sum;
 return '<div class="note" role="note" style="margin-top:12px"><b>Insight.</b> '+esc(description)+' <b>'+esc(leader[0])+'</b> lidera com <b>'+esc(Number(leader[1]).toLocaleString('pt-BR'))+'</b> respostas ('+esc(pct(share))+') entre '+esc(sum.toLocaleString('pt-BR'))+' respostas contabilizadas nesta dimensão.</div>';
}
function tableFor(id,rows){
 if(!rows.length)return '';
 return '<details class="crm-chart-data" style="margin-top:12px"><summary style="cursor:pointer;color:#ff9a54;font-weight:600">Ver dados e percentuais do gráfico</summary><div style="overflow-x:auto;margin-top:10px"><table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr><th style="text-align:left;padding:9px">Categoria</th><th style="text-align:right;padding:9px">Respostas</th><th style="text-align:right;padding:9px">Participação</th></tr></thead><tbody>'+rows.map(([name,value])=>'<tr><td style="padding:9px;border-top:1px solid #38332f">'+esc(name)+'</td><td style="text-align:right;padding:9px;border-top:1px solid #38332f">'+esc(Number(value||0).toLocaleString('pt-BR'))+'</td><td style="text-align:right;padding:9px;border-top:1px solid #38332f">'+esc(total(rows)?pct(Number(value||0)*100/total(rows)):'0%')+'</td></tr>').join('')+'</tbody></table></div></details>';
}
function destroy(){reportCharts.forEach(c=>{try{c.destroy()}catch{}});reportCharts=[]}
function chart(id,type,labels,data,opts={}){
 const canvas=document.getElementById(id);if(!canvas||!window.Chart)return;
 const horizontal=opts.horizontal;
 const c=new Chart(canvas,{
  type,
  data:{labels,datasets:[{label:opts.label||'Profissionais',data,backgroundColor:type==='doughnut'?colors:opts.color||'#ff8a3d',borderColor:opts.border||'#ff8a3d',borderWidth:type==='doughnut'?0:1,borderRadius:type==='bar'?4:0}]},
  options:{responsive:true,maintainAspectRatio:false,indexAxis:horizontal?'y':'x',
   plugins:{legend:{display:type==='doughnut',position:'bottom',labels:{boxWidth:12,usePointStyle:true,pointStyle:'circle'}},
    tooltip:{callbacks:{label:c=>{const v=Number(c.raw||0),sum=data.reduce((a,b)=>a+Number(b||0),0);return (c.label||'')+': '+v.toLocaleString('pt-BR')+' respostas'+(sum?' ('+pct(v*100/sum)+')':'');}}}},
   scales:type==='doughnut'?{}:{x:{grid:{color:'rgba(255,255,255,.05)'},ticks:{font:{size:10}}},y:{grid:{color:'rgba(255,255,255,.05)'},ticks:{font:{size:10}}}}
  }
 });reportCharts.push(c);
}
function normalizeExp(obj){
 const out={};
 for(const [k,v] of entries(obj)){
  const s=k.toLowerCase();
  let key=k;
  if(s.includes('mais de 6'))key='mais de 6 anos';
  else if(s.includes('5')&&s.includes('6'))key='entre 5 a 6 anos';
  else if(s.includes('4')&&s.includes('5'))key='entre 4 a 5 anos';
  else if(s.includes('3')&&s.includes('4'))key='entre 3 a 4 anos';
  else if(s.includes('2')&&s.includes('3'))key='entre 2 a 3 anos';
  else if(s.includes('1')&&s.includes('2'))key='entre 1 a 2 anos';
  else if(s.includes('menos de 1'))key='menos de 1 ano';
  out[key]=(out[key]||0)+Number(v||0);
 }
 return out;
}
function render(payload,date){
 const page=document.getElementById('pageDashboard');if(!page)return;
 destroy();
 const m=payload.metrics||{},d=payload.dimensions||{},method=payload.methodology||{};
 const senior=entries(d.senioridade);
 const model=entries(d.modalidade);
 const clt=entries(d.faixa_clt).filter(([k])=>k!=='Não informado');
 const pj=entries(d.faixa_pj).filter(([k])=>!['Não informado','-'].includes(k));
 const tools=d.ferramentas_top||[];
 const loc=d.localizacoes_top||[];
 const exp=entries(normalizeExp(d.experiencia));
 const stamp=new Date((date||method.updated_at||'2026-10-07')+'T12:00:00').toLocaleDateString('pt-BR');

 page.innerHTML=
 '<section><div class="section-head"><span class="section-num"></span><h2>Open to Work: retrato do mercado</h2></div>'+
 '<p class="section-desc">Perfil e expectativa salarial de profissionais de CRM em busca de oportunidade. Snapshot atualizado em <b>'+esc(stamp)+'</b>, sem exposição de contatos individuais.</p>'+tabs()+
 '<div class="stat-grid" style="margin-top:22px">'+
 '<div class="stat"><div class="num">'+esc(m.total_profissionais)+'</div><div class="label">Profissionais na base</div></div>'+
 '<div class="stat"><div class="num">'+esc(brl(m.clt_media))+'</div><div class="label">CLT médio estimado</div></div>'+
 '<div class="stat"><div class="num">'+esc(brl(m.pj_media))+'</div><div class="label">PJ médio estimado</div></div>'+
 '<div class="stat"><div class="num">'+esc(pct(m.hibrido_pct))+'</div><div class="label">Preferem híbrido</div></div></div></section>'+
 '<section><div class="section-head"><span class="section-num">01</span><h2>Quem está Open to Work</h2></div><p class="section-desc">Distribuição por senioridade e tempo de experiência da base atual.</p><div class="grid-2">'+
 bar('otwSenioridade','Senioridade',senior,390)+bar('otwExperiencia','Tempo de experiência',exp,390)+'</div>'+insight(senior,'Na senioridade,')+insight(exp,'No tempo de experiência,')+'</section>'+
 '<section><div class="section-head"><span class="section-num">02</span><h2>Modelo de trabalho</h2></div><div class="grid-2">'+
 bar('otwModalidade','Preferência de modalidade',model,390)+
 '<div class="card"><h3>Leitura</h3><ul class="insight-list"><li><b>Híbrido</b>: '+esc(pct(m.hibrido_pct))+' da base.</li><li><b>Remoto</b>: '+esc(pct(m.remoto_pct))+' da base.</li><li><b>Presencial</b>: '+esc(pct(m.presencial_pct))+' da base.</li><li><b>'+esc(pct(m.aceita_mudanca_pct))+'</b> consideram mudança de cidade.</li></ul></div></div></section>'+
 '<section><div class="section-head"><span class="section-num">03</span><h2>Expectativa salarial</h2></div><p class="section-desc">Faixas declaradas no formulário. As médias usam ponto médio nas faixas fechadas e o piso informado nas faixas abertas.</p><div class="grid-2">'+
 bar('otwClt','Distribuição de faixas CLT',clt,430)+bar('otwPj','Distribuição de faixas PJ',pj,430)+'</div>'+insight(clt,'Entre as faixas CLT informadas,')+insight(pj,'Entre as faixas PJ informadas,')+'</section>'+
 '<section><div class="section-head"><span class="section-num">04</span><h2>Ferramentas mais presentes</h2></div>'+bar('otwTools','Ferramentas citadas na experiência profissional',tools,470)+insight(tools,'Entre as ferramentas citadas,')+'</section>'+
 '<section><div class="section-head"><span class="section-num">05</span><h2>Onde estão os profissionais</h2></div>'+bar('otwLocations','Localizações mais citadas',loc,470)+insight(loc,'Entre as localizações mais citadas,')+'</section>'+
 '<section><div class="note"><b>Metodologia.</b> '+esc(method.salary_rule||'Faixas fechadas usam o ponto médio; faixas abertas usam o piso informado.')+' A base considera as respostas válidas do arquivo Open to Work atualizado. O report exibe somente dados agregados.</div></section>';

 chart('otwSenioridade','bar',senior.map(x=>x[0]),senior.map(x=>x[1]),{horizontal:true});
 chart('otwExperiencia','bar',exp.map(x=>x[0]),exp.map(x=>x[1]),{horizontal:true});
 chart('otwModalidade','doughnut',model.map(x=>x[0]),model.map(x=>x[1]));
 chart('otwClt','bar',clt.map(x=>x[0]),clt.map(x=>x[1]),{horizontal:true});
 chart('otwPj','bar',pj.map(x=>x[0]),pj.map(x=>x[1]),{horizontal:true});
 chart('otwTools','bar',tools.map(x=>x[0]),tools.map(x=>x[1]),{horizontal:true});
 chart('otwLocations','bar',loc.map(x=>x[0]),loc.map(x=>x[1]),{horizontal:true});
}
async function load(){
 const page=document.getElementById('pageDashboard');if(!page)return;
 try{
  const url=AUTH_SUPABASE_URL+'/rest/v1/crm_market_report_snapshots?report_key=eq.open_to_work&select=snapshot_date,payload&order=snapshot_date.desc&limit=1';
  const r=await fetch(url,{headers:{apikey:AUTH_SUPABASE_KEY,Authorization:'Bearer '+AUTH_SUPABASE_KEY},cache:'no-store'});
  if(!r.ok)throw Error('HTTP '+r.status);
  const rows=await r.json();if(!rows[0])throw Error('Snapshot não encontrado');
  render(rows[0].payload,rows[0].snapshot_date);
 }catch(e){
  page.querySelector('.crm-dashboard-intro')?.setAttribute('hidden','');
  const notice=document.createElement('div');notice.className='note';notice.textContent='Não foi possível carregar o snapshot atualizado do Open to Work agora. Tente novamente em instantes.';
  page.prepend(notice);
 }
}
function init(){load()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
