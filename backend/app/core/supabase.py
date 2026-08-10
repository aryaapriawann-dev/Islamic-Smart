from __future__ import annotations

import os
from supabase import create_client, Client

_url = os.getenv("SUPABASE_URL", "")
_key = os.getenv("SUPABASE_ANON_KEY", "")

supabase: Client = create_client(_url, _key) if _url and _key else None  # type: ignore
