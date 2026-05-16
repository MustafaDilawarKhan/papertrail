# Paper Trail — Selenium Implementation Sketches

This document captures the executable shape of the test plan. The scripts assume Python 3.11+, `selenium==4.x`, and `webdriver-manager`. They are written as `pytest` functions so they can be wired into CI.

```
pip install selenium pytest webdriver-manager
```

---

## 1. Shared fixture

```python
# conftest.py
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

BASE_URL = "http://localhost:5173"

@pytest.fixture
def driver():
    opts = Options()
    opts.add_argument("--start-maximized")
    drv = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=opts)
    drv.implicitly_wait(5)
    yield drv
    drv.quit()

@pytest.fixture
def logged_in(driver):
    driver.get(f"{BASE_URL}/#/login")
    driver.find_element("css selector", "input[type=email]").send_keys("qa@example.com")
    driver.find_element("css selector", "input[type=password]").send_keys("Qa-Pass#2026")
    driver.find_element("css selector", "button[type=submit]").click()
    # wait for dashboard
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    WebDriverWait(driver, 10).until(EC.url_contains("/dashboard"))
    return driver
```

---

## 2. TC-AUTH-01 — Register new account

```python
import uuid

def test_register_new_account(driver):
    email = f"qa+{uuid.uuid4().hex[:8]}@example.com"
    driver.get(f"{BASE_URL}/#/register")

    driver.find_element("name", "name").send_keys("Test User")
    driver.find_element("name", "email").send_keys(email)
    driver.find_element("name", "password").send_keys("TestPass#2026")
    driver.find_element("css selector", "button[type=submit]").click()

    # In test mode the backend echoes the code in a JSON header for QA only.
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    WebDriverWait(driver, 10).until(EC.url_contains("/verify"))

    # Fetch the 6-digit code from the test endpoint:
    import requests
    code = requests.get(f"http://localhost:8000/_test/last-code?email={email}").json()["code"]
    for i, digit in enumerate(code):
        driver.find_element("css selector", f"input[data-code='{i}']").send_keys(digit)

    driver.find_element("xpath", "//button[contains(., 'Verify')]").click()
    WebDriverWait(driver, 10).until(EC.url_contains("/dashboard"))

    assert "Welcome" in driver.page_source
```

---

## 3. TC-WS-01 — Create workspace

```python
def test_create_workspace(logged_in):
    driver = logged_in
    driver.get(f"{BASE_URL}/#/workspaces")
    driver.find_element("xpath", "//button[contains(., 'New Workspace')]").click()
    driver.find_element("name", "workspace-name").send_keys("Selenium QA")
    driver.find_element("xpath", "//button[contains(., 'Create')]").click()

    assert "Selenium QA" in driver.page_source
```

---

## 4. TC-DOC-01 — Upload a PDF

```python
import os, pathlib

def test_upload_pdf(logged_in):
    driver = logged_in
    sample = str(pathlib.Path(__file__).parent / "fixtures" / "sample.pdf")
    driver.get(f"{BASE_URL}/#/library")
    driver.find_element("xpath", "//button[contains(., 'Upload')]").click()

    file_input = driver.find_element("css selector", "input[type=file]")
    file_input.send_keys(sample)
    driver.find_element("xpath", "//button[contains(., 'Confirm')]").click()

    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    WebDriverWait(driver, 30).until(
        EC.presence_of_element_located(("xpath", "//*[contains(text(), 'sample.pdf')]"))
    )
```

---

## 5. TC-DOC-04 — Delete document

```python
def test_delete_document(logged_in):
    driver = logged_in
    driver.get(f"{BASE_URL}/#/library")

    # Right-click on the row to open the context menu
    from selenium.webdriver.common.action_chains import ActionChains
    row = driver.find_element("xpath", "//div[@data-doc-row][1]")
    ActionChains(driver).context_click(row).perform()
    driver.find_element("xpath", "//div[@role='menuitem'][contains(., 'Delete')]").click()

    driver.find_element("xpath", "//button[contains(., 'Confirm')]").click()

    # Row should disappear
    from selenium.webdriver.support.ui import WebDriverWait
    WebDriverWait(driver, 5).until(lambda d: not d.find_elements("xpath", "//div[@data-doc-row]"))
```

---

## 6. TC-CHAT-01 — Send first AI message (with mocked LLM)

```python
def test_chat_with_pdf(logged_in):
    driver = logged_in
    # Open the first document in the library
    driver.get(f"{BASE_URL}/#/library")
    driver.find_element("css selector", "[data-doc-row] a").click()

    # Wait for the chat panel to be ready
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    chat_input = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable(("css selector", "textarea[data-chat-input]"))
    )

    chat_input.send_keys("Summarise this paper.")
    driver.find_element("css selector", "button[data-chat-send]").click()

    # Wait for the assistant response card
    WebDriverWait(driver, 30).until(
        EC.presence_of_element_located(("css selector", "[data-message-role='assistant']"))
    )

    # At least one source citation card should appear
    cards = driver.find_elements("css selector", "[data-source-card]")
    assert len(cards) >= 1
```

---

## 7. TC-RWD — Responsive viewports

```python
import pytest

@pytest.mark.parametrize("size,label", [
    ((1920, 1080), "desktop-xl"),
    ((1440, 900),  "desktop"),
    ((1024, 768),  "laptop"),
    ((768,  1024), "tablet"),
    ((360,  800),  "mobile"),
])
def test_dashboard_responsive(driver, size, label, tmp_path):
    driver.set_window_size(*size)
    driver.get(f"{BASE_URL}/#/dashboard")
    out = tmp_path / f"dashboard-{label}.png"
    driver.save_screenshot(str(out))
    # Sidebar should collapse below 1024 px
    sidebar = driver.find_element("css selector", "[data-sidebar]")
    width = sidebar.size["width"]
    if size[0] < 1024:
        assert width <= 72   # icon-only
    else:
        assert width >= 200  # full
```

---

## 8. TC-E2E-01 — Full document lifecycle (smoke)

```python
def test_full_lifecycle(driver):
    # 1. Register
    # 2. Create workspace
    # 3. Create collection
    # 4. Upload PDF
    # 5. Ask AI
    # 6. Highlight + annotate
    # 7. Generate APA citation
    # 8. Rename doc
    # 9. Delete doc
    # 10. Delete workspace
    # 11. Logout
    # (Compose by importing the helpers used above.)
    pass
```

---

## 9. Running the suite

```bash
# unit + integration first
pytest backend/tests/

# then the Selenium UI suite
pytest report/test-cases/selenium/ --html=report/test-cases/report.html
```

CI runs the same commands inside a `selenium/standalone-chrome` Docker container so screenshots are reproducible.
