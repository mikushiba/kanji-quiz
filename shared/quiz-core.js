/* =========================================================================
   共有：進捗エンジン（漢字図鑑・称号・メダル）— 全アプリ共通の育成系
   ・localStorage キー 'kanjiQuiz.v1' を全アプリで共有（localStorage はオリジン単位
     ＝ github.io/kanji-quiz 全体で1つ）。同じ store スキーマ・同じ STAGES/MEDALS を
     使うので、onaji と okurigana など複数アプリの進捗が自動で合算される。
   ・store の既存フィールドは破壊せず保持（full load → 一部更新 → full save）。
   ・shared/kanji-db.js（KANJI）より後に読み込むこと。
   使い方:  QuizCore.recordCorrect('移る'); QuizCore.bumpCorrect(); QuizCore.save();
            QuizCore.checkMedals(); QuizCore.renderBuddy({...}); 等
   ========================================================================= */
(function (global) {
  const KANJI = global.KANJI;
  const STORE_KEY = 'kanjiQuiz.v1';

  let store = {};
  function load() {
    try { store = JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { store = {}; }
    store.kanji        = store.kanji        || {};   // { 漢字: 正解回数 }
    store.medals       = store.medals       || {};   // { メダルID: true }
    store.bestCombo    = store.bestCombo    || 0;
    store.plays        = store.plays        || 0;
    store.perfect      = store.perfect      || false;
    store.perfectCount = store.perfectCount || 0;
    store.totalCorrect = store.totalCorrect || 0;
    return store;
  }
  load();
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) {} }

  /* ── 図鑑（集められる漢字＝DB全字） ── */
  const COLLECTIBLE = Object.keys(KANJI)
    .sort((a, b) => KANJI[a].g - KANJI[b].g || KANJI[a].s - KANJI[b].s || (a < b ? -1 : 1));
  const dexCount     = () => COLLECTIBLE.filter(ch => (store.kanji[ch] || 0) >= 1).length;
  const masterCount  = () => COLLECTIBLE.filter(ch => (store.kanji[ch] || 0) >= 3).length;
  const dexGradeDone = (g) => COLLECTIBLE.filter(ch => KANJI[ch].g === g).every(ch => (store.kanji[ch] || 0) >= 1);

  /* ── 記録 ── */
  function recordCorrect(word) {           // 正解した語の漢字を図鑑に（1回で図鑑入り→3回で★）
    [...String(word)].filter(c => KANJI[c]).forEach(ch => { store.kanji[ch] = (store.kanji[ch] || 0) + 1; });
  }
  function bumpCorrect(n = 1) { store.totalCorrect = (store.totalCorrect || 0) + n; }
  function noteCombo(c)       { if (c > (store.bestCombo || 0)) store.bestCombo = c; }
  function notePlay()         { store.plays = (store.plays || 0) + 1; }
  function notePerfect()      { store.perfect = true; store.perfectCount = (store.perfectCount || 0) + 1; }

  /* ── メダル（onaji と同一定義。store 共有なので合算） ── */
  const MEDALS = [
    // ── あそぶ（プレイ回数）──
    {id:'firstClear', icon:'🎫', name:'はじめの一歩',  desc:'1かい あそんだ',    test:()=> store.plays>=1},
    {id:'play5',      icon:'🎮', name:'5かい あそんだ', desc:'5かい あそんだ',    test:()=> store.plays>=5},
    {id:'play10',     icon:'🎯', name:'10かい あそんだ',desc:'10かい あそんだ',   test:()=> store.plays>=10},
    {id:'play20',     icon:'🕹️', name:'20かい あそんだ',desc:'20かい あそんだ',   test:()=> store.plays>=20},
    {id:'play30',     icon:'🎲', name:'30かい あそんだ',desc:'30かい あそんだ',   test:()=> store.plays>=30},
    {id:'play40',     icon:'🎰', name:'40かい あそんだ',desc:'40かい あそんだ',   test:()=> store.plays>=40},
    {id:'play50',     icon:'🏅', name:'50かい あそんだ',desc:'50かい あそんだ',   test:()=> store.plays>=50},
    {id:'play75',     icon:'🎖️', name:'75かい あそんだ',desc:'75かい あそんだ',   test:()=> store.plays>=75},
    {id:'play100',    icon:'💎', name:'100かい あそんだ',desc:'100かい あそんだ', test:()=> store.plays>=100},
    {id:'play150',    icon:'🏆', name:'150かい あそんだ',desc:'150かい あそんだ', test:()=> store.plays>=150},
    {id:'play200',    icon:'👑', name:'200かい あそんだ',desc:'200かい あそんだ', test:()=> store.plays>=200},
    {id:'play300',    icon:'🌌', name:'300かい あそんだ',desc:'300かい あそんだ', test:()=> store.plays>=300},
    {id:'play500',    icon:'🦄', name:'500かい あそんだ',desc:'500かい あそんだ', test:()=> store.plays>=500},
    {id:'play1000',   icon:'🌠', name:'1000かい あそんだ',desc:'1000かい あそんだ',test:()=> store.plays>=1000},
    // ── ぜんもん正かい ──
    {id:'perfect',    icon:'💯', name:'ぜんもん せいかい', desc:'1かいで ぜんぶ正かい',  test:()=> store.perfect},
    {id:'perfect3',   icon:'🥉', name:'全問正かい 3かい', desc:'ぜんもん正かいを 3かい', test:()=> store.perfectCount>=3},
    {id:'perfect5',   icon:'🥈', name:'全問正かい 5かい', desc:'ぜんもん正かいを 5かい', test:()=> store.perfectCount>=5},
    {id:'perfect10',  icon:'🥇', name:'全問正かい 10かい',desc:'ぜんもん正かいを 10かい',test:()=> store.perfectCount>=10},
    {id:'perfect15',  icon:'🎗️', name:'全問正かい 15かい',desc:'ぜんもん正かいを 15かい',test:()=> store.perfectCount>=15},
    {id:'perfect20',  icon:'🏆', name:'全問正かい 20かい',desc:'ぜんもん正かいを 20かい',test:()=> store.perfectCount>=20},
    {id:'perfect30',  icon:'👑', name:'全問正かい 30かい',desc:'ぜんもん正かいを 30かい',test:()=> store.perfectCount>=30},
    {id:'perfect50',  icon:'🎉', name:'全問正かい 50かい',desc:'ぜんもん正かいを 50かい',test:()=> store.perfectCount>=50},
    // ── 累計せいかい数 ──
    {id:'correct50',  icon:'✏️', name:'50もん 正かい',  desc:'ぜんぶで 50もん正かい',  test:()=> store.totalCorrect>=50},
    {id:'correct100', icon:'📘', name:'100もん 正かい', desc:'ぜんぶで 100もん正かい', test:()=> store.totalCorrect>=100},
    {id:'correct200', icon:'📗', name:'200もん 正かい', desc:'ぜんぶで 200もん正かい', test:()=> store.totalCorrect>=200},
    {id:'correct300', icon:'📙', name:'300もん 正かい', desc:'ぜんぶで 300もん正かい', test:()=> store.totalCorrect>=300},
    {id:'correct500', icon:'📕', name:'500もん 正かい', desc:'ぜんぶで 500もん正かい', test:()=> store.totalCorrect>=500},
    {id:'correct750', icon:'📚', name:'750もん 正かい', desc:'ぜんぶで 750もん正かい', test:()=> store.totalCorrect>=750},
    {id:'correct1000',icon:'📜', name:'1000もん 正かい',desc:'ぜんぶで 1000もん正かい',test:()=> store.totalCorrect>=1000},
    {id:'correct2000',icon:'🧾', name:'2000もん 正かい',desc:'ぜんぶで 2000もん正かい',test:()=> store.totalCorrect>=2000},
    {id:'correct3000',icon:'📰', name:'3000もん 正かい',desc:'ぜんぶで 3000もん正かい',test:()=> store.totalCorrect>=3000},
    {id:'correct5000',icon:'📊', name:'5000もん 正かい',desc:'ぜんぶで 5000もん正かい',test:()=> store.totalCorrect>=5000},
    // ── コンボ ──
    {id:'firstCombo', icon:'✌️', name:'はじめての コンボ', desc:'2れんぞく 正かい',  test:()=> store.bestCombo>=2},
    {id:'combo3',     icon:'🔥', name:'コンボ 3',  desc:'3れんぞく 正かい',  test:()=> store.bestCombo>=3},
    {id:'combo5',     icon:'🌶️', name:'コンボ 5',  desc:'5れんぞく 正かい',  test:()=> store.bestCombo>=5},
    {id:'combo7',     icon:'💥', name:'コンボ 7',  desc:'7れんぞく 正かい',  test:()=> store.bestCombo>=7},
    {id:'combo10',    icon:'⚡', name:'コンボ 10', desc:'10れんぞく 正かい', test:()=> store.bestCombo>=10},
    {id:'combo15',    icon:'☄️', name:'コンボ 15', desc:'15れんぞく 正かい', test:()=> store.bestCombo>=15},
    {id:'combo20',    icon:'🌈', name:'コンボ 20', desc:'20れんぞく 正かい', test:()=> store.bestCombo>=20},
    {id:'combo25',    icon:'🎆', name:'コンボ 25', desc:'25れんぞく 正かい', test:()=> store.bestCombo>=25},
    {id:'combo30',    icon:'💪', name:'コンボ 30', desc:'30れんぞく 正かい', test:()=> store.bestCombo>=30},
    {id:'combo40',    icon:'🐉', name:'コンボ 40', desc:'40れんぞく 正かい', test:()=> store.bestCombo>=40},
    {id:'combo50',    icon:'🦅', name:'コンボ 50', desc:'50れんぞく 正かい', test:()=> store.bestCombo>=50},
    // ── まちがい なおし ──
    {id:'comeback5',  icon:'🩹', name:'なおし はじめ', desc:'まちがいを 5もん なおした',  test:()=> store.comebacks>=5},
    {id:'comeback10', icon:'🔁', name:'まちがい なおし', desc:'まちがいを 10もん なおした', test:()=> store.comebacks>=10},
    {id:'comeback25', icon:'🔧', name:'なおし名人',     desc:'まちがいを 25もん なおした', test:()=> store.comebacks>=25},
    {id:'comeback50', icon:'🛠️', name:'なおし達人',     desc:'まちがいを 50もん なおした', test:()=> store.comebacks>=50},
    {id:'comeback75', icon:'⚙️', name:'なおし職人',     desc:'まちがいを 75もん なおした', test:()=> store.comebacks>=75},
    {id:'comeback100',icon:'🏗️', name:'なおし王',       desc:'まちがいを 100もん なおした',test:()=> store.comebacks>=100},
    // ── かん字ずかん ──
    {id:'firstDex',   icon:'📄', name:'ずかん はじめ', desc:'図かんに 1字',  test:()=> dexCount()>=1},
    {id:'dex5',       icon:'📃', name:'ずかん 5字',   desc:'図かんに 5字',  test:()=> dexCount()>=5},
    {id:'dex10',      icon:'📗', name:'ずかん 10字',  desc:'図かんに 10字',  test:()=> dexCount()>=10},
    {id:'dex25',      icon:'📒', name:'ずかん 25字',  desc:'図かんに 25字',  test:()=> dexCount()>=25},
    {id:'dex50',      icon:'📚', name:'ずかん 50字',  desc:'図かんに 50字',  test:()=> dexCount()>=50},
    {id:'dex75',      icon:'📙', name:'ずかん 75字',  desc:'図かんに 75字',  test:()=> dexCount()>=75},
    {id:'dex100',     icon:'📕', name:'ずかん 100字', desc:'図かんに 100字', test:()=> dexCount()>=100},
    {id:'dex125',     icon:'📔', name:'ずかん 125字', desc:'図かんに 125字', test:()=> dexCount()>=125},
    {id:'dex150',     icon:'📓', name:'ずかん 150字', desc:'図かんに 150字', test:()=> dexCount()>=150},
    {id:'dex175',     icon:'🗞️', name:'ずかん 175字', desc:'図かんに 175字', test:()=> dexCount()>=175},
    {id:'dex200',     icon:'📖', name:'ずかん 200字', desc:'図かんに 200字', test:()=> dexCount()>=200},
    {id:'dexAll',     icon:'👑', name:'ずかん コンプリート', desc:'ぜんぶ 図かんに', test:()=> dexCount()>=COLLECTIBLE.length},
    // ── 学年ずかん コンプ ──
    {id:'dexG1',      icon:'🟢', name:'1年 ずかん コンプ', desc:'1年の かん字を ぜんぶ', test:()=> dexGradeDone(1)},
    {id:'dexG2',      icon:'🔵', name:'2年 ずかん コンプ', desc:'2年の かん字を ぜんぶ', test:()=> dexGradeDone(2)},
    {id:'dexG3',      icon:'🟣', name:'3年 ずかん コンプ', desc:'3年の かん字を ぜんぶ', test:()=> dexGradeDone(3)},
    // ── マスター（★）──
    {id:'firstStar',  icon:'⭐', name:'はじめての ★',  desc:'★を 1字',   test:()=> masterCount()>=1},
    {id:'master5',    icon:'✴️', name:'マスター 5字',  desc:'★を 5字',   test:()=> masterCount()>=5},
    {id:'master10',   icon:'🌟', name:'マスター 10字', desc:'★を 10字',  test:()=> masterCount()>=10},
    {id:'master25',   icon:'✨', name:'マスター 25字', desc:'★を 25字',  test:()=> masterCount()>=25},
    {id:'master50',   icon:'💫', name:'マスター 50字', desc:'★を 50字',  test:()=> masterCount()>=50},
    {id:'master75',   icon:'🌠', name:'マスター 75字', desc:'★を 75字',  test:()=> masterCount()>=75},
    {id:'master100',  icon:'🪐', name:'マスター 100字',desc:'★を 100字', test:()=> masterCount()>=100},
    {id:'master150',  icon:'☀️', name:'マスター 150字',desc:'★を 150字', test:()=> masterCount()>=150},
    {id:'masterAll',  icon:'🏵️', name:'ぜんぶ マスター', desc:'ぜんぶ ★に', test:()=> masterCount()>=COLLECTIBLE.length},
    {id:'grandMaster',icon:'🏆', name:'グランドマスター', desc:'図かん＆★を ぜんぶ', test:()=> dexCount()>=COLLECTIBLE.length && masterCount()>=COLLECTIBLE.length},
    // ── デイリー（連続日数）──
    {id:'daily2',     icon:'🌱', name:'2日 れんぞく',  desc:'チャレンジ 2日れんぞく',  test:()=> (store.daily?.bestStreak||0)>=2},
    {id:'daily3',     icon:'📅', name:'3日 れんぞく',  desc:'チャレンジ 3日れんぞく',  test:()=> (store.daily?.bestStreak||0)>=3},
    {id:'daily5',     icon:'🗓️', name:'5日 れんぞく',  desc:'チャレンジ 5日れんぞく',  test:()=> (store.daily?.bestStreak||0)>=5},
    {id:'daily7',     icon:'📆', name:'7日 れんぞく',  desc:'チャレンジ 7日れんぞく',  test:()=> (store.daily?.bestStreak||0)>=7},
    {id:'daily10',    icon:'🎍', name:'10日 れんぞく', desc:'チャレンジ 10日れんぞく', test:()=> (store.daily?.bestStreak||0)>=10},
    {id:'daily14',    icon:'🎋', name:'14日 れんぞく', desc:'チャレンジ 14日れんぞく', test:()=> (store.daily?.bestStreak||0)>=14},
    {id:'daily21',    icon:'🎏', name:'21日 れんぞく', desc:'チャレンジ 21日れんぞく', test:()=> (store.daily?.bestStreak||0)>=21},
    {id:'daily30',    icon:'🏮', name:'30日 れんぞく', desc:'チャレンジ 30日れんぞく', test:()=> (store.daily?.bestStreak||0)>=30},
    {id:'daily50',    icon:'🎐', name:'50日 れんぞく', desc:'チャレンジ 50日れんぞく', test:()=> (store.daily?.bestStreak||0)>=50},
    {id:'daily100',   icon:'🎇', name:'100日 れんぞく',desc:'チャレンジ 100日れんぞく',test:()=> (store.daily?.bestStreak||0)>=100},
    // ── デイリー（のべ回数）──
    {id:'dailyT1',    icon:'🔔', name:'デイリー はじめ', desc:'デイリーを 1かい',   test:()=> store.dailyTotal>=1},
    {id:'dailyT5',    icon:'🪧', name:'デイリー 5かい',  desc:'デイリーを 5かい',   test:()=> store.dailyTotal>=5},
    {id:'dailyT10',   icon:'📌', name:'デイリー 10かい', desc:'デイリーを 10かい',  test:()=> store.dailyTotal>=10},
    {id:'dailyT30',   icon:'📍', name:'デイリー 30かい', desc:'デイリーを 30かい',  test:()=> store.dailyTotal>=30},
    {id:'dailyT50',   icon:'🧭', name:'デイリー 50かい', desc:'デイリーを 50かい',  test:()=> store.dailyTotal>=50},
    {id:'dailyT100',  icon:'🗺️', name:'デイリー 100かい',desc:'デイリーを 100かい', test:()=> store.dailyTotal>=100},
    // ── さらに 上の チャレンジ ──
    {id:'play250',    icon:'🛸', name:'250かい あそんだ',desc:'250かい あそんだ', test:()=> store.plays>=250},
    {id:'perfect40',  icon:'🎀', name:'全問正かい 40かい',desc:'ぜんもん正かいを 40かい',test:()=> store.perfectCount>=40},
    {id:'correct400', icon:'📑', name:'400もん 正かい', desc:'ぜんぶで 400もん正かい', test:()=> store.totalCorrect>=400},
    {id:'correct1500',icon:'🗂️', name:'1500もん 正かい',desc:'ぜんぶで 1500もん正かい',test:()=> store.totalCorrect>=1500},
    {id:'combo35',    icon:'🌪️', name:'コンボ 35', desc:'35れんぞく 正かい', test:()=> store.bestCombo>=35},
    {id:'dex15',      icon:'🧧', name:'ずかん 15字', desc:'図かんに 15字', test:()=> dexCount()>=15},
    {id:'master125',  icon:'💠', name:'マスター 125字',desc:'★を 125字', test:()=> masterCount()>=125},
    {id:'comeback15', icon:'🩺', name:'なおし 15もん', desc:'まちがいを 15もん なおした', test:()=> store.comebacks>=15},
    {id:'dailyT75',   icon:'🛰️', name:'デイリー 75かい',desc:'デイリーを 75かい', test:()=> store.dailyTotal>=75},
    // ── 解放・とくべつ ──
    {id:'unlock3',    icon:'🔓', name:'3年生 かいきん', desc:'1・2年を ぜんぶ 図かんに', test:()=> !!store.unlocked3},
  ];
  function checkMedals() {
    const newly = [];
    MEDALS.forEach(m => {
      try { if (!store.medals[m.id] && m.test()) { store.medals[m.id] = true; newly.push(m); } }
      catch (e) {}
    });
    if (newly.length) save();
    return newly;
  }

  /* ── 称号（累計正解数で育つ。onaji と同一） ── */
  const STAGES = [
    {need:0,     icon:'🥚',   title:'漢字みならい'},
    {need:30,    icon:'🐣',   title:'漢字かけだし'},
    {need:80,    icon:'🐥',   title:'漢字がんばりや'},
    {need:150,   icon:'🐦',   title:'漢字じょうず'},
    {need:300,   icon:'🦜',   title:'漢字もの知り'},
    {need:500,   icon:'🦉',   title:'漢字はかせ'},
    {need:800,   icon:'🦅',   title:'漢字せんせい'},
    {need:1200,  icon:'🐺',   title:'漢字名人'},
    {need:1800,  icon:'🦁',   title:'漢字達人'},
    {need:2600,  icon:'🐲',   title:'漢字マスター'},
    {need:3800,  icon:'🐉',   title:'漢字グランドマスター'},
    {need:5500,  icon:'👑',   title:'漢字キング'},
    {need:8000,  icon:'🌟',   title:'漢字チャンピオン'},
    {need:11500, icon:'☄️',   title:'漢字レジェンド'},
    {need:16000, icon:'🧙',   title:'漢字仙人'},
    {need:22000, icon:'🐉✨', title:'漢字の神さま'},
    {need:30000, icon:'🌌',   title:'漢字うちゅういち'},
  ];
  function rankStage(n) { let s = 0; STAGES.forEach((e, i) => { if (n >= e.need) s = i; }); return s; }

  /* ── 描画ヘルパー（共有CSSの .dcard / .medal / .buddy を使う） ── */
  function renderBuddy(els) {   // els = {icon,name,coin,bar,next}（DOM要素）
    const tc = store.totalCorrect || 0, s = rankStage(tc), cur = STAGES[s], nxt = STAGES[s + 1];
    if (els.icon) els.icon.textContent = cur.icon;
    if (els.name) els.name.textContent = cur.title;
    if (els.coin) els.coin.textContent = `これまで せいかい ${tc}問`;
    if (nxt) {
      const span = nxt.need - cur.need;
      const prog = Math.max(0, Math.min(100, Math.floor((tc - cur.need) / span * 100)));
      if (els.bar)  els.bar.style.width = prog + '%';
      if (els.next) els.next.textContent = `あと ${nxt.need - tc}問 正解で「${nxt.title}」`;
    } else {
      if (els.bar)  els.bar.style.width = '100%';
      if (els.next) els.next.textContent = 'さいこうの 称号に なった！🎉';
    }
  }
  function dexHead() { return `${dexCount()} / ${COLLECTIBLE.length} 字（★${masterCount()}）`; }
  function dexGridHTML() {
    return COLLECTIBLE.map(ch => {
      const k = KANJI[ch], c = store.kanji[ch] || 0;
      if (c >= 1) {
        const master = c >= 3;
        const on  = k.on.length  ? '音 ' + k.on.join('・')  : '';
        const kun = k.kun.length ? '訓 ' + k.kun.join('・') : '';
        return `<div class="dcard${master ? ' master' : ''}"><div class="k">${ch}</div>`
          + `<div class="star">${master ? '★' : '☆'}</div>`
          + `<div class="info">${k.s}画${(on || kun) ? '<br>' : ''}${on}${on && kun ? '<br>' : ''}${kun}</div></div>`;
      }
      return `<div class="dcard locked"><div class="k">？</div><div class="info">みつけよう</div></div>`;
    }).join('');
  }
  function medalsHead() { return `${MEDALS.filter(m => store.medals[m.id]).length} / ${MEDALS.length}`; }
  function medalsGridHTML() {
    return MEDALS.map(m => {
      const has = !!store.medals[m.id];
      return `<div class="medal${has ? '' : ' locked'}"><div class="mi">${has ? m.icon : '🔒'}</div>`
        + `<div class="mn">${m.name}</div><div class="md">${m.desc}</div></div>`;
    }).join('');
  }

  /* ── セーブ／読み込み（共有 store 全体＝全アプリの進捗をまとめて入出力） ── */
  function exportSave(filename) {
    const blob = new Blob([JSON.stringify(store)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename || 'かん字クイズ-きろく.json';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }
  function importSave(file, onOk) {
    const r = new FileReader();
    r.onload = () => {
      try {
        const obj = JSON.parse(r.result);
        if (!obj || typeof obj !== 'object' || !obj.kanji) throw 0;
        if (!confirm('いまの きろくを、よみこんだ きろくに 入れかえます。よろしいですか？')) return;
        localStorage.setItem(STORE_KEY, JSON.stringify(obj));
        if (onOk) onOk(); else location.reload();
      } catch (e) { alert('この ファイルは よみこめませんでした。'); }
    };
    r.readAsText(file);
  }

  global.QuizCore = {
    get store() { return store; }, reload: load, save,
    COLLECTIBLE, dexCount, masterCount, dexGradeDone,
    recordCorrect, bumpCorrect, noteCombo, notePlay, notePerfect,
    MEDALS, checkMedals, STAGES, rankStage,
    renderBuddy, dexHead, dexGridHTML, medalsHead, medalsGridHTML,
    exportSave, importSave,
  };
})(window);
