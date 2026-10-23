"""Classificações para facetas, jamais gates para rejeitar vagas."""
import re
import unicodedata

COUNTRY_HINTS = {
    "brasil", "brazil", "sao paulo", "rio de janeiro", "minas gerais",
    "curitiba", "brasilia", "recife", "porto alegre", "belo horizonte", "campinas"
}

def plain(value):
    return "".join(c for c in unicodedata.normalize("NFKD", str(value or "").lower())
                   if not unicodedata.combining(c))

def geographic_scope(location="", country_code="", is_remote=False):
    """Nacional, Internacional ou Não informado.
    Remoto sozinho NÃO significa Internacional. Aceita consulta de todo o catálogo.
    """
    cc = str(country_code or "").upper().strip()
    if cc == "BR": return "Nacional"
    if cc and cc != "BR": return "Internacional"
    loc = plain(location)
    if any(re.search(r"(?<!\w)"+re.escape(h)+r"(?!\w)", loc) for h in COUNTRY_HINTS):
        return "Nacional"
    if re.search(r"\b(usa|united states|canada|portugal|spain|germany|united kingdom|europe|europa|latam|global|worldwide)\b",loc):
        return "Internacional"
    return "Não informado"

def classify_job(job):
    """Enriquecimento, sem filtros de nível ou palavra-chave."""
    enriched = dict(job)
    enriched["abrangencia"] = geographic_scope(
        job.get("location") or job.get("localizacao"),
        job.get("country_code") or job.get("country"),
        job.get("is_remote", False)
    )
    return enriched
