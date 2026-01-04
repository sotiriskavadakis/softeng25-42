#!/usr/bin/env bash
set -euo pipefail

FILE="${1:-$(dirname "$0")/../data/parts1234.json}"

if [[ ! -f "$FILE" ]]; then
  echo "Error: file not found: $FILE" >&2
  exit 1
fi

if command -v jq >/dev/null 2>&1; then
  if jq -e . >/dev/null 2>&1 < "$FILE"; then
    jq -r 'map(.connector_types // []) | flatten | unique | sort[]' "$FILE"
    exit 0
  fi
fi

awk '
BEGIN { in_arr=0 }
$0 ~ /"connector_types"[[:space:]]*:/ { in_arr=1; next }
in_arr {
  n=split($0, a, /"/);
  for (i=2; i<=n; i+=2) {
    t=a[i];
    if (t != "" && t != "connector_types") seen[t]=1;
  }
  if ($0 ~ /\]/) in_arr=0;
}
END {
  for (t in seen) print t;
}
' "$FILE" | sort -u
