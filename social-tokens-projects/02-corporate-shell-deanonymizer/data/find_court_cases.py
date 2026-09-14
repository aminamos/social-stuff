import urllib.request
import urllib.parse
import re
import json

def search(query):
    url = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote(query)}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"})
    try:
        with urllib.request.urlopen(req) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
            results = []
            blocks = re.findall(r'<div class="result__body">(.*?)</div>\s*</div>', html, re.DOTALL)
            for b in blocks:
                url_m = re.search(r'class="result__snippet"[^>]*href="([^"]+)"', b)
                snippet_m = re.search(r'class="result__snippet"[^>]*>(.*?)</a>', b, re.DOTALL)
                title_m = re.search(r'class="result__title"[^>]*>(.*?)</a>', b, re.DOTALL)
                if url_m and snippet_m and title_m:
                    u = urllib.parse.unquote(url_m.group(1))
                    if "uddg=" in u:
                        u = u.split("uddg=")[1].split("&")[0]
                    title = re.sub(r'<[^>]+>', '', title_m.group(1)).strip()
                    snip = re.sub(r'<[^>]+>', '', snippet_m.group(1)).strip()
                    results.append({"title": title, "url": u, "snippet": snip})
            return results
    except Exception as e:
        print("Search error:", e)
        return []

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
