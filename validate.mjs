#!/usr/bin/env node
/* 問題データの自動検証
 * index.html から KANJI / BANK を取り出し、次を確認する：
 *  - answer が choices に含まれる
 *  - choices の漢字がすべて KANJI DB にある
 *  - choices すべてに meaning がある
 *  - sentence に空らん @@ がある／read がある／type が正しい
 * 問題があれば終了コード 1（GitHub Actions が失敗を検知）。
 *
 * 使い方: node validate.mjs
 */
import { KANJI, loadBANK } from './tools/lib.mjs';

// KANJI は共有モジュール shared/kanji-db.js（唯一の正データ）、BANK は index.html から
const BANK = loadBANK();

const kanjiOf = w => [...w].filter(c => /\p{Script=Han}/u.test(c));
const problems = [];

BANK.forEach((q, i) => {
  const where = `#${i}（${q.tag || '?'}）`;
  if (!q.type || !['tsukai', 'onaji'].includes(q.type)) problems.push(`${where}: type が不正: ${q.type}`);
  if (!q.sentence || !q.sentence.includes('@@')) problems.push(`${where}: sentence に @@ が無い`);
  if (!q.read) problems.push(`${where}: read が無い`);
  if (!Array.isArray(q.choices) || q.choices.length < 2) problems.push(`${where}: choices が不正`);
  if (!q.choices?.includes(q.answer)) problems.push(`${where}: answer「${q.answer}」が choices に無い`);
  // 答えの漢字が 例文に出ていないか（答えがバレる）
  const rest = (q.sentence || '').split('@@').join('');
  kanjiOf(q.answer || '').forEach(ch => {
    if (rest.includes(ch)) problems.push(`${where}: 答え「${q.answer}」の漢字「${ch}」が例文に出ている（答えがバレる）`);
  });
  (q.choices || []).forEach(c => {
    kanjiOf(c).forEach(ch => { if (!KANJI[ch]) problems.push(`${where}: 漢字「${ch}」が KANJI DB に無い`); });
    if (!q.meaning?.[c]) problems.push(`${where}: 「${c}」の meaning が無い`);
  });
});

// KANJI DB 自体の形をチェック
Object.entries(KANJI).forEach(([ch, k]) => {
  if (![1, 2, 3, 4, 5, 6].includes(k.g)) problems.push(`KANJI「${ch}」: g(学年) が不正: ${k.g}`);
  if (typeof k.s !== 'number') problems.push(`KANJI「${ch}」: s(画数) が数値でない`);
  if (!Array.isArray(k.on) || !Array.isArray(k.kun)) problems.push(`KANJI「${ch}」: on/kun が配列でない`);
});

const tsukai = BANK.filter(q => q.type === 'tsukai').length;
const onaji = BANK.filter(q => q.type === 'onaji').length;
console.log(`問題数: ${BANK.length}（使い分け ${tsukai} / 同じ読み ${onaji}）　KANJI: ${Object.keys(KANJI).length}字`);

if (problems.length) {
  console.error(`\n✗ ${problems.length}件の問題:\n` + problems.join('\n'));
  process.exit(1);
}
console.log('✓ すべてのチェックに合格しました');
