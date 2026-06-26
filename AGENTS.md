# AGENTS.md — 漢字クイズ 開発ガイド（AIエージェント共通）

Claude Code・Codex など、このリポジトリを編集するエージェント向けの最初に読むファイル。
**人間向けの詳細は別ドキュメントにある。まずは「読む順番」に従って背景を把握してから着手すること。**

---

## 0. まず読む順番（背景理解）

1. **`ARCHITECTURE.md`** … 設計の本体（構成・共有モジュール・制約・どこを直すか早見表・新アプリの足し方）★最重要
2. **`運用ガイド.md`** … これまでの作業履歴と意思決定（なぜこの設計になったか）
3. **`README.md`** … 仕様（画面・データ構造・ゲーム性）

迷ったら `ARCHITECTURE.md`。このAGENTS.mdは要約＋作業規約。

## 1. これは何

「漢字クイズ」**ポータル＋複数アプリ**。小学1〜6年むけ家族向け学習アプリ。GitHub Pages公開、**file:// 直開きでも動く**。
- `/index.html`（トップ＝メニュー）／`onaji/index.html`（同じ読み・使い分け）／`okurigana/index.html`（送りがな）
- `shared/`（DB・見た目・育成系を全アプリで共有）

## 2. 絶対に守る制約（破ると壊れる）

- **file:// 対応必須**（家族がローカルでも開く）。
  - 共有資産は**グローバル代入のクラシック `<script src>` のみ**。**ESモジュール `import` も `fetch(JSON)` も file:// で動かないので使用禁止**。
  - アプリ間リンクは**必ず明示的に `index.html` 付き**（`onaji/index.html`・`../index.html`）。`onaji/` のようなディレクトリ指定は file:// でフォルダ一覧になり壊れる。
  - CSSは `<link rel="stylesheet">` でOK（file://可）。
- **進捗は localStorage キー `kanjiQuiz.v1`（オリジン単位）を全アプリ共有**＝図鑑/称号/メダル/累計が自動合算。`store` は **full-load → 一部更新 → full-save** で他アプリのフィールドを壊さない。アプリ専用データは名前空間分離（例 `store.okuriWrong`/`okuriDaily`）。
- **読み込み順厳守**：`kanji-db.js` → `quiz-core.js` → アプリ本体。
- **責務分離**：`KANJI`＝`shared/kanji-db.js`（唯一の正データ）／`BANK`（同じ読み・使い分けの問題）＝`onaji/index.html` 専用／見た目＝`shared/kanji-ui.css`／育成系＝`shared/quiz-core.js`（QuizCore）。
- **問題追加のルール**：例文に答えの漢字を出さない（`@@` のみ）。漢字は配当どおり `{g,s,on,kun}`、画数・音訓は正確に。既存の「同じ読み」グループは削除しない（追加のみ）。

## 3. どこを直す（早見表）

| やりたいこと | 直す場所 |
|---|---|
| 漢字を足す/直す | `shared/kanji-db.js` の `KANJI`（→全アプリ・送りがな・図鑑に自動反映） |
| 同じ読み/使い分けの問題 | `onaji/index.html` の `BANK` |
| 見た目（デザイン・部品） | `shared/kanji-ui.css` |
| 図鑑/称号/メダル/セーブのロジック | `shared/quiz-core.js`（QuizCore） |
| 新しいクイズ種類を追加 | `新フォルダ/index.html`＋`shared/` 参照、トップに `mode-btn` を1つ |

## 4. 標準ワークフロー

```bash
cd ~/kanji-quiz
# 1) 編集（上の早見表のとおり）
# 2) 検証（必須）
node validate.mjs            # 構造・答えが選択肢にある・DB存在・意味・答え漏れ
node tools/db-coverage.mjs   # 学年別配当の網羅
# 3) ローカル確認（任意）: ブラウザで onaji/index.html や index.html を file:// で開きコンソール0
# 4) 公開（コミット＋push＋Pages。shared/変更時は全index.htmlの ?v= を自動更新）
./deploy.sh "変更内容のメッセージ"
# 5) CI確認
gh run list --workflow=validate.yml --limit 1   # completed / success
# 6) 運用ガイド.md の作業履歴に1行追記
```

検証は実ブラウザ確認まで行うのが望ましい（特に file:// 直開き・コンソールエラー0・進捗合算）。

## 5. リポジトリ地図

```
index.html              トップ（メニュー）
onaji/index.html        同じ読み・使い分け（BANK はここ）
okurigana/index.html    送りがな（KANJI から自動生成）
shared/
  kanji-db.js           KANJI（唯一の正データ）＋ wordGrade ＋ parseOkurigana
  kanji-ui.css          全アプリ共通デザイン
  quiz-core.js          QuizCore（図鑑・称号・メダル・セーブ＝進捗合算）
tools/
  lib.mjs               共通ローダ（KANJIは共有から/BANKはonaji/から）
  db-coverage.mjs / onaji-candidates.mjs / export-csv.mjs
validate.mjs            問題データ検証（CI: .github/workflows/validate.yml）
deploy.sh               公開（?v= 自動更新つき）
ARCHITECTURE.md 運用ガイド.md README.md   ドキュメント
```

## 6. 補足

- `KANJI.kun` は送りがなを `()` 内に符号化（`'うつ(る)'`＝`移る`）。送りがなアプリは `parseOkurigana` でこれを分解して自動生成。
- 学年別配当（2020新配当）は `tools/db-coverage.mjs` の `HAITOU` が正。新規学年や移動字はここで照合。
- 公開URL: トップ https://mikushiba.github.io/kanji-quiz/ ／ `…/onaji/` ／ `…/okurigana/`
- Claude Code には `/kanji` スキル（更新フローの定型）あり。詳細は `CLAUDE.md`。
