from __future__ import annotations

import os
from functools import lru_cache
from typing import Any


STATE_ID = "default"
TABLE_NAME = "school_state"


def enabled() -> bool:
    return os.getenv("USE_SUPABASE", "").lower() in {"1", "true", "yes", "on"}


@lru_cache(maxsize=1)
def client():
    from supabase import create_client

    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required when USE_SUPABASE=true")
    return create_client(url, key)


def load_state() -> dict[str, Any] | None:
    response = client().table(TABLE_NAME).select("data").eq("id", STATE_ID).limit(1).execute()
    if not response.data:
        return None
    return response.data[0]["data"]


def save_state(data: dict[str, Any]) -> None:
    client().table(TABLE_NAME).upsert({"id": STATE_ID, "data": data}).execute()
