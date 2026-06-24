#!/usr/bin/env node
/* Lark Base へ 漢字DB / 問題 を同期する（一方向: index.html → Lark Base）
 *
 * 使い方:
 *   1) lark.config.json を用意（lark.config.sample.json を参照）
 *   2) node lark-sync.mjs
 *
 * 動作: テーブルが無ければ作成 → 不足列を作成 → 既存レコードを全削除 → 最新を一括追加。
 * 認証情報は lark.config.json（.gitignore 済み）または環境変数から読む。
 */
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

// ---- 設定読み込み ----
function loadConfig() {
  const file = join(here, 'lark.config.json');
  const cfg = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
  const get = (k, env, def) => cfg[k] ?? process.env[env] ?? def;
  const c = {
    domain: get('domain', 'LARK_DOMAIN', 'https://open.larksuite.com'),
    appId: get('appId', 'LARK_APP_ID'),
    appSecret: get('appSecret', 'LARK_APP_SECRET'),
    baseToken: get('baseToken', 'LARK_BASE_TOKEN'),
    kanjiTable: get('kanjiTable', 'LARK_KANJI_TABLE', '漢字DB'),
    questionsTable: get('questionsTable', 'LARK_QUESTIONS_TABLE', '問題'),
  };
  for (const k of ['appId', 'appSecret', 'baseToken']) {
    if (!c[k]) { console.error(`✗ 設定が足りません: ${k}（lark.config.json か 環境変数）`); process.exit(1); }
  }
  return c;
}
const C = loadConfig();
const API = C.domain.replace(/\/$/, '') + '/open-apis';

// ---- データ抽出（index.html から KANJI / BANK）----
function extractData() {
  const html = readFileSync(join(here, 'index.html'), 'utf8');
  let js = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  js = js.slice(0, js.indexOf('/* ============ ゲーム処理'));
  const s = {}; vm.createContext(s);
  vm.runInContext(js + '; this.KANJI = KANJI; this.BANK = BANK;', s);
  return { KANJI: s.KANJI, BANK: s.BANK };
}

// ---- Lark API ヘルパ ----
let TOKEN = '';
async function api(method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (json.code !== 0) throw new Error(`${method} ${path} → code ${json.code}: ${json.msg}`);
  return json.data;
}
async function getToken() {
  const data = await api('POST', '/auth/v3/tenant_access_token/internal', {
    app_id: C.appId, app_secret: C.appSecret,
  });
  TOKEN = data.tenant_access_token;
}

const base = `/bitable/v1/apps/${C.baseToken}`;

async function listTables() {
  const out = []; let pageToken;
  do {
    const q = `?page_size=100${pageToken ? `&page_token=${pageToken}` : ''}`;
    const d = await api('GET', `${base}/tables${q}`);
    out.push(...(d.items || [])); pageToken = d.has_more ? d.page_token : null;
  } while (pageToken);
  return out;
}
async function ensureTable(name, fields) {
  const tables = await listTables();
  let t = tables.find(x => x.name === name);
  if (!t) {
    const d = await api('POST', `${base}/tables`, { table: { name, fields } });
    console.log(`  ＋ テーブル作成: ${name}`);
    return d.table_id;
  }
  // 既存テーブル: 不足している列を作る
  const existing = await listFields(t.table_id);
  const have = new Set(existing.map(f => f.field_name));
  for (const f of fields) {
    if (!have.has(f.field_name)) {
      await api('POST', `${base}/tables/${t.table_id}/fields`, f);
      console.log(`  ＋ 列を追加: ${name}.${f.field_name}`);
    }
  }
  return t.table_id;
}
async function listFields(tableId) {
  const out = []; let pageToken;
  do {
    const q = `?page_size=100${pageToken ? `&page_token=${pageToken}` : ''}`;
    const d = await api('GET', `${base}/tables/${tableId}/fields${q}`);
    out.push(...(d.items || [])); pageToken = d.has_more ? d.page_token : null;
  } while (pageToken);
  return out;
}
async function allRecordIds(tableId) {
  const out = []; let pageToken;
  do {
    const q = `?page_size=500${pageToken ? `&page_token=${pageToken}` : ''}`;
    const d = await api('GET', `${base}/tables/${tableId}/records${q}`);
    out.push(...(d.items || []).map(r => r.record_id)); pageToken = d.has_more ? d.page_token : null;
  } while (pageToken);
  return out;
}
function chunk(arr, n) { const r = []; for (let i = 0; i < arr.length; i += n) r.push(arr.slice(i, i + n)); return r; }

async function replaceRecords(tableId, records) {
  const ids = await allRecordIds(tableId);
  for (const c of chunk(ids, 450)) {
    await api('POST', `${base}/tables/${tableId}/records/batch_delete`, { records: c });
  }
  for (const c of chunk(records, 400)) {
    await api('POST', `${base}/tables/${tableId}/records/batch_create`, { records: c.map(fields => ({ fields })) });
  }
  console.log(`  ↻ ${ids.length}件 削除 → ${records.length}件 追加`);
}

// ---- メイン ----
const TEXT = 1, NUMBER = 2;
async function main() {
  console.log(`Lark Base 同期: ${C.domain}  base=${C.baseToken}`);
  const { KANJI, BANK } = extractData();
  await getToken();

  // 漢字DB
  const kanjiTableId = await ensureTable(C.kanjiTable, [
    { field_name: '漢字', type: TEXT },
    { field_name: '学年', type: NUMBER },
    { field_name: '画数', type: NUMBER },
    { field_name: '音読み', type: TEXT },
    { field_name: '訓読み', type: TEXT },
  ]);
  const kanjiRecords = Object.entries(KANJI)
    .sort((a, b) => a[1].g - b[1].g || a[1].s - b[1].s)
    .map(([c, k]) => ({ 漢字: c, 学年: k.g, 画数: k.s, 音読み: k.on.join('、'), 訓読み: k.kun.join('、') }));
  await replaceRecords(kanjiTableId, kanjiRecords);

  // 問題
  const qTableId = await ensureTable(C.questionsTable, [
    { field_name: '例文', type: TEXT },
    { field_name: 'ID', type: NUMBER },
    { field_name: 'タイプ', type: TEXT },
    { field_name: '分類', type: TEXT },
    { field_name: '読み', type: TEXT },
    { field_name: '正解', type: TEXT },
    { field_name: '選択肢', type: TEXT },
    { field_name: '選択肢の意味', type: TEXT },
  ]);
  const qRecords = BANK.map((b, i) => ({
    例文: b.sentence, ID: i,
    タイプ: b.type === 'tsukai' ? '使い分け' : '同じ読み',
    分類: b.tag, 読み: b.read, 正解: b.answer,
    選択肢: b.choices.join('、'),
    選択肢の意味: b.choices.map(c => `${c}＝${b.meaning[c] || ''}`).join(' / '),
  }));
  await replaceRecords(qTableId, qRecords);

  console.log('✓ 同期完了');
}
main().catch(e => { console.error('✗ 失敗:', e.message); process.exit(1); });
