/* Conexão CRM · fields used by Freelancer create and edit flows.
   Only optional information that the member explicitly supplies may appear in a card. */
function crmFreelancerExtraFields(prefix,values={}){
 const esc=typeof escapeHtml==='function'?escapeHtml:s=>String(s||'').replace(/[&<>"']/g,'');
 const value=(key)=>esc(values[key]??'');
 const select=(key,items)=>'<select id="'+prefix+'_'+key+'" class="ev-ifield"><option value="">Não informar</option>'+items.map(([v,label])=>'<option value="'+v+'"'+(values[key]===v?' selected':'')+'>'+label+'</option>').join('')+'</select>';
 const text=(key,label,limit,placeholder='')=>'<label class="ev-ilabel" for="'+prefix+'_'+key+'">'+label+'</label><input id="'+prefix+'_'+key+'" class="ev-ifield" type="text" maxlength="'+limit+'" value="'+value(key)+'" placeholder="'+esc(placeholder)+'">';
 return '<fieldset class="cx-freelancer-extra"><legend>Informações do seu perfil freelancer</legend><p>Opcional. Mostramos no card apenas o que você preencher. Alterações em perfis existentes passam por aprovação.</p>'+
 text('titulo','Cargo ou especialidade',100,'Ex.: Especialista em CRM e Automação')+
 text('ferramentas','Ferramentas e competências',240,'Ex.: HubSpot, Salesforce, Automação')+
 '<div class="cx-freelancer-extra-grid"><label class="ev-ilabel">Anos de experiência<input id="'+prefix+'_anos_experiencia" class="ev-ifield" type="number" min="0" max="60" step="1" value="'+value('anos_experiencia')+'"></label>'+
 text('localidade','Cidade e estado ou região',120,'Ex.: São Paulo, SP')+'</div>'+
 text('idiomas','Idiomas',120,'Ex.: Português, Inglês')+
 '<div class="cx-freelancer-extra-grid"><label class="ev-ilabel">Modelo de atendimento'+select('modalidade',[['remoto','Remoto'],['hibrido','Híbrido'],['presencial','Presencial'],['flexivel','Flexível']])+'</label>'+
 '<label class="ev-ilabel">Disponibilidade'+select('disponibilidade',[['disponivel','Disponível'],['sob_consulta','Sob consulta'],['indisponivel','Indisponível no momento']])+'</label></div>'+
 '<div class="cx-freelancer-extra-grid"><label class="ev-ilabel">Valor por hora em R$ (opcional)<input id="'+prefix+'_valor_hora" class="ev-ifield" type="number" inputmode="decimal" min="0" max="100000" step="0.01" value="'+value('valor_hora')+'" placeholder="Ex.: 150,00"></label>'+
 '<label class="ev-ilabel">Foto de perfil (opcional)<input id="'+prefix+'_foto_file" class="ev-ifield" type="file" accept="image/jpeg,image/png,image/webp"><small>Até 2 MB. A foto ficará visível após aprovação.</small></label></div>'+
 (values.foto_url?'<small>Foto atual cadastrada. Escolha um arquivo somente para substituir.</small>':'')+
 '</fieldset>';
}
function crmFreelancerReadExtras(prefix){
 const read=key=>String(document.getElementById(prefix+'_'+key)?.value||'').trim();
 const fields={titulo:read('titulo'),ferramentas:read('ferramentas'),localidade:read('localidade'),idiomas:read('idiomas'),modalidade:read('modalidade'),disponibilidade:read('disponibilidade')};
 for(const [key,limit]of [['titulo',100],['ferramentas',240],['localidade',120],['idiomas',120]])if(fields[key].length>limit)throw Error('O campo '+key+' excede o limite permitido.');
 const exp=read('anos_experiencia'),rate=read('valor_hora').replace(',','.');
 if(exp&&!(/^(?:[0-9]|[1-5][0-9]|60)$/.test(exp)))throw Error('Informe anos de experiência entre 0 e 60.');
 if(rate&&(!/^\d{1,6}(?:\.\d{1,2})?$/.test(rate)||Number(rate)>100000))throw Error('Informe um valor por hora válido.');
 fields.anos_experiencia=exp===''?null:Number(exp);
 fields.valor_hora=rate===''?null:Number(rate);
 for(const k of Object.keys(fields))if(fields[k]==='')fields[k]=null;
 return fields;
}
async function crmFreelancerUploadPhoto(prefix){
 const file=document.getElementById(prefix+'_foto_file')?.files?.[0];
 if(!file)return null;
 if(!crmSignedIn()||!CURRENT_USER?.id||!authSb)throw Error('Entre na sua conta para enviar uma foto.');
 if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>2*1024*1024||file.size===0)
   throw Error('Use uma foto JPG, PNG ou WebP de até 2 MB.');
 const ext={'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[file.type];
 const path=CURRENT_USER.id+'/'+crypto.randomUUID()+'.'+ext;
 const {error}=await authSb.storage.from('freelancer-avatars').upload(path,file,{contentType:file.type,upsert:false});
 if(error)throw new Error('Não foi possível enviar a foto. Tente novamente.');
 const result=authSb.storage.from('freelancer-avatars').getPublicUrl(path);
 const url=result?.data?.publicUrl||'';
 if(!url.startsWith('https://'))throw Error('Foto enviada, mas não foi possível gerar o endereço.');
 return url;
}
