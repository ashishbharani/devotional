"""Offline source-review safeguards; fixtures do not certify religious dates."""
import unittest
from unittest.mock import patch
from propose_festival_calendar_review import civil, extract, fetch


def page(body, title="2028 Onam Calendar for Thiruvananthapuram, Kerala, India"):
    return f"<html><head><title>{title}</title></head><body>{body}</body></html>".encode()


def card(day="29", month="February 2028", number="1"):
    return f'<div class="dpEventCard"><h3 class="dpEventCardTitle">Onam Day {number}</h3><div class="dpEventDay">{day}<sup>th</sup></div><div class="dpSmallDate">{month}</div><div class="dpCardInfoText">Synthetic day label</div></div>'


class ReviewGuards(unittest.TestCase):
    def test_explicit_published_card_only(self):
        title, rows = extract(page(card()), "onam", 2028, "Thiruvananthapuram")
        self.assertIn("India", title)
        self.assertEqual(rows[0]["date"], "2028-02-29")

    def test_wrong_year_city_country_rejected(self):
        for title in ["2029 Onam for Thiruvananthapuram, India", "2028 Onam for New Delhi, India", "2028 Onam for Thiruvananthapuram, Canada"]:
            with self.subTest(title=title), self.assertRaises(ValueError):
                extract(page(card(), title), "onam", 2028, "Thiruvananthapuram")

    def test_empty_impossible_duplicate_or_changed_cards_rejected(self):
        for body in ["<p>No published dates</p>", card("30"), card()+card(), card().replace('dpSmallDate', 'changed-selector')]:
            with self.subTest(body=body), self.assertRaises(ValueError):
                extract(page(body), "onam", 2028, "Thiruvananthapuram")

    def test_weekday_conflict_and_annual_shift_rejected(self):
        with self.assertRaises(ValueError):
            civil("March 3, 2026, Monday", "%B %d, %Y, %A", 2026)
        with self.assertRaises(ValueError):
            civil("March 3, 2026, Tuesday", "%B %d, %Y, %A", 2027)
        self.assertEqual(civil("March 3, 2026, Tuesday", "%B %d, %Y, %A", 2026), "2026-03-03")

    def test_missing_holi_constituent_rejected(self):
        body='<a class="dpEvent"><div class="dpEventName">Holi</div><div class="dpEventGregDate">March 4, 2026, Wednesday</div></a>'
        with self.assertRaises(ValueError):
            extract(page(body, "2026 Calendar for New Delhi, India"), "holi", 2026, "New Delhi")

    def test_unlabelled_dates_and_script_text_are_not_proposals(self):
        for body in ["<p>March 3, 2028</p>", "<script>Maha Shivaratri on Wednesday, February 23, 2028</script>"]:
            with self.subTest(body=body), self.assertRaises(ValueError):
                extract(page(body, "2028 Shivaratri for New Delhi, India"), "shivaratri", 2028, "New Delhi")

    def test_fetch_failure_is_unapproved_gap(self):
        with patch("propose_festival_calendar_review.urlopen", side_effect=OSError("Synthetic offline failure")):
            result=fetch(("onam", 2028))
        self.assertEqual(result["status"], "source-gap")
        self.assertFalse(result["approval"])
        self.assertFalse(result["automaticActivation"])
        self.assertEqual(result["dateClaims"], [])

    def test_success_remains_unapproved_and_wrong_authority_is_rejected(self):
        class Response:
            url="https://www.drikpanchang.com/synthetic-test-only"
            def __enter__(self): return self
            def __exit__(self, *_): return False
            def geturl(self): return self.url
            def read(self, _): return page(card())
        response=Response()
        with patch("propose_festival_calendar_review.urlopen", return_value=response):
            result=fetch(("onam", 2028))
        self.assertEqual(result["status"], "unreviewed-proposal")
        self.assertFalse(result["approval"])
        self.assertFalse(result["automaticActivation"])
        self.assertEqual(result["dateClaims"][0]["date"], "2028-02-29")
        for url in ["https://example.invalid/redirect", "http://www.drikpanchang.com/downgrade"]:
            response.url=url
            with patch("propose_festival_calendar_review.urlopen", return_value=response):
                result=fetch(("onam", 2028))
            self.assertEqual(result["status"], "source-gap")
            self.assertEqual(result["dateClaims"], [])


if __name__ == "__main__":
    unittest.main()
