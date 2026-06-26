#!/usr/bin/env node
/* 「同じ読み」グループの候補を洗い出す。
 * DBの漢字を音読みごとにまとめ、訓読みが2字以上あって、まだ未使用の読みを表示。
 * 拡充できるグループ探しに使う。使い方: node tools/onaji-candidates.mjs
 */
import { KANJI, loadBANK } from './lib.mjs';   // 共有モジュール shared/kanji-db.js
const BANK = loadBANK();

// すでに使っている「同じ読み：XXX」のタグ
const usedTags = new Set(BANK.map(q => (q.tag || '').replace(/^.*：/, '')));
const kata2hira = str => str.replace(/[ァ-ヶ]/g, m => String.fromCharCode(m.charCodeAt(0) - 0x60));

// 音読みごとに、訓ありの字を集める
const byOn = {};
for (const [c, k] of Object.entries(KANJI)) {
  if (!k.kun.length) continue;
  for (const on of k.on) (byOn[on] = byOn[on] || []).push(c);
}

console.log('■ 訓ありが2字以上ある 音グループ（既存タグは除外＝これから作れる候補）\n');
let n = 0;
Object.entries(byOn)
  .filter(([, a]) => a.length >= 2)
  .sort((a, b) => b[1].length - a[1].length)
  .forEach(([on, a]) => {
    const hira = kata2hira(on);
    if (![...usedTags].includes(hira)) { console.log(`  ${hira}(${on}): ${a.join(' ')}`); n++; }
  });
console.log(`\n候補グループ: ${n}個（※別の音読みも含む。漢字に複数の読みがあることも学べる）`);
