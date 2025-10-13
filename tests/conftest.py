from __future__ import annotations

import sys
from pathlib import Path

# Ensure the repository root is available for imports when pytest collects the
# tests.  Some environments invoke pytest from a nested working directory which
# can hide the local modules such as ``glisse_engine``.
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

