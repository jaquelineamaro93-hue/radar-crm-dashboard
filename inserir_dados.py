import json
from supabase import create_client

SUPABASE_URL = "https://rwkbpafpniwzvlkfngag.supabase.co"
SUPABASE_KEY = "sb_publishable_41a2jzlzwZgFrdMJ6UpDXQ_jysf69_C"

sb = create_client(SUPABASE_URL, SUPABASE_KEY)

print("✅ Conectado ao Supabase!\n")

# Carregar dados
with open('profissionais.json', encoding='utf-8') as f:
    profs = json.load(f)
with open('cargos.json', encoding='utf-8') as f:
    cargos = json.load(f)

print(f"📊 {len(profs)} profissionais")
print(f"📊 {len(cargos)} cargos\n")

# Inserir em lotes
def inserir_lotes(tabela, dados, tamanho_lote=100):
    total = len(dados)
    for i in range(0, total, tamanho_lote):
        lote = dados[i:i+tamanho_lote]
        try:
            sb.table(tabela).insert(lote).execute()
            progress = min(i+len(lote), total)
            print(f"  ✅ {progress}/{total}")
        except Exception as e:
            print(f"  ❌ {e}")

print("🔄 Inserindo profissionais...")
inserir_lotes('profissionais_open_to_work', profs)

print("\n🔄 Inserindo cargos...")
inserir_lotes('vagas_crm', cargos)

print("\n✅ PRONTO!")
