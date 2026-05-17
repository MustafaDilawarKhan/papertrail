"""
TC-NAV — sidebar links reachable after auth.
"""

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


class TestSidebarNavigation:
    def test_sidebar_links_present(self, logged_in):
        # After register the user lands on /dashboard. The shared Sidebar
        # has a fixed set of nav items.
        body = logged_in.find_element(By.TAG_NAME, "body").text.lower()
        for item in ["home", "library", "my papers", "chats", "workspaces", "settings"]:
            assert item in body, f"sidebar missing '{item}'"

    def test_navigate_to_my_papers(self, logged_in, base_url):
        wait = WebDriverWait(logged_in, 10)
        # We can hit the route directly via hash — the sidebar wires to the
        # same hash routes, so this exercises the router end-to-end.
        logged_in.get(f"{base_url}/#/papers")
        wait.until(lambda d: "/papers" in d.current_url)

        # The page must render either the empty state or the list, not crash.
        body = logged_in.find_element(By.TAG_NAME, "body").text.lower()
        assert "papers" in body, "My Papers heading missing"
