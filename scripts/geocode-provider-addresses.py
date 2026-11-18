#!/usr/bin/env python3
"""Geocode unique provider addresses into assets/data/provider-locations.json."""

from __future__ import annotations

import json
import re
import time
import urllib.parse
import urllib.request
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROVIDERS_DIR = ROOT / "content" / "providers"
OUT_PATH = ROOT / "assets" / "data" / "provider-locations.json"
CACHE_PATH = ROOT / "assets" / "data" / ".geocode-cache.json"
USER_AGENT = "PrimeCareNetworkDirectory/1.0 (info@primecarentwk.com)"


def extract_addresses() -> dict[str, list[dict]]:
    by_addr: dict[str, list[dict]] = defaultdict(list)
    for path in sorted(PROVIDERS_DIR.glob("*.md")):
        text = path.read_text(encoding="utf-8", errors="ignore")
        match = re.match(r"^---\n(.*?)\n---", text, re.S)
        if not match:
            continue
        front = match.group(1)
        if re.search(r"^draft:\s*true\b", front, re.M):
            continue
        title_m = re.search(r'^title:\s*"(.*)"\s*$', front, re.M)
        slug = path.stem
        title = title_m.group(1) if title_m else slug
        block = re.search(r"^addresses:\n((?:  - .*\n?)+)", front, re.M)
        if not block:
            continue
        for line in block.group(1).splitlines():
            line = line.strip()
            if not line.startswith("- "):
                continue
            address = line[2:].strip().strip('"').strip("'")
            address = address.replace("\\u2013", "–").replace("\\u2014", "—")
            if address:
                by_addr[address].append({"slug": slug, "title": title})
    return by_addr


def simplify_address(address: str) -> str:
    cleaned = address
    cleaned = re.sub(
        r",?\s*(Suite|Ste\.?|Unit|#)\s*[A-Za-z0-9\-]+",
        "",
        cleaned,
        flags=re.I,
    )
    cleaned = cleaned.replace("–", "-").replace("—", "-")
    cleaned = re.sub(r"\s+", " ", cleaned).strip(" ,")
    return cleaned


def nominatim_search(query: str) -> dict | None:
    params = urllib.parse.urlencode(
        {
            "q": query,
            "format": "json",
            "limit": 1,
            "addressdetails": 0,
        }
    )
    req = urllib.request.Request(
        f"https://nominatim.openstreetmap.org/search?{params}",
        headers={"User-Agent": USER_AGENT, "Accept": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    if not data:
        return None
    hit = data[0]
    return {
        "lat": float(hit["lat"]),
        "lng": float(hit["lon"]),
        "displayName": hit.get("display_name", ""),
        "query": query,
    }


def geocode(address: str, cache: dict) -> dict | None:
    if address in cache and cache[address]:
        return cache[address]

    attempts = [address, simplify_address(address)]
    # Prefer USA bias
    attempts += [f"{simplify_address(address)}, USA"]

    seen = set()
    for query in attempts:
        if not query or query in seen:
            continue
        seen.add(query)
        try:
            result = nominatim_search(query)
        except Exception as exc:  # noqa: BLE001
            print(f"ERROR {address!r}: {exc}")
            result = None
        time.sleep(1.1)  # Nominatim usage policy
        if result:
            cache[address] = result
            return result

    cache[address] = None
    return None


def main() -> None:
    by_addr = extract_addresses()
    cache = {}
    if CACHE_PATH.exists():
        try:
            cache = json.loads(CACHE_PATH.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            cache = {}

    locations = []
    missing = []
    for i, (address, providers) in enumerate(sorted(by_addr.items()), start=1):
        print(f"[{i}/{len(by_addr)}] {address}")
        geo = geocode(address, cache)
        CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
        CACHE_PATH.write_text(json.dumps(cache, indent=2), encoding="utf-8")
        if not geo:
            missing.append(address)
            continue
        locations.append(
            {
                "address": address,
                "lat": geo["lat"],
                "lng": geo["lng"],
                "providers": providers,
            }
        )

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "count": len(locations),
        "missingCount": len(missing),
        "missing": missing,
        "locations": locations,
    }
    OUT_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"Wrote {OUT_PATH} with {len(locations)} locations; missing={len(missing)}")


if __name__ == "__main__":
    main()
