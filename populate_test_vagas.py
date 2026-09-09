#!/usr/bin/env python3
"""
Script para popular a tabela vagas_crm com dados de teste realistas.
Útil para testar o dashboard quando o bot não consegue fazer scraping.

Uso:
  python3 populate_test_vagas.py
"""
import os
from datetime import datetime, timedelta
from supabase import create_client, Client

# Configuração Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://rwkbpafpniwzvlkfngag.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY", "")

if not SUPABASE_KEY:
    print("❌ SUPABASE_ANON_KEY não configurada")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Dados de teste realistas para o ecossistema CRM/Growth/RevOps
TEST_VAGAS = [
    {
        "title": "Especialista em HubSpot CRM",
        "company": "Tech Solutions Brasil",
        "location": "São Paulo, SP",
        "description": "Procuramos especialista em HubSpot com experiência em implementação e customização. 3+ anos de experiência.",
        "cargo": "HubSpot Specialist",
        "empresa": "Tech Solutions Brasil",
        "nivel": "Senior",
        "regiao": "São Paulo",
        "modelo": "Tempo integral",
        "tipo_contrato": "CLT",
        "tempo_experiencia": "3-5 anos",
        "salario": 8000,
        "source": "linkedin.com",
        "crm_utilizado": "HubSpot",
        "porte_empresa": "Grande",
        "ramo": "Tecnologia"
    },
    {
        "title": "Growth Marketing Specialist",
        "company": "StartupX Growth",
        "location": "Remote",
        "description": "Buscamos Growth Marketing Specialist com experiência em automação de marketing e análise de dados.",
        "cargo": "Growth Marketing",
        "empresa": "StartupX Growth",
        "nivel": "Mid",
        "regiao": "Remote",
        "modelo": "Home Office",
        "tipo_contrato": "CLT",
        "tempo_experiencia": "2-3 anos",
        "salario": 6500,
        "source": "vagas.com",
        "crm_utilizado": "HubSpot",
        "porte_empresa": "Startup",
        "ramo": "Marketing"
    },
    {
        "title": "Salesforce Administrator",
        "company": "Enterprise Solutions Inc",
        "location": "São Paulo, SP",
        "description": "Administrator Salesforce para gestão de pipeline de vendas. Experiência com customizações e integrações.",
        "cargo": "Salesforce Admin",
        "empresa": "Enterprise Solutions Inc",
        "nivel": "Mid",
        "regiao": "São Paulo",
        "modelo": "Tempo integral",
        "tipo_contrato": "CLT",
        "tempo_experiencia": "2-3 anos",
        "salario": 7000,
        "source": "catho.com",
        "crm_utilizado": "Salesforce",
        "porte_empresa": "Grande",
        "ramo": "Tecnologia"
    },
    {
        "title": "RevOps Engineer",
        "company": "SaaS Unicorn",
        "location": "Remote",
        "description": "Engenheiro de RevOps para otimizar pipeline de vendas e operações. Conhecimento em Salesforce e automação.",
        "cargo": "RevOps Engineer",
        "empresa": "SaaS Unicorn",
        "nivel": "Senior",
        "regiao": "Remote",
        "modelo": "Home Office",
        "tipo_contrato": "PJ",
        "tempo_experiencia": "5+ anos",
        "salario": 12000,
        "source": "linkedin.com",
        "crm_utilizado": "Salesforce",
        "porte_empresa": "Startup",
        "ramo": "SaaS"
    },
    {
        "title": "Especialista em Braze",
        "company": "E-commerce Digital",
        "location": "Remote",
        "description": "Especialista em plataforma Braze para campanhas de marketing e comunicação. 2+ anos de experiência.",
        "cargo": "Braze Specialist",
        "empresa": "E-commerce Digital",
        "nivel": "Mid",
        "regiao": "Remote",
        "modelo": "Home Office",
        "tipo_contrato": "CLT",
        "tempo_experiencia": "2-3 anos",
        "salario": 7500,
        "source": "vagas.com",
        "crm_utilizado": "Braze",
        "porte_empresa": "Grande",
        "ramo": "E-commerce"
    },
    {
        "title": "AI Agent Developer",
        "company": "AI Lab Brasil",
        "location": "São Paulo, SP",
        "description": "Desenvolvedor para criar agentes de IA inteligentes. Experiência com Python, LangChain e APIs de IA.",
        "cargo": "AI Agent Developer",
        "empresa": "AI Lab Brasil",
        "nivel": "Senior",
        "regiao": "São Paulo",
        "modelo": "Tempo integral",
        "tipo_contrato": "CLT",
        "tempo_experiencia": "3-5 anos",
        "salario": 10000,
        "source": "99jobs.com",
        "crm_utilizado": "Custom",
        "porte_empresa": "Startup",
        "ramo": "Tecnologia"
    },
    {
        "title": "CRM Business Analyst",
        "company": "Consultoria Empresarial",
        "location": "Rio de Janeiro, RJ",
        "description": "Analista de CRM para mapear processos e implementar soluções. Experiência com Salesforce e Dynamics.",
        "cargo": "CRM Analyst",
        "empresa": "Consultoria Empresarial",
        "nivel": "Mid",
        "regiao": "Rio de Janeiro",
        "modelo": "Tempo integral",
        "tipo_contrato": "CLT",
        "tempo_experiencia": "2-3 anos",
        "salario": 6800,
        "source": "infojobs.com",
        "crm_utilizado": "Salesforce",
        "porte_empresa": "Grande",
        "ramo": "Consultoria"
    },
    {
        "title": "Automação de Marketing",
        "company": "Digital Agency Pro",
        "location": "Remote",
        "description": "Especialista em automação de marketing para campanhas de email e lead nurturing. Hubspot ou Marketo.",
        "cargo": "Marketing Automation",
        "empresa": "Digital Agency Pro",
        "nivel": "Mid",
        "regiao": "Remote",
        "modelo": "Home Office",
        "tipo_contrato": "CLT",
        "tempo_experiencia": "2-3 anos",
        "salario": 6500,
        "source": "vagas.com",
        "crm_utilizado": "HubSpot",
        "porte_empresa": "Média",
        "ramo": "Marketing"
    },
    {
        "title": "Gestor de RD Station",
        "company": "MarTech Brasil",
        "location": "Remote",
        "description": "Especialista em RD Station para automação e gestão de leads. Experiência com integração de CRM.",
        "cargo": "RD Station Manager",
        "empresa": "MarTech Brasil",
        "nivel": "Junior",
        "regiao": "Remote",
        "modelo": "Home Office",
        "tipo_contrato": "CLT",
        "tempo_experiencia": "1-2 anos",
        "salario": 4500,
        "source": "linkedin.com",
        "crm_utilizado": "RD Station",
        "porte_empresa": "Média",
        "ramo": "MarTech"
    },
    {
        "title": "Forward Deployed Engineer",
        "company": "Tech Innovations",
        "location": "São Paulo, SP",
        "description": "FDE para trabalhar junto aos clientes em implementação de CRM e automação. 3+ anos de experiência.",
        "cargo": "Forward Deployed Engineer",
        "empresa": "Tech Innovations",
        "nivel": "Senior",
        "regiao": "São Paulo",
        "modelo": "Tempo integral",
        "tipo_contrato": "CLT",
        "tempo_experiencia": "3-5 anos",
        "salario": 9000,
        "source": "linkedin.com",
        "crm_utilizado": "Salesforce",
        "porte_empresa": "Grande",
        "ramo": "Tecnologia"
    }
]

def generate_url_hash(url: str) -> str:
    """Gera hash da URL para deduplicação"""
    import hashlib
    return hashlib.md5(url.encode()).hexdigest()

def populate_test_data():
    """Popula tabela com dados de teste"""
    print("📝 Populando vagas_crm com dados de teste realistas...")

    # Calcula datas variadas nos últimos 30 dias
    base_date = datetime.now()

    inserted = 0
    for idx, vaga in enumerate(TEST_VAGAS):
        # Alterna entre os últimos 30 dias
        days_ago = (idx % 30)
        vaga['found_at'] = base_date - timedelta(days=days_ago)
        vaga['url'] = f"https://example.com/vaga-{idx+1}"
        vaga['url_hash'] = generate_url_hash(vaga['url'])

        try:
            response = supabase.table('vagas_crm').insert(vaga, ignore_duplicates=True).execute()
            inserted += 1
            print(f"✅ {vaga['title']} ({vaga['location']})")
        except Exception as e:
            print(f"❌ Erro ao inserir {vaga['title']}: {e}")

    print(f"\n✅ Total inserido: {inserted} vagas de teste")
    print("\n📊 Dashboard agora pode ser testado com dados realistas!")
    print("   Acesse: https://conexaocrm.com e veja as vagas na aba 'Vagas de CRM'")

if __name__ == "__main__":
    populate_test_data()
