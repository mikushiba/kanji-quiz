---
name: kanji-quiz-update
description: 「同じ読みのかん字クイズ」アプリ(index.html)を更新する標準フロー。問題・漢字の追加/修正、配当チェック、検証、公開(deploy)、記録までを定型実行する。問題を増やす・漢字DBを足す・バグ修正・Lark用CSV書き出し・配当の網羅確認、などを頼まれたときに使う。
---

# 漢字クイズ 更新フロー

このリポジトリ（`mikushiba/kanji-quiz`）のアプリ本体は単一HTML `index.html`。
`KANJI`（漢字マスタ）と `BANK`（問題）を編集し、検証→公開する。**特定PCに依存せず、cloneした任意の環境（GCP等）で同じ手順で動く。**

公開URL: https://mikushiba.github.io/kanji-quiz/

## まず作業ディレクトリを合わせる
- ローカル: `cd ~/kanji-quiz`（既にcloneしてある）
- 別環境/初回: `git clone https://github.com/mikushiba/kanji-quiz && cd kanji-quiz`
- 前提: `node`(v20+)。push/公開するなら `gh` がGitHub認証済み。
- ※ このskillの相対コマンド（`node validate.mjs`・`./deploy.sh`）は **リポジトリ直下** で実行する。

## 必ず守るルール（メモリ参照）
- 漢字をDBへ足すときは **学年別配当表どおりの `{g:学年, s:画数, on:[音], kun:[訓]}`**。入れる字はすべて常用漢字。画数・音訓は正確に。
- 出題追加時は **答えの漢字を例文に出さない**（`@@` 以外に答えの漢字を書かない）。
- **既存の「同じ読み」グループは削除しない**（追加・拡充のみ）。

## 標準手順

### 0. 着手前チェック（任意）
```bash
node tools/db-coverage.mjs        # 配当の不足・学年ズレ
node tools/onaji-candidates.mjs   # これから作れる同じ読みグループ候補
```

### 1. 編集（index.html）
- 新しい漢字を使うなら先に `KANJI` に追記（上のルール）。
- `BANK` に問題を追記。書式:
  ```js
  { type:'onaji'/* or 'tsukai' */, tag:'同じ読み：よみ',
    sentence:'…@@…。', read:'よみ(ひらがな)', answer:'正解',
    choices:['正解','…'], meaning:{'正解':'いみ', …} }
  ```
  `answer` は必ず `choices` に含める。例文に答えの漢字を出さない。

### 2. 検証（必須・これが品質の要）
```bash
node validate.mjs
```
構造・答えが選択肢にある・選択肢の漢字がDBにある・意味がある・**答え漏れ**を自動チェック。NGなら修正して再実行。

### 3. 動作確認（任意・ローカルのみ）
ブラウザで `index.html` を開きコンソールerror 0／件数を確認。
クラウド/ヘッドレス環境では省略可（正確性は 2 と 5 が担保）。

### 4. 公開（commit→push→CI起動）
```bash
./deploy.sh "変更内容のメッセージ"
```

### 5. CI確認
```bash
gh run list --workflow=validate.yml --limit 1
```
`completed / success` を確認（GitHub Actions＝クラウドで自動検証）。

### 6. 記録
- `運用ガイド.md` の「これまでの作業の流れ」に1行追記。
- 必要なら CSV 再生成（Lark/Sheets用）:
  ```bash
  node tools/export-csv.mjs   # export/kanji.csv, export/questions.csv
  ```

## 参考: ファイル
- `index.html` … アプリ本体（KANJI/BANK＋ゲーム処理）
- `validate.mjs` … データ検証（CIでも実行）
- `deploy.sh` … commit+push（GitHub Pages反映＋Actions起動）
- `tools/db-coverage.mjs` / `tools/onaji-candidates.mjs` / `tools/export-csv.mjs`
- `README.md`（仕様）/ `運用ガイド.md`（運用・履歴）
- `lark-sync.mjs` … Lark Base へAPI同期（`lark.config.json` 必要・gitignore）
