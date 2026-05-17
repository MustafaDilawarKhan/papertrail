"""
Shared fixtures for the Selenium E2E suite.

Reads two env vars (both optional):
    SELENIUM_BASE_URL   Frontend origin.   Default http://localhost:5173
    SELENIUM_HEADLESS   "0" to show the browser. Default headless on.

Run with:
    cd backend
    venv/Scripts/python.exe -m pytest ../report/test-cases/selenium/ -v
"""

from __future__ import annotations

import os
import uuid

import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


BASE_URL = os.getenv("SELENIUM_BASE_URL", "http://localhost:5173").rstrip("/")
HEADLESS = os.getenv("SELENIUM_HEADLESS", "1") != "0"


@pytest.fixture
def driver():
    opts = Options()
    if HEADLESS:
        opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--window-size=1440,900")
    # Quiet Chrome's noisy log output on Windows.
    opts.add_experimental_option("excludeSwitches", ["enable-logging"])
    drv = webdriver.Chrome(options=opts)
    drv.implicitly_wait(2)
    yield drv
    drv.quit()


@pytest.fixture
def base_url():
    return BASE_URL


def unique_email() -> str:
    return f"pt-sel-{uuid.uuid4().hex[:10]}@example.com"


@pytest.fixture
def fresh_user_creds():
    """Credentials a test can use to register a new user via the UI."""
    return {
        "name": "Selenium Tester",
        "email": unique_email(),
        "password": "SeleniumPass#2026",
    }


def fill_register_form(driver, name: str, email: str, password: str):
    """Drive the RegisterPage UI. The first/last-name inputs don't carry
    an explicit `type` attribute, so we match by position within the form
    instead of by selector."""
    wait = WebDriverWait(driver, 10)
    # Wait for the email field — it's the most reliably-typed one.
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']")))

    inputs = driver.find_elements(By.CSS_SELECTOR, "form input")
    # Layout (per authPages.jsx RegisterPage):
    #   0: first name (untyped)
    #   1: last name  (untyped)
    #   2: email      (type=email)
    #   3: password   (type=password)
    #   4: terms checkbox (type=checkbox)
    parts = name.split(" ", 1)
    first = parts[0] or "Test"
    last  = parts[1] if len(parts) > 1 else "User"

    inputs[0].send_keys(first)
    inputs[1].send_keys(last)
    inputs[2].send_keys(email)
    inputs[3].send_keys(password)
    # The Terms checkbox is `required` — must be ticked or the form won't submit.
    checkbox = driver.find_element(By.CSS_SELECTOR, "input[type='checkbox']")
    if not checkbox.is_selected():
        checkbox.click()

    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()


@pytest.fixture
def logged_in(driver, base_url, fresh_user_creds):
    """Register a new user through the UI and return the driver on the dashboard."""
    driver.get(f"{base_url}/#/register")
    fill_register_form(
        driver,
        fresh_user_creds["name"],
        fresh_user_creds["email"],
        fresh_user_creds["password"],
    )
    WebDriverWait(driver, 15).until(
        lambda d: "/login" not in d.current_url and "/register" not in d.current_url
    )
    return driver
