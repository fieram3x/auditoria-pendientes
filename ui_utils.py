from html import escape
import re
import unicodedata

import pandas as pd


def normalize_text(value):
    if pd.isna(value) or value is None:
        return ""
    return str(value).strip()


def safe_date(value, with_time=False):
    if pd.isna(value) or value in [None, ""]:
        return ""
    try:
        fmt = "%d/%m/%Y %I:%M %p" if with_time else "%d/%m/%Y"
        return pd.to_datetime(value).strftime(fmt)
    except Exception:
        return str(value)


def slug(value):
    text = normalize_text(value).lower()
    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return text or "sin-dato"


def html_text(value):
    return escape(normalize_text(value), quote=True)


def shorten(value, limit):
    text = normalize_text(value)
    if len(text) <= limit:
        return text
    return text[: max(0, limit - 3)] + "..."


def badge(text):
    label = normalize_text(text) or "Sin dato"
    return f'<span class="badge badge-{slug(label)}">{html_text(label)}</span>'

