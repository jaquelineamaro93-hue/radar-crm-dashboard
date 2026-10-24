"""Fontes opcionais. Só APIs abertas documentadas são executadas por padrão.
Não simula scraping de sites sem API pública; preserva coleta legada externa.
"""
import json
import urllib.request
from urllib.parse import urlencode, quote

DEFAULT_TIMEOUT = 20
USER_AGENT = "ConexaoCRM-Radar/1.0 (job-source-discovery)"
OPEN_FEEDS = {
    "remotive": "https://remotive.com/api/remote-jobs",
    "remoteok": "https://remoteok.com/api",
    "arbeitnow": "https://www.arbeitnow.com/api/job-board-api",
    "himalayas": "https://himalayas.app/jobs/api",
}
ATS_BUILDERS = {
    "greenhouse": lambda slug: f"https://boards-api.greenhouse.io/v1/boards/{quote(slug,safe='')}/jobs?content=true",
    "lever": lambda slug: f"https://api.lever.co/v0/postings/{quote(slug,safe='')}?mode=json",
    "ashby": lambda slug: f"https://api.ashbyhq.com/posting-api/job-board/{quote(slug,safe='')}",
    "smartrecruiters": lambda slug: f"https://api.smartrecruiters.com/v1/companies/{quote(slug,safe='')}/postings",
    "recruitee": lambda slug: f"https://{slug}.recruitee.com/api/offers/",
    "breezy": lambda slug: f"https://{slug}.breezy.hr/json",
}
MANUAL_OR_PARTNER_ONLY = [
    "linkedin", "gupy", "vagas_com", "inhire", "indeed", "solides", "catho",
    "infojobs", "glassdoor", "trabalha_brasil", "bne", "talent_com",
    "jobrapido", "remotar", "wellfound", "geekhunter", "trampos",
    "getonbrd", "roberthalf", "michaelpage", "hays", "randstad",
    "workday", "workable", "personio", "rippling", "teamtailor"
]

def fetch_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=DEFAULT_TIMEOUT) as response:
        return json.load(response)

def normalize_job(source, raw, company=None):
    """Keep raw source attributes for platform-specific mapping later."""
    return {"source": source, "company_source": company, "raw": raw}

def fetch_open_feed(source):
    if source not in OPEN_FEEDS:
        raise ValueError(f"Fonte não habilitada como API pública: {source}")
    data = fetch_json(OPEN_FEEDS[source])
    if source == "remotive":
        jobs = data.get("jobs", [])
    elif source == "arbeitnow":
        jobs = data.get("data", [])
    elif source == "himalayas":
        jobs = data.get("jobs", [])
    else:
        jobs = [item for item in data if isinstance(item, dict) and item.get("id")]
    return [normalize_job(source, item) for item in jobs]

def fetch_ats_jobs(source, slug):
    if source not in ATS_BUILDERS:
        raise ValueError(f"ATS requer validação de URL/integração: {source}")
    if not slug or not all(c.isalnum() or c in "-_" for c in slug):
        raise ValueError("Identificador de empresa inválido")
    payload = fetch_json(ATS_BUILDERS[source](slug))
    if source == "greenhouse": jobs = payload.get("jobs", [])
    elif source == "ashby": jobs = payload.get("jobs", [])
    elif source == "smartrecruiters": jobs = payload.get("content", [])
    elif source == "recruitee": jobs = payload.get("offers", [])
    elif source == "breezy": jobs = payload if isinstance(payload, list) else []
    else: jobs = payload if isinstance(payload, list) else []
    return [normalize_job(source, item, company=slug) for item in jobs]
