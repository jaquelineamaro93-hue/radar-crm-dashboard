"""Configuração ADITIVA para o bot de vagas. Não altera a configuração legada."""
from itertools import product

LEVELS_ADDITIONAL = [
    "c-level", "chief", "ceo", "coo", "cfo", "cto", "caio", "cmo", "cio", "cdo",
    "vp", "vice president", "diretor", "diretora", "diretoria", "director",
    "gerente", "manager", "head", "engineering manager", "tech lead",
    "principal", "lead", "coordenador", "coordenadora", "coordinator",
    "especialista", "specialist", "analista", "analyst", "consultor", "consultant"
]
AREAS_ADDITIONAL = {
    "tecnologia": ["tecnologia", "technology", "ti", "it leadership", "transformação digital", "digital transformation"],
    "ia": ["inteligência artificial", "artificial intelligence", "ia", "ai", "machine learning", "llm", "genai", "generative ai", "data science", "ai agents", "llmops"],
    "marketing": ["marketing", "growth", "crm", "product marketing", "pmm", "branding", "martech", "marketing automation", "lifecycle"],
    "arquitetura": ["arquitetura de sistemas", "system architect", "solutions architect", "cloud architect", "enterprise architect"],
    "engenharia_software": ["engenharia de software", "software engineering", "backend", "frontend", "fullstack", "devops", "platform engineering"],
    "mobile": ["mobile", "ios", "android", "react native", "flutter"],
    "customer_experience": ["customer experience", "cx", "jornada do cliente", "voice of customer", "voc", "customer insights"],
    "customer_success": ["customer success", "cs", "sucesso do cliente", "customer operations", "customer enablement"],
    "dados": ["analytics", "business intelligence", "data engineering", "data analytics", "data governance"],
    "receita": ["revops", "revenue operations", "sales operations", "salesforce", "hubspot", "customer retention"]
}
PLATFORMS_ADDITIONAL = [
    "himalayas", "remotive", "remoteok", "arbeitnow", "greenhouse",
    "lever", "ashby", "smartrecruiters", "workable", "recruitee",
    "personio", "workday", "rippling", "teamtailor", "adzuna", "jooble",
    "linkedin", "gupy", "vagas_com", "inhire", "indeed", "solides",
    "catho", "infojobs", "glassdoor", "trabalha_brasil", "bne",
    "talent_com", "jobrapido", "remotar", "wellfound", "geekhunter",
    "trampos", "getonbrd", "roberthalf", "michaelpage", "hays", "randstad"
]
# Não usar este dicionário para excluir vagas. É apenas para novas buscas/tags.
SEARCH_QUERIES_ADDITIONAL = list(dict.fromkeys(
    [f"{level} {area}" for level, area in product(
        ["CTO", "Diretor", "Gerente", "Head", "VP", "Coordenador", "Especialista"],
        ["Tecnologia", "IA", "Marketing", "Arquitetura de Sistemas", "Engenharia de Software", "Mobile", "CRM", "CX", "CS", "Dados"]
    )]
    + [word for terms in AREAS_ADDITIONAL.values() for word in terms]
))

def merge_unique(existing, additions):
    """União sem remover entradas legadas e sem depender da ordem do set."""
    return list(dict.fromkeys([*(existing or []), *additions]))

def extend_config(existing_levels=None, existing_areas=None, existing_platforms=None, existing_queries=None):
    areas = {key: list(words) for key, words in (existing_areas or {}).items()}
    for key, words in AREAS_ADDITIONAL.items():
        areas[key] = merge_unique(areas.get(key, []), words)
    return {
        "levels": merge_unique(existing_levels, LEVELS_ADDITIONAL),
        "areas_keywords": areas,
        "enabled_platforms": merge_unique(existing_platforms, PLATFORMS_ADDITIONAL),
        "search_queries": merge_unique(existing_queries, SEARCH_QUERIES_ADDITIONAL),
    }
