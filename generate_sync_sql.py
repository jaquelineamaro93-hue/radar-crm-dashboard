#!/usr/bin/env python3
"""
Gerador de SQL para sincronização de Open to Work
Lê CSV do Google Sheets e gera SQL INSERT ... ON CONFLICT para upsert.
O SQL gerado pode ser executado no Supabase SQL Editor ou via CLI.

Uso:
  python3 generate_sync_sql.py > sync_data.sql
  # Depois copie o conteúdo para Supabase SQL Editor e execute
"""
import csv
import sys
from pathlib import Path
from typing import Dict, List

CSV_FILE = "open_to_work.csv"

# Mapa de colunas do CSV para Supabase
# Colunas da planilha oficial Google Forms Open to Work
COLUMN_MAP = {
    "Nome": "nome",
    "Senioridade": "senioridade",
    "Tempo de Experiência": "tempo_experiencia",
    "Área de atuação": "area_atuacao",
    "Qual Ferramenta você tem experiência/atuou?": "ferramentas",
    "Localização": "localizacao",
    "Condição de trabalho": "condicao_trabalho",
    "Considerar mudar de Cidade?": "mudar_cidade",
    "Linkedin": "linkedin",
    "Número de WhatsApp": "whatsapp",
    "Última empresa que trabalhou": "ultima_empresa",
    "Faixa Salarial - CLT": "faixa_clt",
    "Faixa Salarial - PJ": "faixa_pj",
    "Idioma": "idioma",
    "Coloque o link público do seu currículo": "curriculo",
    "Whats clicavel": "whatsapp_clickable",
}


def load_csv(csv_file: str) -> List[Dict]:
    """Carrega dados do CSV"""
    if not Path(csv_file).exists():
        print(f"❌ Erro: arquivo '{csv_file}' não encontrado", file=sys.stderr)
        sys.exit(1)

    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        return list(reader)


def normalize_row(row: Dict) -> Dict:
    """Normaliza uma linha do CSV para o formato Supabase

    Chave única: Número de WhatsApp (é único por profissional)
    Se WhatsApp não houver, usa LinkedIn como fallback
    """
    whatsapp = (row.get("Número de WhatsApp") or "").strip()
    linkedin = (row.get("Linkedin") or "").strip()

    # Precisa ter pelo menos WhatsApp ou LinkedIn
    if not whatsapp and not linkedin:
        return None

    normalized = {}
    for csv_col, db_col in COLUMN_MAP.items():
        value = (row.get(csv_col) or "").strip()
        if value and db_col != "whatsapp_clickable":  # Ignora campo duplicado
            normalized[db_col] = value

    # Garante que whatsapp está presente (é a chave única)
    if whatsapp:
        normalized["whatsapp"] = whatsapp

    return normalized if (normalized.get("whatsapp") or normalized.get("linkedin")) else None


def escape_sql_string(value: str) -> str:
    """Escapa strings para SQL"""
    if value is None:
        return "NULL"
    return "'" + value.replace("'", "''") + "'"


def generate_sql(rows: List[Dict]) -> str:
    """Gera SQL INSERT ... ON CONFLICT para upsert

    Chave única: (whatsapp, nome)
    Profissionais com mesmo WhatsApp mas nomes diferentes são únicos
    Profissionais com mesmo WhatsApp E nome são considerados duplicatas
    """
    normalized = [normalize_row(r) for r in rows]
    normalized = [r for r in normalized if r]  # Remove Nones

    if not normalized:
        print("❌ Nenhum profissional válido no CSV", file=sys.stderr)
        sys.exit(1)

    # Determina todas as colunas que serão inseridas
    all_columns = set()
    for row in normalized:
        all_columns.update(row.keys())

    columns = sorted(list(all_columns))

    # Cabeçalho
    sql = "-- Sincronização de profissionais Open to Work\n"
    sql += "-- Chave única: (whatsapp, nome)\n"
    sql += "-- Gerado automaticamente - altere conforme necessário\n\n"
    sql += "INSERT INTO profissionais_open_to_work ("
    sql += ", ".join(columns)
    sql += ")\nVALUES\n"

    # Valores
    value_sets = []
    for row in normalized:
        values = []
        for col in columns:
            value = row.get(col)
            values.append(escape_sql_string(value) if value else "NULL")
        value_sets.append("  (" + ", ".join(values) + ")")

    sql += ",\n".join(value_sets)
    sql += "\n"

    # ON CONFLICT usando chave composta (whatsapp, nome)
    sql += "ON CONFLICT (whatsapp, nome) DO UPDATE SET\n"
    update_parts = []
    for col in columns:
        if col not in ("whatsapp", "nome"):  # Chaves não são atualizadas
            update_parts.append(f"  {col} = EXCLUDED.{col}")

    sql += ",\n".join(update_parts)
    sql += ";\n\n"

    # Verificação final
    sql += "-- Validação\n"
    sql += f"SELECT COUNT(*) as total_profissionais FROM profissionais_open_to_work;\n"
    sql += f"SELECT COUNT(DISTINCT whatsapp) as profissionais_unicos FROM profissionais_open_to_work WHERE whatsapp IS NOT NULL;\n"

    return sql


def main():
    # Carrega dados
    rows = load_csv(CSV_FILE)
    print(f"✅ Carregado {len(rows)} registros do CSV", file=sys.stderr)

    # Gera SQL
    sql = generate_sql(rows)

    # Escreve para stdout
    print(sql)

    # Instruções no stderr
    print("\n" + "=" * 70, file=sys.stderr)
    print("SQL gerado com sucesso!", file=sys.stderr)
    print("=" * 70, file=sys.stderr)
    print("\nPróximos passos:", file=sys.stderr)
    print("1. Salve o SQL gerado: python3 generate_sync_sql.py > sync_data.sql", file=sys.stderr)
    print("2. Abra Supabase SQL Editor: https://app.supabase.com", file=sys.stderr)
    print("3. Cole o conteúdo de sync_data.sql e execute", file=sys.stderr)
    print("4. Verifique: SELECT COUNT(*) FROM profissionais_open_to_work;", file=sys.stderr)


if __name__ == "__main__":
    main()
