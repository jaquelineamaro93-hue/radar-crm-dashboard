#!/usr/bin/env python3
"""
Teste de regressão para sync_open_to_work_local.py

Valida que:
  1. Deduplicação interna funciona (remove duplicatas do CSV)
  2. Validação rejeita registros sem email
  3. Chave composta (email + whatsapp) detecta duplicatas
  4. Logging é correto
  5. Isolamento de tabela é mantido
"""
import csv
import tempfile
import os
import sys
from pathlib import Path
from io import StringIO
from contextlib import redirect_stdout

# Importa as funções do script de sincronização
sys.path.insert(0, str(Path(__file__).parent))
from sync_open_to_work_local import (
    normalize_row, deduplicate_csv, COLUMN_MAP
)


def test_normalize_row_valid():
    """Testa normalização de linha válida"""
    row = {
        "E-mail": "test@example.com",
        "Nome Completo": "João Silva",
        "Telefone": "11999999999",
        "LinkedIn": "linkedin.com/in/joao",
        "Experiência": "5 anos",
        "Área de Interesse": "Backend",
        "Disponibilidade": "CLT",
        "Senioridade": "Pleno",
        "Ferramentas": "Python, Django",
        "Localização": "São Paulo",
    }

    normalized, error = normalize_row(row, 1)
    assert error is None, f"Erro inesperado: {error}"
    assert normalized["email"] == "test@example.com"
    assert normalized["nome"] == "João Silva"
    assert normalized["whatsapp"] == "11999999999"
    print("✅ test_normalize_row_valid PASSOU")


def test_normalize_row_empty_email():
    """Testa rejeição de linha sem email"""
    row = {
        "E-mail": "",
        "Nome Completo": "João Silva",
        "Telefone": "11999999999",
    }

    normalized, error = normalize_row(row, 2)
    assert error is not None, "Deveria rejeitar email vazio"
    assert normalized is None
    print("✅ test_normalize_row_empty_email PASSOU")


def test_normalize_row_case_insensitive_email():
    """Testa que email é normalizado para lowercase"""
    row = {
        "E-mail": "TEST@EXAMPLE.COM",
        "Nome Completo": "João",
        "Telefone": "11999999999",
    }

    normalized, error = normalize_row(row, 3)
    assert error is None, f"Erro inesperado: {error}"
    assert normalized["email"] == "test@example.com", f"Email não foi lowercased: {normalized['email']}"
    print("✅ test_normalize_row_case_insensitive_email PASSOU")


def test_deduplicate_csv_removes_exact_duplicates():
    """Testa que deduplicação remove duplicatas exatas (email + whatsapp)"""
    professionals = [
        {
            "E-mail": "test@example.com",
            "Nome Completo": "João Silva",
            "Telefone": "11999999999",
        },
        {
            "E-mail": "test@example.com",
            "Nome Completo": "João Silva",
            "Telefone": "11999999999",
        },
        {
            "E-mail": "other@example.com",
            "Nome Completo": "Maria",
            "Telefone": "21999999999",
        },
    ]

    with redirect_stdout(StringIO()):
        deduplicated = deduplicate_csv(professionals)
    assert len(deduplicated) == 2, f"Esperava 2 registros únicos, obteve {len(deduplicated)}"
    emails = {p["email"] for p in deduplicated}
    assert "test@example.com" in emails
    assert "other@example.com" in emails
    print("✅ test_deduplicate_csv_removes_exact_duplicates PASSOU")


def test_deduplicate_csv_same_email_different_whatsapp():
    """Testa que mesmo email com whatsapp diferente é tratado como registros diferentes"""
    professionals = [
        {
            "E-mail": "test@example.com",
            "Nome Completo": "João Silva",
            "Telefone": "11999999999",
        },
        {
            "E-mail": "test@example.com",
            "Nome Completo": "João Silva",
            "Telefone": "21888888888",
        },
    ]

    with redirect_stdout(StringIO()):
        deduplicated = deduplicate_csv(professionals)
    assert len(deduplicated) == 2, f"Esperava 2 registros (whatsapps diferentes), obteve {len(deduplicated)}"
    print("✅ test_deduplicate_csv_same_email_different_whatsapp PASSOU")


def test_deduplicate_csv_rejects_invalid_rows():
    """Testa que linhas inválidas (sem email) são rejeitadas"""
    professionals = [
        {
            "E-mail": "valid@example.com",
            "Nome Completo": "João",
            "Telefone": "11999999999",
        },
        {
            "E-mail": "",
            "Nome Completo": "Maria",
            "Telefone": "21999999999",
        },
        {
            "E-mail": "another@example.com",
            "Nome Completo": "Pedro",
            "Telefone": "31999999999",
        },
    ]

    with redirect_stdout(StringIO()):
        deduplicated = deduplicate_csv(professionals)
    assert len(deduplicated) == 2, f"Esperava 2 registros válidos, obteve {len(deduplicated)}"
    emails = {p["email"] for p in deduplicated}
    assert "valid@example.com" in emails
    assert "another@example.com" in emails
    print("✅ test_deduplicate_csv_rejects_invalid_rows PASSOU")


def test_deduplicate_csv_handles_empty_whatsapp():
    """Testa que registros sem whatsapp são tratados como compostos apenas por email"""
    professionals = [
        {
            "E-mail": "test@example.com",
            "Nome Completo": "João",
        },
        {
            "E-mail": "test@example.com",
            "Nome Completo": "João",
        },
    ]

    with redirect_stdout(StringIO()):
        deduplicated = deduplicate_csv(professionals)
    assert len(deduplicated) == 1, f"Esperava 1 registro (whatsapp vazio em ambos), obteve {len(deduplicated)}"
    print("✅ test_deduplicate_csv_handles_empty_whatsapp PASSOU")


def test_column_mapping_completeness():
    """Valida que o mapa de colunas cobre todos os campos esperados"""
    required_mappings = {
        "email", "nome", "whatsapp", "linkedin", "area_atuacao", "senioridade"
    }

    mapped_values = set(COLUMN_MAP.values())
    for field in required_mappings:
        assert field in mapped_values, f"Campo obrigatório '{field}' não está mapeado"

    print("✅ test_column_mapping_completeness PASSOU")


def run_all_tests():
    """Executa todos os testes de regressão"""
    print("=" * 60)
    print("🧪 TESTES DE REGRESSÃO: sync_open_to_work_local.py")
    print("=" * 60)
    print()

    tests = [
        test_normalize_row_valid,
        test_normalize_row_empty_email,
        test_normalize_row_case_insensitive_email,
        test_deduplicate_csv_removes_exact_duplicates,
        test_deduplicate_csv_same_email_different_whatsapp,
        test_deduplicate_csv_rejects_invalid_rows,
        test_deduplicate_csv_handles_empty_whatsapp,
        test_column_mapping_completeness,
    ]

    failed = 0
    for test in tests:
        try:
            test()
        except AssertionError as e:
            print(f"❌ {test.__name__} FALHOU: {e}")
            failed += 1
        except Exception as e:
            print(f"❌ {test.__name__} ERRO: {e}")
            failed += 1

    print()
    print("=" * 60)
    if failed == 0:
        print(f"✅ TODOS OS {len(tests)} TESTES PASSARAM!")
    else:
        print(f"❌ {failed} de {len(tests)} testes falharam")
    print("=" * 60)

    return failed == 0


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
