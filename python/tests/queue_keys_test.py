"""
Tests for the QueueKeys helper class.

These tests cover the pure key-formatting logic of bullmq.queue_keys.QueueKeys
and do not require a Redis connection.
"""

import unittest

from bullmq.queue_keys import QueueKeys


class TestQueueKeys(unittest.TestCase):

    def test_default_prefix_is_bull(self):
        """QueueKeys should default to the conventional 'bull' prefix."""
        keys = QueueKeys()
        self.assertEqual(keys.prefix, "bull")

    def test_custom_prefix_is_used(self):
        """A custom prefix passed to the constructor should be honoured."""
        keys = QueueKeys(prefix="custom")
        self.assertEqual(keys.getQueueQualifiedName("myq"), "custom:myq")

    def test_to_key_formats_prefix_name_and_type(self):
        """toKey should produce '<prefix>:<name>:<type>'."""
        keys = QueueKeys()
        self.assertEqual(keys.toKey("myq", "wait"), "bull:myq:wait")
        self.assertEqual(keys.toKey("myq", "active"), "bull:myq:active")

    def test_to_key_with_empty_type_keeps_trailing_colon(self):
        """An empty type should still emit a trailing colon (base key)."""
        keys = QueueKeys()
        self.assertEqual(keys.toKey("myq", ""), "bull:myq:")

    def test_get_queue_qualified_name(self):
        """getQueueQualifiedName should join prefix and name with a colon."""
        keys = QueueKeys(prefix="bull")
        self.assertEqual(keys.getQueueQualifiedName("myq"), "bull:myq")

    def test_get_keys_returns_all_expected_types(self):
        """getKeys should return every documented key type with correct values."""
        keys = QueueKeys(prefix="bull")
        result = keys.getKeys("myq")

        expected_types = [
            "", "active", "wait", "waiting-children", "paused", "completed",
            "failed", "delayed", "repeat", "stalled", "limiter", "prioritized",
            "id", "stalled-check", "meta", "pc", "events", "marker",
        ]
        self.assertEqual(set(result.keys()), set(expected_types))
        for name_type in expected_types:
            self.assertEqual(result[name_type], f"bull:myq:{name_type}")

    def test_get_keys_with_custom_prefix(self):
        """getKeys should respect a custom prefix on every emitted key."""
        keys = QueueKeys(prefix="myprefix")
        result = keys.getKeys("myq")
        for key in result.values():
            self.assertTrue(key.startswith("myprefix:myq:"))

    def test_queue_name_with_colon_is_preserved(self):
        """Colons inside a queue name must not be stripped or escaped."""
        keys = QueueKeys()
        # Mirrors how callers may namespace queues (e.g. tenant:queue).
        self.assertEqual(keys.toKey("tenant:myq", "wait"), "bull:tenant:myq:wait")


if __name__ == "__main__":
    unittest.main()
