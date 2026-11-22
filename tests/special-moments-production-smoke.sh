#!/usr/bin/env bash
set -euo pipefail
base="https://kindelora.pages.dev"
dir="$(mktemp -d)"
trap 'rm -rf "$dir"' EXIT
curl --fail --silent --show-error --location --max-time 25 --retry 2 "$base/special-moments.html" -o "$dir/page"
grep -Fq 'Special Moments' "$dir/page" || { echo 'Missing Special Moments page'; exit 1; }
grep -Fq 'moment-card-preview' "$dir/page" || { echo 'Missing preview styling'; exit 1; }
grep -Fq 'special-moments-kindness-card.js?v=6' "$dir/page" || { echo 'Production kindness card script version not deployed'; exit 1; }
grep -Fq 'special-moments.js?v=13' "$dir/page" || { echo 'Production member UI script version not deployed'; exit 1; }
for file in special-moments.js special-moments-kindness-card.js; do
  curl --fail --silent --show-error --location --max-time 25 --retry 2 "$base/$file" -o "$dir/$file"
done
grep -Fq 'moment-share-status' "$dir/special-moments.js" || { echo 'Production per-card feedback not deployed'; exit 1; }
grep -Fq 'const PREMIUM_ASSETS=' "$dir/special-moments-kindness-card.js" || { echo 'Premium card artwork mapping missing'; exit 1; }
grep -Fq 'const prepared=new Map()' "$dir/special-moments-kindness-card.js" || { echo 'Production share preloading not deployed'; exit 1; }
curl --fail --silent --show-error --location --max-time 25 --retry 2 "$base/assets/file_00000000bbe8820eb12d4d9ba94ae770.png" -o "$dir/card.png"
test "$(wc -c < "$dir/card.png")" -gt 10000 || { echo 'Premium image appears empty or truncated'; exit 1; }
# A CDN can return a branded HTML error with HTTP 200; verify actual PNG bytes.
actual_signature="$(od -An -tx1 -N8 "$dir/card.png" | tr -d ' \\n')"
test "$actual_signature" = '89504e470d0a1a0a' || { echo 'Premium artwork response is not a PNG image'; exit 1; }
for asset in file_000000006a9c820e97e73deecb044c16.png file_00000000f0e4820e8f4eda3d9338ece2.png; do
  curl --fail --silent --show-error --location --max-time 25 --retry 2 "$base/assets/$asset" -o "$dir/$asset"
  test "$(wc -c < "$dir/$asset")" -gt 10000 || { echo "Premium card $asset appears truncated"; exit 1; }
  signature="$(od -An -tx1 -N8 "$dir/$asset" | tr -d ' \\n')"
  test "$signature" = '89504e470d0a1a0a' || { echo "Premium card $asset is not a PNG"; exit 1; }
done
printf 'PASS: public page, preview styling, JS versions, share preloading and premium artwork reachable\n'
printf 'NOTE: Does not test authenticated member data, native share sheet or WhatsApp delivery.\n'
