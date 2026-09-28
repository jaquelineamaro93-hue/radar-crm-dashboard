#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Carregar vagas CX/Customer Service no Supabase
Usa requests HTTP simples (sem SDK)
"""

import os
import json
import hashlib
from datetime import datetime
import requests

# Configurações
SUPABASE_URL = "https://rwkbpafpniwzvlkfngag.supabase.co"
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")

if not SUPABASE_ANON_KEY:
    print("❌ SUPABASE_ANON_KEY não configurada!")
    print("Use: export SUPABASE_ANON_KEY='sua-chave'")
    exit(1)

# Lista de títulos CX/Customer Service
TITULOS = [
    "Customer Success Manager",
    "Analista de Sucesso do Cliente Pleno",
    "Suporte Fiscal/Contábil (Soluções Domínio)",
    "Agente Técnico de Suporte Fiscal",
    "Analista de Customer Success Pleno",
    "Analista de Implantação Jr.",
    "Client Success Account Manager",
    "Supervisor(a) de Ouvidoria e Reclame Aqui",
    "Assistente de Implantação - Foco em Liberação",
    "Analista de Customer Success - Sênior",
    "Analista de Sucesso do Cliente",
    "Analista de atendimento ao Cliente",
    "Assistente de Sucesso do Cliente",
    "Customer Success Junior",
    "Analista de Success Ops",
    "Analista de Customer Success Pleno Bilíngue",
    "Analista de Sucesso do Cliente - Fintech",
    "Analista de implementação - Onboarding",
    "COORDENADOR(A) CUSTOMER SERVICE CRM",
    "Analista de Customer Service Pleno",
    "Analista de Customer Experience (CX)",
    "Supervisora de Customer Success | Remoto",
    "Assistente de Customer Happiness (Exclusiva PCD)",
    "Líder de Customer Happiness (Atendimento ao Cliente)",
    "Gerente de Atendimento",
    "Agente de Atendimento Digital",
    "Gerente de CRM Sênior",
    "Analista de Suporte ao Cliente (Customer Support)",
    "Analista de CS | Onboarding",
    "CS Strategy & Operations Manager",
    "Analista de Implementação Júnior - CS",
    "Analista de Implementação Pleno - CS",
    "Analista de Sucesso do Cliente Júnior",
    "Analista de Atendimento ao Cliente Pleno",
    "Customer Success Manager | LatAm",
    "Head de Customer Success",
    "Analista de Customer Success Sênior",
    "Especialista de Sucesso do Cliente I",
    "Analista Customer Success PL",
    "Assistente de Relacionamento com Cliente",
    "Analista de Customer Success - Pós Vendas",
    "Account Manager | Customer Success",
    "Analista de Customer Success Júnior",
    "Coordenador de Produto e Sucesso do Cliente",
    "Agente de Atendimento",
    "Customer Success | B2B",
    "Onboarding Specialist",
    "Consultor(a) de Sucesso do Cliente",
    "Analista de Sucesso do Cliente Pleno - Retenção Preditiva",
    "Consultor de atendimento ao cliente",
    "Analista de Relacionamento",
    "Agente de Central de Atendimento - Call center",
    "Agente de Central de Atendimento",
    "Analista Customer Success Pleno",
    "Atendimento e Suporte de Portais (Customer Support/Customer Success) Pleno",
    "Assessor de Negócios Onboarding Sênior",
    "Analista de Atendimento Pleno",
    "Analista de Consumer Market Insights Sênior (CMI)",
    "Analista de CRM Pleno",
    "Consultor de Relacionamento Pleno",
    "Analista Customer Success Sênior",
    "Customer Success Manager, Consumer Product Testing Platform",
    "Coordenador(a) de Atendimento Digital",
    "Assistente de sucesso do Cliente (CSM) - Customer Success / CS / Customer Experience / CX",
    "Customer Support Team Lead (Night Shifts)",
    "Coordenador(a) de Customer Success | Onboarding",
    "Analista de CS Ops Pleno",
    "Pessoa Analista de Jornada do Cliente",
    "Analista de Operações Pleno",
    "Pessoa Executiva de Relacionamento com Clientes",
    "Analista de Onboarding Júnior",
    "Analista de CS Júnior",
    "Consultor(a) de Relacionamento Júnior",
    "Consultor(a) de Relacionamento Pleno",
    "Analista de Customer Experience - Ouvidoria",
    "Analista de Atendimento ao Cliente SAC",
    "Analista de atendimento - CX",
    "Estágio em Customer Success Ops",
    "Coordenador (a) de Implantação",
    "Gerente de Operações de Clientes (Suporte & Implantação)",
    "[CS] Especialista em Customer Experience | Qualtrics",
    "[CS] Analista de Customer Success Pleno (Remoto)",
    "[CS] Analista de Customer Success Sênior (Remoto)",
    "[CS] Analista de Customer Success Sênior | RH",
    "Sr. Customer Success | Workise",
    "Customer Success | Kompelys",
    "Analista de Customer Success Grandes Contas/Enterprise",
    "Pessoa Analista de Customer Success - Contas Pequenas e médias | SMB",
    "Analista de Customer Onboarding JR",
    "Analista de Customer Success Pl - Expansão de Receita",
    "Assistente de Customer Experience",
    "Analista de Retenção (Remoto)",
    "Analista de Sucesso do Cliente (CSM) - Remoto",
    "Analista Customer Success - Adoção",
    "Sr Specialist - Customer Success Manager",
    "Senior Customer Success Manager",
    "Customer Sucess Sênior",
    "Senior Customer Success",
    "Customer Experience Manager",
    "Analista de Customer Success & Growth Sr.",
    "Gerente de Relacionamento II (Customer Success)",
    "Analista de Customer Success Sênior | SMB",
    "Analista de Inteligência de Mercado Pleno",
    "Auxiliar de Sucesso do Cliente",
    "ANALISTA DE ATENDIMENTO JR",
    "Analista de Customer Success Pleno - Incentivo de Uso",
    "Especialista de CRM",
    "Pessoa Consultora de Customer Success Pleno | Expansão",
    "Analista de Engajamento",
    "Assistente Relacionamento Cliente",
    "Assistente de Atendimento - Híbrido - BH/MG",
    "Coordenador de Eficiência e Soluções",
    "Analista de Experiência do Cliente III (BPO)",
    "Pessoa Gestora de Atendimento/SAC",
    "ANALISTA CUSTOMER EXPERIENCE E INSIGHTS SR",
    "Customer Success Manager - CSM | Analista de Sucesso do Cliente",
    "Especialista de Customer Success",
    "ANALISTA ATENDIMENTO",
    "EXECUTIVO DE SERVIÇO AO CLIENTE",
    "Pessoa Analista de Sucesso em Licitação",
    "Analista de Customer Success (CS) – Proprietários",
    "Customer Success Advocate: Tech Touch Centralization",
    "Analista de Implementação Pleno (Multivarejo)",
    "Especialista em Processos e Projetos (Sucesso do Contador)",
    "Analista de Sucesso do Cliente PL (Retenção)",
    "Analista de Sucesso do Cliente PL (Health Score)",
    "Customer Success Analyst JR",
    "Customer Success Manager | Enterprise | Remoto",
    "Analista de Atendimento - Ouvidoria",
    "Analista Atendimento Junior",
    "Analista Suporte Junior",
    "Analista de Atendimento Contábil e Fiscal Pl | Remoto",
    "Pessoa Customer Success Manager Pleno",
    "Analista Customer Service",
    "Customer Success",
    "Customer Experience Specialist",
    "Coordenador de atendimento",
    "Client Solutions Manager (CSM) - Real Money Gaming",
    "Analista de Sucesso do Cliente",
    "Analista de Produtos Senior - Customer Success especialista em Plataforma",
    "Client Solutions Manager, Amazon",
    "[Produto RH] Coordenador de Experiência do Cliente",
    "ANALISTA DE CUSTOMER SERVICE",
    "Analista de Experiência do Cliente SR",
    "Analista de Customer Experience Jr.",
    "Analista de Qualidade na Experiência do Cliente & Onboarding",
    "Analista de Sucesso do Cliente (CSM) - Híbrido SP",
    "Analista de Sucesso do Cliente (CSM)",
    "Junior Customer Support Specialist",
    "Analista de Customer Success Junior - Chile",
    "Analista de Treinamento Pleno",
    "Coordenador(a) de Customer Service - São Paulo",
    "Analista de Experiência do Cliente Sênior",
    "CX | Analista de Customer Experience Junior | São Paulo - SP",
    "ISM · Implementation Success Specialist [Sênior]",
    "Analista de Customer Success (SaaS)",
    "Analista de Customer Success - Foco em Onboarding de Clientes",
    "Assistente de Atendimento - Cobrança e Retenção",
    "Assistente de Customer Experience - Atendimento",
    "Líder de Atendimento",
    "Senior Specialist, Customer Success - NGSS SIGNAL",
    "Analista de Operações",
    "Analista de Customer Experience Sr (Foco em Dados)",
    "Líder Control Desk | Central de Agendamentos",
    "Analista de Atendimento | Service Desk B2B - Pleno",
    "Analista de Atendimento | Service Desk B2B - Júnior",
    "[Customer Success] Analista de Customer Success Sênior - Produto RH",
    "Analista PL. de CX e CS",
    "Assistente de Relacionamento",
    "Coordenador de Customer Success",
    "ANALISTA DE SUCESSO DO CLIENTE (CLT)",
    "Analista de Customer Success - Sênior",
    "CX - Atendimento ao Cliente",
    "ANALISTA DE SUCESSO DO CLIENTE PLENO",
    "Analista de CX - Pleno",
    "Analista de Customer Success Junior",
    "Assistente de Atendimento N1",
    "Customer Success & Implementation Manager",
    "Assistente de Customer Happiness (Atendimento ao Cliente)",
    "Analista de Suporte - Atendimento ao Cliente (B2B ou B2C)",
    "CAS | Analista de Atendimento JR",
    "SUPERVISOR DE ATENDIMENTO",
    "ESPECIALISTA EXPERIENCIA DO CLIENTE",
    "Analista de Customer Success - Themis",
    "Analista de Sucesso do Cliente Pleno - Ongoing",
    "Analista Sênior de Processos e Automação",
    "Assistente de Relacionamento",
    "Assistente de Atendimento II",
    "ANALISTA DE RELACIONAMENTO",
    "Analista de Sucesso do Cliente PL (Onboarding)",
    "Analista de Sucesso do Cliente SR (Engajamento)",
    "Analista de Sucesso do Cliente PL - Retenção (Cancelamentos)",
    "Analista de Sucesso do Cliente PL - (Key Account)",
    "Coordenador(a) de Suporte",
    "Analista de Relacionamento Pleno (Saúde)",
    "Analista de Implantação",
    "Pessoa Supervisora de Onboarding",
    "Assistente de NPS",
    "Consultor de Sucesso do Cliente - RJ",
    "Supervisor de CRM",
    "Consultor de Sucesso do Cliente",
    "Especialista de Sucesso do Cliente",
    "Pessoa Especialista de Sucesso do Cliente",
    "Analista Pleno de Customer Success — (RAF)",
    "Analista Pleno de Experiência do Cliente (CX Melhoria Contínua)",
    "Supervisor(a) de Customer Success e Customer Experience (CS/CX)",
    "Coordenador de Jornada de Clientes",
    "Pessoa Estagiária em Suporte ao Cliente SaaS (Remoto)",
    "Pessoa Gerente de Operações BPO (Conversão)",
    "Líder Central de Relacionamento",
    "Supervisor de Equipe (Central de Atendimento)",
    "Supervisor(a) de Relacionamento Clientes",
    "Gerente de Customer Success",
    "Customer Experience Team Leader",
    "Senior Customer Success Manager (Portuguese Speaking)",
    "Executivo do Sucesso do Cliente Sr",
    "Customer Success Sênior",
    "Analista Sucesso do Cliente Sr - Sustentabilidade",
    "Gerente de Customer Success - Capital Market",
    "Supervisor de Atendimento",
    "Supervisor de Pós-vendas",
    "Coordenador(a) de Customer Experience",
    "Sr Customer Success Manager",
    "Especialista em Customer Success",
    "Analista de CX e Insights Júnior | Insights",
    "Analista Pl. de Experiência do Cliente",
    "CUSTOMER SUCCESS ANALYST III",
    "Analista de Performance e Inteligência de Mercado",
    "Customer Success Pleno",
    "Customer Success Specialist (B2B SaaS)",
    "Gerente de Customer Success",
    "Gerente de Contas - Sucesso do Cliente - Farmer",
    "CSM Lead",
    "Gerente de Sucesso do Cliente",
    "Customer Success Manager (Tecnologia e SaaS B2B)",
    "Analista de Suporte N1 (Júnior)",
    "Customer Success Manager- Marketing Cloud",
    "Analista de CX Sênior",
    "Especialista de Customer Experience",
    "Customer Engagement Client Manager",
    "Pessoa Especialista de CX (Dados/Insights)",
    "Analista de Customer Experience Sênior",
    "Especialista de Onboarding e Ativação de Clientes",
    "Assistente de Experiência do Cliente (CX)",
    "Customer Success Specialist",
    "Especialista em Customer Success",
    "Customer Experience & Strategy Manager",
    "Especialista de Experiencia do Cliente",
    "Analista de Suporte Júnior - PL/SQL",
    "Analista de Customer Experience Sr. | São Paulo",
    "Analista Sênior de Sucesso do Cliente | Dados e Integrações",
    "Especialista em Consumer Insights | Pesquisa de Clientes & Mercado",
    "Analista de Relacionamento com o Cliente Pleno (CX)",
    "ANALISTA DE EXPERIENCIA DO CLIENTE SR",
    "Especialista de Estratégia do Cliente",
    "Sr. CS Strategy & Operations Analyst",
    "Analista de Experiência e Relacionamento com Clientes",
    "Especialista de CX — Foco em Atendimento e NPS",
    "Analista de Estratégia do Cliente SR",
    "Analista de Experiência do Cliente - Pleno - Híbrido - Campinas",
    "Especialista de Customer Experience (CX) - B2B",
    "Customer Experience Analyst (Brazil, remote)",
    "Especialista de Inteligência Comercial - Petz Holding",
    "Analista de NPS (Customer Success)",
    "Analista de Pesquisa e Inteligência de Mercado",
    "Analista de Consumer Insights",
    "Analista de Relacionamento com Cliente",
    "Analista de Inteligência de Mercado e Pesquisa",
    "Consultor(a) Sênior de Estratégia de CRM & Customer Engagement",
    "Analista de CRM Sr. (Dados)",
    "Analista de Customer Experience (CX)",
    "Analista de Sucesso do Cliente | Jornada",
    "Customer Experience Analytics SR Analyst",
    "Analista de Customer Experience",
    "Analista de Insights Pleno",
    "Analista de Experiência do Cliente Pleno (CX)",
    "Customer Success | Retenção & Expansão (Cross)",
    "Customer Success (CS)",
    "Customer Success Manager - Remote, Brazil",
    "Engagement Delivery Senior Manager",
    "Services Business Strategy Senior Manager",
    "Consultant, Client Success",
    "Analista de Customer Success | Implantação PL",
    "Coordenador de Atendimento ao Cliente",
    "Analista Sr. Customer Care - Gestão de Call Center",
    "Analista Sucesso do Cliente Sênior - Key Account",
    "Customer Success Manager | Enterprise | Remoto",
    "Senior Specialist, Customer Success - NGSS SIGNAL",
    "Customer Success Manager Pleno",
    "Analista de Relacionamento Sênior",
    "Customer Success Sênior | B2B Farma",
    "Customer Success Manager - AMER",
    "Pessoa Technical Customer Success Sênior (StackSpot)",
]

def gerar_url_unica(titulo: str) -> str:
    """Gera URL única baseada no hash do título"""
    hash_obj = hashlib.md5(titulo.encode())
    hash_hex = hash_obj.hexdigest()[:8]
    return f"https://conexaocrm.com/vaga/cx-{hash_hex}"

def carregar_vagas():
    """Carrega vagas via API REST Supabase"""

    # Remover duplicatas
    titulos_unicos = sorted(list(set(TITULOS)))

    print(f"📊 Total de títulos únicos: {len(titulos_unicos)}")
    print("=" * 60)

    # Preparar dados
    vagas = []
    for titulo in titulos_unicos:
        vaga = {
            "titulo": titulo,
            "descricao": f"Vaga de {titulo} - Área CX/Customer Service",
            "categoria": "CX/Customer Service",
            "scraper_url": gerar_url_unica(titulo),
            "ativo": True,
            "data_coleta": datetime.now().isoformat()
        }
        vagas.append(vaga)

    # Inserir via API REST (com UPSERT no conflito de URL)
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }

    LOTE_SIZE = 100
    total = 0

    for i in range(0, len(vagas), LOTE_SIZE):
        lote = vagas[i:i + LOTE_SIZE]

        try:
            # Usar upsert via POST com on_conflict
            url = f"{SUPABASE_URL}/rest/v1/vagas?on_conflict=scraper_url"
            response = requests.post(url, json=lote, headers=headers, timeout=30)

            if response.status_code in [200, 201]:
                total += len(lote)
                print(f"✅ Lote {i//LOTE_SIZE + 1}: {len(lote)} vagas")
            else:
                print(f"❌ Erro lote {i//LOTE_SIZE + 1}: {response.status_code}")
                print(f"   Resposta: {response.text}")

        except Exception as e:
            print(f"❌ Erro no lote {i//LOTE_SIZE + 1}: {str(e)}")

    print("=" * 60)
    print(f"🎉 Total carregado: {total} vagas CX/Customer Service")
    print(f"📍 Categoria: CX/Customer Service")
    print(f"🔗 Acesse: https://conexaocrm.com")

if __name__ == "__main__":
    carregar_vagas()
