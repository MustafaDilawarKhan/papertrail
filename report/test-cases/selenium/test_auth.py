"""
TC-AUTH — UI register and login flows through real browser interaction.
"""

import time

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from conftest import unique_email, fill_register_form


class TestAuthFlows:
    def test_login_with_bad_credentials_shows_error(self, driver, base_url):
        driver.get(f"{base_url}/#/login")
        wait = WebDriverWait(driver, 10)
        email_in = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']")))
        pw_in = driver.find_element(By.CSS_SELECTOR, "input[type='password']")

        email_in.send_keys(f"nobody-{unique_email()}")
        pw_in.send_keys("DefinitelyWrong!1")
        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

        # Wait for the request to settle — submit toggles button to "Signing in…"
        # and only swaps to the error text once the server responds with 401.
        end = time.time() + 10
        body_text = ""
        while time.time() < end:
            body_text = driver.find_element(By.TAG_NAME, "body").text.lower()
            if any(s in body_text for s in ("invalid", "incorrect", "could not", "wrong")):
                break
            time.sleep(0.3)

        # And we must still be on /login (no auth happened).
        assert "/login" in driver.current_url, f"unexpectedly navigated: {driver.current_url}"
        assert any(s in body_text for s in ("invalid", "incorrect", "could not", "wrong")), \
            f"no error message rendered for bad login. body={body_text[:300]!r}"

    def test_register_redirects_to_authenticated_area(self, driver, base_url):
        driver.get(f"{base_url}/#/register")
        email = unique_email()
        fill_register_form(driver, "Reg Test", email, "RegisterPass#2026")

        # Successful register must move the user off /register.
        WebDriverWait(driver, 15).until(lambda d: "/register" not in d.current_url)
        assert "/login" not in driver.current_url, \
            f"registration left user on /login: {driver.current_url}"
