import json
from supabase import create_client
from collections import defaultdict

SUPABASE_URL = "https://rwkbpafpniwzvlkfngag.supabase.co"
SUPABASE_KEY = "sb_publishable_41a2jzlzwZgFrdMJ6UpDXQ_jysf69_C"

sb = create_client(SUPABASE_URL, SUPABASE_KEY)

print("🧹 Limpando duplicatas de vagas...\n")

# 1. LER TODAS AS VAGAS
try:
    response = sb.table('vagas_crm').select('*').execute()
    vagas = response.data
    print(f"📊 Total de vagas: {len(vagas)}")
except Exception as e:
    print(f"❌ Erro ao ler vagas: {e}")
    exit()

# 2. IDENTIFICAR DUPLICATAS
duplicatas = defaultdict(list)
chave_unica = lambda v: (v.get('cargo', '').lower().strip(), v.get('empresa', '').lower().strip())

for vaga in vagas:
    chave = chave_unica(vaga)
    duplicatas[chave].append(vaga)

# 3. ENCONTRAR E DELETAR DUPLICATAS
total_duplicatas = 0
ids_para_deletar = []

for chave, grupo in duplicatas.items():
    if len(grupo) > 1:
        print(f"\n⚠️  Encontrado duplicata: {grupo[0].get('cargo')} @ {grupo[0].get('empresa')}")
        print(f"   Quantidade: {len(grupo)} registros")

        # Manter o primeiro, marcar os outros para deleção
        for vaga in grupo[1:]:
            ids_para_deletar.append(vaga['id'])
            total_duplicatas += 1

print(f"\n📋 Total de duplicatas encontradas: {total_duplicatas}")

if ids_para_deletar:
    print(f"🗑️  Deletando {total_duplicatas} registros duplicados...")

    # Deletar em lotes
    lote_size = 10
    for i in range(0, len(ids_para_deletar), lote_size):
        lote_ids = ids_para_deletar[i:i+lote_size]
        try:
            for id_vaga in lote_ids:
                sb.table('vagas_crm').delete().eq('id', id_vaga).execute()
            print(f"  ✅ {min(i+len(lote_ids), total_duplicatas)}/{total_duplicatas}")
        except Exception as e:
            print(f"  ❌ Erro ao deletar: {e}")

print("\n✅ Limpeza concluída!")
print(f"📊 Vagas após limpeza: {len(vagas) - total_duplicatas}")
