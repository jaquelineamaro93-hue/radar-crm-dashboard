begin;
select pg_advisory_xact_lock(hashtext('conexao-implementation-report-20261030'));
insert into public.conteudos_comunidade(titulo,subtitulo,corpo,autor_nome,tags,aprovado,imagem_url,categoria,tipo,material_url,imagem_alt,moderation_status,fonte_nome,idioma,destaque)
select 'Implementação de CRM 2026: dados, execução e gargalos','Report editorial da pesquisa Conexão CRM. 29 respostas consolidadas sobre dados legados, execução compartilhada, prazos e contexto.','Leitura exploratória da pesquisa de implementação de CRMs. Snapshot de 30/10/2026, com metodologia, gráficos acessíveis e dados agregados para download. Amostra de conveniência, sem representatividade do mercado.','Conexão CRM','CRM, Implementação, Dados & Analytics, Estratégia, Pesquisa 2026',true,'https://conexaocrm.com/assets/reports/implementacao-crm-2026/cover.svg','CRM','Guia','https://conexaocrm.com/conteudos/implementacao-crm-2026/','Capa do report de implementação de CRM da Conexão CRM','approved','Conexão CRM | pesquisa da comunidade','Português',false
where not exists (select 1 from public.conteudos_comunidade where material_url='https://conexaocrm.com/conteudos/implementacao-crm-2026/');
commit;
