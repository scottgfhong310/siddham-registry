#!/bin/zsh
# sync-copies.sh — 把獨立版回灌 InProgress 鏡像（WORKFLOW A4）
#
# GitHub 版是權威；每次改版都要再回灌，否則 3001 上跑的是舊版。
#
# ⚠️ **本 app 沒有 route，那是事實不是漏掉。** 它是零後端的靜態 registry
#    （家族 CLAUDE.md v1.45：「零後端，不必掛 route」），所以本腳本**沒有 ③ route 那一步**；
#    家族的 `tools/test-inprogress-mirror.js` 對它的 C 檢查也不觸發（repo 沒有 routes/<n>.js
#    時 `a.route` 為 null）。⚠️ 哪天它長出後端，這裡要補一步、而稽核會自己開始檢查。
#
# ⚠️ **本 app 沒有「活資料檔」，所以刻意沒有 `markdown-library`／`rare-glyph`／`web-launcher`
#    那種 LIVE_FILE 排除**：它零後端、沒有任何寫入端點，兩邊的內容都只由 repo 決定。
#    ⚠️ 哪天加了會寫回 public/apps/ 的端點，**要先回來加排除與反向護欄**——
#    那三支就是這樣被 `rsync -a` 整夾同步蓋掉活資料的（樹根 CLAUDE.md v2.63）。
#
# ⚠️ `data/*.js` 是 `My Projects/Siddham/export/s4-export.js` 的**產物、不手改**。
#    本腳本只把 repo 現況推過去——**它證明不了 repo 那一份與 `db_siddham` 一致**，
#    那要另外跑 `s4-export.js --check`（逐位元組比對，不一致回非 0）。
#
# 用法：./scripts/sync-copies.sh        （在 repo 根跑）
set -u

G=/Users/Shared/nodeapp/GitHub
I=/Users/Shared/nodeapp/InProgress
APP=siddham-registry
SRC=$G/$APP/public/apps/$APP
DST=$I/public/apps/$APP
FAIL=0

# ⚠️ 前提先查，不要讓「路徑不在」偽裝成「沒有東西要同步」。
[ -d "$SRC" ] || { echo "✗ 找不到權威版：$SRC"; exit 2; }
[ -d "$I" ]   || { echo "✗ 找不到孵化器：$I"; exit 2; }

# 這三類與家族稽核的 IGNORE 清單一致（本機產物，兩邊本來就不該一致）。
EXCLUDE=(--exclude=.bak --exclude=.DS_Store --exclude=.claude)

echo "=== ① 前端 → InProgress 鏡像 ==="
mkdir -p "$DST"
rsync -a --delete "${EXCLUDE[@]}" "$SRC/" "$DST/" || { echo "  rsync 失敗"; FAIL=1; }
if diff -rq -x '.bak' -x '.DS_Store' -x '.claude' "$SRC" "$DST" > /dev/null 2>&1; then
  n=$(find "$SRC" -type f -not -path '*/.bak/*' -not -name .DS_Store | wc -l | tr -d ' ')
  echo "  OK  與獨立版逐檔相同（$n 個檔）"
else
  echo "  MISMATCH"; diff -rq -x '.bak' -x '.DS_Store' -x '.claude' "$SRC" "$DST"; FAIL=1
fi

echo "=== ② 沒有 app 專屬 route（零後端）——刻意跳過，不是漏掉 ==="
if [ -f "$G/$APP/routes/$APP.js" ]; then
  echo "  ✗ repo 裡冒出 routes/$APP.js —— 本 app 長出後端了，請回來補回灌那一步"; FAIL=1
elif [ -f "$I/routes/$APP.js" ]; then
  echo "  ✗ InProgress 有 routes/$APP.js 而 repo 沒有 —— 兩邊對不上，請查清楚"; FAIL=1
else
  echo "  OK  兩邊都沒有（與零後端一致）"
fi

echo "=== ③ 借來的共用件應與權威版 byte-identical（只驗不抓）==="
FAMILY=$G/nodeapp-webapp-family
check_same() {  # $1 權威版  $2 本地複製件  $3 顯示名
  if [ ! -f "$1" ]; then echo "  SKIP  找不到權威版：$1"; return; fi
  if diff -q "$1" "$2" > /dev/null 2>&1; then echo "  OK    $3"
  else echo "  DRIFT $3 —— 與權威版不同（改就改權威版再同步，不要在本 app 內就地改）"; FAIL=1; fi
}
check_same "$FAMILY/side-tool.css"        "$SRC/side-tool.css"        side-tool.css
check_same "$FAMILY/side-tool.js"         "$SRC/side-tool.js"         side-tool.js
check_same "$FAMILY/i18n.js"              "$SRC/i18n.js"              i18n.js
check_same "$FAMILY/materialize-dark.css" "$SRC/materialize-dark.css" materialize-dark.css
check_same "$G/local-reader/public/apps/local-reader/filter-clear.css" "$SRC/filter-clear.css" filter-clear.css
check_same "$G/local-reader/public/apps/local-reader/filter-clear.js"  "$SRC/filter-clear.js"  filter-clear.js

echo ""
if [ "$FAIL" -eq 0 ]; then
  echo "全部通過。⚠️ 本 app 零後端 ⇒ **不必重啟 monolith**（靜態檔每次請求現讀）。"
  echo "　　收尾可跑家族稽核複驗：node $FAMILY/tools/test-inprogress-mirror.js"
  exit 0
fi
echo "有項目不符——見上。"
exit 1
