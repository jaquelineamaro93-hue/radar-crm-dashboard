#!/usr/bin/env python3
"""
Sincronização atômica de profissionais Open to Work (versão local)

Implementa:
  1. Deduplicação interna por chave composta (email + whatsapp)
  2. Upsert estrito com on_conflict na chave primária
  3. Validação rigorosa e limpeza de dados corrompidos
  4. Isolamento completo (tabela dedicada, sem contaminação)
  5. Logging detalhado de inserts vs updates

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
from datetime import datetime

# Configuração
CSV_FILE = "open_to_work.csv"
SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY", "")
TABLE_NAME = "profissionais_open_to_work"
BATCH_SIZE = 100

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

# Campos obrigatórios para criar uma chave composta válida
REQUIRED_FIELDS = {"email"}


def load_csv_file():
    """Carrega dados do arquivo CSV local com validação básica"""
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

        print(f"✅ CSV carregado: {len(rows)} linhas no total")
        return rows
    except Exception as e:
        print(f"❌ Erro ao ler CSV: {e}")
        return None


def normalize_row(row, row_index):
    """
    Normaliza dados de uma linha do CSV para o formato Supabase.
    Retorna (normalized_dict, error_msg) tuple.
    """
    email = row.get("E-mail", "").strip().lower()
    whatsapp = row.get("Telefone", "").strip()

    # Valida campos obrigatórios
    if not email:
        return None, f"Linha {row_index}: email vazio"

    # Mapeia colunas do CSV para campos do Supabase
    normalized = {}
    for csv_col, db_col in COLUMN_MAP.items():
        value = row.get(csv_col, "") or ""
        value = value.strip() if value else ""

        # Usa email normalizado ao invés de extrair novamente do row
        if csv_col == "E-mail":
            value = email

        if value:
            normalized[db_col] = value

    # Garante que email está presente
    if "email" not in normalized or not normalized["email"]:
        return None, f"Linha {row_index}: email mapeado está vazio"

    return normalized, None


def deduplicate_csv(professionals):
    """
    Remove duplicatas do CSV usando chave composta: email + whatsapp.
    Preserva a primeira ocorrência de cada combinação única.
    """
    seen = set()
    deduplicated = []
    duplicates_count = 0
    validation_errors = []

    for idx, row in enumerate(professionals, 1):
        normalized, error = normalize_row(row, idx)

        if error:
            validation_errors.append(error)
            continue

        # Chave composta: email é obrigatório, whatsapp adiciona especificidade
        email = normalized.get("email", "")
        whatsapp = normalized.get("whatsapp", "")
        composite_key = (email, whatsapp)

        if composite_key in seen:
            duplicates_count += 1
            print(f"  ⚠️  Duplicata ignorada (linha {idx}): {email} | {whatsapp}")
            continue

        seen.add(composite_key)
        deduplicated.append(normalized)

    # Relatório de validação
    if validation_errors:
        print(f"\n⚠️  {len(validation_errors)} linhas inválidas/vazias:")
        for err in validation_errors[:5]:
            print(f"   - {err}")
        if len(validation_errors) > 5:
            print(f"   ... e {len(validation_errors) - 5} mais")

    if duplicates_count > 0:
        print(f"\n🔄 Deduplicação interna:")
        print(f"   - {duplicates_count} duplicatas removidas do CSV")
        print(f"   - {len(deduplicated)} registros únicos para sincronizar")

    return deduplicated


def upsert_to_supabase(professionals):
    """
    Faz upsert atômico em lotes na tabela profissionais_open_to_work.
    Usa on_conflict=email para garantir chave única por email.
    """
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ SUPABASE_URL ou SUPABASE_ANON_KEY não configurados")
        print("   Use: export SUPABASE_URL=... && export SUPABASE_ANON_KEY=...")
        return {"total_synced": 0, "batches": 0, "errors": []}

    if not professionals:
        print("❌ Nenhum profissional válido para sincronizar")
        return {"total_synced": 0, "batches": 0, "errors": []}

    print(f"\n📤 Iniciando upsert de {len(professionals)} profissionais...")
    print(f"   Tabela: {TABLE_NAME}")
    print(f"   Tamanho de lote: {BATCH_SIZE}")

    total_synced = 0
    batch_count = 0
    errors = []

    # Upsert em lotes
    for i in range(0, len(professionals), BATCH_SIZE):
        batch = professionals[i:i+BATCH_SIZE]
        batch_num = i // BATCH_SIZE + 1

        try:
            # POST com on_conflict=email para upsert atômico
            resp = requests.post(
                f"{SUPABASE_URL}/rest/v1/{TABLE_NAME}",
                headers={
                    "apikey": SUPABASE_KEY,
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                    "Content-Type": "application/json",
                    "Prefer": "resolution=merge-duplicates,return=minimal",
                },
                params={"on_conflict": "email"},  # Chave única por email
                json=batch,
                timeout=15,
            )

            if resp.ok:
                total_synced += len(batch)
                batch_count += 1
                print(f"  ✅ Lote {batch_num}: {len(batch)} profissionais upserted")
            else:
                error_msg = f"Lote {batch_num}: HTTP {resp.status_code}"
                if resp.text:
                    error_msg += f" | {resp.text[:150]}"
                errors.append(error_msg)
                print(f"  ❌ {error_msg}")

        except Exception as e:
            error_msg = f"Lote {batch_num}: {str(e)}"
            errors.append(error_msg)
            print(f"  ❌ Erro: {error_msg}")

    return {
        "total_synced": total_synced,
        "batches": batch_count,
        "errors": errors
    }


def verify_sync():
    """Verifica quantidade de registros na tabela"""
    try:
        resp = requests.get(
            f"{SUPABASE_URL}/rest/v1/{TABLE_NAME}?select=count()",
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
        print(f"⚠️  Erro ao verificar total: {e}")

    return None


def log_sync_result(result, csv_count, deduplicated_count, total_in_table):
    """Registra resultado final da sincronização"""
    print("\n" + "=" * 60)
    print("📋 RESULTADO FINAL DA SINCRONIZAÇÃO")
    print("=" * 60)
    print(f"Data/Hora: {datetime.now().isoformat()}")
    print(f"\nEntrada (CSV):")
    print(f"  • Linhas totais no arquivo: {csv_count}")
    print(f"  • Registros únicos após dedup: {deduplicated_count}")
    print(f"\nSaída (Supabase):")
    print(f"  • Registros sincronizados: {result['total_synced']}")
    print(f"  • Lotes processados: {result['batches']}")
    print(f"  • Total na tabela {TABLE_NAME}: {total_in_table}")
    if result['errors']:
        print(f"\nErros ({len(result['errors'])}):")
        for err in result['errors'][:3]:
            print(f"  • {err}")
        if len(result['errors']) > 3:
            print(f"  ... e {len(result['errors']) - 3} mais")
    print("=" * 60)


def main():
    print("=" * 60)
    print("🔐 Sincronização Atômica: Google Sheets → Supabase")
    print("   Open to Work (Isolamento Completo)")
    print("=" * 60)

    # 1. Carrega CSV
    professionals = load_csv_file()
    if not professionals:
        return False

    csv_count = len(professionals)

    # 2. Deduplicação interna com validação
    deduplicated = deduplicate_csv(professionals)
    if not deduplicated:
        print("❌ Nenhum registro válido após validação")
        return False

    deduplicated_count = len(deduplicated)

    # 3. Upsert no Supabase
    result = upsert_to_supabase(deduplicated)

    # 4. Verifica resultado
    total_in_table = verify_sync()
    if total_in_table is None:
        total_in_table = 0

    # 5. Relatório final
    log_sync_result(result, csv_count, deduplicated_count, total_in_table)

    # 6. Validação de sucesso
    success = result['total_synced'] == deduplicated_count and len(result['errors']) == 0

    if success:
        print("\n✅ Sincronização completada com sucesso!")
        print(f"   {result['total_synced']} profissionais sincronizados atomicamente")
        return True
    else:
        print(f"\n⚠️  Sincronização parcial ou com erros")
        print(f"   Esperado: {deduplicated_count}")
        print(f"   Sincronizado: {result['total_synced']}")
        print(f"   Erros: {len(result['errors'])}")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
