#!/usr/bin/env bash
set -euo pipefail

# run_year.sh - dual-path P2 runner (dry-run support)
# Usage: run_year.sh <year> [--dry-run]

YEAR="$1"
DRY_RUN=false
if [ "${2-}" = "--dry-run" ]; then
  DRY_RUN=true
fi

BASE="$HOME/ai-learning"
PAGES_JSON="$BASE/hkdse/pages/p2_final_results.json"
IMAGES_DIR="$BASE/hkdse/images-p2"
LOG_DIR="$BASE/logs/p2/$YEAR"
PROGRESS_FILE="$BASE/logs/p2_test_progress.json"

mkdir -p "$LOG_DIR"

echo "Run year: $YEAR (dry-run=$DRY_RUN)"

# Preflight
errors=0
if [ ! -f "$PAGES_JSON" ]; then
  echo "ERROR: pages JSON not found: $PAGES_JSON" >&2
  errors=$((errors+1))
fi

if [ ! -d "$IMAGES_DIR" ]; then
  echo "WARN: images dir not found: $IMAGES_DIR" >&2
else
  imgcount=$(ls -1 "$IMAGES_DIR"/*.png 2>/dev/null | wc -l || true)
  if [ "$imgcount" -lt 45 ]; then
    echo "WARN: found $imgcount images in $IMAGES_DIR (expected >=45)" >&2
  fi
fi

# Check minimax key exists
SECRETS="$HOME/.openclaw/secrets.json"
minimax_key=""
if [ -f "$SECRETS" ]; then
  minimax_key=$(jq -r '.minimax-api-key // empty' "$SECRETS" 2>/dev/null || true)
fi
if [ -z "$minimax_key" ]; then
  echo "WARN: minimax-api-key not found in $SECRETS" >&2
fi

if [ "$errors" -gt 0 ]; then
  echo "Preflight failed. Exiting." >&2
  exit 2
fi

# iterate 45 questions
TOTAL=45
completed=0
pass_count=0
fail_count=0

for i in $(seq 1 $TOTAL); do
  qidx=$i
  outfile="$LOG_DIR/partial_q_${qidx}.json"

  if [ "$DRY_RUN" = true ]; then
    # extract the i-th entry from pages JSON if available
    entry=$(jq -c ".[$((qidx-1))] // {qid:\"unknown\", text:\"(no entry)\"}" "$PAGES_JSON" 2>/dev/null || echo '{}')
    echo "$entry" > "$outfile"
  else
    # real run would call MiniMax Vision and MiniMax text model
    # Placeholder: copy entry
    entry=$(jq -c ".[$((qidx-1))] // {qid:\"unknown\", text:\"(no entry)\"}" "$PAGES_JSON")
    echo "$entry" > "$outfile"
  fi

  completed=$((completed+1))

  # checkpoint every 5 questions
  if [ $((completed % 5)) -eq 0 ] || [ "$completed" -eq "$TOTAL" ]; then
    snapshot="$LOG_DIR/checkpoint_${completed}.json"
    jq -n --arg year "$YEAR" --argjson completed $completed --argjson total $TOTAL '{year: $year, completed: $completed, total: $total, last_updated: (now|todate)}' > "$snapshot"

    # update global progress file
    jq -n --argjson completed $completed --argjson total $TOTAL --arg last_updated "$(date -u +%Y-%m-%dT%H:%M:%SZ)" '{completed: $completed, remaining: ($total - $completed), last_updated: $last_updated, pass_count: 0, fail_count: 0}' > "$PROGRESS_FILE"

    echo "Checkpoint written: $snapshot (completed=$completed)"
  fi

  # small sleep to simulate work
  sleep 0.1

done

# Write year summary
summary="$LOG_DIR/year-summary.json"
jq -n --arg year "$YEAR" --argjson total $TOTAL --argjson completed $completed --arg last_updated "$(date -u +%Y-%m-%dT%H:%M:%SZ)" '{year: $year, total: $total, completed: $completed, last_updated: $last_updated, status: "dry-run"}' > "$summary"

echo "Year run complete (dry-run=$DRY_RUN). Summary: $summary"

# write human summary md
md="$LOG_DIR/year-summary.md"
cat > "$md" <<EOF
# HKDSE P2 Dual-Path Year Summary - $YEAR

Completed: $completed / $TOTAL
Mode: $( [ "$DRY_RUN" = true ] && echo "DRY-RUN (no API calls)" || echo "REAL-RUN" )
Last updated: $(date -u +%Y-%m-%dT%H:%M:%SZ)

Checkpoints:

EOF

ls -1 "$LOG_DIR"/checkpoint_*.json 2>/dev/null >> "$md" || true

echo "Human summary written: $md"

exit 0
