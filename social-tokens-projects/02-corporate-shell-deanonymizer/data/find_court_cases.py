import json
import os
import urllib.request

def search(query, limit=10):
    key = os.environ.get("KAGI_API_KEY")
    if not key:
        print("Search error: KAGI_API_KEY is not set")
        return []
    body = json.dumps({"query": query, "workflow": "search", "format": "json", "limit": limit}).encode("utf-8")
    req = urllib.request.Request(
        "https://kagi.com/api/v1/search",
        data=body,
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as resp:
            payload = json.loads(resp.read().decode("utf-8", errors="ignore"))
    except Exception as e:
        print("Search error:", e)
        return []
    hits = (payload.get("data") or {}).get("search") or []
    return [
        {"title": h.get("title") or "Untitled result", "url": h.get("url") or "", "snippet": h.get("snippet") or ""}
        for h in hits[:limit]
    ]

print("=== SEARCH 1: MN AG Wage Theft Court Cases ===")
for r in search("site:ag.state.mn.us wage theft lawsuit court")[:6]:
    print(r["title"])
    print(r["url"])
    print(r["snippet"])
    print("-" * 50)

print("\n=== SEARCH 2: Minnesota Landlord Caretaker Wage Theft ===")
for r in search("Minnesota landlord caretaker wage theft lawsuit")[:6]:
    print(r["title"])
    print(r["url"])
    print(r["snippet"])
    print("-" * 50)

print("\n=== SEARCH 3: US DOL WHD Minnesota Apartment Overtime ===")
for r in search("site:dol.gov/newsroom/releases/whd Minnesota apartment overtime")[:6]:
    print(r["title"])
    print(r["url"])
    print(r["snippet"])
    print("-" * 50)
