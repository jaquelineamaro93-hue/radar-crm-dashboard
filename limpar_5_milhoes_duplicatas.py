#!/usr/bin/env python3
"""
Script para limpar 5.955.938 registros duplicados de vagas_crm
Mantém apenas 1 registro por combinação (cargo + empresa)
"""

from supabase import create_client
import time

SUPABASE_URL = "https://rwkbpafpniwzvlkfngag.supabase.co"
SUPABASE_KEY = "sb_publishable_41a2jzlzwZgFrdMJ6UpDXQ_jysf69_C"

sb = create_client(SUPABASE_URL, SUPABASE_KEY)

print("🧹 Iniciando limpeza de 5.9 MILHÕES de duplicatas...\n")

# Passo 1: Obter os IDs para MANTER (primeira ocorrência de cada cargo+empresa)
print("📋 Etapa 1: Identificando registros únicos...")
print("   ⏳ Isto pode levar alguns minutos...")

try:
    # Fetch ALL data (cuidado: vai usar muita memória!)
    response = sb.table('vagas_crm').select('id, cargo, empresa').execute()
    todos_os_registros = response.data
    print(f"   ✅ Carregados {len(todos_os_registros)} registros")
except Exception as e:
    print(f"   ❌ Erro ao carregar dados: {e}")
    exit(1)

# Passo 2: Identificar IDs para manter
ids_para_manter = set()
visto = set()

for reg in todos_os_registros:
    chave = (reg['cargo'], reg['empresa'])
    if chave not in visto:
        ids_para_manter.add(reg['id'])
        visto.add(chave)

print(f"   ✅ {len(ids_para_manter)} registros únicos encontrados")
print(f"   ✅ {len(todos_os_registros) - len(ids_para_manter)} duplicatas serão deletadas\n")

# Passo 3: Deletar os registros duplicados em lotes
print("🗑️  Etapa 2: Deletando duplicatas em lotes...")

ids_para_deletar = [reg['id'] for reg in todos_os_registros if reg['id'] not in ids_para_manter]
total_para_deletar = len(ids_para_deletar)

tamanho_lote = 1000
deletados = 0

for i in range(0, total_para_deletar, tamanho_lote):
    lote = ids_para_deletar[i:i+tamanho_lote]

    try:
        # Deletar com OR query (muito mais rápido que IN com muitos valores)
        query = sb.table('vagas_crm')
        for idx, id_vaga in enumerate(lote):
            if idx == 0:
                query = query.delete().eq('id', id_vaga)
            else:
                query = query.or_(f'id.eq.{id_vaga}')
        query.execute()

        deletados += len(lote)
        progress = min(deletados, total_para_deletar)
        pct = (progress / total_para_deletar) * 100

        print(f"   ✅ {progress:,}/{total_para_deletar:,} ({pct:.1f}%)")
        time.sleep(0.5)  # Pequeno delay para não sobrecarregar

    except Exception as e:
        print(f"   ⚠️  Erro no lote {i//tamanho_lote + 1}: {e}")
        continue

print("\n📊 Etapa 3: Verificando resultado...")

try:
    stats = sb.table('vagas_crm').select('count', count='exact').execute()
    total_final = len(stats.data)
    print(f"   ✅ Vagas restantes: {total_final}")
    print(f"   ✅ Vagas deletadas: {total_para_deletar:,}")

    if total_final <= 200:
        print("\n✅ SUCESSO! Banco de dados limpo!")
        print(f"   📈 De 5.956.107 para {total_final} registros")
    else:
        print(f"\n⚠️  Ainda há muitos registros: {total_final}")

except Exception as e:
    print(f"   ❌ Erro ao verificar: {e}")

print("\n✅ LIMPEZA CONCLUÍDA!")
