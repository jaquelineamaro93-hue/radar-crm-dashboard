#!/usr/bin/env python3
"""
Gera a imagem OG (1200x630px) para preview de links sociais
Requer: pip install playwright
"""
import subprocess
import sys
from pathlib import Path

async def generate_og_image():
    """Captura a página HTML e salva como PNG"""
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        print("❌ Playwright não instalado. Instalando...")
        subprocess.run(["pip", "install", "playwright", "-q"], check=True)
        subprocess.run(["playwright", "install", "chromium"], check=True)
        from playwright.async_api import async_playwright

    html_file = Path("index.html")

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1200, "height": 630})

        # Carregar HTML local
        await page.goto(f"file://{html_file.absolute()}")
        await page.wait_for_timeout(1000)  # Aguardar renderização

        # Capturar screenshot
        screenshot_path = Path("og-image.png")
        await page.screenshot(path=str(screenshot_path), full_page=False)

        await browser.close()

        print(f"✅ Imagem gerada com sucesso: {screenshot_path}")
        print(f"   Tamanho: 1200x630px")
        print(f"   Caminho absoluto: {screenshot_path.absolute()}")
        print("\n📤 Próximo passo:")
        print("   1. Fazer upload de og-image.png para seu servidor")
        print("   2. Colocar em: https://www.conexaocrm.com/og-image.png")

        return screenshot_path

if __name__ == "__main__":
    import asyncio
    asyncio.run(generate_og_image())
