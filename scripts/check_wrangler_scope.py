#!/usr/bin/env python3
"""Fail CI if any tracked file shows a wrangler data-plane command without an
explicit --local or --remote scope.

Wrangler 4 `r2 object`, `kv`, `d1 execute` / `d1 migrations apply` /
`d1 export` silently target the LOCAL simulator when neither flag is passed,
so a bare command in a doc, script, or comment is a future incident. This
scanner understands single-line shell AND multi-line Python argv arrays
(tokens may be split across lines and wrapped in quotes/commas).

Usage: python3 scripts/check_wrangler_scope.py   (exit 1 lists offenders)
CI:    .github/workflows/wrangler-scope.yml
"""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Commands with a local/remote duality in wrangler 4.
GUARDED = re.compile(
    r"r2\s+object\s+(put|get|delete)"
    r"|kv\s+(key\s+(put|get|list)|bulk\s+(put|delete))"
    r"|d1\s+execute"
    r"|d1\s+migrations\s+apply"
    r"|d1\s+export"
)
# Negative lookahead (not just =/space/end): flags also appear as
# `--remote \` (shell continuation), `--remote[/]` (rich markup), or
# `--remote"` (quoted argv arrays).
SCOPE = re.compile(r"--(local|remote)(?![A-Za-z0-9_-])")

# This scanner and the wrapper describe the commands without invoking them;
# exempt them (and lockfiles, which only name the binary) by path.
SKIP_SUFFIXES = ("scripts/check_wrangler_scope.py", "scripts/wr",
                 "package-lock.json")
SKIP_EXTS = {".png", ".jpg", ".jpeg", ".gif", ".pdf", ".ico", ".woff",
             ".woff2", ".ttf", ".sqlite", ".db", ".map"}

WINDOW = 8  # lines of context in which --local/--remote must appear


def normalize(line: str) -> str:
    line = re.sub(r"[`\"',]", " ", line)
    return re.sub(r"\s+", " ", line).strip()


def fenced_ranges(lines: list[str]) -> list[tuple[int, int]]:
    ranges, start = [], None
    for i, line in enumerate(lines):
        if line.lstrip().startswith("```"):
            if start is None:
                start = i
            else:
                ranges.append((start, i))
                start = None
    if start is not None:
        ranges.append((start, len(lines)))
    return ranges


def in_fence(ranges: list[tuple[int, int]], i: int, j: int) -> bool:
    return any(s <= k <= e for k in range(i, j) for s, e in ranges)


def check_file(path: Path) -> list[str]:
    try:
        text = path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, OSError):
        return []
    lines = text.splitlines()
    norm = [normalize(line).lower() for line in lines]
    fences = fenced_ranges(lines) if path.suffix == ".md" else []
    problems = []
    for i in range(len(lines)):
        blob = " ".join(norm[i:i + 3])
        if not GUARDED.search(blob):
            continue
        if fences:
            if not (in_fence(fences, i, i + 3)
                    or "wrangler" in lines[i].lower()):
                continue  # prose mention, not an invocation
        elif "wrangler" not in blob:
            continue
        context = " ".join(norm[max(0, i - WINDOW):i + 11])
        if not SCOPE.search(context):
            match = GUARDED.search(blob)
            problems.append(
                f"{path.relative_to(ROOT)}:{i + 1}: "
                f"bare '{match.group(0)}' with no --local/--remote nearby: "
                f"{lines[i].strip()[:100]}"
            )
    return problems


def main() -> int:
    try:
        out = subprocess.run(["git", "ls-files"], check=True, cwd=ROOT,
                             capture_output=True, text=True)
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print(f"check_wrangler_scope: cannot list tracked files: {e}")
        return 2
    problems: list[str] = []
    for name in out.stdout.splitlines():
        if name.endswith(SKIP_SUFFIXES):
            continue
        if Path(name).suffix.lower() in SKIP_EXTS:
            continue
        problems.extend(check_file(ROOT / name))
    if problems:
        print("bare wrangler data-plane commands (add --remote or --local):")
        for p in problems:
            print("  " + p)
        return 1
    print(f"wrangler scope check: clean "
          f"({len(out.stdout.splitlines())} tracked files scanned)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
