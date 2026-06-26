#!/usr/bin/env node
/* 漢字DB / 問題を CSV（UTF-8 BOM付き）に書き出す。Lark Base や スプレッドシート取り込み用。
 * 出力: export/kanji.csv, export/questions.csv
 * 使い方: node tools/export-csv.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { KANJI, loadBANK } from './lib.mjs';   // 共有モジュール shared/kanji-db.js

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const BANK = loadBANK();

const q = v => { v = (v == null ? '' : String(v)); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
const csv = rows => '﻿' + rows.map(r => r.map(q).join(',')).join('\r\n') + '\r\n';

mkdirSync(join(root, 'export'), { recursive: true });

const kr = [['漢字', '学年', '画数', '音読み', '訓読み']];
Object.entries(KANJI).sort((a, b) => a[1].g - b[1].g || a[1].s - b[1].s)
  .forEach(([c, k]) => kr.push([c, k.g, k.s, k.on.join('、'), k.kun.join('、')]));
writeFileSync(join(root, 'export', 'kanji.csv'), csv(kr));

const qr = [['ID', 'タイプ', '分類', '例文', '読み', '正解', '選択肢', '選択肢の意味']];
BANK.forEach((b, i) => qr.push([
  i, b.type === 'tsukai' ? '使い分け' : '同じ読み', b.tag, b.sentence, b.read, b.answer,
  b.choices.join('、'), b.choices.map(c => `${c}＝${b.meaning[c] || ''}`).join(' / '),
]));
writeFileSync(join(root, 'export', 'questions.csv'), csv(qr));

console.log(`✓ export/kanji.csv (${kr.length - 1}行) / export/questions.csv (${qr.length - 1}行)`);
