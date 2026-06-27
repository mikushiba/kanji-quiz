/* ツール共通ローダ
 * KANJI / wordGrade は共有モジュール shared/kanji-db.js（唯一の正データ）から読む。
 * BANK はクイズ専用なので onaji/index.html から取り出す（ゲーム処理より前だけ評価）。
 * これでDBを1か所直せば 全アプリ＋全ツールに反映される。
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, '..');
const require = createRequire(import.meta.url);

const db = require(join(ROOT, 'shared', 'kanji-db.js'));
export const KANJI = db.KANJI;
export const wordGrade = db.wordGrade;

export function loadBANK() {
  const html = readFileSync(join(ROOT, 'onaji', 'index.html'), 'utf8');
  let js = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  js = js.slice(0, js.indexOf('/* ============ ゲーム処理'));
  const ctx = { KANJI, wordGrade };
  vm.createContext(ctx);
  vm.runInContext(js + '; this.BANK = BANK;', ctx);
  return ctx.BANK;
}

// 画数クイズの筆順データ STROKES（kakusu/strokes.js）を読む
export function loadSTROKES() {
  try { return require(join(ROOT, 'kakusu', 'strokes.js')).STROKES; }
  catch (e) { return null; }
}

// 部首クイズの RADICALS（bushu/index.html の自己完結リテラル）を取り出す
export function loadRADICALS() {
  const html = readFileSync(join(ROOT, 'bushu', 'index.html'), 'utf8');
  const m = html.match(/const RADICALS = (\{[\s\S]*?\n\});/);
  if (!m) throw new Error('RADICALS が bushu/index.html に見つかりません');
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext('this.R = ' + m[1] + ';', ctx);
  return ctx.R;
}
