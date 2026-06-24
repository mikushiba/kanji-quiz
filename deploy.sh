#!/usr/bin/env bash
# 使い方: ~/kanji-quiz/deploy.sh "コミットメッセージ"
# index.html などの変更をコミットして GitHub Pages へ反映します。
set -e
cd "$(dirname "$0")"

MSG="${1:-クイズを更新}"

if [ -z "$(git status --porcelain)" ]; then
  echo "変更はありません。"
  exit 0
fi

git add -A
git commit -m "$MSG"
git push
echo ""
echo "✅ 反映しました。1〜2分後に下記URLへ反映されます："
echo "   https://mikushiba.github.io/kanji-quiz/"
