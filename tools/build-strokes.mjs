/* 筆順データ生成器（kakusu/strokes.js を作る）
 * 正データ：KanjiVG（CC BY-SA 3.0, https://kanjivg.tagaini.net）。
 * 事前DL: https://github.com/KanjiVG/kanjivg/releases の kanjivg-YYYYMMDD.xml.gz を gunzip → kvg.xml
 * 実行: node build-strokes.mjs → strokes.json（全KANJIの<path d>を書き順で抽出, viewBox 0 0 109 109）。
 *   → ヘッダ(CC BY-SA表記)を付け const STROKES = {...} として kakusu/strokes.js に保存。
 * 画数は validate.mjs が DB(s) と自動照合（不一致を検知）。漢字を足したら再抽出。
 */
import { readFileSync, writeFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { KANJI } = require('/Users/mikushiba/kanji-quiz/shared/kanji-db.js');
const xml = readFileSync('kvg.xml','utf8');
// 各 <kanji id="kvg:kanji_XXXXX"> ... </kanji> ブロックを走査
const strokes = {};
const re = /<kanji id="kvg:kanji_([0-9a-f]+)"[^>]*>([\s\S]*?)<\/kanji>/g;
let m, totalPaths=0;
const want = new Set(Object.keys(KANJI).map(k=>k.codePointAt(0).toString(16).padStart(5,'0')));
while((m=re.exec(xml))){
  const code = m[1];
  if(!want.has(code)) continue;
  const ch = String.fromCodePoint(parseInt(code,16));
  const paths = [...m[2].matchAll(/<path [^>]*\bd="([^"]+)"/g)].map(x=>x[1]);
  if(paths.length){ strokes[ch] = paths; totalPaths += paths.length; }
}
const json = JSON.stringify(strokes);
writeFileSync('strokes.json', json);
console.log('対象漢字:', Object.keys(KANJI).length, ' ストローク取得:', Object.keys(strokes).length);
console.log('総ストローク:', totalPaths, ' JSONサイズ:', (json.length/1024/1024).toFixed(2)+'MB');
// 画数（DB s）と KanjiVG ストローク数の不一致をチェック
let mismatch=0, ex=[];
for(const [k,ps] of Object.entries(strokes)){ if(KANJI[k].s !== ps.length){ mismatch++; if(ex.length<10) ex.push(`${k}:DB${KANJI[k].s}/VG${ps.length}`); } }
console.log('画数不一致:', mismatch, ex.join(' '));
// 取得できなかった字
const miss = Object.keys(KANJI).filter(k=>!strokes[k]);
console.log('ストローク無し:', miss.length, miss.slice(0,20).join(''));
