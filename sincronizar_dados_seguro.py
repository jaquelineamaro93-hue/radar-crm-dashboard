import pandas as pd
import json
from supabase import create_client

SUPABASE_URL = "https://rwkbpafpniwzvlkfngag.supabase.co"
SUPABASE_KEY = "sb_publishable_41a2jzlzwZgFrdMJ6UpDXQ_jysf69_C"

sb = create_client(SUPABASE_URL, SUPABASE_KEY)

print("📥 Lendo Excel files...\n")

# ===== PROFISSIONAIS =====
try:
    df_prof = pd.read_excel('Profissionais_Open-to-Work_-_CRM_V2__Apenas_a_reas_de_CRM__caso_na_o_esteja_dentro_sera__excluido___8_.xlsx', skiprows=3)
    df_prof = df_prof.dropna(how='all')

    df_prof.columns = ['timestamp', 'lgpd', 'nome', 'senioridade', 'tempo_exp', 'area', 'ferramentas', 'localizacao', 'condicao_trabalho', 'mudar_cidade', 'linkedin', 'whatsapp', 'ultima_empresa', 'grupo_afirmativo', 'qual_grupo', 'faixa_clt', 'faixa_pj', 'idioma', 'curriculo', 'unnamed1', 'whats_clickavel']

    prof_data = []
    for idx, row in df_prof.iterrows():
        if pd.isna(row['nome']): continue
        prof_data.append({
            'nome': str(row['nome']).strip(),
            'senioridade': str(row['senioridade']).strip() if pd.notna(row['senioridade']) else None,
            'tempo_experiencia': str(row['tempo_exp']).strip() if pd.notna(row['tempo_exp']) else None,
            'area_atuacao': str(row['area']).strip() if pd.notna(row['area']) else None,
            'ferramentas': str(row['ferramentas']).strip() if pd.notna(row['ferramentas']) else None,
            'localizacao': str(row['localizacao']).strip() if pd.notna(row['localizacao']) else None,
            'condicao_trabalho': str(row['condicao_trabalho']).strip() if pd.notna(row['condicao_trabalho']) else None,
            'mudar_cidade': str(row['mudar_cidade']).strip() if pd.notna(row['mudar_cidade']) else None,
            'linkedin': str(row['linkedin']).strip() if pd.notna(row['linkedin']) else None,
            'whatsapp': str(row['whatsapp']).strip() if pd.notna(row['whatsapp']) else None,
            'ultima_empresa': str(row['ultima_empresa']).strip() if pd.notna(row['ultima_empresa']) else None,
            'faixa_clt': str(row['faixa_clt']).strip() if pd.notna(row['faixa_clt']) else None,
            'faixa_pj': str(row['faixa_pj']).strip() if pd.notna(row['faixa_pj']) else None,
            'idioma': str(row['idioma']).strip() if pd.notna(row['idioma']) else None,
            'curriculo': str(row['curriculo']).strip() if pd.notna(row['curriculo']) else None,
        })

    print(f"✅ {len(prof_data)} profissionais carregados")
except Exception as e:
    print(f"❌ Erro ao carregar profissionais: {e}")
    prof_data = []

# ===== CARGOS/VAGAS =====
try:
    df_cargo = pd.read_excel('Cargos_e_Sala_rios_-_CRM_ou_a_reas_correlatas_a_CRM__por_favor_se_na_o_for_desse_segmento_na_o_colocar___4_.xlsx')
    df_cargo = df_cargo.dropna(how='all')

    cargo_data = []
    for idx, row in df_cargo.iterrows():
        if pd.isna(row['NOME DO CARGO']): continue
        salario_str = str(row['SALÁRIO']).strip() if pd.notna(row['SALÁRIO']) else '0'
        salario_str = salario_str.replace('R$', '').replace('.', '').replace(',', '.').strip()
        try:
            salario = float(salario_str)
        except:
            salario = 0

        cargo_data.append({
            'empresa': str(row['NOME DA EMPRESA (OPCIONAL)']).strip() if pd.notna(row['NOME DA EMPRESA (OPCIONAL)']) else None,
            'cargo': str(row['NOME DO CARGO']).strip(),
            'nivel': str(row['NÍVEL']).strip() if pd.notna(row['NÍVEL']) else None,
            'porte_empresa': str(row['PORTE DA EMPRESA']).strip() if pd.notna(row['PORTE DA EMPRESA']) else None,
            'ramo': str(row['RAMO DE ATUAÇÃO DA EMPRESA']).strip() if pd.notna(row['RAMO DE ATUAÇÃO DA EMPRESA']) else None,
            'regiao': str(row['REGIÃO']).strip() if pd.notna(row['REGIÃO']) else None,
            'tipo_contrato': str(row['TIPO DE CONTRATO']).strip() if pd.notna(row['TIPO DE CONTRATO']) else None,
            'tempo_experiencia': str(row['TEMPO DE EXPERIÊNCIA']).strip() if pd.notna(row['TEMPO DE EXPERIÊNCIA']) else None,
            'salario': salario if salario > 0 else None,
            'modelo': str(row['MODELO']).strip() if pd.notna(row['MODELO']) else None,
            'crm_utilizado': str(row['Qual CRM atua hoje? (ex: Salesforce, HubSpot)']).strip() if pd.notna(row['Qual CRM atua hoje? (ex: Salesforce, HubSpot)']) else None,
        })

    print(f"✅ {len(cargo_data)} cargos carregados")
except Exception as e:
    print(f"❌ Erro ao carregar cargos: {e}")
    cargo_data = []

# ===== SINCRONIZAR COM VERIFICAÇÃO DE DUPLICATAS =====

def sincronizar_com_verificacao(tabela, dados_novos, chave_unica_fn):
    """Sincroniza dados sem criar duplicatas"""
    print(f"\n🔄 Sincronizando {tabela}...")

    try:
        # Ler dados existentes
        response = sb.table(tabela).select('*').execute()
        dados_existentes = response.data

        # Criar chaves únicas dos existentes
        existentes_chaves = set()
        for dado in dados_existentes:
            chave = chave_unica_fn(dado)
            existentes_chaves.add(chave)

        print(f"  📊 Registros existentes: {len(dados_existentes)}")

        # Filtrar novos dados (apenas os que não existem)
        dados_para_inserir = []
        for dado in dados_novos:
            chave = chave_unica_fn(dado)
            if chave not in existentes_chaves:
                dados_para_inserir.append(dado)
                existentes_chaves.add(chave)

        print(f"  ✅ Novos registros a inserir: {len(dados_para_inserir)}")

        if dados_para_inserir:
            # Inserir em lotes
            tamanho_lote = 50
            for i in range(0, len(dados_para_inserir), tamanho_lote):
                lote = dados_para_inserir[i:i+tamanho_lote]
                try:
                    sb.table(tabela).insert(lote).execute()
                    progress = min(i+len(lote), len(dados_para_inserir))
                    print(f"    ✅ {progress}/{len(dados_para_inserir)}")
                except Exception as e:
                    print(f"    ❌ Erro ao inserir lote: {e}")

        print(f"  ✅ {tabela} sincronizado!")

    except Exception as e:
        print(f"  ❌ Erro na sincronização: {e}")

# Funções para extrair chaves únicas
def chave_prof(p):
    return (p.get('nome', '').lower().strip(),)

def chave_cargo(c):
    return (c.get('cargo', '').lower().strip(), c.get('empresa', '').lower().strip())

# Executar sincronização
if prof_data:
    sincronizar_com_verificacao('profissionais_open_to_work', prof_data, chave_prof)

if cargo_data:
    sincronizar_com_verificacao('vagas_crm', cargo_data, chave_cargo)

print("\n✅ SINCRONIZAÇÃO CONCLUÍDA!")
