"""
TC-LANDING — public landing page renders the hero and key CTAs.
Anyone hitting the root URL must see the Paper Trail pitch without
needing to log in.
"""

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


class TestLandingPage:
    def test_hero_headline_visible(self, driver, base_url):
        driver.get(base_url + "/")
        wait = WebDriverWait(driver, 10)
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "h1")))
        # Combine ALL h1 text on the page (Hero uses a FadeUp wrapper that can
        # leave the first h1 selectorless-text early in the animation). The
        # marketing copy is "Trust your AI's insights. Verify every claim."
        hero_text = " ".join(h.text for h in driver.find_elements(By.CSS_SELECTOR, "h1")).lower()
        if not hero_text.strip():
            hero_text = driver.page_source.lower()
        assert "verify" in hero_text or "trust" in hero_text, \
            f"hero headline missing — got: {hero_text[:200]!r}"

    def test_has_signup_and_login_links(self, driver, base_url):
        driver.get(base_url + "/")
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "a")))
        anchors = [a.get_attribute("href") or "" for a in driver.find_elements(By.TAG_NAME, "a")]
        assert any("#/login" in h for h in anchors), "no Log in link on landing"
        assert any("#/register" in h for h in anchors), "no Register CTA on landing"

    def test_page_title_set(self, driver, base_url):
        driver.get(base_url + "/")
        assert "Paper Trail" in driver.title
