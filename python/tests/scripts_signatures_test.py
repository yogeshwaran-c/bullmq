"""
Static signature checks for bullmq.scripts.Scripts.

These tests guard against regressions of mutable default arguments
(e.g. `opts: dict = {}`) on Scripts methods. Mutable defaults are a
well-known Python pitfall: the dict object is created once and shared
across every call that omits the argument, so any caller that mutates
it leaks state into subsequent calls.

The tests do not require a Redis connection.
"""

import inspect
import unittest

from bullmq.scripts import Scripts


# Methods that previously declared `opts: dict = {}` (or `opts = {}`)
# and have been migrated to `opts: Optional[dict] = None`.
_METHODS_WITH_OPTS = (
    "moveToWaitingChildrenArgs",
    "retryJobArgs",
    "retryJob",
    "moveToDelayedArgs",
    "moveToDelayed",
    "reprocessJob",
)


class TestScriptsSignatures(unittest.TestCase):
    def test_opts_defaults_are_not_mutable(self):
        """No `opts` parameter on Scripts should default to a mutable instance."""
        for method_name in _METHODS_WITH_OPTS:
            method = getattr(Scripts, method_name)
            sig = inspect.signature(method)
            self.assertIn(
                "opts",
                sig.parameters,
                msg=f"Scripts.{method_name} is missing the 'opts' parameter",
            )
            default = sig.parameters["opts"].default
            self.assertNotIsInstance(
                default,
                (dict, list, set),
                msg=(
                    f"Scripts.{method_name} uses a mutable default for 'opts' "
                    f"({default!r}); use Optional[dict] = None instead."
                ),
            )


if __name__ == "__main__":
    unittest.main()
