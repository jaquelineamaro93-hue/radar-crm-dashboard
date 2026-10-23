import unittest
from jobbot_expansion.config import extend_config
from jobbot_expansion.classification import geographic_scope, classify_job
from jobbot_expansion.sources import ATS_BUILDERS

class AdditiveExpansionTests(unittest.TestCase):
    def test_legacy_configuration_is_preserved(self):
        cfg = extend_config(["estagiario"], {"crm": ["rfm"]}, ["legacy_source"], ["analista de crm"])
        self.assertIn("estagiario", cfg["levels"])
        self.assertIn("diretor", cfg["levels"])
        self.assertIn("rfm", cfg["areas_keywords"]["crm"])
        self.assertIn("legacy_source", cfg["enabled_platforms"])
        self.assertIn("analista de crm", cfg["search_queries"])
    def test_classification_is_not_a_filter(self):
        job = {"title": "Estagiário de Marketing", "location": "São Paulo"}
        result = classify_job(job)
        self.assertEqual(result["title"], job["title"])
        self.assertEqual(result["abrangencia"], "Nacional")
    def test_remote_alone_is_unknown(self):
        self.assertEqual(geographic_scope("Remote", is_remote=True), "Não informado")
    def test_international(self):
        self.assertEqual(geographic_scope("Toronto", country_code="CA"), "Internacional")
    def test_api_format(self):
        self.assertIn("/boards/acme/jobs", ATS_BUILDERS["greenhouse"]("acme"))

if __name__ == "__main__":
    unittest.main()
