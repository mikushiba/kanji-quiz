# CLAUDE.md

このリポジトリの開発ガイドは **`AGENTS.md`**（ツール非依存の共通ガイド）に集約している。
**まず `AGENTS.md` を読むこと。** その「0. まず読む順番」に従って `ARCHITECTURE.md`（設計）→`運用ガイド.md`（履歴）も把握する。

## 要点（詳細は AGENTS.md）
- これは「漢字クイズ」ポータル＋複数アプリ。DB・見た目・育成系を `shared/` に集約し、各アプリは参照するだけ。**file:// 直開きでも動く**。
- **編集場所**：漢字→`shared/kanji-db.js` の `KANJI`／問題→`onaji/index.html` の `BANK`／見た目→`shared/kanji-ui.css`／育成系→`shared/quiz-core.js`。
- **絶対制約**：共有はグローバルclassic `<script>`（ESM/fetch禁止）・アプリ間リンクは明示`index.html`付き・進捗は localStorage `kanjiQuiz.v1` 共有で合算。読込順 `kanji-db.js`→`quiz-core.js`→本体。
- **検証→公開**：`node validate.mjs` → `./deploy.sh "msg"` → `gh run list --workflow=validate.yml` → `運用ガイド.md` に1行追記。

## Claude Code 固有
- **`/kanji` スキル**：問題・漢字の追加/修正→検証→公開→記録の定型フロー（このリポジトリ用）。問題を増やす/漢字を足す等はこれを使う。
- 作業ディレクトリは `~/kanji-quiz`。`./deploy.sh` でコミット＋push＋GitHub Pages 反映（`shared/` 変更時は全 `index.html` の `?v=` を自動更新）。
- 公開や外部反映を伴う操作（deploy/push）はユーザーの依頼・承認の範囲で行う。
