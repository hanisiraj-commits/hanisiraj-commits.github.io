#!/bin/bash
# Gate before deploying johnnys-deal-planner.html.
#
# Written 28/08/2026 after a stray apostrophe in a flag string shipped a page that
# served HTTP 200, was byte-identical to local, and still died on load with an
# uncaught SyntaxError. The lesson: 200 and a checksum prove delivery, not that the
# page runs. This loads the real file in a real browser and fails on any console
# error, so the check can never drift from what is actually on disk.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PAGE="$ROOT/johnnys-deal-planner.html"
TARGET="${1:-file://$PAGE}"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

echo "checking $TARGET"
LOG=$(mktemp)
"$CHROME" --headless --disable-gpu --no-sandbox --hide-scrollbars \
  --window-size=1400,1000 --virtual-time-budget=9000 \
  --screenshot=/dev/null --enable-logging=stderr --v=0 \
  "$TARGET#2026-09-01" >/dev/null 2>"$LOG" || true

ERRS=$(grep -iE "CONSOLE.*(Uncaught|SyntaxError|ReferenceError|TypeError)" "$LOG" || true)
if [ -n "$ERRS" ]; then
  echo "FAIL — the page throws on load:"
  echo "$ERRS" | head -5
  rm -f "$LOG"; exit 1
fi

# the deal data has to be readable, not just parseable
node -e "
const fs=require('fs'), s=fs.readFileSync('$PAGE','utf8');
const src=s.slice(s.indexOf('const CDN ='), s.indexOf('const MONTHS=Object.keys(PLAN)'));
const PLAN=new Function(src+'; return PLAN;')();
const m=PLAN['2026-09'], ds=Object.keys(m.days);
if(ds.length===0) { console.log('FAIL — no September days'); process.exit(1); }
const black=[];
for(let d=1;d<=30;d++){const k='2026-09-'+String(d).padStart(2,'0');
  const b=(m.blocks||[]).find(x=>k>=x.from&&k<=x.to);
  if(b&&b.deals===false) black.push(k); }
if(ds.length+black.length!==30){console.log('FAIL — '+ds.length+' deals + '+black.length+' blackouts != 30');process.exit(1);}
console.log('PASS — '+ds.length+' deal days, '+black.length+' blackout days, no console errors');
"
rm -f "$LOG"
