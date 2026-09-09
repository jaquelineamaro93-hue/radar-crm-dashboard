#!/usr/bin/env python3
"""
Sincronização de profissionais Open to Work (versão local)
Lê CSV do Google Sheets (arquivo local) e faz upsert na tabela profissionais_open_to_work.
Chave única: email (evita duplicatas)

Modo de uso:
  1. Abra: https://docs.google.com/spreadsheets/d/e/2PACX-1vRtuTLaOZzk-uRDdRchwdNmypGJ8eO2K7qdckkL7Sh0VohIa8OHWMDbKuDDHQMsoLYOhMfIMlplKoop/pub?output=csv
  2. Salve como "open_to_work.csv" na mesma pasta deste script
  3. Execute: python3 sync_open_to_work_local.py
"""
import os
import csv
import requests
import sys
from pathlib import Path

# Configuração
CSV_FILE = "open_to_work.csv"
SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY", "")

# Mapa de colunas do CSV para Supabase
COLUMN_MAP = {
    "E-mail": "email",
    "Nome Completo": "nome",
    "Telefone": "whatsapp",
    "LinkedIn": "linkedin",
    "Experiência": "tempo_experiencia",
    "Área de Interesse": "area_atuacao",
    "Disponibilidade": "condicao_trabalho",
    "Senioridade": "senioridade",
    "Ferramentas": "ferramentas",
    "Localização": "localizacao",
    "Mudar de cidade?": "mudar_cidade",
    "Última Empresa": "ultima_empresa",
    "Faixa Salarial (CLT)": "faixa_clt",
    "Faixa Salarial (PJ)": "faixa_pj",
    "Idioma": "idioma",
    "Currículo": "curriculo",
}


def load_csv_file():
    """Carrega dados do arquivo CSV local"""
    if not Path(CSV_FILE).exists():
        print(f"❌ Arquivo '{CSV_FILE}' não encontrado")
        print("\nPara obter o arquivo:")
        print("1. Abra: https://docs.google.com/spreadsheets/d/e/2PACX-1vRtuTLaOZzk-uRDdRchwdNmypGJ8eO2K7qdckkL7Sh0VohIa8OHWMDbKuDDHQMsoLYOhMfIMlplKoop/pub?output=csv")
        print("2. Salve como 'open_to_work.csv' nesta pasta")
        print("3. Execute novamente")
        return None

    try:
        with open(CSV_FILE, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rows = list(reader)

        print(f"✅ CSV carregado: {len(rows)} profissionais encontrados")
        return rows
    except Exception as e:
        print(f"❌ Erro ao ler CSV: {e}")
        return None


def normalize_row(row):
    """Normaliza dados de uma linha do CSV para o formato Supabase"""
    email = row.get("E-mail", "").strip().lower()

    if not email:
        return None

    # Mapeia colunas do CSV para campos do Supabase
    normalized = {}
    for csv_col, db_col in COLUMN_MAP.items():
        value = row.get(csv_col, "") or ""
        value = value.strip() if value else ""
        if value:
            normalized[db_col] = value

    # Garante que email está presente
    if "email" not in normalized or not normalized["email"]:
        return None

    return normalized


def upsert_to_supabase(professionals):
    """Faz upsert em lotes na tabela profissionais_open_to_work"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ SUPABASE_URL ou SUPABASE_ANON_KEY não configurados")
        print("   Use: export SUPABASE_URL=... && export SUPABASE_ANON_KEY=...")
        return 0

    normalized = [normalize_row(p) for p in professionals]
    normalized = [p for p in normalized if p]  # Remove Nones

    if not normalized:
        print("❌ Nenhum profissional válido para sincronizar")
        return 0

    print(f"\n📤 Iniciando upsert de {len(normalized)} profissionais...")

    # Upsert em lotes de 100
    synced = 0
    for i in range(0, len(normalized), 100):
        batch = normalized[i:i+100]
        batch_num = i // 100 + 1

        try:
            # POST com on_conflict=email (upsert)
            resp = requests.post(
                f"{SUPABASE_URL}/rest/v1/profissionais_open_to_work",
                headers={
                    "apikey": SUPABASE_KEY,
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                    "Content-Type": "application/json",
                    "Prefer": "resolution=merge-duplicates,return=minimal",
                },
                params={"on_conflict": "email"},  # Chave única
                json=batch,
                timeout=15,
            )

            if resp.ok:
                synced += len(batch)
                print(f"  ✅ Lote {batch_num}: {len(batch)} profissionais")
            else:
                print(f"  ❌ Lote {batch_num} falhou: HTTP {resp.status_code}")
                if resp.text:
                    print(f"     {resp.text[:200]}")
        except Exception as e:
            print(f"  ❌ Erro no lote {batch_num}: {e}")

    return synced


def verify_sync():
    """Verifica quantidade de registros na tabela"""
    try:
        resp = requests.get(
            f"{SUPABASE_URL}/rest/v1/profissionais_open_to_work?select=count()",
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Range": "0-0/*",
            },
            timeout=10,
        )

        if resp.ok:
            count = resp.headers.get("Content-Range", "").split("/")[-1]
            return int(count) if count else 0
    except Exception as e:
        print(f"⚠️  Erro ao verificar: {e}")

    return None


def main():
    print("=" * 60)
    print("Sincronização: Google Sheets → Supabase (Open to Work)")
    print("=" * 60)

    # 1. Carrega CSV
    professionals = load_csv_file()
    if not professionals:
        return False

    # 2. Upsert no Supabase
    synced = upsert_to_supabase(professionals)
    print(f"\n✅ {synced} profissionais sincronizados com sucesso")

    # 3. Verifica resultado
    total = verify_sync()
    if total is not None:
        print(f"\n📊 Total na tabela: {total} profissionais")
        if total >= len([p for p in professionals if p.get("E-mail", "").strip()]):
            print("✅ Sincronização completa!")
            return True

    return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
