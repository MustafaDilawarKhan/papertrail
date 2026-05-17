"""
TC-RWD — Responsive design check. Loads the landing page at the five
required viewport widths and saves a screenshot of each into
`report/screenshots/`. These captures double as the artifact for the
Responsive Web Design rubric item.
"""

import os
import pathlib

import pytest


VIEWPORTS = [
    ((360,  780),  "360-mobile"),
    ((768,  1024), "768-tablet"),
    ((1024, 768),  "1024-tablet-landscape"),
    ((1440, 900),  "1440-laptop"),
    ((1920, 1080), "1920-desktop"),
]

REPO_ROOT = pathlib.Path(__file__).resolve().parents[3]
OUT_DIR = REPO_ROOT / "report" / "screenshots"
OUT_DIR.mkdir(parents=True, exist_ok=True)


@pytest.mark.parametrize("size,label", VIEWPORTS)
class TestLandingResponsive:
    def test_landing_renders_at(self, driver, base_url, size, label):
        driver.set_window_size(*size)
        driver.get(base_url + "/")
        # Wait for hero so the screenshot isn't blank.
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, "h1")))

        out = OUT_DIR / f"selenium-landing-{label}.png"
        driver.save_screenshot(str(out))
        assert out.exists() and out.stat().st_size > 5_000, \
            f"screenshot at {label} looks empty: {out}"

        # No horizontal overflow at ANY viewport. After the responsive
        # rules in styles.css this must hold from 360 → 1920.
        scroll_w = driver.execute_script("return document.documentElement.scrollWidth")
        client_w = driver.execute_script("return document.documentElement.clientWidth")
        assert scroll_w - client_w <= 4, \
            f"horizontal overflow at {label}: scrollWidth={scroll_w}, clientWidth={client_w}"
