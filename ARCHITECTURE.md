# 漢字クイズ アーキテクチャ（設計ナレッジ）

このリポジトリ（`mikushiba/kanji-quiz`）は「漢字クイズ」**ポータル＋複数アプリ**の構成。
DB・見た目・育成系（図鑑/称号/メダル）を `shared/` の共通モジュールに集約し、各アプリは
それを**参照するだけ**。1か所直せば全アプリに反映される。

公開: トップ https://mikushiba.github.io/kanji-quiz/ ／ 同じ読み `…/onaji/` ／ 送りがな `…/okurigana/` ／ 部首 `…/bushu/` ／ 画数 `…/kakusu/` ／ 四字熟語 `…/yoji/` ／ 音訓 `…/onkun/`

※ `KANJI` の `on`/`kun` は**常用漢字表の公式音訓と一致**（出典: cjkvi-tables/joyo2010.txt＝Wikipedia常用漢字一覧。表外は含めない）。漢字を足すときも公式音訓で。

---

## ディレクトリ構成

```
/index.html            … トップ（メニュー＝ポータル）
/onaji/index.html      … 同じ読み/使い分けクイズ（問題 BANK はここ）
/okurigana/index.html  … 送りがな練習（KANJI から自動生成・手作りデータ無し）
/bushu/index.html      … 部首クイズ（部首あて＋なかま分け。部首データ RADICALS はここ）
/kakusu/index.html     … 画数クイズ（何画？＋何画目？/筆順）。筆順データは kakusu/strokes.js
/kakusu/strokes.js     … 筆順ベクター STROKES（KanjiVG由来・CC BY-SA 3.0・全1026字）
/yoji/index.html       … 四字熟語クイズ（穴うめ＋意味あて。データ YOJI はここ）
/onkun/index.html      … 音読み・訓読みクイズ（音か訓か／読みあて。KANJIのon/kunから自動生成）
/shared/
  kanji-db.js          … 漢字マスタ KANJI（唯一の正データ）＋ wordGrade ＋ parseOkurigana
  kanji-ui.css         … 全アプリ共通のデザイン（トークン＋UI部品）
  quiz-core.js         … 育成系エンジン QuizCore（図鑑・称号・メダル・セーブ）＝進捗合算
/tools/                … lib.mjs（共通ローダ）/ db-coverage / onaji-candidates / export-csv
/validate.mjs          … 問題データ検証（CIで実行）
/deploy.sh             … コミット＋push＋公開（shared/変更時は ?v= を自動更新）
```

各アプリHTMLの読み込み順（**この順序が必須**）:
```html
<link rel="stylesheet" href="…/shared/kanji-ui.css?v=YYYYMMDDhhmm">
<script src="…/shared/kanji-db.js?v=…"></script>   <!-- KANJI/wordGrade/parseOkurigana -->
<script src="…/shared/quiz-core.js?v=…"></script>  <!-- QuizCore（kanji-db.js の後） -->
<script> /* 各アプリ本体。上の グローバル const を参照 */ </script>
```

---

## 共有モジュールの中身

### shared/kanji-db.js（唯一の正データ）
- `KANJI` = `{ '漢字': {g:学年, s:画数, on:[音…], kun:[訓…]} }`（1〜6年 全1026字）。
- `kun` は**送りがなを `()` 内に符号化**：`'うつ(る)'` ＝ 語幹`うつ`＋送り`る`＝`移る`。
- `wordGrade(word)` … 語の最大学年（送りがな無視）。
- `parseOkurigana(kanji, kun)` … `'うつ(る)'` → `{reading:'うつる', stem:'うつ', okuri:'る', word:'移る'}`。送りがなアプリはこれで自動生成。
- 公開: ブラウザ＝グローバル `const KANJI`/`window.KANJI`、Node＝`module.exports`（ツールが require）。

### shared/kanji-ui.css
- デザイントークン（`--bg`/`--accent` 等）＋部品クラス（`.card`/`.choice`/`.feedback`/`.seg`/`.bigkanji`/`.buddy`/`.dcard`/`.medal`/`.stars`/`.review`/`.mode-btn`/`.topRow`/`.collbar`/`.saveBar`/`.dailyBtn`/`.applink`/`.toplink` …）。
- 見た目を直すなら**ここだけ**。全アプリに反映。

### shared/quiz-core.js（QuizCore：育成系エンジン）
- 進捗ストア（localStorageキー **`kanjiQuiz.v1`**）。`store` は全フィールドを load→一部更新→save で保持。
- 図鑑: `COLLECTIBLE`（DB全字）/ `dexCount` / `masterCount` / `dexGradeDone` / `recordCorrect(word)`。
- 称号: `STAGES`(17段) / `rankStage(n)` / `renderBuddy(els)`。
- メダル: `MEDALS`(100種) / `checkMedals()`。
- 集計: `bumpCorrect` / `noteCombo` / `notePlay` / `notePerfect`。
- 描画: `dexHead/dexGridHTML` / `medalsHead/medalsGridHTML`。
- 出題数セレクタ（全アプリ共通UI）: `COUNT_OPTIONS`（10/20/50/ぜんぶ）/ `renderCountSeg(segEl, current, onPick)` — `<div id="countSeg">` を空にしておき、初期化で `QuizCore.renderCountSeg($('countSeg'), '10', v=>{…})` を呼ぶ。値は文字列 `'10'/'20'/'50'/'all'` で `onPick` に渡る。選択肢を増やすときは **ここ1か所** を直せば全アプリに反映。
- セーブ: `exportSave(filename)` / `importSave(file)`（共有ストア全体＝全アプリの進捗をまとめて入出力）。
- onaji も okurigana も**同じ定義・同じ store** を使う（識別子をエイリアスして委譲）。

---

## 重要な制約・規約（ハマりどころ）

1. **file:// で直接開ける必要がある**（家族がローカルでも使う）。このため:
   - 共有DB/エンジンは **グローバル代入のクラシック `<script>`** で読む。**ESモジュール `import` も `fetch(JSON)` も file:// では動かない**ので不可。
   - アプリ間リンクは**必ず明示的に `index.html` 付き**（`onaji/index.html`・`../index.html`）。file:// で `onaji/` のようなディレクトリ指定は **index.html を開かずフォルダ一覧になる**。
   - 外部 `<link rel="stylesheet">` は file:// でも読める（CSSはこれでOK）。
2. **localStorage はオリジン単位**（`mikushiba.github.io` 全体で1つ。パスは無関係）。
   - だから全アプリが同じキー `kanjiQuiz.v1` を使えば**進捗が自動で合算**される（あるアプリで集めた図鑑が別アプリにも反映）。
   - 進捗のうち**合算するもの**＝図鑑・称号・メダル・累計正解・最高コンボ・プレイ回数。
   - **アプリ専用**のものは同じ store 内に名前空間分離（例 送りがなの復習 `store.okuriWrong`、デイリー `store.okuriDaily`）。他アプリのフィールドは壊さない（full-load→一部更新→full-save）。
3. **キャッシュ反映**: `deploy.sh` は `shared/` 配下に変更があると、全 `index.html` の `?v=` を現在時刻に一括更新する。共有を直したら deploy で自動的に全アプリへ届く。
4. **責務分離**: `KANJI`＝共有DB（`shared/kanji-db.js`）。`BANK`（同じ読み/使い分けの問題）＝**`onaji/index.html` 専用**。送りがなは `KANJI` から自動生成（データ無し）。

---

## どこを直す？（早見表）

| やりたいこと | 直す場所 |
|---|---|
| 漢字を足す/直す | `shared/kanji-db.js` の `KANJI`（→全アプリ・送りがな・図鑑に自動反映） |
| 同じ読み/使い分けの問題を足す | `onaji/index.html` の `BANK` |
| 四字熟語を足す/直す | `yoji/index.html` の `YOJI`（`{y:四字,r:読み,m:意味}`。4字すべて `KANJI` 実在。学年＝使う漢字の最高学年で自動配分。`node validate.mjs` で検証） |
| 画数クイズ | 何画＝`KANJI.s` から自動。何画目＝`kakusu/strokes.js`（KanjiVG, CC BY-SA, viewBox 0 0 109 109）。漢字を足したら `tools/build-strokes.mjs` でKanjiVG XMLから再抽出。画数は `validate.mjs` がDB(`s`)と照合 |
| 部首を足す/直す | 基本は **再生成**：`tools/build-radicals.mjs`（Unihan康熙部首＋IDSから機械生成。全1026字を**207部首にフル網羅**）。出力 `RADICALS_literal.js` を `bushu/index.html` の `RADICALS` に貼る。漢字をDBに足したら再生成で自動分類。手直しする場合も `{c,pos,mean,ks:[例字…]}`／例字は `KANJI` 実在・1字1部首（`node validate.mjs` で検証） |
| 見た目を変える | `shared/kanji-ui.css` |
| 図鑑/称号/メダル/セーブのロジック | `shared/quiz-core.js`（QuizCore） |
| 新しいクイズ種類を追加 | `新フォルダ/index.html` を作り `shared/` を参照。トップ `index.html` にボタン1つ追加 |

## 新しいクイズアプリの足し方
1. `xxx/index.html` を作る。`<link>` で `../shared/kanji-ui.css`、`<script>` で `../shared/kanji-db.js`→`../shared/quiz-core.js` を読む（順序厳守・`?v=` 付き）。
2. 問題は `KANJI`/`parseOkurigana` 等から生成、または独自データを同HTML内に。
3. 育成系は `QuizCore.*` を呼ぶ（正解で `recordCorrect`/`bumpCorrect`/`noteCombo`、結果で `notePlay`/`checkMedals`）。→ 進捗は自動合算。
4. 出題数の選択は `<div id="countSeg"></div>` を置き、`QuizCore.renderCountSeg(...)` で描画（独自にボタンを書かない＝全アプリで数値・見た目を統一）。
5. アプリ間リンクは `../index.html`（トップへ）。トップ `index.html` の `.modes` に `mode-btn` を1つ足す。
5. `deploy.sh` で公開（`?v=` 自動更新）。

## 検証・公開
- `node validate.mjs` … 問題データ検証（KANJIは shared から、BANKは `onaji/index.html` から取得）。CIで実行。
- `node tools/db-coverage.mjs` … 学年別配当表との網羅チェック。
- `node tools/onaji-candidates.mjs` … これから作れる「同じ読み」候補。
- `node tools/export-csv.mjs` … Lark/スプレッドシート用CSV。
- `./deploy.sh "メッセージ"` … コミット→push→GitHub Pages。`gh run list --workflow=validate.yml` でCI確認。

> 詳細な作業履歴は `運用ガイド.md`、仕様は `README.md` を参照。
