"""
TC-RWD-APP — authenticated pages render without horizontal overflow at
every supported viewport width. Catches the case where the fixed
sidebar pushed the main content off-screen on phones.
"""

import pathlib

import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


VIEWPORTS = [
    ((360,  780),  "360-mobile"),
    ((768,  1024), "768-tablet"),
    ((1440, 900),  "1440-laptop"),
]


REPO_ROOT = pathlib.Path(__file__).resolve().parents[3]
OUT_DIR = REPO_ROOT / "report" / "screenshots"
OUT_DIR.mkdir(parents=True, exist_ok=True)


@pytest.mark.parametrize("size,label", VIEWPORTS)
class TestDashboardResponsive:
    def test_dashboard_no_horizontal_overflow(self, logged_in, base_url, size, label):
        logged_in.set_window_size(*size)
        logged_in.get(f"{base_url}/#/dashboard")
        WebDriverWait(logged_in, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "main"))
        )

        out = OUT_DIR / f"selenium-dashboard-{label}.png"
        logged_in.save_screenshot(str(out))
        assert out.exists() and out.stat().st_size > 5_000

        scroll_w = logged_in.execute_script("return document.documentElement.scrollWidth")
        client_w = logged_in.execute_script("return document.documentElement.clientWidth")
        assert scroll_w - client_w <= 4, \
            f"dashboard overflow at {label}: scrollWidth={scroll_w}, clientWidth={client_w}"

    def test_my_papers_no_horizontal_overflow(self, logged_in, base_url, size, label):
        logged_in.set_window_size(*size)
        logged_in.get(f"{base_url}/#/papers")
        WebDriverWait(logged_in, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "main"))
        )
        scroll_w = logged_in.execute_script("return document.documentElement.scrollWidth")
        client_w = logged_in.execute_script("return document.documentElement.clientWidth")
        assert scroll_w - client_w <= 4, \
            f"papers overflow at {label}: scrollWidth={scroll_w}, clientWidth={client_w}"
