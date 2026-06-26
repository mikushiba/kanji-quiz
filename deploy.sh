#!/usr/bin/env bash
# 使い方: ~/kanji-quiz/deploy.sh "コミットメッセージ"
# index.html などの変更をコミットして GitHub Pages へ反映します。
# 共有DB(shared/kanji-db.js)が変わったときは、参照する全アプリの
# <script src="...kanji-db.js?v=..."> のバージョンを自動で上げ、
# キャッシュを確実に更新します（1か所の修正が全アプリに伝わる）。
set -e
cd "$(dirname "$0")"

MSG="${1:-クイズを更新}"

if [ -z "$(git status --porcelain)" ]; then
  echo "変更はありません。"
  exit 0
fi

# 共有アセット(shared/ 配下: kanji-db.js / kanji-ui.css など)に変更があれば、
# 全 index.html の ?v= を更新してキャッシュを確実に新しくする（全アプリに反映）
CHANGES="$(git status --porcelain)"
if printf '%s\n' "$CHANGES" | grep -q 'shared/'; then
  STAMP=$(date +%Y%m%d%H%M)
  find . -name 'index.html' -not -path './.git/*' -print0 \
    | xargs -0 sed -i '' -E "s|(shared/[^\"?]+\?v=)[^\"]*|\1${STAMP}|g"
  echo "🔄 共有アセットの更新を検出 → キャッシュ版数を ${STAMP} に更新（参照する全アプリに反映）"
fi

git add -A
git commit -m "$MSG"
git push
echo ""
echo "✅ 反映しました。1〜2分後に下記URLへ反映されます："
echo "   https://mikushiba.github.io/kanji-quiz/"
