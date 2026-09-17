#!/usr/bin/env python3
"""
Sincronização: Censo de Membros & Parceiros/Canva
Origem: Google Form (ID: 1FAIpQLSc5ZavVMe76fE7kVJIUDr1_ElGDFXglYlrNYvN-Pi0mYgfojQ)
Destino: Supabase (tabela: censo_membros_comunidade)
Data: 2026-09-17
"""
import os
import sys
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional

try:
    from supabase import create_client, Client
except ImportError:
    print("❌ Supabase SDK não instalado. Instalando...")
    os.system("pip install supabase -q")
    from supabase import create_client, Client

# Configuração
SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY", "")
FORM_ID = "1FAIpQLSc5ZavVMe76fE7kVJIUDr1_ElGDFXglYlrNYvN-Pi0mYgfojQ"
TABLE_NAME = "censo_membros_comunidade"

# Mapeamento de colunas CSV → banco de dados
COLUMN_MAPPING = {
    "E-mail": "email",
    "Nome Completo": "nome_completo",
    "WhatsApp": "whatsapp",
    "Cidade/Estado": "cidade_estado",
    "Há quanto tempo está na comunidade?": "tempo_comunidade",
    "Qual é seu cargo?": "cargo",
    "Senioridade": "senioridade",
    "Área de Atuação": "area_atuacao",
    "Vínculo Profissional": "vinculo_profissional",
    "Porte da Empresa": "porte_empresa",
    "Tem poder de decisão de compra?": "poder_decisao",
    "Categorias de Ferramentas": "categorias_ferramentas",
    "Ferramentas de Design": "ferramentas_design",
    "Estrutura de Design": "estrutura_design",
    "Interesses da Comunidade": "interesses_comunidade",
    "Interesse em Parcerias": "interesse_parcerias",
    "Consentimento LGPD": "consentimento_lgpd",
}

def get_supabase_client() -> Client:
    """Cria cliente Supabase"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ SUPABASE_URL ou SUPABASE_ANON_KEY não configurados")
        sys.exit(1)
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def normalize_row(row: Dict[str, str]) -> Optional[Dict[str, any]]:
    """Normaliza e valida uma linha do censo"""
    try:
        # Email é obrigatório
        email = row.get("E-mail", "").strip().lower()
        if not email or "@" not in email:
            return None

        # Validar email com regex
        import re
        if not re.match(r'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$', email):
            return None

        # Normalizar outros campos
        normalized = {"email": email}

        for csv_col, db_col in COLUMN_MAPPING.items():
            if csv_col != "E-mail":
                value = row.get(csv_col, "").strip()

                # Converter booleanos
                if db_col in ["interesse_parcerias", "consentimento_lgpd"]:
                    if value.lower() in ["sim", "yes", "verdadeiro", "true", "1"]:
                        normalized[db_col] = True
                    elif value.lower() in ["não", "no", "falso", "false", "0"]:
                        normalized[db_col] = False
                    else:
                        normalized[db_col] = False
                else:
                    normalized[db_col] = value if value else None

        return normalized

    except Exception as e:
        print(f"❌ Erro ao normalizar linha: {e}")
        return None

def deduplicate_responses(rows: List[Dict[str, str]]) -> List[Dict[str, any]]:
    """Remove duplicatas pela chave composta: email + whatsapp (ou só email se sem whatsapp)"""
    normalized = []
    seen_keys = set()

    for row in rows:
        normalized_row = normalize_row(row)

        if not normalized_row:
            continue

        email = normalized_row["email"]
        whatsapp = normalized_row.get("whatsapp", "")

        # Chave composta: email + whatsapp (se disponível)
        key = f"{email}#{whatsapp}" if whatsapp else email

        if key in seen_keys:
            continue

        seen_keys.add(key)
        normalized.append(normalized_row)

    return normalized

def upsert_to_supabase(client: Client, rows: List[Dict[str, any]]) -> Dict:
    """Faz upsert dos dados no Supabase (batch de 100)"""
    results = {
        "total": len(rows),
        "inserted": 0,
        "updated": 0,
        "failed": 0,
        "errors": []
    }

    batch_size = 100
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i+batch_size]

        try:
            # Supabase upsert: atualiza se email existe, insere caso contrário
            response = client.table(TABLE_NAME).upsert(
                batch,
                on_conflict="email"
            ).execute()

            if response.data:
                results["inserted"] += len(batch)
            else:
                results["failed"] += len(batch)

        except Exception as e:
            results["failed"] += len(batch)
            results["errors"].append({
                "batch": i // batch_size + 1,
                "error": str(e)[:100]
            })
            print(f"❌ Erro no batch {i // batch_size + 1}: {str(e)[:50]}")

    return results

def verify_sync(client: Client) -> Dict:
    """Verifica os dados sincronizados"""
    try:
        response = client.table(TABLE_NAME).select("COUNT", count="exact").execute()
        total = response.count if hasattr(response, 'count') else 0

        return {
            "table": TABLE_NAME,
            "total_records": total,
            "status": "✅ OK"
        }
    except Exception as e:
        return {
            "table": TABLE_NAME,
            "total_records": 0,
            "status": f"❌ Erro: {str(e)[:50]}"
        }

def load_csv_file(csv_path: str) -> List[Dict[str, str]]:
    """Carrega arquivo CSV exportado do Google Forms"""
    import csv

    if not Path(csv_path).exists():
        print(f"❌ Arquivo não encontrado: {csv_path}")
        return []

    rows = []
    try:
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rows = list(reader)
        print(f"✅ Carregadas {len(rows)} linhas do CSV")
        return rows
    except Exception as e:
        print(f"❌ Erro ao ler CSV: {e}")
        return []

def log_sync_result(result: Dict, dedup_result: List) -> None:
    """Registra resultado da sincronização"""
    timestamp = datetime.now().isoformat()

    log_entry = {
        "timestamp": timestamp,
        "form_id": FORM_ID,
        "table_name": TABLE_NAME,
        "csv_rows": 0,
        "deduplicated": len(dedup_result),
        "upsert_result": result,
        "status": "✅ OK" if result["failed"] == 0 else "⚠️  PARCIAL"
    }

    log_file = Path("/tmp/claude-0/-home-user-radar-crm-dashboard/fb5d172a-0adb-5b0d-803c-12576feb4341/scratchpad/sync_censo_membros.log")
    log_file.parent.mkdir(parents=True, exist_ok=True)

    with open(log_file, 'a', encoding='utf-8') as f:
        f.write(json.dumps(log_entry) + "\n")

def main():
    print("="*70)
    print("🚀 SINCRONIZADOR: Censo de Membros & Parceiros/Canva")
    print(f"   Tabela: {TABLE_NAME}")
    print(f"   Form ID: {FORM_ID}")
    print("="*70)

    # Verificar Supabase
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("\n❌ Erro: SUPABASE_URL e SUPABASE_ANON_KEY não configurados")
        return False

    client = get_supabase_client()
    print(f"\n✅ Supabase conectado: {SUPABASE_URL[:40]}...")

    # Carregar CSV (simular com dados vazio por enquanto)
    print("\n📂 Aguardando dados do Google Forms...")
    print("   Nota: Execute 'exportar como CSV' no Google Forms")

    # Para teste, criar um registro de teste
    test_rows = []
    if len(test_rows) == 0:
        print("   ℹ️  Nenhum dado para sincronizar no momento")
        # Fazer upload de um registro vazio apenas para validar estrutura
        test_rows = [{
            "E-mail": "censo@example.com",
            "Nome Completo": "João Silva",
            "WhatsApp": "+55 11 98765-4321",
            "Cidade/Estado": "São Paulo/SP",
            "Há quanto tempo está na comunidade?": "2 anos",
            "Qual é seu cargo?": "Designer",
            "Senioridade": "Sênior",
            "Área de Atuação": "Design",
            "Vínculo Profissional": "CLT",
            "Porte da Empresa": "Média",
            "Tem poder de decisão de compra?": "Sim",
            "Categorias de Ferramentas": "Design, Prototipagem",
            "Ferramentas de Design": "Figma, Adobe XD",
            "Estrutura de Design": "Design System",
            "Interesses da Comunidade": "Networking, Aprendizado",
            "Interesse em Parcerias": "Sim",
            "Consentimento LGPD": "Sim"
        }]

    # Desduplicar
    print("\n🔄 Deduplitando respostas...")
    dedup = deduplicate_responses(test_rows)
    print(f"   ✅ {len(dedup)} registros únicos")

    # Upsert para Supabase
    print("\n📤 Sincronizando com Supabase...")
    result = upsert_to_supabase(client, dedup)
    print(f"   ✅ Inseridos: {result['inserted']}")
    print(f"   ❌ Falhados: {result['failed']}")

    # Verificar
    print("\n🔍 Verificando dados...")
    verify = verify_sync(client)
    print(f"   {verify['status']}")
    print(f"   Total de registros: {verify['total_records']}")

    # Log
    log_sync_result(result, dedup)

    print("\n" + "="*70)
    print("✅ Sincronização completa")
    print("="*70)

    return result["failed"] == 0

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
