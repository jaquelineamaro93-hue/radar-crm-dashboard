"""Importador offline de diretórios CSV de empresas.
Uso: python -m jobbot_expansion.import_company_directory caminho.csv saida.json
Não executa chamadas externas nem escreve no Supabase.
"""
import csv
import json
import sys
from pathlib import Path

def load_directory(path):
    with open(path, newline="", encoding="utf-8-sig") as f:
        records = list(csv.DictReader(f))
    result, seen = [], set()
    for row in records:
        provider = (row.get("ats") or row.get("platform") or row.get("provider") or "").lower().strip()
        slug = (row.get("slug") or row.get("identifier") or row.get("board_slug") or "").strip()
        if not provider or not slug: continue
        key = (provider, slug.lower())
        if key in seen: continue
        seen.add(key)
        result.append({"platform":provider, "slug":slug, "company": row.get("company") or row.get("name") or "", "api_url":row.get("api_url") or row.get("api") or "", "status":"pending_validation"})
    return result

if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Uso: python -m jobbot_expansion.import_company_directory empresas.csv saida.json")
    output = load_directory(sys.argv[1])
    Path(sys.argv[2]).write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"{len(output)} fontes de empresa preparadas para validação")
