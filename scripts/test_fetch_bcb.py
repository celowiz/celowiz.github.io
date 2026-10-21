import datetime as dt, os, sys, unittest
sys.path.insert(0, os.path.dirname(__file__))
import fetch_bcb as B

D = dt.date
NOW = dt.datetime(2026, 10, 21, 0, 30, tzinfo=dt.timezone.utc)  # 20/10 21:30 BRT


class T(unittest.TestCase):
    def test_retry_backoff(self):
        calls, waits = [], []

        def fn():
            calls.append(1)
            if len(calls) < 3:
                raise RuntimeError("502")
            return "ok"

        self.assertEqual(B.retry(fn, sleep=waits.append), "ok")
        self.assertEqual(waits, [3.0, 9.0])
        waits.clear()
        with self.assertRaises(RuntimeError):
            B.retry(lambda: (_ for _ in ()).throw(RuntimeError("x")), attempts=3, sleep=waits.append)
        self.assertEqual(waits, [3.0, 9.0])

    def test_clips_future_dates_and_nulls(self):
        pts = B.clean([(D(2026, 10, 21), 13.75), (D(2026, 10, 20), 13.75), (D(2026, 10, 19), None)], B.today_brt(NOW))
        self.assertEqual(pts, [(D(2026, 10, 20), 13.75)])

    def test_selic_since_and_ptax_change(self):
        raw = {
            "selic": [(D(2026, 9, 1), 13.5), (D(2026, 9, 17), 13.75), (D(2026, 10, 20), 13.75), (D(2026, 11, 4), 13.75)],
            "ptax": [(D(2026, 10, 19), 5.0564), (D(2026, 10, 20), 5.014)],
            "ipca12": [(D(2026, 8, 1), 4.22), (D(2026, 9, 1), 4.58)],
        }
        p = B.build(raw, NOW)
        s = p["series"]
        self.assertEqual(s["selic"], {"code": 432, "value": 13.75, "date": "2026-10-20", "since": "2026-09-17"})
        self.assertEqual(s["ptax"]["chg"], round(5.014 / 5.0564 - 1, 5))
        self.assertEqual(s["ptax"]["prev_date"], "2026-10-19")
        self.assertEqual(s["ipca12"]["date"], "2026-09-01")
        self.assertNotIn("cdi", s)
        self.assertEqual(p["as_of"], "2026-10-20")
        self.assertEqual(p["schema"], 1)

    def test_selic_since_unknown_when_window_has_no_change(self):
        p = B.build({"selic": [(D(2026, 10, 1), 13.75), (D(2026, 10, 20), 13.75)]}, NOW)
        self.assertIsNone(p["series"]["selic"]["since"])


if __name__ == "__main__":
    unittest.main()
