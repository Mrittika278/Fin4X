import unittest
import time
from engine import fetch_prices, get_cache_stats, clear_cache, CACHE_STATS


class TestCacheAndDeduplication(unittest.TestCase):
    def setUp(self):
        clear_cache()

    def test_cache_hit_and_stats(self):
        # First call fetches or mocks and stores into cache
        df1, live1 = fetch_prices("gold", "1y")
        self.assertFalse(df1.empty)
        stats1 = get_cache_stats()
        self.assertEqual(stats1["price_misses"], 1)
        self.assertEqual(stats1["price_hits"], 0)

        # Second call must hit the in-memory cache directly
        df2, live2 = fetch_prices("gold", "1y")
        self.assertEqual(len(df1), len(df2))
        self.assertEqual(live1, live2)
        stats2 = get_cache_stats()
        self.assertEqual(stats2["price_hits"], 1)

    def test_cache_isolation_by_parameters(self):
        # Different period or different asset must not return cached data of another
        fetch_prices("gold", "1y")
        fetch_prices("gold", "2y")
        fetch_prices("bitcoin", "1y")
        stats = get_cache_stats()
        self.assertEqual(stats["price_misses"], 3)


if __name__ == "__main__":
    unittest.main()
