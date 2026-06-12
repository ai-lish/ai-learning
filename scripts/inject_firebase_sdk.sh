#!/usr/bin/env bash
# inject_firebase_sdk.sh — V3 將 Firebase SDK + firebase-config.js + auth-state.js
#                         注入到所有主要公開頁面
#
# 對應規劃：PLANNING/20260611_GLOBAL_LOGIN_FIREBASE_GOOGLE_V3.md
#
# 注入結構（head 末尾、auth-widget 之前）：
#   <!-- V3-FIREBASE-SDK 10.7.1 -->
#   <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js" defer></script>
#   <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js" defer></script>
#   <script src="<rel>/js/firebase-config.js"></script>
#   <link rel="stylesheet" href="<rel>/css/auth-widget.css">      ← 若未有
#   <script src="<rel>/js/auth-state.js" defer></script>            ← 若未有
#
# Manifest：沿用 V1 嘅 Tier 1 公開頁面清單（同 fix_auth_widget_paths.sh）。
# Idempotent：再跑一次唔會重複注入（用 marker 判斷）。
# Skip rule：<body data-no-auth-widget> 嘅頁面只注入 SDK，唔注入 widget CSS/JS。
#
# 用法：
#   ./scripts/inject_firebase_sdk.sh           # 注入
#   ./scripts/inject_firebase_sdk.sh --check   # 只列將被修改嘅檔案
#   ./scripts/inject_firebase_sdk.sh --revert  # 移除已注入嘅 SDK 區塊
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

MODE="${1:-inject}"

SDK_VERSION="10.7.1"
SDK_BASE="https://www.gstatic.com/firebasejs/${SDK_VERSION}"
MARKER_SDK="<!-- V3-FIREBASE-SDK ${SDK_VERSION} -->"

# Manifest 沿用 V1 inject_auth_widget.sh 嘅 Tier 1
TIER1=(
  "index.html"
  "games-index.html"
  "stories.html"
  "math-svg-tools.html"
  "seat.html"
  # 中一
  "S1Ch1.html"
  "S1Ch2.html"
  "S1Ch3.html"
  "S1Ch4.html"
  "S1Ch5.html"
  "S1Ch6.html"
  "S1Ch7.html"
  "S1Ch8.html"
  "S1Ch9.html"
  "S1Ch10.html"
  "S1Ch11.html"
  "S1Ch12.html"
  "S1Ch13.html"
  # 中二
  "S2Ch10.html"
  # 中三
  "S3Ch2.html"
  "S3Ch4.html"
  "S3Ch7.html"
  "S3Ch8.html"
  "S3Ch9.html"
  "S3Ch11.html"
  # 中四
  "S4Ch3.html"
  "S4Ch3-line-concept.html"
  "S4Ch3-line-mystery.html"
  "S4Ch3-line-practice.html"
  # 中五
  "S5Ch14.html"
  "S5Ch17.html"
  "S5Ch18.html"
  "S5Tutorial.html"
  # 考試 + DSE
  "exam/index.html"
  "hkdse/dse-practice-p1.html"
  "hkdse/dse-practice-p2.html"
  # 自學
  "s1/selfstudy/index.html"
  "s1/selfstudy/practice-s2甲部.html"
  "s1/selfstudy/2025-26-中一-第三學期-甲部.html"
  "s3/selfstudy/index.html"
  "s3甲部基礎練習.html"
  # 學生 Dashboard / 密碼
  "student/dashboard/index.html"
  "student/change-password.html"
)

# 為每個 file 推導相對深度（用於 js/css 路徑）
# 例：'foo/bar.html' → 1 → '../'，'a/b/c.html' → 2 → '../../'
rel_prefix() {
  local f="$1"
  local d
  d="$(dirname "$f")"
  if [ "$d" = "." ]; then
    echo ""
  else
    # 用 awk 計算 path 組件數
    local n
    n=$(echo "$d" | awk -F/ '{print NF}')
    local out=""
    local i
    for ((i=0; i<n; i++)); do
      out="${out}../"
    done
    echo "$out"
  fi
}

# 寫入 inject 嘅 perl 腳本到 /tmp，避開 shell escaping 嘅坑
PERL_INJECT_SCRIPT="$(mktemp -t inject_v3.XXXXXX.pl)"
PERL_REVERT_SCRIPT="$(mktemp -t revert_v3.XXXXXX.pl)"
cat > "$PERL_INJECT_SCRIPT" <<'PERL_EOF'
use strict;
use warnings;
my $marker = $ARGV[0];
my $sdk_app = $ARGV[1];
my $sdk_auth = $ARGV[2];
my $config = $ARGV[3];
my $css = $ARGV[4];   # may be empty
my $js = $ARGV[5];    # may be empty
my $file = $ARGV[6];
my $sdk_block = "${marker}\n${sdk_app}\n${sdk_auth}\n${config}\n";

local $/ = undef;
open(my $fh, '<', $file) or die "Cannot read $file: $!";
my $content = <$fh>;
close($fh);

# Skip if already injected
if ($content =~ /\Q$marker\E/) {
  print "  · already has SDK: $file\n";
  exit 0;
}

my $insertion;
if ($css ne '' && $content =~ /^( *)(<link rel="stylesheet" href="\Q$css\E">)/m) {
  # Insert before existing widget CSS link
  $insertion = $sdk_block . $1 . $2 . "\n";
  $content =~ s|^( *)(<link rel="stylesheet" href="\Q$css\E">)|$insertion|m;
} elsif ($js ne '' && $content =~ /^( *)(<script src="\Q$js\E" defer><\/script>)/m) {
  $insertion = $sdk_block . $1 . $2 . "\n";
  $content =~ s|^( *)(<script src="\Q$js\E" defer><\/script>)|$insertion|m;
} elsif ($content =~ /^( *)(\<\/head\>)/m) {
  $insertion = $sdk_block . $1 . $2;
  $content =~ s|^( *)(\<\/head\>)|$insertion|m;
} else {
  die "Cannot find insertion point in $file";
}

open($fh, '>', $file) or die "Cannot write $file: $!";
print $fh $content;
close($fh);
print "  ✓ injected SDK: $file\n";
PERL_EOF

cat > "$PERL_REVERT_SCRIPT" <<'PERL_EOF'
use strict;
use warnings;
my $marker = $ARGV[0];
my $file = $ARGV[1];

local $/ = undef;
open(my $fh, '<', $file) or die "Cannot read $file: $!";
my $content = <$fh>;
close($fh);

# 移除由 marker 至下個空行 (最多 4 行)
my $count = $content =~ s|\Q$marker\E\n(?:[^\n]*\n){0,4}||g;
if ($count) {
  open($fh, '>', $file) or die "Cannot write $file: $!";
  print $fh $content;
  close($fh);
  print "  ✓ reverted: $file\n";
}
PERL_EOF

inject_file() {
  local f="$1"
  if [ ! -f "$f" ]; then
    echo "  ⚠️  missing: $f"
    return 0
  fi
  if [ "$f" = "login/index.html" ]; then
    # login/index.html 係 redirect shim，唔注入 widget
    return 0
  fi

  local rel
  rel="$(rel_prefix "$f")"
  local css="${rel}css/auth-widget.css"
  local js="${rel}js/auth-state.js"
  local sdk_app="<script src=\"${SDK_BASE}/firebase-app-compat.js\" defer></script>"
  local sdk_auth="<script src=\"${SDK_BASE}/firebase-auth-compat.js\" defer></script>"
  local config="<script src=\"${rel}js/firebase-config.js\" defer></script>"

  perl "$PERL_INJECT_SCRIPT" "$MARKER_SDK" "$sdk_app" "$sdk_auth" "$config" "$css" "$js" "$f"
}

revert_file() {
  local f="$1"
  if [ ! -f "$f" ]; then return 0; fi
  perl "$PERL_REVERT_SCRIPT" "$MARKER_SDK" "$f" || true
}

trap 'rm -f "$PERL_INJECT_SCRIPT" "$PERL_REVERT_SCRIPT"' EXIT

case "$MODE" in
  --check)
    echo "=== V3 files that would be modified ==="
    for f in "${TIER1[@]}"; do
      if [ -f "$f" ] && ! grep -qF "$MARKER_SDK" "$f"; then
        echo "  → $f"
      fi
    done
    ;;
  --revert)
    echo "=== Reverting V3 SDK injection ==="
    for f in "${TIER1[@]}"; do
      revert_file "$f"
    done
    ;;
  inject|"")
    echo "=== V3 injecting Firebase SDK ${SDK_VERSION} ==="
    for f in "${TIER1[@]}"; do
      inject_file "$f"
    done
    echo ""
    echo "=== Verify ==="
    COUNT_OK=0
    COUNT_SKIP=0
    COUNT_MISS=0
    for f in "${TIER1[@]}"; do
      if [ -f "$f" ]; then
        if grep -qF "$MARKER_SDK" "$f"; then
          COUNT_OK=$((COUNT_OK+1))
        else
          COUNT_MISS=$((COUNT_MISS+1))
        fi
      else
        COUNT_SKIP=$((COUNT_SKIP+1))
      fi
    done
    echo "  injected: $COUNT_OK / missing: $COUNT_MISS / skipped: $COUNT_SKIP"
    ;;
  *)
    echo "Unknown mode: $MODE" >&2
    exit 1
    ;;
esac
