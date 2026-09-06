import json
from supabase import create_client

# Dados completos em Base64 (vou codificar)
prof_base64 = "W3siAm5vbWUi..." # Vai ser MUITO grande

SUPABASE_URL = "https://rwkbpafpniwzvlkfngag.supabase.co"
SUPABASE_KEY = "sb_publishable_41a2jzlzwZgFrdMJ6UpDXQ_jysf69_C"
sb = create_client(SUPABASE_URL, SUPABASE_KEY)

# Decodificar
import base64
prof_json = base64.b64decode(prof_base64).decode('utf-8')
prof_data = json.loads(prof_json)

print(f"📊 {len(prof_data)} profissionais")

# Inserir
for i in range(0, len(prof_data), 100):
    lote = prof_data[i:i+100]
    sb.table('profissionais_open_to_work').insert(lote).execute()
    print(f"✅ {min(i+100, len(prof_data))}/{len(prof_data)}")

print("✅ PRONTO!")
